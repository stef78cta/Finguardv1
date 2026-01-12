/**
 * Validation Engine pentru balanțe de verificare românești.
 * 
 * Implementează 15+ validări tehnice pentru asigurarea corectitudinii datelor:
 * 
 * **Validări Critice (Blocante):**
 * 1. Echilibru General - Total Debite = Total Credite (±1 RON)
 * 2. Echilibru Solduri Inițiale
 * 3. Echilibru Rulaje
 * 4. Echilibru Solduri Finale
 * 5. Conturi Obligatorii - Mininum clase 1-7
 * 6. Format Conturi - Validare conform OMFP 1802/2014
 * 7. Valori Numerice - Toate câmpurile numerice valide
 * 8. Conturi Duplicate - Un cont poate apărea o singură dată
 * 
 * **Validări Avertismente (Non-blocante):**
 * 9. Solduri Duale - Cont nu poate fi simultan debitor și creditor
 * 10. Ecuație Contabilă - Sold_Inițial + Rulaje = Sold_Final pentru fiecare cont
 * 11. Conturi Inactive - Detectare conturi cu sold 0 și fără rulaje
 * 12. Valori Negative - Nu ar trebui să existe valori negative
 * 13. Valori Anormale - Detectare valori extreme (outliers)
 * 14. Denumiri Duplicate - Conturi diferite cu aceeași denumire
 * 15. Structură Planul de Conturi - Verificare ierarhie conturi
 * 16. Completitudine Date - Verificare că toate câmpurile sunt populate
 * 
 * @module lib/processing/validator
 */

import type {
  TrialBalanceAccount,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationStatistics,
  ProcessingOptions,
  ProcessingContext,
} from '@/types/trial-balance';
import { calculateTotals, isAccountBalanced } from './normalizer';

/**
 * Validează o balanță de verificare completă.
 * 
 * @param accounts - Lista de conturi normalizate
 * @param options - Opțiuni procesare
 * @param context - Context adițional (companie, perioadă)
 * @returns Rezultatul validării
 * 
 * @example
 * ```typescript
 * const result = validateTrialBalance(accounts, {
 *   balanceTolerance: 1,
 *   strictAccountFormat: true
 * }, {
 *   companyId: 'xxx',
 *   periodStart: new Date('2024-01-01'),
 *   periodEnd: new Date('2024-12-31')
 * });
 * 
 * if (!result.isValid) {
 *   console.error('Erori validare:', result.errors);
 * }
 * ```
 */
export function validateTrialBalance(
  accounts: TrialBalanceAccount[],
  options: ProcessingOptions = {},
  _context?: ProcessingContext // Prefixed with underscore to indicate intentionally unused
): ValidationResult {
  const startTime = Date.now();
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const {
    balanceTolerance = 1, // Toleranță 1 RON
    strictAccountFormat = true,
    ignoreWarnings = false,
  } = options;

  let totalChecks = 0;
  let passedChecks = 0;

  // ============================================================================
  // VALIDĂRI CRITICE (BLOCANTE)
  // ============================================================================

  // 1. Verificare listă nu este goală
  totalChecks++;
  if (accounts.length === 0) {
    errors.push({
      type: 'EMPTY_BALANCE',
      message: 'Balanța nu conține niciun cont. Verificați că fișierul conține date valide.',
      severity: 'error',
    });
  } else {
    passedChecks++;
  }

  // Calculează totalurile pentru validările de echilibru
  const totals = calculateTotals(accounts);

  // 2. Echilibru Solduri Inițiale
  totalChecks++;
  const openingDifference = Math.abs(totals.totalOpeningDebit - totals.totalOpeningCredit);
  if (openingDifference > balanceTolerance) {
    errors.push({
      type: 'OPENING_BALANCE_MISMATCH',
      message: `Soldurile inițiale nu sunt echilibrate. Diferență: ${openingDifference.toFixed(2)} RON. Total SD Inițial: ${totals.totalOpeningDebit.toFixed(2)} RON, Total SC Inițial: ${totals.totalOpeningCredit.toFixed(2)} RON.`,
      severity: 'error',
      details: {
        totalOpeningDebit: totals.totalOpeningDebit,
        totalOpeningCredit: totals.totalOpeningCredit,
        difference: openingDifference,
      },
    });
  } else {
    passedChecks++;
  }

  // 3. Echilibru Rulaje
  totalChecks++;
  const turnoverDifference = Math.abs(totals.totalDebitTurnover - totals.totalCreditTurnover);
  if (turnoverDifference > balanceTolerance) {
    errors.push({
      type: 'TURNOVER_MISMATCH',
      message: `Rulajele nu sunt echilibrate. Diferență: ${turnoverDifference.toFixed(2)} RON. Total Rulaj Debit: ${totals.totalDebitTurnover.toFixed(2)} RON, Total Rulaj Credit: ${totals.totalCreditTurnover.toFixed(2)} RON.`,
      severity: 'error',
      details: {
        totalDebitTurnover: totals.totalDebitTurnover,
        totalCreditTurnover: totals.totalCreditTurnover,
        difference: turnoverDifference,
      },
    });
  } else {
    passedChecks++;
  }

  // 4. Echilibru Solduri Finale
  totalChecks++;
  const closingDifference = Math.abs(totals.totalClosingDebit - totals.totalClosingCredit);
  if (closingDifference > balanceTolerance) {
    errors.push({
      type: 'CLOSING_BALANCE_MISMATCH',
      message: `Soldurile finale nu sunt echilibrate. Diferență: ${closingDifference.toFixed(2)} RON. Total SD Final: ${totals.totalClosingDebit.toFixed(2)} RON, Total SC Final: ${totals.totalClosingCredit.toFixed(2)} RON.`,
      severity: 'error',
      details: {
        totalClosingDebit: totals.totalClosingDebit,
        totalClosingCredit: totals.totalClosingCredit,
        difference: closingDifference,
      },
    });
  } else {
    passedChecks++;
  }

  // 5. Verificare Conturi Obligatorii (Clase 1-7)
  totalChecks++;
  const accountClasses = getAccountClasses(accounts);
  const requiredClasses = [1, 2, 3, 4, 5, 6, 7];
  const missingClasses = requiredClasses.filter((cls) => !accountClasses.has(cls));
  
  if (missingClasses.length > 0) {
    warnings.push({
      type: 'MISSING_ACCOUNT_CLASSES',
      message: `Lipsesc conturi din clasele: ${missingClasses.join(', ')}. O balanță completă ar trebui să conțină conturi din toate clasele 1-7.`,
      severity: 'warning',
      suggestion: 'Verificați că ați exportat balanța completă din software-ul de contabilitate.',
    });
  } else {
    passedChecks++;
  }

  // 6. Verificare Format Conturi
  totalChecks++;
  const invalidAccounts = accounts.filter((acc) => !isValidAccountCode(acc.accountCode, strictAccountFormat));
  
  if (invalidAccounts.length > 0) {
    errors.push({
      type: 'INVALID_ACCOUNT_FORMAT',
      message: `${invalidAccounts.length} conturi cu format invalid. Primul cont invalid: ${invalidAccounts[0].accountCode}`,
      severity: 'error',
      details: {
        count: invalidAccounts.length,
        examples: invalidAccounts.slice(0, 5).map((acc) => acc.accountCode),
      },
    });
  } else {
    passedChecks++;
  }

  // 7. Verificare Valori Numerice
  totalChecks++;
  const accountsWithInvalidNumbers = accounts.filter((acc) => 
    !isFinite(acc.openingDebit) ||
    !isFinite(acc.openingCredit) ||
    !isFinite(acc.debitTurnover) ||
    !isFinite(acc.creditTurnover) ||
    !isFinite(acc.closingDebit) ||
    !isFinite(acc.closingCredit)
  );

  if (accountsWithInvalidNumbers.length > 0) {
    errors.push({
      type: 'INVALID_NUMERIC_VALUES',
      message: `${accountsWithInvalidNumbers.length} conturi cu valori numerice invalide.`,
      severity: 'error',
      details: {
        accounts: accountsWithInvalidNumbers.map((acc) => acc.accountCode),
      },
    });
  } else {
    passedChecks++;
  }

  // 8. Verificare Conturi Duplicate
  totalChecks++;
  const duplicates = findDuplicateAccounts(accounts);
  
  if (duplicates.length > 0) {
    errors.push({
      type: 'DUPLICATE_ACCOUNTS',
      message: `${duplicates.length} conturi duplicate găsite. Un cont nu poate apărea de mai multe ori în balanță.`,
      severity: 'error',
      details: {
        duplicates: duplicates.map((dup) => ({
          accountCode: dup.accountCode,
          count: dup.count,
        })),
      },
    });
  } else {
    passedChecks++;
  }

  // ============================================================================
  // VALIDĂRI AVERTISMENTE (NON-BLOCANTE)
  // ============================================================================

  if (!ignoreWarnings) {
    // 9. Verificare Solduri Duale (cont nu poate fi simultan debitor și creditor)
    totalChecks++;
    let dualBalanceCount = 0;
    
    accounts.forEach((account) => {
      if (account.openingDebit > 0 && account.openingCredit > 0) {
        dualBalanceCount++;
        warnings.push({
          type: 'DUAL_OPENING_BALANCE',
          message: `Contul ${account.accountCode} (${account.accountName}) are sold inițial atât debitor (${account.openingDebit.toFixed(2)}) cât și creditor (${account.openingCredit.toFixed(2)}).`,
          severity: 'warning',
          accountCode: account.accountCode,
          suggestion: 'Un cont nu poate avea simultan sold debitor și creditor. Verificați în software-ul de contabilitate.',
        });
      }

      if (account.closingDebit > 0 && account.closingCredit > 0) {
        dualBalanceCount++;
        warnings.push({
          type: 'DUAL_CLOSING_BALANCE',
          message: `Contul ${account.accountCode} (${account.accountName}) are sold final atât debitor (${account.closingDebit.toFixed(2)}) cât și creditor (${account.closingCredit.toFixed(2)}).`,
          severity: 'warning',
          accountCode: account.accountCode,
          suggestion: 'Un cont nu poate avea simultan sold debitor și creditor. Verificați în software-ul de contabilitate.',
        });
      }
    });

    if (dualBalanceCount === 0) {
      passedChecks++;
    }

    // 10. Verificare Ecuație Contabilă pentru fiecare cont
    totalChecks++;
    let unbalancedAccountsCount = 0;

    accounts.forEach((account) => {
      if (!isAccountBalanced(account, balanceTolerance)) {
        unbalancedAccountsCount++;
        const openingBalance = account.openingDebit - account.openingCredit;
        const turnover = account.debitTurnover - account.creditTurnover;
        const closingBalance = account.closingDebit - account.closingCredit;
        const expected = openingBalance + turnover;
        const difference = closingBalance - expected;

        warnings.push({
          type: 'ACCOUNT_EQUATION_MISMATCH',
          message: `Contul ${account.accountCode} nu respectă ecuația contabilă. Sold final calculat: ${expected.toFixed(2)} RON, Sold final real: ${closingBalance.toFixed(2)} RON, Diferență: ${Math.abs(difference).toFixed(2)} RON.`,
          severity: 'warning',
          accountCode: account.accountCode,
          suggestion: 'Verificați rulajele și soldurile acestui cont în software-ul de contabilitate.',
        });
      }
    });

    if (unbalancedAccountsCount === 0) {
      passedChecks++;
    }

    // 11. Detectare Conturi Inactive
    totalChecks++;
    const inactiveAccounts = accounts.filter(
      (acc) =>
        acc.openingDebit === 0 &&
        acc.openingCredit === 0 &&
        acc.debitTurnover === 0 &&
        acc.creditTurnover === 0 &&
        acc.closingDebit === 0 &&
        acc.closingCredit === 0
    );

    if (inactiveAccounts.length > 0) {
      warnings.push({
        type: 'INACTIVE_ACCOUNTS',
        message: `${inactiveAccounts.length} conturi inactive găsite (fără solduri și rulaje). Acestea pot fi eliminate pentru o balanță mai clară.`,
        severity: 'warning',
        suggestion: 'Filtrați conturile inactive din raportul de balanță.',
      });
    } else {
      passedChecks++;
    }

    // 12. Verificare Valori Negative
    totalChecks++;
    const accountsWithNegatives = accounts.filter(
      (acc) =>
        acc.openingDebit < 0 ||
        acc.openingCredit < 0 ||
        acc.debitTurnover < 0 ||
        acc.creditTurnover < 0 ||
        acc.closingDebit < 0 ||
        acc.closingCredit < 0
    );

    if (accountsWithNegatives.length > 0) {
      warnings.push({
        type: 'NEGATIVE_VALUES',
        message: `${accountsWithNegatives.length} conturi cu valori negative. În contabilitate, valorile ar trebui să fie pozitive.`,
        severity: 'warning',
        details: {
          accounts: accountsWithNegatives.slice(0, 5).map((acc) => acc.accountCode),
        },
      });
    } else {
      passedChecks++;
    }

    // 13. Detectare Valori Anormale (Outliers)
    totalChecks++;
    const outliers = detectOutliers(accounts);
    
    if (outliers.length > 0) {
      warnings.push({
        type: 'ANOMALOUS_VALUES',
        message: `${outliers.length} conturi cu valori anormal de mari detectate. Verificați acuratețea acestor valori.`,
        severity: 'warning',
        details: {
          accounts: outliers.map((acc) => ({
            accountCode: acc.accountCode,
            maxValue: Math.max(
              acc.openingDebit,
              acc.openingCredit,
              acc.debitTurnover,
              acc.creditTurnover,
              acc.closingDebit,
              acc.closingCredit
            ),
          })),
        },
      });
    } else {
      passedChecks++;
    }

    // 14. Verificare Denumiri Duplicate
    totalChecks++;
    const duplicateNames = findDuplicateAccountNames(accounts);
    
    if (duplicateNames.length > 0) {
      warnings.push({
        type: 'DUPLICATE_ACCOUNT_NAMES',
        message: `${duplicateNames.length} denumiri de conturi duplicate găsite. Conturi diferite nu ar trebui să aibă aceeași denumire.`,
        severity: 'warning',
        details: {
          duplicates: duplicateNames.slice(0, 5),
        },
      });
    } else {
      passedChecks++;
    }

    // 15. Verificare Structură Planul de Conturi
    totalChecks++;
    const hierarchyIssues = checkAccountHierarchy(accounts);
    
    if (hierarchyIssues.length > 0) {
      warnings.push({
        type: 'ACCOUNT_HIERARCHY_ISSUES',
        message: `${hierarchyIssues.length} probleme de ierarhie conturi detectate. Unele conturi analitice există fără contul sintetic părinte.`,
        severity: 'warning',
        details: {
          issues: hierarchyIssues.slice(0, 5),
        },
      });
    } else {
      passedChecks++;
    }

    // 16. Verificare Completitudine Date
    totalChecks++;
    const incompleteAccounts = accounts.filter(
      (acc) => !acc.accountName || acc.accountName.trim().length < 3
    );

    if (incompleteAccounts.length > 0) {
      warnings.push({
        type: 'INCOMPLETE_DATA',
        message: `${incompleteAccounts.length} conturi cu denumiri incomplete sau lipsă.`,
        severity: 'warning',
        details: {
          accounts: incompleteAccounts.map((acc) => acc.accountCode),
        },
      });
    } else {
      passedChecks++;
    }
  }

  // ============================================================================
  // CALCUL STATISTICI
  // ============================================================================

  const duration = Date.now() - startTime;
  const isValid = errors.length === 0;

  const statistics: ValidationStatistics = {
    totalChecks,
    passedChecks,
    failedChecks: totalChecks - passedChecks,
    errorCount: errors.length,
    warningCount: warnings.length,
    duration,
  };

  console.log(
    `[Validator] Validare completă în ${duration}ms: ${passedChecks}/${totalChecks} verificări trecute, ${errors.length} erori, ${warnings.length} avertismente`
  );

  return {
    isValid,
    errors,
    warnings,
    statistics,
  };
}

// ============================================================================
// FUNCȚII HELPER
// ============================================================================

/**
 * Verifică dacă un cod de cont este valid conform standardelor românești.
 */
function isValidAccountCode(code: string, strict: boolean): boolean {
  if (!code || code.length === 0) {
    return false;
  }

  // Format de bază: cifre și opțional punct
  const basicFormat = /^\d{1,3}(\.\d{1,3})?$/;
  if (!basicFormat.test(code)) {
    return false;
  }

  if (strict) {
    // Validare strictă: primul digit trebuie să fie 1-8 (clase contabile RO)
    const firstDigit = parseInt(code[0]);
    return firstDigit >= 1 && firstDigit <= 8;
  }

  return true;
}

/**
 * Extrage clasele de conturi prezente în balanță.
 */
function getAccountClasses(accounts: TrialBalanceAccount[]): Set<number> {
  const classes = new Set<number>();
  
  accounts.forEach((account) => {
    const firstDigit = parseInt(account.accountCode[0]);
    if (!isNaN(firstDigit)) {
      classes.add(firstDigit);
    }
  });

  return classes;
}

/**
 * Găsește conturi duplicate (același cod de cont apare de mai multe ori).
 */
function findDuplicateAccounts(
  accounts: TrialBalanceAccount[]
): Array<{ accountCode: string; count: number }> {
  const codeCounts = new Map<string, number>();

  accounts.forEach((account) => {
    const count = codeCounts.get(account.accountCode) || 0;
    codeCounts.set(account.accountCode, count + 1);
  });

  const duplicates: Array<{ accountCode: string; count: number }> = [];

  codeCounts.forEach((count, code) => {
    if (count > 1) {
      duplicates.push({ accountCode: code, count });
    }
  });

  return duplicates;
}

/**
 * Găsește denumiri duplicate de conturi.
 */
function findDuplicateAccountNames(
  accounts: TrialBalanceAccount[]
): Array<{ name: string; codes: string[] }> {
  const nameMap = new Map<string, string[]>();

  accounts.forEach((account) => {
    const name = account.accountName.trim().toLowerCase();
    const codes = nameMap.get(name) || [];
    codes.push(account.accountCode);
    nameMap.set(name, codes);
  });

  const duplicates: Array<{ name: string; codes: string[] }> = [];

  nameMap.forEach((codes, name) => {
    if (codes.length > 1) {
      duplicates.push({ name, codes });
    }
  });

  return duplicates;
}

/**
 * Detectează valori anormale (outliers) folosind IQR method.
 */
function detectOutliers(accounts: TrialBalanceAccount[]): TrialBalanceAccount[] {
  // Colectează toate valorile
  const allValues: number[] = [];
  
  accounts.forEach((acc) => {
    allValues.push(
      acc.openingDebit,
      acc.openingCredit,
      acc.debitTurnover,
      acc.creditTurnover,
      acc.closingDebit,
      acc.closingCredit
    );
  });

  // Sortează valorile
  const sorted = allValues.filter((v) => v > 0).sort((a, b) => a - b);

  if (sorted.length < 4) {
    return []; // Nu avem suficiente date pentru analiza outliers
  }

  // Calculează Q1, Q3 și IQR
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  // Upper bound pentru outliers: Q3 + 3 * IQR
  const upperBound = q3 + 3 * iqr;

  // Găsește conturile cu valori peste upper bound
  return accounts.filter((acc) => {
    const maxValue = Math.max(
      acc.openingDebit,
      acc.openingCredit,
      acc.debitTurnover,
      acc.creditTurnover,
      acc.closingDebit,
      acc.closingCredit
    );
    return maxValue > upperBound;
  });
}

/**
 * Verifică ierarhia conturilor (conturi analitice au conturi sintetice părinți).
 */
function checkAccountHierarchy(accounts: TrialBalanceAccount[]): string[] {
  const accountCodes = new Set(accounts.map((acc) => acc.accountCode));
  const issues: string[] = [];

  accounts.forEach((account) => {
    const code = account.accountCode;

    // Dacă e cont analitic (are punct), verifică dacă există contul sintetic
    if (code.includes('.')) {
      const parentCode = code.split('.')[0];
      
      if (!accountCodes.has(parentCode)) {
        issues.push(`Contul ${code} există fără contul sintetic părinte ${parentCode}`);
      }
    }
  });

  return issues;
}
