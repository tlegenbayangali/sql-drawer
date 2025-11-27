import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { DiagramEditor } from '@/components/editor/diagram-editor';

export default async function DiagramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    notFound();
  }

  return <DiagramEditor diagram={diagram} />;
}
