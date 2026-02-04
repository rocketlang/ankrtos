import React, { useState } from 'react';
import { useLazyQuery, gql } from '@apollo/client';

const SEARCH_CLAUSES = gql`
  query SearchDocuments($query: String!, $limit: Int, $docTypes: [String!]) {
    searchDocuments(query: $query, limit: $limit, docTypes: $docTypes) {
      id
      title
      excerpt
      score
      metadata
    }
  }
`;

interface ClauseRecommendation {
  title: string;
  excerpt: string;
  relevance: number;
  source: string;
}

export function CPClauseWidget() {
  const [activeTab, setActiveTab] = useState<'recommend' | 'precedent' | 'compare'>('recommend');
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState<ClauseRecommendation[]>([]);

  const [searchClauses, { loading }] = useLazyQuery(SEARCH_CLAUSES);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const { data } = await searchClauses({
        variables: {
          query: searchQuery,
          limit: 5,
          docTypes: ['charter_party', 'compliance'],
        },
      });

      if (data?.searchDocuments) {
        const recs = data.searchDocuments.map((doc: any) => ({
          title: doc.title,
          excerpt: doc.excerpt,
          relevance: doc.score,
          source: doc.metadata?.docType || 'charter_party',
        }));
        setRecommendations(recs);
      }
    } catch (error) {
      console.error('Clause search error:', error);
    }
  };

  // Predefined common clauses
  const commonClauses = [
    { label: 'Ice Clause', query: 'ice clause vessel frozen port' },
    { label: 'War Clause', query: 'war risks clause' },
    { label: 'Substitution', query: 'vessel substitution clause' },
    { label: 'Lien Clause', query: 'lien clause cargo freight' },
    { label: 'Arbitration', query: 'arbitration clause london' },
    { label: 'WWDSHEX', query: 'weather working days laytime' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Charter Party Clauses
            </h3>
          </div>
          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
            RAG Powered
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('recommend')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'recommend'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Recommend
        </button>
        <button
          onClick={() => setActiveTab('precedent')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'precedent'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Precedents
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'compare'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Compare
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'recommend' && (
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search for a clause
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g., ice clause, war risks..."
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Quick Access */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Common Clauses
              </label>
              <div className="flex flex-wrap gap-2">
                {commonClauses.map((clause, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(clause.query);
                      searchClauses({
                        variables: {
                          query: clause.query,
                          limit: 5,
                          docTypes: ['charter_party', 'compliance'],
                        },
                      }).then(({ data }) => {
                        if (data?.searchDocuments) {
                          setRecommendations(
                            data.searchDocuments.map((doc: any) => ({
                              title: doc.title,
                              excerpt: doc.excerpt,
                              relevance: doc.score,
                              source: doc.metadata?.docType || 'charter_party',
                            }))
                          );
                        }
                      });
                    }}
                    className="px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors"
                  >
                    {clause.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            {recommendations.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recommended Clauses ({recommendations.length})
                </label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {rec.title}
                        </h4>
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                          {Math.round(rec.relevance * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {rec.excerpt}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Source: {rec.source}
                        </span>
                        <button className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline">
                          Use This Clause
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'precedent' && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Search for precedent examples from past charters</p>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">Compare different clause variations</p>
          </div>
        )}
      </div>
    </div>
  );
}
