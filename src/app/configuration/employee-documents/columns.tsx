
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { EmployeePerformanceDocument, AppraiserMapping } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, UserCog } from 'lucide-react';
import { DataTableRowActions } from '@/app/components/data-table/data-table-row-actions';


type ColumnsConfig = {
    getEmployeeName: (id: string) => string;
    getCycleName: (id: string) => string;
    getTemplateName: (id: string) => string;
    getAppraisersForDocument: (doc: EmployeePerformanceDocument) => AppraiserMapping[];
    getEmployeeNameByPersonNumber: (personNumber: string) => string;
    onManageAppraisers: (doc: EmployeePerformanceDocument) => void;
    onViewDetails: (doc: EmployeePerformanceDocument) => void;
}

export const columns = ({ getEmployeeName, getCycleName, getTemplateName, getAppraisersForDocument, getEmployeeNameByPersonNumber, onManageAppraisers, onViewDetails }: ColumnsConfig): ColumnDef<EmployeePerformanceDocument>[] => [
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
                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onViewDetails(doc)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                    </Button>
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

