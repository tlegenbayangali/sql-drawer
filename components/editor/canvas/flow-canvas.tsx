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
  const selectTable = useDiagramStore((state) => state.selectTable);
  const createRelationship = useDiagramStore((state) => state.createRelationship);
  const deleteRelationship = useDiagramStore((state) => state.deleteRelationship);
  const setConnectionState = useDiagramStore((state) => state.setConnectionState);

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
        sourceHandle: `${rel.sourceTableId}::${rel.sourceColumnId}::right`,
        targetHandle: `${rel.targetTableId}::${rel.targetColumnId}::left`,
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

  // Handle connection start
  const onConnectStart = useCallback(
    (_: any, params: { handleId: string | null; handleType: string | null; nodeId: string | null }) => {
      if (params.handleId) {
        setConnectionState({
          isConnecting: true,
          sourceHandle: params.handleId,
        });
      }
    },
    [setConnectionState]
  );

  // Handle connection end
  const onConnectEnd = useCallback(() => {
    setConnectionState({
      isConnecting: false,
      sourceHandle: null,
    });
  }, [setConnectionState]);

  // Handle new connections (relationships)
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
        return;
      }

      // Parse handle IDs to get table and column IDs
      // Format: tableId::columnId::direction
      const sourceParts = connection.sourceHandle.split('::');
      const targetParts = connection.targetHandle.split('::');

      // Extract IDs
      // sourceParts = [tableId, columnId, direction]
      const sourceTableId = sourceParts[0];
      const targetTableId = targetParts[0];
      const sourceColumnId = sourceParts[1];
      const targetColumnId = targetParts[1];

      console.log('Connection debug:', {
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        sourceTableId,
        targetTableId,
        sourceColumnId,
        targetColumnId,
      });

      createRelationship(
        sourceTableId,
        sourceColumnId,
        targetTableId,
        targetColumnId,
        '1:N'
      );
    },
    [createRelationship]
  );

  // Handle canvas click for creating tables
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (isCreatingTable) {
        const reactFlowBounds = (event.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
        if (!reactFlowBounds) return;

        const position = {
          x: event.clientX - reactFlowBounds.left - 150,
          y: event.clientY - reactFlowBounds.top - 50,
        };

        createTable(position);
      } else {
        // Deselect table when clicking on empty canvas
        selectTable(null);
      }
    },
    [isCreatingTable, createTable, selectTable]
  );

  return (
    <div className="flex-1 bg-muted/20">
      <ReactFlow
        nodes={internalNodes}
        edges={internalEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
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
