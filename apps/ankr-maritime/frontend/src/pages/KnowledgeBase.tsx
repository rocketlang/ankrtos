/**
 * Knowledge Base - RAG-powered Search & Q&A
 * Comprehensive interface for document search, Q&A, and admin analytics
 *
 * @package @ankr/mari8x
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Search,
  FileText,
  Filter,
  BookOpen,
  AlertCircle,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Copy,
  BarChart3,
  Upload,
  X,
  CheckCircle,
} from 'lucide-react';

// GraphQL Queries
const SEARCH_DOCUMENTS = gql`
  query SearchDocuments(
    $query: String!
    $limit: Int
    $docTypes: [String!]
    $vesselId: String
    $rerank: Boolean
  ) {
    searchDocuments(
      query: $query
      limit: $limit
      docTypes: $docTypes
      vesselId: $vesselId
      rerank: $rerank
    ) {
      id
      documentId
      title
      excerpt
      score
      metadata
      entities {
        vesselNames
        portNames
        cargoTypes
        parties
      }
      createdAt
    }
  }
`;

const ASK_MARI8X_RAG = gql`
  query AskMari8xRAG($question: String!, $limit: Int, $docTypes: [String!]) {
    askMari8xRAG(question: $question, limit: $limit, docTypes: $docTypes) {
      answer
      sources {
        documentId
        title
        excerpt
        page
        relevanceScore
      }
      confidence
      timestamp
      followUpSuggestions
      method
      complexity
      latency
      fromCache
    }
  }
`;

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

const CREATE_DOCUMENT = gql`
  mutation CreateDocument(
    $title: String!
    $content: String!
    $docType: String!
    $vesselId: ID
    $voyageId: ID
    $tags: [String!]
  ) {
    createDocument(
      title: $title
      content: $content
      docType: $docType
      vesselId: $vesselId
      voyageId: $voyageId
      tags: $tags
    ) {
      id
      title
      docType
    }
  }
`;

const PROCESSING_JOB_STATUS = gql`
  query ProcessingJobStatus($jobId: ID!) {
    processingJobStatus(jobId: $jobId) {
      jobId
      status
      progress
      chunksCreated
      error
    }
  }
`;

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState<'search' | 'ask' | 'analytics'>('search');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    docTypes: [] as string[],
    vesselId: '',
    rerank: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [showReindexConfirm, setShowReindexConfirm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    content: '',
    docType: 'charter_party',
    vesselId: '',
    voyageId: '',
    tags: [] as string[],
    file: null as File | null,
  });
  const [uploadJobId, setUploadJobId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Search query
  const {
    data: searchData,
    loading: searchLoading,
    refetch: searchRefetch,
  } = useQuery(SEARCH_DOCUMENTS, {
    variables: { query, limit: 20, ...filters },
    skip: !query || activeTab !== 'search',
  });

  // Ask query
  const {
    data: askData,
    loading: askLoading,
    refetch: askRefetch,
  } = useQuery(ASK_MARI8X_RAG, {
    variables: {
      question: query,
      limit: 5,
      docTypes: filters.docTypes.length > 0 ? filters.docTypes : undefined,
    },
    skip: !query || activeTab !== 'ask',
  });

  // Analytics
  const { data: analyticsData, loading: analyticsLoading } = useQuery(SEARCH_ANALYTICS, {
    variables: {
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dateTo: new Date(),
    },
    skip: activeTab !== 'analytics',
  });

  const [reindexAll, { loading: reindexing }] = useMutation(REINDEX_ALL);
  const [createDocument, { loading: uploading }] = useMutation(CREATE_DOCUMENT);
  const [ingestDocument] = useMutation(INGEST_DOCUMENT);

  // Poll job status if we have a job ID
  const { data: jobStatus } = useQuery(PROCESSING_JOB_STATUS, {
    variables: { jobId: uploadJobId },
    skip: !uploadJobId,
    pollInterval: uploadJobId ? 2000 : 0,
  });

  const handleSearch = () => {
    if (activeTab === 'search') {
      searchRefetch();
    } else {
      askRefetch();
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedResults(newExpanded);
  };

  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleReindex = async () => {
    try {
      const { data } = await reindexAll();
      if (data?.reindexAllDocuments) {
        alert(
          `Started reindexing ${data.reindexAllDocuments.totalDocuments} documents. ${data.reindexAllDocuments.jobIds.length} jobs created.`
        );
        setShowReindexConfirm(false);
      }
    } catch (error) {
      console.error('Reindex error:', error);
      alert('Failed to start reindexing.');
    }
  };

  const docTypeOptions = [
    'charter_party',
    'fixture_note',
    'pda',
    'fda',
    'sof',
    'nor',
    'laytime_statement',
    'email',
    'market_report',
    'regulation',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({ ...uploadForm, file, title: file.name });
      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadForm((prev) => ({
          ...prev,
          content: event.target?.result as string,
        }));
      };
      reader.readAsText(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadForm({ ...uploadForm, file, title: file.name });
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadForm((prev) => ({
          ...prev,
          content: event.target?.result as string,
        }));
      };
      reader.readAsText(file);
    }
  };

  const handleUpload = async () => {
    try {
      // Create document
      const { data } = await createDocument({
        variables: {
          title: uploadForm.title,
          content: uploadForm.content,
          docType: uploadForm.docType,
          vesselId: uploadForm.vesselId || undefined,
          voyageId: uploadForm.voyageId || undefined,
          tags: uploadForm.tags.length > 0 ? uploadForm.tags : undefined,
        },
      });

      if (data?.createDocument) {
        // Ingest document into RAG
        const ingestResult = await ingestDocument({
          variables: { documentId: data.createDocument.id },
        });

        if (ingestResult.data?.ingestDocument) {
          setUploadJobId(ingestResult.data.ingestDocument.jobId);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document.');
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      content: '',
      docType: 'charter_party',
      vesselId: '',
      voyageId: '',
      tags: [],
      file: null,
    });
    setUploadJobId(null);
    setShowUploadModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Knowledge Base
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  RAG-powered document search and maritime Q&A
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Upload className="w-5 h-5" />
              Upload Document
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'search'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Search className="w-5 h-5 inline mr-2" />
              Document Search
            </button>
            <button
              onClick={() => setActiveTab('ask')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'ask'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <AlertCircle className="w-5 h-5 inline mr-2" />
              Ask a Question
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <BarChart3 className="w-5 h-5 inline mr-2" />
              Analytics
            </button>
          </div>

          {/* Search & Ask Tabs */}
          {(activeTab === 'search' || activeTab === 'ask') && (
            <div className="p-4">
              {/* Search Bar */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={
                      activeTab === 'search'
                        ? 'Search charter parties, emails, reports...'
                        : 'Ask a question about maritime operations, regulations, contracts...'
                    }
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
                >
                  <Filter className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSearch}
                  disabled={!query}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {activeTab === 'search' ? 'Search' : 'Ask'}
                </button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Document Types
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {docTypeOptions.map((type) => (
                          <label key={type} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.docTypes.includes(type)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters({
                                    ...filters,
                                    docTypes: [...filters.docTypes, type],
                                  });
                                } else {
                                  setFilters({
                                    ...filters,
                                    docTypes: filters.docTypes.filter((t) => t !== type),
                                  });
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {type.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Vessel ID
                      </label>
                      <input
                        type="text"
                        value={filters.vesselId}
                        onChange={(e) => setFilters({ ...filters, vesselId: e.target.value })}
                        placeholder="Filter by vessel"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />

                      <label className="flex items-center mt-4">
                        <input
                          type="checkbox"
                          checked={filters.rerank}
                          onChange={(e) => setFilters({ ...filters, rerank: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Enable reranking
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {(searchLoading || askLoading) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'search' ? 'Searching documents...' : 'Generating answer...'}
            </p>
          </div>
        )}

        {/* Ask Results */}
        {activeTab === 'ask' && askData?.askMari8xRAG && !askLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Answer</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {(askData.askMari8xRAG.confidence * 100).toFixed(0)}% confidence
                </span>
                {askData.askMari8xRAG.latency && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {askData.askMari8xRAG.latency}ms
                  </span>
                )}
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none mb-6">
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                {askData.askMari8xRAG.answer}
              </p>
            </div>

            {askData.askMari8xRAG.sources.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Sources ({askData.askMari8xRAG.sources.length})
                </h3>
                <div className="space-y-2">
                  {askData.askMari8xRAG.sources.map((source: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {source.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {source.excerpt}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-500">
                          <span>Relevance: {(source.relevanceScore * 100).toFixed(0)}%</span>
                          {source.page && <span>Page {source.page}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {askData.askMari8xRAG.followUpSuggestions.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Follow-up Questions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {askData.askMari8xRAG.followUpSuggestions.map((suggestion: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setQuery(suggestion)}
                      className="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {activeTab === 'search' && searchData?.searchDocuments && !searchLoading && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {searchData.searchDocuments.length} results found
            </p>

            {searchData.searchDocuments.map((result: any) => {
              const isExpanded = expandedResults.has(result.id);
              return (
                <div
                  key={result.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {highlightText(result.title, query)}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {(result.score * 100).toFixed(0)}% match
                        </span>
                        <span>•</span>
                        <span>{result.metadata.docType}</span>
                        {result.createdAt && (
                          <>
                            <span>•</span>
                            <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(result.excerpt)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Copy excerpt"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleExpand(result.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    {highlightText(result.excerpt, query)}
                  </p>

                  {/* Entities */}
                  {(result.entities.vesselNames.length > 0 ||
                    result.entities.portNames.length > 0 ||
                    result.entities.cargoTypes.length > 0) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {result.entities.vesselNames.map((vessel: string) => (
                        <span
                          key={vessel}
                          className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                        >
                          🚢 {vessel}
                        </span>
                      ))}
                      {result.entities.portNames.map((port: string) => (
                        <span
                          key={port}
                          className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded"
                        >
                          ⚓ {port}
                        </span>
                      ))}
                      {result.entities.cargoTypes.map((cargo: string) => (
                        <span
                          key={cargo}
                          className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded"
                        >
                          📦 {cargo}
                        </span>
                      ))}
                    </div>
                  )}

                  {isExpanded && result.content && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                        {result.content}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg Results</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {analyticsData?.searchAnalytics?.avgResultsCount
                        ? analyticsData.searchAnalytics.avgResultsCount.toFixed(1)
                        : '--'}
                    </p>
                  </div>
                  <div className="text-4xl">📊</div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <button
                  onClick={() => setShowReindexConfirm(true)}
                  disabled={reindexing}
                  className="w-full h-full flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
                >
                  <div className="text-4xl mb-2">🔄</div>
                  <p className="text-sm font-medium">
                    {reindexing ? 'Reindexing...' : 'Re-index All'}
                  </p>
                </button>
              </div>
            </div>

            {/* Top Queries */}
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
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No search queries yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!query && (activeTab === 'search' || activeTab === 'ask') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {activeTab === 'search' ? 'Search Maritime Documents' : 'Ask a Question'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {activeTab === 'search'
                ? 'Search through charter parties, emails, market reports using AI-powered semantic search.'
                : 'Get instant answers about maritime operations, regulations, contracts, and best practices.'}
            </p>
          </div>
        )}
      </div>

      {/* Reindex Modal */}
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
                This will re-index all documents in your knowledge base. This may take several minutes.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowReindexConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReindex}
                  disabled={reindexing}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {reindexing ? 'Starting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => !uploading && !uploadJobId && setShowUploadModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Upload Document to Knowledge Base
                </h3>
                <button
                  onClick={() => !uploading && !uploadJobId && setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={uploading || !!uploadJobId}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!uploadJobId ? (
                <div className="space-y-4">
                  {/* Drag & Drop Area */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      Drag and drop your document here, or
                    </p>
                    <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                      Browse Files
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".txt,.pdf,.doc,.docx"
                      />
                    </label>
                    {uploadForm.file && (
                      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        Selected: <span className="font-medium">{uploadForm.file.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Document Title *
                      </label>
                      <input
                        type="text"
                        value={uploadForm.title}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, title: e.target.value })
                        }
                        placeholder="e.g., Charter Party - MV PACIFIC STAR"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Document Type *
                      </label>
                      <select
                        value={uploadForm.docType}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, docType: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                      >
                        {docTypeOptions.map((type) => (
                          <option key={type} value={type}>
                            {type.replace(/_/g, ' ').toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Vessel ID (optional)
                      </label>
                      <input
                        type="text"
                        value={uploadForm.vesselId}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, vesselId: e.target.value })
                        }
                        placeholder="Vessel ID"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Voyage ID (optional)
                      </label>
                      <input
                        type="text"
                        value={uploadForm.voyageId}
                        onChange={(e) =>
                          setUploadForm({ ...uploadForm, voyageId: e.target.value })
                        }
                        placeholder="Voyage ID"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., fixture, iron ore, brazil"
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            tags: e.target.value.split(',').map((t) => t.trim()),
                          })
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowUploadModal(false)}
                      disabled={uploading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={uploading || !uploadForm.title || !uploadForm.content}
                      className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Uploading...' : 'Upload & Index'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Processing Status */}
                  <div className="text-center py-8">
                    {jobStatus?.processingJobStatus?.status === 'completed' ? (
                      <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Document Indexed Successfully!
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Created {jobStatus.processingJobStatus.chunksCreated} chunks
                        </p>
                        <button
                          onClick={resetUploadForm}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Upload Another
                        </button>
                      </>
                    ) : jobStatus?.processingJobStatus?.status === 'failed' ? (
                      <>
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Indexing Failed
                        </h4>
                        <p className="text-red-600 dark:text-red-400 mb-4">
                          {jobStatus.processingJobStatus.error || 'Unknown error'}
                        </p>
                        <button
                          onClick={resetUploadForm}
                          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Try Again
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Processing Document...
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Progress: {jobStatus?.processingJobStatus?.progress || 0}%
                        </p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-md mx-auto">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${jobStatus?.processingJobStatus?.progress || 0}%`,
                            }}
                          ></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
