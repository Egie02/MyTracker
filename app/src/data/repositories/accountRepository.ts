import { getDb } from '../db/client';
import type { Account } from '../../domain/models/entities';

export async function getAccounts(includeArchived = false): Promise<Account[]> {
  const db = await getDb();
  const sql = includeArchived
    ? 'SELECT * FROM accounts ORDER BY name'
    : 'SELECT * FROM accounts WHERE is_archived = 0 ORDER BY name';
  return db.getAllAsync<Account>(sql);
}

export async function getAccountById(id: string): Promise<Account | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Account>('SELECT * FROM accounts WHERE id = ?', id);
  return row ?? null;
}

export async function getAccountBalance(accountId: string): Promise<number> {
  const db = await getDb();
  const account = await getAccountById(accountId);
  if (!account) return 0;
  const income = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE account_id = ? AND type = ?',
    accountId,
    'income'
  );
  const expense = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE account_id = ? AND type IN (?, ?)',
    accountId,
    'expense',
    'transfer'
  );
  return account.opening_balance + (income?.total ?? 0) - (expense?.total ?? 0);
}

export async function insertAccount(account: Account): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO accounts (id, name, type, currency, opening_balance, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    account.id,
    account.name,
    account.type,
    account.currency,
    account.opening_balance,
    account.is_archived,
    account.created_at,
    account.updated_at
  );
}

export async function updateAccount(account: Account): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE accounts SET name = ?, type = ?, currency = ?, opening_balance = ?, is_archived = ?, updated_at = ? WHERE id = ?',
    account.name,
    account.type,
    account.currency,
    account.opening_balance,
    account.is_archived,
    account.updated_at,
    account.id
  );
}

export async function archiveAccount(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE accounts SET is_archived = 1, updated_at = ? WHERE id = ?', new Date().toISOString(), id);
}
