import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const QUERY_WITH_NL = gql`
  mutation QueryWithNaturalLanguage($query: String!) {
    queryWithNaturalLanguage(query: $query)
  }
`;

interface QueryResult {
  results: any[];
  intent: string;
  entities: any;
  generatedSQL: string;
  confidence: number;
}

export const NLQueryBox: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const [executeQuery, { loading }] = useMutation(QUERY_WITH_NL, {
    onCompleted: (data) => {
      setResult(data.queryWithNaturalLanguage);
      setHistory([query, ...history.slice(0, 9)]);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      executeQuery({ variables: { query } });
    }
  };

  const sampleQueries = [
    'Show me all capesize vessels open in SE Asia next month',
    'How many vessels do we have under time charter?',
    'List all pending fixture approvals',
    'What are the top 5 routes by freight volume?',
    'Show vessels with expiring certificates in next 30 days',
    'Find all voyages to Mumbai in December',
  ];

  const loadSample = (sample: string) => {
    setQuery(sample);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Ask Anything in Plain English</h2>
        <p className="text-blue-100 mb-6">
          Query your database using natural language - no SQL required!
        </p>

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-6 py-4 pr-24 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-lg"
              placeholder="e.g., Show me all vessels in Singapore..."
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '...' : 'Ask'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-3">Try These Examples:</h3>
        <div className="grid grid-cols-2 gap-2">
          {sampleQueries.map((sample, index) => (
            <button
              key={index}
              onClick={() => loadSample(sample)}
              className="text-left px-4 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-md text-sm text-gray-700 hover:text-blue-600 transition-colors"
            >
              💬 {sample}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Query Understanding</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Confidence:</span>
                <div className="flex items-center space-x-1">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round(result.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Detected Intent
                </label>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {result.intent}
                </span>
              </div>

              {result.entities && Object.keys(result.entities).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Extracted Entities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.entities).map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {result.generatedSQL && (
              <div className="mt-4 p-4 bg-gray-900 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">
                    Generated SQL
                  </label>
                  <button
                    onClick={() => navigator.clipboard.writeText(result.generatedSQL)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-sm text-green-400 overflow-x-auto">
                  {result.generatedSQL}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Results ({result.results.length})
            </h3>

            {result.results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(result.results[0]).map((key) => (
                        <th
                          key={key}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.results.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.values(row).map((value, j) => (
                          <td key={j} className="px-4 py-3 text-sm text-gray-900">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No results found
              </div>
            )}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Recent Queries</h3>
          <ul className="space-y-2">
            {history.map((q, i) => (
              <li key={i}>
                <button
                  onClick={() => setQuery(q)}
                  className="text-sm text-gray-600 hover:text-blue-600 flex items-center"
                >
                  <span className="mr-2">↻</span>
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
