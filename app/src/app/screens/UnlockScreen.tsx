import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PinPad } from '../components/PinPad';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';
import { verifyPin, PIN_LENGTH } from '../../auth/pin';
import {
  authenticateWithBiometric,
  getBiometricLabel,
  isBiometricEnabledForUser,
  isBiometricHardwareAvailable,
} from '../../auth/biometric';
import { getSession } from '../../auth/session';
import type { AppTheme } from '../theme';

const createStyles = (t: AppTheme) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.bg,
    paddingHorizontal: t.spacing.lg,
    justifyContent: 'center' as const,
  },
  header: { alignItems: 'center' as const, marginBottom: t.spacing.xl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: t.colors.surface,
    borderWidth: 2,
    borderColor: t.colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: t.spacing.md,
  },
  title: { ...t.typography.headline, color: t.colors.text },
  subtitle: { ...t.typography.caption, color: t.colors.textSecondary, marginTop: t.spacing.sm },
});

export function UnlockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showBio, setShowBio] = useState(false);
  const [bioLabel, setBioLabel] = useState('Biometrics');
  const [busy, setBusy] = useState(false);

  async function tryBiometric() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (await authenticateWithBiometric('Unlock MYTracker')) onUnlocked();
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await getSession();
      if (!s || cancelled) return;
      const [bioAvail, bioEnabled, label] = await Promise.all([
        isBiometricHardwareAvailable(),
        isBiometricEnabledForUser(s.userId),
        getBiometricLabel(),
      ]);
      setBioLabel(label);
      setShowBio(bioAvail && bioEnabled);
      if (bioAvail && bioEnabled) {
        const ok = await authenticateWithBiometric('Unlock MYTracker');
        if (!cancelled && ok) onUnlocked();
      }
    })();
    return () => { cancelled = true; };
  }, [onUnlocked]);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    (async () => {
      setBusy(true);
      setError('');
      const result = await verifyPin(pin);
      if (result.ok) onUnlocked();
      else { setError(result.error); setPin(''); }
      setBusy(false);
    })();
  }, [pin, onUnlocked]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="wallet" size={32} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>MYTracker</Text>
        <Text style={styles.subtitle}>Enter your PIN to unlock</Text>
      </View>
      <PinPad
        pin={pin}
        onPinChange={setPin}
        error={error}
        title="Enter PIN"
        subtitle="Your data stays on this device"
        showBiometric={showBio}
        biometricLabel={bioLabel}
        onBiometric={tryBiometric}
        disabled={busy}
      />
    </SafeAreaView>
  );
}
