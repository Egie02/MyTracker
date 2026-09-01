import type { Account } from '../models/entities';
import {
  getAccounts,
  getAccountById,
  getAccountBalance,
  insertAccount,
  updateAccount,
  archiveAccount,
} from '../../data/repositories/accountRepository';

export async function listAccounts(includeArchived = false): Promise<Account[]> {
  return getAccounts(includeArchived);
}

export async function getAccount(id: string): Promise<Account | null> {
  return getAccountById(id);
}

export async function getBalance(accountId: string): Promise<number> {
  return getAccountBalance(accountId);
}

export async function createAccount(account: Account): Promise<void> {
  const existing = await getAccounts(true);
  const duplicate = existing.find((a) => a.name.toLowerCase() === account.name.toLowerCase());
  if (duplicate) throw new Error('An account with this name already exists');
  await insertAccount(account);
}

export async function updateAccountData(account: Account): Promise<void> {
  const existing = await getAccountById(account.id);
  if (!existing) throw new Error('Account not found');
  const all = await getAccounts(true);
  const duplicate = all.find(
    (a) => a.id !== account.id && a.name.toLowerCase() === account.name.toLowerCase()
  );
  if (duplicate) throw new Error('An account with this name already exists');
  await updateAccount(account);
}

export async function archiveAccountById(id: string): Promise<void> {
  const account = await getAccountById(id);
  if (!account) throw new Error('Account not found');
  await archiveAccount(id);
}
