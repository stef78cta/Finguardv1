/**
 * Componentă pentru afișarea listei de rapoarte financiare.
 * 
 * Oferă:
 * - Tabel cu rapoartele generate
 * - Filtrare după tip, status, dată
 * - Sortare
 * - Paginare
 * - Acțiuni (download, vizualizare, ștergere)
 * 
 * @module components/reports/report-list
 */

'use client';

import { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { 
  ReportWithDetails, 
  ReportType, 
  ReportStatus,
  ReportExportFormat 
} from '@/types/reports';
import { 
  formatReportType, 
  formatReportStatus,
  getReportStatusColor,
  formatFileSize,
  getDaysUntilExpiration,
  isReportExpired
} from '@/types/reports';

/**
 * Props pentru componenta ReportList.
 */
export interface ReportListProps {
  /** Lista de rapoarte de afișat */
  reports: ReportWithDetails[];
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Callback pentru descărcare raport */
  onDownload?: (reportId: string) => void;
  
  /** Callback pentru vizualizare raport */
  onView?: (reportId: string) => void;
  
  /** Callback pentru ștergere raport */
  onDelete?: (reportId: string) => void;
  
  /** Callback pentru schimbare filtru tip */
  onFilterTypeChange?: (type: ReportType | 'all') => void;
  
  /** Callback pentru schimbare filtru status */
  onFilterStatusChange?: (status: ReportStatus | 'all') => void;
  
  /** Valoare curentă filtru tip */
  currentTypeFilter?: ReportType | 'all';
  
  /** Valoare curentă filtru status */
  currentStatusFilter?: ReportStatus | 'all';
  
  /** Paginare - pagina curentă */
  currentPage?: number;
  
  /** Paginare - total pagini */
  totalPages?: number;
  
  /** Callback pentru schimbare pagină */
  onPageChange?: (page: number) => void;
}

/**
 * Componentă ReportList - listă rapoarte cu filtrare și acțiuni.
 */
export function ReportList({
  reports,
  isLoading = false,
  onDownload,
  onView,
  onDelete,
  onFilterTypeChange,
  onFilterStatusChange,
  currentTypeFilter = 'all',
  currentStatusFilter = 'all',
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: ReportListProps) {
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());

  /**
   * Toggle selectare raport.
   */
  const toggleSelection = (reportId: string) => {
    const newSelection = new Set(selectedReports);
    if (newSelection.has(reportId)) {
      newSelection.delete(reportId);
    } else {
      newSelection.add(reportId);
    }
    setSelectedReports(newSelection);
  };

  /**
   * Obține iconiță pentru status.
   */
  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'generating':
        return <Clock className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
    }
  };

  /**
   * Formatează data pentru afișare.
   */
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-4">
      {/* Filtre */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Filtrează:
            </span>
          </div>

          {/* Filtru Tip Raport */}
          {onFilterTypeChange && (
            <Select
              value={currentTypeFilter}
              onValueChange={(value) => onFilterTypeChange(value as ReportType | 'all')}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tip raport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate tipurile</SelectItem>
                <SelectItem value="financial_analysis">Analiză Financiară</SelectItem>
                <SelectItem value="kpi_dashboard">Dashboard KPI</SelectItem>
                <SelectItem value="comparative_analysis">Analiză Comparativă</SelectItem>
                <SelectItem value="executive_summary">Sumar Executiv</SelectItem>
                <SelectItem value="detailed_breakdown">Analiză Detaliată</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Filtru Status */}
          {onFilterStatusChange && (
            <Select
              value={currentStatusFilter}
              onValueChange={(value) => onFilterStatusChange(value as ReportStatus | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate statusurile</SelectItem>
                <SelectItem value="completed">Finalizat</SelectItem>
                <SelectItem value="generating">Se generează</SelectItem>
                <SelectItem value="error">Eroare</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Info selecție */}
          {selectedReports.size > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {selectedReports.size} selectate
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReports(new Set())}
              >
                Deselectează toate
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Tabel rapoarte */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedReports.size === reports.length && reports.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedReports(new Set(reports.map((r) => r.id)));
                    } else {
                      setSelectedReports(new Set());
                    }
                  }}
                  className="rounded border-slate-300 dark:border-slate-600"
                />
              </TableHead>
              <TableHead>Raport</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Companie</TableHead>
              <TableHead>Perioadă</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dimensiune</TableHead>
              <TableHead>Creat la</TableHead>
              <TableHead className="text-right">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Se încarcă rapoartele...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-slate-400 dark:text-slate-600" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Niciun raport găsit
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => {
                const isExpired = isReportExpired(report);
                const daysUntilExpiration = getDaysUntilExpiration(report);

                return (
                  <TableRow key={report.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedReports.has(report.id)}
                        onChange={() => toggleSelection(report.id)}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-50">
                            {report.title}
                          </div>
                          {isExpired && (
                            <div className="text-xs text-red-600 dark:text-red-400">
                              Expirat
                            </div>
                          )}
                          {!isExpired && daysUntilExpiration !== null && daysUntilExpiration <= 7 && (
                            <div className="text-xs text-orange-600 dark:text-orange-400">
                              Expiră în {daysUntilExpiration} {daysUntilExpiration === 1 ? 'zi' : 'zile'}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="secondary">
                        {formatReportType(report.report_type as ReportType)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {report.companyName || 'N/A'}
                    </TableCell>
                    
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {report.periodFormatted || 'N/A'}
                    </TableCell>
                    
                    <TableCell>
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md w-fit ${getReportStatusColor(report.report_type as ReportStatus)}`}>
                        {getStatusIcon(report.report_type as ReportStatus)}
                        <span className="text-xs font-medium">
                          {formatReportStatus(report.report_type as ReportStatus)}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {report.fileSize ? formatFileSize(report.fileSize) : '-'}
                    </TableCell>
                    
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs">
                          {formatDate(report.created_at)}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(report.id)}
                            title="Vizualizează raport"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {onDownload && report.canDownload && !isExpired && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownload(report.id)}
                            title="Descarcă raport"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(report.id)}
                            title="Șterge raport"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Paginare */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Pagina {currentPage} din {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Următor
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
