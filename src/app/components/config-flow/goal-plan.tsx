
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import type { StepProps, GoalPlan as GoalPlanType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface GoalPlanProps extends StepProps {
    selectedReviewPeriodId?: string;
    selectedGoalPlanId?: string;
    setSelectedGoalPlanId: (id: string) => void;
}

export function GoalPlan({ state, dispatch, onComplete, selectedReviewPeriodId, selectedGoalPlanId, setSelectedGoalPlanId }: GoalPlanProps) {
  const [name, setName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<GoalPlanType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editingPlan) {
      setName(editingPlan.name);
      setIsDialogOpen(true);
    } else {
      setName('');
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
    if (!name || !selectedReviewPeriodId) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a name and ensure a review period is selected.',
        variant: 'destructive',
      });
      return;
    }

    if (editingPlan) {
      const updatedPlan = { ...editingPlan, name };
      dispatch({ type: 'UPDATE_GOAL_PLAN', payload: updatedPlan });
      toast({ title: 'Success', description: `Goal plan "${name}" updated.` });
    } else {
      const newPlan: GoalPlanType = {
        id: `gp-${Date.now()}`,
        name,
        reviewPeriodId: selectedReviewPeriodId,
        status: 'Active',
      };
      dispatch({ type: 'ADD_GOAL_PLAN', payload: newPlan });
      setSelectedGoalPlanId(newPlan.id);
      toast({ title: 'Success', description: `Goal plan "${name}" has been created.` });
      onComplete();
    }
    
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_GOAL_PLAN', payload: id });
    toast({ title: 'Success', description: 'Goal plan deleted.'});
    if (id === selectedGoalPlanId) {
      setSelectedGoalPlanId('');
    }
  };

  const handleToggleStatus = (plan: GoalPlanType) => {
    const newStatus = plan.status === 'Active' ? 'Inactive' : 'Active';
    dispatch({ type: 'UPDATE_GOAL_PLAN', payload: { ...plan, status: newStatus } });
    toast({ title: 'Success', description: `Plan status set to ${newStatus}.` });
  };


  const getReviewPeriodName = (id: string) => {
    return state.reviewPeriods.find(p => p.id === id)?.name || 'N/A';
  }

  const handleSelection = (id: string) => {
    setSelectedGoalPlanId(id);
    onComplete();
  }
  
  const filteredGoalPlans = state.goalPlans.filter(gp => gp.reviewPeriodId === selectedReviewPeriodId);

  const isPlanInUse = (id: string) => {
    return state.performanceDocuments.some(pd => pd.goalPlanId === id);
  }

  return (
    <div className="space-y-6">
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Goal Plans</CardTitle>
                    <CardDescription>Define goal containers and link them to the selected review period.</CardDescription>
                </div>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2" />Add New</Button>
                </DialogTrigger>
            </CardHeader>
            <CardContent>
            <RadioGroup value={selectedGoalPlanId} onValueChange={handleSelection}>
                <TooltipProvider>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Goal Plan Name</TableHead>
                        <TableHead>Linked Review Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredGoalPlans.length > 0 ? (
                        filteredGoalPlans.map((plan) => {
                            const inUse = isPlanInUse(plan.id);
                            return (
                                <TableRow key={plan.id} data-state={plan.id === selectedGoalPlanId ? 'selected' : 'unselected'}>
                                <TableCell>
                                    <RadioGroupItem value={plan.id} id={plan.id} />
                                </TableCell>
                                <TableCell className="font-medium"><Label htmlFor={plan.id} className="cursor-pointer">{plan.name}</Label></TableCell>
                                <TableCell>{getReviewPeriodName(plan.reviewPeriodId)}</TableCell>
                                <TableCell>{plan.status}</TableCell>
                                <TableCell className="text-right">
                                     <div className="flex justify-end items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild><span tabIndex={0}><Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plan)} disabled={inUse}><Pencil className="h-4 w-4" /></Button></span></TooltipTrigger>
                                            {inUse && <TooltipContent><p>Cannot edit a plan that is in use.</p></TooltipContent>}
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span tabIndex={0}>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" disabled={inUse}><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the goal plan.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(plan.id)}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </span>
                                            </TooltipTrigger>
                                            {inUse && <TooltipContent><p>Cannot delete a plan that is in use.</p></TooltipContent>}
                                        </Tooltip>
                                        <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(plan)}>
                                            {plan.status === 'Active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                            <span className="sr-only">{plan.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                                        </Button>
                                    </div>
                                </TableCell>
                                </TableRow>
                            )
                        })
                        ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">No goal plans created for this review period yet.</TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </TooltipProvider>
            </RadioGroup>
            </CardContent>
        </Card>
        <DialogContent onPointerDownOutside={(e) => { if (editingPlan) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (editingPlan) e.preventDefault(); }}>
            <DialogHeader>
                <DialogTitle className="font-headline">{editingPlan ? 'Edit' : 'Create New'} Goal Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Input
                    placeholder="e.g., FY26 Mid-Annual Goal Plan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
            <DialogFooter>
                 <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                <Button onClick={handleSave}>
                    <PlusCircle className="mr-2" />
                    {editingPlan ? 'Save Changes' : 'Create & Select'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
