import { getAccounts, getAccountBalance } from '../../data/repositories/accountRepository';
import {
  getSumByTypeAndDateRange,
  getTopCategoriesByExpense,
  getTransactionCountForRange,
} from '../../data/repositories/transactionRepository';

export interface MonthSummary {
  income: number;
  expense: number;
  net: number;
}

export interface AccountBalance {
  id: string;
  name: string;
  balance: number;
}

export interface TopCategory {
  category_id: string;
  category_name: string;
  total: number;
}

export async function getMonthSummary(
  fromDate: string,
  toDate: string,
  accountId?: string | null
): Promise<MonthSummary> {
  const { income, expense } = await getSumByTypeAndDateRange(accountId ?? null, fromDate, toDate);
  return { income, expense, net: income - expense };
}

export async function getAccountBalances(): Promise<AccountBalance[]> {
  const accounts = await getAccounts(false);
  const withBalances = await Promise.all(
    accounts.map(async (a) => ({
      id: a.id,
      name: a.name,
      balance: await getAccountBalance(a.id),
    }))
  );
  return withBalances;
}

export async function getTopCategories(
  limit: number,
  fromDate: string,
  toDate: string
): Promise<TopCategory[]> {
  return getTopCategoriesByExpense(limit, fromDate, toDate);
}

export interface DashboardData {
  summary: MonthSummary;
  accounts: AccountBalance[];
  topCategories: TopCategory[];
  transactionCount: number;
  totalBalance: number;
  /** Net as % of income for the period; null when income is 0. */
  savingsRatePercent: number | null;
}

export async function getDashboardData(fromDate: string, toDate: string): Promise<DashboardData> {
  const [summary, accounts, topCategories, transactionCount] = await Promise.all([
    getMonthSummary(fromDate, toDate),
    getAccountBalances(),
    getTopCategories(5, fromDate, toDate),
    getTransactionCountForRange(fromDate, toDate),
  ]);
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const savingsRatePercent =
    summary.income > 0 ? Math.round((summary.net / summary.income) * 1000) / 10 : null;
  return {
    summary,
    accounts,
    topCategories,
    transactionCount,
    totalBalance,
    savingsRatePercent,
  };
}
