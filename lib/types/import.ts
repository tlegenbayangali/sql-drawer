import type { MySQLDataType } from '@/lib/constants/mysql-types';

// Parsed SQL result
export interface ParsedSQLResult {
  tables: ParsedTable[];
  relationships: ParsedRelationship[];
  errors: ParseError[];
}

// Parsed table structure
export interface ParsedTable {
  name: string;
  columns: ParsedColumn[];
  primaryKeys: string[];
  uniqueKeys: string[][];
  indexes: string[][];
}

// Parsed column structure
export interface ParsedColumn {
  name: string;
  dataType: MySQLDataType;
  nullable: boolean;
  autoIncrement: boolean;
  unsigned: boolean;
  defaultValue: string | null;
  comment: string | null;
}

// Parsed relationship
export interface ParsedRelationship {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  type: 'explicit' | 'implicit';
}

// Parse error/warning
export interface ParseError {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

// Layout types
export interface LayoutTable {
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface LayoutRelationship {
  sourceTableId: string;
  targetTableId: string;
}

export interface LayoutPosition {
  tableId: string;
  x: number;
  y: number;
}
