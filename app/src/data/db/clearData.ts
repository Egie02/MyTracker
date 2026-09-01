import { getDb } from './client';
import { ensureDefaultAdmin } from './bootstrap';
import { clearPin } from '../../auth/pin';
import { clearBiometricSettings } from '../../auth/biometric';

/**
 * Deletes all data from app tables (transactions, accounts, categories, users, etc.)
 * and recreates the default admin user. Call clearSession() after this and redirect to login.
 */
export async function clearAllData(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM transaction_tags;
    DELETE FROM attachments;
    DELETE FROM transactions;
    DELETE FROM categories;
    DELETE FROM accounts;
    DELETE FROM tags;
    DELETE FROM users;
  `);
  await ensureDefaultAdmin();
  await clearPin();
  await clearBiometricSettings();
}
