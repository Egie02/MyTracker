import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '../components/Button';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';
import { createFormStyles } from '../styles/sharedStyles';
import { generateId } from '../../utils/ids';
import { nowISO } from '../../utils/dates';
import { getCategory, createCategory, updateCategoryData } from '../../domain/usecases/categoryUseCase';

export function AddEditCategoryScreen({
  categoryId,
  kindDefault,
  onSaved,
  onCancel,
}: {
  categoryId: string | null;
  kindDefault: 'expense' | 'income';
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createFormStyles);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'expense' | 'income'>(kindDefault);
  const [error, setError] = useState('');

  useEffect(() => {
    if (categoryId) {
      getCategory(categoryId).then((c) => {
        if (c) { setName(c.name); setKind(c.kind); }
      });
    } else {
      setKind(kindDefault);
    }
  }, [categoryId, kindDefault]);

  async function handleSave() {
    const n = name.trim();
    if (!n) { setError('Name is required'); return; }
    setError('');
    try {
      const now = nowISO();
      if (categoryId) {
        const c = await getCategory(categoryId);
        if (c) await updateCategoryData({ ...c, name: n, kind, updated_at: now });
      } else {
        await createCategory({
          id: generateId(),
          name: n,
          kind,
          parent_id: null,
          is_archived: 0,
          created_at: now,
          updated_at: now,
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Category name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Food, Salary" placeholderTextColor={theme.colors.textMuted} />
        <Text style={styles.label}>Type</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <Button title="Expense" variant={kind === 'expense' ? 'primary' : 'secondary'} onPress={() => setKind('expense')} style={{ flex: 1 }} />
          <Button title="Income" variant={kind === 'income' ? 'primary' : 'secondary'} onPress={() => setKind('income')} style={{ flex: 1 }} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.row}>
          <Button title="Cancel" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
          <Button title={categoryId ? 'Update' : 'Add'} onPress={handleSave} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
