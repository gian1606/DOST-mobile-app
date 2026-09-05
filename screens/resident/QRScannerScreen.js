import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Modal, ActivityIndicator, AppState, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { api } from '../../api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

const CORNER_SIZE  = 22;
const CORNER_WIDTH = 3;

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn]           = useState(false);
  const [scanning, setScanning]         = useState(true);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [result, setResult]             = useState(null);
  const [successVisible, setSuccessVisible] = useState(false);

  const isFocused = useIsFocused();
  const appState  = useRef(AppState.currentState);

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
      const response = await api.post('/bins/scan-report', { qr_payload: data });
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

  return (
    <View style={styles.screen}>

      <CameraView
        style={styles.camera}
        facing="back"
        flash={flashOn ? 'torch' : undefined}
        onCameraReady={() => console.log('[CAMERA] Ready')}
        onMountError={(e) => console.log('[CAMERA] Mount error:', e.message)}
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
  centeredScreen: { flex: 1, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  permissionText: { color: '#fff', fontSize: typography.size.base, fontWeight: typography.weight.semibold, textAlign: 'center' },
  permissionSub:  { color: 'rgba(255,255,255,0.55)', fontSize: typography.size.sm, textAlign: 'center', lineHeight: 20 },
  grantBtn:       { marginTop: 16, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  grantBtnText:   { color: '#fff', fontWeight: '600' },

  overlay:  { position: 'absolute', top: 0, left: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, paddingTop: 56, paddingBottom: 16 },
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
  ecoPreviewBox:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.successLight, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#A5D6A7', width: '100%' },
  ecoPreviewText: { flex: 1, fontSize: typography.size.sm, color: colors.textPrimary, lineHeight: 20 },
  doneBtn:        { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, width: '100%', alignItems: 'center' },
  doneBtnText:    { color: colors.secondary, fontWeight: typography.weight.bold, fontSize: typography.size.base },
});
