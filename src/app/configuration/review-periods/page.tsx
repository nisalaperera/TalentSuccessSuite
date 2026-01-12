
'use client';

import { useReducer, useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { configReducer, initialState } from '@/lib/state';
import { useToast } from '@/hooks/use-toast';
import type { ReviewPeriod as ReviewPeriodType } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/app/components/config-flow/shared/date-picker';
import { PlusCircle } from 'lucide-react';

function ReviewPeriodsContent() {
    const router = useRouter();
    const [state, dispatch] = useReducer(configReducer, initialState);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<ReviewPeriodType | null>(null);
    const { toast } = useToast();
    
    // Form state
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();

    useEffect(() => {
        if (editingPeriod) {
            setName(editingPeriod.name);
            setStartDate(editingPeriod.startDate);
            setEndDate(editingPeriod.endDate);
        } else {
            setName('');
            setStartDate(undefined);
            setEndDate(undefined);
        }
    }, [editingPeriod]);

    const handleOpenDialog = (period: ReviewPeriodType | null = null) => {
        setEditingPeriod(period);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditingPeriod(null);
        setIsDialogOpen(false);
    };

    const handleSave = () => {
        if (!name || !startDate || !endDate) {
          toast({ title: 'Missing Information', description: 'Please fill out all fields.', variant: 'destructive' });
          return;
        }
        if (endDate < startDate) {
          toast({ title: 'Invalid Dates', description: 'End date cannot be before start date.', variant: 'destructive' });
          return;
        }

        if (editingPeriod) {
          const updatedPeriod = { ...editingPeriod, name, startDate, endDate };
          dispatch({ type: 'UPDATE_REVIEW_PERIOD', payload: updatedPeriod });
          toast({ title: 'Success', description: `Review period "${name}" has been updated.` });
        } else {
          const newPeriod = { id: `rp-${Date.now()}`, name, startDate, endDate, status: 'Active' as const };
          dispatch({ type: 'ADD_REVIEW_PERIOD', payload: newPeriod });
          toast({ title: 'Success', description: `Review period "${name}" has been created.` });
        }
        handleCloseDialog();
    };

    const isPeriodInUse = (id: string) => {
        return state.goalPlans.some(gp => gp.reviewPeriodId === id) || state.performanceDocuments.some(pd => pd.reviewPeriodId === id);
    };

    const handleDelete = (id: string) => {
        dispatch({ type: 'DELETE_REVIEW_PERIOD', payload: id });
        toast({ title: 'Success', description: 'Review period has been deleted.' });
    };

    const handleToggleStatus = (period: ReviewPeriodType) => {
        const newStatus = period.status === 'Active' ? 'Inactive' : 'Active';
        dispatch({ type: 'UPDATE_REVIEW_PERIOD', payload: { ...period, status: newStatus } });
        toast({ title: 'Success', description: `Period status set to ${newStatus}.` });
    };

    const handleManageGoalPlans = (period: ReviewPeriodType) => {
        router.push(`/configuration/goal-plans?reviewPeriodId=${period.id}`);
    }

    const handleManageCycles = (period: ReviewPeriodType) => {
        router.push(`/configuration/performance-cycles?reviewPeriodId=${period.id}`);
    }

    const tableColumns = columns({ 
        onEdit: handleOpenDialog, 
        onDelete: handleDelete, 
        onToggleStatus: handleToggleStatus, 
        isPeriodInUse,
        onManageGoalPlans: handleManageGoalPlans,
        onManageCycles: handleManageCycles,
    });

    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Review Periods"
                description="Manage all your review periods here."
                onAddNew={() => handleOpenDialog()}
            />
            <DataTable columns={tableColumns} data={state.reviewPeriods} />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline">{editingPeriod ? 'Edit' : 'Create New'} Review Period</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 gap-4">
                    <Input placeholder="e.g., FY 2024-25 Mid-Year" value={name} onChange={(e) => setName(e.target.value)} />
                    <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />
                    <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSave}>{editingPeriod ? 'Save Changes' : 'Create'}</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function ReviewPeriodsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ReviewPeriodsContent />
        </Suspense>
    )
}
