import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { typography } from '../../theme/typography';
import MapCard from '../../components/MapCard';
import { api, getUser } from '../../api';

const C = {
  primary:  '#0D7A5F',
  bg:       '#F4FAF7',
  surface:  '#FFFFFF',
  textPri:  '#0D1F1A',
  textSec:  '#6B8C81',
  error:    '#E53535',
  success:  '#00C86A',
};

const STATUS_CONFIG = {
  FULL:      { color: '#DC2626', label: 'Full',      icon: 'alert-circle-outline'     },
  QUEUED:    { color: '#7C3AED', label: 'Queued',    icon: 'time-outline'             },
  COLLECTED: { color: '#1976D2', label: 'Collected', icon: 'checkmark-circle-outline' },
  PENDING:   { color: '#D97706', label: 'Pending',   icon: 'close-circle-outline'     },
};

export default function CollectorRouteScreen() {
  // Map data — same as home/resident (all bins)
  const [allBins, setAllBins]       = useState([]);
  const [routeStops, setRouteStops] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);

  // Collection list — full bins this collector needs to collect
  const [collectionBins, setCollectionBins] = useState([]);
  const [listLoading, setListLoading]       = useState(true);
  const [listError, setListError]           = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      // ── 1. Map: all bins + route polyline (same as home screen) ──────────
      setMapLoading(true);
      Promise.all([
        api.get('/bins'),
        api.get('/routing/routes?limit=1').catch(() => ({ routes: [] })),
      ])
        .then(async ([binsData, routesData]) => {
          if (!active) return;
          setAllBins(binsData.bins || []);

          const plans = routesData.routes || [];
          if (plans.length > 0) {
            const detail = await api.get(`/routing/routes/${plans[0].id}`).catch(() => null);
            if (detail) {
              const stops = (detail.vehicles || [])
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
              setRouteStops(stops);
              return;
            }
          }

          // Fallback: live-route
          const live = await api.get('/routing/live-route').catch(() => null);
          setRouteStops(
            (live?.route || [])
              .filter((s) => !isNaN(parseFloat(s.lat)) && !isNaN(parseFloat(s.lng)))
              .map((s) => ({ lat: parseFloat(s.lat), lng: parseFloat(s.lng), is_depot: s.is_depot ?? false }))
          );
        })
        .catch((err) => console.error('[RouteScreen] map error:', err.message))
        .finally(() => { if (active) setMapLoading(false); });

      // ── 2. Collection list: full bins assigned to this collector ─────────
      setListLoading(true);
      setListError(null);

      async function fetchCollectionList() {
        try {
          // Get collector's truck
          let myTruck = null;
          try {
            const td = await api.get('/trucks/mine');
            myTruck = td.truck ?? null;
          } catch (_) {
            const myUser = getUser();
            const td = await api.get('/trucks');
            myTruck = (td.trucks || []).find(
              (t) => String(t.assigned_collector_id) === String(myUser?.id)
            ) ?? null;
          }

          // Get latest route plan stops for this truck
          const routesData = await api.get('/routing/routes?limit=1').catch(() => ({ routes: [] }));
          const plans = routesData.routes || [];

          if (plans.length === 0) {
            // No route plan — fall back to showing all FULL bins
            const binsData = await api.get('/bins');
            const fullBins = (binsData.bins || []).filter(
              (b) => (b.status || '').toUpperCase() === 'FULL'
            );
            if (active) setCollectionBins(fullBins.map((b) => ({
              id:       b.id,
              name:     b.name,
              barangay: b.barangay,
              status:   'FULL',
              stop_order: null,
            })));
            return;
          }

          const detail   = await api.get(`/routing/routes/${plans[0].id}`);
          const vehicles = detail.vehicles || [];

          const vehicle = myTruck
            ? (vehicles.find((v) => String(v.truck_id) === String(myTruck.id)) ?? vehicles[0])
            : vehicles[0];

          const binStops = (vehicle?.stops || []).filter((s) => !s.is_depot);
          if (active) setCollectionBins(binStops.map((s) => ({
            id:        s.bin_id,
            name:      s.bin_name || `Stop ${s.stop_order}`,
            barangay:  s.bin_barangay,
            status:    (s.status || s.bin_status || 'FULL').toUpperCase(),
            stop_order: s.stop_order,
          })));
        } catch (err) {
          console.error('[RouteScreen] list error:', err.message);
          if (active) setListError('Could not load collection list.');
        } finally {
          if (active) setListLoading(false);
        }
      }

      fetchCollectionList();
      return () => { active = false; };
    }, [])
  );

  const collectedCount = collectionBins.filter(
    (b) => b.status === 'COLLECTED'
  ).length;
  const totalCount = collectionBins.length;
  const progress   = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  return (
    <View style={styles.screen}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Collection Route</Text>
        <Text style={styles.subtitle}>
          {listLoading ? 'Loading…' : `${totalCount - collectedCount} bin${totalCount - collectedCount !== 1 ? 's' : ''} to collect`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Map — all bins, same as home screen */}
        {mapLoading ? (
          <ActivityIndicator color={C.primary} style={{ marginVertical: 16 }} />
        ) : (
          <MapCard
            mapData={allBins}
            routeStops={routeStops}
            routeColor="#1976D2"
            height={260}
          />
        )}

        {/* Progress */}
        {!listLoading && totalCount > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <View>
                <Text style={styles.progressTitle}>Collection Progress</Text>
                <Text style={styles.progressSub}>{collectedCount} of {totalCount} collected</Text>
              </View>
              <Text style={styles.progressPct}>{progress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        {/* Bins to collect */}
        {listLoading ? (
          <ActivityIndicator color={C.primary} style={{ marginVertical: 16 }} />
        ) : listError ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={18} color={C.error} />
            <Text style={styles.errorText}>{listError}</Text>
          </View>
        ) : totalCount === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={40} color={C.success} />
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptyText}>No bins assigned for collection yet.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Bins to Collect</Text>
            {collectionBins.map((bin, index) => {
              const cfg = STATUS_CONFIG[bin.status] || STATUS_CONFIG.FULL;
              return (
                <View key={bin.id ?? index} style={styles.binCard}>
                  <View style={[styles.stepBadge, { backgroundColor: C.primary }]}>
                    <Text style={styles.stepNumber}>
                      {bin.stop_order != null ? bin.stop_order : index + 1}
                    </Text>
                  </View>
                  <View style={styles.binInfo}>
                    <Text style={styles.binName}>{bin.name}</Text>
                    {bin.barangay ? (
                      <Text style={styles.binBarangay}>{bin.barangay}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: cfg.color + '22', borderColor: cfg.color }]}>
                    <Ionicons name={cfg.icon} size={13} color={cfg.color} />
                    <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.primary,
    paddingTop: 56,
    paddingBottom: 18,
    paddingHorizontal: 20,
    gap: 4,
  },
  title:    { fontSize: 22, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

  content: { padding: 16, gap: 14 },

  progressCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E0EDE8',
  },
  progressTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progressTitle:   { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: C.textPri },
  progressSub:     { fontSize: typography.size.xs, color: C.textSec },
  progressPct:     { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: C.primary },
  progressBarBg:   { height: 8, backgroundColor: '#D6EAE0', borderRadius: 9999, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: C.primary, borderRadius: 9999 },

  sectionLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: C.textPri,
    marginTop: 4,
  },

  errorRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { fontSize: typography.size.sm, color: C.error },

  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 10, paddingHorizontal: 24 },
  emptyTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: C.textPri },
  emptyText:  { fontSize: typography.size.sm, color: C.textSec, textAlign: 'center' },

  binCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0EDE8',
  },
  stepBadge:  { width: 28, height: 28, borderRadius: 9999, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepNumber: { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: '#fff' },
  binInfo:    { flex: 1, gap: 2 },
  binName:    { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: C.textPri },
  binBarangay:{ fontSize: typography.size.xs, color: C.textSec },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusPillText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
});
