import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type EventType =
  | 'marriage'
  | 'engagement'
  | 'business-launch'
  | 'house-warming'
  | 'vehicle-purchase'
  | 'surgery'
  | 'travel'
  | 'naming-ceremony'
  | 'education-start'
  | 'property-purchase';

interface Muhurat {
  date: Date;
  startTime: Date;
  endTime: Date;
  score: number;
  quality: 'Excellent' | 'Very Good' | 'Good' | 'Average' | 'Below Average';
  nakshatra: string;
  tithi: string;
  yoga: string;
  karana: string;
  reasons: string[];
  warnings?: string[];
}

const EVENT_TYPES = [
  {
    id: 'marriage' as EventType,
    name: 'Marriage / Wedding',
    icon: '💒',
    description: 'Find the perfect date for your wedding ceremony',
    color: 'from-pink-500 to-rose-500',
    popular: true,
  },
  {
    id: 'engagement' as EventType,
    name: 'Engagement',
    icon: '💍',
    description: 'Choose an auspicious time for engagement',
    color: 'from-purple-500 to-pink-500',
    popular: true,
  },
  {
    id: 'house-warming' as EventType,
    name: 'House Warming (Griha Pravesh)',
    icon: '🏡',
    description: 'Enter your new home at the right time',
    color: 'from-orange-500 to-red-500',
    popular: true,
  },
  {
    id: 'business-launch' as EventType,
    name: 'Business Launch',
    icon: '🚀',
    description: 'Launch your business for prosperity',
    color: 'from-green-500 to-teal-500',
    popular: true,
  },
  {
    id: 'vehicle-purchase' as EventType,
    name: 'Vehicle Purchase',
    icon: '🚗',
    description: 'Buy your vehicle at an auspicious time',
    color: 'from-blue-500 to-cyan-500',
    popular: false,
  },
  {
    id: 'naming-ceremony' as EventType,
    name: 'Naming Ceremony (Namkaran)',
    icon: '👶',
    description: 'Name your baby at the right muhurat',
    color: 'from-yellow-500 to-orange-500',
    popular: false,
  },
  {
    id: 'education-start' as EventType,
    name: 'Education Start (Vidyarambh)',
    icon: '📚',
    description: 'Begin education journey auspiciously',
    color: 'from-indigo-500 to-purple-500',
    popular: false,
  },
  {
    id: 'property-purchase' as EventType,
    name: 'Property Purchase',
    icon: '🏢',
    description: 'Purchase property at favorable time',
    color: 'from-gray-600 to-gray-800',
    popular: false,
  },
  {
    id: 'surgery' as EventType,
    name: 'Surgery / Medical',
    icon: '⚕️',
    description: 'Choose safe time for medical procedures',
    color: 'from-red-500 to-pink-500',
    popular: false,
  },
  {
    id: 'travel' as EventType,
    name: 'Travel / Journey',
    icon: '✈️',
    description: 'Start your journey at auspicious time',
    color: 'from-cyan-500 to-blue-500',
    popular: false,
  },
];

// Mock function - replace with actual API call
function generateMockMuhurats(eventType: EventType): Muhurat[] {
  const muhurats: Muhurat[] = [];
  const today = new Date();

  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i + 1);

    const startTime = new Date(date);
    startTime.setHours(10 + Math.floor(Math.random() * 6), 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 2, 0, 0, 0);

    const score = 60 + Math.floor(Math.random() * 40);
    let quality: 'Excellent' | 'Very Good' | 'Good' | 'Average' | 'Below Average';
    if (score >= 85) quality = 'Excellent';
    else if (score >= 70) quality = 'Very Good';
    else if (score >= 55) quality = 'Good';
    else quality = 'Average';

    muhurats.push({
      date,
      startTime,
      endTime,
      score,
      quality,
      nakshatra: ['Rohini', 'Pushya', 'Revati', 'Hasta', 'Uttara Phalguni'][Math.floor(Math.random() * 5)],
      tithi: ['Dwitiya', 'Tritiya', 'Panchami', 'Saptami', 'Dashami'][Math.floor(Math.random() * 5)],
      yoga: ['Siddhi', 'Shubha', 'Dhruva', 'Ayushman'][Math.floor(Math.random() * 4)],
      karana: ['Bava', 'Balava', 'Kaulava', 'Taitila'][Math.floor(Math.random() * 4)],
      reasons: [
        'Auspicious Nakshatra for this event',
        'Favorable planetary alignment',
        'Tithi supports new beginnings',
      ],
      warnings: score < 70 ? ['Consider avoiding evening hours for better results'] : undefined,
    });
  }

  return muhurats;
}

function MuhuratFinderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'results'>('select');
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [muhurats, setMuhurats] = useState<Muhurat[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedMuhurat, setSelectedMuhurat] = useState<Muhurat | null>(null);

  const handleEventSelect = (eventType: EventType) => {
    setSelectedEvent(eventType);
    const mockMuhurats = generateMockMuhurats(eventType);
    setMuhurats(mockMuhurats);
    setStep('results');
  };

  const handleBackToSelection = () => {
    setStep('select');
    setSelectedEvent(null);
    setMuhurats([]);
  };

  const getQualityColor = (quality: string) => {
    const colors: Record<string, string> = {
      'Excellent': 'text-green-600 bg-green-100',
      'Very Good': 'text-blue-600 bg-blue-100',
      'Good': 'text-purple-600 bg-purple-100',
      'Average': 'text-orange-600 bg-orange-100',
      'Below Average': 'text-red-600 bg-red-100',
    };
    return colors[quality] || 'text-gray-600 bg-gray-100';
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-purple-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const selectedEventInfo = EVENT_TYPES.find(e => e.id === selectedEvent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => step === 'results' ? handleBackToSelection() : navigate('/dashboard')}
            className="text-gray-700 hover:text-orange-600 transition-colors font-semibold"
          >
            ← {step === 'results' ? 'Back to Event Selection' : 'Back to Dashboard'}
          </button>
          <h1 className="text-2xl font-bold text-orange-600">Muhurat Finder</h1>
          <div className="w-40"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        {step === 'select' && (
          <>
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-3xl shadow-2xl p-8 mb-8 text-center">
              <h2 className="text-4xl font-bold mb-4">🕉️ Find Your Auspicious Muhurat</h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Choose the perfect date and time for life's important events based on Vedic astrology and Panchang calculations
              </p>
            </div>

            {/* Popular Events */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">⭐ Most Popular</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {EVENT_TYPES.filter(e => e.popular).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleEventSelect(event.id)}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 p-6 text-left"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${event.color} rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                      {event.icon}
                    </div>
                    <h4 className="text-lg font-bold mb-2 text-gray-800">{event.name}</h4>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* All Events */}
            <div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">📅 All Events</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {EVENT_TYPES.filter(e => !e.popular).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleEventSelect(event.id)}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 text-left flex items-center gap-4"
                  >
                    <div className={`w-14 h-14 bg-gradient-to-br ${event.color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                      {event.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-1">{event.name}</h4>
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Results Section */}
        {step === 'results' && selectedEventInfo && (
          <>
            {/* Event Header */}
            <div className={`bg-gradient-to-r ${selectedEventInfo.color} text-white rounded-3xl shadow-2xl p-8 mb-8`}>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-5xl">
                  {selectedEventInfo.icon}
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedEventInfo.name}</h2>
                  <p className="text-white/90 text-lg">{selectedEventInfo.description}</p>
                </div>
              </div>
            </div>

            {/* Best Muhurat Highlight */}
            {muhurats[0] && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-2xl shadow-xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">✨</span>
                  <h3 className="text-2xl font-bold text-green-800">Best Recommended Muhurat</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className={`text-5xl font-bold ${getScoreColor(muhurats[0].score)}`}>
                        {muhurats[0].score}
                      </span>
                      <span className="text-gray-600">/100</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getQualityColor(muhurats[0].quality)}`}>
                        {muhurats[0].quality}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📅</span>
                        <span className="font-semibold text-lg">
                          {muhurats[0].date.toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⏰</span>
                        <span className="font-semibold text-lg">
                          {muhurats[0].startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} -
                          {muhurats[0].endTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Panchang Details:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-gray-600 text-xs">Nakshatra</p>
                        <p className="font-semibold">{muhurats[0].nakshatra}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-gray-600 text-xs">Tithi</p>
                        <p className="font-semibold">{muhurats[0].tithi}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-gray-600 text-xs">Yoga</p>
                        <p className="font-semibold">{muhurats[0].yoga}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-gray-600 text-xs">Karana</p>
                        <p className="font-semibold">{muhurats[0].karana}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedMuhurat(muhurats[0]);
                    setShowPremiumModal(true);
                  }}
                  className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Get Detailed Report (₹299) →
                </button>
              </div>
            )}

            {/* All Muhurats List */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">📊 All Auspicious Muhurats</h3>
              <div className="space-y-4">
                {muhurats.map((muhurat, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                          <h4 className="text-xl font-bold text-gray-800">
                            {muhurat.date.toLocaleDateString('en-IN', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h4>
                        </div>
                        <p className="text-lg text-gray-600">
                          ⏰ {muhurat.startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} -
                          {muhurat.endTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(muhurat.score)}`}>
                          {muhurat.score}
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getQualityColor(muhurat.quality)}`}>
                          {muhurat.quality}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-3 mb-4">
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs text-purple-600 font-semibold mb-1">Nakshatra</p>
                        <p className="font-bold text-purple-800">{muhurat.nakshatra}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-600 font-semibold mb-1">Tithi</p>
                        <p className="font-bold text-blue-800">{muhurat.tithi}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-600 font-semibold mb-1">Yoga</p>
                        <p className="font-bold text-green-800">{muhurat.yoga}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-xs text-orange-600 font-semibold mb-1">Karana</p>
                        <p className="font-bold text-orange-800">{muhurat.karana}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          ✓ {muhurat.reasons[0]}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMuhurat(muhurat);
                          setShowPremiumModal(true);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Premium Modal */}
        {showPremiumModal && selectedMuhurat && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Detailed Muhurat Report</h3>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-2xl p-6 mb-6">
                <h4 className="text-xl font-bold mb-4">Unlock Premium Features:</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-xl mt-1">✓</span>
                    <span>Complete Panchang analysis with all 5 elements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-xl mt-1">✓</span>
                    <span>Planetary positions and their effects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-xl mt-1">✓</span>
                    <span>Detailed remedies and recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-xl mt-1">✓</span>
                    <span>Inauspicious periods (Rahu Kaal, Gulika) to avoid</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-xl mt-1">✓</span>
                    <span>Event-specific rituals and mantras</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-xl mt-1">✓</span>
                    <span>Downloadable PDF report with calendar integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-xl mt-1">✓</span>
                    <span>Personal consultation with Acharya (15 mins)</span>
                  </li>
                </ul>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-orange-600 mb-2">₹299</div>
                <p className="text-gray-600">One-time payment • Instant delivery</p>
              </div>

              <button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all mb-3">
                Buy Detailed Report (₹299)
              </button>

              <p className="text-center text-sm text-gray-500">
                Powered by Razorpay • Secure Payment • Instant Access
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            Muhurat calculations by <strong>Jyotish Acharya Rakesh Sharma</strong>
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Powered by ANKR.IN • Vedic Wisdom for Modern Life
          </p>
        </div>
      </div>
    </div>
  );
}

export default MuhuratFinderPage;
