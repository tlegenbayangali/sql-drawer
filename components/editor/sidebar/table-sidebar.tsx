'use client';

import { useState, useRef, useEffect } from 'react';
import { useDiagramStore } from '@/lib/stores/diagram-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, MousePointer2, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableListItem } from './table-list-item';
import { TableEditor } from './table-editor';

const MIN_WIDTH = 250;
const MAX_WIDTH = 380;
const DEFAULT_WIDTH = 380;
const COLLAPSED_WIDTH = 0;

export function TableSidebar() {
  const tables = useDiagramStore((state) => state.tables);
  const selectedTableId = useDiagramStore((state) => state.selectedTableId);
  const isCreatingTable = useDiagramStore((state) => state.isCreatingTable);
  const isSidebarCollapsed = useDiagramStore((state) => state.isSidebarCollapsed);
  const setCreatingTableMode = useDiagramStore((state) => state.setCreatingTableMode);
  const toggleSidebar = useDiagramStore((state) => state.toggleSidebar);

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebar-width');
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (parsedWidth >= MIN_WIDTH && parsedWidth <= MAX_WIDTH) {
        setWidth(parsedWidth);
      }
    }
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem('sidebar-width', width.toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, width]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const currentWidth = isSidebarCollapsed ? COLLAPSED_WIDTH : width;

  return (
    <div
      ref={sidebarRef}
      style={{ width: `${currentWidth}px` }}
      className={`bg-background flex flex-col h-full relative transition-all duration-300 z-40 ${
        isSidebarCollapsed ? '' : 'border-r'
      }`}
    >
      {!isSidebarCollapsed && (
        <>
          <div className="p-3 space-y-2 flex-shrink-0">
            <Button
              onClick={() => setCreatingTableMode(!isCreatingTable)}
              variant={isCreatingTable ? 'default' : 'outline'}
              size="sm"
              className="w-full gap-2"
            >
              {isCreatingTable ? (
                <>
                  <MousePointer2 className="h-3.5 w-3.5" />
                  Click on canvas to create
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Create Table
                </>
              )}
            </Button>
          </div>

          <Separator className="flex-shrink-0" />

          {selectedTable ? (
            <TableEditor table={selectedTable} />
          ) : (
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-3">
                <h3 className="text-sm font-semibold mb-2">Tables ({tables.length})</h3>
                <div className="space-y-1.5">
                  {tables.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No tables yet. Create one to get started.
                    </p>
                  ) : (
                    tables.map((table) => (
                      <TableListItem key={table.id} table={table} />
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </>
      )}

      {/* Toggle Button */}
      <Button
        onClick={toggleSidebar}
        variant="ghost"
        size="icon"
        className={`absolute top-1/2 -translate-y-1/2 h-12 w-6 rounded-md border bg-background hover:bg-accent shadow-sm transition-all z-50 ${
          isSidebarCollapsed ? 'left-2 rounded-l-md' : '-right-6 rounded-l-none border-l-0'
        }`}
        title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isSidebarCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Resize Handle */}
      {!isSidebarCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 hover:w-1.5 transition-all ${
            isResizing ? 'bg-blue-500 w-1.5' : ''
          }`}
        />
      )}
    </div>
  );
}
