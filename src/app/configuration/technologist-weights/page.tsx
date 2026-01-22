
'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useToast } from '@/hooks/use-toast';
import type { TechnologistWeight } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function TechnologistWeightsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const weightsQuery = useMemoFirebase(() => collection(firestore, 'technologist_weights'), [firestore]);
    const { data: weightConfigs } = useCollection<TechnologistWeight>(weightsQuery);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<TechnologistWeight | null>(null);

    // Form state
    const [workGoalWeight, setWorkGoalWeight] = useState<number>(0);
    const [homeGoalWeight, setHomeGoalWeight] = useState<number>(0);
    const [primaryAppraiser, setPrimaryAppraiser] = useState<'Work Manager' | 'Home Manager' | undefined>();
    const [secondaryAppraiser, setSecondaryAppraiser] = useState<'Work Manager' | 'Home Manager' | undefined>();

    useEffect(() => {
        if (editingConfig) {
            setWorkGoalWeight(editingConfig.workGoalWeight);
            setHomeGoalWeight(editingConfig.homeGoalWeight);
            setPrimaryAppraiser(editingConfig.primaryAppraiser);
            setSecondaryAppraiser(editingConfig.secondaryAppraiser);
        }
    }, [editingConfig]);

    const handleOpenDialog = (config: TechnologistWeight) => {
        setEditingConfig(config);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditingConfig(null);
        setIsDialogOpen(false);
    };

    const handleSave = () => {
        if (!editingConfig) return;
        
        if (workGoalWeight + homeGoalWeight !== 100) {
            toast({
                title: "Validation Error",
                description: "Work Goal Weight and Home Goal Weight must add up to 100.",
                variant: "destructive"
            });
            return;
        }

        if (!primaryAppraiser || !secondaryAppraiser) {
            toast({
                title: "Validation Error",
                description: "Please select both Primary and Secondary appraisers.",
                variant: "destructive"
            });
            return;
        }

        const updatedData = {
            workGoalWeight,
            homeGoalWeight,
            primaryAppraiser,
            secondaryAppraiser
        };

        const docRef = doc(firestore, 'technologist_weights', editingConfig.id);
        updateDocumentNonBlocking(docRef, updatedData);
        toast({ title: "Success", description: `Configuration for ${editingConfig.technologist_type} updated.`});
        handleCloseDialog();
    };
    
    const tableColumns = useMemo(() => columns({ onEdit: handleOpenDialog }), []);

    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Technologist Weight Distribution"
                description="Manage weight distribution and appraiser roles by technologist type."
                showAddNew={false}
            />
            <DataTable 
              columns={tableColumns} 
              data={weightConfigs ?? []}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-headline">Edit Configuration for {editingConfig?.technologist_type}</DialogTitle>
                        <DialogDescription>
                           Adjust the goal weights and appraiser roles for this technologist type.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="work-weight">Work Goal Weight (%)</Label>
                                <Input id="work-weight" type="number" value={workGoalWeight} onChange={e => setWorkGoalWeight(e.target.valueAsNumber)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="home-weight">Home Goal Weight (%)</Label>
                                <Input id="home-weight" type="number" value={homeGoalWeight} onChange={e => setHomeGoalWeight(e.target.valueAsNumber)} />
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Primary Appraiser</Label>
                                <Select onValueChange={(v: 'Work Manager' | 'Home Manager') => setPrimaryAppraiser(v)} value={primaryAppraiser}>
                                    <SelectTrigger><SelectValue placeholder="Select a role..."/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Work Manager">Work Manager</SelectItem>
                                        <SelectItem value="Home Manager">Home Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Secondary Appraiser</Label>
                                <Select onValueChange={(v: 'Work Manager' | 'Home Manager') => setSecondaryAppraiser(v)} value={secondaryAppraiser}>
                                    <SelectTrigger><SelectValue placeholder="Select a role..."/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Work Manager">Work Manager</SelectItem>
                                        <SelectItem value="Home Manager">Home Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
