import { getSession, setSession, type Session } from './session';
import { ensureDefaultAdmin } from '../data/db/bootstrap';
import { getUsers } from '../data/repositories/userRepository';

/** Ensures a single local user session exists (personal app — no password login). */
export async function ensurePersonalSession(): Promise<Session> {
  const existing = await getSession();
  if (existing) return existing;

  await ensureDefaultAdmin();
  const users = await getUsers();
  const user = users[0];
  if (!user) throw new Error('No local user available');

  const now = Date.now();
  const session: Session = {
    userId: user.id,
    username: user.username,
    role: user.role as 'admin' | 'user',
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  await setSession(session);
  return session;
}
