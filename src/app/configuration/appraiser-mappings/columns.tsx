
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { AppraiserMapping } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';

type ColumnsConfig = {
    getEmployeeName: (id: string) => string;
    getCycleName: (id: string) => string;
}

export const columns = ({ getEmployeeName, getCycleName }: ColumnsConfig): ColumnDef<AppraiserMapping>[] => [
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
        accessorKey: 'primaryAppraiserId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Primary Appraiser" />,
        cell: ({ row }) => getEmployeeName(row.getValue('primaryAppraiserId')),
    },
    {
        accessorKey: 'secondaryAppraiserIds',
        header: 'Secondary Appraisers',
        cell: ({ row }) => {
            const ids = row.getValue('secondaryAppraiserIds') as string[];
            if (!ids || ids.length === 0) return 'N/A';
            return ids.map(id => getEmployeeName(id)).join(', ');
        },
        enableSorting: false,
    },
];
