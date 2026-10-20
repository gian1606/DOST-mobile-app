import { createContext, useContext, useState } from 'react';
import { setAuth as apiSetAuth, clearAuth as apiClearAuth } from '../api';

const AuthContext = createContext(null);

/**
 * Wraps the app and provides authentication state to every screen.
 * Exposes: isAuthenticated, userRole, user, login(), logout()
 */
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole]               = useState(null);
  const [user, setUser]                       = useState(null);

  function login(token, userObj, appRole) {
    if (!token || !userObj) {
      console.warn('AuthContext.login called with missing token or user — ignoring.');
      return;
    }
    apiSetAuth(token, userObj);
    setIsAuthenticated(true);
    setUserRole(appRole);
    setUser(userObj);
  }

  function logout() {
    apiClearAuth();
    setIsAuthenticated(false);
    setUserRole(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Convenience hook — use this in any screen instead of receiving props or importing getUser(). */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
