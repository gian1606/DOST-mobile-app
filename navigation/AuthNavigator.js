import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen       from '../screens/SplashScreen';
import LoginScreen        from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import OTPScreen          from '../screens/OTPScreen';
import { ROUTES } from './routes';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.SPLASH}        component={SplashScreen} />
      <Stack.Screen name={ROUTES.LOGIN}         component={LoginScreen} />
      <Stack.Screen name={ROUTES.REGISTRATION}  component={RegistrationScreen} />
      <Stack.Screen name={ROUTES.OTP}           component={OTPScreen} />
    </Stack.Navigator>
  );
}
