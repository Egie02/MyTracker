import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';
import type { AppTheme } from '../theme';

interface InstructionsModalProps {
  visible: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    title: 'Navigation (menu)',
    icon: 'menu-outline' as const,
    steps: [
      'Tap the ☰ button in the top-left of any screen to open the menu.',
      'Or swipe from the left edge of the screen toward the right (look for the subtle edge hint).',
      'Choose a section: Dashboard, Transactions, History, Calculator, Accounts, Categories, or Settings.',
      'Tap outside the menu, the X button, or pick a section to close it.',
    ],
  },
  {
    title: 'Appearance',
    icon: 'color-palette-outline' as const,
    steps: [
      'Go to Settings → Appearance to switch between Light, Dark, or System theme.',
      'System follows your device light/dark mode automatically.',
    ],
  },
  {
    title: 'Unlock',
    icon: 'lock-closed-outline' as const,
    steps: [
      'On first launch, create a 4-digit PIN.',
      'Unlock with PIN or biometrics (Face ID / fingerprint) if enabled in Settings.',
      'Use Lock app in the menu or Settings to require PIN again.',
    ],
  },
  {
    title: 'Dashboard',
    icon: 'home-outline' as const,
    steps: [
      "See this month's income, expense, net, savings rate, and account balances.",
      'View top expense categories for the current month.',
      'Tap Add transaction to open the transaction form.',
    ],
  },
  {
    title: 'Transactions',
    icon: 'list-outline' as const,
    steps: [
      'Use the month arrows to browse transactions by month.',
      'Tap a transaction to edit; use the trash icon to delete.',
      'Tap Add transaction at the bottom to create expense, income, or transfer.',
    ],
  },
  {
    title: 'History',
    icon: 'calendar-outline' as const,
    steps: [
      'Read-only monthly review with income, expense, and net summary.',
      'Use the month navigator to move between periods.',
    ],
  },
  {
    title: 'Calculator',
    icon: 'calculator-outline' as const,
    steps: [
      'Basic arithmetic with History toggle for past calculations.',
      'Use C to clear and ⌫ to backspace.',
    ],
  },
  {
    title: 'Settings',
    icon: 'settings-outline' as const,
    steps: [
      'Export/import XLSX, change PIN, enable biometrics, clear all data, and lock the app.',
    ],
  },
];

const createStyles = (t: AppTheme) => ({
  overlay: { flex: 1, backgroundColor: t.colors.overlay, justifyContent: 'flex-end' as const },
  card: {
    backgroundColor: t.colors.bgElevated,
    borderTopLeftRadius: t.radius.lg,
    borderTopRightRadius: t.radius.lg,
    maxHeight: '88%',
    paddingBottom: t.spacing.lg,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.lg,
    paddingBottom: t.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.headerBorder,
  },
  title: { fontSize: 22, fontWeight: '700' as const, color: t.colors.text },
  closeBtn: { padding: 4 },
  scroll: { maxHeight: 480 },
  scrollContent: { padding: t.spacing.lg, paddingBottom: t.spacing.md },
  section: { marginBottom: t.spacing.lg },
  sectionHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: t.spacing.sm, gap: t.spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '600' as const, color: t.colors.primary },
  step: { fontSize: 14, color: t.colors.textSecondary, lineHeight: 22, marginBottom: 6, marginLeft: 28 },
  doneBtn: {
    backgroundColor: t.colors.primary,
    marginHorizontal: t.spacing.lg,
    paddingVertical: 14,
    borderRadius: t.radius.sm,
    alignItems: 'center' as const,
  },
  doneBtnText: { color: t.colors.primaryText, fontSize: 16, fontWeight: '600' as const },
});

export function InstructionsModal({ visible, onClose }: InstructionsModalProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>How to use</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {SECTIONS.map((section, idx) => (
              <View key={idx} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name={section.icon} size={20} color={theme.colors.primary} />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                {section.steps.map((step, i) => (
                  <Text key={i} style={styles.step}>{step}</Text>
                ))}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
