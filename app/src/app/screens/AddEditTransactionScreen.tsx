import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Button } from '../components/Button';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';
import { createFormStyles } from '../styles/sharedStyles';
import {
  getTransaction,
  getTransferLegs,
  saveTransaction,
} from '../../domain/usecases/transactionUseCase';
import { listAccounts } from '../../domain/usecases/accountUseCase';
import { listCategories } from '../../domain/usecases/categoryUseCase';
import { nowISO } from '../../utils/dates';
import type { Account, Category, TransactionType } from '../../domain/models/entities';

function formatDateForInput(iso: string): string {
  return iso.slice(0, 16);
}

export function AddEditTransactionScreen({
  transactionId,
  userId,
  initialAmount: initialAmountProp,
  onSaved,
  onCancel,
}: {
  transactionId: string | null;
  userId: string;
  initialAmount?: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createFormStyles);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState(initialAmountProp ?? '');
  const [date, setDate] = useState(formatDateForInput(nowISO()));
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [transferGroupId, setTransferGroupId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    listAccounts().then(setAccounts);
  }, []);
  useEffect(() => {
    if (type === 'transfer') {
      setCategories([]);
      return;
    }
    listCategories(type).then(setCategories);
  }, [type]);

  useEffect(() => {
    if (!transactionId && accounts.length) {
      setAccountId(accounts[0].id);
      if (accounts.length > 1) setToAccountId(accounts[1].id);
    }
  }, [type, transactionId, accounts.length]);

  useEffect(() => {
    if (transactionId) {
      getTransaction(transactionId).then((t) => {
        if (t) {
          setType(t.type as TransactionType);
          setAmount(String(t.amount));
          setDate(formatDateForInput(t.date));
          setAccountId(t.account_id);
          setCategoryId(t.category_id ?? '');
          setNote(t.note ?? '');
          if (t.transfer_group_id) {
            setTransferGroupId(t.transfer_group_id);
            getTransferLegs(t.transfer_group_id).then((legs) => {
              const incomeLeg = legs.find((l) => l.type === 'income');
              if (incomeLeg) setToAccountId(incomeLeg.account_id);
            });
          }
        }
      });
    }
  }, [transactionId]);

  async function handleSave() {
    const a = parseFloat(amount);
    if (isNaN(a) || a <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    const d = new Date(date).toISOString();
    setError('');
    setLoading(true);
    try {
      await saveTransaction({
        type,
        amount: a,
        date: d,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        categoryId: type !== 'transfer' ? (categoryId || null) : undefined,
        note: note.trim() || null,
        userId,
        transactionId: transactionId ?? undefined,
        transferGroupId: transferGroupId ?? undefined,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  const accountOptions = accounts.filter((a) => a.is_archived === 0);
  const categoryOptions = categories.filter((c) => c.kind === type);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={styles.titleRow}>
        <Text style={styles.titleRowText}>{transactionId ? 'Edit transaction' : 'New transaction'}</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Type</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {(['expense', 'income', 'transfer'] as const).map((t) => (
            <Button
              key={t}
              title={t.charAt(0).toUpperCase() + t.slice(1)}
              variant={type === t ? 'primary' : 'secondary'}
              onPress={() => setType(t)}
              style={{ flex: 1 }}
            />
          ))}
        </View>
        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          placeholderTextColor={theme.colors.textMuted}
        />
        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DDTHH:mm"
          placeholderTextColor={theme.colors.textMuted}
        />
        <Text style={styles.label}>{type === 'transfer' ? 'From account *' : 'Account *'}</Text>
        <View style={styles.picker}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {accountOptions.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                onPress={() => setAccountId(acc.id)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  marginRight: 8,
                  borderRadius: 8,
                  backgroundColor: accountId === acc.id ? theme.colors.primary : theme.colors.surface,
                }}
              >
                <Text style={styles.pickerText}>{acc.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {type === 'transfer' && (
          <>
            <Text style={styles.label}>To account *</Text>
            <View style={styles.picker}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {accountOptions.map((acc) => (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setToAccountId(acc.id)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      marginRight: 8,
                      borderRadius: 8,
                      backgroundColor: toAccountId === acc.id ? theme.colors.primary : theme.colors.surface,
                    }}
                  >
                    <Text style={styles.pickerText}>{acc.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}
        {type !== 'transfer' && (
          <>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.picker}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categoryOptions.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      marginRight: 8,
                      borderRadius: 8,
                      backgroundColor: categoryId === cat.id ? theme.colors.primary : theme.colors.surface,
                    }}
                  >
                    <Text style={styles.pickerText}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}
        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Note"
          placeholderTextColor={theme.colors.textMuted}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button title="Cancel" variant="secondary" onPress={onCancel} style={styles.footerBtn} />
        <Button title={transactionId ? 'Update' : 'Add'} onPress={handleSave} style={styles.footerBtn} disabled={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}
