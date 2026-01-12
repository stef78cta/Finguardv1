import { useState, useEffect, useCallback } from 'react';
import type { Company } from '@/types/database';

/**
 * Hook custom pentru gestionarea companiilor în aplicație.
 * 
 * Oferă funcționalități pentru:
 * - Listare companii ale utilizatorului
 * - Creare companie nouă
 * - Actualizare companie existentă
 * - Ștergere companie
 * - State management și cache local
 * - Error handling și loading states
 * 
 * @example
 * ```typescript
 * function CompaniesPage() {
 *   const {
 *     companies,
 *     loading,
 *     error,
 *     createCompany,
 *     updateCompany,
 *     deleteCompany,
 *     refreshCompanies
 *   } = useCompanies();
 * 
 *   const handleCreate = async () => {
 *     const result = await createCompany({
 *       name: 'ACME SRL',
 *       cui: '12345678'
 *     });
 *     if (result.success) {
 *       // Success handling
 *     }
 *   };
 * }
 * ```
 */

/**
 * Tipuri pentru rezultatele operațiunilor
 */
export type CompanyOperationResult = {
  success: boolean;
  data?: Company;
  error?: string;
};

/**
 * Tipuri pentru datele de creare companie
 */
export type CreateCompanyData = {
  name: string;
  cui: string;
  country_code?: string;
  currency?: string;
  fiscal_year_start_month?: number;
  address?: string;
  phone?: string;
  logo_url?: string;
};

/**
 * Tipuri pentru datele de actualizare companie
 */
export type UpdateCompanyData = Partial<CreateCompanyData> & {
  is_active?: boolean;
};

/**
 * Tipuri pentru opțiunile de filtrare
 */
export type CompaniesFilterOptions = {
  activeOnly?: boolean;
  role?: 'owner' | 'admin' | 'member' | 'viewer';
};

/**
 * Returnează starea și funcțiile pentru gestionarea companiilor.
 */
export function useCompanies(filterOptions?: CompaniesFilterOptions) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Funcție pentru a încărca companiile de la API.
   * 
   * @param options - Opțiuni de filtrare
   */
  const fetchCompanies = useCallback(async (options?: CompaniesFilterOptions) => {
    try {
      setLoading(true);
      setError(null);

      // Construiește query params
      const params = new URLSearchParams();
      if (options?.activeOnly) {
        params.append('activeOnly', 'true');
      }
      if (options?.role) {
        params.append('role', options.role);
      }

      const response = await fetch(`/api/companies?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Eroare la încărcarea companiilor');
      }

      const result = await response.json();
      setCompanies(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Eroare necunoscută';
      setError(errorMessage);
      console.error('Eroare la încărcarea companiilor:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Încarcă companiile la mount și când se schimbă opțiunile de filtrare.
   */
  useEffect(() => {
    fetchCompanies(filterOptions);
  }, [fetchCompanies, filterOptions]);

  /**
   * Creează o companie nouă.
   * 
   * @param data - Datele companiei de creat
   * @returns Promise cu rezultatul operațiunii
   * 
   * @example
   * ```typescript
   * const result = await createCompany({
   *   name: 'ACME SRL',
   *   cui: '12345678',
   *   country_code: 'RO'
   * });
   * ```
   */
  const createCompany = useCallback(
    async (data: CreateCompanyData): Promise<CompanyOperationResult> => {
      try {
        const response = await fetch('/api/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: result.error || 'Eroare la crearea companiei',
          };
        }

        // Adaugă noua companie în lista locală
        if (result.data) {
          setCompanies((prev) => [...prev, result.data]);
        }

        return {
          success: true,
          data: result.data,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Eroare necunoscută';
        console.error('Eroare la crearea companiei:', err);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  /**
   * Actualizează o companie existentă.
   * 
   * @param id - ID-ul companiei de actualizat
   * @param data - Datele de actualizat
   * @returns Promise cu rezultatul operațiunii
   * 
   * @example
   * ```typescript
   * const result = await updateCompany(companyId, {
   *   name: 'ACME SRL Updated'
   * });
   * ```
   */
  const updateCompany = useCallback(
    async (
      id: string,
      data: UpdateCompanyData
    ): Promise<CompanyOperationResult> => {
      try {
        const response = await fetch(`/api/companies/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: result.error || 'Eroare la actualizarea companiei',
          };
        }

        // Actualizează compania în lista locală
        if (result.data) {
          setCompanies((prev) =>
            prev.map((company) =>
              company.id === id ? result.data : company
            )
          );
        }

        return {
          success: true,
          data: result.data,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Eroare necunoscută';
        console.error('Eroare la actualizarea companiei:', err);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  /**
   * Șterge o companie.
   * 
   * @param id - ID-ul companiei de șters
   * @returns Promise cu rezultatul operațiunii
   * 
   * @example
   * ```typescript
   * const result = await deleteCompany(companyId);
   * if (result.success) {
   *   // Compania a fost ștearsă
   * }
   * ```
   */
  const deleteCompany = useCallback(
    async (id: string): Promise<CompanyOperationResult> => {
      try {
        const response = await fetch(`/api/companies/${id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: result.error || 'Eroare la ștergerea companiei',
          };
        }

        // Elimină compania din lista locală
        setCompanies((prev) => prev.filter((company) => company.id !== id));

        return {
          success: true,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Eroare necunoscută';
        console.error('Eroare la ștergerea companiei:', err);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  /**
   * Obține detalii despre o companie specifică.
   * 
   * @param id - ID-ul companiei
   * @returns Promise cu rezultatul operațiunii
   * 
   * @example
   * ```typescript
   * const result = await getCompany(companyId);
   * if (result.success) {
   *   console.log(result.data);
   * }
   * ```
   */
  const getCompany = useCallback(
    async (id: string): Promise<CompanyOperationResult> => {
      try {
        const response = await fetch(`/api/companies/${id}`);
        
        const result = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: result.error || 'Eroare la obținerea companiei',
          };
        }

        return {
          success: true,
          data: result.data,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Eroare necunoscută';
        console.error('Eroare la obținerea companiei:', err);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  /**
   * Reîncarcă lista de companii de la API.
   * Util după operațiuni care pot afecta datele (ex: import)
   * 
   * @example
   * ```typescript
   * await refreshCompanies();
   * ```
   */
  const refreshCompanies = useCallback(() => {
    return fetchCompanies(filterOptions);
  }, [fetchCompanies, filterOptions]);

  return {
    companies,
    loading,
    error,
    createCompany,
    updateCompany,
    deleteCompany,
    getCompany,
    refreshCompanies,
  };
}

/**
 * Hook pentru a obține o singură companie după ID.
 * 
 * @param id - ID-ul companiei
 * @returns Starea și datele companiei
 * 
 * @example
 * ```typescript
 * function CompanyDetails({ companyId }) {
 *   const { company, loading, error, refresh } = useCompany(companyId);
 * 
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   
 *   return <div>{company?.name}</div>;
 * }
 * ```
 */
export function useCompany(id: string | null) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/companies/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Eroare la încărcarea companiei');
      }

      const result = await response.json();
      setCompany(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Eroare necunoscută';
      setError(errorMessage);
      console.error('Eroare la încărcarea companiei:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return {
    company,
    loading,
    error,
    refresh: fetchCompany,
  };
}
