import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_MARKET_SENTIMENT = gql`
  mutation GetMarketSentiment($sector: String!, $timeRange: String) {
    getMarketSentiment(sector: $sector, timeRange: $timeRange)
  }
`;

interface SentimentResult {
  overallSentiment: string;
  score: number;
  factors: Array<{ factor: string; impact: string; description: string }>;
  trend: string;
  recommendation: string;
  balticIndex?: number;
  newsHeadlines?: string[];
}

export const MarketSentiment: React.FC = () => {
  const [sector, setSector] = useState('');
  const [timeRange, setTimeRange] = useState('monthly');
  const [result, setResult] = useState<SentimentResult | null>(null);

  const [getSentiment, { loading }] = useMutation(GET_MARKET_SENTIMENT, {
    onCompleted: (data) => {
      setResult(data.getMarketSentiment);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    getSentiment({ variables: { sector, timeRange } });
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'BULLISH') return 'text-green-600';
    if (sentiment === 'BEARISH') return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentBg = (sentiment: string) => {
    if (sentiment === 'BULLISH') return 'bg-green-50 border-green-200';
    if (sentiment === 'BEARISH') return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment === 'BULLISH') return '🐂';
    if (sentiment === 'BEARISH') return '🐻';
    return '➡️';
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'POSITIVE') return 'text-green-700 bg-green-100';
    if (impact === 'NEGATIVE') return 'text-red-700 bg-red-100';
    return 'text-gray-700 bg-gray-100';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Market Sentiment Analysis</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sector
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select sector...</option>
                <option value="dry_bulk">Dry Bulk</option>
                <option value="tankers">Tankers</option>
                <option value="containers">Containers</option>
                <option value="lng">LNG</option>
                <option value="offshore">Offshore</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze Market Sentiment'}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-4">
          <div className={`rounded-lg shadow-lg p-8 border-2 ${getSentimentBg(result.overallSentiment)}`}>
            <div className="text-center">
              <div className="text-6xl mb-4">{getSentimentIcon(result.overallSentiment)}</div>
              <div className={`text-3xl font-bold mb-2 ${getSentimentColor(result.overallSentiment)}`}>
                {result.overallSentiment}
              </div>
              <div className="text-gray-600">Market Sentiment</div>

              <div className="mt-6 flex items-center justify-center">
                <div className="w-64">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Bearish</span>
                    <span>Neutral</span>
                    <span>Bullish</span>
                  </div>
                  <div className="relative h-4 bg-gradient-to-r from-red-500 via-gray-400 to-green-500 rounded-full">
                    <div
                      className="absolute top-0 w-1 h-4 bg-white border-2 border-gray-800 rounded"
                      style={{ left: `${result.score * 100}%` }}
                    />
                  </div>
                  <div className="text-center mt-2 text-sm font-semibold">
                    Score: {(result.score * 100).toFixed(0)}
                  </div>
                </div>
              </div>

              {result.balticIndex && (
                <div className="mt-4 text-sm text-gray-600">
                  Baltic Index: <span className="font-semibold">{result.balticIndex}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-semibold mb-4">Key Factors</h4>
            <div className="space-y-3">
              {result.factors.map((factor, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{factor.factor}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(factor.impact)}`}>
                      {factor.impact}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-semibold mb-2">Trend</h4>
              <div className="text-2xl font-bold text-gray-900">{result.trend}</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-semibold mb-2">Time Period</h4>
              <div className="text-2xl font-bold text-gray-900 capitalize">{timeRange}</div>
            </div>
          </div>

          {result.newsHeadlines && result.newsHeadlines.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold mb-4">Recent News</h4>
              <ul className="space-y-2">
                {result.newsHeadlines.map((headline, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">📰</span>
                    <span className="text-sm text-gray-700">{headline}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-2xl mr-3">💡</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Recommendation</h4>
                <p className="text-blue-800 text-sm">{result.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
