import { Building2, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Pagina pentru gestionarea companiilor.
 * 
 * Permite utilizatorilor să:
 * - Vizualizeze lista de companii
 * - Adauge companii noi
 * - Editeze și șteargă companii existente
 * 
 * TODO: Implementare CRUD complet pentru companii (Task 1.3)
 */
export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Companii
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Gestionează companiile tale și datele financiare
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Adaugă Companie
        </Button>
      </div>

      {/* Empty State */}
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-blue-50 p-6 dark:bg-blue-900/20">
            <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Nicio companie adăugată
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
            Începe prin a adăuga prima ta companie pentru a putea încărca balanțe de verificare și genera rapoarte financiare.
          </p>
          <Button className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Adaugă Prima Companie
          </Button>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm text-blue-900 dark:text-blue-300">
          💡 <strong>Sfat:</strong> Pentru fiecare companie vei putea încărca balanțe de verificare, genera rapoarte financiare și vizualiza indicatori KPI.
        </p>
      </Card>
    </div>
  );
}
