/**
 * Componentă grid responsive pentru afișarea multiplelor carduri KPI.
 * 
 * Features:
 * - Layout responsive (1/2/3 coloane)
 * - Filtrare după categorie
 * - Sortare după nume/valoare/categorie
 * - Empty state
 */

'use client';

import { useState, useMemo } from 'react';
import { KPICard, type KPICardData } from './kpi-card';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3 } from 'lucide-react';

interface KPIGridProps {
  kpis: KPICardData[];
  loading?: boolean;
  showDescription?: boolean;
}

type SortOption = 'name' | 'value' | 'category';
type CategoryFilter = 'all' | 'liquidity' | 'profitability' | 'leverage' | 'efficiency' | 'growth';

const categoryLabels: Record<CategoryFilter, string> = {
  all: 'Toate categoriile',
  liquidity: 'Lichiditate',
  profitability: 'Profitabilitate',
  leverage: 'Îndatorare',
  efficiency: 'Eficiență',
  growth: 'Creștere',
};

/**
 * Grid cu carduri KPI și filtre.
 */
export function KPIGrid({ kpis, loading = false, showDescription = true }: KPIGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>('category');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  // Filtrare și sortare KPI-uri
  const filteredAndSortedKPIs = useMemo(() => {
    let filtered = kpis;

    // Filtrare după categorie
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(kpi => kpi.category === categoryFilter);
    }

    // Sortare
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.kpi_name.localeCompare(b.kpi_name);
        case 'value':
          if (a.value === null) return 1;
          if (b.value === null) return -1;
          return b.value - a.value;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return sorted;
  }, [kpis, categoryFilter, sortBy]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-48 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-48 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-64 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (kpis.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-purple-50 p-6 dark:bg-purple-900/20">
            <BarChart3 className="h-12 w-12 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Niciun indicator KPI disponibil
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
            Încarcă o balanță de verificare pentru a calcula automat indicatorii financiari.
          </p>
        </div>
      </Card>
    );
  }

  // Empty după filtrare
  if (filteredAndSortedKPIs.length === 0) {
    return (
      <div className="space-y-4">
        {/* Filtre */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sortează după" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="category">Categorie</SelectItem>
              <SelectItem value="name">Nume</SelectItem>
              <SelectItem value="value">Valoare</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Niciun KPI găsit
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Încearcă să modifici filtrele pentru a vedea rezultate.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtre și sortare */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {filteredAndSortedKPIs.length} {filteredAndSortedKPIs.length === 1 ? 'indicator' : 'indicatori'}
          </span>
        </div>

        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sortează după" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="category">Categorie</SelectItem>
            <SelectItem value="name">Nume</SelectItem>
            <SelectItem value="value">Valoare</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid carduri KPI */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedKPIs.map((kpi) => (
          <KPICard 
            key={`${kpi.kpi_code}-${kpi.period?.start}`} 
            data={kpi} 
            showDescription={showDescription}
          />
        ))}
      </div>
    </div>
  );
}
