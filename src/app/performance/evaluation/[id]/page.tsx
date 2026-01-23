'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, writeBatch, serverTimestamp, query, where } from 'firebase/firestore';
import type { EmployeePerformanceDocument, PerformanceTemplate, PerformanceTemplateSection, PerformanceDocument, Employee, PerformanceCycle, ReviewPeriod, AppraiserMapping, EvaluationFlow, EmployeeEvaluation, Goal, AccessPermission } from '@/lib/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from 'next/link';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/app/components/config-flow/shared/star-rating';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useGlobalState } from '@/app/context/global-state-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { User, UserCheck, UserCog } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


function EvaluationStatusIcons({
  section,
  currentUserRole,
  allEvalsForDoc,
  allEmployees,
  allMappingsForEmployee,
  evaluatedEmployee,
}: {
  section: PerformanceTemplateSection;
  currentUserRole: string | null;
  allEvalsForDoc: EmployeeEvaluation[];
  allEmployees: Employee[];
  allMappingsForEmployee: AppraiserMapping[];
  evaluatedEmployee: Employee;
}) {
  const permissions = section.permissions.find(p => p.role === currentUserRole);

  const getEvaluatorInfo = (role: 'Worker' | 'Primary Appraiser' | 'Secondary Appraiser') => {
    let personNumber: string | undefined;
    let name: string | undefined;

    if (role === 'Worker') {
      if(currentUserRole === 'Worker') return { visible: false }; // Don't show self
      personNumber = evaluatedEmployee.personNumber;
      name = `${evaluatedEmployee.firstName} ${evaluatedEmployee.lastName}`;
    } else {
       if(currentUserRole === role) return { visible: false }; // Don't show self
      const mapping = allMappingsForEmployee.find(m => m.appraiserType === role);
      if (mapping) {
        personNumber = mapping.appraiserPersonNumber;
        const appraiser = allEmployees.find(e => e.personNumber === personNumber);
        if (appraiser) {
          name = `${appraiser.firstName} ${appraiser.lastName}`;
        }
      }
    }

    if (!personNumber) {
      return { visible: false };
    }
    
    const evaluation = allEvalsForDoc.find(e => 
      e.evaluatorPersonNumber === personNumber && 
      e.sectionId === section.id &&
      !e.goalId 
    );

    return {
      visible: true,
      hasData: !!evaluation,
      name: name || 'Unknown User',
      rating: evaluation?.rating,
      comment: evaluation?.comment,
    };
  };

  const workerInfo = getEvaluatorInfo('Worker');
  const primaryInfo = getEvaluatorInfo('Primary Appraiser');
  const secondaryInfo = getEvaluatorInfo('Secondary Appraiser');

  const iconMap = {
    Worker: <User className="h-5 w-5" />,
    'Primary Appraiser': <UserCheck className="h-5 w-5" />,
    'Secondary Appraiser': <UserCog className="h-5 w-5" />,
  };
  
  const rolesToShow: ('Worker' | 'Primary Appraiser' | 'Secondary Appraiser')[] = [];
  if (permissions?.viewWorkerRatings) rolesToShow.push('Worker');
  if (permissions?.viewPrimaryAppraiserRatings) rolesToShow.push('Primary Appraiser');
  if (permissions?.viewSecondaryAppraiserRatings) rolesToShow.push('Secondary Appraiser');

  const infos = {
      Worker: workerInfo,
      'Primary Appraiser': primaryInfo,
      'Secondary Appraiser': secondaryInfo
  }

  return (
    <div className="flex items-center gap-3">
      {rolesToShow.map(role => {
        const info = infos[role];
        if (!info.visible) return null;

        return (
            <Tooltip key={role}>
            <TooltipTrigger asChild>
                <span className={!info.hasData ? 'opacity-30' : ''}>{iconMap[role]}</span>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="max-w-xs w-full">
                <div className="space-y-2 p-1">
                    <p className="font-bold">{info.name || role}</p>
                    {info.hasData ? (
                        <>
                            {section.enableSectionRatings && info.rating !== undefined && info.rating !== null && (
                                <StarRating count={section.ratingScale || 5} value={info.rating} onChange={() => {}} disabled />
                            )}
                            {section.enableSectionComments && info.comment && (
                                <p className="text-sm whitespace-pre-wrap bg-muted/50 p-2 rounded-md">{info.comment}</p>
                            )}
                             {(!section.enableSectionRatings || info.rating === undefined || info.rating === null) && (!section.enableSectionComments || !info.comment) && (
                                <p className="text-sm text-muted-foreground">No rating or comment provided.</p>
                            )}
                        </>
                    ) : <p className="text-sm text-muted-foreground">Evaluation not yet submitted.</p>}
                </div>
            </TooltipContent>
            </Tooltip>
        )
      })}
    </div>
  );
}


function WorkerEvaluationDisplay({
    goal,
    section,
    workerRating,
    workerComment,
}: {
    goal: Goal,
    section: PerformanceTemplateSection,
    workerRating?: number,
    workerComment?: string,
}) {
    const hasWorkerEval = workerRating !== undefined || (workerComment && workerComment.trim() !== '');
    if (!hasWorkerEval) return null;

    return (
        <div className="mt-4 space-y-3 rounded-md border bg-amber-50 p-4 dark:bg-amber-950/50">
          <h5 className="font-semibold text-sm text-amber-800 dark:text-amber-300">Worker's Evaluation</h5>
          {section.enableItemRatings && workerRating !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rating:</span>
              <StarRating count={section.ratingScale || 5} value={workerRating} onChange={() => {}} disabled />
            </div>
          )}
          {section.enableItemComments && workerComment && (
             <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Comment:</p>
                <p className="text-sm whitespace-pre-wrap rounded-md bg-background p-3">{workerComment}</p>
             </div>
          )}
        </div>
    )
}

function PerformanceGoalsContent({
    section,
    goals,
    isReadOnly,
    ratings,
    comments,
    onRatingChange,
    onCommentChange,
    permissions,
    workerRatings,
    workerComments,
}: {
    section: PerformanceTemplateSection,
    goals: Goal[],
    isReadOnly: boolean,
    ratings: Record<string, number>,
    comments: Record<string, string>,
    onRatingChange: (goalId: string, rating: number) => void,
    onCommentChange: (goalId: string, comment: string) => void,
    permissions?: AccessPermission,
    workerRatings?: Record<string, number>,
    workerComments?: Record<string, string>,
}) {
    const workGoals = useMemo(() => goals.filter(g => g.type === 'Work'), [goals]);
    const homeGoals = useMemo(() => goals.filter(g => g.type === 'Home'), [goals]);

    const defaultTab = workGoals.length > 0 ? "work" : "home";

    const renderGoals = (goalsToRender: Goal[]) => {
        if (goalsToRender.length === 0) {
            return (
                <Card className="mt-4">
                    <CardContent className="p-6">
                        <p className="text-center text-muted-foreground">No goals of this type assigned.</p>
                    </CardContent>
                </Card>
            )
        }

        return (
            <div className="space-y-6 mt-4">
                {goalsToRender.map(goal => (
                    <Card key={goal.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/30">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <CardTitle className="text-base font-semibold">{goal.name}</CardTitle>
                                    <CardDescription>{goal.description}</CardDescription>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                                    <Badge variant="outline">Type: {goal.type}</Badge>
                                    {goal.weight !== undefined && <Badge variant="outline">Weight: {goal.weight}%</Badge>}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {(section.enableItemRatings || section.enableItemComments) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {section.enableItemRatings && (
                                        <div className="space-y-2">
                                            <Label>Your Rating {section.itemRatingMandatory && !isReadOnly && <span className="text-destructive">*</span>}</Label>
                                            <StarRating
                                                count={section.ratingScale || 5}
                                                value={ratings[goal.id] || 0}
                                                onChange={(value) => onRatingChange(goal.id, value)}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                    )}
                                    {section.enableItemComments && (
                                        <div className="space-y-2">
                                            <Label>
                                                Your Comments {section.itemCommentMandatory && !isReadOnly && <span className="text-destructive">*</span>}
                                                {((section.itemCommentMinLength && section.itemCommentMinLength > 0) || section.itemCommentMaxLength) &&
                                                    <span className="text-muted-foreground font-normal text-xs ml-2">
                                                        (Min: {section.itemCommentMinLength ?? 0}, Max: {section.itemCommentMaxLength ?? 'N/A'})
                                                    </span>
                                                }
                                            </Label>
                                            <Textarea
                                                value={comments[goal.id] || ''}
                                                onChange={(e) => onCommentChange(goal.id, e.target.value)}
                                                placeholder="Provide comments for this goal..."
                                                minLength={section.itemCommentMinLength}
                                                maxLength={section.itemCommentMaxLength}
                                                disabled={isReadOnly}
                                            />
                                            <p className="text-sm text-muted-foreground text-right">
                                                {comments[goal.id]?.length || 0} / {section.itemCommentMaxLength}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center">Goal evaluation inputs are not enabled for this section.</p>
                            )}
                            {permissions?.viewWorkerRatings && (
                                <WorkerEvaluationDisplay
                                    goal={goal}
                                    section={section}
                                    workerRating={workerRatings?.[goal.id]}
                                    workerComment={workerComments?.[goal.id]}
                                />
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList>
                <TabsTrigger value="work" disabled={workGoals.length === 0}>Work Goals ({workGoals.length})</TabsTrigger>
                <TabsTrigger value="home" disabled={homeGoals.length === 0}>Home Goals ({homeGoals.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="work">
                {renderGoals(workGoals)}
            </TabsContent>
            <TabsContent value="home">
                {renderGoals(homeGoals)}
            </TabsContent>
        </Tabs>
    );
}


export default function EvaluationPage() {
    const params = useParams();
    const router = useRouter();
    const documentId = params.id as string;
    const firestore = useFirestore();
    const { personNumber } = useGlobalState();
    const { toast } = useToast();

    // State for evaluation inputs
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [comments, setComments] = useState<Record<string, string>>({});
    const [goalRatings, setGoalRatings] = useState<Record<string, number>>({});
    const [goalComments, setGoalComments] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Get the EmployeePerformanceDocument and its relations
    const employeePerfDocRef = useMemoFirebase(() => documentId ? doc(firestore, 'employee_performance_documents', documentId) : null, [firestore, documentId]);
    const { data: employeePerfDoc, isLoading: isLoadingDoc } = useDoc<EmployeePerformanceDocument>(employeePerfDocRef);
    
    const employeeRef = useMemoFirebase(() => employeePerfDoc ? doc(firestore, 'employees', employeePerfDoc.employeeId) : null, [firestore, employeePerfDoc]);
    const { data: employee } = useDoc<Employee>(employeeRef);

    const perfCycleRef = useMemoFirebase(() => employeePerfDoc ? doc(firestore, 'performance_cycles', employeePerfDoc.performanceCycleId) : null, [firestore, employeePerfDoc]);
    const { data: perfCycle } = useDoc<PerformanceCycle>(perfCycleRef);

    const reviewPeriodRef = useMemoFirebase(() => perfCycle ? doc(firestore, 'review_periods', perfCycle.reviewPeriodId) : null, [firestore, perfCycle]);
    const { data: reviewPeriod } = useDoc<ReviewPeriod>(reviewPeriodRef);

    const perfDocRef = useMemoFirebase(() => employeePerfDoc ? doc(firestore, 'performance_documents', employeePerfDoc.performanceDocumentId) : null, [firestore, employeePerfDoc]);
    const { data: performanceDocument } = useDoc<PerformanceDocument>(perfDocRef);

    const evalFlowRef = useMemoFirebase(() => employeePerfDoc ? doc(firestore, 'evaluation_flows', employeePerfDoc.evaluationFlowId) : null, [firestore, employeePerfDoc]);
    const { data: evaluationFlow } = useDoc<EvaluationFlow>(evalFlowRef);
    
    const allEmployeesQuery = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
    const { data: allEmployees, isLoading: isLoadingAllEmployees } = useCollection<Employee>(allEmployeesQuery);
    
    // 2. Get sections for the template
    const sectionsQuery = useMemoFirebase(() => employeePerfDoc ? collection(firestore, 'performance_template_sections') : null, [firestore, employeePerfDoc]);
    const { data: allSections } = useCollection<PerformanceTemplateSection>(sectionsQuery);
    
    const sections = useMemo(() => {
        if (!allSections || !employeePerfDoc) return [];
        return allSections
            .filter(section => section.performanceTemplateId === employeePerfDoc.performanceTemplateId)
            .sort((a, b) => a.order - b.order);
    }, [allSections, employeePerfDoc]);
    
    // 3. Get goals for the employee
    const goalsQuery = useMemoFirebase(() =>
        (perfCycle && employee?.technologist_type)
        ? query(
            collection(firestore, 'goals'),
            where('goalPlanId', '==', perfCycle.goalPlanId),
            where('technologist_type', '==', employee.technologist_type)
        )
        : null,
    [firestore, perfCycle, employee?.technologist_type]);
    const { data: goals, isLoading: isLoadingGoals } = useCollection<Goal>(goalsQuery);

    // 4. Get all appraiser mappings for the employee in this cycle
    const allMappingsForEmployeeQuery = useMemoFirebase(() => 
        (employee && perfCycle) 
        ? query(
            collection(firestore, 'employee_appraiser_mappings'),
            where('employeePersonNumber', '==', employee.personNumber),
            where('performanceCycleId', '==', perfCycle.id)
          ) 
        : null, 
    [firestore, employee, perfCycle]);
    const { data: allMappingsForEmployee } = useCollection<AppraiserMapping>(allMappingsForEmployeeQuery);

    // 5. Get all evaluations for this document
    const allEvalsForDocQuery = useMemoFirebase(() => documentId ? query(collection(firestore, 'evaluations'), where('employeePerformanceDocumentId', '==', documentId)) : null, [firestore, documentId]);
    const { data: allEvalsForDoc } = useCollection<EmployeeEvaluation>(allEvalsForDocQuery);

    // Derived State
    const currentUserRole = useMemo(() => {
        if (!personNumber || !employee || !allMappingsForEmployee) return null;
        if (personNumber === employee.personNumber) return 'Worker';
        const mapping = allMappingsForEmployee.find(m => m.appraiserPersonNumber === personNumber);
        return mapping?.appraiserType || null; // 'Primary' or 'Secondary'
    }, [personNumber, employee, allMappingsForEmployee]);
    
    const myMapping = useMemo(() => {
        if (!currentUserRole || currentUserRole === 'Worker' || !allMappingsForEmployee) return null;
        return allMappingsForEmployee.find(m => m.appraiserPersonNumber === personNumber) || null;
    }, [currentUserRole, allMappingsForEmployee, personNumber]);

    const filteredGoals = useMemo(() => {
        if (!goals) return [];
        // Workers and anyone without a specific appraiser role see all goals for the employee's type
        if (currentUserRole !== 'Primary' && currentUserRole !== 'Secondary') {
            return goals;
        }
        if (!myMapping) {
            // An appraiser with no specific mapping for this employee/cycle sees nothing
            return [];
        }
        const allowedTypes = myMapping.evalGoalTypes.split(','); // "Work,Home" -> ["Work", "Home"]
        return goals.filter(goal => allowedTypes.includes(goal.type));
    }, [goals, currentUserRole, myMapping]);

    const workerEvals = useMemo(() => {
        if (!allEvalsForDoc || !employee) return [];
        return allEvalsForDoc.filter(e => e.evaluatorPersonNumber === employee.personNumber);
    }, [allEvalsForDoc, employee]);

    const workerGoalRatings = useMemo(() => {
        const ratings: Record<string, number> = {};
        workerEvals.filter(e => e.goalId && e.rating !== undefined && e.rating !== null).forEach(e => {
            ratings[e.goalId!] = e.rating!;
        });
        return ratings;
    }, [workerEvals]);

    const workerGoalComments = useMemo(() => {
        const comments: Record<string, string> = {};
        workerEvals.filter(e => e.goalId && e.comment).forEach(e => {
            comments[e.goalId!] = e.comment!;
        });
        return comments;
    }, [workerEvals]);


    // Pre-fill state with existing evaluations for the current user
    useEffect(() => {
        if (allEvalsForDoc && personNumber) {
            const myEvals = allEvalsForDoc.filter(ev => ev.evaluatorPersonNumber === personNumber);
            const initialRatings: Record<string, number> = {};
            const initialComments: Record<string, string> = {};
            const initialGoalRatings: Record<string, number> = {};
            const initialGoalComments: Record<string, string> = {};

            for (const evalDoc of myEvals) {
                if (evalDoc.goalId) { // This is a goal evaluation
                    if (evalDoc.rating) initialGoalRatings[evalDoc.goalId] = evalDoc.rating;
                    if (evalDoc.comment) initialGoalComments[evalDoc.goalId] = evalDoc.comment;
                } else { // This is a section evaluation
                    if (evalDoc.rating) initialRatings[evalDoc.sectionId] = evalDoc.rating;
                    if (evalDoc.comment) initialComments[evalDoc.sectionId] = evalDoc.comment;
                }
            }
            setRatings(initialRatings);
            setComments(initialComments);
            setGoalRatings(initialGoalRatings);
            setGoalComments(initialGoalComments);
        }
    }, [allEvalsForDoc, personNumber]);

    const isReadOnly = useMemo(() => {
        if (!employeePerfDoc || !currentUserRole) return true;

        if (currentUserRole === 'Worker') {
            return employeePerfDoc.status !== 'Worker Self-Evaluation';
        }

        // For all appraiser roles, they must be in the Manager Evaluation step to write.
        if (employeePerfDoc.status !== 'Manager Evaluation') {
            return true;
        }
        
        if (currentUserRole === 'Primary') {
            // The Primary Appraiser can always edit during the Manager Evaluation step.
            return false;
        }

        if (currentUserRole === 'Secondary') {
            // Secondary appraisers are locked out after they submit their evaluation.
            return myMapping?.isCompleted ?? false;
        }
        
        // Default to read-only for any other role or unhandled cases.
        return true;
    }, [employeePerfDoc, currentUserRole, myMapping]);

    const isLoading = isLoadingDoc || !allMappingsForEmployee || !allEvalsForDoc || !evaluationFlow || !employee || isLoadingGoals || isLoadingAllEmployees;

    const handleRatingChange = useCallback((sectionId: string, rating: number) => {
        setRatings(prev => ({ ...prev, [sectionId]: rating }));
    }, [setRatings]);

    const handleCommentChange = (sectionId: string, comment: string) => {
        setComments(prev => ({ ...prev, [sectionId]: comment }));
    };
    
    const handleGoalRatingChange = (goalId: string, rating: number) => {
        setGoalRatings(prev => ({ ...prev, [goalId]: rating }));
    };

    const handleGoalCommentChange = (goalId: string, comment: string) => {
        setGoalComments(prev => ({ ...prev, [goalId]: comment }));
    };
    
    // This effect will handle automatic section rating calculation
    useEffect(() => {
        const perfGoalsSection = sections.find(s => s.type === 'Performance Goals' && s.ratingCalculationMethod === 'Automatic');
        
        if (perfGoalsSection && goals) {
            let calculatedRatingValue = 0;
            
            for (const goal of goals) {
                const rating = goalRatings[goal.id];
                const weight = goal.weight;
                if (rating && typeof weight === 'number') {
                    calculatedRatingValue += rating * (weight / 100);
                }
            }

            const finalRating = Math.round(calculatedRatingValue);
            
            if (ratings[perfGoalsSection.id] !== finalRating) {
                handleRatingChange(perfGoalsSection.id, finalRating);
            }
        }
    }, [goalRatings, goals, sections, handleRatingChange, ratings]);


    const handleSubmit = async () => {
        setIsSubmitting(true);

        if (!employeePerfDoc || !evaluationFlow || !currentUserRole || !allMappingsForEmployee) {
             toast({ title: 'Error', description: 'Core data could not be loaded. Cannot submit.', variant: 'destructive'});
             setIsSubmitting(false);
             return;
        }

        // Validation
        for (const section of sections) {
            const permissions = section.permissions.find(p => p.role === currentUserRole);
            if (!permissions?.rate) continue;

            if (section.enableSectionRatingMandatory && (ratings[section.id] === undefined || ratings[section.id] === 0)) {
                toast({ title: 'Validation Error', description: `Rating is mandatory for section: "${section.name}"`, variant: 'destructive'});
                setIsSubmitting(false);
                return;
            }
            if (section.sectionCommentMandatory && (!comments[section.id] || comments[section.id].trim() === '')) {
                toast({ title: 'Validation Error', description: `Comment is mandatory for section: "${section.name}"`, variant: 'destructive'});
                setIsSubmitting(false);
                return;
            }

            if (section.type === 'Performance Goals') {
                if (filteredGoals) {
                    for (const goal of filteredGoals) {
                        if (section.itemRatingMandatory && (goalRatings[goal.id] === undefined || goalRatings[goal.id] === 0)) {
                            toast({ title: 'Validation Error', description: `Rating is mandatory for goal: "${goal.name}"`, variant: 'destructive'});
                            setIsSubmitting(false);
                            return;
                        }
                        if (section.itemCommentMandatory && (!goalComments[goal.id] || goalComments[goal.id].trim() === '')) {
                             toast({ title: 'Validation Error', description: `Comment is mandatory for goal: "${goal.name}"`, variant: 'destructive'});
                            setIsSubmitting(false);
                            return;
                        }
                        const comment = goalComments[goal.id] || '';
                        if (section.enableItemComments && section.itemCommentMinLength && comment.length < section.itemCommentMinLength) {
                            toast({ title: 'Validation Error', description: `Comment for goal "${goal.name}" must be at least ${section.itemCommentMinLength} characters.`, variant: 'destructive'});
                            setIsSubmitting(false);
                            return;
                        }
                    }
                }
            }
        }
        
        try {
            const batch = writeBatch(firestore);

            // Add/update section evaluations
            for (const section of sections) {
                if (ratings[section.id] !== undefined || comments[section.id] !== undefined) {
                    const existingEval = allEvalsForDoc?.find(e => e.sectionId === section.id && !e.goalId && e.evaluatorPersonNumber === personNumber);
                    const evalRef = existingEval 
                        ? doc(firestore, 'evaluations', existingEval.id) 
                        : doc(collection(firestore, 'evaluations'));

                    batch.set(evalRef, {
                        employeePerformanceDocumentId: documentId,
                        sectionId: section.id,
                        evaluatorPersonNumber: personNumber,
                        appraiserType: currentUserRole,
                        rating: ratings[section.id] ?? null,
                        comment: comments[section.id] ?? '',
                        submittedAt: serverTimestamp(),
                    }, { merge: true });
                }
            }
            
             // Add/update goal evaluations
            if (filteredGoals) {
                for (const goal of filteredGoals) {
                    if (goalRatings[goal.id] !== undefined || goalComments[goal.id] !== undefined) {
                        const section = sections.find(s => s.type === 'Performance Goals');
                        if (section) {
                            const existingEval = allEvalsForDoc?.find(e => e.goalId === goal.id && e.evaluatorPersonNumber === personNumber);
                            const evalRef = existingEval
                                ? doc(firestore, 'evaluations', existingEval.id)
                                : doc(collection(firestore, 'evaluations'));

                            batch.set(evalRef, {
                                employeePerformanceDocumentId: documentId,
                                sectionId: section.id,
                                goalId: goal.id,
                                evaluatorPersonNumber: personNumber,
                                appraiserType: currentUserRole,
                                rating: goalRatings[goal.id] ?? null,
                                comment: goalComments[goal.id] ?? '',
                                submittedAt: serverTimestamp(),
                            }, { merge: true });
                        }
                    }
                }
            }

            // Update appraiser mapping status (if not worker)
            if (currentUserRole !== 'Worker') {
                if (myMapping) {
                    const mappingRef = doc(firestore, 'employee_appraiser_mappings', myMapping.id);
                    batch.update(mappingRef, { isCompleted: true });
                }
            }
            
            let shouldUpdateWorkflow = false;
            if (employeePerfDoc.status === 'Worker Self-Evaluation' && currentUserRole === 'Worker') {
                shouldUpdateWorkflow = true;
            } else if (employeePerfDoc.status === 'Manager Evaluation' && currentUserRole === 'Primary') {
                // The Primary Appraiser's submission triggers the workflow update,
                // but only if all other appraisers have already completed their part.
                const allOtherAppraisersCompleted = allMappingsForEmployee
                    .filter(m => m.appraiserPersonNumber !== personNumber)
                    .every(m => m.isCompleted);

                if (allOtherAppraisersCompleted) {
                    shouldUpdateWorkflow = true;
                }
            }
            
            if (shouldUpdateWorkflow) {
                const currentStatus = employeePerfDoc.status;
                const sortedSteps = [...evaluationFlow.steps].sort((a,b) => a.sequence - b.sequence);
                const currentStepIndex = sortedSteps.findIndex(step => step.task === currentStatus);

                if (currentStepIndex !== -1 && currentStepIndex < sortedSteps.length - 1) {
                    const nextStep = sortedSteps[currentStepIndex + 1];
                    batch.update(employeePerfDocRef, { status: nextStep.task });
                }
            }

            await batch.commit();

            toast({ title: 'Success', description: 'Your evaluation has been submitted.'});
            router.push('/performance');

        } catch (error) {
            console.error("Error submitting evaluation:", error);
            toast({ title: 'Submission Error', description: 'There was a problem submitting your evaluation.', variant: 'destructive'});
            setIsSubmitting(false);
        }
    };


    if (isLoading) {
        return <div className="container mx-auto py-10">Loading evaluation...</div>;
    }
    
    if (!employeePerfDoc || !employee || !allEmployees) {
        return <div className="container mx-auto py-10">Document not found or employee data missing.</div>;
    }

    const getCycleName = () => {
        if (!perfCycle || !reviewPeriod) return 'N/A';
        return `${perfCycle.name} (${reviewPeriod.name})`;
    }

    return (
        <div className="container mx-auto py-10 space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/performance">Performance</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>Evaluation</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <header>
                <h1 className="text-3xl font-bold font-headline">{performanceDocument?.name}</h1>
                <p className="text-muted-foreground">For {employee?.firstName} {employee?.lastName} - {getCycleName()}</p>
                <Badge>{employeePerfDoc.status}</Badge>
            </header>
            
            <TooltipProvider>
                <Accordion type="multiple" defaultValue={sections.map(s => s.id)} className="w-full space-y-4">
                    {sections.map(section => {
                        const isSectionRatingDisabled = isReadOnly || (section.type === 'Performance Goals' && section.ratingCalculationMethod === 'Automatic');
                        const permissions = section.permissions.find(p => p.role === currentUserRole);
                        return (
                            <AccordionItem key={section.id} value={section.id} className="border rounded-lg bg-card">
                                <AccordionTrigger className="p-6 text-xl font-headline hover:no-underline">
                                    <div className="flex justify-between items-center w-full">
                                        <span>{section.name}</span>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            {allEvalsForDoc && allMappingsForEmployee && allEmployees && (
                                                <EvaluationStatusIcons
                                                    section={section}
                                                    currentUserRole={currentUserRole}
                                                    allEvalsForDoc={allEvalsForDoc}
                                                    allEmployees={allEmployees}
                                                    allMappingsForEmployee={allMappingsForEmployee}
                                                    evaluatedEmployee={employee}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-6 pt-0">
                                <div className="space-y-6">
                                        {section.type === 'Performance Goals' ? (
                                            <>
                                                {(section.enableSectionRatings || section.enableSectionComments) && (
                                                    <Card>
                                                        <CardHeader>
                                                            <CardTitle>Overall Section Evaluation</CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="space-y-4">
                                                            {section.enableSectionRatings && (
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`rating-${section.id}`}>
                                                                        Your Rating {section.ratingCalculationMethod && `(${section.ratingCalculationMethod})`}
                                                                        {section.sectionRatingMandatory && !isReadOnly && <span className="text-destructive">*</span>}
                                                                    </Label>
                                                                    <StarRating
                                                                        count={section.ratingScale || 5}
                                                                        value={ratings[section.id] || 0}
                                                                        onChange={(value) => handleRatingChange(section.id, value)}
                                                                        disabled={isSectionRatingDisabled}
                                                                    />
                                                                </div>
                                                            )}
                                                            {section.enableSectionComments && (
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`comment-${section.id}`}>
                                                                        Your Comments {section.sectionCommentMandatory && !isReadOnly && <span className="text-destructive">*</span>}
                                                                        {((section.minLength && section.minLength > 0) || section.maxLength) &&
                                                                            <span className="text-muted-foreground font-normal text-xs ml-2">
                                                                                (Min: {section.minLength ?? 0}, Max: {section.maxLength ?? 'N/A'})
                                                                            </span>
                                                                        }
                                                                    </Label>
                                                                    <Textarea
                                                                        id={`comment-${section.id}`}
                                                                        value={comments[section.id] || ''}
                                                                        onChange={(e) => handleCommentChange(section.id, e.target.value)}
                                                                        placeholder="Provide your comments..."
                                                                        minLength={section.minLength}
                                                                        maxLength={section.maxLength}
                                                                        disabled={isReadOnly}
                                                                    />
                                                                    <p className="text-sm text-muted-foreground text-right">
                                                                        {comments[section.id]?.length || 0} / {section.maxLength}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                )}
                                                <PerformanceGoalsContent
                                                    section={section}
                                                    goals={filteredGoals || []}
                                                    isReadOnly={isReadOnly}
                                                    ratings={goalRatings}
                                                    comments={goalComments}
                                                    onRatingChange={handleGoalRatingChange}
                                                    onCommentChange={handleGoalCommentChange}
                                                    permissions={permissions}
                                                    workerRatings={workerGoalRatings}
                                                    workerComments={workerGoalComments}
                                                />
                                            </>
                                        ) : (
                                            (section.enableSectionRatings || section.enableSectionComments) ? (
                                                <div className="space-y-4">
                                                    {section.enableSectionRatings && (
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`rating-${section.id}`}>Your Rating {section.sectionRatingMandatory && !isReadOnly && <span className="text-destructive">*</span>}</Label>
                                                            <StarRating
                                                                count={section.ratingScale || 5}
                                                                value={ratings[section.id] || 0}
                                                                onChange={(value) => handleRatingChange(section.id, value)}
                                                                disabled={isReadOnly}
                                                            />
                                                        </div>
                                                    )}
                                                    {section.enableSectionComments && (
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`comment-${section.id}`}>
                                                                Your Comments {section.sectionCommentMandatory && !isReadOnly && <span className="text-destructive">*</span>}
                                                                {((section.minLength && section.minLength > 0) || section.maxLength) &&
                                                                    <span className="text-muted-foreground font-normal text-xs ml-2">
                                                                        (Min: {section.minLength ?? 0}, Max: {section.maxLength ?? 'N/A'})
                                                                    </span>
                                                                }
                                                            </Label>
                                                            <Textarea
                                                                id={`comment-${section.id}`}
                                                                value={comments[section.id] || ''}
                                                                onChange={(e) => handleCommentChange(section.id, e.target.value)}
                                                                placeholder="Provide your comments..."
                                                                minLength={section.minLength}
                                                                maxLength={section.maxLength}
                                                                disabled={isReadOnly}
                                                            />
                                                            <p className="text-sm text-muted-foreground text-right">
                                                                {comments[section.id]?.length || 0} / {section.maxLength}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No evaluation inputs are enabled for this section.</p>
                                            )
                                        )}
                                </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </TooltipProvider>

            <div className="flex justify-end mt-8">
                {!isReadOnly && (
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
                    </Button>
                )}
            </div>
        </div>
    );
}
