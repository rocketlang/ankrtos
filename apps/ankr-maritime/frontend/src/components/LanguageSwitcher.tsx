import { useTranslation } from 'react-i18next';
import { languages } from '../i18n/config';
import { useState, useEffect } from 'react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLang(lng);
      // Update HTML dir attribute for RTL support
      const lang = languages.find(l => l.code === lng);
      document.documentElement.dir = lang?.rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const handleChange = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
  };

  const currentLanguage = languages.find(l => l.code === currentLang);

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm text-maritime-300 hover:text-white bg-maritime-800 hover:bg-maritime-700 rounded border border-maritime-700 transition-colors"
        title="Change Language"
      >
        <span className="text-lg">{currentLanguage?.code === 'en' ? '🇬🇧' :
          currentLanguage?.code === 'el' ? '🇬🇷' :
          currentLanguage?.code === 'no' ? '🇳🇴' :
          currentLanguage?.code === 'zh' ? '🇨🇳' :
          currentLanguage?.code === 'ja' ? '🇯🇵' :
          currentLanguage?.code === 'hi' ? '🇮🇳' :
          currentLanguage?.code === 'ko' ? '🇰🇷' :
          currentLanguage?.code === 'ar' ? '🇸🇦' : '🌐'}</span>
        <span className="hidden md:inline">{currentLanguage?.nativeName}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-56 bg-maritime-800 border border-maritime-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                currentLang === lang.code
                  ? 'bg-blue-900/30 text-blue-400'
                  : 'text-maritime-300 hover:bg-maritime-700 hover:text-white'
              }`}
            >
              <span className="text-xl">
                {lang.code === 'en' ? '🇬🇧' :
                 lang.code === 'el' ? '🇬🇷' :
                 lang.code === 'no' ? '🇳🇴' :
                 lang.code === 'zh' ? '🇨🇳' :
                 lang.code === 'ja' ? '🇯🇵' :
                 lang.code === 'hi' ? '🇮🇳' :
                 lang.code === 'ko' ? '🇰🇷' :
                 lang.code === 'ar' ? '🇸🇦' : '🌐'}
              </span>
              <div className="flex-1">
                <div className="font-medium">{lang.nativeName}</div>
                <div className="text-xs text-maritime-500">{lang.name}</div>
              </div>
              {currentLang === lang.code && (
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Language Settings Footer */}
        <div className="border-t border-maritime-700 px-4 py-2 text-xs text-maritime-500">
          <div className="flex items-center justify-between">
            <span>Auto-detect</span>
            <span className="text-maritime-400">{navigator.language}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
