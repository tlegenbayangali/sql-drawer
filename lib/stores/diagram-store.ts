import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { Diagram, Table, Column, Relationship, ColumnUpdate, TableUpdate, RelationshipUpdate } from '@/lib/types/database';
import { generateMutedColor } from '@/lib/utils/color-generator';

interface DiagramState {
  // State
  currentDiagram: Diagram | null;
  tables: Table[];
  relationships: Relationship[];
  selectedTableId: string | null;
  isCreatingTable: boolean;
  isSaving: boolean;

  // Actions
  loadDiagram: (diagram: Diagram) => void;
  createTable: (position: { x: number; y: number }) => void;
  updateTable: (id: string, updates: TableUpdate) => void;
  deleteTable: (id: string) => void;
  duplicateTable: (id: string) => void;
  selectTable: (id: string | null) => void;
  setCreatingTableMode: (isCreating: boolean) => void;

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
  deleteRelationship: (id: string) => void;

  saveDiagram: () => Promise<void>;
}

export const useDiagramStore = create<DiagramState>()(
  immer((set, get) => ({
    // Initial state
    currentDiagram: null,
    tables: [],
    relationships: [],
    selectedTableId: null,
    isCreatingTable: false,
    isSaving: false,

    // Load diagram
    loadDiagram: (diagram) => {
      set((state) => {
        state.currentDiagram = diagram;
        state.tables = diagram.tables;
        state.relationships = diagram.relationships;
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

    selectTable: (id) => {
      set((state) => {
        state.selectedTableId = id;
      });
    },

    setCreatingTableMode: (isCreating) => {
      set((state) => {
        state.isCreatingTable = isCreating;
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

    deleteRelationship: (id) => {
      set((state) => {
        state.relationships = state.relationships.filter((r) => r.id !== id);
      });
    },

    // Save diagram
    saveDiagram: async () => {
      const { currentDiagram, tables, relationships } = get();
      if (!currentDiagram) return;

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
          throw new Error('Failed to save diagram');
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
  }))
);
