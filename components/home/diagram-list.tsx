'use client';

import { useState } from 'react';
import { DiagramCard } from './diagram-card';

interface Diagram {
  id: string;
  name: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count: {
    tables: number;
    relationships: number;
  };
}

interface DiagramListProps {
  initialDiagrams: Diagram[];
}

export function DiagramList({ initialDiagrams }: DiagramListProps) {
  const [diagrams, setDiagrams] = useState<Diagram[]>(initialDiagrams);

  const handleDelete = (id: string) => {
    setDiagrams((prev) => prev.filter((d) => d.id !== id));
  };

  if (diagrams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No diagrams yet. Create your first database schema!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {diagrams.map((diagram) => (
        <DiagramCard
          key={diagram.id}
          diagram={diagram}
          onDelete={() => handleDelete(diagram.id)}
        />
      ))}
    </div>
  );
}
