import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/diagrams - Get all diagrams
export async function GET() {
  try {
    const diagrams = await prisma.diagram.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tables: true,
            relationships: true,
          },
        },
      },
    });

    return NextResponse.json(diagrams);
  } catch (error) {
    console.error('Error fetching diagrams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diagrams' },
      { status: 500 }
    );
  }
}

// POST /api/diagrams - Create new diagram
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const diagram = await prisma.diagram.create({
      data: {
        name,
      },
    });

    return NextResponse.json(diagram, { status: 201 });
  } catch (error) {
    console.error('Error creating diagram:', error);
    return NextResponse.json(
      { error: 'Failed to create diagram' },
      { status: 500 }
    );
  }
}
