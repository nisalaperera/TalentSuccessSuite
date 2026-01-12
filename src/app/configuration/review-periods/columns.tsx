
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import type { ReviewPeriod } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { DataTableRowActions } from '@/app/components/data-table/data-table-row-actions';

type ColumnsConfig = {
    onEdit: (period: ReviewPeriod) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (period: ReviewPeriod) => void;
    isPeriodInUse: (id: string) => boolean;
}

export const columns = ({ onEdit, onDelete, onToggleStatus, isPeriodInUse }: ColumnsConfig): ColumnDef<ReviewPeriod>[] => [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Review Period Name" />
        ),
        cell: ({ row }) => <div>{row.getValue('name')}</div>,
    },
    {
        accessorKey: 'startDate',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Start Date" />
        ),
        cell: ({ row }) => format(row.getValue('startDate'), 'PPP'),
    },
    {
        accessorKey: 'endDate',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="End Date" />
        ),
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
            const period = row.original;
            const inUse = isPeriodInUse(period.id);
            return (
                <DataTableRowActions
                    row={row}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                    canEdit={!inUse}
                    canDelete={!inUse}
                    editTooltip="Cannot edit a period that is in use."
                    deleteTooltip="Cannot delete a period that is in use."
                />
            )
        },
    },
];
