/**
 * Generator principal pentru rapoarte PDF.
 * 
 * Orchestrează întregul proces de generare: fetch date, construiește raportul,
 * generează PDF-ul folosind React PDF, și returnează rezultatul.
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { FinancialAnalysisTemplate } from './templates/FinancialAnalysisTemplate';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { calculateAllKPIs, getCalculatedKPIs } from '@/lib/processing/kpi-engine';
import { generateFinancialStatements } from '@/lib/processing/financial-statements-generator';
import type {
  PDFReport,
  PDFGenerationContext,
  PDFGenerationResult,
  PDFReportMetadata,
  PDFCompanyInfo,
  PDFExecutiveSummary,
  PDFKPIDataByCategory,
  PDFKPIData,
} from '@/types/pdf-report';

/**
 * Generează raportul PDF complet.
 * 
 * @param context - Context cu ID-uri și opțiuni
 * @returns Rezultat generare cu buffer PDF
 */
export async function generatePDFReport(
  context: PDFGenerationContext
): Promise<PDFGenerationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const supabase = getSupabaseServerClient();
    
    // ========== STEP 1: Fetch date ==========
    const dataFetchStart = Date.now();
    
    // Fetch companie
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', context.companyId)
      .single();
    
    if (companyError || !company) {
      throw new Error(`Companie nu a fost găsită: ${companyError?.message}`);
    }
    
    // Fetch import balanță
    const { data: trialBalanceImport, error: importError } = await supabase
      .from('trial_balance_imports')
      .select('*')
      .eq('id', context.trialBalanceImportId)
      .single();
    
    if (importError || !trialBalanceImport) {
      throw new Error(`Import balanță nu a fost găsit: ${importError?.message}`);
    }
    
    // Fetch user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', context.userId)
      .single();
    
    if (userError || !user) {
      throw new Error(`Utilizator nu a fost găsit: ${userError?.message}`);
    }
    
    const dataFetchTime = Date.now() - dataFetchStart;
    
    // ========== STEP 2: Calculează KPI-uri (dacă nu există) ==========
    let kpiValues = await getCalculatedKPIs(supabase, context.trialBalanceImportId);
    
    if (kpiValues.length === 0 && context.options.includeKPIs !== false) {
      // Calculează KPI-uri
      const calculationResult = await calculateAllKPIs(
        supabase,
        context.trialBalanceImportId,
        context.companyId,
        { saveToDB: true, overwriteExisting: false }
      );
      
      if (calculationResult.statistics.successfulCalculations > 0) {
        kpiValues = await getCalculatedKPIs(supabase, context.trialBalanceImportId);
      } else {
        warnings.push('KPI-urile nu au putut fi calculate.');
      }
    }
    
    // ========== STEP 3: Generează situații financiare (dacă nu există) ==========
    let balanceSheet, incomeStatement;
    
    if (context.options.includeBalanceSheet !== false ||
        context.options.includeIncomeStatement !== false) {
      const statementsResult = await generateFinancialStatements(
        supabase,
        context.trialBalanceImportId,
        {
          generateBalanceSheet: context.options.includeBalanceSheet !== false,
          generateIncomeStatement: context.options.includeIncomeStatement !== false,
          overwrite: false,
        }
      );
      
      if (statementsResult.success) {
        balanceSheet = statementsResult.balanceSheet;
        incomeStatement = statementsResult.incomeStatement;
      } else {
        warnings.push('Situațiile financiare nu au putut fi generate.');
      }
    }
    
    // ========== STEP 4: Construiește raportul ==========
    const reportBuildStart = Date.now();
    
    // Metadata
    const metadata: PDFReportMetadata = {
      title: 'Raport de Analiză Financiară',
      subtitle: 'Indicatori de performanță și situații financiare',
      generatedAt: new Date(),
      generatedBy: {
        id: user.id,
        name: user.full_name || user.email,
        email: user.email,
      },
      period: {
        start: new Date(trialBalanceImport.period_start),
        end: new Date(trialBalanceImport.period_end),
        label: formatPeriodLabel(
          new Date(trialBalanceImport.period_start),
          new Date(trialBalanceImport.period_end)
        ),
      },
      version: '1.0',
      companyLogo: company.logo_url || undefined,
    };
    
    // Company info
    const companyInfo: PDFCompanyInfo = {
      id: company.id,
      name: company.name,
      cui: company.cui,
      country: company.country_code,
      currency: company.currency,
      fiscalYearStartMonth: company.fiscal_year_start_month,
      address: company.address || undefined,
      phone: company.phone || undefined,
      logoUrl: company.logo_url || undefined,
    };
    
    // Executive Summary (generat automat)
    const executiveSummary = context.options.includeExecutiveSummary !== false
      ? await generateExecutiveSummary(kpiValues)
      : undefined;
    
    // KPI Data (grupat pe categorii)
    const kpiData = context.options.includeKPIs !== false
      ? await groupKPIsByCategory(kpiValues, context.options.kpiCategories)
      : undefined;
    
    // Construiește obiectul PDFReport
    const report: PDFReport = {
      metadata,
      companyInfo,
      executiveSummary,
      kpiData,
      balanceSheet,
      incomeStatement,
      notes: context.options.customNotes,
    };
    
    const reportBuildTime = Date.now() - reportBuildStart;
    
    // ========== STEP 5: Generează PDF ==========
    const pdfGenerationStart = Date.now();
    
    // Creează componenta React pentru template
    const pdfComponent = createElement(FinancialAnalysisTemplate, {
      report,
      options: context.options,
    });
    
    // Render la Buffer
    const pdfBuffer = await renderToBuffer(pdfComponent);
    
    const pdfGenerationTime = Date.now() - pdfGenerationStart;
    
    // ========== STEP 6: Salvează în database (opțional) ==========
    let reportId: string | undefined;
    let storageUrl: string | undefined;
    
    if (context.saveToStorage) {
      // TODO: Upload to Supabase Storage și salvare în tabela reports
      warnings.push('Salvarea în storage nu este încă implementată.');
    }
    
    const totalDuration = Date.now() - startTime;
    
    // Return rezultat
    return {
      success: true,
      pdfBuffer: Buffer.from(pdfBuffer),
      fileSize: pdfBuffer.byteLength,
      pageCount: undefined, // React PDF nu oferă page count direct
      reportId,
      storageUrl,
      errors,
      warnings,
      duration: totalDuration,
      performance: {
        dataFetchTime,
        renderTime: reportBuildTime,
        chartGenerationTime: 0, // Nu avem grafice încă
        pdfGenerationTime,
      },
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Eroare necunoscută');
    
    return {
      success: false,
      errors,
      warnings,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Generează Executive Summary automat bazat pe KPI-uri și situații financiare.
 */
async function generateExecutiveSummary(
  kpiValues: any[]
): Promise<PDFExecutiveSummary> {
  // Analiză simplificată - în producție ar fi mai sofisticată
  const keyStrengths: string[] = [];
  const areasOfConcern: string[] = [];
  const recommendations: string[] = [];
  
  let totalScore = 0;
  let countedKPIs = 0;
  
  // Analizează fiecare KPI
  for (const kpi of kpiValues) {
    if (kpi.value === null) continue;
    
    countedKPIs++;
    
    // Scor bazat pe valoare (simplu - în viitor se va folosi target range din DB)
    let kpiScore = 50; // default
    
    // Scor simplu bazat pe valoare pozitivă/negativă
    if (kpi.value > 0) {
      kpiScore = 70;
      if (countedKPIs <= 3) { // Primele 3 KPI-uri considerate "strengths"
        keyStrengths.push(`${kpi.definition?.name || kpi.kpi_definition_id}: ${kpi.value.toFixed(2)}`);
      }
    } else {
      kpiScore = 30;
      if (areasOfConcern.length < 3) {
        areasOfConcern.push(`Valoare negativă pentru ${kpi.definition?.name || kpi.kpi_definition_id}`);
      }
    }
    
    totalScore += kpiScore;
  }
  
  const overallHealthScore = countedKPIs > 0 ? totalScore / countedKPIs : 50;
  
  // Generează recomandări generice
  if (overallHealthScore < 60) {
    recommendations.push('Revizuiți structura costurilor pentru îmbunătățirea profitabilității');
    recommendations.push('Analizați fluxul de numerar și optimizați ciclul de conversie cash');
  }
  
  if (areasOfConcern.length > 0) {
    recommendations.push('Focalizați-vă pe îmbunătățirea indicatorilor marcați ca zone de atenție');
  }
  
  recommendations.push('Continuați monitorizarea periodică a indicatorilor financiari');
  
  // Overview general
  const overview = `Analiza financiară pentru perioada ${formatDate(new Date())} relevă un scor general de sănătate financiară de ${overallHealthScore.toFixed(0)}/100. ${
    overallHealthScore >= 70
      ? 'Compania prezintă o situație financiară solidă cu indicatori majoritari în parametri optimi.'
      : overallHealthScore >= 50
      ? 'Compania are o situație financiară stabilă, cu câteva zone care necesită atenție și îmbunătățire.'
      : 'Compania întâmpină provocări financiare care necesită acțiuni corective imediate.'
  }`;
  
  return {
    overview,
    keyStrengths: keyStrengths.slice(0, 5),
    areasOfConcern: areasOfConcern.slice(0, 5),
    recommendations: recommendations.slice(0, 5),
    overallHealthScore,
  };
}

/**
 * Grupează KPI-uri pe categorii pentru afișare în PDF.
 */
async function groupKPIsByCategory(
  kpiValues: any[],
  filterCategories?: string[]
): Promise<PDFKPIDataByCategory[]> {
  const supabase = getSupabaseServerClient();
  
  // Fetch definiții KPI
  const { data: definitions } = await supabase
    .from('kpi_definitions')
    .select('*')
    .order('category', { ascending: true })
    .order('display_order', { ascending: true });
  
  if (!definitions) return [];
  
  // Grupează pe categorii
  const categoryMap = new Map<string, PDFKPIData[]>();
  
  for (const kpiValue of kpiValues) {
    const definition = definitions.find(d => d.id === kpiValue.kpi_definition_id);
    if (!definition) continue;
    
    // Filtrare categorii (dacă specificată)
    if (filterCategories && !filterCategories.includes(definition.category)) {
      continue;
    }
    
    if (kpiValue.value === null) continue;
    
    // Interpretare KPI
    const interpretation = interpretKPI(kpiValue.value, definition);
    
    const pdfKPIData: PDFKPIData = {
      definition,
      value: kpiValue,
      interpretation: interpretation.level,
      interpretationMessage: interpretation.message,
    };
    
    const existing = categoryMap.get(definition.category) || [];
    existing.push(pdfKPIData);
    categoryMap.set(definition.category, existing);
  }
  
  // Convertește la array și calculează scor categorie
  const result: PDFKPIDataByCategory[] = [];
  
  for (const [category, kpis] of categoryMap.entries()) {
    const categoryScore = calculateCategoryScore(kpis);
    const categoryInterpretation = 
      categoryScore >= 80 ? 'excellent' :
      categoryScore >= 60 ? 'good' :
      categoryScore >= 40 ? 'attention_needed' : 'poor';
    
    result.push({
      category,
      categoryLabel: formatCategoryLabel(category),
      kpis,
      categoryScore,
      categoryInterpretation,
    });
  }
  
  return result;
}

/**
 * Interpretează un KPI bazat pe valoare (simplu - fără target range deocamdată).
 */
function interpretKPI(
  value: number,
  _definition: any
): { level: 'excellent' | 'good' | 'attention_needed' | 'poor'; message: string } {
  // Interpretare simplă bazată doar pe valoare pozitivă/negativă
  // În viitor se va folosi target_range_min/max din definition
  
  if (value > 0) {
    if (value >= 1) {
      return { level: 'excellent', message: 'Valoare excelentă' };
    }
    return { level: 'good', message: 'Valoare bună' };
  }
  
  if (value === 0) {
    return { level: 'attention_needed', message: 'Valoare zero, necesită atenție' };
  }
  
  return { level: 'poor', message: 'Valoare negativă, necesită acțiune imediată' };
}

/**
 * Calculează scor categorie bazat pe interpretările KPI-urilor.
 */
function calculateCategoryScore(kpis: PDFKPIData[]): number {
  if (kpis.length === 0) return 0;
  
  const scoreMap = {
    excellent: 90,
    good: 70,
    attention_needed: 50,
    poor: 30,
  };
  
  const totalScore = kpis.reduce((sum, kpi) => sum + scoreMap[kpi.interpretation], 0);
  return totalScore / kpis.length;
}

/**
 * Formatează label categorie în română.
 */
function formatCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'liquidity': 'Lichiditate',
    'profitability': 'Profitabilitate',
    'leverage': 'Îndatorare',
    'efficiency': 'Eficiență',
    'growth': 'Creștere',
  };
  return labels[category] || category;
}

/**
 * Formatează perioadă pentru label.
 */
function formatPeriodLabel(start: Date, end: Date): string {
  const monthNames = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];
  
  const startMonth = monthNames[start.getMonth()];
  const endMonth = monthNames[end.getMonth()];
  const year = end.getFullYear();
  
  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${year}`;
  }
  
  return `${startMonth} - ${endMonth} ${year}`;
}

/**
 * Formatează dată în format românesc.
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
