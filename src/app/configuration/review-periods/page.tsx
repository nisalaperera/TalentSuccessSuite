
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useToast } from '@/hooks/use-toast';
import type { ReviewPeriod as ReviewPeriodType } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/app/components/config-flow/shared/date-picker';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DocumentData } from 'firebase/firestore';

function ReviewPeriodsContent() {
    const router = useRouter();
    const firestore = useFirestore();

    const reviewPeriodsQuery = useMemoFirebase(() => collection(firestore, 'review_periods'), [firestore]);
    const { data: reviewPeriods, isLoading: isLoadingReviewPeriods } = useCollection<ReviewPeriodType>(reviewPeriodsQuery);
    
    const performanceCyclesQuery = useMemoFirebase(() => collection(firestore, 'performance_cycles'), [firestore]);
    const { data: performanceCycles } = useCollection<DocumentData>(performanceCyclesQuery);

    const goalPlansQuery = useMemoFirebase(() => collection(firestore, 'goal_plans'), [firestore]);
    const { data: goalPlans } = useCollection<DocumentData>(goalPlansQuery);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<ReviewPeriodType | null>(null);
    const { toast } = useToast();
    
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();

    useEffect(() => {
        if (editingPeriod) {
            setName(editingPeriod.name);
            setStartDate(editingPeriod.startDate instanceof Timestamp ? editingPeriod.startDate.toDate() : editingPeriod.startDate);
            setEndDate(editingPeriod.endDate instanceof Timestamp ? editingPeriod.endDate.toDate() : editingPeriod.endDate);
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

        const periodData = { 
            name, 
            startDate: Timestamp.fromDate(startDate), 
            endDate: Timestamp.fromDate(endDate),
            status: editingPeriod?.status || 'Active'
        };

        if (editingPeriod) {
          const docRef = doc(firestore, 'review_periods', editingPeriod.id);
          updateDocumentNonBlocking(docRef, periodData);
          toast({ title: 'Success', description: `Review period "${name}" has been updated.` });
        } else {
          const collRef = collection(firestore, 'review_periods');
          addDocumentNonBlocking(collRef, periodData);
          toast({ title: 'Success', description: `Review period "${name}" has been created.` });
        }
        handleCloseDialog();
    };

    const isPeriodInUse = (id: string) => {
        const isUsedInCycles = (performanceCycles || []).some(cycle => cycle.reviewPeriodId === id);
        const isUsedInGoalPlans = (goalPlans || []).some(gp => gp.reviewPeriodId === id);
        return isUsedInCycles || isUsedInGoalPlans;
    };

    const handleDelete = (id: string) => {
        const docRef = doc(firestore, 'review_periods', id);
        deleteDocumentNonBlocking(docRef);
        toast({ title: 'Success', description: 'Review period has been deleted.' });
    };

    const handleToggleStatus = (period: ReviewPeriodType) => {
        const newStatus = period.status === 'Active' ? 'Inactive' : 'Active';
        const docRef = doc(firestore, 'review_periods', period.id);
        updateDocumentNonBlocking(docRef, { status: newStatus });
        toast({ title: 'Success', description: `Period status set to ${newStatus}.` });
    };

    const handleManageGoalPlans = (period: ReviewPeriodType) => {
        router.push(`/configuration/goal-plans?reviewPeriodId=${period.id}`);
    }

    const handleManageCycles = (period: ReviewPeriodType) => {
        router.push(`/configuration/performance-cycles?reviewPeriodId=${period.id}`);
    }

    const tableColumns = useMemo(() => columns({ 
        onEdit: handleOpenDialog, 
        onDelete: handleDelete, 
        onToggleStatus: handleToggleStatus, 
        isPeriodInUse,
        onManageGoalPlans: handleManageGoalPlans,
        onManageCycles: handleManageCycles,
    }), [goalPlans, performanceCycles]);

    const displayData = useMemo(() => {
        if (!reviewPeriods) return [];
        return reviewPeriods.map(p => ({
            ...p,
            startDate: p.startDate instanceof Timestamp ? p.startDate.toDate() : p.startDate,
            endDate: p.endDate instanceof Timestamp ? p.endDate.toDate() : p.endDate,
        }))
    }, [reviewPeriods])

    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Review Periods"
                description="Manage all your review periods here."
                onAddNew={() => handleOpenDialog()}
            />
            <DataTable columns={tableColumns} data={displayData ?? []} />

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
