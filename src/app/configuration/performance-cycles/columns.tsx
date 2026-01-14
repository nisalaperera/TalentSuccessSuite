
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import type { PerformanceCycle } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { DataTableRowActions } from '@/app/components/data-table/data-table-row-actions';

type ColumnsConfig = {
    onEdit: (cycle: PerformanceCycle) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (cycle: PerformanceCycle) => void;
    getReviewPeriodName: (id: string) => string;
    getGoalPlanName: (id: string) => string;
    isCycleInUse: (id: string) => boolean;
}

export const columns = ({ onEdit, onDelete, onToggleStatus, getReviewPeriodName, getGoalPlanName, isCycleInUse }: ColumnsConfig): ColumnDef<PerformanceCycle>[] => [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Cycle Name" />
        ),
    },
    {
        accessorKey: 'reviewPeriodId',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Review Period" />
        ),
        cell: ({ row }) => getReviewPeriodName(row.getValue('reviewPeriodId')),
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: 'goalPlanId',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Goal Plan" />
        ),
        cell: ({ row }) => getGoalPlanName(row.getValue('goalPlanId')),
    },
    {
        accessorKey: 'startDate',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Start Date" />,
        cell: ({ row }) => format(row.getValue('startDate'), 'PPP'),
    },
    {
        accessorKey: 'endDate',
        header: ({ column }) => <DataTableColumnHeader column={column} title="End Date" />,
        cell: ({ row }) => format(row.getValue('endDate'), 'PPP'),
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const cycle = row.original;
            const inUse = isCycleInUse(cycle.id);
            return (
                <DataTableRowActions
                    row={row}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                    canEdit={!inUse}
                    canDelete={!inUse}
                    editTooltip="Cannot edit a cycle that is in use."
                    deleteTooltip="Cannot delete a cycle that is in use."
                />
            )
        },
    },
];

    