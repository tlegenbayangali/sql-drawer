'use client';

import { memo, useState, useCallback } from 'react';
import { BaseEdge, EdgeLabelRenderer, type EdgeProps, Position } from '@xyflow/react';
import { Trash2, ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDiagramStore } from '@/lib/stores/diagram-store';
import type { Relationship } from '@/lib/types/database';

interface RelationshipEdgeData {
  relationship: Relationship;
}

const RELATIONSHIP_TYPES: Array<Relationship['type']> = ['1:1', '1:N', 'N:1'];

// Helper to calculate smooth step path with custom offsets
const getCustomSmoothStepPath = (
  sourceX: number,
  sourceY: number,
  sourcePosition: Position,
  targetX: number,
  targetY: number,
  targetPosition: Position,
  offsetX: number = 0,
  offsetY: number = 0
): [string, number, number, { x: number; y: number }[]] => {
  const isHorizontalSource = sourcePosition === Position.Left || sourcePosition === Position.Right;
  const isHorizontalTarget = targetPosition === Position.Left || targetPosition === Position.Right;

  const points: { x: number; y: number }[] = [];

  // Starting point
  points.push({ x: sourceX, y: sourceY });

  // Calculate midpoints with offsets
  if (isHorizontalSource && isHorizontalTarget) {
    // Horizontal to horizontal
    const midX = (sourceX + targetX) / 2 + offsetX;
    points.push({ x: midX, y: sourceY });
    points.push({ x: midX, y: targetY });
  } else if (!isHorizontalSource && !isHorizontalTarget) {
    // Vertical to vertical
    const midY = (sourceY + targetY) / 2 + offsetY;
    points.push({ x: sourceX, y: midY });
    points.push({ x: targetX, y: midY });
  } else if (isHorizontalSource && !isHorizontalTarget) {
    // Horizontal to vertical
    const cornerX = (sourceX + targetX) / 2 + offsetX;
    const cornerY = (sourceY + targetY) / 2 + offsetY;
    points.push({ x: cornerX, y: sourceY });
    points.push({ x: cornerX, y: cornerY });
    points.push({ x: targetX, y: cornerY });
  } else {
    // Vertical to horizontal
    const cornerX = (sourceX + targetX) / 2 + offsetX;
    const cornerY = (sourceY + targetY) / 2 + offsetY;
    points.push({ x: sourceX, y: cornerY });
    points.push({ x: cornerX, y: cornerY });
    points.push({ x: cornerX, y: targetY });
  }

  // End point
  points.push({ x: targetX, y: targetY });

  // Build SVG path
  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x},${points[i].y}`;
  }

  // Calculate label position (center of path)
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;

  return [path, labelX, labelY, points];
};

export const RelationshipEdge = memo(
  ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps) => {
    const [open, setOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const selectedTableId = useDiagramStore((state) => state.selectedTableId);
    const updateRelationship = useDiagramStore((state) => state.updateRelationship);
    const swapRelationshipDirection = useDiagramStore((state) => state.swapRelationshipDirection);
    const deleteRelationship = useDiagramStore((state) => state.deleteRelationship);

    const { relationship } = (data as unknown as RelationshipEdgeData) || {} as RelationshipEdgeData;

    const offsetX = relationship?.offsetX ?? 0;
    const offsetY = relationship?.offsetY ?? 0;

    const [edgePath, labelX, labelY, points] = getCustomSmoothStepPath(
      sourceX,
      sourceY,
      sourcePosition ?? Position.Right,
      targetX,
      targetY,
      targetPosition ?? Position.Left,
      offsetX,
      offsetY
    );

    // Check if this edge is connected to the selected table
    const isHighlighted = relationship && selectedTableId &&
      (relationship.sourceTableId === selectedTableId || relationship.targetTableId === selectedTableId);

    const handleTypeChange = (type: Relationship['type']) => {
      if (relationship) {
        updateRelationship(relationship.id, { type });
        setOpen(false);
      }
    };

    const handleSwapDirection = () => {
      if (relationship) {
        swapRelationshipDirection(relationship.id);
      }
    };

    const handleDelete = () => {
      if (relationship) {
        deleteRelationship(relationship.id);
        setOpen(false);
      }
    };

    // Handle dragging vertical segments (left/right)
    const handleVerticalDrag = useCallback((e: React.MouseEvent, pointIndex: number) => {
      if (!relationship) return;

      const startX = e.clientX;
      const startOffsetX = offsetX;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        setIsDragging(true);
        const deltaX = moveEvent.clientX - startX;
        updateRelationship(relationship.id, {
          offsetX: startOffsetX + deltaX
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }, [relationship, offsetX, updateRelationship]);

    // Handle dragging horizontal segments (up/down)
    const handleHorizontalDrag = useCallback((e: React.MouseEvent, pointIndex: number) => {
      if (!relationship) return;

      const startY = e.clientY;
      const startOffsetY = offsetY;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        setIsDragging(true);
        const deltaY = moveEvent.clientY - startY;
        updateRelationship(relationship.id, {
          offsetY: startOffsetY + deltaY
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }, [relationship, offsetY, updateRelationship]);

    // Render draggable handles on segments
    const renderDraggableHandles = () => {
      if (!relationship || points.length < 2) return null;

      const handles = [];

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        // Determine if segment is vertical or horizontal
        const isVertical = Math.abs(p1.x - p2.x) < 5;
        const isHorizontal = Math.abs(p1.y - p2.y) < 5;

        if (isVertical || isHorizontal) {
          handles.push(
            <g key={`handle-${i}`}>
              {/* Invisible larger hitbox */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="transparent"
                strokeWidth="20"
                className={isVertical ? 'cursor-ew-resize' : 'cursor-ns-resize'}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (isVertical) {
                    handleVerticalDrag(e, i);
                  } else {
                    handleHorizontalDrag(e, i);
                  }
                }}
              />
              {/* Visible handle */}
              <circle
                cx={midX}
                cy={midY}
                r="5"
                fill={isDragging ? '#60a5fa' : 'white'}
                stroke="#60a5fa"
                strokeWidth="2"
                className={`${isVertical ? 'cursor-ew-resize' : 'cursor-ns-resize'} transition-all`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (isVertical) {
                    handleVerticalDrag(e, i);
                  } else {
                    handleHorizontalDrag(e, i);
                  }
                }}
                style={{ pointerEvents: 'all' }}
              />
            </g>
          );
        }
      }

      return handles;
    };

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            strokeWidth: isHighlighted ? 3 : 2,
            stroke: isHighlighted ? '#60a5fa' : undefined,
          }}
        />

        {/* Draggable handles */}
        <g className="nodrag nopan">
          {renderDraggableHandles()}
        </g>

        {relationship && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                pointerEvents: 'all',
              }}
              className="nodrag nopan"
            >
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                  >
                    {relationship.type}
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                      Relationship Type
                    </div>
                    <div className="flex flex-col gap-1">
                      {RELATIONSHIP_TYPES.map((type) => (
                        <Button
                          key={type}
                          variant={relationship.type === type ? "default" : "ghost"}
                          size="sm"
                          className="justify-start"
                          onClick={() => handleTypeChange(type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>

                    <div className="border-t pt-2">
                      <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                        Direction
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleSwapDirection}
                      >
                        <ArrowLeftRight className="mr-2 h-3 w-3" />
                        Swap Direction
                      </Button>
                    </div>

                    <div className="border-t pt-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={handleDelete}
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }
);

RelationshipEdge.displayName = 'RelationshipEdge';
