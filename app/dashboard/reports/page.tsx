/**
 * Pagina pentru gestionarea rapoartelor financiare.
 * 
 * Permite utilizatorilor să:
 * - Vizualizeze lista de rapoarte generate
 * - Genereze rapoarte noi
 * - Descarce rapoarte în format PDF/Excel
 * - Vizualizeze detaliile rapoartelor
 * - Filtreze și sorteze rapoarte
 * 
 * Task 1.11 - Reports UI completat
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, TrendingUp, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ReportList } from '@/components/reports/report-list';
import { ExportOptions } from '@/components/reports/export-options';
import { useReports } from '@/hooks/use-reports';
import type { ReportType, ReportStatus, ReportExportFormat } from '@/types/reports';
import type { ExportCustomOptions } from '@/components/reports/export-options';

/**
 * Pagina Reports - Gestionare rapoarte financiare.
 */
export default function ReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    reports,
    isLoading,
    error,
    pagination,
    filters,
    fetchReports,
    downloadReport,
    deleteReport,
    updateFilters,
    goToPage,
  } = useReports();

  // State pentru dialog export
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportReportId, setExportReportId] = useState<string | null>(null);

  // Mock company ID (în producție ar veni din context sau URL)
  const [selectedCompanyId] = useState<string>('mock-company-id');

  // Fetch rapoarte la montare
  useEffect(() => {
    if (selectedCompanyId) {
      fetchReports(selectedCompanyId);
    }
  }, [selectedCompanyId, fetchReports]);

  /**
   * Gestionează generarea unui raport nou.
   */
  const handleGenerateReport = () => {
    // Redirect la pagină de generare (va fi implementată)
    router.push('/dashboard/reports/generate');
  };

  /**
   * Gestionează vizualizarea unui raport.
   */
  const handleViewReport = (reportId: string) => {
    router.push(`/dashboard/reports/${reportId}`);
  };

  /**
   * Gestionează descărcarea unui raport.
   */
  const handleDownloadReport = async (reportId: string) => {
    setExportReportId(reportId);
    setExportDialogOpen(true);
  };

  /**
   * Gestionează export-ul cu opțiuni personalizate.
   */
  const handleExport = async (format: ReportExportFormat, options: ExportCustomOptions) => {
    if (!exportReportId) return;

    const downloadUrl = await downloadReport(exportReportId, format);

    if (downloadUrl) {
      toast({
        title: 'Raport exportat cu succes',
        description: `Raportul a fost exportat în format ${format.toUpperCase()}.`,
      });

      // Deschide URL în tab nou (în producție ar fi un download automat)
      window.open(downloadUrl, '_blank');
    } else {
      toast({
        title: 'Eroare la export',
        description: 'Nu s-a putut exporta raportul. Încercați din nou.',
        variant: 'destructive',
      });
    }

    setExportDialogOpen(false);
    setExportReportId(null);
  };

  /**
   * Gestionează ștergerea unui raport.
   */
  const handleDeleteReport = async (reportId: string) => {
    // Confirmă ștergerea
    const confirmed = window.confirm(
      'Sigur doriți să ștergeți acest raport? Această acțiune este ireversibilă.'
    );

    if (!confirmed) return;

    const success = await deleteReport(reportId);

    if (success) {
      toast({
        title: 'Raport șters',
        description: 'Raportul a fost șters cu succes.',
      });

      // Refresh lista
      fetchReports(selectedCompanyId);
    } else {
      toast({
        title: 'Eroare la ștergere',
        description: 'Nu s-a putut șterge raportul. Încercați din nou.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Gestionează schimbarea filtrului de tip.
   */
  const handleFilterTypeChange = (type: ReportType | 'all') => {
    updateFilters({ reportType: type === 'all' ? undefined : type, page: 1 });
    fetchReports(selectedCompanyId, { reportType: type === 'all' ? undefined : type, page: 1 });
  };

  /**
   * Gestionează schimbarea filtrului de status.
   */
  const handleFilterStatusChange = (status: ReportStatus | 'all') => {
    updateFilters({ status: status === 'all' ? undefined : status, page: 1 });
    fetchReports(selectedCompanyId, { status: status === 'all' ? undefined : status, page: 1 });
  };

  /**
   * Gestionează schimbarea paginii.
   */
  const handlePageChange = (page: number) => {
    goToPage(page);
    fetchReports(selectedCompanyId, { page });
  };

  // Afișare eroare
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Rapoarte Financiare
          </h1>
        </div>

        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-red-50 p-6 dark:bg-red-900/20">
              <FileText className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Eroare la încărcarea rapoartelor
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              {error}
            </p>
            <Button
              className="mt-6"
              onClick={() => fetchReports(selectedCompanyId)}
            >
              Încearcă din nou
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
        <Button className="gap-2" onClick={handleGenerateReport}>
          <Plus className="h-4 w-4" />
          Generează Raport Nou
        </Button>
      </div>

      {/* Statistici rapide */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Rapoarte
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
                {pagination.total}
              </p>
            </div>
            <div className="rounded-full bg-indigo-50 p-3 dark:bg-indigo-900/20">
              <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Luna Aceasta
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
                {reports.filter((r) => {
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return new Date(r.created_at) > monthAgo;
                }).length}
              </p>
            </div>
            <div className="rounded-full bg-green-50 p-3 dark:bg-green-900/20">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Tipuri Diferite
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
                {new Set(reports.map((r) => r.report_type)).size}
              </p>
            </div>
            <div className="rounded-full bg-purple-50 p-3 dark:bg-purple-900/20">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Lista rapoarte sau Empty State */}
      {!isLoading && reports.length === 0 ? (
        <>
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
              <Button className="mt-6 gap-2" onClick={handleGenerateReport}>
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
        </>
      ) : (
        <ReportList
          reports={reports}
          isLoading={isLoading}
          onDownload={handleDownloadReport}
          onView={handleViewReport}
          onDelete={handleDeleteReport}
          onFilterTypeChange={handleFilterTypeChange}
          onFilterStatusChange={handleFilterStatusChange}
          currentTypeFilter={(filters.reportType || 'all') as ReportType | 'all'}
          currentStatusFilter={(filters.status || 'all') as ReportStatus | 'all'}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Dialog Export Options */}
      <ExportOptions
        open={exportDialogOpen}
        onClose={() => {
          setExportDialogOpen(false);
          setExportReportId(null);
        }}
        onExport={handleExport}
        isLoading={isLoading}
        reportId={exportReportId || undefined}
        reportTitle={
          exportReportId
            ? reports.find((r) => r.id === exportReportId)?.title
            : undefined
        }
      />
    </div>
  );
}
