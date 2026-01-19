
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { AppraiserMapping } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

type ColumnsConfig = {
    getEmployeeNameByPersonNumber: (personNumber: string) => string;
    getCycleName: (id: string) => string;
}

export const columns = ({ getEmployeeNameByPersonNumber, getCycleName }: ColumnsConfig): ColumnDef<AppraiserMapping>[] => [
    {
        accessorKey: 'employeePersonNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Employee" />,
        cell: ({ row }) => getEmployeeNameByPersonNumber(row.getValue('employeePersonNumber')),
    },
    {
        accessorKey: 'performanceCycleId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Performance Cycle" />,
        cell: ({ row }) => getCycleName(row.getValue('performanceCycleId')),
    },
    {
        accessorKey: 'appraiserType',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Appraiser Type" />,
    },
    {
        accessorKey: 'appraiserPersonNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Appraiser" />,
        cell: ({ row }) => getEmployeeNameByPersonNumber(row.getValue('appraiserPersonNumber')),
    },
    {
        accessorKey: 'evalGoalTypes',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Eval/Goal Types" />,
    },
    {
        accessorKey: 'isCompleted',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Completed" />,
        cell: ({ row }) => {
            const isCompleted = row.getValue('isCompleted');
            return isCompleted 
                ? <Badge>Yes</Badge> 
                : <Badge variant="secondary">No</Badge>;
        }
    },
];
