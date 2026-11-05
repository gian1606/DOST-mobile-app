import { useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import ChangePasswordModal from '../../components/modals/ChangePasswordModal';
import InfoModal from '../../components/modals/InfoModal';
import { useAuth } from '../../context/AuthContext';
import { fetchUserProfile } from '../../services/auth';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [changePwVisible, setChangePwVisible] = useState(false);
  const [infoModal, setInfoModal]       = useState(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchUserProfile()
        .then(setProfile)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [])
  );

  const settingsItems = [
    { icon: 'lock-closed-outline',        label: 'Change Password', onPress: () => setChangePwVisible(true) },
    { icon: 'information-circle-outline', label: 'About BE SMART',  onPress: () => setInfoModal('about')    },
    { icon: 'help-circle-outline',        label: 'Help & Support',  onPress: () => setInfoModal('help')     },
  ];

  const infoItems = [
    { icon: 'mail-outline',     label: 'Email',    value: profile?.email    ?? '—' },
    { icon: 'call-outline',     label: 'Phone',    value: profile?.phone    ?? '—' },
    { icon: 'home-outline',     label: 'Address',  value: profile?.address  ?? '—' },
    { icon: 'location-outline', label: 'Barangay', value: profile?.barangay ?? '—' },
  ];

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

        {loading ? (
          <ActivityIndicator color={colors.buyerPrimary} style={{ marginTop: 80 }} />
        ) : (
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile?.initials ?? '?'}</Text>
              </View>
              <Text style={styles.name}>{profile?.name ?? '—'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>MRF Buyer</Text>
              </View>
              <Text style={styles.memberSince}>Member since {profile?.memberSince ?? '—'}</Text>
            </View>

            {/* Buyer stats are stubs until MRF reservations domain is implemented */}
            <View style={styles.statsRow}>
              {[
                { label: 'Total Purchases', value: profile?.totalPurchases        ?? 0 },
                { label: 'Bids Won',        value: profile?.completedReservations ?? 0 },
              ].map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              {infoItems.map((item) => (
                <View key={item.label} style={styles.infoRow}>
                  <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              {settingsItems.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.settingsRow, index < settingsItems.length - 1 && styles.settingsRowBorder]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                  <View style={styles.settingsRight}>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => logout()}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>

      <ChangePasswordModal
        visible={changePwVisible}
        onClose={() => setChangePwVisible(false)}
        accentColor={colors.buyerPrimary}
      />
      <InfoModal
        visible={infoModal !== null}
        onClose={() => setInfoModal(null)}
        type={infoModal}
        accentColor={colors.buyerPrimary}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: colors.background },
  content:  { padding: 20, paddingTop: 60, gap: 18, paddingBottom: 40 },
  profileCard: {
    backgroundColor: colors.secondary, borderRadius: 18, padding: 24,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 9999, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  avatarText:  { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.secondary },
  name:        { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary },
  roleBadge: {
    backgroundColor: colors.buyerLight, borderWidth: 1, borderColor: colors.buyerPrimary,
    borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 4,
  },
  roleText:    { fontSize: typography.size.xs, color: colors.buyerPrimary, fontWeight: typography.weight.semibold },
  memberSince: { fontSize: typography.size.xs, color: colors.textMuted },
  statsRow:    { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: colors.secondary, borderRadius: 12, padding: 12,
    alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statValue:         { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.primary },
  statLabel:         { fontSize: typography.size.xs, color: colors.textSecondary, textAlign: 'center' },
  sectionCard: {
    backgroundColor: colors.secondary, borderRadius: 14, padding: 16, gap: 14,
    borderWidth: 1, borderColor: colors.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle:      { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  infoRow:           { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoContent:       { flex: 1, gap: 2 },
  infoLabel:         { fontSize: typography.size.xs, color: colors.textSecondary },
  infoValue:         { fontSize: typography.size.sm, color: colors.textPrimary, fontWeight: typography.weight.medium },
  settingsRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.cardBorder, paddingBottom: 14 },
  settingsLabel:     { flex: 1, fontSize: typography.size.sm, color: colors.textPrimary, fontWeight: typography.weight.medium },
  settingsRight:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.error, borderRadius: 10,
    paddingVertical: 14, backgroundColor: colors.secondary,
  },
  logoutText: { color: colors.error, fontSize: typography.size.base, fontWeight: typography.weight.semibold },
});
