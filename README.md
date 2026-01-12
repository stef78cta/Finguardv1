# FinGuard - Analiză Financiară Automată

Platformă SaaS pentru analiza automată a situațiilor financiare pentru companiile din România.

## 📊 Status Dezvoltare

**PHASE 0: Foundation Setup** - ✅ **100% COMPLETĂ**

- ✅ Supabase Database Setup (17 tabele, RLS, seed data)
- ✅ Project Bootstrap (Next.js 14, TypeScript, Tailwind, shadcn/ui)
- ✅ Authentication Integration (Clerk - complet configurat și verificat)
- ✅ Supabase Client Setup (browser/server clients, TypeScript types)
- ✅ File Storage Configuration (Supabase Storage cu RLS)
- ✅ UI Component Library (shadcn/ui, dark mode, theme toggle)
- ✅ Dashboard Layout (sidebar, header, responsive design)

**PHASE 1: MVP Features** - 🔄 **În Progres** (2/11 tasks complete)

- ✅ 1.1 UI Component Library
- ✅ 1.2 Dashboard Layout
- ⏳ 1.3 Company Management (Next)
- ⬜ 1.4 Trial Balance Processing Engine
- ⬜ 1.5 File Upload UI
- ⬜ 1.6-1.11 (Additional MVP features)

## 🚀 Caracteristici Principale

- **Procesare Automată**: Upload balanță contabilă (Excel/CSV) cu validare inteligentă
- **25+ KPI-uri**: Indicatori financiari calculați automat (lichiditate, profitabilitate, eficiență)
- **Situații Financiare**: Generare automată bilanț și cont de profit și pierdere
- **Rapoarte PDF**: Export rapoarte profesionale cu grafice și analize
- **Analiză Comparativă**: Comparație între perioade multiple
- **Multi-tenant**: Suport pentru multiple companii per utilizator

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **File Processing**: xlsx, papaparse
- **Reports**: @react-pdf/renderer
- **Charts**: Recharts

## 📋 Cerințe Sistem

- Node.js >= 18.17.0
- npm >= 9.0.0

## 🏃‍♂️ Instalare și Rulare

### 1. Instalare dependențe

```bash
npm install
```

### 2. Configurare variabile de mediu

Creați fișier `.env.local` bazat pe `.env.local.example`:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 3. Rulare în modul development

```bash
npm run dev
```

Aplicația va fi disponibilă la [http://localhost:3000](http://localhost:3000)

### 4. Build pentru producție

```bash
npm run build
npm start
```

## 📁 Structura Proiectului

```
finguard/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route group pentru autentificare
│   ├── dashboard/         # Dashboard utilizatori
│   ├── admin/             # Panel administrare
│   └── api/               # API routes
├── components/            # Componente React
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── forms/            # Form components
├── lib/                  # Librării și utilități
│   ├── supabase/        # Supabase clients
│   ├── auth/            # Clerk auth
│   ├── calculations/    # KPI engine
│   └── utils/           # Utilități generale
├── hooks/               # Custom React hooks
├── types/               # TypeScript types
└── database/            # Schema SQL și migrations
```

## 🧪 Testing

```bash
# Lint
npm run lint

# Type checking
npm run type-check

# E2E tests (Playwright)
npm run test
```

## 📖 Documentație

### Setup & Configuration

- [Supabase Setup](./TASK_0.0_SUPABASE_SETUP.md) - Database configuration și schema
- [Authentication Setup](./TASK_0.3_AUTHENTICATION.md) - Clerk integration
- [Clerk Dashboard Config](./TASK_0.3.1_CLERK_DASHBOARD_CONFIG.md) - Configurare completă Clerk
- [Clerk Quick Start](./CLERK_AUTOMATION_QUICK_START.md) - Ghid rapid automatizare Clerk
- [File Storage](./TASK_0.5_STORAGE.md) - Supabase Storage configuration
- [Environment Setup](./ENV_SETUP.md) - Variabile de mediu

### Development

- [Plan de Implementare](./app-guidelines/plan.md) - Roadmap complet
- [Tech Stack](./app-guidelines/tech-stack.md) - Detalii tehnologice
- [Database Schema](./database/README.md) - Schema completă și RLS policies

### Scripts

- **Clerk Automation**: `npm run clerk:verify`, `npm run clerk:monitor`
- **Database Types**: `npm run db:types` - Regenerare TypeScript types
- **Testing**: `npm run test`, `npm run test:ui`

## 🔐 Securitate

- Row Level Security (RLS) activat în Supabase
- Autentificare multi-tenant cu Clerk
- Validare strictă input-uri
- Headers de securitate configurate
- Rate limiting pe API endpoints

## 📝 License

Copyright © 2024 FinGuard. All rights reserved.

## 👥 Contact

Pentru suport sau întrebări: support@finguard.ro
