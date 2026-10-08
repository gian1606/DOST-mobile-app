import { useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { mockPartnerAds, mockResidentNotifications } from '../../mock/data';
import MapCard from '../../components/MapCard';
import EcoTokenBadge from '../../components/EcoTokenBadge';
import AdCard from '../../components/AdCard';
import NotificationsModal from '../../components/NotificationsModal';
import { api, getUser } from '../../api';

export default function HomeScreen({ navigation }) {
  const [notifVisible, setNotifVisible] = useState(false);
  const [balance, setBalance]           = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [bins, setBins]                 = useState([]);
  const [routeStops, setRouteStops]     = useState([]);
  const [mapLoading, setMapLoading]     = useState(true);

  const unread = mockResidentNotifications.filter((n) => !n.read).length;
  const user   = getUser();

  useFocusEffect(
    useCallback(() => {
      // Eco balance
      setBalanceLoading(true);
      api.get('/eco/balance')
        .then((d) => setBalance(Number(d.balance)))
        .catch(() => setBalance(0))
        .finally(() => setBalanceLoading(false));

      // Map: all bins + route line
      // Priority: latest saved route plan → live-route (FULL bins) → no route line
      setMapLoading(true);
      Promise.all([
        api.get('/bins'),
        api.get('/routing/routes?limit=1').catch(() => ({ routes: [] })),
      ])
        .then(async ([binsData, routesData]) => {
          setBins(binsData.bins || []);

          const plans = (routesData.routes || []);

          if (plans.length > 0) {
            // ── Saved route plan exists — use ALL vehicle stops ──────────────
            const detail = await api.get(`/routing/routes/${plans[0].id}`)
              .catch(() => null);
            if (detail) {
              const allStops = (detail.vehicles || [])
                .flatMap((v) => (v.stops || []))
                .filter((s) =>
                  !isNaN(parseFloat(s.bin_latitude)) &&
                  !isNaN(parseFloat(s.bin_longitude))
                )
                .map((s) => ({
                  lat:      parseFloat(s.bin_latitude),
                  lng:      parseFloat(s.bin_longitude),
                  is_depot: s.is_depot ?? false,
                }));
              setRouteStops(allStops);
              console.log('[ResidentHome] routeStops from plan:', allStops.length, allStops[0], allStops[allStops.length-1]);
              return;
            }
          }

          // ── Fallback: use live-route (current FULL bins) ──────────────────
          const live = await api.get('/routing/live-route').catch(() => null);
          if (live && live.route && live.route.length > 0) {
            const liveStops = live.route
              .filter((s) =>
                !isNaN(parseFloat(s.lat)) &&
                !isNaN(parseFloat(s.lng))
              )
              .map((s) => ({
                lat:      parseFloat(s.lat),
                lng:      parseFloat(s.lng),
                is_depot: s.is_depot ?? false,
              }));
            setRouteStops(liveStops);
            console.log('[ResidentHome] routeStops from live-route:', liveStops.length, liveStops[0], liveStops[liveStops.length-1]);
          } else {
            setRouteStops([]);
          }
        })
        .catch((err) => console.error('[ResidentHome] map fetch error:', err.message))
        .finally(() => setMapLoading(false));
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

        {/* Map — all bins + live route overlay */}
        {mapLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <MapCard
            mapData={bins}
            routeStops={routeStops}
            routeColor="#1976D2"
          />
        )}

        {balanceLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
        ) : (
          <EcoTokenBadge
            variant="card"
            balance={balance ?? 0}
            onViewRewards={() => navigation.navigate('Rewards')}
          />
        )}

        <Text style={styles.sectionLabel}>Check this out</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.adScroll}
          contentContainerStyle={{ paddingRight: 16 }}
        >
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
  },
  greeting: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.secondary },
  subtitle: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  bellBtn:  { position: 'relative', padding: 4 },
  bellBadge: {
    position: 'absolute', top: 0, right: 0,
    width: 16, height: 16, borderRadius: 9999,
    backgroundColor: colors.error,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary,
  },
  bellBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  scroll:  { flex: 1 },
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  sectionLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  adScroll: { marginHorizontal: -20 },
});