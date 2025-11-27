import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';
import type { ParsedTable, ParsedRelationship } from '@/lib/types/import';
import { calculateAutoLayout } from '@/lib/utils/auto-layout';
import { generateMutedColor } from '@/lib/utils/color-generator';
import { determineRelationshipType } from '@/lib/parsers/relationship-detector';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tables, relationships } = body as {
      tables: ParsedTable[];
      relationships: ParsedRelationship[];
    };

    // Validate input
    if (!Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json(
        { error: 'No tables provided for import' },
        { status: 400 }
      );
    }

    // Validate diagram exists
    const diagram = await prisma.diagram.findUnique({
      where: { id },
      include: {
        tables: {
          select: { id: true, name: true, positionX: true, positionY: true },
        },
      },
    });

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    // Check for name conflicts and rename if necessary
    const existingTableNames = new Set(diagram.tables.map((t) => t.name.toLowerCase()));
    const tablesWithUniqueNames = tables.map((table) => {
      let finalName = table.name;
      let counter = 1;

      while (existingTableNames.has(finalName.toLowerCase())) {
        finalName = `${table.name}_${counter}`;
        counter++;
      }

      existingTableNames.add(finalName.toLowerCase());
      return { ...table, name: finalName };
    });

    // Calculate layout positions
    const layoutTables = tablesWithUniqueNames.map((t) => ({
      id: nanoid(),
      name: t.name,
      width: 300,
      height: 100 + t.columns.length * 40,
    }));

    const positions = calculateAutoLayout(diagram.tables, layoutTables);

    // Use transaction for atomic import
    const result = await prisma.$transaction(async (tx) => {
      const createdTables: Array<{ id: string; name: string }> = [];
      const tableNameToId = new Map<string, string>();
      const columnNameToId = new Map<string, string>(); // key: "tableName.columnName"

      // Create tables and columns
      for (let i = 0; i < tablesWithUniqueNames.length; i++) {
        const parsedTable = tablesWithUniqueNames[i];
        const tableId = layoutTables[i].id;
        const position = positions.find((p) => p.tableId === tableId)!;

        // Create table
        const table = await tx.table.create({
          data: {
            id: tableId,
            diagramId: id,
            name: parsedTable.name,
            positionX: position.x,
            positionY: position.y,
            color: generateMutedColor(),
          },
        });

        createdTables.push(table);
        tableNameToId.set(parsedTable.name.toLowerCase(), tableId);

        // Create columns
        for (let colIdx = 0; colIdx < parsedTable.columns.length; colIdx++) {
          const col = parsedTable.columns[colIdx];

          // Determine index type
          let indexType: string = 'None';
          if (parsedTable.primaryKeys.includes(col.name)) {
            indexType = 'PK';
          } else if (parsedTable.uniqueKeys.some((uk) => uk.includes(col.name))) {
            indexType = 'UK';
          } else if (parsedTable.indexes.some((idx) => idx.includes(col.name))) {
            indexType = 'Index';
          }

          const columnId = nanoid();
          await tx.column.create({
            data: {
              id: columnId,
              tableId: tableId,
              name: col.name,
              dataType: col.dataType,
              nullable: col.nullable,
              indexType: indexType,
              autoIncrement: col.autoIncrement,
              unsigned: col.unsigned,
              defaultValue: col.defaultValue,
              comment: col.comment,
              order: colIdx,
            },
          });

          // Store column ID for relationship creation
          const key = `${parsedTable.name}.${col.name}`.toLowerCase();
          columnNameToId.set(key, columnId);
        }
      }

      // Create relationships
      const createdRelationships = [];
      for (const rel of relationships) {
        const sourceTableId = tableNameToId.get(rel.sourceTable.toLowerCase());
        const targetTableId = tableNameToId.get(rel.targetTable.toLowerCase());

        if (!sourceTableId || !targetTableId) {
          console.warn(`Skipping relationship: table not found (${rel.sourceTable} or ${rel.targetTable})`);
          continue;
        }

        // Find column IDs
        const sourceColKey = `${rel.sourceTable}.${rel.sourceColumn}`.toLowerCase();
        const targetColKey = `${rel.targetTable}.${rel.targetColumn}`.toLowerCase();

        const sourceColId = columnNameToId.get(sourceColKey);
        const targetColId = columnNameToId.get(targetColKey);

        if (!sourceColId || !targetColId) {
          console.warn(`Skipping relationship: column not found (${sourceColKey} or ${targetColKey})`);
          continue;
        }

        // Find original parsed tables for relationship type determination
        const sourceTableData = tablesWithUniqueNames.find(
          (t) => t.name.toLowerCase() === rel.sourceTable.toLowerCase()
        );
        const targetTableData = tablesWithUniqueNames.find(
          (t) => t.name.toLowerCase() === rel.targetTable.toLowerCase()
        );

        if (!sourceTableData || !targetTableData) {
          console.warn(`Skipping relationship: parsed table data not found`);
          continue;
        }

        // Determine relationship type
        const relType = determineRelationshipType(
          sourceTableData,
          targetTableData,
          rel.sourceColumn,
          rel.targetColumn
        );

        const relationship = await tx.relationship.create({
          data: {
            id: nanoid(),
            diagramId: id,
            sourceTableId: sourceTableId,
            sourceColumnId: sourceColId,
            targetTableId: targetTableId,
            targetColumnId: targetColId,
            type: relType,
          },
        });

        createdRelationships.push(relationship);
      }

      // Update diagram timestamp
      await tx.diagram.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return {
        tablesCreated: createdTables.length,
        relationshipsCreated: createdRelationships.length,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importing SQL:', error);
    return NextResponse.json(
      {
        error: 'Failed to import SQL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
