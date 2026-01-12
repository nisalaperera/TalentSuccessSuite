
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { PerformanceDocument } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { DataTableRowActions } from '@/app/components/data-table/data-table-row-actions';

type ColumnsConfig = {
    getLookUpName: (type: 'reviewPeriod' | 'goalPlan' | 'performanceTemplate', id: string) => string;
}

export const columns = ({ getLookUpName }: ColumnsConfig): ColumnDef<PerformanceDocument>[] => [
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Document Name" />,
    },
    {
        accessorKey: 'reviewPeriodId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Review Period" />,
        cell: ({ row }) => getLookUpName('reviewPeriod', row.getValue('reviewPeriodId')),
    },
    {
        accessorKey: 'performanceTemplateId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Template" />,
        cell: ({ row }) => getLookUpName('performanceTemplate', row.getValue('performanceTemplateId')),
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            return (
                 <DataTableRowActions
                    row={row}
                    onEdit={() => alert('Editing not implemented for Performance Docs')}
                    onDelete={() => alert('Deletion not implemented for Performance Docs')}
                    isToggleable={false}
                    canEdit={false}
                    canDelete={false}
                    editTooltip="Performance documents cannot be edited."
                    deleteTooltip="Performance documents cannot be deleted."
                />
            )
        },
    },
];
