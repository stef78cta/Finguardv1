/**
 * Constante globale ale aplicației
 */

/** Limite pentru încărcare fișiere */
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_TYPES: ['xlsx', 'xls', 'csv'],
  MIME_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
  ],
} as const;

/** Roluri utilizatori */
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

/** Roluri în cadrul unei companii */
export const COMPANY_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

/** Statusuri import balanță */
export const IMPORT_STATUS = {
  PROCESSING: 'processing',
  VALIDATED: 'validated',
  COMPLETED: 'completed',
  ERROR: 'error',
  ARCHIVED: 'archived',
} as const;

/** Tipuri situații financiare */
export const STATEMENT_TYPES = {
  BALANCE_SHEET: 'balance_sheet',
  INCOME_STATEMENT: 'income_statement',
  CASH_FLOW: 'cash_flow',
} as const;

/** Categorii KPI */
export const KPI_CATEGORIES = {
  LIQUIDITY: 'liquidity',
  PROFITABILITY: 'profitability',
  LEVERAGE: 'leverage',
  EFFICIENCY: 'efficiency',
  MARKET: 'market',
} as const;

/** Tipuri de cont contabil */
export const ACCOUNT_TYPES = {
  ASSET: 'asset',
  LIABILITY: 'liability',
  EQUITY: 'equity',
  REVENUE: 'revenue',
  EXPENSE: 'expense',
} as const;

/** Clase de conturi (contabilitate românească) */
export const ACCOUNT_CLASSES = {
  1: 'Conturi de capitaluri',
  2: 'Conturi de imobilizări',
  3: 'Conturi de stocuri și producție',
  4: 'Conturi de terți',
  5: 'Conturi de trezorerie',
  6: 'Conturi de cheltuieli',
  7: 'Conturi de venituri',
  8: 'Conturi speciale',
} as const;

/** Configurare paginare */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

/** Mesaje de eroare comune */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Nu aveți permisiunea de a accesa această resursă',
  NOT_FOUND: 'Resursa solicitată nu a fost găsită',
  VALIDATION_ERROR: 'Datele introduse nu sunt valide',
  SERVER_ERROR: 'A apărut o eroare pe server. Vă rugăm încercați din nou.',
  FILE_TOO_LARGE: `Fișierul depășește dimensiunea maximă permisă de ${FILE_UPLOAD.MAX_SIZE_MB}MB`,
  INVALID_FILE_TYPE: `Tipul fișierului nu este permis. Formate acceptate: ${FILE_UPLOAD.ALLOWED_TYPES.join(', ')}`,
} as const;

/** API Routes */
export const API_ROUTES = {
  AUTH: '/api/auth',
  UPLOAD: '/api/upload',
  COMPANIES: '/api/companies',
  IMPORTS: '/api/imports',
  REPORTS: '/api/reports',
  INDICATORS: '/api/indicators',
  WEBHOOK_CLERK: '/api/webhook/clerk',
} as const;

/** App Routes */
export const APP_ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  DASHBOARD: '/dashboard',
  UPLOAD: '/dashboard/upload',
  REPORTS: '/dashboard/reports',
  INDICATORS: '/dashboard/indicators',
  ANALYSIS: '/dashboard/analysis',
  SETTINGS: '/dashboard/settings',
  ADMIN: '/admin',
} as const;
