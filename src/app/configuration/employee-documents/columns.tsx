
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { EmployeePerformanceDocument, AppraiserMapping } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Eye, UserCog } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableRowActions } from '@/app/components/data-table/data-table-row-actions';


type ColumnsConfig = {
    getEmployeeName: (id: string) => string;
    getCycleName: (id: string) => string;
    getTemplateName: (id: string) => string;
    getAppraisersForDocument: (doc: EmployeePerformanceDocument) => AppraiserMapping[];
    getEmployeeNameByPersonNumber: (personNumber: string) => string;
    onManageAppraisers: (doc: EmployeePerformanceDocument) => void;
}

export const columns = ({ getEmployeeName, getCycleName, getTemplateName, getAppraisersForDocument, getEmployeeNameByPersonNumber, onManageAppraisers }: ColumnsConfig): ColumnDef<EmployeePerformanceDocument>[] => [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
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
                            <PopoverContent className="w-auto">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Appraiser List</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Appraisers for this document.
                                        </p>
                                    </div>
                                    <div>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Appraiser</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Eval Types</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {appraisers.map(appraiser => (
                                                    <TableRow key={appraiser.id}>
                                                        <TableCell>{getEmployeeNameByPersonNumber(appraiser.appraiserPersonNumber)}</TableCell>
                                                        <TableCell>{appraiser.appraiserType}</TableCell>
                                                        <TableCell>{appraiser.evalGoalTypes}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={appraiser.isCompleted ? 'default' : 'secondary'}>
                                                                {appraiser.isCompleted ? 'Completed' : 'Pending'}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            );
        }
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const doc = row.original;
            const customActions = [];
            if (doc.status === 'Worker Self-Evaluation') {
                customActions.push({
                    label: "Manage Appraisers",
                    icon: <UserCog className="mr-2 h-3.5 w-3.5" />,
                    onClick: onManageAppraisers,
                });
            }
            if (customActions.length === 0) {
                return null;
            }
            return (
                 <DataTableRowActions
                    row={row}
                    customActions={customActions}
                    isToggleable={false}
                    canEdit={false}
                    canDelete={false}
                />
            )
        },
    },
];
