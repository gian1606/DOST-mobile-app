import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';

export default function ReportingConfirmedScreen({ navigation, route }) {
  // Data passed from ReportBinScreen after successful AWS backend verification
  const apiResult = route?.params?.result;
  const binName   = route?.params?.binName || 'Smart Bin';
  const binStreet = route?.params?.binStreet || 'Barangay Alangilan';
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const ecoEarned = apiResult?.eco_awarded ?? 15; // Reward tokens earned for reporting
  const trackingId = apiResult?.report_id ?? `REP-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <View style={styles.screen}>
      {/* Primary header bar matching resident theme */}
      <View style={styles.headerBar} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success checkmark icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={32} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.heading}>Bin Reported Successfully!</Text>
        <Text style={styles.subheading}>
          <Text style={styles.binHighlight}>{binName}</Text>
          {binStreet ? ` near ${binStreet}` : ''} has been verified by AI and added to the <Text style={styles.queuedHighlight}>COLLECTION QUEUE.</Text>
        </Text>

        {/* Report Log Card */}
        <View style={styles.logCard}>
          <View style={styles.logCardHeader}>
            <Text style={styles.logCardTitle}>Verification Summary</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>AWS Verified</Text>
            </View>
          </View>
          <LogRow label="Tracking ID"   value={trackingId} />
          <LogRow label="Detected Status" value="Full Bin (100%)" />
          <LogRow label="ECO Earned"    value={`+${ecoEarned} ECO`} />
          <LogRow label="Time Logged"   value={timeStr} />
          <View style={styles.logRow}>
            <Text style={styles.logLabel}>Routing Status</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.statusValue}>Queued for Solver</Text>
            </View>
          </View>
        </View>

        {/* Info Banner explaining next steps */}
        <View style={styles.infoBanner}>
          <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoTitle}>What happens next?</Text>
            <Text style={styles.infoSub}>Our OR-Tools routing engine will optimize the collection fleet path to clear this bin shortly.</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.navigate('ResidentTabsMain')}
            activeOpacity={0.8}
          >
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function LogRow({ label, value }) {
  return (
    <View style={styles.logRow}>
      <Text style={styles.logLabel}>{label}</Text>
      <Text style={styles.logValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  headerBar: { height: 56, backgroundColor: colors.primary },
  content: { padding: 20, gap: 16, alignItems: 'center' },
  iconWrap: { marginTop: 8 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 9999,
    backgroundColor: '#E6F7F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#B2D8C8',
  },
  heading: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subheading: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  binHighlight:       { fontWeight: typography.weight.bold, color: colors.textPrimary },
  queuedHighlight:    { fontWeight: typography.weight.bold, color: colors.primary },
  logCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E0EDE8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logCardTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  verifiedBadge: {
    backgroundColor: '#E6F7F2',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#B2D8C8',
  },
  verifiedText: { fontSize: typography.size.xs, color: colors.primary, fontWeight: typography.weight.semibold },
  logRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logLabel:  { fontSize: typography.size.sm, color: colors.textSecondary, flexShrink: 0 },
  logValue:  { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textPrimary, textAlign: 'right', flex: 1, marginLeft: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, flex: 1, marginLeft: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 9999, flexShrink: 0 },
  statusValue: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.warning },
  infoBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F4FAF7',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#D8E8E2',
  },
  infoTextWrap: { flex: 1, gap: 2 },
  infoTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.primary },
  infoSub:   { fontSize: typography.size.xs, color: colors.textSecondary, lineHeight: 16 },
  actionRow: { width: '100%', marginTop: 8 },
  homeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  homeBtnText: { color: '#fff', fontWeight: typography.weight.bold, fontSize: typography.size.base },
});