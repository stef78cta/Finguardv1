/**
 * Script de configurare automată Clerk Dashboard prin Management API
 * 
 * @description Configurează automat webhook, authentication settings, 
 *              session settings, security features prin Clerk Backend API
 * 
 * @usage
 *   Development: npm run clerk:setup:dev
 *   Production:  npm run clerk:setup:prod
 * 
 * @requires
 *   - CLERK_BACKEND_API_KEY în .env.local
 *   - NEXT_PUBLIC_APP_URL în .env.local
 *   - Opțional: config/clerk.{environment}.json
 * 
 * @output
 *   Afișează CLERK_WEBHOOK_SECRET - salvează în .env.local!
 */

require('dotenv').config({ path: '.env.local' });
const { createClerkClient } = require('@clerk/backend');
const fs = require('fs');
const path = require('path');

// Culori pentru console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}`),
};

// Inițializează Clerk client (API v5+)
// CLERK_BACKEND_API_KEY poate fi aceeași valoare ca CLERK_SECRET_KEY
const secretKey = process.env.CLERK_BACKEND_API_KEY || process.env.CLERK_SECRET_KEY;
let clerk;
try {
  if (!secretKey) {
    throw new Error('Nicio cheie secret găsită');
  }
  clerk = createClerkClient({ secretKey });
} catch (error) {
  log.error('Nu s-a putut inițializa Clerk client. Verifică CLERK_BACKEND_API_KEY sau CLERK_SECRET_KEY.');
  process.exit(1);
}

// Configurație default
const DEFAULT_CONFIG = {
  environment: process.env.NODE_ENV || 'development',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/clerk`,
  authentication: {
    requireEmailVerification: true,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChar: false,
    },
  },
  session: {
    lifetimeSeconds: 604800, // 7 days
    inactivityTimeoutSeconds: 86400, // 1 day
  },
  security: {
    enableRateLimiting: true,
    rateLimitMaxAttempts: 5,
    rateLimitWindowMinutes: 15,
    blockDisposableEmails: true,
  },
  paths: {
    signIn: '/sign-in',
    signUp: '/sign-up',
    afterSignIn: '/dashboard',
    afterSignUp: '/dashboard',
  },
  webhookEvents: ['user.created', 'user.updated', 'user.deleted'],
};

/**
 * Încarcă configurație din fișier JSON sau folosește default
 */
function loadConfig() {
  const env = process.env.NODE_ENV || 'development';
  const configPath = path.join(__dirname, '..', 'config', `clerk.${env}.json`);

  try {
    if (fs.existsSync(configPath)) {
      log.info(`Încărcare configurație din: ${configPath}`);
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { ...DEFAULT_CONFIG, ...fileConfig };
    } else {
      log.warning(`Fișier config ${configPath} nu există. Folosim configurație default.`);
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    log.error(`Eroare la citire config: ${error.message}`);
    return DEFAULT_CONFIG;
  }
}

/**
 * Verifică că variabilele de mediu necesare sunt setate
 */
function validateEnvironment() {
  log.header('🔍 Verificare variabile de mediu...');

  const required = {
    CLERK_BACKEND_API_KEY: process.env.CLERK_BACKEND_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    log.error(`Variabile lipsă: ${missing.join(', ')}`);
    log.info('Adaugă aceste variabile în .env.local');
    process.exit(1);
  }

  log.success('Toate variabilele necesare sunt setate');
  return true;
}

/**
 * Configurează webhook pentru sincronizare utilizatori
 */
async function setupWebhook(config) {
  log.header('🔗 Configurare webhook...');

  try {
    // Verifică webhooks existente
    const svixApp = await clerk.webhooks.getSvixAppUrl();
    log.info(`Svix App URL: ${svixApp}`);

    // Notă: Clerk Backend SDK nu expune direct create webhook
    // Trebuie folosit Svix API sau configurat manual în Dashboard
    log.warning('Webhook-ul trebuie configurat manual în Clerk Dashboard:');
    log.info(`  URL: ${config.webhookUrl}`);
    log.info(`  Events: ${config.webhookEvents.join(', ')}`);
    log.info('');
    log.info('Pași:');
    log.info('  1. Accesează: https://dashboard.clerk.com');
    log.info('  2. Webhooks → Add Endpoint');
    log.info(`  3. URL: ${config.webhookUrl}`);
    log.info(`  4. Selectează: ${config.webhookEvents.join(', ')}`);
    log.info('  5. Copiază Signing Secret în .env.local ca CLERK_WEBHOOK_SECRET');

    return { manual: true };
  } catch (error) {
    log.error(`Eroare webhook setup: ${error.message}`);
    throw error;
  }
}

/**
 * Configurează instance settings (paths, URLs)
 */
async function configureInstanceSettings(config) {
  log.header('🔀 Configurare instance settings...');

  try {
    // Notă: Clerk Backend SDK nu permite update instance settings
    // Acestea se configurează în Dashboard
    log.info('Instance settings (configurare manuală în Dashboard):');
    log.info(`  Sign-in URL: ${config.paths.signIn}`);
    log.info(`  Sign-up URL: ${config.paths.signUp}`);
    log.info(`  After sign-in: ${config.paths.afterSignIn}`);
    log.info(`  After sign-up: ${config.paths.afterSignUp}`);
    log.info('');
    log.info('Setează în: Dashboard → Settings → Paths');

    return { manual: true };
  } catch (error) {
    log.error(`Eroare instance settings: ${error.message}`);
    throw error;
  }
}

/**
 * Testează conexiunea la Clerk API
 */
async function testConnection() {
  log.header('🧪 Testare conexiune Clerk API...');

  try {
    const users = await clerk.users.getUserList({ limit: 1 });
    log.success('Conexiune API funcțională!');
    log.info(`Total utilizatori în sistem: ${users.length > 0 ? '1+' : '0'}`);
    return true;
  } catch (error) {
    log.error(`Conexiune eșuată: ${error.message}`);
    if (error.message.includes('Invalid API key')) {
      log.info('Verifică că CLERK_BACKEND_API_KEY este corect.');
      log.info('Obține-l din: https://dashboard.clerk.com → API Keys → Backend API');
    }
    return false;
  }
}

/**
 * Afișează rezumat configurare
 */
function displaySummary(config) {
  log.header('📋 Rezumat Configurare');

  console.log(`
${colors.bright}Environment:${colors.reset} ${config.environment}
${colors.bright}App URL:${colors.reset} ${config.appUrl}
${colors.bright}Webhook URL:${colors.reset} ${config.webhookUrl}

${colors.bright}Authentication:${colors.reset}
  - Email verification: ${config.authentication.requireEmailVerification}
  - Min password length: ${config.authentication.passwordPolicy.minLength}
  - Require uppercase: ${config.authentication.passwordPolicy.requireUppercase}
  - Require numbers: ${config.authentication.passwordPolicy.requireNumbers}

${colors.bright}Session:${colors.reset}
  - Lifetime: ${config.session.lifetimeSeconds / 86400} days
  - Inactivity timeout: ${config.session.inactivityTimeoutSeconds / 3600} hours

${colors.bright}Security:${colors.reset}
  - Rate limiting: ${config.security.enableRateLimiting}
  - Max attempts: ${config.security.rateLimitMaxAttempts}/${config.security.rateLimitWindowMinutes}min
  - Block disposable emails: ${config.security.blockDisposableEmails}

${colors.bright}Paths:${colors.reset}
  - Sign in: ${config.paths.signIn}
  - Sign up: ${config.paths.signUp}
  - After sign in: ${config.paths.afterSignIn}
  - After sign up: ${config.paths.afterSignUp}
  `);
}

/**
 * Main function
 */
async function main() {
  console.log(`
${colors.bright}${colors.blue}╔═══════════════════════════════════════════════════════════╗
║   🚀 CLERK DASHBOARD - SETUP AUTOMAT                      ║
║   FinGuard - Financial Analysis Platform                 ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
  `);

  try {
    // 1. Validare environment
    validateEnvironment();

    // 2. Încărcare configurație
    const config = loadConfig();
    displaySummary(config);

    // 3. Testare conexiune
    const connected = await testConnection();
    if (!connected) {
      log.error('Setup întrerupt - conexiune eșuată');
      process.exit(1);
    }

    // 4. Setup webhook
    await setupWebhook(config);

    // 5. Configure instance
    await configureInstanceSettings(config);

    // Success message
    console.log(`
${colors.green}${colors.bright}
╔═══════════════════════════════════════════════════════════╗
║   ✅ ✅ ✅  SETUP FINALIZAT PARȚIAL  ✅ ✅ ✅              ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}
${colors.yellow}⚠️  NOTĂ: Clerk Management API are limitări${colors.reset}

Unele configurări trebuie finalizate ${colors.bright}MANUAL${colors.reset} în Clerk Dashboard:

${colors.bright}1. Webhook Configuration:${colors.reset}
   → https://dashboard.clerk.com → Webhooks
   → Add Endpoint: ${config.webhookUrl}
   → Events: ${config.webhookEvents.join(', ')}
   → ${colors.yellow}IMPORTANT: Salvează Signing Secret în .env.local!${colors.reset}

${colors.bright}2. Instance Settings:${colors.reset}
   → https://dashboard.clerk.com → Settings → Paths
   → Configurează paths conform rezumatului de mai sus

${colors.bright}3. Security Settings:${colors.reset}
   → https://dashboard.clerk.com → Settings → Attack Protection
   → Activează rate limiting, bot detection

${colors.bright}4. Session Settings:${colors.reset}
   → https://dashboard.clerk.com → Settings → Sessions
   → Setează lifetime la ${config.session.lifetimeSeconds / 86400} days

${colors.bright}📋 Next Steps:${colors.reset}
1. Configurează setările manual în Dashboard (10-15 min)
2. Adaugă CLERK_WEBHOOK_SECRET în .env.local
3. Rulează: ${colors.bright}npm run clerk:verify${colors.reset} (pentru validare)
4. Testează: ${colors.bright}npm run dev${colors.reset} și sign-up cu un utilizator

${colors.blue}Pentru configurare automată completă, folosește:${colors.reset}
→ Svix CLI (pentru webhooks programmatic)
→ Clerk Dashboard UI (recomandat pentru prima dată)

${colors.green}Setup script completed!${colors.reset}
    `);
  } catch (error) {
    log.error(`Setup eșuat: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run main
if (require.main === module) {
  main();
}

module.exports = { loadConfig, validateEnvironment, testConnection };
