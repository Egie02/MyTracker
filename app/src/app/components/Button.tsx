import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { useThemedStyles } from '../useThemedStyles';
import type { AppTheme } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const createStyles = (t: AppTheme) => ({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: t.radius.md,
    alignItems: 'center' as const,
  },
  primary: { backgroundColor: t.colors.primary },
  secondary: {
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  danger: { backgroundColor: t.colors.danger },
  disabled: { opacity: 0.5 },
  text: { color: t.colors.primaryText, fontSize: 16, fontWeight: '600' as const },
  textSecondary: { color: t.colors.text, fontSize: 16, fontWeight: '600' as const },
});

export function Button({ title, onPress, variant = 'primary', style, textStyle, disabled }: Props) {
  const styles = useThemedStyles(createStyles);
  const v =
    variant === 'danger' ? styles.danger : variant === 'secondary' ? styles.secondary : styles.primary;
  const textColor = variant === 'secondary' ? styles.textSecondary : styles.text;

  return (
    <TouchableOpacity
      style={[styles.button, v, style, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text style={[textColor, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}
