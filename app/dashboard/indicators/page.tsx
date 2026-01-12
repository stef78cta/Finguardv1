/**
 * Pagina pentru vizualizarea indicatorilor KPI.
 * 
 * Features:
 * - Afișare KPI-uri în carduri cu valori și trend indicators
 * - Grafice interactive (LineChart, BarChart, RadarChart)
 * - Filtrare după perioadă și categorie KPI
 * - Comparație între perioade
 * - Stats cards cu sumar rapid
 * 
 * Task 1.8 - KPI Dashboard
 */

'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPIGrid } from '@/components/dashboard/kpi-grid';
import { KPIFiltersPanel, type KPIFilters } from '@/components/dashboard/kpi-filters';
import { 
  KPIBarChart, 
  KPIRadarChart, 
  transformKPIsForChart,
  transformKPIsForRadar
} from '@/components/dashboard/chart-components';
import type { KPICardData } from '@/components/dashboard/kpi-card';
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
}

interface TrialBalanceImport {
  id: string;
  period_start: string;
  period_end: string;
}

export default function IndicatorsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const { toast } = useToast();

  // State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [imports, setImports] = useState<TrialBalanceImport[]>([]);
  const [kpis, setKpis] = useState<KPICardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<KPIFilters>({});

  // Fetch companies on mount
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/companies');
        if (!response.ok) throw new Error('Failed to fetch companies');
        
        const data = await response.json();
        setCompanies(data.data || []);
        
        // Select first company by default
        if (data.data && data.data.length > 0) {
          setSelectedCompany(data.data[0]);
          setFilters({ companyId: data.data[0].id });
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast({
          variant: 'destructive',
          title: 'Eroare',
          description: 'Nu s-au putut încărca companiile',
        });
      }
    };

    fetchCompanies();
  }, [isLoaded, isSignedIn, toast]);

  // Fetch imports when company changes
  useEffect(() => {
    if (!selectedCompany) return;

    const fetchImports = async () => {
      try {
        const response = await fetch(`/api/companies/${selectedCompany.id}/imports`);
        if (!response.ok) throw new Error('Failed to fetch imports');
        
        const data = await response.json();
        setImports(data.data || []);
      } catch (error) {
        console.error('Error fetching imports:', error);
      }
    };

    fetchImports();
  }, [selectedCompany]);

  // Fetch KPIs when filters change
  useEffect(() => {
    if (!filters.companyId) return;

    const fetchKPIs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.periodStart) params.append('period_start', filters.periodStart.toISOString());
        if (filters.periodEnd) params.append('period_end', filters.periodEnd.toISOString());
        if (filters.importId) params.append('import_id', filters.importId);

        const response = await fetch(`/api/companies/${filters.companyId}/kpis?${params}`);
        if (!response.ok) throw new Error('Failed to fetch KPIs');
        
        const data = await response.json();
        setKpis(data.data || []);
      } catch (error) {
        console.error('Error fetching KPIs:', error);
        toast({
          variant: 'destructive',
          title: 'Eroare',
          description: 'Nu s-au putut încărca KPI-urile',
        });
        setKpis([]);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, [filters, toast]);

  // Calculate statistics
  const stats = {
    total: kpis.length,
    excellent: kpis.filter(kpi => {
      if (kpi.value === null) return false;
      const { target_range } = kpi;
      if (!target_range?.min || !target_range?.max) return false;
      return kpi.value >= target_range.min && kpi.value <= target_range.max;
    }).length,
    poor: kpis.filter(kpi => {
      if (kpi.value === null) return false;
      const { target_range } = kpi;
      if (!target_range?.min && !target_range?.max) return false;
      if (target_range.min && target_range.max) {
        return kpi.value < target_range.min * 0.8 || kpi.value > target_range.max * 1.2;
      }
      if (target_range.min) return kpi.value < target_range.min;
      if (target_range.max) return kpi.value > target_range.max;
      return false;
    }).length,
  };

  // Loading state
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Se încarcă...</div>
      </div>
    );
  }

  // No companies state
  if (!loading && companies.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Indicatori KPI
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Vizualizează indicatorii financiari cheie ai companiei
          </p>
        </div>

        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-purple-50 p-6 dark:bg-purple-900/20">
              <BarChart3 className="h-12 w-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Nicio companie înregistrată
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              Creează o companie mai întâi pentru a putea vedea indicatorii KPI.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Indicatori KPI
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Vizualizează indicatorii financiari cheie ai companiei {selectedCompany?.name}
        </p>
      </div>

      {/* Filters */}
      <KPIFiltersPanel
        filters={filters}
        onFiltersChange={setFilters}
        companies={companies}
        imports={imports}
        loading={loading}
      />

      {/* Stats Cards */}
      {!loading && kpis.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total KPI-uri</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {stats.total}
                </p>
              </div>
              <div className="rounded-full bg-purple-50 p-3 dark:bg-purple-900/20">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Performanță excelentă</p>
                <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.excellent}
                </p>
              </div>
              <div className="rounded-full bg-green-50 p-3 dark:bg-green-900/20">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Necesită atenție</p>
                <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.poor}
                </p>
              </div>
              <div className="rounded-full bg-red-50 p-3 dark:bg-red-900/20">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs pentru vizualizări */}
      <Tabs defaultValue="cards" className="w-full">
        <TabsList>
          <TabsTrigger value="cards">Carduri</TabsTrigger>
          <TabsTrigger value="charts">Grafice</TabsTrigger>
          <TabsTrigger value="comparison">Comparație</TabsTrigger>
        </TabsList>

        {/* Carduri KPI */}
        <TabsContent value="cards" className="mt-6">
          <KPIGrid kpis={kpis} loading={loading} showDescription={true} />
        </TabsContent>

        {/* Grafice */}
        <TabsContent value="charts" className="mt-6">
          <div className="space-y-6">
            {/* Radar Chart - overview toate categoriile */}
            {!loading && kpis.length > 0 && (
              <KPIRadarChart
                data={transformKPIsForRadar(kpis)}
                title="Performanță generală pe categorii"
              />
            )}

            {/* Bar Chart - KPI-uri individuale */}
            {!loading && kpis.length > 0 && (
              <KPIBarChart
                data={transformKPIsForChart(kpis).slice(0, 10)}
                title="Top 10 KPI-uri"
                unit="Valoare"
              />
            )}

            {/* Empty state */}
            {!loading && kpis.length === 0 && (
              <Card className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-purple-50 p-6 dark:bg-purple-900/20">
                    <BarChart3 className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                    Niciun indicator disponibil
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
                    Încarcă o balanță de verificare pentru a calcula automat indicatorii financiari.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Comparație (placeholder pentru viitor - Task 2.2) */}
        <TabsContent value="comparison" className="mt-6">
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Comparație între perioade
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
                Această funcționalitate va fi disponibilă în curând (Task 2.2 - Comparative Analysis).
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
        <p className="text-sm text-purple-900 dark:text-purple-300">
          💡 <strong>Sfat:</strong> Indicatorii KPI sunt calculați automat după încărcarea balanțelor de verificare. 
          Poți filtra după categorie și perioadă pentru a vizualiza evoluția în timp.
        </p>
      </Card>
    </div>
  );
}
