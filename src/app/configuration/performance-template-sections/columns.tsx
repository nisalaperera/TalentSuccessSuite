
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { PerformanceTemplateSection } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, GripVertical } from 'lucide-react';

type ColumnsConfig = {
    onEdit: (section: PerformanceTemplateSection) => void;
    onDelete: (id: string) => void;
    getTemplateName: (id: string) => string;
}

export const columns = ({ onEdit, onDelete, getTemplateName }: ColumnsConfig): ColumnDef<PerformanceTemplateSection>[] => [
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Section Name" />,
    },
    {
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    },
    {
        accessorKey: 'performanceTemplateId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Template" />,
        cell: ({ row }) => getTemplateName(row.getValue('performanceTemplateId')),
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const section = row.original;
            return (
                 <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => onEdit(section)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Setup
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(section.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            )
        },
    },
];
