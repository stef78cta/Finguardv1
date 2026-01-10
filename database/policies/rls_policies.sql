-- ============================================================================
-- FinGuard - Row Level Security (RLS) Policies
-- PostgreSQL + Supabase
-- Version: 1.0
-- Date: 2026-01-10
-- ============================================================================

-- Descriere:
-- Acest fișier conține toate politicile RLS pentru protejarea datelor la nivel de rând.
-- Fiecare utilizator poate accesa doar datele companiilor la care are acces.

-- ============================================================================
-- FUNCȚII HELPER PENTRU RLS
-- ============================================================================

/**
 * Obține user_id din tabela users bazat pe Clerk user ID din JWT
 * Această funcție este folosită în toate politicile RLS
 */
CREATE OR REPLACE FUNCTION auth.get_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM users 
        WHERE clerk_user_id = auth.jwt() ->> 'sub'
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Verifică dacă utilizatorul curent are acces la o companie specifică
 * @param company_uuid - ID-ul companiei de verificat
 * @returns boolean - true dacă utilizatorul are acces
 */
CREATE OR REPLACE FUNCTION auth.user_has_company_access(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = company_uuid
        AND user_id = auth.get_user_id()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Verifică dacă utilizatorul curent are un anumit rol pentru o companie
 * @param company_uuid - ID-ul companiei
 * @param required_role - Rolul necesar (owner, admin, member, viewer)
 * @returns boolean - true dacă utilizatorul are rolul necesar sau superior
 */
CREATE OR REPLACE FUNCTION auth.user_has_company_role(company_uuid UUID, required_role VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
    role_hierarchy JSONB := '{"owner": 4, "admin": 3, "member": 2, "viewer": 1}';
BEGIN
    SELECT role INTO user_role
    FROM company_users
    WHERE company_id = company_uuid
    AND user_id = auth.get_user_id()
    LIMIT 1;
    
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- Verifică ierarhia rolurilor
    RETURN (role_hierarchy ->> user_role)::INT >= (role_hierarchy ->> required_role)::INT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Verifică dacă utilizatorul este admin sau super_admin
 */
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.get_user_id()
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 1. POLITICI RLS PENTRU TABELA: users
-- ============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Utilizatorii pot citi doar propriul profil sau sunt admini
CREATE POLICY "Users can view own profile or are admins"
    ON users FOR SELECT
    USING (
        id = auth.get_user_id()
        OR auth.is_admin()
    );

-- Policy: Utilizatorii pot actualiza doar propriul profil
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (id = auth.get_user_id())
    WITH CHECK (id = auth.get_user_id());

-- Policy: Doar adminii pot crea utilizatori (via webhook Clerk)
CREATE POLICY "Admins can create users"
    ON users FOR INSERT
    WITH CHECK (auth.is_admin());

-- Policy: Doar super_admin poate șterge utilizatori
CREATE POLICY "Super admins can delete users"
    ON users FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.get_user_id()
            AND role = 'super_admin'
        )
    );

-- ============================================================================
-- 2. POLITICI RLS PENTRU TABELA: companies
-- ============================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Utilizatorii pot vedea doar companiile la care au acces
CREATE POLICY "Users can view accessible companies"
    ON companies FOR SELECT
    USING (
        auth.user_has_company_access(id)
        OR auth.is_admin()
    );

-- Policy: Utilizatorii pot crea noi companii
CREATE POLICY "Users can create companies"
    ON companies FOR INSERT
    WITH CHECK (true); -- Orice utilizator autentificat poate crea o companie

-- Policy: Doar owner sau admin pot actualiza compania
CREATE POLICY "Owners and admins can update companies"
    ON companies FOR UPDATE
    USING (
        auth.user_has_company_role(id, 'admin')
        OR auth.is_admin()
    )
    WITH CHECK (
        auth.user_has_company_role(id, 'admin')
        OR auth.is_admin()
    );

-- Policy: Doar owner sau super_admin pot șterge compania
CREATE POLICY "Owners and super admins can delete companies"
    ON companies FOR DELETE
    USING (
        auth.user_has_company_role(id, 'owner')
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.get_user_id()
            AND role = 'super_admin'
        )
    );

-- ============================================================================
-- 3. POLITICI RLS PENTRU TABELA: company_users
-- ============================================================================

ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Policy: Utilizatorii pot vedea membrii companiilor lor
CREATE POLICY "Users can view company members"
    ON company_users FOR SELECT
    USING (
        auth.user_has_company_access(company_id)
        OR auth.is_admin()
    );

-- Policy: Owner sau admin pot adăuga membri
CREATE POLICY "Admins can add company members"
    ON company_users FOR INSERT
    WITH CHECK (
        auth.user_has_company_role(company_id, 'admin')
        OR auth.is_admin()
    );

-- Policy: Owner sau admin pot actualiza roluri
CREATE POLICY "Admins can update member roles"
    ON company_users FOR UPDATE
    USING (
        auth.user_has_company_role(company_id, 'admin')
        OR auth.is_admin()
    )
    WITH CHECK (
        auth.user_has_company_role(company_id, 'admin')
        OR auth.is_admin()
    );

-- Policy: Owner sau admin pot elimina membri (dar nu pot elimina owner-ul)
CREATE POLICY "Admins can remove members"
    ON company_users FOR DELETE
    USING (
        (auth.user_has_company_role(company_id, 'admin') AND role != 'owner')
        OR auth.is_admin()
    );

-- ============================================================================
-- 4. POLITICI RLS PENTRU TABELA: trial_balance_imports
-- ============================================================================

ALTER TABLE trial_balance_imports ENABLE ROW LEVEL SECURITY;

-- Policy: Utilizatorii pot vedea importurile companiilor lor
CREATE POLICY "Users can view company imports"
    ON trial_balance_imports FOR SELECT
    USING (
        auth.user_has_company_access(company_id)
        OR auth.is_admin()
    );

-- Policy: Member și superior pot crea importuri
CREATE POLICY "Members can create imports"
    ON trial_balance_imports FOR INSERT
    WITH CHECK (
        auth.user_has_company_role(company_id, 'member')
        OR auth.is_admin()
    );

-- Policy: Utilizatorii care au creat importul sau admin pot actualiza
CREATE POLICY "Upload owner or admins can update imports"
    ON trial_balance_imports FOR UPDATE
    USING (
        (uploaded_by = auth.get_user_id() OR auth.user_has_company_role(company_id, 'admin'))
        OR auth.is_admin()
    )
    WITH CHECK (
        (uploaded_by = auth.get_user_id() OR auth.user_has_company_role(company_id, 'admin'))
        OR auth.is_admin()
    );

-- Policy: Utilizatorii care au creat importul sau admin pot șterge
CREATE POLICY "Upload owner or admins can delete imports"
    ON trial_balance_imports FOR DELETE
    USING (
        (uploaded_by = auth.get_user_id() OR auth.user_has_company_role(company_id, 'admin'))
        OR auth.is_admin()
    );

-- ============================================================================
-- 5. POLITICI RLS PENTRU TABELA: trial_balance_accounts
-- ============================================================================

ALTER TABLE trial_balance_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Utilizatorii pot vedea conturile din importurile companiilor lor
CREATE POLICY "Users can view trial balance accounts"
    ON trial_balance_accounts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trial_balance_imports tbi
            WHERE tbi.id = trial_balance_accounts.import_id
            AND auth.user_has_company_access(tbi.company_id)
        )
        OR auth.is_admin()
    );

-- Policy: Member și superior pot crea conturi în importuri
CREATE POLICY "Members can create trial balance accounts"
    ON trial_balance_accounts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trial_balance_imports tbi
            WHERE tbi.id = trial_balance_accounts.import_id
            AND (auth.user_has_company_role(tbi.company_id, 'member') OR auth.is_admin())
        )
    );

-- Policy: Admin poate actualiza conturi
CREATE POLICY "Admins can update trial balance accounts"
    ON trial_balance_accounts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM trial_balance_imports tbi
            WHERE tbi.id = trial_balance_accounts.import_id
            AND (auth.user_has_company_role(tbi.company_id, 'admin') OR auth.is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trial_balance_imports tbi
            WHERE tbi.id = trial_balance_accounts.import_id
            AND (auth.user_has_company_role(tbi.company_id, 'admin') OR auth.is_admin())
        )
    );

-- Policy: Admin poate șterge conturi
CREATE POLICY "Admins can delete trial balance accounts"
    ON trial_balance_accounts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM trial_balance_imports tbi
            WHERE tbi.id = trial_balance_accounts.import_id
            AND (auth.user_has_company_role(tbi.company_id, 'admin') OR auth.is_admin())
        )
    );

-- ============================================================================
-- 6. POLITICI RLS PENTRU TABELA: chart_of_accounts
-- ============================================================================

ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Toată lumea poate vedea planul de conturi sistem
CREATE POLICY "Everyone can view system chart of accounts"
    ON chart_of_accounts FOR SELECT
    USING (
        is_system = true
        OR (company_id IS NOT NULL AND auth.user_has_company_access(company_id))
        OR auth.is_admin()
    );

-- Policy: Doar admin poate crea plan de conturi sistem
CREATE POLICY "Admins can create system chart of accounts"
    ON chart_of_accounts FOR INSERT
    WITH CHECK (
        (is_system = true AND auth.is_admin())
        OR (company_id IS NOT NULL AND auth.user_has_company_role(company_id, 'admin'))
    );

-- Policy: Doar admin poate actualiza
CREATE POLICY "Admins can update chart of accounts"
    ON chart_of_accounts FOR UPDATE
    USING (
        (is_system = true AND auth.is_admin())
        OR (company_id IS NOT NULL AND auth.user_has_company_role(company_id, 'admin'))
    )
    WITH CHECK (
        (is_system = true AND auth.is_admin())
        OR (company_id IS NOT NULL AND auth.user_has_company_role(company_id, 'admin'))
    );

-- ============================================================================
-- 7. POLITICI RLS PENTRU TABELA: financial_statements
-- ============================================================================

ALTER TABLE financial_statements ENABLE ROW LEVEL SECURITY;

-- Policy: Utilizatorii pot vedea situațiile financiare ale companiilor lor
CREATE POLICY "Users can view company financial statements"
    ON financial_statements FOR SELECT
    USING (
        auth.user_has_company_access(company_id)
        OR auth.is_admin()
    );

-- Policy: Member și superior pot crea situații financiare
CREATE POLICY "Members can create financial statements"
    ON financial_statements FOR INSERT
    WITH CHECK (
        auth.user_has_company_role(company_id, 'member')
        OR auth.is_admin()
    );

-- ============================================================================
-- 8. POLITICI RLS PENTRU TABELA: kpi_definitions
-- ============================================================================

ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;

-- Policy: Toată lumea poate vedea definițiile KPI
CREATE POLICY "Everyone can view KPI definitions"
    ON kpi_definitions FOR SELECT
    USING (true);

-- Policy: Doar admin poate modifica definițiile KPI
CREATE POLICY "Admins can manage KPI definitions"
    ON kpi_definitions FOR ALL
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- ============================================================================
-- 9. POLITICI RLS PENTRU TABELA: kpi_values
-- ============================================================================

ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;

-- Policy: Utilizatorii pot vedea valorile KPI ale companiilor lor
CREATE POLICY "Users can view company KPI values"
    ON kpi_values FOR SELECT
    USING (
        auth.user_has_company_access(company_id)
        OR auth.is_admin()
    );

-- Policy: Member și superior pot crea valori KPI
CREATE POLICY "Members can create KPI values"
    ON kpi_values FOR INSERT
    WITH CHECK (
        auth.user_has_company_role(company_id, 'member')
        OR auth.is_admin()
    );

-- Policy: Admin poate actualiza valori KPI
CREATE POLICY "Admins can update KPI values"
    ON kpi_values FOR UPDATE
    USING (
        auth.user_has_company_role(company_id, 'admin')
        OR auth.is_admin()
    )
    WITH CHECK (
        auth.user_has_company_role(company_id, 'admin')
        OR auth.is_admin()
    );

-- ============================================================================
-- 10. POLITICI RLS PENTRU TABELA: reports
-- ============================================================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Utilizatorii pot vedea rapoartele companiilor lor
CREATE POLICY "Users can view company reports"
    ON reports FOR SELECT
    USING (
        auth.user_has_company_access(company_id)
        OR auth.is_admin()
    );

-- Policy: Member și superior pot crea rapoarte
CREATE POLICY "Members can create reports"
    ON reports FOR INSERT
    WITH CHECK (
        auth.user_has_company_role(company_id, 'member')
        OR auth.is_admin()
    );

-- Policy: Utilizatorii care au generat raportul sau admin pot șterge
CREATE POLICY "Report creator or admins can delete reports"
    ON reports FOR DELETE
    USING (
        (generated_by = auth.get_user_id() OR auth.user_has_company_role(company_id, 'admin'))
        OR auth.is_admin()
    );

-- ============================================================================
-- 11. POLITICI RLS PENTRU TABELA: subscriptions
-- ============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Utilizatorii pot vedea abonamentele companiilor lor
CREATE POLICY "Users can view company subscriptions"
    ON subscriptions FOR SELECT
    USING (
        auth.user_has_company_access(company_id)
        OR auth.is_admin()
    );

-- Policy: Owner sau admin pot gestiona abonamentele
CREATE POLICY "Owners can manage subscriptions"
    ON subscriptions FOR ALL
    USING (
        auth.user_has_company_role(company_id, 'owner')
        OR auth.is_admin()
    )
    WITH CHECK (
        auth.user_has_company_role(company_id, 'owner')
        OR auth.is_admin()
    );

-- ============================================================================
-- 12. POLITICI RLS PENTRU TABELA: subscription_plans
-- ============================================================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Toată lumea poate vedea planurile active
CREATE POLICY "Everyone can view active subscription plans"
    ON subscription_plans FOR SELECT
    USING (is_active = true OR auth.is_admin());

-- Policy: Doar admin poate gestiona planurile
CREATE POLICY "Admins can manage subscription plans"
    ON subscription_plans FOR ALL
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

-- ============================================================================
-- 13. POLITICI RLS PENTRU TABELA: activity_logs
-- ============================================================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Utilizatorii pot vedea propriile log-uri sau log-urile companiilor lor
CREATE POLICY "Users can view relevant activity logs"
    ON activity_logs FOR SELECT
    USING (
        user_id = auth.get_user_id()
        OR (company_id IS NOT NULL AND auth.user_has_company_access(company_id))
        OR auth.is_admin()
    );

-- Policy: Sistemul poate crea log-uri pentru orice utilizator
CREATE POLICY "System can create activity logs"
    ON activity_logs FOR INSERT
    WITH CHECK (true);

-- Policy: Doar super_admin poate șterge log-uri
CREATE POLICY "Super admins can delete activity logs"
    ON activity_logs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.get_user_id()
            AND role = 'super_admin'
        )
    );

-- ============================================================================
-- 14. POLITICI RLS PENTRU TABELE DERIVATE (balance_sheet_lines, etc.)
-- ============================================================================

-- Balance Sheet Lines
ALTER TABLE balance_sheet_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view balance sheet lines"
    ON balance_sheet_lines FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM financial_statements fs
            WHERE fs.id = balance_sheet_lines.statement_id
            AND auth.user_has_company_access(fs.company_id)
        )
        OR auth.is_admin()
    );

CREATE POLICY "Members can create balance sheet lines"
    ON balance_sheet_lines FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM financial_statements fs
            WHERE fs.id = balance_sheet_lines.statement_id
            AND (auth.user_has_company_role(fs.company_id, 'member') OR auth.is_admin())
        )
    );

-- Income Statement Lines
ALTER TABLE income_statement_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view income statement lines"
    ON income_statement_lines FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM financial_statements fs
            WHERE fs.id = income_statement_lines.statement_id
            AND auth.user_has_company_access(fs.company_id)
        )
        OR auth.is_admin()
    );

CREATE POLICY "Members can create income statement lines"
    ON income_statement_lines FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM financial_statements fs
            WHERE fs.id = income_statement_lines.statement_id
            AND (auth.user_has_company_role(fs.company_id, 'member') OR auth.is_admin())
        )
    );

-- Cash Flow Lines
ALTER TABLE cash_flow_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cash flow lines"
    ON cash_flow_lines FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM financial_statements fs
            WHERE fs.id = cash_flow_lines.statement_id
            AND auth.user_has_company_access(fs.company_id)
        )
        OR auth.is_admin()
    );

CREATE POLICY "Members can create cash flow lines"
    ON cash_flow_lines FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM financial_statements fs
            WHERE fs.id = cash_flow_lines.statement_id
            AND (auth.user_has_company_role(fs.company_id, 'member') OR auth.is_admin())
        )
    );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage pe funcțiile auth
GRANT EXECUTE ON FUNCTION auth.get_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_has_company_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_has_company_role(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_admin() TO authenticated;

-- ============================================================================
-- COMENTARII DOCUMENTAȚIE
-- ============================================================================

COMMENT ON FUNCTION auth.get_user_id() IS 
'Obține user_id din tabela users bazat pe Clerk user ID din JWT token';

COMMENT ON FUNCTION auth.user_has_company_access(UUID) IS 
'Verifică dacă utilizatorul curent are acces la o companie specifică prin company_users';

COMMENT ON FUNCTION auth.user_has_company_role(UUID, VARCHAR) IS 
'Verifică dacă utilizatorul curent are un rol specific sau superior pentru o companie';

COMMENT ON FUNCTION auth.is_admin() IS 
'Verifică dacă utilizatorul curent este admin sau super_admin';

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================
