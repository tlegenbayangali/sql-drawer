'use client';

import { useDiagramStore } from '@/lib/stores/diagram-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Table } from '@/lib/types/database';
import { ArrowLeft, Plus, Trash2, Copy } from 'lucide-react';
import { ColumnEditorRow } from './column-editor-row';
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

interface TableEditorProps {
  table: Table;
}

export function TableEditor({ table }: TableEditorProps) {
  const selectTable = useDiagramStore((state) => state.selectTable);
  const updateTable = useDiagramStore((state) => state.updateTable);
  const deleteTable = useDiagramStore((state) => state.deleteTable);
  const duplicateTable = useDiagramStore((state) => state.duplicateTable);
  const addColumn = useDiagramStore((state) => state.addColumn);

  const handleNameChange = (name: string) => {
    updateTable(table.id, { name });
  };

  const handleDelete = () => {
    deleteTable(table.id);
  };

  const handleDuplicate = () => {
    duplicateTable(table.id);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header section - fixed */}
      <div className="p-3 space-y-2.5 flex-shrink-0">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectTable([])}
            className="gap-1.5 h-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Table Name</label>
          <Input
            value={table.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Table name"
            className="h-8 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            className="gap-1.5 flex-1 h-8 text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5 flex-1 h-8 text-xs">
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Table</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{table.name}&quot;? This will also
                  delete all columns and relationships.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Separator className="flex-shrink-0" />

      {/* Columns header - fixed */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Columns ({table.columns.length})</h3>
          <Button size="sm" onClick={() => addColumn(table.id)} className="gap-1.5 h-7 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>

      {/* Scrollable columns section */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 pt-2 pb-3 space-y-2">
          {table.columns.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No columns yet. Add one to get started.
            </p>
          ) : (
            table.columns.map((column) => (
              <ColumnEditorRow key={column.id} column={column} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
