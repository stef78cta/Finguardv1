/**
 * Trial Balance Processor - Orchestrator Principal
 * 
 * Leagă împreună parsing, normalizare și validare într-un workflow complet.
 * Aceasta este clasa principală care va fi folosită în API routes.
 * 
 * @module lib/processing/processor
 */

import { parseFile } from './file-parser';
import { normalizeTrialBalance, calculateTotals, type BalanceTotals } from './normalizer';
import { validateTrialBalance } from './validator';
import type {
  TrialBalanceAccount,
  ValidationError,
  ValidationWarning,
  ProcessingOptions,
  ProcessingContext,
  ValidationResult,
  FileMetadata,
} from '@/types/trial-balance';

/**
 * Rezultatul procesării complete a unei balanțe.
 */
export interface ProcessingResult {
  /** Procesarea a avut succes */
  success: boolean;
  
  /** Conturi procesate și validate */
  accounts: TrialBalanceAccount[];
  
  /** Totaluri calculate */
  totals: BalanceTotals;
  
  /** Metadata fișier */
  metadata: FileMetadata;
  
  /** Rezultat validare completă */
  validation: ValidationResult;
  
  /** Toate erorile (parsing + normalizare + validare) */
  errors: ValidationError[];
  
  /** Toate avertismentele */
  warnings: ValidationWarning[];
  
  /** Statistici procesare */
  statistics: ProcessingStatistics;
}

/**
 * Statistici despre procesare.
 */
export interface ProcessingStatistics {
  /** Durata totală procesare (ms) */
  totalDuration: number;
  
  /** Durata parsing (ms) */
  parsingDuration: number;
  
  /** Durata normalizare (ms) */
  normalizationDuration: number;
  
  /** Durata validare (ms) */
  validationDuration: number;
  
  /** Total linii din fișier */
  totalLines: number;
  
  /** Linii procesate cu succes */
  successfulLines: number;
  
  /** Linii cu erori */
  failedLines: number;
  
  /** Rata de succes (%) */
  successRate: number;
}

/**
 * Procesează o balanță de verificare completă.
 * 
 * Acest este entry point-ul principal pentru procesarea balanțelor.
 * Orchestrează toate etapele: parsing, normalizare, validare.
 * 
 * @param file - Buffer sau string cu conținutul fișierului
 * @param fileName - Nume fișier
 * @param mimeType - Tip MIME
 * @param options - Opțiuni procesare
 * @param context - Context companie/perioadă
 * @returns Promise cu rezultatul procesării
 * 
 * @example
 * ```typescript
 * // În API route
 * const buffer = await file.arrayBuffer();
 * 
 * const result = await processTrialBalance(
 *   buffer,
 *   'balanta_decembrie_2024.xlsx',
 *   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 *   {
 *     balanceTolerance: 1,
 *     strictAccountFormat: true,
 *     autoNormalizeNames: true
 *   },
 *   {
 *     companyId: companyId,
 *     periodStart: new Date('2024-12-01'),
 *     periodEnd: new Date('2024-12-31'),
 *     currency: 'RON'
 *   }
 * );
 * 
 * if (result.success) {
 *   // Salvează conturi în DB
 *   await saveAccountsToDatabase(result.accounts, importId);
 * } else {
 *   // Returnează erori către utilizator
 *   return Response.json({ errors: result.errors }, { status: 400 });
 * }
 * ```
 */
export async function processTrialBalance(
  file: ArrayBuffer | Buffer | string,
  fileName: string,
  mimeType: string,
  options: ProcessingOptions = {},
  context?: ProcessingContext
): Promise<ProcessingResult> {
  const startTime = Date.now();
  
  console.log(`[Processor] Începe procesarea fișierului: ${fileName}`);

  // ============================================================================
  // ETAPA 1: PARSING
  // ============================================================================

  const parsingStart = Date.now();
  const parseResult = await parseFile(file, fileName, mimeType);
  const parsingDuration = Date.now() - parsingStart;

  console.log(`[Processor] Parsing completat în ${parsingDuration}ms: ${parseResult.rawLines.length} linii`);

  // Dacă parsing a eșuat, returnează imediat
  if (parseResult.errors.length > 0) {
    return {
      success: false,
      accounts: [],
      totals: getEmptyTotals(),
      metadata: parseResult.metadata,
      validation: {
        isValid: false,
        errors: parseResult.errors,
        warnings: [],
        statistics: {
          totalChecks: 0,
          passedChecks: 0,
          failedChecks: 0,
          errorCount: parseResult.errors.length,
          warningCount: 0,
          duration: 0,
        },
      },
      errors: parseResult.errors,
      warnings: [],
      statistics: {
        totalDuration: Date.now() - startTime,
        parsingDuration,
        normalizationDuration: 0,
        validationDuration: 0,
        totalLines: parseResult.rawLines.length,
        successfulLines: 0,
        failedLines: parseResult.rawLines.length,
        successRate: 0,
      },
    };
  }

  // ============================================================================
  // ETAPA 2: NORMALIZARE
  // ============================================================================

  const normalizationStart = Date.now();
  const normalizeResult = normalizeTrialBalance(
    parseResult.rawLines,
    parseResult.metadata.columnMapping,
    options
  );
  const normalizationDuration = Date.now() - normalizationStart;

  console.log(
    `[Processor] Normalizare completată în ${normalizationDuration}ms: ${normalizeResult.successfulLines}/${normalizeResult.processedLines} linii cu succes`
  );

  // Agregăm erorile și avertismentele
  const allErrors = [...parseResult.errors, ...normalizeResult.errors];
  const allWarnings = [...normalizeResult.warnings];

  // Dacă normalizarea a eșuat complet, returnează
  if (normalizeResult.accounts.length === 0) {
    return {
      success: false,
      accounts: [],
      totals: getEmptyTotals(),
      metadata: parseResult.metadata,
      validation: {
        isValid: false,
        errors: allErrors,
        warnings: allWarnings,
        statistics: {
          totalChecks: 0,
          passedChecks: 0,
          failedChecks: 0,
          errorCount: allErrors.length,
          warningCount: allWarnings.length,
          duration: 0,
        },
      },
      errors: allErrors,
      warnings: allWarnings,
      statistics: {
        totalDuration: Date.now() - startTime,
        parsingDuration,
        normalizationDuration,
        validationDuration: 0,
        totalLines: parseResult.rawLines.length,
        successfulLines: 0,
        failedLines: parseResult.rawLines.length,
        successRate: 0,
      },
    };
  }

  // ============================================================================
  // ETAPA 3: VALIDARE
  // ============================================================================

  const validationStart = Date.now();
  const validationResult = validateTrialBalance(
    normalizeResult.accounts,
    options,
    context
  );
  const validationDuration = Date.now() - validationStart;

  console.log(
    `[Processor] Validare completată în ${validationDuration}ms: ${validationResult.statistics.passedChecks}/${validationResult.statistics.totalChecks} verificări trecute`
  );

  // Agregăm toate erorile și avertismentele
  const finalErrors = [...allErrors, ...validationResult.errors];
  const finalWarnings = [...allWarnings, ...validationResult.warnings];

  // ============================================================================
  // CALCULARE TOTALURI ȘI STATISTICI
  // ============================================================================

  const totals = calculateTotals(normalizeResult.accounts);
  const totalDuration = Date.now() - startTime;
  const successRate = (normalizeResult.successfulLines / normalizeResult.processedLines) * 100;

  const statistics: ProcessingStatistics = {
    totalDuration,
    parsingDuration,
    normalizationDuration,
    validationDuration,
    totalLines: parseResult.rawLines.length,
    successfulLines: normalizeResult.successfulLines,
    failedLines: normalizeResult.processedLines - normalizeResult.successfulLines,
    successRate,
  };

  // Determinăm succesul final: nu avem erori critice
  const success = finalErrors.length === 0;

  console.log(`[Processor] Procesare completă în ${totalDuration}ms: ${success ? 'SUCCES' : 'EȘUAT'}`);
  console.log(`[Processor] Statistici: ${statistics.successfulLines}/${statistics.totalLines} linii (${successRate.toFixed(1)}%)`);
  console.log(`[Processor] Validare: ${finalErrors.length} erori, ${finalWarnings.length} avertismente`);

  return {
    success,
    accounts: normalizeResult.accounts,
    totals,
    metadata: parseResult.metadata,
    validation: validationResult,
    errors: finalErrors,
    warnings: finalWarnings,
    statistics,
  };
}

/**
 * Returnează totaluri goale pentru cazuri de eroare.
 */
function getEmptyTotals(): BalanceTotals {
  return {
    totalOpeningDebit: 0,
    totalOpeningCredit: 0,
    totalDebitTurnover: 0,
    totalCreditTurnover: 0,
    totalClosingDebit: 0,
    totalClosingCredit: 0,
  };
}

/**
 * Validează rapid un fișier fără procesare completă.
 * Folosit pentru preview/verificare înainte de upload final.
 * 
 * @param file - Fișier de validat
 * @param fileName - Nume fișier
 * @param mimeType - Tip MIME
 * @returns Preview cu primele erori găsite
 */
export async function quickValidate(
  file: ArrayBuffer | Buffer | string,
  fileName: string,
  mimeType: string
): Promise<{
  isValid: boolean;
  previewAccounts: TrialBalanceAccount[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
}> {
  // Procesează doar primele 50 de linii pentru preview rapid
  const result = await processTrialBalance(
    file,
    fileName,
    mimeType,
    {
      maxLines: 50,
      balanceTolerance: 1,
      ignoreWarnings: true, // Pentru preview rapid, ignorăm avertismentele
    }
  );

  return {
    isValid: result.success,
    previewAccounts: result.accounts.slice(0, 10), // Primele 10 conturi pentru preview
    errors: result.errors,
    warnings: result.warnings,
  };
}
