import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import MRFTransactionRow from '../../components/MRFTransactionRow';
import { api } from '../../api';

const FILTER_TABS = [
  { label: 'All',       value: 'all'   },
  { label: 'Today',     value: 'today' },
  { label: 'This Week', value: 'week'  },
];

export default function TransactionsScreen() {
  const [activeTab, setActiveTab]   = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchTransactions(activeTab);
    }, [activeTab])
  );

  function fetchTransactions(filter) {
    setLoading(true);
    setError('');
    api.get(`/eco/mrf-transactions?filter=${filter}`)
      .then((data) => setTransactions(
        data.map((t) => ({
          id:           t.id,
          residentName: t.resident_name,
          residentId:   t.resident_id,
          wasteType:    t.waste_type,
          weight:       `${t.weight_kg} kg`,
          tokensAwarded: t.eco_awarded,
          txHash:       t.tx_hash,
          dateTime:     new Date(t.created_at).toLocaleString('en-PH', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          }),
        }))
      ))
      .catch((err) => setError(err.message || 'Failed to load transactions.'))
      .finally(() => setLoading(false));
  }

  const totalEco       = transactions.reduce((sum, t) => sum + t.tokensAwarded, 0);
  const totalResidents = new Set(transactions.map((t) => t.residentId)).size;

  return (
    <View style={styles.screen}>

      <View style={styles.header}>
        <Text style={styles.title}>Token Transactions</Text>
        {!loading && transactions.length > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryChip}>
              <Ionicons name="diamond" size={12} color={colors.secondary} />
              <Text style={styles.summaryText}>{totalEco.toLocaleString()} ECO issued</Text>
            </View>
            <View style={styles.summaryChip}>
              <Ionicons name="people-outline" size={12} color={colors.secondary} />
              <Text style={styles.summaryText}>{totalResidents} resident{totalResidents !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Filter tabs */}
      <View style={styles.toggleWrapper}>
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

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.emptyState}>
          <Ionicons name="warning-outline" size={40} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MRFTransactionRow transaction={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 10 },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.secondary },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  summaryText: { fontSize: typography.size.xs, color: colors.secondary, fontWeight: typography.weight.medium },
  toggleWrapper: { flexDirection: 'row', backgroundColor: colors.secondary, paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  togglePill: { flex: 1, paddingVertical: 9, borderRadius: 9999, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.cardBorder },
  togglePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textSecondary },
  toggleTextActive: { color: colors.secondary },
  list: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: typography.size.base, color: colors.textMuted },
  errorText: { fontSize: typography.size.sm, color: colors.error, textAlign: 'center', paddingHorizontal: 20 },
});
