/**
 * Tipuri TypeScript generate din schema Supabase.
 * 
 * Aceste tipuri corespund structurii complete a bazei de date FinGuard.
 * Pentru a regenera tipurile automat din Supabase, rulează:
 * 
 * ```bash
 * npm run db:types
 * ```
 * 
 * sau manual:
 * 
 * ```bash
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
 * ```
 * 
 * @see https://supabase.com/docs/guides/api/generating-types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Interface principală pentru schema bazei de date FinGuard.
 * Conține toate tabelele, view-urile, funcțiile și enum-urile.
 */
export interface Database {
  public: {
    Tables: {
      // ============================================================================
      // 1. IDENTITATE ȘI ACCES
      // ============================================================================
      
      /**
       * Tabela users - Utilizatori autentificați prin Clerk
       */
      users: {
        Row: {
          id: string;
          clerk_user_id: string;
          email: string;
          full_name: string | null;
          role: 'user' | 'admin' | 'super_admin';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          email: string;
          full_name?: string | null;
          role?: 'user' | 'admin' | 'super_admin';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          email?: string;
          full_name?: string | null;
          role?: 'user' | 'admin' | 'super_admin';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
      };
      
      /**
       * Tabela companies - Entități juridice analizate
       */
      companies: {
        Row: {
          id: string;
          name: string;
          cui: string;
          country_code: string;
          currency: string;
          fiscal_year_start_month: number;
          logo_url: string | null;
          address: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          cui: string;
          country_code?: string;
          currency?: string;
          fiscal_year_start_month?: number;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          cui?: string;
          country_code?: string;
          currency?: string;
          fiscal_year_start_month?: number;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
      
      /**
       * Tabela company_users - Relație many-to-many user ↔ company cu roluri
       */
      company_users: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member' | 'viewer';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'member' | 'viewer';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'member' | 'viewer';
          created_at?: string;
          updated_at?: string;
        };
      };

      // ============================================================================
      // 2. IMPORT BALANȚĂ DE VERIFICARE
      // ============================================================================
      
      /**
       * Tabela trial_balance_imports - Upload sessions pentru balanțe
       */
      trial_balance_imports: {
        Row: {
          id: string;
          company_id: string;
          period_start: string;
          period_end: string;
          source_file_name: string;
          source_file_url: string | null;
          file_size_bytes: number | null;
          uploaded_by: string;
          status: 'draft' | 'processing' | 'validated' | 'completed' | 'error';
          error_message: string | null;
          validation_errors: Json | null;
          created_at: string;
          updated_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          period_start: string;
          period_end: string;
          source_file_name: string;
          source_file_url?: string | null;
          file_size_bytes?: number | null;
          uploaded_by: string;
          status?: 'draft' | 'processing' | 'validated' | 'completed' | 'error';
          error_message?: string | null;
          validation_errors?: Json | null;
          created_at?: string;
          updated_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          period_start?: string;
          period_end?: string;
          source_file_name?: string;
          source_file_url?: string | null;
          file_size_bytes?: number | null;
          uploaded_by?: string;
          status?: 'draft' | 'processing' | 'validated' | 'completed' | 'error';
          error_message?: string | null;
          validation_errors?: Json | null;
          created_at?: string;
          updated_at?: string;
          processed_at?: string | null;
        };
      };
      
      /**
       * Tabela trial_balance_accounts - Linii din balanță (8 coloane standard)
       */
      trial_balance_accounts: {
        Row: {
          id: string;
          import_id: string;
          account_code: string;
          account_name: string;
          opening_debit: number;
          opening_credit: number;
          debit_turnover: number;
          credit_turnover: number;
          closing_debit: number;
          closing_credit: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          import_id: string;
          account_code: string;
          account_name: string;
          opening_debit?: number;
          opening_credit?: number;
          debit_turnover?: number;
          credit_turnover?: number;
          closing_debit?: number;
          closing_credit?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          import_id?: string;
          account_code?: string;
          account_name?: string;
          opening_debit?: number;
          opening_credit?: number;
          debit_turnover?: number;
          credit_turnover?: number;
          closing_debit?: number;
          closing_credit?: number;
          created_at?: string;
        };
      };

      // ============================================================================
      // 3. PLAN CONTABIL ȘI MAPARE
      // ============================================================================
      
      /**
       * Tabela chart_of_accounts - Planul de conturi intern normalizat
       */
      chart_of_accounts: {
        Row: {
          id: string;
          account_code: string;
          account_name: string;
          account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | null;
          parent_code: string | null;
          level: number;
          company_id: string | null;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_code: string;
          account_name: string;
          account_type?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | null;
          parent_code?: string | null;
          level?: number;
          company_id?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_code?: string;
          account_name?: string;
          account_type?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | null;
          parent_code?: string | null;
          level?: number;
          company_id?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      
      /**
       * Tabela account_mappings - Mapare conturi balanță → structură financiară
       */
      account_mappings: {
        Row: {
          id: string;
          trial_balance_account_id: string;
          chart_account_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trial_balance_account_id: string;
          chart_account_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trial_balance_account_id?: string;
          chart_account_id?: string;
          created_at?: string;
        };
      };

      // ============================================================================
      // 4. DATE FINANCIARE DERIVATE
      // ============================================================================
      
      /**
       * Tabela financial_statements - Situații financiare generate
       */
      financial_statements: {
        Row: {
          id: string;
          company_id: string;
          period_start: string;
          period_end: string;
          source_import_id: string;
          statement_type: 'balance_sheet' | 'income_statement' | 'cash_flow' | null;
          generated_at: string;
          generated_by: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          period_start: string;
          period_end: string;
          source_import_id: string;
          statement_type?: 'balance_sheet' | 'income_statement' | 'cash_flow' | null;
          generated_at?: string;
          generated_by?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          period_start?: string;
          period_end?: string;
          source_import_id?: string;
          statement_type?: 'balance_sheet' | 'income_statement' | 'cash_flow' | null;
          generated_at?: string;
          generated_by?: string | null;
        };
      };
      
      /**
       * Tabela balance_sheet_lines - Linii din bilanț
       */
      balance_sheet_lines: {
        Row: {
          id: string;
          statement_id: string;
          category: string;
          subcategory: string | null;
          account_code: string | null;
          description: string | null;
          amount: number;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          statement_id: string;
          category: string;
          subcategory?: string | null;
          account_code?: string | null;
          description?: string | null;
          amount: number;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          statement_id?: string;
          category?: string;
          subcategory?: string | null;
          account_code?: string | null;
          description?: string | null;
          amount?: number;
          display_order?: number;
          created_at?: string;
        };
      };
      
      /**
       * Tabela income_statement_lines - Linii din contul de profit și pierdere
       */
      income_statement_lines: {
        Row: {
          id: string;
          statement_id: string;
          category: 'venituri' | 'cheltuieli';
          subcategory: string | null;
          account_code: string | null;
          description: string | null;
          amount: number;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          statement_id: string;
          category: 'venituri' | 'cheltuieli';
          subcategory?: string | null;
          account_code?: string | null;
          description?: string | null;
          amount: number;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          statement_id?: string;
          category?: 'venituri' | 'cheltuieli';
          subcategory?: string | null;
          account_code?: string | null;
          description?: string | null;
          amount?: number;
          display_order?: number;
          created_at?: string;
        };
      };
      
      /**
       * Tabela cash_flow_lines - Linii pentru situația fluxurilor de numerar
       */
      cash_flow_lines: {
        Row: {
          id: string;
          statement_id: string;
          section: 'operating' | 'investing' | 'financing' | null;
          description: string;
          amount: number;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          statement_id: string;
          section?: 'operating' | 'investing' | 'financing' | null;
          description: string;
          amount: number;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          statement_id?: string;
          section?: 'operating' | 'investing' | 'financing' | null;
          description?: string;
          amount?: number;
          display_order?: number;
          created_at?: string;
        };
      };

      // ============================================================================
      // 5. KPI (KEY PERFORMANCE INDICATORS)
      // ============================================================================
      
      /**
       * Tabela kpi_definitions - Definiții standard sau custom pentru KPI-uri
       */
      kpi_definitions: {
        Row: {
          id: string;
          code: string;
          name: string;
          category: 'liquidity' | 'profitability' | 'leverage' | 'efficiency' | 'other' | null;
          formula: Json;
          unit: 'ratio' | 'percentage' | 'days' | 'times' | 'currency';
          description: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          category?: 'liquidity' | 'profitability' | 'leverage' | 'efficiency' | 'other' | null;
          formula: Json;
          unit?: 'ratio' | 'percentage' | 'days' | 'times' | 'currency';
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          category?: 'liquidity' | 'profitability' | 'leverage' | 'efficiency' | 'other' | null;
          formula?: Json;
          unit?: 'ratio' | 'percentage' | 'days' | 'times' | 'currency';
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      
      /**
       * Tabela kpi_values - Valori calculate pentru KPI-uri pe perioadă
       */
      kpi_values: {
        Row: {
          id: string;
          kpi_definition_id: string;
          company_id: string;
          period_start: string;
          period_end: string;
          value: number | null;
          calculated_at: string;
          trial_balance_import_id: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          kpi_definition_id: string;
          company_id: string;
          period_start: string;
          period_end: string;
          value?: number | null;
          calculated_at?: string;
          trial_balance_import_id: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          kpi_definition_id?: string;
          company_id?: string;
          period_start?: string;
          period_end?: string;
          value?: number | null;
          calculated_at?: string;
          trial_balance_import_id?: string;
          metadata?: Json | null;
        };
      };

      // ============================================================================
      // 6. RAPOARTE ȘI EXPORT
      // ============================================================================
      
      /**
       * Tabela reports - Rapoarte generate
       */
      reports: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          report_type: 'comprehensive' | 'kpi_dashboard' | 'comparative' | 'custom' | null;
          period_start: string;
          period_end: string;
          generated_by: string;
          generated_at: string;
          file_url: string | null;
          file_format: 'pdf' | 'excel' | 'json' | null;
          status: 'generating' | 'completed' | 'error';
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          report_type?: 'comprehensive' | 'kpi_dashboard' | 'comparative' | 'custom' | null;
          period_start: string;
          period_end: string;
          generated_by: string;
          generated_at?: string;
          file_url?: string | null;
          file_format?: 'pdf' | 'excel' | 'json' | null;
          status?: 'generating' | 'completed' | 'error';
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          title?: string;
          report_type?: 'comprehensive' | 'kpi_dashboard' | 'comparative' | 'custom' | null;
          period_start?: string;
          period_end?: string;
          generated_by?: string;
          generated_at?: string;
          file_url?: string | null;
          file_format?: 'pdf' | 'excel' | 'json' | null;
          status?: 'generating' | 'completed' | 'error';
          metadata?: Json | null;
        };
      };

      // ============================================================================
      // 7. SUBSCRIPTIONS & BILLING
      // ============================================================================
      
      /**
       * Tabela subscription_plans - Planuri de abonament
       */
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price_monthly: number;
          price_yearly: number | null;
          max_companies: number;
          max_users_per_company: number;
          max_uploads_per_month: number;
          features: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price_monthly: number;
          price_yearly?: number | null;
          max_companies?: number;
          max_users_per_company?: number;
          max_uploads_per_month?: number;
          features?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number | null;
          max_companies?: number;
          max_users_per_company?: number;
          max_uploads_per_month?: number;
          features?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      
      /**
       * Tabela subscriptions - Abonamente active
       */
      subscriptions: {
        Row: {
          id: string;
          company_id: string;
          plan_id: string;
          status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
          billing_cycle: 'monthly' | 'yearly' | null;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          payment_provider: string | null;
          payment_provider_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          plan_id: string;
          status?: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
          billing_cycle?: 'monthly' | 'yearly' | null;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          payment_provider?: string | null;
          payment_provider_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          plan_id?: string;
          status?: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
          billing_cycle?: 'monthly' | 'yearly' | null;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          payment_provider?: string | null;
          payment_provider_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ============================================================================
      // 8. AUDIT ȘI LOGGING
      // ============================================================================
      
      /**
       * Tabela activity_logs - Audit trail pentru acțiuni importante
       */
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          company_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          company_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          company_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    
    Views: {
      [_ in never]: never;
    };
    
    Functions: {
      /**
       * Funcție pentru validarea echilibrului balanței de verificare
       */
      validate_trial_balance_equilibrium: {
        Args: {
          import_uuid: string;
        };
        Returns: {
          is_valid: boolean;
          error_code: string;
          error_message: string;
        }[];
      };
    };
    
    Enums: {
      [_ in never]: never;
    };
  };
}

// ============================================================================
// HELPER TYPES - Tipuri utilitare pentru development
// ============================================================================

/**
 * Tipuri pentru tabelele din baza de date.
 * Oferă acces rapid la structura fiecărui tabel.
 */
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

/**
 * Tipuri pentru operațiuni de insert.
 * Folosește când creezi noi înregistrări.
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

/**
 * Tipuri pentru operațiuni de update.
 * Folosește când actualizezi înregistrări existente.
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

/**
 * Tipuri pentru funcțiile din baza de date.
 */
export type Functions<T extends keyof Database['public']['Functions']> = 
  Database['public']['Functions'][T];

// ============================================================================
// COMMON TYPE ALIASES - Alias-uri pentru tipuri des folosite
// ============================================================================

export type User = Tables<'users'>;
export type Company = Tables<'companies'>;
export type CompanyUser = Tables<'company_users'>;
export type TrialBalanceImport = Tables<'trial_balance_imports'>;
export type TrialBalanceAccount = Tables<'trial_balance_accounts'>;
export type ChartOfAccount = Tables<'chart_of_accounts'>;
export type FinancialStatement = Tables<'financial_statements'>;
export type KpiDefinition = Tables<'kpi_definitions'>;
export type KpiValue = Tables<'kpi_values'>;
export type Report = Tables<'reports'>;
export type SubscriptionPlan = Tables<'subscription_plans'>;
export type Subscription = Tables<'subscriptions'>;
export type ActivityLog = Tables<'activity_logs'>;
