

'use client';

import { useReducer, useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useToast } from '@/hooks/use-toast';
import type { PerformanceCycle, ReviewPeriod, GoalPlan, PerformanceDocument } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { DatePicker } from '@/app/components/config-flow/shared/date-picker';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


function PerformanceCyclesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();

    const reviewPeriodsQuery = useMemoFirebase(() => collection(firestore, 'review_periods'), [firestore]);
    const { data: reviewPeriods } = useCollection<ReviewPeriod>(reviewPeriodsQuery);
    
    const performanceCyclesQuery = useMemoFirebase(() => collection(firestore, 'performance_cycles'), [firestore]);
    const { data: performanceCycles } = useCollection<PerformanceCycle>(performanceCyclesQuery);
    
    const goalPlansQuery = useMemoFirebase(() => collection(firestore, 'goal_plans'), [firestore]);
    const { data: goalPlans } = useCollection<GoalPlan>(goalPlansQuery);
    
    const performanceDocumentsQuery = useMemoFirebase(() => collection(firestore, 'performance_documents'), [firestore]);
    const { data: performanceDocuments } = useCollection<PerformanceDocument>(performanceDocumentsQuery);


    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCycle, setEditingCycle] = useState<PerformanceCycle | null>(null);
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState('');
    const [reviewPeriodId, setReviewPeriodId] = useState('');
    const [goalPlanId, setGoalPlanId] = useState('');
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    
    const filterReviewPeriod = searchParams.get('reviewPeriodId') || '';

    const availableGoalPlans = useMemo(() => {
        if (!reviewPeriodId || !goalPlans) return [];
        return goalPlans.filter(gp => gp.reviewPeriodId === reviewPeriodId && gp.status === 'Active');
    }, [reviewPeriodId, goalPlans]);

    useEffect(() => {
        if (editingCycle) {
            setName(editingCycle.name);
            setReviewPeriodId(editingCycle.reviewPeriodId);
            setGoalPlanId(editingCycle.goalPlanId);
            setStartDate(editingCycle.startDate instanceof Timestamp ? editingCycle.startDate.toDate() : editingCycle.startDate);
            setEndDate(editingCycle.endDate instanceof Timestamp ? editingCycle.endDate.toDate() : editingCycle.endDate);
        } else {
            setName('');
            setReviewPeriodId(filterReviewPeriod || '');
            setGoalPlanId('');
            setStartDate(undefined);
            setEndDate(undefined);
        }
    }, [editingCycle, filterReviewPeriod]);
    
    // When reviewPeriodId changes in the form, reset goalPlanId if it's no longer valid
    useEffect(() => {
        if (reviewPeriodId && !availableGoalPlans.find(gp => gp.id === goalPlanId)) {
            setGoalPlanId('');
        }
    }, [reviewPeriodId, availableGoalPlans, goalPlanId]);

    const handleOpenDialog = (cycle: PerformanceCycle | null = null) => {
        setEditingCycle(cycle);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditingCycle(null);
        setIsDialogOpen(false);
    };

    const handleSave = () => {
        if (!name || !reviewPeriodId || !goalPlanId || !startDate || !endDate) {
            toast({ title: 'Missing Information', description: 'Please fill out all fields.', variant: 'destructive' });
            return;
        }

        const parentReviewPeriod = reviewPeriods?.find(p => p.id === reviewPeriodId);
        if (!parentReviewPeriod) {
            toast({ title: 'Invalid Review Period', description: 'The selected review period could not be found.', variant: 'destructive' });
            return;
        }
        
        const parentStartDate = parentReviewPeriod.startDate instanceof Timestamp ? parentReviewPeriod.startDate.toDate() : parentReviewPeriod.startDate;
        const parentEndDate = parentReviewPeriod.endDate instanceof Timestamp ? parentReviewPeriod.endDate.toDate() : parentReviewPeriod.endDate;

        if (startDate < parentStartDate || endDate > parentEndDate) {
            toast({ title: 'Invalid Dates', description: 'Cycle dates must be within the parent review period.', variant: 'destructive' });
            return;
        }
        
        if (endDate < startDate) {
            toast({ title: 'Invalid Dates', description: 'End date cannot be before start date.', variant: 'destructive' });
            return;
        }
        
        const overlappingCycle = (performanceCycles || []).find(cycle => {
            if (cycle.reviewPeriodId !== reviewPeriodId) return false;
            if (editingCycle && cycle.id === editingCycle.id) return false;
            const cycleStartDate = cycle.startDate instanceof Timestamp ? cycle.startDate.toDate() : cycle.startDate;
            const cycleEndDate = cycle.endDate instanceof Timestamp ? cycle.endDate.toDate() : cycle.endDate;
            return startDate <= cycleEndDate && endDate >= cycleStartDate;
        });

        if (overlappingCycle) {
            toast({ title: 'Overlapping Dates', description: `Dates overlap with existing cycle: "${overlappingCycle.name}".`, variant: 'destructive' });
            return;
        }

        const cycleData = {
            name,
            reviewPeriodId,
            goalPlanId,
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(endDate),
            status: editingCycle?.status || 'Active'
        };

        if (editingCycle) {
            const docRef = doc(firestore, 'performance_cycles', editingCycle.id);
            updateDocumentNonBlocking(docRef, cycleData);
            toast({ title: 'Success', description: `Performance cycle "${name}" updated.` });
        } else {
            const collRef = collection(firestore, 'performance_cycles');
            addDocumentNonBlocking(collRef, cycleData);
            toast({ title: 'Success', description: `Performance cycle "${name}" created.` });
        }
        handleCloseDialog();
    };

    const isCycleInUse = (id: string) => {
        return (performanceDocuments || []).some(pd => pd.performanceCycleId === id && pd.isLaunched);
    };

    const handleDelete = (id: string) => {
        const docRef = doc(firestore, 'performance_cycles', id);
        deleteDocumentNonBlocking(docRef);
        toast({ title: 'Success', description: 'Performance cycle deleted.' });
    };

    const handleToggleStatus = (cycle: PerformanceCycle) => {
        const newStatus = cycle.status === 'Active' ? 'Inactive' : 'Active';
        const docRef = doc(firestore, 'performance_cycles', cycle.id);
        updateDocumentNonBlocking(docRef, { status: newStatus });
        toast({ title: 'Success', description: `Cycle status set to ${newStatus}.` });
    };
    
    const getReviewPeriodName = (id: string) => reviewPeriods?.find(p => p.id === id)?.name || 'N/A';
    const getGoalPlanName = (id: string) => goalPlans?.find(p => p.id === id)?.name || 'N/A';
    
    const tableColumns = useMemo(() => columns({ onEdit: handleOpenDialog, onDelete: handleDelete, onToggleStatus: handleToggleStatus, getReviewPeriodName, getGoalPlanName, isCycleInUse }), [reviewPeriods, goalPlans, performanceDocuments]);

    const filteredData = useMemo(() => {
        if (!performanceCycles) return [];
        const cyclesWithDates = performanceCycles.map(c => ({
            ...c,
            startDate: c.startDate instanceof Timestamp ? c.startDate.toDate() : c.startDate,
            endDate: c.endDate instanceof Timestamp ? c.endDate.toDate() : c.endDate,
        }));
        if (!filterReviewPeriod) return cyclesWithDates;
        return cyclesWithDates.filter(cycle => cycle.reviewPeriodId === filterReviewPeriod);
    }, [filterReviewPeriod, performanceCycles]);

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
    }, [filterReviewPeriod, reviewPeriods]);


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
                                {(reviewPeriods || []).filter(p => p.status === 'Active').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={setGoalPlanId} value={goalPlanId} disabled={!reviewPeriodId}>
                            <SelectTrigger><SelectValue placeholder="Select Goal Plan"/></SelectTrigger>
                            <SelectContent>
                                {availableGoalPlans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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

    
