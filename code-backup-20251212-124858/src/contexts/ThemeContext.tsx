/**
 * 🎨 ANKR Theme System v2 - Enhanced
 * 
 * Features:
 * - 10 preset themes (light, dark, neon, wowtruck, orange, ocean, forest, sunset, midnight, corporate)
 * - Custom background color picker
 * - Custom accent color picker  
 * - 6 font families including Hindi support
 * - Auto-contrast text colors
 * - Accessibility compliant
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Theme = 'light' | 'dark' | 'neon' | 'wowtruck' | 'orange' | 'ocean' | 'forest' | 'sunset' | 'midnight' | 'corporate' | 'custom';
type AccentColor = 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'pink' | 'cyan' | 'amber' | 'emerald' | 'rose';
type FontFamily = 'inter' | 'roboto' | 'poppins' | 'nunito' | 'jetbrains' | 'noto' | 'system';
type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

interface CustomColors {
  background: string;
  surface: string;
  card: string;
  accent: string;
}

interface ThemeConfig {
  theme: Theme;
  accent: AccentColor;
  font: FontFamily;
  fontSize: FontSize;
  customColors: CustomColors;
  highContrast: boolean;
}

interface ThemeColors {
  bg: {
    primary: string;
    secondary: string;
    card: string;
    hover: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  border: string;
  accent: string;
}

interface ThemeContextType extends ThemeConfig {
  setTheme: (theme: Theme) => void;
  setAccent: (accent: AccentColor) => void;
  setFont: (font: FontFamily) => void;
  setFontSize: (size: FontSize) => void;
  setCustomColors: (colors: Partial<CustomColors>) => void;
  setHighContrast: (enabled: boolean) => void;
  colors: ThemeColors;
  isDark: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// THEME DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const THEME_COLORS: Record<Exclude<Theme, 'custom'>, ThemeColors> = {
  light: {
    bg: { primary: '#f8fafc', secondary: '#f1f5f9', card: '#ffffff', hover: '#e2e8f0' },
    text: { primary: '#1e293b', secondary: '#64748b', muted: '#94a3b8', inverse: '#ffffff' },
    border: '#e2e8f0',
    accent: '#f97316',
  },
  dark: {
    bg: { primary: '#0f172a', secondary: '#1e293b', card: '#334155', hover: '#475569' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b', inverse: '#0f172a' },
    border: '#334155',
    accent: '#f97316',
  },
  neon: {
    bg: { primary: '#0a0a0a', secondary: '#141414', card: '#1a1a2e', hover: '#252540' },
    text: { primary: '#00ff88', secondary: '#00cc6a', muted: '#009950', inverse: '#0a0a0a' },
    border: '#00ff8840',
    accent: '#00ff88',
  },
  wowtruck: {
    bg: { primary: '#0f0f1a', secondary: '#1a1a2e', card: '#252547', hover: '#2f2f5a' },
    text: { primary: '#ffffff', secondary: '#a78bfa', muted: '#7c3aed', inverse: '#0f0f1a' },
    border: '#3f3f6f',
    accent: '#ff6b35',
  },
  orange: {
    bg: { primary: '#1c1917', secondary: '#292524', card: '#44403c', hover: '#57534e' },
    text: { primary: '#fafaf9', secondary: '#d6d3d1', muted: '#a8a29e', inverse: '#1c1917' },
    border: '#57534e',
    accent: '#fb923c',
  },
  ocean: {
    bg: { primary: '#0c4a6e', secondary: '#075985', card: '#0369a1', hover: '#0284c7' },
    text: { primary: '#e0f2fe', secondary: '#bae6fd', muted: '#7dd3fc', inverse: '#0c4a6e' },
    border: '#0284c7',
    accent: '#38bdf8',
  },
  forest: {
    bg: { primary: '#14532d', secondary: '#166534', card: '#15803d', hover: '#16a34a' },
    text: { primary: '#dcfce7', secondary: '#bbf7d0', muted: '#86efac', inverse: '#14532d' },
    border: '#22c55e',
    accent: '#4ade80',
  },
  sunset: {
    bg: { primary: '#7c2d12', secondary: '#9a3412', card: '#c2410c', hover: '#ea580c' },
    text: { primary: '#ffedd5', secondary: '#fed7aa', muted: '#fdba74', inverse: '#7c2d12' },
    border: '#f97316',
    accent: '#fb923c',
  },
  midnight: {
    bg: { primary: '#020617', secondary: '#0f172a', card: '#1e293b', hover: '#334155' },
    text: { primary: '#e2e8f0', secondary: '#cbd5e1', muted: '#94a3b8', inverse: '#020617' },
    border: '#1e293b',
    accent: '#6366f1',
  },
  corporate: {
    bg: { primary: '#1e3a5f', secondary: '#234b73', card: '#2c5a87', hover: '#35699b' },
    text: { primary: '#f0f9ff', secondary: '#e0f2fe', muted: '#bae6fd', inverse: '#1e3a5f' },
    border: '#3b82f6',
    accent: '#3b82f6',
  },
};

const ACCENT_COLORS: Record<AccentColor, string> = {
  orange: '#f97316',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  red: '#ef4444',
  pink: '#ec4899',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  emerald: '#10b981',
  rose: '#f43f5e',
};

const FONT_FAMILIES: Record<FontFamily, string> = {
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  poppins: "'Poppins', sans-serif",
  nunito: "'Nunito', sans-serif",
  jetbrains: "'JetBrains Mono', monospace",
  noto: "'Noto Sans Devanagari', 'Noto Sans', sans-serif",
  system: "system-ui, -apple-system, sans-serif",
};

const FONT_SIZES: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
  xlarge: '20px',
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate relative luminance of a color
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Get contrast color (black or white) based on background
 */
function getContrastColor(bgColor: string): string {
  const luminance = getLuminance(bgColor);
  return luminance > 0.5 ? '#1e293b' : '#f1f5f9';
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
function meetsContrastRatio(fg: string, bg: string): boolean {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return ratio >= 4.5; // WCAG AA for normal text
}

/**
 * Darken or lighten a color
 */
function adjustColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const adjust = (v: number) => Math.max(0, Math.min(255, v + amount));
  const r = adjust(rgb.r).toString(16).padStart(2, '0');
  const g = adjust(rgb.g).toString(16).padStart(2, '0');
  const b = adjust(rgb.b).toString(16).padStart(2, '0');
  
  return `#${r}${g}${b}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const defaultCustomColors: CustomColors = {
  background: '#1e293b',
  surface: '#334155',
  card: '#475569',
  accent: '#f97316',
};

const defaultConfig: ThemeConfig = {
  theme: 'wowtruck',
  accent: 'orange',
  font: 'inter',
  fontSize: 'medium',
  customColors: defaultCustomColors,
  highContrast: false,
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('ankr-theme-v2');
    try {
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    } catch {
      localStorage.removeItem('ankr-theme-v2');
      return defaultConfig;
    }
  });

  // Calculate current colors based on theme
  const colors: ThemeColors = (() => {
    if (config.theme === 'custom') {
      const { background, surface, card, accent } = config.customColors;
      const textColor = getContrastColor(background);
      const textSecondary = adjustColor(textColor, textColor === '#f1f5f9' ? -60 : 60);
      
      return {
        bg: {
          primary: background,
          secondary: surface,
          card: card,
          hover: adjustColor(card, 20),
        },
        text: {
          primary: textColor,
          secondary: textSecondary,
          muted: adjustColor(textSecondary, textColor === '#f1f5f9' ? -40 : 40),
          inverse: background,
        },
        border: adjustColor(surface, 30),
        accent: accent,
      };
    }
    
    const baseColors = THEME_COLORS[config.theme];
    return {
      ...baseColors,
      accent: ACCENT_COLORS[config.accent],
    };
  })();

  const isDark = getLuminance(colors.bg.primary) < 0.5;

  useEffect(() => {
    localStorage.setItem('ankr-theme-v2', JSON.stringify(config));

    // Apply to document
    document.documentElement.setAttribute('data-theme', config.theme);
    
    // Remove old theme classes
    const themeClasses = ['light', 'dark', 'neon', 'wowtruck', 'orange', 'ocean', 'forest', 'sunset', 'midnight', 'corporate', 'custom'];
    document.documentElement.classList.remove(...themeClasses);
    document.documentElement.classList.add(config.theme);
    
    // Apply dark/light class for Tailwind
    document.documentElement.classList.remove('dark-mode', 'light-mode');
    document.documentElement.classList.add(isDark ? 'dark-mode' : 'light-mode');

    // Apply CSS variables for components that use them
    document.documentElement.style.setProperty('--bg-primary', colors.bg.primary);
    document.documentElement.style.setProperty('--bg-secondary', colors.bg.secondary);
    document.documentElement.style.setProperty('--bg-card', colors.bg.card);
    document.documentElement.style.setProperty('--bg-hover', colors.bg.hover);
    document.documentElement.style.setProperty('--text-primary', colors.text.primary);
    document.documentElement.style.setProperty('--text-secondary', colors.text.secondary);
    document.documentElement.style.setProperty('--text-muted', colors.text.muted);
    document.documentElement.style.setProperty('--border-color', colors.border);
    document.documentElement.style.setProperty('--accent-color', colors.accent);

    // Apply font
    document.documentElement.style.fontFamily = FONT_FAMILIES[config.font];
    document.documentElement.style.fontSize = FONT_SIZES[config.fontSize];

    // High contrast mode
    if (config.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

  }, [config, colors, isDark]);

  const contextValue: ThemeContextType = {
    ...config,
    colors,
    isDark,
    setTheme: (theme) => setConfig(c => ({ ...c, theme })),
    setAccent: (accent) => setConfig(c => ({ ...c, accent })),
    setFont: (font) => setConfig(c => ({ ...c, font })),
    setFontSize: (fontSize) => setConfig(c => ({ ...c, fontSize })),
    setCustomColors: (customColors) => setConfig(c => ({ 
      ...c, 
      customColors: { ...c.customColors, ...customColors },
      theme: 'custom' 
    })),
    setHighContrast: (highContrast) => setConfig(c => ({ ...c, highContrast })),
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};

/**
 * Get Tailwind-compatible class names for current theme
 */
export const useThemeClasses = () => {
  const { colors, isDark } = useTheme();
  
  return {
    // Backgrounds
    bgPrimary: `bg-[${colors.bg.primary}]`,
    bgSecondary: `bg-[${colors.bg.secondary}]`,
    bgCard: `bg-[${colors.bg.card}]`,
    bgHover: `hover:bg-[${colors.bg.hover}]`,
    
    // Text
    textPrimary: `text-[${colors.text.primary}]`,
    textSecondary: `text-[${colors.text.secondary}]`,
    textMuted: `text-[${colors.text.muted}]`,
    
    // Border
    border: `border-[${colors.border}]`,
    
    // Accent
    accent: `text-[${colors.accent}]`,
    bgAccent: `bg-[${colors.accent}]`,
    
    // Utility
    isDark,
  };
};

/**
 * Get inline styles for current theme (for dynamic styling)
 */
export const useThemeStyles = () => {
  const { colors, isDark } = useTheme();
  
  return {
    colors,
    isDark,
    
    // Pre-built style objects
    container: {
      backgroundColor: colors.bg.primary,
      color: colors.text.primary,
    },
    card: {
      backgroundColor: colors.bg.card,
      borderColor: colors.border,
      color: colors.text.primary,
    },
    input: {
      backgroundColor: colors.bg.secondary,
      borderColor: colors.border,
      color: colors.text.primary,
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// THEME PICKER COMPONENT DATA
// ═══════════════════════════════════════════════════════════════════════════

export const AVAILABLE_THEMES: { id: Theme; name: string; nameHindi: string; preview: string }[] = [
  { id: 'light', name: 'Light', nameHindi: 'लाइट', preview: '#f8fafc' },
  { id: 'dark', name: 'Dark', nameHindi: 'डार्क', preview: '#0f172a' },
  { id: 'neon', name: 'Neon', nameHindi: 'नियॉन', preview: '#00ff88' },
  { id: 'wowtruck', name: 'WowTruck', nameHindi: 'वाउट्रक', preview: '#ff6b35' },
  { id: 'orange', name: 'Orange', nameHindi: 'नारंगी', preview: '#fb923c' },
  { id: 'ocean', name: 'Ocean', nameHindi: 'समुद्र', preview: '#0c4a6e' },
  { id: 'forest', name: 'Forest', nameHindi: 'जंगल', preview: '#14532d' },
  { id: 'sunset', name: 'Sunset', nameHindi: 'सूर्यास्त', preview: '#7c2d12' },
  { id: 'midnight', name: 'Midnight', nameHindi: 'मध्यरात्रि', preview: '#020617' },
  { id: 'corporate', name: 'Corporate', nameHindi: 'कॉर्पोरेट', preview: '#1e3a5f' },
  { id: 'custom', name: 'Custom', nameHindi: 'कस्टम', preview: 'linear-gradient(45deg, #f97316, #8b5cf6)' },
];

export const AVAILABLE_ACCENTS: { id: AccentColor; name: string; color: string }[] = [
  { id: 'orange', name: 'Orange', color: '#f97316' },
  { id: 'blue', name: 'Blue', color: '#3b82f6' },
  { id: 'green', name: 'Green', color: '#22c55e' },
  { id: 'purple', name: 'Purple', color: '#a855f7' },
  { id: 'red', name: 'Red', color: '#ef4444' },
  { id: 'pink', name: 'Pink', color: '#ec4899' },
  { id: 'cyan', name: 'Cyan', color: '#06b6d4' },
  { id: 'amber', name: 'Amber', color: '#f59e0b' },
  { id: 'emerald', name: 'Emerald', color: '#10b981' },
  { id: 'rose', name: 'Rose', color: '#f43f5e' },
];

export const AVAILABLE_FONTS: { id: FontFamily; name: string; sample: string }[] = [
  { id: 'inter', name: 'Inter', sample: 'Modern & Clean' },
  { id: 'roboto', name: 'Roboto', sample: 'Google Standard' },
  { id: 'poppins', name: 'Poppins', sample: 'Friendly & Round' },
  { id: 'nunito', name: 'Nunito', sample: 'Soft & Readable' },
  { id: 'jetbrains', name: 'JetBrains Mono', sample: 'Code Style' },
  { id: 'noto', name: 'Noto Sans', sample: 'हिंदी Support' },
  { id: 'system', name: 'System', sample: 'Native Look' },
];

export default ThemeProvider;

// ═══════════════════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const useTextColor = () => {
  const { colors } = useTheme();
  return {
    primary: colors.text.primary,
    secondary: colors.text.secondary,
    muted: colors.text.muted,
  };
};

export const useBackgroundColor = () => {
  const { colors } = useTheme();
  return {
    primary: colors.bg.primary,
    secondary: colors.bg.secondary,
    card: colors.bg.card,
  };
};
