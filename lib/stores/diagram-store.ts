import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { Diagram, Table, Column, Relationship, ColumnUpdate, TableUpdate, RelationshipUpdate } from '@/lib/types/database';
import { generateMutedColor } from '@/lib/utils/color-generator';

interface ConnectionState {
  isConnecting: boolean;
  sourceHandle: string | null;
}

interface DiagramState {
  // State
  currentDiagram: Diagram | null;
  tables: Table[];
  relationships: Relationship[];
  selectedTableId: string | null;
  selectedTableIds: string[];
  highlightedTableIds: string[];
  isCreatingTable: boolean;
  isSaving: boolean;
  isSidebarCollapsed: boolean;
  connectionState: ConnectionState;

  // Actions
  loadDiagram: (diagram: Diagram) => void;
  toggleSidebar: () => void;
  createTable: (position: { x: number; y: number }) => void;
  updateTable: (id: string, updates: TableUpdate) => void;
  deleteTable: (id: string) => void;
  duplicateTable: (id: string) => void;
  selectTable: (ids: string[]) => void;
  setCreatingTableMode: (isCreating: boolean) => void;
  setConnectionState: (state: ConnectionState) => void;

  addColumn: (tableId: string) => void;
  updateColumn: (columnId: string, updates: ColumnUpdate) => void;
  deleteColumn: (columnId: string) => void;
  reorderColumns: (tableId: string, fromIndex: number, toIndex: number) => void;

  createRelationship: (
    sourceTableId: string,
    sourceColumnId: string,
    targetTableId: string,
    targetColumnId: string,
    type: Relationship['type']
  ) => void;
  updateRelationship: (id: string, updates: RelationshipUpdate) => void;
  swapRelationshipDirection: (id: string) => void;
  deleteRelationship: (id: string) => void;

  saveDiagram: () => Promise<void>;
  reloadDiagram: (diagramId: string) => Promise<void>;
}

export const useDiagramStore = create<DiagramState>()(
  immer((set, get) => ({
    // Initial state
    currentDiagram: null,
    tables: [],
    relationships: [],
    selectedTableId: null,
    selectedTableIds: [],
    highlightedTableIds: [],
    isCreatingTable: false,
    isSaving: false,
    isSidebarCollapsed: false,
    connectionState: {
      isConnecting: false,
      sourceHandle: null,
    },

    // Load diagram
    loadDiagram: (diagram) => {
      set((state) => {
        state.currentDiagram = diagram;
        state.tables = diagram.tables;
        state.relationships = diagram.relationships;
      });
    },

    // Toggle sidebar
    toggleSidebar: () => {
      set((state) => {
        state.isSidebarCollapsed = !state.isSidebarCollapsed;
      });
    },

    // Table operations
    createTable: (position) => {
      set((state) => {
        const diagramId = state.currentDiagram?.id;
        if (!diagramId) return;

        const tableId = nanoid();

        // Create default id column according to spec:
        // bigInt, primary, not nullable, autoincrement, unsigned, no default value, no comment
        const defaultColumn: Column = {
          id: nanoid(),
          tableId,
          name: 'id',
          dataType: 'BIGINT',
          nullable: false,
          indexType: 'PK',
          autoIncrement: true,
          unsigned: true,
          defaultValue: null,
          comment: null,
          order: 0,
        };

        const newTable: Table = {
          id: tableId,
          diagramId,
          name: `table_${state.tables.length + 1}`,
          positionX: position.x,
          positionY: position.y,
          color: generateMutedColor(),
          columns: [defaultColumn],
        };

        state.tables.push(newTable);
        state.selectedTableId = newTable.id;
        state.isCreatingTable = false;
      });
    },

    updateTable: (id, updates) => {
      set((state) => {
        const table = state.tables.find((t) => t.id === id);
        if (table) {
          Object.assign(table, updates);
        }
      });
    },

    deleteTable: (id) => {
      set((state) => {
        // Remove table
        state.tables = state.tables.filter((t) => t.id !== id);

        // Remove relationships connected to this table
        state.relationships = state.relationships.filter(
          (r) => r.sourceTableId !== id && r.targetTableId !== id
        );

        // Clear selection if deleted table was selected
        if (state.selectedTableId === id) {
          state.selectedTableId = null;
        }
      });
    },

    duplicateTable: (id) => {
      set((state) => {
        const table = state.tables.find((t) => t.id === id);
        if (!table) return;

        const newTable: Table = {
          ...table,
          id: nanoid(),
          name: `${table.name}_copy`,
          positionX: table.positionX + 50,
          positionY: table.positionY + 50,
          color: generateMutedColor(),
          columns: table.columns.map((col) => ({
            ...col,
            id: nanoid(),
            tableId: nanoid(), // Will be updated below
          })),
        };

        // Update column tableId to match new table
        newTable.columns.forEach((col) => {
          col.tableId = newTable.id;
        });

        state.tables.push(newTable);
      });
    },

    selectTable: (ids) => {
      set((state) => {
        state.selectedTableIds = ids;
        state.selectedTableId = ids.length > 0 ? ids[ids.length - 1] : null;

        // Find and highlight related tables for all selected tables
        if (ids.length > 0) {
          const relatedTableIds = new Set<string>();

          ids.forEach(selectedId => {
            // Find all tables connected through relationships
            state.relationships.forEach((rel) => {
              if (rel.sourceTableId === selectedId) {
                relatedTableIds.add(rel.targetTableId);
              } else if (rel.targetTableId === selectedId) {
                relatedTableIds.add(rel.sourceTableId);
              }
            });
          });

          state.highlightedTableIds = Array.from(relatedTableIds);
        } else {
          state.highlightedTableIds = [];
        }
      });
    },

    setCreatingTableMode: (isCreating) => {
      set((state) => {
        state.isCreatingTable = isCreating;
      });
    },

    setConnectionState: (connectionState) => {
      set((state) => {
        state.connectionState = connectionState;
      });
    },

    // Column operations
    addColumn: (tableId) => {
      set((state) => {
        const table = state.tables.find((t) => t.id === tableId);
        if (!table) return;

        const newColumn: Column = {
          id: nanoid(),
          tableId,
          name: `column_${table.columns.length + 1}`,
          dataType: 'INT',
          nullable: true,
          indexType: 'None',
          autoIncrement: false,
          unsigned: false,
          defaultValue: null,
          comment: null,
          order: table.columns.length,
        };

        table.columns.push(newColumn);
      });
    },

    updateColumn: (columnId, updates) => {
      set((state) => {
        for (const table of state.tables) {
          const column = table.columns.find((c) => c.id === columnId);
          if (column) {
            Object.assign(column, updates);
            break;
          }
        }
      });
    },

    deleteColumn: (columnId) => {
      set((state) => {
        for (const table of state.tables) {
          const index = table.columns.findIndex((c) => c.id === columnId);
          if (index !== -1) {
            table.columns.splice(index, 1);

            // Reorder remaining columns
            table.columns.forEach((col, idx) => {
              col.order = idx;
            });

            break;
          }
        }

        // Remove relationships connected to this column
        state.relationships = state.relationships.filter(
          (r) => r.sourceColumnId !== columnId && r.targetColumnId !== columnId
        );
      });
    },

    reorderColumns: (tableId, fromIndex, toIndex) => {
      set((state) => {
        const table = state.tables.find((t) => t.id === tableId);
        if (!table) return;

        const [movedColumn] = table.columns.splice(fromIndex, 1);
        table.columns.splice(toIndex, 0, movedColumn);

        // Update order
        table.columns.forEach((col, idx) => {
          col.order = idx;
        });
      });
    },

    // Relationship operations
    createRelationship: (sourceTableId, sourceColumnId, targetTableId, targetColumnId, type) => {
      set((state) => {
        const diagramId = state.currentDiagram?.id;
        if (!diagramId) return;

        const newRelationship: Relationship = {
          id: nanoid(),
          diagramId,
          sourceTableId,
          sourceColumnId,
          targetTableId,
          targetColumnId,
          type,
          pathType: 'bezier',
        };

        state.relationships.push(newRelationship);
      });
    },

    updateRelationship: (id, updates) => {
      set((state) => {
        const relationship = state.relationships.find((r) => r.id === id);
        if (relationship) {
          Object.assign(relationship, updates);
        }
      });
    },

    swapRelationshipDirection: (id) => {
      set((state) => {
        const relationship = state.relationships.find((r) => r.id === id);
        if (relationship) {
          // Swap source and target
          const tempTableId = relationship.sourceTableId;
          const tempColumnId = relationship.sourceColumnId;

          relationship.sourceTableId = relationship.targetTableId;
          relationship.sourceColumnId = relationship.targetColumnId;
          relationship.targetTableId = tempTableId;
          relationship.targetColumnId = tempColumnId;

          // Update relationship type accordingly
          if (relationship.type === '1:N') {
            relationship.type = 'N:1';
          } else if (relationship.type === 'N:1') {
            relationship.type = '1:N';
          }
          // 1:1 stays the same
        }
      });
    },

    deleteRelationship: (id) => {
      set((state) => {
        state.relationships = state.relationships.filter((r) => r.id !== id);
      });
    },

    // Save diagram
    saveDiagram: async () => {
      const { currentDiagram, tables, relationships } = get();
      if (!currentDiagram) return;

      console.log('Saving diagram:', {
        diagramId: currentDiagram.id,
        tablesCount: tables.length,
        relationshipsCount: relationships.length,
        tables,
        relationships,
      });

      set((state) => {
        state.isSaving = true;
      });

      try {
        const response = await fetch(`/api/diagrams/${currentDiagram.id}/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tables,
            relationships,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Save failed with status:', response.status, errorData);
          throw new Error(`Failed to save diagram: ${errorData.error || response.statusText}`);
        }
      } catch (error) {
        console.error('Error saving diagram:', error);
        throw error;
      } finally {
        set((state) => {
          state.isSaving = false;
        });
      }
    },

    // Reload diagram from server
    reloadDiagram: async (diagramId: string) => {
      try {
        const response = await fetch(`/api/diagrams/${diagramId}`);

        if (!response.ok) {
          throw new Error('Failed to reload diagram');
        }

        const diagram = await response.json();

        set((state) => {
          state.currentDiagram = diagram;
          state.tables = diagram.tables;
          state.relationships = diagram.relationships;
        });
      } catch (error) {
        console.error('Error reloading diagram:', error);
        throw error;
      }
    },
  }))
);
