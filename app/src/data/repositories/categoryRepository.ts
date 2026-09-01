import { getDb } from '../db/client';
import type { Category } from '../../domain/models/entities';

export async function getCategories(kind?: 'expense' | 'income', includeArchived = false): Promise<Category[]> {
  const db = await getDb();
  let sql = 'SELECT * FROM categories WHERE 1=1';
  const params: (string | number)[] = [];
  if (kind) {
    sql += ' AND kind = ?';
    params.push(kind);
  }
  if (!includeArchived) {
    sql += ' AND is_archived = 0';
  }
  sql += ' ORDER BY kind, name';
  return params.length ? db.getAllAsync<Category>(sql, ...params) : db.getAllAsync<Category>(sql);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?', id);
  return row ?? null;
}

export async function insertCategory(category: Category): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO categories (id, name, kind, parent_id, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    category.id,
    category.name,
    category.kind,
    category.parent_id,
    category.is_archived,
    category.created_at,
    category.updated_at
  );
}

export async function updateCategory(category: Category): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE categories SET name = ?, kind = ?, parent_id = ?, is_archived = ?, updated_at = ? WHERE id = ?',
    category.name,
    category.kind,
    category.parent_id,
    category.is_archived,
    category.updated_at,
    category.id
  );
}

export async function archiveCategory(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE categories SET is_archived = 1, updated_at = ? WHERE id = ?', new Date().toISOString(), id);
}
