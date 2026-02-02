'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { PerformanceDocument } from '@/lib/types';
import { DataTableColumnHeader } from '@/app/components/data-table/data-table-column-header';
import { Rocket, UserPlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';


type ColumnsConfig = {
    getLookUpName: (type: 'performanceCycle' | 'performanceTemplate', id: string) => string;
    onLaunch: (doc: PerformanceDocument) => void;
    onAddEmployee: (doc: PerformanceDocument) => void;
    onViewEmployeeDocs: (doc: PerformanceDocument) => void;
}

export const columns = ({ getLookUpName, onLaunch, onAddEmployee, onViewEmployeeDocs }: ColumnsConfig): ColumnDef<PerformanceDocument>[] => [
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
            
            return (
                <TooltipProvider>
                    <div className="flex justify-end gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => onViewEmployeeDocs(doc)}>
                                    <Users className="h-4 w-4" />
                                    <span className="sr-only">View Employee Documents</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>View Employee Documents</p>
                            </TooltipContent>
                        </Tooltip>

                        {doc.isLaunched ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => onAddEmployee(doc)}>
                                        <UserPlus className="h-4 w-4" />
                                        <span className="sr-only">Add Employee</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Add Employee</p>
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                     <Button variant="ghost" size="icon" onClick={() => onLaunch(doc)}>
                                        <Rocket className="h-4 w-4" />
                                        <span className="sr-only">Launch</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Launch</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </TooltipProvider>
            )
        },
    },
];
