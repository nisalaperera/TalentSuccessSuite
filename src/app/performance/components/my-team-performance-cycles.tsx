
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Employee, EmployeePerformanceDocument, PerformanceDocument, PerformanceTemplate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MyTeamPerformanceCyclesProps {
    workTeamData: EmployeePerformanceDocument[] | null;
    homeTeamData: EmployeePerformanceDocument[] | null;
    allEmployees: Employee[] | null;
    allPerformanceDocuments: PerformanceDocument[] | null;
    allPerformanceTemplates: PerformanceTemplate[] | null;
}

interface TeamTableProps {
    data: EmployeePerformanceDocument[] | null;
    allEmployees: Employee[] | null;
    allPerformanceDocuments: PerformanceDocument[] | null;
}

function TeamTable({ data, allEmployees, allPerformanceDocuments }: TeamTableProps) {
    const getEmployeeName = (employeeId: string) => {
        const emp = allEmployees?.find(e => e.id === employeeId);
        return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
    }

    const getDocumentName = (docId: string) => {
        return allPerformanceDocuments?.find(d => d.id === docId)?.name || 'N/A';
    }

    const tableData = useMemo(() => {
        if (!data) return [];
        return data.map(cycle => ({
            ...cycle,
            employeeName: getEmployeeName(cycle.employeeId),
            documentName: getDocumentName(cycle.performanceDocumentId),
        }));
    }, [data, allEmployees, allPerformanceDocuments]);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tableData.length > 0 ? (
                    tableData.map(cycle => {
                        const showButton = cycle.status !== 'Worker Self-Evaluation';
                        const buttonText = cycle.status === 'Manager Evaluation' ? 'Evaluate' : 'View Evaluation';
                        
                        return (
                            <TableRow key={cycle.id}>
                                <TableCell className="font-medium">{cycle.employeeName}</TableCell>
                                <TableCell>{cycle.documentName}</TableCell>
                                <TableCell><Badge variant="secondary">{cycle.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                    {showButton ? (
                                        <Link href={`/performance/evaluation/${cycle.id}`}>
                                            <Button variant="outline" size="sm">
                                                {buttonText}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                    ) : null}
                                </TableCell>
                            </TableRow>
                        );
                    })
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">
                            No performance documents found for this team view.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

export function MyTeamPerformanceCycles({ workTeamData, homeTeamData, allEmployees, allPerformanceDocuments }: MyTeamPerformanceCyclesProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">My Team's Performance Cycles</CardTitle>
                <CardDescription>Performance documents for your direct reports in the selected cycle.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="work">
                    <TabsList>
                        <TabsTrigger value="work">Work Manager</TabsTrigger>
                        <TabsTrigger value="home">Home Manager</TabsTrigger>
                    </TabsList>
                    <TabsContent value="work">
                        <TeamTable 
                            data={workTeamData}
                            allEmployees={allEmployees}
                            allPerformanceDocuments={allPerformanceDocuments}
                        />
                    </TabsContent>
                    <TabsContent value="home">
                        <TeamTable 
                            data={homeTeamData}
                            allEmployees={allEmployees}
                            allPerformanceDocuments={allPerformanceDocuments}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
