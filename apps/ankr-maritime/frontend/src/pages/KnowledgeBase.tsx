import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useTranslation } from 'react-i18next';

const SEARCH_ANALYTICS = gql`
  query SearchAnalytics($dateFrom: DateTime, $dateTo: DateTime) {
    searchAnalytics(dateFrom: $dateFrom, dateTo: $dateTo) {
      totalSearches
      avgResponseTime
      topQueries {
        query
        count
        avgResponseTime
      }
      avgResultsCount
    }
  }
`;

const REINDEX_ALL = gql`
  mutation ReindexAllDocuments {
    reindexAllDocuments {
      jobIds
      totalDocuments
      status
    }
  }
`;

const INGEST_DOCUMENT = gql`
  mutation IngestDocument($documentId: ID!) {
    ingestDocument(documentId: $documentId) {
      jobId
      status
      progress
      chunksCreated
      error
    }
  }
`;

export default function KnowledgeBase() {
  const { t } = useTranslation();
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showReindexConfirm, setShowReindexConfirm] = useState(false);

  // Analytics query
  const { data: analyticsData, loading: analyticsLoading } = useQuery(SEARCH_ANALYTICS, {
    variables: {
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      dateTo: new Date(),
    },
  });

  const [reindexAll, { loading: reindexing }] = useMutation(REINDEX_ALL);

  const handleReindex = async () => {
    try {
      const { data } = await reindexAll();
      if (data?.reindexAllDocuments) {
        alert(`Started reindexing ${data.reindexAllDocuments.totalDocuments} documents. ${data.reindexAllDocuments.jobIds.length} jobs created.`);
        setShowReindexConfirm(false);
      }
    } catch (error) {
      console.error('Reindex error:', error);
      alert('Failed to start reindexing. Please try again.');
    }
  };

  // Mock collections data (in production, this would come from GraphQL)
  const collections = [
    { id: 'charter_parties', name: 'Charter Parties', count: 24, chunks: 384, icon: '📄' },
    { id: 'bols', name: 'Bills of Lading', count: 67, chunks: 892, icon: '📋' },
    { id: 'ports', name: 'Port Intelligence', count: 156, chunks: 2340, icon: '🏢' },
    { id: 'compliance', name: 'Compliance Docs', count: 89, chunks: 1456, icon: '✅' },
    { id: 'market', name: 'Market Reports', count: 45, chunks: 678, icon: '📊' },
    { id: 'emails', name: 'Email Correspondence', count: 234, chunks: 1872, icon: '✉️' },
  ];

  const selectedCol = collections.find((c) => c.id === selectedCollection) || collections[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Knowledge Base
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your RAG-indexed documents and search analytics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {collections.reduce((sum, c) => sum + c.count, 0)}
                </p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Chunks</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {collections.reduce((sum, c) => sum + c.chunks, 0).toLocaleString()}
                </p>
              </div>
              <div className="text-4xl">🔍</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Searches</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {analyticsData?.searchAnalytics?.totalSearches || 0}
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Response</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {analyticsData?.searchAnalytics?.avgResponseTime
                    ? `${Math.round(analyticsData.searchAnalytics.avgResponseTime)}ms`
                    : '--'}
                </p>
              </div>
              <div className="text-4xl">⚡</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Collections Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Collections
                </h3>
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  + New
                </button>
              </div>

              <div className="space-y-2">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => setSelectedCollection(collection.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      selectedCollection === collection.id || (!selectedCollection && collection === collections[0])
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{collection.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{collection.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {collection.count} docs
                      </div>
                    </div>
                    <div className="text-xs font-semibold bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      {collection.chunks}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Collection Details */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedCol.icon}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {selectedCol.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedCol.count} documents | {selectedCol.chunks.toLocaleString()} chunks
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowReindexConfirm(true)}
                    disabled={reindexing}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {reindexing ? 'Reindexing...' : 'Re-index All'}
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors">
                    Export
                  </button>
                </div>
              </div>

              {/* Document List Placeholder */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Recent Documents:
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded flex items-center justify-center font-bold">
                        {selectedCol.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Document {i} - {selectedCol.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.floor(Math.random() * 50) + 10} chunks | Indexed 2 days ago
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                        ✅ Indexed
                      </span>
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Analytics */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Top Search Queries (Last 30 Days)
              </h3>

              {analyticsLoading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Loading analytics...
                </div>
              ) : analyticsData?.searchAnalytics?.topQueries?.length > 0 ? (
                <div className="space-y-3">
                  {analyticsData.searchAnalytics.topQueries.map((query: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {query.query}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {query.count} searches | Avg {Math.round(query.avgResponseTime)}ms
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {query.count} times
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No search queries yet
                </div>
              )}
            </div>

            {/* Test Similarity Search */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Test Similarity Search
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter a test query
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., What is demurrage?"
                      className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors">
                      Test Search
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  This will show you the top similar documents from the knowledge base without affecting analytics.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reindex Confirmation Modal */}
      {showReindexConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowReindexConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Confirm Re-indexing
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will re-index all documents in your knowledge base. This may take several minutes depending on the number of documents.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowReindexConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReindex}
                  disabled={reindexing}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {reindexing ? 'Starting...' : 'Confirm Re-index'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
