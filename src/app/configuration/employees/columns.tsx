
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { Employee } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';

export const columns = (): ColumnDef<Employee>[] => [
    {
        accessorKey: 'personNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Person Number" />,
    },
    {
        accessorKey: 'firstName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="First Name" />,
    },
    {
        accessorKey: 'lastName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last Name" />,
    },
    {
        accessorKey: 'personEmail',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    },
    {
        accessorKey: 'designation',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Designation" />,
    },
    {
        accessorKey: 'personType',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Person Type" />,
    },
    {
        accessorKey: 'department',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
    },
    {
        accessorKey: 'entity',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Entity" />,
    },
    {
        accessorKey: 'workManager',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Work Manager" />,
    },
    {
        accessorKey: 'homeManager',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Home Manager" />,
    },
];
