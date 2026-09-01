/** Design tokens — shared across light and dark themes. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const },
  headline: { fontSize: 22, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 14, fontWeight: '600' as const },
} as const;

export interface ThemeColors {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderSubtle: string;
  primary: string;
  primaryMuted: string;
  primaryText: string;
  accent: string;
  success: string;
  danger: string;
  warning: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  pinDot: string;
  pinDotFilled: string;
  overlay: string;
  headerBorder: string;
  swipeHint: string;
  iconMuted: string;
  inputBg: string;
}

export interface AppTheme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

const darkColors: ThemeColors = {
  bg: '#0f0f1a',
  bgElevated: '#1a1a2e',
  surface: '#16213e',
  surfaceHover: '#1e2a4a',
  border: '#2a3a5c',
  borderSubtle: '#1f2d4a',
  primary: '#6366f1',
  primaryMuted: '#4f46e5',
  primaryText: '#ffffff',
  accent: '#22d3ee',
  success: '#34d399',
  danger: '#f43f5e',
  warning: '#fbbf24',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  pinDot: '#334155',
  pinDotFilled: '#6366f1',
  overlay: 'rgba(0,0,0,0.55)',
  headerBorder: '#16213e',
  swipeHint: 'rgba(99,102,241,0.45)',
  iconMuted: '#94a3b8',
  inputBg: '#16213e',
};

const lightColors: ThemeColors = {
  bg: '#f1f5f9',
  bgElevated: '#ffffff',
  surface: '#f8fafc',
  surfaceHover: '#e2e8f0',
  border: '#cbd5e1',
  borderSubtle: '#e2e8f0',
  primary: '#4f46e5',
  primaryMuted: '#6366f1',
  primaryText: '#ffffff',
  accent: '#0891b2',
  success: '#059669',
  danger: '#e11d48',
  warning: '#d97706',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  pinDot: '#cbd5e1',
  pinDotFilled: '#4f46e5',
  overlay: 'rgba(15,23,42,0.35)',
  headerBorder: '#e2e8f0',
  swipeHint: 'rgba(79,70,229,0.35)',
  iconMuted: '#64748b',
  inputBg: '#ffffff',
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: darkColors,
  spacing,
  radius,
  typography,
};

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: lightColors,
  spacing,
  radius,
  typography,
};

/** @deprecated Use useTheme() — kept for gradual migration */
export const theme = darkTheme;
