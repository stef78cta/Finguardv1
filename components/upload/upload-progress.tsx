'use client';

import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/**
 * Stările posibile ale procesului de upload.
 */
export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'validating' | 'success' | 'error';

/**
 * Props pentru componenta UploadProgress.
 */
interface UploadProgressProps {
  status: UploadStatus;
  progress: number;
  fileName?: string;
  error?: string;
  className?: string;
}

/**
 * Componentă pentru afișarea progress-ului procesului de upload și procesare.
 * 
 * Afișează:
 * - Progress bar animat
 * - Status curent (uploading/processing/validating/success/error)
 * - Numele fișierului procesat
 * - Mesaje de eroare dacă există
 * 
 * @example
 * ```tsx
 * <UploadProgress 
 *   status="processing"
 *   progress={45}
 *   fileName="balanta_dec_2023.xlsx"
 * />
 * ```
 */
export function UploadProgress({
  status,
  progress,
  fileName,
  error,
  className,
}: UploadProgressProps) {
  /**
   * Obține mesajul corespunzător status-ului curent.
   */
  const getStatusMessage = (): string => {
    switch (status) {
      case 'idle':
        return 'Așteptare...';
      case 'uploading':
        return 'Se încarcă fișierul...';
      case 'processing':
        return 'Se procesează datele...';
      case 'validating':
        return 'Se validează balanța...';
      case 'success':
        return 'Import finalizat cu succes!';
      case 'error':
        return error || 'A apărut o eroare';
    }
  };

  /**
   * Obține icon-ul corespunzător status-ului curent.
   */
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
      case 'validating':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  /**
   * Determină culoarea progress bar-ului în funcție de status.
   */
  const getProgressColor = (): string => {
    switch (status) {
      case 'success':
        return 'bg-success';
      case 'error':
        return 'bg-destructive';
      default:
        return 'bg-primary';
    }
  };

  // Nu afișa nimic dacă status este idle
  if (status === 'idle') {
    return null;
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header cu icon și status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="text-sm font-medium">{getStatusMessage()}</p>
                {fileName && (
                  <p className="text-xs text-muted-foreground">{fileName}</p>
                )}
              </div>
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              {progress}%
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className="h-2"
              indicatorClassName={getProgressColor()}
            />
            
            {/* Detalii status */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {status === 'uploading' && 'Încărcare fișier...'}
                {status === 'processing' && 'Procesare Excel/CSV...'}
                {status === 'validating' && 'Validare date financiare...'}
                {status === 'success' && 'Toate verificările au trecut'}
                {status === 'error' && 'Procesare întreruptă'}
              </span>
              {status !== 'error' && (
                <span className="text-xs">
                  {status === 'uploading' && 'Pas 1/3'}
                  {status === 'processing' && 'Pas 2/3'}
                  {status === 'validating' && 'Pas 3/3'}
                  {status === 'success' && 'Completat'}
                </span>
              )}
            </div>
          </div>

          {/* Mesaj eroare detaliat */}
          {status === 'error' && error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Mesaj success */}
          {status === 'success' && (
            <div className="rounded-lg bg-success/10 border border-success/20 p-3">
              <p className="text-sm text-success">
                Fișierul a fost importat cu succes. Poți vizualiza datele în secțiunea Indicators.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
