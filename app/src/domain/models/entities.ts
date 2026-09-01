export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  name: string;
  type: string | null;
  currency: string | null;
  opening_balance: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  kind: 'expense' | 'income';
  parent_id: string | null;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  amount: number;
  account_id: string;
  category_id: string | null;
  note: string | null;
  transfer_group_id: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}
