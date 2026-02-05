import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface PoojaType {
  id: string;
  name: string;
  icon: string;
  description: string;
  duration: string;
  priceRange: string;
  popular: boolean;
}

const BookPanditPage: React.FC = () => {
  const [selectedPooja, setSelectedPooja] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  const poojaTypes: PoojaType[] = [
    {
      id: 'griha_pravesh',
      name: 'Griha Pravesh (Housewarming)',
      icon: '🏠',
      description: 'Sacred ceremony for entering a new home',
      duration: '2-3 hours',
      priceRange: '₹3,000 - ₹8,000',
      popular: true
    },
    {
      id: 'ganesh',
      name: 'Ganesh Pooja',
      icon: '🐘',
      description: 'Remove obstacles and bring prosperity',
      duration: '1-2 hours',
      priceRange: '₹2,000 - ₹5,000',
      popular: true
    },
    {
      id: 'marriage',
      name: 'Marriage Ceremony',
      icon: '💑',
      description: 'Complete wedding rituals',
      duration: '4-6 hours',
      priceRange: '₹15,000 - ₹50,000',
      popular: true
    },
    {
      id: 'satyanarayan',
      name: 'Satyanarayan Pooja',
      icon: '🙏',
      description: 'Thanksgiving and blessings',
      duration: '2-3 hours',
      priceRange: '₹2,500 - ₹6,000',
      popular: true
    },
    {
      id: 'navagraha',
      name: 'Navagraha Pooja',
      icon: '⭐',
      description: 'Planetary peace and harmony',
      duration: '2-3 hours',
      priceRange: '₹3,500 - ₹8,000',
      popular: false
    },
    {
      id: 'vastu_shanti',
      name: 'Vastu Shanti',
      icon: '🏛️',
      description: 'Harmonize energies in property',
      duration: '2-3 hours',
      priceRange: '₹4,000 - ₹10,000',
      popular: false
    },
    {
      id: 'vehicle',
      name: 'Vehicle Pooja',
      icon: '🚗',
      description: 'Blessings for new vehicle',
      duration: '1 hour',
      priceRange: '₹1,500 - ₹3,000',
      popular: false
    },
    {
      id: 'birthday',
      name: 'Birthday Pooja',
      icon: '🎂',
      description: 'Birthday blessings and protection',
      duration: '1-2 hours',
      priceRange: '₹2,000 - ₹4,000',
      popular: false
    },
    {
      id: 'lakshmi',
      name: 'Lakshmi Pooja',
      icon: '💰',
      description: 'Wealth and prosperity',
      duration: '2 hours',
      priceRange: '₹2,500 - ₹6,000',
      popular: false
    },
    {
      id: 'hanuman',
      name: 'Hanuman Pooja',
      icon: '🦁',
      description: 'Strength and protection',
      duration: '1-2 hours',
      priceRange: '₹2,000 - ₹5,000',
      popular: false
    },
    {
      id: 'rudrabhishek',
      name: 'Rudrabhishek',
      icon: '🔱',
      description: 'Lord Shiva worship for peace',
      duration: '2-3 hours',
      priceRange: '₹3,000 - ₹7,000',
      popular: false
    },
    {
      id: 'durga',
      name: 'Durga Pooja',
      icon: '🌺',
      description: 'Divine mother blessings',
      duration: '2-3 hours',
      priceRange: '₹3,000 - ₹8,000',
      popular: false
    },
    {
      id: 'shradh',
      name: 'Shradh/Tarpan',
      icon: '🕯️',
      description: 'Ancestor worship and peace',
      duration: '2 hours',
      priceRange: '₹2,500 - ₹6,000',
      popular: false
    },
    {
      id: 'thread_ceremony',
      name: 'Thread Ceremony (Upanayana)',
      icon: '👦',
      description: 'Sacred thread initiation',
      duration: '3-4 hours',
      priceRange: '₹8,000 - ₹20,000',
      popular: false
    },
    {
      id: 'baby_naming',
      name: 'Namkaran (Baby Naming)',
      icon: '👶',
      description: 'Baby naming ceremony',
      duration: '1-2 hours',
      priceRange: '₹2,000 - ₹5,000',
      popular: false
    },
    {
      id: 'business_muhurat',
      name: 'Business Muhurat',
      icon: '🏢',
      description: 'Auspicious business opening',
      duration: '1-2 hours',
      priceRange: '₹3,000 - ₹8,000',
      popular: false
    }
  ];

  const handleBookNow = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle booking logic
    alert('Booking request submitted! Our team will contact you shortly.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-orange-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">🙏 Book Expert Pandits</h1>
          <p className="text-xl mb-6">
            Verified Professionals • Home & Temple Services • All Types of Rituals
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-white/20 px-4 py-2 rounded-full">✓ KYC Verified</div>
            <div className="bg-white/20 px-4 py-2 rounded-full">✓ Experienced</div>
            <div className="bg-white/20 px-4 py-2 rounded-full">✓ Transparent Pricing</div>
            <div className="bg-white/20 px-4 py-2 rounded-full">✓ Instant Booking</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Select Pooja', desc: 'Choose the type of pooja you need', icon: '📋' },
              { step: '2', title: 'Choose Date', desc: 'Pick your preferred date and time', icon: '📅' },
              { step: '3', title: 'Find Pandit', desc: 'We match you with verified pandits', icon: '👨‍🏫' },
              { step: '4', title: 'Confirm', desc: 'Book and pay securely online', icon: '✅' }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-purple-600 font-bold mb-2">Step {item.step}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Poojas */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Popular Poojas
          </h2>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {poojaTypes.filter(p => p.popular).map((pooja) => (
              <div
                key={pooja.id}
                className="bg-white rounded-xl border-2 border-purple-200 p-6 hover:shadow-xl hover:border-purple-400 transition cursor-pointer"
                onClick={() => setSelectedPooja(pooja.id)}
              >
                <div className="text-5xl mb-3">{pooja.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{pooja.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{pooja.description}</p>
                <div className="text-xs text-gray-500 mb-1">⏱️ {pooja.duration}</div>
                <div className="text-sm font-semibold text-purple-600">{pooja.priceRange}</div>
              </div>
            ))}
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            All Poojas & Ceremonies
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {poojaTypes.filter(p => !p.popular).map((pooja) => (
              <div
                key={pooja.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-purple-300 transition cursor-pointer"
                onClick={() => setSelectedPooja(pooja.id)}
              >
                <div className="text-4xl mb-2">{pooja.icon}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{pooja.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{pooja.description}</p>
                <div className="text-xs text-gray-500 mb-1">⏱️ {pooja.duration}</div>
                <div className="text-sm font-semibold text-purple-600">{pooja.priceRange}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-12 px-4 bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Quick Booking Form
            </h2>

            <form onSubmit={handleBookNow} className="space-y-6">
              {/* Personal Details */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Pooja Details */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type of Pooja *
                </label>
                <select
                  required
                  value={selectedPooja}
                  onChange={(e) => setSelectedPooja(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a pooja type</option>
                  {poojaTypes.map((pooja) => (
                    <option key={pooja.id} value={pooja.id}>
                      {pooja.icon} {pooja.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preferred Time *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select time slot</option>
                    <option value="morning">Morning (6 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                    <option value="evening">Evening (4 PM - 8 PM)</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location Type *
                </label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="locationType"
                      value="home"
                      onChange={(e) => setLocation(e.target.value)}
                      className="mr-2"
                    />
                    🏠 Home
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="locationType"
                      value="temple"
                      onChange={(e) => setLocation(e.target.value)}
                      className="mr-2"
                    />
                    🛕 Temple
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="locationType"
                      value="other"
                      onChange={(e) => setLocation(e.target.value)}
                      className="mr-2"
                    />
                    📍 Other
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Address *
                </label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter complete address with landmark"
                ></textarea>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="110001"
                  />
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Special Requirements / Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Any specific requirements or questions..."
                ></textarea>
              </div>

              {/* Puja Materials */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" />
                  <span className="text-sm text-gray-700">
                    <strong>Need puja materials?</strong> Let the pandit bring all required items (+₹500-2000)
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-orange-600 text-white py-4 rounded-lg text-lg font-semibold hover:shadow-xl transition"
              >
                Find Available Pandits
              </button>

              <p className="text-xs text-center text-gray-500">
                By submitting, you agree to our Terms & Conditions. No payment required now.
                Pay only after confirming your booking.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Book Through CoralsAstrology?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '✅',
                title: 'KYC Verified Pandits',
                desc: 'All pandits are verified with Aadhaar, temple references, and experience certificates'
              },
              {
                icon: '⭐',
                title: 'Rated & Reviewed',
                desc: 'See real reviews from previous customers. Choose pandits with 4.5+ ratings'
              },
              {
                icon: '💰',
                title: 'Transparent Pricing',
                desc: 'No hidden costs. See full pricing breakdown before booking'
              },
              {
                icon: '🔒',
                title: 'Secure Payment',
                desc: 'Pay online securely. Money held in escrow until service completion'
              },
              {
                icon: '📞',
                title: '24/7 Support',
                desc: 'Our customer support team is always here to help you'
              },
              {
                icon: '🎁',
                title: 'Satisfaction Guaranteed',
                desc: 'Not satisfied? Get full refund within 24 hours of booking'
              }
            ].map((item, idx) => (
              <div key={idx} className="text-center p-6">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Pandits */}
      <section className="py-12 px-4 bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Top Rated Pandits
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Pandit Ramesh Sharma', exp: '15 years', rating: 4.9, bookings: 500, city: 'Delhi' },
              { name: 'Pandit Vijay Kumar', exp: '12 years', rating: 4.8, bookings: 350, city: 'Mumbai' },
              { name: 'Pandit Anil Joshi', exp: '20 years', rating: 4.9, bookings: 600, city: 'Bangalore' },
              { name: 'Pandit Suresh Gupta', exp: '10 years', rating: 4.7, bookings: 280, city: 'Pune' }
            ].map((pandit, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 hover:shadow-xl transition">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-200 to-purple-200 rounded-full flex items-center justify-center text-4xl">
                  👨‍🏫
                </div>
                <h3 className="font-bold text-gray-900 text-center mb-2">{pandit.name}</h3>
                <div className="text-sm text-gray-600 text-center mb-3">
                  📍 {pandit.city}
                </div>
                <div className="text-xs text-gray-500 text-center mb-2">
                  🎓 {pandit.exp} experience
                </div>
                <div className="flex justify-center items-center space-x-2 mb-3">
                  <span className="text-yellow-400">⭐</span>
                  <span className="font-bold">{pandit.rating}</span>
                  <span className="text-gray-500 text-xs">({pandit.bookings} bookings)</span>
                </div>
                <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 bg-gradient-to-r from-purple-600 to-orange-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">
            Need Help Choosing?
          </h2>
          <p className="text-xl mb-6">
            Talk to our spiritual guidance team. We'll help you find the perfect pandit for your needs.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/contact"
              className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
            >
              Call Us Now
            </Link>
            <Link
              to="/whatsapp"
              className="border-2 border-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-purple-600 transition"
            >
              WhatsApp Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookPanditPage;
