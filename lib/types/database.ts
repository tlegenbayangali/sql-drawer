import type { MySQLDataType } from "@/lib/constants/mysql-types";

// Index types
export type IndexType = "PK" | "UK" | "Index" | "None" | "FK";

// Relationship types
export type RelationshipType = "1:1" | "1:N" | "N:1";

// Column interface for frontend
export interface Column {
  id: string;
  tableId: string;
  name: string;
  dataType: MySQLDataType;
  nullable: boolean;
  indexType: IndexType;
  autoIncrement: boolean;
  unsigned: boolean;
  defaultValue: string | null;
  comment: string | null;
  order: number;
}

// Table interface for frontend
export interface Table {
  id: string;
  diagramId: string;
  name: string;
  positionX: number;
  positionY: number;
  color: string;
  columns: Column[];
}

// Relationship interface for frontend
export interface Relationship {
  id: string;
  diagramId: string;
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  type: RelationshipType;
  offsetX?: number;
  offsetY?: number;
}

// Diagram interface for frontend
export interface Diagram {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  tables: Table[];
  relationships: Relationship[];
}

// Partial types for updates
export type ColumnUpdate = Partial<Omit<Column, "id" | "tableId">>;
export type TableUpdate = Partial<Omit<Table, "id" | "diagramId" | "columns">>;
export type RelationshipUpdate = Partial<
  Omit<Relationship, "id" | "diagramId">
>;
