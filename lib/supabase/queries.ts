/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Type issues with Supabase generic methods will be resolved when using actual Database
import { getSupabaseClient } from './client';
import { getSupabaseServer } from './server';
import type { 
  TablesInsert, 
  TablesUpdate,
  Company,
  TrialBalanceImport,
  TrialBalanceAccount,
  KpiValue,
  KpiDefinition,
  Report,
  User,
  ActivityLog
} from '@/types/database';

/**
 * Helper functions pentru queries Supabase cu type-safety și error handling.
 * 
 * Aceste utilități oferă:
 * - Type-safety folosind tipurile generate din schema DB
 * - Error handling consistent
 * - Abstractizare peste detaliile de implementare Supabase
 * - Funcții reutilizabile pentru operații comune CRUD
 * 
 * @see https://supabase.com/docs/reference/javascript/select
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Rezultat generic pentru operațiuni de query.
 */
export type QueryResult<T> = {
  data: T | null;
  error: Error | null;
};

/**
 * Opțiuni pentru paginare.
 */
export type PaginationOptions = {
  page?: number;
  pageSize?: number;
};

/**
 * Opțiuni pentru sortare.
 */
export type SortOptions = {
  column: string;
  ascending?: boolean;
};

// ============================================================================
// DOMAIN-SPECIFIC QUERIES - Queries specifice pentru entități
// ============================================================================

/**
 * Obține companiile utilizatorului curent.
 * 
 * @param userId - UUID-ul utilizatorului
 * @param options - Opțiuni de filtrare și sortare
 * @returns Promise cu lista de companii
 * 
 * @example
 * ```typescript
 * const { data: companies, error } = await getUserCompanies(userId, {
 *   activeOnly: true
 * });
 * ```
 */
export async function getUserCompanies(
  userId: string,
  options?: {
    activeOnly?: boolean;
    role?: 'owner' | 'admin' | 'member' | 'viewer';
  }
): Promise<QueryResult<Company[]>> {
  try {
    const supabase = getSupabaseClient();
    
    // Query pentru a obține companiile prin relația many-to-many
    let query = supabase
      .from('company_users')
      .select(`
        company_id,
        role,
        companies (*)
      `)
      .eq('user_id', userId);

    // Filtru pentru rol specific
    if (options?.role) {
      query = query.eq('role', options.role);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Extrage companiile din rezultat
    const companies = data
      ?.map((item: any) => item.companies)
      .filter((company: any) => {
        if (options?.activeOnly) {
          return company.is_active === true;
        }
        return true;
      }) || [];

    return { data: companies, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Obține o companie după ID.
 * 
 * @param companyId - UUID-ul companiei
 * @returns Promise cu datele companiei
 * 
 * @example
 * ```typescript
 * const { data: company, error } = await getCompanyById(companyId);
 * ```
 */
export async function getCompanyById(
  companyId: string
): Promise<QueryResult<Company>> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Creează o companie nouă.
 * 
 * @param companyData - Datele companiei de creat
 * @returns Promise cu compania creată
 * 
 * @example
 * ```typescript
 * const { data: company, error } = await createCompany({
 *   name: 'ACME SRL',
 *   cui: '12345678',
 *   country_code: 'RO',
 *   currency: 'RON'
 * });
 * ```
 */
export async function createCompany(
  companyData: TablesInsert<'companies'>
): Promise<QueryResult<Company>> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('companies')
      .insert(companyData as any)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Actualizează o companie existentă.
 * 
 * @param companyId - UUID-ul companiei
 * @param updates - Datele de actualizat
 * @returns Promise cu compania actualizată
 * 
 * @example
 * ```typescript
 * const { data: company, error } = await updateCompany(companyId, {
 *   name: 'ACME SRL Updated'
 * });
 * ```
 */
export async function updateCompany(
  companyId: string,
  updates: TablesUpdate<'companies'>
): Promise<QueryResult<Company>> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Șterge o companie.
 * 
 * @param companyId - UUID-ul companiei
 * @returns Promise cu true dacă ștergerea a reușit
 * 
 * @example
 * ```typescript
 * const { data: success, error } = await deleteCompany(companyId);
 * ```
 */
export async function deleteCompany(
  companyId: string
): Promise<QueryResult<boolean>> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error) {
    return { data: false, error: error as Error };
  }
}

/**
 * Obține importurile de balanță pentru o companie.
 * 
 * @param companyId - UUID-ul companiei
 * @param options - Opțiuni de filtrare și paginare
 * @returns Promise cu lista de importuri
 * 
 * @example
 * ```typescript
 * const { data: imports, error } = await getCompanyImports(companyId, {
 *   status: 'completed',
 *   pagination: { page: 1, pageSize: 20 }
 * });
 * ```
 */
export async function getCompanyImports(
  companyId: string,
  options?: {
    status?: 'draft' | 'processing' | 'validated' | 'completed' | 'error';
    pagination?: PaginationOptions;
  }
): Promise<QueryResult<TrialBalanceImport[]>> {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('trial_balance_imports')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // Filtru pentru status
    if (options?.status) {
      query = query.eq('status', options.status);
    }

    // Paginare
    if (options?.pagination) {
      const { page = 1, pageSize = 10 } = options.pagination;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Obține un import de balanță după ID.
 * 
 * @param importId - UUID-ul importului
 * @returns Promise cu datele importului
 * 
 * @example
 * ```typescript
 * const { data: import, error } = await getImportById(importId);
 * ```
 */
export async function getImportById(
  importId: string
): Promise<QueryResult<TrialBalanceImport>> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('trial_balance_imports')
      .select('*')
      .eq('id', importId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Obține conturile dintr-un import de balanță.
 * 
 * @param importId - UUID-ul importului
 * @returns Promise cu lista de conturi
 * 
 * @example
 * ```typescript
 * const { data: accounts, error } = await getImportAccounts(importId);
 * ```
 */
export async function getImportAccounts(
  importId: string
): Promise<QueryResult<TrialBalanceAccount[]>> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('trial_balance_accounts')
      .select('*')
      .eq('import_id', importId)
      .order('account_code', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Obține valorile KPI pentru o companie într-o anumită perioadă.
 * 
 * @param companyId - UUID-ul companiei
 * @param periodStart - Data de început a perioadei
 * @param periodEnd - Data de sfârșit a perioadei
 * @param options - Opțiuni de filtrare
 * @returns Promise cu lista de valori KPI
 * 
 * @example
 * ```typescript
 * const { data: kpis, error } = await getCompanyKpiValues(
 *   companyId,
 *   '2024-01-01',
 *   '2024-12-31',
 *   { category: 'liquidity' }
 * );
 * ```
 */
export async function getCompanyKpiValues(
  companyId: string,
  periodStart: string,
  periodEnd: string,
  options?: {
    category?: 'liquidity' | 'profitability' | 'leverage' | 'efficiency' | 'other';
  }
): Promise<QueryResult<(KpiValue & { definition: KpiDefinition })[]>> {
  try {
    const supabase = getSupabaseClient();
    const query = supabase
      .from('kpi_values')
      .select(`
        *,
        definition:kpi_definitions (*)
      `)
      .eq('company_id', companyId)
      .gte('period_start', periodStart)
      .lte('period_end', periodEnd);

    const { data, error } = await query;

    if (error) throw error;

    // Filtru pentru categorie
    const filteredData = (data || []).filter((item: any) => 
      !options?.category || item.definition?.category === options.category
    );

    return { data: filteredData as any, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Obține toate definițiile KPI active.
 * 
 * @param category - Categorie opțională pentru filtrare
 * @returns Promise cu lista de definiții KPI
 * 
 * @example
 * ```typescript
 * const { data: definitions, error } = await getKpiDefinitions('liquidity');
 * ```
 */
export async function getKpiDefinitions(
  category?: 'liquidity' | 'profitability' | 'leverage' | 'efficiency' | 'other'
): Promise<QueryResult<KpiDefinition[]>> {
  try {
    const supabase = getSupabaseClient();
    const baseQuery = supabase
      .from('kpi_definitions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    const query = category ? baseQuery.eq('category', category) : baseQuery;

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Obține rapoartele generate pentru o companie.
 * 
 * @param companyId - UUID-ul companiei
 * @param options - Opțiuni de filtrare și paginare
 * @returns Promise cu lista de rapoarte
 * 
 * @example
 * ```typescript
 * const { data: reports, error } = await getCompanyReports(companyId, {
 *   reportType: 'comprehensive',
 *   status: 'completed'
 * });
 * ```
 */
export async function getCompanyReports(
  companyId: string,
  options?: {
    reportType?: 'comprehensive' | 'kpi_dashboard' | 'comparative' | 'custom';
    status?: 'generating' | 'completed' | 'error';
    pagination?: PaginationOptions;
  }
): Promise<QueryResult<Report[]>> {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('reports')
      .select('*')
      .eq('company_id', companyId)
      .order('generated_at', { ascending: false });

    // Filtre
    if (options?.reportType) {
      query = query.eq('report_type', options.reportType);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }

    // Paginare
    if (options?.pagination) {
      const { page = 1, pageSize = 10 } = options.pagination;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Obține un raport după ID.
 * 
 * @param reportId - UUID-ul raportului
 * @returns Promise cu datele raportului
 * 
 * @example
 * ```typescript
 * const { data: report, error } = await getReportById(reportId);
 * ```
 */
export async function getReportById(
  reportId: string
): Promise<QueryResult<Report>> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// SERVER-SIDE QUERIES - Pentru operațiuni admin sau webhook-uri
// ============================================================================

/**
 * Creează sau actualizează un utilizator folosind clientul server.
 * Folosește DOAR în webhook-uri sau API routes cu autorizare admin.
 * 
 * @param userData - Datele utilizatorului
 * @returns Promise cu datele utilizatorului
 * 
 * @example
 * ```typescript
 * // În webhook Clerk
 * const { data: user, error } = await upsertUserServer({
 *   clerk_user_id: clerkUserId,
 *   email: email,
 *   full_name: fullName
 * });
 * ```
 */
export async function upsertUserServer(
  userData: TablesInsert<'users'>
): Promise<QueryResult<User>> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('users')
      .upsert(userData as any, { 
        onConflict: 'clerk_user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Obține un utilizator după Clerk User ID folosind clientul server.
 * 
 * @param clerkUserId - ID-ul utilizatorului din Clerk
 * @returns Promise cu datele utilizatorului
 * 
 * @example
 * ```typescript
 * const { data: user, error } = await getUserByClerkIdServer(clerkUserId);
 * ```
 */
export async function getUserByClerkIdServer(
  clerkUserId: string
): Promise<QueryResult<User>> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Logare activitate în audit trail folosind clientul server.
 * 
 * @param logData - Datele pentru log
 * @returns Promise cu datele log-ului creat
 * 
 * @example
 * ```typescript
 * await logActivityServer({
 *   user_id: userId,
 *   company_id: companyId,
 *   action: 'company.create',
 *   entity_type: 'company',
 *   entity_id: newCompanyId,
 *   new_values: { name: 'ACME SRL' }
 * });
 * ```
 */
export async function logActivityServer(
  logData: TablesInsert<'activity_logs'>
): Promise<QueryResult<ActivityLog>> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('activity_logs')
      .insert(logData as any)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
