import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { useThemedStyles } from '../useThemedStyles';

export const DRAWER_WIDTH = 300;
export const EDGE_WIDTH = 32;
const SWIPE_THRESHOLD = 48;

export const MENU_ITEMS: { name: string; label: string; icon: string }[] = [
  { name: 'Home', label: 'Dashboard', icon: 'home-outline' },
  { name: 'Transactions', label: 'Transactions', icon: 'list-outline' },
  { name: 'History', label: 'History', icon: 'calendar-outline' },
  { name: 'Calculator', label: 'Calculator', icon: 'calculator-outline' },
  { name: 'Accounts', label: 'Accounts', icon: 'wallet-outline' },
  { name: 'Categories', label: 'Categories', icon: 'pricetag-outline' },
  { name: 'Settings', label: 'Settings', icon: 'settings-outline' },
];

export function DrawerOverlay({
  visible,
  onClose,
  onNavigate,
  currentRoute,
  onLock,
}: {
  visible: boolean;
  onClose: () => void;
  onNavigate: (name: string) => void;
  currentRoute: string;
  onLock: () => void;
}) {
  const { theme } = useTheme();
  const styles = useThemedStyles((t) => ({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: t.colors.overlay },
    panel: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      width: DRAWER_WIDTH,
      backgroundColor: t.colors.bgElevated,
      borderRightWidth: 1,
      borderRightColor: t.colors.borderSubtle,
      shadowColor: '#000',
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: t.mode === 'dark' ? 0.4 : 0.12,
      shadowRadius: 12,
      elevation: 8,
    },
    header: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: 52,
      paddingBottom: t.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.headerBorder,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    title: { color: t.colors.text, fontSize: 22, fontWeight: '700' as const },
    subtitle: { color: t.colors.textSecondary, fontSize: 14, marginTop: 4 },
    hint: {
      color: t.colors.textMuted,
      fontSize: 12,
      marginTop: t.spacing.sm,
      lineHeight: 18,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: t.colors.borderSubtle,
    },
    menuScroll: { paddingVertical: t.spacing.md },
    item: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: 16,
      paddingHorizontal: t.spacing.lg,
      marginHorizontal: t.spacing.sm,
      marginVertical: 3,
      borderRadius: t.radius.md,
      gap: 16,
      minHeight: 52,
    },
    itemActive: { backgroundColor: t.colors.surface },
    itemInactive: { backgroundColor: 'transparent' },
    label: { color: t.colors.textSecondary, fontSize: 16 },
    labelActive: { color: t.colors.primary, fontWeight: '600' as const },
    iconWrap: { width: 28, alignItems: 'center' as const },
    lockBtn: {
      marginHorizontal: t.spacing.md,
      marginBottom: t.spacing.lg,
      marginTop: t.spacing.sm,
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.primary,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
    },
    lockText: { color: t.colors.primaryText, fontSize: 16, fontWeight: '600' as const },
  }));

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 14 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} pointerEvents="auto">
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
      </Animated.View>
      <Animated.View
        style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}
        pointerEvents="auto"
      >
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.title}>MYTracker</Text>
            <Text style={styles.subtitle}>Choose a section</Text>
            <Text style={styles.hint}>
              Tip: swipe from the left edge or tap ☰ to open this menu anytime.
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
            <Ionicons name="close" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
            {MENU_ITEMS.map((item) => {
              const isFocused = currentRoute === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.item, isFocused ? styles.itemActive : styles.itemInactive]}
                  onPress={() => onNavigate(item.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={isFocused ? theme.colors.primary : theme.colors.iconMuted}
                    />
                  </View>
                  <Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={styles.lockBtn}
            activeOpacity={0.85}
            onPress={() => {
              onClose();
              onLock();
            }}
          >
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primaryText} />
            <Text style={styles.lockText}>Lock app</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

export function SwipeEdgeActivator({
  onOpen,
  disabled,
}: {
  onOpen: () => void;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  const hintOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(hintOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(hintOpacity, { toValue: 0.45, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [hintOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => !disabled && evt.nativeEvent.pageX <= EDGE_WIDTH,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !disabled && gesture.moveX <= EDGE_WIDTH * 1.5 && gesture.dx > 12,
      onPanResponderRelease: (_, gesture) => {
        if (!disabled && (gesture.dx >= SWIPE_THRESHOLD || gesture.vx > 0.35)) {
          onOpen();
        }
      },
    })
  ).current;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: EDGE_WIDTH,
        zIndex: 10,
        justifyContent: 'center',
      }}
      {...panResponder.panHandlers}
      pointerEvents={disabled ? 'none' : 'box-only'}
    >
      <Animated.View
        style={{
          position: 'absolute',
          left: 4,
          top: '42%',
          width: 4,
          height: 56,
          borderRadius: 2,
          backgroundColor: theme.colors.swipeHint,
          opacity: hintOpacity,
        }}
      />
      <Animated.View style={{ position: 'absolute', left: 10, top: '44%', opacity: hintOpacity }}>
        <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
      </Animated.View>
    </View>
  );
}

export function MenuButton({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginLeft: 4,
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.75}
      accessibilityLabel="Open menu"
      accessibilityHint="Opens navigation drawer. You can also swipe from the left edge."
    >
      <Ionicons name="menu" size={22} color={theme.colors.text} />
    </TouchableOpacity>
  );
}
