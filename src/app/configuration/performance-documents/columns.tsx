
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { PerformanceDocument } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { DataTableRowActions } from '@/app/components/data-table/data-table-row-actions';
import { Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ColumnsConfig = {
    getLookUpName: (type: 'performanceCycle' | 'performanceTemplate', id: string) => string;
    onLaunch: (doc: PerformanceDocument) => void;
}

export const columns = ({ getLookUpName, onLaunch }: ColumnsConfig): ColumnDef<PerformanceDocument>[] => [
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Document Name" />,
    },
    {
        accessorKey: 'performanceCycleId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Performance Cycle" />,
        cell: ({ row }) => getLookUpName('performanceCycle', row.getValue('performanceCycleId')),
    },
    {
        accessorKey: 'performanceTemplateId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Template" />,
        cell: ({ row }) => getLookUpName('performanceTemplate', row.getValue('performanceTemplateId')),
    },
    {
        accessorKey: 'isLaunched',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const isLaunched = row.getValue('isLaunched');
            return isLaunched ? <Badge>Launched</Badge> : <Badge variant="secondary">Draft</Badge>;
        }
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const doc = row.original;
            const customActions = [
                {
                    label: "Launch",
                    icon: <Rocket className="mr-2 h-3.5 w-3.5" />,
                    onClick: onLaunch
                }
            ];

            return (
                 <DataTableRowActions
                    row={row}
                    onEdit={() => alert('Editing not implemented for Performance Docs')}
                    onDelete={() => alert('Deletion not implemented for Performance Docs')}
                    isToggleable={false}
                    canEdit={false}
                    canDelete={false}
                    customActions={doc.isLaunched ? [] : customActions}
                    editTooltip="Performance documents cannot be edited."
                    deleteTooltip="Performance documents cannot be deleted."
                />
            )
        },
    },
];
