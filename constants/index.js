/**
 * App-wide constants.
 * Import from here instead of repeating magic strings/numbers across files.
 */

// ── Auth roles ────────────────────────────────────────────────────────────────
// DB role values (as stored in the users table)
export const DB_ROLES = {
  RESIDENT:   'resident',
  MRF_WORKER: 'mrf_worker',
  MRF_BUYER:  'mrf_buyer',
  COLLECTOR:  'collector',
};

// App-navigation role keys (used by App.js RootNavigator and AuthContext)
export const APP_ROLES = {
  RESIDENT:  'resident',
  MRF:       'mrf',
  BUYER:     'buyer',
  COLLECTOR: 'collector',
};

// DB roles allowed to log in via the mobile app
export const MOBILE_ALLOWED_ROLES = [
  DB_ROLES.RESIDENT,
  DB_ROLES.MRF_WORKER,
  DB_ROLES.MRF_BUYER,
  DB_ROLES.COLLECTOR,
];

// ── QR code value prefixes ────────────────────────────────────────────────────
export const QR_PREFIX = {
  RESIDENT: 'BESMART-RESIDENT-',
  REWARD:   'BESMART-REWARD-',
  BIN:      'BESMART-BIN-',
};

// ── Reward categories ─────────────────────────────────────────────────────────
export const REWARD_CATEGORIES = ['All', 'Food', 'Shopping', 'Services', 'Utilities'];

// ── Registerable roles (shown in the Registration screen role picker) ─────────
export const REGISTERABLE_ROLES = [
  { key: 'resident', label: 'Resident',  description: 'Report bins & earn ECO',        icon: 'person-outline'   },
  { key: 'buyer',    label: 'MRF Buyer', description: 'Reserve & purchase recyclables', icon: 'business-outline' },
];

// ── Misc ──────────────────────────────────────────────────────────────────────
export const SPLASH_DELAY_MS = 2000;
