import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface BirthDetails {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  city: string;
  gender: 'male' | 'female';
}

interface BasicKundli {
  ascendant: string;
  moonSign: string;
  sunSign: string;
  planets: Array<{ planet: string; sign: string; house: number }>;
}

function CompleteKundliPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'basic' | 'premium'>('form');
  const [birthDetails, setBirthDetails] = useState<BirthDetails>({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    city: '',
    gender: 'male',
  });
  const [basicKundli, setBasicKundli] = useState<BasicKundli | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBirthDetails({ ...birthDetails, [e.target.name]: e.target.value });
  };

  const handleGenerateKundli = (e: React.FormEvent) => {
    e.preventDefault();

    // Mock basic kundli generation
    const mockBasicKundli: BasicKundli = {
      ascendant: 'Aries',
      moonSign: 'Taurus',
      sunSign: 'Leo',
      planets: [
        { planet: 'Sun ☉', sign: 'Leo', house: 5 },
        { planet: 'Moon ☽', sign: 'Taurus', house: 2 },
        { planet: 'Mars ♂', sign: 'Aries', house: 1 },
        { planet: 'Mercury ☿', sign: 'Virgo', house: 6 },
        { planet: 'Jupiter ♃', sign: 'Sagittarius', house: 9 },
        { planet: 'Venus ♀', sign: 'Libra', house: 7 },
        { planet: 'Saturn ♄', sign: 'Capricorn', house: 10 },
        { planet: 'Rahu ☊', sign: 'Gemini', house: 3 },
        { planet: 'Ketu ☋', sign: 'Sagittarius', house: 9 },
      ],
    };

    setBasicKundli(mockBasicKundli);
    setStep('basic');
  };

  const handleUnlockPremium = () => {
    setShowPaywall(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-700 hover:text-purple-600 transition-colors font-semibold"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-purple-600">Complete Kundli Report</h1>
          <div className="w-40"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Form Step */}
        {step === 'form' && (
          <>
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-3xl shadow-2xl p-8 mb-8 text-center">
              <h2 className="text-4xl font-bold mb-4">🔮 Your Complete Life Analysis</h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Get comprehensive Vedic birth chart analysis with detailed predictions for career, marriage, health, wealth, and spiritual growth
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-4xl mb-3">🆓</div>
                <h3 className="text-xl font-bold mb-2">FREE Basic Kundli</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>✓ Birth Chart (12 Houses)</li>
                  <li>✓ Planetary Positions</li>
                  <li>✓ Ascendant, Moon & Sun Signs</li>
                  <li>✓ Basic House Analysis</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl shadow-lg p-6 border-2 border-orange-400">
                <div className="text-4xl mb-3">💎</div>
                <h3 className="text-xl font-bold mb-2">Premium Detailed Report</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ Comprehensive Life Predictions</li>
                  <li>✓ Career & Business Analysis</li>
                  <li>✓ Marriage & Relationships</li>
                  <li>✓ Health & Longevity</li>
                  <li>✓ Wealth & Property</li>
                  <li>✓ Yogas & Doshas</li>
                  <li>✓ Dasha Timeline (120 years)</li>
                  <li>✓ Personalized Remedies</li>
                  <li>✓ 50+ Page PDF Report</li>
                </ul>
                <div className="mt-4 text-2xl font-bold text-orange-600">₹1,499</div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-4xl mb-3">⏱️</div>
                <h3 className="text-xl font-bold mb-2">Instant Delivery</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>✓ Immediate Results</li>
                  <li>✓ Lifetime Access</li>
                  <li>✓ Download PDF Anytime</li>
                  <li>✓ Share with Family</li>
                </ul>
              </div>
            </div>

            {/* Input Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Enter Birth Details</h3>
              <form onSubmit={handleGenerateKundli} className="max-w-2xl mx-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={birthDetails.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="Rajesh Kumar"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Gender *</label>
                    <select
                      name="gender"
                      value={birthDetails.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={birthDetails.dateOfBirth}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Time of Birth *</label>
                    <input
                      type="time"
                      name="timeOfBirth"
                      value={birthDetails.timeOfBirth}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Accurate time is crucial for precise predictions</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">Place of Birth *</label>
                    <input
                      type="text"
                      name="city"
                      value={birthDetails.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="New Delhi, India"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Generate FREE Basic Kundli 🔮
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Your data is secure and private. We never share your information.
                </p>
              </form>
            </div>
          </>
        )}

        {/* Basic Kundli Results */}
        {step === 'basic' && basicKundli && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-3xl shadow-2xl p-8 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">🔮 {birthDetails.name}'s Kundli</h2>
                  <p className="text-white/90">
                    Born: {new Date(birthDetails.dateOfBirth).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} at {birthDetails.timeOfBirth}
                  </p>
                  <p className="text-white/90">Place: {birthDetails.city}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/80 mb-1">FREE BASIC VERSION</div>
                  <button
                    onClick={handleUnlockPremium}
                    className="px-6 py-3 bg-white text-purple-600 rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    Unlock Detailed Report ₹1,499 →
                  </button>
                </div>
              </div>
            </div>

            {/* Basic Chart Info */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Ascendant (Lagna)</h3>
                <div className="text-4xl font-bold">♈ {basicKundli.ascendant}</div>
                <p className="text-sm mt-2 text-white/90">Your rising sign determines personality</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Moon Sign (Rashi)</h3>
                <div className="text-4xl font-bold">☽ {basicKundli.moonSign}</div>
                <p className="text-sm mt-2 text-white/90">Your emotional and mental nature</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Sun Sign</h3>
                <div className="text-4xl font-bold">☉ {basicKundli.sunSign}</div>
                <p className="text-sm mt-2 text-white/90">Your core identity and soul purpose</p>
              </div>
            </div>

            {/* Birth Chart Visual */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h3 className="text-2xl font-bold mb-6">Birth Chart (North Indian Style)</h3>
              <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-4 gap-0 border-4 border-purple-600">
                  {[12, 1, 2, 3, 11, '', '', 4, 10, '', '', 5, 9, 8, 7, 6].map((house, index) => (
                    <div
                      key={index}
                      className={`aspect-square border border-purple-300 flex items-center justify-center p-2 ${
                        house === '' ? 'bg-purple-100' : 'bg-white'
                      }`}
                    >
                      {house !== '' && (
                        <div className="text-center">
                          <div className="text-xs font-bold text-purple-600">H{house}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {basicKundli.planets
                              .filter(p => p.house === house)
                              .map(p => p.planet.split(' ')[1])
                              .join(' ')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                  12 houses representing different life areas with planetary positions
                </p>
              </div>
            </div>

            {/* Planetary Positions Table */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h3 className="text-2xl font-bold mb-6">Planetary Positions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-purple-50">
                      <th className="px-4 py-3 text-left font-semibold">Planet</th>
                      <th className="px-4 py-3 text-left font-semibold">Sign</th>
                      <th className="px-4 py-3 text-left font-semibold">House</th>
                    </tr>
                  </thead>
                  <tbody>
                    {basicKundli.planets.map((planet, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-3 font-semibold">{planet.planet}</td>
                        <td className="px-4 py-3">{planet.sign}</td>
                        <td className="px-4 py-3">House {planet.house}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Premium Paywall */}
            <div className="bg-gradient-to-br from-orange-50 to-pink-50 border-4 border-orange-400 rounded-3xl shadow-2xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold mb-2">🔒 Unlock Your Complete Life Analysis</h3>
                <p className="text-lg text-gray-700">
                  Get detailed predictions, remedies, and yogas for every life area
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 blur-sm">
                  <h4 className="text-xl font-bold mb-4">💼 Career & Business</h4>
                  <p className="text-gray-600">
                    Detailed analysis of career prospects, suitable fields, success periods, business opportunities...
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 blur-sm">
                  <h4 className="text-xl font-bold mb-4">💕 Marriage & Relationships</h4>
                  <p className="text-gray-600">
                    Marriage timing, spouse characteristics, compatibility, children prediction, relationship advice...
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 blur-sm">
                  <h4 className="text-xl font-bold mb-4">🏥 Health & Longevity</h4>
                  <p className="text-gray-600">
                    General health, vulnerable areas, critical periods, longevity analysis, health remedies...
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 blur-sm">
                  <h4 className="text-xl font-bold mb-4">💰 Wealth & Property</h4>
                  <p className="text-gray-600">
                    Financial stability, wealth sources, peak periods, savings ability, inheritance, investment advice...
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 blur-sm">
                  <h4 className="text-xl font-bold mb-4">📚 Education & Skills</h4>
                  <p className="text-gray-600">
                    Academic strength, suitable fields, higher education, focus periods, study strategies...
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 blur-sm">
                  <h4 className="text-xl font-bold mb-4">🌟 Yogas & Doshas</h4>
                  <p className="text-gray-600">
                    Raja Yoga, Dhana Yoga, Mangal Dosha analysis, effects, timing, remedies for doshas...
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 blur-sm">
                  <h4 className="text-xl font-bold mb-4">📅 Dasha Periods</h4>
                  <p className="text-gray-600">
                    120-year Vimshottari Dasha timeline, current and future periods, predictions for each phase...
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 blur-sm">
                  <h4 className="text-xl font-bold mb-4">🙏 Personalized Remedies</h4>
                  <p className="text-gray-600">
                    Gemstones, mantras, poojas, charities, fasting days, yantras for strengthening weak planets...
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="text-5xl font-bold text-orange-600 mb-4">₹1,499</div>
                <p className="text-gray-600 mb-6">One-time payment • Lifetime access • 50+ page PDF report</p>

                <button
                  onClick={handleUnlockPremium}
                  className="px-12 py-5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-bold text-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                >
                  Unlock Complete Report Now →
                </button>

                <p className="text-sm text-gray-500 mt-4">
                  ✓ Secure payment via Razorpay • ✓ Instant delivery • ✓ Download PDF
                </p>
              </div>
            </div>
          </>
        )}

        {/* Premium Payment Modal */}
        {showPaywall && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Unlock Complete Report</h3>
                <button
                  onClick={() => setShowPaywall(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="bg-gradient-to-r from-orange-100 to-pink-100 rounded-2xl p-6 mb-6">
                <h4 className="text-xl font-bold mb-4">What You'll Get:</h4>
                <ul className="space-y-2 text-sm">
                  <li>✓ Complete life predictions (Career, Marriage, Health, Wealth)</li>
                  <li>✓ Yogas & Doshas analysis with remedies</li>
                  <li>✓ 120-year Dasha timeline with predictions</li>
                  <li>✓ Personalized remedies (Gemstones, Mantras, Poojas)</li>
                  <li>✓ Lucky elements (Numbers, Colors, Days, Directions)</li>
                  <li>✓ Strengths and challenges analysis</li>
                  <li>✓ Foreign travel and settlement prospects</li>
                  <li>✓ Spiritual path guidance</li>
                  <li>✓ 50+ page detailed PDF report</li>
                  <li>✓ Lifetime access to your report</li>
                </ul>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-orange-600 mb-2">₹1,499</div>
                <p className="text-sm text-gray-600">One-time payment • No subscription</p>
              </div>

              <button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all mb-3">
                Pay ₹1,499 via Razorpay
              </button>

              <p className="text-center text-xs text-gray-500">
                🔒 Secure payment • Powered by Razorpay
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            Kundli analysis by <strong>Jyotish Acharya Rakesh Sharma</strong>
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Powered by ANKR.IN • Authentic Vedic Astrology
          </p>
        </div>
      </div>
    </div>
  );
}

export default CompleteKundliPage;
