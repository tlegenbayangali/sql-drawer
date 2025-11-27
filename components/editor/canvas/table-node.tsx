"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useDiagramStore } from "@/lib/stores/diagram-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Table } from "@/lib/types/database";
import { Database } from "lucide-react";

interface TableNodeData {
  table: Table;
}

export const TableNode = memo(({ data, selected }: NodeProps) => {
  const { table } = data as unknown as TableNodeData;
  const selectedTableId = useDiagramStore((state) => state.selectedTableId);
  const selectTable = useDiagramStore((state) => state.selectTable);

  const isSelected = selectedTableId === table.id;

  const handleClick = () => {
    selectTable(table.id);
  };

  return (
    <Card
      className={`min-w-[300px] cursor-pointer transition-all ${
        isSelected || selected ? "ring-2 ring-primary shadow-lg" : "shadow-md"
      }`}
      onClick={handleClick}
    >
      <CardHeader style={{ backgroundColor: table.color }} className="pt-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" />
          {table.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {table.columns.length === 0 ? (
          <div className="px-4 py-3 text-sm text-muted-foreground">
            No columns yet
          </div>
        ) : (
          <div className="divide-y">
            {table.columns.map((column) => (
              <div
                key={column.id}
                className="px-4 py-2 hover:bg-muted/50 transition-colors relative"
              >
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${table.id}-${column.id}-left`}
                  className="w-3! h-3! bg-primary! border-2! border-background!"
                />
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${table.id}-${column.id}-right`}
                  className="w-3! h-3! bg-primary! border-2! border-background!"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm truncate">
                      {column.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {column.dataType}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {column.indexType === "PK" && (
                      <Badge variant="default" className="text-xs px-1 py-0">
                        PK
                      </Badge>
                    )}
                    {column.indexType === "UK" && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        UK
                      </Badge>
                    )}
                    {column.indexType === "FK" && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        FK
                      </Badge>
                    )}
                    {column.indexType === "Index" && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        IDX
                      </Badge>
                    )}
                    {column.nullable && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        NULL
                      </Badge>
                    )}
                    {column.autoIncrement && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        AI
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TableNode.displayName = "TableNode";
