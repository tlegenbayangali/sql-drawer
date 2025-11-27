import type { LayoutTable, LayoutPosition } from '@/lib/types/import';

/**
 * Calculate automatic layout positions for imported tables
 * Uses simple grid layout to avoid overlaps with existing tables
 */
export function calculateAutoLayout(
  existingTables: Array<{ id: string; positionX: number; positionY: number }>,
  newTables: LayoutTable[]
): LayoutPosition[] {
  const TABLE_WIDTH = 300;
  const TABLE_HEIGHT = 200; // Average height
  const MARGIN_X = 100;
  const MARGIN_Y = 100;

  // Find starting position (to the right of existing tables)
  let startX = 100;
  let startY = 100;

  if (existingTables.length > 0) {
    const maxX = Math.max(...existingTables.map((t) => t.positionX));
    startX = maxX + TABLE_WIDTH + MARGIN_X;
  }

  // Calculate grid dimensions (roughly square)
  const columns = Math.ceil(Math.sqrt(newTables.length));

  // Position each table in grid
  const positions: LayoutPosition[] = newTables.map((table, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    return {
      tableId: table.id,
      x: startX + col * (TABLE_WIDTH + MARGIN_X),
      y: startY + row * (TABLE_HEIGHT + MARGIN_Y),
    };
  });

  return positions;
}
