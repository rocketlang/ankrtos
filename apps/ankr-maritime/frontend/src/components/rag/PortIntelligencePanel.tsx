import React, { useState, useEffect } from 'react';
import { useLazyQuery, gql } from '@apollo/client';

const SEARCH_PORT_INFO = gql`
  query SearchDocuments($query: String!, $limit: Int, $docTypes: [String!]) {
    searchDocuments(query: $query, limit: $limit, docTypes: $docTypes) {
      id
      title
      excerpt
      score
      createdAt
      entities {
        portNames
      }
    }
  }
`;

interface PortInfo {
  type: 'notice' | 'restriction' | 'congestion';
  title: string;
  description: string;
  date: Date;
  severity: 'low' | 'medium' | 'high';
}

export function PortIntelligencePanel({ portName }: { portName?: string }) {
  const [selectedPort, setSelectedPort] = useState(portName || '');
  const [portInfo, setPortInfo] = useState<PortInfo[]>([]);
  const [searchPort, { loading }] = useLazyQuery(SEARCH_PORT_INFO);

  useEffect(() => {
    if (selectedPort) {
      loadPortInfo();
    }
  }, [selectedPort]);

  const loadPortInfo = async () => {
    try {
      const { data } = await searchPort({
        variables: {
          query: `${selectedPort} port notices restrictions congestion`,
          limit: 10,
          docTypes: ['compliance', 'email', 'sop'],
        },
      });

      if (data?.searchDocuments) {
        const info: PortInfo[] = data.searchDocuments.map((doc: any) => {
          const title = doc.title.toLowerCase();
          let type: 'notice' | 'restriction' | 'congestion' = 'notice';
          let severity: 'low' | 'medium' | 'high' = 'low';

          if (title.includes('restriction') || title.includes('closed')) {
            type = 'restriction';
            severity = 'high';
          } else if (title.includes('congestion') || title.includes('delay')) {
            type = 'congestion';
            severity = 'medium';
          }

          return {
            type,
            title: doc.title,
            description: doc.excerpt,
            date: new Date(doc.createdAt),
            severity,
          };
        });

        setPortInfo(info);
      }
    } catch (error) {
      console.error('Port info error:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      default:
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'restriction':
        return '🚫';
      case 'congestion':
        return '🚢';
      default:
        return '📢';
    }
  };

  const commonPorts = [
    'Singapore',
    'Rotterdam',
    'Shanghai',
    'Hong Kong',
    'Busan',
    'Dubai',
    'Los Angeles',
    'Hamburg',
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏢</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Port Intelligence
            </h3>
          </div>
          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
            Live Data
          </span>
        </div>
      </div>

      {/* Port Selector */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Port
        </label>
        <div className="flex gap-2">
          <select
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a port...</option>
            {commonPorts.map((port) => (
              <option key={port} value={port}>
                {port}
              </option>
            ))}
          </select>
          <button
            onClick={loadPortInfo}
            disabled={!selectedPort || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {!selectedPort ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <p className="text-sm">Select a port to view intelligence</p>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading port data...</p>
          </div>
        ) : portInfo.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm">No recent information for {selectedPort}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {portInfo.map((info, idx) => (
              <div
                key={idx}
                className={`p-3 border rounded-lg ${getSeverityColor(info.severity)}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl flex-shrink-0">{getTypeIcon(info.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-medium">
                        {info.title}
                      </h4>
                      <span className="text-xs opacity-75 ml-2 flex-shrink-0">
                        {info.date.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs opacity-90 line-clamp-2">
                      {info.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded">
                        {info.type.charAt(0).toUpperCase() + info.type.slice(1)}
                      </span>
                      <button className="ml-auto text-xs hover:underline">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {selectedPort && portInfo.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Notices</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {portInfo.filter((i) => i.type === 'notice').length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Restrictions</div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                {portInfo.filter((i) => i.type === 'restriction').length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Congestion</div>
              <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                {portInfo.filter((i) => i.type === 'congestion').length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
