import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <span className="text-3xl">🕉️</span>
              <span className="text-2xl font-bold text-orange-600">CoralsAstrology</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              <div className="relative group">
                <button className="text-gray-700 hover:text-orange-600 font-medium">
                  Astrology ▼
                </button>
                <div className="absolute hidden group-hover:block bg-white shadow-lg rounded-md mt-2 py-2 w-48">
                  <Link to="/vedic" className="block px-4 py-2 hover:bg-orange-50">Vedic Astrology</Link>
                  <Link to="/numerology" className="block px-4 py-2 hover:bg-orange-50">Numerology</Link>
                  <Link to="/palmistry" className="block px-4 py-2 hover:bg-orange-50">Palmistry</Link>
                  <Link to="/bazi" className="block px-4 py-2 hover:bg-orange-50">Chinese BaZi</Link>
                  <Link to="/all-systems" className="block px-4 py-2 hover:bg-orange-50">All 9 Systems</Link>
                </div>
              </div>
              <Link to="/book-pandit" className="text-gray-700 hover:text-orange-600 font-medium">
                Book Pandit
              </Link>
              <Link to="/store" className="text-gray-700 hover:text-orange-600 font-medium">
                Temple Store
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-orange-600 font-medium">
                About
              </Link>
              <Link to="/blog" className="text-gray-700 hover:text-orange-600 font-medium">
                Blog
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-orange-600 font-medium">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition"
              >
                Get Started Free
              </Link>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff9933' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Discover Peace, Purpose & Prosperity
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-4">
              Where Ancient Wisdom Meets Modern Technology
            </p>

            <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
              Find your spiritual solace through 9 sacred sciences. Get guidance from expert astrologers,
              authentic gemstones, and personalized rituals.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-xl">✓</span>
                <span>10,000+ Happy Souls</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-xl">✓</span>
                <span>Verified Astrologers</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-xl">✓</span>
                <span>Certified Gemstones</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-xl">✓</span>
                <span>100% Secure</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link
                to="/signup"
                className="bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-orange-700 transition shadow-lg"
              >
                Start Your Journey Free
              </Link>
              <Link
                to="/book-pandit"
                className="bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-700 transition shadow-lg"
              >
                Book Pandit Now
              </Link>
            </div>

            {/* Rating */}
            <div className="flex items-center justify-center space-x-2">
              <div className="flex text-yellow-400 text-xl">
                ⭐⭐⭐⭐⭐
              </div>
              <span className="text-gray-600">4.8/5 (10,000+ users)</span>
            </div>

            {/* Founder Badge */}
            <div className="mt-8 text-gray-600 italic">
              Guided by <span className="text-orange-600 font-semibold">Jyotish Acharya Rakesh Sharma</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Main Pillars Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Your Complete Spiritual Platform
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Astrology */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 text-center hover:shadow-xl transition">
              <div className="text-6xl mb-4">🔮</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Astrology Services</h3>
              <p className="text-gray-600 mb-6">
                Get personalized insights from 9 ancient divination systems including Vedic, Numerology, Palmistry & more
              </p>
              <ul className="text-left text-gray-700 space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Birth chart analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Life predictions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Professional PDF reports</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Ask Acharya directly</span>
                </li>
              </ul>
              <Link
                to="/astrology"
                className="inline-block bg-orange-600 text-white px-6 py-3 rounded-full hover:bg-orange-700 transition"
              >
                Explore Astrology
              </Link>
            </div>

            {/* Pandit Booking */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 text-center hover:shadow-xl transition">
              <div className="text-6xl mb-4">🙏</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Book Expert Pandits</h3>
              <p className="text-gray-600 mb-6">
                Book verified pandits for all types of poojas at home or temple. Experienced professionals at your service
              </p>
              <ul className="text-left text-gray-700 space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>25+ types of poojas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>KYC verified pandits</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Home & temple services</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Transparent pricing</span>
                </li>
              </ul>
              <Link
                to="/book-pandit"
                className="inline-block bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition"
              >
                Book Pandit
              </Link>
            </div>

            {/* Temple Store */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center hover:shadow-xl transition">
              <div className="text-6xl mb-4">🛍️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Temple Store</h3>
              <p className="text-gray-600 mb-6">
                Shop authentic spiritual products including certified gemstones, puja items, yantras & religious books
              </p>
              <ul className="text-left text-gray-700 space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Certified gemstones</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Complete puja kits</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Sacred yantras</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Fast delivery</span>
                </li>
              </ul>
              <Link
                to="/store"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition"
              >
                Browse Store
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Poojas Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              🕉️ Book Expert Pandits for Special Poojas
            </h2>
            <p className="text-xl text-gray-600">
              Verified & Experienced • Home & Temple Services • All Types of Rituals
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { name: 'Griha Pravesh', icon: '🏠' },
              { name: 'Ganesh Pooja', icon: '🐘' },
              { name: 'Marriage', icon: '💑' },
              { name: 'Satyanarayan', icon: '🙏' },
              { name: 'Navagraha', icon: '⭐' },
              { name: 'Vastu Shanti', icon: '🏛️' },
              { name: 'Vehicle Pooja', icon: '🚗' },
              { name: 'Birthday', icon: '🎂' }
            ].map((pooja) => (
              <Link
                key={pooja.name}
                to={`/book-pandit?type=${pooja.name.toLowerCase()}`}
                className="bg-white rounded-lg p-4 text-center hover:shadow-lg transition"
              >
                <div className="text-4xl mb-2">{pooja.icon}</div>
                <div className="font-semibold text-gray-800">{pooja.name}</div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/book-pandit"
              className="inline-block bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-700 transition shadow-lg"
            >
              Find Pandit Near You
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Sacred Products from Our Temple Store
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Certified Ruby', price: '₹25,000', image: '💎', tag: 'Certified' },
              { name: 'Puja Kit', price: '₹999', image: '🪔', tag: 'Complete Set' },
              { name: 'Sri Yantra', price: '₹1,499', image: '🔯', tag: 'Energized' },
              { name: 'Rudraksha Mala', price: '₹2,499', image: '📿', tag: 'Authentic' }
            ].map((product) => (
              <div key={product.name} className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-xl transition">
                <div className="bg-gradient-to-br from-orange-100 to-purple-100 h-48 flex items-center justify-center text-7xl">
                  {product.image}
                </div>
                <div className="p-4">
                  <div className="text-xs text-orange-600 font-semibold mb-1">{product.tag}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{product.name}</h3>
                  <div className="text-2xl font-bold text-orange-600 mb-3">{product.price}</div>
                  <button className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition">
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/store"
              className="inline-block text-orange-600 font-semibold hover:underline"
            >
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-gradient-to-br from-orange-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            What Our Users Say
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Rajesh M.',
                location: 'Mumbai',
                rating: 5,
                text: 'Life-changing guidance! Acharya Rakesh Ji\'s predictions were incredibly accurate. The personalized remedies really helped.'
              },
              {
                name: 'Priya S.',
                location: 'Delhi',
                rating: 5,
                text: 'Bought a Ruby gemstone, certified and beautiful. The pandit booking service made my Griha Pravesh so easy!'
              },
              {
                name: 'Amit K.',
                location: 'Bangalore',
                rating: 5,
                text: 'Best astrology platform! Having all 9 systems in one place is amazing. The reports are very professional.'
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex text-yellow-400 mb-3">
                  {'⭐'.repeat(testimonial.rating)}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div className="font-semibold text-gray-900">{testimonial.name}</div>
                <div className="text-sm text-gray-500">{testimonial.location}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Founder */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/3">
              <div className="w-48 h-48 mx-auto bg-gradient-to-br from-orange-200 to-purple-200 rounded-full flex items-center justify-center text-7xl">
                👨‍🏫
              </div>
            </div>
            <div className="md:w-2/3">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Meet Jyotish Acharya Rakesh Sharma
              </h2>
              <div className="flex gap-4 mb-4 text-sm text-gray-600">
                <span>🎓 20+ Years Experience</span>
                <span>👥 5,000+ Consultations</span>
                <span>⭐ 4.9/5 Rating</span>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                "Bringing ancient Vedic wisdom to modern seekers with authenticity and care.
                My mission is to help you find peace, purpose, and prosperity through time-tested
                spiritual sciences combined with modern technology."
              </p>
              <Link
                to="/book-consultation"
                className="inline-block bg-orange-600 text-white px-6 py-3 rounded-full hover:bg-orange-700 transition"
              >
                Book Personal Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Choose Your Spiritual Journey
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Start free, upgrade anytime. Cancel anytime.
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                name: 'FREE',
                price: '₹0',
                period: 'forever',
                features: ['Daily horoscope', 'Basic chart', '1 system', 'Ads supported'],
                cta: 'Start Free',
                highlight: false
              },
              {
                name: 'FREEMIUM',
                price: '₹299',
                period: '/month',
                features: ['3 systems', '2 PDF reports/mo', '1 Q&A/mo', 'No ads'],
                cta: 'Get Started',
                highlight: false
              },
              {
                name: 'PRO',
                price: '₹999',
                period: '/month',
                features: ['All 9 systems', 'Unlimited PDFs', '5 Q&A/mo', 'Priority support'],
                cta: 'Go Pro',
                highlight: true
              },
              {
                name: 'ENTERPRISE',
                price: '₹4,999',
                period: '/month',
                features: ['Everything', 'Unlimited Q&A', 'Personal astrologer', 'Family (5)'],
                cta: 'Contact Us',
                highlight: false
              }
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-orange-500 to-purple-600 text-white transform scale-105 shadow-2xl'
                    : 'bg-white text-gray-900 shadow-lg'
                }`}
              >
                {plan.highlight && (
                  <div className="text-center text-sm font-semibold mb-2">MOST POPULAR</div>
                )}
                <h3 className="text-xl font-bold text-center mb-2">{plan.name}</h3>
                <div className="text-center mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className={`mr-2 ${plan.highlight ? 'text-white' : 'text-green-600'}`}>✓</span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-full font-semibold transition ${
                    plan.highlight
                      ? 'bg-white text-purple-600 hover:bg-gray-100'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Begin Your Spiritual Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join 10,000+ souls who found peace, clarity, and purpose
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/signup"
              className="bg-white text-purple-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              Start Free Today
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-purple-600 transition"
            >
              Talk to Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* About */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-3xl">🕉️</span>
                <span className="text-xl font-bold text-white">CoralsAstrology</span>
              </div>
              <p className="text-sm">
                Ancient wisdom meets modern technology. Your complete spiritual platform.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-orange-400">About Us</Link></li>
                <li><Link to="/astrology" className="hover:text-orange-400">Astrology</Link></li>
                <li><Link to="/book-pandit" className="hover:text-orange-400">Book Pandit</Link></li>
                <li><Link to="/store" className="hover:text-orange-400">Temple Store</Link></li>
                <li><Link to="/blog" className="hover:text-orange-400">Blog</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-white font-bold mb-4">Services</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/vedic" className="hover:text-orange-400">Vedic Astrology</Link></li>
                <li><Link to="/numerology" className="hover:text-orange-400">Numerology</Link></li>
                <li><Link to="/palmistry" className="hover:text-orange-400">Palmistry</Link></li>
                <li><Link to="/consultation" className="hover:text-orange-400">Consultation</Link></li>
                <li><Link to="/gemstones" className="hover:text-orange-400">Gemstones</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-bold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li>📧 info@coralsastrology.com</li>
                <li>📞 +91-XXXXXXXXXX</li>
                <li>
                  <div className="flex space-x-4 mt-4">
                    <a href="#" className="hover:text-orange-400">FB</a>
                    <a href="#" className="hover:text-orange-400">Twitter</a>
                    <a href="#" className="hover:text-orange-400">Instagram</a>
                    <a href="#" className="hover:text-orange-400">YouTube</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <div className="text-center text-sm mb-4">
              <p className="mb-2">
                <Link to="/privacy" className="hover:text-orange-400 mr-4">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-orange-400 mr-4">Terms & Conditions</Link>
                <Link to="/refund" className="hover:text-orange-400">Refund Policy</Link>
              </p>
            </div>

            <div className="border-t border-gray-700 pt-4 text-center text-sm">
              <p className="mb-2 text-gray-400">Platform Maintained By:</p>
              <p className="mb-1">
                ⚡ <span className="text-orange-400 font-semibold">ANKR.IN</span> - Technology Partner
              </p>
              <p className="mb-4">
                💼 <span className="text-purple-400 font-semibold">PowerBox IT Solutions Pvt Ltd</span>
                <br />
                <span className="text-xs">Enterprise Software Development</span>
              </p>
              <p className="text-gray-500 text-xs">
                Founded by <span className="text-orange-400">Jyotish Acharya Rakesh Sharma</span>
              </p>
              <p className="text-gray-600 text-xs mt-2">
                © 2024 CoralsAstrology. All Rights Reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
