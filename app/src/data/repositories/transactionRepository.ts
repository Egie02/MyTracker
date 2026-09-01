import { getDb } from '../db/client';
import type { Transaction } from '../../domain/models/entities';

export interface TransactionWithDetails extends Transaction {
  account_name?: string;
  category_name?: string;
}

export async function getTransactions(options: {
  fromDate?: string;
  toDate?: string;
  accountId?: string;
  categoryId?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<TransactionWithDetails[]> {
  const db = await getDb();
  let sql = `
    SELECT t.*, a.name as account_name, c.name as category_name
    FROM transactions t
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  if (options.fromDate) {
    sql += ' AND t.date >= ?';
    params.push(options.fromDate);
  }
  if (options.toDate) {
    sql += ' AND t.date <= ?';
    params.push(options.toDate);
  }
  if (options.accountId) {
    sql += ' AND t.account_id = ?';
    params.push(options.accountId);
  }
  if (options.categoryId) {
    sql += ' AND t.category_id = ?';
    params.push(options.categoryId);
  }
  if (options.type) {
    sql += ' AND t.type = ?';
    params.push(options.type);
  }
  sql += ' ORDER BY t.date DESC, t.created_at DESC';
  if (options.limit != null) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }
  if (options.offset != null) {
    sql += ' OFFSET ?';
    params.push(options.offset);
  }
  return params.length ? db.getAllAsync<TransactionWithDetails>(sql, ...params) : db.getAllAsync<TransactionWithDetails>(sql);
}

export async function getTransactionById(id: string): Promise<TransactionWithDetails | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<TransactionWithDetails>(
    `SELECT t.*, a.name as account_name, c.name as category_name
     FROM transactions t
     LEFT JOIN accounts a ON t.account_id = a.id
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.id = ?`,
    id
  );
  return row ?? null;
}

export async function getTransactionsByTransferGroup(transferGroupId: string): Promise<Transaction[]> {
  const db = await getDb();
  return db.getAllAsync<Transaction>('SELECT * FROM transactions WHERE transfer_group_id = ? ORDER BY type', transferGroupId);
}

export async function insertTransaction(tx: Transaction): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO transactions (id, type, date, amount, account_id, category_id, note, transfer_group_id, created_by_user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    tx.id,
    tx.type,
    tx.date,
    tx.amount,
    tx.account_id,
    tx.category_id,
    tx.note,
    tx.transfer_group_id,
    tx.created_by_user_id,
    tx.created_at,
    tx.updated_at
  );
}

export async function updateTransaction(tx: Transaction): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE transactions SET type = ?, date = ?, amount = ?, account_id = ?, category_id = ?, note = ?, updated_at = ? WHERE id = ?`,
    tx.type,
    tx.date,
    tx.amount,
    tx.account_id,
    tx.category_id,
    tx.note,
    tx.updated_at,
    tx.id
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

export async function deleteTransferGroup(transferGroupId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions WHERE transfer_group_id = ?', transferGroupId);
}

export async function getSumByTypeAndDateRange(
  accountId: string | null,
  fromDate: string,
  toDate: string
): Promise<{ income: number; expense: number }> {
  const db = await getDb();
  const whereAccount = accountId ? ' AND account_id = ?' : '';
  const params = accountId ? [fromDate, toDate, accountId] : [fromDate, toDate];
  const [incomeRow, expenseRow] = await Promise.all([
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE date >= ? AND date <= ?${whereAccount} AND type = 'income'`,
      ...params
    ),
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE date >= ? AND date <= ?${whereAccount} AND type IN ('expense', 'transfer')`,
      ...params
    ),
  ]);
  return {
    income: incomeRow?.total ?? 0,
    expense: expenseRow?.total ?? 0,
  };
}

export async function getTopCategoriesByExpense(limit: number, fromDate: string, toDate: string): Promise<{ category_id: string; category_name: string; total: number }[]> {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT c.id as category_id, c.name as category_name, SUM(t.amount) as total
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
     GROUP BY t.category_id ORDER BY total DESC LIMIT ?`,
    fromDate,
    toDate,
    limit
  );
}

export async function getTransactionCountForRange(fromDate: string, toDate: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM transactions WHERE date >= ? AND date <= ?`,
    fromDate,
    toDate
  );
  return row?.count ?? 0;
}
