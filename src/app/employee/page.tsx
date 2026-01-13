
'use client';

import { useReducer, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import type { PerformanceCycle, ReviewPeriod } from '@/lib/types';


export default function EmployeePage() {
  const firestore = useFirestore();

  const reviewPeriodsQuery = useMemoFirebase(() => collection(firestore, 'review_periods'), [firestore]);
  const { data: reviewPeriods } = useCollection<ReviewPeriod>(reviewPeriodsQuery);
  
  const performanceCyclesQuery = useMemoFirebase(() => collection(firestore, 'performance_cycles'), [firestore]);
  const { data: performanceCycles } = useCollection<PerformanceCycle>(performanceCyclesQuery);


  const [personNumber, setPersonNumber] = useState('');
  const [performanceCycleId, setPerformanceCycleId] = useState('');

  const canProceed = personNumber && performanceCycleId;
  
  const getReviewPeriodName = (id: string) => {
    return reviewPeriods?.find(p => p.id === id)?.name || 'N/A';
  }

  const activeCycles = useMemo(() => (performanceCycles || []).filter(p => p.status === 'Active'), [performanceCycles])

  return (
    <div className="container mx-auto py-10 flex items-center justify-center min-h-[calc(100vh-81px)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Employee View</CardTitle>
          <CardDescription>Enter your details to access your performance documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="person-number">Person Number</Label>
                <Input 
                    id="person-number"
                    placeholder="Enter your person number" 
                    value={personNumber}
                    onChange={(e) => setPersonNumber(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="performance-cycle">Performance Cycle</Label>
                 <Select onValueChange={setPerformanceCycleId} value={performanceCycleId}>
                    <SelectTrigger id="performance-cycle">
                        <SelectValue placeholder="Select a performance cycle" />
                    </SelectTrigger>
                    <SelectContent>
                        {activeCycles.map(p => 
                            <SelectItem key={p.id} value={p.id}>
                                {p.name} ({getReviewPeriodName(p.reviewPeriodId)})
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
        <CardFooter>
            <Button className="w-full" disabled={!canProceed}>
                Proceed
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
