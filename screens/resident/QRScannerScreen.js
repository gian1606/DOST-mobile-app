import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Modal, ActivityIndicator, AppState, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { reportBinScan } from '../../services/bins';
import { fetchUserProfile } from '../../services/auth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

const CORNER_SIZE  = 22;
const CORNER_WIDTH = 3;

// ─── Bottom mode switcher ─────────────────────────────────────────────────────
function ModeSwitcher({ activeMode, onSwitch }) {
  return (
    <View style={switcherStyles.wrap}>
      <View style={switcherStyles.pill}>
        <TouchableOpacity
          style={[switcherStyles.tab, activeMode === 'scan' && switcherStyles.tabActive]}
          onPress={() => onSwitch('scan')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="scan-outline"
            size={16}
            color={activeMode === 'scan' ? colors.secondary : 'rgba(255,255,255,0.6)'}
          />
          <Text style={[switcherStyles.tabLabel, activeMode === 'scan' && switcherStyles.tabLabelActive]}>
            Scan Bin
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[switcherStyles.tab, activeMode === 'myqr' && switcherStyles.tabActive]}
          onPress={() => onSwitch('myqr')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="qr-code-outline"
            size={16}
            color={activeMode === 'myqr' ? colors.secondary : 'rgba(255,255,255,0.6)'}
          />
          <Text style={[switcherStyles.tabLabel, activeMode === 'myqr' && switcherStyles.tabLabelActive]}>
            My QR
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const switcherStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 9999,
    padding: 4,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 9999,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: 'rgba(255,255,255,0.6)',
  },
  tabLabelActive: {
    color: colors.secondary,
  },
});

// ─── My QR panel ─────────────────────────────────────────────────────────────
function MyQRPanel({ profile, loading }) {
  return (
    <View style={qrStyles.screen}>
      {loading || !profile ? (
        <ActivityIndicator color={colors.primary} size="large" />
      ) : (
        <View style={qrStyles.card}>
          {/* Header */}
          <View style={qrStyles.cardHeader}>
            <View style={qrStyles.avatar}>
              <Text style={qrStyles.avatarText}>{profile.initials ?? '?'}</Text>
            </View>
            <Text style={qrStyles.name}>{profile.name ?? '—'}</Text>
            <View style={qrStyles.barangayBadge}>
              <Text style={qrStyles.barangayText}>{profile.barangay ?? '—'}</Text>
            </View>
          </View>

          {/* QR Code */}
          <View style={qrStyles.qrWrap}>
            {profile.id ? (
              <QRCode
                value={`BESMART-RESIDENT-${profile.id}`}
                size={210}
                color={colors.textPrimary}
                backgroundColor={colors.secondary}
              />
            ) : (
              <ActivityIndicator color={colors.primary} />
            )}
          </View>

          {/* Footer hint */}
          <View style={qrStyles.hintRow}>
            <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
            <Text style={qrStyles.hint}>
              Show this to MRF staff to redeem your eco rewards
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const qrStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cameraBg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 110, // leave room for the mode switcher
  },
  card: {
    backgroundColor: colors.secondary,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardHeader: {
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  avatarText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.secondary,
  },
  name: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  barangayBadge: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  barangayText: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.semibold,
  },
  qrWrap: {
    padding: 16,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  hint: {
    flex: 1,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [activeMode, setActiveMode]     = useState('scan');

  // Scanner state
  const [flashOn, setFlashOn]           = useState(false);
  const [scanning, setScanning]         = useState(true);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [result, setResult]             = useState(null);
  const [successVisible, setSuccessVisible] = useState(false);

  // My QR state
  const [profile, setProfile]           = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const isFocused = useIsFocused();
  const appState  = useRef(AppState.currentState);

  // Fetch profile when "My QR" tab is first activated
  useEffect(() => {
    if (activeMode === 'myqr' && !profile) {
      setProfileLoading(true);
      fetchUserProfile()
        .then(setProfile)
        .catch(() => {})
        .finally(() => setProfileLoading(false));
    }
  }, [activeMode]);

  // Re-fetch profile every time this tab comes into focus (keeps data fresh)
  useFocusEffect(
    useCallback(() => {
      if (activeMode === 'myqr') {
        setProfileLoading(true);
        fetchUserProfile()
          .then(setProfile)
          .catch(() => {})
          .finally(() => setProfileLoading(false));
      }
    }, [activeMode])
  );

  // Reset scanning when switching back to scan mode
  useEffect(() => {
    if (activeMode === 'scan') {
      setFlashOn(false);
      setScanning(true);
      setError('');
    }
  }, [activeMode]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') setScanning(true);
      else if (next.match(/inactive|background/)) setScanning(false);
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  async function handleBarCodeScanned({ data }) {
    if (!scanning || loading) return;
    setScanning(false);
    setLoading(true);
    setError('');
    try {
      const response = await reportBinScan(data);
      setResult(response);
      setSuccessVisible(true);
    } catch (err) {
      setError(err.message || 'Scan failed. Please try again.');
      setTimeout(() => setScanning(true), 1500);
    } finally {
      setLoading(false);
    }
  }

  function handleDone() {
    setSuccessVisible(false);
    setResult(null);
    setError('');
    setScanning(true);
  }

  // ── Permission states ──────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.permissionText}>Requesting camera access…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centeredScreen}>
        <Ionicons name="camera-off-outline" size={48} color="rgba(255,255,255,0.5)" />
        <Text style={styles.permissionText}>Camera access is required.</Text>
        <Text style={styles.permissionSub}>Tap below to grant camera permission.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.grantBtn}>
          <Text style={styles.grantBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Unmount camera when tab is not focused — clean way to stop the feed
  if (!isFocused) {
    return <View style={styles.screen} />;
  }

  // ── My QR mode ─────────────────────────────────────────────────────────────
  if (activeMode === 'myqr') {
    return (
      <View style={styles.screen}>
        <MyQRPanel profile={profile} loading={profileLoading} />
        <ModeSwitcher activeMode={activeMode} onSwitch={setActiveMode} />
      </View>
    );
  }

  // ── Scan mode ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>

      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={flashOn}
        onBarcodeScanned={scanning && !loading && !successVisible ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {!successVisible && (
        <View style={styles.overlay} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.flashBtn}
            onPress={() => setFlashOn(!flashOn)}
            activeOpacity={0.7}
          >
            <Ionicons name={flashOn ? 'flash' : 'flash-off'} size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.scanArea} pointerEvents="none">
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.instruction}>Align QR code within the frame</Text>
            <Text style={styles.subInstruction}>Scan a bin's QR code to earn ECO</Text>
            {loading && <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />}
          </View>

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

      {/* Mode switcher — sits above scan overlay so it's always tappable */}
      {!successVisible && (
        <ModeSwitcher activeMode={activeMode} onSwitch={setActiveMode} />
      )}

      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
            <Text style={styles.modalTitle}>Bin Reported!</Text>
            <Text style={styles.modalSubtitle}>
              <Text style={{ fontWeight: typography.weight.bold, color: colors.textPrimary }}>
                {result?.bin?.name}
              </Text>
              {result?.bin?.street ? ` on ${result.bin.street}` : ''} has been reported.
            </Text>
            <View style={styles.ecoPreviewBox}>
              <Ionicons name="diamond" size={18} color={colors.primary} />
              <Text style={styles.ecoPreviewText}>
                You'll earn{' '}
                <Text style={{ fontWeight: typography.weight.bold, color: colors.primary }}>
                  +{result?.bin?.eco_reward ?? '?'} ECO
                </Text>
                {' '}when the collector picks this up.
              </Text>
            </View>
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: '#000' },
  camera:         { position: 'absolute', top: 0, left: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  centeredScreen: { flex: 1, backgroundColor: colors.cameraBg, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  permissionText: { color: '#fff', fontSize: typography.size.base, fontWeight: typography.weight.semibold, textAlign: 'center' },
  permissionSub:  { color: 'rgba(255,255,255,0.55)', fontSize: typography.size.sm, textAlign: 'center', lineHeight: 20 },
  grantBtn:       { marginTop: 16, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  grantBtnText:   { color: '#fff', fontWeight: '600' },

  overlay:  { position: 'absolute', top: 0, left: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, paddingTop: 56, paddingBottom: 110 },
  flashBtn: { alignSelf: 'flex-end', marginRight: 20, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 9999 },

  scanArea:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  viewfinder:  { width: 240, height: 240 },
  corner:      { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#fff' },
  cornerTL:    { top: 0,    left: 0,   borderTopWidth: CORNER_WIDTH,    borderLeftWidth:  CORNER_WIDTH },
  cornerTR:    { top: 0,    right: 0,  borderTopWidth: CORNER_WIDTH,    borderRightWidth: CORNER_WIDTH },
  cornerBL:    { bottom: 0, left: 0,   borderBottomWidth: CORNER_WIDTH, borderLeftWidth:  CORNER_WIDTH },
  cornerBR:    { bottom: 0, right: 0,  borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },

  instruction:    { color: '#fff', fontSize: typography.size.base, fontWeight: typography.weight.semibold, textAlign: 'center' },
  subInstruction: { color: 'rgba(255,255,255,0.65)', fontSize: typography.size.sm, textAlign: 'center', paddingHorizontal: 40 },

  errorBanner:     { marginHorizontal: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(220,38,38,0.9)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  errorBannerText: { flex: 1, color: '#fff', fontSize: typography.size.sm },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard:      { backgroundColor: colors.secondary, borderRadius: 18, padding: 28, width: '100%', alignItems: 'center', gap: 14 },
  modalTitle:     { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary },
  modalSubtitle:  { fontSize: typography.size.base, color: colors.textSecondary, textAlign: 'center' },
  ecoPreviewBox:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.successLight, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.successBorder, width: '100%' },
  ecoPreviewText: { flex: 1, fontSize: typography.size.sm, color: colors.textPrimary, lineHeight: 20 },
  doneBtn:        { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, width: '100%', alignItems: 'center' },
  doneBtnText:    { color: colors.secondary, fontWeight: typography.weight.bold, fontSize: typography.size.base },
});
