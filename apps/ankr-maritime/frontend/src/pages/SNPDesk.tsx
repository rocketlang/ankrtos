/**
 * S&P Desk - Complete UI
 * Phase 9 Frontend Implementation
 * Feb 1, 2026
 */

import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { VesselQuickView } from '../components/VesselQuickView';

// GraphQL Queries
const GET_SNP_OFFERS = gql`
  query GetSNPOffers {
    snpOffers {
      id
      status
      amount
      currency
      offerType
      expiresAt
      saleListing {
        id
        vessel {
          id
          name
          imo
          type
          dwt
          yearBuilt
        }
      }
      buyerOrg {
        id
        name
      }
      sellerOrg {
        id
        name
      }
      createdAt
    }
  }
`;

const GET_SALE_LISTINGS = gql`
  query GetSaleListings {
    saleListings {
      id
      status
      askingPrice
      currency
      condition
      vessel {
        id
        name
        imo
        type
        dwt
        yearBuilt
      }
      sellerOrg {
        id
        name
      }
      publishedAt
      createdAt
    }
  }
`;

const GET_SNP_COMMISSIONS = gql`
  query GetSNPCommissions {
    snpCommissions {
      id
      commissionRate
      commissionAmount
      currency
      status
      partyType
      organization {
        id
        name
      }
      transaction {
        id
        vessel {
          id
          name
        }
      }
      paidDate
      createdAt
    }
  }
`;

const GET_SNP_MARKET_STATS = gql`
  query GetSNPMarketStatistics($vesselType: String!) {
    snpMarketStatistics(vesselType: $vesselType) {
      averagePrice
      avgAge
      avgDwt
      totalSales
      priceRange {
        min
        max
      }
    }
  }
`;

const CALCULATE_VESSEL_VALUATION = gql`
  mutation CalculateVesselValuation($input: ValuationInput!) {
    calculateVesselValuation(input: $input) {
      estimatedValue
      scrapValue
      marketValue
      breakdown {
        baseValue
        ageDepreciation
        conditionFactor
        marketTrend
      }
    }
  }
`;

export default function SNPDesk() {
  const [activeTab, setActiveTab] = useState<'overview' | 'offers' | 'listings' | 'commissions' | 'valuation'>('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const [valuationInput, setValuationInput] = useState({
    type: 'BULK_CARRIER',
    dwt: 75000,
    yearBuilt: 2010,
    condition: 'GOOD'
  });

  const { data: offersData, loading: offersLoading } = useQuery(GET_SNP_OFFERS);
  const { data: listingsData, loading: listingsLoading } = useQuery(GET_SALE_LISTINGS);
  const { data: commissionsData, loading: commissionsLoading } = useQuery(GET_SNP_COMMISSIONS);
  const { data: marketStatsData, loading: marketStatsLoading } = useQuery(GET_SNP_MARKET_STATS);
  const [calculateValuation, { data: valuationData, loading: valuationLoading }] = useMutation(CALCULATE_VESSEL_VALUATION);

  const handleValuationCalculate = () => {
    calculateValuation({ variables: { input: valuationInput } });
  };

  // Pagination logic for Sale Listings
  const totalListings = listingsData?.saleListings?.length || 0;
  const totalPages = Math.ceil(totalListings / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedListings = listingsData?.saleListings?.slice(startIndex, endIndex) || [];

  // Reset to page 1 when changing items per page
  const handleItemsPerPageChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  // Page navigation
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🚢 S&P Desk
        </h1>
        <p className="text-gray-600">
          Sale & Purchase operations, vessel valuations, and market intelligence
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Market Overview', icon: '📊' },
            { id: 'offers', label: 'Active Offers', icon: '💼' },
            { id: 'listings', label: 'Sale Listings', icon: '📋' },
            { id: 'commissions', label: 'Commissions', icon: '💰' },
            { id: 'valuation', label: 'Valuation Tool', icon: '🔍' }
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
        {/* Market Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Market Statistics</h2>
            {marketStatsLoading ? (
              <div className="text-center py-12">Loading market data...</div>
            ) : marketStatsData?.snpMarketStatistics?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketStatsData.snpMarketStatistics.map((stat: any, index: number) => (
                  <div key={index} className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{stat.type}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Price:</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${stat.avgPrice?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Range:</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${stat.minPrice?.toLocaleString() || 'N/A'} - ${stat.maxPrice?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Transactions:</span>
                        <span className="text-sm font-medium text-blue-600">
                          {stat.transactionCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Period:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {stat.period || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No market statistics available
              </div>
            )}
          </div>
        )}

        {/* Active Offers Tab */}
        {activeTab === 'offers' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Active S&P Offers</h2>
            {offersLoading ? (
              <div className="text-center py-12">Loading offers...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vessel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DWT / Built</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {offersData?.snpOffers?.length > 0 ? (
                      offersData.snpOffers.map((offer: any) => (
                        <tr key={offer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {offer.saleListing?.vessel?.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              IMO: {offer.saleListing?.vessel?.imo || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {offer.saleListing?.vessel?.type || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {offer.saleListing?.vessel?.dwt?.toLocaleString() || 'N/A'} DWT
                            <br />
                            <span className="text-xs text-gray-400">
                              Built: {offer.saleListing?.vessel?.yearBuilt || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {offer.buyerOrg?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {offer.sellerOrg?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {offer.currency} {offer.amount?.toLocaleString() || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'}`}>
                              {offer.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          No active offers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sale Listings Tab */}
        {activeTab === 'listings' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Vessel Sale Listings</h2>

              {/* Page Size Selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalListings)} of {totalListings} listings
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>

            {listingsLoading ? (
              <div className="text-center py-12">Loading listings...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedListings.length > 0 ? (
                    paginatedListings.map((listing: any) => (
                    <div key={listing.id} className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                            onClick={() => listing.vessel?.id && setSelectedVesselId(listing.vessel.id)}
                            title="Click to view vessel details"
                          >
                            {listing.vessel?.name || 'N/A'}
                          </h3>
                          <p className="text-sm text-gray-500">IMO: {listing.vessel?.imo || 'N/A'}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full
                          ${listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {listing.status}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">{listing.vessel?.type || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">DWT:</span>
                          <span className="font-medium">{listing.vessel?.dwt?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Built:</span>
                          <span className="font-medium">{listing.vessel?.yearBuilt || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Condition:</span>
                          <span className="font-medium text-blue-600">{listing.condition || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Asking Price</p>
                            <p className="text-xl font-bold text-blue-600">
                              {listing.currency} {listing.askingPrice?.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12 text-gray-500">
                      No sale listings available
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                    {/* Previous Button */}
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
                        ${currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      ← Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
                                ${page === currentPage
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return <span key={page} className="text-gray-400">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
                        ${currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Commissions Tab */}
        {activeTab === 'commissions' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">S&P Commissions</h2>
            {commissionsLoading ? (
              <div className="text-center py-12">Loading commissions...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vessel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Broker</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissionsData?.snpCommissions?.length > 0 ? (
                      commissionsData.snpCommissions.map((commission: any) => (
                        <tr key={commission.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {commission.transaction?.vessel?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {commission.organization?.name || 'N/A'}
                            <br />
                            <span className="text-xs text-gray-400">{commission.partyType}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {commission.commissionRate}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {commission.currency} {commission.commissionAmount?.toLocaleString() || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${commission.status === 'paid' ? 'bg-green-100 text-green-800' :
                                commission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'}`}>
                              {commission.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {commission.paidDate ? new Date(commission.paidDate).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No commission records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Valuation Tool Tab */}
        {activeTab === 'valuation' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Vessel Valuation Calculator</h2>
            <p className="text-gray-600 mb-6">Get instant vessel valuations based on market data</p>

            <div className="grid grid-cols-2 gap-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vessel Type
                </label>
                <select
                  value={valuationInput.type}
                  onChange={(e) => setValuationInput({ ...valuationInput, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="BULK_CARRIER">Bulk Carrier</option>
                  <option value="TANKER">Tanker</option>
                  <option value="CONTAINER">Container</option>
                  <option value="GENERAL_CARGO">General Cargo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DWT (Deadweight Tonnage)
                </label>
                <input
                  type="number"
                  value={valuationInput.dwt}
                  onChange={(e) => setValuationInput({ ...valuationInput, dwt: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Built Year
                </label>
                <input
                  type="number"
                  value={valuationInput.yearBuilt}
                  onChange={(e) => setValuationInput({ ...valuationInput, yearBuilt: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  value={valuationInput.condition}
                  onChange={(e) => setValuationInput({ ...valuationInput, condition: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>

              <div className="col-span-2">
                <button
                  onClick={handleValuationCalculate}
                  disabled={valuationLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {valuationLoading ? 'Calculating...' : 'Calculate Valuation'}
                </button>
              </div>
            </div>

            {/* Valuation Results */}
            {valuationData && (
              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">
                  Estimated Market Value: ${valuationData.calculateVesselValuation.marketValue?.toLocaleString() || 'N/A'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Base Value</div>
                    <div className="text-lg font-medium text-gray-900">
                      ${valuationData.calculateVesselValuation.breakdown?.baseValue?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Scrap Value</div>
                    <div className="text-lg font-medium text-gray-900">
                      ${valuationData.calculateVesselValuation.scrapValue?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Age Factor</div>
                    <div className="text-lg font-medium text-gray-900">
                      {valuationData.calculateVesselValuation.breakdown?.ageDepreciation || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Condition Factor</div>
                    <div className="text-lg font-medium text-blue-700">
                      {valuationData.calculateVesselValuation.breakdown?.conditionFactor || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
