import React, { useState, useEffect } from 'react';
import { useSearchStore } from '../lib/stores/searchStore';
import { useDocumentSearch } from '../lib/hooks/useDocumentSearch';
import { SearchResultCard } from '../components/rag/SearchResultCard';
import { FacetFilters } from '../components/rag/FacetFilters';
import { DocumentPreviewModal } from '../components/rag/DocumentPreviewModal';
import { useTranslation } from 'react-i18next';

export default function AdvancedSearch() {
  const { t } = useTranslation();
  const {
    query,
    results,
    isSearching,
    totalResults,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    setQuery,
    setPage,
    setSortBy,
    setSortOrder,
  } = useSearchStore();

  const { executeSearch, loading } = useDocumentSearch();

  const [localQuery, setLocalQuery] = useState(query);
  const [previewDocument, setPreviewDocument] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Execute search on mount if query exists
  useEffect(() => {
    if (query) {
      executeSearch();
    }
  }, []);

  const handleSearch = () => {
    if (localQuery.trim()) {
      setQuery(localQuery);
      executeSearch(localQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSortChange = (newSortBy: 'relevance' | 'date' | 'title') => {
    if (newSortBy === sortBy) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'relevance':
        comparison = b.score - a.score;
        break;
      case 'date':
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
    }

    return sortOrder === 'asc' ? -comparison : comparison;
  });

  // Pagination
  const totalPages = Math.ceil(totalResults / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedResults = sortedResults.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Advanced Search
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search across all your maritime documents with powerful filters
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
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
              </div>
              <input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('rag.search.placeholder', 'Search documents, clauses, ports...')}
                className="w-full pl-10 pr-4 py-3 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!localQuery.trim() || loading}
              className="px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Searching...
                </div>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <FacetFilters />
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            {results.length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Found <span className="font-semibold text-gray-900 dark:text-gray-100">{totalResults}</span> documents
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
                  <button
                    onClick={() => handleSortChange('relevance')}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      sortBy === 'relevance'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Relevance {sortBy === 'relevance' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    onClick={() => handleSortChange('date')}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      sortBy === 'date'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    onClick={() => handleSortChange('title')}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      sortBy === 'title'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <svg
                    className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400">Searching documents...</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && results.length === 0 && query && (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('rag.search.noResults', 'No results found')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or filters
                </p>
              </div>
            )}

            {/* Initial State */}
            {!loading && results.length === 0 && !query && (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Start searching
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter a query to search across all your maritime documents
                </p>
              </div>
            )}

            {/* Results List */}
            {!loading && paginatedResults.length > 0 && (
              <div className="space-y-4">
                {paginatedResults.map((result) => (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    onView={() =>
                      setPreviewDocument({
                        id: result.documentId,
                        title: result.title,
                      })
                    }
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalResults)} of {totalResults}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white dark:bg-blue-500'
                              : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          documentId={previewDocument.id}
          title={previewDocument.title}
          isOpen={true}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
}
