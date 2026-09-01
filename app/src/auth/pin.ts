import * as SecureStore from 'expo-secure-store';
import { hashPassword, verifyPassword } from './password';

const PIN_HASH_KEY = 'money_tracker_pin_hash';
const PIN_USER_KEY = 'money_tracker_pin_user_id';

export const PIN_LENGTH = 4;
export const PIN_MAX_ATTEMPTS = 5;
export const PIN_LOCKOUT_MS = 60 * 1000;

let pinFailedCount = 0;
let pinLockoutUntil = 0;

export function resetPinAttemptState(): void {
  pinFailedCount = 0;
  pinLockoutUntil = 0;
}

export function getPinLockoutMessage(): string | null {
  const now = Date.now();
  if (now < pinLockoutUntil) {
    const secs = Math.ceil((pinLockoutUntil - now) / 1000);
    return `Too many attempts. Try again in ${secs} seconds.`;
  }
  return null;
}

export async function hasPinForUser(userId: string): Promise<boolean> {
  const storedUserId = await SecureStore.getItemAsync(PIN_USER_KEY);
  const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  return storedUserId === userId && !!hash;
}

export async function setPin(userId: string, pin: string): Promise<void> {
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be exactly 4 digits');
  const hash = await hashPassword(`pin:${pin}`);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
  await SecureStore.setItemAsync(PIN_USER_KEY, userId);
  resetPinAttemptState();
}

export async function verifyPin(pin: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const lockout = getPinLockoutMessage();
  if (lockout) return { ok: false, error: lockout };

  if (!/^\d{4}$/.test(pin)) return { ok: false, error: 'PIN must be 4 digits' };

  const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  if (!hash) return { ok: false, error: 'No PIN set' };

  const valid = await verifyPassword(`pin:${pin}`, hash);
  if (!valid) {
    pinFailedCount++;
    if (pinFailedCount >= PIN_MAX_ATTEMPTS) {
      pinLockoutUntil = Date.now() + PIN_LOCKOUT_MS;
    }
    return { ok: false, error: 'Incorrect PIN' };
  }

  resetPinAttemptState();
  return { ok: true };
}

export async function clearPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_HASH_KEY);
  await SecureStore.deleteItemAsync(PIN_USER_KEY);
  resetPinAttemptState();
}
