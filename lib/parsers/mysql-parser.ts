import type { MySQLDataType } from '@/lib/constants/mysql-types';
import { MYSQL_DATA_TYPES } from '@/lib/constants/mysql-types';
import type {
  ParsedSQLResult,
  ParsedTable,
  ParsedColumn,
  ParsedRelationship,
  ParseError,
} from '@/lib/types/import';

/**
 * Main MySQL SQL parser
 * Parses CREATE TABLE statements and extracts tables, columns, and relationships
 */
export function parseMySQLSQL(sql: string): ParsedSQLResult {
  const result: ParsedSQLResult = {
    tables: [],
    relationships: [],
    errors: [],
  };

  try {
    // Step 1: Preprocess SQL
    const cleaned = preprocessSQL(sql);

    // Step 2: Split into statements
    const statements = splitStatements(cleaned);

    // Step 3: Parse each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;

      if (isCreateTable(stmt)) {
        const table = parseCreateTable(stmt, i + 1);
        if (table) {
          result.tables.push(table.table);
          result.errors.push(...table.errors);
          result.relationships.push(...table.relationships);
        }
      } else if (isAlterTable(stmt)) {
        const fks = parseAlterTableForeignKey(stmt, i + 1);
        result.relationships.push(...fks.relationships);
        result.errors.push(...fks.errors);
      } else if (!shouldSkipSilently(stmt)) {
        // Only warn about potentially important unsupported statements
        if (stmt.length > 10) {
          result.errors.push({
            line: i + 1,
            message: `Skipped unsupported statement: ${stmt.substring(0, 50)}...`,
            severity: 'warning',
          });
        }
      }
    }

    // Step 4: Detect implicit relationships
    const implicit = detectImplicitRelationships(result.tables);
    result.relationships.push(...implicit);
  } catch (error) {
    result.errors.push({
      line: 0,
      message: `Unexpected parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'error',
    });
  }

  return result;
}

/**
 * Preprocess SQL: remove comments and normalize whitespace
 */
function preprocessSQL(sql: string): string {
  // Remove single-line comments (-- ...)
  let cleaned = sql.replace(/--[^\n]*/g, '');

  // Remove multi-line comments (/* ... */)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned.trim();
}

/**
 * Split SQL into individual statements
 */
function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prevChar = i > 0 ? sql[i - 1] : '';

    // Handle string literals
    if ((char === "'" || char === '"' || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }

    // Split on semicolon if not in string
    if (char === ';' && !inString) {
      statements.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last statement if exists
  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

/**
 * Check if statement is CREATE TABLE
 */
function isCreateTable(stmt: string): boolean {
  return /^CREATE\s+TABLE/i.test(stmt);
}

/**
 * Check if statement is ALTER TABLE
 */
function isAlterTable(stmt: string): boolean {
  return /^ALTER\s+TABLE/i.test(stmt);
}

/**
 * Check if statement should be skipped silently (no warning)
 * These are common SQL dump commands that are not relevant for schema import
 */
function shouldSkipSilently(stmt: string): boolean {
  const silentPatterns = [
    /^SET\s+/i,                    // SET SQL_MODE, SET time_zone, etc.
    /^START\s+TRANSACTION/i,       // START TRANSACTION
    /^COMMIT/i,                    // COMMIT
    /^ROLLBACK/i,                  // ROLLBACK
    /^INSERT\s+INTO/i,             // INSERT statements (data, not schema)
    /^UPDATE\s+/i,                 // UPDATE statements
    /^DELETE\s+FROM/i,             // DELETE statements
    /^DROP\s+/i,                   // DROP statements
    /^LOCK\s+TABLES/i,             // LOCK TABLES
    /^UNLOCK\s+TABLES/i,           // UNLOCK TABLES
    /^USE\s+/i,                    // USE database
    /^GRANT\s+/i,                  // GRANT permissions
    /^REVOKE\s+/i,                 // REVOKE permissions
    /^CREATE\s+(?:INDEX|VIEW|PROCEDURE|FUNCTION|TRIGGER|DATABASE|SCHEMA)/i, // Other CREATE types
    /^DELIMITER/i,                 // DELIMITER
    /^\/\*/i,                      // Comments that might slip through
  ];

  return silentPatterns.some((pattern) => pattern.test(stmt));
}

/**
 * Parse CREATE TABLE statement
 */
function parseCreateTable(
  stmt: string,
  lineNumber: number
): { table: ParsedTable; relationships: ParsedRelationship[]; errors: ParseError[] } | null {
  const errors: ParseError[] = [];
  const relationships: ParsedRelationship[] = [];

  try {
    // Extract table name
    const tableNameMatch = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?\s*\(/i);
    if (!tableNameMatch) {
      errors.push({
        line: lineNumber,
        message: 'Could not extract table name from CREATE TABLE statement',
        severity: 'error',
      });
      return null;
    }

    const tableName = tableNameMatch[1];

    // Extract table body (between parentheses)
    const bodyMatch = stmt.match(/\(([\s\S]+)\)(?:\s*ENGINE|\s*DEFAULT|\s*;|\s*$)/i);
    if (!bodyMatch) {
      errors.push({
        line: lineNumber,
        message: `Could not extract table body for table "${tableName}"`,
        severity: 'error',
      });
      return null;
    }

    const body = bodyMatch[1];

    // Split into column/constraint definitions
    const definitions = splitTableDefinitions(body);

    const columns: ParsedColumn[] = [];
    const primaryKeys: string[] = [];
    const uniqueKeys: string[][] = [];
    const indexes: string[][] = [];

    for (const def of definitions) {
      const trimmed = def.trim();

      // Check if it's a constraint
      if (/^PRIMARY\s+KEY/i.test(trimmed)) {
        const cols = extractColumnList(trimmed);
        primaryKeys.push(...cols);
      } else if (/^UNIQUE\s+(?:KEY|INDEX)?/i.test(trimmed)) {
        const cols = extractColumnList(trimmed);
        uniqueKeys.push(cols);
      } else if (/^(?:KEY|INDEX)/i.test(trimmed)) {
        const cols = extractColumnList(trimmed);
        indexes.push(cols);
      } else if (/^(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY/i.test(trimmed)) {
        const fk = parseForeignKey(trimmed, tableName, lineNumber);
        if (fk) relationships.push(fk);
      } else {
        // It's a column definition
        const column = parseColumnDefinition(trimmed, tableName, lineNumber);
        if (column) {
          columns.push(column.column);
          errors.push(...column.errors);
        }
      }
    }

    const table: ParsedTable = {
      name: tableName,
      columns,
      primaryKeys,
      uniqueKeys,
      indexes,
    };

    return { table, relationships, errors };
  } catch (error) {
    errors.push({
      line: lineNumber,
      message: `Error parsing CREATE TABLE: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'error',
    });
    return null;
  }
}

/**
 * Split table body into column/constraint definitions
 * Handles commas inside parentheses (for ENUM, DEFAULT, etc.)
 */
function splitTableDefinitions(body: string): string[] {
  const definitions: string[] = [];
  let current = '';
  let parenDepth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    const prevChar = i > 0 ? body[i - 1] : '';

    // Handle string literals
    if ((char === "'" || char === '"' || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }

    // Track parentheses depth
    if (!inString) {
      if (char === '(') parenDepth++;
      if (char === ')') parenDepth--;
    }

    // Split on comma if not in string and at top level
    if (char === ',' && !inString && parenDepth === 0) {
      definitions.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last definition
  if (current.trim()) {
    definitions.push(current.trim());
  }

  return definitions;
}

/**
 * Parse column definition
 */
function parseColumnDefinition(
  def: string,
  tableName: string,
  lineNumber: number
): { column: ParsedColumn; errors: ParseError[] } | null {
  const errors: ParseError[] = [];

  try {
    // Extract column name
    const nameMatch = def.match(/^[`"]?(\w+)[`"]?\s+/);
    if (!nameMatch) {
      errors.push({
        line: lineNumber,
        message: `Could not extract column name from: ${def.substring(0, 50)}`,
        severity: 'error',
      });
      return null;
    }

    const columnName = nameMatch[1];
    const rest = def.substring(nameMatch[0].length);

    // Extract data type
    const typeMatch = rest.match(/^(\w+)(?:\(([^)]+)\))?/i);
    if (!typeMatch) {
      errors.push({
        line: lineNumber,
        message: `Could not extract data type for column "${columnName}"`,
        severity: 'error',
      });
      return null;
    }

    const rawType = typeMatch[1].toUpperCase();
    const dataType = mapDataType(rawType, errors, lineNumber);

    // Parse attributes
    const nullable = !/NOT\s+NULL/i.test(rest);
    const autoIncrement = /AUTO_INCREMENT/i.test(rest);
    const unsigned = /UNSIGNED/i.test(rest);

    // Extract default value
    let defaultValue: string | null = null;
    const defaultMatch = rest.match(/DEFAULT\s+(?:'([^']*)'|"([^"]*)"|(\S+))/i);
    if (defaultMatch) {
      defaultValue = defaultMatch[1] || defaultMatch[2] || defaultMatch[3];
      if (defaultValue.toUpperCase() === 'NULL') {
        defaultValue = null;
      }
    }

    // Extract comment
    let comment: string | null = null;
    const commentMatch = rest.match(/COMMENT\s+['"]([^'"]+)['"]/i);
    if (commentMatch) {
      comment = commentMatch[1];
    }

    const column: ParsedColumn = {
      name: columnName,
      dataType,
      nullable,
      autoIncrement,
      unsigned,
      defaultValue,
      comment,
    };

    return { column, errors };
  } catch (error) {
    errors.push({
      line: lineNumber,
      message: `Error parsing column definition: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'error',
    });
    return null;
  }
}

/**
 * Map MySQL data type to MySQLDataType enum
 */
function mapDataType(rawType: string, errors: ParseError[], lineNumber: number): MySQLDataType {
  // Direct match
  if (MYSQL_DATA_TYPES.includes(rawType as MySQLDataType)) {
    return rawType as MySQLDataType;
  }

  // Common variations
  const typeMap: Record<string, MySQLDataType> = {
    INTEGER: 'INT',
    BOOL: 'BOOLEAN',
    LONG: 'LONGTEXT',
  };

  if (typeMap[rawType]) {
    return typeMap[rawType];
  }

  // Unknown type - default to VARCHAR with warning
  errors.push({
    line: lineNumber,
    message: `Unknown data type "${rawType}", defaulting to VARCHAR`,
    severity: 'warning',
  });

  return 'VARCHAR';
}

/**
 * Extract column list from constraint (e.g., PRIMARY KEY (id, name))
 */
function extractColumnList(constraint: string): string[] {
  const match = constraint.match(/\(([^)]+)\)/);
  if (!match) return [];

  return match[1]
    .split(',')
    .map((col) => col.trim().replace(/[`"]/g, ''))
    .filter((col) => col.length > 0);
}

/**
 * Parse FOREIGN KEY constraint
 */
function parseForeignKey(
  constraint: string,
  sourceTable: string,
  lineNumber: number
): ParsedRelationship | null {
  try {
    // FOREIGN KEY (column) REFERENCES table(column)
    const match = constraint.match(
      /FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+[`"]?(\w+)[`"]?\s*\(([^)]+)\)/i
    );

    if (!match) return null;

    const sourceColumn = match[1].trim().replace(/[`"]/g, '');
    const targetTable = match[2];
    const targetColumn = match[3].trim().replace(/[`"]/g, '');

    return {
      sourceTable,
      sourceColumn,
      targetTable,
      targetColumn,
      type: 'explicit',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Parse ALTER TABLE ADD FOREIGN KEY
 */
function parseAlterTableForeignKey(
  stmt: string,
  lineNumber: number
): { relationships: ParsedRelationship[]; errors: ParseError[] } {
  const relationships: ParsedRelationship[] = [];
  const errors: ParseError[] = [];

  try {
    // ALTER TABLE table_name ADD [CONSTRAINT] FOREIGN KEY ...
    const tableMatch = stmt.match(/ALTER\s+TABLE\s+[`"]?(\w+)[`"]?/i);
    if (!tableMatch) return { relationships, errors };

    const tableName = tableMatch[1];

    // Extract FOREIGN KEY part
    const fkMatch = stmt.match(/ADD\s+(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+[`"]?(\w+)[`"]?\s*\(([^)]+)\)/i);
    if (!fkMatch) return { relationships, errors };

    const sourceColumn = fkMatch[1].trim().replace(/[`"]/g, '');
    const targetTable = fkMatch[2];
    const targetColumn = fkMatch[3].trim().replace(/[`"]/g, '');

    relationships.push({
      sourceTable: tableName,
      sourceColumn,
      targetTable,
      targetColumn,
      type: 'explicit',
    });
  } catch (error) {
    errors.push({
      line: lineNumber,
      message: `Error parsing ALTER TABLE: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'warning',
    });
  }

  return { relationships, errors };
}

/**
 * Detect implicit relationships based on column naming patterns
 * Pattern: column_name ending with "_id" -> table_name.id
 */
function detectImplicitRelationships(tables: ParsedTable[]): ParsedRelationship[] {
  const relationships: ParsedRelationship[] = [];
  const tableNames = new Set(tables.map((t) => t.name.toLowerCase()));

  for (const table of tables) {
    for (const column of table.columns) {
      // Check if column ends with "_id"
      if (column.name.toLowerCase().endsWith('_id')) {
        const baseName = column.name.toLowerCase().slice(0, -3); // Remove "_id"

        // Try to find matching table (exact, plural, singular)
        const possibleTableNames = [
          baseName,
          baseName + 's', // users
          baseName.endsWith('s') ? baseName.slice(0, -1) : baseName + 's', // handle both singular/plural
        ];

        for (const possibleName of possibleTableNames) {
          if (tableNames.has(possibleName)) {
            // Found potential target table
            const targetTable = tables.find((t) => t.name.toLowerCase() === possibleName);
            if (targetTable) {
              // Check if target table has an "id" column
              const hasIdColumn = targetTable.columns.some((c) => c.name.toLowerCase() === 'id');
              if (hasIdColumn) {
                relationships.push({
                  sourceTable: table.name,
                  sourceColumn: column.name,
                  targetTable: targetTable.name,
                  targetColumn: 'id',
                  type: 'implicit',
                });
                break; // Found match, stop searching
              }
            }
          }
        }
      }
    }
  }

  return relationships;
}
