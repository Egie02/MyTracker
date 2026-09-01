import React, { useState, useCallback } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MonthNavigator } from '../components/MonthNavigator';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';
import { createListScreenStyles } from '../styles/sharedStyles';
import { getTransactionList, getSumByTypeAndDateRange } from '../../domain/usecases/transactionUseCase';
import type { TransactionWithDetails } from '../../data/repositories/transactionRepository';
import { getMonthRange, getCurrentMonthRange, formatMonthLabel } from '../../utils/periods';
import type { AppTheme } from '../theme';

function getDefaultMonth() {
  const { year, month } = getCurrentMonthRange();
  return { year, month };
}

function formatDateHeader(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatMonthRange(year: number, month: number): string {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const d = (n: Date) => n.getDate();
  const m = (n: Date) => n.toLocaleDateString(undefined, { month: 'short' });
  return `${d(start)} – ${d(end)} ${m(start)} ${year}`;
}

const createHistoryStyles = (t: AppTheme) => ({
  ...createListScreenStyles(t),
  summaryRow: { flexDirection: 'row' as const, gap: 10, marginTop: t.spacing.md },
  summaryChip: {
    flex: 1,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.sm,
    padding: 12,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
  },
  summaryLabel: { color: t.colors.textMuted, fontSize: 12, marginBottom: 4 },
  summaryIncome: { color: t.colors.success, fontSize: 14, fontWeight: '700' as const },
  summaryExpense: { color: t.colors.danger, fontSize: 14, fontWeight: '700' as const },
  sectionDate: { color: t.colors.textMuted, fontSize: 12, marginBottom: 10, marginLeft: 4 },
  historySectionTitle: { color: t.colors.primary, fontSize: 15, fontWeight: '600' as const, marginBottom: 2 },
});

export function HistoryScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(createHistoryStyles);
  const [list, setList] = useState<TransactionWithDetails[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getDefaultMonth);
  const [summary, setSummary] = useState({ income: 0, expense: 0 });

  const load = useCallback(async () => {
    const { from, to } = getMonthRange(selectedMonth.year, selectedMonth.month);
    const [rows, sums] = await Promise.all([
      getTransactionList({ fromDate: from, toDate: to }),
      getSumByTypeAndDateRange(null, from, to),
    ]);
    setList(rows);
    setSummary(sums);
  }, [selectedMonth.year, selectedMonth.month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const byDate: Record<string, TransactionWithDetails[]> = {};
  for (const tx of list) {
    const key = tx.date.slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(tx);
  }
  const sections = Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a));
  const monthLabel = formatMonthLabel(selectedMonth.year, selectedMonth.month);
  const net = summary.income - summary.expense;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSubtitle}>Read-only monthly review</Text>
        <MonthNavigator
          label={monthLabel}
          subtitle={formatMonthRange(selectedMonth.year, selectedMonth.month)}
          onPrev={() => setSelectedMonth((p) => (p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 }))}
          onNext={() => setSelectedMonth((p) => (p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 }))}
        />
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={styles.summaryIncome}>{summary.income.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryLabel}>Expense</Text>
            <Text style={styles.summaryExpense}>{summary.expense.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={net >= 0 ? styles.summaryIncome : styles.summaryExpense}>{net.toFixed(2)}</Text>
          </View>
        </View>
      </View>
      <FlatList
        data={sections}
        keyExtractor={([date]) => date}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.iconMuted} />
            <Text style={styles.emptyText}>No transactions in this period</Text>
          </View>
        }
        renderItem={({ item: [date, txs] }) => (
          <View style={styles.section}>
            <Text style={styles.historySectionTitle}>{formatDateHeader(date)}</Text>
            <Text style={styles.sectionDate}>{date}</Text>
            {txs.map((tx) => (
              <View key={tx.id} style={styles.card}>
                <View style={styles.cardMain}>
                  <Text style={styles.type}>{tx.type}</Text>
                  <Text style={styles.note}>{tx.note || tx.category_name || tx.account_name || '—'}</Text>
                  <Text style={[styles.amount, tx.type === 'income' ? styles.amountIncome : styles.amountExpense]}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}
