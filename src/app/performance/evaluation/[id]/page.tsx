'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { EmployeePerformanceDocument, PerformanceTemplate, PerformanceTemplateSection, PerformanceDocument, Employee, PerformanceCycle, ReviewPeriod } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StarRating } from '@/app/components/config-flow/shared/star-rating';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function EvaluationPage() {
    const params = useParams();
    const documentId = params.id as string;
    const firestore = useFirestore();

    // State for evaluation inputs
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [comments, setComments] = useState<Record<string, string>>({});

    // 1. Get the EmployeePerformanceDocument
    const employeePerfDocRef = useMemoFirebase(() => documentId ? doc(firestore, 'employee_performance_documents', documentId) : null, [firestore, documentId]);
    const { data: employeePerfDoc, isLoading: isLoadingDoc } = useDoc<EmployeePerformanceDocument>(employeePerfDocRef);

    // 2. Get related entities from IDs in EmployeePerformanceDocument
    const perfTemplateRef = useMemoFirebase(() => employeePerfDoc ? doc(firestore, 'performance_templates', employeePerfDoc.performanceTemplateId) : null, [firestore, employeePerfDoc]);
    const { data: perfTemplate, isLoading: isLoadingTemplate } = useDoc<PerformanceTemplate>(perfTemplateRef);
    
    const employeeRef = useMemoFirebase(() => employeePerfDoc ? doc(firestore, 'employees', employeePerfDoc.employeeId) : null, [firestore, employeePerfDoc]);
    const { data: employee, isLoading: isLoadingEmployee } = useDoc<Employee>(employeeRef);

    const perfCycleRef = useMemoFirebase(() => employeePerfDoc ? doc(firestore, 'performance_cycles', employeePerfDoc.performanceCycleId) : null, [firestore, employeePerfDoc]);
    const { data: perfCycle, isLoading: isLoadingCycle } = useDoc<PerformanceCycle>(perfCycleRef);

    const reviewPeriodRef = useMemoFirebase(() => perfCycle ? doc(firestore, 'review_periods', perfCycle.reviewPeriodId) : null, [firestore, perfCycle]);
    const { data: reviewPeriod, isLoading: isLoadingPeriod } = useDoc<ReviewPeriod>(reviewPeriodRef);

    const perfDocRef = useMemoFirebase(() => employeePerfDoc ? doc(firestore, 'performance_documents', employeePerfDoc.performanceDocumentId) : null, [firestore, employeePerfDoc]);
    const { data: performanceDocument, isLoading: isLoadingPerfDoc } = useDoc<PerformanceDocument>(perfDocRef);


    // 3. Get all sections and filter
    const sectionsQuery = useMemoFirebase(() => employeePerfDoc ? collection(firestore, 'performance_template_sections') : null, [firestore, employeePerfDoc]);
    const { data: allSections, isLoading: isLoadingSections } = useCollection<PerformanceTemplateSection>(sectionsQuery);
    
    const sections = useMemo(() => {
        if (!allSections || !employeePerfDoc) return [];
        return allSections
            .filter(section => section.performanceTemplateId === employeePerfDoc.performanceTemplateId)
            .sort((a, b) => a.order - b.order);
    }, [allSections, employeePerfDoc]);

    const isLoading = isLoadingDoc || isLoadingTemplate || isLoadingEmployee || isLoadingCycle || isLoadingPeriod || isLoadingSections || isLoadingPerfDoc;

    const handleRatingChange = (sectionId: string, rating: number) => {
        setRatings(prev => ({ ...prev, [sectionId]: rating }));
    };

    const handleCommentChange = (sectionId: string, comment: string) => {
        setComments(prev => ({ ...prev, [sectionId]: comment }));
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
                <Button>Submit Evaluation</Button>
            </div>
        </div>
    );
}
