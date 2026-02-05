import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

interface StorySection {
  heading: string;
  content: string;
}

interface Character {
  name: string;
  nameSanskrit?: string;
  role: string;
  description: string;
  icon: string;
}

interface FullStory {
  id: string;
  title: string;
  titleSanskrit: string;
  category: string;
  scripture: string;
  scriptureChapter?: string;

  // Story content
  introduction: string;
  narrative: StorySection[];
  conclusion: string;

  // Additional details
  characters: Character[];
  moralLessons: string[];
  sanskritVerses?: Array<{
    verse: string;
    transliteration: string;
    translation: string;
  }>;

  // Metadata
  icon: string;
  duration: string;
  ageGroup: string;
  relatedStories: Array<{ id: string; title: string }>;
}

const StoryReaderPage: React.FC = () => {
  const { storyId } = useParams();
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Mock full story - Krishna Lifts Govardhan Mountain
  const story: FullStory = {
    id: 'krishna-govardhan',
    title: 'Krishna Lifts Govardhan Mountain',
    titleSanskrit: 'गोवर्धन पर्वत उठाना',
    category: 'Gods',
    scripture: 'Bhagavata Purana (Srimad Bhagavatam)',
    scriptureChapter: 'Book 10 (Dasham Skandha), Chapter 25',

    introduction: 'In the sacred land of Vrindavan, the cowherd folk led a simple life filled with devotion and joy. Every year, they performed elaborate rituals to honor Indra, the king of gods and the lord of rain. However, young Krishna, recognizing the pride in Indra\'s heart and seeing the simple devotion of the villagers, decided to teach everyone a profound lesson about true divinity and the importance of nature worship over ritualistic ceremonies.',

    narrative: [
      {
        heading: 'The Annual Indra Yajna',
        content: 'The villagers of Vrindavan were preparing for their annual grand yajna (sacrifice) in honor of Lord Indra. Pots filled with food, sweets, and offerings were being prepared. The entire village buzzed with activity as everyone participated in arranging the elaborate ceremony. Nanda Maharaj, Krishna\'s father, was overseeing all the preparations with great care and devotion, as this ritual had been performed by their ancestors for generations.',
      },
      {
        heading: 'Krishna Questions the Ritual',
        content: 'Young Krishna, observing all these preparations with curiosity, approached his father Nanda and asked, "Dear father, why do we perform this elaborate yajna for Indra every year? What is the purpose of these rituals?" Nanda explained that Indra, being the god of rain, blessed them with water for their crops and cattle. Without his grace, there would be no rain, and their livelihood would suffer. Krishna listened carefully and then spoke with divine wisdom beyond his years: "But father, is it not Govardhan mountain that provides us with everything we need? The mountain gives us grazing lands for our cattle, pure water from its streams, medicinal herbs, and protection from harsh weather. The rains come due to natural cycles, not because of Indra\'s whims. Should we not worship that which directly sustains us?"',
      },
      {
        heading: 'Worshipping Govardhan Mountain',
        content: 'Krishna\'s words resonated with the simple hearts of the villagers. They realized the truth in his statement - Govardhan mountain was indeed their direct benefactor. Krishna suggested, "Let us worship Govardhan mountain instead. Let us offer our prayers to the mountain, to our cattle, and to the Brahmins who guide us with spiritual knowledge. This will be true worship." The villagers, devoted to Krishna and convinced by his logic, agreed enthusiastically. They prepared elaborate offerings and circumambulated the sacred mountain, singing hymns of praise. They fed the Brahmins, adorned their cattle with flower garlands, and offered thousands of preparations at the base of Govardhan. The entire community participated with joy and devotion, feeling a deeper connection to the nature that sustained them.',
      },
      {
        heading: 'Indra\'s Wrath',
        content: 'In the heavenly realms, Indra was expecting his annual worship from Vrindavan. When it did not come, he became curious and looked down upon the earth. To his shock and rage, he saw the villagers worshipping Govardhan mountain instead of him! His pride wounded and his anger inflamed, Indra thundered, "How dare these mere mortals ignore me, the king of gods! I, who control the very rains they depend upon! I shall show them my power and teach them a lesson they will never forget!" In his fury, Indra summoned the Samvartaka clouds - the devastating clouds of cosmic dissolution that appear only at the end of ages. He commanded them: "Go to Vrindavan and unleash such torrential rains and devastating storms that the entire village will be destroyed! Let them know the price of disrespecting Indra!"',
      },
      {
        heading: 'The Devastating Storm',
        content: 'Dark, ominous clouds gathered over Vrindavan, blocking out the sun. Thunder roared like a thousand drums, and lightning split the sky. Then began a rain unlike anything the villagers had ever witnessed. It was not the gentle, life-giving rain of monsoon but a deluge of destruction. Water fell in sheets so thick that one could barely see a few feet ahead. The wind howled with such ferocity that it uprooted trees and destroyed homes. The ground turned into rivers of mud, and the level of water kept rising dangerously. The cattle huddled together in fear, and the villagers, terrified for their lives, rushed to Krishna. "Krishna! Save us!" they cried. "This is no ordinary storm - this is Indra\'s wrath! We followed your advice, and now we face this disaster! What shall we do?"',
      },
      {
        heading: 'Krishna Lifts the Mountain',
        content: 'Krishna smiled gently at the frightened villagers and said, "Do not fear. I shall protect you." Then, this small boy of merely seven years walked calmly through the raging storm toward Govardhan mountain. As the villagers watched in amazement, Krishna placed his left hand under the base of the enormous mountain. With the ease of a child picking up a flower, he lifted the entire Govardhan mountain on his little finger, raising it high above like a massive umbrella! The mountain, with all its trees, caves, and rocks, rested steady on Krishna\'s fingertip, creating a vast shelter underneath. "Come!" Krishna called out to the villagers. "Bring your families, your cattle, your possessions - all of you take shelter under Govardhan! You will be safe here." The villagers, along with their families, thousands of cattle, and all their belongings, hurried under the mountain. There, they found perfect shelter - not a single drop of rain touched them, and the howling winds could not reach them.',
      },
      {
        heading: 'Seven Days of Protection',
        content: 'For seven days and seven nights, the devastating storm continued. Indra kept increasing the intensity of the downpour, determined to break Krishna\'s resolve and flood Vrindavan. But Krishna stood there, unwavering, holding the mountain on his little finger without the slightest sign of fatigue. He remained calm and smiling, occasionally playing his flute to entertain the children and calm the frightened cattle. The villagers watched in wonder and devotion. They took turns offering food to Krishna, singing devotional songs, and caring for their animals. Under the mountain, they were completely safe and comfortable, as if in a divine palace. Mother Yashoda and Nanda would look at their son with tears of joy and pride, realizing his divine nature. The other children played around Krishna\'s feet, treating the whole situation as a grand adventure. Meanwhile, above the mountain, the rains lashed mercilessly, and the winds roared in vain.',
      },
      {
        heading: 'Indra\'s Realization',
        content: 'As days passed, Indra began to realize something profound. No matter how much he increased the storm\'s intensity, he could not defeat this small cowherd boy. Exhausted and humbled, Indra finally understood - this was no ordinary child. This was the Supreme Lord himself, appearing in human form! The pride that had clouded his judgment began to dissipate. Indra thought deeply about his actions and felt ashamed. He had allowed his ego to control him, acting out of wounded pride rather than divine duty. On the seventh day, Indra called back the clouds and stopped the rain. The sun emerged, bathing the land in warm, golden light. The waters began to recede, and birds started singing again.',
      },
      {
        heading: 'The Mountain Returns',
        content: 'Seeing the storm had ended and the danger had passed, Krishna gently lowered the Govardhan mountain back to its original place. The mountain settled perfectly into its foundation, as if it had never been moved. Not a single stone was disturbed, not a single tree damaged. Krishna turned to the villagers and said with a gentle smile, "You may all return to your homes now. The danger has passed. Continue to worship Govardhan with devotion, and always remember that true divinity resides not in pride and power, but in love and service." The villagers emerged from under the mountain, their hearts overflowing with gratitude and devotion. They prostrated before Krishna, tears streaming down their faces, realizing they had witnessed the divine play of the Lord himself.',
      },
      {
        heading: 'Indra\'s Surrender',
        content: 'Indra, the king of gods, descended from heaven with his celestial elephant Airavata, his pride completely shattered. He approached Krishna and fell at his feet, folding his hands in deep remorse. "O Supreme Lord," Indra said, his voice trembling with emotion, "I am deeply ashamed of my actions. Blinded by pride and ego, I tried to harm these innocent devotees and challenged your divine will. I now realize you are the Supreme Personality, the source of all gods, including myself. Please forgive this foolish servant." Krishna blessed Indra with his divine smile and said, "Indra, you are forgiven. But remember this lesson always - pride is the greatest enemy of the gods. As king of heaven, your duty is to serve creation, not to demand worship. True power lies in humility and service, not in pride and domination."',
      },
      {
        heading: 'The Sacred Festival',
        content: 'From that day forward, the residents of Vrindavan began celebrating an annual festival called Govardhan Puja, also known as Annakut (mountain of food). Every year, devotees prepare 56 or 108 different types of food offerings and create a representation of Govardhan mountain using cow dung or food items. They offer prayers, circumambulate the mountain, and remember Krishna\'s divine protection. This festival is celebrated the day after Diwali, known as Govardhan Puja, and remains one of the most important festivals in Krishna worship. The story spread throughout the world, inspiring devotees to recognize divinity not through elaborate rituals to appease gods, but through love for the divine and respect for nature.',
      },
    ],

    conclusion: 'The story of Krishna lifting Govardhan mountain is not merely a tale of divine power but a profound teaching about multiple spiritual truths. It demonstrates that God protects his devotees from all calamities, no matter how severe. It teaches that simple, heartfelt devotion to nature and God is superior to elaborate rituals performed for show. It reminds us that pride, even in gods, leads to downfall, while humility opens the door to divine grace. Most importantly, it shows that the Supreme Lord appears in this world to protect dharma, guide souls toward truth, and demonstrate through his divine play (leela) the path of love and devotion.',

    characters: [
      {
        name: 'Lord Krishna',
        nameSanskrit: 'भगवान श्री कृष्ण',
        role: 'Divine Protector',
        description: 'The Supreme Personality of Godhead, appearing as a seven-year-old cowherd boy in Vrindavan. Through his divine play (leela), he teaches profound spiritual lessons.',
        icon: '🦚',
      },
      {
        name: 'Indra',
        nameSanskrit: 'इंद्र',
        role: 'King of Gods',
        description: 'Lord of rain and thunder, king of the celestial beings. His pride leads to conflict, but he ultimately surrenders to Krishna and learns humility.',
        icon: '⚡',
      },
      {
        name: 'Nanda Maharaj',
        nameSanskrit: 'नन्द महाराज',
        role: 'Krishna\'s Father',
        description: 'The chief of Vrindavan cowherd community and Krishna\'s foster father. A devotee who follows Krishna\'s guidance with complete faith.',
        icon: '👨',
      },
      {
        name: 'Mother Yashoda',
        nameSanskrit: 'माता यशोदा',
        role: 'Krishna\'s Mother',
        description: 'Krishna\'s foster mother, embodiment of maternal love and devotion. She worries for Krishna during the storm but has complete faith in him.',
        icon: '👩',
      },
      {
        name: 'Villagers of Vrindavan',
        nameSanskrit: 'व्रजवासी',
        role: 'Devotees',
        description: 'Simple cowherd folk whose pure devotion and trust in Krishna make them witnesses to divine grace. They represent ideal devotees.',
        icon: '👥',
      },
      {
        name: 'Govardhan Mountain',
        nameSanskrit: 'गोवर्धन पर्वत',
        role: 'Sacred Mountain',
        description: 'The holy mountain that sustains Vrindavan with its resources. Becomes the instrument of divine protection and object of worship.',
        icon: '⛰️',
      },
    ],

    moralLessons: [
      '**God Protects His Devotees**: No matter how severe the danger, the Supreme Lord always protects those who surrender to him with love and devotion. Krishna held the mountain for seven days without fatigue, showing infinite capacity to protect.',

      '**Pride Leads to Downfall**: Indra, despite being king of gods, fell into suffering due to his pride. His ego made him think he deserved worship and respect. True divinity lies in humility and service, not in demanding honor.',

      '**Nature Worship Over Ritual**: Krishna teaches that worshipping the forces of nature that directly sustain us is more meaningful than elaborate rituals. Govardhan mountain provided grass, water, and shelter - this tangible support deserved gratitude.',

      '**Simple Devotion Is Supreme**: The villagers\' simple, heartfelt devotion was more valuable than complex ceremonies. God responds to love, not to the grandeur of worship.',

      '**Community and Unity**: During the crisis, the entire community came together under Krishna\'s protection. In times of trouble, unity under divine guidance provides safety and strength.',

      '**Divine Play (Leela)**: God\'s actions in the world, though appearing as child\'s play, contain profound teachings. What seems like a simple act of lifting a mountain teaches multiple spiritual lessons.',

      '**Forgiveness and Redemption**: Despite Indra\'s grave mistake of trying to harm innocents, Krishna forgave him when he surrendered. This shows that sincere repentance always receives divine mercy.',

      '**Age Is No Barrier to Wisdom**: Though only seven years old, Krishna\'s wisdom surpassed that of elders. True knowledge comes from divine consciousness, not from years of life.',

      '**Question Authority Wisely**: Krishna questioned the tradition of Indra worship not out of rebellion but from genuine spiritual inquiry. Intelligent questioning that leads to higher truth is encouraged.',

      '**Dharma Over Convention**: Sometimes upholding dharma (righteousness) requires breaking convention. The villagers broke tradition by not worshipping Indra, but they followed the higher dharma of worshipping what truly sustains them.',
    ],

    sanskritVerses: [
      {
        verse: 'गोवर्धनं गिरिवरं गोवर्धनम्। गोवर्धनं पूजयामो नमामि गोवर्धनम्॥',
        transliteration: 'govardhanaṃ girivaram govaardhanam | govardhanaṃ pūjayāmo namāmi govardhanaṃ ||',
        translation: 'Govardhan, the best among mountains, Govardhan! We worship Govardhan, I bow to Govardhan.',
      },
      {
        verse: 'यत्र नन्दो महाराजः सर्वे च वृषभासनाः। कृष्णस्य चानुचराः सर्वे तत्र नमोऽस्तु ते॥',
        transliteration: 'yatra nando mahārājaḥ sarve ca vṛṣabhāsanāḥ | kṛṣṇasya cānucarāḥ sarve tatra namo\'stu te ||',
        translation: 'Where Nanda Maharaj resides with all devotees, where all followers of Krishna dwell, to that place I offer my obeisances.',
      },
    ],

    icon: '⛰️',
    duration: '15 min read',
    ageGroup: 'All Ages',
    relatedStories: [
      { id: 'krishna-kaliya', title: 'Krishna Defeats Kaliya Serpent' },
      { id: 'krishna-putana', title: 'Krishna and Putana' },
      { id: 'indra-pride-lesson', title: 'Indra Learns Humility' },
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/mythology" className="text-orange-600 hover:text-orange-700">
                ← Back to Stories
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{story.title}</h1>
                <p className="text-sm text-gray-600">{story.titleSanskrit}</p>
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
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              {/* Story Info */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">{story.icon}</div>
                <h3 className="font-bold text-lg mb-2">{story.category}</h3>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
                  <span>⏱️</span>
                  <span>{story.duration}</span>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <span>👥 {story.ageGroup}</span>
                </div>
                <Link
                  to={`/scripture/${story.scripture.toLowerCase().replace(/\s+/g, '-')}/1`}
                  className="text-sm text-orange-600 hover:text-orange-700 font-semibold"
                >
                  📖 Read Source: {story.scripture}
                </Link>
              </div>

              {/* Reading Settings */}
              <div className="pt-6 border-t">
                <h4 className="font-bold mb-3">⚙️ Settings</h4>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Font Size</label>
                  <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold ${
                          fontSize === size
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {size[0].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600">
                  <span>🔊</span>
                  <span>Listen</span>
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-purple-500 text-purple-600 rounded-lg font-semibold hover:bg-purple-50">
                  <span>🔖</span>
                  <span>Bookmark</span>
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-purple-500 text-purple-600 rounded-lg font-semibold hover:bg-purple-50">
                  <span>🔗</span>
                  <span>Share</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Story Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white rounded-xl p-8 mb-6">
              <div className="text-7xl mb-4 text-center">{story.icon}</div>
              <h2 className="text-4xl font-bold mb-3 text-center">{story.title}</h2>
              <p className="text-2xl text-center opacity-95 mb-4">{story.titleSanskrit}</p>
              <div className="flex items-center justify-center gap-6 text-sm">
                <span>📖 {story.scripture}</span>
                <span>•</span>
                <span>⏱️ {story.duration}</span>
                <span>•</span>
                <span>👥 {story.ageGroup}</span>
              </div>
            </div>

            {/* Introduction */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <h3 className="text-2xl font-bold mb-4 text-purple-900">Introduction</h3>
              <p className={`${getFontSizeClass()} leading-relaxed text-gray-800`}>
                {story.introduction}
              </p>
            </div>

            {/* Story Narrative */}
            <div className="space-y-6 mb-6">
              {story.narrative.map((section, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-md p-8">
                  <h3 className="text-2xl font-bold mb-4 text-purple-900 flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full text-lg">
                      {idx + 1}
                    </span>
                    {section.heading}
                  </h3>
                  <p className={`${getFontSizeClass()} leading-relaxed text-gray-800`}>
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Conclusion */}
            <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl shadow-md p-8 mb-6 border-2 border-orange-300">
              <h3 className="text-2xl font-bold mb-4 text-orange-900">Conclusion</h3>
              <p className={`${getFontSizeClass()} leading-relaxed text-gray-800`}>
                {story.conclusion}
              </p>
            </div>

            {/* Characters */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <h3 className="text-2xl font-bold mb-6 text-purple-900">Main Characters</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {story.characters.map((char, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{char.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{char.name}</h4>
                        {char.nameSanskrit && (
                          <p className="text-orange-600 font-sanskrit mb-1">{char.nameSanskrit}</p>
                        )}
                        <p className="text-sm text-purple-700 font-semibold mb-2">{char.role}</p>
                        <p className="text-sm text-gray-700">{char.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Moral Lessons */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-6">
              <h3 className="text-2xl font-bold mb-6 text-purple-900">💡 Moral Lessons & Teachings</h3>
              <div className="space-y-4">
                {story.moralLessons.map((lesson, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-orange-500">
                    <p className={`${getFontSizeClass()} text-gray-800 leading-relaxed`}>
                      <span className="text-orange-600 font-bold mr-2">{idx + 1}.</span>
                      {lesson}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sanskrit Verses */}
            {story.sanskritVerses && story.sanskritVerses.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-8 mb-6">
                <h3 className="text-2xl font-bold mb-6 text-purple-900">📿 Sacred Verses</h3>
                <div className="space-y-6">
                  {story.sanskritVerses.map((verse, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-2 border-orange-200">
                        <div className="text-xs font-semibold text-orange-700 mb-2">Sanskrit</div>
                        <p className="text-lg text-gray-900 font-sanskrit leading-relaxed">
                          {verse.verse}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <div className="text-xs font-semibold text-blue-700 mb-2">Transliteration</div>
                        <p className="text-gray-800 italic">
                          {verse.transliteration}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                        <div className="text-xs font-semibold text-green-700 mb-2">Translation</div>
                        <p className="text-gray-800">
                          {verse.translation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Stories */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h3 className="text-2xl font-bold mb-6 text-purple-900">📚 Related Stories</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {story.relatedStories.map((related, idx) => (
                  <Link
                    key={idx}
                    to={`/story/${related.id}`}
                    className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg hover:from-purple-200 hover:to-pink-200 transition-all border-2 border-purple-300"
                  >
                    <p className="font-semibold text-purple-900">{related.title}</p>
                    <p className="text-sm text-purple-600 mt-1">Read story →</p>
                  </Link>
                ))}
              </div>
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

export default StoryReaderPage;
