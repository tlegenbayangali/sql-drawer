'use client';

import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useDiagramStore } from '@/lib/stores/diagram-store';
import { EditorTopBar } from './top-bar/editor-top-bar';
import { TableSidebar } from './sidebar/table-sidebar';
import { FlowCanvas } from './canvas/flow-canvas';
import type { Diagram } from '@/lib/types/database';

interface DiagramEditorProps {
  diagram: any;
}

export function DiagramEditor({ diagram }: DiagramEditorProps) {
  const loadDiagram = useDiagramStore((state) => state.loadDiagram);

  useEffect(() => {
    loadDiagram(diagram as Diagram);
  }, [diagram, loadDiagram]);

  return (
    <div className="h-screen flex flex-col">
      <EditorTopBar />
      <div className="flex-1 flex overflow-hidden">
        <TableSidebar />
        <ReactFlowProvider>
          <FlowCanvas />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
