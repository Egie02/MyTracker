import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';
import { createListScreenStyles } from '../styles/sharedStyles';
import { listCategories, archiveCategoryById } from '../../domain/usecases/categoryUseCase';
import type { Category } from '../../domain/models/entities';
import { AddEditCategoryScreen } from './AddEditCategoryScreen';
import type { AppTheme } from '../theme';

const createStyles = (t: AppTheme) => ({
  ...createListScreenStyles(t),
  toggle: { flexDirection: 'row' as const, gap: t.spacing.sm, padding: t.spacing.md },
});

export function CategoriesScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [categories, setCategories] = useState<Category[]>([]);
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setCategories(await listCategories(kind, true));
  }, [kind]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (showAddEdit) {
    return (
      <AddEditCategoryScreen
        categoryId={editingId}
        kindDefault={kind}
        onSaved={() => { setShowAddEdit(false); setEditingId(null); load(); }}
        onCancel={() => { setShowAddEdit(false); setEditingId(null); }}
      />
    );
  }

  const list = categories.filter((c) => c.kind === kind);

  return (
    <View style={styles.container}>
      <View style={styles.toggle}>
        <Button title="Expense" variant={kind === 'expense' ? 'primary' : 'secondary'} onPress={() => setKind('expense')} style={{ flex: 1 }} />
        <Button title="Income" variant={kind === 'income' ? 'primary' : 'secondary'} onPress={() => setKind('income')} style={{ flex: 1 }} />
      </View>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardMain} onPress={() => { setEditingId(item.id); setShowAddEdit(true); }}>
              <Text style={styles.name}>{item.name}</Text>
            </TouchableOpacity>
            {item.is_archived === 0 && (
              <TouchableOpacity onPress={() => {
                Alert.alert('Archive category', `Archive "${item.name}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Archive', style: 'destructive', onPress: async () => { await archiveCategoryById(item.id); load(); } },
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
        <Button title="Add category" onPress={() => { setEditingId(null); setShowAddEdit(true); }} />
      </View>
    </View>
  );
}
