'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Props pentru componenta FileDropzone.
 * 
 * @property {boolean} disabled - Dezactivează upload-ul când procesarea este în curs
 * @property {(file: File) => void} onFileSelect - Callback apelat când un fișier este selectat
 * @property {string[]} acceptedFormats - Lista de formate acceptate (ex: ['.xlsx', '.xls', '.csv'])
 * @property {number} maxSize - Dimensiunea maximă acceptată în bytes (default: 10MB)
 */
interface FileDropzoneProps {
  disabled?: boolean;
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSize?: number;
}

/**
 * Componentă FileDropzone pentru upload drag & drop de fișiere Trial Balance.
 * 
 * Funcționalități:
 * - Drag & drop support cu highlight visual
 * - Click pentru selecție fișier
 * - Validare tip fișier și dimensiune
 * - Preview informații fișier selectat
 * - Opțiune ștergere fișier înainte de upload
 * 
 * @example
 * ```tsx
 * <FileDropzone 
 *   onFileSelect={(file) => console.log(file)}
 *   acceptedFormats={['.xlsx', '.xls', '.csv']}
 *   maxSize={10 * 1024 * 1024}
 * />
 * ```
 */
export function FileDropzone({
  disabled = false,
  onFileSelect,
  acceptedFormats = ['.xlsx', '.xls', '.csv'],
  maxSize = 10 * 1024 * 1024, // 10MB default
}: FileDropzoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handler pentru selecția fișierului.
   * Validează dimensiunea și tipul, apoi notifică parent component-ul.
   */
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      // Check pentru fișiere respinse
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`Fișierul este prea mare. Dimensiunea maximă: ${maxSize / 1024 / 1024}MB`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError(`Format neacceptat. Formate permise: ${acceptedFormats.join(', ')}`);
        } else {
          setError('Fișierul nu poate fi încărcat.');
        }
        return;
      }

      // Procesează primul fișier acceptat
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect, acceptedFormats, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => {
      // Mapare extensii la MIME types
      if (format === '.xlsx') {
        acc['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] = ['.xlsx'];
      } else if (format === '.xls') {
        acc['application/vnd.ms-excel'] = ['.xls'];
      } else if (format === '.csv') {
        acc['text/csv'] = ['.csv'];
      }
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    multiple: false,
    disabled,
  });

  /**
   * Handler pentru ștergerea fișierului selectat.
   */
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  /**
   * Formatare dimensiune fișier pentru afișare user-friendly.
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      {/* Dropzone Area */}
      <Card
        {...getRootProps()}
        className={cn(
          'relative cursor-pointer border-2 border-dashed transition-all hover:border-primary/50',
          isDragActive && 'border-primary bg-primary/5',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-destructive',
          selectedFile && 'border-success bg-success/5'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          {selectedFile ? (
            // Fișier selectat - afișare preview
            <>
              <CheckCircle2 className="h-12 w-12 text-success mb-4" />
              <div className="flex items-center gap-2 mb-2">
                <File className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium">{selectedFile.name}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {formatFileSize(selectedFile.size)}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                disabled={disabled}
              >
                <X className="h-4 w-4 mr-1" />
                Elimină fișierul
              </Button>
            </>
          ) : (
            // Stare inițială - prompt pentru upload
            <>
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">
                {isDragActive ? 'Eliberează pentru a încărca' : 'Glisează fișierul aici'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                sau click pentru a selecta din computer
              </p>
              <div className="text-xs text-muted-foreground">
                <p>Formate acceptate: {acceptedFormats.join(', ')}</p>
                <p>Dimensiune maximă: {maxSize / 1024 / 1024}MB</p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Mesaj eroare */}
      {error && (
        <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
