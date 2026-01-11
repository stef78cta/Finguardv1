/**
 * FinGuard - useFileUpload Hook
 *
 * Custom React hook pentru gestionarea upload-ului de fișiere în Supabase Storage
 * Include: upload progress, error handling, validation, cancellation
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import {
  uploadFile,
  validateFile,
  type UploadFileOptions,
  type UploadFileResult,
  STORAGE_LIMITS,
} from '@/lib/supabase/storage';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Status-ul unui upload
 */
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

/**
 * State-ul hook-ului useFileUpload
 */
export interface UseFileUploadState {
  /** Status curent */
  status: UploadStatus;
  /** Progres upload (0-100) */
  progress: number;
  /** Mesaj de eroare (dacă există) */
  error: string | null;
  /** Rezultatul upload-ului (dacă success) */
  result: UploadFileResult | null;
  /** Flag loading */
  isUploading: boolean;
  /** Flag success */
  isSuccess: boolean;
  /** Flag error */
  isError: boolean;
  /** Fișierul curent uploadat */
  file: File | null;
}

/**
 * Opțiuni pentru hook
 */
export interface UseFileUploadOptions {
  /** Callback executat la succes */
  onSuccess?: (result: UploadFileResult) => void;
  /** Callback executat la eroare */
  onError?: (error: Error) => void;
  /** Callback executat la schimbare progres */
  onProgress?: (progress: number) => void;
  /** Auto-reset după succes (ms) */
  autoResetAfter?: number;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook pentru gestionarea upload-ului de fișiere
 *
 * Funcționalități:
 * - Upload cu progress tracking
 * - Validare automată fișier
 * - Error handling
 * - Cancellation support (planned)
 * - Auto-reset după succes
 *
 * @param options - Opțiuni hook
 * @returns State și funcții pentru upload
 *
 * @example
 * ```typescript
 * function UploadComponent() {
 *   const {
 *     upload,
 *     reset,
 *     status,
 *     progress,
 *     error,
 *     result,
 *   } = useFileUpload({
 *     onSuccess: (result) => {
 *       console.log('Uploaded:', result.path);
 *     },
 *     onError: (error) => {
 *       toast.error(error.message);
 *     },
 *   });
 *
 *   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const file = e.target.files?.[0];
 *     if (file) {
 *       await upload({
 *         companyId: 'company-uuid',
 *         file,
 *         year: 2024,
 *       });
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input type="file" onChange={handleFileChange} disabled={status === 'uploading'} />
 *       {status === 'uploading' && <ProgressBar value={progress} />}
 *       {error && <ErrorMessage>{error}</ErrorMessage>}
 *       {result && <SuccessMessage>Upload complet!</SuccessMessage>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { onSuccess, onError, onProgress, autoResetAfter } = options;

  // State
  const [state, setState] = useState<UseFileUploadState>({
    status: 'idle',
    progress: 0,
    error: null,
    result: null,
    isUploading: false,
    isSuccess: false,
    isError: false,
    file: null,
  });

  // Ref pentru timeout auto-reset
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Reset state la valori inițiale
   */
  const reset = useCallback(() => {
    // Clear timeout dacă există
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }

    setState({
      status: 'idle',
      progress: 0,
      error: null,
      result: null,
      isUploading: false,
      isSuccess: false,
      isError: false,
      file: null,
    });
  }, []);

  /**
   * Funcție pentru upload fișier
   */
  const upload = useCallback(
    async (uploadOptions: Omit<UploadFileOptions, 'onProgress'>) => {
      // Reset state anterior
      reset();

      const { file } = uploadOptions;

      // Validare fișier
      const validation = validateFile(file);
      if (!validation.isValid) {
        const error = new Error(validation.error);
        setState({
          status: 'error',
          progress: 0,
          error: validation.error || 'Fișier invalid',
          result: null,
          isUploading: false,
          isSuccess: false,
          isError: true,
          file,
        });
        onError?.(error);
        return;
      }

      // Setează status uploading
      setState((prev) => ({
        ...prev,
        status: 'uploading',
        isUploading: true,
        file,
        error: null,
      }));

      try {
        // Upload fișier cu progress tracking
        const result = await uploadFile({
          ...uploadOptions,
          onProgress: (progress) => {
            setState((prev) => ({
              ...prev,
              progress,
            }));
            onProgress?.(progress);
          },
        });

        // Success
        setState({
          status: 'success',
          progress: 100,
          error: null,
          result,
          isUploading: false,
          isSuccess: true,
          isError: false,
          file,
        });

        onSuccess?.(result);

        // Auto-reset după delay dacă specificat
        if (autoResetAfter) {
          resetTimeoutRef.current = setTimeout(() => {
            reset();
          }, autoResetAfter);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Eroare necunoscută');
        setState({
          status: 'error',
          progress: 0,
          error: error.message,
          result: null,
          isUploading: false,
          isSuccess: false,
          isError: true,
          file,
        });

        onError?.(error);
      }
    },
    [reset, onSuccess, onError, onProgress, autoResetAfter]
  );

  return {
    // State
    ...state,

    // Actions
    /** Funcție pentru upload fișier */
    upload,
    /** Reset state */
    reset,

    // Helper getters
    /** Verifică dacă upload-ul poate fi realizat */
    canUpload: state.status === 'idle' || state.status === 'success',
    /** Limite storage */
    limits: STORAGE_LIMITS,
  };
}

// ============================================================================
// MULTIPLE FILES UPLOAD HOOK
// ============================================================================

/**
 * State pentru un fișier individual în batch upload
 */
export interface FileUploadState extends UseFileUploadState {
  /** ID unic pentru tracking */
  id: string;
}

/**
 * Hook pentru upload multiple fișiere simultan
 *
 * @param options - Opțiuni hook
 * @returns State și funcții pentru batch upload
 *
 * @example
 * ```typescript
 * function BatchUpload() {
 *   const { uploadBatch, files, isUploading, reset } = useMultiFileUpload({
 *     onAllComplete: (results) => {
 *       console.log('All uploads complete:', results);
 *     },
 *   });
 *
 *   const handleFiles = (fileList: FileList) => {
 *     uploadBatch({
 *       companyId: 'company-uuid',
 *       files: Array.from(fileList),
 *       year: 2024,
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       {files.map((fileState) => (
 *         <div key={fileState.id}>
 *           {fileState.file?.name} - {fileState.progress}%
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMultiFileUpload(
  options: UseFileUploadOptions & {
    /** Callback executat când toate upload-urile sunt complete */
    onAllComplete?: (results: UploadFileResult[]) => void;
  } = {}
) {
  const { onAllComplete } = options;

  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Upload batch de fișiere
   */
  const uploadBatch = useCallback(
    async (
      batchOptions: Omit<UploadFileOptions, 'file' | 'onProgress'> & {
        files: File[];
      }
    ) => {
      const { files: fileList, ...uploadOptions } = batchOptions;

      // Inițializează state pentru fiecare fișier
      const initialStates: FileUploadState[] = fileList.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        status: 'idle',
        progress: 0,
        error: null,
        result: null,
        isUploading: false,
        isSuccess: false,
        isError: false,
        file,
      }));

      setFiles(initialStates);
      setIsUploading(true);

      const results: UploadFileResult[] = [];

      // Upload fiecare fișier secvențial (pentru a evita rate limiting)
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const fileId = initialStates[i].id;

        try {
          // Update status: uploading
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? { ...f, status: 'uploading', isUploading: true }
                : f
            )
          );

          // Upload
          const result = await uploadFile({
            ...uploadOptions,
            file,
            onProgress: (progress) => {
              setFiles((prev) =>
                prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
              );
            },
          });

          results.push(result);

          // Update status: success
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: 'success',
                    isUploading: false,
                    isSuccess: true,
                    result,
                    progress: 100,
                  }
                : f
            )
          );
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Eroare necunoscută');

          // Update status: error
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: 'error',
                    isUploading: false,
                    isError: true,
                    error: error.message,
                  }
                : f
            )
          );
        }
      }

      setIsUploading(false);
      onAllComplete?.(results);
    },
    [onAllComplete]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setFiles([]);
    setIsUploading(false);
  }, []);

  return {
    /** Lista fișierelor cu state individual */
    files,
    /** Flag global de uploading */
    isUploading,
    /** Upload batch de fișiere */
    uploadBatch,
    /** Reset state */
    reset,
    /** Număr total fișiere */
    totalFiles: files.length,
    /** Număr fișiere completate cu succes */
    successCount: files.filter((f) => f.isSuccess).length,
    /** Număr fișiere cu eroare */
    errorCount: files.filter((f) => f.isError).length,
    /** Progres total (0-100) */
    totalProgress:
      files.length > 0
        ? Math.round(
            files.reduce((sum, f) => sum + f.progress, 0) / files.length
          )
        : 0,
  };
}

// ============================================================================
// DRAG & DROP HOOK
// ============================================================================

/**
 * Hook pentru drag & drop file upload
 *
 * @returns State și handlers pentru drag & drop
 *
 * @example
 * ```typescript
 * function DropZone() {
 *   const { isDragging, dragProps } = useDragAndDrop({
 *     onDrop: (files) => {
 *       console.log('Files dropped:', files);
 *     },
 *   });
 *
 *   return (
 *     <div
 *       {...dragProps}
 *       className={isDragging ? 'border-blue-500' : 'border-gray-300'}
 *     >
 *       Drop files here
 *     </div>
 *   );
 * }
 * ```
 */
export function useDragAndDrop(options: {
  /** Callback executat când fișierele sunt drop-uite */
  onDrop: (files: File[]) => void;
  /** Validare custom fișiere */
  validateFiles?: (files: File[]) => { valid: boolean; error?: string };
}) {
  const { onDrop, validateFiles } = options;

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);

      // Validare custom dacă există
      if (validateFiles) {
        const validation = validateFiles(droppedFiles);
        if (!validation.valid) {
          console.error('Validare eșuată:', validation.error);
          return;
        }
      }

      onDrop(droppedFiles);
    },
    [onDrop, validateFiles]
  );

  return {
    /** Flag dacă utilizatorul drag-uiește fișiere peste element */
    isDragging,
    /** Props pentru elementul drop zone */
    dragProps: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
