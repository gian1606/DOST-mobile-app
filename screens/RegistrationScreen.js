import { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Modal, FlatList, ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { batangasBarangays } from '../mock/data';
import { registerUser } from '../services/auth';
import FloatingInput from '../components/shared/FloatingInput';
import { ROUTES } from '../navigation/routes';
import { REGISTERABLE_ROLES } from '../constants';

/* ── Barangay picker ───────────────────────────────────────────────────── */
function BarangayPicker({ value, onChange }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity style={[styles.inputBox, styles.pickerBox]} onPress={() => setVisible(true)} activeOpacity={0.7}>
        <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.50)" style={{ marginRight: 6 }} />
        <Text style={[styles.pickerText, !value && { color: 'rgba(255,255,255,0.40)' }]}>{value || 'Select Barangay'}</Text>
        <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.50)" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} onPress={() => setVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Barangay</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={batangasBarangays}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const sel = item === value;
                return (
                  <TouchableOpacity style={[styles.optionRow, sel && styles.optionRowSelected]} onPress={() => { onChange(item); setVisible(false); }} activeOpacity={0.7}>
                    <Ionicons name={sel ? 'location' : 'location-outline'} size={16} color={sel ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.optionText, sel && styles.optionTextSelected]}>{item}</Text>
                    {sel && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function RegistrationScreen({ navigation }) {
  const [role, setRole]               = useState('');
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [phone, setPhone]             = useState('');
  const [barangay, setBarangay]       = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  async function handleRegister() {
    if (!role)                                                { setError('Please select an account type.'); return; }
    if (!name || !email || !phone || !barangay || !password) { setError('Please fill in all fields.'); return; }
    if (password !== confirm)                                 { setError('Passwords do not match.'); return; }
    if (password.length < 8)                                  { setError('Password must be at least 8 characters.'); return; }

    setError('');
    setLoading(true);

    try {
      const data = await registerUser({ name, email, phone, barangay, password, role });
      navigation.navigate(ROUTES.OTP, { role: data.appRole, token: data.token, user: data.user });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground
      source={require('../assets/login-bg.png')}
      style={styles.bg}
      resizeMode="cover"
      blurRadius={Platform.OS === 'android' ? 4 : 10}
    >
      <View style={styles.scrim} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.card}>
            <View style={styles.shine} />

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the BE-SMART community</Text>

            {!!error && (
              <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
            )}

            <Text style={styles.fieldLabel}>Account Type</Text>
            <View style={styles.roleRow}>
              {REGISTERABLE_ROLES.map((r) => {
                const sel = role === r.key;
                return (
                  <TouchableOpacity key={r.key} style={[styles.roleCard, sel && styles.roleCardSelected]} onPress={() => setRole(r.key)} activeOpacity={0.7}>
                    <View style={[styles.roleIconWrap, sel && styles.roleIconWrapSelected]}>
                      <Ionicons name={r.icon} size={22} color={sel ? '#fff' : 'rgba(255,255,255,0.55)'} />
                    </View>
                    <Text style={[styles.roleLabel, sel && styles.roleLabelSelected]}>{r.label}</Text>
                    <Text style={[styles.roleDesc,  sel && styles.roleDescSelected]}>{r.description}</Text>
                    {sel && <View style={styles.roleCheck}><Ionicons name="checkmark-circle" size={18} color={colors.accentLight} /></View>}
                  </TouchableOpacity>
                );
              })}
            </View>

            <FloatingInput label="Full Name"    value={name}  onChangeText={setName}  autoCapitalize="words" />
            <FloatingInput label="Email"        value={email} onChangeText={setEmail} keyboardType="email-address" />
            <FloatingInput label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <BarangayPicker value={barangay} onChange={setBarangay} />

            <FloatingInput label="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPass}
              rightSlot={<TouchableOpacity onPress={() => setShowPass((v) => !v)}><Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.55)" /></TouchableOpacity>}
            />
            <FloatingInput label="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry={!showConfirm}
              rightSlot={<TouchableOpacity onPress={() => setShowConfirm((v) => !v)}><Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.55)" /></TouchableOpacity>}
            />

            <TouchableOpacity style={[styles.createBtn, loading && { opacity: 0.7 }]} onPress={handleRegister} activeOpacity={0.82} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.createBtnText}>Create Account</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Already have an account? <Text style={styles.loginLinkBold}>Log In</Text></Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg:    { flex: 1, backgroundColor: colors.authBg },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.52)', zIndex: 0 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingVertical: 36 },

  card: {
    width: '100%', borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(10,30,15,0.62)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
    padding: 28, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.55, shadowRadius: 24, elevation: 14,
  },
  shine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.28)' },

  title:    { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: '#fff', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  subtitle: { fontSize: typography.size.sm, color: colors.accentLight, marginTop: -8 },

  errorBox:  { backgroundColor: 'rgba(220,38,38,0.18)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.35)', borderRadius: 8, padding: 10 },
  errorText: { fontSize: typography.size.sm, color: '#FCA5A5', textAlign: 'center' },

  fieldLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: 'rgba(255,255,255,0.65)', marginBottom: -6 },
  roleRow:  { flexDirection: 'row', gap: 10 },
  roleCard: { flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: 14, alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', position: 'relative' },
  roleCardSelected: { borderColor: colors.primary, backgroundColor: 'rgba(46,125,50,0.25)' },
  roleIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  roleIconWrapSelected: { backgroundColor: colors.primary },
  roleLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: '#fff' },
  roleLabelSelected: { color: colors.accentLight },
  roleDesc:  { fontSize: typography.size.xs, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  roleDescSelected: { color: 'rgba(255,255,255,0.70)' },
  roleCheck: { position: 'absolute', top: 8, right: 8 },

  inputBox: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', minHeight: 58, justifyContent: 'center' },
  inputBoxFocused: { borderColor: colors.primary },
  floatingLabel: { position: 'absolute', left: 14, zIndex: 1 },
  textInput: { fontSize: typography.size.base, color: '#fff', paddingHorizontal: 14, paddingTop: 20, paddingBottom: 6, paddingRight: 44 },
  rightSlot: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },

  pickerBox:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, minHeight: 52 },
  pickerText: { flex: 1, fontSize: typography.size.base, color: '#fff' },

  sheetOverlay:  { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: '#1a2e1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 20, maxHeight: '70%', borderTopWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sheetTitle:  { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: '#fff' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  optionRowSelected: { backgroundColor: 'rgba(46,125,50,0.25)', borderRadius: 8, paddingHorizontal: 8, borderBottomWidth: 0, marginBottom: 1 },
  optionText: { flex: 1, fontSize: typography.size.base, color: 'rgba(255,255,255,0.85)' },
  optionTextSelected: { color: colors.accentLight, fontWeight: typography.weight.semibold },

  createBtn:     { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.50, shadowRadius: 10, elevation: 5 },
  createBtnText: { color: '#fff', fontSize: typography.size.base, fontWeight: typography.weight.bold },

  loginLink:     { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  loginLinkBold: { color: colors.accentLight, fontWeight: typography.weight.bold },
});
