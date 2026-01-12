
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { EvaluationFlow } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { DataTableRowActions } from '@/app/components/data-table/data-table-row-actions';

type ColumnsConfig = {
    onEdit: (flow: EvaluationFlow) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (flow: EvaluationFlow) => void;
    isFlowInUse: (id: string) => boolean;
}

export const columns = ({ onEdit, onDelete, onToggleStatus, isFlowInUse }: ColumnsConfig): ColumnDef<EvaluationFlow>[] => [
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Flow Name" />,
    },
    {
        accessorKey: 'steps',
        header: 'Process Flow',
        cell: ({ row }) => {
            const steps = row.getValue('steps') as EvaluationFlow['steps'];
            return <div className="truncate max-w-xs">{steps.map(s => s.task).join(' → ')}</div>
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
            const flow = row.original;
            const inUse = isFlowInUse(flow.id);
            return (
                <DataTableRowActions
                    row={row}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                    canEdit={!inUse}
                    canDelete={!inUse}
                    editTooltip="Cannot edit a flow that is in use."
                    deleteTooltip="Cannot delete a flow that is in use."
                />
            )
        },
    },
];
