import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { clearSession } from '../../auth/session';
import { clearAllData } from '../../data/db/clearData';
import { exportToXLSX, shareExportedFile } from '../../data/importExport/exportXLSX';
import { pickXLSXFile, importFromXLSX } from '../../data/importExport/importXLSX';
import { InstructionsModal } from '../components/InstructionsModal';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';
import { getSession } from '../../auth/session';
import {
  authenticateWithBiometric,
  getBiometricLabel,
  isBiometricEnabledForUser,
  isBiometricHardwareAvailable,
  setBiometricEnabled,
} from '../../auth/biometric';
import type { ThemeMode } from '../../preferences/uiPreferences';
import type { AppTheme } from '../theme';

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'System' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
];

const createStyles = (t: AppTheme) => ({
  container: { flex: 1, backgroundColor: t.colors.bg },
  content: { padding: t.spacing.lg, paddingBottom: t.spacing.xl },
  title: { ...t.typography.headline, color: t.colors.text, marginBottom: t.spacing.lg },
  sectionTitle: {
    ...t.typography.label,
    color: t.colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: t.spacing.sm,
    marginTop: t.spacing.md,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: t.colors.bgElevated,
    borderRadius: t.radius.md,
    padding: t.spacing.md,
    marginBottom: t.spacing.sm,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
  },
  rowSwitch: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: t.colors.bgElevated,
    borderRadius: t.radius.md,
    padding: t.spacing.md,
    marginBottom: t.spacing.sm,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
  },
  rowDanger: { borderColor: t.colors.danger },
  rowText: { color: t.colors.text, fontSize: 16 },
  rowHint: { color: t.colors.textMuted, fontSize: 12, marginTop: 2 },
  rowChevron: { color: t.colors.textMuted, fontSize: 22 },
  dangerText: { color: t.colors.danger },
  themeRow: { flexDirection: 'row' as const, gap: t.spacing.sm, marginBottom: t.spacing.sm },
  themeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: t.radius.md,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.bgElevated,
  },
  themeChipActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  themeChipText: { color: t.colors.textSecondary, fontSize: 14, fontWeight: '600' as const },
  themeChipTextActive: { color: t.colors.primaryText },
  lockBtn: {
    marginTop: t.spacing.xl,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    padding: t.spacing.md,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  lockText: { color: t.colors.text, fontSize: 16, fontWeight: '600' as const },
});

export function SettingsScreen({ onLock, onAppReset }: { onLock: () => void; onAppReset: () => void }) {
  const navigation = useNavigation<{ navigate: (name: string) => void }>();
  const { theme, mode, setMode } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [showInstructions, setShowInstructions] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioLabel, setBioLabel] = useState('Biometrics');
  const [userId, setUserId] = useState('');

  const loadSecurity = useCallback(async () => {
    const session = await getSession();
    if (!session) return;
    setUserId(session.userId);
    const [avail, enabled, label] = await Promise.all([
      isBiometricHardwareAvailable(),
      isBiometricEnabledForUser(session.userId),
      getBiometricLabel(),
    ]);
    setBioAvailable(avail);
    setBioEnabled(enabled);
    setBioLabel(label);
  }, []);

  useFocusEffect(useCallback(() => { loadSecurity(); }, [loadSecurity]));

  async function handleBiometricToggle(value: boolean) {
    if (!userId) return;
    if (value) {
      const ok = await authenticateWithBiometric(`Enable ${bioLabel}`);
      if (!ok) return;
      await setBiometricEnabled(userId, true);
      setBioEnabled(true);
    } else {
      await setBiometricEnabled(userId, false);
      setBioEnabled(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.themeRow}>
        {THEME_OPTIONS.map((opt) => {
          const active = mode === opt.mode;
          return (
            <TouchableOpacity
              key={opt.mode}
              style={[styles.themeChip, active && styles.themeChipActive]}
              onPress={() => setMode(opt.mode)}
              activeOpacity={0.8}
            >
              <Text style={[styles.themeChipText, active && styles.themeChipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Security</Text>
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ChangePin')}>
        <Text style={styles.rowText}>Change PIN</Text>
        <Text style={styles.rowChevron}>›</Text>
      </TouchableOpacity>
      {bioAvailable && (
        <View style={styles.rowSwitch}>
          <View>
            <Text style={styles.rowText}>Use {bioLabel}</Text>
            <Text style={styles.rowHint}>Unlock with biometrics</Text>
          </View>
          <Switch
            value={bioEnabled}
            onValueChange={handleBiometricToggle}
            trackColor={{ false: theme.colors.border, true: theme.colors.primaryMuted }}
            thumbColor={bioEnabled ? theme.colors.primary : theme.colors.textMuted}
          />
        </View>
      )}

      <Text style={styles.sectionTitle}>App</Text>
      <TouchableOpacity style={styles.row} onPress={() => setShowInstructions(true)}>
        <Text style={styles.rowText}>How to use</Text>
        <Text style={styles.rowChevron}>›</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Data</Text>
      <TouchableOpacity style={styles.row} onPress={async () => {
        try {
          const path = await exportToXLSX();
          await shareExportedFile(path);
          Alert.alert('Export', 'Data exported successfully.');
        } catch (e) {
          Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
        }
      }}>
        <Text style={styles.rowText}>Export to XLSX</Text>
        <Text style={styles.rowChevron}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={async () => {
        try {
          const uri = await pickXLSXFile();
          if (!uri) return;
          const result = await importFromXLSX(uri);
          Alert.alert(result.success ? 'Import' : 'Import failed', result.message);
        } catch (e) {
          Alert.alert('Import failed', e instanceof Error ? e.message : 'Unknown error');
        }
      }}>
        <Text style={styles.rowText}>Import from XLSX</Text>
        <Text style={styles.rowChevron}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.row, styles.rowDanger]} onPress={() => {
        Alert.alert('Clear all data?', 'This permanently deletes all data and resets your PIN.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear all data',
            style: 'destructive',
            onPress: async () => {
              try {
                await clearAllData();
                await clearSession();
                onAppReset();
              } catch (e) {
                Alert.alert('Error', e instanceof Error ? e.message : 'Failed to clear data');
              }
            },
          },
        ]);
      }}>
        <Text style={[styles.rowText, styles.dangerText]}>Clear all data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.lockBtn} onPress={onLock}>
        <Text style={styles.lockText}>Lock app</Text>
      </TouchableOpacity>

      <InstructionsModal visible={showInstructions} onClose={() => setShowInstructions(false)} />
    </ScrollView>
  );
}
