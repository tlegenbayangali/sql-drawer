'use client';

import { useDiagramStore } from '@/lib/stores/diagram-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, MousePointer2 } from 'lucide-react';
import { TableListItem } from './table-list-item';
import { TableEditor } from './table-editor';

export function TableSidebar() {
  const tables = useDiagramStore((state) => state.tables);
  const selectedTableId = useDiagramStore((state) => state.selectedTableId);
  const isCreatingTable = useDiagramStore((state) => state.isCreatingTable);
  const setCreatingTableMode = useDiagramStore((state) => state.setCreatingTableMode);

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  return (
    <div className="w-[380px] border-r bg-background flex flex-col h-full">
      <div className="p-3 space-y-2 flex-shrink-0">
        <Button
          onClick={() => setCreatingTableMode(!isCreatingTable)}
          variant={isCreatingTable ? 'default' : 'outline'}
          size="sm"
          className="w-full gap-2"
        >
          {isCreatingTable ? (
            <>
              <MousePointer2 className="h-3.5 w-3.5" />
              Click on canvas to create
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Create Table
            </>
          )}
        </Button>
      </div>

      <Separator className="flex-shrink-0" />

      {selectedTable ? (
        <TableEditor table={selectedTable} />
      ) : (
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3">
            <h3 className="text-sm font-semibold mb-2">Tables ({tables.length})</h3>
            <div className="space-y-1.5">
              {tables.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No tables yet. Create one to get started.
                </p>
              ) : (
                tables.map((table) => (
                  <TableListItem key={table.id} table={table} />
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
