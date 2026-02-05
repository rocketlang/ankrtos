import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-950 via-purple-900 to-cosmic-900">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-display font-bold text-white">
            🔮 CoralsAstrology
          </Link>
          <div className="flex gap-6">
            <Link to="/systems" className="text-purple-200 hover:text-white transition-colors">
              Systems
            </Link>
            <Link to="/about" className="text-purple-200 hover:text-white transition-colors">
              About
            </Link>
            <Link to="/login" className="text-purple-200 hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/signup" className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:scale-105 transition-transform">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-6xl font-display font-bold text-white mb-6 cosmic-float">
            🔮 CoralsAstrology
          </h1>
          <p className="text-2xl text-purple-200 mb-4">
            Your AI-Powered Vedic Astrology & Tarot Platform
          </p>
          <p className="text-lg text-amber-300 mb-8 font-semibold">
            Founded by Jyotish Acharya Rakesh Sharma
          </p>
          <p className="text-lg text-purple-300 mb-12 max-w-2xl mx-auto">
            Discover your destiny with personalized Kundli generation, daily horoscopes,
            Tarot readings, and consultations with expert astrologers.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:scale-105 transition-transform"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full font-semibold border-2 border-white/30 hover:bg-white/20 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <FeatureCard
            icon="📿"
            title="Vedic Kundli"
            description="Complete birth chart with D1-D60 divisional charts, dashas, and yogas"
            badge="Core"
          />
          <FeatureCard
            icon="📕"
            title="Lal Kitab"
            description="Unique Red Book astrology with practical remedies and debt analysis"
            badge="Premium"
          />
          <FeatureCard
            icon="🔢"
            title="KP System"
            description="Krishnamurti Paddhati for precise event timing and predictions"
            badge="Advanced"
          />
          <FeatureCard
            icon="🌏"
            title="Chinese BaZi"
            description="Four Pillars of Destiny with 5 Elements, Luck Pillars, and life analysis"
            badge="NEW!"
          />
          <FeatureCard
            icon="⚕️"
            title="Medical Astrology"
            description="Health predictions, Ayurvedic doshas, disease prevention, and remedies"
            badge="NEW!"
          />
          <FeatureCard
            icon="🌙"
            title="Daily Panchang"
            description="Tithi, nakshatra, muhurat, and auspicious timings for your location"
            badge="Free"
          />
          <FeatureCard
            icon="💬"
            title="Live Consultations"
            description="Book sessions with Jyotish Acharya Rakesh Sharma"
            badge="Premium"
          />
          <FeatureCard
            icon="🤖"
            title="AI Predictions"
            description="GPT-4 powered personalized predictions combining all systems"
            badge="AI"
          />
          <FeatureCard
            icon="🎴"
            title="Tarot Readings"
            description="AI-powered tarot interpretations with multiple spread types"
            badge="Coming"
          />
        </div>

        {/* Founder Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-lg rounded-3xl p-8 border border-amber-400/30">
            <div className="text-center">
              <h2 className="text-4xl font-display font-bold text-amber-300 mb-4">
                🕉️ Meet Our Founder
              </h2>
              <h3 className="text-3xl font-semibold text-white mb-6">
                Jyotish Acharya Rakesh Sharma
              </h3>
              <p className="text-lg text-purple-100 mb-6 leading-relaxed">
                With over <span className="text-amber-300 font-semibold">25 years of experience</span> in Vedic astrology,
                Jyotish Acharya Rakesh Sharma has guided <span className="text-amber-300 font-semibold">1,500+ clients</span> worldwide.
                A renowned expert in Jyotish Shastra, Lal Kitab, KP System, and Prashna Kundali.
              </p>

              <div className="grid md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl mb-2">📿</div>
                  <div className="text-sm text-purple-200">Vedic Astrology</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl mb-2">📕</div>
                  <div className="text-sm text-purple-200">Lal Kitab Expert</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl mb-2">🔢</div>
                  <div className="text-sm text-purple-200">KP System</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl mb-2">💎</div>
                  <div className="text-sm text-purple-200">Gemstone Guru</div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/astrologers"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold hover:scale-105 transition-transform shadow-lg"
                >
                  Book Consultation with Acharya Ji
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-purple-300">
        <p>© 2026 CoralsAstrology. Made with 💜 for spiritual seekers.</p>
        <p className="text-sm mt-2 text-purple-400">Founded by Jyotish Acharya Rakesh Sharma</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, badge }: { icon: string; title: string; description: string; badge?: string }) {
  const badgeColors = {
    'NEW!': 'bg-gradient-to-r from-green-500 to-emerald-500',
    'Premium': 'bg-gradient-to-r from-amber-500 to-orange-500',
    'Advanced': 'bg-gradient-to-r from-blue-500 to-indigo-500',
    'AI': 'bg-gradient-to-r from-purple-500 to-pink-500',
    'Core': 'bg-gradient-to-r from-cyan-500 to-blue-500',
    'Free': 'bg-gradient-to-r from-gray-500 to-gray-600',
    'Coming': 'bg-gradient-to-r from-slate-500 to-slate-600',
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all hover:scale-105 relative">
      {badge && (
        <div className={`absolute top-4 right-4 ${badgeColors[badge] || 'bg-gray-500'} text-white text-xs font-bold px-3 py-1 rounded-full`}>
          {badge}
        </div>
      )}
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-purple-200 text-sm">{description}</p>
    </div>
  );
}
