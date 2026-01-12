/**
 * Tipuri TypeScript pentru generarea rapoartelor PDF.
 * 
 * Definește structurile pentru crearea rapoartelor financiare profesionale
 * care includ KPI-uri, situații financiare, grafice și analize.
 */

import type { Database } from './database';
import type { KPIValueRow, KPIDefinitionRow, FinancialComponents } from './kpi';
import type { BalanceSheet, IncomeStatement } from './financial-statements';

/**
 * Tip pentru rapoarte din database.
 */
export type ReportRow = Database['public']['Tables']['reports']['Row'];
export type ReportInsert = Database['public']['Tables']['reports']['Insert'];
export type ReportUpdate = Database['public']['Tables']['reports']['Update'];

/**
 * Tipuri de rapoarte disponibile.
 */
export type ReportType = 
  | 'financial_analysis'      // Analiză financiară completă (KPIs + Statements)
  | 'kpi_dashboard'            // Dashboard KPI-uri
  | 'balance_sheet'            // Doar Bilanț
  | 'income_statement'         // Doar Cont P&L
  | 'comparative_analysis'     // Comparație între perioade
  | 'custom';                  // Raport personalizat

/**
 * Formatul de export al raportului.
 */
export type ReportFormat = 'pdf' | 'excel' | 'json';

/**
 * Metadata pentru raportul PDF.
 */
export interface PDFReportMetadata {
  /** Titlu raport */
  title: string;
  
  /** Subtitlu (opțional) */
  subtitle?: string;
  
  /** Data generării */
  generatedAt: Date;
  
  /** Utilizator care a generat */
  generatedBy: {
    id: string;
    name: string;
    email: string;
  };
  
  /** Perioadă analizată */
  period: {
    start: Date;
    end: Date;
    label: string; // Ex: "Q1 2024", "Ianuarie 2024"
  };
  
  /** Versiune raport */
  version: string;
  
  /** Logo companie (Base64 sau URL) */
  companyLogo?: string;
}

/**
 * Informații despre companie pentru raport.
 */
export interface PDFCompanyInfo {
  /** ID companie */
  id: string;
  
  /** Nume companie */
  name: string;
  
  /** CUI */
  cui: string;
  
  /** Țară */
  country: string;
  
  /** Monedă */
  currency: string;
  
  /** An fiscal început lună */
  fiscalYearStartMonth: number;
  
  /** Adresă (opțional) */
  address?: string;
  
  /** Telefon (opțional) */
  phone?: string;
  
  /** Logo URL (opțional) */
  logoUrl?: string;
}

/**
 * Date KPI pentru raport PDF.
 */
export interface PDFKPIData {
  /** Definiție KPI */
  definition: KPIDefinitionRow;
  
  /** Valoare calculată */
  value: KPIValueRow;
  
  /** Interpretare (excellent/good/poor) */
  interpretation: 'excellent' | 'good' | 'attention_needed' | 'poor';
  
  /** Mesaj interpretare */
  interpretationMessage: string;
  
  /** Trend față de perioadă anterioară (opțional) */
  trend?: {
    previousValue: number;
    change: number;
    changePercent: number;
    direction: 'up' | 'down' | 'stable';
  };
}

/**
 * Date KPI grupate pe categorii.
 */
export interface PDFKPIDataByCategory {
  /** Categorie */
  category: string;
  
  /** Label categorie în română */
  categoryLabel: string;
  
  /** KPI-uri din categorie */
  kpis: PDFKPIData[];
  
  /** Scor general categorie (0-100) */
  categoryScore: number;
  
  /** Interpretare categorie */
  categoryInterpretation: 'excellent' | 'good' | 'attention_needed' | 'poor';
}

/**
 * Executive Summary pentru raport.
 */
export interface PDFExecutiveSummary {
  /** Rezumat general (1-2 paragrafe) */
  overview: string;
  
  /** Puncte cheie pozitive */
  keyStrengths: string[];
  
  /** Zone care necesită atenție */
  areasOfConcern: string[];
  
  /** Recomandări (3-5 bullet points) */
  recommendations: string[];
  
  /** Scor general sănătate financiară (0-100) */
  overallHealthScore: number;
}

/**
 * Date pentru grafice în PDF.
 */
export interface PDFChartData {
  /** Tip grafic */
  type: 'bar' | 'line' | 'radar' | 'pie' | 'area';
  
  /** Titlu grafic */
  title: string;
  
  /** Date pentru grafic (simplificat pentru PDF) */
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      color?: string;
    }[];
  };
  
  /** Imagine grafic (Base64 PNG) - generat din Recharts */
  imageBase64?: string;
  
  /** Descriere grafic */
  description?: string;
}

/**
 * Secțiune pentru raportul PDF.
 */
export interface PDFReportSection {
  /** ID secțiune */
  id: string;
  
  /** Titlu secțiune */
  title: string;
  
  /** Ordin afișare */
  order: number;
  
  /** Include în raport? */
  include: boolean;
  
  /** Conținut secțiune (poate fi de mai multe tipuri) */
  content: 
    | PDFExecutiveSummary
    | PDFKPIDataByCategory[]
    | BalanceSheet
    | IncomeStatement
    | PDFChartData[]
    | { text: string };  // Pentru secțiuni text liber
}

/**
 * Opțiuni pentru generarea raportului PDF.
 */
export interface PDFGenerationOptions {
  /** Include Executive Summary */
  includeExecutiveSummary?: boolean;
  
  /** Include detalii companie */
  includeCompanyInfo?: boolean;
  
  /** Include KPI Dashboard */
  includeKPIs?: boolean;
  
  /** Categorii KPI de inclus (toate dacă undefined) */
  kpiCategories?: string[];
  
  /** Include Balance Sheet */
  includeBalanceSheet?: boolean;
  
  /** Include Income Statement */
  includeIncomeStatement?: boolean;
  
  /** Include grafice */
  includeCharts?: boolean;
  
  /** Tipuri grafice de inclus */
  chartTypes?: Array<'kpi_overview' | 'category_comparison' | 'trend_analysis'>;
  
  /** Include componente financiare */
  includeFinancialComponents?: boolean;
  
  /** Include notes/observații */
  includeNotes?: boolean;
  
  /** Note personalizate */
  customNotes?: string;
  
  /** Limbă raport */
  language?: 'ro' | 'en';
  
  /** Template stil (pentru viitor) */
  template?: 'default' | 'modern' | 'classic';
  
  /** Watermark (pentru versiuni demo/draft) */
  watermark?: string;
  
  /** Compresie PDF (pentru file size mai mic) */
  compress?: boolean;
}

/**
 * Structura completă pentru raportul PDF.
 */
export interface PDFReport {
  /** Metadata raport */
  metadata: PDFReportMetadata;
  
  /** Informații companie */
  companyInfo: PDFCompanyInfo;
  
  /** Executive Summary */
  executiveSummary?: PDFExecutiveSummary;
  
  /** Date KPI grupate pe categorii */
  kpiData?: PDFKPIDataByCategory[];
  
  /** Balance Sheet */
  balanceSheet?: BalanceSheet;
  
  /** Income Statement */
  incomeStatement?: IncomeStatement;
  
  /** Grafice */
  charts?: PDFChartData[];
  
  /** Componente financiare */
  financialComponents?: FinancialComponents;
  
  /** Note personalizate */
  notes?: string;
  
  /** Secțiuni personalizate */
  customSections?: PDFReportSection[];
}

/**
 * Rezultatul generării PDF.
 */
export interface PDFGenerationResult {
  /** Succes */
  success: boolean;
  
  /** Buffer PDF generat */
  pdfBuffer?: Buffer;
  
  /** Dimensiune fișier (bytes) */
  fileSize?: number;
  
  /** Număr pagini */
  pageCount?: number;
  
  /** Calea fișierului (dacă salvat) */
  filePath?: string;
  
  /** URL Supabase Storage (dacă uploadat) */
  storageUrl?: string;
  
  /** ID raport în database */
  reportId?: string;
  
  /** Erori întâlnite */
  errors: string[];
  
  /** Avertismente */
  warnings: string[];
  
  /** Durata generării (ms) */
  duration: number;
  
  /** Metadata performanță */
  performance?: {
    dataFetchTime: number;
    renderTime: number;
    chartGenerationTime: number;
    pdfGenerationTime: number;
  };
}

/**
 * Context pentru generarea raportului.
 */
export interface PDFGenerationContext {
  /** ID companie */
  companyId: string;
  
  /** ID import balanță */
  trialBalanceImportId: string;
  
  /** ID utilizator */
  userId: string;
  
  /** Opțiuni generare */
  options: PDFGenerationOptions;
  
  /** Generează și salvează în Supabase Storage */
  saveToStorage?: boolean;
  
  /** Calea în Storage */
  storagePath?: string;
}

/**
 * Configurare stiluri pentru PDF (culori brand, fonturi, etc.).
 */
export interface PDFStyleConfig {
  /** Culori brand */
  colors: {
    primary: string;        // #3B82F6 (blue)
    secondary: string;      // #10B981 (green)
    accent: string;         // #F59E0B (amber)
    danger: string;         // #EF4444 (red)
    text: string;           // #1F2937 (gray-800)
    textLight: string;      // #6B7280 (gray-500)
    background: string;     // #FFFFFF
    border: string;         // #E5E7EB (gray-200)
  };
  
  /** Fonturi */
  fonts: {
    heading: string;        // 'Helvetica-Bold'
    body: string;           // 'Helvetica'
    mono: string;           // 'Courier'
  };
  
  /** Dimensiuni font */
  fontSize: {
    title: number;          // 24
    heading: number;        // 18
    subheading: number;     // 14
    body: number;           // 12
    small: number;          // 10
    tiny: number;           // 8
  };
  
  /** Spacing */
  spacing: {
    xs: number;             // 4
    sm: number;             // 8
    md: number;             // 16
    lg: number;             // 24
    xl: number;             // 32
  };
}

/**
 * Șablon pentru KPI Card în PDF.
 */
export interface PDFKPICardTemplate {
  /** Nume KPI */
  name: string;
  
  /** Valoare formatată */
  valueFormatted: string;
  
  /** Unitate măsură */
  unit: string;
  
  /** Interpretare (color coded) */
  interpretation: 'excellent' | 'good' | 'attention_needed' | 'poor';
  
  /** Mesaj interpretare */
  message: string;
  
  /** Target range (dacă există) */
  targetRange?: string;
  
  /** Trend arrow (up/down/stable) */
  trend?: '↑' | '↓' | '→';
  
  /** Change percent */
  changePercent?: string;
}

/**
 * Guard pentru verificare PDFReport valid.
 */
export function isValidPDFReport(report: unknown): report is PDFReport {
  if (!report || typeof report !== 'object') return false;
  const r = report as Partial<PDFReport>;
  
  return (
    r.metadata !== undefined &&
    r.companyInfo !== undefined &&
    typeof r.metadata === 'object' &&
    typeof r.companyInfo === 'object'
  );
}

/**
 * Helper pentru interpretare scor în culoare.
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981'; // green - excellent
  if (score >= 60) return '#3B82F6'; // blue - good
  if (score >= 40) return '#F59E0B'; // amber - attention needed
  return '#EF4444'; // red - poor
}

/**
 * Helper pentru interpretare scor în text.
 */
export function getScoreInterpretation(
  score: number
): 'excellent' | 'good' | 'attention_needed' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'attention_needed';
  return 'poor';
}

/**
 * Constante pentru dimensiuni PDF standard.
 */
export const PDF_PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  LETTER: { width: 612, height: 792 },
} as const;

/**
 * Margini standard pentru PDF.
 */
export const PDF_MARGINS = {
  default: { top: 50, right: 50, bottom: 50, left: 50 },
  narrow: { top: 25, right: 25, bottom: 25, left: 25 },
  wide: { top: 75, right: 75, bottom: 75, left: 75 },
} as const;

/**
 * Configurare stiluri default pentru PDF.
 */
export const DEFAULT_PDF_STYLE: PDFStyleConfig = {
  colors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    text: '#1F2937',
    textLight: '#6B7280',
    background: '#FFFFFF',
    border: '#E5E7EB',
  },
  fonts: {
    heading: 'Helvetica-Bold',
    body: 'Helvetica',
    mono: 'Courier',
  },
  fontSize: {
    title: 24,
    heading: 18,
    subheading: 14,
    body: 12,
    small: 10,
    tiny: 8,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};
