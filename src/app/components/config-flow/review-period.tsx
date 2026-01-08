
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from './shared/date-picker';
import { PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { StepProps } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ReviewPeriodProps extends StepProps {
    selectedReviewPeriodId?: string;
    setSelectedReviewPeriodId: (id: string) => void;
}

export function ReviewPeriod({ state, dispatch, onComplete, selectedReviewPeriodId, setSelectedReviewPeriodId }: ReviewPeriodProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();

  const handleAddReviewPeriod = () => {
    if (!name || !startDate || !endDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out all fields.',
        variant: 'destructive',
      });
      return;
    }
    if (endDate < startDate) {
      toast({
        title: 'Invalid Dates',
        description: 'End date cannot be before start date.',
        variant: 'destructive',
      });
      return;
    }

    const newPeriod = {
      id: `rp-${Date.now()}`,
      name,
      startDate,
      endDate,
      status: 'Active' as const,
    };
    dispatch({ type: 'ADD_REVIEW_PERIOD', payload: newPeriod });
    setSelectedReviewPeriodId(newPeriod.id);
    toast({
      title: 'Success',
      description: `Review period "${name}" has been created.`,
    });
    setName('');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleSelection = (id: string) => {
    setSelectedReviewPeriodId(id);
    onComplete();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Create New Review Period</CardTitle>
          <CardDescription>Define the time boundary for all performance-related activities.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="e.g., FY 2024-25 Mid-Year"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />
            <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" />
          </div>
          <Button onClick={handleAddReviewPeriod}>
            <PlusCircle className="mr-2" />
            Save & Close
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Existing Review Periods</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedReviewPeriodId} onValueChange={handleSelection}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Review Period Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.reviewPeriods.length > 0 ? (
                  state.reviewPeriods.map((period) => (
                    <TableRow key={period.id} data-state={period.id === selectedReviewPeriodId ? 'selected' : 'unselected'}>
                      <TableCell>
                          <RadioGroupItem value={period.id} id={period.id} />
                      </TableCell>
                      <TableCell className="font-medium"><Label htmlFor={period.id}>{period.name}</Label></TableCell>
                      <TableCell>{format(period.startDate, 'PPP')}</TableCell>
                      <TableCell>{format(period.endDate, 'PPP')}</TableCell>
                      <TableCell>{period.status}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No review periods created yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </RadioGroup>
        </CardContent>
      </Card>
      {state.reviewPeriods.length > 0 && (
         <div className="flex justify-end">
            <Button onClick={onComplete} variant="default" disabled={!selectedReviewPeriodId}>Next Step</Button>
        </div>
      )}
    </div>
  );
}
