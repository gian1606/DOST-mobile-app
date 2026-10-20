import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/auth';
import FloatingInput from '../components/shared/FloatingInput';
import { ROUTES } from '../navigation/routes';

/* ── Register link — changes colour on press ───────────────────────────── */
function RegisterLink({ onPress }) {
  const [pressed, setPressed] = useState(false);
  return (
    <TouchableOpacity onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} activeOpacity={1}>
      <Text style={styles.registerText}>
        Don't have an account?{' '}
        <Text style={[styles.registerBold, pressed && styles.registerBoldActive]}>Register</Text>
      </Text>
    </TouchableOpacity>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    try {
      const { token, user, appRole } = await loginUser(email, password);
      login(token, user, appRole);
    } catch (err) {
      setError(err.message || 'Unable to connect to the server. Please check your connection.');
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

            <View style={styles.logoWrap}>
              <Image source={require('../assets/Batangas_logo.png')} style={styles.logo} resizeMode="contain" />
              <Text style={styles.wordmark}>BE-SMART</Text>
              <Text style={styles.tagline}>Batangas Environmental Segregation, Monitoring,{'\n'}Analytics &amp; Rewards Technology</Text>
            </View>

            {!!error && (
              <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
            )}

            <FloatingInput label="Email Address" value={email} onChangeText={(t) => { setEmail(t); setError(''); }} keyboardType="email-address" autoCapitalize="none" />

            <FloatingInput
              label="Password"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry={!showPass}
              rightSlot={
                <TouchableOpacity onPress={() => setShowPass((v) => !v)}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.55)" />
                </TouchableOpacity>
              }
            />

            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.loginBtn, loading && styles.loginBtnDisabled]} onPress={handleLogin} activeOpacity={0.82} disabled={loading}>
              <Text style={styles.loginBtnText}>{loading ? 'Signing in…' : 'Log In'}</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <RegisterLink onPress={() => navigation.navigate(ROUTES.REGISTRATION)} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg:    { flex: 1, backgroundColor: colors.authBg },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.52)', zIndex: 0 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  card: {
    width: '100%', borderRadius: 20, overflow: 'hidden',
    backgroundColor: 'rgba(10,30,15,0.62)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
    padding: 28, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.55, shadowRadius: 24, elevation: 14,
  },
  shine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.28)' },

  logoWrap: { alignItems: 'center', gap: 8, paddingBottom: 4 },
  logo: { width: 88, height: 88 },
  wordmark: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: '#fff', letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  tagline:  { fontSize: typography.size.xs, color: colors.accentLight, textAlign: 'center', lineHeight: 18, fontWeight: typography.weight.medium },

  errorBox: { backgroundColor: 'rgba(220,38,38,0.18)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.35)', borderRadius: 8, padding: 10 },
  errorText: { fontSize: typography.size.sm, color: '#FCA5A5', textAlign: 'center' },

  forgotWrap: { alignSelf: 'flex-end' },
  forgotText: { fontSize: typography.size.sm, color: colors.accentLight, fontWeight: typography.weight.medium },

  loginBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.50, shadowRadius: 10, elevation: 5 },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontSize: typography.size.base, fontWeight: typography.weight.bold },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  dividerText: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.40)' },

  registerText: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  registerBold: { color: colors.accentLight, fontWeight: typography.weight.bold },
  registerBoldActive: { color: '#4ADE80', textDecorationLine: 'underline' },
});
