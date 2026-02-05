/**
 * Charterer Portal
 * Dashboard for charterers - cargo booking, vessel search, fixture management
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import React, { useState } from 'react';
import {
  Package,
  Ship,
  Search,
  TrendingUp,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  FileText,
} from 'lucide-react';

const ChartererPortal: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('enquiries');

  // Mock data
  const stats = {
    activeEnquiries: 8,
    activeFixtures: 12,
    totalCargo: 850000, // MT
    avgFreightRate: 28.5,
  };

  const enquiries = [
    {
      id: '1',
      commodity: 'Iron Ore',
      quantity: 80000,
      unit: 'MT',
      loadPort: 'Ponta da Madeira',
      dischargePort: 'Shanghai',
      laycan: '15-25 Apr 2026',
      status: 'active',
      offers: 3,
    },
    {
      id: '2',
      commodity: 'Coal',
      quantity: 75000,
      unit: 'MT',
      loadPort: 'Richards Bay',
      dischargePort: 'Mumbai',
      laycan: '15-25 Mar 2026',
      status: 'matching',
      offers: 5,
    },
    {
      id: '3',
      commodity: 'Containers',
      quantity: 4000,
      unit: 'TEU',
      loadPort: 'Singapore',
      dischargePort: 'Los Angeles',
      laycan: '20-30 Mar 2026',
      status: 'fixed',
      offers: 0,
    },
  ];

  const vesselMatches = [
    {
      id: '1',
      name: 'MV PACIFIC STAR',
      type: 'Bulk Carrier',
      dwt: 82000,
      score: 95,
      eta: '2026-04-12',
      freightRate: 32.5,
      recommendation: 'Excellent match',
    },
    {
      id: '2',
      name: 'MV ATLANTIC GRACE',
      type: 'Bulk Carrier',
      dwt: 75000,
      score: 88,
      eta: '2026-04-15',
      freightRate: 31.0,
      recommendation: 'Good match',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Charterer Portal</h1>
              <p className="text-sm text-gray-600">Cargo Booking & Vessel Search</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + New Enquiry
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Enquiries</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeEnquiries}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Fixtures</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeFixtures}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cargo (YTD)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {(stats.totalCargo / 1000).toFixed(0)}K
                </p>
                <p className="text-sm text-gray-500 mt-1">MT</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Freight Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${stats.avgFreightRate}</p>
                <p className="text-sm text-gray-500 mt-1">per MT</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setSelectedTab('enquiries')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  selectedTab === 'enquiries'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Cargo Enquiries
              </button>
              <button
                onClick={() => setSelectedTab('matches')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  selectedTab === 'matches'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Vessel Matches
              </button>
            </nav>
          </div>

          {/* Enquiries Tab */}
          {selectedTab === 'enquiries' && (
            <div className="p-6">
              <div className="space-y-4">
                {enquiries.map((enq) => (
                  <div
                    key={enq.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Package className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900">{enq.commodity}</h3>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              enq.status === 'fixed'
                                ? 'bg-green-100 text-green-800'
                                : enq.status === 'matching'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {enq.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Quantity</p>
                            <p className="font-medium text-gray-900">
                              {enq.quantity.toLocaleString()} {enq.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Load Port</p>
                            <p className="font-medium text-gray-900">{enq.loadPort}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Discharge Port</p>
                            <p className="font-medium text-gray-900">{enq.dischargePort}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Laycan</p>
                            <p className="font-medium text-gray-900">{enq.laycan}</p>
                          </div>
                        </div>

                        {enq.offers > 0 && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                            <Ship className="w-4 h-4" />
                            {enq.offers} vessel{enq.offers > 1 ? 's' : ''} matched
                          </div>
                        )}
                      </div>

                      <button className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vessel Matches Tab */}
          {selectedTab === 'matches' && (
            <div className="p-6">
              <div className="space-y-4">
                {vesselMatches.map((vessel) => (
                  <div
                    key={vessel.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Ship className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900">{vessel.name}</h3>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {vessel.score}% Match
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Type/DWT</p>
                            <p className="font-medium text-gray-900">
                              {vessel.type} / {vessel.dwt.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">ETA Load Port</p>
                            <p className="font-medium text-gray-900">{vessel.eta}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Freight Rate</p>
                            <p className="font-medium text-gray-900">${vessel.freightRate}/MT</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Recommendation</p>
                            <p className="font-medium text-green-600">{vessel.recommendation}</p>
                          </div>
                        </div>
                      </div>

                      <button className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                        Request Quote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartererPortal;
