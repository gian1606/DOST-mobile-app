import { useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { analyzePhoto } from '../../services/rekognition';
import { api } from '../../api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

// Status values:
// 'idle'           — live camera viewfinder
// 'preview'        — photo captured, awaiting Analyze tap
// 'analyzing'      — analyzePhoto() in flight
// 'result_full'    — verdict "full" → reporting the bin, navigating to ReportingConfirmed
// 'result_not_full'— verdict "not full" → bin isn't full yet, show warning + Report Anyway
// 'error'          — analyzePhoto() threw, showing error banner
//
// Resident logic: navigate forward on "full" (bin is full and needs collection).
// "not full" means the bin isn't ready — show a warning + "Report Anyway" override.

export default function ResidentBinPhotoScreen({ navigation, route }) {
  const { binId } = route.params;

  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [status,   setStatus]   = useState('idle');
  const [photoUri, setPhotoUri] = useState(null);
  const [s3KeyRef, setS3KeyRef] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [is503,    setIs503]    = useState(false);

  // ─── Permission screens ───────────────────────────────────────────────────

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
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
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
      setS3KeyRef(s3_key);

      if (verdict === 'full') {
        // Bin is full — submit the report
        setStatus('result_full');
        await submitReport(s3_key, photoUri);
      } else {
        // 'not full' — bin isn't ready yet
        setStatus('result_not_full');
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

  async function submitReport(s3Key, uri) {
    try {
      const apiResponse = await api.post('/bins/scan-report', { qr_payload: binId, s3_key: s3Key });
      navigation.replace('ReportingConfirmed', {
        result: apiResponse,
        binName:   apiResponse?.bin?.name   || `Bin ${String(binId).slice(0, 8)}`,
        binStreet: apiResponse?.bin?.street || '',
      });
    } catch (reportErr) {
      setErrorMsg(reportErr.message || 'Could not submit report. Please try again.');
      setIs503(false);
      setStatus('error');
    }
  }

  function handleRetake() {
    setPhotoUri(null);
    setS3KeyRef(null);
    setErrorMsg('');
    setIs503(false);
    setStatus('idle');
  }

  function handleRetry() {
    handleAnalyze();
  }

  async function handleReportAnyway() {
    // Resident override — report even when AI says not full
    setStatus('analyzing');
    await submitReport(s3KeyRef, photoUri);
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  const isAnalyzing = status === 'analyzing' || status === 'result_full';

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
      case 'result_full':
        return (
          <View style={styles.bottomControls}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.analyzingText}>Analyzing photo…</Text>
          </View>
        );

      case 'result_not_full':
        // Bin not yet full — warn but allow override
        return (
          <>
            <View style={styles.notFullBanner}>
              <Ionicons name="information-circle-outline" size={20} color="#fff" />
              <Text style={styles.notFullBannerText}>
                Bin doesn't appear full yet. Are you sure you want to report it?
              </Text>
            </View>
            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleRetake} activeOpacity={0.75}>
                <Ionicons name="camera-outline" size={18} color="#fff" />
                <Text style={styles.secondaryBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleReportAnyway} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Report Anyway</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'error': {
        const displayMsg = is503
          ? 'Analysis service is currently unavailable. You may report anyway.'
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
                <TouchableOpacity style={styles.outlineBtn} onPress={handleRetry} activeOpacity={0.75}>
                  <Text style={styles.outlineBtnText}>Retry</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.primaryBtn} onPress={handleReportAnyway} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Report Anyway</Text>
              </TouchableOpacity>
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
            <Text style={styles.instruction}>Take a photo of the bin</Text>
            <Text style={styles.subInstruction}>AI will verify it's full before reporting</Text>
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
  permissionText: { color: '#fff', fontSize: typography.size.base, fontWeight: typography.weight.semibold, textAlign: 'center' },
  permissionSub:  { color: 'rgba(255,255,255,0.55)', fontSize: typography.size.sm, textAlign: 'center', lineHeight: 20 },
  grantBtn:       { marginTop: 16, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  grantBtnText:   { color: '#fff', fontWeight: '600' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  iconBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 9999, width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },
  binLabel: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 6 },
  binLabelText: { color: '#fff', fontSize: typography.size.sm, fontWeight: '600' },
  instructionRow: { alignItems: 'center', gap: 4, paddingHorizontal: 32 },
  instruction:    { color: '#fff', fontSize: typography.size.base, fontWeight: typography.weight.semibold, textAlign: 'center' },
  subInstruction: { color: 'rgba(255,255,255,0.65)', fontSize: typography.size.sm, textAlign: 'center' },
  controlsArea: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 40, gap: 12 },
  bottomControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, paddingVertical: 8 },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  captureButtonInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },
  analyzingText: { color: 'rgba(255,255,255,0.75)', fontSize: typography.size.sm, marginTop: 8, textAlign: 'center' },
  primaryBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 9999, paddingVertical: 14, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  primaryBtnText: { color: '#fff', fontSize: typography.size.base, fontWeight: typography.weight.bold },
  btnDisabled: { opacity: 0.5 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 18 },
  secondaryBtnText: { color: '#fff', fontSize: typography.size.base, fontWeight: '600' },
  outlineBtn: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' },
  outlineBtnText: { color: '#fff', fontSize: typography.size.base, fontWeight: '600' },
  notFullBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(245,166,35,0.9)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 4 },
  notFullBannerText: { flex: 1, color: '#fff', fontSize: typography.size.sm, fontWeight: '600', lineHeight: 20 },
  errorBanner: { backgroundColor: 'rgba(220,38,38,0.9)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 4 },
  errorBannerText: { color: '#fff', fontSize: typography.size.sm, lineHeight: 20 },
});
