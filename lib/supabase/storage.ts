/**
 * FinGuard - Supabase Storage Utilities
 *
 * Utilități pentru gestionarea fișierelor în Supabase Storage
 * Bucket: trial-balance-files
 * Format path: company_id/year/filename.ext
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import { getSupabaseServer } from '@/lib/supabase/server';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Numele bucket-ului Supabase Storage pentru fișiere trial balance
 */
export const STORAGE_BUCKET = 'trial-balance-files';

/**
 * Limite de upload
 */
export const STORAGE_LIMITS = {
  /** Dimensiunea maximă a fișierului în bytes (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  /** Dimensiunea maximă în MB pentru afișare */
  MAX_FILE_SIZE_MB: 10,
  /** MIME types acceptate */
  ALLOWED_MIME_TYPES: [
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv', // .csv
    'application/csv', // .csv (alternate)
  ],
  /** Extensii acceptate */
  ALLOWED_EXTENSIONS: ['.xls', '.xlsx', '.csv'],
} as const;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Opțiuni pentru upload fișier
 */
export interface UploadFileOptions {
  /** ID-ul companiei (pentru path) */
  companyId: string;
  /** Anul pentru organizare (opțional, default: anul curent) */
  year?: number;
  /** Fișierul de uploadat */
  file: File;
  /** Callback pentru progres (0-100) */
  onProgress?: (progress: number) => void;
  /** Suprascrie fișier existent cu același nume */
  upsert?: boolean;
}

/**
 * Rezultat upload fișier
 */
export interface UploadFileResult {
  /** Path-ul complet al fișierului în storage */
  path: string;
  /** URL public semnat (expiră după 1 oră) */
  signedUrl: string;
  /** Dimensiunea fișierului în bytes */
  size: number;
  /** Tipul MIME al fișierului */
  mimeType: string;
  /** Numele original al fișierului */
  fileName: string;
}

/**
 * Opțiuni pentru descărcare fișier
 */
export interface DownloadFileOptions {
  /** Path-ul complet al fișierului */
  path: string;
  /** Descarcă ca Blob (default: true) sau URL semnat */
  asBlob?: boolean;
  /** Durata de valabilitate pentru URL semnat în secunde (default: 3600 = 1h) */
  expiresIn?: number;
}

/**
 * Statistici storage per companie
 */
export interface StorageStats {
  /** Număr total de fișiere */
  totalFiles: number;
  /** Dimensiune totală în bytes */
  totalSizeBytes: number;
  /** Dimensiune totală în MB */
  totalSizeMb: number;
  /** Dimensiune medie per fișier în bytes */
  avgSizeBytes: number;
  /** Data celui mai vechi fișier */
  oldestFile: Date | null;
  /** Data celui mai nou fișier */
  newestFile: Date | null;
}

/**
 * Metadată fișier din storage
 */
export interface FileMetadata {
  /** Numele fișierului (cu path) */
  name: string;
  /** ID-ul fișierului */
  id: string;
  /** Data creării */
  createdAt: Date;
  /** Data ultimei actualizări */
  updatedAt: Date;
  /** Dimensiunea în bytes */
  size: number;
  /** Tipul MIME */
  mimeType: string;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validează fișierul înainte de upload
 *
 * @param file - Fișierul de validat
 * @returns Obiect cu `isValid` și `error` (dacă există)
 *
 * @example
 * ```typescript
 * const validation = validateFile(file);
 * if (!validation.isValid) {
 *   alert(validation.error);
 * }
 * ```
 */
export function validateFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Verifică dimensiunea
  if (file.size > STORAGE_LIMITS.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `Fișierul este prea mare. Maxim ${STORAGE_LIMITS.MAX_FILE_SIZE_MB}MB permis.`,
    };
  }

  // Verifică extensia
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!STORAGE_LIMITS.ALLOWED_EXTENSIONS.includes(extension as '.xls' | '.xlsx' | '.csv')) {
    return {
      isValid: false,
      error: `Format fișier neacceptat. Formate acceptate: ${STORAGE_LIMITS.ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  // Verifică MIME type
  if (!STORAGE_LIMITS.ALLOWED_MIME_TYPES.includes(file.type as typeof STORAGE_LIMITS.ALLOWED_MIME_TYPES[number])) {
    return {
      isValid: false,
      error: `Tipul fișierului nu este valid. Folosește Excel (.xls, .xlsx) sau CSV (.csv).`,
    };
  }

  return { isValid: true };
}

/**
 * Generează path valid pentru storage
 *
 * Format: company_id/year/sanitized_filename.ext
 *
 * @param companyId - UUID-ul companiei
 * @param fileName - Numele fișierului original
 * @param year - Anul (default: anul curent)
 * @returns Path complet sanitizat
 *
 * @example
 * ```typescript
 * const path = generateStoragePath(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   'balanță decembrie 2024.xlsx',
 *   2024
 * );
 * // Returns: '550e8400-e29b-41d4-a716-446655440000/2024/balanta_decembrie_2024.xlsx'
 * ```
 */
export function generateStoragePath(
  companyId: string,
  fileName: string,
  year?: number
): string {
  const targetYear = year || new Date().getFullYear();

  // Sanitizează numele fișierului:
  // - Elimină caractere speciale (păstrează doar litere, cifre, -, _)
  // - Înlocuiește spații cu underscore
  // - Lowercase pentru consistență
  // - Păstrează extensia
  const extension = fileName.substring(fileName.lastIndexOf('.'));
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));

  const sanitizedName = nameWithoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimină diacritice
    .replace(/[^a-zA-Z0-9-_\s]/g, '') // Elimină caractere speciale
    .replace(/\s+/g, '_') // Înlocuiește spații cu _
    .toLowerCase();

  // Adaugă timestamp pentru unicitate
  const timestamp = Date.now();
  const uniqueName = `${sanitizedName}_${timestamp}${extension}`;

  return `${companyId}/${targetYear}/${uniqueName}`;
}

/**
 * Extrage company_id din path
 *
 * @param path - Path-ul complet al fișierului
 * @returns Company ID sau null dacă path-ul este invalid
 *
 * @example
 * ```typescript
 * const companyId = extractCompanyIdFromPath(
 *   '550e8400-e29b-41d4-a716-446655440000/2024/file.xlsx'
 * );
 * // Returns: '550e8400-e29b-41d4-a716-446655440000'
 * ```
 */
export function extractCompanyIdFromPath(path: string): string | null {
  const segments = path.split('/');
  if (segments.length < 3) return null;

  const companyId = segments[0];

  // Validare UUID format (basic)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(companyId) ? companyId : null;
}

// ============================================================================
// STORAGE OPERATIONS (Browser Client)
// ============================================================================

/**
 * Upload fișier în Supabase Storage (Browser)
 *
 * Această funcție este pentru utilizare în componente React client-side.
 * Path-ul generat: company_id/year/filename.ext
 *
 * @param options - Opțiuni upload
 * @returns Rezultatul upload-ului cu path și signed URL
 * @throws Error dacă upload-ul eșuează sau validarea nu trece
 *
 * @example
 * ```typescript
 * try {
 *   const result = await uploadFile({
 *     companyId: '550e8400-e29b-41d4-a716-446655440000',
 *     file: selectedFile,
 *     year: 2024,
 *     onProgress: (progress) => console.log(`${progress}%`),
 *   });
 *   console.log('File uploaded:', result.path);
 * } catch (error) {
 *   console.error('Upload failed:', error);
 * }
 * ```
 */
export async function uploadFile(
  options: UploadFileOptions
): Promise<UploadFileResult> {
  const { companyId, file, year, onProgress, upsert = false } = options;

  // Validare fișier
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Generează path
  const filePath = generateStoragePath(companyId, file.name, year);

  // Get Supabase client
  const supabase = getSupabaseClient();

  // Upload fișier
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert,
    });

  if (error) {
    throw new Error(`Eroare upload fișier: ${error.message}`);
  }

  // Generează signed URL pentru preview (expiră după 1h)
  const { data: signedData, error: signedError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(data.path, 3600);

  if (signedError) {
    throw new Error(`Eroare generare URL: ${signedError.message}`);
  }

  // Simulează progres dacă există callback
  if (onProgress) {
    onProgress(100);
  }

  return {
    path: data.path,
    signedUrl: signedData.signedUrl,
    size: file.size,
    mimeType: file.type,
    fileName: file.name,
  };
}

/**
 * Descarcă fișier din Supabase Storage (Browser)
 *
 * @param options - Opțiuni descărcare
 * @returns Blob-ul fișierului sau URL semnat
 * @throws Error dacă descărcarea eșuează
 *
 * @example
 * ```typescript
 * // Descarcă ca Blob
 * const blob = await downloadFile({
 *   path: 'company-id/2024/file.xlsx',
 *   asBlob: true,
 * });
 *
 * // Sau obține signed URL
 * const url = await downloadFile({
 *   path: 'company-id/2024/file.xlsx',
 *   asBlob: false,
 *   expiresIn: 7200, // 2 ore
 * });
 * ```
 */
export async function downloadFile(
  options: DownloadFileOptions
): Promise<Blob | string> {
  const { path, asBlob = true, expiresIn = 3600 } = options;

  const supabase = getSupabaseClient();

  if (asBlob) {
    // Descarcă ca Blob
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(path);

    if (error) {
      throw new Error(`Eroare descărcare fișier: ${error.message}`);
    }

    return data;
  } else {
    // Generează signed URL
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Eroare generare URL: ${error.message}`);
    }

    return data.signedUrl;
  }
}

/**
 * Șterge fișier din storage (Browser)
 *
 * RESTRICȚII RLS:
 * - Doar owner/admin pot șterge
 * - Nu se pot șterge fișiere mai vechi de 90 zile
 *
 * @param path - Path-ul complet al fișierului
 * @throws Error dacă ștergerea eșuează sau utilizatorul nu are permisiuni
 *
 * @example
 * ```typescript
 * try {
 *   await deleteFile('company-id/2024/file.xlsx');
 *   alert('Fișier șters cu succes');
 * } catch (error) {
 *   alert('Nu aveți permisiuni pentru această acțiune');
 * }
 * ```
 */
export async function deleteFile(path: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);

  if (error) {
    throw new Error(`Eroare ștergere fișier: ${error.message}`);
  }
}

/**
 * Listează fișierele unei companii (Browser)
 *
 * @param companyId - ID-ul companiei
 * @param year - Filtrare după an (opțional)
 * @returns Array cu metadate fișiere
 * @throws Error dacă listarea eșuează
 *
 * @example
 * ```typescript
 * const files = await listCompanyFiles('company-id', 2024);
 * files.forEach(file => {
 *   console.log(`${file.name} - ${file.size} bytes`);
 * });
 * ```
 */
export async function listCompanyFiles(
  companyId: string,
  year?: number
): Promise<FileMetadata[]> {
  const supabase = getSupabaseClient();

  const prefix = year ? `${companyId}/${year}` : companyId;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(prefix, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    throw new Error(`Eroare listare fișiere: ${error.message}`);
  }

  return data.map((file) => ({
    name: `${prefix}/${file.name}`,
    id: file.id,
    createdAt: new Date(file.created_at),
    updatedAt: new Date(file.updated_at),
    size: file.metadata?.size || 0,
    mimeType: file.metadata?.mimetype || 'application/octet-stream',
  }));
}

// ============================================================================
// STORAGE OPERATIONS (Server)
// ============================================================================

/**
 * Upload fișier în Supabase Storage (Server)
 *
 * Utilizat în API routes cu service_role pentru bypass RLS când este necesar
 *
 * @param options - Opțiuni upload
 * @returns Rezultatul upload-ului
 * @throws Error dacă upload-ul eșuează
 */
export async function uploadFileServer(
  options: UploadFileOptions
): Promise<UploadFileResult> {
  const { companyId, file, year, upsert = false } = options;

  // Validare fișier
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Generează path
  const filePath = generateStoragePath(companyId, file.name, year);

  // Get server client (service_role)
  const supabase = await getSupabaseServer();

  // Upload fișier
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert,
    });

  if (error) {
    throw new Error(`Eroare upload fișier: ${error.message}`);
  }

  // Generează signed URL
  const { data: signedData, error: signedError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(data.path, 3600);

  if (signedError) {
    throw new Error(`Eroare generare URL: ${signedError.message}`);
  }

  return {
    path: data.path,
    signedUrl: signedData.signedUrl,
    size: file.size,
    mimeType: file.type,
    fileName: file.name,
  };
}

/**
 * Obține statistici storage pentru o companie (Server)
 *
 * Folosește funcția SQL helper pentru calcule eficiente
 *
 * @param companyId - ID-ul companiei
 * @returns Statistici storage
 * @throws Error dacă query-ul eșuează
 *
 * @example
 * ```typescript
 * const stats = await getCompanyStorageStats('company-id');
 * console.log(`Total: ${stats.totalFiles} fișiere, ${stats.totalSizeMb} MB`);
 * ```
 */
export async function getCompanyStorageStats(
  companyId: string
): Promise<StorageStats> {
  const supabase = await getSupabaseServer();

  // Type pentru răspuns SQL function
  type StorageStatsRow = {
    total_files: number;
    total_size_bytes: number;
    total_size_mb: number;
    avg_size_bytes: number;
    oldest_file: string | null;
    newest_file: string | null;
  };

  const { data, error } = (await supabase.rpc('get_company_storage_stats' as any, {
    p_company_id: companyId,
  } as any)) as { data: StorageStatsRow[] | null; error: any };

  if (error) {
    throw new Error(`Eroare obținere statistici: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      totalFiles: 0,
      totalSizeBytes: 0,
      totalSizeMb: 0,
      avgSizeBytes: 0,
      oldestFile: null,
      newestFile: null,
    };
  }

  const stats = data[0];
  return {
    totalFiles: Number(stats.total_files),
    totalSizeBytes: Number(stats.total_size_bytes),
    totalSizeMb: Number(stats.total_size_mb),
    avgSizeBytes: Number(stats.avg_size_bytes),
    oldestFile: stats.oldest_file ? new Date(stats.oldest_file) : null,
    newestFile: stats.newest_file ? new Date(stats.newest_file) : null,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formatează dimensiunea fișierului pentru afișare human-readable
 *
 * @param bytes - Dimensiunea în bytes
 * @returns String formatat (ex: "2.5 MB")
 *
 * @example
 * ```typescript
 * formatFileSize(1024) // "1.0 KB"
 * formatFileSize(1048576) // "1.0 MB"
 * formatFileSize(5242880) // "5.0 MB"
 * ```
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Obține URL public pentru un fișier (necesită signed URL)
 *
 * Wrapper peste downloadFile pentru ușurință în utilizare
 *
 * @param path - Path-ul fișierului
 * @param expiresIn - Durata de valabilitate în secunde
 * @returns URL semnat
 *
 * @example
 * ```typescript
 * const url = await getPublicUrl('company-id/2024/file.xlsx', 7200);
 * window.open(url, '_blank');
 * ```
 */
export async function getPublicUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  return (await downloadFile({
    path,
    asBlob: false,
    expiresIn,
  })) as string;
}
