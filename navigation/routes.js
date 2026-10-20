/**
 * Route name constants.
 * Import these instead of using bare string literals in navigators and screens.
 * Changing a route name here updates every reference automatically.
 */

// ── Auth stack ────────────────────────────────────────────────────────────────
export const ROUTES = {
  // Auth
  SPLASH:       'Splash',
  LOGIN:        'Login',
  REGISTRATION: 'Registration',
  OTP:          'OTP',

  // Resident tabs
  HOME:         'Home',
  REWARDS:      'Rewards',
  QR:           'QR',
  TRANSACTIONS: 'Transactions',
  PROFILE:      'Profile',

  // Buyer tabs
  RESERVATIONS: 'Reservations',

  // Collector stack + tabs
  COLLECTOR_TABS:      'CollectorTabsMain',
  COLLECTOR_HOME_TAB:  'CollectorHomeTab',
  COLLECTOR_ROUTE_TAB: 'CollectorRouteTab',
  COLLECTOR_QR_TAB:    'CollectorQRTab',
  COLLECTOR_LOG_TAB:   'CollectorLogTab',
  COLLECTOR_PROFILE_TAB: 'CollectorProfileTab',
  COLLECTOR_QR_SCREEN: 'CollectorQRScreen',
  COLLECTION_CONFIRMED: 'CollectionConfirmed',
};
