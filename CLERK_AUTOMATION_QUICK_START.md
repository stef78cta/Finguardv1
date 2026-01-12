# Clerk Configuration - Quick Start Automatizat

> **🤖 Ghid rapid pentru configurarea automată Clerk folosind scripturi**

---

## ✅ Verificare Prerequisite

Înainte de a începe, verifică că ai:

- [x] Cont Clerk creat la [dashboard.clerk.com](https://dashboard.clerk.com)
- [x] Aplicație Clerk creată (Development sau Production)
- [x] Node.js 18+ instalat
- [x] Dependințe npm instalate (`npm install` a fost rulat)

---

## 🚀 Setup în 5 Pași

### Pas 1: Obține Backend API Key

1. Accesează [Clerk Dashboard](https://dashboard.clerk.com)
2. Selectează aplicația ta
3. **Settings → API Keys**
4. Scroll down la secțiunea **"Backend API Keys"**
5. Click **"Create Backend API Key"**
   - Name: `FinGuard Automation`
   - Permissions: **Select All**
6. **COPIAZĂ CHEIA IMEDIAT** (format: `bapi_xxxxxxxxxx`)

### Pas 2: Configurează Environment Variables

Adaugă în `.env.local`:

```env
# Clerk Management API (pentru scripturi)
CLERK_BACKEND_API_KEY=bapi_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Verifică că ai și:
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Pas 3: (Opțional) Creează Config Files

Pentru configurare customizată, creează:

**`config/clerk.development.json`:**

```json
{
  "environment": "development",
  "appUrl": "http://localhost:3000",
  "webhookUrl": "https://your-ngrok-url.ngrok.io/api/webhook/clerk"
}
```

Sau copiază din exemplele disponibile:

```bash
copy config\clerk.development.json.example config\clerk.development.json
copy config\clerk.production.json.example config\clerk.production.json
```

### Pas 4: Rulează Setup Script

```bash
# Pentru development
npm run clerk:setup:dev

# Pentru production
npm run clerk:setup:prod
```

**Output așteptat:**

```
╔═══════════════════════════════════════════════════════════╗
║   🚀 CLERK DASHBOARD - SETUP AUTOMAT                      ║
╚═══════════════════════════════════════════════════════════╝

🔍 Verificare variabile de mediu...
✅ Toate variabilele necesare sunt setate

🧪 Testare conexiune Clerk API...
✅ Conexiune API funcțională!

🔗 Configurare webhook...
⚠️  Webhook-ul trebuie configurat manual în Clerk Dashboard:
  URL: http://localhost:3000/api/webhook/clerk
  Events: user.created, user.updated, user.deleted

🔀 Configurare instance settings...
```

### Pas 5: Completare Manuală în Dashboard

Scriptul va afișa instrucțiuni pentru configurări care trebuie făcute manual:

**A. Configurare Webhook** (2 minute)

1. Dashboard → **Webhooks** → **Add Endpoint**
2. URL: `http://localhost:3000/api/webhook/clerk` (pentru dev) sau URL ngrok
3. Selectează evenimente:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. **COPIAZĂ Signing Secret** (format: `whsec_xxxxxx`)
5. Adaugă în `.env.local`:

```env
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**B. Configurare Paths** (1 minut)

Dashboard → **Settings** → **Paths**:

- Sign-in path: `/sign-in`
- Sign-up path: `/sign-up`
- After sign-in URL: `/dashboard`
- After sign-up URL: `/dashboard`

**C. Security Settings** (1 minut)

Dashboard → **Settings** → **Attack Protection**:

- ✅ Enable bot detection
- ✅ Enable rate limiting (5 attempts/15 min)
- ✅ Block disposable emails

**D. Session Settings** (1 minut)

Dashboard → **Settings** → **Sessions**:

- Session lifetime: 7 days
- Inactivity timeout: 1 day

---

## ✅ Verificare Configurare

După completarea pașilor, verifică că totul e configurat corect:

```bash
npm run clerk:verify
```

**Output așteptat:**

```
╔═══════════════════════════════════════════════════════════╗
║   🔍 CLERK CONFIGURATION - VERIFICARE                     ║
╚═══════════════════════════════════════════════════════════╝

🔍 Verificare conexiune API...
✅ Conexiune API funcțională

🌍 Verificare environment...
   Backend API Key: ✓ Setat
   Secret Key: ✓ Setat
   Publishable Key: ✓ Setat
   Webhook Secret: ✓ Setat
   App URL: http://localhost:3000

👥 Verificare utilizatori...
✅ Găsiți 0 utilizatori

✅ ✅ ✅  CONFIGURARE VALIDATĂ  ✅ ✅ ✅
```

---

## 🧪 Testare End-to-End

1. **Start development server:**

```bash
npm run dev
```

2. **Test sign-up flow:**
   - Accesează `http://localhost:3000/sign-up`
   - Completează formularul cu email de test
   - Verifică email și confirmă contul
   - Ar trebui să fii redirectat la `/dashboard`

3. **Verifică webhook sync:**

   ```bash
   # În alt terminal, monitorizează logs
   # Ar trebui să vezi: "[Clerk Webhook] User created successfully"
   ```

4. **Verifică Supabase:**
   - Accesează Supabase Dashboard
   - Table Editor → `users`
   - Utilizatorul nou ar trebui să apară cu:
     - `subscription_tier: 'free'`
     - `subscription_status: 'trial'`
     - `trial_ends_at: NOW() + 14 days`

---

## 🔄 Health Monitoring (Opțional)

Pentru monitoring continuu al health status Clerk:

```bash
# Rulează monitoring continuu (verificare la 5 minute)
npm run clerk:monitor

# Sau o singură verificare
npm run clerk:monitor:once
```

**Output:**

```
╔═══════════════════════════════════════════════════════════╗
║   🏥 CLERK HEALTH MONITOR - STARTED                       ║
╚═══════════════════════════════════════════════════════════╝

Configuration:
  Check interval: 5 minutes
  Alert threshold: 3 consecutive failures
  API response warning: 3000ms
  Slack alerts: Disabled

[20:15:30] ℹ 🏥 Starting health checks...
[20:15:31] ✅ Health check PASSED (API: 234ms, Users: 5)
```

Pentru alerte Slack, adaugă în `.env.local`:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

---

## 🐛 Troubleshooting

### Eroare: "Invalid Backend API Key"

**Soluție:**

```bash
# Verifică că variabila e setată
cat .env.local | grep CLERK_BACKEND_API_KEY

# Verifică că începe cu bapi_
# Restart server după modificare
```

### Webhook nu funcționează în development

**Soluție:** Folosește ngrok pentru a expune localhost:

```bash
# Instalează ngrok
choco install ngrok  # Windows
brew install ngrok   # macOS

# Start ngrok
ngrok http 3000

# Copiază URL-ul (ex: https://abc123.ngrok.io)
# Actualizează webhook URL în Clerk Dashboard:
# https://abc123.ngrok.io/api/webhook/clerk
```

### Setup script eșuează

**Soluție:**

```bash
# Verifică că dependințele sunt instalate
npm install

# Verifică Node.js version
node --version  # Ar trebui să fie 18+

# Rulează cu debug
NODE_ENV=development node scripts/setup-clerk.js
```

---

## 📚 Documentație Completă

Pentru detalii complete despre toate opțiunile și configurările:

- **Task Document:** `TASK_0.3.1_CLERK_DASHBOARD_CONFIG.md`
- **Scripts README:** `scripts/README.md`
- **Clerk Docs:** [https://clerk.com/docs](https://clerk.com/docs)

---

## 🎯 Next Steps

După configurare completă:

1. ✅ Marchează Task 0.3.1 ca COMPLETED în `plan.md`
2. ✅ Testează authentication flow complet
3. ✅ Verifică webhook sync în Supabase
4. 🚀 Începe Task 1.3 - Company Management (primul task MVP)

---

## 💡 Tips

- **Pentru CI/CD:** Folosește GitHub Actions workflow din `TASK_0.3.1_CLERK_DASHBOARD_CONFIG.md`
- **Pentru production:** Creează aplicație separată Clerk Production cu API keys `pk_live_` și `sk_live_`
- **Pentru debugging:** Rulează `npm run clerk:verify` periodic pentru a valida configurarea
- **Pentru monitoring:** Folosește `npm run clerk:monitor` în production pentru early detection problems

---

**Ultima actualizare:** 2026-01-11  
**Versiune:** 1.0.0  
**Status:** ✅ READY TO USE
