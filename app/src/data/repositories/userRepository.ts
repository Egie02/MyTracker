import { getDb } from '../db/client';
import type { User } from '../../domain/models/entities';

export async function getUsers(): Promise<User[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<User>('SELECT * FROM users WHERE is_active = 1 ORDER BY username');
  return rows;
}

export async function getUsersIncludingInactive(): Promise<User[]> {
  const db = await getDb();
  return db.getAllAsync<User>('SELECT * FROM users ORDER BY username');
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<User>('SELECT * FROM users WHERE id = ?', id);
  return row ?? null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<User>('SELECT * FROM users WHERE username = ?', username);
  return row ?? null;
}

export async function countUsers(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM users');
  return row?.count ?? 0;
}

export async function insertUser(user: User): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO users (id, username, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    user.id,
    user.username,
    user.password_hash,
    user.role,
    user.is_active,
    user.created_at,
    user.updated_at
  );
}

export async function updateUser(user: User): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE users SET username = ?, password_hash = ?, role = ?, is_active = ?, updated_at = ? WHERE id = ?',
    user.username,
    user.password_hash,
    user.role,
    user.is_active,
    user.updated_at,
    user.id
  );
}
