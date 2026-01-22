
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, writeBatch, serverTimestamp, query, where } from 'firebase/firestore';
import type { EmployeePerformanceDocument, PerformanceTemplate, PerformanceTemplateSection, PerformanceDocument, Employee, PerformanceCycle, ReviewPeriod, AppraiserMapping, EvaluationFlow, EmployeeEvaluation, Goal } from '@/lib/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/app/components/config-flow/shared/star-rating';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useGlobalState } from '@/app/context/global-state-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function OtherEvaluationsDisplay({
  evals,
  section,
}: {
  evals: (EmployeeEvaluation & { evaluatorRole: string })[];
  section: PerformanceTemplateSection;
}) {
  if (evals.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4 pt-4 border-t">
      <h4 className="font-semibold text-muted-foreground">Other Evaluations for this Section</h4>
      {evals.map((e) => (
        <div key={e.id} className="space-y-2 rounded-md border bg-muted/50 p-4">
          <p className="font-medium text-sm">{e.evaluatorRole}</p>
          {section.enableSectionRatings && e.rating !== null && e.rating !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rating:</span>
              <StarRating count={section.ratingScale || 5} value={e.rating} onChange={() => {}} disabled />
            </div>
          )}
          {section.enableSectionComments && e.comment && (
             <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Comment:</p>
                <p className="text-sm whitespace-pre-wrap rounded-md bg-background p-3">{e.comment}</p>
             </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PerformanceGoalsContent({
    section,
    goals,
    isReadOnly,
    ratings,
    comments,
    onRatingChange,
    onCommentChange
}: {
    section: PerformanceTemplateSection,
    goals: Goal[],
    isReadOnly: boolean,
    ratings: Record<string, number>,
    comments: Record<string, string>,
    onRatingChange: (goalId: string, rating: number) => void,
    onCommentChange: (goalId: string, comment: string) => void,
}) {
    return (
        <div className="space-y-6">
            {goals.map(goal => (
                <Card key={goal.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30">
                        <CardTitle className="text-base font-semibold">{goal.name}</CardTitle>
                        <CardDescription>{goal.description}</CardDescription>
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
                                        <Label>Your Comments {section.itemCommentMandatory && !isReadOnly && <span className="text-destructive">*</span>}</Label>
                                        <Textarea
                                            value={comments[goal.id] || ''}
                                            onChange={(e) => onCommentChange(goal.id, e.target.value)}
                                            placeholder="Provide comments for this goal..."
                                            maxLength={section.maxLength}
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">Goal evaluation inputs are not enabled for this section.</p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
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
        if (!employeePerfDoc || !currentUserRole) return true; // Read-only if we don't know role
        if (currentUserRole === 'Worker' && employeePerfDoc.status !== 'Worker Self-Evaluation') return true;
        if ((currentUserRole === 'Primary' || currentUserRole === 'Secondary') && employeePerfDoc.status !== 'Manager Evaluation') return true;
        
        const myMapping = allMappingsForEmployee?.find(m => m.appraiserPersonNumber === personNumber);
        if (myMapping?.isCompleted) return true;

        return false;
    }, [employeePerfDoc, currentUserRole, allMappingsForEmployee, personNumber]);


    const evaluationsToShow = useMemo(() => {
        const evalsBySection: Record<string, (EmployeeEvaluation & { evaluatorRole: string })[]> = {};
        if (!allEvalsForDoc || !currentUserRole || !allMappingsForEmployee || !employee) return evalsBySection;

        const getEvaluatorRole = (evaluatorPersonNumber: string) => {
            if (evaluatorPersonNumber === employee.personNumber) return 'Worker';
            const mapping = allMappingsForEmployee.find(m => m.appraiserPersonNumber === evaluatorPersonNumber);
            return mapping?.appraiserType || 'Unknown';
        };

        for (const section of sections) {
            const permissions = section.permissions.find(p => p.role === currentUserRole);
            if (!permissions) continue;

            const visibleEvals = allEvalsForDoc.filter(ev => {
                if (ev.evaluatorPersonNumber === personNumber) return false; // Don't show my own
                
                const evaluatorRole = getEvaluatorRole(ev.evaluatorPersonNumber);

                if (evaluatorRole === 'Worker' && permissions.viewWorkerRatings) return true;
                if (evaluatorRole === 'Primary' && permissions.viewPrimaryAppraiserRatings) return true;
                if (evaluatorRole === 'Secondary' && permissions.viewSecondaryAppraiserRatings) return true;
                
                return false;
            }).map(ev => ({ ...ev, evaluatorRole: getEvaluatorRole(ev.evaluatorPersonNumber) }));

            evalsBySection[section.id] = visibleEvals;
        }
        return evalsBySection;
    }, [allEvalsForDoc, sections, currentUserRole, allMappingsForEmployee, employee, personNumber]);

    const isLoading = isLoadingDoc || !allMappingsForEmployee || !allEvalsForDoc || !evaluationFlow || !employee || isLoadingGoals;

    const handleRatingChange = (sectionId: string, rating: number) => {
        setRatings(prev => ({ ...prev, [sectionId]: rating }));
    };

    const handleCommentChange = (sectionId: string, comment: string) => {
        setComments(prev => ({ ...prev, [sectionId]: comment }));
    };
    
    const handleGoalRatingChange = (goalId: string, rating: number) => {
        setGoalRatings(prev => ({ ...prev, [goalId]: rating }));
    };

    const handleGoalCommentChange = (goalId: string, comment: string) => {
        setGoalComments(prev => ({ ...prev, [goalId]: comment }));
    };

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

            if (section.type === 'Performance Goals') {
                if (goals) {
                    for (const goal of goals) {
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
                    }
                }
            } else {
                 if (section.sectionRatingMandatory && (ratings[section.id] === undefined || ratings[section.id] === 0)) {
                    toast({ title: 'Validation Error', description: `Rating is mandatory for section: "${section.name}"`, variant: 'destructive'});
                    setIsSubmitting(false);
                    return;
                }
                if (section.sectionCommentMandatory && (!comments[section.id] || comments[section.id].trim() === '')) {
                    toast({ title: 'Validation Error', description: `Comment is mandatory for section: "${section.name}"`, variant: 'destructive'});
                    setIsSubmitting(false);
                    return;
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
            if (goals) {
                for (const goal of goals) {
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
                const myMapping = allMappingsForEmployee.find(m => m.appraiserPersonNumber === personNumber);
                if (myMapping) {
                    const mappingRef = doc(firestore, 'employee_appraiser_mappings', myMapping.id);
                    batch.update(mappingRef, { isCompleted: true });
                }
            }
            
            let shouldUpdateWorkflow = false;
            if (currentUserRole === 'Worker') {
                shouldUpdateWorkflow = true;
            } else if (currentUserRole === 'Primary') {
                const secondaryMappings = allMappingsForEmployee.filter(m => m.appraiserType === 'Secondary');
                const allSecondariesCompleted = secondaryMappings.every(m => m.isCompleted);
                if (allSecondariesCompleted) {
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
    
    if (!employeePerfDoc || !employee) {
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
            
            <Accordion type="multiple" defaultValue={sections.map(s => s.id)} className="w-full space-y-4">
                 {sections.map(section => (
                    <AccordionItem key={section.id} value={section.id} className="border rounded-lg bg-card">
                        <AccordionTrigger className="p-6 text-xl font-headline hover:no-underline">
                           {section.name}
                        </AccordionTrigger>
                        <AccordionContent className="p-6 pt-0">
                           <div className="space-y-6">
                                {section.type === 'Performance Goals' ? (
                                    <PerformanceGoalsContent
                                        section={section}
                                        goals={goals || []}
                                        isReadOnly={isReadOnly}
                                        ratings={goalRatings}
                                        comments={goalComments}
                                        onRatingChange={handleGoalRatingChange}
                                        onCommentChange={handleGoalCommentChange}
                                    />
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
                                                    <Label htmlFor={`comment-${section.id}`}>Your Comments {section.sectionCommentMandatory && !isReadOnly && <span className="text-destructive">*</span>}</Label>
                                                    <Textarea
                                                        id={`comment-${section.id}`}
                                                        value={comments[section.id] || ''}
                                                        onChange={(e) => handleCommentChange(section.id, e.target.value)}
                                                        placeholder="Provide your comments..."
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
                                <OtherEvaluationsDisplay evals={evaluationsToShow[section.id] || []} section={section} />
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                 ))}
            </Accordion>

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
