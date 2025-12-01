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
  const renameDiagram = useDiagramStore((state) => state.renameDiagram);
  const [diagramName, setDiagramName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
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

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleRename = async () => {
    if (!currentDiagram || diagramName.trim() === currentDiagram.name) {
      setIsEditing(false);
      setDiagramName(currentDiagram?.name || '');
      return;
    }

    if (diagramName.trim() === '') {
      alert('Diagram name cannot be empty');
      setDiagramName(currentDiagram?.name || '');
      setIsEditing(false);
      return;
    }

    try {
      await renameDiagram(currentDiagram.id, diagramName.trim());
      setIsEditing(false);
      console.log('✅ Diagram renamed successfully!');
    } catch (error) {
      console.error('❌ Failed to rename:', error);
      alert('Failed to rename diagram. Check console for details.');
      setDiagramName(currentDiagram?.name || '');
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setDiagramName(currentDiagram?.name || '');
      setIsEditing(false);
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
        {isEditing ? (
          <Input
            value={diagramName}
            onChange={(e) => setDiagramName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="w-[300px]"
            placeholder="Diagram name"
            autoFocus
          />
        ) : (
          <h1
            className="text-lg font-semibold cursor-pointer hover:text-muted-foreground transition-colors px-3 py-1 rounded hover:bg-accent"
            onDoubleClick={handleDoubleClick}
            title="Double-click to rename"
          >
            {diagramName}
          </h1>
        )}
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
