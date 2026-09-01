import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';
import type { AppTheme } from '../theme';

type Op = '+' | '-' | '*' | '/';

interface HistoryEntry {
  expression: string;
  result: string;
}

const OP_SYMBOL: Record<Op, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
};

const createStyles = (t: AppTheme) => ({
  container: { flex: 1, backgroundColor: t.colors.bg },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.sm,
    paddingBottom: t.spacing.lg,
  },
  displayCard: {
    backgroundColor: t.colors.bgElevated,
    borderRadius: t.radius.xl,
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.md,
    paddingBottom: t.spacing.md,
    marginBottom: t.spacing.md,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
    minHeight: 120,
    justifyContent: 'flex-end' as const,
  },
  expressionLine: {
    color: t.colors.textMuted,
    fontSize: 18,
    fontWeight: '500' as const,
    textAlign: 'right' as const,
    marginBottom: t.spacing.xs,
    minHeight: 24,
  },
  display: {
    color: t.colors.text,
    fontSize: 48,
    fontWeight: '300' as const,
    textAlign: 'right' as const,
    letterSpacing: -0.5,
    minHeight: 56,
  },
  displaySmall: { fontSize: 36 },
  toolbar: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: t.spacing.sm,
    paddingHorizontal: 2,
  },
  toolbarLabel: { color: t.colors.textSecondary, fontSize: 13, fontWeight: '600' as const },
  historyToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
  },
  historyToggleText: { color: t.colors.textSecondary, fontSize: 13, fontWeight: '600' as const },
  modalOverlay: {
    flex: 1,
    backgroundColor: t.colors.overlay,
    justifyContent: 'flex-end' as const,
  },
  modalCard: {
    backgroundColor: t.colors.bgElevated,
    borderTopLeftRadius: t.radius.xl,
    borderTopRightRadius: t.radius.xl,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
    paddingBottom: t.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.lg,
    paddingBottom: t.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.headerBorder,
  },
  modalTitle: { color: t.colors.text, fontSize: 20, fontWeight: '700' as const },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
  },
  modalActions: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.sm,
  },
  clearHistoryText: { color: t.colors.danger, fontSize: 13, fontWeight: '600' as const },
  historyEmpty: {
    color: t.colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic' as const,
    padding: t.spacing.xl,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  historyList: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.sm },
  historyItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    paddingHorizontal: t.spacing.md,
    marginBottom: t.spacing.sm,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
  },
  historyExpr: { color: t.colors.textSecondary, fontSize: 14, flex: 1, marginRight: 12 },
  historyResult: { color: t.colors.success, fontSize: 15, fontWeight: '700' as const },
  keypad: { gap: 10 },
  row: { flexDirection: 'row' as const, gap: 10 },
  key: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 72,
    backgroundColor: t.colors.bgElevated,
    borderRadius: t.radius.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: t.colors.borderSubtle,
  },
  keyWide: { flex: 2, aspectRatio: undefined, maxHeight: 72 },
  keyFn: { backgroundColor: t.colors.surface },
  keyOp: { backgroundColor: t.colors.surface },
  keyOpActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  keyEquals: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  keyText: { color: t.colors.text, fontSize: 26, fontWeight: '500' as const },
  keyTextFn: { color: t.colors.primary, fontSize: 20, fontWeight: '600' as const },
  keyTextOp: { color: t.colors.primary, fontSize: 28, fontWeight: '500' as const },
  keyTextOpActive: { color: t.colors.primaryText },
  keyTextEquals: { color: t.colors.primaryText, fontSize: 30, fontWeight: '600' as const },
  useAmountWrap: { marginTop: t.spacing.md },
});

function formatDisplayNumber(value: string): string {
  if (!value || value === '0') return '0';
  if (value === '-' || value === '-0') return value;
  if (value.endsWith('.')) {
    const head = value.slice(0, -1);
    return head ? `${formatDisplayNumber(head)}.` : '0.';
  }
  const [intPart, decPart] = value.split('.');
  const neg = intPart.startsWith('-');
  const absInt = intPart.replace('-', '') || '0';
  const formattedInt = Number(absInt).toLocaleString();
  const body = `${neg ? '-' : ''}${formattedInt}`;
  return decPart !== undefined ? `${body}.${decPart}` : body;
}

export function CalculatorScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<{ navigate: (name: string, params?: object) => void }>();

  const [display, setDisplay] = useState('0');
  const [previous, setPrevious] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const parseDisplay = useCallback(() => parseFloat(display) || 0, [display]);

  const expressionPreview = useMemo(() => {
    if (previous === null || op === null) return '';
    return `${formatDisplayNumber(String(previous))} ${OP_SYMBOL[op]}`;
  }, [previous, op]);

  const canUseAmount = display !== '0' && !Number.isNaN(parseFloat(display));

  const handleDigit = useCallback(
    (d: string) => {
      if (display === '0' && d !== '.') {
        setDisplay(d);
        return;
      }
      if (d === '.' && display.includes('.')) return;
      if (display.replace('.', '').length >= 12) return;
      setDisplay(display === '0' && d === '.' ? '0.' : display + d);
    },
    [display]
  );

  const compute = useCallback((a: number, b: number, operator: Op): number => {
    if (operator === '+') return a + b;
    if (operator === '-') return a - b;
    if (operator === '*') return a * b;
    return b === 0 ? 0 : a / b;
  }, []);

  const handleOp = useCallback(
    (nextOp: Op) => {
      const val = parseDisplay();
      if (previous === null) {
        setPrevious(val);
        setOp(nextOp);
        setDisplay('0');
        return;
      }
      if (op !== null) {
        const result = compute(previous, val, op);
        const rounded = Math.round(result * 1e10) / 1e10;
        setPrevious(rounded);
        setDisplay('0');
        setOp(nextOp);
        return;
      }
      setPrevious(val);
      setOp(nextOp);
      setDisplay('0');
    },
    [display, previous, op, parseDisplay, compute]
  );

  const handleEquals = useCallback(() => {
    if (previous === null || op === null) return;
    const val = parseDisplay();
    const result = compute(previous, val, op);
    const out = Math.round(result * 1e10) / 1e10;
    const expr = `${formatDisplayNumber(String(previous))} ${OP_SYMBOL[op]} ${formatDisplayNumber(String(val))}`;
    setHistory((h) => [{ expression: expr, result: String(out) }, ...h].slice(0, 50));
    setDisplay(String(out));
    setPrevious(null);
    setOp(null);
  }, [display, previous, op, parseDisplay, compute]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setPrevious(null);
    setOp(null);
  }, []);

  const handleBackspace = useCallback(() => {
    setDisplay(display.length <= 1 || (display.length === 2 && display.startsWith('-')) ? '0' : display.slice(0, -1));
  }, [display]);

  const handleToggleSign = useCallback(() => {
    if (display === '0') return;
    setDisplay(display.startsWith('-') ? display.slice(1) : `-${display}`);
  }, [display]);

  const handlePercent = useCallback(() => {
    const val = parseDisplay();
    setDisplay(String(Math.round(val * 1e8) / 1e10 / 100));
  }, [parseDisplay]);

  const applyHistoryResult = useCallback((result: string) => {
    setDisplay(result);
    setPrevious(null);
    setOp(null);
    setShowHistory(false);
  }, []);

  function renderKey(
    label: string,
    onPress: () => void,
    variant: 'digit' | 'fn' | 'op' | 'equals' = 'digit',
    wide = false,
    active = false
  ) {
    const isOp = variant === 'op';
    const isEquals = variant === 'equals';
    const isFn = variant === 'fn';
    return (
      <TouchableOpacity
        key={label}
        style={[
          styles.key,
          wide && styles.keyWide,
          isFn && styles.keyFn,
          isOp && styles.keyOp,
          isOp && active && styles.keyOpActive,
          isEquals && styles.keyEquals,
        ]}
        onPress={onPress}
        activeOpacity={0.65}
      >
        {label === '⌫' ? (
          <Ionicons
            name="backspace-outline"
            size={22}
            color={isFn ? theme.colors.primary : theme.colors.text}
          />
        ) : (
          <Text
            style={[
              styles.keyText,
              isFn && styles.keyTextFn,
              isOp && styles.keyTextOp,
              isOp && active && styles.keyTextOpActive,
              isEquals && styles.keyTextEquals,
            ]}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  const displayFontStyle = display.length > 9 ? styles.displaySmall : undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.toolbar}>
        <Text style={styles.toolbarLabel}>Quick calculator</Text>
        <TouchableOpacity
          style={styles.historyToggle}
          onPress={() => setShowHistory(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.historyToggleText}>
            History{history.length > 0 ? ` (${history.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.displayCard}>
        <Text style={styles.expressionLine} numberOfLines={1}>
          {expressionPreview || ' '}
        </Text>
        <Text style={[styles.display, displayFontStyle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
          {formatDisplayNumber(display)}
        </Text>
      </View>

      <Modal visible={showHistory} animationType="slide" transparent onRequestClose={() => setShowHistory(false)}>
        <TouchableWithoutFeedback onPress={() => setShowHistory(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calculation history</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowHistory(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            {history.length > 0 && (
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setHistory([])} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.clearHistoryText}>Clear all</Text>
                </TouchableOpacity>
              </View>
            )}
            {history.length === 0 ? (
              <Text style={styles.historyEmpty}>
                No calculations yet.{'\n'}Press = to save results here, then tap a row to reuse the amount.
              </Text>
            ) : (
              <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
                {history.map((entry, i) => (
                  <TouchableOpacity
                    key={`${entry.expression}-${i}`}
                    style={styles.historyItem}
                    onPress={() => applyHistoryResult(entry.result)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.historyExpr} numberOfLines={2}>
                      {entry.expression}
                    </Text>
                    <Text style={styles.historyResult}>= {formatDisplayNumber(entry.result)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.keypad}>
        <View style={styles.row}>
          {renderKey('AC', handleClear, 'fn')}
          {renderKey('±', handleToggleSign, 'fn')}
          {renderKey('%', handlePercent, 'fn')}
          {renderKey('÷', () => handleOp('/'), 'op', false, op === '/')}
        </View>
        <View style={styles.row}>
          {renderKey('7', () => handleDigit('7'))}
          {renderKey('8', () => handleDigit('8'))}
          {renderKey('9', () => handleDigit('9'))}
          {renderKey('×', () => handleOp('*'), 'op', false, op === '*')}
        </View>
        <View style={styles.row}>
          {renderKey('4', () => handleDigit('4'))}
          {renderKey('5', () => handleDigit('5'))}
          {renderKey('6', () => handleDigit('6'))}
          {renderKey('−', () => handleOp('-'), 'op', false, op === '-')}
        </View>
        <View style={styles.row}>
          {renderKey('1', () => handleDigit('1'))}
          {renderKey('2', () => handleDigit('2'))}
          {renderKey('3', () => handleDigit('3'))}
          {renderKey('+', () => handleOp('+'), 'op', false, op === '+')}
        </View>
        <View style={styles.row}>
          {renderKey('0', () => handleDigit('0'), 'digit', true)}
          {renderKey('.', () => handleDigit('.'))}
          {renderKey('⌫', handleBackspace, 'fn')}
          {renderKey('=', handleEquals, 'equals')}
        </View>
      </View>

      {canUseAmount && (
        <View style={styles.useAmountWrap}>
          <Button
            title="Use amount in transaction"
            onPress={() =>
              navigation.navigate('Transactions', {
                openAdd: true,
                initialAmount: display.replace(/,/g, ''),
              })
            }
          />
        </View>
      )}
    </ScrollView>
  );
}
