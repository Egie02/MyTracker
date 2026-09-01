import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '../components/Button';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';
import { createFormStyles } from '../styles/sharedStyles';
import { generateId } from '../../utils/ids';
import { nowISO } from '../../utils/dates';
import type { Account } from '../../domain/models/entities';
import { getAccount, createAccount, updateAccountData } from '../../domain/usecases/accountUseCase';

export function AddEditAccountScreen({
  accountId,
  onSaved,
  onCancel,
}: {
  accountId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createFormStyles);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [openingBalance, setOpeningBalance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accountId) {
      getAccount(accountId).then((a) => {
        if (a) {
          setName(a.name);
          setType(a.type ?? '');
          setCurrency(a.currency ?? 'USD');
          setOpeningBalance(String(a.opening_balance));
        }
      });
    }
  }, [accountId]);

  async function handleSave() {
    const n = name.trim();
    if (!n) { setError('Name is required'); return; }
    const ob = parseFloat(openingBalance);
    if (isNaN(ob)) { setError('Opening balance must be a number'); return; }
    setError('');
    setLoading(true);
    try {
      const now = nowISO();
      if (accountId) {
        const a = await getAccount(accountId);
        if (a) {
          await updateAccountData({ ...a, name: n, type: type.trim() || null, currency: currency.trim() || null, opening_balance: ob, updated_at: now });
        }
      } else {
        await createAccount({
          id: generateId(),
          name: n,
          type: type.trim() || null,
          currency: currency.trim() || null,
          opening_balance: ob,
          is_archived: 0,
          created_at: now,
          updated_at: now,
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Account name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Cash, Main Bank" placeholderTextColor={theme.colors.textMuted} />
        <Text style={styles.label}>Type (optional)</Text>
        <TextInput style={styles.input} value={type} onChangeText={setType} placeholder="cash, bank, ewallet" placeholderTextColor={theme.colors.textMuted} />
        <Text style={styles.label}>Currency (optional)</Text>
        <TextInput style={styles.input} value={currency} onChangeText={setCurrency} placeholder="USD" placeholderTextColor={theme.colors.textMuted} />
        <Text style={styles.label}>Opening balance</Text>
        <TextInput style={styles.input} value={openingBalance} onChangeText={setOpeningBalance} placeholder="0" keyboardType="decimal-pad" placeholderTextColor={theme.colors.textMuted} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.row}>
          <Button title="Cancel" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
          <Button title={accountId ? 'Update' : 'Add'} onPress={handleSave} style={{ flex: 1 }} disabled={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
