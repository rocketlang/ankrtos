import { Link } from 'react-router-dom';

export default function SystemsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-950 via-purple-900 to-cosmic-900">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-display font-bold text-white">
            🔮 CoralsAstrology
          </Link>
          <div className="flex gap-6">
            <Link to="/" className="text-purple-200 hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/about" className="text-purple-200 hover:text-white transition-colors">
              About
            </Link>
            <Link to="/systems" className="text-white font-semibold">
              Systems
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-display font-bold text-amber-300 mb-4">
            🌟 Our Astrology Systems
          </h1>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            The world's most comprehensive astrology platform combining 7 ancient traditions
            with modern AI technology
          </p>
        </div>

        {/* Systems Grid */}
        <div className="space-y-12 max-w-6xl mx-auto">

          {/* Vedic Astrology */}
          <SystemCard
            icon="📿"
            title="Vedic Astrology (Jyotish Shastra)"
            subtitle="ज्योतिष शास्त्र - Ancient Indian Wisdom"
            badge="CORE SYSTEM"
            badgeColor="from-cyan-500 to-blue-500"
            features={[
              'Complete Kundli generation with D1-D60 divisional charts',
              'Vimshottari Dasha system (120-year planetary periods)',
              'Yogas, Doshas (Mangal, Kaal Sarp, Pitra, etc.)',
              'Nakshatras (27 lunar mansions) analysis',
              'Ashtakavarga scoring system',
              'Transit predictions and timing',
              'Marriage compatibility (Ashta Koota matching)',
            ]}
            pricing="₹999 - ₹2,499"
          />

          {/* Lal Kitab */}
          <SystemCard
            icon="📕"
            title="Lal Kitab (Red Book Astrology)"
            subtitle="लाल किताब - Unique Remedial System"
            badge="PREMIUM"
            badgeColor="from-red-500 to-orange-600"
            features={[
              'Debt analysis (Father, Mother, Brother, Sister, Self)',
              'Blind planets and Sleeping planets identification',
              'Unique Varshphal (annual predictions)',
              'Simple, practical remedies (no expensive rituals)',
              'House-based planet effects (not sign-based)',
              'Prashna Kundali (horary questions)',
              'Taveez (amulets) recommendations',
            ]}
            pricing="₹1,499 - ₹3,999"
          />

          {/* KP System */}
          <SystemCard
            icon="🔢"
            title="KP System (Krishnamurti Paddhati)"
            subtitle="Precise Event Timing"
            badge="ADVANCED"
            badgeColor="from-blue-500 to-indigo-600"
            features={[
              'Sub-lord theory for pinpoint accuracy',
              'Ruling planets method',
              'Stellar astrology (star-based predictions)',
              'Significators for houses',
              'Accurate YES/NO answers',
              'Specific event timing (marriage, job, etc.)',
              'Horary astrology integration',
            ]}
            pricing="₹1,999 - ₹4,999"
          />

          {/* Chinese BaZi */}
          <SystemCard
            icon="🌏"
            title="Chinese BaZi (Four Pillars of Destiny)"
            subtitle="四柱命理 - 5,000+ Years of Chinese Wisdom"
            badge="NEW!"
            badgeColor="from-green-500 to-emerald-600"
            features={[
              'Four Pillars: Year, Month, Day, Hour analysis',
              '10 Heavenly Stems and 12 Earthly Branches',
              'Five Elements (Wood, Fire, Earth, Metal, Water) balance',
              'Day Master strength calculation',
              'Useful God and Harmful God identification',
              '10-year Luck Pillars (大运)',
              'Element therapy (colors, industries, diet, feng shui)',
              'Marriage compatibility with element harmony',
            ]}
            pricing="₹2,499 - ₹5,999"
          />

          {/* Medical Astrology */}
          <SystemCard
            icon="⚕️"
            title="Medical Astrology & Ayurvedic Jyotish"
            subtitle="स्वास्थ्य ज्योतिष - Health Through the Stars"
            badge="NEW!"
            badgeColor="from-green-500 to-emerald-600"
            features={[
              'Ayurvedic Dosha determination (Vata, Pitta, Kapha)',
              'Planet-body part correlations (9 planets × organs)',
              'Disease prediction with timing (Dashas/Transits)',
              '10 body systems detailed analysis',
              'Critical houses for health (6th, 8th, 12th)',
              'Preventive measures (diet, yoga, herbs)',
              'Dual remedies: Ayurvedic + Astrological',
              'Surgery timing recommendations',
              'Health transit alerts',
            ]}
            pricing="₹2,999 - ₹7,999"
          />

          {/* AI Integration */}
          {/* Crystal & Upaya Therapy */}
          <SystemCard
            icon="💎"
            title="Crystal & Upaya Therapy (Ratna Chikitsa)"
            subtitle="रत्न चिकित्सा - Gemstone Healing & Remedies"
            badge="NEW! SYSTEM #7"
            badgeColor="from-pink-500 to-purple-600"
            features={[
              'Navaratna (9 Gems): Ruby, Pearl, Coral, Emerald, Sapphire, Diamond, etc.',
              'Modern Crystal Healing: Rose Quartz, Amethyst, Citrine, Clear Quartz',
              '7-Chakra Balancing with crystal therapy',
              'Complete Upaya (Remedies): Mantras, Yantras, Charity, Fasting',
              'Gemstone wearing instructions (finger, metal, day, time)',
              'Purification & Energization protocols',
              'Gemstone compatibility checker (prevent disasters!)',
              'Rudraksha recommendations',
            ]}
            pricing="₹999 - ₹12,999"
          />

          {/* AI-Powered Synthesis */}
          <SystemCard
            icon="🤖"
            title="AI-Powered Synthesis"
            subtitle="GPT-4 Enhanced Interpretations"
            badge="AI"
            badgeColor="from-purple-500 to-pink-600"
            features={[
              'Cross-system analysis (Vedic + BaZi + Medical)',
              'Natural language interpretations',
              'Personalized guidance combining all systems',
              'Question answering about your charts',
              'Daily AI horoscopes',
              'Pattern recognition across 1000s of charts',
              'Remedy effectiveness prediction',
            ]}
            pricing="Included with Premium"
          />

        </div>

        {/* Comparison Table */}
        <div className="mt-20 max-w-6xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-white text-center mb-8">
            System Comparison
          </h2>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="pb-4 text-amber-300">Feature</th>
                  <th className="pb-4 text-white">Vedic</th>
                  <th className="pb-4 text-white">Lal Kitab</th>
                  <th className="pb-4 text-white">KP</th>
                  <th className="pb-4 text-white">BaZi</th>
                  <th className="pb-4 text-white">Medical</th>
                  <th className="pb-4 text-white">Numerology</th>
                  <th className="pb-4 text-white">Crystal</th>
                </tr>
              </thead>
              <tbody className="text-purple-200">
                <tr className="border-b border-white/10">
                  <td className="py-3 text-white">Birth Time Required</td>
                  <td>✅ Yes</td>
                  <td>✅ Yes</td>
                  <td>✅ Yes</td>
                  <td>✅ Yes</td>
                  <td>⚠️ Optional</td>
                  <td>❌ No</td>
                  <td>⚠️ Optional</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 text-white">Health Predictions</td>
                  <td>⚠️ Basic</td>
                  <td>⚠️ Basic</td>
                  <td>❌ No</td>
                  <td>⚠️ Element</td>
                  <td>✅ Detailed</td>
                  <td>⚠️ Basic</td>
                  <td>✅ Chakra-based</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 text-white">Career Guidance</td>
                  <td>✅ Yes</td>
                  <td>✅ Yes</td>
                  <td>✅ Yes</td>
                  <td>✅ Yes</td>
                  <td>⚠️ Health-based</td>
                  <td>✅ Life Path</td>
                  <td>⚠️ Via Planets</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 text-white">Marriage Compatibility</td>
                  <td>✅ Detailed</td>
                  <td>⚠️ Basic</td>
                  <td>✅ Yes</td>
                  <td>✅ Elements</td>
                  <td>❌ No</td>
                  <td>✅ Numbers</td>
                  <td>❌ No</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 text-white">Remedies</td>
                  <td>✅ Gems, Mantras</td>
                  <td>✅ Simple, Practical</td>
                  <td>✅ Gems, Mantras</td>
                  <td>✅ Elements, Colors</td>
                  <td>✅ Ayurveda + Gems</td>
                  <td>✅ Name Changes</td>
                  <td>✅ Gems, Crystals, Upaya</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 text-white">Timing Precision</td>
                  <td>⭐⭐⭐⭐</td>
                  <td>⭐⭐⭐</td>
                  <td>⭐⭐⭐⭐⭐</td>
                  <td>⭐⭐⭐⭐</td>
                  <td>⭐⭐⭐⭐</td>
                  <td>⭐⭐⭐</td>
                  <td>⭐⭐⭐</td>
                </tr>
                <tr>
                  <td className="py-3 text-white">Cultural Origin</td>
                  <td>🇮🇳 India</td>
                  <td>🇮🇳 India</td>
                  <td>🇮🇳 India</td>
                  <td>🇨🇳 China</td>
                  <td>🇮🇳 India</td>
                  <td>🌍 Universal</td>
                  <td>🇮🇳 India + 🌍 Modern</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-display font-bold text-white mb-6">
            Experience All 5 Systems
          </h2>
          <p className="text-lg text-purple-200 mb-8 max-w-2xl mx-auto">
            Get comprehensive insights from multiple astrological traditions combined
            with AI-powered synthesis
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:scale-105 transition-transform"
            >
              Start Your Journey
            </Link>
            <Link
              to="/about"
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold hover:scale-105 transition-transform"
            >
              Meet Acharya Rakesh Sharma
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-purple-300 border-t border-white/10 mt-16">
        <p>© 2026 CoralsAstrology. Made with 💜 for spiritual seekers.</p>
        <p className="text-sm mt-2 text-purple-400">Founded by Jyotish Acharya Rakesh Sharma</p>
      </footer>
    </div>
  );
}

function SystemCard({
  icon,
  title,
  subtitle,
  badge,
  badgeColor,
  features,
  pricing,
}: {
  icon: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  features: string[];
  pricing: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-amber-400/40 transition-all">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-6xl">{icon}</div>
          <div>
            <h3 className="text-2xl font-display font-bold text-white mb-1">{title}</h3>
            <p className="text-purple-300 italic">{subtitle}</p>
          </div>
        </div>
        <div className={`bg-gradient-to-r ${badgeColor} text-white text-xs font-bold px-4 py-2 rounded-full`}>
          {badge}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-6">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-2 text-purple-200">
            <span className="text-amber-400 mt-1">✦</span>
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/20">
        <div className="text-amber-300 font-semibold text-lg">
          {pricing}
        </div>
        <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:scale-105 transition-transform">
          Learn More
        </button>
      </div>
    </div>
  );
}
