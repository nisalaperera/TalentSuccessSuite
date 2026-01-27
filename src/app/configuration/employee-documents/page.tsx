
'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, doc } from 'firebase/firestore';
import type { EmployeePerformanceDocument, PerformanceCycle, ReviewPeriod, Employee, PerformanceTemplate, AppraiserMapping, EvaluationFlow } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, ArrowUpWideNarrow } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Card, CardContent } from '@/components/ui/card';
import { EVALUATION_FLOW_PROCESS_PHASES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import type { Table as TanstackTable } from '@tanstack/react-table';

function EmployeeDocumentsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();
    const { toast } = useToast();

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
    
    const appraiserMappingsQuery = useMemoFirebase(() => collection(firestore, 'employee_appraiser_mappings'), [firestore]);
    const { data: allAppraiserMappings } = useCollection<AppraiserMapping>(appraiserMappingsQuery);

    const evaluationFlowsQuery = useMemoFirebase(() => collection(firestore, 'evaluation_flows'), [firestore]);
    const { data: evaluationFlows } = useCollection<EvaluationFlow>(evaluationFlowsQuery);
    
    // State for filter inputs, initialized from URL params
    const [selectedCycleId, setSelectedCycleId] = useState(searchParams.get('cycleId') || '');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(searchParams.get('employeeId') || '');
    const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');

    // Filters from URL for data filtering
    const cycleFilter = searchParams.get('cycleId');
    const employeeFilter = searchParams.get('employeeId');
    const statusFilter = searchParams.get('status');

    const handleSearch = () => {
        if (!selectedCycleId) {
            toast({
                title: "Required Field",
                description: "Please select a Performance Cycle to begin your search.",
                variant: "destructive",
            });
            return;
        }

        const params = new URLSearchParams();
        if (selectedCycleId && selectedCycleId !== 'all') params.set('cycleId', selectedCycleId);
        if (selectedEmployeeId && selectedEmployeeId !== 'all') params.set('employeeId', selectedEmployeeId);
        if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus);

        router.push(`/configuration/employee-documents?${params.toString()}`);
    };

    const clearFilters = () => {
        setSelectedCycleId('');
        setSelectedEmployeeId('');
        setSelectedStatus('');
        router.push('/configuration/employee-documents');
    };

    const employeeOptions = useMemo(() => {
        if (!employees) return [];
        return employees.map(emp => ({
            value: emp.id,
            label: `${emp.firstName} ${emp.lastName} (${emp.personNumber})`,
        }));
    }, [employees]);

    const getEmployeeName = (id: string) => {
        const emp = employees?.find(e => e.id === id);
        return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
    };

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
    
    const getTemplateName = (id: string) => performanceTemplates?.find(t => t.id === id)?.name || 'N/A';
    
    const getAppraisersForDocument = (doc: EmployeePerformanceDocument): AppraiserMapping[] => {
        if (!allAppraiserMappings || !employees) return [];
        const docEmployee = employees.find(e => e.id === doc.employeeId);
        if (!docEmployee) return [];

        return allAppraiserMappings.filter(
            (mapping) =>
                mapping.employeePersonNumber === docEmployee.personNumber &&
                mapping.performanceCycleId === doc.performanceCycleId
        ).sort((a, b) => { // Sort by Primary first
            if (a.appraiserType === 'Primary' && b.appraiserType !== 'Primary') return -1;
            if (a.appraiserType !== 'Primary' && b.appraiserType === 'Primary') return 1;
            return 0;
        });
    };

    const tableColumns = useMemo(() => columns({ getEmployeeName, getCycleName, getTemplateName, getAppraisersForDocument, getEmployeeNameByPersonNumber }), [employees, performanceCycles, reviewPeriods, performanceTemplates, allAppraiserMappings]);

    const filteredData = useMemo(() => {
        if (!employeeDocuments || !cycleFilter) return [];
        return employeeDocuments.filter(doc => {
            const cycleMatch = doc.performanceCycleId === cycleFilter;
            const employeeMatch = !employeeFilter || doc.employeeId === employeeFilter;
            const statusMatch = !statusFilter || doc.status === statusFilter;
            return cycleMatch && employeeMatch && statusMatch;
        });
    }, [employeeDocuments, cycleFilter, employeeFilter, statusFilter]);
    
    const hasActiveFilters = cycleFilter || employeeFilter || statusFilter;
    
    const handlePromoteStatus = async (table: TanstackTable<EmployeePerformanceDocument>) => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        if (selectedRows.length === 0) {
            toast({ title: "No documents selected", description: "Please select documents to promote.", variant: "destructive" });
            return;
        }

        const selectedDocs = selectedRows.map(row => row.original);
        const firstDoc = selectedDocs[0];
        const currentStatus = firstDoc.status;
        const currentCycleId = firstDoc.performanceCycleId;

        const allSameStatusAndCycle = selectedDocs.every(
            doc => doc.status === currentStatus && doc.performanceCycleId === currentCycleId
        );

        if (!allSameStatusAndCycle) {
            toast({ title: "Inconsistent Selection", description: "All selected documents must have the same status and performance cycle.", variant: "destructive" });
            return;
        }

        const flow = evaluationFlows?.find(f => f.id === firstDoc.evaluationFlowId);
        if (!flow) {
            toast({ title: "Workflow Error", description: "Could not find the evaluation flow for the selected documents.", variant: "destructive" });
            return;
        }
        
        const sortedSteps = [...flow.steps].sort((a,b) => a.sequence - b.sequence);
        const currentStepIndex = sortedSteps.findIndex(step => step.task === currentStatus);

        if (currentStepIndex === -1) {
            toast({ title: "Workflow Error", description: "Could not determine current workflow step.", variant: "destructive" });
            return;
        }

        const currentStep = sortedSteps[currentStepIndex];
        const nextStep = sortedSteps.find(step => step.sequence > currentStep.sequence);

        if (!nextStep) {
            toast({ title: "Workflow End", description: "The selected documents are already at the final step of the workflow.", variant: "destructive" });
            return;
        }
        
        const nextStatus = nextStep.task;

        try {
            const batch = writeBatch(firestore);
            selectedDocs.forEach(docToUpdate => {
                const docRef = doc(firestore, 'employee_performance_documents', docToUpdate.id);
                batch.update(docRef, { status: nextStatus });
            });
            await batch.commit();

            toast({ title: "Success", description: `${selectedDocs.length} document(s) have been promoted to "${nextStatus}".`});
            table.resetRowSelection();
        } catch (error) {
            console.error("Error promoting documents:", error);
            toast({ title: "Update Failed", description: "An error occurred while updating the document statuses.", variant: "destructive" });
        }
    };
    
    const toolbarActions = (table: TanstackTable<EmployeePerformanceDocument>) => (
        <Button
            onClick={() => handlePromoteStatus(table)}
            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
            size="sm"
        >
            <ArrowUpWideNarrow className="mr-2 h-4 w-4" />
            Promote Status
        </Button>
    );

    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Employee Performance Documents"
                description="Search for launched employee performance documents."
                showAddNew={false}
            />

            <div className="flex flex-wrap items-center gap-4 mb-4">
                <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
                    <SelectTrigger className="w-full sm:w-auto flex-grow md:flex-grow-0 md:w-[250px]">
                        <SelectValue placeholder="Select Performance Cycle... (Required)" />
                    </SelectTrigger>
                    <SelectContent>
                        {(performanceCycles || []).map(cycle => (
                            <SelectItem key={cycle.id} value={cycle.id}>{getCycleName(cycle.id)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Combobox
                    options={employeeOptions}
                    value={selectedEmployeeId}
                    onChange={setSelectedEmployeeId}
                    placeholder="Filter by Employee..."
                    searchPlaceholder="Search employees..."
                    noResultsText="No employees found."
                    triggerClassName="w-full sm:w-auto flex-grow md:flex-grow-0 md:w-[250px]"
                />
                 <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full sm:w-auto flex-grow md:flex-grow-0 md:w-[250px]">
                        <SelectValue placeholder="Filter by Status..." />
                    </SelectTrigger>
                    <SelectContent>
                         <SelectItem value="all">All Statuses</SelectItem>
                        {EVALUATION_FLOW_PROCESS_PHASES.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                
                <Button onClick={handleSearch}>Search</Button>

                {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                        <X className="mr-2 h-4 w-4" />
                        Clear Search
                    </Button>
                )}
            </div>

            {cycleFilter ? (
                <DataTable 
                    columns={tableColumns} 
                    data={filteredData} 
                    toolbarActions={toolbarActions}
                />
            ) : (
                <Card className="mt-6">
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">Please select a Performance Cycle and click Search to view documents.</p>
                    </CardContent>
                </Card>
            )}
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
