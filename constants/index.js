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

// ── Barangay list ─────────────────────────────────────────────────────────────
// Static reference list for Batangas City barangays.
// Used in the Registration screen barangay picker.
export const BATANGAS_BARANGAYS = [
  'Brgy. Alangilan',
  'Brgy. Cuta',
  'Brgy. Kumintang Ibaba',
  'Brgy. Kumintang Ilaya',
  'Brgy. Libjo',
  'Brgy. Pallocan West',
  'Brgy. Pallocan East',
  'Brgy. Sta. Rita Karsada',
];

// ── Partner ads ───────────────────────────────────────────────────────────────
// Static marketing content bundled with the app.
// Images are local require() assets — not API-driven.
export const PARTNER_ADS = [
  { id: 'ad-001', partner: 'SM Malls',     tagline: '10% off at SM Batangas',     image: require('../assets/ads/sm-malls.png')     },
  { id: 'ad-002', partner: 'Jollibee',     tagline: 'Free drink with every meal', image: require('../assets/ads/jollibee.jpg')     },
  { id: 'ad-003', partner: 'Mercury Drug', tagline: '5% off on vitamins',         image: require('../assets/ads/mercury-drug.jpg') },
];
