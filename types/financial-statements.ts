/**
 * Tipuri TypeScript pentru Situații Financiare (Financial Statements).
 * 
 * Definește structurile pentru generarea și manipularea situațiilor financiare:
 * - Balance Sheet (Bilanț)
 * - Income Statement (Cont de Profit și Pierdere)
 * - Cash Flow Statement (viitor)
 * 
 * Conform standardelor contabile românești OMFP 1802/2014.
 */

import type { Database } from './database';

/**
 * Tipuri pentru situațiile financiare din baza de date.
 */
export type FinancialStatement = Database['public']['Tables']['financial_statements']['Row'];
export type FinancialStatementInsert = Database['public']['Tables']['financial_statements']['Insert'];
export type BalanceSheetLine = Database['public']['Tables']['balance_sheet_lines']['Row'];
export type BalanceSheetLineInsert = Database['public']['Tables']['balance_sheet_lines']['Insert'];
export type IncomeStatementLine = Database['public']['Tables']['income_statement_lines']['Row'];
export type IncomeStatementLineInsert = Database['public']['Tables']['income_statement_lines']['Insert'];

/**
 * Tipul situației financiare.
 */
export type StatementType = 'balance_sheet' | 'income_statement' | 'cash_flow';

/**
 * Categorii principale pentru Bilanț (ACTIVE).
 */
export type BalanceSheetAssetCategory = 
  | 'active_imobilizate'           // Clasa 2
  | 'active_circulante'             // Clase 3, 4 (creanțe), 5
  | 'cheltuieli_in_avans';          // Subcont special

/**
 * Categorii principale pentru Bilanț (PASIVE + CAPITALURI).
 */
export type BalanceSheetLiabilityCategory =
  | 'capitaluri_proprii'            // Clasa 1
  | 'provizioane'                   // Subcont 15x
  | 'datorii'                       // Clasa 4 (datorii)
  | 'venituri_in_avans';            // Subcont special

/**
 * Toate categoriile pentru Bilanț.
 */
export type BalanceSheetCategory = 
  | BalanceSheetAssetCategory 
  | BalanceSheetLiabilityCategory;

/**
 * Subcategorii pentru Active Imobilizate.
 */
export type FixedAssetsSubcategory =
  | 'imobilizari_necorporale'       // 20x
  | 'imobilizari_corporale'         // 21x
  | 'imobilizari_financiare';       // 26x, 27x

/**
 * Subcategorii pentru Active Circulante.
 */
export type CurrentAssetsSubcategory =
  | 'stocuri'                       // Clasa 3
  | 'creante'                       // 41x (clienți și alte creanțe)
  | 'investitii_pe_termen_scurt'    // 50x
  | 'casa_si_conturi_bancare';      // 51x, 52x

/**
 * Subcategorii pentru Capitaluri Proprii.
 */
export type EquitySubcategory =
  | 'capital_social'                // 101x
  | 'rezerve'                       // 10x (excl. 101)
  | 'rezultat_reportat'             // 117x
  | 'rezultat_exercitiului';        // 121x

/**
 * Subcategorii pentru Datorii.
 */
export type LiabilitiesSubcategory =
  | 'datorii_financiare'            // 16x, 51x (credite)
  | 'datorii_furnizori'             // 401x
  | 'datorii_salariale'             // 421x, 423x
  | 'datorii_fiscale'               // 44x (excl. 44x TVA)
  | 'alte_datorii';                 // Alte conturi clasa 4

/**
 * Categorii pentru Contul de Profit și Pierdere.
 */
export type IncomeStatementCategory = 'venituri' | 'cheltuieli';

/**
 * Subcategorii pentru Venituri.
 */
export type RevenueSubcategory =
  | 'venituri_exploatare'           // 70x
  | 'venituri_financiare'           // 76x
  | 'venituri_extraordinare';       // 77x

/**
 * Subcategorii pentru Cheltuieli.
 */
export type ExpenseSubcategory =
  | 'cheltuieli_exploatare'         // 60x, 61x, 62x, 63x, 64x, 65x
  | 'cheltuieli_financiare'         // 66x
  | 'cheltuieli_extraordinare'      // 67x
  | 'cheltuieli_impozit';           // 69x

/**
 * Structura completă pentru Bilanț (Balance Sheet).
 */
export interface BalanceSheet {
  /** Metadata situație financiară */
  statement: FinancialStatement;
  
  /** Linii Active */
  assets: BalanceSheetLineGroup[];
  
  /** Linii Pasive + Capitaluri */
  liabilitiesAndEquity: BalanceSheetLineGroup[];
  
  /** Total Active */
  totalAssets: number;
  
  /** Total Pasive + Capitaluri */
  totalLiabilitiesAndEquity: number;
  
  /** Diferență (ar trebui să fie ~0) */
  balanceDifference: number;
  
  /** Este bilanțul echilibrat? */
  isBalanced: boolean;
}

/**
 * Grup de linii pentru Bilanț (o categorie principală).
 */
export interface BalanceSheetLineGroup {
  /** Categorie principală */
  category: BalanceSheetCategory;
  
  /** Subcategorie (dacă există) */
  subcategory?: string;
  
  /** Linii individuale */
  lines: BalanceSheetLine[];
  
  /** Total pentru acest grup */
  subtotal: number;
  
  /** Ordin afișare */
  displayOrder: number;
}

/**
 * Structura completă pentru Contul de Profit și Pierdere (Income Statement).
 */
export interface IncomeStatement {
  /** Metadata situație financiară */
  statement: FinancialStatement;
  
  /** Linii Venituri */
  revenues: IncomeStatementLineGroup[];
  
  /** Linii Cheltuieli */
  expenses: IncomeStatementLineGroup[];
  
  /** Total Venituri */
  totalRevenues: number;
  
  /** Total Cheltuieli */
  totalExpenses: number;
  
  /** Rezultat brut (Venituri - Cheltuieli direct legate de vânzări) */
  grossProfit: number;
  
  /** Rezultat operațional (înainte de financiare și extraordinare) */
  operatingProfit: number;
  
  /** Rezultat înainte de impozitare */
  profitBeforeTax: number;
  
  /** Rezultat net (Profit Net) */
  netProfit: number;
}

/**
 * Grup de linii pentru Cont P&L (o categorie).
 */
export interface IncomeStatementLineGroup {
  /** Categorie (venituri/cheltuieli) */
  category: IncomeStatementCategory;
  
  /** Subcategorie */
  subcategory?: string;
  
  /** Linii individuale */
  lines: IncomeStatementLine[];
  
  /** Total pentru acest grup */
  subtotal: number;
  
  /** Ordin afișare */
  displayOrder: number;
}

/**
 * Opțiuni pentru generarea situațiilor financiare.
 */
export interface GenerateStatementsOptions {
  /** Generează Balance Sheet */
  generateBalanceSheet?: boolean;
  
  /** Generează Income Statement */
  generateIncomeStatement?: boolean;
  
  /** Generează Cash Flow Statement (viitor) */
  generateCashFlow?: boolean;
  
  /** Suprascrie situațiile existente pentru aceeași perioadă */
  overwrite?: boolean;
  
  /** Include detalii la nivel de cont individual */
  includeAccountDetails?: boolean;
  
  /** Toleranță pentru echilibru Bilanț (RON) */
  balanceTolerance?: number;
}

/**
 * Rezultatul generării situațiilor financiare.
 */
export interface GenerateStatementsResult {
  /** Succes */
  success: boolean;
  
  /** Balance Sheet generat */
  balanceSheet?: BalanceSheet;
  
  /** Income Statement generat */
  incomeStatement?: IncomeStatement;
  
  /** ID-uri situații generate în DB */
  statementIds: {
    balanceSheetId?: string;
    incomeStatementId?: string;
  };
  
  /** Număr linii generate total */
  totalLinesGenerated: number;
  
  /** Erori întâlnite */
  errors: string[];
  
  /** Avertismente */
  warnings: string[];
  
  /** Durata generării (ms) */
  duration: number;
}

/**
 * Mapare conturi → categorii pentru Bilanț.
 * 
 * Conform OMFP 1802/2014:
 * - Clasa 1: Capitaluri Proprii
 * - Clasa 2: Active Imobilizate
 * - Clasa 3: Stocuri
 * - Clasa 4: Terți (Creanțe și Datorii)
 * - Clasa 5: Trezorerie
 * - Clase 6 & 7: Cheltuieli și Venituri (pentru P&L)
 */
export interface AccountCategoryMapping {
  /** Range conturi (ex: "20*" pentru toate din 20x) */
  accountPattern: string;
  
  /** Categorie Bilanț */
  balanceSheetCategory?: BalanceSheetCategory;
  
  /** Subcategorie Bilanț */
  balanceSheetSubcategory?: string;
  
  /** Categorie P&L */
  incomeStatementCategory?: IncomeStatementCategory;
  
  /** Subcategorie P&L */
  incomeStatementSubcategory?: string;
  
  /** Este cont de activ? (pentru Bilanț) */
  isAsset?: boolean;
  
  /** Este cont de pasiv/capital? (pentru Bilanț) */
  isLiability?: boolean;
  
  /** Descriere */
  description: string;
}

/**
 * Metadata pentru debuggin și audit.
 */
export interface StatementGenerationMetadata {
  /** Timestamp generare */
  generatedAt: Date;
  
  /** ID user care a generat */
  generatedBy: string;
  
  /** ID import balanță sursă */
  sourceImportId: string;
  
  /** Număr conturi procesate */
  accountsProcessed: number;
  
  /** Număr linii Bilanț generate */
  balanceSheetLinesGenerated: number;
  
  /** Număr linii P&L generate */
  incomeStatementLinesGenerated: number;
  
  /** Versiune algoritm generare */
  algorithmVersion: string;
  
  /** Opțiuni folosite */
  options: GenerateStatementsOptions;
}

/**
 * Agregare date pentru o categorie din situație financiară.
 */
export interface CategoryAggregate {
  /** Categorie */
  category: string;
  
  /** Subcategorie (opțional) */
  subcategory?: string;
  
  /** Valoare agregată */
  amount: number;
  
  /** Conturi incluse */
  accountCodes: string[];
  
  /** Număr conturi */
  accountCount: number;
}

/**
 * Guard function pentru verificare tip situație.
 */
export function isBalanceSheet(
  statement: FinancialStatement
): statement is FinancialStatement & { statement_type: 'balance_sheet' } {
  return statement.statement_type === 'balance_sheet';
}

/**
 * Guard function pentru verificare Income Statement.
 */
export function isIncomeStatement(
  statement: FinancialStatement
): statement is FinancialStatement & { statement_type: 'income_statement' } {
  return statement.statement_type === 'income_statement';
}

/**
 * Helper pentru verificare echilibru Bilanț.
 */
export function isBalanceSheetBalanced(
  totalAssets: number,
  totalLiabilitiesAndEquity: number,
  tolerance: number = 1.0
): boolean {
  return Math.abs(totalAssets - totalLiabilitiesAndEquity) <= tolerance;
}

/**
 * Formatare sumă pentru afișare în situații financiare.
 */
export function formatStatementAmount(amount: number, currency: string = 'RON'): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
