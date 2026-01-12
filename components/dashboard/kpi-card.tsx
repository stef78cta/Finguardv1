/**
 * Componentă card pentru afișarea unui indicator KPI individual.
 * 
 * Afișează:
 * - Nume și descriere KPI
 * - Valoare cu unitate
 * - Trend indicator (față de target range)
 * - Interpretare (excelent/bun/satisfăcător/slab)
 */

'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Info,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KPICardData {
  kpi_code: string;
  kpi_name: string;
  kpi_description?: string;
  category: string;
  unit: string;
  value: number | null;
  target_range?: {
    min?: number | null;
    max?: number | null;
  };
  period?: {
    start: string;
    end: string;
  };
  metadata?: {
    interpretation?: string;
    warnings?: string[];
  };
}

interface KPICardProps {
  data: KPICardData;
  showDescription?: boolean;
  className?: string;
}

/**
 * Determină interpretarea KPI-ului bazat pe valoare și target range.
 */
function getKPIInterpretation(
  value: number | null,
  targetMin?: number | null,
  targetMax?: number | null
): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  trend: 'up' | 'down' | 'neutral';
  color: string;
} {
  if (value === null) {
    return { 
      label: 'N/A', 
      variant: 'outline', 
      trend: 'neutral',
      color: 'text-slate-500'
    };
  }

  // Dacă avem target range
  if (targetMin !== null && targetMin !== undefined && targetMax !== null && targetMax !== undefined) {
    if (value >= targetMin && value <= targetMax) {
      return { 
        label: 'Excelent', 
        variant: 'default', 
        trend: 'up',
        color: 'text-green-600 dark:text-green-400'
      };
    } else if (value >= targetMin * 0.8 && value <= targetMax * 1.2) {
      return { 
        label: 'Bun', 
        variant: 'secondary', 
        trend: 'neutral',
        color: 'text-blue-600 dark:text-blue-400'
      };
    } else {
      return { 
        label: 'Slab', 
        variant: 'destructive', 
        trend: 'down',
        color: 'text-red-600 dark:text-red-400'
      };
    }
  }

  // Dacă avem doar min
  if (targetMin !== null && targetMin !== undefined) {
    if (value >= targetMin) {
      return { 
        label: 'Bun', 
        variant: 'default', 
        trend: 'up',
        color: 'text-green-600 dark:text-green-400'
      };
    } else {
      return { 
        label: 'Slab', 
        variant: 'destructive', 
        trend: 'down',
        color: 'text-red-600 dark:text-red-400'
      };
    }
  }

  // Dacă avem doar max
  if (targetMax !== null && targetMax !== undefined) {
    if (value <= targetMax) {
      return { 
        label: 'Bun', 
        variant: 'default', 
        trend: 'up',
        color: 'text-green-600 dark:text-green-400'
      };
    } else {
      return { 
        label: 'Slab', 
        variant: 'destructive', 
        trend: 'down',
        color: 'text-red-600 dark:text-red-400'
      };
    }
  }

  // Fără target range - neutru
  return { 
    label: 'Calculat', 
    variant: 'secondary', 
    trend: 'neutral',
    color: 'text-slate-600 dark:text-slate-400'
  };
}

/**
 * Formatează valoarea KPI cu unitatea corespunzătoare.
 */
function formatKPIValue(value: number | null, unit: string): string {
  if (value === null) return 'N/A';

  switch (unit) {
    case 'percentage':
      return `${value.toFixed(2)}%`;
    case 'ratio':
      return value.toFixed(2);
    case 'days':
      return `${Math.round(value)} zile`;
    case 'currency':
      return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'RON',
        maximumFractionDigits: 0,
      }).format(value);
    case 'number':
      return new Intl.NumberFormat('ro-RO', {
        maximumFractionDigits: 2,
      }).format(value);
    default:
      return value.toFixed(2);
  }
}

/**
 * Componentă card pentru afișare KPI individual.
 */
export function KPICard({ data, showDescription = true, className }: KPICardProps) {
  const interpretation = getKPIInterpretation(
    data.value,
    data.target_range?.min,
    data.target_range?.max
  );

  const TrendIcon = interpretation.trend === 'up' 
    ? TrendingUp 
    : interpretation.trend === 'down' 
    ? TrendingDown 
    : Minus;

  const hasWarnings = data.metadata?.warnings && data.metadata.warnings.length > 0;

  return (
    <Card className={cn('p-6 transition-shadow hover:shadow-lg', className)}>
      {/* Header cu nume și badge interpretare */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-slate-50">
            {data.kpi_name}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {data.kpi_code}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <Badge variant={interpretation.variant}>
            {interpretation.label}
          </Badge>
          <TrendIcon className={cn('h-5 w-5', interpretation.color)} />
        </div>
      </div>

      {/* Valoare KPI */}
      <div className="mt-4">
        <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          {formatKPIValue(data.value, data.unit)}
        </div>
        
        {/* Target range dacă există */}
        {data.target_range && (data.target_range.min != null || data.target_range.max != null) && (
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-medium">Target: </span>
            {data.target_range.min != null && data.target_range.max != null ? (
              <span>
                {formatKPIValue(data.target_range.min ?? null, data.unit)} - {formatKPIValue(data.target_range.max ?? null, data.unit)}
              </span>
            ) : data.target_range.min != null ? (
              <span>&ge; {formatKPIValue(data.target_range.min ?? null, data.unit)}</span>
            ) : (
              <span>&le; {formatKPIValue(data.target_range.max ?? null, data.unit)}</span>
            )}
          </div>
        )}
      </div>

      {/* Descriere opțională */}
      {showDescription && data.kpi_description && (
        <div className="mt-4 flex items-start gap-2 rounded-md bg-slate-50 p-3 dark:bg-slate-900/50">
          <Info className="h-4 w-4 flex-shrink-0 text-slate-400" />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {data.kpi_description}
          </p>
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div className="text-xs text-yellow-800 dark:text-yellow-300">
            {data.metadata!.warnings!.map((warning, idx) => (
              <div key={idx}>• {warning}</div>
            ))}
          </div>
        </div>
      )}

      {/* Perioadă */}
      {data.period && (
        <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Perioadă: {new Date(data.period.start).toLocaleDateString('ro-RO')} - {new Date(data.period.end).toLocaleDateString('ro-RO')}
        </div>
      )}
    </Card>
  );
}
