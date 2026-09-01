import * as SecureStore from 'expo-secure-store';

const THEME_MODE_KEY = 'ui_theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

export async function getThemeMode(): Promise<ThemeMode> {
  const value = await SecureStore.getItemAsync(THEME_MODE_KEY);
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return 'system';
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await SecureStore.setItemAsync(THEME_MODE_KEY, mode);
}
