'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { EmployeePerformanceDocument, AppraiserMapping } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

type ColumnsConfig = {
    getEmployeeName: (id: string) => string;
    getCycleName: (id: string) => string;
    getTemplateName: (id: string) => string;
    getAppraisersForDocument: (doc: EmployeePerformanceDocument) => AppraiserMapping[];
    getEmployeeNameByPersonNumber: (personNumber: string) => string;
}

export const columns = ({ getEmployeeName, getCycleName, getTemplateName, getAppraisersForDocument, getEmployeeNameByPersonNumber }: ColumnsConfig): ColumnDef<EmployeePerformanceDocument>[] => [
    {
        accessorKey: 'employeeId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Employee" />,
        cell: ({ row }) => getEmployeeName(row.getValue('employeeId')),
    },
    {
        accessorKey: 'performanceCycleId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Performance Cycle" />,
        cell: ({ row }) => getCycleName(row.getValue('performanceCycleId')),
    },
    {
        accessorKey: 'performanceTemplateId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Template" />,
        cell: ({ row }) => getTemplateName(row.getValue('performanceTemplateId')),
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const doc = row.original;
            const status = row.getValue('status') as string;
            const appraisers = getAppraisersForDocument(doc);
            
            let variant: "default" | "secondary" | "destructive" | "outline" | null | undefined;

            switch(status) {
                case 'Close Document':
                    variant = 'default';
                    break;
                case 'Worker Self-Evaluation':
                    variant = 'secondary';
                    break;
                default:
                    variant = 'outline';
            }
            
            return (
                <div className="flex items-center gap-2">
                    <Badge variant={variant}>{status}</Badge>
                     {appraisers && appraisers.length > 0 && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">View Appraisers</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Appraiser List</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Appraisers for this document.
                                        </p>
                                    </div>
                                    <div className="divide-y">
                                        {appraisers.map(appraiser => (
                                            <div key={appraiser.id} className="py-2 flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{getEmployeeNameByPersonNumber(appraiser.appraiserPersonNumber)}</p>
                                                    <p className="text-sm text-muted-foreground">{appraiser.appraiserType}</p>
                                                </div>
                                                <Badge variant={appraiser.isCompleted ? 'default' : 'secondary'}>
                                                    {appraiser.isCompleted ? 'Completed' : 'Pending'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            );
        }
    },
];
