import { BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Pagina pentru vizualizarea indicatorilor KPI.
 * 
 * Afișează:
 * - KPI-uri de lichiditate
 * - KPI-uri de profitabilitate
 * - KPI-uri de leverage
 * - KPI-uri de eficiență
 * - Grafice și trend-uri
 * 
 * TODO: Implementare dashboard KPI complet (Task 1.8)
 * TODO: Integrare cu engine-ul de calculare KPI (Task 1.7)
 */
export default function IndicatorsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Indicatori KPI
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Vizualizează indicatorii financiari cheie ai companiei
        </p>
      </div>

      {/* Tabs pentru categorii KPI */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Toate</TabsTrigger>
          <TabsTrigger value="liquidity">Lichiditate</TabsTrigger>
          <TabsTrigger value="profitability">Profitabilitate</TabsTrigger>
          <TabsTrigger value="leverage">Leverage</TabsTrigger>
          <TabsTrigger value="efficiency">Eficiență</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <EmptyKPIState />
        </TabsContent>

        <TabsContent value="liquidity" className="mt-6">
          <EmptyKPIState category="Lichiditate" />
        </TabsContent>

        <TabsContent value="profitability" className="mt-6">
          <EmptyKPIState category="Profitabilitate" />
        </TabsContent>

        <TabsContent value="leverage" className="mt-6">
          <EmptyKPIState category="Leverage" />
        </TabsContent>

        <TabsContent value="efficiency" className="mt-6">
          <EmptyKPIState category="Eficiență" />
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
        <p className="text-sm text-purple-900 dark:text-purple-300">
          💡 <strong>Sfat:</strong> Indicatorii KPI vor fi calculați automat după încărcarea balanțelor de verificare. Vei putea compara performanța pe mai multe perioade.
        </p>
      </Card>
    </div>
  );
}

/**
 * Empty state pentru categoriile de KPI.
 */
function EmptyKPIState({ category = 'toate categoriile' }: { category?: string }) {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-purple-50 p-6 dark:bg-purple-900/20">
          <BarChart3 className="h-12 w-12 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          Niciun indicator disponibil
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
          Indicatorii pentru {category} vor apărea aici după procesarea balanțelor de verificare.
        </p>
      </div>
    </Card>
  );
}
