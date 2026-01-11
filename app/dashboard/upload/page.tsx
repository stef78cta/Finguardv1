import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Pagina pentru încărcarea balanțelor de verificare.
 * 
 * Permite utilizatorilor să:
 * - Încarce fișiere Excel/CSV cu balanțe de verificare
 * - Vizualizeze preview-ul datelor
 * - Valideze corectitudinea datelor
 * - Proceseze și salveze balanțele
 * 
 * TODO: Implementare upload UI complet (Task 1.5)
 * TODO: Integrare cu API-ul de procesare (Task 1.6)
 */
export default function UploadPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Încărcare Balanță de Verificare
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Upload fișiere Excel sau CSV cu balanțele de verificare
        </p>
      </div>

      {/* Upload Area - Placeholder */}
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-green-50 p-6 dark:bg-green-900/20">
            <Upload className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Drag & Drop sau Click pentru Upload
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
            Suportăm fișiere Excel (.xlsx, .xls) și CSV (.csv)
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            Dimensiune maximă: 10 MB
          </p>
          <Button className="mt-6 gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Selectează Fișier
          </Button>
        </div>
      </Card>

      {/* Requirements Card */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-50">
          Cerințe Format Balanță
        </h3>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Fișier Excel (.xlsx, .xls) sau CSV (.csv)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Coloane: Cont, Denumire, Sold Inițial D/C, Rulaj D/C, Sold Final D/C</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Format conturi: XX sau XXX.XX (conform OMFP 1802/2014)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Echilibru verificat: Total Debite = Total Credite</span>
          </li>
        </ul>
      </Card>

      {/* Warning Card */}
      <Card className="border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
              Selectează mai întâi o companie
            </p>
            <p className="mt-1 text-xs text-amber-800 dark:text-amber-400">
              Pentru a încărca o balanță de verificare, trebuie să selectezi o companie din header-ul de sus.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
