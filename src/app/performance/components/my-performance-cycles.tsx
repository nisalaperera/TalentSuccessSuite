
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { EmployeePerformanceDocument, PerformanceDocument, PerformanceTemplate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface MyPerformanceCyclesProps {
    data: EmployeePerformanceDocument[] | null;
    allPerformanceDocuments: PerformanceDocument[] | null;
    allPerformanceTemplates: PerformanceTemplate[] | null;
}

export function MyPerformanceCycles({ data, allPerformanceDocuments, allPerformanceTemplates }: MyPerformanceCyclesProps) {

    const getDocumentName = (docId: string) => {
        return allPerformanceDocuments?.find(d => d.id === docId)?.name || 'N/A';
    }

    const getTemplateName = (templateId: string) => {
        return allPerformanceTemplates?.find(t => t.id === templateId)?.name || 'N/A';
    }

    const tableData = useMemo(() => {
        if (!data) return [];
        return data.map(cycle => ({
            ...cycle,
            documentName: getDocumentName(cycle.performanceDocumentId),
            templateName: getTemplateName(cycle.performanceTemplateId),
        }));
    }, [data, allPerformanceDocuments, allPerformanceTemplates]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">My Performance Cycles</CardTitle>
                <CardDescription>Performance documents assigned to you for the selected cycle.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Document Name</TableHead>
                            <TableHead>Template</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableData.length > 0 ? (
                            tableData.map(cycle => {
                                const buttonText = cycle.status === 'Worker Self-Evaluation' ? 'Evaluate' : 'View Evaluation';
                                return (
                                    <TableRow key={cycle.id}>
                                        <TableCell className="font-medium">{cycle.documentName}</TableCell>
                                        <TableCell>{cycle.templateName}</TableCell>
                                        <TableCell><Badge variant="secondary">{cycle.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/performance/evaluation/${cycle.id}`}>
                                                <Button variant="outline" size="sm">
                                                    {buttonText}
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No performance documents found for you in this cycle.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
