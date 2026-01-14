
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { EmployeePerformanceDocument } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

type ColumnsConfig = {
    getEmployeeName: (id: string) => string;
    getCycleName: (id: string) => string;
    getTemplateName: (id: string) => string;
    getGoalPlanName: (id: string) => string;
}

export const columns = ({ getEmployeeName, getCycleName, getTemplateName, getGoalPlanName }: ColumnsConfig): ColumnDef<EmployeePerformanceDocument>[] => [
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
        accessorKey: 'goalPlanId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Goal Plan" />,
        cell: ({ row }) => getGoalPlanName(row.getValue('goalPlanId')),
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
            const status = row.getValue('status');
            let variant: "default" | "secondary" | "destructive" | "outline" | null | undefined = "secondary";
            if (status === 'Completed') variant = 'default';
            if (status === 'In Progress') variant = 'outline';
            
            return <Badge variant={variant}>{status as string}</Badge>;
        }
    },
];

    