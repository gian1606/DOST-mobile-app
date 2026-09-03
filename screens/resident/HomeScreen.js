import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { mockPartnerAds, mockMapData, mockMRFLocations, mockResidentNotifications } from '../../mock/data';
import MapCard from '../../components/MapCard';
import EcoTokenBadge from '../../components/EcoTokenBadge';
import AdCard from '../../components/AdCard';
import NotificationsModal from '../../components/NotificationsModal';
import { api, getUser } from '../../api';

export default function HomeScreen({ navigation }) {
  const [notifVisible, setNotifVisible] = useState(false);
  const [balance, setBalance]           = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const unread = mockResidentNotifications.filter((n) => !n.read).length;
  const user   = getUser();

  // Refresh balance every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setBalanceLoading(true);
      api.get('/eco/balance')
        .then((data) => setBalance(Number(data.balance)))
        .catch(() => setBalance(0))
        .finally(() => setBalanceLoading(false));
    }, [])
  );

  return (
    <View style={styles.screen}>

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Good morning, {user?.name?.split(' ')[0] ?? 'Resident'} 👋
          </Text>
          <Text style={styles.subtitle}>Batangas City Waste Tracker</Text>
        </View>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => setNotifVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.secondary} />
          {unread > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        <MapCard mapData={mockMapData} mrfLocations={mockMRFLocations} />

        {balanceLoading
          ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
          : <EcoTokenBadge
              variant="card"
              balance={balance ?? 0}
              onViewRewards={() => navigation.navigate('Rewards')}
            />
        }

        <Text style={styles.sectionLabel}>Check this out</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.adScroll} contentContainerStyle={{ paddingRight: 16 }}>
          {mockPartnerAds.map((ad, index) => (
            <AdCard key={ad.id} ad={ad} index={index} />
          ))}
        </ScrollView>

      </ScrollView>

      <NotificationsModal
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        notifications={mockResidentNotifications}
        accentColor={colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  greeting: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.secondary },
  subtitle: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  bellBtn: { position: 'relative', padding: 4 },
  bellBadge: { position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: 9999, backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary },
  bellBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  sectionLabel: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  adScroll: { marginHorizontal: -20 },
});
