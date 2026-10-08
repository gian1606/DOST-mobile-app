import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, AppState, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

const CORNER_SIZE  = 22;
const CORNER_WIDTH = 3;

export default function QRScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn]           = useState(false);
  const [scanning, setScanning]         = useState(true);

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

  function handleBarCodeScanned({ data }) {
    if (!scanning) return;
    setScanning(false);
    // Navigate to BinPhotoScreen — resident takes a photo for AI verification
    // before the scan-report API call is made.
    navigation.replace('ResidentBinPhoto', { binId: data });
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
        enableTorch={flashOn}
        onCameraReady={() => console.log('[CAMERA] Ready')}
        onMountError={(e) => console.log('[CAMERA] Mount error:', e.message)}
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

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
          </View>

        </View>

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
});
