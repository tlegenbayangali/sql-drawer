import type { ParsedTable } from '@/lib/types/import';
import type { RelationshipType } from '@/lib/types/database';

/**
 * Determine relationship type based on column constraints
 *
 * Logic:
 * - Both columns unique/PK → 1:1
 * - Source unique/PK, target not → N:1
 * - Source not unique, target unique/PK → 1:N
 * - Neither unique → 1:N (default, FK usually points to PK)
 */
export function determineRelationshipType(
  sourceTable: ParsedTable,
  targetTable: ParsedTable,
  sourceColumn: string,
  targetColumn: string
): RelationshipType {
  const sourceIsPK = sourceTable.primaryKeys.includes(sourceColumn);
  const targetIsPK = targetTable.primaryKeys.includes(targetColumn);

  const sourceIsUnique = sourceTable.uniqueKeys.some(
    (uk) => uk.length === 1 && uk[0] === sourceColumn
  );
  const targetIsUnique = targetTable.uniqueKeys.some(
    (uk) => uk.length === 1 && uk[0] === targetColumn
  );

  const sourceIsUniqueOrPK = sourceIsPK || sourceIsUnique;
  const targetIsUniqueOrPK = targetIsPK || targetIsUnique;

  // Both columns are unique/PK → 1:1
  if (sourceIsUniqueOrPK && targetIsUniqueOrPK) {
    return '1:1';
  }

  // Source is unique/PK, target is not → N:1
  if (sourceIsUniqueOrPK && !targetIsUniqueOrPK) {
    return 'N:1';
  }

  // Target is unique/PK, source is not → 1:N (most common)
  if (!sourceIsUniqueOrPK && targetIsUniqueOrPK) {
    return '1:N';
  }

  // Default: 1:N (assume FK → PK pattern)
  return '1:N';
}
