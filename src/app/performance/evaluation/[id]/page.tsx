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
import { useMemo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EvaluationPage() {
    const params = useParams();
    const documentId = params.id as string;
    const firestore = useFirestore();

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
                                <p className="text-muted-foreground">{section.type}</p>
                                
                                <h4 className="font-semibold text-lg border-b pb-2">Section Configuration</h4>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center justify-between"><Label>Section Ratings Enabled</Label><Badge variant={section.enableSectionRatings ? "default" : "secondary"}>{section.enableSectionRatings ? 'Yes' : 'No'}</Badge></div>
                                    {section.enableSectionRatings && (
                                        <>
                                            <div className="flex items-center justify-between"><Label>Ratings Mandatory</Label><Badge variant={section.sectionRatingMandatory ? "default" : "secondary"}>{section.sectionRatingMandatory ? 'Yes' : 'No'}</Badge></div>
                                            <div className="flex items-center justify-between"><Label>Rating Scale</Label><Badge variant="outline">1 - {section.ratingScale}</Badge></div>
                                            <div className="flex items-center justify-between"><Label>Calculation Method</Label><Badge variant="outline">{section.ratingCalculationMethod}</Badge></div>
                                        </>
                                    )}
                                     <div className="flex items-center justify-between"><Label>Section Comments Enabled</Label><Badge variant={section.enableSectionComments ? "default" : "secondary"}>{section.enableSectionComments ? 'Yes' : 'No'}</Badge></div>
                                     {section.enableSectionComments && (
                                        <>
                                            <div className="flex items-center justify-between"><Label>Comments Mandatory</Label><Badge variant={section.sectionCommentMandatory ? "default" : "secondary"}>{section.sectionCommentMandatory ? 'Yes' : 'No'}</Badge></div>
                                            <div className="flex items-center justify-between"><Label>Min/Max Length</Label><Badge variant="outline">{section.minLength} / {section.maxLength}</Badge></div>
                                        </>
                                     )}
                                </div>
                                {section.type === 'Performance Goals' && (
                                    <>
                                        <h4 className="font-semibold text-lg border-b pb-2">Goal Item Configuration</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center justify-between"><Label>Goal Ratings Enabled</Label><Badge variant={section.enableItemRatings ? "default" : "secondary"}>{section.enableItemRatings ? 'Yes' : 'No'}</Badge></div>
                                            {section.enableItemRatings && <div className="flex items-center justify-between"><Label>Goal Ratings Mandatory</Label><Badge variant={section.itemRatingMandatory ? "default" : "secondary"}>{section.itemRatingMandatory ? 'Yes' : 'No'}</Badge></div>}
                                            <div className="flex items-center justify-between"><Label>Goal Comments Enabled</Label><Badge variant={section.enableItemComments ? "default" : "secondary"}>{section.enableItemComments ? 'Yes' : 'No'}</Badge></div>
                                            {section.enableItemComments && <div className="flex items-center justify-between"><Label>Goal Comments Mandatory</Label><Badge variant={section.itemCommentMandatory ? "default" : "secondary"}>{section.itemCommentMandatory ? 'Yes' : 'No'}</Badge></div>}
                                        </div>
                                    </>
                                )}

                               <h4 className="font-semibold text-lg border-b pb-2">Access Permissions</h4>
                               <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Role</TableHead>
                                          <TableHead className="text-center">View</TableHead>
                                          <TableHead className="text-center">Rate</TableHead>
                                          <TableHead className="text-center">View Worker Ratings</TableHead>
                                          <TableHead className="text-center">View Primary Appraiser Ratings</TableHead>
                                          <TableHead className="text-center">View Secondary Appraiser Ratings</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {section.permissions?.map(p => (
                                          <TableRow key={p.role}>
                                              <TableCell className="font-medium">{p.role}</TableCell>
                                              <TableCell className="text-center"><Switch checked={p.view} disabled /></TableCell>
                                              <TableCell className="text-center"><Switch checked={p.rate} disabled /></TableCell>
                                              <TableCell className="text-center"><Switch checked={p.viewWorkerRatings} disabled /></TableCell>
                                              <TableCell className="text-center"><Switch checked={p.viewPrimaryAppraiserRatings} disabled /></TableCell>
                                              <TableCell className="text-center"><Switch checked={p.viewSecondaryAppraiserRatings} disabled /></TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                 ))}
            </Accordion>
        </div>
    );
}
