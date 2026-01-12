/**
 * Pagina pentru vizualizarea unui raport financiar individual.
 * 
 * Permite utilizatorilor să:
 * - Vadă detaliile complete ale raportului
 * - Descarce raportul în diferite formate
 * - Regenereze raportul
 * - Șteargă raportul
 * 
 * Task 1.11 - Reports UI completat
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ReportViewer } from '@/components/reports/report-viewer';
import { ExportOptions } from '@/components/reports/export-options';
import { useReport } from '@/hooks/use-reports';
import type { ReportExportFormat } from '@/types/reports';
import type { ExportCustomOptions } from '@/components/reports/export-options';

/**
 * Props pentru pagina ReportDetailPage.
 */
interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Pagina detalii raport individual.
 */
export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [reportId, setReportId] = useState<string | null>(null);
  const { report, isLoading, error } = useReport(reportId);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Extrage ID din params
  useEffect(() => {
    params.then(({ id }) => setReportId(id));
  }, [params]);

  /**
   * Gestionează descărcarea raportului.
   */
  const handleDownload = async (reportId: string, format: ReportExportFormat) => {
    setExportDialogOpen(true);
  };

  /**
   * Gestionează export-ul cu opțiuni personalizate.
   */
  const handleExport = async (format: ReportExportFormat, options: ExportCustomOptions) => {
    if (!report) return;

    setIsDownloading(true);

    try {
      const response = await fetch(
        `/api/reports/${report.id}/download?format=${format}`
      );

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to download report');
      }

      toast({
        title: 'Raport exportat cu succes',
        description: `Raportul a fost exportat în format ${format.toUpperCase()}.`,
      });

      // Deschide URL în tab nou
      window.open(result.data.downloadUrl, '_blank');
    } catch (err) {
      console.error('Error downloading report:', err);
      toast({
        title: 'Eroare la export',
        description: 'Nu s-a putut exporta raportul. Încercați din nou.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
      setExportDialogOpen(false);
    }
  };

  /**
   * Gestionează ștergerea raportului.
   */
  const handleDelete = async (reportId: string) => {
    const confirmed = window.confirm(
      'Sigur doriți să ștergeți acest raport? Această acțiune este ireversibilă.'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete report');
      }

      toast({
        title: 'Raport șters',
        description: 'Raportul a fost șters cu succes.',
      });

      // Redirect înapoi la lista de rapoarte
      router.push('/dashboard/reports');
    } catch (err) {
      console.error('Error deleting report:', err);
      toast({
        title: 'Eroare la ștergere',
        description: 'Nu s-a putut șterge raportul. Încercați din nou.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Gestionează regenerarea raportului.
   */
  const handleRegenerate = async (reportId: string) => {
    toast({
      title: 'Regenerare raport',
      description: 'Funcționalitatea de regenerare va fi implementată în Task 1.10 (PDF Generation).',
    });
  };

  // Loading state
  if (isLoading || !reportId) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la rapoarte
        </Button>

        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Se încarcă raportul...
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Vă rugăm să așteptați
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la rapoarte
        </Button>

        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-red-50 p-6 dark:bg-red-900/20">
              <ArrowLeft className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Raportul nu a fost găsit
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              {error || 'Raportul solicitat nu există sau nu aveți permisiunea de a-l vizualiza.'}
            </p>
            <Button
              className="mt-6"
              onClick={() => router.push('/dashboard/reports')}
            >
              Înapoi la rapoarte
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Buton înapoi */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la rapoarte
      </Button>

      {/* Report Viewer */}
      <ReportViewer
        report={report}
        isLoading={isDownloading}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onRegenerate={handleRegenerate}
      />

      {/* Dialog Export Options */}
      <ExportOptions
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        isLoading={isDownloading}
        reportId={report.id}
        reportTitle={report.title}
      />
    </div>
  );
}
