import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'neon' | 'wowtruck' | 'orange';
type AccentColor = 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'pink';
type FontFamily = 'inter' | 'roboto' | 'system';
type FontSize = 'small' | 'medium' | 'large';
type FontColor = 'default' | 'white' | 'gray' | 'green' | 'cyan' | 'amber';

interface ThemeConfig {
  theme: Theme;
  accent: AccentColor;
  font: FontFamily;
  fontSize: FontSize;
  fontColor: FontColor;
}

interface ThemeContextType extends ThemeConfig {
  setTheme: (theme: Theme) => void;
  setAccent: (accent: AccentColor) => void;
  setFont: (font: FontFamily) => void;
  setFontSize: (size: FontSize) => void;
  setFontColor: (color: FontColor) => void;
}

const defaultConfig: ThemeConfig = {
  theme: 'orange',  // WowTruck default
  accent: 'orange',
  font: 'inter',
  fontSize: 'medium',
  fontColor: 'default'
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('ankr-theme');
    try {
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    } catch {
      localStorage.removeItem('ankr-theme');
      return defaultConfig;
    }
  });

  useEffect(() => {
    localStorage.setItem('ankr-theme', JSON.stringify(config));
    
    // Apply theme via data-theme attribute (for CSS variables)
    document.documentElement.setAttribute('data-theme', config.theme);
    
    // Also apply class for backward compatibility
    document.documentElement.classList.remove('light', 'dark', 'neon', 'wowtruck', 'orange');
    document.documentElement.classList.add(config.theme);
    
    // Apply accent color class
    document.documentElement.classList.remove('accent-orange', 'accent-blue', 'accent-green', 'accent-purple', 'accent-red', 'accent-pink');
    document.documentElement.classList.add(`accent-${config.accent}`);
    
    // Apply font family
    const fontMap = {
      inter: "'Inter', sans-serif",
      roboto: "'Roboto', sans-serif",
      system: "system-ui, sans-serif"
    };
    document.documentElement.style.fontFamily = fontMap[config.font];
    
    // Apply font size
    const sizeMap = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.fontSize = sizeMap[config.fontSize];
    
  }, [config]);

  return (
    <ThemeContext.Provider value={{
      ...config,
      setTheme: (theme) => setConfig(c => ({ ...c, theme })),
      setAccent: (accent) => setConfig(c => ({ ...c, accent })),
      setFont: (font) => setConfig(c => ({ ...c, font })),
      setFontSize: (fontSize) => setConfig(c => ({ ...c, fontSize })),
      setFontColor: (fontColor) => setConfig(c => ({ ...c, fontColor })),
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};

// Helper hook to get text color class based on fontColor setting
export const useTextColor = () => {
  const { theme, fontColor } = useTheme();
  
  if (fontColor === 'default') {
    const themeColors: Record<Theme, { primary: string; secondary: string; muted: string }> = {
      light: { primary: 'text-gray-900', secondary: 'text-gray-500', muted: 'text-gray-400' },
      dark: { primary: 'text-white', secondary: 'text-gray-400', muted: 'text-gray-500' },
      neon: { primary: 'text-green-400', secondary: 'text-green-600', muted: 'text-green-700' },
      wowtruck: { primary: 'text-white', secondary: 'text-purple-300', muted: 'text-purple-400' },
      orange: { primary: 'text-white', secondary: 'text-orange-200', muted: 'text-orange-300' },
    };
    return themeColors[theme];
  }
  
  const colorMap = {
    white: { primary: 'text-white', secondary: 'text-gray-300', muted: 'text-gray-400' },
    gray: { primary: 'text-gray-300', secondary: 'text-gray-400', muted: 'text-gray-500' },
    green: { primary: 'text-green-400', secondary: 'text-green-500', muted: 'text-green-600' },
    cyan: { primary: 'text-cyan-400', secondary: 'text-cyan-500', muted: 'text-cyan-600' },
    amber: { primary: 'text-amber-400', secondary: 'text-amber-500', muted: 'text-amber-600' },
  };
  return colorMap[fontColor] || colorMap.white;
};

// Helper to get background colors based on theme
export const useBackgroundColor = () => {
  const { theme } = useTheme();
  
  const bgColors: Record<Theme, { primary: string; secondary: string; card: string }> = {
    light: { primary: 'bg-white', secondary: 'bg-gray-100', card: 'bg-white' },
    dark: { primary: 'bg-gray-900', secondary: 'bg-gray-800', card: 'bg-gray-800' },
    neon: { primary: 'bg-black', secondary: 'bg-gray-950', card: 'bg-gray-950' },
    wowtruck: { primary: 'bg-[#0F0F1A]', secondary: 'bg-[#1A1A2E]', card: 'bg-[#252536]' },
    orange: { primary: 'bg-[#0F172A]', secondary: 'bg-[#1E293B]', card: 'bg-[#334155]' },
  };
  return bgColors[theme];
};
