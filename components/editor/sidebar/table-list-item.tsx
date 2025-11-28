'use client';

import { useDiagramStore } from '@/lib/stores/diagram-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Table } from '@/lib/types/database';
import { Table as TableIcon } from 'lucide-react';

interface TableListItemProps {
  table: Table;
}

export function TableListItem({ table }: TableListItemProps) {
  const selectedTableId = useDiagramStore((state) => state.selectedTableId);
  const selectedTableIds = useDiagramStore((state) => state.selectedTableIds);
  const selectTable = useDiagramStore((state) => state.selectTable);

  const isPrimarySelected = selectedTableId === table.id;
  const isSelected = selectedTableIds.includes(table.id);

  const handleClick = () => {
    selectTable([table.id]);
  };

  return (
    <Button
      variant={isPrimarySelected ? 'secondary' : isSelected ? 'outline' : 'ghost'}
      className={`w-full justify-start gap-2 h-auto py-1.5 text-sm ${
        isSelected && !isPrimarySelected ? 'border-purple-500' : ''
      }`}
      onClick={handleClick}
    >
      <TableIcon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="flex-1 text-left truncate">{table.name}</span>
      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
        {table.columns.length}
      </Badge>
    </Button>
  );
}
