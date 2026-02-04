export const colors = {
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceElevated: '#334155',
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: '#334155',
    borderLight: '#475569',
    card: '#1e293b',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceElevated: '#f1f5f9',
    primary: '#2563eb',
    primaryLight: '#3b82f6',
    secondary: '#7c3aed',
    accent: '#0891b2',
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    borderLight: '#cbd5e1',
    card: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const getTheme = (mode: 'dark' | 'light') => ({
  colors: colors[mode],
  spacing,
  borderRadius,
  typography,
  shadows,
});

export type Theme = ReturnType<typeof getTheme>;
export type ColorScheme = typeof colors.dark;
