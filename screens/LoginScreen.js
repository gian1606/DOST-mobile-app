import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const API_URL = 'http://10.0.2.2:3000/api'; // Android emulator → localhost
// For physical device, replace with your machine's local IP e.g. http://192.168.1.x:3000/api

// Mobile app roles only — web admin roles are not allowed on the mobile app
const MOBILE_ROLES = ['resident', 'mrf_worker', 'mrf_buyer', 'collector'];

// Map DB role values to the role keys used in App.js navigation
const ROLE_MAP = {
  mrf_worker: 'mrf',
  mrf_buyer:  'buyer',
};

export default function LoginScreen({ navigation, setIsAuthenticated }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      const { user, token } = data;

      // Block web-only roles from accessing the mobile app
      if (!MOBILE_ROLES.includes(user.role)) {
        setError('This account does not have access to the mobile app.');
        setLoading(false);
        return;
      }

      // Map role to the key App.js expects
      const appRole = ROLE_MAP[user.role] || user.role;

      setIsAuthenticated(true, appRole);

    } catch (err) {
      setError('Unable to connect to the server. Please check your connection.');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card */}
        <View style={styles.card}>

          {/* Logo + wordmark inside card */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/Batangas_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.wordmark}>BE-SMART</Text>
            <Text style={styles.tagline}>
              Batangas Environmental Segregation, Monitoring,{'\n'}Analytics &amp; Rewards Technology
            </Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotWrapper}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.loginBtnText}>
              {loading ? 'Signing in…' : 'Log In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
            <Text style={styles.registerLink}>
              Don't have an account?{' '}
              <Text style={styles.registerLinkBold}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoWrapper: { alignItems: 'center', gap: 8, paddingBottom: 4 },
  logo: { width: 88, height: 88 },
  wordmark: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary, letterSpacing: 2 },
  tagline: { fontSize: typography.size.xs, color: colors.primary, textAlign: 'center', lineHeight: 18, fontWeight: typography.weight.medium },
  card: { width: '100%', backgroundColor: colors.secondary, borderRadius: 18, padding: 24, gap: 14, borderWidth: 1, borderColor: colors.cardBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 4 },
  errorText: { fontSize: typography.size.sm, color: colors.error, backgroundColor: colors.errorLight, padding: 10, borderRadius: 8 },
  input: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 8, padding: 12, fontSize: typography.size.base, color: colors.textPrimary, backgroundColor: colors.background },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 8, paddingHorizontal: 12, backgroundColor: colors.background },
  passwordInput: { flex: 1, paddingVertical: 12, fontSize: typography.size.base, color: colors.textPrimary },
  forgotWrapper: { alignSelf: 'flex-end', marginTop: -6 },
  forgotText: { fontSize: typography.size.sm, color: colors.primary, fontWeight: typography.weight.medium },
  loginBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: colors.secondary, fontSize: typography.size.base, fontWeight: typography.weight.bold },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.cardBorder },
  dividerText: { fontSize: typography.size.sm, color: colors.textMuted },
  registerLink: { fontSize: typography.size.sm, color: colors.textSecondary, textAlign: 'center' },
  registerLinkBold: { color: colors.primary, fontWeight: typography.weight.bold },
});
