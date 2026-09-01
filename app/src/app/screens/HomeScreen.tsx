import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Button } from '../components/Button';
import { useThemedStyles } from '../useThemedStyles';
import { getDashboardData } from '../../domain/usecases/dashboardUseCase';
import { getCurrentMonthRange, formatMonthLabel } from '../../utils/periods';
import type { AppTheme } from '../theme';

const createStyles = (t: AppTheme) => ({
  container: { flex: 1, backgroundColor: t.colors.bg },
  content: { padding: t.spacing.lg, paddingBottom: 100 },
  title: { ...t.typography.headline, color: t.colors.text, marginBottom: 4 },
  subtitle: { color: t.colors.textSecondary, fontSize: 14, marginBottom: t.spacing.md },
  insightRow: { flexDirection: 'row' as const, gap: t.spacing.sm, marginBottom: t.spacing.md },
  insightChip: {
    flex: 1,
    backgroundColor: t.colors.bgElevated,
    borderRadius: t.radius.md,
    padding: t.spacing.sm,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
    alignItems: 'center' as const,
  },
  insightLabel: { color: t.colors.textMuted, fontSize: 11, marginBottom: 4 },
  insightValue: { color: t.colors.text, fontSize: 15, fontWeight: '700' as const },
  cardsRow: { flexDirection: 'row' as const, gap: t.spacing.sm, marginBottom: t.spacing.sm },
  card: {
    backgroundColor: t.colors.bgElevated,
    borderRadius: t.radius.md,
    padding: t.spacing.md,
    marginBottom: t.spacing.sm,
    flex: 1,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
  },
  cardLabel: { color: t.colors.textSecondary, fontSize: 14 },
  cardValue: { fontSize: 20, fontWeight: '700' as const, marginTop: 4 },
  income: { color: t.colors.success },
  expense: { color: t.colors.danger },
  sectionTitle: {
    color: t.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600' as const,
    marginTop: t.spacing.md,
    marginBottom: t.spacing.sm,
  },
  emptyHint: { color: t.colors.textMuted, fontSize: 14, marginBottom: t.spacing.sm },
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
    paddingHorizontal: t.spacing.md,
    backgroundColor: t.colors.bgElevated,
    borderRadius: t.radius.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
  },
  rowLabel: { color: t.colors.text },
  rowValue: { color: t.colors.text, fontWeight: '600' as const },
  footer: { marginTop: t.spacing.lg },
});

export function HomeScreen() {
  const navigation = useNavigation<{ navigate: (a: string, b?: object) => void }>();
  const styles = useThemedStyles(createStyles);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [net, setNet] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [savingsRate, setSavingsRate] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<{ id: string; name: string; balance: number }[]>([]);
  const [topCategories, setTopCategories] = useState<{ category_name: string; total: number }[]>([]);

  const { from, to, year, month } = getCurrentMonthRange();

  const load = useCallback(async () => {
    const data = await getDashboardData(from, to);
    setIncome(data.summary.income);
    setExpense(data.summary.expense);
    setNet(data.summary.net);
    setTransactionCount(data.transactionCount);
    setTotalBalance(data.totalBalance);
    setSavingsRate(data.savingsRatePercent);
    setAccounts(data.accounts);
    setTopCategories(data.topCategories.map((c) => ({ category_name: c.category_name, total: c.total })));
  }, [from, to]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const monthLabel = formatMonthLabel(year, month);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{monthLabel}</Text>
      <Text style={styles.subtitle}>Overview for this month</Text>

      <View style={styles.insightRow}>
        <View style={styles.insightChip}>
          <Text style={styles.insightLabel}>Transactions</Text>
          <Text style={styles.insightValue}>{transactionCount}</Text>
        </View>
        <View style={styles.insightChip}>
          <Text style={styles.insightLabel}>Total balance</Text>
          <Text style={styles.insightValue}>{totalBalance.toFixed(2)}</Text>
        </View>
        <View style={styles.insightChip}>
          <Text style={styles.insightLabel}>Savings rate</Text>
          <Text style={[styles.insightValue, savingsRate != null && savingsRate >= 0 ? styles.income : styles.expense]}>
            {savingsRate != null ? `${savingsRate}%` : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Income</Text>
          <Text style={[styles.cardValue, styles.income]}>{income.toFixed(2)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Expense</Text>
          <Text style={[styles.cardValue, styles.expense]}>{expense.toFixed(2)}</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Net (income − expense)</Text>
        <Text style={[styles.cardValue, net >= 0 ? styles.income : styles.expense]}>{net.toFixed(2)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Account balances</Text>
      {accounts.length === 0 ? (
        <Text style={styles.emptyHint}>Add an account under Accounts in the menu.</Text>
      ) : (
        accounts.map((a) => (
          <View key={a.id} style={styles.row}>
            <Text style={styles.rowLabel}>{a.name}</Text>
            <Text style={styles.rowValue}>{a.balance.toFixed(2)}</Text>
          </View>
        ))
      )}

      {topCategories.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Top expense categories</Text>
          {topCategories.map((c, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.rowLabel}>{c.category_name}</Text>
              <Text style={styles.expense}>{c.total.toFixed(2)}</Text>
            </View>
          ))}
        </>
      )}

      <View style={styles.footer}>
        <Button title="Add transaction" onPress={() => navigation.navigate('Transactions', { openAdd: true })} />
      </View>
    </ScrollView>
  );
}
