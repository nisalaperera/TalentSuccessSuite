
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, writeBatch, serverTimestamp, query, where } from 'firebase/firestore';
import type { EmployeePerformanceDocument, PerformanceTemplate, PerformanceTemplateSection, PerformanceDocument, Employee, PerformanceCycle, ReviewPeriod, AppraiserMapping, EvaluationFlow } from '@/lib/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/app/components/config-flow/shared/star-rating';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useGlobalState } from '@/app/context/global-state-provider';
import { useToast } from '@/hooks/use-toast';

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
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Get the EmployeePerformanceDocument
    const employeePerfDocRef = useMemoFirebase(() => documentId ? doc(firestore, 'employee_performance_documents', documentId) : null, [firestore, documentId]);
    const { data: employeePerfDoc, isLoading: isLoadingDoc } = useDoc<EmployeePerformanceDocument>(employeePerfDocRef);

    // 2. Get related entities from IDs in EmployeePerformanceDocument
    const employeeRef = useMemoFirebase(() => employeePerfDoc ? doc(firestore, 'employees', employeePerfDoc.employeeId) : null, [firestore, employeePerfDoc]);
    const { data: employee, isLoading: isLoadingEmployee } = useDoc<Employee>(employeeRef);

    const perfCycleRef = useMemoFirebase(() => employeePerfDoc ? doc(firestore, 'performance_cycles', employeePerfDoc.performanceCycleId) : null, [firestore, employeePerfDoc]);
    const { data: perfCycle, isLoading: isLoadingCycle } = useDoc<PerformanceCycle>(perfCycleRef);

    const reviewPeriodRef = useMemoFirebase(() => perfCycle ? doc(firestore, 'review_periods', perfCycle.reviewPeriodId) : null, [firestore, perfCycle]);
    const { data: reviewPeriod, isLoading: isLoadingPeriod } = useDoc<ReviewPeriod>(reviewPeriodRef);

    const perfDocRef = useMemoFirebase(() => employeePerfDoc ? doc(firestore, 'performance_documents', employeePerfDoc.performanceDocumentId) : null, [firestore, employeePerfDoc]);
    const { data: performanceDocument, isLoading: isLoadingPerfDoc } = useDoc<PerformanceDocument>(perfDocRef);

    const evalFlowRef = useMemoFirebase(() => employeePerfDoc ? doc(firestore, 'evaluation_flows', employeePerfDoc.evaluationFlowId) : null, [firestore, employeePerfDoc]);
    const { data: evaluationFlow, isLoading: isLoadingFlow } = useDoc<EvaluationFlow>(evalFlowRef);


    // 3. Get all sections and filter
    const sectionsQuery = useMemoFirebase(() => employeePerfDoc ? collection(firestore, 'performance_template_sections') : null, [firestore, employeePerfDoc]);
    const { data: allSections, isLoading: isLoadingSections } = useCollection<PerformanceTemplateSection>(sectionsQuery);
    
    const sections = useMemo(() => {
        if (!allSections || !employeePerfDoc) return [];
        return allSections
            .filter(section => section.performanceTemplateId === employeePerfDoc.performanceTemplateId)
            .sort((a, b) => a.order - b.order);
    }, [allSections, employeePerfDoc]);

    // 4. Get relevant appraiser mapping to update status
    const appraiserMappingsQuery = useMemoFirebase(() => 
        (personNumber && employeePerfDoc) 
        ? query(
            collection(firestore, 'employee_appraiser_mappings'),
            where('appraiserPersonNumber', '==', personNumber),
            where('performanceCycleId', '==', employeePerfDoc.performanceCycleId)
          ) 
        : null, 
    [firestore, personNumber, employeePerfDoc]);

    const { data: appraiserMappings, isLoading: isLoadingMappings } = useCollection<AppraiserMapping>(appraiserMappingsQuery);


    const isLoading = isLoadingDoc || isLoadingEmployee || isLoadingCycle || isLoadingPeriod || isLoadingSections || isLoadingPerfDoc || isLoadingMappings || isLoadingFlow;

    const handleRatingChange = (sectionId: string, rating: number) => {
        setRatings(prev => ({ ...prev, [sectionId]: rating }));
    };

    const handleCommentChange = (sectionId: string, comment: string) => {
        setComments(prev => ({ ...prev, [sectionId]: comment }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        // 1. Validation
        for (const section of sections) {
            if (section.sectionRatingMandatory && (!ratings[section.id] || ratings[section.id] === 0)) {
                toast({ title: 'Validation Error', description: `Rating is mandatory for section: "${section.name}"`, variant: 'destructive'});
                setIsSubmitting(false);
                return;
            }
            if (section.sectionCommentMandatory && (!comments[section.id] || comments[section.id].trim() === '')) {
                toast({ title: 'Validation Error', description: `Comment is mandatory for section: "${section.name}"`, variant: 'destructive'});
                setIsSubmitting(false);
                return;
            }
            if (comments[section.id]) {
                const comment = comments[section.id];
                if (section.minLength && comment.length < section.minLength) {
                    toast({ title: 'Validation Error', description: `Comment for "${section.name}" must be at least ${section.minLength} characters.`, variant: 'destructive'});
                    setIsSubmitting(false);
                    return;
                }
                if (section.maxLength && comment.length > section.maxLength) {
                    toast({ title: 'Validation Error', description: `Comment for "${section.name}" cannot exceed ${section.maxLength} characters.`, variant: 'destructive'});
                    setIsSubmitting(false);
                    return;
                }
            }
        }
        
        if (Object.keys(ratings).length === 0 && Object.keys(comments).length === 0) {
            toast({ title: 'Nothing to Submit', description: 'Please provide at least one rating or comment.', variant: 'destructive'});
            setIsSubmitting(false);
            return;
        }

        try {
            if (!evaluationFlow) {
                toast({ title: 'Error', description: 'Evaluation flow configuration could not be loaded.', variant: 'destructive'});
                setIsSubmitting(false);
                return;
            }
            const batch = writeBatch(firestore);

            // 2. Add evaluations to batch
            for (const section of sections) {
                if (ratings[section.id] || comments[section.id]) {
                    const evaluationRef = doc(collection(firestore, 'evaluations'));
                    batch.set(evaluationRef, {
                        employeePerformanceDocumentId: documentId,
                        sectionId: section.id,
                        evaluatorPersonNumber: personNumber,
                        rating: ratings[section.id] || null,
                        comment: comments[section.id] || '',
                        submittedAt: serverTimestamp(),
                    });
                }
            }

            // 3. Update appraiser mapping status
            const relevantMapping = appraiserMappings?.find(m => m.employeePersonNumber === employee?.personNumber);
            if (relevantMapping) {
                const mappingRef = doc(firestore, 'employee_appraiser_mappings', relevantMapping.id);
                batch.update(mappingRef, { isCompleted: true });
            } else {
                console.warn("Could not find a relevant appraiser mapping to update completion status.");
            }
            
            // 4. Update document status to next step in the flow
            const currentStatus = employeePerfDoc.status;
            const sortedSteps = [...evaluationFlow.steps].sort((a,b) => a.sequence - b.sequence);
            const currentStepIndex = sortedSteps.findIndex(step => step.task === currentStatus);

            if (currentStepIndex !== -1 && currentStepIndex < sortedSteps.length - 1) {
                const nextStep = sortedSteps[currentStepIndex + 1];
                const nextStatus = nextStep.task;
                
                if (employeePerfDocRef) {
                     batch.update(employeePerfDocRef, { status: nextStatus });
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
    
    if (!employeePerfDoc) {
        return <div className="container mx-auto py-10">Document not found.</div>;
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
                                {(section.enableSectionRatings || section.enableSectionComments) ? (
                                    <div className="space-y-4">
                                        {section.enableSectionRatings && (
                                            <div className="space-y-2">
                                                <Label htmlFor={`rating-${section.id}`}>Your Rating {section.sectionRatingMandatory && <span className="text-destructive">*</span>}</Label>
                                                <StarRating
                                                    count={section.ratingScale || 5}
                                                    value={ratings[section.id] || 0}
                                                    onChange={(value) => handleRatingChange(section.id, value)}
                                                />
                                            </div>
                                        )}
                                        {section.enableSectionComments && (
                                            <div className="space-y-2">
                                                <Label htmlFor={`comment-${section.id}`}>Your Comments {section.sectionCommentMandatory && <span className="text-destructive">*</span>}</Label>
                                                <Textarea
                                                    id={`comment-${section.id}`}
                                                    value={comments[section.id] || ''}
                                                    onChange={(e) => handleCommentChange(section.id, e.target.value)}
                                                    placeholder="Provide your comments..."
                                                    maxLength={section.maxLength}
                                                />
                                                <p className="text-sm text-muted-foreground text-right">
                                                    {comments[section.id]?.length || 0} / {section.maxLength}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No evaluation inputs are enabled for this section.</p>
                                )}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                 ))}
            </Accordion>

            <div className="flex justify-end mt-8">
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                   {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
                </Button>
            </div>
        </div>
    );
}
