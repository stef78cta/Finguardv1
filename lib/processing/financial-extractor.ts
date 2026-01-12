/**
 * Financial Components Extractor
 * 
 * Extrage și agregă componente financiare din balanța de verificare pentru
 * calculul KPI-urilor. Mapează conturile conform OMFP 1802/2014.
 * 
 * Structura Planului de Conturi Român (OMFP 1802/2014):
 * - Clasa 1: Capital și Rezerve (Capitaluri Proprii)
 * - Clasa 2: Active Imobilizate  
 * - Clasa 3: Stocuri și Producție în Curs
 * - Clasa 4: Terți (Creanțe și Datorii)
 * - Clasa 5: Conturi de Trezorerie
 * - Clasa 6: Cheltuieli
 * - Clasa 7: Venituri
 * - Clasa 8: Conturi Speciale
 */

import type { TrialBalanceAccount } from '@/types/trial-balance';
import type { FinancialComponents } from '@/types/kpi';

/**
 * Extrage componente financiare din lista de conturi din balanța de verificare.
 * 
 * Procesează fiecare cont și îl agregă în componentele financiare corespunzătoare
 * conform structurii OMFP 1802/2014.
 * 
 * @param accounts - Lista conturilor din balanța de verificare
 * @returns Componentele financiare agregate
 * 
 * @example
 * ```typescript
 * const accounts = parseResult.accounts;
 * const components = extractFinancialComponents(accounts);
 * console.log(components.current_assets); // Total active curente
 * console.log(components.revenue); // Venituri totale
 * ```
 */
export function extractFinancialComponents(accounts: TrialBalanceAccount[]): FinancialComponents {
  // Inițializare cu valori 0
  const components: FinancialComponents = {
    // Active
    current_assets: 0,
    cash_and_equivalents: 0,
    accounts_receivable: 0,
    inventory: 0,
    fixed_assets: 0,
    total_assets: 0,
    
    // Pasive și Equity
    current_liabilities: 0,
    accounts_payable: 0,
    total_liabilities: 0,
    shareholders_equity: 0,
    
    // Venituri
    revenue: 0,
    sales_revenue: 0,
    
    // Cheltuieli și Profit
    cogs: 0,
    operating_expenses: 0,
    interest_expense: 0,
    depreciation: 0,
    operating_income: 0,
    net_income: 0,
    total_taxes: 0,
    
    // Valori medii
    average_total_assets: 0,
    average_shareholders_equity: 0,
    average_inventory: 0,
    average_accounts_receivable: 0,
    average_accounts_payable: 0,
    average_fixed_assets: 0,
  };
  
  // Acumulatori pentru calcul valori medii
  const openingBalances = {
    total_assets: 0,
    shareholders_equity: 0,
    inventory: 0,
    accounts_receivable: 0,
    accounts_payable: 0,
    fixed_assets: 0,
  };
  
  const closingBalances = {
    total_assets: 0,
    shareholders_equity: 0,
    inventory: 0,
    accounts_receivable: 0,
    accounts_payable: 0,
    fixed_assets: 0,
  };
  
  // Procesare fiecare cont
  for (const account of accounts) {
    const accountClass = getAccountClass(account.accountCode);
    const accountCode = account.accountCode;
    
    // Sold final net al contului (debit - credit sau credit - debit)
    const closingBalance = account.closingDebit - account.closingCredit;
    const openingBalance = account.openingDebit - account.openingCredit;
    const absoluteClosingBalance = Math.abs(closingBalance);
    const absoluteOpeningBalance = Math.abs(openingBalance);
    
    // === CLASA 1: CAPITALURI PROPRII ===
    if (accountClass === '1') {
      components.shareholders_equity += closingBalance;
      openingBalances.shareholders_equity += openingBalance;
      closingBalances.shareholders_equity += closingBalance;
    }
    
    // === CLASA 2: ACTIVE IMOBILIZATE ===
    else if (accountClass === '2') {
      components.fixed_assets += absoluteClosingBalance;
      components.total_assets += absoluteClosingBalance;
      openingBalances.fixed_assets += absoluteOpeningBalance;
      closingBalances.fixed_assets += absoluteClosingBalance;
      openingBalances.total_assets += absoluteOpeningBalance;
      closingBalances.total_assets += absoluteClosingBalance;
    }
    
    // === CLASA 3: STOCURI ===
    else if (accountClass === '3') {
      components.inventory += absoluteClosingBalance;
      components.current_assets += absoluteClosingBalance;
      components.total_assets += absoluteClosingBalance;
      openingBalances.inventory += absoluteOpeningBalance;
      closingBalances.inventory += absoluteClosingBalance;
      openingBalances.total_assets += absoluteOpeningBalance;
      closingBalances.total_assets += absoluteClosingBalance;
    }
    
    // === CLASA 4: TERȚI (CREANȚE ȘI DATORII) ===
    else if (accountClass === '4') {
      // Conturile 401: Furnizori (DATORII - sold creditor)
      if (accountCode.startsWith('401')) {
        const liability = Math.abs(closingBalance);
        const openingLiability = Math.abs(openingBalance);
        components.accounts_payable += liability;
        components.current_liabilities += liability;
        components.total_liabilities += liability;
        openingBalances.accounts_payable += openingLiability;
        closingBalances.accounts_payable += liability;
      }
      // Conturile 411: Clienți (CREANȚE - sold debitor)
      else if (accountCode.startsWith('411')) {
        const receivable = absoluteClosingBalance;
        const openingReceivable = absoluteOpeningBalance;
        components.accounts_receivable += receivable;
        components.current_assets += receivable;
        components.total_assets += receivable;
        openingBalances.accounts_receivable += openingReceivable;
        closingBalances.accounts_receivable += receivable;
        openingBalances.total_assets += openingReceivable;
        closingBalances.total_assets += receivable;
      }
      // Alte conturi de terți: verificăm dacă sunt creanțe (debitor) sau datorii (creditor)
      else {
        if (closingBalance >= 0) {
          // Creanță (sold debitor)
          components.current_assets += absoluteClosingBalance;
          components.total_assets += absoluteClosingBalance;
          openingBalances.total_assets += absoluteOpeningBalance;
          closingBalances.total_assets += absoluteClosingBalance;
        } else {
          // Datorie (sold creditor)
          components.current_liabilities += absoluteClosingBalance;
          components.total_liabilities += absoluteClosingBalance;
        }
      }
    }
    
    // === CLASA 5: CONTURI DE TREZORERIE ===
    else if (accountClass === '5') {
      components.cash_and_equivalents += absoluteClosingBalance;
      components.current_assets += absoluteClosingBalance;
      components.total_assets += absoluteClosingBalance;
      openingBalances.total_assets += absoluteOpeningBalance;
      closingBalances.total_assets += absoluteClosingBalance;
    }
    
    // === CLASA 6: CHELTUIELI ===
    else if (accountClass === '6') {
      const expenseAmount = absoluteClosingBalance;
      
      // 600-607: Cheltuieli cu materiile prime, mărfuri → COGS
      if (accountCode.startsWith('60')) {
        components.cogs += expenseAmount;
      }
      // 666: Cheltuieli cu dobânzile
      else if (accountCode.startsWith('666')) {
        components.interest_expense += expenseAmount;
      }
      // 681: Cheltuieli cu amortizarea
      else if (accountCode.startsWith('681')) {
        components.depreciation += expenseAmount;
      }
      // Restul cheltuielilor → Operating expenses
      else {
        components.operating_expenses += expenseAmount;
      }
    }
    
    // === CLASA 7: VENITURI ===
    else if (accountClass === '7') {
      const revenueAmount = absoluteClosingBalance;
      components.revenue += revenueAmount;
      
      // 707: Venituri din vânzarea mărfurilor
      if (accountCode.startsWith('707')) {
        components.sales_revenue += revenueAmount;
      }
    }
    
    // === CLASA 8: CONTURI SPECIALE (ignorăm) ===
    // Clasa 8 conține conturi în afara bilanțului, nu le folosim în calcule
  }
  
  // Calcul profit operațional
  components.operating_income = components.revenue - components.cogs - components.operating_expenses;
  
  // Calcul profit net (venituri - toate cheltuielile)
  const totalExpenses = components.cogs + components.operating_expenses + components.interest_expense + components.depreciation;
  components.net_income = components.revenue - totalExpenses;
  
  // Extragere taxe din cheltuieli (subcont 691 dacă există)
  const taxAccount = accounts.find(acc => acc.accountCode.startsWith('691'));
  if (taxAccount) {
    components.total_taxes = Math.abs(taxAccount.closingDebit - taxAccount.closingCredit);
  }
  
  // Calcul valori medii: (sold inițial + sold final) / 2
  components.average_total_assets = (openingBalances.total_assets + closingBalances.total_assets) / 2;
  components.average_shareholders_equity = (openingBalances.shareholders_equity + closingBalances.shareholders_equity) / 2;
  components.average_inventory = (openingBalances.inventory + closingBalances.inventory) / 2;
  components.average_accounts_receivable = (openingBalances.accounts_receivable + closingBalances.accounts_receivable) / 2;
  components.average_accounts_payable = (openingBalances.accounts_payable + closingBalances.accounts_payable) / 2;
  components.average_fixed_assets = (openingBalances.fixed_assets + closingBalances.fixed_assets) / 2;
  
  return components;
}

/**
 * Extrage clasa contabilă din codul contului.
 * 
 * @param accountCode - Codul contului (ex: "401", "512.01", "1012")
 * @returns Prima cifră (clasa contului)
 * 
 * @example
 * ```typescript
 * getAccountClass("401")    // "4"
 * getAccountClass("512.01") // "5"
 * getAccountClass("1012")   // "1"
 * ```
 */
function getAccountClass(accountCode: string): string {
  return accountCode.charAt(0);
}

/**
 * Helper pentru debugging: afișează componentele financiare într-un format lizibil.
 * 
 * @param components - Componentele financiare
 * @returns String formatat pentru console
 */
export function formatFinancialComponentsSummary(components: FinancialComponents): string {
  const sections = [
    '=== COMPONENTE FINANCIARE ===\n',
    
    '📊 ACTIVE:',
    `  Total Active: ${formatCurrency(components.total_assets)}`,
    `  Active Curente: ${formatCurrency(components.current_assets)}`,
    `    - Cash: ${formatCurrency(components.cash_and_equivalents)}`,
    `    - Creanțe: ${formatCurrency(components.accounts_receivable)}`,
    `    - Stocuri: ${formatCurrency(components.inventory)}`,
    `  Active Fixe: ${formatCurrency(components.fixed_assets)}\n`,
    
    '📈 PASIVE:',
    `  Total Datorii: ${formatCurrency(components.total_liabilities)}`,
    `  Datorii Curente: ${formatCurrency(components.current_liabilities)}`,
    `    - Furnizori: ${formatCurrency(components.accounts_payable)}`,
    `  Capitaluri Proprii: ${formatCurrency(components.shareholders_equity)}\n`,
    
    '💰 PROFIT & PIERDERE:',
    `  Venituri Totale: ${formatCurrency(components.revenue)}`,
    `  COGS: ${formatCurrency(components.cogs)}`,
    `  Cheltuieli Operaționale: ${formatCurrency(components.operating_expenses)}`,
    `  Profit Operațional: ${formatCurrency(components.operating_income)}`,
    `  Profit Net: ${formatCurrency(components.net_income)}\n`,
    
    '📊 VALORI MEDII:',
    `  Active Medii: ${formatCurrency(components.average_total_assets)}`,
    `  Equity Mediu: ${formatCurrency(components.average_shareholders_equity)}`,
  ];
  
  return sections.join('\n');
}

/**
 * Formatare valoare currency pentru debugging.
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Validează componente financiare pentru detectare anomalii.
 * 
 * @param components - Componentele financiare
 * @returns Lista de avertismente găsite
 */
export function validateFinancialComponents(components: FinancialComponents): string[] {
  const warnings: string[] = [];
  
  // Verificare ecuație contabilă: Active = Pasive + Equity
  const totalPassivePlusEquity = components.total_liabilities + components.shareholders_equity;
  const balanceDiff = Math.abs(components.total_assets - totalPassivePlusEquity);
  const tolerance = 10; // RON
  
  if (balanceDiff > tolerance) {
    warnings.push(
      `Ecuație contabilă dezechilibrată: Active (${components.total_assets.toFixed(2)}) ` +
      `!= Pasive + Equity (${totalPassivePlusEquity.toFixed(2)}). ` +
      `Diferență: ${balanceDiff.toFixed(2)} RON`
    );
  }
  
  // Verificare valori negative neașteptate
  if (components.total_assets < 0) {
    warnings.push('Total active negativ - verificați soldurile conturilor de active');
  }
  
  if (components.shareholders_equity < 0) {
    warnings.push('Capitaluri proprii negative - compania poate fi în dificultate financiară');
  }
  
  if (components.revenue < 0) {
    warnings.push('Venituri negative - verificați conturile de venituri (clasa 7)');
  }
  
  // Verificare active curente > active totale (imposibil)
  if (components.current_assets > components.total_assets * 1.01) { // 1% toleranță
    warnings.push('Active curente > Total active - posibilă eroare în agregare');
  }
  
  // Verificare valori 0 suspecte
  if (components.revenue === 0) {
    warnings.push('Venituri = 0 - lipsesc conturile de venituri (clasa 7)?');
  }
  
  if (components.total_assets === 0) {
    warnings.push('Total active = 0 - balanța poate fi incompletă');
  }
  
  return warnings;
}
