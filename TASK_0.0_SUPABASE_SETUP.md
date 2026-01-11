# Task 0.0: Setup Supabase - Ghid Complet de Conectare

**Status:** 🔄 IN PROGRESS  
**Data:** 11 Ianuarie 2026  
**Task ID:** 0.0 (PHASE 0: Foundation Setup - Prerequisites)  
**Prioritate:** 🔴 CRITICAL - Trebuie completat înaintea oricărui alt task

---

## 📋 Overview

Task 0.0 implementează setup-ul complet al bazei de date Supabase și conectarea acesteia la aplicația Finguard. Aceasta este fundația absolută a întregului proiect - fără acest setup, niciun alt task nu poate fi executat.

---

## 🎯 Acceptance Criteria

- [ ] Proiect Supabase creat și configurat
- [ ] Credențiale Supabase (URL și Keys) obținute
- [ ] Variabile de mediu configurate în `.env.local`
- [ ] Schema bazei de date implementată (toate cele 18 tabele)
- [ ] Row Level Security (RLS) activat și configurat
- [ ] Seed data încărcat (KPI definitions, Chart of Accounts)
- [ ] Conexiune testată cu succes din aplicație
- [ ] Supabase CLI instalat și configurat (optional, pentru development local)

**Result:** Baza de date Supabase funcțională și conectată la Finguard ✅

---

## 📁 Fișiere Afectate

### Fișiere de Configurare

```
.env.local                              # Variabile de mediu (CREARE NOUĂ)
.env.example                            # Template pentru .env.local
database/README.md                      # Documentație database
database/schema/complete_schema.sql     # Schema completă DB (FOLOSIT)
database/migrations/                    # Folder pentru migration-uri
```

### Fișiere de Verificare

```
lib/supabase/client.ts                  # Va folosi credențialele
lib/supabase/server.ts                  # Va folosi credențialele
types/database.ts                       # Tipuri TypeScript generate
```

---

## 🚀 Pași Detaliați de Implementare

### PASUL 1: Creare Cont Supabase (5 minute)

#### 1.1 Înregistrare Supabase

1. Accesează [https://supabase.com](https://supabase.com)
2. Click pe **"Start your project"** sau **"Sign Up"**
3. Autentifică-te folosind:
   - GitHub account (recomandat pentru developers)
   - Google account
   - Email + parolă

**✅ Verificare:** Ai acces la Supabase Dashboard

#### 1.2 Creare Organizație (Optional)

Dacă lucrezi în echipă:

1. În dashboard, click pe numele organizației din stânga sus
2. Selectează **"New organization"**
3. Nume organizație: `FinGuard` sau numele companiei tale
4. Selectează plan: **Free** pentru început (suficient pentru MVP)

**✅ Verificare:** Organizația apare în lista de organizații

---

### PASUL 2: Creare Proiect Supabase (10 minute)

#### 2.1 Inițializare Proiect

1. În dashboard, click pe **"New project"**
2. Completează detaliile:
   - **Name:** `finguard-production` (sau `finguard-dev` pentru development)
   - **Database Password:** Generează o parolă puternică (**SALVEAZĂ-O ÎNTR-UN LOC SIGUR!**)
   - **Region:** Selectează cel mai apropiat de utilizatorii tăi:
     - `eu-west-1` (Irlanda) - RECOMANDAT pentru România
     - `eu-central-1` (Frankfurt) - Alternativă pentru EU
   - **Pricing Plan:** Free (pentru început)

3. Click pe **"Create new project"**
4. **IMPORTANT:** Așteaptă 2-5 minute până când proiectul se provisionează
5. **SALVEAZĂ PAROLA DATABASE** - nu o vei mai putea recupera!

**✅ Verificare:** Statusul proiectului este "Active" (verde) în dashboard

#### 2.2 Notează Informații Importante

După ce proiectul este creat, vei avea nevoie de următoarele:

1. **Project URL:** `https://[project-ref].supabase.co`
2. **Project API Keys:**
   - `anon` (public) key - pentru client-side
   - `service_role` key - pentru server-side (SECRETĂ!)

**Unde le găsești:**

- Go to: Project Dashboard → Settings → API
- Secțiunea **"Project URL"**
- Secțiunea **"Project API keys"**

**⚠️ SECURITATE:**

- `anon` key = poate fi expusă public (este în frontend)
- `service_role` key = NICIODATĂ în frontend, DOAR server-side

---

### PASUL 3: Configurare Variabile de Mediu (5 minute)

#### 3.1 Creare Fișier `.env.local`

În root-ul proiectului Finguard:

```bash
# Crează fișierul .env.local
# În Windows PowerShell:
New-Item -Path .env.local -ItemType File
```

#### 3.2 Adaugă Credențialele Supabase

Deschide `.env.local` și adaugă:

```env
# ============================================
# SUPABASE CONFIGURATION
# ============================================

# Supabase Project URL
# Format: https://[project-ref].supabase.co
# Găsești în: Project Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Anon Key (Public)
# Folosit pe client-side (browser)
# Găsești în: Project Settings → API → Project API keys → anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (Secret)
# ⚠️ NICIODATĂ în frontend! DOAR server-side
# Găsești în: Project Settings → API → Project API keys → service_role
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# CLERK AUTHENTICATION
# ============================================

# Clerk Publishable Key (Public)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Clerk Secret Key (Secret)
CLERK_SECRET_KEY=sk_test_...

# Clerk Webhook Secret pentru sincronizare users
CLERK_WEBHOOK_SECRET=whsec_...

# ============================================
# APPLICATION CONFIGURATION
# ============================================

# URL-ul aplicației tale
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

**🔐 Securitate:**

1. Verifică că `.env.local` este în `.gitignore` (este by default)
2. **NICIODATĂ** nu commit-a `.env.local` în Git
3. Pentru producție, setează aceste variabile în:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Build & Deploy → Environment Variables

**✅ Verificare:**

```bash
# În PowerShell, verifică că variabilele sunt setate:
cat .env.local
```

#### 3.3 Creare `.env.example` (Template)

Pentru echipă, creează `.env.example` (fără valori reale):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

### PASUL 4: Implementare Schema Database (20 minute)

#### 4.1 Pregătire Script SQL

Ai deja scriptul SQL complet în:

```
database/schema/complete_schema.sql
```

Acest script conține:

- ✅ 18 tabele (users, companies, trial_balance_imports, etc.)
- ✅ Row Level Security policies pentru toate tabelele
- ✅ Seed data pentru 25+ KPI definitions
- ✅ Seed data pentru 200+ conturi din Planul de Conturi RO

#### 4.2 Executare Script în Supabase

**Metoda 1: SQL Editor (Recomandat pentru început)**

1. În Supabase Dashboard, du-te la **SQL Editor** (din meniul lateral)
2. Click pe **"New query"**
3. Deschide fișierul `database/schema/complete_schema.sql`
4. **SELECTEAZĂ TOTUL** (Ctrl+A) și copiază conținutul
5. Lipește în SQL Editor
6. Click pe **"Run"** (sau Ctrl+Enter)
7. Așteaptă 30-60 secunde până se execută
8. Verifică că nu sunt erori în console

**⚠️ ATENȚIE:**

- Dacă primești erori de tipul "relation already exists", înseamnă că tabelele există deja
- În acest caz, poți:
  - Șterge tabelele existente (DOAR în development!)
  - Sau sări peste această eroare dacă structura este corectă

**Metoda 2: Supabase CLI (Pentru Advanced Users)**

```bash
# Instalează Supabase CLI (dacă nu e instalat)
npm install -g supabase

# Login la Supabase
supabase login

# Link la proiectul tău
supabase link --project-ref [project-ref]

# Aplică migration
supabase db push
```

**✅ Verificare:**

1. Du-te la **Table Editor** în Supabase Dashboard
2. Verifică că toate tabelele există:

   ```
   - users
   - companies
   - company_users
   - trial_balance_imports
   - trial_balance_accounts
   - kpi_definitions
   - kpi_values
   - financial_statements
   - financial_statement_lines
   - ai_recommendations
   - audit_trails
   - notifications
   - subscription_plans
   - company_subscriptions
   - webhooks
   - webhook_logs
   - api_keys
   - usage_metrics
   ```

3. Verifică seed data:

   ```sql
   -- În SQL Editor, rulează:
   SELECT COUNT(*) FROM kpi_definitions;
   -- Ar trebui să returneze ~25

   SELECT COUNT(*) FROM chart_of_accounts;
   -- Ar trebui să returneze ~200+
   ```

#### 4.3 Verificare Row Level Security

RLS (Row Level Security) este ESENȚIAL pentru securitate:

1. Du-te la **Database → Policies** în Supabase Dashboard
2. Verifică că fiecare tabelă are politici RLS:
   - `companies` - 4 policies (SELECT, INSERT, UPDATE, DELETE)
   - `trial_balance_imports` - 4 policies
   - `trial_balance_accounts` - 4 policies
   - etc.

3. Testează o politică:

   ```sql
   -- În SQL Editor, testează că RLS funcționează:
   SET LOCAL role TO authenticated;
   SET LOCAL request.jwt.claims TO '{"sub": "test-user-id"}';

   -- Încearcă să selectezi companii (ar trebui să fie gol dacă user-ul nu există)
   SELECT * FROM companies;
   ```

**✅ Verificare:** Toate tabelele au RLS activat (badge-ul "RLS enabled" în Table Editor)

---

### PASUL 5: Configurare Storage (10 minute)

#### 5.1 Creare Bucket pentru Fișiere

1. În Supabase Dashboard, du-te la **Storage**
2. Click pe **"Create bucket"**
3. Completează:
   - **Name:** `trial-balance-files`
   - **Public bucket:** ❌ **NU** (trebuie să fie privat)
   - **Allowed MIME types:** Lasă gol (vom configura prin SQL)
   - **File size limit:** 10 MB

4. Click **"Create bucket"**

#### 5.2 Configurare Policies pentru Storage

SQL-ul pentru storage policies este deja în `database/storage/storage_setup.sql`.

1. Deschide `database/storage/storage_setup.sql`
2. Copiază tot conținutul
3. Du-te la **SQL Editor** în Supabase
4. Lipește și **Run**

Acest script configurează:

- ✅ Limite MIME types (Excel, CSV)
- ✅ Limite mărime fișiere (10MB)
- ✅ 4 politici RLS pentru storage (INSERT, SELECT, UPDATE, DELETE)
- ✅ 3 funcții helper pentru management storage

**✅ Verificare:**

```sql
-- Verifică că bucket-ul există
SELECT * FROM storage.buckets WHERE id = 'trial-balance-files';

-- Verifică policies
SELECT * FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects';
```

---

### PASUL 6: Generare TypeScript Types (5 minute)

#### 6.1 Instalare Supabase CLI (dacă nu e instalat)

```bash
npm install -g supabase
```

#### 6.2 Configurare Supabase CLI

```bash
# Login la Supabase
supabase login

# Link la proiectul tău
supabase link --project-ref [your-project-ref]
# Găsești project-ref în URL-ul dashboard-ului:
# https://app.supabase.com/project/[project-ref]/...
```

#### 6.3 Generare Tipuri TypeScript

```bash
# Generează tipuri TypeScript din schema DB
npm run db:types

# Sau direct:
npx supabase gen types typescript --project-id [project-ref] > types/database.ts
```

Acest command:

- Conectează la baza ta Supabase
- Citește schema completă
- Generează interfețe TypeScript pentru toate tabelele
- Salvează în `types/database.ts`

**✅ Verificare:**

1. Deschide `types/database.ts`
2. Verifică că există tipuri pentru toate tabelele:
   ```typescript
   export interface Database {
     public: {
       Tables: {
         companies: {
           Row: { ... }
           Insert: { ... }
           Update: { ... }
         }
         trial_balance_imports: { ... }
         // ... toate celelalte tabele
       }
     }
   }
   ```

---

### PASUL 7: Testare Conexiune (10 minute)

#### 7.1 Test în Browser Console

1. Pornește aplicația:

   ```bash
   npm run dev
   ```

2. Deschide browser la `http://localhost:3000`

3. Deschide Developer Console (F12)

4. Testează conexiunea:

   ```javascript
   // În console:
   const { createClient } = await import('@supabase/supabase-js');

   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   );

   // Test connection
   const { data, error } = await supabase.from('kpi_definitions').select('*').limit(5);

   console.log('Data:', data);
   console.log('Error:', error);
   ```

**✅ Verificare:**

- `data` conține array cu 5 KPI definitions
- `error` este `null`

#### 7.2 Creare Pagină Test (Recomandat)

Crează o pagină de test pentru verificare rapidă:

```typescript
// app/test-connection/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function TestConnectionPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = getSupabaseClient();

        // Test 1: Verifică conexiune generală
        const { data: kpis, error: kpiError } = await supabase
          .from('kpi_definitions')
          .select('*')
          .limit(5);

        if (kpiError) throw kpiError;

        // Test 2: Verifică storage
        const { data: buckets, error: bucketError } = await supabase
          .storage
          .listBuckets();

        if (bucketError) throw bucketError;

        setData({
          kpis: kpis?.length || 0,
          buckets: buckets?.length || 0,
          connection: 'OK',
        });
        setStatus('success');
      } catch (err: any) {
        setError(err.message || 'Unknown error');
        setStatus('error');
      }
    }

    testConnection();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Test Conexiune Supabase</h1>

      {status === 'loading' && (
        <div className="text-blue-600">Se testează conexiunea...</div>
      )}

      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-green-800 font-semibold mb-2">✅ Conexiune Reușită!</h2>
          <pre className="bg-white p-4 rounded mt-4 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">❌ Eroare Conexiune</h2>
          <p className="text-red-600">{error}</p>
          <div className="mt-4 text-sm text-gray-600">
            <p>Verifică:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Variabilele de mediu în .env.local</li>
              <li>URL-ul Supabase este corect</li>
              <li>Anon key este valid</li>
              <li>Schema DB este implementată</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
```

**✅ Verificare:** Vizitează `http://localhost:3000/test-connection` și vezi rezultatul

#### 7.3 Test Server-Side Connection

Crează un API route pentru testare server-side:

```typescript
// app/api/test-db/route.ts
import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerClient();

    // Test query
    const { data, error } = await supabase.from('kpi_definitions').select('code, name').limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      sample: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
```

**✅ Verificare:**

```bash
curl http://localhost:3000/api/test-db
# Sau vizitează în browser
```

---

### PASUL 8: Configurare Supabase Dashboard Settings (5 minute)

#### 8.1 Auth Settings

1. Du-te la **Authentication → Settings**
2. Configurează:
   - **Site URL:** `http://localhost:3000` (development)
   - **Redirect URLs:**
     ```
     http://localhost:3000/**
     https://your-domain.com/** (pentru production)
     ```

3. Salvează setările

#### 8.2 API Settings (Opțional)

1. Du-te la **Settings → API**
2. Notează:
   - **JWT Secret** (pentru debugging)
   - **JWT expiry time** (default 3600 secunde)

#### 8.3 Database Settings

1. Du-te la **Settings → Database**
2. Notează:
   - **Host** (pentru conexiuni directe PostgreSQL)
   - **Port** (5432 default)
   - **Database name**
   - **Connection string** (pentru migration tools)

**⚠️ IMPORTANT:** Folosește connection pooling pentru production:

- Connection string: `postgresql://postgres:[password]@[host]:5432/postgres`
- Transaction mode: Pentru Next.js API routes

---

## 📊 Checklist Final de Verificare

Înainte de a marca task-ul ca COMPLETED, verifică:

### Database Setup

- [ ] Proiect Supabase creat și activ
- [ ] Toate cele 18 tabele există în Table Editor
- [ ] Seed data încărcat (25+ KPIs, 200+ conturi)
- [ ] Row Level Security activat pe toate tabelele
- [ ] Politici RLS create și funcționale

### Storage Setup

- [ ] Bucket `trial-balance-files` creat
- [ ] Bucket setat ca privat (nu public)
- [ ] Storage policies configurate (4 policies)
- [ ] Limite fișiere setate (10MB, MIME types Excel/CSV)

### Configuration

- [ ] `.env.local` creat cu toate variabilele
- [ ] `NEXT_PUBLIC_SUPABASE_URL` setat corect
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` setat corect
- [ ] `SUPABASE_SERVICE_ROLE_KEY` setat corect (DOAR server-side)
- [ ] `.env.local` este în `.gitignore`

### TypeScript Types

- [ ] `types/database.ts` generat cu toate tipurile
- [ ] Tipuri pentru toate cele 18 tabele prezente
- [ ] Build TypeScript trece fără erori: `npm run build`

### Connection Testing

- [ ] Test browser-side conexiune reușit
- [ ] Test server-side conexiune reușit
- [ ] Query-uri la `kpi_definitions` funcționează
- [ ] Storage listBuckets funcționează

### Documentation

- [ ] `database/README.md` citit și înțeles
- [ ] `ENV_SETUP.md` actualizat cu credențiale
- [ ] Echipa informată despre setup

---

## 🔒 Securitate - Checklist Important

### Variabile de Mediu

- [ ] `.env.local` NICIODATĂ commit-at în Git
- [ ] `.env.example` creat pentru echipă (fără valori reale)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` folosit DOAR server-side
- [ ] Parola database salvată într-un manager de parole sigur

### Row Level Security

- [ ] RLS activat pe TOATE tabelele
- [ ] Teste RLS efectuate pentru diferite roluri
- [ ] Politici RLS verificate că blochează accesul neautorizat

### API Keys

- [ ] `anon` key folosită pentru client-side (safe)
- [ ] `service_role` key folosită DOAR în API routes (protejat)
- [ ] Nicio cheie secretă în cod frontend

---

## 🚨 Troubleshooting

### Problemă: "Failed to connect to Supabase"

**Soluții:**

1. Verifică că variabilele de mediu sunt setate corect în `.env.local`
2. Restart dev server: `npm run dev`
3. Verifică că URL-ul Supabase este valid (https://[project-ref].supabase.co)
4. Testează direct în browser: navighează la URL-ul Supabase

### Problemă: "relation does not exist" error

**Cauză:** Schema DB nu este implementată

**Soluție:**

1. Du-te la SQL Editor în Supabase Dashboard
2. Rulează scriptul `database/schema/complete_schema.sql`
3. Verifică în Table Editor că tabelele au fost create

### Problemă: "permission denied for table X"

**Cauză:** RLS policies nu sunt configurate corect

**Soluție:**

1. Verifică că RLS este activat pe tabelă
2. Verifică policies în Database → Policies
3. Rulează din nou section-ul RLS din script SQL

### Problemă: "JWT expired" sau "invalid JWT"

**Cauză:** Token Clerk expirat sau invalid

**Soluție:**

1. Logout și login din nou în aplicație
2. Verifică că webhook Clerk → Supabase funcționează
3. Verifică că `CLERK_WEBHOOK_SECRET` este setat corect

### Problemă: TypeScript types nu se generează

**Soluție:**

```bash
# Reinstalează Supabase CLI
npm install -g supabase --force

# Re-login
supabase login

# Re-link project
supabase link --project-ref [your-ref]

# Regenerează types
npm run db:types
```

---

## 📚 Resurse Utile

### Documentație Oficială

- [Supabase Quick Start](https://supabase.com/docs/guides/getting-started)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)

### Fișiere Proiect Relevante

- `database/schema/complete_schema.sql` - Schema completă DB
- `database/storage/storage_setup.sql` - Setup storage
- `database/README.md` - Documentație database
- `lib/supabase/client.ts` - Client Supabase browser
- `lib/supabase/server.ts` - Client Supabase server
- `types/database.ts` - Tipuri TypeScript generate
- `ENV_SETUP.md` - Ghid variabile de mediu

### Next Steps

După completarea acestui task:

1. ✅ **Task 0.1** - Project Bootstrap (poate începe)
2. ✅ **Task 0.2** - Database Schema (deja implementat aici)
3. ✅ **Task 0.3** - Authentication (Clerk integration)
4. ✅ **Task 0.4** - Supabase Client Setup (deja pregătit)
5. ✅ **Task 0.5** - Storage Configuration (deja implementat)

---

## 🎉 Success Metrics

Știi că setup-ul este complet când:

- ✅ Poți vedea toate tabelele în Supabase Table Editor
- ✅ Poți face query-uri din aplicație fără erori
- ✅ RLS policies blochează accesul neautorizat
- ✅ TypeScript types sunt generate și funcționează
- ✅ Storage bucket este creat și funcțional
- ✅ Build aplicației trece fără erori: `npm run build`
- ✅ Dev server pornește fără warnings: `npm run dev`

---

**Status:** 🔄 IN PROGRESS → ✅ COMPLETED (după finalizare)  
**Estimare Timp Total:** 60-90 minute  
**Next Task:** 0.1 - Project Bootstrap

---

## 📝 Notes

- Acest task este **CRITICAL** - toate celelalte task-uri depind de el
- Păstrează parola database într-un loc FOARTE sigur (nu o vei mai putea recupera)
- Pentru producție, repetă pașii pentru un proiect Supabase separat
- Folosește organizații Supabase diferite pentru dev/staging/production

**PHASE 0 ÎNCEPUT** 🚀
