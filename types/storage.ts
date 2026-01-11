/**
 * FinGuard - Tipuri TypeScript pentru Supabase Storage
 *
 * Tipuri pentru operațiuni storage, metadata fișiere și bucket management
 */

// ============================================================================
// STORAGE BUCKET TYPES
// ============================================================================

/**
 * Numele bucket-ului pentru fișiere trial balance
 */
export const TRIAL_BALANCE_BUCKET = 'trial-balance-files' as const;

/**
 * Tipuri de bucket-uri disponibile în aplicație
 */
export type StorageBucket = typeof TRIAL_BALANCE_BUCKET;

// ============================================================================
// FILE METADATA TYPES
// ============================================================================

/**
 * Metadată completă pentru un fișier din storage
 *
 * Folosit pentru listarea și afișarea fișierelor în UI
 */
export interface StorageFileMetadata {
  /** ID unic al fișierului în storage */
  id: string;
  /** Numele complet al fișierului (cu path) */
  name: string;
  /** Numele fișierului fără path */
  fileName: string;
  /** Path-ul complet în storage (company_id/year/filename) */
  path: string;
  /** ID-ul companiei (extras din path) */
  companyId: string;
  /** Anul (extras din path) */
  year: number;
  /** Dimensiunea fișierului în bytes */
  size: number;
  /** Dimensiunea formatată human-readable (ex: "2.5 MB") */
  formattedSize: string;
  /** Tipul MIME al fișierului */
  mimeType: string;
  /** Extensia fișierului (ex: ".xlsx") */
  extension: string;
  /** Data creării în storage */
  createdAt: Date;
  /** Data ultimei actualizări */
  updatedAt: Date;
  /** URL semnat pentru descărcare (expiră după X ore) */
  signedUrl?: string;
  /** Durata de valabilitate URL semnat (secunde) */
  urlExpiresIn?: number;
}

/**
 * Metadată minimă returnată de Supabase Storage API
 */
export interface StorageObject {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
    lastModified: string;
    contentLength: number;
    httpStatusCode: number;
  };
}

// ============================================================================
// UPLOAD/DOWNLOAD TYPES
// ============================================================================

/**
 * Opțiuni pentru upload fișier în storage
 */
export interface StorageUploadOptions {
  /** ID-ul companiei */
  companyId: string;
  /** Fișierul de uploadat */
  file: File;
  /** Anul pentru organizare în path (opțional, default: current year) */
  year?: number;
  /** Callback pentru tracking progres (0-100) */
  onProgress?: (progress: number) => void;
  /** Suprascrie fișier existent cu același nume */
  upsert?: boolean;
  /** Cache control header (default: "3600") */
  cacheControl?: string;
  /** Metadata adițională custom */
  metadata?: Record<string, string>;
}

/**
 * Rezultat după upload complet
 */
export interface StorageUploadResult {
  /** Path-ul complet al fișierului în storage */
  path: string;
  /** Numele complet fișier */
  fullPath: string;
  /** URL public semnat temporar (expiră) */
  signedUrl: string;
  /** Durata de valabilitate URL (secunde) */
  urlExpiresIn: number;
  /** Dimensiunea fișierului în bytes */
  size: number;
  /** Tip MIME */
  mimeType: string;
  /** Numele original al fișierului */
  fileName: string;
  /** ID-ul companiei */
  companyId: string;
  /** Anul */
  year: number;
  /** Timestamp upload */
  uploadedAt: Date;
}

/**
 * Opțiuni pentru descărcare fișier
 */
export interface StorageDownloadOptions {
  /** Path-ul complet al fișierului */
  path: string;
  /** Descarcă ca Blob (true) sau obține doar URL semnat (false) */
  asBlob?: boolean;
  /** Durata de valabilitate pentru URL semnat (secunde) */
  expiresIn?: number;
  /** Transformări imagine (dacă aplicabil) */
  transform?: StorageImageTransform;
}

/**
 * Transformări pentru imagini (pentru logo-uri, avatare, etc.)
 */
export interface StorageImageTransform {
  /** Lățime nouă */
  width?: number;
  /** Înălțime nouă */
  height?: number;
  /** Mod resize: cover, contain, fill */
  resize?: 'cover' | 'contain' | 'fill';
  /** Format output: jpeg, png, webp */
  format?: 'jpeg' | 'png' | 'webp';
  /** Calitate imagine (1-100) */
  quality?: number;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Rezultat validare fișier
 */
export interface FileValidationResult {
  /** Dacă fișierul este valid */
  isValid: boolean;
  /** Mesaj de eroare (dacă invalid) */
  error?: string;
  /** Cod eroare pentru handling programatic */
  errorCode?: FileValidationErrorCode;
  /** Detalii adiționale despre eroare */
  details?: Record<string, unknown>;
}

/**
 * Coduri de eroare pentru validare fișiere
 */
export enum FileValidationErrorCode {
  /** Fișier prea mare */
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  /** Extensie neacceptată */
  INVALID_EXTENSION = 'INVALID_EXTENSION',
  /** Tip MIME invalid */
  INVALID_MIME_TYPE = 'INVALID_MIME_TYPE',
  /** Nume fișier invalid */
  INVALID_FILENAME = 'INVALID_FILENAME',
  /** Fișier corupt sau necomplet */
  FILE_CORRUPTED = 'FILE_CORRUPTED',
}

/**
 * Configurație limite storage
 */
export interface StorageLimits {
  /** Dimensiune maximă fișier în bytes */
  maxFileSize: number;
  /** Dimensiune maximă în MB (human-readable) */
  maxFileSizeMb: number;
  /** Tipuri MIME acceptate */
  allowedMimeTypes: readonly string[];
  /** Extensii acceptate */
  allowedExtensions: readonly string[];
  /** Număr maxim de fișiere per upload batch */
  maxBatchSize?: number;
  /** Dimensiune totală maximă per companie (bytes) */
  maxCompanyStorageSize?: number;
}

// ============================================================================
// STORAGE STATS TYPES
// ============================================================================

/**
 * Statistici storage per companie
 */
export interface CompanyStorageStats {
  /** ID companie */
  companyId: string;
  /** Număr total de fișiere */
  totalFiles: number;
  /** Dimensiune totală în bytes */
  totalSizeBytes: number;
  /** Dimensiune totală în MB */
  totalSizeMb: number;
  /** Dimensiune totală în GB */
  totalSizeGb: number;
  /** Dimensiune medie per fișier (bytes) */
  avgSizeBytes: number;
  /** Cel mai mare fișier (bytes) */
  largestFileSize: number;
  /** Cel mai mic fișier (bytes) */
  smallestFileSize: number;
  /** Data celui mai vechi fișier */
  oldestFile: Date | null;
  /** Data celui mai nou fișier */
  newestFile: Date | null;
  /** Procent din limita totală utilizat (dacă există limită) */
  usagePercent?: number;
  /** Breakdown per an */
  byYear?: Record<number, YearStorageStats>;
  /** Breakdown per tip fișier */
  byType?: Record<string, TypeStorageStats>;
}

/**
 * Statistici storage per an
 */
export interface YearStorageStats {
  /** Anul */
  year: number;
  /** Număr fișiere */
  fileCount: number;
  /** Dimensiune totală bytes */
  totalSize: number;
  /** Dimensiune MB */
  sizeMb: number;
}

/**
 * Statistici storage per tip fișier
 */
export interface TypeStorageStats {
  /** Tipul MIME sau extensia */
  type: string;
  /** Număr fișiere */
  fileCount: number;
  /** Dimensiune totală bytes */
  totalSize: number;
  /** Dimensiune MB */
  sizeMb: number;
  /** Procent din total */
  percent: number;
}

// ============================================================================
// STORAGE POLICY TYPES
// ============================================================================

/**
 * Roluri utilizatori cu permisiuni storage
 */
export type StorageRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Permisiuni storage per rol
 */
export interface StoragePermissions {
  /** Poate uploada fișiere */
  canUpload: boolean;
  /** Poate șterge fișiere */
  canDelete: boolean;
  /** Poate descărca fișiere */
  canDownload: boolean;
  /** Poate actualiza metadata */
  canUpdateMetadata: boolean;
  /** Poate vedea lista de fișiere */
  canListFiles: boolean;
}

/**
 * Hartă permisiuni per rol
 */
export const STORAGE_ROLE_PERMISSIONS: Record<StorageRole, StoragePermissions> = {
  owner: {
    canUpload: true,
    canDelete: true,
    canDownload: true,
    canUpdateMetadata: true,
    canListFiles: true,
  },
  admin: {
    canUpload: true,
    canDelete: true,
    canDownload: true,
    canUpdateMetadata: true,
    canListFiles: true,
  },
  member: {
    canUpload: true,
    canDelete: false,
    canDownload: true,
    canUpdateMetadata: false,
    canListFiles: true,
  },
  viewer: {
    canUpload: false,
    canDelete: false,
    canDownload: true,
    canUpdateMetadata: false,
    canListFiles: true,
  },
};

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Tipuri de erori storage
 */
export enum StorageErrorType {
  /** Eroare upload */
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  /** Eroare download */
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  /** Eroare delete */
  DELETE_ERROR = 'DELETE_ERROR',
  /** Eroare listare */
  LIST_ERROR = 'LIST_ERROR',
  /** Fișier nu există */
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  /** Permisiuni insuficiente */
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  /** Limită depășită */
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  /** Eroare validare */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** Eroare rețea */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** Eroare necunoscută */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Eroare storage structurată
 */
export class StorageError extends Error {
  constructor(
    public type: StorageErrorType,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// ============================================================================
// PATH TYPES
// ============================================================================

/**
 * Format path storage
 *
 * Pattern: company_id/year/filename.ext
 * Exemplu: "550e8400-e29b-41d4-a716-446655440000/2024/balanta_dec_2024.xlsx"
 */
export interface StoragePath {
  /** ID companie (UUID) */
  companyId: string;
  /** An (1900-2100) */
  year: number;
  /** Nume fișier sanitizat */
  fileName: string;
  /** Path complet */
  fullPath: string;
}

/**
 * Parser pentru path storage
 */
export interface StoragePathParser {
  /** Parse path în componente */
  parse: (path: string) => StoragePath | null;
  /** Generează path din componente */
  generate: (companyId: string, year: number, fileName: string) => string;
  /** Validează path */
  validate: (path: string) => boolean;
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

/**
 * Type guard pentru verificare dacă un obiect este StorageUploadResult
 */
export function isStorageUploadResult(obj: unknown): obj is StorageUploadResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'path' in obj &&
    'signedUrl' in obj &&
    'size' in obj
  );
}

/**
 * Type guard pentru verificare dacă un obiect este StorageError
 */
export function isStorageError(error: unknown): error is StorageError {
  return error instanceof StorageError;
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

/**
 * Re-export pentru backward compatibility cu lib/supabase/storage.ts
 */
export type {
  UploadFileOptions,
  UploadFileResult,
  DownloadFileOptions,
  StorageStats,
  FileMetadata,
} from '@/lib/supabase/storage';
