import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Stats {
  totalBooks: number;
  totalChapters: number;
  questionsGenerated: number;
  studentsHelped: number;
  lastUpdated: string;
}

export default function Landing() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalBooks: 6,
    totalChapters: 89,
    questionsGenerated: 0,
    studentsHelped: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ncert/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-2xl">📚</span>
              <span className="text-blue-400 text-sm font-medium">
                NCERT Intelligent Viewer
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Transform Passive Reading
              <br />
              Into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Active Critical Thinking
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
              AI-powered learning companion for NCERT textbooks. Master concepts through
              Fermi estimation, Socratic dialogues, and logic challenges.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/books')}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-lg"
              >
                Start Learning →
              </button>
              <button
                onClick={() =>
                  window.open('https://github.com/anthropics/claude-code', '_blank')
                }
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors text-lg"
              >
                View on GitHub
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Live Stats */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {stats.totalBooks}
              </div>
              <div className="text-gray-400 text-sm">NCERT Books</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">
                {stats.totalChapters}
              </div>
              <div className="text-gray-400 text-sm">Total Chapters</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">
                {stats.questionsGenerated}
              </div>
              <div className="text-gray-400 text-sm">AI Questions Generated</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-400 mb-2">
                {loading ? '...' : '500M+'}
              </div>
              <div className="text-gray-400 text-sm">Target Students (India)</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-500">
              Last Updated: {new Date(stats.lastUpdated).toLocaleDateString('en-IN')} •{' '}
              <span className="text-green-400">● Live</span>
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          4 AI-Powered Learning Modes
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Fermi */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition-colors">
            <div className="text-4xl mb-4">🔬</div>
            <h3 className="text-xl font-bold text-white mb-2">Fermi Questions</h3>
            <p className="text-gray-400 text-sm mb-4">
              Order-of-magnitude estimation problems that build intuition and reasoning
              skills.
            </p>
            <div className="text-xs text-blue-400">
              ✓ Step-by-step hints
              <br />✓ Real-world applications
            </div>
          </div>

          {/* Socratic */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-purple-500 transition-colors">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-white mb-2">Socratic Dialogues</h3>
            <p className="text-gray-400 text-sm mb-4">
              AI tutor that never gives direct answers - guides you to discover solutions
              yourself.
            </p>
            <div className="text-xs text-purple-400">
              ✓ Guided discovery
              <br />✓ Multi-turn conversations
            </div>
          </div>

          {/* Logic */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-green-500 transition-colors">
            <div className="text-4xl mb-4">🧩</div>
            <h3 className="text-xl font-bold text-white mb-2">Logic Challenges</h3>
            <p className="text-gray-400 text-sm mb-4">
              Critical thinking exercises: fallacies, conditional reasoning, argument
              analysis.
            </p>
            <div className="text-xs text-green-400">
              ✓ 4 challenge types
              <br />✓ Detailed explanations
            </div>
          </div>

          {/* Translation */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-orange-500 transition-colors">
            <div className="text-4xl mb-4">🌐</div>
            <h3 className="text-xl font-bold text-white mb-2">Bilingual Support</h3>
            <p className="text-gray-400 text-sm mb-4">
              Hindi-English side-by-side translation preserving all formatting and math
              expressions.
            </p>
            <div className="text-xs text-orange-400">
              ✓ Instant translation
              <br />✓ Preserves formatting
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            Powered by Claude Sonnet 4.5
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-white font-semibold mb-1">Real-Time AI</div>
              <div className="text-gray-400 text-sm">
                Questions generated on-demand from your textbook content
              </div>
            </div>
            <div>
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-white font-semibold mb-1">Context-Aware</div>
              <div className="text-gray-400 text-sm">
                Every question tied to specific chapter concepts
              </div>
            </div>
            <div>
              <div className="text-3xl mb-2">📈</div>
              <div className="text-white font-semibold mb-1">Adaptive Learning</div>
              <div className="text-gray-400 text-sm">
                Difficulty adjusts based on your responses
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Ready to Learn Smarter?</h2>
        <p className="text-xl text-gray-400 mb-8">
          Join thousands of students transforming their NCERT study experience
        </p>
        <button
          onClick={() => navigate('/books')}
          className="px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105"
        >
          Explore Books →
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">NCERT Intelligent Viewer</h3>
              <p className="text-gray-400 text-sm">
                Transform passive reading into active critical thinking with AI-powered
                learning tools.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/books" className="text-gray-400 hover:text-blue-400">
                    Browse Books
                  </a>
                </li>
                <li>
                  <a
                    href="https://ncert.nic.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-400"
                  >
                    NCERT Official
                  </a>
                </li>
                <li>
                  <a href="/api/health" className="text-gray-400 hover:text-blue-400">
                    API Status
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Technology</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✓ Claude Sonnet 4.5</li>
                <li>✓ React 19 + TypeScript</li>
                <li>✓ Fastify Backend</li>
                <li>✓ Real-time AI Generation</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
            <p>
              Made with ❤️ for 500M+ Indian students • Powered by{' '}
              <a
                href="https://anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                Anthropic
              </a>
            </p>
            <p className="mt-2">
              © 2026 NCERT Intelligent Viewer • Open Source Project
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
