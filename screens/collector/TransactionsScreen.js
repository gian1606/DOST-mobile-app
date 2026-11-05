import { useState, useCallback } from 'react';
import {
  View, Text, FlatList,
  TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { fetchCollectorCollections } from '../../services/collector';

const FILTER_TABS = [
  { label: 'All',       value: 'all'   },
  { label: 'Today',     value: 'today' },
  { label: 'This Week', value: 'week'  },
];

export default function CollectorTransactionsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]   = useState('all');
  const [collections, setCollections] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useFocusEffect(
    useCallback(() => {
      loadCollections(activeTab);
    }, [activeTab])
  );

  function loadCollections(filter) {
    setLoading(true);
    setError('');
    fetchCollectorCollections(filter)
      .then(setCollections)
      .catch((err) => setError(err.message || 'Failed to load collection history.'))
      .finally(() => setLoading(false));
  }

  const totalCollected = collections.length;
  const totalVolume    = collections.reduce((sum, t) => sum + (t.volumeL ?? 0), 0);
  const totalEco       = collections.reduce((sum, t) => sum + (t.ecoAwarded ?? 0), 0);

  return (
    <View style={styles.screen}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Collection Log</Text>
        <Text style={styles.subtitle}>{user?.barangay ?? '—'}</Text>

        {/* Filter tabs */}
        <View style={styles.toggleRow}>
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.value}
              style={[styles.togglePill, activeTab === tab.value && styles.togglePillActive]}
              onPress={() => setActiveTab(tab.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, activeTab === tab.value && styles.toggleTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary row */}
        {!loading && !error && (
          <View style={styles.summaryRow}>
            <SummaryItem icon="checkmark-circle-outline" value={totalCollected}             label="Collected"    />
            <View style={styles.summaryDivider} />
            <SummaryItem icon="scale-outline"            value={`${totalVolume.toFixed(1)} L`} label="Total Volume" />
            <View style={styles.summaryDivider} />
            <SummaryItem icon="diamond-outline"          value={totalEco}                   label="ECO Awarded"  />
          </View>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator color={colors.collectorPrimary} style={{ marginTop: 60 }} />
      ) : error ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CollectionRow item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No collections found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function SummaryItem({ icon, value, label }) {
  return (
    <View style={styles.summaryItem}>
      <Ionicons name={icon} size={16} color="rgba(255,255,255,0.8)" />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function CollectionRow({ item }) {
  return (
    <View style={rowStyles.card}>
      <View style={rowStyles.iconWrap}>
        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
      </View>
      <View style={rowStyles.info}>
        <Text style={rowStyles.binName}>
          {item.binName}{item.street ? ` — ${item.street}` : ''}
        </Text>
        <Text style={rowStyles.barangay}>{item.barangay}</Text>
        <Text style={rowStyles.time}>{item.collectedAt ?? '—'}</Text>
      </View>
      <View style={rowStyles.right}>
        <View style={rowStyles.badge}>
          <Text style={rowStyles.badgeText}>Collected</Text>
        </View>
        {item.volumeL != null && (
          <Text style={rowStyles.volume}>{item.volumeL} L</Text>
        )}
        {item.ecoAwarded > 0 && (
          <Text style={rowStyles.eco}>+{item.ecoAwarded} ECO</Text>
        )}
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.collectorBorder,
    marginBottom: 10,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 9999,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#E6FFF4',
  },
  info:     { flex: 1, gap: 2 },
  binName:  { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary },
  barangay: { fontSize: typography.size.xs, color: colors.textSecondary },
  time:     { fontSize: typography.size.xs, color: colors.collectorMuted, marginTop: 2 },
  right:    { alignItems: 'flex-end', gap: 4 },
  badge: {
    borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, backgroundColor: colors.accent + '22', borderColor: colors.accent,
  },
  badgeText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: colors.accent },
  volume:    { fontSize: typography.size.xs, color: colors.textSecondary, fontWeight: typography.weight.medium },
  eco:       { fontSize: typography.size.xs, color: colors.collectorPrimary, fontWeight: typography.weight.semibold },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.collectorLight },
  header: {
    backgroundColor: colors.collectorPrimary,
    padding: 20, paddingTop: 60, gap: 14, paddingBottom: 20,
  },
  title:    { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: '#fff' },
  subtitle: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.7)', marginTop: -8 },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 9999, padding: 4, gap: 4,
  },
  togglePill:       { flex: 1, paddingVertical: 8, borderRadius: 9999, alignItems: 'center' },
  togglePillActive: { backgroundColor: '#fff' },
  toggleText:       { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: 'rgba(255,255,255,0.7)' },
  toggleTextActive: { color: colors.collectorPrimary },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12, padding: 14,
  },
  summaryItem:   { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  summaryValue:  { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: '#fff' },
  summaryLabel:  { fontSize: typography.size.xs, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  list:          { padding: 16, paddingBottom: 40 },
  emptyState:    { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText:     { fontSize: typography.size.base, color: colors.textSecondary, textAlign: 'center' },
});
