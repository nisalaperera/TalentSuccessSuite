
'use client';

import { useMemo, Suspense } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { AppraiserMapping, Employee, PerformanceCycle, ReviewPeriod } from '@/lib/types';
import type { SortingState } from '@tanstack/react-table';

function AppraiserMappingsContent() {
    const firestore = useFirestore();

    const appraiserMappingsQuery = useMemoFirebase(() => collection(firestore, 'employee_appraiser_mappings'), [firestore]);
    const { data: appraiserMappings } = useCollection<AppraiserMapping>(appraiserMappingsQuery);

    const employeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
    const { data: employees } = useCollection<Employee>(employeesQuery);

    const performanceCyclesQuery = useMemoFirebase(() => collection(firestore, 'performance_cycles'), [firestore]);
    const { data: performanceCycles } = useCollection<PerformanceCycle>(performanceCyclesQuery);

    const reviewPeriodsQuery = useMemoFirebase(() => collection(firestore, 'review_periods'), [firestore]);
    const { data: reviewPeriods } = useCollection<ReviewPeriod>(reviewPeriodsQuery);

    const getEmployeeNameByPersonNumber = (personNumber: string) => {
        const emp = employees?.find(e => e.personNumber === personNumber);
        return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
    };

    const getCycleName = (id: string) => {
        const cycle = performanceCycles?.find(c => c.id === id);
        if (!cycle) return 'N/A';
        const period = reviewPeriods?.find(p => p.id === cycle.reviewPeriodId);
        return `${cycle.name} (${period?.name || 'N/A'})`;
    };
    
    const tableColumns = useMemo(() => columns({ getEmployeeNameByPersonNumber, getCycleName }), [employees, performanceCycles, reviewPeriods]);
    
    const initialSorting = useMemo<SortingState>(() => [
        { id: 'performanceCycleId', desc: false },
        { id: 'employeePersonNumber', desc: false },
        { id: 'appraiserType', desc: false },
    ], []);

    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Appraiser Mappings"
                description="View employee to appraiser mappings."
                showAddNew={false}
            />
            <DataTable 
                columns={tableColumns} 
                data={appraiserMappings ?? []} 
                initialSorting={initialSorting}
            />
        </div>
    );
}

export default function AppraiserMappingsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AppraiserMappingsContent />
        </Suspense>
    );
}
