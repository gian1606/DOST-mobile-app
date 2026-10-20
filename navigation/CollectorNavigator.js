import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

import CollectorHome         from '../screens/collector/HomeScreen';
import CollectorRoute        from '../screens/collector/RouteScreen';
import CollectorQRScanner    from '../screens/collector/QRScannerScreen';
import CollectorTransactions from '../screens/collector/TransactionsScreen';
import CollectorProfile      from '../screens/collector/ProfileScreen';
import CollectionConfirmed   from '../screens/collector/CollectionConfirmedScreen';
import { ROUTES } from './routes';

const Tab        = createBottomTabNavigator();
const RootStack  = createStackNavigator();

const collectorTabOptions = ({ route }) => ({
  headerShown: false,
  tabBarShowLabel: true,
  tabBarActiveTintColor:   colors.collectorPrimary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.secondary,
    borderTopWidth: 0.5,
    borderTopColor: colors.cardBorder,
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabBarLabelStyle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  tabBarIcon: ({ color, focused }) => {
    const icons = {
      [ROUTES.COLLECTOR_HOME_TAB]:    focused ? 'home'     : 'home-outline',
      [ROUTES.COLLECTOR_ROUTE_TAB]:   focused ? 'navigate' : 'navigate-outline',
      [ROUTES.COLLECTOR_QR_TAB]:      'qr-code-outline',
      [ROUTES.COLLECTOR_LOG_TAB]:     focused ? 'receipt'  : 'receipt-outline',
      [ROUTES.COLLECTOR_PROFILE_TAB]: focused ? 'person'   : 'person-outline',
    };
    return <Ionicons name={icons[route.name]} size={22} color={color} />;
  },
});

function CollectorTabs() {
  return (
    <Tab.Navigator screenOptions={collectorTabOptions}>
      <Tab.Screen
        name={ROUTES.COLLECTOR_HOME_TAB}
        component={CollectorHome}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name={ROUTES.COLLECTOR_ROUTE_TAB}
        component={CollectorRoute}
        options={{ tabBarLabel: 'Route' }}
      />
      <Tab.Screen
        name={ROUTES.COLLECTOR_QR_TAB}
        component={CollectorHome}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View style={styles.fabButton}>
              <Ionicons name="qr-code-outline" size={26} color="#fff" />
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              style={styles.fabWrapper}
              activeOpacity={0.85}
              onPress={props.onPress}
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate(ROUTES.COLLECTOR_QR_SCREEN);
          },
        })}
      />
      <Tab.Screen
        name={ROUTES.COLLECTOR_LOG_TAB}
        component={CollectorTransactions}
        options={{ tabBarLabel: 'Log' }}
      />
      <Tab.Screen
        name={ROUTES.COLLECTOR_PROFILE_TAB}
        component={CollectorProfile}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

/** Root stack wraps the tabs + full-screen overlays (QR, Confirmed). */
export default function CollectorNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name={ROUTES.COLLECTOR_TABS}      component={CollectorTabs} />
      <RootStack.Screen name={ROUTES.COLLECTOR_QR_SCREEN} component={CollectorQRScanner} />
      <RootStack.Screen name={ROUTES.COLLECTION_CONFIRMED} component={CollectionConfirmed} />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  fabButton: {
    width: 58,
    height: 58,
    borderRadius: 9999,
    backgroundColor: colors.collectorPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.collectorPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
