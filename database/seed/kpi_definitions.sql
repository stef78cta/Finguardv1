-- ============================================================================
-- FinGuard - KPI Definitions Seed Data
-- Indicatori Cheie de Performanță (KPI) pentru analiza financiară
-- Version: 1.0
-- Date: 2026-01-10
-- ============================================================================

-- Descriere:
-- Acest fișier conține definiții pentru 25+ KPI-uri esențiale folosite în
-- analiza financiară a companiilor românești. Formulele sunt stocate în format
-- JSONB pentru flexibilitate maximă.

-- ============================================================================
-- 1. INDICATORI DE LICHIDITATE (Liquidity Ratios)
-- ============================================================================

INSERT INTO kpi_definitions (code, name, category, formula, unit, description, display_order, is_active) VALUES

('current_ratio', 'Rata Lichidității Curente', 'liquidity', 
 '{"numerator": "current_assets", "denominator": "current_liabilities", "formula": "current_assets / current_liabilities"}',
 'ratio',
 'Măsoară capacitatea companiei de a-și plăti obligațiile pe termen scurt. Valori > 1 indică o poziție solidă de lichiditate. Valori optime: 1.5 - 3.0',
 10, true),

('quick_ratio', 'Rata Lichidității Acide (Quick Ratio)', 'liquidity',
 '{"numerator": "(current_assets - inventory)", "denominator": "current_liabilities", "formula": "(current_assets - inventory) / current_liabilities"}',
 'ratio',
 'Măsoară capacitatea de plată pe termen scurt, excluzând stocurile (care sunt mai puțin lichide). Valori optime: 0.8 - 1.5',
 11, true),

('cash_ratio', 'Rata Lichidității Imediate (Cash Ratio)', 'liquidity',
 '{"numerator": "cash_and_equivalents", "denominator": "current_liabilities", "formula": "cash_and_equivalents / current_liabilities"}',
 'ratio',
 'Măsoară capacitatea de plată imediată folosind doar disponibilități bănești. Valori optime: 0.2 - 0.5',
 12, true),

('working_capital', 'Capital de Lucru (Working Capital)', 'liquidity',
 '{"formula": "current_assets - current_liabilities"}',
 'currency',
 'Diferența între activele curente și datoriile pe termen scurt. Un capital de lucru pozitiv indică solvabilitate.',
 13, true);

-- ============================================================================
-- 2. INDICATORI DE PROFITABILITATE (Profitability Ratios)
-- ============================================================================

INSERT INTO kpi_definitions (code, name, category, formula, unit, description, display_order, is_active) VALUES

('gross_margin', 'Marja Brută (Gross Profit Margin)', 'profitability',
 '{"numerator": "(revenue - cogs)", "denominator": "revenue", "formula": "((revenue - cogs) / revenue) * 100"}',
 'percentage',
 'Procentul din venituri rămas după deducerea costului bunurilor vândute. Valori mai mari indică eficiență operațională superioară. Valori optime: 20-50% (variază pe industrii)',
 20, true),

('operating_margin', 'Marja Operațională (Operating Margin)', 'profitability',
 '{"numerator": "operating_income", "denominator": "revenue", "formula": "(operating_income / revenue) * 100"}',
 'percentage',
 'Profitul operațional ca procent din venituri. Măsoară eficiența operațiunilor core. Valori optime: 10-20%',
 21, true),

('net_margin', 'Marja Netă de Profit (Net Profit Margin)', 'profitability',
 '{"numerator": "net_income", "denominator": "revenue", "formula": "(net_income / revenue) * 100"}',
 'percentage',
 'Profitul net ca procent din venituri totale. Indică profitabilitatea generală. Valori optime: 5-20%',
 22, true),

('roa', 'Rentabilitatea Activelor (ROA - Return on Assets)', 'profitability',
 '{"numerator": "net_income", "denominator": "average_total_assets", "formula": "(net_income / average_total_assets) * 100"}',
 'percentage',
 'Măsoară eficiența utilizării activelor pentru generarea de profit. Valori optime: 5-20% (variază pe industrii)',
 23, true),

('roe', 'Rentabilitatea Capitalurilor Proprii (ROE - Return on Equity)', 'profitability',
 '{"numerator": "net_income", "denominator": "average_shareholders_equity", "formula": "(net_income / average_shareholders_equity) * 100"}',
 'percentage',
 'Măsoară rentabilitatea investiției acționarilor. Un indicator cheie pentru investitori. Valori optime: 15-25%',
 24, true),

('roic', 'Rentabilitatea Capitalului Investit (ROIC)', 'profitability',
 '{"numerator": "nopat", "denominator": "invested_capital", "formula": "(nopat / invested_capital) * 100", "nopat": "operating_income * (1 - tax_rate)", "invested_capital": "total_assets - current_liabilities"}',
 'percentage',
 'Măsoară eficiența alocării capitalului. Valori optime: > 10%',
 25, true),

('ebitda_margin', 'Marja EBITDA', 'profitability',
 '{"numerator": "ebitda", "denominator": "revenue", "formula": "(ebitda / revenue) * 100", "ebitda": "operating_income + depreciation + amortization"}',
 'percentage',
 'Profitabilitate operațională înainte de amortizări și taxe. Util pentru comparații între companii. Valori optime: 10-30%',
 26, true);

-- ============================================================================
-- 3. INDICATORI DE ÎNDATORARE (Leverage/Solvency Ratios)
-- ============================================================================

INSERT INTO kpi_definitions (code, name, category, formula, unit, description, display_order, is_active) VALUES

('debt_to_equity', 'Rata Datoriei la Capitaluri Proprii (D/E Ratio)', 'leverage',
 '{"numerator": "total_liabilities", "denominator": "shareholders_equity", "formula": "total_liabilities / shareholders_equity"}',
 'ratio',
 'Măsoară nivelul de îndatorare relativă. Valori < 1 indică structură financiară conservatoare. Valori optime: 0.3-1.5',
 30, true),

('debt_ratio', 'Rata Datoriei (Debt Ratio)', 'leverage',
 '{"numerator": "total_liabilities", "denominator": "total_assets", "formula": "(total_liabilities / total_assets) * 100"}',
 'percentage',
 'Procentul din active finanțat prin datorii. Valori < 50% sunt considerate sănătoase. Valori optime: 30-60%',
 31, true),

('equity_ratio', 'Rata Capitalurilor Proprii (Equity Ratio)', 'leverage',
 '{"numerator": "shareholders_equity", "denominator": "total_assets", "formula": "(shareholders_equity / total_assets) * 100"}',
 'percentage',
 'Procentul din active finanțat din capitaluri proprii. Complement la Debt Ratio. Valori optime: 40-70%',
 32, true),

('interest_coverage', 'Rata Acoperirii Dobânzilor (Interest Coverage)', 'leverage',
 '{"numerator": "operating_income", "denominator": "interest_expense", "formula": "operating_income / interest_expense"}',
 'times',
 'De câte ori poate compania plăti dobânzile din profitul operațional. Valori > 2.5 indică capacitate sănătoasă de plată. Valori optime: > 3',
 33, true),

('solvency_ratio', 'Rata de Solvabilitate', 'leverage',
 '{"numerator": "net_income_after_tax + depreciation", "denominator": "short_term_liabilities + long_term_liabilities", "formula": "((net_income_after_tax + depreciation) / (short_term_liabilities + long_term_liabilities)) * 100"}',
 'percentage',
 'Măsoară capacitatea companiei de a-și îndeplini toate obligațiile pe termen lung. Valori optime: > 20%',
 34, true);

-- ============================================================================
-- 4. INDICATORI DE EFICIENȚĂ (Efficiency/Activity Ratios)
-- ============================================================================

INSERT INTO kpi_definitions (code, name, category, formula, unit, description, display_order, is_active) VALUES

('asset_turnover', 'Rotația Activelor (Asset Turnover)', 'efficiency',
 '{"numerator": "revenue", "denominator": "average_total_assets", "formula": "revenue / average_total_assets"}',
 'times',
 'De câte ori pe an compania generează venituri egale cu valoarea activelor sale. Valori mai mari = mai eficient. Valori optime: 0.5-2.0 (variază pe industrii)',
 40, true),

('inventory_turnover', 'Rotația Stocurilor (Inventory Turnover)', 'efficiency',
 '{"numerator": "cogs", "denominator": "average_inventory", "formula": "cogs / average_inventory"}',
 'times',
 'De câte ori pe an compania își reînnoiește stocul. Valori mai mari indică gestionare eficientă. Valori optime: 5-10 ori/an (variază pe industrii)',
 41, true),

('days_sales_outstanding', 'Zile Vânzări în Așteptare (DSO - Days Sales Outstanding)', 'efficiency',
 '{"numerator": "average_accounts_receivable", "denominator": "revenue_per_day", "formula": "(average_accounts_receivable / revenue_per_day)", "revenue_per_day": "revenue / 365"}',
 'days',
 'Numărul mediu de zile pentru încasarea creanțelor. Valori mai mici = colectare mai rapidă. Valori optime: 30-60 zile',
 42, true),

('days_payable_outstanding', 'Zile Furnizori (DPO - Days Payable Outstanding)', 'efficiency',
 '{"numerator": "average_accounts_payable", "denominator": "cogs_per_day", "formula": "(average_accounts_payable / cogs_per_day)", "cogs_per_day": "cogs / 365"}',
 'days',
 'Numărul mediu de zile pentru plata furnizorilor. Valori mai mari pot indica negociere bună, dar atenție la relațiile cu furnizorii. Valori optime: 45-90 zile',
 43, true),

('cash_conversion_cycle', 'Ciclul de Conversie a Numerarului (CCC)', 'efficiency',
 '{"formula": "days_inventory_outstanding + days_sales_outstanding - days_payable_outstanding"}',
 'days',
 'Timpul necesar pentru convertirea investițiilor în stocuri și creanțe înapoi în numerar. Valori mai mici = management mai eficient. Valori optime: < 90 zile',
 44, true),

('fixed_asset_turnover', 'Rotația Activelor Fixe', 'efficiency',
 '{"numerator": "revenue", "denominator": "average_fixed_assets", "formula": "revenue / average_fixed_assets"}',
 'times',
 'Măsoară eficiența utilizării activelor fixe pentru generarea de venituri. Valori optime: 2-6 ori (variază pe industrii)',
 45, true),

('receivables_turnover', 'Rotația Creanțelor', 'efficiency',
 '{"numerator": "revenue", "denominator": "average_accounts_receivable", "formula": "revenue / average_accounts_receivable"}',
 'times',
 'De câte ori pe an compania încasează creanțele. Valori mai mari = colectare mai eficientă. Valori optime: 6-12 ori/an',
 46, true);

-- ============================================================================
-- 5. INDICATORI DE CREȘTERE (Growth Ratios)
-- ============================================================================

INSERT INTO kpi_definitions (code, name, category, formula, unit, description, display_order, is_active) VALUES

('revenue_growth', 'Creșterea Veniturilor (Revenue Growth)', 'other',
 '{"numerator": "(current_revenue - previous_revenue)", "denominator": "previous_revenue", "formula": "((current_revenue - previous_revenue) / previous_revenue) * 100"}',
 'percentage',
 'Rata de creștere a veniturilor față de perioada anterioară. Indicat creștere organică.',
 50, true),

('profit_growth', 'Creșterea Profitului (Profit Growth)', 'other',
 '{"numerator": "(current_profit - previous_profit)", "denominator": "previous_profit", "formula": "((current_profit - previous_profit) / previous_profit) * 100"}',
 'percentage',
 'Rata de creștere a profitului net față de perioada anterioară.',
 51, true),

('asset_growth', 'Creșterea Activelor (Asset Growth)', 'other',
 '{"numerator": "(current_assets - previous_assets)", "denominator": "previous_assets", "formula": "((current_assets - previous_assets) / previous_assets) * 100"}',
 'percentage',
 'Rata de creștere a activelor totale. Indică expansiune.',
 52, true);

-- ============================================================================
-- 6. INDICATORI SPECIFICI ROMÂNIA
-- ============================================================================

INSERT INTO kpi_definitions (code, name, category, formula, unit, description, display_order, is_active) VALUES

('productivity_per_employee', 'Productivitatea pe Angajat', 'other',
 '{"numerator": "revenue", "denominator": "number_of_employees", "formula": "revenue / number_of_employees"}',
 'currency',
 'Venituri generate de fiecare angajat. Indică eficiența forței de muncă.',
 60, true),

('profit_per_employee', 'Profit pe Angajat', 'other',
 '{"numerator": "net_income", "denominator": "number_of_employees", "formula": "net_income / number_of_employees"}',
 'currency',
 'Profitul net generat de fiecare angajat. Indicator de rentabilitate a forței de muncă.',
 61, true),

('tax_burden', 'Povara Fiscală (Tax Burden)', 'other',
 '{"numerator": "total_taxes", "denominator": "revenue", "formula": "(total_taxes / revenue) * 100"}',
 'percentage',
 'Procentul din venituri reprezentat de taxe și impozite. Specific pentru analiza fiscală.',
 62, true);

-- ============================================================================
-- COMENTARII ȘI METADATA
-- ============================================================================

COMMENT ON TABLE kpi_definitions IS 'Definiții standard pentru indicatori KPI folosiți în analiza financiară';

-- Note importante despre formule:
-- 1. Toate formulele sunt în format JSONB pentru flexibilitate
-- 2. "numerator" și "denominator" definesc componente
-- 3. "formula" este expresia matematică
-- 4. Câmpurile calculate intermediare pot fi definite (ex: "nopat", "revenue_per_day")
-- 5. Unit poate fi: ratio, percentage, days, times, currency

-- Valori recomandate pentru evaluare:
-- current_ratio: > 1.5 (excelent), 1-1.5 (bun), < 1 (problemă)
-- quick_ratio: > 1 (excelent), 0.5-1 (bun), < 0.5 (problemă)
-- debt_to_equity: < 1 (conservator), 1-2 (moderat), > 2 (agresiv)
-- roa: > 15% (excelent), 5-15% (bun), < 5% (slab)
-- roe: > 20% (excelent), 10-20% (bun), < 10% (slab)
-- gross_margin: > 40% (excelent), 20-40% (bun), < 20% (slab)
-- asset_turnover: > 2 (eficient), 1-2 (normal), < 1 (ineficient)

-- ============================================================================
-- VERIFICARE SEED DATA
-- ============================================================================

-- Query pentru verificare: ar trebui să returneze 25 KPI-uri active
SELECT 
    category,
    COUNT(*) as kpi_count
FROM kpi_definitions
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- Query pentru listare completă
SELECT 
    code,
    name,
    category,
    unit,
    display_order
FROM kpi_definitions
WHERE is_active = true
ORDER BY category, display_order;

-- ============================================================================
-- END OF KPI DEFINITIONS SEED DATA
-- ============================================================================
