
'use client';

import { useReducer, useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { configReducer, initialState } from '@/lib/state';
import { useToast } from '@/hooks/use-toast';
import type { PerformanceCycle } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { DatePicker } from '@/app/components/config-flow/shared/date-picker';

function PerformanceCyclesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [state, dispatch] = useReducer(configReducer, initialState);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCycle, setEditingCycle] = useState<PerformanceCycle | null>(null);
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState('');
    const [reviewPeriodId, setReviewPeriodId] = useState('');
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    
    const filterReviewPeriod = searchParams.get('reviewPeriodId') || '';

    useEffect(() => {
        if (editingCycle) {
            setName(editingCycle.name);
            setReviewPeriodId(editingCycle.reviewPeriodId);
            setStartDate(editingCycle.startDate);
            setEndDate(editingCycle.endDate);
        } else {
            setName('');
            setReviewPeriodId(filterReviewPeriod || '');
            setStartDate(undefined);
            setEndDate(undefined);
        }
    }, [editingCycle, filterReviewPeriod]);
    

    const handleOpenDialog = (cycle: PerformanceCycle | null = null) => {
        setEditingCycle(cycle);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditingCycle(null);
        setIsDialogOpen(false);
    };

    const handleSave = () => {
        if (!name || !reviewPeriodId || !startDate || !endDate) {
            toast({ title: 'Missing Information', description: 'Please fill out all fields.', variant: 'destructive' });
            return;
        }

        const parentReviewPeriod = state.reviewPeriods.find(p => p.id === reviewPeriodId);
        if (!parentReviewPeriod) {
            toast({ title: 'Invalid Review Period', description: 'The selected review period could not be found.', variant: 'destructive' });
            return;
        }

        if (startDate < parentReviewPeriod.startDate || endDate > parentReviewPeriod.endDate) {
            toast({ title: 'Invalid Dates', description: 'Cycle dates must be within the parent review period.', variant: 'destructive' });
            return;
        }
        
        if (endDate < startDate) {
            toast({ title: 'Invalid Dates', description: 'End date cannot be before start date.', variant: 'destructive' });
            return;
        }
        
        const overlappingCycle = state.performanceCycles.find(cycle => {
            if (cycle.reviewPeriodId !== reviewPeriodId) return false; // Only check cycles in the same review period
            if (editingCycle && cycle.id === editingCycle.id) return false; // Don't check against the cycle being edited
            // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
            return startDate <= cycle.endDate && endDate >= cycle.startDate;
        });

        if (overlappingCycle) {
            toast({ title: 'Overlapping Dates', description: `Dates overlap with existing cycle: "${overlappingCycle.name}".`, variant: 'destructive' });
            return;
        }


        if (editingCycle) {
            const updatedCycle: PerformanceCycle = { ...editingCycle, name, reviewPeriodId, startDate, endDate };
            dispatch({ type: 'UPDATE_PERFORMANCE_CYCLE', payload: updatedCycle });
            toast({ title: 'Success', description: `Performance cycle "${name}" updated.` });
        } else {
            const newCycle: PerformanceCycle = { id: `pc-${Date.now()}`, name, reviewPeriodId, startDate, endDate, status: 'Active' };
            dispatch({ type: 'ADD_PERFORMANCE_CYCLE', payload: newCycle });
            toast({ title: 'Success', description: `Performance cycle "${name}" created.` });
        }
        handleCloseDialog();
    };

    const handleDelete = (id: string) => {
        dispatch({ type: 'DELETE_PERFORMANCE_CYCLE', payload: id });
        toast({ title: 'Success', description: 'Performance cycle deleted.' });
    };

    const handleToggleStatus = (cycle: PerformanceCycle) => {
        const newStatus = cycle.status === 'Active' ? 'Inactive' : 'Active';
        dispatch({ type: 'UPDATE_PERFORMANCE_CYCLE', payload: { ...cycle, status: newStatus } });
        toast({ title: 'Success', description: `Cycle status set to ${newStatus}.` });
    };
    
    const getReviewPeriodName = (id: string) => state.reviewPeriods.find(p => p.id === id)?.name || 'N/A';
    
    const tableColumns = useMemo(() => columns({ onEdit: handleOpenDialog, onDelete: handleDelete, onToggleStatus: handleToggleStatus, getReviewPeriodName }), [state.reviewPeriods]);

    const filteredData = useMemo(() => {
        if (!filterReviewPeriod) return state.performanceCycles;
        return state.performanceCycles.filter(cycle => cycle.reviewPeriodId === filterReviewPeriod);
    }, [filterReviewPeriod, state.performanceCycles]);

    const handleClearFilter = () => {
        router.push('/configuration/performance-cycles');
    };

    const toolbarContent = useMemo(() => {
        if (!filterReviewPeriod) return null;

        const periodName = getReviewPeriodName(filterReviewPeriod);
        return (
            <Badge variant="secondary" className="flex items-center gap-2">
                Review Period: {periodName}
                <button onClick={handleClearFilter} className="rounded-full hover:bg-muted-foreground/20">
                    <X className="h-3 w-3"/>
                </button>
            </Badge>
        );
    }, [filterReviewPeriod]);


    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Performance Cycles"
                description="Manage all your performance cycles here."
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
                        <DialogTitle className="font-headline">{editingCycle ? 'Edit' : 'Create New'} Performance Cycle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input placeholder="e.g., Q1 2025 Check-in" value={name} onChange={(e) => setName(e.target.value)} />
                        <Select onValueChange={setReviewPeriodId} value={reviewPeriodId}>
                            <SelectTrigger><SelectValue placeholder="Select Review Period"/></SelectTrigger>
                            <SelectContent>
                                {state.reviewPeriods.filter(p => p.status === 'Active').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />
                        <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSave}>{editingCycle ? 'Save Changes' : 'Create'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function PerformanceCyclesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PerformanceCyclesContent />
        </Suspense>
    )
}
