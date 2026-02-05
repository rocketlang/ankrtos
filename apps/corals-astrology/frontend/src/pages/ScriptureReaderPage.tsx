import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

interface Verse {
  verseNumber: number;
  sanskrit: string;
  transliteration: string;
  hindi: string;
  english: string;
  commentary?: string;
}

interface Chapter {
  chapterNumber: number;
  chapterName: string;
  chapterNameSanskrit: string;
  verses: Verse[];
}

const ScriptureReaderPage: React.FC = () => {
  const { scriptureId, chapterNum } = useParams();
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'sanskrit' | 'hindi' | 'english'>('all');
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [showCommentary, setShowCommentary] = useState(true);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Mock data - Shiva Purana Chapter 1 (Jyotirlinga Khanda)
  const mockChapter: Chapter = {
    chapterNumber: 1,
    chapterName: 'The Glory of Shiva',
    chapterNameSanskrit: 'शिव महिमा',
    verses: [
      {
        verseNumber: 1,
        sanskrit: 'नमः शिवाय देवाय त्र्यम्बकाय त्रिलोचनाय। भस्माङ्गरागाय महादेवाय नमो नमः॥',
        transliteration: 'namaḥ śivāya devāya tryambakāya trilocanāya | bhasmāṅgarāgāya mahādevāya namo namaḥ ||',
        hindi: 'त्रिनेत्रधारी और तीन लोकों के स्वामी भगवान शिव को नमस्कार है। भस्म से विभूषित महादेव को बारंबार नमस्कार है।',
        english: 'Salutations to Lord Shiva, the three-eyed one, the lord of three worlds. Repeated salutations to Mahadeva who is adorned with sacred ash.',
        commentary: 'This opening verse establishes the supreme position of Lord Shiva. The three eyes represent the sun, moon, and fire - symbolizing creation, preservation, and destruction. The sacred ash (bhasma) represents the temporary nature of the physical world and Shiva\'s transcendence of worldly attachments.',
      },
      {
        verseNumber: 2,
        sanskrit: 'यस्य स्मरणमात्रेण जन्मसंसारबन्धनात्। विमुच्यते नमस्तस्मै विष्णवे प्रभविष्णवे॥',
        transliteration: 'yasya smaraṇamātreṇa janmasaṃsārabandhanāt | vimucyate namastasmai viṣṇave prabhaviṣṇave ||',
        hindi: 'जिनके स्मरण मात्र से जन्म और संसार के बंधनों से मुक्ति मिल जाती है, उन सर्वव्यापी और प्रभावशाली विष्णु को नमस्कार है।',
        english: 'Salutations to the all-pervading and powerful Lord Vishnu, by whose mere remembrance one is liberated from the bondage of birth and worldly existence.',
        commentary: 'This verse acknowledges Lord Vishnu\'s role as the preserver. In Shaiva tradition, Vishnu and Shiva are understood as different aspects of the same supreme reality. The verse emphasizes that liberation (moksha) comes through divine grace and remembrance.',
      },
      {
        verseNumber: 3,
        sanskrit: 'ब्रह्मणे नमो देवाय जगदादिकारणाय। सर्वज्ञाय सर्वेशाय सर्वात्मने नमो नमः॥',
        transliteration: 'brahmaṇe namo devāya jagadādikāraṇāya | sarvajñāya sarveśāya sarvātmane namo namaḥ ||',
        hindi: 'जगत के आदि कारण, सर्वज्ञ, सर्वेश्वर और सर्वात्मा ब्रह्मा देव को बारंबार नमस्कार है।',
        english: 'Repeated salutations to Lord Brahma, the original cause of the universe, the omniscient, the lord of all, and the soul of everything.',
        commentary: 'The trinity (Trimurti) is acknowledged - Brahma the creator, Vishnu the preserver, and Shiva the transformer. This verse honors Brahma\'s role in creation. All three aspects are essential for the cosmic cycle.',
      },
      {
        verseNumber: 4,
        sanskrit: 'सर्वे देवाः शिवं नत्वा विष्णुं ब्रह्माणमेव च। आरम्भं कुर्वते कार्यं तस्माच्छिवो महेश्वरः॥',
        transliteration: 'sarve devāḥ śivaṃ natvā viṣṇuṃ brahmāṇameva ca | ārambhaṃ kurvate kāryaṃ tasmācchivo maheśvaraḥ ||',
        hindi: 'सभी देवता शिव, विष्णु और ब्रह्मा को नमस्कार करके ही अपने कार्य का आरंभ करते हैं। इसलिए शिव सबसे महान ईश्वर हैं।',
        english: 'All the gods bow to Shiva, Vishnu, and Brahma before beginning any work. Therefore, Shiva is the supreme lord (Maheshwara).',
        commentary: 'This verse establishes the hierarchical relationship in the Hindu pantheon. Even powerful deities seek blessings from the Trimurti before undertaking important tasks. Shiva is called Maheshwara (Great Lord) as he represents the ultimate reality beyond creation and destruction.',
      },
      {
        verseNumber: 5,
        sanskrit: 'शिवः सर्वेश्वरः साक्षात् त्रिमूर्तिः परमेश्वरः। अनन्तकोटिब्रह्माण्डनायकः परमात्मा सः॥',
        transliteration: 'śivaḥ sarveśvaraḥ sākṣāt trimūrtiḥ parameśvaraḥ | anantakoṭibrahmāṇḍanāyakaḥ paramātmā saḥ ||',
        hindi: 'शिव साक्षात सर्वेश्वर, त्रिमूर्ति और परमेश्वर हैं। वे अनंत ब्रह्मांडों के स्वामी और परमात्मा हैं।',
        english: 'Shiva is verily the lord of all, the trinity itself, and the supreme lord. He is the master of infinite universes and the supreme soul.',
        commentary: 'This profound verse reveals Shiva\'s transcendent nature. He is not just one aspect of the trinity but the source from which the trinity emerges. The mention of "infinite universes" (ananta-koti-brahmanda) shows the vastness of Hindu cosmology - countless universes existing simultaneously, all governed by Shiva\'s consciousness.',
      },
      {
        verseNumber: 6,
        sanskrit: 'लिङ्गरूपेण पूज्यन्ते शिवलिङ्गं महेश्वरम्। यत्र यत्र शिवलिङ्गं तत्र तत्र महेश्वरः॥',
        transliteration: 'liṅgarūpeṇa pūjyante śivaliṅgaṃ maheśvaram | yatra yatra śivaliṅgaṃ tatra tatra maheśvaraḥ ||',
        hindi: 'शिवलिंग के रूप में महेश्वर की पूजा की जाती है। जहाँ-जहाँ शिवलिंग है, वहाँ-वहाँ महेश्वर विराजमान हैं।',
        english: 'Maheshwara is worshipped in the form of the Shivalinga. Wherever there is a Shivalinga, there Maheshwara is present.',
        commentary: 'The Shivalinga is the most common form of Shiva worship. It represents the formless (nirguna) aspect of divinity. The cylindrical shape symbolizes the infinite cosmic pillar of light. This verse assures devotees that Shiva\'s presence is not limited to holy sites - wherever devotion exists through the linga, Shiva manifests.',
      },
      {
        verseNumber: 7,
        sanskrit: 'शिवपूजां विना नान्यत् पूजनं फलदायकम्। शिवस्य पूजनं कृत्वा सर्वसिद्धिर्भवेद्ध्रुवम्॥',
        transliteration: 'śivapūjāṃ vinā nānyat pūjanaṃ phaladāyakam | śivasya pūjanaṃ kṛtvā sarvasiddhirbhavedhruvam ||',
        hindi: 'शिव की पूजा के बिना अन्य कोई पूजा फलदायक नहीं है। शिव की पूजा करने से निश्चित रूप से सभी सिद्धियाँ प्राप्त होती हैं।',
        english: 'Without worship of Shiva, no other worship bears fruit. By worshipping Shiva, all accomplishments are certainly attained.',
        commentary: 'This verse emphasizes the supreme importance of Shiva worship in the Shaiva tradition. However, it should be understood in context - it doesn\'t negate other forms of worship but rather points to the ultimate reality that Shiva represents. All siddhis (spiritual powers and accomplishments) come from aligning with the supreme consciousness.',
      },
      {
        verseNumber: 8,
        sanskrit: 'ॐ नमः शिवाय इत्येतत् पञ्चाक्षरमनुत्तमम्। जपेत्सततं यो भक्त्या स शिवस्यानुजायते॥',
        transliteration: 'om namaḥ śivāya ityetat pañcākṣaramanuttamam | japetsatataṃ yo bhaktyā sa śivasyānujāyate ||',
        hindi: '"ॐ नमः शिवाय" यह पञ्चाक्षर मंत्र सर्वोत्तम है। जो भक्ति से इसका निरंतर जाप करता है, वह शिव के समान हो जाता है।',
        english: '"Om Namah Shivaya" - this five-syllable mantra is supreme. One who chants it constantly with devotion becomes one with Shiva.',
        commentary: 'The Panchakshari mantra (Om Namah Shivaya) is the most powerful Shaiva mantra. Each syllable has deep significance: Na (earth), Ma (water), Shi (fire), Va (air), Ya (ether/space). The mantra thus encompasses all five elements and represents the entire creation. Regular japa (chanting) with devotion leads to unity with Shiva-consciousness - not as a separate being, but as recognition of one\'s true nature.',
      },
    ],
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/sanskriti" className="text-orange-600 hover:text-orange-700">
                ← Back to Library
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Shiva Purana</h1>
                <p className="text-sm text-gray-600">शिव पुराण</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link to="/dashboard" className="text-gray-700 hover:text-orange-600">Dashboard</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Chapter Navigation */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <h3 className="font-bold text-lg mb-4">📑 Chapters</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {[...Array(7)].map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      idx === 0
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 hover:bg-orange-50 text-gray-700'
                    }`}
                  >
                    <div className="font-semibold">Chapter {idx + 1}</div>
                    <div className="text-xs opacity-80">
                      {idx === 0 ? 'The Glory of Shiva' : `Section ${idx + 1}`}
                    </div>
                  </button>
                ))}
              </div>

              {/* Reading Settings */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-bold mb-3">⚙️ Settings</h4>

                {/* Language */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Language</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as any)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Languages</option>
                    <option value="sanskrit">Sanskrit Only</option>
                    <option value="hindi">Hindi Only</option>
                    <option value="english">English Only</option>
                  </select>
                </div>

                {/* Font Size */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Font Size</label>
                  <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold ${
                          fontSize === size
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {size[0].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTransliteration}
                      onChange={(e) => setShowTransliteration(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Show Transliteration</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCommentary}
                      onChange={(e) => setShowCommentary(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Show Commentary</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content - Scripture Text */}
          <main className="lg:col-span-3">
            {/* Chapter Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-8 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm opacity-90 mb-1">Shiva Purana - Jyotirlinga Khanda</div>
                  <h2 className="text-3xl font-bold mb-2">
                    Chapter {mockChapter.chapterNumber}: {mockChapter.chapterName}
                  </h2>
                  <p className="text-xl opacity-95">{mockChapter.chapterNameSanskrit}</p>
                </div>
                <div className="text-5xl">🔱</div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>📝 {mockChapter.verses.length} Verses</span>
                <span>•</span>
                <span>⏱️ ~15 min read</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mb-6">
              <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <span>🔊</span>
                <span className="font-semibold">Play Audio</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <span>📥</span>
                <span className="font-semibold">Download PDF</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <span>🔖</span>
                <span className="font-semibold">Bookmark</span>
              </button>
            </div>

            {/* Verses */}
            <div className="space-y-8">
              {mockChapter.verses.map((verse) => (
                <div key={verse.verseNumber} className="bg-white rounded-xl shadow-md p-6">
                  {/* Verse Number */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-orange-200">
                    <h3 className="text-xl font-bold text-orange-600">
                      Verse {verse.verseNumber}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Play audio">
                        🔊
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Copy">
                        📋
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Share">
                        🔗
                      </button>
                    </div>
                  </div>

                  {/* Sanskrit Original */}
                  {(selectedLanguage === 'all' || selectedLanguage === 'sanskrit') && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-2 border-orange-200">
                      <div className="text-xs font-semibold text-orange-700 mb-2">संस्कृत (Sanskrit Original)</div>
                      <p className={`${getFontSizeClass()} leading-relaxed text-gray-900 font-sanskrit`}>
                        {verse.sanskrit}
                      </p>
                    </div>
                  )}

                  {/* Transliteration */}
                  {showTransliteration && (selectedLanguage === 'all' || selectedLanguage === 'sanskrit') && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="text-xs font-semibold text-blue-700 mb-2">Transliteration (IAST)</div>
                      <p className={`${getFontSizeClass()} leading-relaxed text-gray-800 italic`}>
                        {verse.transliteration}
                      </p>
                    </div>
                  )}

                  {/* Hindi Translation */}
                  {(selectedLanguage === 'all' || selectedLanguage === 'hindi') && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <div className="text-xs font-semibold text-green-700 mb-2">हिन्दी अनुवाद (Hindi Translation)</div>
                      <p className={`${getFontSizeClass()} leading-relaxed text-gray-800`}>
                        {verse.hindi}
                      </p>
                    </div>
                  )}

                  {/* English Translation */}
                  {(selectedLanguage === 'all' || selectedLanguage === 'english') && (
                    <div className="mb-6 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                      <div className="text-xs font-semibold text-purple-700 mb-2">English Translation</div>
                      <p className={`${getFontSizeClass()} leading-relaxed text-gray-800`}>
                        {verse.english}
                      </p>
                    </div>
                  )}

                  {/* Commentary by Acharya */}
                  {showCommentary && verse.commentary && (
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-300">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🙏</span>
                        <div>
                          <div className="text-xs font-semibold text-orange-700">Commentary</div>
                          <div className="text-xs text-gray-600">by Jyotish Acharya Rakesh Sharma</div>
                        </div>
                      </div>
                      <p className={`${getFontSizeClass()} leading-relaxed text-gray-800`}>
                        {verse.commentary}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <button className="px-6 py-3 bg-gray-300 text-gray-600 rounded-lg font-semibold cursor-not-allowed">
                ← Previous Chapter
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600">
                Next Chapter →
              </button>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">⚡ Platform Powered by <span className="font-semibold text-orange-400">ANKR.IN</span></p>
          <p className="text-sm">💼 Managed by <span className="font-semibold">PowerBox IT Solutions Pvt Ltd</span></p>
          <p className="text-xs text-gray-500 mt-2">Founded by <span className="text-orange-400">Jyotish Acharya Rakesh Sharma</span></p>
        </div>
      </footer>
    </div>
  );
};

export default ScriptureReaderPage;
