'use client';

import { memo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from '@xyflow/react';
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

export const RelationshipEdge = memo(
  ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps) => {
    const [open, setOpen] = useState(false);

    const selectedTableId = useDiagramStore((state) => state.selectedTableId);
    const swapRelationshipDirection = useDiagramStore((state) => state.swapRelationshipDirection);
    const deleteRelationship = useDiagramStore((state) => state.deleteRelationship);
    const updateRelationship = useDiagramStore((state) => state.updateRelationship);

    const { relationship } = (data as unknown as RelationshipEdgeData) || {} as RelationshipEdgeData;

    // Use getBezierPath for smooth curves
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

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

        {relationship && (
          <EdgeLabelRenderer>
            {/* Relationship type badge */}
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
