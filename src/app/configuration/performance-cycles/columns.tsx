
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { PerformanceCycle } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { DataTableRowActions } from '@/app/components/data-table/data-table-row-actions';

type ColumnsConfig = {
    onEdit: (cycle: PerformanceCycle) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (cycle: PerformanceCycle) => void;
    getReviewPeriodName: (id: string) => string;
}

export const columns = ({ onEdit, onDelete, onToggleStatus, getReviewPeriodName }: ColumnsConfig): ColumnDef<PerformanceCycle>[] => [
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
        accessorKey: 'status',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            return (
                <DataTableRowActions
                    row={row}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                    canEdit={true}
                    canDelete={true}
                />
            )
        },
    },
];
