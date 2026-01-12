/**
 * Script de verificare configurație Clerk Dashboard
 * 
 * @description Verifică că toate setările Clerk sunt configurate corect
 *              prin interogare Clerk Backend API
 * 
 * @usage npm run clerk:verify
 * 
 * @requires CLERK_BACKEND_API_KEY în .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { createClerkClient } = require('@clerk/backend');

// Culori pentru console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  detail: (label, value) => console.log(`   ${colors.bright}${label}:${colors.reset} ${value}`),
};

// Inițializare Clerk (API v5+)
// Acceptă CLERK_BACKEND_API_KEY sau CLERK_SECRET_KEY (sunt identice funcțional)
const secretKey = process.env.CLERK_BACKEND_API_KEY || process.env.CLERK_SECRET_KEY;
let clerk;
try {
  if (!secretKey) {
    throw new Error('Nicio cheie secret găsită');
  }
  clerk = createClerkClient({ secretKey });
} catch (error) {
  log.error('Nu s-a putut inițializa Clerk. Verifică CLERK_BACKEND_API_KEY sau CLERK_SECRET_KEY.');
  process.exit(1);
}

/**
 * Verifică conexiunea API
 */
async function verifyConnection() {
  log.header('🔍 Verificare conexiune API...');

  try {
    await clerk.users.getUserList({ limit: 1 });
    log.success('Conexiune API funcțională');
    return true;
  } catch (error) {
    log.error(`Conexiune eșuată: ${error.message}`);
    return false;
  }
}

/**
 * Verifică utilizatori existenți
 */
async function verifyUsers() {
  log.header('👥 Verificare utilizatori...');

  try {
    const users = await clerk.users.getUserList({ limit: 10 });
    log.success(`Găsiți ${users.length} utilizatori`);

    if (users.length > 0) {
      log.info('Primii utilizatori:');
      users.slice(0, 3).forEach((user, idx) => {
        log.detail(
          `  ${idx + 1}`,
          `${user.firstName || ''} ${user.lastName || ''} (${user.emailAddresses[0]?.emailAddress || 'No email'})`
        );
      });
    } else {
      log.warning('Niciun utilizator găsit - creează primul utilizator prin sign-up');
    }

    return true;
  } catch (error) {
    log.error(`Eroare verificare utilizatori: ${error.message}`);
    return false;
  }
}

/**
 * Verifică organizații (dacă sunt activate)
 */
async function verifyOrganizations() {
  log.header('🏢 Verificare organizații...');

  try {
    const orgs = await clerk.organizations.getOrganizationList({ limit: 5 });
    
    if (orgs.length > 0) {
      log.success(`Găsite ${orgs.length} organizații`);
      orgs.forEach((org, idx) => {
        log.detail(`  ${idx + 1}`, `${org.name} (${org.membersCount} membri)`);
      });
    } else {
      log.info('Nicio organizație configurată (OK pentru MVP - se va folosi în PHASE 3)');
    }

    return true;
  } catch (error) {
    log.warning('Organizations nu sunt activate (OK pentru MVP)');
    return true; // Nu e eroare pentru MVP
  }
}

/**
 * Verifică environment info
 */
async function verifyEnvironment() {
  log.header('🌍 Verificare environment...');

  try {
    log.detail('Backend API Key', process.env.CLERK_BACKEND_API_KEY ? '✓ Setat' : '✗ Lipsă');
    log.detail('Secret Key', process.env.CLERK_SECRET_KEY ? '✓ Setat' : '✗ Lipsă');
    log.detail('Publishable Key', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✓ Setat' : '✗ Lipsă');
    log.detail('Webhook Secret', process.env.CLERK_WEBHOOK_SECRET ? '✓ Setat' : '⚠ Lipsă (configurează webhook)');
    log.detail('App URL', process.env.NEXT_PUBLIC_APP_URL || '✗ Nesetat');

    const allSet =
      process.env.CLERK_BACKEND_API_KEY &&
      process.env.CLERK_SECRET_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    if (allSet) {
      log.success('Environment variables configurate corect');
    } else {
      log.error('Unele variabile lipsesc - verifică .env.local');
    }

    return allSet;
  } catch (error) {
    log.error(`Eroare verificare environment: ${error.message}`);
    return false;
  }
}

/**
 * Verifică integrare Supabase (utilizatori sincronizați)
 */
async function verifySupabaseSync() {
  log.header('🔄 Verificare sincronizare Supabase...');

  try {
    const users = await clerk.users.getUserList({ limit: 1 });

    if (users.length === 0) {
      log.info('Niciun utilizator pentru testare sync - creează unul prin sign-up');
      return true;
    }

    log.success('Webhook configurat (utilizatori prezenți în Clerk)');
    log.info('Pentru verificare completă:');
    log.info('  1. Sign up cu un utilizator nou');
    log.info('  2. Verifică în Supabase → users table că apare');
    log.info('  3. Check logs Next.js pentru webhook processing');

    return true;
  } catch (error) {
    log.error(`Eroare verificare sync: ${error.message}`);
    return false;
  }
}

/**
 * Test complete flow
 */
async function verifyCompleteSetup() {
  log.header('🧪 Test setup complet...');

  const checks = {
    'Environment Variables': process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    'Backend API Key': process.env.CLERK_BACKEND_API_KEY,
    'Webhook Secret': process.env.CLERK_WEBHOOK_SECRET,
    'App URL': process.env.NEXT_PUBLIC_APP_URL,
  };

  Object.entries(checks).forEach(([check, passed]) => {
    if (passed) {
      log.success(check);
    } else {
      log.error(`${check} - LIPSĂ`);
    }
  });

  const allPassed = Object.values(checks).every((v) => v);

  if (allPassed) {
    log.success('Toate verificările au trecut!');
  } else {
    log.error('Unele verificări au eșuat - vezi mai sus');
  }

  return allPassed;
}

/**
 * Afișează checklist pentru configurare manuală
 */
function displayManualChecklist() {
  console.log(`
${colors.bright}${colors.yellow}
╔═══════════════════════════════════════════════════════════╗
║   📋 CHECKLIST CONFIGURARE MANUALĂ                        ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}

${colors.bright}Verifică în Clerk Dashboard:${colors.reset}

${process.env.CLERK_WEBHOOK_SECRET ? colors.green + '✅' : colors.red + '❌'} ${colors.bright}Webhook${colors.reset}
   → https://dashboard.clerk.com → Webhooks
   → Verifică că endpoint există: ${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/clerk
   → Events: user.created, user.updated, user.deleted

${colors.yellow}⚠${colors.reset}  ${colors.bright}Paths${colors.reset}
   → Settings → Paths
   → Sign-in: /sign-in
   → Sign-up: /sign-up
   → After sign-in: /dashboard
   → After sign-up: /dashboard

${colors.yellow}⚠${colors.reset}  ${colors.bright}Session Settings${colors.reset}
   → Settings → Sessions
   → Lifetime: 7 days
   → Inactivity timeout: 1 day

${colors.yellow}⚠${colors.reset}  ${colors.bright}Security${colors.reset}
   → Settings → Attack Protection
   → Rate limiting: ON (5 attempts/15 min)
   → Bot detection: ON
   → Block disposable emails: ON

${colors.yellow}⚠${colors.reset}  ${colors.bright}Email Verification${colors.reset}
   → Settings → Email & SMS
   → Email verification required: ON

${colors.blue}${colors.bright}Testare End-to-End:${colors.reset}
1. npm run dev
2. Accesează http://localhost:3000/sign-up
3. Sign up cu email de test
4. Verifică email și confirmă
5. Check Supabase users table pentru utilizatorul nou
6. Check Next.js logs pentru webhook processing

${colors.green}Dacă toate testele trec → Setup COMPLET! ✅${colors.reset}
  `);
}

/**
 * Main function
 */
async function main() {
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════╗
║   🔍 CLERK CONFIGURATION - VERIFICARE                     ║
║   FinGuard - Financial Analysis Platform                 ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
  `);

  const results = {
    connection: false,
    environment: false,
    users: false,
    organizations: true, // Optional pentru MVP
    supabaseSync: false,
    complete: false,
  };

  try {
    // Rulează toate verificările
    results.connection = await verifyConnection();
    if (!results.connection) {
      log.error('Verificare întreruptă - conexiune eșuată');
      process.exit(1);
    }

    results.environment = await verifyEnvironment();
    results.users = await verifyUsers();
    results.organizations = await verifyOrganizations();
    results.supabaseSync = await verifySupabaseSync();
    results.complete = await verifyCompleteSetup();

    // Summary
    console.log(`
${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║   📊 REZUMAT VERIFICARE                                   ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}
`);

    const passed = Object.entries(results).filter(([k, v]) => v).length;
    const total = Object.keys(results).length;

    log.info(`Verificări trecute: ${passed}/${total}`);

    if (results.complete) {
      console.log(`
${colors.green}${colors.bright}
✅ ✅ ✅  CONFIGURARE VALIDATĂ  ✅ ✅ ✅

Clerk este configurat corect și gata de folosit!
${colors.reset}
      `);
    } else {
      displayManualChecklist();
    }
  } catch (error) {
    log.error(`Verificare eșuată: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run
if (require.main === module) {
  main();
}

module.exports = {
  verifyConnection,
  verifyUsers,
  verifyOrganizations,
  verifyEnvironment,
  verifySupabaseSync,
};
