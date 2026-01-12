/**
 * Tipuri TypeScript pentru procesarea balanțelor de verificare.
 * 
 * Aceste tipuri definesc structurile pentru parsing, normalizare și validare
 * a balanțelor de verificare românești în formatul Excel/CSV.
 */

/**
 * Structura standard de 8 coloane pentru o linie din balanța de verificare.
 * Corespunde cu structura tabelului trial_balance_accounts.
 */
export interface TrialBalanceAccount {
  /** Cod cont contabil (ex: "401", "512.01") */
  accountCode: string;
  
  /** Denumire cont (ex: "Furnizori", "Disponibilități la bănci în lei") */
  accountName: string;
  
  /** Sold inițial debitor (RON) */
  openingDebit: number;
  
  /** Sold inițial creditor (RON) */
  openingCredit: number;
  
  /** Rulaj debitor pe perioadă (RON) */
  debitTurnover: number;
  
  /** Rulaj creditor pe perioadă (RON) */
  creditTurnover: number;
  
  /** Sold final debitor (RON) */
  closingDebit: number;
  
  /** Sold final creditor (RON) */
  closingCredit: number;
}

/**
 * Linie brută parsată din fișier înainte de normalizare.
 * Poate conține date în diverse formate și ordini ale coloanelor.
 */
export interface RawTrialBalanceLine {
  /** Index rând în fișier (pentru raportare erori) */
  lineNumber: number;
  
  /** Date brute din coloana - mapping dinamic */
  [key: string]: string | number | null;
}

/**
 * Rezultatul procesării unui fișier balanță.
 */
export interface ParseResult {
  /** Linii procesate cu succes */
  accounts: TrialBalanceAccount[];
  
  /** Linii brute parsate (înainte de normalizare) */
  rawLines: RawTrialBalanceLine[];
  
  /** Total linii procesate */
  totalLines: number;
  
  /** Erori întâlnite în timpul procesării */
  errors: ValidationError[];
  
  /** Avertismente (non-blocante) */
  warnings: ValidationWarning[];
  
  /** Metadata despre fișier */
  metadata: FileMetadata;
}

/**
 * Metadata despre fișierul procesat.
 */
export interface FileMetadata {
  /** Nume fișier original */
  fileName: string;
  
  /** Dimensiune în bytes */
  fileSize: number;
  
  /** Tip MIME */
  mimeType: string;
  
  /** Format detectat (excel/csv) */
  detectedFormat: 'excel' | 'csv';
  
  /** Număr de coloane detectate */
  columnCount: number;
  
  /** Mapare coloane: poziție → nume standard */
  columnMapping: ColumnMapping;
  
  /** Timestamp procesare */
  processedAt: Date;
}

/**
 * Mapare între coloanele din fișier și coloanele standard.
 * Key = nume coloană standard, Value = index/nume coloană în fișier.
 */
export interface ColumnMapping {
  accountCode: string | number;
  accountName: string | number;
  openingDebit: string | number;
  openingCredit: string | number;
  debitTurnover: string | number;
  creditTurnover: string | number;
  closingDebit: string | number;
  closingCredit: string | number;
}

/**
 * Tipuri de severitate pentru validări.
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Eroare de validare (blocantă - împiedică procesarea).
 */
export interface ValidationError {
  /** Tip eroare pentru identificare */
  type: string;
  
  /** Mesaj eroare pentru utilizator */
  message: string;
  
  /** Severitate */
  severity: 'error';
  
  /** Număr linie unde a apărut eroarea (dacă e aplicabil) */
  lineNumber?: number;
  
  /** Cod cont afectat (dacă e aplicabil) */
  accountCode?: string;
  
  /** Detalii suplimentare */
  details?: Record<string, unknown>;
}

/**
 * Avertisment de validare (non-blocant - procesarea continuă).
 */
export interface ValidationWarning {
  /** Tip avertisment */
  type: string;
  
  /** Mesaj avertisment */
  message: string;
  
  /** Severitate */
  severity: 'warning';
  
  /** Număr linie (dacă e aplicabil) */
  lineNumber?: number;
  
  /** Cod cont afectat (dacă e aplicabil) */
  accountCode?: string;
  
  /** Sugestie de remediere */
  suggestion?: string;
}

/**
 * Rezultatul validării complete a balanței.
 */
export interface ValidationResult {
  /** Validare a trecut cu succes */
  isValid: boolean;
  
  /** Erori critice (blocante) */
  errors: ValidationError[];
  
  /** Avertismente (non-blocante) */
  warnings: ValidationWarning[];
  
  /** Statistici validare */
  statistics: ValidationStatistics;
}

/**
 * Statistici despre validarea efectuată.
 */
export interface ValidationStatistics {
  /** Total verificări efectuate */
  totalChecks: number;
  
  /** Verificări trecute cu succes */
  passedChecks: number;
  
  /** Verificări eșuate */
  failedChecks: number;
  
  /** Număr erori găsite */
  errorCount: number;
  
  /** Număr avertismente */
  warningCount: number;
  
  /** Durata validării (ms) */
  duration: number;
}

/**
 * Opțiuni pentru procesarea balanței.
 */
export interface ProcessingOptions {
  /** Toleranță pentru verificări echilibru (RON) */
  balanceTolerance?: number;
  
  /** Ignoră avertismente și continuă procesarea */
  ignoreWarnings?: boolean;
  
  /** Validează strict format conturi */
  strictAccountFormat?: boolean;
  
  /** Normalizează automat denumiri conturi */
  autoNormalizeNames?: boolean;
  
  /** Limită număr linii procesate (pentru testing) */
  maxLines?: number;
}

/**
 * Context de procesare - informații suplimentare pentru validare.
 */
export interface ProcessingContext {
  /** ID companie pentru care se procesează balanța */
  companyId: string;
  
  /** Perioadă început */
  periodStart: Date;
  
  /** Perioadă sfârșit */
  periodEnd: Date;
  
  /** Monedă raportare (RON, EUR, USD) */
  currency?: string;
  
  /** An fiscal companie */
  fiscalYear?: number;
}

/**
 * Format de balanță românească detectat.
 * - standard: 8 coloane clasice
 * - extended: cu coloane suplimentare (analiză, secțiune)
 * - simplified: fără rulaje (doar solduri)
 */
export type BalanceFormat = 'standard' | 'extended' | 'simplified';

/**
 * Rezultatul detectării formatului fișierului.
 */
export interface FormatDetectionResult {
  /** Formatul detectat */
  format: BalanceFormat;
  
  /** Grad de încredere în detectare (0-1) */
  confidence: number;
  
  /** Număr rând header (prima linie cu date) */
  headerRow: number;
  
  /** Număr rând de la care încep datele */
  dataStartRow: number;
  
  /** Delimitator pentru CSV (,;|tab) */
  delimiter?: string;
}
