/**
 * Broker Portal
 * Dashboard for brokers - fixture management, commissions, deal pipeline
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import React from 'react';
import { TrendingUp, DollarSign, FileText, Users, Target, Calendar } from 'lucide-react';

const BrokerPortal: React.FC = () => {
  const stats = {
    activeDeals: 15,
    closedDeals: 42,
    commission: 125000,
    pipelineValue: 850000,
  };

  const deals = [
    {
      id: '1',
      cargo: 'Iron Ore 80K MT',
      vessel: 'MV PACIFIC STAR',
      charterer: 'Global Charterers Ltd',
      owner: 'Ocean Carriers Inc',
      freight: 32.5,
      commission: 1.25,
      status: 'negotiating',
      probability: 75,
    },
    {
      id: '2',
      cargo: 'Coal 75K MT',
      vessel: 'MV ATLANTIC GRACE',
      charterer: 'Cargo Masters SA',
      owner: 'Maritime Holdings',
      freight: 28.0,
      commission: 1.25,
      status: 'subjects',
      probability: 90,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Broker Portal</h1>
          <p className="text-sm text-gray-600">Deal Pipeline & Commission Tracking</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Deals</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeDeals}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed (YTD)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.closedDeals}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commission Earned</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${(stats.commission / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${(stats.pipelineValue / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Deal Pipeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Deal Pipeline</h2>
          </div>
          <div className="p-6 space-y-4">
            {deals.map((deal) => (
              <div key={deal.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{deal.cargo}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          deal.status === 'subjects'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {deal.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Vessel</p>
                        <p className="font-medium text-gray-900">{deal.vessel}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Charterer</p>
                        <p className="font-medium text-gray-900">{deal.charterer}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Freight Rate</p>
                        <p className="font-medium text-gray-900">${deal.freight}/MT</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Est. Commission</p>
                        <p className="font-medium text-green-600">
                          ${Math.round(deal.freight * 75000 * (deal.commission / 100)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Deal Probability</span>
                      <span className="font-medium text-gray-900">{deal.probability}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${deal.probability}%` }}
                      ></div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    View Deal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerPortal;
