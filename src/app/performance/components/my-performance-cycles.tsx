
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { EmployeePerformanceDocument, PerformanceDocument, PerformanceTemplate, AppraiserMapping, Employee } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface MyPerformanceCyclesProps {
    data: EmployeePerformanceDocument[] | null;
    allPerformanceDocuments: PerformanceDocument[] | null;
    allPerformanceTemplates: PerformanceTemplate[] | null;
    myAppraiserMappings: AppraiserMapping[] | null;
    allEmployees: Employee[] | null;
}

export function MyPerformanceCycles({ data, allPerformanceDocuments, allPerformanceTemplates, myAppraiserMappings, allEmployees }: MyPerformanceCyclesProps) {
    const [openRowId, setOpenRowId] = useState<string | null>(null);

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

    const getEmployeeNameByPersonNumber = (personNumber: string) => {
        if (!allEmployees) return 'N/A';
        const emp = allEmployees.find(e => e.personNumber === personNumber);
        return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
    };
    
    const handleToggleRow = (rowId: string) => {
        setOpenRowId(prev => (prev === rowId ? null : rowId));
    };


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
                            <TableHead className="w-12" />
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
                                    <React.Fragment key={cycle.id}>
                                        <TableRow>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleToggleRow(cycle.id)} disabled={!myAppraiserMappings || myAppraiserMappings.length === 0}>
                                                    {openRowId === cycle.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    <span className="sr-only">Toggle appraisers</span>
                                                </Button>
                                            </TableCell>
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
                                        {openRowId === cycle.id && (
                                            <TableRow className="bg-muted/50 hover:bg-muted">
                                                <TableCell colSpan={5} className="p-0">
                                                    <div className="p-4 pl-16">
                                                        <h4 className="font-semibold mb-2">Appraisers</h4>
                                                        {myAppraiserMappings && myAppraiserMappings.length > 0 ? (
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Appraiser Name</TableHead>
                                                                        <TableHead>Appraiser Type</TableHead>
                                                                        <TableHead>Linked As</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {myAppraiserMappings.map(mapping => (
                                                                        <TableRow key={mapping.id} className="border-0">
                                                                            <TableCell>{getEmployeeNameByPersonNumber(mapping.appraiserPersonNumber)}</TableCell>
                                                                            <TableCell>{mapping.appraiserType}</TableCell>
                                                                            <TableCell>{mapping.linkedType}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground">No appraisers assigned for this cycle.</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
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
