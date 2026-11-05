import { useState, useCallback } from 'react';
import { ROUTES } from '../../navigation/routes';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { PARTNER_ADS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import NotificationsModal from '../../components/modals/NotificationsModal';
import AdCard from '../../components/shared/AdCard';
import { fetchCollectorBins } from '../../services/bins';
import { fetchNotifications, markAllNotificationsRead } from '../../services/notifications';

// Status → display color
const STATUS_COLOR = {
  full:      colors.error,
  collected: colors.accent,
  missed:    colors.warning,
  empty:     colors.textMuted,
};

/**
 * CollectorMapView — renders bins as pin markers on a schematic grid.
 * Uses real latitude/longitude to position markers proportionally within the
 * bounding box of the loaded bins. Falls back to even distribution if all
 * coordinates are null.
 */
function CollectorMapView({ bins }) {
  if (!bins.length) {
    return (
      <View style={[mapStyles.container, { justifyContent: 'center', alignItems: 'center', gap: 8 }]}>
        <Ionicons name="map-outline" size={36} color={colors.textMuted} />
        <Text style={{ fontSize: typography.size.sm, color: colors.textMuted }}>No bins to display</Text>
      </View>
    );
  }

  // Compute bounding box from real GPS coordinates
  const lats = bins.map((b) => b.latitude).filter(Boolean);
  const lngs = bins.map((b) => b.longitude).filter(Boolean);

  const hasCoords = lats.length > 0 && lngs.length > 0;
  const minLat = hasCoords ? Math.min(...lats) : 0;
  const maxLat = hasCoords ? Math.max(...lats) : 1;
  const minLng = hasCoords ? Math.min(...lngs) : 0;
  const maxLng = hasCoords ? Math.max(...lngs) : 1;
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  // Map GPS → relative 0-1 position; apply padding so pins don't touch edges
  const PADDING = 0.1;
  function posX(b, i) {
    if (hasCoords && b.longitude != null) {
      return PADDING + ((b.longitude - minLng) / lngRange) * (1 - PADDING * 2);
    }
    return PADDING + (i / Math.max(bins.length - 1, 1)) * (1 - PADDING * 2);
  }
  function posY(b, i) {
    if (hasCoords && b.latitude != null) {
      // Latitude increases northward — invert for screen coords (top = high lat)
      return PADDING + (1 - (b.latitude - minLat) / latRange) * (1 - PADDING * 2);
    }
    return 0.3 + (i % 3) * 0.2;
  }

  return (
    <View style={mapStyles.container}>
      <View style={mapStyles.routeLine} />

      {bins.map((bin, i) => {
        const color = STATUS_COLOR[bin.status] ?? colors.textMuted;
        return (
          <View
            key={bin.id}
            style={[
              mapStyles.markerWrapper,
              { left: `${posX(bin, i) * 100}%`, top: `${posY(bin, i) * 100}%` },
            ]}
          >
            <View style={[mapStyles.iconCircle, { backgroundColor: color }]}>
              <Ionicons name="trash-outline" size={13} color="#fff" />
            </View>
            <View style={mapStyles.label}>
              <Text style={mapStyles.labelText} numberOfLines={1}>{bin.name}</Text>
            </View>
          </View>
        );
      })}

      {/* Legend */}
      <View style={mapStyles.legend}>
        {[
          { color: colors.error,   label: 'Full'      },
          { color: colors.accent,  label: 'Collected' },
          { color: colors.warning, label: 'Missed'    },
        ].map((item) => (
          <View key={item.label} style={mapStyles.legendRow}>
            <View style={[mapStyles.legendDot, { backgroundColor: item.color }]} />
            <Text style={mapStyles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={mapStyles.satelliteBtn} activeOpacity={0.8}>
        <Text style={mapStyles.satelliteText}>Satellite</Text>
      </TouchableOpacity>
      <View style={mapStyles.zoomControls}>
        <TouchableOpacity style={mapStyles.zoomBtn} activeOpacity={0.8}>
          <Text style={mapStyles.zoomText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={mapStyles.zoomBtn} activeOpacity={0.8}>
          <Text style={mapStyles.zoomText}>−</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CollectorHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [bins, setBins]               = useState([]);
  const [binsLoading, setBinsLoading] = useState(true);
  const [notifVisible, setNotifVisible]   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  useFocusEffect(
    useCallback(() => {
      setBinsLoading(true);
      fetchCollectorBins({ status: 'FULL' })
        .then(setBins)
        .catch(() => {})
        .finally(() => setBinsLoading(false));

      fetchNotifications()
        .then(({ notifications: notifs, unreadCount: count }) => {
          setNotifications(notifs);
          setUnreadCount(count);
        })
        .catch(() => {});
    }, [])
  );

  function handleOpenNotifs() {
    setNotifVisible(true);
    setUnreadCount(0);
    markAllNotificationsRead().catch(() => {});
  }

  const fullBins      = bins.filter((b) => b.status === 'full').length;
  const collectedBins = bins.filter((b) => b.status === 'collected').length;
  const totalBins     = bins.length;

  return (
    <View style={styles.screen}>

      <View style={styles.header}>
        <View>
          <Text style={styles.headerCaption}>Today's Route</Text>
          <Text style={styles.headerName}>{user?.name ?? '—'}</Text>
        </View>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={handleOpenNotifs}
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Map */}
        {binsLoading ? (
          <View style={mapStyles.container}>
            <ActivityIndicator color={colors.collectorPrimary} style={{ marginTop: 120 }} />
          </View>
        ) : (
          <CollectorMapView bins={bins} />
        )}

        {/* Route Banner */}
        <View style={styles.routeBanner}>
          <Ionicons name="navigate-outline" size={20} color={colors.collectorPrimary} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeTitle}>Optimized Route Active</Text>
            <Text style={styles.routeSub}>
              {fullBins} bin{fullBins !== 1 ? 's' : ''} to collect · Est. {fullBins * 15} mins
            </Text>
          </View>
          <TouchableOpacity style={styles.goBtn} activeOpacity={0.8} onPress={() => navigation.navigate(ROUTES.COLLECTOR_ROUTE_TAB)}>
            <Text style={styles.goBtnText}>GO</Text>
          </TouchableOpacity>
        </View>

        {/* Progress strip */}
        {totalBins > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Route Progress</Text>
              <Text style={styles.progressCount}>{collectedBins}/{totalBins} bins</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(collectedBins / totalBins) * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Partner ads */}
        <Text style={styles.sectionLabel}>Check this out</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.adScroll}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {PARTNER_ADS.map((ad, index) => (
            <AdCard key={ad.id} ad={ad} index={index} />
          ))}
        </ScrollView>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Notifications — populated from real API */}
      <NotificationsModal
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        notifications={notifications}
        accentColor={colors.collectorPrimary}
      />
    </View>
  );
}

const mapStyles = StyleSheet.create({
  container: {
    height: 300,
    backgroundColor: colors.collectorSurface,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.collectorBorder,
  },
  routeLine: {
    position: 'absolute', top: '40%', left: '10%', right: '10%',
    height: 2, backgroundColor: colors.collectorPrimary, opacity: 0.6,
  },
  markerWrapper: {
    position: 'absolute', alignItems: 'center', width: 64, marginLeft: -32,
  },
  iconCircle: {
    width: 30, height: 30, borderRadius: 9999,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  label: {
    marginTop: 4, backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, maxWidth: 64,
  },
  labelText:    { fontSize: 7, color: colors.textPrimary, fontWeight: '600', textAlign: 'center' },
  legend: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8, padding: 8, gap: 5,
  },
  legendRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 10, height: 10, borderRadius: 9999 },
  legendText: { fontSize: 10, color: colors.textPrimary, fontWeight: '500' },
  satelliteBtn: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  satelliteText: { fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  zoomControls:  { position: 'absolute', bottom: 10, right: 10, gap: 4 },
  zoomBtn: {
    width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 6, justifyContent: 'center', alignItems: 'center',
  },
  zoomText: { fontSize: 18, color: colors.textPrimary, fontWeight: '600', lineHeight: 22 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.collectorLight },
  header: {
    backgroundColor: colors.collectorPrimary,
    paddingTop: 56, paddingBottom: 18, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerCaption: { fontSize: typography.size.xs, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  headerName:    { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: '#fff' },
  bellBtn:       { position: 'relative', padding: 6 },
  scroll:        { flex: 1 },
  content:       { padding: 16, gap: 14 },
  sectionLabel:  { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  adScroll:      { marginHorizontal: -16 },
  routeBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.secondary, borderRadius: 14, padding: 14, gap: 12,
    borderWidth: 1, borderColor: colors.collectorBorder,
    shadowColor: colors.collectorPrimary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  routeInfo:  { flex: 1, gap: 2 },
  routeTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  routeSub:   { fontSize: typography.size.xs, color: colors.textSecondary },
  goBtn: {
    backgroundColor: colors.collectorPrimary,
    borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8,
  },
  goBtnText: { color: '#fff', fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  progressCard: {
    backgroundColor: colors.secondary, borderRadius: 12, padding: 14, gap: 10,
    borderWidth: 1, borderColor: colors.collectorBorder,
  },
  progressRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel:   { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  progressCount:   { fontSize: typography.size.sm, color: colors.textSecondary },
  progressBarBg:   { height: 8, backgroundColor: colors.collectorSurface, borderRadius: 9999, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.collectorPrimary, borderRadius: 9999 },
});
