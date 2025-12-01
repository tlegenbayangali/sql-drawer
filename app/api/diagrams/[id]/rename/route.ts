import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await req.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const diagram = await prisma.diagram.update({
      where: { id },
      data: {
        name: name.trim(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(diagram);
  } catch (error) {
    console.error('Error renaming diagram:', error);
    return NextResponse.json(
      { error: 'Failed to rename diagram' },
      { status: 500 }
    );
  }
}
