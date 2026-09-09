import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Modal, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../theme/typography';
import { mockCollectorUser, mockCollectorBins } from '../../mock/data';
import { api } from '../../api';

const C = {
  primary:  '#0D7A5F',
  accent:   '#00E5A0',
  bg:       '#F4FAF7',
  surface:  '#FFFFFF',
  textPri:  '#0D1F1A',
  textSec:  '#6B8C81',
  error:    '#E53535',
  success:  '#00C86A',
  warning:  '#F5A623',
};

const STATUS_CONFIG = {
  full:      { color: C.error,   label: 'Full',      icon: 'alert-circle-outline'     },
  collected: { color: C.success, label: 'Collected', icon: 'checkmark-circle-outline' },
  missed:    { color: C.warning, label: 'Missed',    icon: 'close-circle-outline'     },
};

const ISSUE_TYPES = [
  'Vehicle Problem',
  'Traffic Jam',
  'Road Closure',
  'Weather Condition',
  'Other',
];

export default function CollectorRouteScreen() {
  const fullBins      = mockCollectorBins.filter((b) => b.status === 'full').length;
  const collectedBins = mockCollectorBins.filter((b) => b.status === 'collected').length;
  const totalBins     = mockCollectorBins.length;
  const progress      = Math.round((collectedBins / totalBins) * 100);

  // ── Report modal state ──────────────────────────────────────────────────────
  const [reportVisible, setReportVisible] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [notes, setNotes]                 = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  function openReport() {
    setSelectedIssue(null);
    setNotes('');
    setSubmitError('');
    setReportVisible(true);
  }

  function closeReport() {
    setReportVisible(false);
  }

  async function handleSubmitReport() {
    if (!selectedIssue) {
      setSubmitError('Please select an issue type.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.post('/collector-reports', {
        issue_type:       selectedIssue,
        notes:            notes.trim() || null,
        stops_completed:  collectedBins,
        stops_total:      totalBins,
      });
      setReportVisible(false);
      setSuccessVisible(true);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Today's Route</Text>
          <Text style={styles.subtitle}>
            {mockCollectorUser.zone} · {mockCollectorBins.length} stops
          </Text>
        </View>
        <TouchableOpacity style={styles.reportBtn} onPress={openReport} activeOpacity={0.8}>
          <Ionicons name="warning-outline" size={16} color="#fff" />
          <Text style={styles.reportBtnText}>Report</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Progress card */}
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View style={styles.progressLeft}>
              <Text style={styles.progressTitle}>Route Progress</Text>
              <Text style={styles.progressSub}>{collectedBins} of {totalBins} bins collected</Text>
            </View>
            <Text style={styles.progressPct}>{progress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <View style={[styles.statDot, { backgroundColor: C.error }]} />
              <Text style={styles.progressStatText}>{fullBins} remaining</Text>
            </View>
            <View style={styles.progressStat}>
              <View style={[styles.statDot, { backgroundColor: C.success }]} />
              <Text style={styles.progressStatText}>{collectedBins} collected</Text>
            </View>
          </View>
        </View>

        {/* Stop list */}
        <Text style={styles.sectionLabel}>Stops</Text>
        {mockCollectorBins.map((bin, index) => {
          const cfg = STATUS_CONFIG[bin.status] || STATUS_CONFIG.full;
          return (
            <View key={bin.id} style={styles.stopCard}>
              <View style={[styles.stepBadge, { backgroundColor: cfg.color }]}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <View style={styles.stopInfo}>
                <Text style={styles.stopName}>{bin.name} — {bin.street}</Text>
                <Text style={styles.stopBarangay}>{bin.barangay}</Text>
                <Text style={styles.stopReported}>
                  Reported by {bin.reportedBy} · {bin.timeReported}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: cfg.color + '22', borderColor: cfg.color }]}>
                <Ionicons name={cfg.icon} size={13} color={cfg.color} />
                <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
          );
        })}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Report Modal ── */}
      <Modal
        visible={reportVisible}
        transparent
        animationType="slide"
        onRequestClose={closeReport}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>

            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="warning" size={20} color={C.error} />
                <Text style={styles.modalTitle}>Report an Issue</Text>
              </View>
              <TouchableOpacity onPress={closeReport} disabled={submitting}>
                <Ionicons name="close" size={22} color={C.textSec} />
              </TouchableOpacity>
            </View>

            {/* Progress context */}
            <View style={styles.progressBadge}>
              <Ionicons name="location-outline" size={13} color={C.primary} />
              <Text style={styles.progressBadgeText}>
                {collectedBins} of {totalBins} stops completed at time of report
              </Text>
            </View>

            {/* Issue type selector */}
            <Text style={styles.fieldLabel}>Issue Type <Text style={styles.required}>*</Text></Text>
            <View style={styles.issueList}>
              {ISSUE_TYPES.map((issue) => {
                const isSelected = selectedIssue === issue;
                return (
                  <TouchableOpacity
                    key={issue}
                    style={[styles.issuePill, isSelected && styles.issuePillSelected]}
                    onPress={() => { setSelectedIssue(issue); setSubmitError(''); }}
                    activeOpacity={0.7}>
                    <Text style={[styles.issuePillText, isSelected && styles.issuePillTextSelected]}>
                      {issue}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notes */}
            <Text style={styles.fieldLabel}>Additional Notes <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Describe the issue in more detail…"
              placeholderTextColor="#9BB5AC"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!submitting}
            />

            {/* Error */}
            {submitError ? (
              <Text style={styles.errorText}>{submitError}</Text>
            ) : null}

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={closeReport}
                disabled={submitting}
                activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmitReport}
                disabled={submitting}
                activeOpacity={0.8}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={15} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Report</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Success Modal ── */}
      <Modal
        visible={successVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.successSheet}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color={C.success} />
            </View>
            <Text style={styles.successTitle}>Report Submitted</Text>
            <Text style={styles.successSub}>
              Your incident report has been sent to the collector admin. You may continue your route.
            </Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => setSuccessVisible(false)}
              activeOpacity={0.8}>
              <Text style={styles.successBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  // ── Header ──
  header: {
    backgroundColor: C.primary,
    paddingTop: 56,
    paddingBottom: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerLeft: { gap: 4 },
  title:      { fontSize: 24, fontWeight: '700', color: '#fff' },
  subtitle:   { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.error,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reportBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  content: { padding: 16, gap: 14 },

  // ── Progress card ──
  progressCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0EDE8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  progressTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progressLeft: { gap: 2 },
  progressTitle: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: C.textPri },
  progressSub:   { fontSize: typography.size.xs, color: C.textSec },
  progressPct:   { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: C.primary },
  progressBarBg:   { height: 8, backgroundColor: '#D6EAE0', borderRadius: 9999, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: C.primary, borderRadius: 9999 },
  progressStats: { flexDirection: 'row', gap: 16 },
  progressStat:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDot:       { width: 8, height: 8, borderRadius: 9999 },
  progressStatText: { fontSize: typography.size.xs, color: C.textSec },

  sectionLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: C.textPri,
    marginTop: 4,
  },

  // ── Stop card ──
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0EDE8',
  },
  stepBadge: {
    width: 28, height: 28, borderRadius: 9999,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  stepNumber:   { fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: '#fff' },
  stopInfo:     { flex: 1, gap: 2 },
  stopName:     { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: C.textPri },
  stopBarangay: { fontSize: typography.size.xs, color: C.textSec },
  stopReported: { fontSize: typography.size.xs, color: '#9BB5AC', marginTop: 1 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, flexShrink: 0,
  },
  statusPillText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },

  // ── Report Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle:    { fontSize: 18, fontWeight: '700', color: C.textPri },

  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  progressBadgeText: { fontSize: 12, color: C.primary, fontWeight: '600' },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textPri },
  required:   { color: C.error },
  optional:   { fontSize: 12, fontWeight: '400', color: C.textSec },

  issueList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  issuePill: {
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  issuePillSelected: {
    borderColor: C.error,
    backgroundColor: '#FFF5F5',
  },
  issuePillText:         { fontSize: 13, color: C.textSec, fontWeight: '500' },
  issuePillTextSelected: { color: C.error, fontWeight: '700' },

  notesInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: C.textPri,
    backgroundColor: '#F9FAFB',
    minHeight: 90,
  },

  errorText: { fontSize: 13, color: C.error, textAlign: 'center' },

  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: C.textSec },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
    backgroundColor: C.error,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // ── Success Modal ──
  successSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    paddingBottom: 48,
  },
  successIcon:  { marginBottom: 4 },
  successTitle: { fontSize: 20, fontWeight: '700', color: C.textPri },
  successSub:   { fontSize: 14, color: C.textSec, textAlign: 'center', lineHeight: 20 },
  successBtn: {
    marginTop: 8,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 40,
  },
  successBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
