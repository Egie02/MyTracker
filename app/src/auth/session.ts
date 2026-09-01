import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'money_tracker_session';
const LAST_USERNAME_KEY = 'money_tracker_last_username';

/** Session validity in milliseconds (30 days). */
const SESSION_VALID_MS = 30 * 24 * 60 * 60 * 1000;

export interface Session {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  issuedAt: string;
  expiresAt?: string;
}

export async function getSession(): Promise<Session | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function setSession(session: Session): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function getLastUsername(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(LAST_USERNAME_KEY);
  } catch {
    return null;
  }
}

export async function setLastUsername(username: string): Promise<void> {
  await SecureStore.setItemAsync(LAST_USERNAME_KEY, username.trim());
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
