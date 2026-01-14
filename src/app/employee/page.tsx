
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGlobalState } from '@/app/context/global-state-provider';

export default function EmployeePage() {
  const { personNumber, performanceCycleId } = useGlobalState();
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    setCanProceed(!!(personNumber && performanceCycleId));
  }, [personNumber, performanceCycleId]);

  return (
    <div className="container mx-auto py-10 flex items-center justify-center min-h-[calc(100vh-81px)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Employee View</CardTitle>
          <CardDescription>Select your details in the header to access your performance documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
           {personNumber ? (
             <p>Person Number: <strong>{personNumber}</strong></p>
           ) : (
             <p className="text-muted-foreground">Please select an employee.</p>
           )}
           {performanceCycleId ? (
             <p>Cycle ID: <strong>{performanceCycleId}</strong></p>
           ) : (
             <p className="text-muted-foreground">Please select a performance cycle.</p>
           )}
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
