import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';
import { createListScreenStyles } from '../styles/sharedStyles';
import { listAccounts, getBalance, archiveAccountById } from '../../domain/usecases/accountUseCase';
import type { Account } from '../../domain/models/entities';
import { AddEditAccountScreen } from './AddEditAccountScreen';

export function AccountsScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(createListScreenStyles);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await listAccounts(true);
    setAccounts(list);
    const b: Record<string, number> = {};
    for (const a of list) b[a.id] = await getBalance(a.id);
    setBalances(b);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (showAddEdit) {
    return (
      <AddEditAccountScreen
        accountId={editingId}
        onSaved={() => { setShowAddEdit(false); setEditingId(null); load(); }}
        onCancel={() => { setShowAddEdit(false); setEditingId(null); }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardMain} onPress={() => { setEditingId(item.id); setShowAddEdit(true); }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.balance}>{balances[item.id]?.toFixed(2) ?? '0.00'}</Text>
            </TouchableOpacity>
            {item.is_archived === 0 && (
              <TouchableOpacity onPress={() => {
                Alert.alert('Archive account', `Archive "${item.name}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Archive', style: 'destructive', onPress: async () => { await archiveAccountById(item.id); load(); } },
                ]);
              }} style={styles.archiveBtn}>
                <Ionicons name="archive-outline" size={20} color={theme.colors.iconMuted} />
              </TouchableOpacity>
            )}
            {item.is_archived === 1 && <Text style={styles.archived}>Archived</Text>}
          </View>
        )}
      />
      <View style={styles.footer}>
        <Button title="Add account" onPress={() => { setEditingId(null); setShowAddEdit(true); }} />
      </View>
    </View>
  );
}
