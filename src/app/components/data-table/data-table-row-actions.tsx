'use client';

import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Power, PowerOff, Trash2, Pencil } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CustomAction<TData> {
    label: string;
    icon?: React.ReactNode;
    onClick: (data: TData) => void;
    isDestructive?: boolean;
}

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onEdit?: (data: TData) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (data: TData) => void;
  isToggleable?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  editTooltip?: string;
  deleteTooltip?: string;
  customActions?: CustomAction<TData>[];
}

export function DataTableRowActions<TData extends { id: string, status?: 'Active' | 'Inactive' }>({
  row,
  onEdit,
  onDelete,
  onToggleStatus,
  isToggleable = true,
  canEdit = true,
  canDelete = true,
  editTooltip,
  deleteTooltip,
  customActions = []
}: DataTableRowActionsProps<TData>) {
  const data = row.original;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(data)} disabled={!canEdit}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
          )}

          {customActions.map((action, index) => (
             <DropdownMenuItem key={index} onClick={() => action.onClick(data)}>
                {action.icon}
                {action.label}
             </DropdownMenuItem>
          ))}
          
          {(onEdit || customActions.length > 0) && <DropdownMenuSeparator />}
          
          {isToggleable && onToggleStatus && (
            <DropdownMenuItem onClick={() => onToggleStatus(data)}>
              {data.status === 'Active' ? (
                <>
                  <PowerOff className="mr-2 h-3.5 w-3.5" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="mr-2 h-3.5 w-3.5" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
          )}

          {onDelete && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    aria-disabled={!canDelete}
                    onClick={(e) => { if (!canDelete) e.preventDefault(); }}
                >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                </div>
                </AlertDialogTrigger>
                {canDelete && (
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this item.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(data.id)}>
                        Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                )}
            </AlertDialog>
          )}

        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
