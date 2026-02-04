import React from 'react';
import { format } from 'date-fns';

interface SearchResultCardProps {
  result: {
    id: string;
    documentId: string;
    title: string;
    excerpt: string;
    score: number;
    metadata: any;
    entities: {
      vesselNames: string[];
      portNames: string[];
      cargoTypes: string[];
      parties: string[];
    };
    createdAt: Date;
  };
  onView: () => void;
}

export function SearchResultCard({ result, onView }: SearchResultCardProps) {
  const relevancePercent = Math.round(result.score * 100);

  // Determine relevance color
  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-blue-600 dark:text-blue-400';
    if (score >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  // Get document type badge
  const getDocTypeBadge = (docType: string) => {
    const badges: { [key: string]: { label: string; color: string; icon: string } } = {
      charter_party: { label: 'C/P', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: '📄' },
      bol: { label: 'B/L', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: '📋' },
      email: { label: 'Email', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: '✉️' },
      market_report: { label: 'Market', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: '📊' },
      compliance: { label: 'Compliance', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: '✅' },
      sop: { label: 'SOP', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', icon: '📖' },
      invoice: { label: 'Invoice', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: '💰' },
    };

    const badge = badges[docType] || badges.charter_party;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        <span>{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
            {result.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {result.metadata?.docType && getDocTypeBadge(result.metadata.docType)}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(result.createdAt), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>

        {/* Relevance Score */}
        <div className="flex flex-col items-end gap-1">
          <div className={`text-sm font-semibold ${getRelevanceColor(result.score)}`}>
            {relevancePercent}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">relevance</div>
        </div>
      </div>

      {/* Excerpt */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
        {result.excerpt}
      </p>

      {/* Entity Badges */}
      {(result.entities.vesselNames.length > 0 ||
        result.entities.portNames.length > 0 ||
        result.entities.cargoTypes.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {result.entities.vesselNames.slice(0, 2).map((vessel, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
              </svg>
              {vessel}
            </span>
          ))}
          {result.entities.portNames.slice(0, 2).map((port, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              {port}
            </span>
          ))}
          {result.entities.cargoTypes.slice(0, 2).map((cargo, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              {cargo.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onView}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors"
        >
          View Document
        </button>
        <button
          className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          title="Add to collection"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
        <button
          className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          title="Share"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
