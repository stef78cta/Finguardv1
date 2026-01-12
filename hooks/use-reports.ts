/**
 * Custom hook pentru gestionarea rapoartelor financiare.
 * 
 * Oferă:
 * - Fetch list rapoarte cu filtrare
 * - Generare raport nou
 * - Download raport
 * - Ștergere raport
 * - State management complet
 * 
 * @module hooks/use-reports
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { 
  ReportWithDetails, 
  ReportListFilter,
  GenerateReportOptions,
  ReportExportFormat,
  ExportCustomOptions,
  ReportListResult
} from '@/types/reports';

/**
 * State pentru hook useReports.
 */
interface UseReportsState {
  /** Lista rapoarte */
  reports: ReportWithDetails[];
  
  /** Raport selectat curent */
  selectedReport: ReportWithDetails | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Informații paginare */
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    perPage: number;
  };
  
  /** Filtre curente */
  filters: ReportListFilter;
}

/**
 * Rezultatul hook-ului useReports.
 */
interface UseReportsResult extends UseReportsState {
  /** Fetch rapoarte pentru o companie */
  fetchReports: (companyId: string, filters?: Partial<ReportListFilter>) => Promise<void>;
  
  /** Fetch raport individual */
  fetchReport: (reportId: string) => Promise<ReportWithDetails | null>;
  
  /** Generează raport nou */
  generateReport: (companyId: string, options: GenerateReportOptions) => Promise<string | null>;
  
  /** Descarcă raport */
  downloadReport: (reportId: string, format: ReportExportFormat) => Promise<string | null>;
  
  /** Șterge raport */
  deleteReport: (reportId: string) => Promise<boolean>;
  
  /** Actualizează filtre */
  updateFilters: (filters: Partial<ReportListFilter>) => void;
  
  /** Navighează la pagină */
  goToPage: (page: number) => void;
  
  /** Resetează state-ul */
  reset: () => void;
}

/**
 * State inițial pentru hook.
 */
const initialState: UseReportsState = {
  reports: [],
  selectedReport: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    perPage: 10,
  },
  filters: {
    page: 1,
    perPage: 10,
    sortBy: 'created_at',
    sortOrder: 'desc',
  },
};

/**
 * Custom hook useReports - gestionare rapoarte financiare.
 */
export function useReports(): UseReportsResult {
  const [state, setState] = useState<UseReportsState>(initialState);

  /**
   * Fetch rapoarte pentru o companie.
   */
  const fetchReports = useCallback(async (
    companyId: string,
    additionalFilters?: Partial<ReportListFilter>
  ) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Merge filters
      const filters = { ...state.filters, ...additionalFilters };

      // Construiește query params
      const params = new URLSearchParams();
      if (filters.reportType) params.set('reportType', filters.reportType);
      if (filters.status) params.set('status', filters.status);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.perPage) params.set('perPage', filters.perPage.toString());

      // Fetch
      const response = await fetch(
        `/api/companies/${companyId}/reports?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch reports');
      }

      const data: ReportListResult = result.data;

      setState((prev) => ({
        ...prev,
        reports: data.reports,
        pagination: {
          currentPage: data.page,
          totalPages: data.totalPages,
          total: data.total,
          perPage: data.perPage,
        },
        filters: { ...prev.filters, ...additionalFilters },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching reports:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [state.filters]);

  /**
   * Fetch raport individual.
   */
  const fetchReport = useCallback(async (reportId: string): Promise<ReportWithDetails | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/reports/${reportId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch report');
      }

      const report: ReportWithDetails = result.data;

      setState((prev) => ({
        ...prev,
        selectedReport: report,
        isLoading: false,
      }));

      return report;
    } catch (error) {
      console.error('Error fetching report:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return null;
    }
  }, []);

  /**
   * Generează raport nou.
   */
  const generateReport = useCallback(async (
    companyId: string,
    options: GenerateReportOptions
  ): Promise<string | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/companies/${companyId}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate report');
      }

      setState((prev) => ({ ...prev, isLoading: false }));

      // Refresh rapoartele
      await fetchReports(companyId);

      return result.data.reportId;
    } catch (error) {
      console.error('Error generating report:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return null;
    }
  }, [fetchReports]);

  /**
   * Descarcă raport.
   */
  const downloadReport = useCallback(async (
    reportId: string,
    format: ReportExportFormat
  ): Promise<string | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `/api/reports/${reportId}/download?format=${format}`
      );

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to download report');
      }

      setState((prev) => ({ ...prev, isLoading: false }));

      // Returnează download URL
      return result.data.downloadUrl;
    } catch (error) {
      console.error('Error downloading report:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return null;
    }
  }, []);

  /**
   * Șterge raport.
   */
  const deleteReport = useCallback(async (reportId: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete report');
      }

      // Elimină raportul din listă local
      setState((prev) => ({
        ...prev,
        reports: prev.reports.filter((r) => r.id !== reportId),
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return false;
    }
  }, []);

  /**
   * Actualizează filtre.
   */
  const updateFilters = useCallback((newFilters: Partial<ReportListFilter>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }));
  }, []);

  /**
   * Navighează la pagină.
   */
  const goToPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, page },
    }));
  }, []);

  /**
   * Resetează state-ul.
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    fetchReports,
    fetchReport,
    generateReport,
    downloadReport,
    deleteReport,
    updateFilters,
    goToPage,
    reset,
  };
}

/**
 * Hook simplificat pentru un singur raport.
 */
export function useReport(reportId: string | null) {
  const [report, setReport] = useState<ReportWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setReport(null);
      return;
    }

    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/reports/${reportId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch report');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch report');
        }

        setReport(result.data);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  return { report, isLoading, error };
}
