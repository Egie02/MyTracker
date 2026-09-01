import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { runMigrations } from './src/data/db/migrate';
import { ensureDefaultAdmin } from './src/data/db/bootstrap';
import { ensurePersonalSession } from './src/auth/localSession';
import { hasPinForUser } from './src/auth/pin';
import { UnlockScreen } from './src/app/screens/UnlockScreen';
import { SetupPinScreen } from './src/app/screens/SetupPinScreen';
import { HomeScreen } from './src/app/screens/HomeScreen';
import { TransactionsScreen } from './src/app/screens/TransactionsScreen';
import { HistoryScreen } from './src/app/screens/HistoryScreen';
import { CalculatorScreen } from './src/app/screens/CalculatorScreen';
import { AccountsScreen } from './src/app/screens/AccountsScreen';
import { CategoriesScreen } from './src/app/screens/CategoriesScreen';
import { SettingsScreen } from './src/app/screens/SettingsScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/app/ThemeContext';
import { useThemedStyles } from './src/app/useThemedStyles';
import {
  DrawerOverlay,
  SwipeEdgeActivator,
  MenuButton,
} from './src/app/navigation/AppDrawer';

const Stack = createNativeStackNavigator();

function NavRefSetter({
  navRef,
  children,
}: {
  navRef: React.MutableRefObject<{ navigate: (name: string) => void } | null>;
  children: React.ReactNode;
}) {
  const navigation = useNavigation();
  useEffect(() => {
    navRef.current = navigation as { navigate: (name: string) => void };
    return () => {
      navRef.current = null;
    };
  }, [navigation, navRef]);
  return <>{children}</>;
}

function SettingsStack({ onLock, onAppReset }: { onLock: () => void; onAppReset: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain">
        {() => <SettingsScreen onLock={onLock} onAppReset={onAppReset} />}
      </Stack.Screen>
      <Stack.Screen name="ChangePin">
        {({ navigation }) => <SetupPinScreen onComplete={() => navigation.goBack()} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function AppContent({ onLock, onAppReset }: { onLock: () => void; onAppReset: () => void }) {
  const { theme, isDark } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('Home');
  const stackRef = useRef<{ navigate: (name: string) => void } | null>(null);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.bg,
      card: theme.colors.bgElevated,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <SwipeEdgeActivator onOpen={() => setDrawerOpen(true)} disabled={drawerOpen} />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.bgElevated,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.headerBorder,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: { fontWeight: '600', fontSize: 18, color: theme.colors.text },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.bg },
            headerLeft: () => <MenuButton onPress={() => setDrawerOpen(true)} />,
          }}
          screenListeners={{
            state: (e) => {
              const state = e.data.state;
              const route = state?.routes?.[state.index];
              if (route?.name) setCurrentRoute(route.name);
            },
          }}
        >
          <Stack.Screen name="Home" options={{ title: 'MYTracker' }}>
            {() => (
              <NavRefSetter navRef={stackRef}>
                <HomeScreen />
              </NavRefSetter>
            )}
          </Stack.Screen>
          <Stack.Screen name="Transactions" options={{ title: 'Transactions' }}>
            {() => (
              <NavRefSetter navRef={stackRef}>
                <TransactionsScreen />
              </NavRefSetter>
            )}
          </Stack.Screen>
          <Stack.Screen name="History" options={{ title: 'History' }}>
            {() => (
              <NavRefSetter navRef={stackRef}>
                <HistoryScreen />
              </NavRefSetter>
            )}
          </Stack.Screen>
          <Stack.Screen name="Calculator" options={{ title: 'Calculator' }}>
            {() => (
              <NavRefSetter navRef={stackRef}>
                <CalculatorScreen />
              </NavRefSetter>
            )}
          </Stack.Screen>
          <Stack.Screen name="Accounts" options={{ title: 'Accounts' }}>
            {() => (
              <NavRefSetter navRef={stackRef}>
                <AccountsScreen />
              </NavRefSetter>
            )}
          </Stack.Screen>
          <Stack.Screen name="Categories" options={{ title: 'Categories' }}>
            {() => (
              <NavRefSetter navRef={stackRef}>
                <CategoriesScreen />
              </NavRefSetter>
            )}
          </Stack.Screen>
          <Stack.Screen name="Settings" options={{ title: 'Settings' }}>
            {() => (
              <NavRefSetter navRef={stackRef}>
                <SettingsStack onLock={onLock} onAppReset={onAppReset} />
              </NavRefSetter>
            )}
          </Stack.Screen>
        </Stack.Navigator>
        <DrawerOverlay
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onNavigate={(name) => {
            stackRef.current?.navigate(name);
            setDrawerOpen(false);
          }}
          currentRoute={currentRoute}
          onLock={onLock}
        />
      </View>
    </NavigationContainer>
  );
}

function AppGate({
  gate,
  onLock,
  onAppReset,
  onUnlocked,
  onPinComplete,
}: {
  gate: 'unlock' | 'setup_pin' | 'main';
  onLock: () => void;
  onAppReset: () => void;
  onUnlocked: () => void;
  onPinComplete: () => void;
}) {
  if (gate === 'main') {
    return <AppContent onLock={onLock} onAppReset={onAppReset} />;
  }
  if (gate === 'unlock') {
    return <UnlockScreen onUnlocked={onUnlocked} />;
  }
  return <SetupPinScreen onComplete={onPinComplete} allowSkip={false} />;
}

function LoadingScreen() {
  const styles = useThemedStyles((t) => ({
    loading: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: t.colors.bg,
    },
    loadingText: { marginTop: 12, color: t.colors.textSecondary },
  }));
  const { theme } = useTheme();

  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

function AppRoot() {
  const [ready, setReady] = useState(false);
  const [gate, setGate] = useState<'loading' | 'unlock' | 'setup_pin' | 'main'>('loading');

  async function resolveGate(): Promise<'unlock' | 'setup_pin' | 'main'> {
    const session = await ensurePersonalSession();
    const hasPin = await hasPinForUser(session.userId);
    if (!hasPin) return 'setup_pin';
    return 'unlock';
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await runMigrations();
        await ensureDefaultAdmin();
        if (cancelled) return;
        const next = await resolveGate();
        setGate(next);
      } catch (e) {
        console.error('Init error', e);
        setGate('setup_pin');
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || gate === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <AppGate
      gate={gate}
      onLock={() => setGate('unlock')}
      onAppReset={() => setGate('setup_pin')}
      onUnlocked={() => setGate('main')}
      onPinComplete={() => setGate('main')}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppRoot />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
