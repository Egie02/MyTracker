import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';
import { PIN_LENGTH } from '../../auth/pin';
import type { AppTheme } from '../theme';

interface PinPadProps {
  pin: string;
  onPinChange: (pin: string) => void;
  error?: string;
  title?: string;
  subtitle?: string;
  showBiometric?: boolean;
  biometricLabel?: string;
  onBiometric?: () => void;
  disabled?: boolean;
}

const createStyles = (t: AppTheme) => ({
  wrap: { alignItems: 'center' as const, width: '100%' },
  title: { ...t.typography.headline, color: t.colors.text, marginBottom: t.spacing.sm },
  subtitle: {
    ...t.typography.caption,
    color: t.colors.textSecondary,
    marginBottom: t.spacing.lg,
    textAlign: 'center' as const,
  },
  dots: { flexDirection: 'row' as const, gap: t.spacing.md, marginBottom: t.spacing.sm },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: t.colors.pinDot,
    borderWidth: 2,
    borderColor: t.colors.border,
  },
  dotFilled: { backgroundColor: t.colors.pinDotFilled, borderColor: t.colors.primary },
  dotError: { borderColor: t.colors.danger, backgroundColor: t.colors.danger },
  error: { color: t.colors.danger, fontSize: 14, marginBottom: t.spacing.md, minHeight: 20 },
  errorSpacer: { minHeight: 36 },
  pad: { width: '100%', maxWidth: 300 },
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: t.spacing.md,
    marginBottom: t.spacing.md,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  keySpacer: { width: 72, height: 72 },
  keyText: { fontSize: 28, fontWeight: '500' as const, color: t.colors.text },
});

export function PinPad({
  pin,
  onPinChange,
  error,
  title = 'Enter PIN',
  subtitle,
  showBiometric = false,
  biometricLabel = 'Biometrics',
  onBiometric,
  disabled = false,
}: PinPadProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  function pressDigit(d: string) {
    if (disabled || pin.length >= PIN_LENGTH) return;
    onPinChange(pin + d);
  }

  function backspace() {
    if (disabled) return;
    onPinChange(pin.slice(0, -1));
  }

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [showBiometric ? 'bio' : '', '0', 'del'],
  ];

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < pin.length && styles.dotFilled, error ? styles.dotError : null]}
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : <View style={styles.errorSpacer} />}

      <View style={styles.pad}>
        {keys.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => {
              if (key === '') return <View key={ki} style={styles.keySpacer} />;
              if (key === 'bio') {
                return (
                  <TouchableOpacity
                    key={ki}
                    style={styles.key}
                    onPress={onBiometric}
                    disabled={disabled}
                    activeOpacity={0.7}
                    accessibilityLabel={biometricLabel}
                  >
                    <Ionicons name="finger-print" size={28} color={theme.colors.accent} />
                  </TouchableOpacity>
                );
              }
              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key={ki}
                    style={styles.key}
                    onPress={backspace}
                    disabled={disabled || pin.length === 0}
                    activeOpacity={0.7}
                    accessibilityLabel="Delete"
                  >
                    <Ionicons name="backspace-outline" size={26} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={ki}
                  style={styles.key}
                  onPress={() => pressDigit(key)}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
