'use client';

import { useReducer, useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { DataTable } from '@/app/components/data-table/data-table';
import { columns } from './columns';
import { useToast } from '@/hooks/use-toast';
import type { PerformanceDocument as PerfDocType, ReviewPeriod, PerformanceCycle, Employee, PerformanceTemplate, EvaluationFlow, Eligibility, PerformanceTemplateSection, EmployeePerformanceDocument, GoalPlan, AppraiserMapping, TechnologistWeight } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';


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

    const technologistWeightsQuery = useMemoFirebase(() => collection(firestore, 'technologist_weights'), [firestore]);
    const { data: technologistWeights } = useCollection<TechnologistWeight>(technologistWeightsQuery);
    
    const employeePerfDocsQuery = useMemoFirebase(() => collection(firestore, 'employee_performance_documents'), [firestore]);
    const { data: employeePerformanceDocs } = useCollection<EmployeePerformanceDocument>(employeePerfDocsQuery);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [performanceCycleId, setPerformanceCycleId] = useState<string>();
    const [performanceTemplateId, setPerformanceTemplateId] = useState<string>();
    const [evaluationFlowId, setEvaluationFlowId] = useState<string>();
    const [eligibilityId, setEligibilityId] = useState<string>();
    
    // Add Employee Dialog State
    const [docToAddEmployeeTo, setDocToAddEmployeeTo] = useState<PerfDocType | null>(null);
    const [selectedEmployeeIdToAdd, setSelectedEmployeeIdToAdd] = useState<string | null>(null);
    const [isAddingEmployee, setIsAddingEmployee] = useState(false);

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
        if (!employees || !eligibilityCriteria || !evaluationFlows || !technologistWeights) {
            toast({ title: "Data not loaded", description: "Core data is not available yet. Please try again in a moment.", variant: "destructive"});
            return;
        }

        const eligibility = eligibilityCriteria.find(e => e.id === perfDoc.eligibilityId);
        if (!eligibility) {
            toast({ title: "Eligibility criteria not found", variant: "destructive" });
            return;
        }
        
        const evaluationFlow = evaluationFlows.find(f => f.id === perfDoc.evaluationFlowId);
        if (!evaluationFlow) {
            toast({ title: "Evaluation flow not found", variant: "destructive" });
            return;
        }

        const sortedSteps = [...evaluationFlow.steps].sort((a,b) => a.sequence - b.sequence);
        const firstStep = sortedSteps[0];
        
        if (!firstStep) {
            toast({ title: "Evaluation flow has no steps", variant: "destructive" });
            return;
        }

        const initialStatus = firstStep.task;


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
                status: initialStatus,
            };
            batch.set(newEmployeeDocRef, newDoc);

            // Determine appraisers based on technologist type
            const empTechnologistType = emp.technologist_type || 'JUNIOR';
            const weightConfig = technologistWeights.find(w => w.technologist_type === empTechnologistType);

            if (!weightConfig) {
                console.warn(`No weight configuration found for technologist type: ${empTechnologistType}. Skipping appraiser mapping for employee ${emp.personNumber}.`);
                continue;
            }

            const primaryAppraiserRole = weightConfig.primaryAppraiser;
            const secondaryAppraiserRole = weightConfig.secondaryAppraiser;

            const primaryAppraiserPersonNumber = primaryAppraiserRole === 'Work Manager' ? emp.workManager : emp.homeManager;
            const primaryEvalGoalType = primaryAppraiserRole === 'Work Manager' ? 'Work' : 'Home';
            
            const secondaryAppraiserPersonNumber = secondaryAppraiserRole === 'Work Manager' ? emp.workManager : emp.homeManager;
            const secondaryEvalGoalType = secondaryAppraiserRole === 'Work Manager' ? 'Work' : 'Home';

            // If the same person is both primary and secondary, create a single combined mapping
            if (primaryAppraiserPersonNumber && primaryAppraiserPersonNumber === secondaryAppraiserPersonNumber) {
                const mappingRef = doc(collection(firestore, 'employee_appraiser_mappings'));
                const mapping: Omit<AppraiserMapping, 'id'> = {
                    employeePersonNumber: emp.personNumber,
                    performanceCycleId: perfDoc.performanceCycleId,
                    appraiserType: 'Primary', // Designate as Primary
                    appraiserPersonNumber: primaryAppraiserPersonNumber,
                    evalGoalTypes: 'Work,Home', // They evaluate both goal types
                    isCompleted: false,
                };
                batch.set(mappingRef, mapping);
            } else {
                // Otherwise, create separate mappings for each role
                if (primaryAppraiserPersonNumber) {
                    const primaryMappingRef = doc(collection(firestore, 'employee_appraiser_mappings'));
                    const primaryMapping: Omit<AppraiserMapping, 'id'> = {
                        employeePersonNumber: emp.personNumber,
                        performanceCycleId: perfDoc.performanceCycleId,
                        appraiserType: 'Primary',
                        appraiserPersonNumber: primaryAppraiserPersonNumber,
                        evalGoalTypes: primaryEvalGoalType,
                        isCompleted: false,
                    };
                    batch.set(primaryMappingRef, primaryMapping);
                } else {
                     console.warn(`Could not find primary appraiser (${primaryAppraiserRole}) for employee ${emp.personNumber}. Skipping primary appraiser mapping.`);
                }

                if (secondaryAppraiserPersonNumber) {
                    const secondaryMappingRef = doc(collection(firestore, 'employee_appraiser_mappings'));
                    const secondaryMapping: Omit<AppraiserMapping, 'id'> = {
                        employeePersonNumber: emp.personNumber,
                        performanceCycleId: perfDoc.performanceCycleId,
                        appraiserType: 'Secondary',
                        appraiserPersonNumber: secondaryAppraiserPersonNumber,
                        evalGoalTypes: secondaryEvalGoalType,
                        isCompleted: false,
                    };
                    batch.set(secondaryMappingRef, secondaryMapping);
                } else {
                    console.warn(`Could not find secondary appraiser (${secondaryAppraiserRole}) for employee ${emp.personNumber}. Skipping secondary appraiser mapping.`);
                }
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
    
    const handleOpenAddEmployeeDialog = (doc: PerfDocType) => {
        setDocToAddEmployeeTo(doc);
        setSelectedEmployeeIdToAdd(null);
        setIsAddEmployeeDialogOpen(true);
    };

    const handleAddEmployeeProceed = async () => {
        if (!selectedEmployeeIdToAdd || !docToAddEmployeeTo || !employees || !evaluationFlows || !technologistWeights) {
            toast({ title: 'Error', description: 'Required data is missing to proceed.', variant: 'destructive' });
            return;
        }

        setIsAddingEmployee(true);

        const employeeToAdd = employees.find(e => e.id === selectedEmployeeIdToAdd);
        if (!employeeToAdd) {
            toast({ title: 'Error', description: 'Selected employee not found.', variant: 'destructive' });
            setIsAddingEmployee(false);
            return;
        }
        
        const evaluationFlow = evaluationFlows.find(f => f.id === docToAddEmployeeTo.evaluationFlowId);
        if (!evaluationFlow) {
            toast({ title: "Evaluation flow not found", variant: "destructive" });
            setIsAddingEmployee(false);
            return;
        }

        const sortedSteps = [...evaluationFlow.steps].sort((a, b) => a.sequence - b.sequence);
        const firstStep = sortedSteps[0];
        if (!firstStep) {
            toast({ title: "Evaluation flow has no steps", variant: "destructive" });
            setIsAddingEmployee(false);
            return;
        }
        const initialStatus = firstStep.task;

        try {
            const batch = writeBatch(firestore);

            const newEmployeeDocRef = doc(collection(firestore, 'employee_performance_documents'));
            const newDoc: Omit<EmployeePerformanceDocument, 'id'> = {
                performanceDocumentId: docToAddEmployeeTo.id,
                employeeId: employeeToAdd.id,
                performanceCycleId: docToAddEmployeeTo.performanceCycleId,
                performanceTemplateId: docToAddEmployeeTo.performanceTemplateId,
                evaluationFlowId: docToAddEmployeeTo.evaluationFlowId,
                status: initialStatus,
            };
            batch.set(newEmployeeDocRef, newDoc);

            const empTechnologistType = employeeToAdd.technologist_type || 'JUNIOR';
            const weightConfig = technologistWeights.find(w => w.technologist_type === empTechnologistType);
            
            if (weightConfig) {
                 const primaryAppraiserRole = weightConfig.primaryAppraiser;
                const secondaryAppraiserRole = weightConfig.secondaryAppraiser;
                const primaryAppraiserPersonNumber = primaryAppraiserRole === 'Work Manager' ? employeeToAdd.workManager : employeeToAdd.homeManager;
                const primaryEvalGoalType = primaryAppraiserRole === 'Work Manager' ? 'Work' : 'Home';
                const secondaryAppraiserPersonNumber = secondaryAppraiserRole === 'Work Manager' ? employeeToAdd.workManager : employeeToAdd.homeManager;
                const secondaryEvalGoalType = secondaryAppraiserRole === 'Work Manager' ? 'Work' : 'Home';
                
                if (primaryAppraiserPersonNumber && primaryAppraiserPersonNumber === secondaryAppraiserPersonNumber) {
                    const mappingRef = doc(collection(firestore, 'employee_appraiser_mappings'));
                    batch.set(mappingRef, { employeePersonNumber: employeeToAdd.personNumber, performanceCycleId: docToAddEmployeeTo.performanceCycleId, appraiserType: 'Primary', appraiserPersonNumber: primaryAppraiserPersonNumber, evalGoalTypes: 'Work,Home', isCompleted: false });
                } else {
                    if (primaryAppraiserPersonNumber) {
                        const primaryMappingRef = doc(collection(firestore, 'employee_appraiser_mappings'));
                        batch.set(primaryMappingRef, { employeePersonNumber: employeeToAdd.personNumber, performanceCycleId: docToAddEmployeeTo.performanceCycleId, appraiserType: 'Primary', appraiserPersonNumber: primaryAppraiserPersonNumber, evalGoalTypes: primaryEvalGoalType, isCompleted: false });
                    }
                    if (secondaryAppraiserPersonNumber) {
                        const secondaryMappingRef = doc(collection(firestore, 'employee_appraiser_mappings'));
                        batch.set(secondaryMappingRef, { employeePersonNumber: employeeToAdd.personNumber, performanceCycleId: docToAddEmployeeTo.performanceCycleId, appraiserType: 'Secondary', appraiserPersonNumber: secondaryAppraiserPersonNumber, evalGoalTypes: secondaryEvalGoalType, isCompleted: false });
                    }
                }
            }

            await batch.commit();
            toast({ title: 'Success', description: `${employeeToAdd.firstName} ${employeeToAdd.lastName} has been added to the performance document.`});
            setIsAddEmployeeDialogOpen(false);
        } catch(error) {
            console.error("Error manually adding employee:", error);
            toast({ title: 'Error', description: 'Failed to add employee.', variant: 'destructive'});
        } finally {
            setIsAddingEmployee(false);
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
    
    const tableColumns = useMemo(() => columns({ getLookUpName, onLaunch: handleLaunch, onAddEmployee: handleOpenAddEmployeeDialog }), [reviewPeriods, performanceCycles, performanceTemplates, employees, eligibilityCriteria, evaluationFlows, technologistWeights]);

    const availableEmployeeOptions = useMemo(() => {
        if (!employees || !docToAddEmployeeTo || !employeePerformanceDocs) return [];
        
        const assignedEmployeeIds = new Set(
            employeePerformanceDocs
                .filter(d => d.performanceDocumentId === docToAddEmployeeTo.id)
                .map(d => d.employeeId)
        );

        return [...employees]
            .filter(emp => !assignedEmployeeIds.has(emp.id))
            .sort((a, b) => a.personNumber.localeCompare(b.personNumber, undefined, { numeric: true }))
            .map(emp => ({
                value: emp.id,
                label: `${emp.firstName} ${emp.lastName} (${emp.personNumber})`,
            }));
    }, [employees, docToAddEmployeeTo, employeePerformanceDocs]);

    const eligibilityDetails = useMemo(() => {
        if (!docToAddEmployeeTo || !eligibilityCriteria) return null;
        return eligibilityCriteria.find(e => e.id === docToAddEmployeeTo.eligibilityId);
    }, [docToAddEmployeeTo, eligibilityCriteria]);

    const employeeToAdd = useMemo(() => 
        employees?.find(e => e.id === selectedEmployeeIdToAdd),
    [selectedEmployeeIdToAdd, employees]);

    const eligibilityEvaluation = useMemo(() => {
        if (!employeeToAdd || !eligibilityDetails) return null;
        
        const failingRules = eligibilityDetails.rules.filter(rule => {
            let employeeValue: string | undefined;
            switch (rule.type) {
                case 'Person Type': employeeValue = employeeToAdd.personType; break;
                case 'Department': employeeValue = employeeToAdd.department; break;
                case 'Legal Entity': employeeValue = employeeToAdd.entity; break;
            }
            return employeeValue ? rule.values.includes(employeeValue) : false;
        });

        return {
            isEligible: failingRules.length === 0,
            failingRules: failingRules
        };
    }, [employeeToAdd, eligibilityDetails]);


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

            <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Add Employee to: {docToAddEmployeeTo?.name}</DialogTitle>
                        <DialogDescription>
                            Select an employee to manually assign them to this performance document.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="employee-select">Employee</Label>
                            <Select 
                                value={selectedEmployeeIdToAdd || ''} 
                                onValueChange={setSelectedEmployeeIdToAdd}
                            >
                                <SelectTrigger id="employee-select">
                                    <SelectValue placeholder="Select an employee..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableEmployeeOptions.length > 0 ? availableEmployeeOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    )) : (
                                        <div className="p-2 text-sm text-muted-foreground text-center">No more employees available.</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedEmployeeIdToAdd && docToAddEmployeeTo && eligibilityDetails && eligibilityEvaluation && (
                            <Card className={eligibilityEvaluation.isEligible ? "border-green-200 bg-green-50/50" : "border-amber-200 bg-amber-50/50"}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-headline flex items-center gap-2">
                                            {eligibilityEvaluation.isEligible ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                            )}
                                            Eligibility Evaluation
                                        </CardTitle>
                                        <Badge variant={eligibilityEvaluation.isEligible ? "default" : "destructive"} className={eligibilityEvaluation.isEligible ? "bg-green-600 hover:bg-green-700" : ""}>
                                            {eligibilityEvaluation.isEligible ? 'Eligible' : 'Ineligible'}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {eligibilityEvaluation.isEligible 
                                            ? `${employeeToAdd?.firstName} ${employeeToAdd?.lastName} matches all defined eligibility criteria.`
                                            : `${employeeToAdd?.firstName} ${employeeToAdd?.lastName} is technically excluded by the rules, but you can still proceed manually.`
                                        }
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <div className="pt-2 border-t border-muted">
                                        <p className="font-semibold mb-1">Applied Rules ({eligibilityDetails.name}):</p>
                                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                            {eligibilityDetails.rules.length > 0 ? eligibilityDetails.rules.map(rule => {
                                                const isFailing = eligibilityEvaluation.failingRules.some(fr => fr.id === rule.id);
                                                return (
                                                    <li key={rule.id} className={isFailing ? "text-amber-700 font-medium" : ""}>
                                                        Exclude if <strong>{rule.type}</strong> is: [{rule.values.join(', ')}]
                                                        {isFailing && <span className="ml-2">(Violated: {rule.type} is "{
                                                            rule.type === 'Person Type' ? employeeToAdd?.personType :
                                                            rule.type === 'Department' ? employeeToAdd?.department :
                                                            employeeToAdd?.entity
                                                        }")</span>}
                                                    </li>
                                                );
                                            }) : <li>No specific exclusion rules defined.</li>}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddEmployeeDialogOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={handleAddEmployeeProceed} 
                            disabled={!selectedEmployeeIdToAdd || isAddingEmployee}
                        >
                            {isAddingEmployee ? 'Adding...' : 'Proceed'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
