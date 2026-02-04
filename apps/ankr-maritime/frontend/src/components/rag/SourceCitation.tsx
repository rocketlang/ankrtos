import React from 'react';

interface SourceCitationProps {
  source: {
    documentId: string;
    title: string;
    excerpt: string;
    page?: number;
    relevanceScore: number;
  };
  index: number;
  onClick: () => void;
}

export function SourceCitation({ source, index, onClick }: SourceCitationProps) {
  const relevancePercent = Math.round(source.relevanceScore * 100);

  // Determine relevance color
  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 0.6) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors group"
    >
      <div className="flex items-start gap-3">
        {/* Citation Number */}
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {index + 1}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:underline">
              {source.title}
            </h4>
            {source.page && (
              <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                p. {source.page}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {source.excerpt}
          </p>

          {/* Relevance Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${getRelevanceColor(source.relevanceScore)}`}>
              {relevancePercent}% relevant
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Click to view
            </span>
          </div>
        </div>

        {/* Icon */}
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </div>
      </div>
    </button>
  );
}
