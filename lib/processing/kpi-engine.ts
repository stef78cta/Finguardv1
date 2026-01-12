/**
 * KPI Calculation Engine
 * 
 * Orchestrator principal pentru calcularea tuturor KPI-urilor dintr-o balanță
 * de verificare. Integrează extragerea componentelor financiare, calculul KPI-urilor
 * și salvarea rezultatelor în database.
 * 
 * Acesta este fișierul principal pentru Task 1.7 - KPI Calculation Engine.
 */

import type { 
  KPIDefinition,
  KPICalculationOptions,
  KPIBatchCalculationResult,
  KPIValueInsert,
  KPIFormula,
} from '@/types/kpi';
import { isValidKPIFormula } from '@/types/kpi';
import type { TrialBalanceAccount } from '@/types/trial-balance';
import { getSupabaseServer } from '@/lib/supabase/server';
import { extractFinancialComponents, validateFinancialComponents } from './financial-extractor';
import { calculateKPIBatch, formatKPIResult } from './kpi-calculator';

/**
 * Calculează toate KPI-urile pentru un import de balanță.
 * 
 * Acest este entry point-ul principal pentru calculul KPI-urilor. Orchestrează:
 * 1. Încărcarea definițiilor KPI active din DB
 * 2. Încărcarea conturilor din trial balance import
 * 3. Extragerea componentelor financiare
 * 4. Calculul tuturor KPI-urilor
 * 5. Salvarea rezultatelor în tabelul kpi_values
 * 
 * @param importId - ID-ul import-ului de balanță
 * @param companyId - ID-ul companiei
 * @param options - Opțiuni pentru calcul (optional)
 * @returns Rezultatul batch cu toate KPI-urile calculate
 * 
 * @example
 * ```typescript
 * // Calcul simplu
 * const result = await calculateAllKPIs(importId, companyId);
 * console.log(`Calculate ${result.statistics.successfulCalculations} KPIs`);
 * 
 * // Cu opțiuni
 * const result = await calculateAllKPIs(importId, companyId, {
 *   categories: ['liquidity', 'profitability'],
 *   debug: true,
 *   overwriteExisting: true
 * });
 * ```
 */
export async function calculateAllKPIs(
  importId: string,
  companyId: string,
  options: KPICalculationOptions = {}
): Promise<KPIBatchCalculationResult> {
  const startTime = Date.now();
  const supabase = getSupabaseServer();
  
  // Opțiuni default
  const {
    saveToDB = true,
    overwriteExisting = false,
    categories,
    kpiCodes,
    includeMetadata = true,
    debug = false,
  } = options;
  
  // Type pentru datele importului
  interface ImportRecord {
    id: string;
    company_id: string;
    period_start: string;
    period_end: string;
    status: string;
  }

  try {
    // === STEP 1: Încărcare date import ===
    if (debug) console.log('\n📊 === KPI ENGINE START ===');
    if (debug) console.log(`Import ID: ${importId}`);
    if (debug) console.log(`Company ID: ${companyId}`);
    
    const { data: rawImportData, error: importError } = await supabase
      .from('trial_balance_imports')
      .select('id, company_id, period_start, period_end, status')
      .eq('id', importId)
      .single();
    
    if (importError || !rawImportData) {
      throw new Error(`Import nu a fost găsit: ${importError?.message}`);
    }
    
    const importData = rawImportData as unknown as ImportRecord;
    
    if (importData.status !== 'completed') {
      throw new Error(`Import-ul trebuie să fie în status 'completed', nu '${importData.status}'`);
    }
    
    if (debug) console.log(`Perioadă: ${importData.period_start} → ${importData.period_end}`);
    
    // === STEP 2: Încărcare definiții KPI ===
    if (debug) console.log('\n📋 Încărcare definiții KPI...');
    
    let kpiQuery = supabase
      .from('kpi_definitions')
      .select('*')
      .eq('is_active', true);
    
    // Filtrare după categorii dacă e specificat
    if (categories && categories.length > 0) {
      kpiQuery = kpiQuery.in('category', categories);
    }
    
    // Filtrare după coduri dacă e specificat
    if (kpiCodes && kpiCodes.length > 0) {
      kpiQuery = kpiQuery.in('code', kpiCodes);
    }
    
    const { data: kpiDefs, error: kpiError } = await kpiQuery;
    
    if (kpiError) {
      throw new Error(`Eroare încărcare KPI definitions: ${kpiError.message}`);
    }
    
    if (!kpiDefs || kpiDefs.length === 0) {
      throw new Error('Nu au fost găsite definiții KPI active');
    }
    
    if (debug) console.log(`Găsite ${kpiDefs.length} definiții KPI`);
    
    // Parse formule JSONB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedKpiDefs = kpiDefs as any[];
    const kpiDefinitions: KPIDefinition[] = typedKpiDefs.map(def => ({
      ...def,
      parsedFormula: def.formula as unknown as KPIFormula,
    }));
    
    // Validare formule
    const invalidKPIs = kpiDefinitions.filter(def => !isValidKPIFormula(def.parsedFormula));
    if (invalidKPIs.length > 0) {
      console.warn(`⚠️ Găsite ${invalidKPIs.length} KPI-uri cu formule invalide:`, 
        invalidKPIs.map(k => k.code));
    }
    
    // === STEP 3: Încărcare conturi din balanță ===
    if (debug) console.log('\n💰 Încărcare conturi balanță...');
    
    const { data: accounts, error: accountsError } = await supabase
      .from('trial_balance_accounts')
      .select('*')
      .eq('import_id', importId);
    
    if (accountsError) {
      throw new Error(`Eroare încărcare conturi: ${accountsError.message}`);
    }
    
    if (!accounts || accounts.length === 0) {
      throw new Error('Nu au fost găsite conturi în balanța importată');
    }
    
    if (debug) console.log(`Găsite ${accounts.length} conturi`);
    
    // Conversie la tipul TrialBalanceAccount
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedAccounts = accounts as any[];
    const trialBalanceAccounts: TrialBalanceAccount[] = typedAccounts.map(acc => ({
      accountCode: acc.account_code,
      accountName: acc.account_name,
      openingDebit: Number(acc.opening_debit),
      openingCredit: Number(acc.opening_credit),
      debitTurnover: Number(acc.debit_turnover),
      creditTurnover: Number(acc.credit_turnover),
      closingDebit: Number(acc.closing_debit),
      closingCredit: Number(acc.closing_credit),
    }));
    
    // === STEP 4: Extragere componente financiare ===
    if (debug) console.log('\n🔍 Extragere componente financiare...');
    
    const financialComponents = extractFinancialComponents(trialBalanceAccounts);
    
    // Validare componente
    const componentWarnings = validateFinancialComponents(financialComponents);
    if (componentWarnings.length > 0 && debug) {
      console.warn('⚠️ Avertismente componente financiare:');
      componentWarnings.forEach(w => console.warn(`  - ${w}`));
    }
    
    if (debug) {
      console.log(`\nActive totale: ${financialComponents.total_assets.toFixed(2)} RON`);
      console.log(`Venituri: ${financialComponents.revenue.toFixed(2)} RON`);
      console.log(`Profit net: ${financialComponents.net_income.toFixed(2)} RON`);
    }
    
    // === STEP 5: Calcul KPI-uri ===
    if (debug) console.log('\n📊 Calcul KPI-uri...');
    
    const calculationResults = calculateKPIBatch(
      kpiDefinitions,
      financialComponents,
      debug
    );
    
    // Statistici
    const successfulResults = calculationResults.filter(r => r.value !== null);
    const failedResults = calculationResults.filter(r => r.value === null);
    
    if (debug) {
      console.log(`\n✅ Succes: ${successfulResults.length}`);
      console.log(`❌ Eșuate: ${failedResults.length}`);
      
      if (failedResults.length > 0) {
        console.log('\nKPI-uri eșuate:');
        failedResults.forEach(r => {
          console.log(`  - ${r.kpi_code}: ${r.error}`);
        });
      }
      
      console.log('\n📈 Rezultate calculate:');
      successfulResults.forEach(r => {
        const def = kpiDefinitions.find(d => d.id === r.kpi_definition_id);
        if (def) {
          console.log(`  ${formatKPIResult(r, def)}`);
        }
      });
    }
    
    // === STEP 6: Salvare în DB ===
    if (saveToDB && successfulResults.length > 0) {
      if (debug) console.log('\n💾 Salvare rezultate în database...');
      
      // Verificare duplicate dacă nu suprascrie
      if (!overwriteExisting) {
        const { data: existingValues } = await supabase
          .from('kpi_values')
          .select('kpi_definition_id')
          .eq('trial_balance_import_id', importId)
          .eq('company_id', companyId);
        
        if (existingValues && existingValues.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const typedExistingValues = existingValues as any[];
          const existingIds = new Set(typedExistingValues.map(v => v.kpi_definition_id));
          const newResults = successfulResults.filter(
            r => !existingIds.has(r.kpi_definition_id)
          );
          
          if (debug && newResults.length < successfulResults.length) {
            console.log(`⚠️ Găsite ${existingValues.length} valori existente, salvez doar ${newResults.length} noi`);
          }
          
          if (newResults.length === 0) {
            if (debug) console.log('ℹ️ Toate KPI-urile există deja, skip salvare');
          } else {
            await saveKPIValues(newResults, importData, companyId, includeMetadata, supabase);
          }
        } else {
          await saveKPIValues(successfulResults, importData, companyId, includeMetadata, supabase);
        }
      } else {
        // Ștergere valori existente
        const { error: deleteError } = await supabase
          .from('kpi_values')
          .delete()
          .eq('trial_balance_import_id', importId)
          .eq('company_id', companyId);
        
        if (deleteError && debug) {
          console.warn('⚠️ Eroare ștergere valori vechi:', deleteError.message);
        }
        
        await saveKPIValues(successfulResults, importData, companyId, includeMetadata, supabase);
      }
      
      if (debug) console.log('✅ Salvare completă');
    }
    
    // === STEP 7: Construire rezultat final ===
    const duration = Date.now() - startTime;
    
    const result: KPIBatchCalculationResult = {
      trial_balance_import_id: importId,
      company_id: companyId,
      period_start: new Date(importData.period_start),
      period_end: new Date(importData.period_end),
      results: calculationResults,
      financialComponents,
      statistics: {
        totalKPIs: calculationResults.length,
        successfulCalculations: successfulResults.length,
        failedCalculations: failedResults.length,
        duration,
      },
    };
    
    if (debug) {
      console.log(`\n⏱️ Durata totală: ${duration}ms`);
      console.log('=== KPI ENGINE COMPLETE ===\n');
    }
    
    return result;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Eroare KPI Engine:', errorMessage);
    
    throw new Error(`KPI Engine failed: ${errorMessage}`);
  }
}

/**
 * Helper pentru salvarea valorilor KPI în database.
 */
async function saveKPIValues(
  results: any[],
  importData: any,
  companyId: string,
  includeMetadata: boolean,
  supabase: any
) {
  const kpiValuesToInsert: KPIValueInsert[] = results.map(r => ({
    kpi_definition_id: r.kpi_definition_id,
    company_id: companyId,
    period_start: importData.period_start,
    period_end: importData.period_end,
    value: r.value,
    trial_balance_import_id: importData.id,
    metadata: includeMetadata ? r.metadata : null,
  }));
  
  const { error: insertError } = await supabase
    .from('kpi_values')
    .insert(kpiValuesToInsert);
  
  if (insertError) {
    throw new Error(`Eroare salvare KPI values: ${insertError.message}`);
  }
}

/**
 * Încarcă valorile KPI calculate pentru o companie și perioadă.
 * 
 * @param companyId - ID companie
 * @param periodStart - Data început perioadă
 * @param periodEnd - Data sfârșit perioadă
 * @param categories - Filtrare după categorii (optional)
 * @returns Lista cu valori KPI și definițiile lor
 * 
 * @example
 * ```typescript
 * const kpis = await getCalculatedKPIs(
 *   companyId, 
 *   '2024-01-01', 
 *   '2024-12-31',
 *   ['liquidity', 'profitability']
 * );
 * ```
 */
export async function getCalculatedKPIs(
  companyId: string,
  periodStart: string,
  periodEnd: string,
  categories?: string[]
) {
  const supabase = getSupabaseServer();
  
  let query = supabase
    .from('kpi_values')
    .select(`
      *,
      kpi_definitions (
        id,
        code,
        name,
        category,
        unit,
        description,
        display_order
      )
    `)
    .eq('company_id', companyId)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd);
  
  // Filtrare după categorii dacă e specificat
  if (categories && categories.length > 0) {
    query = query.in('kpi_definitions.category', categories);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Eroare încărcare KPI values: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Șterge toate valorile KPI pentru un import.
 * Util pentru re-calcul sau cleanup.
 * 
 * @param importId - ID import balanță
 */
export async function deleteKPIValuesForImport(importId: string) {
  const supabase = getSupabaseServer();
  
  const { error } = await supabase
    .from('kpi_values')
    .delete()
    .eq('trial_balance_import_id', importId);
  
  if (error) {
    throw new Error(`Eroare ștergere KPI values: ${error.message}`);
  }
}

/**
 * Re-calculează toate KPI-urile pentru un import existent.
 * Șterge valorile vechi și calculează din nou.
 * 
 * @param importId - ID import balanță
 * @param companyId - ID companie
 * @param options - Opțiuni calcul
 */
export async function recalculateKPIs(
  importId: string,
  companyId: string,
  options: KPICalculationOptions = {}
) {
  // Ștergere valori existente
  await deleteKPIValuesForImport(importId);
  
  // Re-calcul
  return calculateAllKPIs(importId, companyId, {
    ...options,
    overwriteExisting: false, // Nu mai e nevoie, am șters deja
  });
}

/**
 * Obține un summary rapid al KPI-urilor pentru o perioadă.
 * Grupează după categorie și oferă statistici.
 * 
 * @param companyId - ID companie
 * @param periodStart - Data început
 * @param periodEnd - Data sfârșit
 */
export async function getKPISummary(
  companyId: string,
  periodStart: string,
  periodEnd: string
) {
  const kpis = await getCalculatedKPIs(companyId, periodStart, periodEnd);
  
  // Grupare după categorie
  const byCategory = kpis.reduce((acc: any, kpi: any) => {
    const category = kpi.kpi_definitions?.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({
      code: kpi.kpi_definitions?.code,
      name: kpi.kpi_definitions?.name,
      value: kpi.value,
      unit: kpi.kpi_definitions?.unit,
    });
    return acc;
  }, {});
  
  return {
    total: kpis.length,
    byCategory,
    period: { start: periodStart, end: periodEnd },
  };
}
