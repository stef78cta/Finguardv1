/**
 * Processing Module - Export centralizat
 * 
 * Exportă toate funcționalitățile de procesare:
 * - Trial Balance Processing (file-parser, normalizer, validator, processor)
 * - KPI Calculation Engine (financial-extractor, kpi-calculator, kpi-engine)
 */

// ============================================================================
// TRIAL BALANCE PROCESSING (Task 1.4)
// ============================================================================

export { parseFile } from './file-parser';
export type { ParseOptions } from './file-parser';

export { normalizeTrialBalanceData } from './normalizer';
export type { NormalizationResult } from './normalizer';

export { 
  validateTrialBalance,
  quickValidate,
  type ValidatorFunction 
} from './validator';

export { 
  processTrialBalance,
  quickValidateFile
} from './processor';

// ============================================================================
// KPI CALCULATION ENGINE (Task 1.7)
// ============================================================================

export {
  extractFinancialComponents,
  formatFinancialComponentsSummary,
  validateFinancialComponents,
} from './financial-extractor';

export {
  calculateKPI,
  calculateKPIBatch,
  formatKPIResult,
  interpretKPIResult,
} from './kpi-calculator';

export {
  calculateAllKPIs,
  getCalculatedKPIs,
  deleteKPIValuesForImport,
  recalculateKPIs,
  getKPISummary,
} from './kpi-engine';

// ============================================================================
// TYPE RE-EXPORTS pentru convenience
// ============================================================================

export type {
  // Trial Balance types
  TrialBalanceAccount,
  ParseResult,
  ValidationResult,
  ProcessingOptions,
  ProcessingContext,
} from '@/types/trial-balance';

export type {
  // KPI types
  KPIDefinition,
  KPIFormula,
  FinancialComponents,
  KPICalculationResult,
  KPIBatchCalculationResult,
  KPICalculationOptions,
  KPICalculationMetadata,
  KPICalculationContext,
} from '@/types/kpi';
