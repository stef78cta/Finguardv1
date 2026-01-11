# Supabase Client Configuration - FinGuard

Documentație completă pentru utilizarea clienților Supabase în aplicația FinGuard.

## 📚 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Client Types](#client-types)
- [Type Safety](#type-safety)
- [Usage Examples](#usage-examples)
- [Query Utilities](#query-utilities)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

FinGuard folosește **Supabase** ca backend pentru:
- Stocare date (PostgreSQL)
- Row Level Security (RLS)
- Real-time subscriptions
- File storage
- Edge functions

Avem **2 tipuri de clienți**:
1. **Browser Client** (`client.ts`) - Pentru componente React client-side, respectă RLS
2. **Server Client** (`server.ts`) - Pentru API routes și webhooks, bypass RLS (admin)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FinGuard App                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │  Client-Side     │         │  Server-Side     │     │
│  │  Components      │         │  API Routes      │     │
│  │  (Browser)       │         │  Webhooks        │     │
│  └────────┬─────────┘         └────────┬─────────┘     │
│           │                            │                │
│           │                            │                │
│  ┌────────▼─────────┐         ┌────────▼─────────┐     │
│  │  Browser Client  │         │  Server Client   │     │
│  │  (RLS: ✅)       │         │  (RLS: ❌ Admin) │     │
│  │  client.ts       │         │  server.ts       │     │
│  └────────┬─────────┘         └────────┬─────────┘     │
│           │                            │                │
│           └────────────┬───────────────┘                │
│                        │                                │
└────────────────────────┼────────────────────────────────┘
                         │
                    ┌────▼─────┐
                    │ Supabase │
                    │ Database │
                    └──────────┘
```

---

## Client Types

### 1. Browser Client (`client.ts`)

**Când să folosești:**
- În componente React client-side (`'use client'`)
- În custom hooks
- Pentru operațiuni CRUD în contextul utilizatorului autentificat
- Pentru real-time subscriptions

**Caracteristici:**
- ✅ Respectă Row Level Security (RLS)
- ✅ Gestionează automat token-uri de autentificare
- ✅ Sincronizează sesiunea între tab-uri
- ✅ Suportă real-time subscriptions
- ⚠️ NU are acces admin la date

**Import:**
```typescript
import { getSupabaseClient, useSupabase } from '@/lib/supabase/client';
```

**Variabile de mediu necesare:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

### 2. Server Client (`server.ts`)

**Când să folosești:**
- În API routes (`/app/api/**/route.ts`)
- În Server Actions
- În webhook-uri (ex: Clerk sync)
- Pentru operațiuni admin care trebuie să bypass-uiască RLS

**Caracteristici:**
- ⚠️ Bypass-uiește Row Level Security (RLS)
- ✅ Acces complet admin la toate datele
- ⚠️ NICIODATĂ pe client-side (security risk!)
- ✅ Ideal pentru operațiuni sistem (sync utilizatori, batch jobs)

**Import:**
```typescript
import { getSupabaseServer } from '@/lib/supabase/server';
```

**Variabile de mediu necesare:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **IMPORTANT:** `SUPABASE_SERVICE_ROLE_KEY` nu trebuie să fie niciodată expusă pe client!

---

## Type Safety

Toate queries sunt **complet type-safe** folosind tipurile generate automat din schema Supabase.

### Structura Tipurilor

```typescript
// types/database.ts
export interface Database {
  public: {
    Tables: {
      users: { Row, Insert, Update }
      companies: { Row, Insert, Update }
      // ... toate tabelele
    }
  }
}
```

### Helper Types

```typescript
import type { 
  Tables,          // Pentru queries (SELECT)
  TablesInsert,    // Pentru insert (INSERT)
  TablesUpdate     // Pentru update (UPDATE)
} from '@/types/database';

// Alias-uri predefinite
import type { 
  User, 
  Company, 
  TrialBalanceImport 
} from '@/types/database';
```

### Regenerare Tipuri

Când schema Supabase se schimbă, regenerează tipurile:

```bash
# Automată (folosind PROJECT_ID din .env)
npm run db:types

# Sau manual
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts

# Pentru Supabase local
npm run db:types:local
```

---

## Usage Examples

### Browser Client - Componente React

#### Exemplu 1: Query simplu

```typescript
'use client';

import { getSupabaseClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { Company } from '@/types/database';

export function CompanyList() {
  const supabase = getSupabaseClient();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompanies() {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching companies:', error);
      } else {
        setCompanies(data);
      }
      setLoading(false);
    }

    fetchCompanies();
  }, [supabase]);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {companies.map((company) => (
        <li key={company.id}>{company.name}</li>
      ))}
    </ul>
  );
}
```

#### Exemplu 2: Custom Hook cu Type Safety

```typescript
'use client';

import { getSupabaseClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import type { Company } from '@/types/database';

export function useCompanies(activeOnly: boolean = true) {
  const supabase = getSupabaseClient();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      let query = supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError);
      } else {
        setCompanies(data);
      }
      setLoading(false);
    }

    fetchData();
  }, [supabase, activeOnly]);

  return { companies, loading, error };
}

// Utilizare
export function MyComponent() {
  const { companies, loading, error } = useCompanies(true);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{companies.length} companies found</div>;
}
```

#### Exemplu 3: Real-time Subscriptions

```typescript
'use client';

import { getSupabaseClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { TrialBalanceImport } from '@/types/database';

export function ImportStatus({ importId }: { importId: string }) {
  const supabase = getSupabaseClient();
  const [import, setImport] = useState<TrialBalanceImport | null>(null);

  useEffect(() => {
    // Fetch inițial
    supabase
      .from('trial_balance_imports')
      .select('*')
      .eq('id', importId)
      .single()
      .then(({ data }) => setImport(data));

    // Subscribe la updates
    const channel = supabase
      .channel(`import-${importId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trial_balance_imports',
          filter: `id=eq.${importId}`,
        },
        (payload) => {
          setImport(payload.new as TrialBalanceImport);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, importId]);

  if (!import) return <div>Loading...</div>;

  return (
    <div>
      <h3>Import Status: {import.status}</h3>
      {import.status === 'error' && <p>Error: {import.error_message}</p>}
    </div>
  );
}
```

---

### Server Client - API Routes

#### Exemplu 1: API Route pentru CRUD

```typescript
// app/api/companies/route.ts
import { getSupabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { TablesInsert } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const body: TablesInsert<'companies'> = await request.json();

    const { data, error } = await supabase
      .from('companies')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Exemplu 2: Webhook cu Admin Access

```typescript
// app/api/webhook/clerk/route.ts
import { getSupabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { type, data } = await request.json();

    if (type === 'user.created') {
      // Folosește server client pentru a bypass RLS
      const { error } = await supabase.from('users').insert({
        clerk_user_id: data.id,
        email: data.email_addresses[0]?.email_address,
        full_name: `${data.first_name} ${data.last_name}`,
      });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
```

---

## Query Utilities

Pentru queries comune, folosește utilitățile din `queries.ts`:

### Generic CRUD

```typescript
import { 
  getAll, 
  getById, 
  create, 
  update, 
  remove 
} from '@/lib/supabase/queries';

// Obține toate companiile active
const { data, error } = await getAll('companies', {
  filters: { is_active: true },
  sort: { column: 'name', ascending: true },
  pagination: { page: 1, pageSize: 10 }
});

// Obține o companie după ID
const { data: company, error } = await getById('companies', companyId);

// Creează o companie nouă
const { data: newCompany, error } = await create('companies', {
  name: 'ACME SRL',
  cui: '12345678',
  country_code: 'RO',
  currency: 'RON'
});

// Actualizează o companie
const { data: updated, error } = await update('companies', companyId, {
  name: 'ACME Updated'
});

// Șterge o companie
const { data: success, error } = await remove('companies', companyId);
```

### Domain-Specific Queries

```typescript
import { 
  getUserCompanies, 
  getCompanyImports,
  getImportAccounts,
  getCompanyKpiValues,
  getCompanyReports
} from '@/lib/supabase/queries';

// Obține companiile utilizatorului
const { data: companies } = await getUserCompanies(userId, {
  activeOnly: true,
  role: 'owner'
});

// Obține importurile unei companii
const { data: imports } = await getCompanyImports(companyId, {
  status: 'completed',
  pagination: { page: 1, pageSize: 20 }
});

// Obține conturile dintr-un import
const { data: accounts } = await getImportAccounts(importId);

// Obține valorile KPI
const { data: kpis } = await getCompanyKpiValues(
  companyId,
  '2024-01-01',
  '2024-12-31',
  { category: 'liquidity' }
);

// Obține rapoartele
const { data: reports } = await getCompanyReports(companyId, {
  reportType: 'comprehensive',
  status: 'completed'
});
```

---

## Best Practices

### ✅ DO

1. **Folosește Browser Client pentru componente client-side**
   ```typescript
   'use client';
   import { getSupabaseClient } from '@/lib/supabase/client';
   ```

2. **Folosește Server Client pentru API routes și webhooks**
   ```typescript
   import { getSupabaseServer } from '@/lib/supabase/server';
   ```

3. **Verifică mereu erori**
   ```typescript
   const { data, error } = await supabase.from('table').select();
   if (error) {
     console.error('Database error:', error);
     // Handle error appropriately
   }
   ```

4. **Folosește tipurile generate**
   ```typescript
   import type { Company } from '@/types/database';
   const company: Company = data;
   ```

5. **Folosește query utilities pentru operațiuni comune**
   ```typescript
   import { getAll } from '@/lib/supabase/queries';
   ```

### ❌ DON'T

1. **NU folosi Server Client pe client-side**
   ```typescript
   // ❌ GREȘIT - Security risk!
   'use client';
   import { getSupabaseServer } from '@/lib/supabase/server';
   ```

2. **NU expune SUPABASE_SERVICE_ROLE_KEY**
   ```typescript
   // ❌ GREȘIT - Niciodată în .env cu prefix NEXT_PUBLIC_
   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=xxx // ❌
   ```

3. **NU ignora erorile**
   ```typescript
   // ❌ GREȘIT
   const { data } = await supabase.from('table').select();
   // Ce se întâmplă dacă query-ul eșuează?
   ```

4. **NU face queries fără tipuri**
   ```typescript
   // ❌ GREȘIT
   const data: any = await supabase.from('companies').select();
   
   // ✅ CORECT
   const { data }: { data: Company[] | null } = await supabase
     .from('companies')
     .select();
   ```

---

## Troubleshooting

### Eroare: "NEXT_PUBLIC_SUPABASE_URL și NEXT_PUBLIC_SUPABASE_ANON_KEY trebuie setate"

**Cauză:** Variabilele de mediu nu sunt setate în `.env.local`

**Soluție:**
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### Eroare: "Row Level Security policy violation"

**Cauză:** Utilizatorul nu are permisiuni pentru operația respectivă

**Soluție:**
1. Verifică RLS policies în Supabase Dashboard
2. Asigură-te că utilizatorul este autentificat
3. Verifică că `user_id` corespunde cu cel din sesiune

---

### Eroare: "Cannot use server client on client-side"

**Cauză:** Încerci să folosești `getSupabaseServer()` într-o componentă client

**Soluție:**
```typescript
// ❌ GREȘIT
'use client';
import { getSupabaseServer } from '@/lib/supabase/server';

// ✅ CORECT
'use client';
import { getSupabaseClient } from '@/lib/supabase/client';
```

---

### Tipurile TypeScript sunt out-of-sync

**Cauză:** Schema DB s-a schimbat dar tipurile nu au fost regenerate

**Soluție:**
```bash
npm run db:types
```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase TypeScript Support](https://supabase.com/docs/reference/javascript/typescript-support)
- [Next.js + Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## Support

Pentru întrebări sau probleme:
1. Consultă această documentație
2. Verifică exemplele de cod din `queries.ts`
3. Consultă documentația oficială Supabase
4. Verifică RLS policies în Supabase Dashboard
