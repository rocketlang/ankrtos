import React from 'react';
import { Link } from 'react-router-dom';

const LandingPageEnhanced: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-3xl">🕉️</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                CORALS Astrology
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              <div className="relative group">
                <button className="text-gray-700 hover:text-orange-600 font-medium flex items-center">
                  Sacred Sciences ▼
                </button>
                <div className="absolute hidden group-hover:block bg-white shadow-xl rounded-lg mt-2 py-2 w-64">
                  <Link to="/complete-kundli" className="block px-4 py-2 hover:bg-orange-50">🔮 Complete Kundli & Doshas</Link>
                  <Link to="/numerology" className="block px-4 py-2 hover:bg-orange-50">🔢 Numerology (3 Systems)</Link>
                  <Link to="/palmistry" className="block px-4 py-2 hover:bg-orange-50">👋 Palmistry Analysis</Link>
                  <Link to="/bazi" className="block px-4 py-2 hover:bg-orange-50">🐲 Chinese BaZi</Link>
                  <Link to="/dasha" className="block px-4 py-2 hover:bg-orange-50">📅 Dasha Predictions</Link>
                  <Link to="/medical-astrology" className="block px-4 py-2 hover:bg-orange-50">⚕️ Medical Astrology</Link>
                  <Link to="/crystal-therapy" className="block px-4 py-2 hover:bg-orange-50">💎 Crystal Therapy</Link>
                </div>
              </div>
              <Link to="/upaya-remedies" className="text-gray-700 hover:text-orange-600 font-medium">
                🙏 Upaya & Remedies
              </Link>
              <Link to="/sanskriti" className="text-gray-700 hover:text-orange-600 font-medium">
                📚 Sacred Texts
              </Link>
              <Link to="/book-pandit" className="text-gray-700 hover:text-orange-600 font-medium">
                Expert Pandits
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-orange-600 font-medium">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-gradient-to-r from-orange-600 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition"
              >
                Start Free Journey
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Spiritual Solace Theme */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff9933' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            {/* Sanskrit Shloka */}
            <div className="text-orange-600 font-serif text-lg mb-4 italic">
              "योगः कर्मसु कौशलम्" (Yogah Karmasu Kaushalam)
            </div>
            <div className="text-gray-600 text-sm mb-6">
              "Yoga is Skill in Action" - Bhagavad Gita 2.50
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Find Your <span className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Spiritual Solace
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-4xl mx-auto">
              Where 5000 Years of Vedic Wisdom Meets Modern Technology
            </p>

            <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover your life's purpose through 9 ancient sciences. Get personalized dosha analysis,
              authentic remedies, sacred mantras, and expert guidance. Experience the most comprehensive
              spiritual platform powered by AI and blessed by tradition.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-xl">✓</span>
                <span>10,000+ Souls Guided</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-xl">✓</span>
                <span>21 Sacred Texts</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-xl">✓</span>
                <span>6 Dosha Types Detected</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-xl">✓</span>
                <span>KYC Verified Pandits</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-xl">✓</span>
                <span>Lab Certified Gemstones</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link
                to="/signup"
                className="bg-gradient-to-r from-orange-600 to-purple-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transition transform hover:scale-105"
              >
                Begin Free Consultation
              </Link>
              <Link
                to="/complete-kundli"
                className="bg-white text-orange-600 border-2 border-orange-600 px-10 py-4 rounded-full text-lg font-semibold hover:bg-orange-50 transition"
              >
                Check Your Doshas
              </Link>
            </div>

            {/* Rating & Founder */}
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="flex text-yellow-400 text-xl">
                  ⭐⭐⭐⭐⭐
                </div>
                <span className="text-gray-600">4.9/5 from 10,000+ users</span>
              </div>
              <div className="text-gray-600">
                Guided by <span className="text-orange-600 font-semibold">Jyotish Acharya Rakesh Sharma</span>
                <br />
                <span className="text-sm">25+ Years Experience • Sanskrit Scholar • AI Pioneer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Major Doshas Section - NEW! */}
      <section className="py-16 px-4 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              🐍 Comprehensive Dosha Detection
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              India's First Platform to Detect 6 Major Doshas with AI-Powered Analysis,
              Scripture References & Authentic Remedies
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Kaal Sarp Dosha',
                icon: '🐍',
                description: '12 types detected based on Rahu-Ketu axis. Coconut remedy + Trimbakeshwar pilgrimage.',
                severity: 'High Impact',
                color: 'red'
              },
              {
                name: 'Manglik Dosha',
                icon: '🔴',
                description: 'Mars placement analysis with severity levels. Mangalnath Temple Mangal Bhat Puja.',
                severity: 'Marriage Blocker',
                color: 'orange'
              },
              {
                name: 'Pitra Dosha',
                icon: '👴',
                description: 'Ancestral afflictions (Sun-Rahu). Gaya Pind Daan at 45 sacred ghats.',
                severity: 'Generational',
                color: 'purple'
              },
              {
                name: 'Shrapit Dosha',
                icon: '⚫',
                description: 'Saturn-Rahu curse. Saturday iron charity + Shani temple visits.',
                severity: 'Career Block',
                color: 'gray'
              },
              {
                name: 'Chandal Dosha',
                icon: '🌙',
                description: 'Jupiter-Rahu (Guru-Chandal). Turmeric water rituals + Brihaspati mantras.',
                severity: 'Wisdom Loss',
                color: 'yellow'
              },
              {
                name: 'Grahan Dosha',
                icon: '🌑',
                description: 'Eclipse combinations. Eclipse day charity + Mahamrityunjaya mantra.',
                severity: 'Health Issues',
                color: 'indigo'
              }
            ].map((dosha) => (
              <div key={dosha.name} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition">
                <div className="text-5xl mb-3">{dosha.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{dosha.name}</h3>
                <div className={`inline-block bg-${dosha.color}-100 text-${dosha.color}-700 text-xs px-3 py-1 rounded-full mb-3`}>
                  {dosha.severity}
                </div>
                <p className="text-gray-600 text-sm mb-4">{dosha.description}</p>
                <div className="flex items-center text-xs text-gray-500 space-x-2">
                  <span>✓ Scripture Refs</span>
                  <span>•</span>
                  <span>✓ Lal Kitab</span>
                  <span>•</span>
                  <span>✓ Mantras</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/complete-kundli"
              className="inline-block bg-red-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-red-700 transition shadow-lg"
            >
              Get Free Dosha Analysis Now
            </Link>
          </div>
        </div>
      </section>

      {/* Upaya & Remedies Section - NEW! */}
      <section className="py-16 px-4 bg-gradient-to-r from-yellow-50 to-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              🙏 Authentic Upaya & Remedies
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Time-Tested Solutions from Lal Kitab, Vedic Scriptures & Sanskrit Mantras
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-4">📕</div>
              <h3 className="text-lg font-bold mb-3">Lal Kitab Remedies</h3>
              <ul className="text-sm text-gray-600 text-left space-y-2">
                <li>• Coconut in flowing water</li>
                <li>• Red lentil charity</li>
                <li>• Feeding crows (Pitra)</li>
                <li>• Saturday iron remedy</li>
                <li>• 43-day procedures</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-4">🕉️</div>
              <h3 className="text-lg font-bold mb-3">Sacred Mantras</h3>
              <ul className="text-sm text-gray-600 text-left space-y-2">
                <li>• Mahamrityunjaya (RV 7.59.12)</li>
                <li>• Gayatri Mantra</li>
                <li>• Mangal Beej Mantra</li>
                <li>• Sanskrit + Transliteration</li>
                <li>• Timing & Direction</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-4">🛕</div>
              <h3 className="text-lg font-bold mb-3">Pilgrimage Guides</h3>
              <ul className="text-sm text-gray-600 text-left space-y-2">
                <li>• Trimbakeshwar (₹2K-51K)</li>
                <li>• Mangalnath Ujjain</li>
                <li>• Gaya Pind Daan</li>
                <li>• Complete cost breakdown</li>
                <li>• Best times to visit</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition">
              <div className="text-5xl mb-4">💎</div>
              <h3 className="text-lg font-bold mb-3">Gemstone Therapy</h3>
              <ul className="text-sm text-gray-600 text-left space-y-2">
                <li>• Lab certified stones</li>
                <li>• Wearing instructions</li>
                <li>• Muhurat timing</li>
                <li>• Metal combinations</li>
                <li>• Mantra activation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 9 Sacred Sciences Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              🌟 9 Ancient Sciences Under One Roof
            </h2>
            <p className="text-xl text-gray-600">
              Most Comprehensive Spiritual Platform in India
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Vedic Astrology',
                icon: '🔮',
                features: ['D1-D60 Divisional Charts', 'Vimshottari Dasha', '6 Dosha Detection', 'Upaya Remedies'],
                price: 'Free Basic'
              },
              {
                name: 'Numerology',
                icon: '🔢',
                features: ['Pythagorean System', 'Chaldean System', 'Kabbalah System', 'Life Path Numbers'],
                price: 'Free'
              },
              {
                name: 'Palmistry',
                icon: '👋',
                features: ['Major & Minor Lines', 'Mounts Analysis', 'Finger Analysis', 'AI Hand Scanner'],
                price: '₹299'
              },
              {
                name: 'Chinese BaZi',
                icon: '🐲',
                features: ['Four Pillars', 'Day Master', '10-Year Luck Cycle', 'Element Balance'],
                price: '₹299'
              },
              {
                name: 'Dasha System',
                icon: '📅',
                features: ['Vimshottari Dasha', 'Yogini Dasha', 'Ashtottari Dasha', 'Transit Predictions'],
                price: 'Free'
              },
              {
                name: 'Medical Astrology',
                icon: '⚕️',
                features: ['Disease Prediction', 'Organ-Planet Mapping', 'Remedial Measures', 'Health Timeline'],
                price: '₹499'
              },
              {
                name: 'Crystal Therapy',
                icon: '💎',
                features: ['Crystal Selection', 'Chakra Healing', 'Wearing Guide', 'Cleansing Rituals'],
                price: '₹299'
              },
              {
                name: 'Muhurat',
                icon: '🌅',
                features: ['Auspicious Timings', 'Wedding Muhurat', 'Business Launch', 'Griha Pravesh'],
                price: 'Free'
              },
              {
                name: 'Kundli Matching',
                icon: '💑',
                features: ['36 Guna Matching', 'Dosha Check', 'Marriage Predictions', 'Upaya for Compatibility'],
                price: 'Free Basic'
              }
            ].map((science) => (
              <div key={science.name} className="bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl p-6 hover:shadow-xl transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">{science.icon}</div>
                  <div className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                    {science.price}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{science.name}</h3>
                <ul className="space-y-2">
                  {science.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-600">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/dashboard"
              className="inline-block bg-gradient-to-r from-orange-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transition"
            >
              Explore All 9 Systems Free
            </Link>
          </div>
        </div>
      </section>

      {/* Scripture Library Section - NEW! */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              📚 Sanskriti - Sacred Text Library
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              21 Ancient Texts with Sanskrit Verses, English Translation & AI-Powered Search
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { name: 'Bhagavad Gita', verses: '700 verses', language: 'Sanskrit' },
              { name: 'Brihat Parashara', verses: 'Complete', language: 'Sanskrit' },
              { name: 'Phaladeepika', verses: 'Complete', language: 'Sanskrit' },
              { name: 'Lal Kitab', verses: 'Full Text', language: 'Hindi/Urdu' },
              { name: 'Garuda Purana', verses: 'Selections', language: 'Sanskrit' },
              { name: 'Shrimad Bhagavatam', verses: 'Complete', language: 'Sanskrit' },
              { name: 'Ramayana', verses: '24,000 verses', language: 'Sanskrit' },
              { name: 'Mahabharata', verses: 'Key sections', language: 'Sanskrit' }
            ].map((text) => (
              <div key={text.name} className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition text-center">
                <div className="text-2xl mb-2">📖</div>
                <div className="font-bold text-sm text-gray-900">{text.name}</div>
                <div className="text-xs text-gray-600">{text.verses}</div>
                <div className="text-xs text-purple-600">{text.language}</div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/sanskriti"
              className="inline-block bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-700 transition shadow-lg"
            >
              Browse Sacred Library
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Main Services Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Your Complete Spiritual Ecosystem
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Astrology */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 text-center hover:shadow-2xl transition">
              <div className="text-6xl mb-4">🔮</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Astrology</h3>
              <p className="text-gray-600 mb-6">
                Complete birth chart analysis, dosha detection, personalized predictions with scripture references
              </p>
              <Link
                to="/complete-kundli"
                className="inline-block bg-orange-600 text-white px-6 py-3 rounded-full hover:bg-orange-700 transition shadow-lg"
              >
                Get Free Kundli
              </Link>
            </div>

            {/* Pandit Booking */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 text-center hover:shadow-2xl transition">
              <div className="text-6xl mb-4">🙏</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Book Expert Pandits</h3>
              <p className="text-gray-600 mb-6">
                KYC verified pandits for 25+ poojas. Home & temple services with transparent pricing
              </p>
              <Link
                to="/book-pandit"
                className="inline-block bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition shadow-lg"
              >
                Book Pandit
              </Link>
            </div>

            {/* Temple Store */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center hover:shadow-2xl transition">
              <div className="text-6xl mb-4">💎</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Certified Spiritual Products</h3>
              <p className="text-gray-600 mb-6">
                Lab certified gemstones, authentic crystals, puja kits, yantras & religious books
              </p>
              <Link
                to="/store"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition shadow-lg"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pricing Plans for Every Seeker
            </h2>
            <p className="text-xl text-gray-600">Start Free • Upgrade Anytime • Cancel Anytime</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                name: 'FREE',
                price: '₹0',
                period: 'Forever',
                features: [
                  'Basic Kundli (D1 chart only)',
                  'Daily Horoscope',
                  'Muhurat Finder',
                  'Basic Numerology',
                  '1 Dosha Check/month'
                ],
                cta: 'Start Free',
                color: 'gray'
              },
              {
                name: 'FREEMIUM',
                price: '₹299',
                period: '/month',
                features: [
                  'Complete Kundli (D1-D16)',
                  'All 6 Doshas Detection',
                  'Lal Kitab Remedies',
                  'Palmistry Analysis',
                  'Crystal Therapy'
                ],
                cta: 'Get Started',
                color: 'orange',
                popular: true
              },
              {
                name: 'PRO',
                price: '₹999',
                period: '/month',
                features: [
                  'Everything in Freemium',
                  'D1-D60 Divisional Charts',
                  'Medical Astrology',
                  'BaZi Analysis',
                  'Priority Acharya Access',
                  'PDF Reports'
                ],
                cta: 'Go Pro',
                color: 'purple'
              },
              {
                name: 'ENTERPRISE',
                price: '₹4,999',
                period: '/month',
                features: [
                  'Everything in Pro',
                  'Personal Astrologer',
                  'Monthly Video Consultation',
                  'Custom Gemstone Selection',
                  'Family Accounts (5)',
                  'White-label Option'
                ],
                cta: 'Contact Us',
                color: 'green'
              }
            ].map((plan) => (
              <div key={plan.name} className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition ${plan.popular ? 'ring-2 ring-orange-600 transform scale-105' : ''}`}>
                {plan.popular && (
                  <div className="bg-orange-600 text-white text-xs px-3 py-1 rounded-full inline-block mb-2">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-600">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/choose-plan"
                  className={`block text-center bg-${plan.color}-600 text-white px-6 py-3 rounded-full hover:bg-${plan.color}-700 transition font-semibold`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            🌟 Stories of Transformation
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Priya Sharma',
                location: 'Mumbai',
                text: 'The Kaal Sarp Dosha detection was accurate. After following the Trimbakeshwar remedy, my career obstacles vanished!',
                rating: 5
              },
              {
                name: 'Rajesh Kumar',
                location: 'Delhi',
                text: 'Manglik dosha remedies helped me find my perfect match. The gemstone recommendation was spot-on.',
                rating: 5
              },
              {
                name: 'Anjali Verma',
                location: 'Bangalore',
                text: 'The scripture library is a treasure. Searching Sanskrit verses with AI is revolutionary!',
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl p-6 shadow-lg">
                <div className="flex text-yellow-400 text-lg mb-3">
                  {'⭐'.repeat(testimonial.rating)}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-600 to-purple-600 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Begin Your Journey to Spiritual Solace Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join 10,000+ souls who found peace, purpose and prosperity through ancient wisdom
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-orange-600 px-10 py-4 rounded-full text-lg font-bold hover:shadow-2xl transition transform hover:scale-105"
          >
            Start Free - No Credit Card Required
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🕉️</span>
              <span className="text-xl font-bold">CORALS</span>
            </div>
            <p className="text-gray-400 text-sm">
              Ancient wisdom meets modern technology. Find your spiritual solace.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Sacred Sciences</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/complete-kundli">Vedic Astrology</Link></li>
              <li><Link to="/numerology">Numerology</Link></li>
              <li><Link to="/palmistry">Palmistry</Link></li>
              <li><Link to="/sanskriti">Sacred Texts</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/book-pandit">Book Pandit</Link></li>
              <li><Link to="/store">Temple Store</Link></li>
              <li><Link to="/ask-acharya">Ask Acharya</Link></li>
              <li><Link to="/upaya-remedies">Upaya Remedies</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>© 2026 CORALS Astrology • Powered by ANKR.IN & PowerBox IT Solutions</p>
          <p className="mt-2">Guided by Jyotish Acharya Rakesh Sharma</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageEnhanced;
