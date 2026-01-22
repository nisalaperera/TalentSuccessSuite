
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { Goal } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { DataTableRowActions } from '@/app/components/data-table/data-table-row-actions';

type ColumnsConfig = {
    onEdit: (goal: Goal) => void;
    onDelete: (id: string) => void;
    getGoalPlanName: (id: string) => string;
    getEmployeeName: (id: string) => string;
}

export const columns = ({ onEdit, onDelete, getGoalPlanName, getEmployeeName }: ColumnsConfig): ColumnDef<Goal>[] => [
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Goal Name" />,
    },
    {
        accessorKey: 'goalPlanId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Goal Plan" />,
        cell: ({ row }) => getGoalPlanName(row.getValue('goalPlanId')),
    },
    {
        accessorKey: 'employeeId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Employee" />,
        cell: ({ row }) => getEmployeeName(row.getValue('employeeId')),
    },
    {
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    },
    {
        accessorKey: 'weight',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Weight" />,
        cell: ({ row }) => {
            const weight = row.getValue('weight') as number | undefined;
            return weight ? `${weight}%` : 'N/A';
        }
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            return (
                <DataTableRowActions
                    row={row}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isToggleable={false}
                />
            )
        },
    },
];
