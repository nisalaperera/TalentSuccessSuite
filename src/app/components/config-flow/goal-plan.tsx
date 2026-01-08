
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle } from 'lucide-react';
import type { StepProps } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface GoalPlanProps extends StepProps {
    selectedReviewPeriodId?: string;
    selectedGoalPlanId?: string;
    setSelectedGoalPlanId: (id: string) => void;
}

export function GoalPlan({ state, dispatch, onComplete, selectedReviewPeriodId, selectedGoalPlanId, setSelectedGoalPlanId }: GoalPlanProps) {
  const [name, setName] = useState('');
  const { toast } = useToast();

  const handleAddGoalPlan = () => {
    if (!name || !selectedReviewPeriodId) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a name and ensure a review period is selected.',
        variant: 'destructive',
      });
      return;
    }

    const newPlan = {
      id: `gp-${Date.now()}`,
      name,
      reviewPeriodId: selectedReviewPeriodId,
    };
    dispatch({ type: 'ADD_GOAL_PLAN', payload: newPlan });
    setSelectedGoalPlanId(newPlan.id);
    toast({
      title: 'Success',
      description: `Goal plan "${name}" has been created.`,
    });
    setName('');
    onComplete();
  };

  const getReviewPeriodName = (id: string) => {
    return state.reviewPeriods.find(p => p.id === id)?.name || 'N/A';
  }

  const handleSelection = (id: string) => {
    setSelectedGoalPlanId(id);
    onComplete();
  }
  
  const filteredGoalPlans = state.goalPlans.filter(gp => gp.reviewPeriodId === selectedReviewPeriodId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Create New Goal Plan</CardTitle>
          <CardDescription>Define a goal container and link it to the selected review period.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="e.g., FY26 Mid-Annual Goal Plan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button onClick={handleAddGoalPlan}>
            <PlusCircle className="mr-2" />
            Create & Select Goal Plan
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Existing Goal Plans for Selected Review Period</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedGoalPlanId} onValueChange={handleSelection}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Goal Plan Name</TableHead>
                  <TableHead>Linked Review Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGoalPlans.length > 0 ? (
                  filteredGoalPlans.map((plan) => (
                    <TableRow key={plan.id} data-state={plan.id === selectedGoalPlanId ? 'selected' : 'unselected'}>
                      <TableCell>
                        <RadioGroupItem value={plan.id} id={plan.id} />
                      </TableCell>
                      <TableCell className="font-medium"><Label htmlFor={plan.id}>{plan.name}</Label></TableCell>
                      <TableCell>{getReviewPeriodName(plan.reviewPeriodId)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">No goal plans created for this review period yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </RadioGroup>
        </CardContent>
      </Card>
      {filteredGoalPlans.length > 0 && (
         <div className="flex justify-end">
            <Button onClick={onComplete} variant="default" disabled={!selectedGoalPlanId}>Next Step</Button>
        </div>
      )}
    </div>
  );
}
