import { FileText, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Pagina pentru gestionarea rapoartelor financiare.
 * 
 * Permite utilizatorilor să:
 * - Vizualizeze lista de rapoarte generate
 * - Genereze rapoarte noi
 * - Descarce rapoarte în format PDF/Excel
 * - Vizualizeze detaliile rapoartelor
 * 
 * TODO: Implementare Reports UI complet (Task 1.11)
 * TODO: Integrare cu generator PDF (Task 1.10)
 */
export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Rapoarte Financiare
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Generează și descarcă rapoarte financiare comprehensive
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Generează Raport Nou
        </Button>
      </div>

      {/* Empty State */}
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-indigo-50 p-6 dark:bg-indigo-900/20">
            <FileText className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Niciun raport generat
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
            Creează primul tău raport financiar pentru a vizualiza situațiile financiare și indicatorii KPI într-un format profesional.
          </p>
          <Button className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Generează Primul Raport
          </Button>
        </div>
      </Card>

      {/* Report Types Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">
              Raport KPI
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Analiză detaliată a indicatorilor financiari cu grafice și trend-uri
          </p>
        </Card>

        <Card className="p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">
              Situații Financiare
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Bilanț, Cont de profit și pierdere, Fluxuri de numerar
          </p>
        </Card>

        <Card className="p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-900/20">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">
              Analiză Comparativă
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Comparații pe perioade multiple cu evoluție și variații
          </p>
        </Card>
      </div>
    </div>
  );
}
