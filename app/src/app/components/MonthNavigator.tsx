import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';

interface MonthNavigatorProps {
  label: string;
  subtitle?: string;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNavigator({ label, subtitle, onPrev, onNext }: MonthNavigatorProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles((t) => ({
    wrap: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    navBtn: {
      width: 40,
      height: 40,
      borderRadius: t.radius.sm,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.borderSubtle,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    center: { flex: 1, alignItems: 'center' as const, paddingHorizontal: t.spacing.sm },
    label: { color: t.colors.text, fontSize: 17, fontWeight: '700' as const },
    subtitle: { color: t.colors.textMuted, fontSize: 12, marginTop: 2 },
  }));

  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={onPrev} style={styles.navBtn} activeOpacity={0.75}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
      </TouchableOpacity>
      <View style={styles.center}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <TouchableOpacity onPress={onNext} style={styles.navBtn} activeOpacity={0.75}>
        <Ionicons name="chevron-forward" size={22} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );
}
