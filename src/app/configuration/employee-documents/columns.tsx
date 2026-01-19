
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { EmployeePerformanceDocument } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

type ColumnsConfig = {
    getEmployeeName: (id: string) => string;
    getCycleName: (id: string) => string;
    getTemplateName: (id: string) => string;
}

export const columns = ({ getEmployeeName, getCycleName, getTemplateName }: ColumnsConfig): ColumnDef<EmployeePerformanceDocument>[] => [
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
            
            return <Badge variant={variant}>{status}</Badge>;
        }
    },
];
