'use client';

import { useDiagramStore } from '@/lib/stores/diagram-store';
import { Input } from '@/components/ui/input';
import type { Column } from '@/lib/types/database';
import { ColumnAttributesPopover } from './column-attributes-popover';

interface ColumnEditorRowProps {
  column: Column;
}

export function ColumnEditorRow({ column }: ColumnEditorRowProps) {
  const updateColumn = useDiagramStore((state) => state.updateColumn);

  const handleNameChange = (name: string) => {
    updateColumn(column.id, { name });
  };

  return (
    <div className="border rounded-md p-2 space-y-2 bg-card">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] text-muted-foreground">Name</label>
          <Input
            value={column.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="column_name"
            className="h-7 text-xs"
          />
        </div>
        <ColumnAttributesPopover column={column} />
      </div>
    </div>
  );
}
