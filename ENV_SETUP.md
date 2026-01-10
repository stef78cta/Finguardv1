# Environment Variables Setup

## Fișier `.env.local` Necesar

Creează un fișier `.env.local` în rădăcina proiectului cu următoarele variabile:

```env
# Clerk Authentication
# Get these from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Clerk Webhook Secret (for user sync)
CLERK_WEBHOOK_SECRET=whsec_xxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Pași pentru Configurare

### 1. Clerk Setup

1. Mergi la https://dashboard.clerk.com
2. Creează un nou proiect sau selectează unul existent
3. În Settings → API Keys, copiază:
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`

### 2. Clerk Webhook Setup

1. În Clerk Dashboard → Webhooks
2. Creează un nou endpoint: `https://your-domain.com/api/webhook/clerk`
3. Selectează evenimentele: `user.created`, `user.updated`, `user.deleted`
4. Copiază **Signing Secret** → `CLERK_WEBHOOK_SECRET`

### 3. Supabase Setup

1. Mergi la https://supabase.com/dashboard
2. Selectează proiectul tău
3. În Settings → API:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

### 4. Development URL

Pentru dezvoltare locală:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Pentru producție, actualizează cu domeniul tău real.

## Securitate

⚠️ **IMPORTANT**: 
- Nu commita niciodată fișierul `.env.local` în git
- `SUPABASE_SERVICE_ROLE_KEY` și `CLERK_SECRET_KEY` sunt extrem de sensibile
- Folosește variabilele cu prefix `NEXT_PUBLIC_` doar pentru date care pot fi expuse în browser
