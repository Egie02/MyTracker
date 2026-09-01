import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const BIOMETRIC_ENABLED_KEY = 'money_tracker_biometric_enabled';
const BIOMETRIC_USER_KEY = 'money_tracker_biometric_user_id';

export async function isBiometricHardwareAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && enrolled;
}

export async function getBiometricLabel(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Fingerprint';
  }
  return 'Biometrics';
}

export async function isBiometricEnabledForUser(userId: string): Promise<boolean> {
  const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  const storedUserId = await SecureStore.getItemAsync(BIOMETRIC_USER_KEY);
  return enabled === '1' && storedUserId === userId;
}

export async function setBiometricEnabled(userId: string, enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, '1');
    await SecureStore.setItemAsync(BIOMETRIC_USER_KEY, userId);
  } else {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_USER_KEY);
  }
}

export async function authenticateWithBiometric(promptMessage?: string): Promise<boolean> {
  const available = await isBiometricHardwareAvailable();
  if (!available) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: promptMessage ?? 'Unlock MYTracker',
    cancelLabel: 'Use PIN',
    disableDeviceFallback: true,
    fallbackLabel: 'Use PIN',
  });

  return result.success;
}

export async function clearBiometricSettings(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_USER_KEY);
}
