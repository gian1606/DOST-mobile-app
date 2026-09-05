import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import TransactionRow from '../../components/TransactionRow';
import { api } from '../../api';

export default function TransactionsScreen() {
  const [activeTab, setActiveTab] = useState('earned');
  const [earned, setEarned]       = useState([]);
  const [redeemed, setRedeemed]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setError('');
      api.get('/eco/transactions')
        .then((data) => {
          // Normalize to match TransactionRow's expected shape
          setEarned(
            (data.earned || []).map((t) => ({
              id:          t.id,
              type:        'earned',
              title:       t.weight_kg ? `${t.title} · ${t.weight_kg} kg` : t.title,
              description: t.tx_hash ? `tx: ${t.tx_hash.slice(0, 16)}...` : '',
              dateTime:    new Date(t.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              amount:      t.amount,
            }))
          );
          setRedeemed(
            (data.redeemed || []).map((t) => ({
              id:          t.id,
              type:        'redeemed',
              title:       t.title,
              description: t.tx_hash ? `tx: ${t.tx_hash.slice(0, 16)}...` : '',
              dateTime:    new Date(t.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              amount:      t.amount,
            }))
          );
        })
        .catch((err) => setError(err.message || 'Failed to load transactions.'))
        .finally(() => setLoading(false));
    }, [])
  );

  const data = activeTab === 'earned' ? earned : redeemed;

  return (
    <View style={styles.screen}>

      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
      </View>

      <View style={styles.toggleWrapper}>
        {['earned', 'redeemed'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.togglePill, activeTab === tab && styles.togglePillActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, activeTab === tab && styles.toggleTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        : error
          ? <Text style={styles.errorText}>{error}</Text>
          : <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <TransactionRow transaction={item} />}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={styles.emptyText}>No {activeTab} transactions yet.</Text>}
            />
      }

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.secondary },
  toggleWrapper: { flexDirection: 'row', backgroundColor: colors.secondary, paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  togglePill: { flex: 1, paddingVertical: 9, borderRadius: 9999, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.cardBorder },
  togglePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textSecondary },
  toggleTextActive: { color: colors.secondary },
  list: { padding: 16, paddingBottom: 40 },
  errorText: { textAlign: 'center', marginTop: 40, fontSize: typography.size.sm, color: colors.error },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: typography.size.sm, color: colors.textMuted },
});
