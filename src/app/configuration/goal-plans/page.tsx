
'use client';

import { useReducer, useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { configReducer, initialState } from '@/lib/state';
import { useToast } from '@/hooks/use-toast';
import type { GoalPlan as GoalPlanType } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

function GoalPlansContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [state, dispatch] = useReducer(configReducer, initialState);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<GoalPlanType | null>(null);
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState('');
    const [reviewPeriodId, setReviewPeriodId] = useState('');
    
    const [filterReviewPeriod, setFilterReviewPeriod] = useState(searchParams.get('reviewPeriodId') || '');

    const preselectedReviewPeriodId = searchParams.get('reviewPeriodId');

    useEffect(() => {
        if (editingPlan) {
            setName(editingPlan.name);
            setReviewPeriodId(editingPlan.reviewPeriodId);
        } else {
            setName('');
            setReviewPeriodId(preselectedReviewPeriodId || '');
        }
    }, [editingPlan, preselectedReviewPeriodId]);
    
    useEffect(() => {
        // Sync table filter with URL param
        const currentTable = table.getColumn('reviewPeriodId');
        if (filterReviewPeriod) {
            currentTable?.setFilterValue(filterReviewPeriod);
        } else {
            currentTable?.setFilterValue(undefined);
        }
        
        // Update URL to reflect filter state
        const params = new URLSearchParams(window.location.search);
        if (filterReviewPeriod) {
            params.set('reviewPeriodId', filterReviewPeriod);
            router.replace(`${window.location.pathname}?${params.toString()}`);
        } else {
            params.delete('reviewPeriodId');
            router.replace(`${window.location.pathname}?${params.toString()}`);
        }

    }, [filterReviewPeriod]);


    const handleOpenDialog = (plan: GoalPlanType | null = null) => {
        setEditingPlan(plan);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditingPlan(null);
        setIsDialogOpen(false);
    };

    const handleSave = () => {
        if (!name || !reviewPeriodId) {
            toast({ title: 'Missing Information', description: 'Please provide a name and select a review period.', variant: 'destructive' });
            return;
        }

        if (editingPlan) {
            const updatedPlan = { ...editingPlan, name, reviewPeriodId };
            dispatch({ type: 'UPDATE_GOAL_PLAN', payload: updatedPlan });
            toast({ title: 'Success', description: `Goal plan "${name}" updated.` });
        } else {
            const newPlan: GoalPlanType = { id: `gp-${Date.now()}`, name, reviewPeriodId, status: 'Active' };
            dispatch({ type: 'ADD_GOAL_PLAN', payload: newPlan });
            toast({ title: 'Success', description: `Goal plan "${name}" created.` });
        }
        handleCloseDialog();
    };

    const isPlanInUse = (id: string) => {
        return state.performanceDocuments.some(pd => pd.goalPlanId === id);
    };

    const handleDelete = (id: string) => {
        dispatch({ type: 'DELETE_GOAL_PLAN', payload: id });
        toast({ title: 'Success', description: 'Goal plan deleted.' });
    };

    const handleToggleStatus = (plan: GoalPlanType) => {
        const newStatus = plan.status === 'Active' ? 'Inactive' : 'Active';
        dispatch({ type: 'UPDATE_GOAL_PLAN', payload: { ...plan, status: newStatus } });
        toast({ title: 'Success', description: `Plan status set to ${newStatus}.` });
    };
    
    const getReviewPeriodName = (id: string) => state.reviewPeriods.find(p => p.id === id)?.name || 'N/A';
    
    const tableColumns = useMemo(() => columns({ onEdit: handleOpenDialog, onDelete: handleDelete, onToggleStatus: handleToggleStatus, isPlanInUse, getReviewPeriodName }), [state.reviewPeriods]);

    const table = useMemo(() => {
        return {
            getColumn: (id: string) => ({
                setFilterValue: (value: any) => {
                    // This is a mock. The real filtering is done via useMemo on filteredData
                }
            })
        }
    }, []);

    const filteredData = useMemo(() => {
        if (!filterReviewPeriod) return state.goalPlans;
        return state.goalPlans.filter(plan => plan.reviewPeriodId === filterReviewPeriod);
    }, [filterReviewPeriod, state.goalPlans]);

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
              toolbarContent={
                <div className="flex items-center gap-2">
                    <Select value={filterReviewPeriod} onValueChange={(value) => setFilterReviewPeriod(value === 'all' ? '' : value)}>
                        <SelectTrigger className="w-[250px] h-8">
                            <SelectValue placeholder="Filter by Review Period..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Review Periods</SelectItem>
                            {state.reviewPeriods.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {filterReviewPeriod && (
                        <Badge variant="secondary" className="pl-2 pr-1 h-8 text-sm">
                            {getReviewPeriodName(filterReviewPeriod)}
                            <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => setFilterReviewPeriod('')}>
                                <X className="h-3 w-3"/>
                            </Button>
                        </Badge>
                    )}
                </div>
              }
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-headline">{editingPlan ? 'Edit' : 'Create New'} Goal Plan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input placeholder="e.g., FY26 Mid-Annual Goal Plan" value={name} onChange={(e) => setName(e.target.value)} />
                        <Select onValueChange={setReviewPeriodId} value={reviewPeriodId}>
                            <SelectTrigger><SelectValue placeholder="Select Review Period"/></SelectTrigger>
                            <SelectContent>
                                {state.reviewPeriods.filter(p => p.status === 'Active').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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
