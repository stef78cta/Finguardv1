/**
 * Tipuri TypeScript pentru Rapoarte Financiare.
 * 
 * Definește structurile pentru generarea, manipularea și afișarea rapoartelor
 * financiare în format PDF/Excel.
 * 
 * @module types/reports
 */

import type { Database } from './database';
import type { BalanceSheet, IncomeStatement } from './financial-statements';

/**
 * Tipul de raport financiar.
 */
export type ReportType =
  | 'financial_analysis'       // Analiză financiară completă
  | 'kpi_dashboard'             // Dashboard KPI-uri
  | 'comparative_analysis'      // Analiză comparativă
  | 'executive_summary'         // Sumar executiv
  | 'detailed_breakdown';       // Analiză detaliată

/**
 * Formatul de export pentru raport.
 */
export type ReportExportFormat = 'pdf' | 'excel';

/**
 * Statusul unui raport.
 */
export type ReportStatus = 'generating' | 'completed' | 'error';

/**
 * Raport din baza de date (tipul de bază).
 */
export type Report = Database['public']['Tables']['reports']['Row'];

/**
 * Date pentru inserare raport nou.
 */
export type ReportInsert = Database['public']['Tables']['reports']['Insert'];

/**
 * Structură extinsă pentru raport cu date calculate.
 */
export interface ReportWithDetails extends Report {
  /** Numele companiei */
  companyName: string;
  
  /** Perioada formatată (ex: "Ianuarie 2024") */
  periodFormatted: string;
  
  /** Dimensiune fișier (dacă există) */
  fileSize?: number;
  
  /** Număr de pagini (dacă e PDF) */
  pageCount?: number;
  
  /** Data expirării (pentru rapoarte temporare) */
  expiresAt?: Date | null;
  
  /** Este raportul expirat? */
  isExpired: boolean;
  
  /** Poate fi descărcat? */
  canDownload: boolean;
}

/**
 * Opțiuni pentru generarea unui raport.
 */
export interface GenerateReportOptions {
  /** Tipul raportului */
  reportType: ReportType;
  
  /** ID companie */
  companyId: string;
  
  /** ID import balanță sursă */
  sourceImportId: string;
  
  /** Titlu custom (opțional) */
  title?: string;
  
  /** Format export */
  format: ReportExportFormat;
  
  /** Include grafice în raport */
  includeCharts?: boolean;
  
  /** Include detalii complete */
  includeDetails?: boolean;
  
  /** Include analiză comparativă cu perioadă anterioară */
  includeComparison?: boolean;
  
  /** ID perioadă pentru comparație */
  comparisonImportId?: string;
  
  /** Limba raportului */
  language?: 'ro' | 'en';
  
  /** Template raport (dacă există personalizat) */
  templateId?: string;
}

/**
 * Date pentru raportul de analiză financiară.
 */
export interface FinancialAnalysisReportData {
  /** Balance Sheet */
  balanceSheet: BalanceSheet;
  
  /** Income Statement */
  incomeStatement: IncomeStatement;
  
  /** KPI-uri calculate */
  kpis: KpiReportSection[];
  
  /** Analiză tendințe */
  trendAnalysis?: TrendAnalysis;
  
  /** Alerte și observații */
  alerts: ReportAlert[];
  
  /** Recomandări */
  recommendations: string[];
}

/**
 * Secțiune KPI în raport.
 */
export interface KpiReportSection {
  /** Categoria KPI */
  category: string;
  
  /** Denumire categorie (human-readable) */
  categoryName: string;
  
  /** KPI-uri din această categorie */
  kpis: KpiReportItem[];
  
  /** Scor general pentru categorie (0-100) */
  overallScore?: number;
}

/**
 * Item individual KPI în raport.
 */
export interface KpiReportItem {
  /** Cod KPI */
  code: string;
  
  /** Denumire KPI */
  name: string;
  
  /** Valoare calculată */
  value: number;
  
  /** Unitate de măsură */
  unit: string;
  
  /** Valoare perioadă anterioară (dacă există) */
  previousValue?: number;
  
  /** Variație % față de perioadă anterioară */
  changePercent?: number;
  
  /** Trend (crescător/descrescător/stabil) */
  trend?: 'up' | 'down' | 'stable';
  
  /** Interpretare (bun/slab/excelent) */
  interpretation?: 'excellent' | 'good' | 'fair' | 'poor';
  
  /** Range țintă pentru acest KPI */
  targetRange?: {
    min?: number;
    max?: number;
    optimal?: number;
  };
  
  /** Explicație scurtă */
  description?: string;
}

/**
 * Analiză tendințe (trend analysis).
 */
export interface TrendAnalysis {
  /** Perioada analizată */
  period: string;
  
  /** Perioada de comparație */
  comparisonPeriod?: string;
  
  /** Tendințe identificate */
  trends: TrendItem[];
  
  /** Scor general tendințe (0-100) */
  overallScore: number;
}

/**
 * Item individual de tendință.
 */
export interface TrendItem {
  /** Categorie */
  category: string;
  
  /** Descriere */
  description: string;
  
  /** Tip tendință */
  type: 'positive' | 'negative' | 'neutral';
  
  /** Impact (low/medium/high) */
  impact: 'low' | 'medium' | 'high';
  
  /** Valori suport */
  metrics?: Record<string, number>;
}

/**
 * Alertă în raport.
 */
export interface ReportAlert {
  /** Nivel severitate */
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  /** Categorie alertă */
  category: string;
  
  /** Titlu alertă */
  title: string;
  
  /** Mesaj detaliat */
  message: string;
  
  /** Acțiuni recomandate */
  actions?: string[];
  
  /** Valori asociate */
  relatedValues?: Record<string, number>;
}

/**
 * Rezultatul generării unui raport.
 */
export interface GenerateReportResult {
  /** Succes */
  success: boolean;
  
  /** ID raport generat */
  reportId?: string;
  
  /** Path fișier (dacă e generat local) */
  filePath?: string;
  
  /** URL download (dacă e în storage) */
  downloadUrl?: string;
  
  /** Data expire */
  expiresAt?: Date;
  
  /** Mesaj eroare (dacă a eșuat) */
  error?: string;
  
  /** Detalii generare */
  metadata: {
    /** Durata generării (ms) */
    duration: number;
    
    /** Dimensiune fișier (bytes) */
    fileSize?: number;
    
    /** Număr de pagini (PDF) */
    pageCount?: number;
    
    /** Format generat */
    format: ReportExportFormat;
  };
}

/**
 * Filtru pentru listarea rapoartelor.
 */
export interface ReportListFilter {
  /** ID companie */
  companyId?: string;
  
  /** Tip raport */
  reportType?: ReportType;
  
  /** Status */
  status?: ReportStatus;
  
  /** Data de la */
  dateFrom?: Date;
  
  /** Data până la */
  dateTo?: Date;
  
  /** Sortare */
  sortBy?: 'created_at' | 'title' | 'report_type';
  
  /** Direcție sortare */
  sortOrder?: 'asc' | 'desc';
  
  /** Paginare - număr pagină */
  page?: number;
  
  /** Paginare - elemente per pagină */
  perPage?: number;
}

/**
 * Rezultat listare rapoarte.
 */
export interface ReportListResult {
  /** Rapoarte */
  reports: ReportWithDetails[];
  
  /** Total rapoarte (pentru paginare) */
  total: number;
  
  /** Pagina curentă */
  page: number;
  
  /** Elemente per pagină */
  perPage: number;
  
  /** Număr total pagini */
  totalPages: number;
  
  /** Există pagină anterioară? */
  hasPrevious: boolean;
  
  /** Există pagină următoare? */
  hasNext: boolean;
}

/**
 * Statistici rapoarte pentru dashboard.
 */
export interface ReportStatistics {
  /** Total rapoarte generate */
  totalReports: number;
  
  /** Rapoarte generate luna aceasta */
  reportsThisMonth: number;
  
  /** Rapoarte generate săptămâna aceasta */
  reportsThisWeek: number;
  
  /** Tipuri de rapoarte - breakdown */
  byType: Record<ReportType, number>;
  
  /** Status rapoarte - breakdown */
  byStatus: Record<ReportStatus, number>;
  
  /** Format rapoarte - breakdown */
  byFormat: Record<ReportExportFormat, number>;
  
  /** Dimensiune totală storage (bytes) */
  totalStorageUsed: number;
}

/**
 * Opțiuni pentru descărcarea unui raport.
 */
export interface DownloadReportOptions {
  /** ID raport */
  reportId: string;
  
  /** Format dorit (poate diferi de cel original) */
  format?: ReportExportFormat;
  
  /** Forțează re-generarea */
  forceRegenerate?: boolean;
}

/**
 * Template pentru rapoarte personalizate (viitor).
 */
export interface ReportTemplate {
  /** ID template */
  id: string;
  
  /** Nume template */
  name: string;
  
  /** Descriere */
  description?: string;
  
  /** Tip raport pentru care e template-ul */
  reportType: ReportType;
  
  /** Configurație template (JSON) */
  config: Record<string, unknown>;
  
  /** Este template implicit? */
  isDefault: boolean;
  
  /** ID companie (NULL pentru template global) */
  companyId?: string;
}

/**
 * Guard function pentru verificare tip raport.
 */
export function isReportType(value: string): value is ReportType {
  return [
    'financial_analysis',
    'kpi_dashboard',
    'comparative_analysis',
    'executive_summary',
    'detailed_breakdown',
  ].includes(value);
}

/**
 * Guard function pentru verificare format export.
 */
export function isReportExportFormat(value: string): value is ReportExportFormat {
  return ['pdf', 'excel'].includes(value);
}

/**
 * Helper pentru formatare tip raport în română.
 */
export function formatReportType(reportType: ReportType): string {
  const translations: Record<ReportType, string> = {
    financial_analysis: 'Analiză Financiară',
    kpi_dashboard: 'Dashboard KPI',
    comparative_analysis: 'Analiză Comparativă',
    executive_summary: 'Sumar Executiv',
    detailed_breakdown: 'Analiză Detaliată',
  };
  return translations[reportType] || reportType;
}

/**
 * Helper pentru formatare status raport în română.
 */
export function formatReportStatus(status: ReportStatus): string {
  const translations: Record<ReportStatus, string> = {
    generating: 'Se generează',
    completed: 'Finalizat',
    error: 'Eroare',
  };
  return translations[status] || status;
}

/**
 * Helper pentru obținere culoare status.
 */
export function getReportStatusColor(status: ReportStatus): string {
  const colors: Record<ReportStatus, string> = {
    generating: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
    completed: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
    error: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  };
  return colors[status] || '';
}

/**
 * Helper pentru obținere iconiță format.
 */
export function getReportFormatIcon(format: ReportExportFormat): string {
  return format === 'pdf' ? '📄' : '📊';
}

/**
 * Helper pentru formatare dimensiune fișier.
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Helper pentru verificare dacă raportul este expirat.
 */
export function isReportExpired(report: Report): boolean {
  if (!report.expires_at) return false;
  return new Date(report.expires_at) < new Date();
}

/**
 * Helper pentru calculare zile rămase până la expirare.
 */
export function getDaysUntilExpiration(report: Report): number | null {
  if (!report.expires_at) return null;
  const now = new Date();
  const expiresAt = new Date(report.expires_at);
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}
