/**
 * 🎨 ThemeSwitcher v2 - All 10 Themes
 */
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronDown, Check } from 'lucide-react';

const themes = [
  { id: 'light', name: 'Light', nameHindi: 'लाइट', icon: '☀️', colors: ['#f8fafc', '#3b82f6'] },
  { id: 'dark', name: 'Dark', nameHindi: 'डार्क', icon: '🌙', colors: ['#0f172a', '#3b82f6'] },
  { id: 'neon', name: 'Neon', nameHindi: 'नियॉन', icon: '💚', colors: ['#0a0a0a', '#00ff88'] },
  { id: 'wowtruck', name: 'WowTruck', nameHindi: 'वाउट्रक', icon: '💜', colors: ['#0f0f1a', '#ff6b35'] },
  { id: 'orange', name: 'Orange', nameHindi: 'नारंगी', icon: '🧡', colors: ['#1c1917', '#fb923c'] },
  { id: 'ocean', name: 'Ocean', nameHindi: 'समुद्र', icon: '🌊', colors: ['#0c4a6e', '#38bdf8'] },
  { id: 'forest', name: 'Forest', nameHindi: 'जंगल', icon: '🌲', colors: ['#14532d', '#4ade80'] },
  { id: 'sunset', name: 'Sunset', nameHindi: 'सूर्यास्त', icon: '🌅', colors: ['#7c2d12', '#fb923c'] },
  { id: 'midnight', name: 'Midnight', nameHindi: 'मध्यरात्रि', icon: '🌌', colors: ['#020617', '#6366f1'] },
  { id: 'corporate', name: 'Corporate', nameHindi: 'कॉर्पोरेट', icon: '🏢', colors: ['#1e3a5f', '#3b82f6'] },
];

interface ThemeSwitcherProps {
  position?: 'inline' | 'dropdown';
  compact?: boolean;
  showLabel?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  position = 'dropdown',
  compact = false,
  showLabel = true 
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const changeTheme = (themeId: string) => {
    setTheme(themeId as any);
    setIsOpen(false);
  };

  const current = themes.find(t => t.id === theme) || themes[4];

  const dropdownBg = isDark ? 'bg-gray-800' : 'bg-white';
  const dropdownBorder = isDark ? 'border-gray-700' : 'border-gray-200';
  const dropdownText = isDark ? 'text-white' : 'text-gray-900';
  const dropdownSubtext = isDark ? 'text-gray-400' : 'text-gray-500';
  const hoverBg = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
          isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
        }`}
        title="Change Theme"
      >
        <span className="text-lg">{current.icon}</span>
        {showLabel && <span className={`text-sm ${dropdownText}`}>{current.name}</span>}
        <ChevronDown className={`w-4 h-4 ${dropdownSubtext}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={`absolute right-0 top-12 z-50 ${dropdownBg} rounded-xl shadow-2xl border ${dropdownBorder} p-2 min-w-[200px] max-h-[400px] overflow-y-auto`}>
            <div className={`px-2 py-1 text-xs font-semibold ${dropdownSubtext} border-b ${dropdownBorder} mb-2`}>
              🎨 Select Theme
            </div>
            
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => changeTheme(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${hoverBg} ${
                  theme === t.id ? (isDark ? 'bg-gray-700' : 'bg-gray-200') : ''
                }`}
              >
                <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.colors[0] }} />
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.colors[1] }} />
                </div>
                <div className="flex-1 text-left">
                  <span className={`text-sm ${dropdownText}`}>{t.name}</span>
                  <span className={`text-xs ml-2 ${dropdownSubtext}`}>{t.nameHindi}</span>
                </div>
                {theme === t.id && <Check className="w-4 h-4 text-green-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
