/**
 * Trial Balance Processing Engine - Export Principal
 * 
 * Orchestrează parsarea, normalizarea și validarea balanțelor de verificare.
 * 
 * @module lib/processing
 */

export * from './file-parser';
export * from './normalizer';
export * from './validator';
export * from './processor';

// Re-export tipuri pentru convenience
export type {
  TrialBalanceAccount,
  RawTrialBalanceLine,
  ParseResult,
  FileMetadata,
  FormatDetectionResult,
  ColumnMapping,
  ValidationError,
  ValidationWarning,
  ValidationResult,
  ValidationStatistics,
  ProcessingOptions,
  ProcessingContext,
  BalanceFormat,
} from '@/types/trial-balance';

// Export ProcessingResult from processor
export type { ProcessingResult } from './processor';
