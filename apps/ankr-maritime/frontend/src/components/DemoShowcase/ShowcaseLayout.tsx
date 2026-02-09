import { Link, useNavigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ShowcaseLayoutProps {
  children: ReactNode;
  title: string;
  icon: string;
  category: string;
  problem: string;
  solution: string;
  timeSaved?: string;
  roi?: string;
  accuracy?: string;
  nextSection?: {
    title: string;
    path: string;
  };
}

export function ShowcaseLayout({
  children,
  title,
  icon,
  category,
  problem,
  solution,
  timeSaved,
  roi,
  accuracy,
  nextSection,
}: ShowcaseLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-maritime-950 via-maritime-900 to-maritime-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-maritime-900/95 backdrop-blur-sm border-b border-maritime-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/demo-showcase')}
                className="text-maritime-400 hover:text-white transition-colors"
              >
                ← Back to Showcase
              </button>
              <div className="h-6 w-px bg-maritime-700" />
              <div className="flex items-center gap-3">
                <div className="text-3xl">{icon}</div>
                <div>
                  <h1 className="text-xl font-bold text-white">{title}</h1>
                  <div className="text-xs text-maritime-400">{category}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-maritime-800 hover:bg-maritime-700 text-white rounded-lg border border-maritime-600 transition-colors text-sm">
                🔄 Reset Demo
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                Request Full Access →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Problem & Solution Banner */}
      <div className="bg-maritime-800/50 border-b border-maritime-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-400">⚠️</span>
                <span className="text-sm font-semibold text-maritime-300">Problem</span>
              </div>
              <p className="text-maritime-400">{problem}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400">✅</span>
                <span className="text-sm font-semibold text-maritime-300">Solution</span>
              </div>
              <p className="text-maritime-400">{solution}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </div>

      {/* Impact Metrics */}
      <div className="bg-maritime-800/50 border-t border-maritime-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Impact Metrics</h3>
          <div className="grid grid-cols-3 gap-6">
            {timeSaved && (
              <div className="bg-maritime-900/50 border border-maritime-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⏱️</span>
                  <span className="text-sm text-maritime-400">Time Saved</span>
                </div>
                <div className="text-2xl font-bold text-green-400">{timeSaved}</div>
              </div>
            )}
            {roi && (
              <div className="bg-maritime-900/50 border border-maritime-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💰</span>
                  <span className="text-sm text-maritime-400">Return on Investment</span>
                </div>
                <div className="text-2xl font-bold text-amber-400">{roi}</div>
              </div>
            )}
            {accuracy && (
              <div className="bg-maritime-900/50 border border-maritime-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎯</span>
                  <span className="text-sm text-maritime-400">Accuracy</span>
                </div>
                <div className="text-2xl font-bold text-blue-400">{accuracy}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Next Section */}
      {nextSection && (
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-t border-blue-500/30">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-maritime-400 mb-1">Next in Tour</div>
                <div className="text-xl font-semibold text-white">{nextSection.title}</div>
              </div>
              <Link
                to={nextSection.path}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Continue →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
