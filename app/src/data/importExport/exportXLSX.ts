import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { getDb } from '../db/client';
import { nowISO } from '../../utils/dates';

const FORMAT = 'money-tracker-xlsx';
const VERSION = 1;

export async function exportToXLSX(): Promise<string> {
  const db = await getDb();
  const [users, accounts, categories, transactions] = await Promise.all([
    db.getAllAsync('SELECT * FROM users'),
    db.getAllAsync('SELECT * FROM accounts'),
    db.getAllAsync('SELECT * FROM categories'),
    db.getAllAsync('SELECT * FROM transactions'),
  ]);

  const wb = XLSX.utils.book_new();
  const meta = [
    { key: 'format', value: FORMAT },
    { key: 'version', value: String(VERSION) },
    { key: 'exported_at', value: nowISO() },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meta), 'Meta');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(users as object[]), 'Users');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(accounts as object[]), 'Accounts');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categories as object[]), 'Categories');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactions as object[]), 'Transactions');

  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const filename = `money-tracker-export-${Date.now()}.xlsx`;
  const path = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, wbout, { encoding: FileSystem.EncodingType.Base64 });
  return path;
}

export async function shareExportedFile(filePath: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export MYTracker data',
    });
  }
}
