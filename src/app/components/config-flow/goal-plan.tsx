
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle } from 'lucide-react';
import type { StepProps } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface GoalPlanProps extends StepProps {
    selectedReviewPeriodId?: string;
}

export function GoalPlan({ state, dispatch, onComplete, selectedReviewPeriodId }: GoalPlanProps) {
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
    toast({
      title: 'Success',
      description: `Goal plan "${name}" has been created.`,
    });
    setName('');
  };

  const getReviewPeriodName = (id: string) => {
    return state.reviewPeriods.find(p => p.id === id)?.name || 'N/A';
  }

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
            Save & Close
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Existing Goal Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Goal Plan Name</TableHead>
                <TableHead>Linked Review Period</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.goalPlans.length > 0 ? (
                state.goalPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{getReviewPeriodName(plan.reviewPeriodId)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">No goal plans created yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {state.goalPlans.length > 0 && (
         <div className="flex justify-end">
            <Button onClick={onComplete} variant="default">Next Step</Button>
        </div>
      )}
    </div>
  );
}
