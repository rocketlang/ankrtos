import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const FIND_MATCHING_VESSELS = gql`
  mutation FindMatchingVessels(
    $cargoType: String!
    $quantity: Float!
    $loadPort: String!
    $dischargePort: String!
    $laycanFrom: String!
    $laycanTo: String!
  ) {
    findMatchingVessels(
      cargoType: $cargoType
      quantity: $quantity
      loadPort: $loadPort
      dischargePort: $dischargePort
      laycanFrom: $laycanFrom
      laycanTo: $laycanTo
    )
  }
`;

interface VesselMatch {
  vesselId: string;
  vesselName: string;
  dwt: number;
  built: number;
  flag: string;
  suitabilityScore: number;
  strengths: string[];
  concerns: string[];
  recommendation: string;
}

export const FixtureMatcher: React.FC = () => {
  const [cargoType, setCargoType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loadPort, setLoadPort] = useState('');
  const [dischargePort, setDischargePort] = useState('');
  const [laycanFrom, setLaycanFrom] = useState('');
  const [laycanTo, setLaycanTo] = useState('');
  const [matches, setMatches] = useState<VesselMatch[]>([]);

  const [findMatches, { loading }] = useMutation(FIND_MATCHING_VESSELS, {
    onCompleted: (data) => {
      setMatches(data.findMatchingVessels || []);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    findMatches({
      variables: {
        cargoType,
        quantity: parseFloat(quantity),
        loadPort,
        dischargePort,
        laycanFrom,
        laycanTo,
      },
    });
  };

  const loadSample = () => {
    setCargoType('Coal');
    setQuantity('75000');
    setLoadPort('RICHARDS BAY');
    setDischargePort('MUMBAI');
    setLaycanFrom('2026-03-01');
    setLaycanTo('2026-03-10');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationBadge = (recommendation: string) => {
    const badges: Record<string, string> = {
      HIGHLY_SUITABLE: 'bg-green-100 text-green-800',
      SUITABLE: 'bg-blue-100 text-blue-800',
      ACCEPTABLE: 'bg-yellow-100 text-yellow-800',
      NOT_RECOMMENDED: 'bg-red-100 text-red-800',
    };
    return badges[recommendation] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">AI Fixture Matching</h3>
          <button
            onClick={loadSample}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Load Sample
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo Type
              </label>
              <input
                type="text"
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Coal, Iron Ore, Grain..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity (MT)
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="75000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Load Port
              </label>
              <input
                type="text"
                value={loadPort}
                onChange={(e) => setLoadPort(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="RICHARDS BAY"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discharge Port
              </label>
              <input
                type="text"
                value={dischargePort}
                onChange={(e) => setDischargePort(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MUMBAI"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Laycan From
              </label>
              <input
                type="date"
                value={laycanFrom}
                onChange={(e) => setLaycanFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Laycan To
              </label>
              <input
                type="date"
                value={laycanTo}
                onChange={(e) => setLaycanTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Finding Matches...' : 'Find Matching Vessels'}
          </button>
        </form>
      </div>

      {matches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {matches.length} Matching Vessels Found
          </h3>

          {matches.map((match, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {match.vesselName}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {match.dwt.toLocaleString()} DWT • Built {match.built} • {match.flag}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(match.suitabilityScore)}`}>
                    {match.suitabilityScore}
                  </div>
                  <div className="text-xs text-gray-500">Suitability Score</div>
                </div>
              </div>

              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRecommendationBadge(match.recommendation)}`}>
                  {match.recommendation.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-semibold text-green-700 mb-2">
                    ✓ Strengths
                  </h5>
                  <ul className="space-y-1">
                    {match.strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-gray-700">
                        • {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                {match.concerns.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-orange-700 mb-2">
                      ⚠ Concerns
                    </h5>
                    <ul className="space-y-1">
                      {match.concerns.map((concern, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          • {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && matches.length === 0 && laycanFrom && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800">
            No matching vessels found. Try adjusting your search criteria.
          </p>
        </div>
      )}
    </div>
  );
};
