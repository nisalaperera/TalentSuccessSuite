
'use client';

import { useReducer, useState, useEffect } from 'react';
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

export default function GoalPlansPage() {
    const [state, dispatch] = useReducer(configReducer, initialState);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<GoalPlanType | null>(null);
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState('');
    const [reviewPeriodId, setReviewPeriodId] = useState('');

    useEffect(() => {
        if (editingPlan) {
            setName(editingPlan.name);
            setReviewPeriodId(editingPlan.reviewPeriodId);
        } else {
            setName('');
            setReviewPeriodId('');
        }
    }, [editingPlan]);

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
    
    const tableColumns = columns({ onEdit: handleOpenDialog, onDelete: handleDelete, onToggleStatus: handleToggleStatus, isPlanInUse, getReviewPeriodName });

    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Goal Plans"
                description="Manage all your goal plans here."
                onAddNew={() => handleOpenDialog()}
            />
            <DataTable columns={tableColumns} data={state.goalPlans} />

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
