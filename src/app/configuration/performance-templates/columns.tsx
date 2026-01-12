
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { PerformanceTemplate } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { DataTableRowActions } from '@/app/components/data-table/data-table-row-actions';

type ColumnsConfig = {
    onEdit: (template: PerformanceTemplate) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (template: PerformanceTemplate) => void;
    isTemplateInUse: (id: string) => boolean;
}

export const columns = ({ onEdit, onDelete, onToggleStatus, isTemplateInUse }: ColumnsConfig): ColumnDef<PerformanceTemplate>[] => [
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Template Name" />,
    },
    {
        accessorKey: 'category',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
    },
    {
        accessorKey: 'supportsRatings',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Ratings" />,
        cell: ({ row }) => row.getValue('supportsRatings') ? 'Yes' : 'No',
    },
    {
        accessorKey: 'supportsComments',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Comments" />,
        cell: ({ row }) => row.getValue('supportsComments') ? 'Yes' : 'No',
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const template = row.original;
            const inUse = isTemplateInUse(template.id);
            return (
                <DataTableRowActions
                    row={row}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                    canEdit={!inUse}
                    canDelete={!inUse}
                    editTooltip="Cannot edit a template that is in use."
                    deleteTooltip="Cannot delete a template that is in use."
                />
            )
        },
    },
];
