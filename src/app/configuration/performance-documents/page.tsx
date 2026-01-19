

'use client';

import { useReducer, useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useToast } from '@/hooks/use-toast';
import type { PerformanceDocument as PerfDocType, ReviewPeriod, PerformanceCycle, Employee, PerformanceTemplate, EvaluationFlow, Eligibility, PerformanceTemplateSection, EmployeePerformanceDocument, GoalPlan, AppraiserMapping } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Label } from '@/components/ui/label';


export default function PerformanceDocumentsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    // Data Hooks
    const reviewPeriodsQuery = useMemoFirebase(() => collection(firestore, 'review_periods'), [firestore]);
    const { data: reviewPeriods } = useCollection<ReviewPeriod>(reviewPeriodsQuery);
    
    const performanceCyclesQuery = useMemoFirebase(() => collection(firestore, 'performance_cycles'), [firestore]);
    const { data: performanceCycles } = useCollection<PerformanceCycle>(performanceCyclesQuery);

    const goalPlansQuery = useMemoFirebase(() => collection(firestore, 'goal_plans'), [firestore]);
    const { data: goalPlans } = useCollection<GoalPlan>(goalPlansQuery);

    const performanceTemplatesQuery = useMemoFirebase(() => collection(firestore, 'performance_templates'), [firestore]);
    const { data: performanceTemplates } = useCollection<PerformanceTemplate>(performanceTemplatesQuery);

    const evaluationFlowsQuery = useMemoFirebase(() => collection(firestore, 'evaluation_flows'), [firestore]);
    const { data: evaluationFlows } = useCollection<EvaluationFlow>(evaluationFlowsQuery);

    const eligibilityQuery = useMemoFirebase(() => collection(firestore, 'eligibility_criteria'), [firestore]);
    const { data: eligibilityCriteria } = useCollection<Eligibility>(eligibilityQuery);

    const employeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
    const { data: employees } = useCollection<Employee>(employeesQuery);

    const performanceTemplateSectionsQuery = useMemoFirebase(() => collection(firestore, 'performance_template_sections'), [firestore]);
    const { data: performanceTemplateSections } = useCollection<PerformanceTemplateSection>(performanceTemplateSectionsQuery);
    
    const performanceDocumentsQuery = useMemoFirebase(() => collection(firestore, 'performance_documents'), [firestore]);
    const { data: performanceDocuments } = useCollection<PerfDocType>(performanceDocumentsQuery);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [performanceCycleId, setPerformanceCycleId] = useState<string>();
    const [performanceTemplateId, setPerformanceTemplateId] = useState<string>();
    const [evaluationFlowId, setEvaluationFlowId] = useState<string>();
    const [eligibilityId, setEligibilityId] = useState<string>();

    const selectedPerformanceCycle = useMemo(() => 
        performanceCycles?.find(c => c.id === performanceCycleId),
    [performanceCycleId, performanceCycles]);
    
    const goalPlanId = selectedPerformanceCycle?.goalPlanId;


    const resetForm = () => {
        setName('');
        setPerformanceCycleId(undefined);
        setPerformanceTemplateId(undefined);
        setEvaluationFlowId(undefined);
        setEligibilityId(undefined);
    }
    
    const handleOpenDialog = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
    };

    const isCreateDisabled = !name || !performanceCycleId || !goalPlanId || !performanceTemplateId || !evaluationFlowId || !eligibilityId;

    const handleCreateDocument = () => {
        if (isCreateDisabled) {
          toast({ title: "All fields are required", variant: "destructive" });
          return;
        }

        const isDuplicate = (performanceDocuments || []).some(
            (doc) => doc.name.toLowerCase() === name.toLowerCase()
        );

        if (isDuplicate) {
            toast({
                title: 'Duplicate Name',
                description: `A performance document with the name "${name}" already exists.`,
                variant: 'destructive',
            });
            return;
        }

        const allSectionIdsForTemplate = (performanceTemplateSections || [])
            .filter(s => s.performanceTemplateId === performanceTemplateId)
            .map(s => s.id);

        const newDoc: Omit<PerfDocType, 'id'> = {
          name,
          performanceCycleId: performanceCycleId!,
          goalPlanId: goalPlanId!,
          performanceTemplateId: performanceTemplateId!,
          sectionIds: allSectionIdsForTemplate,
          evaluationFlowId: evaluationFlowId!,
          eligibilityId: eligibilityId!,
          isLaunched: false,
        };
        
        const collRef = collection(firestore, 'performance_documents');
        addDocumentNonBlocking(collRef, newDoc);
        toast({ title: "Success", description: `Performance document "${name}" has been created.` });
        handleCloseDialog();
    };

     const handleLaunch = async (perfDoc: PerfDocType) => {
        if (!employees || !eligibilityCriteria) {
            toast({ title: "Data not loaded", description: "Employee or eligibility data is not available yet. Please try again in a moment.", variant: "destructive"});
            return;
        }

        const eligibility = eligibilityCriteria.find(e => e.id === perfDoc.eligibilityId);
        if (!eligibility) {
            toast({ title: "Eligibility criteria not found", variant: "destructive" });
            return;
        }

        const eligibleEmployees = employees.filter(employee => {
            return !eligibility.rules.some(rule => {
                let employeeValue: string | undefined;
                switch (rule.type) {
                    case 'Person Type':
                        employeeValue = employee.personType;
                        break;
                    case 'Department':
                        employeeValue = employee.department;
                        break;
                    case 'Legal Entity':
                        employeeValue = employee.entity;
                        break;
                }
                return employeeValue ? rule.values.includes(employeeValue) : false;
            });
        });

        if (eligibleEmployees.length === 0) {
            toast({ title: "No eligible employees found", description: "No employees matched the criteria for this document."});
            return;
        }

        const batch = writeBatch(firestore);
        
        for (const emp of eligibleEmployees) {
            const newEmployeeDocRef = doc(collection(firestore, 'employee_performance_documents'));
            const newDoc: Omit<EmployeePerformanceDocument, 'id'> = {
                performanceDocumentId: perfDoc.id,
                employeeId: emp.id,
                performanceCycleId: perfDoc.performanceCycleId,
                performanceTemplateId: perfDoc.performanceTemplateId,
                evaluationFlowId: perfDoc.evaluationFlowId,
                status: 'Not Started',
            };
            batch.set(newEmployeeDocRef, newDoc);

            // Create Primary Appraiser Mapping
            if (emp.workManager) {
                const primaryMappingRef = doc(collection(firestore, 'employee_appraiser_mappings'));
                const primaryMapping: Omit<AppraiserMapping, 'id'> = {
                    employeePersonNumber: emp.personNumber,
                    performanceCycleId: perfDoc.performanceCycleId,
                    appraiserType: 'Primary',
                    appraiserPersonNumber: emp.workManager,
                };
                batch.set(primaryMappingRef, primaryMapping);
            } else {
                 console.warn(`Could not find primary appraiser (work manager) for employee ${emp.personNumber}. Skipping primary appraiser mapping.`);
            }

            // Create Secondary Appraiser Mapping
            if (emp.homeManager) {
                const secondaryMappingRef = doc(collection(firestore, 'employee_appraiser_mappings'));
                const secondaryMapping: Omit<AppraiserMapping, 'id'> = {
                    employeePersonNumber: emp.personNumber,
                    performanceCycleId: perfDoc.performanceCycleId,
                    appraiserType: 'Secondary',
                    appraiserPersonNumber: emp.homeManager,
                };
                batch.set(secondaryMappingRef, secondaryMapping);
            }
        }

        const perfDocRef = doc(firestore, 'performance_documents', perfDoc.id);
        batch.update(perfDocRef, { isLaunched: true });

        try {
            await batch.commit();
            toast({ title: "Launch Successful", description: `${eligibleEmployees.length} documents have been created for eligible employees.`});
        } catch (error) {
            console.error("Error launching documents: ", error);
            toast({ title: "Launch Failed", description: "There was an error creating the employee documents.", variant: "destructive"});
        }
    };

    const getLookUpName = (type: 'reviewPeriod' | 'performanceCycle' | 'performanceTemplate' | 'goalPlan', id: string) => {
        switch(type) {
            case 'reviewPeriod': return reviewPeriods?.find(p => p.id === id)?.name || '';
            case 'performanceCycle':
                const cycle = performanceCycles?.find(c => c.id === id);
                if (!cycle) return '';
                const reviewPeriod = reviewPeriods?.find(p => p.id === cycle.reviewPeriodId);
                return `${cycle.name} (${reviewPeriod?.name || 'N/A'})`;
            case 'performanceTemplate': return performanceTemplates?.find(p => p.id === id)?.name || '';
            case 'goalPlan': return goalPlans?.find(p => p.id === id)?.name || '';
            default: return '';
        }
    }
    
    const tableColumns = useMemo(() => columns({ getLookUpName, onLaunch: handleLaunch }), [reviewPeriods, performanceCycles, performanceTemplates, employees, eligibilityCriteria]);

    return (
        <div className="container mx-auto py-10">
            <PageHeader
                title="Performance Documents"
                description="Manage all your performance documents here."
                onAddNew={handleOpenDialog}
            />
            <DataTable columns={tableColumns} data={performanceDocuments ?? []} />
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Assemble Performance Document</DialogTitle>
                        <DialogDescription>This is the core orchestration step where all previously defined components are integrated.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                        <Input placeholder="Performance Document Name" value={name} onChange={e => setName(e.target.value)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            <Select onValueChange={setPerformanceCycleId} value={performanceCycleId}><SelectTrigger><SelectValue placeholder="Select Performance Cycle"/></SelectTrigger><SelectContent>{(performanceCycles || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({getLookUpName('reviewPeriod', p.reviewPeriodId)})</SelectItem>)}</SelectContent></Select>
                            <Select onValueChange={setPerformanceTemplateId} value={performanceTemplateId}><SelectTrigger><SelectValue placeholder="Select Performance Template"/></SelectTrigger><SelectContent>{(performanceTemplates || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                            <Select onValueChange={setEvaluationFlowId} value={evaluationFlowId}><SelectTrigger><SelectValue placeholder="Attach Evaluation Flow"/></SelectTrigger><SelectContent>{(evaluationFlows || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                            <Select onValueChange={setEligibilityId} value={eligibilityId}><SelectTrigger><SelectValue placeholder="Attach Eligibility Criteria"/></SelectTrigger><SelectContent>{(eligibilityCriteria || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleCreateDocument} disabled={isCreateDisabled}>Create & Finalize Document</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
