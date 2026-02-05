import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface Question {
  id: string;
  userId: string;
  userName: string;
  category: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  status: 'PENDING' | 'ANSWERED' | 'IN_REVIEW';
  isPaid: boolean;
  isPriority: boolean;
  askedAt: string;
  answeredAt?: string;
  upvotes: number;
  isPublic: boolean;
}

const AskAcharyaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ask' | 'my-questions' | 'community'>('ask');
  const [questionForm, setQuestionForm] = useState({
    category: '',
    question: '',
    isPriority: false,
    isPublic: true,
  });

  // Mock data - in real app, fetch from API
  const [myQuestions] = useState<Question[]>([
    {
      id: '1',
      userId: 'user123',
      userName: 'Rajesh Kumar',
      category: 'Career',
      question: 'When is the best time for me to change my job? I have been facing difficulties at my current workplace.',
      answer: 'Based on your birth chart, the period from January to March 2025 will be highly favorable for career changes. Jupiter will be transiting through your 10th house, bringing new opportunities. I recommend performing Ganesh Pooja on a Thursday before making any major decisions.',
      answeredBy: 'Jyotish Acharya Rakesh Sharma',
      status: 'ANSWERED',
      isPaid: true,
      isPriority: false,
      askedAt: '2024-11-15',
      answeredAt: '2024-11-16',
      upvotes: 23,
      isPublic: true,
    },
    {
      id: '2',
      userId: 'user123',
      userName: 'Rajesh Kumar',
      category: 'Relationship',
      question: 'My marriage is facing challenges. What remedies do you suggest?',
      status: 'IN_REVIEW',
      isPaid: true,
      isPriority: true,
      askedAt: '2024-11-20',
      upvotes: 0,
      isPublic: false,
    },
  ]);

  const [communityQuestions] = useState<Question[]>([
    {
      id: 'c1',
      userId: 'user456',
      userName: 'Priya S.',
      category: 'Gemstones',
      question: 'Which gemstone should I wear for better financial stability?',
      answer: 'For financial stability, I recommend wearing Yellow Sapphire (Pukhraj) if Jupiter is weak in your chart, or Emerald (Panna) for Mercury. Please consult your birth chart first. The gemstone should be at least 5 carats and set in gold.',
      answeredBy: 'Jyotish Acharya Rakesh Sharma',
      status: 'ANSWERED',
      isPaid: false,
      isPriority: false,
      askedAt: '2024-11-10',
      answeredAt: '2024-11-11',
      upvotes: 67,
      isPublic: true,
    },
    {
      id: 'c2',
      userId: 'user789',
      userName: 'Amit P.',
      category: 'Health',
      question: 'I have been suffering from chronic health issues. Can astrology help?',
      answer: 'According to medical astrology, chronic health issues are often related to Saturn or Rahu placements. I see from general analysis that digestive health remedies may help. Perform Surya Namaskar daily and wear a Red Coral for Mars strength. Also consult an Ayurvedic doctor.',
      answeredBy: 'Jyotish Acharya Rakesh Sharma',
      status: 'ANSWERED',
      isPaid: false,
      isPriority: false,
      askedAt: '2024-11-08',
      answeredAt: '2024-11-09',
      upvotes: 89,
      isPublic: true,
    },
  ]);

  const categories = [
    { id: 'career', name: 'Career & Business', icon: '💼' },
    { id: 'relationship', name: 'Relationship & Marriage', icon: '❤️' },
    { id: 'health', name: 'Health & Wellness', icon: '⚕️' },
    { id: 'finance', name: 'Finance & Wealth', icon: '💰' },
    { id: 'education', name: 'Education & Learning', icon: '📚' },
    { id: 'gemstones', name: 'Gemstones & Remedies', icon: '💎' },
    { id: 'poojas', name: 'Poojas & Rituals', icon: '🙏' },
    { id: 'general', name: 'General Guidance', icon: '🔮' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit question to API
    console.log('Question submitted:', questionForm);
    alert('Your question has been submitted! Acharya Ji will respond within 24-48 hours.');
    setQuestionForm({
      category: '',
      question: '',
      isPriority: false,
      isPublic: true,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setQuestionForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ANSWERED':
        return 'bg-green-100 text-green-700';
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-700';
      case 'PENDING':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
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
      <section className="bg-gradient-to-r from-orange-500 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="text-6xl mb-4">🙏</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Ask Jyotish Acharya Rakesh Sharma</h1>
          <p className="text-xl mb-2">Get Expert Astrological Guidance</p>
          <p className="text-sm opacity-90">20+ Years Experience • 5,000+ Consultations • Trusted by Thousands</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('ask')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'ask'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            ❓ Ask Question
          </button>
          <button
            onClick={() => setActiveTab('my-questions')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'my-questions'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            📝 My Questions
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'community'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🌍 Community Q&A
          </button>
        </div>

        {/* Ask Question Tab */}
        {activeTab === 'ask' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Submit Your Question</h2>

              {/* Pricing Info */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Standard Question</h3>
                    <span className="text-2xl font-bold text-blue-600">FREE</span>
                  </div>
                  <p className="text-sm text-gray-600">Response within 48-72 hours</p>
                </div>

                <div className="p-4 bg-orange-50 border-2 border-orange-500 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Priority Question ⚡</h3>
                    <span className="text-2xl font-bold text-orange-600">₹999</span>
                  </div>
                  <p className="text-sm text-gray-600">Response within 24 hours + detailed answer</p>
                </div>
              </div>

              {/* Question Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Question Category *
                  </label>
                  <select
                    name="category"
                    value={questionForm.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Question *
                  </label>
                  <textarea
                    name="question"
                    value={questionForm.question}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Please provide as much detail as possible for an accurate answer. Include relevant dates, situations, and specific concerns..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Tip: The more specific your question, the better the guidance!
                  </p>
                </div>

                {/* Priority Option */}
                <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <input
                    type="checkbox"
                    name="isPriority"
                    id="isPriority"
                    checked={questionForm.isPriority}
                    onChange={handleChange}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="isPriority" className="font-semibold cursor-pointer">
                      Make this a Priority Question ⚡ (₹999)
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Get a detailed, personalized response from Acharya Ji within 24 hours
                    </p>
                  </div>
                </div>

                {/* Public/Private */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="isPublic"
                    id="isPublic"
                    checked={questionForm.isPublic}
                    onChange={handleChange}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="isPublic" className="font-semibold cursor-pointer">
                      Share with community (recommended)
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Your question and answer will help others facing similar situations. Your name will be anonymized.
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Submit Question →
                </button>
              </form>
            </div>

            {/* Guidelines */}
            <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4">📋 Question Guidelines</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Be specific about your situation and concerns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Include relevant dates and timelines if applicable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>One question per submission (multiple aspects OK)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600">✗</span>
                  <span>Avoid yes/no questions - ask for guidance instead</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600">✗</span>
                  <span>Do not ask about lottery numbers or gambling</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* My Questions Tab */}
        {activeTab === 'my-questions' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-2">My Questions</h2>
              <p className="text-gray-600">Track all your questions and answers</p>
            </div>

            <div className="space-y-6">
              {myQuestions.map(q => (
                <div key={q.id} className="bg-white rounded-xl shadow-md p-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {categories.find(c => c.id === q.category.toLowerCase())?.icon || '❓'}
                      </span>
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(q.status)}`}>
                          {q.status}
                        </span>
                        {q.isPriority && (
                          <span className="ml-2 inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                            ⚡ Priority
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>Asked: {q.askedAt}</div>
                      {q.answeredAt && <div>Answered: {q.answeredAt}</div>}
                    </div>
                  </div>

                  {/* Question */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Your Question:</h3>
                    <p className="text-gray-700">{q.question}</p>
                  </div>

                  {/* Answer */}
                  {q.answer && (
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🙏</span>
                        <h3 className="font-semibold text-orange-900">{q.answeredBy}</h3>
                      </div>
                      <p className="text-gray-800">{q.answer}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {q.status === 'ANSWERED' && (
                    <div className="mt-4 flex items-center gap-4">
                      <button className="text-orange-600 hover:text-orange-700 font-semibold text-sm">
                        👍 Helpful ({q.upvotes})
                      </button>
                      <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
                        💬 Follow-up Question
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community Q&A Tab */}
        {activeTab === 'community' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-2">Community Questions & Answers</h2>
              <p className="text-gray-600">Learn from questions asked by others</p>
            </div>

            {/* Category Filter */}
            <div className="mb-6 flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-orange-600 text-white rounded-full text-sm font-semibold">
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className="px-4 py-2 bg-white text-gray-700 rounded-full text-sm font-semibold hover:bg-orange-50 border border-gray-200"
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            {/* Community Questions */}
            <div className="space-y-6">
              {communityQuestions.map(q => (
                <div key={q.id} className="bg-white rounded-xl shadow-md p-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                        {q.userName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{q.userName}</div>
                        <div className="text-sm text-gray-500">{q.category} • {q.askedAt}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-orange-600 hover:text-orange-700">
                        <span className="text-xl">👍</span>
                        <span className="text-sm font-semibold ml-1">{q.upvotes}</span>
                      </button>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="mb-4">
                    <p className="text-gray-700 text-lg">{q.question}</p>
                  </div>

                  {/* Answer */}
                  {q.answer && (
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🙏</span>
                        <h3 className="font-semibold text-orange-900">{q.answeredBy}</h3>
                        <span className="text-xs text-gray-500">• {q.answeredAt}</span>
                      </div>
                      <p className="text-gray-800">{q.answer}</p>
                    </div>
                  )}
                </div>
              ))}
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

export default AskAcharyaPage;
