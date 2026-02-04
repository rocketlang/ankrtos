import { useState } from 'react';
import { Settings, X, Sun, Moon, Sparkles, Type, RotateCcw, Truck, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, accent, font, fontSize, fontColor, setTheme, setAccent, setFont, setFontSize, setFontColor } = useTheme();

  const themes = [
    { id: 'light', icon: Sun, label: 'Light', color: '#f3f4f6' },
    { id: 'dark', icon: Moon, label: 'Dark', color: '#1f2937' },
    { id: 'wowtruck', icon: Truck, label: 'Purple', color: '#8B5CF6' },
    { id: 'orange', icon: Zap, label: 'Orange', color: '#F97316' },
    { id: 'neon', icon: Sparkles, label: 'Neon', color: '#00ff88' },
  ] as const;

  const accents = [
    { id: 'orange', color: '#f97316', label: 'Orange' },
    { id: 'blue', color: '#3b82f6', label: 'Blue' },
    { id: 'green', color: '#22c55e', label: 'Green' },
    { id: 'purple', color: '#a855f7', label: 'Purple' },
    { id: 'red', color: '#ef4444', label: 'Red' },
    { id: 'pink', color: '#EC4899', label: 'Pink' },
  ] as const;

  const fontColors = [
    { id: 'default', color: '#888888', label: 'Auto' },
    { id: 'white', color: '#ffffff', label: 'White' },
    { id: 'gray', color: '#9ca3af', label: 'Gray' },
    { id: 'green', color: '#4ade80', label: 'Green' },
    { id: 'cyan', color: '#22d3ee', label: 'Cyan' },
    { id: 'amber', color: '#fbbf24', label: 'Amber' },
  ] as const;

  const fonts = [
    { id: 'inter', label: 'Inter' },
    { id: 'roboto', label: 'Roboto' },
    { id: 'system', label: 'System' },
  ] as const;

  const sizes = [
    { id: 'small', label: 'Small' },
    { id: 'medium', label: 'Medium' },
    { id: 'large', label: 'Large' },
  ] as const;

  const resetDefaults = () => {
    setTheme('orange');
    setAccent('orange');
    setFont('inter');
    setFontSize('medium');
    setFontColor('default');
  };

  // Get current theme color for highlights
  const getThemeAccent = () => {
    const t = themes.find(t => t.id === theme);
    return t?.color || '#f97316';
  };

  return (
    <>
      {/* Gear Icon */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 p-3 rounded-full text-white shadow-xl transition-all hover:rotate-90 duration-300 border-2"
        style={{
          zIndex: 9999,
          backgroundColor: '#1f2937',
          borderColor: getThemeAccent()
        }}
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 flex justify-end" style={{ zIndex: 99999 }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div
            className="relative w-80 overflow-y-auto shadow-2xl"
            style={{
              backgroundColor: '#111827',
              borderLeft: `2px solid ${getThemeAccent()}`,
              zIndex: 100000
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 flex items-center justify-between p-4"
              style={{
                backgroundColor: '#111827',
                borderBottom: '1px solid #374151',
                zIndex: 100001
              }}
            >
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5" style={{ color: getThemeAccent() }} /> Settings
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-800"
                style={{ color: '#9ca3af' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Theme - Now 5 options in 2 rows */}
              <div>
                <label className="text-sm font-medium text-white mb-3 block">🎨 Full Theme</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {themes.slice(0, 3).map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      style={{
                        backgroundColor: theme === t.id ? `${t.color}30` : '#1f2937',
                        borderColor: theme === t.id ? t.color : '#374151',
                        color: theme === t.id ? '#ffffff' : '#9ca3af'
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
                    >
                      <t.icon className="w-5 h-5" style={{ color: t.color }} />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {themes.slice(3).map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      style={{
                        backgroundColor: theme === t.id ? `${t.color}30` : '#1f2937',
                        borderColor: theme === t.id ? t.color : '#374151',
                        color: theme === t.id ? '#ffffff' : '#9ca3af'
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
                    >
                      <t.icon className="w-5 h-5" style={{ color: t.color }} />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="text-sm font-medium text-white mb-3 block">🌈 Accent Color</label>
                <div className="flex gap-2 flex-wrap justify-center">
                  {accents.map(a => (
                    <div key={a.id} className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => setAccent(a.id)}
                        style={{
                          backgroundColor: a.color,
                          boxShadow: accent === a.id ? `0 0 0 3px #111827, 0 0 0 5px ${a.color}` : 'none',
                          transform: accent === a.id ? 'scale(1.1)' : 'scale(1)'
                        }}
                        className="w-9 h-9 rounded-full transition-all"
                      />
                      <span style={{ color: accent === a.id ? '#ffffff' : '#6b7280', fontSize: '9px' }}>{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Font Color */}
              <div>
                <label className="text-sm font-medium text-white mb-3 block flex items-center gap-2">
                  <Type className="w-4 h-4" /> Font Color
                </label>
                <div className="flex gap-2 flex-wrap justify-center">
                  {fontColors.map(fc => (
                    <div key={fc.id} className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => setFontColor(fc.id)}
                        style={{
                          backgroundColor: fc.color,
                          boxShadow: fontColor === fc.id ? `0 0 0 3px #111827, 0 0 0 5px ${fc.color}` : 'none',
                          transform: fontColor === fc.id ? 'scale(1.1)' : 'scale(1)',
                          border: fc.id === 'white' ? '1px solid #374151' : 'none'
                        }}
                        className="w-9 h-9 rounded-full transition-all"
                      />
                      <span style={{ color: fontColor === fc.id ? '#ffffff' : '#6b7280', fontSize: '9px' }}>{fc.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="text-sm font-medium text-white mb-3 block">🔤 Font Family</label>
                <div className="grid grid-cols-3 gap-2">
                  {fonts.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFont(f.id)}
                      style={{
                        backgroundColor: font === f.id ? `${getThemeAccent()}30` : '#1f2937',
                        borderColor: font === f.id ? getThemeAccent() : '#374151',
                        color: font === f.id ? '#ffffff' : '#9ca3af'
                      }}
                      className="py-2 px-3 text-sm rounded-lg border-2 transition-all font-medium"
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-sm font-medium text-white mb-3 block">📏 Font Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {sizes.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setFontSize(s.id)}
                      style={{
                        backgroundColor: fontSize === s.id ? `${getThemeAccent()}30` : '#1f2937',
                        borderColor: fontSize === s.id ? getThemeAccent() : '#374151',
                        color: fontSize === s.id ? '#ffffff' : '#9ca3af'
                      }}
                      className="py-2 px-3 text-sm rounded-lg border-2 transition-all font-medium"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div
                className="p-4 rounded-xl"
                style={{ backgroundColor: '#1f2937', border: `1px solid ${getThemeAccent()}` }}
              >
                <p style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px' }}>Preview</p>
                <p style={{
                  fontSize: '18px',
                  color: fontColor === 'white' ? '#ffffff' :
                         fontColor === 'gray' ? '#9ca3af' :
                         fontColor === 'green' ? '#4ade80' :
                         fontColor === 'cyan' ? '#22d3ee' :
                         fontColor === 'amber' ? '#fbbf24' :
                         theme === 'neon' ? '#4ade80' : '#ffffff'
                }}>
                  The quick brown fox 🚚
                </p>
              </div>

              {/* Reset */}
              <button
                onClick={resetDefaults}
                style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#9ca3af' }}
                className="w-full py-3 text-sm border-2 rounded-xl transition-all flex items-center justify-center gap-2 hover:opacity-80"
              >
                <RotateCcw className="w-4 h-4" /> Reset to Defaults
              </button>

              {/* Credits */}
              <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-800">
                🙏 ANKR Labs | WowTruck 2.0
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
