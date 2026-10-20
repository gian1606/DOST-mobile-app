/**
 * Auth service — owns all authentication API calls and role-mapping logic.
 * Screens import these functions instead of calling api.post/fetch directly.
 */
import { api } from '../api';
import { MOBILE_ALLOWED_ROLES, APP_ROLES, DB_ROLES } from '../constants';

// Maps DB role values → navigator role keys used by RootNavigator
const DB_TO_APP_ROLE = {
  [DB_ROLES.MRF_WORKER]: APP_ROLES.MRF,
  [DB_ROLES.MRF_BUYER]:  APP_ROLES.BUYER,
};

/**
 * Translates a DB role string to the app-navigation role key.
 * e.g. 'mrf_buyer' → 'buyer', 'resident' → 'resident'
 */
export function dbRoleToAppRole(dbRole) {
  return DB_TO_APP_ROLE[dbRole] ?? dbRole;
}

/**
 * Calls POST /auth/login.
 * Returns { token, user, appRole } on success.
 * Throws an Error with a user-facing message on failure.
 */
export async function loginUser(email, password) {
  // Uses api.post — the Authorization header is skipped automatically
  // when no token is set yet, which is correct for login.
  const data = await api.post('/auth/login', {
    email:    email.trim().toLowerCase(),
    password,
  });

  const { user, token } = data;

  if (!MOBILE_ALLOWED_ROLES.includes(user.role)) {
    throw new Error('This account does not have access to the mobile app.');
  }

  return { token, user, appRole: dbRoleToAppRole(user.role) };
}

/**
 * Calls POST /auth/register.
 * Returns { token, user, appRole } on success.
 * Throws an Error with a user-facing message on failure.
 */
export async function registerUser({ name, email, phone, barangay, password, role }) {
  const data = await api.post('/auth/register', {
    name, email, phone, barangay, password, role,
  });

  return {
    token:   data.token,
    user:    data.user,
    appRole: dbRoleToAppRole(data.user.role),
  };
}
