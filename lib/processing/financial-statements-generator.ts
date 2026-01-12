/**
 * Financial Statements Generator Engine
 * 
 * Generează situații financiare (Balance Sheet și Income Statement) din datele
 * balanței de verificare, conform standardelor contabile românești OMFP 1802/2014.
 * 
 * ## Procesul de Generare:
 * 
 * 1. **Încărcare Date**: Citește conturile din balanța de verificare
 * 2. **Clasificare**: Mapează fiecare cont la categoria corespunzătoare
 * 3. **Agregare**: Calculează totaluri pentru fiecare categorie
 * 4. **Validare**: Verifică echilibru Bilanț (Active = Pasive + Capitaluri)
 * 5. **Salvare**: Persistă situațiile în baza de date
 * 
 * @module FinancialStatementsGenerator
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { TrialBalanceAccount } from '@/types/trial-balance';
import type {
  BalanceSheet,
  IncomeStatement,
  GenerateStatementsOptions,
  GenerateStatementsResult,
  BalanceSheetLineGroup,
  IncomeStatementLineGroup,
  BalanceSheetCategory,
  IncomeStatementCategory,
  BalanceSheetLineInsert,
  IncomeStatementLineInsert,
  FinancialStatementInsert,
} from '@/types/financial-statements';

/**
 * Generează toate situațiile financiare pentru un import de balanță.
 * 
 * @param supabase - Client Supabase pentru acces la baza de date
 * @param importId - ID-ul importului balanței de verificare
 * @param userId - ID-ul utilizatorului care generează situațiile
 * @param options - Opțiuni de generare
 * @returns Rezultatul generării cu situațiile create
 * 
 * @example
 * ```typescript
 * const result = await generateFinancialStatements(
 *   supabase,
 *   importId,
 *   userId,
 *   { generateBalanceSheet: true, generateIncomeStatement: true }
 * );
 * 
 * if (result.success) {
 *   console.log(`Bilanț generat cu ID: ${result.statementIds.balanceSheetId}`);
 *   console.log(`P&L generat cu ID: ${result.statementIds.incomeStatementId}`);
 * }
 * ```
 */
export async function generateFinancialStatements(
  supabase: SupabaseClient<Database>,
  importId: string,
  userId: string,
  options: GenerateStatementsOptions = {}
): Promise<GenerateStatementsResult> {
  const startTime = Date.now();
  
  const result: GenerateStatementsResult = {
    success: false,
    statementIds: {},
    totalLinesGenerated: 0,
    errors: [],
    warnings: [],
    duration: 0,
  };
  
  // Opțiuni default
  const opts: Required<GenerateStatementsOptions> = {
    generateBalanceSheet: options.generateBalanceSheet ?? true,
    generateIncomeStatement: options.generateIncomeStatement ?? true,
    generateCashFlow: options.generateCashFlow ?? false,
    overwrite: options.overwrite ?? false,
    includeAccountDetails: options.includeAccountDetails ?? true,
    balanceTolerance: options.balanceTolerance ?? 1.0,
  };
  
  try {
    // 1. Încarcă datele importului
    const { data: importData, error: importError } = await supabase
      .from('trial_balance_imports')
      .select('*')
      .eq('id', importId)
      .single();
    
    if (importError || !importData) {
      result.errors.push(`Import cu ID ${importId} nu a fost găsit`);
      return result;
    }
    
    // 2. Încarcă conturile din balanță
    const { data: accounts, error: accountsError } = await supabase
      .from('trial_balance_accounts')
      .select('*')
      .eq('import_id', importId);
    
    if (accountsError || !accounts || accounts.length === 0) {
      result.errors.push('Nu au fost găsite conturi în balanța de verificare');
      return result;
    }
    
    // Convertim la interfața noastră
    const trialBalanceAccounts: TrialBalanceAccount[] = (accounts as any[]).map((acc: any) => ({
      accountCode: acc.account_code,
      accountName: acc.account_name,
      openingDebit: acc.opening_debit,
      openingCredit: acc.opening_credit,
      debitTurnover: acc.debit_turnover,
      creditTurnover: acc.credit_turnover,
      closingDebit: acc.closing_debit,
      closingCredit: acc.closing_credit,
    }));
    
    // 3. Generează Balance Sheet
    if (opts.generateBalanceSheet) {
      try {
        const balanceSheet = generateBalanceSheet(trialBalanceAccounts, opts);
        
        // Validare echilibru
        if (!balanceSheet.isBalanced) {
          result.warnings.push(
            `Bilanțul nu este echilibrat. Diferență: ${balanceSheet.balanceDifference.toFixed(2)} RON`
          );
        }
        
        // Salvare în DB
        const balanceSheetId = await saveBalanceSheet(
          supabase,
          balanceSheet,
          importData,
          userId,
          opts.overwrite
        );
        
        result.statementIds.balanceSheetId = balanceSheetId;
        result.totalLinesGenerated += countBalanceSheetLines(balanceSheet);
        result.balanceSheet = balanceSheet;
        
      } catch (error) {
        result.errors.push(`Eroare generare Balance Sheet: ${(error as Error).message}`);
      }
    }
    
    // 4. Generează Income Statement
    if (opts.generateIncomeStatement) {
      try {
        const incomeStatement = generateIncomeStatement(trialBalanceAccounts, opts);
        
        // Salvare în DB
        const incomeStatementId = await saveIncomeStatement(
          supabase,
          incomeStatement,
          importData,
          userId,
          opts.overwrite
        );
        
        result.statementIds.incomeStatementId = incomeStatementId;
        result.totalLinesGenerated += countIncomeStatementLines(incomeStatement);
        result.incomeStatement = incomeStatement;
        
      } catch (error) {
        result.errors.push(`Eroare generare Income Statement: ${(error as Error).message}`);
      }
    }
    
    result.success = result.errors.length === 0;
    result.duration = Date.now() - startTime;
    
  } catch (error) {
    result.errors.push(`Eroare generală: ${(error as Error).message}`);
  }
  
  return result;
}

/**
 * Generează Balance Sheet (Bilanț) din conturile balanței.
 * 
 * Structură Bilanț conform OMFP 1802/2014:
 * 
 * **ACTIVE:**
 * - A. Active Imobilizate (Clasa 2)
 * - B. Active Circulante (Clase 3, 4-creanțe, 5)
 * 
 * **PASIVE + CAPITALURI:**
 * - A. Capitaluri Proprii (Clasa 1)
 * - B. Provizioane (15x)
 * - C. Datorii (Clasa 4-datorii)
 * 
 * @param accounts - Lista conturilor din balanța de verificare
 * @param options - Opțiuni generare
 * @returns Balance Sheet structurat
 */
export function generateBalanceSheet(
  accounts: TrialBalanceAccount[],
  _options: Required<GenerateStatementsOptions>
): BalanceSheet {
  // Grupuri pentru Active
  const assetsGroups: BalanceSheetLineGroup[] = [];
  
  // Grupuri pentru Pasive + Capitaluri
  const liabilitiesAndEquityGroups: BalanceSheetLineGroup[] = [];
  
  // Procesare conturi și clasificare
  for (const account of accounts) {
    const accountClass = account.accountCode.charAt(0);
    const closingBalance = account.closingDebit - account.closingCredit;
    const amount = Math.abs(closingBalance);
    
    // Ignorăm conturile cu sold 0
    if (amount === 0) continue;
    
    // === CLASA 1: CAPITALURI PROPRII ===
    if (accountClass === '1') {
      addToGroup(
        liabilitiesAndEquityGroups,
        'capitaluri_proprii',
        determineEquitySubcategory(account.accountCode),
        account,
        amount,
        1
      );
    }
    
    // === CLASA 2: ACTIVE IMOBILIZATE ===
    else if (accountClass === '2') {
      addToGroup(
        assetsGroups,
        'active_imobilizate',
        determineFixedAssetSubcategory(account.accountCode),
        account,
        amount,
        0
      );
    }
    
    // === CLASA 3: STOCURI ===
    else if (accountClass === '3') {
      addToGroup(
        assetsGroups,
        'active_circulante',
        'stocuri',
        account,
        amount,
        1
      );
    }
    
    // === CLASA 4: TERȚI (CREANȚE ȘI DATORII) ===
    else if (accountClass === '4') {
      // Determinăm dacă e creanță (debitor) sau datorie (creditor)
      if (closingBalance >= 0) {
        // Creanță
        addToGroup(
          assetsGroups,
          'active_circulante',
          'creante',
          account,
          amount,
          1
        );
      } else {
        // Datorie
        addToGroup(
          liabilitiesAndEquityGroups,
          'datorii',
          determineLiabilitySubcategory(account.accountCode),
          account,
          amount,
          2
        );
      }
    }
    
    // === CLASA 5: TREZORERIE ===
    else if (accountClass === '5') {
      addToGroup(
        assetsGroups,
        'active_circulante',
        'casa_si_conturi_bancare',
        account,
        amount,
        1
      );
    }
  }
  
  // Calculare totaluri
  const totalAssets = calculateGroupsTotal(assetsGroups);
  const totalLiabilitiesAndEquity = calculateGroupsTotal(liabilitiesAndEquityGroups);
  const balanceDifference = totalAssets - totalLiabilitiesAndEquity;
  const isBalanced = Math.abs(balanceDifference) <= _options.balanceTolerance;
  
  return {
    statement: {} as any, // Va fi completat la salvare
    assets: assetsGroups,
    liabilitiesAndEquity: liabilitiesAndEquityGroups,
    totalAssets,
    totalLiabilitiesAndEquity,
    balanceDifference,
    isBalanced,
  };
}

/**
 * Generează Income Statement (Cont de Profit și Pierdere).
 * 
 * Structură P&L:
 * 
 * **VENITURI:**
 * - Venituri din exploatare (70x)
 * - Venituri financiare (76x)
 * - Venituri extraordinare (77x)
 * 
 * **CHELTUIELI:**
 * - Cheltuieli de exploatare (60x-65x)
 * - Cheltuieli financiare (66x)
 * - Cheltuieli extraordinare (67x)
 * - Cheltuieli cu impozitul (69x)
 * 
 * @param accounts - Lista conturilor din balanța de verificare
 * @param options - Opțiuni generare
 * @returns Income Statement structurat
 */
export function generateIncomeStatement(
  accounts: TrialBalanceAccount[],
  _options: Required<GenerateStatementsOptions>
): IncomeStatement {
  const revenuesGroups: IncomeStatementLineGroup[] = [];
  const expensesGroups: IncomeStatementLineGroup[] = [];
  
  // Procesare conturi
  for (const account of accounts) {
    const accountClass = account.accountCode.charAt(0);
    const amount = Math.abs(account.closingDebit - account.closingCredit);
    
    // Ignorăm conturile cu sold 0
    if (amount === 0) continue;
    
    // === CLASA 7: VENITURI ===
    if (accountClass === '7') {
      addToIncomeStatementGroup(
        revenuesGroups,
        'venituri',
        determineRevenueSubcategory(account.accountCode),
        account,
        amount,
        0
      );
    }
    
    // === CLASA 6: CHELTUIELI ===
    else if (accountClass === '6') {
      addToIncomeStatementGroup(
        expensesGroups,
        'cheltuieli',
        determineExpenseSubcategory(account.accountCode),
        account,
        amount,
        0
      );
    }
  }
  
  // Calculare rezultate
  const totalRevenues = calculateIncomeStatementGroupsTotal(revenuesGroups);
  const totalExpenses = calculateIncomeStatementGroupsTotal(expensesGroups);
  
  // Calcule pentru rezultate intermediare
  const operatingRevenues = getSubcategoryTotal(revenuesGroups, 'venituri_exploatare');
  const operatingExpenses = getSubcategoryTotal(expensesGroups, 'cheltuieli_exploatare');
  const operatingProfit = operatingRevenues - operatingExpenses;
  
  // const financialRevenues = getSubcategoryTotal(revenuesGroups, 'venituri_financiare');
  // const financialExpenses = getSubcategoryTotal(expensesGroups, 'cheltuieli_financiare');
  
  // const extraordinaryRevenues = getSubcategoryTotal(revenuesGroups, 'venituri_extraordinare');
  // const extraordinaryExpenses = getSubcategoryTotal(expensesGroups, 'cheltuieli_extraordinare');
  
  const taxExpenses = getSubcategoryTotal(expensesGroups, 'cheltuieli_impozit');
  
  const profitBeforeTax = totalRevenues - (totalExpenses - taxExpenses);
  const netProfit = totalRevenues - totalExpenses;
  
  // Gross Profit = Venituri exploatare - (Cheltuieli exploatare direct legate de vânzări)
  const grossProfit = operatingRevenues - operatingExpenses;
  
  return {
    statement: {} as any, // Va fi completat la salvare
    revenues: revenuesGroups,
    expenses: expensesGroups,
    totalRevenues,
    totalExpenses,
    grossProfit,
    operatingProfit,
    profitBeforeTax,
    netProfit,
  };
}

/**
 * Salvează Balance Sheet în baza de date.
 */
async function saveBalanceSheet(
  supabase: SupabaseClient<Database>,
  balanceSheet: BalanceSheet,
  importData: any,
  userId: string,
  overwrite: boolean
): Promise<string> {
  // 1. Verifică dacă există deja o situație pentru această perioadă
  if (overwrite) {
    await supabase
      .from('financial_statements')
      .delete()
      .eq('company_id', importData.company_id)
      .eq('period_start', importData.period_start)
      .eq('period_end', importData.period_end)
      .eq('statement_type', 'balance_sheet');
  }
  
  // 2. Creează înregistrarea situație financiară
  const statementInsert: FinancialStatementInsert = {
    company_id: importData.company_id,
    period_start: importData.period_start,
    period_end: importData.period_end,
    source_import_id: importData.id,
    statement_type: 'balance_sheet',
    generated_by: userId,
  };
  
  const { data: statement, error: statementError } = await supabase
    .from('financial_statements')
    .insert(statementInsert as any)
    .select()
    .single();
  
  if (statementError || !statement) {
    throw new Error(`Eroare creare situație financiară: ${statementError?.message}`);
  }
  
  const statementTyped = statement as any;
  
  // 3. Salvează liniile pentru Active
  const assetLines: BalanceSheetLineInsert[] = [];
  for (const group of balanceSheet.assets) {
    for (const line of group.lines) {
      assetLines.push({
        statement_id: statementTyped.id,
        category: group.category,
        subcategory: group.subcategory || null,
        account_code: line.account_code,
        description: line.description,
        amount: line.amount,
        display_order: line.display_order,
      });
    }
  }
  
  // 4. Salvează liniile pentru Pasive + Capitaluri
  const liabilityLines: BalanceSheetLineInsert[] = [];
  for (const group of balanceSheet.liabilitiesAndEquity) {
    for (const line of group.lines) {
      liabilityLines.push({
        statement_id: statementTyped.id,
        category: group.category,
        subcategory: group.subcategory || null,
        account_code: line.account_code,
        description: line.description,
        amount: line.amount,
        display_order: line.display_order,
      });
    }
  }
  
  // 5. Insert în batch
  const allLines = [...assetLines, ...liabilityLines];
  if (allLines.length > 0) {
    const { error: linesError } = await supabase
      .from('balance_sheet_lines')
      .insert(allLines as any);
    
    if (linesError) {
      throw new Error(`Eroare salvare linii Bilanț: ${linesError.message}`);
    }
  }
  
  return statementTyped.id;
}

/**
 * Salvează Income Statement în baza de date.
 */
async function saveIncomeStatement(
  supabase: SupabaseClient<Database>,
  incomeStatement: IncomeStatement,
  importData: any,
  userId: string,
  overwrite: boolean
): Promise<string> {
  // 1. Verifică dacă există deja
  if (overwrite) {
    await supabase
      .from('financial_statements')
      .delete()
      .eq('company_id', importData.company_id)
      .eq('period_start', importData.period_start)
      .eq('period_end', importData.period_end)
      .eq('statement_type', 'income_statement');
  }
  
  // 2. Creează înregistrarea
  const statementInsert: FinancialStatementInsert = {
    company_id: importData.company_id,
    period_start: importData.period_start,
    period_end: importData.period_end,
    source_import_id: importData.id,
    statement_type: 'income_statement',
    generated_by: userId,
  };
  
  const { data: statement, error: statementError } = await supabase
    .from('financial_statements')
    .insert(statementInsert as any)
    .select()
    .single();
  
  if (statementError || !statement) {
    throw new Error(`Eroare creare Income Statement: ${statementError?.message}`);
  }
  
  const statementTyped = statement as any;
  
  // 3. Salvează liniile
  const allLines: IncomeStatementLineInsert[] = [];
  
  for (const group of [...incomeStatement.revenues, ...incomeStatement.expenses]) {
    for (const line of group.lines) {
      allLines.push({
        statement_id: statementTyped.id,
        category: group.category,
        subcategory: group.subcategory || null,
        account_code: line.account_code,
        description: line.description,
        amount: line.amount,
        display_order: line.display_order,
      });
    }
  }
  
  if (allLines.length > 0) {
    const { error: linesError } = await supabase
      .from('income_statement_lines')
      .insert(allLines as any);
    
    if (linesError) {
      throw new Error(`Eroare salvare linii P&L: ${linesError.message}`);
    }
  }
  
  return statementTyped.id;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Adaugă un cont într-un grup de linii pentru Balance Sheet.
 */
function addToGroup(
  groups: BalanceSheetLineGroup[],
  category: BalanceSheetCategory,
  subcategory: string,
  account: TrialBalanceAccount,
  amount: number,
  displayOrder: number
): void {
  let group = groups.find(g => 
    g.category === category && g.subcategory === subcategory
  );
  
  if (!group) {
    group = {
      category,
      subcategory,
      lines: [],
      subtotal: 0,
      displayOrder,
    };
    groups.push(group);
  }
  
  group.lines.push({
    id: '', // Va fi generat de DB
    statement_id: '', // Va fi completat la salvare
    category,
    subcategory,
    account_code: account.accountCode,
    description: account.accountName,
    amount,
    display_order: displayOrder,
    created_at: new Date().toISOString(),
  });
  
  group.subtotal += amount;
}

/**
 * Adaugă un cont într-un grup pentru Income Statement.
 */
function addToIncomeStatementGroup(
  groups: IncomeStatementLineGroup[],
  category: IncomeStatementCategory,
  subcategory: string,
  account: TrialBalanceAccount,
  amount: number,
  displayOrder: number
): void {
  let group = groups.find(g => 
    g.category === category && g.subcategory === subcategory
  );
  
  if (!group) {
    group = {
      category,
      subcategory,
      lines: [],
      subtotal: 0,
      displayOrder,
    };
    groups.push(group);
  }
  
  group.lines.push({
    id: '',
    statement_id: '',
    category,
    subcategory,
    account_code: account.accountCode,
    description: account.accountName,
    amount,
    display_order: displayOrder,
    created_at: new Date().toISOString(),
  });
  
  group.subtotal += amount;
}

/**
 * Determină subcategoria pentru Capitaluri Proprii.
 */
function determineEquitySubcategory(accountCode: string): string {
  if (accountCode.startsWith('101')) return 'capital_social';
  if (accountCode.startsWith('106') || accountCode.startsWith('105')) return 'rezerve';
  if (accountCode.startsWith('117')) return 'rezultat_reportat';
  if (accountCode.startsWith('121')) return 'rezultat_exercitiului';
  return 'alte_capitaluri';
}

/**
 * Determină subcategoria pentru Active Imobilizate.
 */
function determineFixedAssetSubcategory(accountCode: string): string {
  if (accountCode.startsWith('20')) return 'imobilizari_necorporale';
  if (accountCode.startsWith('21')) return 'imobilizari_corporale';
  if (accountCode.startsWith('26') || accountCode.startsWith('27')) {
    return 'imobilizari_financiare';
  }
  return 'alte_imobilizari';
}

/**
 * Determină subcategoria pentru Datorii.
 */
function determineLiabilitySubcategory(accountCode: string): string {
  if (accountCode.startsWith('401')) return 'datorii_furnizori';
  if (accountCode.startsWith('421') || accountCode.startsWith('423')) return 'datorii_salariale';
  if (accountCode.startsWith('44')) return 'datorii_fiscale';
  if (accountCode.startsWith('16') || accountCode.startsWith('51')) return 'datorii_financiare';
  return 'alte_datorii';
}

/**
 * Determină subcategoria pentru Venituri.
 */
function determineRevenueSubcategory(accountCode: string): string {
  if (accountCode.startsWith('70')) return 'venituri_exploatare';
  if (accountCode.startsWith('76')) return 'venituri_financiare';
  if (accountCode.startsWith('77')) return 'venituri_extraordinare';
  return 'alte_venituri';
}

/**
 * Determină subcategoria pentru Cheltuieli.
 */
function determineExpenseSubcategory(accountCode: string): string {
  if (accountCode.startsWith('69')) return 'cheltuieli_impozit';
  if (accountCode.startsWith('66')) return 'cheltuieli_financiare';
  if (accountCode.startsWith('67')) return 'cheltuieli_extraordinare';
  // 60-65 = exploatare
  if (parseInt(accountCode.charAt(1)) <= 5) return 'cheltuieli_exploatare';
  return 'alte_cheltuieli';
}

/**
 * Calculează totalul pentru o listă de grupuri Balance Sheet.
 */
function calculateGroupsTotal(groups: BalanceSheetLineGroup[]): number {
  return groups.reduce((sum, group) => sum + group.subtotal, 0);
}

/**
 * Calculează totalul pentru o listă de grupuri Income Statement.
 */
function calculateIncomeStatementGroupsTotal(groups: IncomeStatementLineGroup[]): number {
  return groups.reduce((sum, group) => sum + group.subtotal, 0);
}

/**
 * Obține totalul unei subcategorii specifice.
 */
function getSubcategoryTotal(
  groups: IncomeStatementLineGroup[],
  subcategory: string
): number {
  const group = groups.find(g => g.subcategory === subcategory);
  return group ? group.subtotal : 0;
}

/**
 * Numără liniile din Balance Sheet.
 */
function countBalanceSheetLines(balanceSheet: BalanceSheet): number {
  return (
    balanceSheet.assets.reduce((sum, group) => sum + group.lines.length, 0) +
    balanceSheet.liabilitiesAndEquity.reduce((sum, group) => sum + group.lines.length, 0)
  );
}

/**
 * Numără liniile din Income Statement.
 */
function countIncomeStatementLines(incomeStatement: IncomeStatement): number {
  return (
    incomeStatement.revenues.reduce((sum, group) => sum + group.lines.length, 0) +
    incomeStatement.expenses.reduce((sum, group) => sum + group.lines.length, 0)
  );
}
