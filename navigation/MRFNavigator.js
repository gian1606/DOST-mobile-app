import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MRFHome         from '../screens/mrf/HomeScreen';
import MRFRewards      from '../screens/mrf/RewardsScreen';
import MRFQRScanner    from '../screens/mrf/QRScannerScreen';
import MRFTransactions from '../screens/mrf/TransactionsScreen';
import MRFProfile      from '../screens/mrf/ProfileScreen';

import { tabScreenOptions, fabOptions } from './tabConfig';

const Tab = createBottomTabNavigator();

export default function MRFNavigator() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home"         component={MRFHome} />
      <Tab.Screen name="Rewards"      component={MRFRewards} />
      <Tab.Screen name="QR"           component={MRFQRScanner} options={fabOptions} />
      <Tab.Screen name="Transactions" component={MRFTransactions} />
      <Tab.Screen name="Profile"      component={MRFProfile} />
    </Tab.Navigator>
  );
}
