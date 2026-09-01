import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { MonthNavigator } from '../components/MonthNavigator';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';
import { createListScreenStyles } from '../styles/sharedStyles';
import { getSession } from '../../auth/session';
import { getTransactionList, deleteTransactionById } from '../../domain/usecases/transactionUseCase';
import type { TransactionWithDetails } from '../../data/repositories/transactionRepository';
import { AddEditTransactionScreen } from './AddEditTransactionScreen';
import { getMonthRange, getCurrentMonthRange, formatMonthLabel } from '../../utils/periods';

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

export function TransactionsScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(createListScreenStyles);
  const navigation = useNavigation<{ navigate: (a: string, b?: object) => void; setParams: (p: { openAdd?: boolean; initialAmount?: string }) => void }>();
  const route = useRoute();
  const routeParams = route.params as { openAdd?: boolean; initialAmount?: string } | undefined;
  const [list, setList] = useState<TransactionWithDetails[]>([]);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getDefaultMonth);
  const [initialAmount, setInitialAmount] = useState<string | undefined>();

  const load = useCallback(async () => {
    const session = await getSession();
    if (session) setUserId(session.userId);
    const { from, to } = getMonthRange(selectedMonth.year, selectedMonth.month);
    setList(await getTransactionList({ fromDate: from, toDate: to }));
  }, [selectedMonth.year, selectedMonth.month]);

  useFocusEffect(
    useCallback(() => {
      if (routeParams?.openAdd) {
        setEditingId(null);
        setShowAddEdit(true);
        setInitialAmount(routeParams?.initialAmount);
        navigation.setParams({ openAdd: false, initialAmount: undefined });
      }
      load();
    }, [load, routeParams?.openAdd, routeParams?.initialAmount, navigation])
  );

  if (showAddEdit) {
    return (
      <AddEditTransactionScreen
        transactionId={editingId}
        userId={userId}
        initialAmount={initialAmount}
        onSaved={() => { setShowAddEdit(false); setEditingId(null); setInitialAmount(undefined); load(); }}
        onCancel={() => { setShowAddEdit(false); setEditingId(null); setInitialAmount(undefined); }}
      />
    );
  }

  const byDate: Record<string, TransactionWithDetails[]> = {};
  for (const tx of list) {
    const key = tx.date.slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(tx);
  }
  const sections = Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a));
  const monthLabel = formatMonthLabel(selectedMonth.year, selectedMonth.month);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <MonthNavigator
          label={monthLabel}
          onPrev={() => setSelectedMonth((p) => (p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 }))}
          onNext={() => setSelectedMonth((p) => (p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 }))}
        />
      </View>
      <FlatList
        data={sections}
        keyExtractor={([date]) => date}
        contentContainerStyle={styles.list}
        renderItem={({ item: [date, txs] }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{formatDateHeader(date)}</Text>
            {txs.map((tx) => (
              <View key={tx.id} style={styles.card}>
                <TouchableOpacity style={styles.cardMain} onPress={() => { setEditingId(tx.id); setShowAddEdit(true); }}>
                  <Text style={styles.type}>{tx.type}</Text>
                  <Text style={styles.note}>{tx.note || tx.category_name || tx.account_name || '—'}</Text>
                  <Text style={[styles.amount, tx.type === 'income' ? styles.amountIncome : styles.amountExpense]}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  Alert.alert('Delete transaction', `Delete this ${tx.type}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTransactionById(tx.id); load(); } },
                  ]);
                }} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      />
      <View style={styles.footer}>
        <Button title="Add transaction" onPress={() => { setEditingId(null); setShowAddEdit(true); }} />
      </View>
    </View>
  );
}
