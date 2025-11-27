"use client";

import { memo, useState, useRef, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useDiagramStore } from "@/lib/stores/diagram-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Table } from "@/lib/types/database";
import { Database } from "lucide-react";

interface TableNodeData {
  table: Table;
}

type HoverState = {
  columnId: string;
  side: 'left' | 'right';
} | null;

export const TableNode = memo(({ data, selected }: NodeProps) => {
  const { table } = data as unknown as TableNodeData;
  const selectedTableId = useDiagramStore((state) => state.selectedTableId);
  const highlightedTableIds = useDiagramStore((state) => state.highlightedTableIds);
  const selectTable = useDiagramStore((state) => state.selectTable);
  const connectionState = useDiagramStore((state) => state.connectionState);
  const [hoverState, setHoverState] = useState<HoverState>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSelected = selectedTableId === table.id;
  const isHighlighted = highlightedTableIds.includes(table.id);

  const handleClick = () => {
    selectTable(table.id);
  };

  const showHandle = useCallback((columnId: string, side: 'left' | 'right') => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setHoverState({ columnId, side });
  }, []);

  const hideHandle = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setHoverState(null);
    }, 150);
  }, []);

  return (
    <Card
      className={`min-w-[300px] cursor-pointer transition-all ${
        isSelected || selected
          ? "ring-2 ring-primary shadow-lg"
          : isHighlighted
          ? "ring-2 ring-blue-400 shadow-md"
          : "shadow-md"
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
            {table.columns.map((column) => {
              const leftHandleId = `${table.id}::${column.id}::left`;
              const rightHandleId = `${table.id}::${column.id}::right`;

              // Show handle on hover
              const hoveredLeft = hoverState?.columnId === column.id && hoverState?.side === 'left';
              const hoveredRight = hoverState?.columnId === column.id && hoverState?.side === 'right';

              // Show handle when connecting from another handle
              const connectingToLeft = connectionState.isConnecting &&
                connectionState.sourceHandle?.endsWith('::right') &&
                !connectionState.sourceHandle?.startsWith(table.id);
              const connectingToRight = connectionState.isConnecting &&
                connectionState.sourceHandle?.endsWith('::left') &&
                !connectionState.sourceHandle?.startsWith(table.id);

              const showLeftHandle = hoveredLeft || connectingToLeft;
              const showRightHandle = hoveredRight || connectingToRight;

              return (
                <div
                  key={column.id}
                  className="px-4 py-2 hover:bg-muted/50 transition-colors relative"
                >
                  {/* Hover areas for showing handles */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-12 z-10"
                    onMouseEnter={() => showHandle(column.id, 'left')}
                    onMouseLeave={hideHandle}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-12 z-10"
                    onMouseEnter={() => showHandle(column.id, 'right')}
                    onMouseLeave={hideHandle}
                  />

                  {/* Connection handles - always in DOM but visually hidden/shown */}
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={leftHandleId}
                    className={`w-3! h-3! border-2! border-background! z-20 transition-opacity ${
                      showLeftHandle ? 'opacity-100 bg-primary!' : 'opacity-0'
                    }`}
                    onMouseEnter={() => showHandle(column.id, 'left')}
                    onMouseLeave={hideHandle}
                  />
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={rightHandleId}
                    className={`w-3! h-3! border-2! border-background! z-20 transition-opacity ${
                      showRightHandle ? 'opacity-100 bg-primary!' : 'opacity-0'
                    }`}
                    onMouseEnter={() => showHandle(column.id, 'right')}
                    onMouseLeave={hideHandle}
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
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TableNode.displayName = "TableNode";
