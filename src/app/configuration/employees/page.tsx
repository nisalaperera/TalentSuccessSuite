
'use client';

import { useMemo, Suspense } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Employee } from '@/lib/types';


function EmployeesContent() {
    const firestore = useFirestore();

    const employeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
    const { data: employees } = useCollection<Employee>(employeesQuery);
    
    const tableColumns = useMemo(() => columns(), []);


    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Employees"
                description="Manage all your employee records here."
                showAddNew={false}
            />
            <DataTable 
              columns={tableColumns} 
              data={employees ?? []}
            />
        </div>
    );
}

export default function EmployeesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EmployeesContent />
        </Suspense>
    )
}
