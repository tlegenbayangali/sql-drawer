import { prisma } from '@/lib/db';
import { DiagramList } from '@/components/home/diagram-list';
import { CreateDiagramDialog } from '@/components/home/create-diagram-dialog';
import { Database } from 'lucide-react';

export default async function Home() {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8" />
            <h1 className="text-3xl font-bold">SQL Drawer</h1>
          </div>
          <CreateDiagramDialog />
        </div>

        <DiagramList initialDiagrams={diagrams} />
      </div>
    </div>
  );
}
