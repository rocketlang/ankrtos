import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-950 via-purple-900 to-cosmic-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-display font-bold text-amber-300 mb-4">
            🕉️ About CoralsAstrology
          </h1>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            Where Ancient Vedic Wisdom Meets Modern AI Technology
          </p>
        </div>

        {/* Founder Section */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-lg rounded-3xl p-10 border border-amber-400/30">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="w-64 h-64 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-9xl">
                  🙏
                </div>
              </div>

              <div>
                <h2 className="text-4xl font-display font-bold text-amber-300 mb-2">
                  Jyotish Acharya
                </h2>
                <h3 className="text-3xl font-semibold text-white mb-6">
                  Rakesh Sharma
                </h3>
                <p className="text-lg text-purple-100 mb-4 italic">
                  "Founder & Chief Astrologer"
                </p>

                <div className="space-y-3 text-purple-200">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">✦</span>
                    <span>25+ years of experience in Jyotish Shastra</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">✦</span>
                    <span>1,500+ satisfied clients worldwide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">✦</span>
                    <span>4.9★ rating with verified consultations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">✦</span>
                    <span>Expert in 7+ astrological systems</span>
                  </div>
                </div>

                <div className="mt-6">
                  <a
                    href="mailto:acharya.rakesh@coralsastrology.com"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold hover:scale-105 transition-transform"
                  >
                    📧 Contact Acharya Ji
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expertise Section */}
        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="text-4xl font-display font-bold text-white text-center mb-12">
            Areas of Expertise
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <ExpertiseCard
              icon="📿"
              title="Vedic Astrology"
              description="Traditional Jyotish Shastra with birth chart analysis, planetary dashas, yogas, and doshas for accurate life predictions."
            />
            <ExpertiseCard
              icon="📕"
              title="Lal Kitab"
              description="Unique remedial astrology system from ancient Red Book tradition with practical solutions and simple remedies."
            />
            <ExpertiseCard
              icon="🔢"
              title="KP System"
              description="Krishnamurti Paddhati for precise event predictions with stellar astrology and sub-lord theory."
            />
            <ExpertiseCard
              icon="❓"
              title="Prashna Kundali"
              description="Horary astrology to answer specific life questions using the chart of the moment of inquiry."
            />
            <ExpertiseCard
              icon="🔮"
              title="Numerology"
              description="Life path, destiny, and soul urge number analysis for understanding life's purpose and potential."
            />
            <ExpertiseCard
              icon="🏠"
              title="Vastu Shastra"
              description="Ancient Indian architectural science for harmonizing living and working spaces with cosmic energies."
            />
            <ExpertiseCard
              icon="💎"
              title="Gemstone Therapy"
              description="Personalized gemstone recommendations based on planetary positions to enhance positive energies."
            />
            <ExpertiseCard
              icon="🌙"
              title="Panchang & Muhurat"
              description="Daily almanac and auspicious timing selection for important life events and ceremonies."
            />
            <ExpertiseCard
              icon="💑"
              title="Compatibility Analysis"
              description="Detailed Kundali matching and synastry for marriage, business partnerships, and relationships."
            />
          </div>
        </div>

        {/* Vision Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-10 border border-white/20">
            <h2 className="text-3xl font-display font-bold text-amber-300 text-center mb-6">
              🎯 Our Vision
            </h2>
            <p className="text-lg text-purple-100 leading-relaxed mb-6">
              CoralsAstrology was born from a simple yet powerful vision: to make authentic Vedic
              astrological guidance accessible to everyone, regardless of location or background.
            </p>
            <p className="text-lg text-purple-100 leading-relaxed mb-6">
              By combining <span className="text-amber-300 font-semibold">25+ years of traditional wisdom</span> with
              <span className="text-amber-300 font-semibold"> cutting-edge AI technology</span>, we provide accurate,
              personalized, and actionable astrological insights that empower you to make better life decisions.
            </p>
            <p className="text-lg text-purple-100 leading-relaxed">
              Whether you seek guidance on career, relationships, health, or spiritual growth,
              Jyotish Acharya Rakesh Sharma and the CoralsAstrology team are here to illuminate
              your path with the timeless wisdom of the stars.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-white mb-6">
            Ready to Discover Your Destiny?
          </h2>
          <div className="flex gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:scale-105 transition-transform"
            >
              Get Your Free Kundli
            </Link>
            <Link
              to="/astrologers"
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold hover:scale-105 transition-transform"
            >
              Book Consultation
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

function ExpertiseCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all hover:scale-105">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-semibold text-amber-300 mb-3">{title}</h3>
      <p className="text-purple-200 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
