
'use client';

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGlobalState } from "@/app/context/global-state-provider";
import { useMemo } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { PerformanceCycle, ReviewPeriod, Employee } from '@/lib/types';
import { Combobox } from "@/components/ui/combobox";


function GlobalFilters() {
    const { personNumber, setPersonNumber, performanceCycleId, setPerformanceCycleId } = useGlobalState();
    const firestore = useFirestore();

    const reviewPeriodsQuery = useMemoFirebase(() => collection(firestore, 'review_periods'), [firestore]);
    const { data: reviewPeriods } = useCollection<ReviewPeriod>(reviewPeriodsQuery);
    
    const performanceCyclesQuery = useMemoFirebase(() => collection(firestore, 'performance_cycles'), [firestore]);
    const { data: performanceCycles } = useCollection<PerformanceCycle>(performanceCyclesQuery);
    
    const employeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
    const { data: employees } = useCollection<Employee>(employeesQuery);

    const getReviewPeriodName = (id: string) => {
        return reviewPeriods?.find(p => p.id === id)?.name || 'N/A';
    }

    const activeCycles = useMemo(() => (performanceCycles || []).filter(p => p.status === 'Active'), [performanceCycles]);
    
    const employeeOptions = useMemo(() => {
        if (!employees) return [];
        return employees.map(emp => ({
            value: emp.personNumber,
            label: `${emp.firstName} ${emp.lastName}`,
        }));
    }, [employees]);


    return (
        <div className="flex items-center gap-4">
             <Combobox
                options={employeeOptions}
                value={personNumber}
                onChange={setPersonNumber}
                placeholder="Select an employee..."
                searchPlaceholder="Search employees..."
                noResultsText="No employees found."
                triggerClassName="w-64"
             />
             <Select onValueChange={setPerformanceCycleId} value={performanceCycleId}>
                <SelectTrigger id="performance-cycle" className="w-64">
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
    )
}


export function Header() {
  const pathname = usePathname();
  const isAdminSection = pathname.startsWith('/admin') || pathname.startsWith('/configuration');
  const isPerformanceSection = pathname.startsWith('/performance') || pathname.startsWith('/goal');

  if (pathname === '/') {
    return null; // No header on the main landing page
  }

  return (
    <header className="p-4 border-b sticky top-0 bg-background/95 backdrop-blur z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="space-y-1">
              <h1 className="text-2xl font-headline font-bold text-primary hover:text-primary/90">
                Talent Suite
              </h1>
              {isAdminSection && (
                <p className="text-sm text-foreground/80 font-body hidden sm:block">
                    Seamless Performance Management Configuration
                </p>
              )}
            </div>
          </Link>
        </div>
         {(isPerformanceSection || pathname.startsWith('/employee')) && <GlobalFilters />}
      </div>
    </header>
  );
}
