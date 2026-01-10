# 🚀 FinGuard Database - Quick Start Guide

## Setup în 5 minute

### Opțiunea 1: Supabase Cloud (Recomandat)

```bash
# 1. Creează proiect pe supabase.com
# 2. Deschide SQL Editor și execută fișierele în ordine:

# Step 1: Schema principală
-- Copiază și execută: database/schema.sql

# Step 2: RLS Policies
-- Copiază și execută: database/policies/rls_policies.sql

# Step 3: KPI Definitions
-- Copiază și execută: database/seed/kpi_definitions.sql

# Step 4: Chart of Accounts
-- Copiază și execută: database/seed/chart_of_accounts.sql

# 3. Adaugă în .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # SECRET!
```

### Opțiunea 2: Supabase Local

```bash
# 1. Instalează Supabase CLI
npm install -g supabase

# 2. Start local Supabase
supabase start

# 3. Apply migrations
cd database
cat schema.sql policies/rls_policies.sql seed/*.sql | supabase db execute

# 4. Copiază credențialele din output în .env.local
```

## Verificare Setup

```sql
-- Run în SQL Editor sau via psql:

-- Verifică tabele (ar trebui să fie 18)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verifică RLS activat
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Verifică KPIs (ar trebui să fie 25+)
SELECT COUNT(*) FROM kpi_definitions WHERE is_active = true;

-- Verifică conturi (ar trebui să fie 200+)
SELECT COUNT(*) FROM chart_of_accounts WHERE is_system = true;
```

## Următorii Pași

1. ✅ Database setup complet
2. ➡️ Task 0.3: Setup Clerk Authentication
3. ➡️ Task 0.4: Configurează Supabase Client în aplicație
4. ➡️ Task 0.5: Setup File Storage

## Probleme Comune

**Q: RLS blochează toate query-urile**  
A: Verifică că ai configurat corect JWT în requests. Pentru testing local, poți dezactiva temporar RLS.

**Q: Seed data nu se încarcă**  
A: Asigură-te că execuți fișierele în ordine: schema → policies → seed data.

**Q: Foreign key errors**  
A: Schema trebuie aplicată înaintea seed data. Reapplică schema.sql.

---

📖 **Documentație completă:** [README.md](./README.md)  
🐛 **Troubleshooting:** [README.md#troubleshooting](./README.md#troubleshooting)
