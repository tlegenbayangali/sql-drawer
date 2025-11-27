'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseMySQLSQL } from '@/lib/parsers/mysql-parser';
import type { ParsedSQLResult } from '@/lib/types/import';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDiagramStore } from '@/lib/stores/diagram-store';

interface ImportSQLDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagramId: string;
}

type ImportStep = 'select' | 'parsing' | 'preview' | 'importing' | 'success' | 'error';

export function ImportSQLDialog({ open, onOpenChange, diagramId }: ImportSQLDialogProps) {
  const [step, setStep] = useState<ImportStep>('select');
  const [sqlText, setSqlText] = useState('');
  const [parseResult, setParseResult] = useState<ParsedSQLResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ tablesCreated: number; relationshipsCreated: number } | null>(null);

  const reloadDiagram = useDiagramStore((state) => state.reloadDiagram);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.sql')) {
        setError('Please select a .sql file');
        setStep('error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSqlText(content);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setStep('error');
      };
      reader.readAsText(file);
    }
  };

  const handleParse = () => {
    if (!sqlText.trim()) {
      setError('Please provide SQL content');
      setStep('error');
      return;
    }

    setStep('parsing');

    // Parse in next tick to allow UI update
    setTimeout(() => {
      try {
        const result = parseMySQLSQL(sqlText);

        if (result.errors.some((e) => e.severity === 'error')) {
          setError('SQL parsing failed with errors. See details below.');
          setParseResult(result);
          setStep('error');
          return;
        }

        if (result.tables.length === 0) {
          setError('No tables found in SQL file');
          setStep('error');
          return;
        }

        setParseResult(result);
        setStep('preview');
      } catch (err) {
        setError(`Unexpected error parsing SQL: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setStep('error');
      }
    }, 100);
  };

  const handleImport = async () => {
    if (!parseResult) return;

    setStep('importing');

    try {
      const response = await fetch(`/api/diagrams/${diagramId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tables: parseResult.tables,
          relationships: parseResult.relationships,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const data = await response.json();
      setImportResult(data);

      // Reload diagram in store
      await reloadDiagram(diagramId);

      setStep('success');
    } catch (err) {
      setError(`Failed to import tables: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStep('error');
    }
  };

  const handleReset = () => {
    setStep('select');
    setSqlText('');
    setParseResult(null);
    setError(null);
    setImportResult(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import SQL</DialogTitle>
          <DialogDescription>
            Import MySQL CREATE TABLE statements into this diagram
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sql-file">Upload SQL File</Label>
              <Input
                id="sql-file"
                type="file"
                accept=".sql"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or paste SQL</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sql-text">SQL Content</Label>
              <textarea
                id="sql-text"
                value={sqlText}
                onChange={(e) => setSqlText(e.target.value)}
                placeholder="Paste your CREATE TABLE statements here..."
                className="w-full min-h-[200px] p-3 rounded-md border bg-background text-sm font-mono resize-y"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleParse} disabled={!sqlText.trim()}>
                Parse SQL
              </Button>
            </div>
          </div>
        )}

        {step === 'parsing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Parsing SQL statements...</p>
          </div>
        )}

        {step === 'preview' && parseResult && (
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Found {parseResult.tables.length} table{parseResult.tables.length !== 1 ? 's' : ''} and{' '}
                {parseResult.relationships.length} relationship{parseResult.relationships.length !== 1 ? 's' : ''}
              </AlertDescription>
            </Alert>

            <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
              <Label>Tables to import:</Label>
              <ScrollArea className="flex-1 border rounded-md p-3">
                <ul className="space-y-2">
                  {parseResult.tables.map((table, idx) => (
                    <li key={idx} className="text-sm">
                      <span className="font-medium">{table.name}</span>
                      <span className="text-muted-foreground ml-2">({table.columns.length} columns)</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>

            {parseResult.errors.length > 0 && (
              <div className="space-y-2">
                <Label>Warnings:</Label>
                <ScrollArea className="max-h-[150px] border rounded-md p-3 bg-yellow-50 dark:bg-yellow-950">
                  <ul className="space-y-1">
                    {parseResult.errors.map((err, idx) => (
                      <li key={idx} className="text-xs text-yellow-800 dark:text-yellow-200">
                        Line {err.line}: {err.message}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Importing tables to diagram...</p>
          </div>
        )}

        {step === 'success' && importResult && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div className="text-center space-y-2">
              <p className="font-medium">Import successful!</p>
              <p className="text-sm text-muted-foreground">
                Imported {importResult.tablesCreated} table{importResult.tablesCreated !== 1 ? 's' : ''} and{' '}
                {importResult.relationshipsCreated} relationship{importResult.relationshipsCreated !== 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={handleClose}>Close</Button>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            {parseResult && parseResult.errors.length > 0 && (
              <div className="space-y-2">
                <Label>Error Details:</Label>
                <ScrollArea className="max-h-[200px] border rounded-md p-3 bg-red-50 dark:bg-red-950">
                  <ul className="space-y-1">
                    {parseResult.errors.map((err, idx) => (
                      <li key={idx} className="text-xs text-red-800 dark:text-red-200">
                        <span className="font-medium">[{err.severity}]</span> Line {err.line}: {err.message}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleReset}>Try Again</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
