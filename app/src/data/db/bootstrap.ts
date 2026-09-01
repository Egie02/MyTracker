import { getDb } from '../db/client';
import { insertUser } from '../repositories/userRepository';
import { hashPassword } from '../../auth/password';
import { generateId } from '../../utils/ids';
import { nowISO } from '../../utils/dates';
import type { User } from '../../domain/models/entities';

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

export async function ensureDefaultAdmin(): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM users');
  const n = row?.count ?? 0;
  if (n > 0) return;

  const id = generateId();
  const now = nowISO();
  const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  const admin: User = {
    id,
    username: DEFAULT_ADMIN_USERNAME,
    password_hash: passwordHash,
    role: 'admin',
    is_active: 1,
    created_at: now,
    updated_at: now,
  };
  await insertUser(admin);
}
