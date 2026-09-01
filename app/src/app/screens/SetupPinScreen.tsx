import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PinPad } from '../components/PinPad';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';
import { getSession } from '../../auth/session';
import { setPin, PIN_LENGTH } from '../../auth/pin';
import {
  authenticateWithBiometric,
  getBiometricLabel,
  isBiometricHardwareAvailable,
  setBiometricEnabled,
} from '../../auth/biometric';
import type { AppTheme } from '../theme';

type Step = 'create' | 'confirm';

const createStyles = (t: AppTheme) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.bg,
    paddingHorizontal: t.spacing.lg,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: t.colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: t.spacing.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  title: { ...t.typography.headline, color: t.colors.text, marginBottom: t.spacing.sm },
  subtitle: {
    ...t.typography.caption,
    color: t.colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: t.spacing.xl,
    paddingHorizontal: t.spacing.lg,
  },
  skipBtn: { marginTop: t.spacing.xl, padding: t.spacing.md },
  skipText: { color: t.colors.textMuted, fontSize: 15 },
});

export function SetupPinScreen({
  onComplete,
  onSkip,
  allowSkip = false,
}: {
  onComplete: () => void;
  onSkip?: () => void;
  allowSkip?: boolean;
}) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [step, setStep] = useState<Step>('create');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const currentPin = step === 'create' ? firstPin : confirmPin;
  const setCurrentPin = step === 'create' ? setFirstPin : setConfirmPin;

  useEffect(() => {
    if (step === 'create' && firstPin.length === PIN_LENGTH) {
      setTimeout(() => setStep('confirm'), 200);
    }
  }, [firstPin, step]);

  useEffect(() => {
    if (step !== 'confirm' || confirmPin.length !== PIN_LENGTH) return;
    (async () => {
      if (confirmPin !== firstPin) {
        setError('PINs do not match. Try again.');
        setConfirmPin('');
        setFirstPin('');
        setStep('create');
        return;
      }
      setBusy(true);
      setError('');
      try {
        const session = await getSession();
        if (!session) throw new Error('No session');
        await setPin(session.userId, confirmPin);
        const bioAvail = await isBiometricHardwareAvailable();
        if (bioAvail) {
          const label = await getBiometricLabel();
          Alert.alert(
            `Enable ${label}?`,
            `Use ${label} to unlock MYTracker faster.`,
            [
              { text: 'Not now', style: 'cancel', onPress: onComplete },
              {
                text: 'Enable',
                onPress: async () => {
                  const ok = await authenticateWithBiometric(`Enable ${label}`);
                  if (ok) await setBiometricEnabled(session.userId, true);
                  onComplete();
                },
              },
            ]
          );
        } else {
          onComplete();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save PIN');
        setConfirmPin('');
        setFirstPin('');
        setStep('create');
      } finally {
        setBusy(false);
      }
    })();
  }, [confirmPin, firstPin, step, onComplete]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="shield-checkmark" size={40} color={theme.colors.primary} />
      </View>
      <Text style={styles.title}>{step === 'create' ? 'Create a PIN' : 'Confirm your PIN'}</Text>
      <Text style={styles.subtitle}>
        {step === 'create' ? 'Choose a 4-digit PIN for quick access' : 'Enter the same PIN again to confirm'}
      </Text>
      <PinPad pin={currentPin} onPinChange={setCurrentPin} error={error} title="" disabled={busy} />
      {allowSkip && onSkip ? (
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}
