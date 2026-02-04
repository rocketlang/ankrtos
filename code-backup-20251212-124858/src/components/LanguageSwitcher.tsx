/**
 * ANKR Language Switcher - 100+ Languages
 */

import React, { useState } from 'react';
import { Globe, ChevronDown, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function LanguageSwitcher() {
  const { lang, setLang, languages, primaryLanguages, indianLanguages, currentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'indian' | 'primary'>('indian');

  const filteredLanguages = (
    tab === 'indian' ? indianLanguages :
    tab === 'primary' ? primaryLanguages :
    languages
  ).filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.nativeName.includes(search)
  );

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 
          hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{currentLanguage?.nativeName || 'English'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 
          rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          
          {/* Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 mb-2">🌍 103 Languages Supported</div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search languages..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                  rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'indian', label: '🇮🇳 Indian', count: indianLanguages.length },
              { id: 'primary', label: '⭐ Primary', count: primaryLanguages.length },
              { id: 'all', label: '🌍 All', count: languages.length },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                  tab === t.id 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          {/* Language List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredLanguages.map(l => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-gray-100 
                  dark:hover:bg-gray-700 transition-colors ${
                  lang === l.code ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                <span className="text-lg">{l.rtl ? '🔄' : ''}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{l.nativeName}</div>
                  <div className="text-xs text-gray-500">{l.name} • {l.region}</div>
                </div>
                {lang === l.code && <span className="text-green-500">✓</span>}
                {l.tier === 1 && <span className="text-xs bg-green-100 text-green-700 px-1 rounded">Full</span>}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
            <span className="text-xs text-gray-500">
              Voice AI works in all languages! 🎤
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
