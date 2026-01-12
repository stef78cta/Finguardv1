# Scripts de Automatizare

Acest folder conține scripturi pentru automatizarea setup-ului și maintenance-ului aplicației FinGuard.

## 📋 Scripturi Disponibile

### 🔧 Clerk Setup și Management

#### `setup-clerk.js`

**Scop:** Configurare automată completă a Clerk Dashboard prin Management API.

**Usage:**

```bash
# Development environment
npm run clerk:setup:dev

# Production environment
npm run clerk:setup:prod
```

**Ce configurează:**

- ✅ Webhook pentru sincronizare utilizatori cu Supabase
- ✅ Authentication settings (email verification, password policy)
- ✅ Session settings (lifetime, inactivity timeout)
- ✅ Security features (rate limiting, bot detection, block disposable emails)
- ✅ Redirect URLs

**Prerequisite:**

- `CLERK_BACKEND_API_KEY` setat în `.env.local`
- `NEXT_PUBLIC_APP_URL` setat în `.env.local`

**Output:**

Scriptul va afișa `CLERK_WEBHOOK_SECRET` - **salvează această valoare în `.env.local`**!

---

#### `verify-clerk-config.js`

**Scop:** Verificare că toate configurările Clerk sunt aplicate corect.

**Usage:**

```bash
npm run clerk:verify
```

**Verificări:**

- ✅ Instance settings (URLs, environment)
- ✅ Webhooks active și configurate corect
- ✅ Email settings
- ✅ Password policy
- ✅ Security settings

**Când să rulezi:**

- După `setup-clerk.js` pentru a confirma configurarea
- Periodic (lunar) pentru a valida că setările nu au fost modificate manual
- Înainte de deployment în production

---

#### `monitor-clerk-health.js`

**Scop:** Monitoring continuu al health status pentru Clerk integration.

**Usage:**

```bash
# Rulează în background
npm run clerk:monitor

# Sau cu PM2 pentru production
pm2 start scripts/monitor-clerk-health.js --name clerk-monitor
```

**Ce monitorizează:**

- ✅ Webhook status (active/inactive)
- ✅ Success rate webhooks (ultimeale 24h)
- ✅ API connectivity

**Alerting:**

Scriptul trimite alerte când:

- Success rate < 95%
- Niciun webhook activ
- API connectivity issues

---

## 🚀 Quick Start

### Primul Setup (Abordare Automatizată)

1. **Obține Backend API Key:**
   - Accesează Clerk Dashboard → Settings → API Keys
   - Creează **Backend API Key** cu toate permisiunile
   - Salvează în `.env.local`:

     ```env
     CLERK_BACKEND_API_KEY=bapi_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     ```

2. **Instalează dependințe:**

```bash
npm install --save-dev @clerk/backend dotenv
```

3. **Rulează setup:**

```bash
npm run clerk:setup:dev
```

4. **Salvează webhook secret:**
   - Copiază `CLERK_WEBHOOK_SECRET` din output
   - Adaugă în `.env.local`

5. **Verifică configurarea:**

```bash
npm run clerk:verify
```

---

## 📝 npm Scripts Available

Adaugă în `package.json`:

```json
{
  "scripts": {
    "clerk:setup": "node scripts/setup-clerk.js",
    "clerk:setup:dev": "NODE_ENV=development node scripts/setup-clerk.js",
    "clerk:setup:prod": "NODE_ENV=production node scripts/setup-clerk.js",
    "clerk:verify": "node scripts/verify-clerk-config.js",
    "clerk:monitor": "node scripts/monitor-clerk-health.js"
  }
}
```

---

## 🔒 Security Best Practices

### Environment Variables

**NICIODATĂ** nu commita fișiere care conțin:

- ❌ `CLERK_BACKEND_API_KEY`
- ❌ `CLERK_SECRET_KEY`
- ❌ `CLERK_WEBHOOK_SECRET`

Aceste valori trebuie să fie:

- ✅ În `.env.local` (local development)
- ✅ În CI/CD secrets (GitHub/GitLab)
- ✅ În platform environment variables (Vercel/Netlify)

### .gitignore

Verifică că `.gitignore` conține:

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Scripts logs
scripts/*.log
scripts/output/
```

---

## 🧪 Testing în CI/CD

### GitHub Actions

Exemplu workflow pentru automatic setup în staging/production:

```yaml
name: Setup Clerk Configuration

on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      
      - name: Setup Clerk
        env:
          CLERK_BACKEND_API_KEY: ${{ secrets.CLERK_BACKEND_API_KEY }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.APP_URL }}
        run: npm run clerk:setup
      
      - name: Verify Configuration
        run: npm run clerk:verify
```

---

## 🐛 Troubleshooting

### Error: "Invalid Backend API Key"

**Cauză:** `CLERK_BACKEND_API_KEY` lipsește sau invalid.

**Soluție:**

1. Verifică că variabila este setată în `.env.local`
2. Verifică că cheia începe cu `bapi_`
3. Verifică că nu ai spații la început/sfârșit
4. Restart server după modificarea `.env.local`

### Error: "Webhook already exists"

**Cauză:** Scriptul a fost rulat deja și webhook-ul există.

**Soluție:**

Scriptul detectează automat webhook-uri existente și nu creează duplicate. Dacă vezi acest warning, înseamnă că webhook-ul există deja - **aceasta este OK**.

Pentru a recrea webhook-ul:

1. Șterge webhook-ul existent din Clerk Dashboard
2. Rulează din nou scriptul

### Error: "Cannot read configuration"

**Cauză:** Fișier config lipsește pentru environment specificat.

**Soluție:**

Creează `config/clerk.{environment}.json`:

```bash
# Development
cp config/clerk.development.json.example config/clerk.development.json

# Production
cp config/clerk.production.json.example config/clerk.production.json
```

---

## 📚 Documentație Adițională

- [Clerk Management API Documentation](https://clerk.com/docs/reference/backend-api)
- [Clerk Webhooks Guide](https://clerk.com/docs/integrations/webhooks)
- [Task 0.3.1 - Configurare Clerk Dashboard](../TASK_0.3.1_CLERK_DASHBOARD_CONFIG.md)

---

## 🤝 Contributing

Când adaugi scripturi noi în acest folder:

1. **Documentează** scriptul în acest README
2. **Adaugă npm script** în `package.json`
3. **Include error handling** și logging clar
4. **Testează** în toate environmenturile (dev, staging, prod)
5. **Adaugă examples** în acest README

---

## 📞 Support

Pentru probleme cu scripturile:

1. Verifică secțiunea **Troubleshooting** mai sus
2. Verifică logs: scripturile afișează mesaje detaliate
3. Check Clerk Dashboard pentru a vedea ce s-a configurat efectiv
4. Consultă documentația Clerk Management API

---

**Ultima actualizare:** 2026-01-11  
**Versiune:** 1.0.0  
**Autor:** FinGuard Development Team
