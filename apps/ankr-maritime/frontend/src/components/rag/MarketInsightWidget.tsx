import React, { useState, useEffect } from 'react';
import { useLazyQuery, gql } from '@apollo/client';

const SEARCH_MARKET_INSIGHTS = gql`
  query SearchDocuments($query: String!, $limit: Int, $docTypes: [String!]) {
    searchDocuments(query: $query, limit: $limit, docTypes: $docTypes) {
      id
      title
      excerpt
      score
      createdAt
      entities {
        vesselNames
        portNames
      }
    }
  }
`;

interface MarketInsight {
  title: string;
  excerpt: string;
  date: Date;
  category: 'rate' | 'route' | 'market' | 'vessel';
  trend: 'up' | 'down' | 'stable';
}

export function MarketInsightWidget() {
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchMarket, { loading }] = useLazyQuery(SEARCH_MARKET_INSIGHTS);

  useEffect(() => {
    loadInsights();
  }, [selectedCategory]);

  const loadInsights = async () => {
    try {
      const queries: Record<string, string> = {
        all: 'freight rates market trends analysis',
        rates: 'freight rates spot market fixtures',
        routes: 'trade routes voyage trends',
        market: 'market commentary outlook forecast',
        vessel: 'vessel utilization tonnage supply',
      };

      const { data } = await searchMarket({
        variables: {
          query: queries[selectedCategory] || queries.all,
          limit: 8,
          docTypes: ['market_report', 'email'],
        },
      });

      if (data?.searchDocuments) {
        const marketInsights: MarketInsight[] = data.searchDocuments.map((doc: any) => {
          const title = doc.title.toLowerCase();
          let category: 'rate' | 'route' | 'market' | 'vessel' = 'market';
          let trend: 'up' | 'down' | 'stable' = 'stable';

          // Detect category
          if (title.includes('rate') || title.includes('freight')) category = 'rate';
          else if (title.includes('route') || title.includes('voyage')) category = 'route';
          else if (title.includes('vessel') || title.includes('tonnage')) category = 'vessel';

          // Detect trend from excerpt
          const excerpt = doc.excerpt.toLowerCase();
          if (excerpt.includes('increas') || excerpt.includes('up') || excerpt.includes('rise')) trend = 'up';
          else if (excerpt.includes('decreas') || excerpt.includes('down') || excerpt.includes('fall')) trend = 'down';

          return {
            title: doc.title,
            excerpt: doc.excerpt,
            date: new Date(doc.createdAt),
            category,
            trend,
          };
        });

        setInsights(marketInsights);
      }
    } catch (error) {
      console.error('Market insights error:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rate': return '💰';
      case 'route': return '🗺️';
      case 'vessel': return '🚢';
      default: return '📊';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Market Intelligence
            </h3>
          </div>
          <button
            onClick={loadInsights}
            disabled={loading}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All', icon: '📊' },
            { id: 'rates', label: 'Freight Rates', icon: '💰' },
            { id: 'routes', label: 'Trade Routes', icon: '🗺️' },
            { id: 'market', label: 'Market Outlook', icon: '🔮' },
            { id: 'vessel', label: 'Vessel Market', icon: '🚢' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Insights List */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading insights...</p>
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">No market insights available</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{getCategoryIcon(insight.category)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                        {insight.title}
                      </h4>
                      <span className={`text-lg ml-2 flex-shrink-0 ${getTrendColor(insight.trend)}`}>
                        {getTrendIcon(insight.trend)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {insight.excerpt}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {insight.date.toLocaleDateString()}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        {insight.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
