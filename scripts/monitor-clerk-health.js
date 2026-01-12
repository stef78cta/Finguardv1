/**
 * Script de monitoring health pentru Clerk integration
 * 
 * @description Monitorizează continuu health status Clerk API și webhook sync
 *              Trimite alerte când detectează probleme
 * 
 * @usage
 *   Development: npm run clerk:monitor
 *   Production:  pm2 start scripts/monitor-clerk-health.js --name clerk-monitor
 * 
 * @requires CLERK_BACKEND_API_KEY în .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { createClerkClient } = require('@clerk/backend');

// Configurare
const CONFIG = {
  checkIntervalMs: 5 * 60 * 1000, // 5 minutes
  alertThreshold: {
    apiResponseTime: 3000, // 3 seconds
    consecutiveFailures: 3,
  },
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    enabled: !!process.env.SLACK_WEBHOOK_URL,
  },
};

// State tracking
const state = {
  consecutiveFailures: 0,
  lastSuccessfulCheck: null,
  lastAlert: null,
  checks: [],
};

// Culori console
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
  info: (msg) => console.log(`${colors.blue}[${timestamp()}] ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}[${timestamp()}] ✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}[${timestamp()}] ⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}[${timestamp()}] ❌ ${msg}${colors.reset}`),
  debug: (msg) => console.log(`${colors.cyan}[${timestamp()}] 🔍 ${msg}${colors.reset}`),
};

function timestamp() {
  return new Date().toISOString().split('T')[1].split('.')[0];
}

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
 * Verifică API health
 */
async function checkApiHealth() {
  const start = Date.now();

  try {
    await clerk.users.getUserList({ limit: 1 });
    const responseTime = Date.now() - start;

    if (responseTime > CONFIG.alertThreshold.apiResponseTime) {
      log.warning(`API response time ridicat: ${responseTime}ms`);
      return { healthy: true, responseTime, warning: true };
    }

    return { healthy: true, responseTime };
  } catch (error) {
    const responseTime = Date.now() - start;
    log.error(`API health check failed: ${error.message}`);
    return { healthy: false, responseTime, error: error.message };
  }
}

/**
 * Verifică utilizatori recenți (ultimele 24h)
 */
async function checkRecentUsers() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const users = await clerk.users.getUserList({ limit: 100 });

    // Filter recent users
    const recentUsers = users.filter(
      (user) => new Date(user.createdAt) > oneDayAgo
    );

    return {
      total: users.length,
      last24h: recentUsers.length,
      healthy: true,
    };
  } catch (error) {
    log.error(`Verificare utilizatori eșuată: ${error.message}`);
    return { healthy: false, error: error.message };
  }
}

/**
 * Trimite alertă Slack
 */
async function sendSlackAlert(message, severity = 'warning') {
  if (!CONFIG.slack.enabled) {
    log.debug('Slack alerting dezactivat (SLACK_WEBHOOK_URL lipsește)');
    return false;
  }

  const colors_map = {
    error: '#ff0000',
    warning: '#ffaa00',
    info: '#0099ff',
    success: '#00ff00',
  };

  const payload = {
    attachments: [
      {
        color: colors_map[severity] || colors_map.warning,
        title: '🚨 Clerk Health Monitor Alert',
        text: message,
        footer: 'FinGuard Monitoring System',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(CONFIG.slack.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      log.info('Slack alert trimisă cu succes');
      return true;
    } else {
      log.warning(`Slack alert failed: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    log.error(`Eroare trimitere Slack alert: ${error.message}`);
    return false;
  }
}

/**
 * Verifică dacă trebuie trimisă alertă
 */
function shouldAlert() {
  // Nu trimite alertă dacă ultima a fost trimisă în ultimele 15 minute
  if (state.lastAlert) {
    const timeSinceLastAlert = Date.now() - state.lastAlert;
    if (timeSinceLastAlert < 15 * 60 * 1000) {
      return false;
    }
  }

  // Trimite alertă dacă avem consecutive failures peste threshold
  return state.consecutiveFailures >= CONFIG.alertThreshold.consecutiveFailures;
}

/**
 * Rulează toate verificările
 */
async function runHealthChecks() {
  log.info('🏥 Starting health checks...');

  const results = {
    timestamp: new Date().toISOString(),
    api: null,
    users: null,
    overall: true,
  };

  // 1. API Health
  results.api = await checkApiHealth();
  if (!results.api.healthy) {
    results.overall = false;
  }

  // 2. Users check
  results.users = await checkRecentUsers();
  if (!results.users.healthy) {
    results.overall = false;
  }

  // Update state
  if (results.overall) {
    state.consecutiveFailures = 0;
    state.lastSuccessfulCheck = Date.now();
    log.success(
      `Health check PASSED (API: ${results.api.responseTime}ms, Users: ${results.users.total})`
    );
  } else {
    state.consecutiveFailures++;
    log.error(
      `Health check FAILED (${state.consecutiveFailures} consecutive failures)`
    );

    // Trimite alertă dacă e necesar
    if (shouldAlert()) {
      const message = `Clerk integration health check failed!\n\nConsecutive failures: ${state.consecutiveFailures}\nLast successful check: ${new Date(state.lastSuccessfulCheck).toISOString()}\n\nAPI: ${results.api.healthy ? '✅' : '❌'}\nUsers: ${results.users.healthy ? '✅' : '❌'}`;

      await sendSlackAlert(message, 'error');
      state.lastAlert = Date.now();
    }
  }

  // Salvează în history (păstrează ultimele 100)
  state.checks.push(results);
  if (state.checks.length > 100) {
    state.checks.shift();
  }

  return results;
}

/**
 * Afișează stats
 */
function displayStats() {
  if (state.checks.length === 0) return;

  const totalChecks = state.checks.length;
  const passedChecks = state.checks.filter((c) => c.overall).length;
  const successRate = ((passedChecks / totalChecks) * 100).toFixed(2);

  const avgResponseTime =
    state.checks
      .filter((c) => c.api?.responseTime)
      .reduce((sum, c) => sum + c.api.responseTime, 0) / totalChecks;

  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════╗
║   📊 CLERK HEALTH STATS                                   ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}Overall:${colors.reset}
  Total checks: ${totalChecks}
  Passed: ${passedChecks} (${successRate}%)
  Failed: ${totalChecks - passedChecks}
  Consecutive failures: ${state.consecutiveFailures}

${colors.bright}API Performance:${colors.reset}
  Avg response time: ${avgResponseTime.toFixed(0)}ms
  Last check: ${state.lastSuccessfulCheck ? new Date(state.lastSuccessfulCheck).toLocaleTimeString() : 'N/A'}

${colors.bright}Alerting:${colors.reset}
  Slack enabled: ${CONFIG.slack.enabled ? 'Yes' : 'No'}
  Last alert: ${state.lastAlert ? new Date(state.lastAlert).toLocaleTimeString() : 'Never'}

${colors.bright}Next check:${colors.reset} ${new Date(Date.now() + CONFIG.checkIntervalMs).toLocaleTimeString()}
  `);
}

/**
 * Handle graceful shutdown
 */
function setupGracefulShutdown() {
  const shutdown = () => {
    console.log('\n');
    log.info('Stopping health monitor...');
    displayStats();
    log.success('Health monitor stopped gracefully');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

/**
 * Main monitoring loop
 */
async function startMonitoring() {
  console.log(`
${colors.bright}${colors.blue}╔═══════════════════════════════════════════════════════════╗
║   🏥 CLERK HEALTH MONITOR - STARTED                       ║
║   FinGuard - Financial Analysis Platform                 ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}Configuration:${colors.reset}
  Check interval: ${CONFIG.checkIntervalMs / 1000 / 60} minutes
  Alert threshold: ${CONFIG.alertThreshold.consecutiveFailures} consecutive failures
  API response warning: ${CONFIG.alertThreshold.apiResponseTime}ms
  Slack alerts: ${CONFIG.slack.enabled ? 'Enabled' : 'Disabled'}

${colors.yellow}Press Ctrl+C to stop monitoring${colors.reset}
  `);

  setupGracefulShutdown();

  // Rulează primul check imediat
  await runHealthChecks();

  // Setup interval pentru checks regulate
  setInterval(async () => {
    await runHealthChecks();

    // Afișează stats la fiecare 6 checks (30 min dacă interval = 5 min)
    if (state.checks.length % 6 === 0) {
      displayStats();
    }
  }, CONFIG.checkIntervalMs);

  log.success('Monitoring started successfully');
}

/**
 * Run single check (pentru testing)
 */
async function runSingleCheck() {
  console.log('Running single health check...\n');
  const results = await runHealthChecks();
  displayStats();
  return results.overall ? 0 : 1;
}

// Main
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--once')) {
    // Rulează o singură verificare și exit
    runSingleCheck().then((code) => process.exit(code));
  } else {
    // Rulează monitoring continuu
    startMonitoring();
  }
}

module.exports = { runHealthChecks, checkApiHealth, checkRecentUsers };
