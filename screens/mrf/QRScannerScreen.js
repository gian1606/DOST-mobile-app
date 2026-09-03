import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Modal, ActivityIndicator, AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { api, getToken } from '../../api';

export default function QRScannerScreen() {
  // ── Camera & permission state ─────────────────────────────────────────────
  const [permission, setPermission]       = useState(null);  // null = checking
  const [flashOn, setFlashOn]             = useState(false);
  const [active, setActive]               = useState(true);  // pause camera after scan

  // ── Scan result state ─────────────────────────────────────────────────────
  const [scannedQR, setScannedQR]         = useState(null);
  const [wasteTypes, setWasteTypes]       = useState([]);
  const [selectedWaste, setSelectedWaste] = useState(null);
  const weightKg                          = 2;               // fixed weight for now

  // ── UI state ──────────────────────────────────────────────────────────────
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [result, setResult]                 = useState(null);

  const appState = useRef(AppState.currentState);

  // Request camera permission on mount
  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setPermission(status === 'granted');
    });
  }, []);

  // Pause camera when app goes to background, resume when active
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        setActive(true);
      } else if (next.match(/inactive|background/)) {
        setActive(false);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  // Load waste types from API on mount — retry once on failure
  useEffect(() => {
    api.get('/eco/waste-types')
      .then((data) => {
        if (data && data.length > 0) setWasteTypes(data);
      })
      .catch(() => {
        // Retry once after 2 seconds
        setTimeout(() => {
          api.get('/eco/waste-types')
            .then((data) => { if (data && data.length > 0) setWasteTypes(data); })
            .catch(() => {}); // silent fail — user will see empty waste list
        }, 2000);
      });
  }, []);

  // ── Barcode scanned callback ──────────────────────────────────────────────
  function handleBarCodeScanned({ data }) {
    if (!active || scannedQR) return;
    if (!data.startsWith('BESMART-RESIDENT-')) {
      setError('Invalid QR code. Please scan a resident QR code.');
      return;
    }
    setActive(false);
    setScannedQR(data);
    setSelectedWaste(null);
    setError('');
  }

  function handleIssueTokens() {
    if (!selectedWaste) return;
    setConfirmVisible(true);
  }

  async function confirmIssue() {
    setConfirmVisible(false);
    setLoading(true);
    setError('');
    try {
      const payload = {
        qrValue:     scannedQR,
        wasteTypeId: selectedWaste.id,
        weightKg,
      };
      console.log('[ECO ISSUE] payload:', JSON.stringify(payload));
      console.log('[ECO ISSUE] token present:', !!getToken());
      console.log('[ECO ISSUE] API URL:', process.env.EXPO_PUBLIC_API_URL);
      const data = await api.post('/eco/issue', payload);
      setResult(data);
      setSuccessVisible(true);
    } catch (err) {
      console.log('[ECO ISSUE] error:', err.message);
      setError(err.message || 'Failed to issue ECO. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleDone() {
    setSuccessVisible(false);
    setScannedQR(null);
    setSelectedWaste(null);
    setResult(null);
    setError('');
    setActive(true);                           // resume camera
  }

  function handleScanAgain() {
    setScannedQR(null);
    setSelectedWaste(null);
    setError('');
    setActive(true);
  }

  const ecoToAward = selectedWaste
    ? Math.round(weightKg * Number(selectedWaste.eco_per_kg))
    : 0;

  // ── Permission states ─────────────────────────────────────────────────────
  if (permission === null) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.permissionText}>Requesting camera access…</Text>
      </View>
    );
  }

  if (permission === false) {
    return (
      <View style={styles.centeredScreen}>
        <Ionicons name="camera-off-outline" size={48} color="rgba(255,255,255,0.5)" />
        <Text style={styles.permissionText}>Camera access denied.</Text>
        <Text style={styles.permissionSub}>
          Please enable camera permission in your device settings to scan QR codes.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>

      {/* ── Camera ── */}
      {!scannedQR && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          flash={flashOn ? 'torch' : 'off'}
          onBarcodeScanned={active ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
      )}

      {/* Flash toggle */}
      <TouchableOpacity
        style={styles.flashBtn}
        onPress={() => setFlashOn(!flashOn)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={flashOn ? 'flash' : 'flash-off'}
          size={24}
          color={colors.secondary}
        />
      </TouchableOpacity>

      {/* Scan frame + instructions (only when no QR scanned yet) */}
      {!scannedQR && (
        <View style={styles.scanArea}>
          {/* Viewfinder overlay */}
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.instruction}>Scan Resident QR Code</Text>
          <Text style={styles.subInstruction}>
            Align the resident's QR code within the frame to issue ECO
          </Text>
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
              <TouchableOpacity onPress={() => setError('')}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}

      {/* ── Bottom sheet: waste selection ── */}
      {scannedQR && (
        <View style={styles.bottomSheet}>

          {/* Resident verified card */}
          <View style={styles.residentCard}>
            <View style={styles.residentAvatar}>
              <Ionicons name="person" size={20} color={colors.secondary} />
            </View>
            <View style={styles.residentInfo}>
              <Text style={styles.residentName}>Resident Verified</Text>
              <Text style={styles.residentId} numberOfLines={1}>
                ID: {scannedQR.replace('BESMART-RESIDENT-', '')}
              </Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.sheetLabel}>Select Waste Type</Text>
          {wasteTypes.length === 0 ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Loading waste types… Please wait.</Text>
            </View>
          ) : (
          <View style={styles.wasteOptions}>
            {wasteTypes.map((type) => {
              const isSelected = selectedWaste?.label === type.label;
              return (
                <TouchableOpacity
                  key={type.label}
                  style={[styles.wasteOption, isSelected && styles.wasteOptionSelected]}
                  onPress={() => setSelectedWaste(type)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={type.icon || 'cube-outline'}
                    size={18}
                    color={isSelected ? colors.secondary : colors.textSecondary}
                  />
                  <Text style={[styles.wasteOptionText, isSelected && styles.wasteOptionTextSelected]}>
                    {type.label}
                  </Text>
                  <Text style={[styles.wasteRate, isSelected && styles.wasteRateSelected]}>
                    {type.eco_per_kg} ECO/kg
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          )}

          <TouchableOpacity
            style={[styles.issueBtn, (!selectedWaste || loading || wasteTypes.length === 0) && styles.issueBtnDisabled]}
            onPress={handleIssueTokens}
            activeOpacity={0.8}
            disabled={!selectedWaste || loading || wasteTypes.length === 0}
          >
            {loading
              ? <ActivityIndicator color={colors.secondary} />
              : <>
                  <Ionicons name="diamond" size={18} color={colors.secondary} />
                  <Text style={styles.issueBtnText}>
                    Issue {ecoToAward > 0 ? `${ecoToAward} ` : ''}ECO
                  </Text>
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={handleScanAgain} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel — Scan Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Confirm modal ── */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Issue ECO?</Text>
            <Text style={styles.modalSubtitle}>Waste type:</Text>
            <Text style={styles.modalHighlight}>{selectedWaste?.label} · {weightKg} kg</Text>
            <View style={styles.modalTokenRow}>
              <Ionicons name="diamond" size={20} color={colors.primary} />
              <Text style={styles.modalTokenAmount}>+{ecoToAward} ECO</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmIssue}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Success modal ── */}
      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
            <Text style={styles.modalTitle}>ECO Issued!</Text>
            <Text style={styles.modalSubtitle}>
              Successfully awarded{' '}
              <Text style={{ color: colors.primary, fontWeight: typography.weight.bold }}>
                +{result?.ecoAwarded} ECO
              </Text>
              {result?.residentName ? ` to ${result.residentName}` : ''}.
            </Text>
            <Text style={styles.txHash} numberOfLines={1}>
              tx: {result?.txHash?.slice(0, 22)}...
            </Text>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleDone}>
              <Text style={styles.modalConfirmText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const CORNER_SIZE = 22;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#1A1A1A' },
  centeredScreen: { flex: 1, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  permissionText: { color: '#fff', fontSize: typography.size.base, fontWeight: typography.weight.semibold, textAlign: 'center' },
  permissionSub:  { color: 'rgba(255,255,255,0.55)', fontSize: typography.size.sm, textAlign: 'center', lineHeight: 20 },

  flashBtn: { position: 'absolute', top: 56, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 9999 },

  scanArea: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20, paddingBottom: 40 },

  // Custom viewfinder corners
  viewfinder: { width: 240, height: 240, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  corner:     { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#fff' },
  cornerTL:   { top: 0, left: 0,  borderTopWidth: CORNER_WIDTH, borderLeftWidth:  CORNER_WIDTH },
  cornerTR:   { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  cornerBL:   { bottom: 0, left: 0,  borderBottomWidth: CORNER_WIDTH, borderLeftWidth:  CORNER_WIDTH },
  cornerBR:   { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },

  instruction:    { color: colors.secondary, fontSize: typography.size.base, fontWeight: typography.weight.semibold, textAlign: 'center' },
  subInstruction: { color: 'rgba(255,255,255,0.6)', fontSize: typography.size.sm, textAlign: 'center', paddingHorizontal: 40 },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(220,38,38,0.85)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: 20 },
  errorBannerText: { flex: 1, color: '#fff', fontSize: typography.size.sm },

  bottomSheet:    { backgroundColor: colors.secondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  residentCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successLight, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#A5D6A7', gap: 12 },
  residentAvatar: { width: 44, height: 44, borderRadius: 9999, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  residentInfo:   { flex: 1, gap: 2 },
  residentName:   { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  residentId:     { fontSize: typography.size.xs, color: colors.textSecondary },
  verifiedBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText:   { fontSize: typography.size.xs, color: colors.primary, fontWeight: typography.weight.semibold },

  errorBox:  { backgroundColor: '#FFEBEE', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#FFCDD2' },
  errorText: { fontSize: typography.size.sm, color: colors.error, textAlign: 'center' },

  sheetLabel:            { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  wasteOptions:          { gap: 8 },
  wasteOption:           { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.cardBorder, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.background },
  wasteOptionSelected:   { backgroundColor: colors.primary, borderColor: colors.primary },
  wasteOptionText:       { flex: 1, fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.textPrimary },
  wasteOptionTextSelected: { color: colors.secondary },
  wasteRate:             { fontSize: typography.size.xs, color: colors.textMuted },
  wasteRateSelected:     { color: 'rgba(255,255,255,0.8)' },

  issueBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, marginTop: 4 },
  issueBtnDisabled: { backgroundColor: colors.textMuted },
  issueBtnText:     { color: colors.secondary, fontWeight: typography.weight.bold, fontSize: typography.size.base },
  cancelText:       { textAlign: 'center', fontSize: typography.size.sm, color: colors.textSecondary, paddingVertical: 4 },

  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard:       { backgroundColor: colors.secondary, borderRadius: 18, padding: 28, width: '100%', alignItems: 'center', gap: 12 },
  modalTitle:      { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary },
  modalSubtitle:   { fontSize: typography.size.base, color: colors.textSecondary, textAlign: 'center' },
  modalHighlight:  { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.textPrimary },
  modalTokenRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalTokenAmount:{ fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.primary },
  txHash:          { fontSize: typography.size.xs, color: colors.textMuted },
  modalActions:    { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  modalCancelBtn:  { flex: 1, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  modalCancelText: { fontSize: typography.size.base, color: colors.textSecondary, fontWeight: typography.weight.medium },
  modalConfirmBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  modalConfirmText:{ color: colors.secondary, fontWeight: typography.weight.bold, fontSize: typography.size.base },
});
