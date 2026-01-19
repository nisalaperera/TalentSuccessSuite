'use client';

import { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { AppraiserMapping, Employee, PerformanceCycle, ReviewPeriod } from '@/lib/types';
import type { SortingState } from '@tanstack/react-table';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

function AppraiserMappingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();

    const appraiserMappingsQuery = useMemoFirebase(() => collection(firestore, 'employee_appraiser_mappings'), [firestore]);
    const { data: appraiserMappings } = useCollection<AppraiserMapping>(appraiserMappingsQuery);

    const employeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
    const { data: employees } = useCollection<Employee>(employeesQuery);

    const performanceCyclesQuery = useMemoFirebase(() => collection(firestore, 'performance_cycles'), [firestore]);
    const { data: performanceCycles } = useCollection<PerformanceCycle>(performanceCyclesQuery);

    const reviewPeriodsQuery = useMemoFirebase(() => collection(firestore, 'review_periods'), [firestore]);
    const { data: reviewPeriods } = useCollection<ReviewPeriod>(reviewPeriodsQuery);

    const cycleFilter = searchParams.get('cycleId');
    const employeeFilter = searchParams.get('employeePersonNumber');
    const appraiserFilter = searchParams.get('appraiserPersonNumber');
    const appraiserTypeFilter = searchParams.get('appraiserType');

    const handleFilterChange = (type: 'cycle' | 'employee' | 'appraiser' | 'appraiserType', value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        
        let paramName;
        switch (type) {
            case 'cycle':
                paramName = 'cycleId';
                break;
            case 'employee':
                paramName = 'employeePersonNumber';
                break;
            case 'appraiser':
                paramName = 'appraiserPersonNumber';
                break;
            case 'appraiserType':
                paramName = 'appraiserType';
                break;
        }


        if (value && value !== 'all') {
            params.set(paramName, value);
        } else {
            params.delete(paramName);
        }
        router.push(`/configuration/appraiser-mappings?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push('/configuration/appraiser-mappings');
    }

    const employeeOptions = useMemo(() => {
        if (!employees) return [];
        return employees.map(emp => ({
            value: emp.personNumber,
            label: `${emp.firstName} ${emp.lastName} (${emp.personNumber})`,
        }));
    }, [employees]);


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

    const filteredData = useMemo(() => {
        if (!appraiserMappings) return [];
        return appraiserMappings.filter(doc => {
            const cycleMatch = !cycleFilter || doc.performanceCycleId === cycleFilter;
            const employeeMatch = !employeeFilter || doc.employeePersonNumber === employeeFilter;
            const appraiserMatch = !appraiserFilter || doc.appraiserPersonNumber === appraiserFilter;
            const appraiserTypeMatch = !appraiserTypeFilter || doc.appraiserType === appraiserTypeFilter;
            return cycleMatch && employeeMatch && appraiserMatch && appraiserTypeMatch;
        });
    }, [appraiserMappings, cycleFilter, employeeFilter, appraiserFilter, appraiserTypeFilter]);

    const hasActiveFilters = cycleFilter || employeeFilter || appraiserFilter || appraiserTypeFilter;


    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Appraiser Mappings"
                description="View employee to appraiser mappings."
                showAddNew={false}
            />

            <div className="flex flex-wrap items-center gap-4 mb-4">
                <Select value={cycleFilter || ''} onValueChange={(value) => handleFilterChange('cycle', value)}>
                    <SelectTrigger className="w-full sm:w-auto flex-grow md:flex-grow-0 md:w-[250px]">
                        <SelectValue placeholder="Filter by Performance Cycle..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Cycles</SelectItem>
                        {(performanceCycles || []).map(cycle => (
                            <SelectItem key={cycle.id} value={cycle.id}>{getCycleName(cycle.id)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={appraiserTypeFilter || ''} onValueChange={(value) => handleFilterChange('appraiserType', value)}>
                    <SelectTrigger className="w-full sm:w-auto flex-grow md:flex-grow-0 md:w-[180px]">
                        <SelectValue placeholder="Filter by Appraiser Type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Primary">Primary</SelectItem>
                        <SelectItem value="Secondary">Secondary</SelectItem>
                    </SelectContent>
                </Select>
                <Combobox
                    options={employeeOptions}
                    value={employeeFilter || ''}
                    onChange={(value) => handleFilterChange('employee', value)}
                    placeholder="Filter by Employee..."
                    searchPlaceholder="Search employees..."
                    noResultsText="No employees found."
                    triggerClassName="w-full sm:w-auto flex-grow md:flex-grow-0 md:w-[250px]"
                />
                 <Combobox
                    options={employeeOptions}
                    value={appraiserFilter || ''}
                    onChange={(value) => handleFilterChange('appraiser', value)}
                    placeholder="Filter by Appraiser..."
                    searchPlaceholder="Search appraisers..."
                    noResultsText="No appraisers found."
                    triggerClassName="w-full sm:w-auto flex-grow md:flex-grow-0 md:w-[250px]"
                />
                {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters}>
                        <X className="mr-2 h-4 w-4" />
                        Clear Filters
                    </Button>
                )}
            </div>

            <DataTable 
                columns={tableColumns} 
                data={filteredData ?? []} 
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
