/**
 * Chartering Desk - Complete UI
 * Phase 3 Frontend Implementation
 * Feb 1, 2026
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { VesselQuickView } from '../components/VesselQuickView';

// GraphQL Queries
const GET_CHARTERS = gql`
  query GetCharters {
    charters {
      id
      reference
      type
      status
      vesselId
      chartererId
      brokerId
      laycanStart
      laycanEnd
      freightRate
      freightUnit
      currency
      notes
      createdAt
    }
  }
`;

const CALCULATE_TCE = gql`
  mutation CalculateTCE($input: TCECalculationInput!) {
    calculateTCE(input: $input) {
      tce
      breakdown {
        revenue
        costs
        netEarnings
      }
    }
  }
`;

const SEARCH_CLAUSES = gql`
  query SearchClauses($search: String) {
    clauses(search: $search) {
      id
      code
      title
      body
      category
      source
    }
  }
`;

const CREATE_CHARTER = gql`
  mutation CreateCharter($input: CharterInput!) {
    createCharter(input: $input) {
      id
      type
      status
    }
  }
`;

export default function CharteringDesk() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tce' | 'clauses' | 'create'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const [tceInput, setTceInput] = useState({
    freightRate: 20000,
    bunkerCost: 500,
    portCosts: 5000,
    voyageDays: 30,
    cargoQuantity: 50000
  });
  const [clauseSearch, setClauseSearch] = useState('');

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: chartersData, loading: chartersLoading } = useQuery(GET_CHARTERS);
  const [calculateTCE, { data: tceData, loading: tceLoading }] = useMutation(CALCULATE_TCE);
  const { data: clausesData, loading: clausesLoading } = useQuery(SEARCH_CLAUSES, {
    variables: { search: clauseSearch || undefined },
    skip: !clauseSearch
  });

  const handleTCECalculate = () => {
    calculateTCE({ variables: { input: tceInput } });
  };

  // Filter charters based on debounced search term
  const filteredCharters = React.useMemo(() => {
    if (!chartersData?.charters) return [];
    if (!debouncedSearchTerm.trim()) return chartersData.charters;

    const search = debouncedSearchTerm.toLowerCase();
    return chartersData.charters.filter((charter: any) => {
      return (
        charter.reference?.toLowerCase().includes(search) ||
        charter.type?.toLowerCase().includes(search) ||
        charter.status?.toLowerCase().includes(search) ||
        charter.notes?.toLowerCase().includes(search) ||
        charter.id?.toLowerCase().includes(search)
      );
    });
  }, [chartersData, debouncedSearchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          ⚓ Chartering Desk
        </h1>
        <p className="text-gray-600">
          Manage charter parties, calculate TCE, and search clauses
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Charter Overview', icon: '📋' },
            { id: 'tce', label: 'TCE Calculator', icon: '💰' },
            { id: 'clauses', label: 'Clause Library', icon: '📖' },
            { id: 'create', label: 'Create Charter', icon: '➕' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Active Charters</h2>

              {/* Search Input */}
              <div className="relative w-96">
                <input
                  type="text"
                  placeholder="Search charters by reference, type, status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Results count */}
            {debouncedSearchTerm && (
              <div className="mb-4 text-sm text-gray-600">
                Found {filteredCharters.length} charter{filteredCharters.length !== 1 ? 's' : ''} matching "{debouncedSearchTerm}"
              </div>
            )}

            {chartersLoading ? (
              <div className="text-center py-12">Loading charters...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Laycan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Freight Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCharters.length > 0 ? (
                      filteredCharters.map((charter: any) => (
                        <tr key={charter.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {charter.reference || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {charter.id.substring(0, 8)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {charter.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {charter.laycanStart ? new Date(charter.laycanStart).toLocaleDateString() : 'N/A'}
                            {' → '}
                            {charter.laycanEnd ? new Date(charter.laycanEnd).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {charter.currency} {charter.freightRate?.toLocaleString() || '0'}
                            <br />
                            <span className="text-xs text-gray-400">
                              {charter.freightUnit || 'per day'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${charter.status === 'fixed' ? 'bg-green-100 text-green-800' :
                                charter.status === 'on_subs' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'}`}>
                              {charter.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(charter.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {charter.vesselId ? (
                              <button
                                onClick={() => setSelectedVesselId(charter.vesselId)}
                                className="text-blue-600 hover:text-blue-900 font-medium flex items-center gap-1"
                                title="View vessel details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Vessel
                              </button>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          {debouncedSearchTerm
                            ? `No charters found matching "${debouncedSearchTerm}". Try a different search term.`
                            : 'No charters found. Create your first charter to get started.'
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TCE Calculator Tab */}
        {activeTab === 'tce' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">TCE Calculator</h2>
            <p className="text-gray-600 mb-6">Calculate Time Charter Equivalent for voyage comparison</p>

            <div className="grid grid-cols-2 gap-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Freight Rate (USD/day)
                </label>
                <input
                  type="number"
                  value={tceInput.freightRate}
                  onChange={(e) => setTceInput({ ...tceInput, freightRate: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bunker Cost (USD/MT)
                </label>
                <input
                  type="number"
                  value={tceInput.bunkerCost}
                  onChange={(e) => setTceInput({ ...tceInput, bunkerCost: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port Costs (USD)
                </label>
                <input
                  type="number"
                  value={tceInput.portCosts}
                  onChange={(e) => setTceInput({ ...tceInput, portCosts: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voyage Days
                </label>
                <input
                  type="number"
                  value={tceInput.voyageDays}
                  onChange={(e) => setTceInput({ ...tceInput, voyageDays: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo Quantity (MT)
                </label>
                <input
                  type="number"
                  value={tceInput.cargoQuantity}
                  onChange={(e) => setTceInput({ ...tceInput, cargoQuantity: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="col-span-2">
                <button
                  onClick={handleTCECalculate}
                  disabled={tceLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {tceLoading ? 'Calculating...' : 'Calculate TCE'}
                </button>
              </div>
            </div>

            {/* TCE Results */}
            {tceData && (
              <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-xl font-semibold text-green-900 mb-4">
                  TCE Result: ${tceData.calculateTCE.tce.toLocaleString()}/day
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Revenue</div>
                    <div className="text-lg font-medium text-gray-900">
                      ${tceData.calculateTCE.breakdown.revenue.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Costs</div>
                    <div className="text-lg font-medium text-gray-900">
                      ${tceData.calculateTCE.breakdown.costs.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Net Earnings</div>
                    <div className="text-lg font-medium text-green-700">
                      ${tceData.calculateTCE.breakdown.netEarnings.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clauses Library Tab */}
        {activeTab === 'clauses' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Charter Party Clause Library</h2>
            <p className="text-gray-600 mb-6">Search for standard charter party clauses</p>

            <div className="mb-6">
              <input
                type="text"
                value={clauseSearch}
                onChange={(e) => setClauseSearch(e.target.value)}
                placeholder="Search clauses... (e.g., 'demurrage', 'laytime', 'off-hire')"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {clausesLoading ? (
              <div className="text-center py-12">Searching clauses...</div>
            ) : clausesData?.clauses?.length > 0 ? (
              <div className="space-y-4">
                {clausesData.clauses.map((clause: any) => (
                  <div key={clause.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {clause.code || 'N/A'}
                        </span>
                        {clause.category && (
                          <span className="ml-2 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {clause.category}
                          </span>
                        )}
                        {clause.source && (
                          <span className="ml-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                            {clause.source}
                          </span>
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 mt-2">{clause.title}</h3>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{clause.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {clauseSearch ? 'No clauses found. Try a different search term.' : 'Enter a search term to find clauses'}
              </div>
            )}
          </div>
        )}

        {/* Create Charter Tab */}
        {activeTab === 'create' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Create New Charter</h2>
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-4">Charter creation form coming soon...</p>
              <p className="text-sm">
                This will include vessel selection, laycan dates, cargo details, and freight terms.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Vessel Quick View Modal */}
      <VesselQuickView
        vesselId={selectedVesselId}
        onClose={() => setSelectedVesselId(null)}
      />
    </div>
  );
}
