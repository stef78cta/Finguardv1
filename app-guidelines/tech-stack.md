# FinGuard - Technical Overview & Developer Onboarding Guide

## Ghid Tehnic Complet pentru Dezvoltatori

**Versiune:** 1.0  
**Data:** Ianuarie 2026  
**Status:** Foundation Setup

---

## Cuprins

1. [Prezentare Generală](#1-prezentare-generală)
2. [Tech Stack](#2-tech-stack)
3. [Arhitectura Sistemului](#3-arhitectura-sistemului)
4. [Structura Proiectului (Scaffolding)](#4-structura-proiectului-scaffolding)
5. [Schema Bazei de Date](#5-schema-bazei-de-date)
6. [Autentificare și Securitate](#6-autentificare-și-securitate)
7. [Fluxuri de Date și Procesare](#7-fluxuri-de-date-și-procesare)
8. [API Design](#8-api-design)
9. [Convenții de Cod](#9-convenții-de-cod)
10. [Setup Development Environment](#10-setup-development-environment)
11. [Deployment & Infrastructure](#11-deployment--infrastructure)
12. [Testing Strategy](#12-testing-strategy)
13. [Onboarding Checklist](#13-onboarding-checklist)

---

## 1. Prezentare Generală

### Ce este FinGuard?

FinGuard este o aplicație SaaS de **analiză financiară automată** pentru companiile românești. Platforma procesează balanțe de verificare și generează rapoarte financiare comprehensive, indicatori KPI și analize comparative.

### Funcționalități Core

- **Procesare automată balanțe** - Upload Excel/CSV cu normalizare automată
- **Validări tehnice** - 15+ verificări pentru corectitudinea datelor
- **Calculare KPI** - 25+ indicatori financiari standard
- **Raportare** - Dashboard interactiv + Export PDF/Excel
- **Analize comparative** - Trend analysis pe perioade multiple
- **Multi-tenant** - Utilizatori multipli per companie cu roluri diferite

### Grupuri Țintă

- IMM-uri (100k-10M RON cifră de afaceri)
- Cabinete de contabilitate
- IFN-uri și companii de leasing
- Analiști financiari

---

## 2. Tech Stack

### 2.1 Frontend

| Tehnologie            | Versiune | Scop                                             |
| --------------------- | -------- | ------------------------------------------------ |
| **Next.js**           | 14.x     | Framework principal cu App Router                |
| **React**             | 18.x     | UI Library                                       |
| **TypeScript**        | 5.x      | Type safety                                      |
| **Tailwind CSS**      | 3.x      | Styling                                          |
| **shadcn/ui**         | latest   | Componente UI (bazat pe Radix UI)                |
| **Redux Toolkit**     | latest   | State management global                          |
| **RTK Query**         | latest   | Data fetching și caching                         |
| **React Hook Form**   | latest   | Gestionare formulare                             |
| **Zod**               | latest   | Validare scheme                                  |
| **Ant Design Charts** | latest   | Vizualizări date (doar charts, NU componente UI) |
| **Lucide React**      | latest   | Iconuri SVG                                      |
| **next-themes**       | latest   | Dark/Light mode                                  |
| **date-fns**          | latest   | Manipulare date                                  |
| **Sonner**            | latest   | Toast notifications                              |
| **decimal.js**        | latest   | Calcule financiare precise                       |

**Librării pentru Procesare Fișiere:**

- **SheetJS (xlsx)** - Citire Excel/CSV în browser
- **PapaParse** - CSV parsing pentru fișiere mari

**Export Rapoarte:**

- **jspdf** + **html2canvas** - Export PDF
- **xlsx (SheetJS)** - Export Excel

**Utilitare CSS:**

- **clsx** - Concatenare clase
- **tailwind-merge** - Merge clase Tailwind
- **class-variance-authority (cva)** - Variante componente

### 2.2 Backend

| Tehnologie             | Versiune | Scop                                           |
| ---------------------- | -------- | ---------------------------------------------- |
| **Next.js API Routes** | 14.x     | API endpoints                                  |
| **TypeScript**         | 5.x      | Type safety                                    |
| **Supabase**           | latest   | BaaS (PostgreSQL + Auth + Storage)             |
| **PostgreSQL**         | 15.x     | Bază de date principală                        |
| **Prisma**             | latest   | ORM (opțional, alternativă la Supabase client) |
| **Clerk**              | latest   | Autentificare                                  |
| **BullMQ**             | latest   | Job queue pentru background processing         |
| **Redis**              | 7.x      | Queue storage + Caching                        |

**Securitate:**

- **express-rate-limit** - Rate limiting
- **Zod/Joi** - Validare input
- **CORS** - Cross-origin configuration

**Procesare Server-side:**

- **Multer** - File uploads
- **xlsx/csv-parser** - Procesare fișiere pe server

**Logging & Monitoring:**

- **Winston** - Logging aplicație
- **Morgan** - HTTP request logging
- **Sentry** - Error tracking

### 2.3 Infrastructure & DevOps

| Serviciu           | Scop                          |
| ------------------ | ----------------------------- |
| **Vercel**         | Hosting Frontend + API Routes |
| **Supabase Cloud** | PostgreSQL + Storage + RLS    |
| **Redis Cloud**    | Queue storage                 |
| **GitHub Actions** | CI/CD                         |
| **Sentry**         | Error monitoring              |
| **Grafana**        | Metrics dashboard (opțional)  |

---

## 3. Arhitectura Sistemului

### 3.1 Diagrama Arhitecturală

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │   Browser       │    │   Mobile/PWA    │                     │
│  │   (Desktop)     │    │   (Responsive)  │                     │
│  └────────┬────────┘    └────────┬────────┘                     │
└───────────┼──────────────────────┼──────────────────────────────┘
            │                      │
            ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  App Router │  │  shadcn/ui  │  │ Redux       │              │
│  │  (SSR/SSG)  │  │  Components │  │ Toolkit     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────────────────────────────────────────┐            │
│  │              Custom Hooks & Utils               │            │
│  │  (use-upload, use-companies, use-reports, etc.) │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION                               │
│                        (Clerk)                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   JWT       │  │  Webhooks   │  │  Multi-     │              │
│  │   Tokens    │  │  Sync       │  │  tenant     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API LAYER (Next.js API Routes)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Upload  │  │ Analysis │  │ Reports  │  │  Admin   │        │
│  │  API     │  │  API     │  │  API     │  │  API     │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │  File Parser   │  │  Validation    │  │  KPI Engine    │     │
│  │  (Excel/CSV)   │  │  Engine        │  │  (25+ KPIs)    │     │
│  └────────────────┘  └────────────────┘  └────────────────┘     │
│  ┌────────────────┐  ┌────────────────┐                         │
│  │  Report        │  │  Comparative   │                         │
│  │  Generator     │  │  Analysis      │                         │
│  └────────────────┘  └────────────────┘                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   BullMQ        │  │   PostgreSQL    │  │   Supabase      │
│   (Job Queue)   │  │   (Supabase)    │  │   Storage       │
│                 │  │   + RLS         │  │   (Files)       │
│   Redis         │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 3.2 Fluxul de Date Principal

```
User Upload → File Parser → Normalizer → Validator → Database
                                              ↓
                                        KPI Engine → kpi_values
                                              ↓
                                   Statement Generator → financial_statements
                                              ↓
                                      Report Generator → PDF/Excel
```

---

## 4. Structura Proiectului (Scaffolding)

```
finguard/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .eslintrc.json
├── playwright.config.ts
├── .env.local.example
│
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero-bg.jpg
│   │   └── testimonials/
│   └── favicon.ico
│
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── globals.css
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   │
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── sign-in/
│   │   │   │   └── [[...sign-in]]/
│   │   │   │       └── page.tsx
│   │   │   └── sign-up/
│   │   │       └── [[...sign-up]]/
│   │   │           └── page.tsx
│   │   │
│   │   ├── dashboard/                # Protected routes - Client
│   │   │   ├── layout.tsx            # Dashboard layout cu sidebar
│   │   │   ├── page.tsx              # Dashboard principal
│   │   │   ├── upload/
│   │   │   │   └── page.tsx          # Încărcare balanță
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx          # Lista rapoarte
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Raport individual
│   │   │   ├── indicators/
│   │   │   │   └── page.tsx          # Dashboard KPI
│   │   │   ├── analysis/
│   │   │   │   ├── page.tsx          # Analize financiare
│   │   │   │   └── comparative/
│   │   │   │       └── page.tsx      # Analize comparative
│   │   │   ├── forecasting/
│   │   │   │   └── page.tsx          # Previziuni bugetare
│   │   │   └── settings/
│   │   │       ├── page.tsx          # Setări cont
│   │   │       └── billing/
│   │   │           └── page.tsx      # Abonament
│   │   │
│   │   ├── admin/                    # Protected routes - Admin
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Admin dashboard
│   │   │   ├── users/
│   │   │   │   ├── page.tsx          # User management
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── companies/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── analytics/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── usage/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── revenue/
│   │   │   │       └── page.tsx
│   │   │   ├── subscriptions/
│   │   │   │   └── page.tsx
│   │   │   ├── system/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── kpis/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── templates/
│   │   │   │       └── page.tsx
│   │   │   └── logs/
│   │   │       ├── page.tsx
│   │   │       ├── errors/
│   │   │       │   └── page.tsx
│   │   │       └── audit/
│   │   │           └── page.tsx
│   │   │
│   │   └── api/                      # API Routes
│   │       ├── webhook/
│   │       │   └── clerk/
│   │       │       └── route.ts      # Clerk webhook sync
│   │       ├── upload/
│   │       │   └── route.ts
│   │       ├── companies/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── imports/
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── reports/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── download/
│   │       │           └── route.ts
│   │       ├── indicators/
│   │       │   └── route.ts
│   │       └── admin/
│   │           ├── dashboard/
│   │           │   └── route.ts
│   │           ├── users/
│   │           │   └── route.ts
│   │           └── analytics/
│   │               └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── toast.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── navigation.tsx
│   │   │
│   │   ├── forms/
│   │   │   ├── upload-balance-form.tsx
│   │   │   ├── company-form.tsx
│   │   │   └── settings-form.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── stats-cards.tsx
│   │   │   ├── recent-activity.tsx
│   │   │   ├── kpi-grid.tsx
│   │   │   └── chart-components.tsx
│   │   │
│   │   ├── reports/
│   │   │   ├── report-list.tsx
│   │   │   ├── report-viewer.tsx
│   │   │   └── export-options.tsx
│   │   │
│   │   ├── upload/
│   │   │   ├── file-dropzone.tsx
│   │   │   ├── upload-progress.tsx
│   │   │   ├── validation-results.tsx
│   │   │   └── date-selector.tsx
│   │   │
│   │   └── common/
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       ├── pagination.tsx
│   │       └── theme-toggle.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client
│   │   │   └── middleware.ts         # Auth middleware
│   │   │
│   │   ├── auth/
│   │   │   ├── clerk.ts              # Clerk configuration
│   │   │   └── permissions.ts        # Role-based access
│   │   │
│   │   ├── utils/
│   │   │   ├── cn.ts                 # Class name utility
│   │   │   ├── formatters.ts         # Number/date formatting
│   │   │   ├── validators.ts         # Form validation
│   │   │   └── constants.ts          # App constants
│   │   │
│   │   ├── calculations/
│   │   │   ├── kpi-engine.ts         # KPI calculation logic
│   │   │   ├── validators.ts         # Balance validations (15+ checks)
│   │   │   └── formatters.ts         # Balance normalization
│   │   │
│   │   └── integrations/
│   │       ├── file-parser.ts        # Excel/CSV parsing
│   │       ├── pdf-generator.ts      # PDF reports
│   │       └── excel-exporter.ts     # Excel exports
│   │
│   ├── hooks/
│   │   ├── use-upload.ts             # File upload logic
│   │   ├── use-companies.ts          # Company management
│   │   ├── use-reports.ts            # Reports data
│   │   ├── use-indicators.ts         # KPI data
│   │   └── use-local-storage.ts
│   │
│   ├── store/                        # Redux Toolkit
│   │   ├── index.ts
│   │   ├── auth-slice.ts
│   │   ├── companies-slice.ts
│   │   ├── reports-slice.ts
│   │   └── ui-slice.ts
│   │
│   ├── types/
│   │   ├── database.ts               # Supabase generated types
│   │   ├── auth.ts                   # Clerk types
│   │   ├── api.ts                    # API response types
│   │   ├── balance.ts                # Balance structure types
│   │   └── reports.ts                # Report types
│   │
│   └── styles/
│       ├── globals.css               # Global styles + Tailwind
│       └── components.css            # Component-specific styles
│
├── database/
│   ├── schema.sql                    # Complete database schema
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_kpi_definitions.sql
│   │   └── 003_add_audit_logs.sql
│   ├── seed/
│   │   ├── kpi_definitions.sql
│   │   ├── chart_of_accounts.sql
│   │   └── sample_data.sql
│   └── policies/                     # Row Level Security
│       ├── users_policies.sql
│       ├── companies_policies.sql
│       └── reports_policies.sql
│
├── tests/
│   ├── __mocks__/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   └── e2e/                          # Playwright tests
│       ├── auth.spec.ts
│       ├── upload.spec.ts
│       └── dashboard.spec.ts
│
├── docs/
│   ├── API.md
│   ├── deployment.md
│   ├── database-schema.md
│   └── user-guide.md
│
└── scripts/
    ├── setup-db.ts                   # Database setup
    ├── seed-data.ts                  # Seed sample data
    └── generate-types.ts             # Type generation
```

---

## 5. Schema Bazei de Date

### 5.1 Diagrama ER (Simplificată)

```
USERS ──────────────┬──────────────── COMPANY_USERS ──────────── COMPANIES
   │                │                                                │
   │                │                                                │
   └── uploads ─────┼──────────────── TRIAL_BALANCE_IMPORTS ────────┤
                    │                        │                       │
                    │                        │                       │
                    │                        ▼                       │
                    │            TRIAL_BALANCE_ACCOUNTS              │
                    │                        │                       │
                    │                        │                       │
                    │           ┌────────────┴────────────┐          │
                    │           ▼                        ▼          │
                    │   FINANCIAL_STATEMENTS        KPI_VALUES      │
                    │           │                        ▲          │
                    │           │                        │          │
                    │           ▼                        │          │
                    │   BALANCE_SHEET_LINES     KPI_DEFINITIONS     │
                    │   INCOME_STATEMENT_LINES                      │
                    │   CASH_FLOW_LINES                             │
                    │                                               │
                    └──────────────── REPORTS ──────────────────────┘
                                         │
                    ACTIVITY_LOGS ───────┘
                    SUBSCRIPTIONS ───────┴─── SUBSCRIPTION_PLANS
```

### 5.2 Tabele Principale

#### Identitate și Acces

| Tabel           | Descriere                         | Câmpuri Cheie                                               |
| --------------- | --------------------------------- | ----------------------------------------------------------- |
| `users`         | Utilizatori sincronizați cu Clerk | `id`, `clerk_user_id`, `email`, `full_name`, `role`         |
| `companies`     | Companii analizate                | `id`, `name`, `cui`, `currency`, `fiscal_year_start_month`  |
| `company_users` | Relație many-to-many user↔company | `company_id`, `user_id`, `role` (owner/admin/member/viewer) |

#### Import Balanțe

| Tabel                    | Descriere                       | Câmpuri Cheie                                                                        |
| ------------------------ | ------------------------------- | ------------------------------------------------------------------------------------ |
| `trial_balance_imports`  | Upload sessions                 | `id`, `company_id`, `period_start`, `period_end`, `status`                           |
| `trial_balance_accounts` | Linii din balanță (normalizate) | `import_id`, `account_code`, `account_name`, `opening_debit`, `closing_credit`, etc. |

#### Date Financiare Derivate

| Tabel                    | Descriere                    | Câmpuri Cheie                                      |
| ------------------------ | ---------------------------- | -------------------------------------------------- |
| `financial_statements`   | Situații financiare generate | `company_id`, `source_import_id`, `statement_type` |
| `balance_sheet_lines`    | Linii bilanț                 | `statement_id`, `category`, `amount`               |
| `income_statement_lines` | Linii P&L                    | `statement_id`, `category`, `amount`               |
| `kpi_definitions`        | Definiții KPI (formule)      | `code`, `name`, `formula`, `unit`                  |
| `kpi_values`             | Valori KPI calculate         | `kpi_definition_id`, `company_id`, `value`         |

### 5.3 Structura Standard Trial Balance (8 coloane)

```sql
CREATE TABLE trial_balance_accounts (
    id UUID PRIMARY KEY,
    import_id UUID NOT NULL REFERENCES trial_balance_imports(id),
    account_code VARCHAR(20) NOT NULL,      -- Ex: "401" sau "401.01"
    account_name VARCHAR(255) NOT NULL,     -- Ex: "Furnizori"
    opening_debit NUMERIC(15,2) DEFAULT 0,  -- Sold inițial debitor
    opening_credit NUMERIC(15,2) DEFAULT 0, -- Sold inițial creditor
    debit_turnover NUMERIC(15,2) DEFAULT 0, -- Rulaj debitor
    credit_turnover NUMERIC(15,2) DEFAULT 0,-- Rulaj creditor
    closing_debit NUMERIC(15,2) DEFAULT 0,  -- Sold final debitor
    closing_credit NUMERIC(15,2) DEFAULT 0, -- Sold final creditor
    UNIQUE(import_id, account_code)
);
```

### 5.4 KPI Definitions (Seed Data)

```sql
-- Exemple KPI-uri standard românești
INSERT INTO kpi_definitions (code, name, category, formula, unit) VALUES
('current_ratio', 'Rata lichidității curente', 'liquidity',
 '{"numerator": "current_assets", "denominator": "current_liabilities"}', 'ratio'),
('quick_ratio', 'Rata lichidității acide', 'liquidity',
 '{"numerator": "(current_assets - inventory)", "denominator": "current_liabilities"}', 'ratio'),
('roa', 'Rentabilitatea activelor (ROA)', 'profitability',
 '{"numerator": "net_income", "denominator": "average_total_assets"}', 'percentage'),
('roe', 'Rentabilitatea capitalurilor proprii (ROE)', 'profitability',
 '{"numerator": "net_income", "denominator": "average_shareholders_equity"}', 'percentage'),
('debt_to_equity', 'Rata datoriei la capitaluri proprii', 'leverage',
 '{"numerator": "total_liabilities", "denominator": "shareholders_equity"}', 'ratio'),
('gross_margin', 'Marja brută', 'profitability',
 '{"numerator": "(revenue - cogs)", "denominator": "revenue"}', 'percentage'),
('net_margin', 'Marja netă', 'profitability',
 '{"numerator": "net_income", "denominator": "revenue"}', 'percentage');
```

---

## 6. Autentificare și Securitate

### 6.1 Clerk Integration

**Flux de autentificare:**

```
1. User → Clerk Sign In/Up → JWT Token
2. Clerk Webhook → POST /api/webhook/clerk → Sync user în DB
3. Frontend → RTK Query cu auth headers → Protected API
4. API → Verify JWT → Check RLS → Return data
```

**Configurare Clerk:**

```typescript
// src/lib/auth/clerk.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up", "/api/webhook/clerk"],
  ignoredRoutes: ["/api/webhook/clerk"],
});
```

### 6.2 Row Level Security (RLS)

Toate tabelele importante au RLS enabled. Exemplu:

```sql
-- Users can only access their companies
CREATE POLICY "Company access via membership" ON companies
    FOR ALL USING (
        id IN (
            SELECT company_id FROM company_users
            WHERE user_id = (
                SELECT id FROM users
                WHERE clerk_user_id = auth.jwt() ->> 'sub'
            )
        )
    );
```

### 6.3 Roluri și Permisiuni

| Rol           | Descriere           | Permisiuni                              |
| ------------- | ------------------- | --------------------------------------- |
| `user`        | Utilizator standard | CRUD pe propriile companii și date      |
| `admin`       | Administrator       | + User management, System analytics     |
| `super_admin` | Super Administrator | + All data access, System configuration |
| `owner`       | Owner companie      | Full access pe companie                 |
| `member`      | Membru companie     | Read + Create pe companie               |
| `viewer`      | Viewer companie     | Read-only pe companie                   |

---

## 7. Fluxuri de Date și Procesare

### 7.1 Upload și Procesare Balanță

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: UPLOAD                                                  │
│ ┌─────────────┐                                                 │
│ │ User Drag & │ → Client validation (size, type)               │
│ │ Drop File   │ → Select reference date                        │
│ └─────────────┘                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: PARSING (file-parser.ts)                                │
│ • Detect format (4 or 5 egalități)                              │
│ • Parse Excel/CSV                                               │
│ • Normalize to 8-column standard                                │
│ • Handle merged cells, formulas                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: VALIDATION (validators.ts) - 15+ Checks                 │
│ ✓ BALANCE_GLOBAL_MISMATCH - Total Debite = Total Credite       │
│ ✓ OPENING_BALANCE_MISMATCH - Solduri inițiale echilibrate      │
│ ✓ TURNOVER_MISMATCH - Rulaje echilibrate                       │
│ ✓ CLOSING_BALANCE_MISMATCH - Solduri finale echilibrate        │
│ ✓ INVALID_ACCOUNT - Cont inexistent în Plan Conturi            │
│ ✓ ACCOUNT_ARITHMETIC_ERROR - Sold final = Sold inițial + Rulaj │
│ ✓ CLASS6_NOT_CLOSED - Cheltuieli cu sold ≠ 0                   │
│ ✓ CLASS7_NOT_CLOSED - Venituri cu sold ≠ 0                     │
│ ✓ SYNTHETIC_ANALYTIC_MISMATCH - Subconturi ≠ Sintetic          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: KPI CALCULATION (kpi-engine.ts)                         │
│ • Calculate 25+ financial KPIs                                  │
│ • Store in kpi_values table                                     │
│ • Generate financial_statements                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: RESULT                                                  │
│ • Update import status to 'completed'                           │
│ • Notify user (email/in-app)                                    │
│ • Display results in dashboard                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Background Processing (BullMQ)

Pentru fișiere mari (>1000 linii), procesarea se face în background:

```typescript
// Adăugare job în queue
await balanceQueue.add("process-balance", {
  importId: uuid,
  filePath: storagePath,
  companyId: companyId,
});

// Worker processing
const worker = new Worker("balance-queue", async (job) => {
  const { importId, filePath } = job.data;

  // 1. Parse file
  // 2. Validate data
  // 3. Calculate KPIs
  // 4. Update status
});
```

---

## 8. API Design

### 8.1 Endpoints Principale

#### Authentication & User

| Method | Endpoint             | Descriere                             |
| ------ | -------------------- | ------------------------------------- |
| POST   | `/api/webhook/clerk` | Clerk webhook pentru sync utilizatori |
| GET    | `/api/auth/user`     | Get current user profile              |
| PUT    | `/api/auth/user`     | Update user profile                   |

#### Companies

| Method | Endpoint              | Descriere             |
| ------ | --------------------- | --------------------- |
| GET    | `/api/companies`      | List user's companies |
| POST   | `/api/companies`      | Create new company    |
| GET    | `/api/companies/[id]` | Get company details   |
| PUT    | `/api/companies/[id]` | Update company        |
| DELETE | `/api/companies/[id]` | Delete company        |

#### Trial Balance

| Method | Endpoint                      | Descriere                 |
| ------ | ----------------------------- | ------------------------- |
| POST   | `/api/upload`                 | Upload trial balance file |
| GET    | `/api/companies/[id]/imports` | List imports              |
| GET    | `/api/imports/[id]`           | Get import details        |
| GET    | `/api/imports/[id]/accounts`  | Get balance accounts      |

#### KPIs & Analysis

| Method | Endpoint                                   | Descriere            |
| ------ | ------------------------------------------ | -------------------- |
| GET    | `/api/companies/[id]/kpis`                 | Get KPI values       |
| GET    | `/api/kpi-definitions`                     | List KPI definitions |
| GET    | `/api/companies/[id]/analysis/comparative` | Comparative data     |

#### Reports

| Method | Endpoint                      | Descriere          |
| ------ | ----------------------------- | ------------------ |
| GET    | `/api/companies/[id]/reports` | List reports       |
| POST   | `/api/companies/[id]/reports` | Generate report    |
| GET    | `/api/reports/[id]/download`  | Download PDF/Excel |

### 8.2 Response Format Standard

```typescript
// Success Response
{
  success: true,
  data: { ... },
  message?: string
}

// Error Response
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Descriere eroare",
    details?: { field: "message" }
  }
}
```

---

## 9. Convenții de Cod

### 9.1 Naming Conventions

```typescript
// Components - PascalCase
export function UploadBalanceForm() {}
export const KpiDashboard: React.FC = () => {};

// Hooks - camelCase cu "use" prefix
export function useUpload() {}
export function useCompanies() {}

// Types/Interfaces - PascalCase
interface TrialBalanceAccount {}
type KpiValue = {};

// Constants - SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const API_ENDPOINTS = {};

// Files - kebab-case
// file-parser.ts, kpi-engine.ts, upload-balance-form.tsx

// Database - snake_case
// trial_balance_imports, kpi_definitions
```

### 9.2 Comentarii (JSDoc Standard)

```typescript
/**
 * Calculează KPI-urile pentru o perioadă specifică.
 *
 * @param companyId - ID-ul companiei pentru care se calculează
 * @param periodStart - Data de început a perioadei
 * @param periodEnd - Data de sfârșit a perioadei
 * @returns Lista de valori KPI calculate
 * @throws {ValidationError} Când datele de intrare sunt invalide
 *
 * @example
 * const kpis = await calculateKpis(companyId, '2024-01-01', '2024-01-31');
 */
export async function calculateKpis(
  companyId: string,
  periodStart: string,
  periodEnd: string
): Promise<KpiValue[]> {
  // implementation
}
```

### 9.3 TypeScript Best Practices

```typescript
// ✅ Use explicit types pentru funcții publice
export function parseBalance(file: File): Promise<BalanceData> {}

// ✅ Use Zod pentru validare runtime
const UploadSchema = z.object({
  file: z.instanceof(File),
  companyId: z.string().uuid(),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
});

// ✅ Use decimal.js pentru calcule financiare
import Decimal from "decimal.js";
const total = new Decimal(amount1).plus(amount2).toNumber();

// ❌ NU folosi number pentru sume financiare
// const total = amount1 + amount2; // Poate avea erori de precizie
```

---

## 10. Setup Development Environment

### 10.1 Prerequisites

- Node.js 18.x sau 20.x
- pnpm (recomandat) sau npm
- Git
- VS Code cu extensii recomandate:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar)

### 10.2 Instalare

```bash
# 1. Clone repository
git clone https://github.com/your-org/finguard.git
cd finguard

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.local.example .env.local

# 4. Setup Supabase (local sau cloud)
# - Creează proiect pe supabase.com
# - Copiază URL și anon key în .env.local

# 5. Setup Clerk
# - Creează aplicație pe clerk.com
# - Copiază keys în .env.local

# 6. Run migrations
pnpm db:migrate

# 7. Seed data
pnpm db:seed

# 8. Start development server
pnpm dev
```

### 10.3 Environment Variables

```bash
# .env.local.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Redis (pentru BullMQ)
REDIS_URL=redis://localhost:6379

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 10.4 Scripts Disponibile

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "db:migrate": "supabase db push",
    "db:seed": "tsx scripts/seed-data.ts",
    "db:generate-types": "supabase gen types typescript --local > src/types/database.ts"
  }
}
```

---

## 11. Deployment & Infrastructure

### 11.1 Deployment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Repository                             │
│                          main branch                             │
└─────────────────────────────┬───────────────────────────────────┘
                              │ push/merge
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI                             │
│  • Run linting                                                   │
│  • Run type checking                                             │
│  • Run unit tests                                                │
│  • Run E2E tests                                                 │
│  • Security scan                                                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │ all checks pass
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Vercel Deploy                              │
│  • Automatic preview for PRs                                     │
│  • Production deploy on main                                     │
│  • Edge functions enabled                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Infrastructure Services

| Service  | Environment | Purpose                    |
| -------- | ----------- | -------------------------- |
| Vercel   | Production  | Frontend + API hosting     |
| Supabase | Production  | PostgreSQL + Storage + RLS |
| Upstash  | Production  | Redis pentru BullMQ        |
| Clerk    | Production  | Authentication             |
| Sentry   | Production  | Error tracking             |

### 11.3 Environment-uri

- **Development**: `localhost:3000`
- **Preview**: `finguard-git-{branch}.vercel.app`
- **Staging**: `staging.finguard.ro`
- **Production**: `app.finguard.ro`

---

## 12. Testing Strategy

### 12.1 Test Pyramid

```
            ┌─────────────────┐
           /   E2E Tests     \     (10%)
          /   (Playwright)    \    - Critical user flows
         /─────────────────────\
        /   Integration Tests   \   (20%)
       /    (API + Database)     \  - API endpoints
      /───────────────────────────\
     /      Unit Tests             \  (70%)
    /   (Jest + Testing Library)    \ - Components, hooks, utils
   /─────────────────────────────────\
```

### 12.2 Coverage Requirements

| Categorie      | Minimum Coverage |
| -------------- | ---------------- |
| Business Logic | 90%              |
| Components     | 85%              |
| Utilities      | 95%              |
| API Routes     | 80%              |
| Overall        | 85%              |

### 12.3 Comenzi Testing

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# E2E tests
pnpm test:e2e

# E2E în headed mode (vizual)
pnpm test:e2e:headed
```

---

## 13. Onboarding Checklist

### Săptămâna 1: Setup & Basics

- [ ] Clonează repository și instalează dependencies
- [ ] Configurează environment variables (.env.local)
- [ ] Rulează aplicația local (`pnpm dev`)
- [ ] Explorează structura proiectului
- [ ] Citește documentația existentă (PRD, plan.md)
- [ ] Setup editor cu extensiile recomandate
- [ ] Familiarizare cu Supabase Dashboard
- [ ] Familiarizare cu Clerk Dashboard

### Săptămâna 2: Deep Dive

- [ ] Înțelege schema bazei de date
- [ ] Explorează API endpoints existente
- [ ] Rulează testele și înțelege test coverage
- [ ] Familiarizare cu shadcn/ui components
- [ ] Înțelege fluxul de autentificare (Clerk → Webhook → DB)
- [ ] Înțelege fluxul de procesare balanță
- [ ] Review coding conventions și JSDoc style

### Săptămâna 3: First Contributions

- [ ] Pick un task din backlog (Phase 0 sau Phase 1)
- [ ] Creează branch și implementează feature
- [ ] Scrie teste pentru feature-ul implementat
- [ ] Creează PR și adresează review feedback
- [ ] Merge primul contribution

### Resurse Importante

| Resursă               | Link                                      |
| --------------------- | ----------------------------------------- |
| PRD Complet           | `app-guidelines/PRD-generator-final1.md`  |
| Implementation Plan   | `app-guidelines/plan.md`                  |
| App Description       | `app-guidelines/app-final.md`             |
| Competitive Research  | `.cursor/rules/research.md`               |
| Commenting Guidelines | `.cursor/rules/commenting-guidelines.mdc` |
| Debugging Guidelines  | `.cursor/rules/master_debugge.mdc`        |

---

## Quick Reference Card

### Comenzi Frecvente

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build pentru production
pnpm lint             # Check linting
pnpm type-check       # Check TypeScript

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed test data
pnpm db:generate-types # Generate TypeScript types

# Testing
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
```

### Folder Structure Quick Reference

```
src/
├── app/           → Pages și API routes (Next.js App Router)
├── components/    → React components
│   ├── ui/        → shadcn/ui primitives
│   └── [feature]/ → Feature-specific components
├── lib/           → Business logic și utilities
│   ├── calculations/ → KPI engine, validators
│   └── integrations/ → File parsing, PDF generation
├── hooks/         → Custom React hooks
├── store/         → Redux state management
└── types/         → TypeScript type definitions
```

---

**Document menținut de:** Engineering Team  
**Ultima actualizare:** Ianuarie 2026  
**Next review:** După finalizarea Phase 0
