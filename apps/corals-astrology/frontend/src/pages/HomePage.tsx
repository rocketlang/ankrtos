import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-950 via-purple-900 to-cosmic-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-display font-bold text-white mb-6 cosmic-float">
            🔮 CoralsAstrology
          </h1>
          <p className="text-2xl text-purple-200 mb-8">
            Your AI-Powered Vedic Astrology & Tarot Platform
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
            description="Auto-generate detailed birth chart with D1-D60 divisional charts, dashas, and yogas"
          />
          <FeatureCard
            icon="🌙"
            title="Daily Panchang"
            description="Get tithi, nakshatra, muhurat, and auspicious timings for your location"
          />
          <FeatureCard
            icon="🎴"
            title="Tarot Readings"
            description="AI-powered tarot interpretations with multiple spread types"
          />
          <FeatureCard
            icon="🔢"
            title="Numerology"
            description="Life path, destiny, and soul urge number calculations"
          />
          <FeatureCard
            icon="💬"
            title="Live Consultations"
            description="Book sessions with verified astrologers via video/chat"
          />
          <FeatureCard
            icon="🤖"
            title="AI Predictions"
            description="GPT-4 powered personalized predictions and guidance"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-purple-300">
        <p>© 2026 CoralsAstrology. Made with 💜 for spiritual seekers.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-purple-200">{description}</p>
    </div>
  );
}
