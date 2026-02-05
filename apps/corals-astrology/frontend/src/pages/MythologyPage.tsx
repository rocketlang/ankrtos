import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Story {
  id: string;
  title: string;
  titleSanskrit: string;
  category: 'Creation' | 'Gods' | 'Goddesses' | 'Demons' | 'Sages' | 'Devotees' | 'Moral' | 'Cosmic';
  scripture: string;
  scriptureChapter?: string;
  summary: string;
  characters: string[];
  moralLesson: string;
  duration: string; // reading time
  icon: string;
  popular: boolean;
  ageGroup: 'All' | 'Children' | 'Adults';
}

const stories: Story[] = [
  // CREATION STORIES
  {
    id: 'cosmic-ocean-churning',
    title: 'The Churning of the Cosmic Ocean (Samudra Manthan)',
    titleSanskrit: 'समुद्र मंथन',
    category: 'Creation',
    scripture: 'Vishnu Purana, Bhagavata Purana',
    scriptureChapter: 'Book 1, Chapter 9',
    summary: 'Gods and demons cooperate to churn the cosmic ocean to obtain the nectar of immortality (Amrita). From this emerge 14 precious treasures including Goddess Lakshmi, the moon, the divine physician Dhanvantari, and the deadly poison Halahala which Lord Shiva drinks to save the universe.',
    characters: ['Lord Vishnu', 'Indra', 'Demons (Asuras)', 'Mount Mandara', 'Vasuki (serpent)', 'Goddess Lakshmi', 'Lord Shiva'],
    moralLesson: 'Cooperation between opposing forces can yield great rewards. Sometimes you must work with those you consider enemies to achieve a greater good. Also, selfless sacrifice (Shiva drinking poison) saves the world.',
    duration: '8 min read',
    icon: '🌊',
    popular: true,
    ageGroup: 'All',
  },
  {
    id: 'creation-of-universe',
    title: 'The Creation of the Universe (Srishti)',
    titleSanskrit: 'सृष्टि रचना',
    category: 'Creation',
    scripture: 'Rigveda (Nasadiya Sukta), Manusmriti',
    scriptureChapter: 'Rigveda 10.129',
    summary: 'In the beginning, there was neither existence nor non-existence, neither death nor immortality. From the cosmic egg (Hiranyagarbha) emerged Brahma, the creator. He created the universe, the gods, sages, and all living beings through his mind and meditation.',
    characters: ['Brahma', 'Hiranyagarbha (Golden Egg)', 'Saraswati'],
    moralLesson: 'Everything in the universe has a divine origin and purpose. We are all interconnected in the cosmic web of creation.',
    duration: '6 min read',
    icon: '🌌',
    popular: true,
    ageGroup: 'All',
  },

  // SHIVA STORIES
  {
    id: 'shiva-tandava',
    title: 'The Cosmic Dance of Shiva (Tandava)',
    titleSanskrit: 'शिव ताण्डव',
    category: 'Gods',
    scripture: 'Shiva Purana',
    scriptureChapter: 'Multiple chapters',
    summary: 'Lord Shiva performs the Tandava, the cosmic dance of creation, preservation, and destruction. When he dances, the universe trembles. His dance represents the five activities: creation (Srishti), preservation (Sthiti), destruction (Samhara), illusion (Tirobhava), and liberation (Anugraha).',
    characters: ['Lord Shiva', 'Goddess Parvati', 'Nandi', 'Serpents', 'Demons'],
    moralLesson: 'Life is a continuous cycle of creation and destruction. Change is the only constant. Embrace transformation as divine will.',
    duration: '5 min read',
    icon: '🔱',
    popular: true,
    ageGroup: 'All',
  },
  {
    id: 'shiva-drinks-poison',
    title: 'Shiva Drinks the Deadly Poison (Halahala)',
    titleSanskrit: 'हालाहल विष पान',
    category: 'Gods',
    scripture: 'Shiva Purana, Vishnu Purana',
    scriptureChapter: 'Samudra Manthan',
    summary: 'During the churning of the ocean, deadly poison (Halahala) emerged first, threatening to destroy all creation. No one could handle it. Lord Shiva, to save the universe, drank the poison but held it in his throat, which turned blue. Thus he became Neelkanth (the blue-throated one).',
    characters: ['Lord Shiva', 'Goddess Parvati', 'Gods (Devas)', 'Demons (Asuras)'],
    moralLesson: 'True leaders sacrifice themselves for the greater good. Compassion means taking on suffering to protect others.',
    duration: '4 min read',
    icon: '💙',
    popular: true,
    ageGroup: 'All',
  },
  {
    id: 'ganesha-birth',
    title: 'The Birth of Ganesha',
    titleSanskrit: 'गणेश जन्म',
    category: 'Gods',
    scripture: 'Shiva Purana',
    scriptureChapter: 'Rudra Samhita',
    summary: 'Goddess Parvati created Ganesha from the turmeric paste of her body to guard her door. When Shiva tried to enter and Ganesha stopped him, an angry Shiva cut off his head. To console the heartbroken Parvati, Shiva attached an elephant\'s head to Ganesha and brought him back to life, making him the lord of all beings (Ganapati).',
    characters: ['Goddess Parvati', 'Lord Shiva', 'Ganesha', 'Nandi'],
    moralLesson: 'Duty and devotion are paramount. Even mistakes can lead to divine blessings. Every being deserves respect and a second chance.',
    duration: '6 min read',
    icon: '🐘',
    popular: true,
    ageGroup: 'All',
  },

  // VISHNU/KRISHNA STORIES
  {
    id: 'krishna-govardhan',
    title: 'Krishna Lifts Govardhan Mountain',
    titleSanskrit: 'गोवर्धन पर्वत उठाना',
    category: 'Gods',
    scripture: 'Bhagavata Purana',
    scriptureChapter: 'Book 10, Chapter 25',
    summary: 'When Indra sent torrential rains to flood Vrindavan out of anger, young Krishna lifted the entire Govardhan mountain on his little finger like an umbrella, protecting all the villagers and animals for seven days. Indra realized Krishna\'s divinity and bowed down to him.',
    characters: ['Lord Krishna', 'Indra', 'Villagers of Vrindavan', 'Nanda', 'Yashoda'],
    moralLesson: 'True divinity lies in protecting the helpless. Pride comes before a fall. Simple devotion is greater than elaborate rituals.',
    duration: '7 min read',
    icon: '⛰️',
    popular: true,
    ageGroup: 'All',
  },
  {
    id: 'prahlada-narasimha',
    title: 'Prahlad and Narasimha Avatar',
    titleSanskrit: 'प्रह्लाद और नरसिंह अवतार',
    category: 'Devotees',
    scripture: 'Bhagavata Purana',
    scriptureChapter: 'Book 7',
    summary: 'Young Prahlad, son of demon king Hiranyakashipu, was a devoted follower of Vishnu. Despite torture and attempts on his life by his own father, Prahlad\'s faith never wavered. When Hiranyakashipu challenged "Where is your Vishnu?", Lord Vishnu appeared as Narasimha (half-man, half-lion) from a pillar and killed the demon king.',
    characters: ['Prahlad', 'Hiranyakashipu', 'Lord Narasimha', 'Holika'],
    moralLesson: 'Unwavering faith in God protects you from all harm. Evil, no matter how powerful, cannot defeat pure devotion. God is omnipresent.',
    duration: '10 min read',
    icon: '🦁',
    popular: true,
    ageGroup: 'All',
  },
  {
    id: 'vamana-avatar',
    title: 'Vamana: The Dwarf Who Measured the Universe',
    titleSanskrit: 'वामन अवतार',
    category: 'Gods',
    scripture: 'Bhagavata Purana, Vishnu Purana',
    scriptureChapter: 'Book 8',
    summary: 'The demon king Bali conquered all three worlds through his devotion and charity. To restore cosmic balance, Vishnu appeared as a small Brahmin boy (Vamana) and asked Bali for three steps of land. When granted, Vamana grew to cosmic size, covering earth in one step, heaven in the second, and with no space for the third, Bali offered his own head.',
    characters: ['Lord Vamana (Vishnu)', 'King Bali', 'Guru Shukracharya'],
    moralLesson: 'True charity means giving without expectation. Humility in victory and grace in defeat are marks of greatness. Don\'t let power corrupt you.',
    duration: '8 min read',
    icon: '👣',
    popular: true,
    ageGroup: 'All',
  },

  // GODDESS STORIES
  {
    id: 'durga-mahishasura',
    title: 'Durga Slays Mahishasura',
    titleSanskrit: 'महिषासुर मर्दिनी',
    category: 'Goddesses',
    scripture: 'Devi Mahatmya (Markandeya Purana)',
    scriptureChapter: 'Chapters 2-4',
    summary: 'The buffalo demon Mahishasura conquered heaven and terrorized the gods. Unable to defeat him, all gods combined their powers to create Goddess Durga. Armed with weapons from each god, riding a lion, Durga battled Mahishasura for nine days and nights, finally killing him on the tenth day (Vijayadashami).',
    characters: ['Goddess Durga', 'Mahishasura', 'Gods (Brahma, Vishnu, Shiva)', 'Lion'],
    moralLesson: 'Good ultimately triumphs over evil. Unity creates invincible power. The divine feminine is the ultimate protector of dharma.',
    duration: '12 min read',
    icon: '🦁',
    popular: true,
    ageGroup: 'All',
  },
  {
    id: 'sati-and-shiva',
    title: 'The Sacrifice of Sati',
    titleSanskrit: 'सती का बलिदान',
    category: 'Goddesses',
    scripture: 'Shiva Purana',
    scriptureChapter: 'Multiple chapters',
    summary: 'Sati, daughter of Daksha, married Shiva against her father\'s wishes. When Daksha organized a grand yajna and insulted Shiva by not inviting him, Sati attended to defend her husband\'s honor. Unable to bear the insults, she immolated herself in the sacrificial fire. A grief-stricken Shiva performed the Tandava, nearly destroying the universe.',
    characters: ['Goddess Sati', 'Lord Shiva', 'Daksha', 'Vishnu'],
    moralLesson: 'Honor and respect in relationships are paramount. Disrespecting others\' beliefs leads to tragedy. True love transcends even death.',
    duration: '10 min read',
    icon: '🔥',
    popular: true,
    ageGroup: 'Adults',
  },
  {
    id: 'lakshmi-churning',
    title: 'The Emergence of Goddess Lakshmi',
    titleSanskrit: 'लक्ष्मी का आविर्भाव',
    category: 'Goddesses',
    scripture: 'Vishnu Purana',
    scriptureChapter: 'Book 1',
    summary: 'During the churning of the cosmic ocean, Goddess Lakshmi emerged seated on a lotus, radiating beauty and prosperity. All gods desired her, but she chose Lord Vishnu as her consort, residing forever on his chest. She represents wealth, fortune, and prosperity.',
    characters: ['Goddess Lakshmi', 'Lord Vishnu', 'Gods', 'Demons'],
    moralLesson: 'Prosperity comes from divine grace. True wealth includes spiritual richness, not just material possessions. Lakshmi stays where there is dharma.',
    duration: '5 min read',
    icon: '🪷',
    popular: true,
    ageGroup: 'All',
  },

  // SAGE STORIES
  {
    id: 'nachiketa-yama',
    title: 'Nachiketa and the God of Death',
    titleSanskrit: 'नचिकेता और यम',
    category: 'Sages',
    scripture: 'Katha Upanishad',
    scriptureChapter: 'All chapters',
    summary: 'Young Nachiketa was sent to Yama (Death) by his angry father. For three days, Yama was absent. Upon return, to compensate, Yama granted three boons. Nachiketa asked about the secret of death and immortality. Impressed by his wisdom and persistence, Yama taught him the eternal nature of the soul.',
    characters: ['Nachiketa', 'Yama (God of Death)', 'Vajasravasa (father)'],
    moralLesson: 'True knowledge is more valuable than material wealth. Death is not the end but a transformation. The soul is eternal and indestructible.',
    duration: '9 min read',
    icon: '💀',
    popular: true,
    ageGroup: 'Adults',
  },
  {
    id: 'markandeya-immortal',
    title: 'Markandeya: The Immortal Boy',
    titleSanskrit: 'मार्कण्डेय - अमर बालक',
    category: 'Sages',
    scripture: 'Markandeya Purana, Shiva Purana',
    scriptureChapter: 'Various',
    summary: 'Sage Markandeya was destined to die at age 16. When Yama came to take his life, Markandeya clung to the Shivalinga. Yama threw his noose, which also caught Shiva. An enraged Shiva emerged and kicked Yama, saving Markandeya and granting him immortality (Chiranjeevi).',
    characters: ['Markandeya', 'Lord Shiva', 'Yama', 'Parents of Markandeya'],
    moralLesson: 'Devotion to God conquers even death. Faith can change destiny. God protects those who surrender completely.',
    duration: '7 min read',
    icon: '🙏',
    popular: true,
    ageGroup: 'All',
  },

  // DEMON STORIES
  {
    id: 'ravana-downfall',
    title: 'The Pride and Fall of Ravana',
    titleSanskrit: 'रावण का पतन',
    category: 'Demons',
    scripture: 'Ramayana',
    scriptureChapter: 'Lanka Kanda, Yuddha Kanda',
    summary: 'Ravana, the ten-headed demon king of Lanka, was a great scholar and devotee of Shiva but was consumed by pride and lust. He abducted Sita, wife of Rama. Despite having immense power and boons, his arrogance led to his downfall. After an epic battle, Rama killed Ravana, restoring dharma.',
    characters: ['Ravana', 'Lord Rama', 'Sita', 'Hanuman', 'Lakshmana', 'Vibhishana'],
    moralLesson: 'Pride comes before destruction. Knowledge without humility and morality is useless. Respect for women and dharma is essential.',
    duration: '15 min read',
    icon: '👹',
    popular: true,
    ageGroup: 'All',
  },
  {
    id: 'hiranyaksha-varaha',
    title: 'Varaha Saves Mother Earth',
    titleSanskrit: 'वराह अवतार',
    category: 'Demons',
    scripture: 'Bhagavata Purana',
    scriptureChapter: 'Book 3',
    summary: 'The demon Hiranyaksha dragged the Earth to the bottom of the cosmic ocean. To rescue her, Vishnu took the form of a gigantic boar (Varaha). After a thousand-year battle in the ocean depths, Varaha killed Hiranyaksha and lifted the Earth on his tusks, placing her back in orbit.',
    characters: ['Lord Varaha (Vishnu)', 'Hiranyaksha', 'Mother Earth (Bhudevi)', 'Brahma'],
    moralLesson: 'God protects Mother Earth and all creation. Greed and violence toward nature lead to destruction. The divine will always restore balance.',
    duration: '8 min read',
    icon: '🐗',
    popular: false,
    ageGroup: 'All',
  },

  // MORAL STORIES
  {
    id: 'savitri-satyavan',
    title: 'Savitri Defeats Death',
    titleSanskrit: 'सावित्री सत्यवान',
    category: 'Moral',
    scripture: 'Mahabharata',
    scriptureChapter: 'Vana Parva',
    summary: 'Princess Savitri married Satyavan knowing he was destined to die within a year. When Yama came for Satyavan\'s soul, Savitri followed him, debating philosophy and dharma so cleverly that Yama granted her boons. Through her wit, she secured Satyavan\'s life without directly asking for it.',
    characters: ['Savitri', 'Satyavan', 'Yama', 'Narada'],
    moralLesson: 'Love conquers death. Intelligence, devotion, and determination can change fate. A devoted partner is life\'s greatest blessing.',
    duration: '12 min read',
    icon: '💕',
    popular: true,
    ageGroup: 'All',
  },
  {
    id: 'king-shibi-dove',
    title: 'King Shibi and the Dove',
    titleSanskrit: 'राजा शिबि और कबूतर',
    category: 'Moral',
    scripture: 'Mahabharata',
    scriptureChapter: 'Sabha Parva',
    summary: 'A dove sought King Shibi\'s protection from a hunting hawk. When the hawk demanded its rightful prey, Shibi offered his own flesh equal to the dove\'s weight. As he kept cutting his flesh, the dove grew heavier, until Shibi offered his entire body. The dove and hawk revealed themselves as Indra and Agni, testing his compassion.',
    characters: ['King Shibi', 'Dove (Indra)', 'Hawk (Agni)'],
    moralLesson: 'True compassion means protecting all beings, even at great personal cost. A king\'s duty is to give shelter to those who seek protection. Selfless sacrifice brings divine blessings.',
    duration: '8 min read',
    icon: '🕊️',
    popular: false,
    ageGroup: 'All',
  },

  // COSMIC/PHILOSOPHICAL
  {
    id: 'brahma-one-day',
    title: 'One Day in the Life of Brahma',
    titleSanskrit: 'ब्रह्मा का एक दिन',
    category: 'Cosmic',
    scripture: 'Bhagavata Purana',
    scriptureChapter: 'Various',
    summary: 'One day of Brahma (Kalpa) equals 4.32 billion human years. During his day, the universe is created and evolves. At night, it dissolves back into cosmic sleep (Pralaya). Brahma lives for 100 years (311 trillion human years), after which the entire cosmos dissolves into Vishnu, who sleeps until creation begins anew.',
    characters: ['Brahma', 'Vishnu', 'Time personified'],
    moralLesson: 'Human life is incredibly brief in cosmic scale. Use your time wisely. The universe operates in vast cycles of creation and dissolution. What seems permanent is temporary.',
    duration: '10 min read',
    icon: '⏰',
    popular: false,
    ageGroup: 'Adults',
  },
  {
    id: 'indra-pride-lesson',
    title: 'Indra Learns Humility',
    titleSanskrit: 'इंद्र की विनम्रता का पाठ',
    category: 'Moral',
    scripture: 'Various Puranas',
    scriptureChapter: 'Multiple stories',
    summary: 'Indra, king of gods, became arrogant after killing many demons. To teach him humility, Vishnu and Shiva appeared as a mysterious youth and an ant procession. Each ant was a former Indra from previous cycles of creation. Realizing countless beings had held his position before, Indra understood the impermanence of power.',
    characters: ['Indra', 'Lord Vishnu', 'Lord Shiva', 'Brihaspati'],
    moralLesson: 'No position is permanent. Pride and ego lead to downfall. Even the mightiest are temporary. True greatness lies in humility and service.',
    duration: '9 min read',
    icon: '⚡',
    popular: false,
    ageGroup: 'Adults',
  },
];

const MythologyPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPopularOnly, setShowPopularOnly] = useState(false);

  const categories = [
    { id: 'all', name: 'All Stories', icon: '📚' },
    { id: 'Creation', name: 'Creation', icon: '🌌' },
    { id: 'Gods', name: 'Gods', icon: '⚡' },
    { id: 'Goddesses', name: 'Goddesses', icon: '🌺' },
    { id: 'Demons', name: 'Demons', icon: '👹' },
    { id: 'Sages', name: 'Sages', icon: '🧙' },
    { id: 'Devotees', name: 'Devotees', icon: '🙏' },
    { id: 'Moral', name: 'Moral Tales', icon: '💡' },
    { id: 'Cosmic', name: 'Cosmic', icon: '⏰' },
  ];

  const filteredStories = stories.filter(story => {
    const matchesCategory = selectedCategory === 'all' || story.category === selectedCategory;
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.titleSanskrit.includes(searchQuery) ||
                         story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.characters.some(char => char.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPopular = !showPopularOnly || story.popular;
    return matchesCategory && matchesSearch && matchesPopular;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-orange-600 flex items-center gap-2">
              <span>🕉️</span>
              <span>CORALS Mythology</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/sanskriti" className="text-gray-700 hover:text-orange-600">Scriptures</Link>
              <Link to="/dashboard" className="text-gray-700 hover:text-orange-600">Dashboard</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sacred Stories from Hindu Mythology</h1>
          <p className="text-xl mb-2">
            Timeless tales from Vedas, Puranas, and Epics
          </p>
          <p className="text-sm opacity-90">Life lessons • Moral values • Cosmic wisdom</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Search & Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search stories, characters, or lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 border-2 border-purple-300 rounded-full focus:outline-none focus:border-purple-500 text-lg"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700">
                🔍 Search
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-full font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-purple-50 border-2 border-purple-200'
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Popular Toggle */}
          <div className="flex items-center justify-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-full shadow-md">
              <input
                type="checkbox"
                checked={showPopularOnly}
                onChange={(e) => setShowPopularOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-semibold">⭐ Popular Stories Only</span>
            </label>
            <div className="text-gray-600">
              Showing <span className="font-bold text-purple-600">{filteredStories.length}</span> stories
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl p-6 mb-8 text-center">
          <h3 className="text-xl font-bold mb-2">📖 {stories.length} Sacred Stories from Ancient Scriptures</h3>
          <p>Each story includes: Original Sanskrit name • Source scripture • Moral lesson • Character list</p>
        </div>

        {/* Stories Grid */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold mb-2">No stories found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map(story => (
              <div
                key={story.id}
                className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all overflow-hidden cursor-pointer group"
              >
                {/* Story Header */}
                <div className={`h-3 bg-gradient-to-r ${
                  story.category === 'Creation' ? 'from-blue-400 to-purple-600' :
                  story.category === 'Gods' ? 'from-orange-400 to-red-600' :
                  story.category === 'Goddesses' ? 'from-pink-400 to-purple-600' :
                  story.category === 'Demons' ? 'from-red-600 to-gray-800' :
                  story.category === 'Sages' ? 'from-green-400 to-teal-600' :
                  story.category === 'Devotees' ? 'from-yellow-400 to-orange-500' :
                  story.category === 'Moral' ? 'from-blue-400 to-green-500' :
                  'from-purple-600 to-indigo-800'
                }`}></div>

                <div className="p-6">
                  {/* Icon & Badges */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-5xl">{story.icon}</div>
                    <div className="flex flex-col gap-1">
                      {story.popular && (
                        <span className="px-3 py-1 bg-orange-600 text-white text-xs rounded-full font-bold">
                          ⭐ Popular
                        </span>
                      )}
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                        {story.category}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-1 group-hover:text-purple-600 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-lg text-orange-600 mb-3 font-sanskrit">{story.titleSanskrit}</p>

                  {/* Source */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <span>📖</span>
                    <span className="font-semibold">{story.scripture}</span>
                  </div>

                  {/* Summary */}
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {story.summary}
                  </p>

                  {/* Characters */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Characters:</div>
                    <div className="flex flex-wrap gap-1">
                      {story.characters.slice(0, 4).map((char, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {char}
                        </span>
                      ))}
                      {story.characters.length > 4 && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                          +{story.characters.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Moral Lesson Preview */}
                  <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg mb-4 border-l-4 border-orange-500">
                    <div className="text-xs font-semibold text-orange-700 mb-1">💡 Moral Lesson:</div>
                    <p className="text-sm text-gray-800 line-clamp-2">{story.moralLesson}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>⏱️ {story.duration}</span>
                    <span>👥 {story.ageGroup}</span>
                  </div>

                  {/* Read Button */}
                  <Link
                    to={`/story/${story.id}`}
                    className="mt-4 block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    Read Full Story →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Benefits Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Why Read Mythology?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-5xl mb-3">📚</div>
              <h3 className="font-bold mb-2">Learn Values</h3>
              <p className="text-sm text-gray-600">Timeless moral lessons for modern life</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">🧠</div>
              <h3 className="font-bold mb-2">Gain Wisdom</h3>
              <p className="text-sm text-gray-600">Philosophical insights from ancient sages</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">👨‍👩‍👧‍👦</div>
              <h3 className="font-bold mb-2">Family Bonding</h3>
              <p className="text-sm text-gray-600">Share stories across generations</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">🕉️</div>
              <h3 className="font-bold mb-2">Spiritual Growth</h3>
              <p className="text-sm text-gray-600">Connect with divine consciousness</p>
            </div>
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

export default MythologyPage;
