import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import BuyerHome         from '../screens/buyer/HomeScreen';
import BuyerReservations from '../screens/buyer/ReservationsScreen';
import BuyerQRScanner    from '../screens/buyer/QRScannerScreen';
import BuyerTransactions from '../screens/buyer/TransactionsScreen';
import BuyerProfile      from '../screens/buyer/ProfileScreen';

import { tabScreenOptions, fabOptions } from './tabConfig';

const Tab = createBottomTabNavigator();

export default function BuyerNavigator() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home"         component={BuyerHome} />
      <Tab.Screen name="Reservations" component={BuyerReservations} options={{ tabBarLabel: 'Bidding' }} />
      <Tab.Screen name="QR"           component={BuyerQRScanner} options={fabOptions} />
      <Tab.Screen name="Transactions" component={BuyerTransactions} />
      <Tab.Screen name="Profile"      component={BuyerProfile} />
    </Tab.Navigator>
  );
}
