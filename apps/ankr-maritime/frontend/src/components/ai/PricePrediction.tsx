import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const PREDICT_PRICE = gql`
  mutation PredictPrice($predictionType: String!, $context: JSON!) {
    predictPrice(predictionType: $predictionType, context: $context)
  }
`;

interface PredictionResult {
  predictedPrice: number;
  confidence: number;
  range: { min: number; max: number };
  factors: Record<string, number>;
  trend: string;
  recommendation: string;
}

export const PricePrediction: React.FC = () => {
  const [predictionType, setPredictionType] = useState<'freight_rate' | 'bunker_price' | 'vessel_value'>('freight_rate');
  const [route, setRoute] = useState('');
  const [vesselType, setVesselType] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [result, setResult] = useState<PredictionResult | null>(null);

  const [predict, { loading }] = useMutation(PREDICT_PRICE, {
    onCompleted: (data) => {
      setResult(data.predictPrice);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    predict({
      variables: {
        predictionType,
        context: {
          route,
          vesselType,
          cargoType,
        },
      },
    });
  };

  const loadSample = () => {
    setPredictionType('freight_rate');
    setRoute('USGULF-JAPAN');
    setVesselType('panamax');
    setCargoType('grain');
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'UP') return '📈';
    if (trend === 'DOWN') return '📉';
    return '➡️';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'UP') return 'text-green-600';
    if (trend === 'DOWN') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">AI Price Prediction</h3>
          <button
            onClick={loadSample}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Load Sample
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prediction Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['freight_rate', 'bunker_price', 'vessel_value'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPredictionType(type)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    predictionType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route
              </label>
              <input
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="USGULF-JAPAN"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vessel Type
              </label>
              <select
                value={vesselType}
                onChange={(e) => setVesselType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select...</option>
                <option value="panamax">Panamax</option>
                <option value="capesize">Capesize</option>
                <option value="handysize">Handysize</option>
                <option value="supramax">Supramax</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo Type
              </label>
              <input
                type="text"
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Grain, Coal, Iron Ore..."
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Predicting...' : 'Predict Price'}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
            <div className="text-center">
              <div className="text-sm opacity-80 mb-2">Predicted {predictionType.replace('_', ' ')}</div>
              <div className="text-5xl font-bold mb-2">
                ${result.predictedPrice.toLocaleString()}
              </div>
              <div className="text-sm opacity-80">
                Range: ${result.range.min.toLocaleString()} - ${result.range.max.toLocaleString()}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className={`text-3xl ${getTrendColor(result.trend)}`}>
                  {getTrendIcon(result.trend)}
                </div>
                <div className="text-sm opacity-80 mt-1">Trend: {result.trend}</div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold">{Math.round(result.confidence * 100)}%</div>
                <div className="text-sm opacity-80 mt-1">Confidence</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-semibold mb-4">Price Drivers</h4>
            <div className="space-y-3">
              {Object.entries(result.factors).map(([factor, impact]) => (
                <div key={factor} className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      {factor.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          impact > 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.abs(impact) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className={`ml-4 text-sm font-semibold ${impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {impact > 0 ? '+' : ''}{(impact * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

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
