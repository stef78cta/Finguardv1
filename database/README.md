# FinGuard - Database Setup Documentation

## 📋 Overview

Această documentație descrie schema bazei de date FinGuard și procesul complet de setup pentru medii locale și de producție folosind Supabase.

**Versiune:** 1.0  
**Data:** 10 Ianuarie 2026  
**PostgreSQL:** 15.x  
**Supabase:** Latest

---

## 🗄️ Structura Bazei de Date

### Organizare pe Categorii

```
database/
├── schema.sql                      # Schema completă (toate tabelele)
├── policies/
│   └── rls_policies.sql           # Row Level Security policies
├── seed/
│   ├── kpi_definitions.sql        # 25+ KPI-uri standard
│   └── chart_of_accounts.sql      # Plan de conturi RO
└── README.md                       # Acest fișier
```

### Tabele Principale

#### 1. **Identitate și Acces**
- `users` - Utilizatori sincronizați cu Clerk
- `companies` - Entități juridice analizate
- `company_users` - Relație many-to-many cu roluri (owner/admin/member/viewer)

#### 2. **Importuri Balanță**
- `trial_balance_imports` - Sesiuni de upload
- `trial_balance_accounts` - Linii din balanță (8 coloane standard normalizate)

#### 3. **Plan Contabil**
- `chart_of_accounts` - Plan de conturi normalizat (sistem și per companie)
- `account_mappings` - Mapare conturi balanță → structură financiară

#### 4. **Date Financiare Derivate**
- `financial_statements` - Situații financiare generate
- `balance_sheet_lines` - Linii bilanț
- `income_statement_lines` - Linii profit & pierdere
- `cash_flow_lines` - Linii flux de numerar

#### 5. **KPI-uri**
- `kpi_definitions` - Definiții și formule (25+ indicatori)
- `kpi_values` - Valori calculate pe perioade

#### 6. **Rapoarte**
- `reports` - Rapoarte generate (PDF/Excel)
- `subscriptions` - Abonamente
- `subscription_plans` - Planuri de abonament

#### 7. **Audit**
- `activity_logs` - Audit trail complet

---

## 🚀 Setup Rapid

### Opțiunea 1: Supabase Cloud (Recomandat pentru Producție)

#### Pasul 1: Creează Proiect Supabase

```bash
# 1. Mergi la https://supabase.com
# 2. Creează cont nou sau autentifică-te
# 3. Click "New Project"
# 4. Completează:
#    - Project Name: finguard-production (sau finguard-dev)
#    - Database Password: [generează o parolă puternică]
#    - Region: Frankfurt (eu-central-1) - cel mai aproape de România
#    - Pricing Plan: Free (pentru dev) sau Pro (pentru producție)
```

#### Pasul 2: Obține Credențiale

```bash
# Din dashboard-ul Supabase:
# 1. Click pe "Settings" → "API"
# 2. Copiază:
#    - Project URL
#    - anon/public key
#    - service_role key (SECRET - nu commitați în git!)
```

#### Pasul 3: Configurează Environment Variables

```bash
# Creează/editează .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Pasul 4: Run Migrations via Supabase SQL Editor

```sql
-- 1. Deschide SQL Editor în Supabase Dashboard
-- 2. Copiază conținutul din schema.sql și execută
-- 3. Copiază conținutul din policies/rls_policies.sql și execută
-- 4. Copiază conținutul din seed/kpi_definitions.sql și execută
-- 5. Copiază conținutul din seed/chart_of_accounts.sql și execută
```

**SAU** folosește Supabase CLI:

```bash
# Instalează Supabase CLI
npm install -g supabase

# Login în Supabase
supabase login

# Link proiectul
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

---

### Opțiunea 2: Supabase Local (Pentru Development)

#### Pasul 1: Instalare Supabase CLI

```bash
# Windows (folosind Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Sau descarcă direct de la:
# https://github.com/supabase/cli/releases
```

#### Pasul 2: Inițializează Proiect Local

```bash
# În root-ul proiectului
supabase init

# Start Supabase local
supabase start

# Vei primi output cu:
# - API URL: http://localhost:54321
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio URL: http://localhost:54323
# - anon key
# - service_role key
```

#### Pasul 3: Setup Local Database

```bash
# Copiază fișierele SQL în directorul migrations
mkdir -p supabase/migrations

# Creează migrations
cp database/schema.sql supabase/migrations/20260110000001_initial_schema.sql
cp database/policies/rls_policies.sql supabase/migrations/20260110000002_rls_policies.sql
cp database/seed/kpi_definitions.sql supabase/migrations/20260110000003_seed_kpis.sql
cp database/seed/chart_of_accounts.sql supabase/migrations/20260110000004_seed_chart.sql

# Apply migrations
supabase db reset
```

#### Pasul 4: Configurează .env.local pentru Local

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key din output-ul supabase start]
SUPABASE_SERVICE_ROLE_KEY=[service_role key din output]
```

---

## 🔐 Row Level Security (RLS)

### Principii de Securitate

Toate tabelele au RLS activat cu politici granulare:

1. **Users** - pot vedea doar propriul profil sau sunt admini
2. **Companies** - utilizatorii văd doar companiile la care au acces
3. **Company Data** - acces controlat prin `company_users` + roluri
4. **Roluri ierarhice:**
   - `owner` (4) > `admin` (3) > `member` (2) > `viewer` (1)

### Funcții Helper RLS

```sql
-- Verifică dacă user-ul curent are acces la o companie
SELECT auth.user_has_company_access('company-uuid');

-- Verifică dacă user-ul are rol specific
SELECT auth.user_has_company_role('company-uuid', 'admin');

-- Verifică dacă user-ul este admin sistem
SELECT auth.is_admin();
```

### Testare RLS Local

```sql
-- Autentifică-te ca un utilizator specific
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "clerk-user-id-here"}';

-- Testează queries
SELECT * FROM companies; -- Ar trebui să returneze doar companiile utilizatorului
```

---

## 📊 Seed Data

### KPI Definitions (25+ Indicatori)

Fișierul `seed/kpi_definitions.sql` include:

**Lichiditate (4 KPI-uri):**
- Current Ratio, Quick Ratio, Cash Ratio, Working Capital

**Profitabilitate (7 KPI-uri):**
- Gross Margin, Operating Margin, Net Margin, ROA, ROE, ROIC, EBITDA Margin

**Îndatorare (5 KPI-uri):**
- Debt-to-Equity, Debt Ratio, Equity Ratio, Interest Coverage, Solvency Ratio

**Eficiență (7 KPI-uri):**
- Asset Turnover, Inventory Turnover, DSO, DPO, Cash Conversion Cycle, Fixed Asset Turnover, Receivables Turnover

**Altele (3+ KPI-uri):**
- Revenue Growth, Profit Growth, Asset Growth, Productivity per Employee, etc.

### Chart of Accounts (Plan Conturi RO)

Planul de conturi conform **OMFP 1802/2014**:

- **Clasa 1:** Capitaluri (30+ conturi)
- **Clasa 2:** Imobilizări (40+ conturi)
- **Clasa 3:** Stocuri (20+ conturi)
- **Clasa 4:** Terți (60+ conturi) - Furnizori, Clienți, Personal, Buget
- **Clasa 5:** Trezorerie (10+ conturi)
- **Clasa 6:** Cheltuieli (40+ conturi)
- **Clasa 7:** Venituri (30+ conturi)

Total: **200+ conturi sistem** disponibile pentru toate companiile.

---

## 🔧 Utilități și Scripts

### Generare TypeScript Types

```bash
# Din Supabase Cloud
supabase gen types typescript --project-id your-project-ref > src/types/database.ts

# Din Supabase Local
supabase gen types typescript --local > src/types/database.ts
```

### Backup Database

```bash
# Backup complet
supabase db dump -f backup.sql

# Backup doar schema
supabase db dump --schema-only -f schema_backup.sql

# Backup doar data
supabase db dump --data-only -f data_backup.sql
```

### Reset Database (Development Only!)

```bash
# ATENȚIE: Șterge toate datele!
supabase db reset
```

---

## 📝 Validări și Constrângeri

### Constrângeri Importante

#### 1. Trial Balance Accounts

```sql
-- Un cont nu poate fi simultan debitor și creditor
CHECK (NOT (opening_debit > 0 AND opening_credit > 0))
CHECK (NOT (closing_debit > 0 AND closing_credit > 0))

-- Un cont apare o singură dată într-o balanță
UNIQUE (import_id, account_code)
```

#### 2. Trial Balance Imports

```sql
-- Perioada validă
CHECK (period_start <= period_end)

-- O singură balanță per companie și perioadă
UNIQUE (company_id, period_start, period_end)
```

#### 3. Financial Statements

```sql
-- Un singur statement de un tip pentru o perioadă
UNIQUE (company_id, period_start, period_end, statement_type)
```

### Funcție de Validare Echilibru

```sql
-- Validează echilibrul balanței
SELECT * FROM validate_trial_balance_equilibrium('import-uuid');

-- Returnează:
-- is_valid: true/false
-- error_code: 'VALID' sau cod de eroare
-- error_message: mesaj descriptiv
```

---

## 🧪 Testing Schema

### Query-uri pentru Verificare

```sql
-- 1. Verifică toate tabelele create
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Verifică RLS activat
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Verifică politici RLS
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Verifică seed data KPIs
SELECT category, COUNT(*) as kpi_count
FROM kpi_definitions
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- 5. Verifică plan conturi
SELECT account_type, COUNT(*) as total_accounts
FROM chart_of_accounts
WHERE is_system = true
GROUP BY account_type
ORDER BY account_type;

-- 6. Verifică index-uri
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 🔍 Troubleshooting

### Problema: RLS blochează toate query-urile

**Soluție:**
```sql
-- Verifică JWT claims
SELECT auth.jwt() ->> 'sub';

-- Verifică user_id
SELECT auth.get_user_id();

-- Dezactivează temporar RLS pentru debugging (doar local!)
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
```

### Problema: Seed data nu se încarcă

**Soluție:**
```bash
# Verifică ordinea execuției
# 1. Mai întâi schema.sql (creează tabelele)
# 2. Apoi seed files

# Verifică log-uri
supabase logs
```

### Problema: Foreign key constraint fails

**Soluție:**
```sql
-- Verifică că tabelele părinte există
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Verifică foreign keys
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';
```

---

## 📚 Resurse Adiționale

### Documentație Oficială

- **Supabase:** https://supabase.com/docs
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Row Level Security:** https://supabase.com/docs/guides/auth/row-level-security

### Best Practices

1. **Întotdeauna folosește RLS în producție**
2. **Backup regulat** (zilnic pentru producție)
3. **Test migrații pe staging** înainte de producție
4. **Monitorizează query performance** cu `EXPLAIN ANALYZE`
5. **Index toate foreign keys** și câmpurile frecvent filtrate
6. **Folosește UUID pentru PK** (mai bună distribuție, securitate)
7. **Setează connection pooling** pentru performanță (Supabase oferă implicit)

### SQL Tips

```sql
-- Analiză performanță query
EXPLAIN ANALYZE SELECT * FROM companies WHERE cui = 'RO12345678';

-- Verifică dimensiunea tabelelor
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verifică conexiuni active
SELECT * FROM pg_stat_activity WHERE datname = current_database();
```

---

## ✅ Checklist Setup Complet

### Pentru Development

- [ ] Instalat Supabase CLI
- [ ] Rulat `supabase start`
- [ ] Applied schema.sql
- [ ] Applied rls_policies.sql
- [ ] Applied seed data (KPIs + Chart)
- [ ] Generat TypeScript types
- [ ] Configurat .env.local
- [ ] Testat conectivitate din app
- [ ] Verificat RLS funcționează

### Pentru Production

- [ ] Creat proiect Supabase Cloud
- [ ] Applied toate migrations
- [ ] Configurat environment variables
- [ ] Testat conectivitate
- [ ] Setup backup automat
- [ ] Configurat monitoring
- [ ] Verificat RLS policies active
- [ ] Setup alerting pentru erori
- [ ] Documentat credențiale (securizat!)

---

## 🆘 Support

Pentru probleme sau întrebări:

1. Verifică [Troubleshooting](#troubleshooting) mai sus
2. Consultă documentația Supabase
3. Verifică logs: `supabase logs`
4. Contactează echipa de development

---

**Ultima actualizare:** 10 Ianuarie 2026  
**Versiune:** 1.0  
**Status Task 0.2:** ✅ COMPLETED
