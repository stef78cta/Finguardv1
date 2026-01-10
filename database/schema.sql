-- ============================================================================
-- FinGuard Database Schema
-- PostgreSQL + Supabase
-- Version: 1.0
-- Date: 2026-01-10
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. IDENTITATE ȘI ACCES
-- ============================================================================

-- Tabela: users
-- Utilizatori sincronizați cu Clerk
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Index pentru performanță
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);

-- Trigger pentru updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================

-- Tabela: companies
-- Entități juridice analizate
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cui VARCHAR(50) UNIQUE NOT NULL,
    country_code CHAR(2) DEFAULT 'RO',
    currency CHAR(3) DEFAULT 'RON',
    fiscal_year_start_month INT DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
    logo_url TEXT,
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Index
CREATE INDEX idx_companies_cui ON companies(cui);
CREATE INDEX idx_companies_active ON companies(is_active);

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================

-- Tabela: company_users
-- Relație many-to-many user ↔ company cu roluri
CREATE TABLE company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

-- Index
CREATE INDEX idx_company_users_company ON company_users(company_id);
CREATE INDEX idx_company_users_user ON company_users(user_id);
CREATE INDEX idx_company_users_role ON company_users(role);

CREATE TRIGGER update_company_users_updated_at BEFORE UPDATE ON company_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. IMPORT BALANȚĂ DE VERIFICARE
-- ============================================================================

-- Tabela: trial_balance_imports
-- Upload sessions pentru balanțe
CREATE TABLE trial_balance_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    source_file_name VARCHAR(255) NOT NULL,
    source_file_url TEXT,
    file_size_bytes BIGINT,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'validated', 'completed', 'error')),
    error_message TEXT,
    validation_errors JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    CONSTRAINT valid_period CHECK (period_start <= period_end),
    UNIQUE(company_id, period_start, period_end)
);

-- Index
CREATE INDEX idx_tb_imports_company ON trial_balance_imports(company_id);
CREATE INDEX idx_tb_imports_status ON trial_balance_imports(status);
CREATE INDEX idx_tb_imports_period ON trial_balance_imports(period_start, period_end);

CREATE TRIGGER update_trial_balance_imports_updated_at BEFORE UPDATE ON trial_balance_imports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================

-- Tabela: trial_balance_accounts
-- Linii din balanță (8 coloane standard - normalizate)
CREATE TABLE trial_balance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID NOT NULL REFERENCES trial_balance_imports(id) ON DELETE CASCADE,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    opening_debit NUMERIC(15,2) DEFAULT 0,
    opening_credit NUMERIC(15,2) DEFAULT 0,
    debit_turnover NUMERIC(15,2) DEFAULT 0,
    credit_turnover NUMERIC(15,2) DEFAULT 0,
    closing_debit NUMERIC(15,2) DEFAULT 0,
    closing_credit NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(import_id, account_code),
    -- Constrângeri: un cont nu poate fi simultan debitor și creditor
    CHECK (NOT (opening_debit > 0 AND opening_credit > 0)),
    CHECK (NOT (closing_debit > 0 AND closing_credit > 0))
);

-- Index
CREATE INDEX idx_tb_accounts_import ON trial_balance_accounts(import_id);
CREATE INDEX idx_tb_accounts_code ON trial_balance_accounts(account_code);

-- ============================================================================
-- 3. PLAN CONTABIL ȘI MAPARE
-- ============================================================================

-- Tabela: chart_of_accounts
-- Planul de conturi intern normalizat
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    parent_code VARCHAR(20),
    level INT DEFAULT 1,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_code, company_id)
);

-- Index
CREATE INDEX idx_coa_code ON chart_of_accounts(account_code);
CREATE INDEX idx_coa_type ON chart_of_accounts(account_type);
CREATE INDEX idx_coa_company ON chart_of_accounts(company_id);

CREATE TRIGGER update_chart_of_accounts_updated_at BEFORE UPDATE ON chart_of_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================

-- Tabela: account_mappings
-- Mapare conturi din balanță → structură financiară
CREATE TABLE account_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_balance_account_id UUID NOT NULL REFERENCES trial_balance_accounts(id) ON DELETE CASCADE,
    chart_account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trial_balance_account_id, chart_account_id)
);

-- Index
CREATE INDEX idx_account_mappings_tb ON account_mappings(trial_balance_account_id);
CREATE INDEX idx_account_mappings_chart ON account_mappings(chart_account_id);

-- ============================================================================
-- 4. DATE FINANCIARE DERIVATE
-- ============================================================================

-- Tabela: financial_statements
-- Situații financiare generate
CREATE TABLE financial_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    source_import_id UUID NOT NULL REFERENCES trial_balance_imports(id) ON DELETE CASCADE,
    statement_type VARCHAR(50) CHECK (statement_type IN ('balance_sheet', 'income_statement', 'cash_flow')),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by UUID REFERENCES users(id),
    CONSTRAINT valid_fs_period CHECK (period_start <= period_end),
    UNIQUE(company_id, period_start, period_end, statement_type)
);

-- Index
CREATE INDEX idx_fs_company ON financial_statements(company_id);
CREATE INDEX idx_fs_period ON financial_statements(period_start, period_end);
CREATE INDEX idx_fs_type ON financial_statements(statement_type);

-- ============================================================================

-- Tabela: balance_sheet_lines
-- Linii din bilanț
CREATE TABLE balance_sheet_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_id UUID NOT NULL REFERENCES financial_statements(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    account_code VARCHAR(20),
    description VARCHAR(255),
    amount NUMERIC(15,2) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(statement_id, account_code)
);

-- Index
CREATE INDEX idx_bs_lines_statement ON balance_sheet_lines(statement_id);
CREATE INDEX idx_bs_lines_category ON balance_sheet_lines(category);

-- ============================================================================

-- Tabela: income_statement_lines
-- Linii din contul de profit și pierdere
CREATE TABLE income_statement_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_id UUID NOT NULL REFERENCES financial_statements(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL CHECK (category IN ('venituri', 'cheltuieli')),
    subcategory VARCHAR(100),
    account_code VARCHAR(20),
    description VARCHAR(255),
    amount NUMERIC(15,2) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(statement_id, account_code)
);

-- Index
CREATE INDEX idx_is_lines_statement ON income_statement_lines(statement_id);
CREATE INDEX idx_is_lines_category ON income_statement_lines(category);

-- ============================================================================

-- Tabela: cash_flow_lines
-- Linii pentru situația fluxurilor de numerar
CREATE TABLE cash_flow_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_id UUID NOT NULL REFERENCES financial_statements(id) ON DELETE CASCADE,
    section VARCHAR(50) CHECK (section IN ('operating', 'investing', 'financing')),
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_cf_lines_statement ON cash_flow_lines(statement_id);
CREATE INDEX idx_cf_lines_section ON cash_flow_lines(section);

-- ============================================================================
-- 5. KPI (KEY PERFORMANCE INDICATORS)
-- ============================================================================

-- Tabela: kpi_definitions
-- Definiții standard sau custom pentru KPI-uri
CREATE TABLE kpi_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) CHECK (category IN ('liquidity', 'profitability', 'leverage', 'efficiency', 'other')),
    formula JSONB NOT NULL,
    unit VARCHAR(50) DEFAULT 'ratio' CHECK (unit IN ('ratio', 'percentage', 'days', 'times', 'currency')),
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_kpi_defs_code ON kpi_definitions(code);
CREATE INDEX idx_kpi_defs_category ON kpi_definitions(category);
CREATE INDEX idx_kpi_defs_active ON kpi_definitions(is_active);

CREATE TRIGGER update_kpi_definitions_updated_at BEFORE UPDATE ON kpi_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================

-- Tabela: kpi_values
-- Valori calculate pentru KPI-uri pe perioadă
CREATE TABLE kpi_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_definition_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    value NUMERIC(15,4),
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    trial_balance_import_id UUID NOT NULL REFERENCES trial_balance_imports(id) ON DELETE CASCADE,
    metadata JSONB,
    CONSTRAINT valid_kpi_period CHECK (period_start <= period_end),
    UNIQUE(kpi_definition_id, company_id, period_start, period_end)
);

-- Index
CREATE INDEX idx_kpi_values_kpi ON kpi_values(kpi_definition_id);
CREATE INDEX idx_kpi_values_company ON kpi_values(company_id);
CREATE INDEX idx_kpi_values_period ON kpi_values(period_start, period_end);

-- ============================================================================
-- 6. RAPOARTE ȘI EXPORT
-- ============================================================================

-- Tabela: reports
-- Rapoarte generate
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) CHECK (report_type IN ('comprehensive', 'kpi_dashboard', 'comparative', 'custom')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    generated_by UUID NOT NULL REFERENCES users(id),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    file_url TEXT,
    file_format VARCHAR(10) CHECK (file_format IN ('pdf', 'excel', 'json')),
    status VARCHAR(50) DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'error')),
    metadata JSONB,
    CONSTRAINT valid_report_period CHECK (period_start <= period_end)
);

-- Index
CREATE INDEX idx_reports_company ON reports(company_id);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_period ON reports(period_start, period_end);

-- ============================================================================
-- 7. SUBSCRIPTIONS & BILLING
-- ============================================================================

-- Tabela: subscription_plans
-- Planuri de abonament
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price_monthly NUMERIC(10,2) NOT NULL,
    price_yearly NUMERIC(10,2),
    max_companies INT DEFAULT 1,
    max_users_per_company INT DEFAULT 1,
    max_uploads_per_month INT DEFAULT 10,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================

-- Tabela: subscriptions
-- Abonamente active
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    payment_provider VARCHAR(50),
    payment_provider_subscription_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period ON subscriptions(current_period_start, current_period_end);

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. AUDIT ȘI LOGGING
-- ============================================================================

-- Tabela: activity_logs
-- Audit trail pentru toate acțiunile importante
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_company ON activity_logs(company_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- ============================================================================
-- 9. VALIDARE ȘI CONSTRÂNGERI SUPLIMENTARE
-- ============================================================================

-- Funcție helper pentru validarea echilibrului balanței
CREATE OR REPLACE FUNCTION validate_trial_balance_equilibrium(import_uuid UUID)
RETURNS TABLE(is_valid BOOLEAN, error_code VARCHAR, error_message TEXT) AS $$
DECLARE
    total_opening_debit NUMERIC;
    total_opening_credit NUMERIC;
    total_debit_turnover NUMERIC;
    total_credit_turnover NUMERIC;
    total_closing_debit NUMERIC;
    total_closing_credit NUMERIC;
    tolerance NUMERIC := 1.00; -- Toleranță 1 RON
BEGIN
    -- Calculează totaluri
    SELECT 
        SUM(opening_debit),
        SUM(opening_credit),
        SUM(debit_turnover),
        SUM(credit_turnover),
        SUM(closing_debit),
        SUM(closing_credit)
    INTO 
        total_opening_debit,
        total_opening_credit,
        total_debit_turnover,
        total_credit_turnover,
        total_closing_debit,
        total_closing_credit
    FROM trial_balance_accounts
    WHERE import_id = import_uuid;
    
    -- Verificare solduri inițiale
    IF ABS(total_opening_debit - total_opening_credit) > tolerance THEN
        RETURN QUERY SELECT false, 'OPENING_BALANCE_MISMATCH'::VARCHAR, 
            'Eroare: totalul soldurilor inițiale debitoare ≠ totalul soldurilor inițiale creditoare.'::TEXT;
        RETURN;
    END IF;
    
    -- Verificare rulaje
    IF ABS(total_debit_turnover - total_credit_turnover) > tolerance THEN
        RETURN QUERY SELECT false, 'TURNOVER_MISMATCH'::VARCHAR,
            'Eroare: totalul rulajelor debitoare ≠ totalul rulajelor creditoare.'::TEXT;
        RETURN;
    END IF;
    
    -- Verificare solduri finale
    IF ABS(total_closing_debit - total_closing_credit) > tolerance THEN
        RETURN QUERY SELECT false, 'CLOSING_BALANCE_MISMATCH'::VARCHAR,
            'Eroare: totalul soldurilor finale debitoare ≠ totalul soldurilor finale creditoare.'::TEXT;
        RETURN;
    END IF;
    
    -- Totul este OK
    RETURN QUERY SELECT true, 'VALID'::VARCHAR, 'Balanța este echilibrată.'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTARII ȘI DOCUMENTAȚIE
-- ============================================================================

COMMENT ON TABLE users IS 'Utilizatori autentificați prin Clerk, sincronizați în baza de date locală';
COMMENT ON TABLE companies IS 'Entități juridice pentru care se fac analize financiare';
COMMENT ON TABLE company_users IS 'Relație many-to-many între utilizatori și companii cu roluri specifice';
COMMENT ON TABLE trial_balance_imports IS 'Sesiuni de upload pentru balanțe de verificare';
COMMENT ON TABLE trial_balance_accounts IS 'Linii individuale din balanțe, normalizate la 8 coloane standard';
COMMENT ON TABLE chart_of_accounts IS 'Plan de conturi normalizat (global sau per companie)';
COMMENT ON TABLE financial_statements IS 'Situații financiare generate (Bilanț, P&L, Cash Flow)';
COMMENT ON TABLE kpi_definitions IS 'Definiții și formule pentru indicatori KPI';
COMMENT ON TABLE kpi_values IS 'Valori calculate ale KPI-urilor pe perioade specifice';
COMMENT ON TABLE reports IS 'Rapoarte generate în format PDF/Excel';
COMMENT ON TABLE subscriptions IS 'Abonamente active pentru companii';
COMMENT ON TABLE activity_logs IS 'Audit trail pentru toate acțiunile importante din sistem';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
