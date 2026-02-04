/**
 * 🎨 ANKR Unified Theme Utilities
 * 
 * Problem: Each page has its own hardcoded colors
 * Solution: Centralized theme utilities that all components use
 * 
 * Usage:
 *   const styles = useThemeStyles();
 *   
 *   <div className={styles.card}>
 *     <h1 className={styles.textPrimary}>Title</h1>
 *     <p className={styles.textSecondary}>Subtitle</p>
 *   </div>
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import { useTheme } from '../contexts/ThemeContext';

/**
 * Returns consistent theme-based class names
 */
export function useThemeStyles() {
  const { theme } = useTheme();
  const isDark = theme !== 'light';

  return {
    // Mode flag
    isDark,
    
    // Backgrounds
    bgMain: isDark ? 'bg-gray-900' : 'bg-gray-50',
    bgCard: isDark ? 'bg-gray-800' : 'bg-white',
    bgCardHover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    bgInput: isDark ? 'bg-gray-700' : 'bg-gray-100',
    bgHeader: isDark ? 'bg-gray-800' : 'bg-white',
    
    // Text
    textPrimary: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-500' : 'text-gray-400',
    
    // Borders
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    borderColor: isDark ? 'border-gray-700' : 'border-gray-200',
    
    // Interactive
    buttonPrimary: 'bg-blue-500 hover:bg-blue-600 text-white',
    buttonSecondary: isDark 
      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
      : 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    buttonDanger: 'bg-red-500 hover:bg-red-600 text-white',
    buttonSuccess: 'bg-green-500 hover:bg-green-600 text-white',
    
    // Cards
    card: `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border shadow-sm`,
    cardHover: `${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'} rounded-xl border shadow-sm transition-colors`,
    
    // Inputs
    input: `${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'} rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500`,
    
    // Tables
    tableHeader: isDark ? 'bg-gray-800' : 'bg-gray-50',
    tableRow: isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50',
    
    // Status colors (these stay constant regardless of theme)
    statusPending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    statusActive: 'bg-green-500/20 text-green-500 border-green-500/30',
    statusInactive: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
    statusError: 'bg-red-500/20 text-red-500 border-red-500/30',
    statusInfo: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    
    // Badges
    badge: (color: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple' | 'orange') => {
      const colors = {
        green: 'bg-green-500/20 text-green-500',
        yellow: 'bg-yellow-500/20 text-yellow-500',
        red: 'bg-red-500/20 text-red-500',
        blue: 'bg-blue-500/20 text-blue-500',
        gray: 'bg-gray-500/20 text-gray-500',
        purple: 'bg-purple-500/20 text-purple-500',
        orange: 'bg-orange-500/20 text-orange-500',
      };
      return `${colors[color]} px-2 py-1 rounded-full text-xs font-medium`;
    },
  };
}

/**
 * CSS variables approach for more flexibility
 */
export const themeVariables = {
  light: {
    '--bg-main': '#f9fafb',
    '--bg-card': '#ffffff',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--border': '#e5e7eb',
  },
  dark: {
    '--bg-main': '#111827',
    '--bg-card': '#1f2937',
    '--text-primary': '#ffffff',
    '--text-secondary': '#9ca3af',
    '--border': '#374151',
  },
};

/**
 * Apply theme to document root
 */
export function applyThemeVariables(theme: string) {
  const vars = theme === 'light' ? themeVariables.light : themeVariables.dark;
  const root = document.documentElement;
  
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export default useThemeStyles;
