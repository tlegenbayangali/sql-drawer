'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDiagramStore } from '@/lib/stores/diagram-store';
import { TableNode } from './table-node';
import { RelationshipEdge } from './relationship-edge';

const nodeTypes = {
  table: TableNode,
} as const;

const edgeTypes = {
  relationship: RelationshipEdge,
} as const;

export function FlowCanvas() {
  const tables = useDiagramStore((state) => state.tables);
  const relationships = useDiagramStore((state) => state.relationships);
  const isCreatingTable = useDiagramStore((state) => state.isCreatingTable);
  const createTable = useDiagramStore((state) => state.createTable);
  const updateTable = useDiagramStore((state) => state.updateTable);
  const createRelationship = useDiagramStore((state) => state.createRelationship);
  const deleteRelationship = useDiagramStore((state) => state.deleteRelationship);

  // Convert tables to ReactFlow nodes
  const nodes: Node[] = useMemo(
    () =>
      tables.map((table) => ({
        id: table.id,
        type: 'table',
        position: { x: table.positionX, y: table.positionY },
        data: { table },
      })),
    [tables]
  );

  // Convert relationships to ReactFlow edges
  const edges: Edge[] = useMemo(
    () =>
      relationships.map((rel) => ({
        id: rel.id,
        source: rel.sourceTableId,
        target: rel.targetTableId,
        sourceHandle: `${rel.sourceTableId}-${rel.sourceColumnId}-right`,
        targetHandle: `${rel.targetTableId}-${rel.targetColumnId}-left`,
        type: 'relationship',
        data: { relationship: rel },
      })),
    [relationships]
  );

  const [internalNodes, setInternalNodes, onNodesChange] = useNodesState(nodes);
  const [internalEdges, setInternalEdges, onEdgesChange] = useEdgesState(edges);

  // Sync internal state with store
  useMemo(() => {
    setInternalNodes(nodes);
  }, [nodes, setInternalNodes]);

  useMemo(() => {
    setInternalEdges(edges);
  }, [edges, setInternalEdges]);

  // Handle node position changes
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);

      // Update table positions in store
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          updateTable(change.id, {
            positionX: change.position.x,
            positionY: change.position.y,
          });
        }
      });
    },
    [onNodesChange, updateTable]
  );

  // Handle edge deletion
  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);

      // Delete relationships when edges are removed
      changes.forEach((change) => {
        if (change.type === 'remove') {
          deleteRelationship(change.id);
        }
      });
    },
    [onEdgesChange, deleteRelationship]
  );

  // Handle new connections (relationships)
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
        return;
      }

      // Parse handle IDs to get column IDs
      // Format: tableId-columnId-direction
      const sourceColumnId = connection.sourceHandle.split('-').slice(1, -1).join('-');
      const targetColumnId = connection.targetHandle.split('-').slice(1, -1).join('-');

      createRelationship(
        connection.source,
        sourceColumnId,
        connection.target,
        targetColumnId,
        '1:N'
      );
    },
    [createRelationship]
  );

  // Handle canvas click for creating tables
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (!isCreatingTable) return;

      const reactFlowBounds = (event.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 150,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      createTable(position);
    },
    [isCreatingTable, createTable]
  );

  return (
    <div className="flex-1 bg-muted/20">
      <ReactFlow
        nodes={internalNodes}
        edges={internalEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes as any}
        edgeTypes={edgeTypes as any}
        fitView
        className={isCreatingTable ? 'cursor-crosshair' : ''}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
