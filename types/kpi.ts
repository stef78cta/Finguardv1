/**
 * Tipuri TypeScript pentru sistem de calcul KPI (Key Performance Indicators).
 * 
 * Aceste tipuri definesc structurile pentru calcularea și gestionarea indicatorilor
 * financiari esențiali conform standardelor OMFP 1802/2014.
 */

import type { Database } from './database';

/**
 * Tipuri extract din database pentru referință rapidă
 */
export type KPICategory = Database['public']['Tables']['kpi_definitions']['Row']['category'];
export type KPIUnit = Database['public']['Tables']['kpi_definitions']['Row']['unit'];
export type KPIDefinitionRow = Database['public']['Tables']['kpi_definitions']['Row'];
export type KPIValueRow = Database['public']['Tables']['kpi_values']['Row'];
export type KPIValueInsert = Database['public']['Tables']['kpi_values']['Insert'];

/**
 * Formula KPI în format JSONB.
 * Structură flexibilă pentru definirea calculelor matematice.
 * 
 * @example
 * ```typescript
 * // Formula simplă: current_assets / current_liabilities
 * {
 *   numerator: "current_assets",
 *   denominator: "current_liabilities",
 *   formula: "current_assets / current_liabilities"
 * }
 * 
 * // Formula cu calcul intermediar:
 * {
 *   numerator: "net_income",
 *   denominator: "average_total_assets",
 *   formula: "(net_income / average_total_assets) * 100",
 *   average_total_assets: "(opening_total_assets + closing_total_assets) / 2"
 * }
 * ```
 */
export interface KPIFormula {
  /** Componenta numărător (opțional dacă formula e directă) */
  numerator?: string;
  
  /** Componenta numitor (opțional dacă formula e directă) */
  denominator?: string;
  
  /** Formula matematică completă */
  formula: string;
  
  /** Calcule intermediare (ex: nopat, revenue_per_day, etc.) */
  [key: string]: string | undefined;
}

/**
 * Definiție completă pentru un KPI.
 * Extinde tipul din database cu formula parsată.
 */
export interface KPIDefinition extends KPIDefinitionRow {
  /** Formula parsată din JSONB */
  parsedFormula: KPIFormula;
}

/**
 * Componente financiare extrase din balanța de verificare.
 * 
 * Acestea reprezintă agregări ale conturilor conform OMFP 1802/2014:
 * - Clasa 1: Capital și Rezerve (Capitaluri Proprii)
 * - Clasa 2: Active Imobilizate
 * - Clasa 3: Stocuri și Producție în Curs
 * - Clasa 4: Terți (Creanțe și Datorii)
 * - Clasa 5: Conturi de Trezorerie
 * - Clasa 6: Cheltuieli
 * - Clasa 7: Venituri
 */
export interface FinancialComponents {
  // ========== ACTIVE (Assets) ==========
  
  /** Active curente totale (Clase 3+4+5) */
  current_assets: number;
  
  /** Disponibilități bănești și echivalente (Clasa 5) */
  cash_and_equivalents: number;
  
  /** Creanțe comerciale (Subcont 411) */
  accounts_receivable: number;
  
  /** Stocuri totale (Clasa 3) */
  inventory: number;
  
  /** Active imobilizate (Clasa 2) */
  fixed_assets: number;
  
  /** Total active (suma tuturor activelor) */
  total_assets: number;
  
  // ========== PASIVE (Liabilities & Equity) ==========
  
  /** Datorii pe termen scurt / curente (din Clasa 4) */
  current_liabilities: number;
  
  /** Furnizori (Subcont 401) */
  accounts_payable: number;
  
  /** Datorii totale (toate obligațiile) */
  total_liabilities: number;
  
  /** Capitaluri proprii / Equity (Clasa 1) */
  shareholders_equity: number;
  
  // ========== VENITURI (Revenue) ==========
  
  /** Venituri totale (Clasa 7) */
  revenue: number;
  
  /** Venituri din vânzări (Subcont 707) */
  sales_revenue: number;
  
  // ========== CHELTUIELI ȘI PROFIT (Expenses & Profit) ==========
  
  /** Cost bunuri vândute / Cost of Goods Sold (Cheltuieli directe Clasa 6) */
  cogs: number;
  
  /** Cheltuieli operaționale (Clasa 6 fără COGS) */
  operating_expenses: number;
  
  /** Cheltuieli cu dobânzi (Subcont 666) */
  interest_expense: number;
  
  /** Cheltuieli cu amortizarea (Subcont 681) */
  depreciation: number;
  
  /** Profit operațional (revenue - operating_expenses - cogs) */
  operating_income: number;
  
  /** Profit net (revenue - toate cheltuielile) */
  net_income: number;
  
  /** Taxe și impozite (Subcont 691) */
  total_taxes: number;
  
  // ========== VALORI MEDII (pentru ratele care necesită) ==========
  
  /** Medie active totale [(sold inițial + sold final) / 2] */
  average_total_assets: number;
  
  /** Medie capitaluri proprii */
  average_shareholders_equity: number;
  
  /** Medie stocuri */
  average_inventory: number;
  
  /** Medie creanțe */
  average_accounts_receivable: number;
  
  /** Medie datorii furnizori */
  average_accounts_payable: number;
  
  /** Medie active fixe */
  average_fixed_assets: number;
  
  // ========== ALTELE ==========
  
  /** Număr angajați (dacă este disponibil - poate lipsi) */
  number_of_employees?: number;
}

/**
 * Metadata pentru un calcul KPI.
 * Informații detaliate despre cum a fost calculat KPI-ul.
 */
export interface KPICalculationMetadata {
  /** Componente financiare folosite în calcul */
  components: Partial<FinancialComponents>;
  
  /** Valori intermediare calculate (ex: nopat, revenue_per_day) */
  intermediateValues?: Record<string, number>;
  
  /** Formula folosită (pentru debugging/audit) */
  formulaUsed: string;
  
  /** Avertismente (ex: diviziune la zero, valori negative neașteptate) */
  warnings?: string[];
  
  /** Timestamp calcul */
  calculatedAt: Date;
}

/**
 * Rezultatul calculului unui singur KPI.
 */
export interface KPICalculationResult {
  /** ID definiție KPI */
  kpi_definition_id: string;
  
  /** Cod KPI (pentru ușurință) */
  kpi_code: string;
  
  /** Valoarea calculată (null dacă nu s-a putut calcula) */
  value: number | null;
  
  /** Metadata detalii calcul */
  metadata: KPICalculationMetadata;
  
  /** Eroare (dacă calculul a eșuat) */
  error?: string;
}

/**
 * Rezultatul calculului tuturor KPI-urilor pentru o balanță.
 */
export interface KPIBatchCalculationResult {
  /** ID import balanță */
  trial_balance_import_id: string;
  
  /** ID companie */
  company_id: string;
  
  /** Perioadă început */
  period_start: Date;
  
  /** Perioadă sfârșit */
  period_end: Date;
  
  /** Rezultate individuale pentru fiecare KPI */
  results: KPICalculationResult[];
  
  /** Componente financiare extrase */
  financialComponents: FinancialComponents;
  
  /** Statistici agregare */
  statistics: {
    /** Total KPI-uri procesate */
    totalKPIs: number;
    
    /** KPI-uri calculate cu succes */
    successfulCalculations: number;
    
    /** KPI-uri eșuate */
    failedCalculations: number;
    
    /** Durata totală calcul (ms) */
    duration: number;
  };
}

/**
 * Opțiuni pentru calculul KPI-urilor.
 */
export interface KPICalculationOptions {
  /** Salvează automat în database (default: true) */
  saveToDB?: boolean;
  
  /** Suprascrie valori existente (default: false) */
  overwriteExisting?: boolean;
  
  /** Calculează doar anumite categorii de KPI */
  categories?: KPICategory[];
  
  /** Calculează doar anumite coduri KPI */
  kpiCodes?: string[];
  
  /** Include metadata detaliată (default: true) */
  includeMetadata?: boolean;
  
  /** Mod debug - include toate detaliile intermediare */
  debug?: boolean;
}

/**
 * Context pentru calculul KPI-urilor.
 * Informații suplimentare necesare pentru anumite calcule.
 */
export interface KPICalculationContext {
  /** Import curent */
  currentImport: {
    id: string;
    period_start: Date;
    period_end: Date;
  };
  
  /** Import perioadă anterioară (pentru growth metrics) */
  previousImport?: {
    id: string;
    period_start: Date;
    period_end: Date;
  };
  
  /** Informații companie */
  company: {
    id: string;
    currency: string;
    fiscalYearStartMonth: number;
  };
  
  /** Informații HR (dacă disponibile) */
  hrData?: {
    numberOfEmployees: number;
  };
}

/**
 * Guard pentru verificare KPIFormula validă.
 */
export function isValidKPIFormula(formula: unknown): formula is KPIFormula {
  if (!formula || typeof formula !== 'object') return false;
  const f = formula as Record<string, unknown>;
  return typeof f.formula === 'string' && f.formula.length > 0;
}

/**
 * Guard pentru verificare KPICalculationResult cu succes.
 */
export function isSuccessfulKPIResult(result: KPICalculationResult): result is KPICalculationResult & { value: number } {
  return result.value !== null && result.error === undefined;
}
