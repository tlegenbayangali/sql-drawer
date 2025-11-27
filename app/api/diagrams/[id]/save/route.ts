import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Table, Relationship } from '@/lib/types/database';

// POST /api/diagrams/[id]/save - Save diagram changes
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tables, relationships } = body as {
      tables: Table[];
      relationships: Relationship[];
    };

    // Verify diagram exists
    const diagram = await prisma.diagram.findUnique({
      where: { id },
    });

    if (!diagram) {
      return NextResponse.json(
        { error: 'Diagram not found' },
        { status: 404 }
      );
    }

    // Use transaction to ensure atomic updates
    await prisma.$transaction(async (tx) => {
      // Get existing tables, columns, and relationships
      const existingTables = await tx.table.findMany({
        where: { diagramId: id },
        include: { columns: true },
      });

      const existingTableIds = new Set(existingTables.map((t) => t.id));
      const newTableIds = new Set(tables.map((t) => t.id));

      const existingColumnIds = new Set(
        existingTables.flatMap((t) => t.columns.map((c) => c.id))
      );
      const newColumnIds = new Set(
        tables.flatMap((t) => t.columns.map((c) => c.id))
      );

      const existingRelationships = await tx.relationship.findMany({
        where: { diagramId: id },
      });
      const existingRelationshipIds = new Set(existingRelationships.map((r) => r.id));
      const newRelationshipIds = new Set(relationships.map((r) => r.id));

      // Delete removed tables (cascade will delete columns)
      const tablesToDelete = [...existingTableIds].filter((id) => !newTableIds.has(id));
      if (tablesToDelete.length > 0) {
        await tx.table.deleteMany({
          where: {
            id: { in: tablesToDelete },
          },
        });
      }

      // Delete removed columns
      const columnsToDelete = [...existingColumnIds].filter((id) => !newColumnIds.has(id));
      if (columnsToDelete.length > 0) {
        await tx.column.deleteMany({
          where: {
            id: { in: columnsToDelete },
          },
        });
      }

      // Delete removed relationships
      const relationshipsToDelete = [...existingRelationshipIds].filter(
        (id) => !newRelationshipIds.has(id)
      );
      if (relationshipsToDelete.length > 0) {
        await tx.relationship.deleteMany({
          where: {
            id: { in: relationshipsToDelete },
          },
        });
      }

      // Upsert tables
      for (const table of tables) {
        await tx.table.upsert({
          where: { id: table.id },
          create: {
            id: table.id,
            diagramId: id,
            name: table.name,
            positionX: table.positionX,
            positionY: table.positionY,
            color: table.color,
          },
          update: {
            name: table.name,
            positionX: table.positionX,
            positionY: table.positionY,
            color: table.color,
          },
        });

        // Upsert columns for this table
        for (const column of table.columns) {
          await tx.column.upsert({
            where: { id: column.id },
            create: {
              id: column.id,
              tableId: table.id,
              name: column.name,
              dataType: column.dataType,
              nullable: column.nullable,
              indexType: column.indexType,
              autoIncrement: column.autoIncrement,
              unsigned: column.unsigned,
              defaultValue: column.defaultValue,
              comment: column.comment,
              order: column.order,
            },
            update: {
              name: column.name,
              dataType: column.dataType,
              nullable: column.nullable,
              indexType: column.indexType,
              autoIncrement: column.autoIncrement,
              unsigned: column.unsigned,
              defaultValue: column.defaultValue,
              comment: column.comment,
              order: column.order,
            },
          });
        }
      }

      // Upsert relationships
      for (const relationship of relationships) {
        await tx.relationship.upsert({
          where: { id: relationship.id },
          create: {
            id: relationship.id,
            diagramId: id,
            sourceTableId: relationship.sourceTableId,
            sourceColumnId: relationship.sourceColumnId,
            targetTableId: relationship.targetTableId,
            targetColumnId: relationship.targetColumnId,
            type: relationship.type,
          },
          update: {
            sourceTableId: relationship.sourceTableId,
            sourceColumnId: relationship.sourceColumnId,
            targetTableId: relationship.targetTableId,
            targetColumnId: relationship.targetColumnId,
            type: relationship.type,
          },
        });
      }

      // Update diagram's updatedAt timestamp
      await tx.diagram.update({
        where: { id },
        data: {
          updatedAt: new Date(),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving diagram:', error);

    // Log the full error details
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Failed to save diagram',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
