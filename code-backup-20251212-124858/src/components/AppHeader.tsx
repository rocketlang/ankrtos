/**
 * App Header with Language Switcher
 * Shows WowTruck branding and language selector
 */
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  
  const bg = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const border = theme === 'dark' ? 'border-gray-800' : 'border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';

  const today = new Date().toLocaleDateString('en-IN', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });

  return (
    <header className={`${bg} border-b ${border} px-4 py-2 flex items-center justify-between`}>
      {/* Left: Menu toggle (for mobile) */}
      <button className="lg:hidden p-2 rounded-lg hover:bg-gray-700">
        <span className="text-xl">☰</span>
      </button>

      {/* Center: Branding */}
      <div className="flex items-center gap-2">
        <span className="text-xl">🚛</span>
        <span className={`font-bold ${text}`}>WowTruck</span>
        <span className="text-xs text-orange-500 font-semibold">2.0</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Date */}
        <span className="hidden sm:block text-sm text-gray-400">{today}</span>
        
        {/* Language Switcher */}
        <LanguageSwitcher />
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-700 transition"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
