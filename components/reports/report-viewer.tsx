/**
 * Componentă pentru vizualizarea detaliilor unui raport financiar.
 * 
 * Oferă:
 * - Metadata raport
 * - Preview conținut (text/JSON)
 * - Acțiuni export
 * - Linkuri download
 * 
 * @module components/reports/report-viewer
 */

'use client';

import { 
  FileText, 
  Download, 
  Calendar,
  Building2,
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ReportWithDetails, ReportType, ReportExportFormat } from '@/types/reports';
import { 
  formatReportType, 
  formatReportStatus,
  getReportStatusColor,
  formatFileSize,
  getDaysUntilExpiration,
  isReportExpired,
  getReportFormatIcon
} from '@/types/reports';

/**
 * Props pentru componenta ReportViewer.
 */
export interface ReportViewerProps {
  /** Raportul de afișat */
  report: ReportWithDetails;
  
  /** Loading state pentru acțiuni */
  isLoading?: boolean;
  
  /** Callback pentru descărcare raport */
  onDownload?: (reportId: string, format: ReportExportFormat) => void;
  
  /** Callback pentru ștergere raport */
  onDelete?: (reportId: string) => void;
  
  /** Callback pentru regenerare raport */
  onRegenerate?: (reportId: string) => void;
}

/**
 * Componentă ReportViewer - vizualizare detalii raport.
 */
export function ReportViewer({
  report,
  isLoading = false,
  onDownload,
  onDelete,
  onRegenerate,
}: ReportViewerProps) {
  const isExpired = isReportExpired(report);
  const daysUntilExpiration = getDaysUntilExpiration(report);

  /**
   * Formatează data pentru afișare.
   */
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  /**
   * Parse report data JSON (dacă există).
   */
  const getReportData = () => {
    if (!report.report_data) return null;
    try {
      return typeof report.report_data === 'string' 
        ? JSON.parse(report.report_data) 
        : report.report_data;
    } catch {
      return null;
    }
  };

  const reportData = getReportData();

  return (
    <div className="space-y-6">
      {/* Header cu titlu și acțiuni */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/20">
            <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {report.title}
            </h1>
            
            <div className="mt-2 flex items-center gap-3">
              <Badge variant="secondary">
                {formatReportType(report.report_type as ReportType)}
              </Badge>
              
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${getReportStatusColor(report.report_type as ReportType)}`}>
                {formatReportStatus(report.report_type as ReportType)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDownload && report.canDownload && !isExpired && (
            <>
              <Button
                onClick={() => onDownload(report.id, 'pdf')}
                disabled={isLoading}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Descarcă PDF
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onDownload(report.id, 'excel')}
                disabled={isLoading}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Descarcă Excel
              </Button>
            </>
          )}
          
          {onRegenerate && (
            <Button
              variant="outline"
              onClick={() => onRegenerate(report.id)}
              disabled={isLoading}
            >
              Regenerează
            </Button>
          )}
        </div>
      </div>

      {/* Alertă expirare */}
      {isExpired && (
        <Card className="border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                Raport expirat
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                Acest raport a expirat și nu mai poate fi descărcat. Vă rugăm să regenerați raportul.
              </p>
            </div>
          </div>
        </Card>
      )}

      {!isExpired && daysUntilExpiration !== null && daysUntilExpiration <= 7 && (
        <Card className="border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                Raport va expira în curând
              </h3>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                Acest raport va expira în {daysUntilExpiration} {daysUntilExpiration === 1 ? 'zi' : 'zile'}. 
                Descărcați-l acum sau regenerați-l pentru a-l păstra disponibil.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Informații raport */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Informații Raport
        </h2>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Companie
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {report.companyName || 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Perioadă
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {report.periodFormatted || 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Generat la
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {formatDate(report.created_at)}
              </div>
            </div>
          </div>

          {report.fileSize && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Dimensiune fișier
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {formatFileSize(report.fileSize)}
                </div>
              </div>
            </div>
          )}

          {report.pageCount && (
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Număr pagini
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {report.pageCount} pagini
                </div>
              </div>
            </div>
          )}

          {report.expires_at && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Expiră la
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {formatDate(report.expires_at)}
                </div>
              </div>
            </div>
          )}
        </div>

        {report.file_path && (
          <>
            <Separator className="my-4" />
            
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fișier generat
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span>{getReportFormatIcon('pdf')}</span>
                <span className="font-mono text-xs">{report.file_path}</span>
                {report.canDownload && !isExpired && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto gap-1"
                    onClick={() => onDownload && onDownload(report.id, 'pdf')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Deschide
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Preview date raport (dacă există) */}
      {reportData && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
            Date Raport
          </h2>
          
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50">
            <pre className="text-xs overflow-auto text-slate-700 dark:text-slate-300">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        </Card>
      )}

      {/* Acțiuni secundare */}
      <div className="flex items-center justify-between border-t pt-6">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          ID raport: <span className="font-mono">{report.id}</span>
        </div>
        
        {onDelete && (
          <Button
            variant="destructive"
            onClick={() => onDelete(report.id)}
            disabled={isLoading}
          >
            Șterge raport
          </Button>
        )}
      </div>
    </div>
  );
}
