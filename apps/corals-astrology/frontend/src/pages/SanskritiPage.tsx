import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Scripture {
  id: string;
  title: string;
  titleSanskrit: string;
  category: 'Veda' | 'Upanishad' | 'Purana' | 'Itihasa' | 'Smriti' | 'Sutra' | 'Stotra';
  description: string;
  verses: number;
  chapters: number;
  language: string[];
  yearComposed: string;
  author?: string;
  icon: string;
  available: boolean;
  premium: boolean;
}

interface Chapter {
  chapterNumber: number;
  chapterName: string;
  chapterNameSanskrit: string;
  verseCount: number;
  summary: string;
}

const scriptures: Scripture[] = [
  // VEDAS
  {
    id: 'rigveda',
    title: 'Rigveda',
    titleSanskrit: 'ऋग्वेद',
    category: 'Veda',
    description: 'The oldest of the Vedas, containing hymns in praise of various deities. Foundation of Vedic literature.',
    verses: 10552,
    chapters: 10,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '1500-1200 BCE',
    icon: '📿',
    available: true,
    premium: false,
  },
  {
    id: 'yajurveda',
    title: 'Yajurveda',
    titleSanskrit: 'यजुर्वेद',
    category: 'Veda',
    description: 'Vedic texts for rituals and sacrifices. Contains mantras for yajnas and ceremonial worship.',
    verses: 1975,
    chapters: 40,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '1200-1000 BCE',
    icon: '🔥',
    available: true,
    premium: false,
  },
  {
    id: 'samaveda',
    title: 'Samaveda',
    titleSanskrit: 'सामवेद',
    category: 'Veda',
    description: 'Veda of melodies and chants. Musical renditions of Rigvedic hymns.',
    verses: 1875,
    chapters: 6,
    language: ['Sanskrit', 'Hindi'],
    yearComposed: '1200-1000 BCE',
    icon: '🎵',
    available: true,
    premium: false,
  },
  {
    id: 'atharvaveda',
    title: 'Atharvaveda',
    titleSanskrit: 'अथर्ववेद',
    category: 'Veda',
    description: 'Veda of magic formulas and healing. Contains spells, charms, and philosophical discourse.',
    verses: 5987,
    chapters: 20,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '1200-1000 BCE',
    icon: '✨',
    available: true,
    premium: false,
  },

  // UPANISHADS
  {
    id: 'isha-upanishad',
    title: 'Isha Upanishad',
    titleSanskrit: 'ईशोपनिषद्',
    category: 'Upanishad',
    description: 'One of the shortest Upanishads. Teaches about the Supreme Reality and renunciation.',
    verses: 18,
    chapters: 1,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '800-600 BCE',
    icon: '🕉️',
    available: true,
    premium: false,
  },
  {
    id: 'katha-upanishad',
    title: 'Katha Upanishad',
    titleSanskrit: 'कठोपनिषद्',
    category: 'Upanishad',
    description: 'Story of Nachiketa and Lord Yama. Explores death, immortality, and self-realization.',
    verses: 119,
    chapters: 2,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '800-600 BCE',
    icon: '💀',
    available: true,
    premium: false,
  },
  {
    id: 'mandukya-upanishad',
    title: 'Mandukya Upanishad',
    titleSanskrit: 'माण्डूक्योपनिषद्',
    category: 'Upanishad',
    description: 'Shortest major Upanishad. Explains the sacred syllable OM and four states of consciousness.',
    verses: 12,
    chapters: 1,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '800-600 BCE',
    author: 'Sage Mandukya',
    icon: '🔆',
    available: true,
    premium: false,
  },

  // PURANAS
  {
    id: 'shiva-purana',
    title: 'Shiva Purana',
    titleSanskrit: 'शिव पुराण',
    category: 'Purana',
    description: 'Sacred texts dedicated to Lord Shiva. Contains stories, philosophy, and Shiva worship methods.',
    verses: 24000,
    chapters: 7,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '400-1000 CE',
    icon: '🔱',
    available: true,
    premium: true,
  },
  {
    id: 'bhagavata-purana',
    title: 'Bhagavata Purana (Srimad Bhagavatam)',
    titleSanskrit: 'भागवत पुराण',
    category: 'Purana',
    description: 'Stories of Lord Vishnu\'s avatars, especially Krishna. One of the most celebrated Puranas.',
    verses: 18000,
    chapters: 12,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '500-1000 CE',
    author: 'Sage Vyasa',
    icon: '🦚',
    available: true,
    premium: true,
  },
  {
    id: 'vishnu-purana',
    title: 'Vishnu Purana',
    titleSanskrit: 'विष्णु पुराण',
    category: 'Purana',
    description: 'Purana dedicated to Lord Vishnu. Contains cosmology, mythology, and Vishnu\'s manifestations.',
    verses: 23000,
    chapters: 6,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '400-900 CE',
    icon: '🌊',
    available: true,
    premium: true,
  },
  {
    id: 'devi-bhagavata',
    title: 'Devi Bhagavata Purana',
    titleSanskrit: 'देवी भागवत पुराण',
    category: 'Purana',
    description: 'Goddess-centric Purana. Stories and worship of the Divine Mother.',
    verses: 18000,
    chapters: 12,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '800-1200 CE',
    icon: '👸',
    available: true,
    premium: true,
  },

  // ITIHASA
  {
    id: 'mahabharata',
    title: 'Mahabharata',
    titleSanskrit: 'महाभारत',
    category: 'Itihasa',
    description: 'Epic tale of the Kurukshetra war. Contains Bhagavad Gita and vast philosophical teachings.',
    verses: 200000,
    chapters: 18,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '400 BCE - 400 CE',
    author: 'Sage Vyasa',
    icon: '⚔️',
    available: true,
    premium: true,
  },
  {
    id: 'ramayana',
    title: 'Ramayana',
    titleSanskrit: 'रामायण',
    category: 'Itihasa',
    description: 'Epic story of Lord Rama. Teaches dharma, devotion, and righteous conduct.',
    verses: 24000,
    chapters: 7,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '500-100 BCE',
    author: 'Sage Valmiki',
    icon: '🏹',
    available: true,
    premium: true,
  },

  // SMRITI
  {
    id: 'bhagavad-gita',
    title: 'Bhagavad Gita',
    titleSanskrit: 'भगवद् गीता',
    category: 'Smriti',
    description: 'Sacred dialogue between Krishna and Arjuna. Core text of Hindu philosophy.',
    verses: 700,
    chapters: 18,
    language: ['Sanskrit', 'Hindi', 'English', 'Tamil', 'Telugu'],
    yearComposed: '400 BCE - 200 CE',
    author: 'Part of Mahabharata',
    icon: '📖',
    available: true,
    premium: false,
  },
  {
    id: 'manusmriti',
    title: 'Manusmriti (Laws of Manu)',
    titleSanskrit: 'मनुस्मृति',
    category: 'Smriti',
    description: 'Ancient legal text. Discusses dharma, duties, and social conduct.',
    verses: 2685,
    chapters: 12,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '200 BCE - 200 CE',
    author: 'Sage Manu',
    icon: '⚖️',
    available: true,
    premium: true,
  },

  // SUTRAS
  {
    id: 'yoga-sutras',
    title: 'Yoga Sutras of Patanjali',
    titleSanskrit: 'पतञ्जलि योग सूत्र',
    category: 'Sutra',
    description: 'Foundational text of Yoga philosophy. 8-limbed path to enlightenment.',
    verses: 196,
    chapters: 4,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '400-200 BCE',
    author: 'Sage Patanjali',
    icon: '🧘',
    available: true,
    premium: false,
  },
  {
    id: 'brahma-sutras',
    title: 'Brahma Sutras (Vedanta Sutras)',
    titleSanskrit: 'ब्रह्म सूत्र',
    category: 'Sutra',
    description: 'Foundational text of Vedanta philosophy. Systematic exposition of Upanishadic teachings.',
    verses: 555,
    chapters: 4,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '200 BCE - 450 CE',
    author: 'Sage Badarayana (Vyasa)',
    icon: '🌟',
    available: true,
    premium: true,
  },

  // STOTRAS
  {
    id: 'hanuman-chalisa',
    title: 'Hanuman Chalisa',
    titleSanskrit: 'हनुमान चालीसा',
    category: 'Stotra',
    description: 'Devotional hymn to Lord Hanuman. 40 verses praising Hanuman\'s qualities and deeds.',
    verses: 40,
    chapters: 1,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '1600 CE',
    author: 'Tulsidas',
    icon: '🐒',
    available: true,
    premium: false,
  },
  {
    id: 'vishnu-sahasranama',
    title: 'Vishnu Sahasranama',
    titleSanskrit: 'विष्णु सहस्रनाम',
    category: 'Stotra',
    description: '1000 names of Lord Vishnu. Powerful hymn for devotion and protection.',
    verses: 1000,
    chapters: 1,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: 'Ancient',
    author: 'From Mahabharata',
    icon: '🦅',
    available: true,
    premium: false,
  },
  {
    id: 'lalita-sahasranama',
    title: 'Lalita Sahasranama',
    titleSanskrit: 'ललिता सहस्रनाम',
    category: 'Stotra',
    description: '1000 names of Goddess Lalita. Sacred text from Brahmanda Purana.',
    verses: 1000,
    chapters: 1,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: 'Ancient',
    author: 'From Brahmanda Purana',
    icon: '🌺',
    available: true,
    premium: false,
  },

  // NEW ADDITIONS - Principal Upanishads
  {
    id: 'kena-upanishad',
    title: 'Kena Upanishad',
    titleSanskrit: 'केनोपनिषद्',
    category: 'Upanishad',
    description: '"By whom commanded?" - Explores the nature of Brahman and the power behind senses and mind.',
    verses: 35,
    chapters: 4,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '800-600 BCE',
    icon: '🔍',
    available: true,
    premium: false,
  },
  {
    id: 'mundaka-upanishad',
    title: 'Mundaka Upanishad',
    titleSanskrit: 'मुण्डकोपनिषद्',
    category: 'Upanishad',
    description: 'Distinguishes between higher knowledge (Para Vidya) and lower knowledge (Apara Vidya). Path to Self-realization.',
    verses: 64,
    chapters: 3,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '800-600 BCE',
    icon: '📚',
    available: true,
    premium: false,
  },
  {
    id: 'taittiriya-upanishad',
    title: 'Taittiriya Upanishad',
    titleSanskrit: 'तैत्तिरीयोपनिषद्',
    category: 'Upanishad',
    description: 'Teaches the five sheaths (Pancha Kosha) covering the Self. "Food is Brahman" teaching.',
    verses: 59,
    chapters: 3,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '800-600 BCE',
    icon: '🌟',
    available: true,
    premium: false,
  },
  {
    id: 'chandogya-upanishad',
    title: 'Chandogya Upanishad',
    titleSanskrit: 'छान्दोग्योपनिषद्',
    category: 'Upanishad',
    description: 'Contains the famous "Tat Tvam Asi" (You are That). One of the oldest and most important Upanishads.',
    verses: 628,
    chapters: 8,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '800-600 BCE',
    author: 'Aruni & Shvetaketu dialogue',
    icon: '💫',
    available: true,
    premium: false,
  },
  {
    id: 'brihadaranyaka-upanishad',
    title: 'Brihadaranyaka Upanishad',
    titleSanskrit: 'बृहदारण्यकोपनिषद्',
    category: 'Upanishad',
    description: 'The largest and most profound Upanishad. Contains teachings of Yajnavalkya. "Neti Neti" (Not this, not this) doctrine.',
    verses: 789,
    chapters: 6,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '800-600 BCE',
    author: 'Sage Yajnavalkya',
    icon: '🎓',
    available: true,
    premium: false,
  },

  // NEW ADDITIONS - Major Puranas
  {
    id: 'garuda-purana',
    title: 'Garuda Purana',
    titleSanskrit: 'गरुड पुराण',
    category: 'Purana',
    description: 'Sacred text on death, afterlife, funeral rites, and the journey of the soul. One of the most important Puranas for understanding life after death.',
    verses: 19000,
    chapters: 279,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '800-1000 CE',
    author: 'Sage Vyasa',
    icon: '🦅',
    available: true,
    premium: true,
  },
  {
    id: 'skanda-purana',
    title: 'Skanda Purana',
    titleSanskrit: 'स्कन्द पुराण',
    category: 'Purana',
    description: 'The LARGEST Purana! Dedicated to Lord Kartikeya (Skanda). Contains descriptions of sacred geography, pilgrimages, and temples.',
    verses: 81000,
    chapters: 6,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '600-1200 CE',
    author: 'Sage Vyasa',
    icon: '🦚',
    available: true,
    premium: true,
  },
  {
    id: 'markandeya-purana',
    title: 'Markandeya Purana',
    titleSanskrit: 'मार्कण्डेय पुराण',
    category: 'Purana',
    description: 'Contains the famous Devi Mahatmya (Durga Saptashati) - 700 verses glorifying Goddess Durga. Story of Sage Markandeya.',
    verses: 9000,
    chapters: 137,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '400-600 CE',
    author: 'Sage Vyasa',
    icon: '🌺',
    available: true,
    premium: true,
  },
  {
    id: 'linga-purana',
    title: 'Linga Purana',
    titleSanskrit: 'लिङ्ग पुराण',
    category: 'Purana',
    description: 'Glorifies the Shivalinga and teaches its significance. Contains the origin of Shivalinga and 1,008 names of Shiva.',
    verses: 11000,
    chapters: 163,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '600-1000 CE',
    author: 'Sage Vyasa',
    icon: '🔱',
    available: true,
    premium: true,
  },
  {
    id: 'padma-purana',
    title: 'Padma Purana',
    titleSanskrit: 'पद्म पुराण',
    category: 'Purana',
    description: 'One of the largest Puranas. Creation of the universe, geography of the earth, and stories of Vishnu\'s avatars. Famous for the thousand names of Vishnu.',
    verses: 55000,
    chapters: 5,
    language: ['Sanskrit', 'Hindi', 'English'],
    yearComposed: '400-1000 CE',
    author: 'Sage Vyasa',
    icon: '🪷',
    available: true,
    premium: true,
  },
];

const SanskritiPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScripture, setSelectedScripture] = useState<Scripture | null>(null);

  const categories = [
    { id: 'all', name: 'All Texts', icon: '📚' },
    { id: 'Veda', name: 'Vedas', icon: '📿' },
    { id: 'Upanishad', name: 'Upanishads', icon: '🕉️' },
    { id: 'Purana', name: 'Puranas', icon: '🔱' },
    { id: 'Itihasa', name: 'Epics', icon: '⚔️' },
    { id: 'Smriti', name: 'Smritis', icon: '📖' },
    { id: 'Sutra', name: 'Sutras', icon: '🧘' },
    { id: 'Stotra', name: 'Stotras', icon: '🙏' },
  ];

  const filteredScriptures = scriptures.filter(scripture => {
    const matchesCategory = selectedCategory === 'all' || scripture.category === selectedCategory;
    const matchesSearch = scripture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scripture.titleSanskrit.includes(searchQuery) ||
                         scripture.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Mock chapter data for Bhagavad Gita
  const bhagavadGitaChapters: Chapter[] = [
    { chapterNumber: 1, chapterName: 'Arjuna Visada Yoga', chapterNameSanskrit: 'अर्जुन विषाद योग', verseCount: 47, summary: 'Arjuna\'s dejection on seeing his kinsmen in the battlefield.' },
    { chapterNumber: 2, chapterName: 'Sankhya Yoga', chapterNameSanskrit: 'सांख्य योग', verseCount: 72, summary: 'The eternal nature of the soul and the path of knowledge.' },
    { chapterNumber: 3, chapterName: 'Karma Yoga', chapterNameSanskrit: 'कर्म योग', verseCount: 43, summary: 'The yoga of action and selfless service.' },
    { chapterNumber: 4, chapterName: 'Jnana Karma Sanyasa Yoga', chapterNameSanskrit: 'ज्ञान कर्म संन्यास योग', verseCount: 42, summary: 'The yoga of knowledge and renunciation of action.' },
    { chapterNumber: 5, chapterName: 'Karma Sanyasa Yoga', chapterNameSanskrit: 'कर्म संन्यास योग', verseCount: 29, summary: 'The yoga of renunciation of action.' },
    { chapterNumber: 6, chapterName: 'Dhyana Yoga', chapterNameSanskrit: 'ध्यान योग', verseCount: 47, summary: 'The yoga of meditation and self-control.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-orange-600 flex items-center gap-2">
              <span>🕉️</span>
              <span>CORALS Sanskriti</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/dashboard" className="text-gray-700 hover:text-orange-600">Dashboard</Link>
              <Link to="/store" className="text-gray-700 hover:text-orange-600">Store</Link>
              <Link to="/book-pandit" className="text-gray-700 hover:text-orange-600">Book Pandit</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">संस्कृति - Divine Library</h1>
          <p className="text-xl mb-2">
            Ancient Sanskrit Manuscripts & Sacred Texts
          </p>
          <p className="text-sm opacity-90">Vedas • Upanishads • Puranas • Epics • Sutras • Stotras</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for Rigveda, Bhagavad Gita, Shiva Purana..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 border-2 border-orange-300 rounded-full focus:outline-none focus:border-orange-500 text-lg"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700">
              🔍 Search
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-full font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-orange-50 border-2 border-orange-200'
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-6 mb-8 text-center">
          <h3 className="text-xl font-bold mb-2">🎁 Complete Digital Library</h3>
          <p className="mb-4">
            Access {scriptures.length} sacred texts with Sanskrit originals, translations, and commentary by Acharya Rakesh Ji
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>Sanskrit Text</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>Hindi Translation</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>English Translation</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>Audio Recitation</span>
            </div>
          </div>
        </div>

        {/* Scripture Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScriptures.map(scripture => (
            <div
              key={scripture.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer"
              onClick={() => setSelectedScripture(scripture)}
            >
              {/* Category Badge */}
              <div className="h-2 bg-gradient-to-r from-orange-400 to-yellow-400"></div>

              <div className="p-6">
                {/* Icon & Title */}
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">{scripture.icon}</div>
                  {scripture.premium && (
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs rounded-full font-bold">
                      👑 PRO
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold mb-1">{scripture.title}</h3>
                <p className="text-2xl text-orange-600 mb-3 font-sanskrit">{scripture.titleSanskrit}</p>

                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-3">
                  {scripture.category}
                </span>

                <p className="text-gray-600 text-sm mb-4">{scripture.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span>📑</span>
                    <span>{scripture.chapters} Chapters</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span>📝</span>
                    <span>{scripture.verses.toLocaleString()} Verses</span>
                  </div>
                </div>

                {/* Languages */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {scripture.language.map((lang, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {lang}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                {scripture.available ? (
                  <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700">
                    Read Now →
                  </button>
                ) : (
                  <button className="w-full bg-gray-300 text-gray-600 py-2 rounded-lg font-semibold cursor-not-allowed">
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Featured: Bhagavad Gita Preview */}
        <div className="mt-12 bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">📖 Bhagavad Gita</h2>
                <p className="text-xl">भगवद् गीता - The Song of God</p>
              </div>
              <div className="text-6xl">🕉️</div>
            </div>
          </div>

          <div className="p-8">
            <h3 className="text-2xl font-bold mb-6">Chapters (अध्याय)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {bhagavadGitaChapters.map(chapter => (
                <div key={chapter.chapterNumber} className="border-2 border-orange-200 rounded-lg p-4 hover:border-orange-500 hover:bg-orange-50 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-2xl font-bold text-orange-600">Chapter {chapter.chapterNumber}</span>
                      <h4 className="font-bold text-lg">{chapter.chapterName}</h4>
                      <p className="text-orange-600 font-sanskrit">{chapter.chapterNameSanskrit}</p>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                      {chapter.verseCount} verses
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{chapter.summary}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:from-orange-600 hover:to-red-600">
                Read Complete Bhagavad Gita →
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl mb-3">🔊</div>
            <h3 className="font-bold mb-2">Audio Recitation</h3>
            <p className="text-sm text-gray-600">Listen to Sanskrit mantras with correct pronunciation</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="font-bold mb-2">Commentary</h3>
            <p className="text-sm text-gray-600">Detailed explanations by Acharya Rakesh Ji</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl mb-3">📥</div>
            <h3 className="font-bold mb-2">Download PDF</h3>
            <p className="text-sm text-gray-600">Save texts for offline reading</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl mb-3">🔖</div>
            <h3 className="font-bold mb-2">Bookmarks</h3>
            <p className="text-sm text-gray-600">Mark favorite verses and chapters</p>
          </div>
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

export default SanskritiPage;
