
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { TechnologistWeight } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { DataTableRowActions } from '@/app/components/data-table/data-table-row-actions';

type ColumnsConfig = {
    onEdit: (weightConfig: TechnologistWeight) => void;
}

export const columns = ({ onEdit }: ColumnsConfig): ColumnDef<TechnologistWeight>[] => [
    {
        accessorKey: 'technologist_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Technologist Type" />,
    },
    {
        accessorKey: 'workGoalWeight',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Work Goal Weight (%)" />,
        cell: ({ row }) => `${row.getValue('workGoalWeight')}%`,
    },
    {
        accessorKey: 'homeGoalWeight',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Home Goal Weight (%)" />,
        cell: ({ row }) => `${row.getValue('homeGoalWeight')}%`,
    },
    {
        accessorKey: 'primaryAppraiser',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Primary Appraiser" />,
    },
    {
        accessorKey: 'secondaryAppraiser',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Secondary Appraiser" />,
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            return (
                <DataTableRowActions
                    row={row}
                    onEdit={onEdit}
                    isToggleable={false}
                    canDelete={false}
                />
            )
        },
    },
];
