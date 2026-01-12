/**
 * Componente pentru filtrarea KPI-urilor.
 * 
 * Filtre disponibile:
 * - Selector perioadă (date range)
 * - Selector categorii KPI
 * - Selector companie (dacă utilizatorul are mai multe)
 */

'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export interface KPIFilters {
  companyId?: string;
  category?: string;
  periodStart?: Date;
  periodEnd?: Date;
  importId?: string;
}

interface KPIFiltersProps {
  filters: KPIFilters;
  onFiltersChange: (filters: KPIFilters) => void;
  companies?: Array<{ id: string; name: string }>;
  imports?: Array<{ id: string; period_start: string; period_end: string }>;
  loading?: boolean;
}

const categoryOptions = [
  { value: 'all', label: 'Toate categoriile' },
  { value: 'liquidity', label: 'Lichiditate' },
  { value: 'profitability', label: 'Profitabilitate' },
  { value: 'leverage', label: 'Îndatorare' },
  { value: 'efficiency', label: 'Eficiență' },
  { value: 'growth', label: 'Creștere' },
];

/**
 * Componenta principală pentru filtre KPI.
 */
export function KPIFiltersPanel({ 
  filters, 
  onFiltersChange, 
  companies = [],
  imports = [],
  loading = false 
}: KPIFiltersProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleCompanyChange = (companyId: string) => {
    onFiltersChange({ ...filters, companyId });
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ 
      ...filters, 
      category: category === 'all' ? undefined : category 
    });
  };

  const handleImportChange = (importId: string) => {
    if (importId === 'all') {
      onFiltersChange({ 
        ...filters, 
        importId: undefined,
        periodStart: undefined,
        periodEnd: undefined
      });
    } else {
      const selectedImport = imports.find(imp => imp.id === importId);
      if (selectedImport) {
        onFiltersChange({ 
          ...filters, 
          importId,
          periodStart: new Date(selectedImport.period_start),
          periodEnd: new Date(selectedImport.period_end)
        });
      }
    }
  };

  const handleDateRangeSelect = (range: { from?: Date; to?: Date }) => {
    onFiltersChange({
      ...filters,
      periodStart: range.from,
      periodEnd: range.to,
      importId: undefined, // Clear import selection when custom date is selected
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      companyId: filters.companyId, // Keep company selection
    });
  };

  const activeFiltersCount = 
    (filters.category ? 1 : 0) + 
    (filters.periodStart || filters.periodEnd ? 1 : 0) +
    (filters.importId ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Primary filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Selector companie (dacă sunt multiple) */}
        {companies.length > 1 && (
          <Select 
            value={filters.companyId} 
            onValueChange={handleCompanyChange}
            disabled={loading}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selectează compania" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Selector categorie */}
        <Select 
          value={filters.category || 'all'} 
          onValueChange={handleCategoryChange}
          disabled={loading}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selector import (perioadă predefinită) */}
        {imports.length > 0 && (
          <Select 
            value={filters.importId || 'all'} 
            onValueChange={handleImportChange}
            disabled={loading}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Perioadă" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate perioadele</SelectItem>
              {imports.map((imp) => (
                <SelectItem key={imp.id} value={imp.id}>
                  {format(new Date(imp.period_start), 'dd MMM yyyy', { locale: ro })} - {format(new Date(imp.period_end), 'dd MMM yyyy', { locale: ro })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date range picker (custom) */}
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                'w-[250px] justify-start text-left font-normal',
                !filters.periodStart && !filters.periodEnd && 'text-muted-foreground'
              )}
              disabled={loading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.periodStart && filters.periodEnd ? (
                <>
                  {format(filters.periodStart, 'dd MMM', { locale: ro })} - {format(filters.periodEnd, 'dd MMM yyyy', { locale: ro })}
                </>
              ) : filters.periodStart ? (
                <>De la {format(filters.periodStart, 'dd MMM yyyy', { locale: ro })}</>
              ) : (
                <span>Selectează perioada</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: filters.periodStart,
                to: filters.periodEnd,
              }}
              onSelect={(range) => {
                if (range) {
                  handleDateRangeSelect({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
              disabled={loading}
              locale={ro}
            />
          </PopoverContent>
        </Popover>

        {/* Clear filters button */}
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearFilters}
            disabled={loading}
          >
            <X className="mr-1 h-4 w-4" />
            Șterge filtre ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active filters badges */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">Filtre active:</span>
          
          {filters.category && (
            <Badge variant="secondary">
              {categoryOptions.find(opt => opt.value === filters.category)?.label}
              <button
                className="ml-2 hover:text-destructive"
                onClick={() => onFiltersChange({ ...filters, category: undefined })}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {(filters.periodStart || filters.periodEnd) && (
            <Badge variant="secondary">
              {filters.periodStart && filters.periodEnd ? (
                <>
                  {format(filters.periodStart, 'dd MMM', { locale: ro })} - {format(filters.periodEnd, 'dd MMM yyyy', { locale: ro })}
                </>
              ) : filters.periodStart ? (
                <>De la {format(filters.periodStart, 'dd MMM yyyy', { locale: ro })}</>
              ) : null}
              <button
                className="ml-2 hover:text-destructive"
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  periodStart: undefined, 
                  periodEnd: undefined 
                })}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.importId && (
            <Badge variant="secondary">
              Import selectat
              <button
                className="ml-2 hover:text-destructive"
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  importId: undefined,
                  periodStart: undefined,
                  periodEnd: undefined
                })}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
