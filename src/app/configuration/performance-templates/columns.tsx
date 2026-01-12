
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { PerformanceTemplate } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { DataTableRowActions } from '@/app/components/data-table/data-table-row-actions';
import { ClipboardList } from 'lucide-react';

type ColumnsConfig = {
    onEdit: (template: PerformanceTemplate) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (template: PerformanceTemplate) => void;
    isTemplateInUse: (id: string) => boolean;
    onManageSections: (template: PerformanceTemplate) => void;
}

export const columns = ({ onEdit, onDelete, onToggleStatus, isTemplateInUse, onManageSections }: ColumnsConfig): ColumnDef<PerformanceTemplate>[] => [
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
            const customActions = [
                {
                    label: "Manage Sections",
                    icon: <ClipboardList className="mr-2 h-3.5 w-3.5" />,
                    onClick: onManageSections
                }
            ]
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
                    customActions={customActions}
                />
            )
        },
    },
];
