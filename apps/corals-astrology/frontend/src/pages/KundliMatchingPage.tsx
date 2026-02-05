import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface BirthDetails {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  gender: 'male' | 'female';
}

interface GunaScore {
  name: string;
  description: string;
  maxPoints: number;
  scoredPoints: number;
  compatibility: string;
  analysis: string;
}

interface Dosha {
  name: string;
  type: string;
  severity: string;
  description: string;
  effects: string[];
  isPresent: boolean;
  remedyLevel: string;
}

interface Upaya {
  id: string;
  doshaType: string;
  title: string;
  category: string;
  description: string;
  procedure: string[];
  duration: string;
  cost: string;
  effectiveness: string;
  priority: number;
}

interface MatchingResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  compatibility: string;
  gunaScores: GunaScore[];
  doshas?: Dosha[];
  upayaRemedies?: Upaya[];
  mangalDosha?: {
    boy: boolean;
    girl: boolean;
    cancelled: boolean;
    reason?: string;
  };
  detailedAnalysis?: {
    marriageProspects: string;
    childrenProspects: string;
    financialProspects: string;
    healthProspects: string;
    longevityAnalysis: string;
  };
  recommendations?: string[];
}

const KundliMatchingPage: React.FC = () => {
  const [step, setStep] = useState<'input' | 'basic' | 'premium'>('input');
  const [boyDetails, setBoyDetails] = useState<BirthDetails>({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    gender: 'male',
  });
  const [girlDetails, setGirlDetails] = useState<BirthDetails>({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    gender: 'female',
  });

  // Mock result - in real app, fetch from API
  const [result, setResult] = useState<MatchingResult | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleBoyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBoyDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGirlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGirlDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBasicMatching = () => {
    // Mock basic matching result
    const mockResult: MatchingResult = {
      totalScore: 26,
      maxScore: 36,
      percentage: 72,
      compatibility: 'Very Good',
      gunaScores: [
        {
          name: 'Varna (Caste/Class)',
          description: 'Spiritual compatibility',
          maxPoints: 1,
          scoredPoints: 1,
          compatibility: 'Good',
          analysis: 'Varna compatibility is good. Similar spiritual outlook.',
        },
        {
          name: 'Vashya (Mutual Attraction)',
          description: 'Magnetic control',
          maxPoints: 2,
          scoredPoints: 2,
          compatibility: 'Excellent',
          analysis: 'Strong mutual attraction and understanding.',
        },
        {
          name: 'Tara (Star)',
          description: 'Birth star compatibility',
          maxPoints: 3,
          scoredPoints: 3,
          compatibility: 'Excellent',
          analysis: 'Birth star compatibility indicates good destiny alignment.',
        },
        {
          name: 'Yoni (Sexual Compatibility)',
          description: 'Physical compatibility',
          maxPoints: 4,
          scoredPoints: 3,
          compatibility: 'Good',
          analysis: 'Good physical and sexual compatibility.',
        },
        {
          name: 'Graha Maitri (Planetary Friendship)',
          description: 'Mental compatibility',
          maxPoints: 5,
          scoredPoints: 4,
          compatibility: 'Good',
          analysis: 'Good mental compatibility and intellectual bonding.',
        },
        {
          name: 'Gan (Temperament)',
          description: 'Nature compatibility',
          maxPoints: 6,
          scoredPoints: 5,
          compatibility: 'Excellent',
          analysis: 'Excellent temperament match.',
        },
        {
          name: 'Bhakoot (Love & Compatibility)',
          description: 'Emotional bonding',
          maxPoints: 7,
          scoredPoints: 0,
          compatibility: 'Poor',
          analysis: '⚠️ Bhakoot Dosha detected! May cause financial and health issues.',
        },
        {
          name: 'Nadi (Health & Progeny)',
          description: 'Health compatibility',
          maxPoints: 8,
          scoredPoints: 8,
          compatibility: 'Excellent',
          analysis: 'Perfect Nadi compatibility. Excellent health and progeny prospects.',
        },
      ],
    };

    setResult(mockResult);
    setStep('basic');
  };

  const handlePremiumUnlock = () => {
    // In real app, process payment
    if (!result) return;

    const premiumResult: MatchingResult = {
      ...result,
      doshas: [
        {
          name: 'Bhakoot Dosha',
          type: 'Bhakoot',
          severity: 'Medium',
          description: 'Rashi incompatibility causing emotional and financial issues',
          effects: [
            'Financial instability',
            'Emotional conflicts',
            'Family tensions',
            'Loss of wealth',
          ],
          isPresent: true,
          remedyLevel: 'Important',
        },
        {
          name: 'Mangal Dosha (Manglik)',
          type: 'Mangal',
          severity: 'High',
          description: 'Mars positioned in certain houses causing marital difficulties',
          effects: [
            'Delays in marriage',
            'Conflicts and misunderstandings',
            'Health issues for spouse',
            'Financial difficulties',
          ],
          isPresent: true,
          remedyLevel: 'Critical',
        },
      ],
      upayaRemedies: [
        {
          id: 'mangal-1',
          doshaType: 'Mangal Dosha',
          title: 'Mangal Shanti Pooja',
          category: 'Pooja',
          description: 'Special pooja to appease Mars and reduce Manglik effects',
          procedure: [
            'Book pandit through our platform',
            'Perform on Tuesday during Mars hora',
            'Offer red flowers, sindoor, and sweets',
            'Recite Mangal mantras 108 times',
            'Feed red lentils to workers/poor',
          ],
          duration: '2-3 hours',
          cost: '₹5,000 - ₹10,000',
          effectiveness: 'High',
          priority: 1,
        },
        {
          id: 'mangal-2',
          doshaType: 'Mangal Dosha',
          title: 'Red Coral Gemstone',
          category: 'Gemstone',
          description: 'Wear Red Coral (Moonga) to strengthen Mars positively',
          procedure: [
            'Get birth chart analyzed by astrologer',
            'Purchase certified Red Coral (minimum 5 carats)',
            'Set in gold or copper ring',
            'Wear on ring finger of right hand',
            'Wear on Tuesday morning after energizing',
          ],
          duration: 'Lifetime',
          cost: '₹8,000 - ₹25,000',
          effectiveness: 'High',
          priority: 2,
        },
        {
          id: 'mangal-3',
          doshaType: 'Mangal Dosha',
          title: 'Hanuman Chalisa Path',
          category: 'Mantra',
          description: 'Daily recitation of Hanuman Chalisa for 40 days',
          procedure: [
            'Wake up early morning',
            'Take bath and wear clean clothes',
            'Light lamp with sesame oil',
            'Recite Hanuman Chalisa with devotion',
            'Continue for 40 consecutive days',
          ],
          duration: '40 days',
          cost: 'Free (self-practice)',
          effectiveness: 'Medium',
          priority: 3,
        },
        {
          id: 'bhakoot-1',
          doshaType: 'Bhakoot Dosha',
          title: 'Lakshmi Narayan Pooja',
          category: 'Pooja',
          description: 'For financial stability and marital harmony',
          procedure: [
            'Perform on full moon day',
            'Offer lotus flowers',
            'Light ghee lamps',
            'Recite Vishnu Sahasranama',
            'Donate food and clothes',
          ],
          duration: '3 hours',
          cost: '₹6,000 - ₹10,000',
          effectiveness: 'Medium',
          priority: 1,
        },
      ],
      mangalDosha: {
        boy: true,
        girl: false,
        cancelled: false,
      },
      detailedAnalysis: {
        marriageProspects: 'Good prospects with some challenges. Open communication will ensure success.',
        childrenProspects: 'Excellent prospects for healthy children. Good genetic compatibility.',
        financialProspects: 'Moderate financial stability. Careful planning and budgeting advised.',
        healthProspects: 'Both partners will enjoy good health. Long life indicated.',
        longevityAnalysis: 'Strong marital longevity. Lifelong companionship indicated with proper remedies.',
      },
      recommendations: [
        'Good match with some challenges.',
        'Perform remedial poojas before marriage.',
        'Critical: Address Mangal Dosha immediately.',
        '2 Dosha(s) detected. Perform recommended upayas.',
        'Consult Acharya Rakesh Ji for personalized guidance.',
        'Book a pandit for pre-marriage poojas through our platform.',
      ],
    };

    setResult(premiumResult);
    setStep('premium');
    setShowPaywall(false);
  };

  const getCompatibilityColor = (compatibility: string) => {
    switch (compatibility.toLowerCase()) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'very good':
        return 'text-blue-600 bg-blue-100';
      case 'good':
        return 'text-blue-500 bg-blue-50';
      case 'average':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-orange-600 bg-orange-100';
      case 'not recommended':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Pooja': '🙏',
      'Mantra': '📿',
      'Gemstone': '💎',
      'Charity': '❤️',
      'Fasting': '🌙',
      'Other': '✨',
    };
    return icons[category] || '✨';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-orange-600 flex items-center gap-2">
              <span>🕉️</span>
              <span>CORALS</span>
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
      <section className="bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="text-6xl mb-4">💑</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Kundli Matching (Gun Milan)</h1>
          <p className="text-xl mb-2">
            Vedic Compatibility Analysis for Marriage
          </p>
          <p className="text-sm opacity-90">Ashtakoot System • 36 Gunas • Dosha Analysis • Remedies</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Input Form */}
        {step === 'input' && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Enter Birth Details</h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Boy's Details */}
                <div className="p-6 bg-blue-50 rounded-lg">
                  <h3 className="text-xl font-bold mb-4 text-blue-900 flex items-center gap-2">
                    <span>👨</span>
                    <span>Boy's Details (Groom)</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={boyDetails.name}
                        onChange={handleBoyChange}
                        placeholder="Full name"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth *</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={boyDetails.dateOfBirth}
                        onChange={handleBoyChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Time of Birth *</label>
                      <input
                        type="time"
                        name="timeOfBirth"
                        value={boyDetails.timeOfBirth}
                        onChange={handleBoyChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Place of Birth *</label>
                      <input
                        type="text"
                        name="placeOfBirth"
                        value={boyDetails.placeOfBirth}
                        onChange={handleBoyChange}
                        placeholder="City, State, Country"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Girl's Details */}
                <div className="p-6 bg-pink-50 rounded-lg">
                  <h3 className="text-xl font-bold mb-4 text-pink-900 flex items-center gap-2">
                    <span>👩</span>
                    <span>Girl's Details (Bride)</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={girlDetails.name}
                        onChange={handleGirlChange}
                        placeholder="Full name"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth *</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={girlDetails.dateOfBirth}
                        onChange={handleGirlChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Time of Birth *</label>
                      <input
                        type="time"
                        name="timeOfBirth"
                        value={girlDetails.timeOfBirth}
                        onChange={handleGirlChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Place of Birth *</label>
                      <input
                        type="text"
                        name="placeOfBirth"
                        value={girlDetails.placeOfBirth}
                        onChange={handleGirlChange}
                        placeholder="City, State, Country"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  onClick={handleBasicMatching}
                  className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white py-4 rounded-lg font-semibold text-lg hover:from-pink-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
                >
                  Calculate Kundli Matching (Free) →
                </button>
              </div>
            </div>

            {/* Features Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-300">
                <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                  <span>✨</span>
                  <span>Free Basic Matching</span>
                </h3>
                <ul className="space-y-2 text-sm text-green-900">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>36 Guna matching score</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Ashtakoot breakdown (8 aspects)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Overall compatibility percentage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Basic recommendations</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-300">
                <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                  <span>👑</span>
                  <span>Premium Detailed Report (₹999)</span>
                </h3>
                <ul className="space-y-2 text-sm text-purple-900">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">✓</span>
                    <span><strong>Dosha Analysis</strong> (Mangal, Nadi, Bhakoot)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">✓</span>
                    <span><strong>Upaya Remedies</strong> (Poojas, Mantras, Gemstones)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">✓</span>
                    <span><strong>Detailed Predictions</strong> (Marriage, Children, Finance, Health)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">✓</span>
                    <span><strong>Personalized Recommendations</strong> from Acharya Ji</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">✓</span>
                    <span><strong>PDF Report Download</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Basic Results */}
        {step === 'basic' && result && (
          <div className="max-w-5xl mx-auto">
            {/* Overall Score */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
              <h2 className="text-3xl font-bold mb-6">Kundli Matching Result</h2>
              <div className="flex items-center justify-center gap-12 mb-6">
                <div>
                  <div className="text-6xl font-bold text-orange-600">{result.totalScore}/{result.maxScore}</div>
                  <div className="text-gray-600 mt-2">Total Gunas</div>
                </div>
                <div>
                  <div className="text-6xl font-bold text-purple-600">{result.percentage}%</div>
                  <div className="text-gray-600 mt-2">Compatibility</div>
                </div>
              </div>
              <div className={`inline-block px-6 py-3 rounded-full text-xl font-bold ${getCompatibilityColor(result.compatibility)}`}>
                {result.compatibility} Match!
              </div>
            </div>

            {/* Guna Breakdown */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h3 className="text-2xl font-bold mb-6">Ashtakoot Guna Milan (8 Aspects)</h3>
              <div className="space-y-4">
                {result.gunaScores.map((guna, idx) => (
                  <div key={idx} className="border-2 border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold">{guna.name}</h4>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getCompatibilityColor(guna.compatibility)}`}>
                          {guna.compatibility}
                        </span>
                        <span className="text-2xl font-bold text-orange-600">
                          {guna.scoredPoints}/{guna.maxPoints}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{guna.description}</p>
                    <p className="text-gray-700">{guna.analysis}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Unlock CTA */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-2xl p-8 text-white text-center mb-8">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-3xl font-bold mb-4">Unlock Detailed Analysis</h3>
              <p className="text-xl mb-6">
                Get complete Dosha analysis, personalized remedies (Upaya), and detailed predictions
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl mb-2">⚠️</div>
                  <h4 className="font-bold mb-2">Dosha Detection</h4>
                  <p className="text-sm opacity-90">Mangal, Nadi, Bhakoot, Kaal Sarp & other doshas</p>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl mb-2">🙏</div>
                  <h4 className="font-bold mb-2">Upaya Remedies</h4>
                  <p className="text-sm opacity-90">Poojas, mantras, gemstones, charity recommendations</p>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <div className="text-3xl mb-2">📊</div>
                  <h4 className="font-bold mb-2">Detailed Predictions</h4>
                  <p className="text-sm opacity-90">Marriage, children, finance, health analysis</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="text-left">
                  <div className="text-3xl font-bold line-through opacity-70">₹1,999</div>
                  <div className="text-5xl font-bold">₹999</div>
                  <div className="text-sm opacity-90">One-time payment</div>
                </div>
                <button
                  onClick={() => setShowPaywall(true)}
                  className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-xl hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Unlock Now →
                </button>
              </div>
              <p className="text-sm mt-4 opacity-90">
                ✓ Instant access • ✓ PDF download • ✓ Expert consultation included
              </p>
            </div>
          </div>
        )}

        {/* Premium Results */}
        {step === 'premium' && result && (
          <div className="max-w-5xl mx-auto">
            {/* Overall Score (same as basic) */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
              <div className="inline-block px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-bold mb-4">
                👑 PREMIUM REPORT
              </div>
              <h2 className="text-3xl font-bold mb-6">Complete Kundli Matching Analysis</h2>
              <div className="flex items-center justify-center gap-12 mb-6">
                <div>
                  <div className="text-6xl font-bold text-orange-600">{result.totalScore}/{result.maxScore}</div>
                  <div className="text-gray-600 mt-2">Total Gunas</div>
                </div>
                <div>
                  <div className="text-6xl font-bold text-purple-600">{result.percentage}%</div>
                  <div className="text-gray-600 mt-2">Compatibility</div>
                </div>
              </div>
              <div className={`inline-block px-6 py-3 rounded-full text-xl font-bold ${getCompatibilityColor(result.compatibility)}`}>
                {result.compatibility} Match!
              </div>
            </div>

            {/* Mangal Dosha Analysis */}
            {result.mangalDosha && (
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span>🔴</span>
                  <span>Mangal Dosha (Manglik) Analysis</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className={`p-4 rounded-lg ${result.mangalDosha.boy ? 'bg-red-50 border-2 border-red-300' : 'bg-green-50 border-2 border-green-300'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">Boy (Groom)</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${result.mangalDosha.boy ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                        {result.mangalDosha.boy ? 'Manglik' : 'Not Manglik'}
                      </span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${result.mangalDosha.girl ? 'bg-red-50 border-2 border-red-300' : 'bg-green-50 border-2 border-green-300'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">Girl (Bride)</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${result.mangalDosha.girl ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                        {result.mangalDosha.girl ? 'Manglik' : 'Not Manglik'}
                      </span>
                    </div>
                  </div>
                </div>
                {result.mangalDosha.cancelled && result.mangalDosha.reason && (
                  <div className="p-4 bg-green-100 border-2 border-green-500 rounded-lg">
                    <p className="text-green-900 font-semibold">✓ {result.mangalDosha.reason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Doshas Detected */}
            {result.doshas && result.doshas.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Doshas Detected ({result.doshas.length})</span>
                </h3>
                <div className="space-y-6">
                  {result.doshas.map((dosha, idx) => (
                    <div key={idx} className="border-2 border-red-200 bg-red-50 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-red-900">{dosha.name}</h4>
                          <p className="text-red-700">{dosha.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          dosha.severity === 'High' ? 'bg-red-600 text-white' :
                          dosha.severity === 'Medium' ? 'bg-orange-500 text-white' :
                          'bg-yellow-500 text-white'
                        }`}>
                          {dosha.severity} Severity
                        </span>
                      </div>
                      <div className="mb-4">
                        <h5 className="font-semibold text-red-900 mb-2">Possible Effects:</h5>
                        <ul className="space-y-1">
                          {dosha.effects.map((effect, i) => (
                            <li key={i} className="flex items-start gap-2 text-red-800">
                              <span>•</span>
                              <span>{effect}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className={`px-4 py-2 rounded-lg ${
                        dosha.remedyLevel === 'Critical' ? 'bg-red-600 text-white' :
                        dosha.remedyLevel === 'Important' ? 'bg-orange-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        <span className="font-bold">Remedy Priority: {dosha.remedyLevel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upaya Remedies */}
            {result.upayaRemedies && result.upayaRemedies.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span>🙏</span>
                  <span>Recommended Upaya (Remedies)</span>
                </h3>
                <div className="space-y-6">
                  {result.upayaRemedies.map((upaya, idx) => (
                    <div key={idx} className="border-2 border-green-200 bg-green-50 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <span className="text-4xl">{getCategoryIcon(upaya.category)}</span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-xl font-bold text-green-900">{upaya.title}</h4>
                              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-bold">
                                Priority {upaya.priority}
                              </span>
                            </div>
                            <p className="text-green-700 mb-1">{upaya.description}</p>
                            <div className="flex items-center gap-4 text-sm text-green-800">
                              <span>📅 {upaya.duration}</span>
                              <span>💰 {upaya.cost}</span>
                              <span className={`px-2 py-1 rounded ${
                                upaya.effectiveness === 'High' ? 'bg-green-600 text-white' :
                                upaya.effectiveness === 'Medium' ? 'bg-yellow-500 text-white' :
                                'bg-gray-400 text-white'
                              }`}>
                                {upaya.effectiveness} Effectiveness
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-semibold text-green-900 mb-2">Procedure:</h5>
                        <ol className="space-y-1">
                          {upaya.procedure.map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-green-800">
                              <span className="font-semibold">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      {upaya.category === 'Pooja' && (
                        <div className="mt-4">
                          <Link
                            to="/book-pandit"
                            className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700"
                          >
                            Book Pandit for This Pooja →
                          </Link>
                        </div>
                      )}
                      {upaya.category === 'Gemstone' && (
                        <div className="mt-4">
                          <Link
                            to="/store?category=gemstones"
                            className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700"
                          >
                            Buy Certified Gemstone →
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Analysis */}
            {result.detailedAnalysis && (
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span>📊</span>
                  <span>Detailed Life Predictions</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-bold text-purple-900 mb-2">💑 Marriage Prospects</h4>
                    <p className="text-gray-700">{result.detailedAnalysis.marriageProspects}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-bold text-blue-900 mb-2">👶 Children Prospects</h4>
                    <p className="text-gray-700">{result.detailedAnalysis.childrenProspects}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-bold text-green-900 mb-2">💰 Financial Prospects</h4>
                    <p className="text-gray-700">{result.detailedAnalysis.financialProspects}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-bold text-red-900 mb-2">⚕️ Health Prospects</h4>
                    <p className="text-gray-700">{result.detailedAnalysis.healthProspects}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg md:col-span-2">
                    <h4 className="font-bold text-orange-900 mb-2">🕐 Longevity Analysis</h4>
                    <p className="text-gray-700">{result.detailedAnalysis.longevityAnalysis}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && (
              <div className="bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl shadow-lg p-8 mb-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span>💡</span>
                  <span>Expert Recommendations</span>
                </h3>
                <ul className="space-y-3">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-800">
                      <span className="text-orange-600 font-bold text-xl">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Download & Consultation CTAs */}
            <div className="grid md:grid-cols-2 gap-6">
              <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg">
                📄 Download PDF Report
              </button>
              <Link
                to="/ask-acharya"
                className="block bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg text-center"
              >
                💬 Consult Acharya Ji
              </Link>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaywall && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🔓</div>
                <h3 className="text-2xl font-bold mb-2">Unlock Detailed Report</h3>
                <p className="text-gray-600">Get complete Dosha analysis & remedies</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Report Price:</span>
                  <div className="text-right">
                    <div className="text-gray-400 line-through text-sm">₹1,999</div>
                    <div className="text-3xl font-bold text-purple-600">₹999</div>
                  </div>
                </div>
                <div className="text-sm text-green-600 font-semibold">
                  🎉 Save ₹1,000 (50% OFF)
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  onClick={handlePremiumUnlock}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600"
                >
                  Pay ₹999 & Unlock Now
                </button>
                <button
                  onClick={() => setShowPaywall(false)}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Maybe Later
                </button>
              </div>

              <p className="text-xs text-center text-gray-500">
                ✓ 100% Secure Payment • ✓ Instant Access • ✓ Money-back Guarantee
              </p>
            </div>
          </div>
        )}
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

export default KundliMatchingPage;
