import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/diagrams/[id] - Get diagram by ID with all tables and relationships
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const diagram = await prisma.diagram.findUnique({
      where: { id },
      include: {
        tables: {
          include: {
            columns: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        relationships: true,
      },
    });

    if (!diagram) {
      return NextResponse.json(
        { error: 'Diagram not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(diagram);
  } catch (error) {
    console.error('Error fetching diagram:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diagram' },
      { status: 500 }
    );
  }
}

// DELETE /api/diagrams/[id] - Delete diagram
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.diagram.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting diagram:', error);
    return NextResponse.json(
      { error: 'Failed to delete diagram' },
      { status: 500 }
    );
  }
}
