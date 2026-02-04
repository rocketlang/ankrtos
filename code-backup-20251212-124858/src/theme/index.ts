// ═══════════════════════════════════════════════════════════════════════════
// WOWTRUCK 2.0 UNIFIED THEME SYSTEM
// Shared across Admin Panel, Driver App, Customer Portal
// ═══════════════════════════════════════════════════════════════════════════

export const theme = {
  // ─────────────────────────────────────────────────────────────────────────
  // BRAND COLORS
  // ─────────────────────────────────────────────────────────────────────────
  colors: {
    // Primary - Purple/Violet (brand identity)
    primary: {
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#8B5CF6', // Main brand color
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
    },
    
    // Secondary - Pink/Magenta (accent)
    secondary: {
      50: '#FDF2F8',
      100: '#FCE7F3',
      200: '#FBCFE8',
      300: '#F9A8D4',
      400: '#F472B6',
      500: '#EC4899', // Main accent
      600: '#DB2777',
      700: '#BE185D',
      800: '#9D174D',
      900: '#831843',
    },
    
    // Background - Dark theme
    background: {
      primary: '#0F0F1A',     // Deepest dark
      secondary: '#1A1A2E',   // Card backgrounds
      tertiary: '#252536',    // Elevated surfaces
      elevated: '#2D2D44',    // Modals, dropdowns
      glass: 'rgba(255,255,255,0.05)', // Glassmorphic
    },
    
    // Text
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255,255,255,0.7)',
      tertiary: 'rgba(255,255,255,0.5)',
      muted: 'rgba(255,255,255,0.3)',
    },
    
    // Status colors
    status: {
      success: '#10B981',
      warning: '#FBBF24',
      error: '#EF4444',
      info: '#3B82F6',
    },
    
    // Borders
    border: {
      default: 'rgba(255,255,255,0.08)',
      hover: 'rgba(255,255,255,0.15)',
      focus: 'rgba(139,92,246,0.5)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GRADIENTS
  // ─────────────────────────────────────────────────────────────────────────
  gradients: {
    // Main brand gradient
    brand: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    
    // Background gradients
    background: 'linear-gradient(180deg, #0F0F1A 0%, #1A1A2E 100%)',
    backgroundRadial: 'radial-gradient(ellipse at top, #1A1A2E 0%, #0F0F1A 100%)',
    
    // Card gradients
    card: 'linear-gradient(135deg, #1E1E2E 0%, #252536 100%)',
    cardHover: 'linear-gradient(135deg, #252536 0%, #2D2D44 100%)',
    
    // Header gradient
    header: 'linear-gradient(135deg, #1E1E2E 0%, #2D1B4E 100%)',
    
    // Button gradients
    buttonPrimary: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    buttonSuccess: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    buttonDanger: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    buttonInfo: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    
    // Status gradients
    success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
    error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SHADOWS
  // ─────────────────────────────────────────────────────────────────────────
  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.2)',
    md: '0 4px 16px rgba(0,0,0,0.25)',
    lg: '0 8px 32px rgba(0,0,0,0.3)',
    xl: '0 16px 48px rgba(0,0,0,0.4)',
    
    // Colored shadows
    primary: '0 4px 20px rgba(139,92,246,0.4)',
    secondary: '0 4px 20px rgba(236,72,153,0.4)',
    success: '0 4px 20px rgba(16,185,129,0.4)',
    error: '0 4px 20px rgba(239,68,68,0.4)',
    
    // Glow effects
    glow: {
      primary: '0 0 20px rgba(139,92,246,0.5)',
      success: '0 0 20px rgba(16,185,129,0.5)',
      error: '0 0 20px rgba(239,68,68,0.5)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TYPOGRAPHY
  // ─────────────────────────────────────────────────────────────────────────
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SPACING
  // ─────────────────────────────────────────────────────────────────────────
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem', // 40px
    12: '3rem',   // 48px
    16: '4rem',   // 64px
    20: '5rem',   // 80px
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BORDER RADIUS
  // ─────────────────────────────────────────────────────────────────────────
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    base: '0.5rem',   // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TRANSITIONS
  // ─────────────────────────────────────────────────────────────────────────
  transitions: {
    fast: 'all 0.15s ease',
    base: 'all 0.2s ease',
    slow: 'all 0.3s ease',
    bounce: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BREAKPOINTS
  // ─────────────────────────────────────────────────────────────────────────
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Z-INDEX
  // ─────────────────────────────────────────────────────────────────────────
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
    toast: 70,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// CSS VARIABLES GENERATOR
// ─────────────────────────────────────────────────────────────────────────

export const generateCSSVariables = (): string => `
  :root {
    /* Primary */
    --color-primary-50: ${theme.colors.primary[50]};
    --color-primary-100: ${theme.colors.primary[100]};
    --color-primary-200: ${theme.colors.primary[200]};
    --color-primary-300: ${theme.colors.primary[300]};
    --color-primary-400: ${theme.colors.primary[400]};
    --color-primary-500: ${theme.colors.primary[500]};
    --color-primary-600: ${theme.colors.primary[600]};
    --color-primary-700: ${theme.colors.primary[700]};
    --color-primary-800: ${theme.colors.primary[800]};
    --color-primary-900: ${theme.colors.primary[900]};
    
    /* Secondary */
    --color-secondary-500: ${theme.colors.secondary[500]};
    
    /* Background */
    --bg-primary: ${theme.colors.background.primary};
    --bg-secondary: ${theme.colors.background.secondary};
    --bg-tertiary: ${theme.colors.background.tertiary};
    --bg-elevated: ${theme.colors.background.elevated};
    --bg-glass: ${theme.colors.background.glass};
    
    /* Text */
    --text-primary: ${theme.colors.text.primary};
    --text-secondary: ${theme.colors.text.secondary};
    --text-tertiary: ${theme.colors.text.tertiary};
    --text-muted: ${theme.colors.text.muted};
    
    /* Status */
    --color-success: ${theme.colors.status.success};
    --color-warning: ${theme.colors.status.warning};
    --color-error: ${theme.colors.status.error};
    --color-info: ${theme.colors.status.info};
    
    /* Border */
    --border-default: ${theme.colors.border.default};
    --border-hover: ${theme.colors.border.hover};
    --border-focus: ${theme.colors.border.focus};
    
    /* Gradients */
    --gradient-brand: ${theme.gradients.brand};
    --gradient-bg: ${theme.gradients.background};
    --gradient-card: ${theme.gradients.card};
    --gradient-header: ${theme.gradients.header};
    
    /* Shadows */
    --shadow-sm: ${theme.shadows.sm};
    --shadow-md: ${theme.shadows.md};
    --shadow-lg: ${theme.shadows.lg};
    --shadow-primary: ${theme.shadows.primary};
  }
`;

// ─────────────────────────────────────────────────────────────────────────
// TAILWIND CONFIG EXTENSION
// ─────────────────────────────────────────────────────────────────────────

export const tailwindThemeExtension = {
  colors: {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    dark: {
      primary: theme.colors.background.primary,
      secondary: theme.colors.background.secondary,
      tertiary: theme.colors.background.tertiary,
      elevated: theme.colors.background.elevated,
    },
  },
  backgroundImage: {
    'gradient-brand': theme.gradients.brand,
    'gradient-bg': theme.gradients.background,
    'gradient-card': theme.gradients.card,
    'gradient-header': theme.gradients.header,
  },
  boxShadow: {
    'glow-primary': theme.shadows.glow.primary,
    'glow-success': theme.shadows.glow.success,
    'glow-error': theme.shadows.glow.error,
  },
};

export default theme;
