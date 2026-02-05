import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  subscription: {
    tier: 'FREE' | 'FREEMIUM' | 'PRO' | 'ENTERPRISE';
    expiresAt: string;
    usageLeft: {
      readings: number;
      questions: number;
      consultations: number;
    };
  };
  avatar: string;
}

const DashboardPage: React.FC = () => {
  // Mock user data - in real app, fetch from API
  const [user] = useState<UserProfile>({
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    phone: '+91-9876543210',
    dateOfBirth: '1990-05-15',
    timeOfBirth: '14:30',
    placeOfBirth: 'New Delhi, India',
    subscription: {
      tier: 'PRO',
      expiresAt: '2024-12-31',
      usageLeft: {
        readings: 8,
        questions: 3,
        consultations: 1,
      },
    },
    avatar: '👤',
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'systems' | 'orders' | 'profile'>('overview');

  const astrologySystemsget = [
    {
      id: 'vedic',
      name: 'Vedic Astrology',
      icon: '🔮',
      description: 'Complete birth chart & planetary analysis',
      status: 'available',
      color: 'orange',
    },
    {
      id: 'numerology',
      name: 'Numerology',
      icon: '🔢',
      description: 'Life path, destiny & soul urge numbers',
      status: 'available',
      color: 'purple',
    },
    {
      id: 'palmistry',
      name: 'Palmistry',
      icon: '👋',
      description: 'Hand lines, mounts & finger analysis',
      status: 'available',
      color: 'blue',
    },
    {
      id: 'tarot',
      name: 'Tarot Reading',
      icon: '🃏',
      description: 'Tarot card spreads & insights',
      status: 'coming-soon',
      color: 'pink',
    },
    {
      id: 'chinese',
      name: 'Chinese BaZi',
      icon: '🌏',
      description: 'Four pillars of destiny',
      status: 'available',
      color: 'red',
    },
    {
      id: 'crystal',
      name: 'Crystal Therapy',
      icon: '💎',
      description: 'Gemstone & crystal recommendations',
      status: 'available',
      color: 'green',
    },
    {
      id: 'dasha',
      name: 'Dasha Systems',
      icon: '📅',
      description: 'Vimshottari & other dasha predictions',
      status: 'available',
      color: 'indigo',
    },
    {
      id: 'medical',
      name: 'Medical Astrology',
      icon: '⚕️',
      description: 'Health predictions & remedies',
      status: 'available',
      color: 'teal',
    },
    {
      id: 'loshu',
      name: 'Lo Shu Grid',
      icon: '🔳',
      description: 'Chinese numerology grid',
      status: 'available',
      color: 'amber',
    },
  ];

  const recentOrders = [
    { id: '1', type: 'Gemstone', item: 'Ruby (5 carat)', date: '2024-11-15', amount: 25000, status: 'Delivered' },
    { id: '2', type: 'Pandit Booking', item: 'Griha Pravesh Pooja', date: '2024-11-10', amount: 5000, status: 'Completed' },
    { id: '3', type: 'Report', item: 'Comprehensive Vedic Report', date: '2024-11-05', amount: 2999, status: 'Downloaded' },
  ];

  const upcomingEvents = [
    { id: '1', type: 'Video Consultation', title: 'Monthly consultation with Acharya Ji', date: '2024-12-01', time: '15:00' },
    { id: '2', type: 'Pandit Booking', title: 'Satyanarayan Pooja at home', date: '2024-12-05', time: '10:00' },
  ];

  const getTierColor = (tier: string) => {
    const colors = {
      FREE: 'text-gray-600 bg-gray-100',
      FREEMIUM: 'text-blue-600 bg-blue-100',
      PRO: 'text-orange-600 bg-orange-100',
      ENTERPRISE: 'text-purple-600 bg-purple-100',
    };
    return colors[tier as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getSystemColor = (color: string) => {
    const colors: { [key: string]: string } = {
      orange: 'from-orange-400 to-orange-600',
      purple: 'from-purple-400 to-purple-600',
      blue: 'from-blue-400 to-blue-600',
      pink: 'from-pink-400 to-pink-600',
      red: 'from-red-400 to-red-600',
      green: 'from-green-400 to-green-600',
      indigo: 'from-indigo-400 to-indigo-600',
      teal: 'from-teal-400 to-teal-600',
      amber: 'from-amber-400 to-amber-600',
    };
    return colors[color] || 'from-gray-400 to-gray-600';
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
              <Link to="/store" className="text-gray-700 hover:text-orange-600">Store</Link>
              <Link to="/book-pandit" className="text-gray-700 hover:text-orange-600">Book Pandit</Link>
              <Link to="/ask-acharya" className="text-gray-700 hover:text-orange-600">Ask Acharya</Link>
              <div className="flex items-center gap-3">
                <Link to="/notifications" className="relative">
                  <span className="text-2xl">🔔</span>
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    3
                  </span>
                </Link>
                <Link to="/profile">
                  <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center text-xl">
                    {user.avatar}
                  </div>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              {/* User Info */}
              <div className="text-center mb-6 pb-6 border-b">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-purple-600 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-3">
                  {user.avatar}
                </div>
                <h2 className="text-xl font-bold mb-1">{user.name}</h2>
                <p className="text-sm text-gray-600 mb-3">{user.email}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getTierColor(user.subscription.tier)}`}>
                  {user.subscription.tier}
                </span>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors ${
                    activeTab === 'overview' ? 'bg-orange-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📊 Overview
                </button>
                <button
                  onClick={() => setActiveTab('systems')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors ${
                    activeTab === 'systems' ? 'bg-orange-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🔮 Astrology Systems
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors ${
                    activeTab === 'orders' ? 'bg-orange-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📦 Orders & Bookings
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors ${
                    activeTab === 'profile' ? 'bg-orange-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ⚙️ Profile Settings
                </button>
              </nav>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t space-y-2">
                <Link
                  to="/choose-plan"
                  className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700"
                >
                  Upgrade Plan
                </Link>
                <button className="block w-full bg-gray-200 text-gray-700 text-center py-3 rounded-lg font-semibold hover:bg-gray-300">
                  Logout
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl p-8">
                  <h1 className="text-3xl font-bold mb-2">Namaste, {user.name.split(' ')[0]}! 🙏</h1>
                  <p className="text-lg">Your spiritual journey continues...</p>
                </div>

                {/* Usage Stats */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-700">Readings Left</h3>
                      <span className="text-3xl">📖</span>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">{user.subscription.usageLeft.readings}</p>
                    <p className="text-sm text-gray-500">This month</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-700">Questions to Acharya</h3>
                      <span className="text-3xl">❓</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">{user.subscription.usageLeft.questions}</p>
                    <p className="text-sm text-gray-500">This month</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-700">Video Consultations</h3>
                      <span className="text-3xl">📹</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{user.subscription.usageLeft.consultations}</p>
                    <p className="text-sm text-gray-500">This month</p>
                  </div>
                </div>

                {/* Quick Access */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4">Quick Access</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Link
                      to="/vedic-astrology"
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                    >
                      <div className="text-3xl mb-2">🔮</div>
                      <h3 className="font-semibold mb-1">Birth Chart</h3>
                      <p className="text-sm text-gray-600">View your Vedic chart</p>
                    </Link>

                    <Link
                      to="/ask-acharya"
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
                    >
                      <div className="text-3xl mb-2">💬</div>
                      <h3 className="font-semibold mb-1">Ask Question</h3>
                      <p className="text-sm text-gray-600">Get expert guidance</p>
                    </Link>

                    <Link
                      to="/store"
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
                    >
                      <div className="text-3xl mb-2">🛍️</div>
                      <h3 className="font-semibold mb-1">Temple Store</h3>
                      <p className="text-sm text-gray-600">Buy gemstones & items</p>
                    </Link>
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
                  <div className="space-y-3">
                    {upcomingEvents.map(event => (
                      <div key={event.id} className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
                        <div className="text-3xl">📅</div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-gray-600">
                            {event.date} at {event.time}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-orange-600 text-white text-sm rounded-full">
                          {event.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Horoscope */}
                <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold mb-3">Today's Horoscope ⭐</h2>
                  <p className="text-gray-700 mb-4">
                    A favorable day for new beginnings. Your ruling planet is in a strong position,
                    bringing opportunities in career and relationships. Wear your gemstone for
                    enhanced positive energy.
                  </p>
                  <Link to="/daily-horoscope" className="text-orange-600 hover:text-orange-700 font-semibold">
                    Read Full Horoscope →
                  </Link>
                </div>
              </div>
            )}

            {/* Astrology Systems Tab */}
            {activeTab === 'systems' && (
              <div>
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <h2 className="text-2xl font-bold mb-2">Explore 9 Sacred Sciences</h2>
                  <p className="text-gray-600">
                    Access all astrology systems included in your {user.subscription.tier} plan
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {astrologySystemsget.map(system => (
                    <div
                      key={system.id}
                      className={`bg-white rounded-xl shadow-md overflow-hidden ${
                        system.status === 'coming-soon' ? 'opacity-60' : 'hover:shadow-xl transition-shadow'
                      }`}
                    >
                      <div className={`h-2 bg-gradient-to-r ${getSystemColor(system.color)}`}></div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-5xl">{system.icon}</div>
                          {system.status === 'coming-soon' && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-semibold">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{system.name}</h3>
                        <p className="text-gray-600 mb-4">{system.description}</p>
                        {system.status === 'available' ? (
                          <Link
                            to={`/${system.id}`}
                            className={`inline-block px-6 py-2 bg-gradient-to-r ${getSystemColor(system.color)} text-white rounded-lg font-semibold hover:opacity-90`}
                          >
                            Explore →
                          </Link>
                        ) : (
                          <button className="px-6 py-2 bg-gray-300 text-gray-600 rounded-lg font-semibold cursor-not-allowed">
                            Coming Soon
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <h2 className="text-2xl font-bold mb-2">Your Orders & Bookings</h2>
                  <p className="text-gray-600">Track all your purchases and bookings</p>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">Type</th>
                        <th className="px-6 py-4 text-left font-semibold">Item</th>
                        <th className="px-6 py-4 text-left font-semibold">Date</th>
                        <th className="px-6 py-4 text-left font-semibold">Amount</th>
                        <th className="px-6 py-4 text-left font-semibold">Status</th>
                        <th className="px-6 py-4 text-left font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(order => (
                        <tr key={order.id} className="border-t">
                          <td className="px-6 py-4">{order.type}</td>
                          <td className="px-6 py-4 font-medium">{order.item}</td>
                          <td className="px-6 py-4 text-gray-600">{order.date}</td>
                          <td className="px-6 py-4 font-semibold">₹{order.amount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Link to={`/order/${order.id}`} className="text-orange-600 hover:text-orange-700 font-semibold">
                              View →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

                  {/* Birth Details */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Birth Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                        <input
                          type="date"
                          value={user.dateOfBirth}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Time of Birth</label>
                        <input
                          type="time"
                          value={user.timeOfBirth}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Place of Birth</label>
                        <input
                          type="text"
                          value={user.placeOfBirth}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={user.email}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={user.phone}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subscription Info */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Subscription</h3>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Current Plan:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTierColor(user.subscription.tier)}`}>
                          {user.subscription.tier}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Expires:</span>
                        <span>{user.subscription.expiresAt}</span>
                      </div>
                    </div>
                  </div>

                  <button className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700">
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
