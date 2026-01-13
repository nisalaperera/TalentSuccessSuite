
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { GoalPlan } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { DataTableRowActions } from '@/app/components/data-table/data-table-row-actions';

type ColumnsConfig = {
    onEdit: (plan: GoalPlan) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (plan: GoalPlan) => void;
    isPlanInUse: (id: string) => boolean;
    getReviewPeriodName: (id: string) => string;
}

export const columns = ({ onEdit, onDelete, onToggleStatus, isPlanInUse, getReviewPeriodName }: ColumnsConfig): ColumnDef<GoalPlan>[] => [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Goal Plan Name" />
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
        accessorKey: 'status',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const plan = row.original;
            const inUse = isPlanInUse(plan.id);
            return (
                <DataTableRowActions
                    row={row}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                    canEdit={!inUse}
                    canDelete={!inUse}
                    editTooltip="Cannot edit a plan that is in use."
                    deleteTooltip="Cannot delete a plan that is in use."
                />
            )
        },
    },
];
