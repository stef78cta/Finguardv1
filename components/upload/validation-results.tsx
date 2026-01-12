'use client';

import { AlertCircle, AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ValidationResult } from '@/types/trial-balance';

/**
 * Interfață pentru eroare cu severity expandată
 */
interface ValidationError {
  type?: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  line?: number;
  details?: string;
  suggestion?: string;
}

/**
 * Props pentru componenta ValidationResults.
 */
interface ValidationResultsProps {
  result: ValidationResult;
  className?: string;
  metadata?: {
    totalRows?: number;
    validRows?: number;
    totalDebit?: number;
    totalCredit?: number;
  };
}

/**
 * Componentă pentru afișarea rezultatelor validării Trial Balance.
 * 
 * Afișează:
 * - Status general (valid/invalid)
 * - Erori critice (blocante)
 * - Avertismente (non-blocante)
 * - Informații despre procesare
 * - Detalii tehnice despre fiecare eroare/avertisment
 * 
 * @example
 * ```tsx
 * <ValidationResults 
 *   result={validationResult}
 * />
 * ```
 */
export function ValidationResults({ result, className, metadata }: ValidationResultsProps) {
  const { isValid, errors, warnings } = result;
  
  // Cast errors to our extended type
  const typedErrors = errors as unknown as ValidationError[];
  const typedWarnings = warnings as unknown as ValidationError[];

  // Group errors by severity (treat 'error' as 'high')
  const criticalErrors = typedErrors.filter(e => e.severity === 'critical');
  const highErrors = typedErrors.filter(e => e.severity === 'high' || e.severity === 'error' as any);
  const mediumErrors = typedErrors.filter(e => e.severity === 'medium');

  /**
   * Renderizare icon în funcție de severity.
   */
  const getIcon = (severity: ValidationError['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'low':
        return <Info className="h-4 w-4 text-info" />;
    }
  };

  /**
   * Renderizare badge pentru severity.
   */
  const getSeverityBadge = (severity: ValidationError['severity']) => {
    const variants: Record<ValidationError['severity'], string> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    };

    const labels: Record<ValidationError['severity'], string> = {
      critical: 'CRITIC',
      high: 'RIDICAT',
      medium: 'MEDIU',
      low: 'SCĂZUT',
    };

    return (
      <Badge variant={variants[severity] as any} className="text-xs">
        {labels[severity]}
      </Badge>
    );
  };

  /**
   * Renderizare listă erori/avertismente.
   */
  const renderErrorList = (errorList: ValidationError[], title: string) => {
    if (errorList.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">{title}</h4>
        <div className="space-y-2">
          {errorList.map((error, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card"
            >
              <div className="mt-0.5">{getIcon(error.severity)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{error.message}</p>
                  {getSeverityBadge(error.severity)}
                </div>
                {error.details && (
                  <p className="text-xs text-muted-foreground">{error.details}</p>
                )}
                {error.line !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Linia: {error.line}
                  </p>
                )}
                {error.suggestion && (
                  <p className="text-xs text-primary">
                    💡 Sugestie: {error.suggestion}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isValid ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-success" />
                <CardTitle>Validare reușită</CardTitle>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Validare eșuată</CardTitle>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {errors.length > 0 && (
              <Badge variant="destructive">{errors.length} erori</Badge>
            )}
            {warnings.length > 0 && (
              <Badge variant="secondary">{warnings.length} avertismente</Badge>
            )}
          </div>
        </div>
        <CardDescription>
          {isValid
            ? 'Toate verificările au trecut cu succes. Fișierul poate fi importat.'
            : 'Au fost detectate probleme care trebuie corectate înainte de import.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {/* Metadata Info */}
            {metadata && (
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-xs text-muted-foreground">Linii procesate</p>
                  <p className="text-sm font-medium">{metadata.totalRows || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Linii valide</p>
                  <p className="text-sm font-medium">{metadata.validRows || 0}</p>
                </div>
                {metadata.totalDebit !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Total Debit</p>
                    <p className="text-sm font-medium">
                      {metadata.totalDebit.toLocaleString('ro-RO', {
                        style: 'currency',
                        currency: 'RON',
                      })}
                    </p>
                  </div>
                )}
                {metadata.totalCredit !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Total Credit</p>
                    <p className="text-sm font-medium">
                      {metadata.totalCredit.toLocaleString('ro-RO', {
                        style: 'currency',
                        currency: 'RON',
                      })}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Erori Critice */}
            {criticalErrors.length > 0 &&
              renderErrorList(criticalErrors, '🚨 Erori Critice (Blocante)')}

            {/* Erori Ridicate */}
            {highErrors.length > 0 &&
              renderErrorList(highErrors, '⚠️ Erori Ridicate')}

            {/* Erori Medii */}
            {mediumErrors.length > 0 &&
              renderErrorList(mediumErrors, '⚡ Erori Medii')}

            {/* Avertismente */}
            {typedWarnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">ℹ️ Avertismente (Non-blocante)</h4>
                <div className="space-y-2">
                  {typedWarnings.map((warning, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border border-warning/20 bg-warning/5"
                    >
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">{warning.message}</p>
                        {warning.details && (
                          <p className="text-xs text-muted-foreground">{warning.details}</p>
                        )}
                        {warning.line !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Linia: {warning.line}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mesaj Success */}
            {isValid && errors.length === 0 && warnings.length === 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-success">
                    Validare completă fără probleme
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fișierul poate fi importat în siguranță.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
