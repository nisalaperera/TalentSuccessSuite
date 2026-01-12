
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { Eligibility } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { DataTableRowActions } from '@/app/components/data-table/data-table-row-actions';

type ColumnsConfig = {
    onEdit: (eligibility: Eligibility) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (eligibility: Eligibility) => void;
    isEligibilityInUse: (id: string) => boolean;
}

export const columns = ({ onEdit, onDelete, onToggleStatus, isEligibilityInUse }: ColumnsConfig): ColumnDef<Eligibility>[] => [
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    },
    {
        accessorKey: 'rules',
        header: 'Rules Summary',
        cell: ({ row }) => {
            const rules = row.getValue('rules') as Eligibility['rules'];
            if (rules.length === 0) return 'No rules';
            return <div className="truncate max-w-sm">{rules.map(r => `${r.type}: [${r.values.join(', ')}]`).join('; ')}</div>
        },
        enableSorting: false,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const eligibility = row.original;
            const inUse = isEligibilityInUse(eligibility.id);
            return (
                <DataTableRowActions
                    row={row}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                    canEdit={!inUse}
                    canDelete={!inUse}
                    editTooltip="Cannot edit criteria that are in use."
                    deleteTooltip="Cannot delete criteria that are in use."
                />
            )
        },
    },
];
