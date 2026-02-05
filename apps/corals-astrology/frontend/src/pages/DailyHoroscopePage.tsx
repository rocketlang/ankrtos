import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

interface DailyHoroscope {
  sign: ZodiacSign;
  date: string;
  overview: string;
  love: HoroscopeCategory;
  career: HoroscopeCategory;
  health: HoroscopeCategory;
  finance: HoroscopeCategory;
  luckyElements: LuckyElements;
  dosAndDonts: {
    dos: string[];
    donts: string[];
  };
  compatibleSigns: ZodiacSign[];
  rating: {
    love: number;
    career: number;
    health: number;
    finance: number;
    overall: number;
  };
  specialMessage?: string;
}

interface HoroscopeCategory {
  prediction: string;
  rating: number;
  advice: string;
}

interface LuckyElements {
  numbers: number[];
  colors: string[];
  directions: string[];
  time: string;
  day: string;
  gemstone: string;
}

const ZODIAC_SIGNS: Array<{
  sign: ZodiacSign;
  icon: string;
  dates: string;
  element: string;
}> = [
  { sign: 'Aries', icon: '♈', dates: 'Mar 21 - Apr 19', element: 'Fire' },
  { sign: 'Taurus', icon: '♉', dates: 'Apr 20 - May 20', element: 'Earth' },
  { sign: 'Gemini', icon: '♊', dates: 'May 21 - Jun 20', element: 'Air' },
  { sign: 'Cancer', icon: '♋', dates: 'Jun 21 - Jul 22', element: 'Water' },
  { sign: 'Leo', icon: '♌', dates: 'Jul 23 - Aug 22', element: 'Fire' },
  { sign: 'Virgo', icon: '♍', dates: 'Aug 23 - Sep 22', element: 'Earth' },
  { sign: 'Libra', icon: '♎', dates: 'Sep 23 - Oct 22', element: 'Air' },
  { sign: 'Scorpio', icon: '♏', dates: 'Oct 23 - Nov 21', element: 'Water' },
  { sign: 'Sagittarius', icon: '♐', dates: 'Nov 22 - Dec 21', element: 'Fire' },
  { sign: 'Capricorn', icon: '♑', dates: 'Dec 22 - Jan 19', element: 'Earth' },
  { sign: 'Aquarius', icon: '♒', dates: 'Jan 20 - Feb 18', element: 'Air' },
  { sign: 'Pisces', icon: '♓', dates: 'Feb 19 - Mar 20', element: 'Water' },
];

// Mock function - will be replaced with actual API call
function generateMockHoroscope(sign: ZodiacSign): DailyHoroscope {
  // This is temporary mock data - replace with actual API call
  return {
    sign,
    date: new Date().toISOString().split('T')[0],
    overview: `Today brings positive energy for ${sign} natives. The planetary alignments favor your endeavors.`,
    love: {
      prediction: 'Romance flourishes today with positive planetary influences.',
      rating: 4,
      advice: 'Express your feelings openly and honestly.',
    },
    career: {
      prediction: 'Professional growth opportunities present themselves.',
      rating: 5,
      advice: 'Take initiative on important projects.',
    },
    health: {
      prediction: 'Energy levels are good, maintain healthy routines.',
      rating: 4,
      advice: 'Stay active and eat nutritious meals.',
    },
    finance: {
      prediction: 'Financial stability continues, good for planning.',
      rating: 4,
      advice: 'Review your budget and savings plan.',
    },
    luckyElements: {
      numbers: [3, 7, 21],
      colors: ['Blue', 'Green', 'White'],
      directions: ['North', 'East'],
      time: '10:00 AM - 12:00 PM',
      day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      gemstone: 'Ruby',
    },
    dosAndDonts: {
      dos: [
        'Start new projects',
        'Connect with loved ones',
        'Stay optimistic',
        'Take calculated risks',
      ],
      donts: [
        'Avoid negative people',
        'Don\'t procrastinate',
        'Stay away from conflicts',
        'Don\'t ignore intuition',
      ],
    },
    compatibleSigns: ['Taurus', 'Gemini', 'Leo'],
    rating: {
      love: 4,
      career: 5,
      health: 4,
      finance: 4,
      overall: 4,
    },
    specialMessage: 'The stars align in your favor today. Trust your journey.',
  };
}

function DailyHoroscopePage() {
  const navigate = useNavigate();
  const [selectedSign, setSelectedSign] = useState<ZodiacSign>('Aries');
  const [horoscope, setHoroscope] = useState<DailyHoroscope | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHoroscope(selectedSign);
  }, [selectedSign]);

  const loadHoroscope = async (sign: ZodiacSign) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const data = generateMockHoroscope(sign);
      setHoroscope(data);
      setLoading(false);
    }, 500);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-xl ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      love: '💕',
      career: '💼',
      health: '🏥',
      finance: '💰',
    };
    return icons[category] || '✨';
  };

  const getElementColor = (element: string) => {
    const colors: Record<string, string> = {
      Fire: 'from-orange-500 to-red-500',
      Earth: 'from-green-600 to-green-800',
      Air: 'from-blue-400 to-cyan-500',
      Water: 'from-blue-600 to-purple-600',
    };
    return colors[element] || 'from-purple-500 to-pink-500';
  };

  if (loading || !horoscope) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading your horoscope... ✨</div>
      </div>
    );
  }

  const currentSignInfo = ZODIAC_SIGNS.find(z => z.sign === selectedSign);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white hover:text-purple-200 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-white">Daily Horoscope</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Zodiac Sign Selector */}
        <div className="mb-8">
          <h2 className="text-white text-xl font-semibold mb-4 text-center">
            Select Your Zodiac Sign
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-3">
            {ZODIAC_SIGNS.map((zodiac) => (
              <button
                key={zodiac.sign}
                onClick={() => setSelectedSign(zodiac.sign)}
                className={`p-3 rounded-xl transition-all transform hover:scale-105 ${
                  selectedSign === zodiac.sign
                    ? `bg-gradient-to-br ${getElementColor(zodiac.element)} text-white shadow-lg shadow-purple-500/50`
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="text-3xl mb-1">{zodiac.icon}</div>
                <div className="text-xs font-semibold">{zodiac.sign}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Hero Section */}
        <div className={`bg-gradient-to-br ${getElementColor(currentSignInfo?.element || 'Fire')} rounded-3xl shadow-2xl p-8 mb-8 text-white`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-5xl font-bold mb-2">
                {currentSignInfo?.icon} {horoscope.sign}
              </h2>
              <p className="text-white/90 text-lg">{currentSignInfo?.dates}</p>
              <p className="text-white/80 text-sm mt-1">
                Element: {currentSignInfo?.element}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/90 text-lg mb-2">
                {new Date(horoscope.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm">Overall Rating:</span>
                {renderStars(horoscope.rating.overall)}
              </div>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-3">Today's Overview</h3>
            <p className="text-white/95 leading-relaxed text-lg">
              {horoscope.overview}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Categories */}
          <div className="lg:col-span-2 space-y-6">
            {/* Love */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getCategoryIcon('love')}</span>
                  <h3 className="text-2xl font-bold text-white">Love & Relationships</h3>
                </div>
                {renderStars(horoscope.love.rating)}
              </div>
              <p className="text-white/90 mb-4 leading-relaxed">
                {horoscope.love.prediction}
              </p>
              <div className="bg-pink-500/20 rounded-xl p-4 border-l-4 border-pink-400">
                <p className="text-sm text-white/90">
                  <strong>Advice:</strong> {horoscope.love.advice}
                </p>
              </div>
            </div>

            {/* Career */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getCategoryIcon('career')}</span>
                  <h3 className="text-2xl font-bold text-white">Career & Work</h3>
                </div>
                {renderStars(horoscope.career.rating)}
              </div>
              <p className="text-white/90 mb-4 leading-relaxed">
                {horoscope.career.prediction}
              </p>
              <div className="bg-blue-500/20 rounded-xl p-4 border-l-4 border-blue-400">
                <p className="text-sm text-white/90">
                  <strong>Advice:</strong> {horoscope.career.advice}
                </p>
              </div>
            </div>

            {/* Health */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getCategoryIcon('health')}</span>
                  <h3 className="text-2xl font-bold text-white">Health & Wellness</h3>
                </div>
                {renderStars(horoscope.health.rating)}
              </div>
              <p className="text-white/90 mb-4 leading-relaxed">
                {horoscope.health.prediction}
              </p>
              <div className="bg-green-500/20 rounded-xl p-4 border-l-4 border-green-400">
                <p className="text-sm text-white/90">
                  <strong>Advice:</strong> {horoscope.health.advice}
                </p>
              </div>
            </div>

            {/* Finance */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getCategoryIcon('finance')}</span>
                  <h3 className="text-2xl font-bold text-white">Finance & Money</h3>
                </div>
                {renderStars(horoscope.finance.rating)}
              </div>
              <p className="text-white/90 mb-4 leading-relaxed">
                {horoscope.finance.prediction}
              </p>
              <div className="bg-yellow-500/20 rounded-xl p-4 border-l-4 border-yellow-400">
                <p className="text-sm text-white/90">
                  <strong>Advice:</strong> {horoscope.finance.advice}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Lucky Elements & Tips */}
          <div className="space-y-6">
            {/* Lucky Elements */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 sticky top-4">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                ✨ Lucky Elements
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-white/70 text-sm mb-2">Lucky Numbers</p>
                  <div className="flex gap-2">
                    {horoscope.luckyElements.numbers.map((num) => (
                      <div
                        key={num}
                        className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-white/70 text-sm mb-2">Lucky Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {horoscope.luckyElements.colors.map((color) => (
                      <span
                        key={color}
                        className="px-3 py-1 bg-white/20 rounded-full text-white text-sm border border-white/30"
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-white/70 text-sm mb-2">Lucky Directions</p>
                  <div className="flex flex-wrap gap-2">
                    {horoscope.luckyElements.directions.map((dir) => (
                      <span
                        key={dir}
                        className="px-3 py-1 bg-white/20 rounded-full text-white text-sm border border-white/30"
                      >
                        {dir}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-white/70 text-sm mb-1">Lucky Time</p>
                  <p className="text-white font-semibold">⏰ {horoscope.luckyElements.time}</p>
                </div>

                <div>
                  <p className="text-white/70 text-sm mb-1">Lucky Day</p>
                  <p className="text-white font-semibold">📅 {horoscope.luckyElements.day}</p>
                </div>

                <div>
                  <p className="text-white/70 text-sm mb-1">Lucky Gemstone</p>
                  <p className="text-white font-semibold">💎 {horoscope.luckyElements.gemstone}</p>
                </div>
              </div>
            </div>

            {/* Compatible Signs */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                💫 Compatible Signs Today
              </h3>
              <div className="flex flex-wrap gap-3">
                {horoscope.compatibleSigns.map((sign) => {
                  const signInfo = ZODIAC_SIGNS.find(z => z.sign === sign);
                  return (
                    <div
                      key={sign}
                      className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 border border-white/30"
                    >
                      <span className="text-2xl">{signInfo?.icon}</span>
                      <span className="text-white font-semibold">{sign}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Do's and Don'ts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              ✅ Do's for Today
            </h3>
            <ul className="space-y-3">
              {horoscope.dosAndDonts.dos.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-white/90"
                >
                  <span className="text-green-400 text-xl mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              ❌ Don'ts for Today
            </h3>
            <ul className="space-y-3">
              {horoscope.dosAndDonts.donts.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-white/90"
                >
                  <span className="text-red-400 text-xl mt-0.5">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Special Message */}
        {horoscope.specialMessage && (
          <div className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-md rounded-2xl p-8 border border-purple-400/50 text-center">
            <p className="text-white text-xl font-semibold italic leading-relaxed">
              "{horoscope.specialMessage}"
            </p>
            <p className="text-white/70 text-sm mt-4">- Jyotish Acharya Rakesh Sharma</p>
          </div>
        )}

        {/* Share & Actions */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
            📱 Share on WhatsApp
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
            📸 Share on Instagram
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
            📥 Download as PDF
          </button>
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-8 text-center shadow-2xl">
          <h3 className="text-3xl font-bold text-white mb-4">
            Want Personalized Predictions?
          </h3>
          <p className="text-white/90 text-lg mb-6">
            Get your detailed Kundli analysis and personalized horoscope for the entire year!
          </p>
          <button
            onClick={() => navigate('/choose-plan')}
            className="px-8 py-4 bg-white text-orange-600 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Upgrade to Premium ✨
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/10 backdrop-blur-md border-t border-white/20 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/80 text-sm">
            Horoscope by <strong>Jyotish Acharya Rakesh Sharma</strong>
          </p>
          <p className="text-white/60 text-xs mt-2">
            Powered by ANKR.IN • Ancient Wisdom Meets Modern Technology
          </p>
        </div>
      </div>
    </div>
  );
}

export default DailyHoroscopePage;
