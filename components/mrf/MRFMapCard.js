import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * MRFMapCard — renders MRF facility pins on a schematic grid.
 *
 * Accepts facilities from the real API (with latitude/longitude) or the
 * legacy mock shape (with posX/posY). When real GPS coords are present it
 * computes relative positions from the bounding box; otherwise it falls back
 * to posX/posY directly.
 */
export default function MRFMapCard({ mrfLocations = [] }) {
  // Compute bounding box from real GPS if available
  const lats = mrfLocations.map((m) => m.latitude).filter(Boolean);
  const lngs = mrfLocations.map((m) => m.longitude).filter(Boolean);
  const hasCoords = lats.length > 0 && lngs.length > 0;

  const minLat = hasCoords ? Math.min(...lats) : 0;
  const maxLat = hasCoords ? Math.max(...lats) : 1;
  const minLng = hasCoords ? Math.min(...lngs) : 0;
  const maxLng = hasCoords ? Math.max(...lngs) : 1;
  const latRange = (maxLat - minLat) || 1;
  const lngRange = (maxLng - minLng) || 1;

  const PADDING = 0.12;

  function posX(mrf, i) {
    if (hasCoords && mrf.longitude != null)
      return PADDING + ((mrf.longitude - minLng) / lngRange) * (1 - PADDING * 2);
    if (mrf.posX != null) return mrf.posX;
    return PADDING + (i / Math.max(mrfLocations.length - 1, 1)) * (1 - PADDING * 2);
  }

  function posY(mrf, i) {
    if (hasCoords && mrf.latitude != null)
      return PADDING + (1 - (mrf.latitude - minLat) / latRange) * (1 - PADDING * 2);
    if (mrf.posY != null) return mrf.posY;
    return 0.25 + (i % 3) * 0.22;
  }

  return (
    <View style={styles.card}>
      <View style={styles.mapBackground}>

        {/* Grid lines */}
        {[0.2, 0.4, 0.6, 0.8].map((pos) => (
          <View key={`h-${pos}`} style={[styles.gridLineH, { top: `${pos * 100}%` }]} />
        ))}
        {[0.2, 0.4, 0.6, 0.8].map((pos) => (
          <View key={`v-${pos}`} style={[styles.gridLineV, { left: `${pos * 100}%` }]} />
        ))}

        {/* MRF markers */}
        {mrfLocations.map((mrf, i) => {
          const isFull = mrf.status === 'full';
          return (
            <View
              key={mrf.id}
              style={[
                styles.markerWrapper,
                { left: `${posX(mrf, i) * 100}%`, top: `${posY(mrf, i) * 100}%` },
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: isFull ? colors.error : colors.primary }]}>
                <Ionicons name="business" size={14} color="#fff" />
              </View>
              <View style={styles.label}>
                <Text style={styles.labelText} numberOfLines={1}>{mrf.name}</Text>
              </View>
            </View>
          );
        })}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>Full</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.satelliteBtn} activeOpacity={0.8}>
          <Text style={styles.satelliteText}>Satellite</Text>
        </TouchableOpacity>
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomBtn} activeOpacity={0.8}>
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn} activeOpacity={0.8}>
            <Text style={styles.zoomText}>−</Text>
          </TouchableOpacity>
        </View>

      </View>

      <View style={styles.footer}>
        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.footerText}>Batangas City — MRF Facility Map</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.secondary, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  mapBackground: { height: 300, backgroundColor: '#E8F5E9', position: 'relative', overflow: 'hidden' },
  gridLineH:     { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#C8E6C9' },
  gridLineV:     { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#C8E6C9' },
  markerWrapper: { position: 'absolute', alignItems: 'center', width: 80, marginLeft: -40 },
  iconCircle: {
    width: 32, height: 32, borderRadius: 9999,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  label:     { marginTop: 4, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, maxWidth: 80 },
  labelText: { fontSize: 8, color: colors.textPrimary, fontWeight: '600', textAlign: 'center' },
  legend:    { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: 8, gap: 5 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 9999 },
  legendText:{ fontSize: 10, color: colors.textPrimary, fontWeight: '500' },
  satelliteBtn: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  satelliteText: { fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  zoomControls:  { position: 'absolute', bottom: 10, right: 10, gap: 4 },
  zoomBtn:  { width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  zoomText: { fontSize: 18, color: colors.textPrimary, fontWeight: '600', lineHeight: 22 },
  footer:     { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, backgroundColor: colors.secondary },
  footerText: { fontSize: typography.size.xs, color: colors.textSecondary },
});
