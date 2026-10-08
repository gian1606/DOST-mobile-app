import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { typography } from '../../theme/typography';
import { mockCollectorNotifications, mockPartnerAds } from '../../mock/data';
import NotificationsModal from '../../components/NotificationsModal';
import AdCard from '../../components/AdCard';
import MapCard from '../../components/MapCard';
import { api, getUser } from '../../api';

const C = {
  primary:   '#0D7A5F',
  bg:        '#F4FAF7',
  surface:   '#FFFFFF',
  textPri:   '#0D1F1A',
  textSec:   '#6B8C81',
  error:     '#E53535',
};

export default function CollectorHomeScreen() {
  const [notifVisible, setNotifVisible] = useState(false);
  const [bins, setBins]                 = useState([]);
  const [routeStops, setRouteStops]     = useState([]);
  const [mapLoading, setMapLoading]     = useState(true);

  const user        = getUser();
  const unreadCount = mockCollectorNotifications.filter((n) => !n.read).length;

  useFocusEffect(
    useCallback(() => {
      // Same fetch as resident home:
      // - GET /bins      → all bins, all statuses (markers)
      // - Route stops    → from latest route plan or live-route fallback (polyline)
      setMapLoading(true);
      Promise.all([
        api.get('/bins'),
        api.get('/routing/routes?limit=1').catch(() => ({ routes: [] })),
      ])
        .then(async ([binsData, routesData]) => {
          setBins(binsData.bins || []);

          const plans = routesData.routes || [];
          if (plans.length > 0) {
            const detail = await api.get(`/routing/routes/${plans[0].id}`).catch(() => null);
            if (detail) {
              const allStops = (detail.vehicles || [])
                .flatMap((v) => v.stops || [])
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
              return;
            }
          }

          // Fallback: live-route
          const live = await api.get('/routing/live-route').catch(() => null);
          if (live?.route?.length > 0) {
            setRouteStops(
              live.route
                .filter((s) => !isNaN(parseFloat(s.lat)) && !isNaN(parseFloat(s.lng)))
                .map((s) => ({ lat: parseFloat(s.lat), lng: parseFloat(s.lng), is_depot: s.is_depot ?? false }))
            );
          } else {
            setRouteStops([]);
          }
        })
        .catch((err) => console.error('[CollectorHome] map fetch error:', err.message))
        .finally(() => setMapLoading(false));
    }, [])
  );

  return (
    <View style={styles.screen}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Good morning, {user?.name?.split(' ')[0] ?? 'Collector'} 👋
          </Text>
          <Text style={styles.subtitle}>Batangas City Waste Tracker</Text>
        </View>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => setNotifVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Map — all bins + route overlay, same as resident */}
        {mapLoading ? (
          <ActivityIndicator color={C.primary} style={{ marginVertical: 20 }} />
        ) : (
          <MapCard
            mapData={bins}
            routeStops={routeStops}
            routeColor="#1976D2"
            height={300}
          />
        )}

        {/* Ads */}
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

        <View style={{ height: 30 }} />
      </ScrollView>

      <NotificationsModal
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        notifications={mockCollectorNotifications}
        accentColor={C.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
  },
  greeting: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: '#fff' },
  subtitle: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  bellBtn:  { position: 'relative', padding: 4 },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 9999,
    backgroundColor: C.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  bellBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  scroll:  { flex: 1 },
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  sectionLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: C.textPri,
  },
  adScroll: { marginHorizontal: -20 },
});
