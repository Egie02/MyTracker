import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { getDb } from '../db/client';
import { nowISO } from '../../utils/dates';
import { generateId } from '../../utils/ids';

const FORMAT = 'money-tracker-xlsx';
const VERSION = 1;

export interface ImportResult {
  success: boolean;
  message: string;
  errors?: string[];
}

export async function pickXLSXFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function importFromXLSX(fileUri: string): Promise<ImportResult> {
  try {
    const content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binary = atob(content);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const wb = XLSX.read(bytes.buffer, { type: 'array' });

    const metaSheet = wb.Sheets['Meta'];
    if (!metaSheet) return { success: false, message: 'Missing Meta sheet' };
    const metaRows = XLSX.utils.sheet_to_json<{ key: string; value: string }>(metaSheet);
    const format = metaRows.find((r) => r.key === 'format')?.value;
    const version = metaRows.find((r) => r.key === 'version')?.value;
    if (format !== FORMAT) return { success: false, message: `Invalid format: expected ${FORMAT}` };
    if (Number(version) !== VERSION) return { success: false, message: `Unsupported version: ${version}` };

    const db = await getDb();
    await db.execAsync('BEGIN TRANSACTION');
    try {
      const accountsSheet = wb.Sheets['Accounts'];
      if (accountsSheet) {
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(accountsSheet);
        for (const r of rows) {
          const id = String(r.id ?? generateId());
          const now = nowISO();
          await db.runAsync(
            `INSERT OR REPLACE INTO accounts (id, name, type, currency, opening_balance, is_archived, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            id,
            String(r.name ?? ''),
            r.type != null ? String(r.type) : null,
            r.currency != null ? String(r.currency) : null,
            Number(r.opening_balance ?? 0),
            Number(r.is_archived ?? 0),
            r.created_at != null ? String(r.created_at) : now,
            r.updated_at != null ? String(r.updated_at) : now
          );
        }
      }
      const categoriesSheet = wb.Sheets['Categories'];
      if (categoriesSheet) {
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(categoriesSheet);
        for (const r of rows) {
          const id = String(r.id ?? generateId());
          const now = nowISO();
          await db.runAsync(
            `INSERT OR REPLACE INTO categories (id, name, kind, parent_id, is_archived, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            id,
            String(r.name ?? ''),
            String(r.kind ?? 'expense'),
            r.parent_id != null && r.parent_id !== '' ? String(r.parent_id) : null,
            Number(r.is_archived ?? 0),
            r.created_at != null ? String(r.created_at) : now,
            r.updated_at != null ? String(r.updated_at) : now
          );
        }
      }
      const transactionsSheet = wb.Sheets['Transactions'];
      if (transactionsSheet) {
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(transactionsSheet);
        for (const r of rows) {
          const id = String(r.id ?? generateId());
          const now = nowISO();
          await db.runAsync(
            `INSERT OR REPLACE INTO transactions (id, type, date, amount, account_id, category_id, note, transfer_group_id, created_by_user_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            id,
            String(r.type ?? 'expense'),
            String(r.date ?? now),
            Number(r.amount ?? 0),
            String(r.account_id ?? ''),
            r.category_id != null && r.category_id !== '' ? String(r.category_id) : null,
            r.note != null ? String(r.note) : null,
            r.transfer_group_id != null && r.transfer_group_id !== '' ? String(r.transfer_group_id) : null,
            r.created_by_user_id != null && r.created_by_user_id !== '' ? String(r.created_by_user_id) : null,
            r.created_at != null ? String(r.created_at) : now,
            r.updated_at != null ? String(r.updated_at) : now
          );
        }
      }
      await db.execAsync('COMMIT');
      return { success: true, message: 'Import completed successfully.' };
    } catch (e) {
      await db.execAsync('ROLLBACK');
      throw e;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import failed';
    return { success: false, message };
  }
}
