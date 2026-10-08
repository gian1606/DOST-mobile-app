import { useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { typography } from '../../theme/typography';
import { analyzePhoto } from '../../services/rekognition';
import { api } from '../../api';

const C = { primary: '#0D7A5F' };
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

// Status values:
// 'idle'            — live camera viewfinder
// 'preview'         — photo captured, awaiting Analyze tap
// 'analyzing'       — analyzePhoto() in flight
// 'result_not_full' — verdict "not full" → bin is empty, confirming collection
// 'result_full'     — verdict "full" → bin wasn't emptied, show warning + Retake only
// 'error'           — analyzePhoto() threw, showing error banner
//
// Collector logic: navigate forward on "not full" (bin is empty after collection).
// "full" verdict means the bin wasn't emptied — show a warning and require Retake.
// No "Confirm Anyway" — the collector must actually empty the bin first.

export default function BinPhotoScreen({ navigation, route }) {
  const { binId } = route.params;

  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [status,   setStatus]   = useState('idle');
  const [photoUri, setPhotoUri] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [is503,    setIs503]    = useState(false);

  // ─── Permission screens ───────────────────────────────────────────────────

  if (!permission) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator color={C.primary} />
        <Text style={styles.permissionText}>Requesting camera access…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centeredScreen}>
        <Ionicons name="camera-off-outline" size={48} color="rgba(255,255,255,0.5)" />
        <Text style={styles.permissionText}>Camera access is required to photograph the bin.</Text>
        <Text style={styles.permissionSub}>
          Tap below to grant permission. If previously denied, open your device Settings to enable it.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.grantBtn}>
          <Text style={styles.grantBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async function handleCapture() {
    if (!cameraRef.current || status !== 'idle') return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      setPhotoUri(photo.uri);
      setStatus('preview');
    } catch (err) {
      setErrorMsg(err.message || 'Could not capture photo. Please try again.');
      setIs503(false);
      setStatus('error');
    }
  }

  async function handleAnalyze() {
    if (status === 'analyzing') return;
    setStatus('analyzing');
    setErrorMsg('');
    setIs503(false);

    try {
      const { verdict, s3_key } = await analyzePhoto(photoUri);

      if (verdict === 'not full') {
        // Bin is empty — confirm the collection
        setStatus('result_not_full');
        try {
          const apiResponse = await api.post('/bins/collection-confirm', { qr_payload: binId });
          navigation.replace('CollectionConfirmed', {
            result: { ...apiResponse, verdict: 'not full', s3_key, photoUri },
          });
        } catch (confirmErr) {
          setErrorMsg(confirmErr.message || 'Could not record collection. Please try again.');
          setIs503(false);
          setStatus('error');
        }
      } else {
        // 'full' — bin wasn't emptied yet, block and warn
        setStatus('result_full');
      }
    } catch (err) {
      const msg = err.message || '';
      const serviceDown = msg.toLowerCase().includes('unavailable') ||
                          msg.toLowerCase().includes('503') ||
                          msg.toLowerCase().includes('offline');
      setIs503(serviceDown);
      setErrorMsg(msg || 'Analysis failed. Please try again.');
      setStatus('error');
    }
  }

  function handleRetake() {
    setPhotoUri(null);
    setErrorMsg('');
    setIs503(false);
    setStatus('idle');
  }

  function handleRetry() {
    handleAnalyze();
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  const isAnalyzing = status === 'analyzing' || status === 'result_not_full';

  function renderBottomControls() {
    switch (status) {
      case 'idle':
        return (
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.captureButton} onPress={handleCapture} activeOpacity={0.85}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        );

      case 'preview':
        return (
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleRetake} activeOpacity={0.75}>
              <Ionicons name="camera-outline" size={18} color="#fff" />
              <Text style={styles.secondaryBtnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, isAnalyzing && styles.btnDisabled]}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Analyze</Text>
            </TouchableOpacity>
          </View>
        );

      case 'analyzing':
      case 'result_not_full':
        return (
          <View style={styles.bottomControls}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.analyzingText}>Analyzing photo…</Text>
          </View>
        );

      case 'result_full':
        // Bin still full — collector must empty it first, no override
        return (
          <>
            <View style={styles.stillFullBanner}>
              <Ionicons name="warning-outline" size={20} color="#fff" />
              <Text style={styles.stillFullBannerText}>
                Bin still appears full. Please empty it before confirming.
              </Text>
            </View>
            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleRetake} activeOpacity={0.85}>
                <Ionicons name="camera-outline" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>  Retake</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'error': {
        const displayMsg = is503
          ? 'Analysis service is currently unavailable. Please try again later.'
          : (errorMsg || 'Analysis failed. Please try again.');
        return (
          <>
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText} numberOfLines={3}>{displayMsg}</Text>
            </View>
            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleRetake} activeOpacity={0.75}>
                <Ionicons name="camera-outline" size={18} color="#fff" />
                <Text style={styles.secondaryBtnText}>Retake</Text>
              </TouchableOpacity>
              {photoUri && (
                <TouchableOpacity style={styles.primaryBtn} onPress={handleRetry} activeOpacity={0.75}>
                  <Text style={styles.primaryBtnText}>Retry</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        );
      }

      default:
        return null;
    }
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  const showCamera  = status === 'idle';
  const showPreview = status !== 'idle' && photoUri;

  return (
    <View style={styles.screen}>

      {showCamera && (
        <CameraView style={styles.camera} facing="back" ref={cameraRef} />
      )}
      {showPreview && (
        <Image source={{ uri: photoUri }} style={styles.camera} resizeMode="cover" />
      )}

      <View style={styles.overlay} pointerEvents="box-none">

        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            disabled={isAnalyzing}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.binLabel}>
            <Text style={styles.binLabelText} numberOfLines={1}>
              Bin {typeof binId === 'string' ? binId.slice(0, 12) : binId}
            </Text>
          </View>
          <View style={styles.iconBtn} />
        </View>

        {status === 'idle' && (
          <View style={styles.instructionRow} pointerEvents="none">
            <Text style={styles.instruction}>Photo the bin after emptying it</Text>
            <Text style={styles.subInstruction}>AI will verify the bin is empty before confirming</Text>
          </View>
        )}

        <View style={styles.controlsArea}>
          {renderBottomControls()}
        </View>

      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  camera: { position: 'absolute', top: 0, left: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  overlay: {
    position: 'absolute', top: 0, left: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT,
    paddingTop: 56, paddingBottom: 40, backgroundColor: 'rgba(0,0,0,0.25)',
  },
  centeredScreen: { flex: 1, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  permissionText: { color: '#fff', fontSize: typography.size.base, fontWeight: '600', textAlign: 'center' },
  permissionSub:  { color: 'rgba(255,255,255,0.55)', fontSize: typography.size.sm, textAlign: 'center', lineHeight: 20 },
  grantBtn:       { marginTop: 16, backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  grantBtnText:   { color: '#fff', fontWeight: '600' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  iconBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 9999, width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },
  binLabel: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 6 },
  binLabelText: { color: '#fff', fontSize: typography.size.sm, fontWeight: '600' },
  instructionRow: { alignItems: 'center', gap: 4, paddingHorizontal: 32 },
  instruction:    { color: '#fff', fontSize: typography.size.base, fontWeight: '600', textAlign: 'center' },
  subInstruction: { color: 'rgba(255,255,255,0.65)', fontSize: typography.size.sm, textAlign: 'center' },
  controlsArea: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 40, gap: 12 },
  bottomControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, paddingVertical: 8 },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  captureButtonInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },
  analyzingText: { color: 'rgba(255,255,255,0.75)', fontSize: typography.size.sm, marginTop: 8, textAlign: 'center' },
  primaryBtn: { flex: 1, backgroundColor: C.primary, borderRadius: 9999, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  primaryBtnText: { color: '#fff', fontSize: typography.size.base, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 18 },
  secondaryBtnText: { color: '#fff', fontSize: typography.size.base, fontWeight: '600' },
  stillFullBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(220,38,38,0.9)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 4 },
  stillFullBannerText: { flex: 1, color: '#fff', fontSize: typography.size.sm, fontWeight: '600', lineHeight: 20 },
  errorBanner: { backgroundColor: 'rgba(220,38,38,0.9)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 4 },
  errorBannerText: { color: '#fff', fontSize: typography.size.sm, lineHeight: 20 },
});
