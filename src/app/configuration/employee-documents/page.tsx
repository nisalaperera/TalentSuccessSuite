
'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { EmployeePerformanceDocument, PerformanceCycle, ReviewPeriod, Employee, PerformanceTemplate, GoalPlan } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

function EmployeeDocumentsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();

    const employeeDocumentsQuery = useMemoFirebase(() => collection(firestore, 'employee_performance_documents'), [firestore]);
    const { data: employeeDocuments } = useCollection<EmployeePerformanceDocument>(employeeDocumentsQuery);

    const employeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
    const { data: employees } = useCollection<Employee>(employeesQuery);

    const performanceCyclesQuery = useMemoFirebase(() => collection(firestore, 'performance_cycles'), [firestore]);
    const { data: performanceCycles } = useCollection<PerformanceCycle>(performanceCyclesQuery);

    const reviewPeriodsQuery = useMemoFirebase(() => collection(firestore, 'review_periods'), [firestore]);
    const { data: reviewPeriods } = useCollection<ReviewPeriod>(reviewPeriodsQuery);
    
    const performanceTemplatesQuery = useMemoFirebase(() => collection(firestore, 'performance_templates'), [firestore]);
    const { data: performanceTemplates } = useCollection<PerformanceTemplate>(performanceTemplatesQuery);

    const cycleFilter = searchParams.get('cycleId');
    const employeeFilter = searchParams.get('employeeId');

    const handleFilterChange = (type: 'cycle' | 'employee', value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(type === 'cycle' ? 'cycleId' : 'employeeId', value);
        } else {
            params.delete(type === 'cycle' ? 'cycleId' : 'employeeId');
        }
        router.push(`/configuration/employee-documents?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push('/configuration/employee-documents');
    }

    const getEmployeeName = (id: string) => {
        const emp = employees?.find(e => e.id === id);
        return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
    };

    const getCycleName = (id: string) => {
        const cycle = performanceCycles?.find(c => c.id === id);
        if (!cycle) return 'N/A';
        const period = reviewPeriods?.find(p => p.id === cycle.reviewPeriodId);
        return `${cycle.name} (${period?.name || 'N/A'})`;
    };
    
    const getTemplateName = (id: string) => performanceTemplates?.find(t => t.id === id)?.name || 'N/A';

    const tableColumns = useMemo(() => columns({ getEmployeeName, getCycleName, getTemplateName }), [employees, performanceCycles, reviewPeriods, performanceTemplates]);

    const filteredData = useMemo(() => {
        if (!employeeDocuments) return [];
        return employeeDocuments.filter(doc => {
            const cycleMatch = !cycleFilter || doc.performanceCycleId === cycleFilter;
            const employeeMatch = !employeeFilter || doc.employeeId === employeeFilter;
            return cycleMatch && employeeMatch;
        });
    }, [employeeDocuments, cycleFilter, employeeFilter]);
    
    const hasActiveFilters = cycleFilter || employeeFilter;

    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Employee Performance Documents"
                description="View all launched employee performance documents."
                showAddNew={false}
            />

            <div className="flex items-center gap-4 mb-4">
                <Select value={cycleFilter || ''} onValueChange={(value) => handleFilterChange('cycle', value)}>
                    <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Filter by Performance Cycle..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Cycles</SelectItem>
                        {(performanceCycles || []).map(cycle => (
                            <SelectItem key={cycle.id} value={cycle.id}>{getCycleName(cycle.id)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={employeeFilter || ''} onValueChange={(value) => handleFilterChange('employee', value)}>
                    <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Filter by Employee..." />
                    </SelectTrigger>
                    <SelectContent>
                         <SelectItem value="all">All Employees</SelectItem>
                        {(employees || []).map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>{getEmployeeName(emp.id)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters}>
                        <X className="mr-2 h-4 w-4" />
                        Clear Filters
                    </Button>
                )}
            </div>

            <DataTable columns={tableColumns} data={filteredData} />
        </div>
    );
}


export default function EmployeeDocumentsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EmployeeDocumentsContent />
        </Suspense>
    )
}
