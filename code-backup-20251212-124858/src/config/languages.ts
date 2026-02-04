/**
 * ANKR LABS - 100+ LANGUAGE SUPPORT
 * "We're building ACCESS to AI for 7 billion humans."
 */

export interface LanguageConfig {
  code: string;
  bcp47: string;
  name: string;
  nativeName: string;
  region?: string;
  rtl?: boolean;
  tier: 1 | 2 | 3;
}

export const ANKR_LANGUAGES: LanguageConfig[] = [
  // TIER 1: FULL SUPPORT - Indian Languages
  { code: 'hi', bcp47: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', region: 'India', tier: 1 },
  { code: 'bn', bcp47: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', region: 'India', tier: 1 },
  { code: 'te', bcp47: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', region: 'India', tier: 1 },
  { code: 'mr', bcp47: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', region: 'India', tier: 1 },
  { code: 'ta', bcp47: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', region: 'India', tier: 1 },
  { code: 'gu', bcp47: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'India', tier: 1 },
  { code: 'kn', bcp47: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'India', tier: 1 },
  { code: 'ml', bcp47: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', region: 'India', tier: 1 },
  { code: 'pa', bcp47: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'India', tier: 1 },
  { code: 'or', bcp47: 'or-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', region: 'India', tier: 1 },
  { code: 'as', bcp47: 'as-IN', name: 'Assamese', nativeName: 'অসমীয়া', region: 'India', tier: 1 },
  { code: 'ur', bcp47: 'ur-IN', name: 'Urdu', nativeName: 'اردو', region: 'India', rtl: true, tier: 1 },
  // TIER 1: Major World Languages
  { code: 'en', bcp47: 'en-US', name: 'English', nativeName: 'English', region: 'Global', tier: 1 },
  { code: 'es', bcp47: 'es-ES', name: 'Spanish', nativeName: 'Español', region: 'Global', tier: 1 },
  { code: 'zh', bcp47: 'zh-CN', name: 'Chinese', nativeName: '中文', region: 'China', tier: 1 },
  { code: 'ar', bcp47: 'ar-SA', name: 'Arabic', nativeName: 'العربية', region: 'Middle East', rtl: true, tier: 1 },
  { code: 'pt', bcp47: 'pt-BR', name: 'Portuguese', nativeName: 'Português', region: 'Brazil', tier: 1 },
  { code: 'ru', bcp47: 'ru-RU', name: 'Russian', nativeName: 'Русский', region: 'Russia', tier: 1 },
  { code: 'ja', bcp47: 'ja-JP', name: 'Japanese', nativeName: '日本語', region: 'Japan', tier: 1 },
  { code: 'de', bcp47: 'de-DE', name: 'German', nativeName: 'Deutsch', region: 'Germany', tier: 1 },
  { code: 'fr', bcp47: 'fr-FR', name: 'French', nativeName: 'Français', region: 'France', tier: 1 },
  { code: 'ko', bcp47: 'ko-KR', name: 'Korean', nativeName: '한국어', region: 'Korea', tier: 1 },
  { code: 'it', bcp47: 'it-IT', name: 'Italian', nativeName: 'Italiano', region: 'Italy', tier: 1 },
  { code: 'tr', bcp47: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe', region: 'Turkey', tier: 1 },
  { code: 'vi', bcp47: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Vietnam', tier: 1 },
  { code: 'th', bcp47: 'th-TH', name: 'Thai', nativeName: 'ไทย', region: 'Thailand', tier: 1 },
  { code: 'id', bcp47: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'Indonesia', tier: 1 },
  { code: 'ms', bcp47: 'ms-MY', name: 'Malay', nativeName: 'Bahasa Melayu', region: 'Malaysia', tier: 1 },
  { code: 'fil', bcp47: 'fil-PH', name: 'Filipino', nativeName: 'Filipino', region: 'Philippines', tier: 1 },
  // TIER 2: VOICE SUPPORT
  { code: 'ne', bcp47: 'ne-NP', name: 'Nepali', nativeName: 'नेपाली', region: 'Nepal', tier: 2 },
  { code: 'si', bcp47: 'si-LK', name: 'Sinhala', nativeName: 'සිංහල', region: 'Sri Lanka', tier: 2 },
  { code: 'my', bcp47: 'my-MM', name: 'Burmese', nativeName: 'မြန်မာ', region: 'Myanmar', tier: 2 },
  { code: 'nl', bcp47: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands', region: 'Netherlands', tier: 2 },
  { code: 'pl', bcp47: 'pl-PL', name: 'Polish', nativeName: 'Polski', region: 'Poland', tier: 2 },
  { code: 'uk', bcp47: 'uk-UA', name: 'Ukrainian', nativeName: 'Українська', region: 'Ukraine', tier: 2 },
  { code: 'cs', bcp47: 'cs-CZ', name: 'Czech', nativeName: 'Čeština', region: 'Czechia', tier: 2 },
  { code: 'el', bcp47: 'el-GR', name: 'Greek', nativeName: 'Ελληνικά', region: 'Greece', tier: 2 },
  { code: 'hu', bcp47: 'hu-HU', name: 'Hungarian', nativeName: 'Magyar', region: 'Hungary', tier: 2 },
  { code: 'ro', bcp47: 'ro-RO', name: 'Romanian', nativeName: 'Română', region: 'Romania', tier: 2 },
  { code: 'sv', bcp47: 'sv-SE', name: 'Swedish', nativeName: 'Svenska', region: 'Sweden', tier: 2 },
  { code: 'da', bcp47: 'da-DK', name: 'Danish', nativeName: 'Dansk', region: 'Denmark', tier: 2 },
  { code: 'fi', bcp47: 'fi-FI', name: 'Finnish', nativeName: 'Suomi', region: 'Finland', tier: 2 },
  { code: 'no', bcp47: 'nb-NO', name: 'Norwegian', nativeName: 'Norsk', region: 'Norway', tier: 2 },
  { code: 'sk', bcp47: 'sk-SK', name: 'Slovak', nativeName: 'Slovenčina', region: 'Slovakia', tier: 2 },
  { code: 'bg', bcp47: 'bg-BG', name: 'Bulgarian', nativeName: 'Български', region: 'Bulgaria', tier: 2 },
  { code: 'hr', bcp47: 'hr-HR', name: 'Croatian', nativeName: 'Hrvatski', region: 'Croatia', tier: 2 },
  { code: 'sr', bcp47: 'sr-RS', name: 'Serbian', nativeName: 'Српски', region: 'Serbia', tier: 2 },
  { code: 'sl', bcp47: 'sl-SI', name: 'Slovenian', nativeName: 'Slovenščina', region: 'Slovenia', tier: 2 },
  { code: 'et', bcp47: 'et-EE', name: 'Estonian', nativeName: 'Eesti', region: 'Estonia', tier: 2 },
  { code: 'lv', bcp47: 'lv-LV', name: 'Latvian', nativeName: 'Latviešu', region: 'Latvia', tier: 2 },
  { code: 'lt', bcp47: 'lt-LT', name: 'Lithuanian', nativeName: 'Lietuvių', region: 'Lithuania', tier: 2 },
  { code: 'sw', bcp47: 'sw-KE', name: 'Swahili', nativeName: 'Kiswahili', region: 'East Africa', tier: 2 },
  { code: 'am', bcp47: 'am-ET', name: 'Amharic', nativeName: 'አማርኛ', region: 'Ethiopia', tier: 2 },
  { code: 'zu', bcp47: 'zu-ZA', name: 'Zulu', nativeName: 'isiZulu', region: 'South Africa', tier: 2 },
  { code: 'af', bcp47: 'af-ZA', name: 'Afrikaans', nativeName: 'Afrikaans', region: 'South Africa', tier: 2 },
  { code: 'he', bcp47: 'he-IL', name: 'Hebrew', nativeName: 'עברית', region: 'Israel', rtl: true, tier: 2 },
  { code: 'fa', bcp47: 'fa-IR', name: 'Persian', nativeName: 'فارسی', region: 'Iran', rtl: true, tier: 2 },
  // TIER 3: TEXT SUPPORT - More Indian Languages
  { code: 'ks', bcp47: 'ks-IN', name: 'Kashmiri', nativeName: 'کٲشُر', region: 'India', tier: 3 },
  { code: 'sd', bcp47: 'sd-IN', name: 'Sindhi', nativeName: 'سنڌي', region: 'India', rtl: true, tier: 3 },
  { code: 'sa', bcp47: 'sa-IN', name: 'Sanskrit', nativeName: 'संस्कृतम्', region: 'India', tier: 3 },
  { code: 'kok', bcp47: 'kok-IN', name: 'Konkani', nativeName: 'कोंकणी', region: 'India', tier: 3 },
  { code: 'doi', bcp47: 'doi-IN', name: 'Dogri', nativeName: 'डोगरी', region: 'India', tier: 3 },
  { code: 'mni', bcp47: 'mni-IN', name: 'Manipuri', nativeName: 'মৈতৈলোন্', region: 'India', tier: 3 },
  { code: 'sat', bcp47: 'sat-IN', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', region: 'India', tier: 3 },
  { code: 'mai', bcp47: 'mai-IN', name: 'Maithili', nativeName: 'मैथिली', region: 'India', tier: 3 },
  { code: 'bho', bcp47: 'bho-IN', name: 'Bhojpuri', nativeName: 'भोजपुरी', region: 'India', tier: 3 },
  // TIER 3: More World Languages
  { code: 'ca', bcp47: 'ca-ES', name: 'Catalan', nativeName: 'Català', region: 'Spain', tier: 3 },
  { code: 'eu', bcp47: 'eu-ES', name: 'Basque', nativeName: 'Euskara', region: 'Spain', tier: 3 },
  { code: 'gl', bcp47: 'gl-ES', name: 'Galician', nativeName: 'Galego', region: 'Spain', tier: 3 },
  { code: 'cy', bcp47: 'cy-GB', name: 'Welsh', nativeName: 'Cymraeg', region: 'UK', tier: 3 },
  { code: 'ga', bcp47: 'ga-IE', name: 'Irish', nativeName: 'Gaeilge', region: 'Ireland', tier: 3 },
  { code: 'mt', bcp47: 'mt-MT', name: 'Maltese', nativeName: 'Malti', region: 'Malta', tier: 3 },
  { code: 'is', bcp47: 'is-IS', name: 'Icelandic', nativeName: 'Íslenska', region: 'Iceland', tier: 3 },
  { code: 'mk', bcp47: 'mk-MK', name: 'Macedonian', nativeName: 'Македонски', region: 'N. Macedonia', tier: 3 },
  { code: 'sq', bcp47: 'sq-AL', name: 'Albanian', nativeName: 'Shqip', region: 'Albania', tier: 3 },
  { code: 'bs', bcp47: 'bs-BA', name: 'Bosnian', nativeName: 'Bosanski', region: 'Bosnia', tier: 3 },
  { code: 'ka', bcp47: 'ka-GE', name: 'Georgian', nativeName: 'ქართული', region: 'Georgia', tier: 3 },
  { code: 'hy', bcp47: 'hy-AM', name: 'Armenian', nativeName: 'Հdelays', region: 'Armenia', tier: 3 },
  { code: 'az', bcp47: 'az-AZ', name: 'Azerbaijani', nativeName: 'Azərbaycan', region: 'Azerbaijan', tier: 3 },
  { code: 'kk', bcp47: 'kk-KZ', name: 'Kazakh', nativeName: 'Қазақша', region: 'Kazakhstan', tier: 3 },
  { code: 'uz', bcp47: 'uz-UZ', name: 'Uzbek', nativeName: 'Oʻzbekcha', region: 'Uzbekistan', tier: 3 },
  { code: 'tg', bcp47: 'tg-TJ', name: 'Tajik', nativeName: 'Тоҷикӣ', region: 'Tajikistan', tier: 3 },
  { code: 'ky', bcp47: 'ky-KG', name: 'Kyrgyz', nativeName: 'Кыргызча', region: 'Kyrgyzstan', tier: 3 },
  { code: 'tk', bcp47: 'tk-TM', name: 'Turkmen', nativeName: 'Türkmençe', region: 'Turkmenistan', tier: 3 },
  { code: 'mn', bcp47: 'mn-MN', name: 'Mongolian', nativeName: 'Монгол', region: 'Mongolia', tier: 3 },
  { code: 'lo', bcp47: 'lo-LA', name: 'Lao', nativeName: 'ລາວ', region: 'Laos', tier: 3 },
  { code: 'km', bcp47: 'km-KH', name: 'Khmer', nativeName: 'ខ្មែរ', region: 'Cambodia', tier: 3 },
  { code: 'ps', bcp47: 'ps-AF', name: 'Pashto', nativeName: 'پښتو', region: 'Afghanistan', rtl: true, tier: 3 },
  { code: 'ku', bcp47: 'ku-TR', name: 'Kurdish', nativeName: 'Kurdî', region: 'Kurdistan', tier: 3 },
  { code: 'ha', bcp47: 'ha-NG', name: 'Hausa', nativeName: 'Hausa', region: 'Nigeria', tier: 3 },
  { code: 'yo', bcp47: 'yo-NG', name: 'Yoruba', nativeName: 'Yorùbá', region: 'Nigeria', tier: 3 },
  { code: 'ig', bcp47: 'ig-NG', name: 'Igbo', nativeName: 'Igbo', region: 'Nigeria', tier: 3 },
  { code: 'so', bcp47: 'so-SO', name: 'Somali', nativeName: 'Soomaali', region: 'Somalia', tier: 3 },
  { code: 'rw', bcp47: 'rw-RW', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', region: 'Rwanda', tier: 3 },
  { code: 'mg', bcp47: 'mg-MG', name: 'Malagasy', nativeName: 'Malagasy', region: 'Madagascar', tier: 3 },
  { code: 'xh', bcp47: 'xh-ZA', name: 'Xhosa', nativeName: 'isiXhosa', region: 'South Africa', tier: 3 },
  { code: 'st', bcp47: 'st-ZA', name: 'Sesotho', nativeName: 'Sesotho', region: 'South Africa', tier: 3 },
  { code: 'tn', bcp47: 'tn-ZA', name: 'Tswana', nativeName: 'Setswana', region: 'South Africa', tier: 3 },
  { code: 'sn', bcp47: 'sn-ZW', name: 'Shona', nativeName: 'chiShona', region: 'Zimbabwe', tier: 3 },
  { code: 'ny', bcp47: 'ny-MW', name: 'Chichewa', nativeName: 'Chichewa', region: 'Malawi', tier: 3 },
  { code: 'lg', bcp47: 'lg-UG', name: 'Luganda', nativeName: 'Luganda', region: 'Uganda', tier: 3 },
  { code: 'ti', bcp47: 'ti-ET', name: 'Tigrinya', nativeName: 'ትግርኛ', region: 'Ethiopia', tier: 3 },
  { code: 'om', bcp47: 'om-ET', name: 'Oromo', nativeName: 'Afaan Oromoo', region: 'Ethiopia', tier: 3 },
];

export const getLanguageByCode = (code: string) => ANKR_LANGUAGES.find(l => l.code === code);
export const getIndianLanguages = () => ANKR_LANGUAGES.filter(l => l.region === 'India');
export const getTier1Languages = () => ANKR_LANGUAGES.filter(l => l.tier === 1);
export const getTier2Languages = () => ANKR_LANGUAGES.filter(l => l.tier === 2);
export const getTier3Languages = () => ANKR_LANGUAGES.filter(l => l.tier === 3);

export const LANGUAGE_STATS = {
  total: ANKR_LANGUAGES.length,
  tier1: ANKR_LANGUAGES.filter(l => l.tier === 1).length,
  tier2: ANKR_LANGUAGES.filter(l => l.tier === 2).length,
  tier3: ANKR_LANGUAGES.filter(l => l.tier === 3).length,
  indian: ANKR_LANGUAGES.filter(l => l.region === 'India').length,
  rtl: ANKR_LANGUAGES.filter(l => l.rtl).length,
};

console.log('🌍 ANKR Languages:', LANGUAGE_STATS);
