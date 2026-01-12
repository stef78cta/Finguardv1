# Changelog

Toate modificările importante ale acestui proiect vor fi documentate în acest fișier.

Formatul este bazat pe [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
și acest proiect respectă [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### În dezvoltare

- Task 1.3: Company Management - CRUD pentru gestiunea companiilor

---

## [0.1.0] - 2026-01-11

### 🎉 PHASE 0: Foundation Setup - COMPLETĂ (100%)

Fundația completă a aplicației este gata pentru development.

### ✅ Added - Infrastructură Completă

#### 0.0 Supabase Setup

- Proiect Supabase creat (vdxbxfvzdkbilvfwmgnw.supabase.co)
- Region: eu-central-1 (Frankfurt)
- **17 tabele** create cu schema completă:
  - `users`, `companies`, `company_users`
  - `trial_balance_imports`, `trial_balance_accounts`
  - `chart_of_accounts`, `account_mappings`
  - `financial_statements` + linii (balance sheet, income statement, cash flow)
  - `kpi_definitions`, `kpi_values`
  - `reports`, `subscription_plans`, `subscriptions`, `activity_logs`
- **RLS Policies** complete pentru toate tabelele
- **4 funcții helper RLS**: get_current_user_id, user_has_company_access, user_has_company_role, is_admin
- **Seed Data**:
  - 23 KPI definitions (lichiditate, profitabilitate, leverage, eficiență, creștere)
  - 137 conturi din Planul de Conturi RO (OMFP 1802/2014, clase 1-7)
- Funcție validator echilibru balanță cu toleranță 1 RON

#### 0.1 Project Bootstrap

- Next.js 14 cu App Router și TypeScript
- Tailwind CSS + PostCSS
- shadcn/ui configurare completă
- ESLint, Prettier, TypeScript strict mode
- Structură de foldere conform PRD

#### 0.2 Database Schema Implementation

- Schema SQL completă implementată în Supabase
- RLS policies pentru toate tabelele
- Seed data încărcat
- Validări și funcții helper SQL

#### 0.3 Authentication Integration (Clerk)

- Clerk integration completă cu Next.js 14
- Middleware pentru protected routes (`/dashboard/*`, `/admin/*`)
- Sign-in/Sign-up pages cu catch-all segments
- Webhook `/api/webhook/clerk` pentru sincronizare utilizatori în Supabase
- ClerkProvider în root layout
- Helper functions în `lib/auth/clerk.ts`
- Trial de 14 zile automat la înregistrare
- Landing page cu redirect logic

#### 0.3.1 Clerk Dashboard Configuration ⭐ **NOU**

- **API Keys** obținute și configurate:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `CLERK_BACKEND_API_KEY` (folosește aceeași valoare ca SECRET_KEY în Clerk v5+)
  - `CLERK_WEBHOOK_SECRET`
- **Scripturi de Automatizare** implementate:
  - `scripts/setup-clerk.js` - Setup automat configurare
  - `scripts/verify-clerk-config.js` - Verificare configurație (PASSED: 6/6 checks)
  - `scripts/monitor-clerk-health.js` - Health monitoring continuu
  - Toate scripturile actualizate pentru Clerk v5+ API (`createClerkClient`)
  - Fallback intelligent: acceptă CLERK_BACKEND_API_KEY sau CLERK_SECRET_KEY
- **6 npm scripts** funcționale:
  - `clerk:setup:dev`, `clerk:setup:prod`
  - `clerk:verify`
  - `clerk:monitor`, `clerk:monitor:once`
- **Documentație completă**:
  - `CLERK_AUTOMATION_QUICK_START.md` - Ghid pas-cu-pas pentru beginneri
  - Explicații detaliate despre API keys în Clerk v5+
  - Troubleshooting pentru probleme comune
- **Verificare reușită**: `npm run clerk:verify` - 6/6 checks PASSED

#### 0.4 Supabase Client Setup

- Browser client (`lib/supabase/client.ts`) cu RLS pentru componente React
- Server client (`lib/supabase/server.ts`) cu service role pentru API routes
- TypeScript types complete generate din schema DB (`types/database.ts`)
- Query utilities (`lib/supabase/queries.ts`) cu helper functions CRUD
- Script npm pentru regenerare types: `npm run db:types`

#### 0.5 File Storage Configuration

- Supabase Storage bucket `trial-balance-files`
- Limite: 10MB max, MIME types Excel/CSV
- 4 politici RLS (INSERT/SELECT/UPDATE/DELETE) pentru acces controlat per companie
- 3 funcții SQL helper (validate_path, get_stats, cleanup_old)
- Utilități TypeScript complete (`lib/supabase/storage.ts`)
- 3 React hooks: useFileUpload, useMultiFileUpload, useDragAndDrop
- Path format securizat: `company_id/year/filename`

#### 1.1 UI Component Library

- Toate componentele shadcn/ui obligatorii instalate:
  - Button, Input, Card, Dialog, Table, Tabs, Progress, Select, Toast + Toaster
- Theme Provider pentru dark/light mode (next-themes)
- ThemeToggle component pentru comutare teme
- Utilități centralizate în `lib/utils.ts` (cn, formatters)
- Build și type-check trec fără erori
- Pagină test `/test-ui` pentru demonstrare componente

#### 1.2 Dashboard Layout

- **Sidebar Navigation** (`components/layout/sidebar.tsx`):
  - Navigație persistentă desktop, collapsible mobile
  - 5 secțiuni: Companii, Upload, Indicators, Reports, Settings
  - Iconuri Lucide React, active state highlighting
- **Header Component** (`components/layout/header.tsx`):
  - Company selector dropdown
  - Theme toggle integration
  - Clerk UserButton
  - Mobile menu toggle
- **Dashboard Layout** (`app/dashboard/layout.tsx`):
  - Integrare sidebar + header
  - Responsive pe toate device-urile
  - Footer cu links
- **5 Pagini Placeholder**:
  - `/dashboard/companies` - Empty state + info
  - `/dashboard/upload` - Drag&drop UI placeholder
  - `/dashboard/indicators` - Tabs pentru categorii KPI
  - `/dashboard/reports` - Tipuri rapoarte
  - `/dashboard/settings` - 5 tabs (profil, companie, notificări, securitate, abonament)

### 📦 Dependencies Added

#### Core

- `@clerk/nextjs@^5.0.0` - Authentication
- `@clerk/backend@^1.19.3` - Backend SDK pentru scripturi
- `@supabase/ssr@^0.3.0` - Supabase SSR
- `@supabase/supabase-js@^2.43.0` - Supabase client
- `next@^14.2.0` - Framework Next.js
- `react@^18.3.0`, `react-dom@^18.3.0` - React
- `typescript@^5.4.0` - TypeScript

#### UI & Styling

- `tailwindcss@^3.4.0` - Styling utility-first
- `next-themes@^0.4.6` - Theme management
- `@radix-ui/*` - UI primitives (Dialog, Select, Tabs, Toast, etc.)
- `lucide-react@^0.378.0` - Iconuri
- `class-variance-authority@^0.7.0` - Variante componente
- `tailwind-merge@^2.3.0` - Merge class names
- `tailwindcss-animate@^1.0.7` - Animații

#### Utilities

- `dotenv@^16.4.5` - Environment variables pentru scripturi
- `cross-env@^7.0.3` - Cross-platform env variables
- `date-fns@^3.6.0` - Date utilities
- `zod@^3.23.0` - Schema validation
- `svix@^1.84.1` - Webhook verification (Clerk)

#### Development

- `eslint@^8.57.0`, `eslint-config-next@^14.2.0` - Linting
- `prettier@^3.2.0`, `prettier-plugin-tailwindcss@^0.5.14` - Code formatting
- `@playwright/test@^1.44.0` - E2E testing
- `autoprefixer@^10.4.0`, `postcss@^8.4.0` - CSS processing

### 🔧 Configuration Files

- `.env.local` - Environment variables (Clerk + Supabase)
- `.env.example` - Template pentru environment variables
- `tailwind.config.js` - Tailwind CSS configuration cu theme custom
- `components.json` - shadcn/ui configuration
- `tsconfig.json` - TypeScript configuration (strict mode)
- `next.config.js` - Next.js configuration
- `middleware.ts` - Clerk auth middleware
- `.eslintrc.json`, `.prettierrc` - Code quality tools
- `playwright.config.ts` - E2E testing configuration

### 📚 Documentation

- `README.md` - Actualizat cu status PHASE 0 completă
- `TASK_0.0_SUPABASE_SETUP.md` - Documentație completă Supabase
- `TASK_0.3_AUTHENTICATION.md` - Documentație Clerk integration
- `TASK_0.3.1_CLERK_DASHBOARD_CONFIG.md` - Configurare Clerk Dashboard (COMPLETĂ)
- `CLERK_AUTOMATION_QUICK_START.md` - Ghid rapid automatizare Clerk
- `TASK_0.5_STORAGE.md` - Documentație Supabase Storage
- `ENV_SETUP.md` - Setup environment variables
- `app-guidelines/plan.md` - Plan de implementare actualizat (PHASE 0 ✅)
- `database/README.md` - Schema database și RLS policies
- `scripts/README.md` - Documentație scripturi automatizare

### 🔒 Security

- Row Level Security (RLS) activat pentru toate tabelele Supabase
- 4 funcții helper RLS pentru verificări complexe
- Middleware Clerk pentru protected routes
- Validare strictă input-uri
- Service role key doar pentru operațiuni server-side
- Path format securizat pentru file storage

### ✅ Verificări și Validări

- `npm run build` - ✅ SUCCESS
- `npm run lint` - ✅ PASS
- `npm run type-check` - ✅ PASS
- `npm run clerk:verify` - ✅ 6/6 checks PASSED
- Supabase connection test - ✅ PASS
- All RLS policies - ✅ ACTIVE

---

## 🎯 Next Steps

**PHASE 1: MVP Features** - În progres (2/11 tasks complete)

### Task 1.3 - Company Management (Next)

- CRUD API pentru companii
- UI: formular creare companie, listă companii
- Company selector în header (funcțional)
- Integrare cu Supabase (`companies`, `company_users` tables)

### Tasks Viitoare (1.4 - 1.11)

- Trial Balance Processing Engine
- File Upload UI
- Upload API Endpoints
- KPI Calculation Engine
- KPI Dashboard
- Financial Statements Generation
- PDF Report Generation
- Reports UI

---

## 📝 Notes

### Clarificări Importante - Clerk v5+

În Clerk v5+, arhitectura API keys s-a simplificat:

- **Nu mai există** "Backend API Keys" separate cu format `bapi_xxx`
- `CLERK_SECRET_KEY` (format: `sk_test_xxx`) se folosește pentru TOATE operațiile server-side
- `CLERK_BACKEND_API_KEY` poate fi setat la aceeași valoare ca `CLERK_SECRET_KEY`
- Scripturile noastre au fallback intelligent și acceptă ambele variabile

### Technology Decisions

1. **Next.js 14 App Router** - Pentru server components și streaming
2. **Supabase** - PostgreSQL managed cu RLS și Storage
3. **Clerk** - Authentication SaaS cu webhook sync
4. **shadcn/ui** - Component library flexibil și customizabil
5. **TypeScript Strict** - Pentru type safety maxim

---

**Versiune:** 0.1.0  
**Data:** 2026-01-11  
**Status:** ✅ PHASE 0 Foundation - 100% COMPLETĂ
