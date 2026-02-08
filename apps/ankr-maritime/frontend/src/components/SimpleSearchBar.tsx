import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAISearchStore } from '../lib/stores/aiSearchStore';
import { searchWithAI, navigateWithAI } from '../lib/ai-router';

export default function SimpleSearchBar() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isOpen,
    query,
    isLoading,
    error,
    recentSearches,
    open,
    close,
    setQuery,
    setLoading,
    setResult,
    setError,
    addRecentSearch,
  } = useAISearchStore();

  const [showRecent, setShowRecent] = useState(false);

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open();
        setTimeout(() => inputRef.current?.focus(), 100);
      }

      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, open, close]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await searchWithAI(searchQuery);
      setResult(result);
      addRecentSearch(searchQuery);

      // Navigate to the page
      navigateWithAI(result, navigate, (msg) => {
        // Simple console log for now - can integrate with toast system later
        console.log('[AI Search]', msg);
      });

      // Close after navigation
      setTimeout(() => close(), 300);
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error('[AI Search Error]', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleRecentClick = (recentQuery: string) => {
    setQuery(recentQuery);
    handleSearch(recentQuery);
    setShowRecent(false);
  };

  if (!isOpen) {
    // Compact search button in header
    return (
      <button
        onClick={open}
        className="flex items-center gap-2 px-4 py-2 bg-maritime-800/50 hover:bg-maritime-700 border border-maritime-600 rounded-lg transition-colors text-maritime-300 text-sm"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="hidden sm:inline">Search anything...</span>
        <kbd className="hidden sm:inline px-2 py-0.5 text-xs bg-maritime-900 border border-maritime-600 rounded">
          ⌘K
        </kbd>
      </button>
    );
  }

  // Full-screen search overlay
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[100]"
        onClick={close}
      />

      {/* Search Dialog */}
      <div className="fixed inset-x-0 top-20 z-[101] flex justify-center px-4">
        <div className="w-full max-w-2xl bg-maritime-900 border border-maritime-600 rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center px-4 border-b border-maritime-700">
              <svg
                className="w-5 h-5 text-maritime-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowRecent(true)}
                placeholder="Type what you're looking for... (e.g., 'vessels near Mumbai', 'create invoice')"
                className="w-full px-4 py-4 bg-transparent text-white placeholder-maritime-400 focus:outline-none text-base"
                disabled={isLoading}
              />
              {isLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-500 border-t-transparent" />
              )}
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 bg-red-900/20 border-b border-red-800 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Recent Searches */}
          {showRecent && recentSearches.length > 0 && !isLoading && (
            <div className="max-h-96 overflow-y-auto">
              <div className="px-4 py-2 text-xs text-maritime-400 font-medium">
                Recent Searches
              </div>
              {recentSearches.map((recent, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRecentClick(recent)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-maritime-800 transition-colors text-left group"
                >
                  <svg
                    className="w-4 h-4 text-maritime-500 group-hover:text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-white text-sm">{recent}</span>
                </button>
              ))}
            </div>
          )}

          {/* Help Text */}
          {!isLoading && !error && query.length === 0 && (
            <div className="px-4 py-6 space-y-3">
              <div className="text-xs text-maritime-400 font-medium mb-2">
                Try searching for:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setQuery('vessels');
                    handleSearch('vessels');
                  }}
                  className="px-3 py-2 bg-maritime-800/50 hover:bg-maritime-700 rounded-lg text-left text-sm text-maritime-200 transition-colors"
                >
                  vessels
                </button>
                <button
                  onClick={() => {
                    setQuery('mumbai port');
                    handleSearch('mumbai port');
                  }}
                  className="px-3 py-2 bg-maritime-800/50 hover:bg-maritime-700 rounded-lg text-left text-sm text-maritime-200 transition-colors"
                >
                  mumbai port
                </button>
                <button
                  onClick={() => {
                    setQuery('create invoice');
                    handleSearch('create invoice');
                  }}
                  className="px-3 py-2 bg-maritime-800/50 hover:bg-maritime-700 rounded-lg text-left text-sm text-maritime-200 transition-colors"
                >
                  create invoice
                </button>
                <button
                  onClick={() => {
                    setQuery('show alerts');
                    handleSearch('show alerts');
                  }}
                  className="px-3 py-2 bg-maritime-800/50 hover:bg-maritime-700 rounded-lg text-left text-sm text-maritime-200 transition-colors"
                >
                  show alerts
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 bg-maritime-950 border-t border-maritime-700 flex items-center justify-between text-xs text-maritime-500">
            <span>Powered by AI ✨</span>
            <div className="flex items-center gap-3">
              <span>
                <kbd className="px-2 py-0.5 bg-maritime-900 border border-maritime-700 rounded">
                  Enter
                </kbd>{' '}
                to search
              </span>
              <span>
                <kbd className="px-2 py-0.5 bg-maritime-900 border border-maritime-700 rounded">
                  Esc
                </kbd>{' '}
                to close
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
