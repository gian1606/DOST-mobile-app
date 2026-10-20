/**
 * Shared tab navigator configuration used by Resident, MRF, and Buyer navigators.
 * Collector has its own config due to a different primary colour and tab names.
 */
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export const tabScreenOptions = ({ route }) => ({
  headerShown: false,
  tabBarShowLabel: true,
  tabBarActiveTintColor:   colors.primary,
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
      Home:         focused ? 'home'     : 'home-outline',
      Rewards:      focused ? 'gift'     : 'gift-outline',
      Reservations: focused ? 'calendar' : 'calendar-outline',
      QR:           focused ? 'qr-code'  : 'qr-code-outline',
      Transactions: focused ? 'receipt'  : 'receipt-outline',
      Profile:      focused ? 'person'   : 'person-outline',
    };
    return <Ionicons name={icons[route.name]} size={22} color={color} />;
  },
});

export const fabOptions = {
  tabBarLabel: () => null,
  tabBarIcon: () => (
    <View style={styles.fabButton}>
      <Ionicons name="qr-code-outline" size={26} color={colors.secondary} />
    </View>
  ),
  tabBarButton: (props) => (
    <TouchableOpacity {...props} style={styles.fabWrapper} activeOpacity={0.85} />
  ),
};

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
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
