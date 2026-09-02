import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  ImageBackground, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../theme/typography';

// Mock credentials
const MOCK_CREDENTIALS = {
  'resident@besmart.ph':  { password: 'resident123',  role: 'resident'  },
  'mrf@besmart.ph':       { password: 'mrf123',        role: 'mrf'       },
  'buyer@besmart.ph':     { password: 'buyer123',      role: 'buyer'     },
  'collector@besmart.ph': { password: 'collector123',  role: 'collector' },
};

/* ── Floating-label input ──────────────────────────────────────────────── */
function FloatingInput({ label, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, rightSlot }) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  function onFocus() {
    setFocused(true);
    Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: false }).start();
  }

  function onBlur() {
    setFocused(false);
    if (!value) {
      Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: false }).start();
    }
  }

  // Label slides from vertically-centered → top of field
  const labelTop  = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 6] });
  const labelSize = anim.interpolate({ inputRange: [0, 1], outputRange: [15, 10] });
  const labelColor = focused ? '#86EFAC' : 'rgba(255,255,255,0.50)';

  return (
    <View style={[styles.inputBox, focused && styles.inputBoxFocused]}>
      {/* Floating label */}
      <Animated.Text
        style={[
          styles.floatingLabel,
          { top: labelTop, fontSize: labelSize, color: labelColor },
        ]}
        pointerEvents="none"
      >
        {label}
      </Animated.Text>

      {/* Actual input — padding shifts down to leave room for the label */}
      <TextInput
        style={[styles.textInput, { paddingTop: 20, paddingBottom: 6 }]}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'none'}
        placeholderTextColor="transparent"
        placeholder=""
      />

      {rightSlot && <View style={styles.rightSlot}>{rightSlot}</View>}
    </View>
  );
}

/* ── Register link — changes colour on press ───────────────────────────── */
function RegisterLink({ onPress }) {
  const [pressed, setPressed] = useState(false);
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={1}
    >
      <Text style={styles.registerText}>
        Don't have an account?{' '}
        <Text style={[styles.registerBold, pressed && styles.registerBoldActive]}>
          Register
        </Text>
      </Text>
    </TouchableOpacity>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function LoginScreen({ navigation, setIsAuthenticated }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');

  function handleLogin() {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    const cred = MOCK_CREDENTIALS[email.trim().toLowerCase()];
    if (!cred || cred.password !== password) { setError('Invalid email or password.'); return; }
    setError('');
    setIsAuthenticated(true, cred.role);
  }

  return (
    <ImageBackground
      source={require('../assets/login-bg.png')}
      style={styles.bg}
      resizeMode="cover"
      blurRadius={Platform.OS === 'android' ? 4 : 10}
    >
      {/* Dark scrim */}
      <View style={styles.scrim} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Glassmorphism card ── */}
          <View style={styles.card}>
            {/* Top shine strip */}
            <View style={styles.shine} />

            {/* Logo */}
            <View style={styles.logoWrap}>
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

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email */}
            <FloatingInput
              label="Email Address"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <FloatingInput
              label="Password"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry={!showPass}
              rightSlot={
                <TouchableOpacity onPress={() => setShowPass((v) => !v)}>
                  <Ionicons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="rgba(255,255,255,0.55)"
                  />
                </TouchableOpacity>
              }
            />

            {/* Forgot */}
            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.82}>
              <Text style={styles.loginBtnText}>Log In</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register */}
            <RegisterLink onPress={() => navigation.navigate('Registration')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#111827' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
    zIndex: 0,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  /* Card */
  card: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(10,30,15,0.62)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    padding: 28,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 14,
  },
  shine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },

  /* Logo */
  logoWrap: { alignItems: 'center', gap: 8, paddingBottom: 4 },
  logo: { width: 88, height: 88 },
  wordmark: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: '#fff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: typography.size.xs,
    color: '#86EFAC',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: typography.weight.medium,
  },

  /* Error */
  errorBox: {
    backgroundColor: 'rgba(220,38,38,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.35)',
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: '#FCA5A5',
    textAlign: 'center',
  },

  /* Floating input */
  inputBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    minHeight: 58,
    justifyContent: 'center',
  },
  inputBoxFocused: {
    borderColor: '#2E7D32',
  },
  floatingLabel: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    pointerEvents: 'none',
  },
  textInput: {
    fontSize: typography.size.base,
    color: '#fff',
    paddingHorizontal: 14,
    paddingRight: 44,
  },
  rightSlot: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },

  /* Forgot */
  forgotWrap: { alignSelf: 'flex-end' },
  forgotText: {
    fontSize: typography.size.sm,
    color: '#86EFAC',
    fontWeight: typography.weight.medium,
  },

  /* Login button */
  loginBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.50,
    shadowRadius: 10,
    elevation: 5,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },

  /* Divider */
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  dividerText: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.40)' },

  /* Register */
  registerText: {
    fontSize: typography.size.sm,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  registerBold: {
    color: '#86EFAC',
    fontWeight: typography.weight.bold,
  },
  registerBoldActive: {
    color: '#4ADE80',
    textDecorationLine: 'underline',
  },
});
