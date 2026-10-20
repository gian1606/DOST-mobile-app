import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './context/AuthContext';

import AuthNavigator      from './navigation/AuthNavigator';
import ResidentNavigator  from './navigation/ResidentNavigator';
import MRFNavigator       from './navigation/MRFNavigator';
import BuyerNavigator     from './navigation/BuyerNavigator';
import CollectorNavigator from './navigation/CollectorNavigator';

// ─── Role router ──────────────────────────────────────────────────────────────
// Reads auth state from context and picks the correct navigator.
function RootNavigator() {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated)              return <AuthNavigator />;
  if (userRole === 'resident')       return <ResidentNavigator />;
  if (userRole === 'mrf')            return <MRFNavigator />;
  if (userRole === 'buyer')          return <BuyerNavigator />;
  if (userRole === 'collector')      return <CollectorNavigator />;

  // Fallback — unknown role, send back to auth
  return <AuthNavigator />;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
