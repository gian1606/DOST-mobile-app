import { useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { PARTNER_ADS } from '../../constants';
import MRFMapCard from '../../components/mrf/MRFMapCard';
import AdCard from '../../components/shared/AdCard';
import NotificationsModal from '../../components/modals/NotificationsModal';
import { fetchNotifications, markAllNotificationsRead } from '../../services/notifications';
import { fetchMRFFacilities } from '../../services/mrf';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../navigation/routes';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [notifVisible, setNotifVisible]   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [mrfLocations, setMrfLocations]   = useState([]);

  const fullMRFCount = mrfLocations.filter((m) => m.status === 'full').length;

  useFocusEffect(
    useCallback(() => {
      fetchNotifications()
        .then(({ notifications: notifs, unreadCount: count }) => {
          setNotifications(notifs);
          setUnreadCount(count);
        })
        .catch(() => {});

      fetchMRFFacilities()
        .then(setMrfLocations)
        .catch(() => {});
    }, [])
  );

  function handleOpenNotifs() {
    setNotifVisible(true);
    setUnreadCount(0);
    markAllNotificationsRead().catch(() => {});
  }

  return (
    <View style={styles.screen}>

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Good morning, {user?.name?.split(' ')[0] ?? 'Buyer'} 👋
          </Text>
          <Text style={styles.subtitle}>Batangas City MRF Buyer</Text>
        </View>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={handleOpenNotifs}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.secondary} />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* MRF Map — real facilities from API */}
        <MRFMapCard mrfLocations={mrfLocations} />

        {/* Reservations shortcut */}
        <TouchableOpacity
          style={styles.reservationCard}
          onPress={() => navigation.navigate(ROUTES.RESERVATIONS)}
          activeOpacity={0.85}
        >
          <View style={styles.reservationLeft}>
            <View style={styles.reservationIconWrapper}>
              <Ionicons name="calendar-outline" size={22} color={colors.secondary} />
            </View>
            <View style={styles.reservationInfo}>
              <Text style={styles.reservationLabel}>Bidding</Text>
              <Text style={styles.reservationCount}>
                {fullMRFCount} Full MRF{fullMRFCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.reservationAction}>
            <Text style={styles.reservationActionText}>Bid</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.buyerPrimary} />
          </View>
        </TouchableOpacity>

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

      </ScrollView>

      <NotificationsModal
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        notifications={notifications}
        accentColor={colors.buyerPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.buyerPrimary, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  greeting:{ fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.secondary },
  subtitle:{ fontSize: typography.size.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  bellBtn: { position: 'relative', padding: 4 },
  bellBadge: { position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: 9999, backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: colors.buyerPrimary },
  bellBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  scroll:        { flex: 1 },
  content:       { padding: 20, gap: 18, paddingBottom: 40 },
  reservationCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.secondary, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.cardBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  reservationLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reservationIconWrapper: { width: 44, height: 44, borderRadius: 9999, backgroundColor: colors.buyerPrimary, justifyContent: 'center', alignItems: 'center' },
  reservationInfo: { gap: 2 },
  reservationLabel: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: typography.weight.medium },
  reservationCount: { fontSize: typography.size.lg, color: colors.textPrimary, fontWeight: typography.weight.bold },
  reservationAction: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.buyerLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  reservationActionText: { fontSize: typography.size.sm, color: colors.buyerPrimary, fontWeight: typography.weight.semibold },
  sectionLabel:  { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  adScroll:      { marginHorizontal: -20 },
});
