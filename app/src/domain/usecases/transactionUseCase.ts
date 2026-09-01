import type { Transaction } from '../models/entities';
import {
  getTransactions,
  getTransactionById,
  getTransactionsByTransferGroup,
  insertTransaction,
  updateTransaction,
  deleteTransaction as repoDeleteTransaction,
  deleteTransferGroup,
} from '../../data/repositories/transactionRepository';
import type { TransactionWithDetails } from '../../data/repositories/transactionRepository';
import { getAccountById } from '../../data/repositories/accountRepository';
import { getCategoryById } from '../../data/repositories/categoryRepository';
import { generateId } from '../../utils/ids';
import { nowISO } from '../../utils/dates';

export type TransactionListOptions = {
  fromDate?: string;
  toDate?: string;
  accountId?: string;
  categoryId?: string;
  type?: string;
  limit?: number;
  offset?: number;
};

export interface SaveTransactionParams {
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  date: string;
  accountId: string;
  toAccountId?: string;
  categoryId?: string | null;
  note?: string | null;
  userId: string;
  transactionId?: string | null;
  transferGroupId?: string | null;
}

function validateAmount(amount: number): void {
  if (amount <= 0 || !Number.isFinite(amount)) throw new Error('Amount must be greater than 0');
}

export async function getTransactionList(
  options: TransactionListOptions
): Promise<TransactionWithDetails[]> {
  return getTransactions(options);
}

export async function getTransaction(id: string): Promise<TransactionWithDetails | null> {
  return getTransactionById(id);
}

export async function getTransferLegs(transferGroupId: string): Promise<Transaction[]> {
  return getTransactionsByTransferGroup(transferGroupId);
}

export async function saveTransaction(params: SaveTransactionParams): Promise<void> {
  const {
    type,
    amount,
    date,
    accountId,
    toAccountId,
    categoryId,
    note,
    userId,
    transactionId,
    transferGroupId,
  } = params;

  validateAmount(amount);
  const account = await getAccountById(accountId);
  if (!account) throw new Error('Account not found');
  if (account.is_archived === 1) throw new Error('Account is archived');

  if (type !== 'transfer') {
    if (!categoryId) throw new Error('Category is required');
    const category = await getCategoryById(categoryId);
    if (!category) throw new Error('Category not found');
    if (category.is_archived === 1) throw new Error('Category is archived');
  }

  if (type === 'transfer') {
    if (!toAccountId) throw new Error('To account is required');
    if (accountId === toAccountId) throw new Error('From and To accounts must be different');
    const toAccount = await getAccountById(toAccountId);
    if (!toAccount) throw new Error('To account not found');
    if (toAccount.is_archived === 1) throw new Error('To account is archived');
  }

  const now = nowISO();
  const trimmedNote = note?.trim() || null;

  if (transactionId && type !== 'transfer') {
    const existing = await getTransactionById(transactionId);
    if (!existing) throw new Error('Transaction not found');
    await updateTransaction({
      ...existing,
      type,
      date,
      amount,
      account_id: accountId,
      category_id: categoryId || null,
      note: trimmedNote,
      updated_at: now,
    });
    return;
  }

  if (type === 'transfer') {
    let groupId = transferGroupId ?? null;
    if (transactionId) {
      const existing = await getTransactionById(transactionId);
      if (existing?.transfer_group_id) {
        await deleteTransferGroup(existing.transfer_group_id);
        groupId = existing.transfer_group_id;
      }
    }
    groupId = groupId ?? generateId();
    await insertTransaction({
      id: generateId(),
      type: 'expense',
      date,
      amount,
      account_id: accountId,
      category_id: null,
      note: trimmedNote,
      transfer_group_id: groupId,
      created_by_user_id: userId,
      created_at: now,
      updated_at: now,
    });
    await insertTransaction({
      id: generateId(),
      type: 'income',
      date,
      amount,
      account_id: toAccountId!,
      category_id: null,
      note: trimmedNote,
      transfer_group_id: groupId,
      created_by_user_id: userId,
      created_at: now,
      updated_at: now,
    });
    return;
  }

  await insertTransaction({
    id: generateId(),
    type,
    date,
    amount,
    account_id: accountId,
    category_id: categoryId || null,
    note: trimmedNote,
    transfer_group_id: null,
    created_by_user_id: userId,
    created_at: now,
    updated_at: now,
  });
}

export async function deleteTransactionById(id: string): Promise<void> {
  const tx = await getTransactionById(id);
  if (!tx) throw new Error('Transaction not found');
  if (tx.transfer_group_id) {
    await deleteTransferGroup(tx.transfer_group_id);
  } else {
    await repoDeleteTransaction(id);
  }
}

export async function deleteTransferGroupById(transferGroupId: string): Promise<void> {
  await deleteTransferGroup(transferGroupId);
}

// Re-export for dashboard/history aggregates
export {
  getSumByTypeAndDateRange,
  getTopCategoriesByExpense,
} from '../../data/repositories/transactionRepository';
