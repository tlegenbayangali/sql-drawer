'use client';

import { memo, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
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
    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const [open, setOpen] = useState(false);
    const updateRelationship = useDiagramStore((state) => state.updateRelationship);
    const deleteRelationship = useDiagramStore((state) => state.deleteRelationship);

    const { relationship } = (data as unknown as RelationshipEdgeData) || {} as RelationshipEdgeData;

    const handleTypeChange = (type: Relationship['type']) => {
      if (relationship) {
        updateRelationship(relationship.id, { type });
        setOpen(false);
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
        <BaseEdge id={id} path={edgePath} />
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
                <PopoverContent className="w-48 p-2">
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
