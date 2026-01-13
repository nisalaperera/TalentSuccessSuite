
'use client';

import { useReducer, useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useToast } from '@/hooks/use-toast';
import type { GoalPlan as GoalPlanType, PerformanceCycle } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DocumentData } from 'firebase/firestore';


function GoalPlansContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();

    const performanceCyclesQuery = useMemoFirebase(() => collection(firestore, 'performance_cycles'), [firestore]);
    const { data: performanceCycles } = useCollection<PerformanceCycle>(performanceCyclesQuery);

    const goalPlansQuery = useMemoFirebase(() => collection(firestore, 'goal_plans'), [firestore]);
    const { data: goalPlans } = useCollection<GoalPlanType>(goalPlansQuery);

    const performanceDocumentsQuery = useMemoFirebase(() => collection(firestore, 'performance_documents'), [firestore]);
    const { data: performanceDocuments } = useCollection<DocumentData>(performanceDocumentsQuery);


    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<GoalPlanType | null>(null);
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState('');
    const [performanceCycleId, setPerformanceCycleId] = useState('');
    
    const filterPerformanceCycle = searchParams.get('performanceCycleId') || '';

    useEffect(() => {
        if (editingPlan) {
            setName(editingPlan.name);
            setPerformanceCycleId(editingPlan.performanceCycleId);
        } else {
            setName('');
            setPerformanceCycleId(filterPerformanceCycle || '');
        }
    }, [editingPlan, filterPerformanceCycle]);
    

    const handleOpenDialog = (plan: GoalPlanType | null = null) => {
        setEditingPlan(plan);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditingPlan(null);
        setIsDialogOpen(false);
    };

    const handleSave = () => {
        if (!name || !performanceCycleId) {
            toast({ title: 'Missing Information', description: 'Please provide a name and select a performance cycle.', variant: 'destructive' });
            return;
        }

        const planData = {
            name,
            performanceCycleId,
            status: editingPlan?.status || 'Active'
        }

        if (editingPlan) {
            const docRef = doc(firestore, 'goal_plans', editingPlan.id);
            updateDocumentNonBlocking(docRef, planData);
            toast({ title: 'Success', description: `Goal plan "${name}" updated.` });
        } else {
            const collRef = collection(firestore, 'goal_plans');
            addDocumentNonBlocking(collRef, planData);
            toast({ title: 'Success', description: `Goal plan "${name}" created.` });
        }
        handleCloseDialog();
    };

    const isPlanInUse = (id: string) => {
        return (performanceDocuments || []).some(pd => pd.goalPlanId === id);
    };

    const handleDelete = (id: string) => {
        const docRef = doc(firestore, 'goal_plans', id);
        deleteDocumentNonBlocking(docRef);
        toast({ title: 'Success', description: 'Goal plan deleted.' });
    };

    const handleToggleStatus = (plan: GoalPlanType) => {
        const newStatus = plan.status === 'Active' ? 'Inactive' : 'Active';
        const docRef = doc(firestore, 'goal_plans', plan.id);
        updateDocumentNonBlocking(docRef, { status: newStatus });
        toast({ title: 'Success', description: `Plan status set to ${newStatus}.` });
    };
    
    const getPerformanceCycleName = (id: string) => performanceCycles?.find(p => p.id === id)?.name || 'N/A';
    
    const tableColumns = useMemo(() => columns({ onEdit: handleOpenDialog, onDelete: handleDelete, onToggleStatus: handleToggleStatus, isPlanInUse, getPerformanceCycleName }), [performanceCycles, performanceDocuments]);

    const filteredData = useMemo(() => {
        if (!goalPlans) return [];
        if (!filterPerformanceCycle) return goalPlans;
        return goalPlans.filter(plan => plan.performanceCycleId === filterPerformanceCycle);
    }, [filterPerformanceCycle, goalPlans]);

    const handleClearFilter = () => {
        router.push('/configuration/goal-plans');
    };

    const toolbarContent = useMemo(() => {
        if (!filterPerformanceCycle) return null;

        const cycleName = getPerformanceCycleName(filterPerformanceCycle);
        return (
            <Badge variant="secondary" className="flex items-center gap-2">
                Performance Cycle: {cycleName}
                <button onClick={handleClearFilter} className="rounded-full hover:bg-muted-foreground/20">
                    <X className="h-3 w-3"/>
                </button>
            </Badge>
        );
    }, [filterPerformanceCycle, performanceCycles]);


    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Goal Plans"
                description="Manage all your goal plans here."
                onAddNew={() => handleOpenDialog()}
            />
            <DataTable 
              columns={tableColumns} 
              data={filteredData}
              toolbarContent={toolbarContent}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-headline">{editingPlan ? 'Edit' : 'Create New'} Goal Plan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input placeholder="e.g., FY26 Mid-Annual Goal Plan" value={name} onChange={(e) => setName(e.target.value)} />
                        <Select onValueChange={setPerformanceCycleId} value={performanceCycleId}>
                            <SelectTrigger><SelectValue placeholder="Select Performance Cycle"/></SelectTrigger>
                            <SelectContent>
                                {(performanceCycles || []).filter(p => p.status === 'Active').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSave}>{editingPlan ? 'Save Changes' : 'Create'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function GoalPlansPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GoalPlansContent />
        </Suspense>
    )
}
