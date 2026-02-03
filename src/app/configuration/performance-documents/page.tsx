'use client';

import { useReducer, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { CheckCircle2, AlertCircle, Search, CheckSquare, Square, Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export default function PerformanceDocumentsPage() {
    const firestore = useFirestore();
    const router = useRouter();
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
    const [selectedEmployeeIdsToAdd, setSelectedEmployeeIdsToAdd] = useState<string[]>([]);
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    const [isAddingEmployees, setIsAddingEmployees] = useState(false);

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
        setSelectedEmployeeIdsToAdd([]);
        setEmployeeSearchTerm('');
        setIsAddEmployeeDialogOpen(true);
    };

    const handleViewEmployeeDocs = (doc: PerfDocType) => {
        router.push(`/configuration/employee-documents?cycleId=${doc.performanceCycleId}`);
    };

    const handleAddEmployeeProceed = async () => {
        if (selectedEmployeeIdsToAdd.length === 0 || !docToAddEmployeeTo || !employees || !evaluationFlows || !technologistWeights) {
            toast({ title: 'Error', description: 'Required data or selections are missing to proceed.', variant: 'destructive' });
            return;
        }

        setIsAddingEmployees(true);

        const evaluationFlow = evaluationFlows.find(f => f.id === docToAddEmployeeTo.evaluationFlowId);
        if (!evaluationFlow) {
            toast({ title: "Evaluation flow not found", variant: "destructive" });
            setIsAddingEmployees(false);
            return;
        }

        const sortedSteps = [...evaluationFlow.steps].sort((a, b) => a.sequence - b.sequence);
        const firstStep = sortedSteps[0];
        if (!firstStep) {
            toast({ title: "Evaluation flow has no steps", variant: "destructive" });
            setIsAddingEmployees(false);
            return;
        }
        const initialStatus = firstStep.task;

        try {
            const batch = writeBatch(firestore);
            let addedCount = 0;

            for (const employeeId of selectedEmployeeIdsToAdd) {
                const employeeToAdd = employees.find(e => e.id === employeeId);
                if (!employeeToAdd) continue;

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
                addedCount++;
            }

            await batch.commit();
            toast({ title: 'Success', description: `${addedCount} employee(s) have been added to the performance document.`});
            setIsAddEmployeeDialogOpen(false);
        } catch(error) {
            console.error("Error manually adding employees:", error);
            toast({ title: 'Error', description: 'Failed to add employees.', variant: 'destructive'});
        } finally {
            setIsAddingEmployees(false);
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
    
    const tableColumns = useMemo(() => columns({ getLookUpName, onLaunch: handleLaunch, onAddEmployee: handleOpenAddEmployeeDialog, onViewEmployeeDocs: handleViewEmployeeDocs }), [reviewPeriods, performanceCycles, performanceTemplates, employees, eligibilityCriteria, evaluationFlows, technologistWeights]);

    const availableEmployees = useMemo(() => {
        if (!employees || !docToAddEmployeeTo || !employeePerformanceDocs) return [];
        
        const assignedEmployeeIds = new Set(
            employeePerformanceDocs
                .filter(d => d.performanceDocumentId === docToAddEmployeeTo.id)
                .map(d => d.employeeId)
        );

        return [...employees]
            .filter(emp => !assignedEmployeeIds.has(emp.id))
            .sort((a, b) => a.personNumber.localeCompare(b.personNumber, undefined, { numeric: true }));
    }, [employees, docToAddEmployeeTo, employeePerformanceDocs]);

    const filteredEmployees = useMemo(() => {
        return availableEmployees.filter(emp => 
            emp.firstName.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
            emp.lastName.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
            emp.personNumber.includes(employeeSearchTerm) ||
            emp.designation.toLowerCase().includes(employeeSearchTerm.toLowerCase())
        );
    }, [availableEmployees, employeeSearchTerm]);

    const eligibilityDetails = useMemo(() => {
        if (!docToAddEmployeeTo || !eligibilityCriteria) return null;
        return eligibilityCriteria.find(e => e.id === docToAddEmployeeTo.eligibilityId);
    }, [docToAddEmployeeTo, eligibilityCriteria]);

    const getEmployeeEligibility = (emp: Employee) => {
        if (!eligibilityDetails) return { isEligible: true, reasons: [] };

        const failingRules = eligibilityDetails.rules.filter(rule => {
            let employeeValue: string | undefined;
            switch (rule.type) {
                case 'Person Type': employeeValue = emp.personType; break;
                case 'Department': employeeValue = emp.department; break;
                case 'Legal Entity': employeeValue = emp.entity; break;
            }
            return employeeValue ? rule.values.includes(employeeValue) : false;
        });

        if (failingRules.length === 0) {
            return { isEligible: true, reasons: [] };
        }
        return { 
            isEligible: false, 
            reasons: failingRules.map(r => `Excluded because ${r.type} is "${emp[r.type === 'Person Type' ? 'personType' : r.type === 'Department' ? 'department' : 'entity']}"`)
        };
    };

    const eligibilitySummary = useMemo(() => {
        if (selectedEmployeeIdsToAdd.length === 0 || !eligibilityDetails || !employees) return null;
        
        let eligibleCount = 0;
        let ineligibleCount = 0;

        for (const employeeId of selectedEmployeeIdsToAdd) {
            const emp = employees.find(e => e.id === employeeId);
            if (!emp) continue;

            const { isEligible } = getEmployeeEligibility(emp);
            if (isEligible) eligibleCount++;
            else ineligibleCount++;
        }

        return {
            total: selectedEmployeeIdsToAdd.length,
            eligible: eligibleCount,
            ineligible: ineligibleCount
        };
    }, [selectedEmployeeIdsToAdd, eligibilityDetails, employees]);

    const handleToggleEmployee = (id: string) => {
        setSelectedEmployeeIdsToAdd(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllFiltered = () => {
        const filteredIds = filteredEmployees.map(e => e.id);
        setSelectedEmployeeIdsToAdd(prev => [...new Set([...prev, ...filteredIds])]);
    };

    const handleDeselectAllFiltered = () => {
        const filteredIds = new Set(filteredEmployees.map(e => e.id));
        setSelectedEmployeeIdsToAdd(prev => prev.filter(id => !filteredIds.has(id)));
    };


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

            <TooltipProvider>
                <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Add Employees to: {docToAddEmployeeTo?.name}</DialogTitle>
                            <DialogDescription>
                                Select one or more employees to manually assign them to this performance document.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search by name, person number..." 
                                            className="pl-9"
                                            value={employeeSearchTerm}
                                            onChange={e => setEmployeeSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={handleSelectAllFiltered} title="Select All Filtered">
                                            <CheckSquare className="h-4 w-4 mr-2" /> Select All
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={handleDeselectAllFiltered} title="Deselect All Filtered">
                                            <Square className="h-4 w-4 mr-2" /> Deselect All
                                        </Button>
                                    </div>
                                </div>

                                <Card className="border">
                                    <CardHeader className="py-3 px-4 border-b bg-muted/30">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Available Employees ({filteredEmployees.length})</CardTitle>
                                            <Badge variant="secondary">{selectedEmployeeIdsToAdd.length} selected</Badge>
                                        </div>
                                    </CardHeader>
                                    <ScrollArea className="h-[400px]">
                                        <div className="p-2 space-y-1">
                                            {filteredEmployees.length > 0 ? filteredEmployees.map(emp => {
                                                const { isEligible, reasons } = getEmployeeEligibility(emp);
                                                return (
                                                    <div 
                                                        key={emp.id} 
                                                        className={`flex items-center space-x-3 p-3 rounded-md hover:bg-accent cursor-pointer transition-colors ${selectedEmployeeIdsToAdd.includes(emp.id) ? 'bg-accent/50 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                                                        onClick={() => handleToggleEmployee(emp.id)}
                                                    >
                                                        <Checkbox 
                                                            id={`emp-${emp.id}`} 
                                                            checked={selectedEmployeeIdsToAdd.includes(emp.id)} 
                                                            onCheckedChange={() => handleToggleEmployee(emp.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                                                            <div className="col-span-2 font-medium text-sm">{emp.personNumber}</div>
                                                            <div className="col-span-4 flex items-center gap-2">
                                                                <span className="font-semibold text-sm">{emp.firstName} {emp.lastName}</span>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Info className={`h-4 w-4 cursor-help ${isEligible ? 'text-green-500' : 'text-amber-500'}`} />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="right" className="max-w-[300px]">
                                                                        <div className="space-y-1 p-1">
                                                                            <p className="font-bold text-sm">Eligibility Status: {isEligible ? 'Eligible' : 'Ineligible'}</p>
                                                                            {!isEligible && (
                                                                                <ul className="text-xs list-disc pl-4 space-y-1">
                                                                                    {reasons.map((r, i) => <li key={i}>{r}</li>)}
                                                                                </ul>
                                                                            )}
                                                                            {isEligible && <p className="text-xs text-muted-foreground">This employee matches all defined eligibility rules.</p>}
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                            <div className="col-span-6 flex flex-wrap gap-1 items-center">
                                                                <Badge variant="outline" className="text-[10px] py-0 h-5 bg-muted/50">{emp.personType}</Badge>
                                                                <Badge variant="outline" className="text-[10px] py-0 h-5 bg-muted/50 max-w-[120px] truncate">{emp.department}</Badge>
                                                                <Badge variant="outline" className="text-[10px] py-0 h-5 bg-muted/50 max-w-[120px] truncate">{emp.entity}</Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }) : (
                                                <div className="p-8 text-center text-muted-foreground">No matching employees found.</div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </Card>
                            </div>

                            {selectedEmployeeIdsToAdd.length > 0 && eligibilitySummary && (
                                <Card className={eligibilitySummary.ineligible === 0 ? "border-green-200 bg-green-50/50" : "border-amber-200 bg-amber-50/50"}>
                                    <CardHeader className="py-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-headline flex items-center gap-2">
                                                {eligibilitySummary.ineligible === 0 ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <AlertCircle className="h-5 w-5 text-amber-600" />
                                                )}
                                                Selection Eligibility Summary
                                            </CardTitle>
                                            <div className="flex gap-2">
                                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">{eligibilitySummary.eligible} Eligible</Badge>
                                                {eligibilitySummary.ineligible > 0 && (
                                                    <Badge variant="destructive">{eligibilitySummary.ineligible} Ineligible</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <CardDescription>
                                            {eligibilitySummary.ineligible === 0 
                                                ? `All ${eligibilitySummary.total} selected employees match the defined eligibility criteria.`
                                                : `${eligibilitySummary.ineligible} selected employees are technically excluded by rules, but you can still proceed manually.`
                                            }
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddEmployeeDialogOpen(false)}>Cancel</Button>
                            <Button 
                                onClick={handleAddEmployeeProceed} 
                                disabled={selectedEmployeeIdsToAdd.length === 0 || isAddingEmployees}
                            >
                                {isAddingEmployees ? 'Adding...' : `Proceed with ${selectedEmployeeIdsToAdd.length} employee(s)`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </TooltipProvider>
        </div>
    );
}
