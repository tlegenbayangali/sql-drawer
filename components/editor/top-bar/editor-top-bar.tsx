'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDiagramStore } from '@/lib/stores/diagram-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Loader2, Upload } from 'lucide-react';
import { ImportSQLDialog } from '@/components/editor/import/import-sql-dialog';

export function EditorTopBar() {
  const currentDiagram = useDiagramStore((state) => state.currentDiagram);
  const isSaving = useDiagramStore((state) => state.isSaving);
  const saveDiagram = useDiagramStore((state) => state.saveDiagram);
  const [diagramName, setDiagramName] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    if (currentDiagram) {
      setDiagramName(currentDiagram.name);
    }
  }, [currentDiagram]);

  const handleSave = async () => {
    try {
      await saveDiagram();
      console.log('✅ Diagram saved successfully!');
    } catch (error) {
      console.error('❌ Failed to save:', error);
      alert('Failed to save diagram. Check console for details.');
    }
  };

  if (!currentDiagram) {
    return null;
  }

  return (
    <div className="h-14 border-b flex items-center justify-between px-4 bg-background">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <Input
          value={diagramName}
          onChange={(e) => setDiagramName(e.target.value)}
          className="w-[300px]"
          placeholder="Diagram name"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => setShowImportDialog(true)}
          variant="outline"
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Import SQL
        </Button>
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        )}
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
      <ImportSQLDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        diagramId={currentDiagram.id}
      />
    </div>
  );
}
