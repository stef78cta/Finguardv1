# FinGuard - Plan de Implementare pentru LLM-Assisted Coding

## Overview

Plan de implementare pentru FinGuard - aplicație SaaS de analiză financiară automată. Structurat în faze: Foundation Setup (infrastructură), apoi Feature-driven pentru MVP, Enhancement și Scale.

## Structura Planului

Acest plan folosește abordarea **Hybrid: Layer-first + Feature-driven** optimizată pentru coding asistat de LLM.

---

## Task Tracking

### PHASE 0: Foundation Setup

| ID  | Task                                                                              | Status     |
| --- | --------------------------------------------------------------------------------- | ---------- |
| 0.1 | Project Bootstrap - Next.js 14, TypeScript, Tailwind, shadcn/ui, folder structure | ✅ Completed |
| 0.2 | Database Schema Implementation - Supabase, toate tabelele, RLS, seed data         | ⬜ Pending |
| 0.3 | Authentication Integration - Clerk, webhook sync, middleware                      | ⬜ Pending |
| 0.4 | Supabase Client Setup - Browser/server clients, TypeScript types                  | ⬜ Pending |
| 0.5 | File Storage Configuration - Supabase Storage, policies, limits                   | ⬜ Pending |

### PHASE 1: MVP Features

| ID   | Task                                                              | Status     |
| ---- | ----------------------------------------------------------------- | ---------- |
| 1.1  | UI Component Library - shadcn/ui components, utilities, theme     | ⬜ Pending |
| 1.2  | Dashboard Layout - Sidebar, header, responsive design             | ⬜ Pending |
| 1.3  | Company Management - CRUD API + UI                                | ⬜ Pending |
| 1.4  | Trial Balance Processing Engine - Parser, normalizer, validator   | ⬜ Pending |
| 1.5  | File Upload UI - Dropzone, progress, validation display           | ⬜ Pending |
| 1.6  | Upload API Endpoints - POST upload, GET imports                   | ⬜ Pending |
| 1.7  | KPI Calculation Engine - 15 KPIs, formulas, storage               | ⬜ Pending |
| 1.8  | KPI Dashboard - Cards, charts, filters                            | ⬜ Pending |
| 1.9  | Financial Statements Generation - Balance sheet, income statement | ⬜ Pending |
| 1.10 | PDF Report Generation - Professional template, export             | ⬜ Pending |
| 1.11 | Reports UI - List, view, download                                 | ⬜ Pending |

**Legend:** ⬜ Pending | 🔄 In Progress | ✅ Completed | ❌ Blocked

---

## PHASE 0: Foundation Setup (Săptămânile 1-2)

Infrastructura trebuie să fie completă înainte de orice feature. Această fază este **secvențială**.

### 0.1 Project Bootstrap

- Inițializează Next.js 14 cu TypeScript și App Router
- Configurează Tailwind CSS + shadcn/ui
- Setup ESLint, Prettier, și configurație TypeScript strict
- Creează structura de foldere conform scaffolding-ului din PRD (secțiunea 6.2)
- Fișiere cheie: `package.json`, `next.config.js`, `tailwind.config.js`, `tsconfig.json`

**Acceptance:** `npm run build` și `npm run lint` trec fără erori

### 0.2 Database Schema Implementation

- Creează proiect Supabase
- Implementează schema completă SQL din PRD secțiunea 6.3
- Tabele prioritare: `users`, `companies`, `company_users`, `trial_balance_imports`, `trial_balance_accounts`, `kpi_definitions`, `kpi_values`
- Configurează Row Level Security policies
- Încarcă seed data pentru `kpi_definitions`

**Acceptance:** Toate tabelele create, RLS funcțional, seed data încărcat

### 0.3 Authentication Integration (Clerk)

- Integrează Clerk cu Next.js folosind `@clerk/nextjs`
- Creează route-urile `/sign-in`, `/sign-up` cu catch-all segments
- Implementează webhook `/api/webhook/clerk` pentru sincronizarea utilizatorilor în DB
- Configurează middleware pentru protejarea rutelor `/dashboard/*` și `/admin/*`
- Fișiere: `src/lib/auth/clerk.ts`, `src/app/(auth)/*`, `middleware.ts`

**Acceptance:** Login/signup funcțional, utilizatorii se sincronizează în tabelul `users`

### 0.4 Supabase Client Setup

- Configurează Supabase client pentru browser și server
- Generează tipuri TypeScript din schema DB
- Implementează utilități pentru queries cu RLS
- Fișiere: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/types/database.ts`

**Acceptance:** Queries funcționează cu tipuri TypeScript corecte

### 0.5 File Storage Configuration

- Configurează Supabase Storage bucket pentru trial balance files
- Implementează politici de acces (utilizatorii văd doar fișierele companiilor lor)
- Setează limite de upload (10MB max)

**Acceptance:** Upload/download funcțional cu securitate corectă

---

## PHASE 1: MVP Features (Săptămânile 3-8)

După Foundation, aceste features pot fi dezvoltate **paralel** cu coordonare minimă.

### 1.1 UI Component Library (FE-001)

- Instalează și configurează shadcn/ui components necesare
- Componente obligatorii: Button, Input, Card, Dialog, Table, Tabs, Progress, Select, Toast
- Creează utilități: `cn()` pentru class merging, formatteri pentru numere/date
- Implementează theme toggle (dark/light)
- Fișiere: `src/components/ui/*`, `src/lib/utils/cn.ts`, `src/lib/utils/formatters.ts`

**Acceptance:** Toate componentele UI funcționează, theme toggle operațional

### 1.2 Dashboard Layout (FE-003)

- Creează layout pentru dashboard cu sidebar navigation
- Implementează header cu user menu și company selector
- Responsive design pentru mobile/tablet/desktop
- Fișiere: `src/app/dashboard/layout.tsx`, `src/components/layout/sidebar.tsx`, `src/components/layout/header.tsx`

**Acceptance:** Navigation funcțională, responsive pe toate device-urile

### 1.3 Company Management

- CRUD pentru companii (create, read, update, delete)
- API endpoints: `GET/POST /api/companies`, `GET/PUT/DELETE /api/companies/[id]`
- UI: formular creare companie, listă companii, selector companie în header
- Fișiere: `src/hooks/use-companies.ts`, `src/components/forms/company-form.tsx`

**Acceptance:** Utilizatorul poate crea și gestiona companii

### 1.4 Trial Balance Processing Engine (BE-001) - CRITICAL

Aceasta este funcționalitatea core. Implementează în sub-etape:

**1.4.1 File Parser**

- Parser Excel folosind `xlsx` sau `exceljs`
- Parser CSV cu auto-detect delimiter
- Detectare automată format balanță (4 sau 5 egalități)
- Fișier: `src/lib/integrations/file-parser.ts`

**1.4.2 Data Normalizer**

- Mapare dinamică coloane indiferent de ordine
- Normalizare la structura standard cu 8 coloane
- Handling pentru celule merged și formule Excel
- Fișier: `src/lib/calculations/formatters.ts`

**1.4.3 Validation Engine**

- 15+ validări tehnice conform PRD
- Verificare echilibru: Total Debite = Total Credite (toleranță 1 RON)
- Validare format conturi (XX sau XXX.XX)
- Validare date numerice
- Fișier: `src/lib/calculations/validators.ts`

**Acceptance:** 95% din balanțele românești standard procesate fără erori

### 1.5 File Upload UI (FE-004)

- Componentă drag & drop cu `react-dropzone`
- Progress bar pentru upload și procesare
- Preview primele 10 linii după upload
- Selector dată obligatoriu (calendar widget)
- Afișare erori de validare clare cu indicarea liniei
- Fișiere: `src/components/upload/file-dropzone.tsx`, `src/components/upload/validation-results.tsx`, `src/app/dashboard/upload/page.tsx`

**Acceptance:** Upload funcțional, erori clare, progress vizibil

### 1.6 Upload API Endpoints (BE-002)

- `POST /api/upload` - upload și procesare fișier
- `GET /api/companies/[id]/imports` - listă imports
- `GET /api/imports/[id]` - detalii import
- `GET /api/imports/[id]/accounts` - conturi din balanță
- Fișiere: `src/app/api/upload/route.ts`, `src/app/api/imports/[id]/route.ts`

**Acceptance:** API funcțional cu error handling corect

### 1.7 KPI Calculation Engine (BE-003) - CRITICAL

- Calculează 15 KPI-uri esențiale din PRD (secțiunea 6.3 - seed data):
  - Lichiditate: `current_ratio`, `quick_ratio`
  - Profitabilitate: `roa`, `roe`, `gross_margin`, `net_margin`
  - Leverage: `debt_to_equity`
  - Eficiență: `asset_turnover`, `inventory_turnover`, `days_sales_outstanding`
- Formule configurabile din `kpi_definitions` table
- Stocare rezultate în `kpi_values`
- Fișier: `src/lib/calculations/kpi-engine.ts`

**Acceptance:** Toate KPI-urile calculate corect, verificat contra calcule manuale

### 1.8 KPI Dashboard (FE-006)

- Afișare KPI-uri în carduri cu valori și trend indicators
- Grafice interactive folosind Ant Design Charts sau Recharts
- Filtrare după perioadă și categorie KPI
- Fișiere: `src/components/dashboard/kpi-grid.tsx`, `src/components/dashboard/chart-components.tsx`, `src/app/dashboard/indicators/page.tsx`

**Acceptance:** Dashboard responsive, grafice interactive, date corecte

### 1.9 Financial Statements Generation

- Generare Balance Sheet din trial balance data
- Generare Income Statement
- Stocare în `financial_statements` și liniile aferente
- API: `POST /api/companies/[id]/statements/generate`

**Acceptance:** Situații financiare generate corect

### 1.10 PDF Report Generation (BE-004)

- Generare raport PDF profesional folosind `@react-pdf/renderer` sau `pdf-lib`
- Template cu branding, KPI-uri, grafice exportate ca imagini
- Fișiere: `src/lib/integrations/pdf-generator.ts`, `src/app/api/reports/[id]/download/route.ts`

**Acceptance:** PDF generat în < 10 secunde, format profesional

### 1.11 Reports UI (FE-007)

- Listă rapoarte generate
- Vizualizare raport
- Opțiuni export (PDF/Excel)
- Fișiere: `src/components/reports/*`, `src/app/dashboard/reports/page.tsx`

**Acceptance:** Workflow complet de la generare la download

---

## PHASE 2: Enhancement (Săptămânile 9-16)

### 2.1 Background Job Processing (BE-005)

- Setup BullMQ cu Redis pentru job queue
- Procesare fișiere mari în background
- Notificări când procesarea este completă
- Retry logic pentru failures

### 2.2 Comparative Analysis (BE-006)

- Comparație KPI-uri între perioade multiple
- Trend analysis și variance calculations
- Grafice comparative

### 2.3 Excel Export

- Export rapoarte în format Excel
- Template-uri profesionale

### 2.4 Advanced Dashboard

- Widget-uri customizabile
- Saved views și filters
- Real-time updates

### 2.5 Payment Integration

- Integrare NetOPIA sau euplatesc
- Subscription management
- Billing portal

---

## PHASE 3: Scale (Săptămânile 17-28)

### 3.1 Admin Dashboard

- User management complet
- System analytics
- Company management

### 3.2 Advanced RBAC

- Role-based access control granular
- Audit trails complete

### 3.3 Multi-user Collaboration

- Multiple utilizatori per companie
- Roluri diferite (owner, admin, member, viewer)

### 3.4 API Development

- API public pentru integrări
- Webhook support

---

## Referințe Cheie din PRD

- **Scaffolding complet:** PRD Secțiunea 6.2
- **Database Schema:** PRD Secțiunea 6.3 (SQL complet)
- **API Endpoints:** PRD Secțiunea 6.4
- **KPI Definitions:** PRD Secțiunea 6.3 (INSERT statements)
- **User Flows:** PRD Secțiunea 4.2
- **Tech Stack:** Next.js 14, TypeScript, Supabase, Clerk, Tailwind, shadcn/ui

---

## Dependințe Critice

```
0.1 Bootstrap
    └── 0.2 Database
        └── 0.3 Auth (Clerk)
            └── 0.4 Supabase Client
                └── 0.5 Storage
                    └── [PHASE 1 poate începe]

1.1 UI Components ──┬── 1.2 Dashboard Layout
                    │
1.4 Processing ─────┼── 1.5 Upload UI
                    │
1.7 KPI Engine ─────┴── 1.8 KPI Dashboard

1.9 Statements ─────── 1.10 PDF Generation ─── 1.11 Reports UI
```

---

## Ghid pentru LLM Sessions

Pentru fiecare task:

1. Citește acceptance criteria
2. Verifică dependințele sunt complete
3. Consultă fișierele de referință din PRD
4. Implementează funcționalitatea
5. Verifică că acceptance criteria sunt îndeplinite
6. Actualizează statusul în acest plan (schimbă ⬜ în ✅)

---

## Notes & Progress Log

<!-- Adaugă note despre progres, decizii, blocaje aici -->

| Data | Task | Note                |
| ---- | ---- | ------------------- |
| 2026-01-10 | 0.1 Project Bootstrap | ✅ Completat: Next.js 14 inițializat, structură de foldere creată, toate dependențele instalate, build și lint funcționează fără erori |
