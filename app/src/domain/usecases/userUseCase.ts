import type { User } from '../models/entities';
import { verifyPassword } from '../../auth/password';
import { setSession, clearSession, setLastUsername } from '../../auth/session';
import { hashPassword } from '../../auth/password';
import {
  getUserByUsername,
  getUsersIncludingInactive,
  getUserById,
  insertUser,
  updateUser,
} from '../../data/repositories/userRepository';
import { generateId } from '../../utils/ids';
import { nowISO } from '../../utils/dates';

export interface LoginResult {
  success: true;
  userId: string;
  username: string;
  role: 'admin' | 'user';
}

export interface LoginFailure {
  success: false;
  error: string;
}

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 60 * 1000; // 1 minute
let loginFailedCount = 0;
let loginLockoutUntil = 0;

export async function login(username: string, password: string): Promise<LoginResult | LoginFailure> {
  const now = Date.now();
  if (now < loginLockoutUntil) {
    const secs = Math.ceil((loginLockoutUntil - now) / 1000);
    return { success: false, error: `Too many attempts. Try again in ${secs} seconds.` };
  }
  const trimmed = username.trim();
  if (!trimmed || !password) return { success: false, error: 'Username and password are required' };
  if (password.length < 4) return { success: false, error: 'Password must be at least 4 characters' };
  const user = await getUserByUsername(trimmed);
  if (!user) {
    loginFailedCount++;
    if (loginFailedCount >= LOGIN_MAX_ATTEMPTS) loginLockoutUntil = now + LOGIN_LOCKOUT_MS;
    return { success: false, error: 'Invalid username or password' };
  }
  if (user.is_active !== 1) return { success: false, error: 'Account is disabled' };
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    loginFailedCount++;
    if (loginFailedCount >= LOGIN_MAX_ATTEMPTS) loginLockoutUntil = now + LOGIN_LOCKOUT_MS;
    return { success: false, error: 'Invalid username or password' };
  }
  loginFailedCount = 0;
  loginLockoutUntil = 0;
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  await setSession({
    userId: user.id,
    username: user.username,
    role: user.role as 'admin' | 'user',
    issuedAt,
    expiresAt,
  });
  await setLastUsername(user.username);
  return { success: true, userId: user.id, username: user.username, role: user.role as 'admin' | 'user' };
}

export async function listUsers(): Promise<User[]> {
  return getUsersIncludingInactive();
}

export async function getUser(id: string): Promise<User | null> {
  return getUserById(id);
}

export async function createUser(data: {
  username: string;
  password: string;
  role: 'admin' | 'user';
}): Promise<void> {
  const existing = await getUserByUsername(data.username.trim());
  if (existing) throw new Error('Username already exists');
  const id = generateId();
  const now = nowISO();
  const passwordHash = await hashPassword(data.password);
  const user: User = {
    id,
    username: data.username.trim(),
    password_hash: passwordHash,
    role: data.role,
    is_active: 1,
    created_at: now,
    updated_at: now,
  };
  await insertUser(user);
}

export async function updateUserData(user: User): Promise<void> {
  const existing = await getUserById(user.id);
  if (!existing) throw new Error('User not found');
  await updateUser(user);
}

export async function disableUser(id: string): Promise<void> {
  const user = await getUserById(id);
  if (!user) throw new Error('User not found');
  await updateUser({ ...user, is_active: 0, updated_at: nowISO() });
}

export async function enableUser(id: string): Promise<void> {
  const user = await getUserById(id);
  if (!user) throw new Error('User not found');
  await updateUser({ ...user, is_active: 1, updated_at: nowISO() });
}

export async function resetPassword(id: string, newPassword: string): Promise<void> {
  const user = await getUserById(id);
  if (!user) throw new Error('User not found');
  const passwordHash = await hashPassword(newPassword);
  await updateUser({ ...user, password_hash: passwordHash, updated_at: nowISO() });
}

export { clearSession };
