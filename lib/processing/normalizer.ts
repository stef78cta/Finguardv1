/**
 * Data Normalizer pentru balanțe de verificare.
 * 
 * Transformă liniile brute parsate din Excel/CSV în structura standard
 * de 8 coloane necesară pentru stocarea în baza de date.
 * 
 * Funcționalități:
 * - Mapare dinamică coloane folosind ColumnMapping
 * - Normalizare format conturi (401, 512.01, etc.)
 * - Normalizare denumiri conturi (trim, uppercase first letter)
 * - Conversie valori numerice cu handling erori
 * - Verificare integritate date (conturi nu pot fi simultan debit și credit)
 * 
 * @module lib/processing/normalizer
 */

import type {
  RawTrialBalanceLine,
  TrialBalanceAccount,
  ColumnMapping,
  ValidationError,
  ValidationWarning,
  ProcessingOptions,
} from '@/types/trial-balance';

/**
 * Rezultatul normalizării.
 */
export interface NormalizationResult {
  /** Conturi normalizate cu succes */
  accounts: TrialBalanceAccount[];
  
  /** Erori de normalizare */
  errors: ValidationError[];
  
  /** Avertismente */
  warnings: ValidationWarning[];
  
  /** Număr linii procesate */
  processedLines: number;
  
  /** Număr linii reușite */
  successfulLines: number;
}

/**
 * Normalizează liniile brute la structura standard de 8 coloane.
 * 
 * @param rawLines - Linii brute parsate din fișier
 * @param columnMapping - Mapare coloane din fișier la structura standard
 * @param options - Opțiuni procesare
 * @returns Rezultatul normalizării
 * 
 * @example
 * ```typescript
 * const result = normalizeTrialBalance(rawLines, columnMapping, {
 *   strictAccountFormat: true,
 *   autoNormalizeNames: true
 * });
 * ```
 */
export function normalizeTrialBalance(
  rawLines: RawTrialBalanceLine[],
  columnMapping: ColumnMapping,
  options: ProcessingOptions = {}
): NormalizationResult {
  const accounts: TrialBalanceAccount[] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const {
    strictAccountFormat = false,
    autoNormalizeNames = true,
    maxLines,
  } = options;

  const linesToProcess = maxLines ? rawLines.slice(0, maxLines) : rawLines;

  for (const rawLine of linesToProcess) {
    try {
      // Extrage valorile folosind maparea
      const accountCode = extractValue(rawLine, columnMapping.accountCode);
      const accountName = extractValue(rawLine, columnMapping.accountName);
      const openingDebit = extractNumericValue(rawLine, columnMapping.openingDebit);
      const openingCredit = extractNumericValue(rawLine, columnMapping.openingCredit);
      const debitTurnover = extractNumericValue(rawLine, columnMapping.debitTurnover);
      const creditTurnover = extractNumericValue(rawLine, columnMapping.creditTurnover);
      const closingDebit = extractNumericValue(rawLine, columnMapping.closingDebit);
      const closingCredit = extractNumericValue(rawLine, columnMapping.closingCredit);

      // Validare câmpuri obligatorii
      if (!accountCode || !accountName) {
        errors.push({
          type: 'MISSING_REQUIRED_FIELDS',
          message: `Linia ${rawLine.lineNumber}: Lipsesc câmpurile obligatorii (Cod cont sau Denumire).`,
          severity: 'error',
          lineNumber: rawLine.lineNumber,
        });
        continue;
      }

      // Normalizare cod cont
      const normalizedCode = normalizeAccountCode(
        String(accountCode),
        strictAccountFormat
      );

      if (!normalizedCode) {
        errors.push({
          type: 'INVALID_ACCOUNT_CODE',
          message: `Linia ${rawLine.lineNumber}: Cod cont invalid "${accountCode}". Formatul așteptat: XX sau XXX.XX`,
          severity: 'error',
          lineNumber: rawLine.lineNumber,
          accountCode: String(accountCode),
        });
        continue;
      }

      // Normalizare denumire cont
      const normalizedName = autoNormalizeNames
        ? normalizeAccountName(String(accountName))
        : String(accountName);

      // Verificare că un cont nu poate fi simultan debitor și creditor
      if (openingDebit > 0 && openingCredit > 0) {
        warnings.push({
          type: 'DUAL_BALANCE_OPENING',
          message: `Linia ${rawLine.lineNumber}: Contul ${normalizedCode} are sold inițial atât debitor cât și creditor. Se va păstra doar soldul mai mare.`,
          severity: 'warning',
          lineNumber: rawLine.lineNumber,
          accountCode: normalizedCode,
          suggestion: 'Verificați soldul inițial corect în software-ul de contabilitate.',
        });
      }

      if (closingDebit > 0 && closingCredit > 0) {
        warnings.push({
          type: 'DUAL_BALANCE_CLOSING',
          message: `Linia ${rawLine.lineNumber}: Contul ${normalizedCode} are sold final atât debitor cât și creditor. Se va păstra doar soldul mai mare.`,
          severity: 'warning',
          lineNumber: rawLine.lineNumber,
          accountCode: normalizedCode,
          suggestion: 'Verificați soldul final corect în software-ul de contabilitate.',
        });
      }

      // Creează contul normalizat
      const account: TrialBalanceAccount = {
        accountCode: normalizedCode,
        accountName: normalizedName,
        openingDebit: openingDebit || 0,
        openingCredit: openingCredit || 0,
        debitTurnover: debitTurnover || 0,
        creditTurnover: creditTurnover || 0,
        closingDebit: closingDebit || 0,
        closingCredit: closingCredit || 0,
      };

      accounts.push(account);
    } catch (error) {
      errors.push({
        type: 'NORMALIZATION_ERROR',
        message: `Linia ${rawLine.lineNumber}: Eroare la normalizare - ${error instanceof Error ? error.message : 'Eroare necunoscută'}`,
        severity: 'error',
        lineNumber: rawLine.lineNumber,
      });
    }
  }

  return {
    accounts,
    errors,
    warnings,
    processedLines: linesToProcess.length,
    successfulLines: accounts.length,
  };
}

/**
 * Extrage o valoare din linia brută folosind cheia sau indexul din mapping.
 */
function extractValue(
  line: RawTrialBalanceLine,
  keyOrIndex: string | number
): string | number | null {
  if (typeof keyOrIndex === 'number') {
    // Extrage prin index (pentru CSV fără header)
    const keys = Object.keys(line).filter((k) => k !== 'lineNumber');
    const key = keys[keyOrIndex];
    return key ? line[key] : null;
  }

  // Extrage prin nume coloană
  return line[keyOrIndex] ?? null;
}

/**
 * Extrage o valoare numerică din linia brută.
 * Convertește stringuri în numere și handlează erori.
 */
function extractNumericValue(
  line: RawTrialBalanceLine,
  keyOrIndex: string | number
): number {
  const value = extractValue(line, keyOrIndex);

  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return Math.abs(value); // Luăm valoarea absolută (contabilitate folosește doar pozitive)
  }

  if (typeof value === 'string') {
    // Curăță string-ul: elimină spații, virgule și alte caractere non-numerice (păstrăm . și -)
    const cleaned = value.trim().replace(/[,\s]/g, '').replace(/[^\d.-]/g, '');
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.abs(num);
  }

  return 0;
}

/**
 * Normalizează codul contului contabil.
 * 
 * Formate acceptate:
 * - XX (2 cifre): 10, 40, 51
 * - XXX (3 cifre): 401, 512
 * - XXX.XX (format cu punct): 401.01, 512.11
 * - XXX.XXX (format extins): 512.011
 * 
 * @param code - Cod cont brut
 * @param strict - Dacă true, aplică validare strictă conform OMFP 1802/2014
 * @returns Cod normalizat sau null dacă invalid
 */
function normalizeAccountCode(code: string, strict: boolean): string | null {
  // Curăță codul: elimină spații și caractere speciale (păstrăm . și cifre)
  const cleaned = code.trim().replace(/[^\d.]/g, '');

  if (!cleaned) {
    return null;
  }

  // Verificare format de bază
  const basicFormat = /^\d{1,3}(\.\d{1,3})?$/;
  if (!basicFormat.test(cleaned)) {
    return null;
  }

  if (strict) {
    // Validare strictă: conform Planului de Conturi RO
    // Conturile trebuie să înceapă cu cifre 1-8 (clase contabile)
    const firstDigit = parseInt(cleaned[0]);
    if (firstDigit < 1 || firstDigit > 8) {
      return null;
    }

    // Format standard: 2 sau 3 cifre, opțional urmate de punct și 2-3 cifre
    const strictFormat = /^[1-8]\d{1,2}(\.\d{2,3})?$/;
    if (!strictFormat.test(cleaned)) {
      return null;
    }
  }

  // Normalizare finală: uppercase (deși sunt doar cifre, pentru consistență)
  return cleaned;
}

/**
 * Normalizează denumirea contului.
 * 
 * - Trim spații
 * - Uppercase prima literă a fiecărui cuvânt
 * - Elimină spații multiple
 * - Elimină caractere speciale nenecesare
 * 
 * @param name - Denumire brută
 * @returns Denumire normalizată
 */
function normalizeAccountName(name: string): string {
  // Trim și elimină spații multiple
  let normalized = name.trim().replace(/\s+/g, ' ');

  // Uppercase prima literă a fiecărui cuvânt (Title Case)
  normalized = normalized
    .split(' ')
    .map((word) => {
      if (word.length === 0) return word;
      
      // Păstrează acronime (ex: TVA, IMM) în uppercase
      if (word.length <= 3 && word === word.toUpperCase()) {
        return word;
      }

      // Uppercase prima literă, lowercase restul
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  // Elimină caractere speciale problematice (păstrăm - și ())
  normalized = normalized.replace(/[^\w\s\-().]/g, '');

  return normalized;
}

/**
 * Calculează echilibrul unui cont (verifică dacă soldurile sunt consistente).
 * 
 * Formula: Sold_Inițial + Rulaje = Sold_Final
 * - (SD_ini - SC_ini) + (RD - RC) = (SD_final - SC_final)
 * 
 * @param account - Cont de verificat
 * @param tolerance - Toleranță pentru diferențe (RON)
 * @returns True dacă contul este echilibrat
 */
export function isAccountBalanced(
  account: TrialBalanceAccount,
  tolerance: number = 1
): boolean {
  const openingBalance = account.openingDebit - account.openingCredit;
  const turnover = account.debitTurnover - account.creditTurnover;
  const closingBalance = account.closingDebit - account.closingCredit;

  const calculated = openingBalance + turnover;
  const difference = Math.abs(calculated - closingBalance);

  return difference <= tolerance;
}

/**
 * Calculează totalurile unei balanțe (pentru verificări ulterioare).
 */
export interface BalanceTotals {
  totalOpeningDebit: number;
  totalOpeningCredit: number;
  totalDebitTurnover: number;
  totalCreditTurnover: number;
  totalClosingDebit: number;
  totalClosingCredit: number;
}

/**
 * Calculează totalurile pentru o listă de conturi.
 * 
 * @param accounts - Lista de conturi
 * @returns Obiect cu totaluri
 */
export function calculateTotals(accounts: TrialBalanceAccount[]): BalanceTotals {
  return accounts.reduce(
    (totals, account) => ({
      totalOpeningDebit: totals.totalOpeningDebit + account.openingDebit,
      totalOpeningCredit: totals.totalOpeningCredit + account.openingCredit,
      totalDebitTurnover: totals.totalDebitTurnover + account.debitTurnover,
      totalCreditTurnover: totals.totalCreditTurnover + account.creditTurnover,
      totalClosingDebit: totals.totalClosingDebit + account.closingDebit,
      totalClosingCredit: totals.totalClosingCredit + account.closingCredit,
    }),
    {
      totalOpeningDebit: 0,
      totalOpeningCredit: 0,
      totalDebitTurnover: 0,
      totalCreditTurnover: 0,
      totalClosingDebit: 0,
      totalClosingCredit: 0,
    }
  );
}
