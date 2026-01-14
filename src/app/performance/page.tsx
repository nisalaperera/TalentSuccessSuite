
'use client';

import { useMemo } from 'react';
import { useGlobalState } from '@/app/context/global-state-provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Employee, EmployeePerformanceDocument, PerformanceDocument, PerformanceTemplate, PerformanceCycle, ReviewPeriod } from '@/lib/types';
import { MyPerformanceCycles } from './components/my-performance-cycles';
import { MyTeamPerformanceCycles } from './components/my-team-performance-cycles';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PerformancePage() {
  const { personNumber, performanceCycleId } = useGlobalState();
  const firestore = useFirestore();

  // --- Data Fetching ---
  const employeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
  const { data: allEmployees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesQuery);

  const performanceDocumentsQuery = useMemoFirebase(() => collection(firestore, 'performance_documents'), [firestore]);
  const { data: allPerformanceDocuments } = useCollection<PerformanceDocument>(performanceDocumentsQuery);
  
  const performanceTemplatesQuery = useMemoFirebase(() => collection(firestore, 'performance_templates'), [firestore]);
  const { data: allPerformanceTemplates } = useCollection<PerformanceTemplate>(performanceTemplatesQuery);

  const performanceCyclesQuery = useMemoFirebase(() => collection(firestore, 'performance_cycles'), [firestore]);
  const { data: allPerformanceCycles } = useCollection<PerformanceCycle>(performanceCyclesQuery);

  const reviewPeriodsQuery = useMemoFirebase(() => collection(firestore, 'review_periods'), [firestore]);
  const { data: allReviewPeriods } = useCollection<ReviewPeriod>(reviewPeriodsQuery);
  
  const selectedEmployee = useMemo(() => {
    if (!personNumber || !allEmployees) return null;
    return allEmployees.find(e => e.personNumber === personNumber) || null;
  }, [personNumber, allEmployees]);

  // My Performance Cycles Data
  const myPerformanceCyclesQuery = useMemoFirebase(() => {
    if (!selectedEmployee || !performanceCycleId) return null;
    return query(
      collection(firestore, 'employee_performance_documents'),
      where('employeeId', '==', selectedEmployee.id),
      where('performanceCycleId', '==', performanceCycleId)
    );
  }, [firestore, selectedEmployee, performanceCycleId]);
  const { data: myPerformanceCycles, isLoading: isLoadingMyCycles } = useCollection<EmployeePerformanceDocument>(myPerformanceCyclesQuery);
  
  // My Team Performance Cycles Data
  const myTeamIds = useMemo(() => {
    if (!selectedEmployee || !allEmployees) return [];
    return allEmployees.filter(e => e.workManager === selectedEmployee.personNumber).map(e => e.id);
  }, [selectedEmployee, allEmployees]);

  const teamPerformanceCyclesQuery = useMemoFirebase(() => {
    if (myTeamIds.length === 0 || !performanceCycleId) return null;
    return query(
      collection(firestore, 'employee_performance_documents'),
      where('employeeId', 'in', myTeamIds),
      where('performanceCycleId', '==', performanceCycleId)
    );
  }, [firestore, myTeamIds, performanceCycleId]);
  const { data: myTeamPerformanceCycles, isLoading: isLoadingTeamCycles } = useCollection<EmployeePerformanceDocument>(teamPerformanceCyclesQuery);
  
  const isLoading = isLoadingEmployees || isLoadingMyCycles || isLoadingTeamCycles;

  if (!personNumber || !performanceCycleId) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[calc(100vh-81px)]">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
            <CardTitle className="font-headline text-2xl">Performance Management</CardTitle>
            <CardDescription>Please select an employee and a performance cycle in the header to view documents.</CardDescription>
            </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
        <div className="container mx-auto py-10">
            <p>Loading performance data...</p>
        </div>
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
        <MyPerformanceCycles
          data={myPerformanceCycles}
          allPerformanceDocuments={allPerformanceDocuments}
          allPerformanceTemplates={allPerformanceTemplates}
          />
        <MyTeamPerformanceCycles 
          data={myTeamPerformanceCycles}
          allEmployees={allEmployees}
          allPerformanceDocuments={allPerformanceDocuments}
          allPerformanceTemplates={allPerformanceTemplates}
        />
    </div>
  );
}
