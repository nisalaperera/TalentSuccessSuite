'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Employee, EmployeePerformanceDocument, PerformanceDocument, AppraiserMapping } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGlobalState } from '@/app/context/global-state-provider';

interface MyTeamPerformanceCyclesProps {
    workTeamData: EmployeePerformanceDocument[] | null;
    homeTeamData: EmployeePerformanceDocument[] | null;
    allEmployees: Employee[] | null;
    allPerformanceDocuments: PerformanceDocument[] | null;
    allAppraiserMappings: AppraiserMapping[] | null;
}

interface TeamTableProps {
    data: EmployeePerformanceDocument[] | null;
    allEmployees: Employee[] | null;
    allPerformanceDocuments: PerformanceDocument[] | null;
    allAppraiserMappings: AppraiserMapping[] | null;
}

function TeamTable({ data, allEmployees, allPerformanceDocuments, allAppraiserMappings }: TeamTableProps) {
    const { personNumber } = useGlobalState();
    const [openRowId, setOpenRowId] = useState<string | null>(null);

    const getEmployeeName = (employeeId: string) => {
        const emp = allEmployees?.find(e => e.id === employeeId);
        return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
    }
    
    const getEmployeeNameByPersonNumber = (personNumber: string) => {
        if (!allEmployees) return 'N/A';
        const emp = allEmployees.find(e => e.personNumber === personNumber);
        return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
    };

    const getDocumentName = (docId: string) => {
        return allPerformanceDocuments?.find(d => d.id === docId)?.name || 'N/A';
    }
    
    const handleToggleRow = (rowId: string) => {
        setOpenRowId(prev => (prev === rowId ? null : rowId));
    };

    const tableData = useMemo(() => {
        if (!data) return [];
        return data.map(cycle => {
            const employee = allEmployees?.find(e => e.id === cycle.employeeId);
            const appraisers = (allAppraiserMappings || [])
                .filter(m => m.employeePersonNumber === employee?.personNumber)
                .sort((a, b) => { // Sort primary first
                    if (a.appraiserType === 'Primary' && b.appraiserType !== 'Primary') return -1;
                    if (a.appraiserType !== 'Primary' && b.appraiserType === 'Primary') return 1;
                    return 0;
                });
            
            const myMappingForThisEmployee = appraisers.find(m => m.appraiserPersonNumber === personNumber);
            const isMyEvalComplete = myMappingForThisEmployee?.isCompleted ?? false;
            const isPrimary = myMappingForThisEmployee?.appraiserType === 'Primary';
            
            let buttonText = 'View Evaluation'; // Default for completed/other statuses

            if (cycle.status === 'Manager Evaluation') {
                if (isPrimary) {
                    const allOthersComplete = appraisers
                        .filter(m => m.appraiserPersonNumber !== personNumber)
                        .every(m => m.isCompleted);

                    if (allOthersComplete) {
                        buttonText = 'Submit Evaluation'; // This is the final action to move workflow
                    } else {
                        buttonText = 'Evaluate'; // They can provide/edit their rating
                    }
                } else { // User is a Secondary Appraiser
                    if (!isMyEvalComplete) {
                        buttonText = 'Evaluate';
                    } else {
                        buttonText = 'View Evaluation'; // Already submitted
                    }
                }
            }
            
            return {
                ...cycle,
                employeeName: getEmployeeName(cycle.employeeId),
                documentName: getDocumentName(cycle.performanceDocumentId),
                appraisers: appraisers,
                buttonText,
            }
        });
    }, [data, allEmployees, allPerformanceDocuments, allAppraiserMappings, personNumber]);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-12" />
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
                        
                        return (
                            <React.Fragment key={cycle.id}>
                                <TableRow>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleToggleRow(cycle.id)} disabled={cycle.appraisers.length === 0}>
                                            {openRowId === cycle.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            <span className="sr-only">Toggle appraisers</span>
                                        </Button>
                                    </TableCell>
                                    <TableCell className="font-medium">{cycle.employeeName}</TableCell>
                                    <TableCell>{cycle.documentName}</TableCell>
                                    <TableCell><Badge variant="secondary">{cycle.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        {showButton ? (
                                            <Link href={`/performance/evaluation/${cycle.id}`}>
                                                <Button variant="outline" size="sm">
                                                    {cycle.buttonText}
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </Link>
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                                {openRowId === cycle.id && (
                                     <TableRow className="bg-muted/50 hover:bg-muted">
                                        <TableCell colSpan={5} className="p-0">
                                            <div className="p-4 pl-16">
                                                <h4 className="font-semibold mb-2">Appraisers for {cycle.employeeName}</h4>
                                                {cycle.appraisers.length > 0 ? (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Appraiser Type</TableHead>
                                                                <TableHead>Appraiser Name</TableHead>
                                                                <TableHead>Eval/Goal Types</TableHead>
                                                                <TableHead>Completed</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {cycle.appraisers.map(mapping => (
                                                                <TableRow key={mapping.id} className="border-0">
                                                                    <TableCell>{mapping.appraiserType}</TableCell>
                                                                    <TableCell>{getEmployeeNameByPersonNumber(mapping.appraiserPersonNumber)}</TableCell>
                                                                    <TableCell>{mapping.evalGoalTypes}</TableCell>
                                                                    <TableCell>
                                                                        {mapping.isCompleted ? <Badge>Yes</Badge> : <Badge variant="secondary">No</Badge>}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">No appraisers assigned for this employee in this cycle.</p>
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
                            No performance documents found for this team view.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

export function MyTeamPerformanceCycles({ workTeamData, homeTeamData, allEmployees, allPerformanceDocuments, allAppraiserMappings }: MyTeamPerformanceCyclesProps) {
    const isWorkDataEmpty = !workTeamData || workTeamData.length === 0;
    const isHomeDataEmpty = !homeTeamData || homeTeamData.length === 0;
    const defaultTab = isWorkDataEmpty && !isHomeDataEmpty ? 'home' : 'work';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">My Team's Performance Cycles</CardTitle>
                <CardDescription>Performance documents for your direct reports in the selected cycle.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue={defaultTab}>
                    <TabsList>
                        <TabsTrigger value="work" disabled={isWorkDataEmpty}>Work</TabsTrigger>
                        <TabsTrigger value="home" disabled={isHomeDataEmpty}>Home</TabsTrigger>
                    </TabsList>
                    <TabsContent value="work">
                        <TeamTable 
                            data={workTeamData}
                            allEmployees={allEmployees}
                            allPerformanceDocuments={allPerformanceDocuments}
                            allAppraiserMappings={allAppraiserMappings}
                        />
                    </TabsContent>
                    <TabsContent value="home">
                        <TeamTable 
                            data={homeTeamData}
                            allEmployees={allEmployees}
                            allPerformanceDocuments={allPerformanceDocuments}
                            allAppraiserMappings={allAppraiserMappings}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
