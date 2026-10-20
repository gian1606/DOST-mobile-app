import { useState, useRef } from 'react';
import { View, TextInput, Animated, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * Animated floating-label text input.
 * Used on the auth screens (Login, Registration).
 */
export default function FloatingInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightSlot,
}) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  function onFocus() {
    setFocused(true);
    Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: false }).start();
  }
  function onBlur() {
    setFocused(false);
    if (!value) Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  }

  const labelTop   = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 6] });
  const labelSize  = anim.interpolate({ inputRange: [0, 1], outputRange: [15, 10] });
  const labelColor = focused ? colors.accentLight : 'rgba(255,255,255,0.50)';

  return (
    <View style={[styles.inputBox, focused && styles.inputBoxFocused]}>
      <Animated.Text
        style={[styles.floatingLabel, { top: labelTop, fontSize: labelSize, color: labelColor }]}
        pointerEvents="none"
      >
        {label}
      </Animated.Text>
      <TextInput
        style={styles.textInput}
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

const styles = StyleSheet.create({
  inputBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    minHeight: 58,
    justifyContent: 'center',
  },
  inputBoxFocused: { borderColor: colors.primary },
  floatingLabel:   { position: 'absolute', left: 14, zIndex: 1 },
  textInput: {
    fontSize: typography.size.base,
    color: '#fff',
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 6,
    paddingRight: 44,
  },
  rightSlot: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
});
