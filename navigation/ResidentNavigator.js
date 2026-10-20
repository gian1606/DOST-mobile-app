import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

import ResidentHome         from '../screens/resident/HomeScreen';
import ResidentRewards      from '../screens/resident/RewardsScreen';
import ResidentQRScanner    from '../screens/resident/QRScannerScreen';
import ResidentTransactions from '../screens/resident/TransactionsScreen';
import ResidentProfile      from '../screens/resident/ProfileScreen';

import { tabScreenOptions, fabOptions } from './tabConfig';

const Tab = createBottomTabNavigator();

export default function ResidentNavigator() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home"         component={ResidentHome} />
      <Tab.Screen name="Rewards"      component={ResidentRewards} />
      <Tab.Screen name="QR"           component={ResidentQRScanner} options={fabOptions} />
      <Tab.Screen name="Transactions" component={ResidentTransactions} />
      <Tab.Screen name="Profile"      component={ResidentProfile} />
    </Tab.Navigator>
  );
}
