/**
 * Agent Dashboard - Pre-Arrival Intelligence Center
 *
 * The main dashboard for port agents showing all incoming vessels
 * with complete intelligence (ETA, documents, DA costs, congestion).
 *
 * Features:
 * - Arriving Soon (next 48h) with urgent alerts
 * - In Port (working) with progress
 * - All Active Arrivals with filters
 * - Real-time updates via GraphQL subscriptions
 */

import React, { useState, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Clock, Ship, AlertCircle, CheckCircle, FileText, DollarSign, Anchor, MessageCircle } from 'lucide-react';
import { ArrivalFilters as FilterType, applyFilters } from '../components/ArrivalFilters';
import MobileFilters from '../components/MobileFilters';
import ResponsiveExport from '../components/ResponsiveExport';

// GraphQL Queries
const ARRIVALS_ARRIVING_SOON = gql`
  query ArrivalsArrivingSoon {
    arrivalsArrivingSoon {
      arrivalId
      vessel {
        id
        name
        imo
        type
      }
      port {
        id
        name
        unlocode
      }
      distance
      eta
      etaConfidence
      status
      intelligence
      urgentActions
    }
  }
`;

const ARRIVALS_IN_PORT = gql`
  query ArrivalsInPort {
    arrivalsInPort {
      arrivalId
      vessel {
        id
        name
        imo
        type
      }
      port {
        id
        name
        unlocode
      }
      status
      intelligence
      urgentActions
    }
  }
`;

const ACTIVE_ARRIVALS = gql`
  query ActiveArrivals($filters: ActiveArrivalsFilterInput) {
    activeArrivals(filters: $filters) {
      arrivalId
      vessel {
        id
        name
        imo
        type
      }
      port {
        id
        name
        unlocode
      }
      distance
      eta
      etaConfidence
      status
      intelligence
      urgentActions
    }
  }
`;

const PENDING_MASTER_REPLIES = gql`
  query PendingMasterReplies {
    pendingMasterReplies {
      id
      arrivalId
      vesselId
      title
      reply
      replyParsed {
        intent
        confidence
      }
      repliedAt
      arrival {
        vesselId
        vessel {
          name
        }
        port {
          name
        }
      }
    }
  }
`;

// Helper functions
const formatHoursRemaining = (eta: string): string => {
  const now = new Date();
  const etaDate = new Date(eta);
  const hoursRemaining = (etaDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursRemaining < 1) {
    return `${Math.round(hoursRemaining * 60)}m`;
  } else if (hoursRemaining < 24) {
    return `${Math.round(hoursRemaining)}h`;
  } else {
    const days = Math.floor(hoursRemaining / 24);
    const hours = Math.round(hoursRemaining % 24);
    return `${days}d ${hours}h`;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'APPROACHING': return 'text-blue-600 bg-blue-100';
    case 'IN_ANCHORAGE': return 'text-yellow-600 bg-yellow-100';
    case 'BERTHING': return 'text-purple-600 bg-purple-100';
    case 'IN_PORT': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getUrgencyColor = (urgentActions: number): string => {
  if (urgentActions === 0) return 'text-green-600';
  if (urgentActions <= 3) return 'text-yellow-600';
  return 'text-red-600';
};

const getCongestionBadge = (status: string): React.ReactNode => {
  switch (status) {
    case 'GREEN':
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">🟢 Clear</span>;
    case 'YELLOW':
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">🟡 Moderate</span>;
    case 'RED':
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">🔴 Congested</span>;
    default:
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">⚪ Unknown</span>;
  }
};

// Arrival Card Component
const ArrivalCard: React.FC<{ arrival: any; onClick: () => void }> = ({ arrival, onClick }) => {
  const intelligence = arrival.intelligence;
  const hoursRemaining = formatHoursRemaining(arrival.eta);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Ship className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">{arrival.vessel.name}</h3>
              {arrival.vessel.imo && (
                <span className="text-sm text-gray-500">IMO: {arrival.vessel.imo}</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
              <Anchor className="w-4 h-4" />
              <span>{arrival.port.name} ({arrival.port.unlocode})</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(arrival.status)}`}>
              {arrival.status}
            </span>
            {arrival.distance && (
              <span className="text-sm text-gray-500">{Math.round(arrival.distance)} NM</span>
            )}
          </div>
        </div>
      </div>

      {/* Intelligence Summary */}
      <div className="p-4 space-y-3">
        {/* ETA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">ETA: {new Date(arrival.eta).toLocaleString()}</span>
          </div>
          <span className="text-sm font-medium text-blue-600">{hoursRemaining}</span>
        </div>

        {/* Urgent Actions */}
        {arrival.urgentActions > 0 && (
          <div className={`flex items-center gap-2 ${getUrgencyColor(arrival.urgentActions)}`}>
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {arrival.urgentActions} urgent action{arrival.urgentActions > 1 ? 's' : ''} needed
            </span>
          </div>
        )}

        {/* Intelligence Grid */}
        {intelligence && (
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            {/* Documents */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <FileText className="w-4 h-4 text-gray-500" />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {intelligence.complianceScore}%
              </div>
              <div className="text-xs text-gray-500">Compliance</div>
              <div className="text-xs text-gray-600 mt-0.5">
                {intelligence.documentsMissing} missing
              </div>
            </div>

            {/* DA Estimate */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="w-4 h-4 text-gray-500" />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                ${(intelligence.daEstimate / 1000).toFixed(1)}K
              </div>
              <div className="text-xs text-gray-500">DA Estimate</div>
            </div>

            {/* Congestion */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                {getCongestionBadge(intelligence.congestionStatus)}
              </div>
              <div className="text-xs text-gray-500">Port Status</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View Details →
        </button>
        {arrival.urgentActions === 0 && intelligence?.complianceScore === 100 && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Ready</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState<'arriving' | 'inport' | 'all'>('arriving');
  const [filters, setFilters] = useState<FilterType>({
    search: '',
    status: ['APPROACHING'],
    etaRange: 'next48h'
  });

  const { data: arrivingSoon, loading: loadingArriving } = useQuery(ARRIVALS_ARRIVING_SOON, {
    pollInterval: 30000 // Refresh every 30 seconds
  });

  const { data: inPort, loading: loadingInPort } = useQuery(ARRIVALS_IN_PORT, {
    pollInterval: 60000 // Refresh every minute
  });

  const { data: allActive, loading: loadingAll } = useQuery(ACTIVE_ARRIVALS, {
    pollInterval: 60000
  });

  const { data: pendingReplies } = useQuery(PENDING_MASTER_REPLIES, {
    pollInterval: 15000 // Check every 15 seconds for new replies
  });

  // Apply filters to arrivals
  const filteredArrivingSoon = useMemo(() => {
    if (!arrivingSoon?.arrivalsArrivingSoon) return [];
    return applyFilters(arrivingSoon.arrivalsArrivingSoon, filters);
  }, [arrivingSoon, filters]);

  const filteredInPort = useMemo(() => {
    if (!inPort?.arrivalsInPort) return [];
    return applyFilters(inPort.arrivalsInPort, filters);
  }, [inPort, filters]);

  const filteredAllActive = useMemo(() => {
    if (!allActive?.activeArrivals) return [];
    return applyFilters(allActive.activeArrivals, filters);
  }, [allActive, filters]);

  const handleViewArrival = (arrivalId: string) => {
    // Navigate to detailed view (to be implemented)
    console.log('View arrival:', arrivalId);
    window.location.href = `/agent/arrivals/${arrivalId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Pre-arrival intelligence for all incoming vessels
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ResponsiveExport
                arrivals={activeTab === 'arriving' ? filteredArrivingSoon : activeTab === 'inport' ? filteredInPort : filteredAllActive}
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation">
                + Add Manual Arrival
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Master Replies Notification */}
      {pendingReplies?.pendingMasterReplies && pendingReplies.pendingMasterReplies.length > 0 && (
        <div className="bg-orange-50 border-b border-orange-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-medium text-orange-900">
                    {pendingReplies.pendingMasterReplies.length} Master {pendingReplies.pendingMasterReplies.length === 1 ? 'Reply' : 'Replies'} Requiring Action
                  </div>
                  <div className="text-sm text-orange-700">
                    {pendingReplies.pendingMasterReplies.slice(0, 3).map((reply: any, idx: number) => (
                      <span key={reply.id}>
                        {reply.arrival.vessel.name}
                        {idx < Math.min(2, pendingReplies.pendingMasterReplies.length - 1) && ', '}
                      </span>
                    ))}
                    {pendingReplies.pendingMasterReplies.length > 3 && ` and ${pendingReplies.pendingMasterReplies.length - 3} more`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  // Navigate to first pending arrival
                  const firstReply = pendingReplies.pendingMasterReplies[0];
                  if (firstReply?.arrivalId) {
                    window.location.href = `/agent/arrivals/${firstReply.arrivalId}`;
                  }
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                Review Replies
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('arriving')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'arriving'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Arriving Soon (48h)
              {arrivingSoon?.arrivalsArrivingSoon && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-blue-100 text-blue-800">
                  {arrivingSoon.arrivalsArrivingSoon.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('inport')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inport'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              In Port
              {inPort?.arrivalsInPort && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-green-100 text-green-800">
                  {inPort.arrivalsInPort.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Active
              {allActive?.activeArrivals && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-800">
                  {allActive.activeArrivals.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6">
          <MobileFilters
            filters={filters}
            onChange={setFilters}
            resultCount={
              activeTab === 'arriving' ? filteredArrivingSoon.length :
              activeTab === 'inport' ? filteredInPort.length :
              filteredAllActive.length
            }
          />
        </div>

        {/* Arriving Soon Tab */}
        {activeTab === 'arriving' && (
          <div>
            {loadingArriving ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading arrivals...</p>
              </div>
            ) : filteredArrivingSoon.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArrivingSoon.map((arrival: any) => (
                  <ArrivalCard
                    key={arrival.arrivalId}
                    arrival={arrival}
                    onClick={() => handleViewArrival(arrival.arrivalId)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Ship className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No arrivals in next 48 hours</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Vessels will appear here when they enter 200 NM radius
                </p>
              </div>
            )}
          </div>
        )}

        {/* In Port Tab */}
        {activeTab === 'inport' && (
          <div>
            {loadingInPort ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading vessels in port...</p>
              </div>
            ) : filteredInPort.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInPort.map((arrival: any) => (
                  <ArrivalCard
                    key={arrival.arrivalId}
                    arrival={arrival}
                    onClick={() => handleViewArrival(arrival.arrivalId)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Anchor className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No vessels in port</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Active port calls will appear here
                </p>
              </div>
            )}
          </div>
        )}

        {/* All Active Tab */}
        {activeTab === 'all' && (
          <div>
            {loadingAll ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading all active arrivals...</p>
              </div>
            ) : filteredAllActive.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAllActive.map((arrival: any) => (
                  <ArrivalCard
                    key={arrival.arrivalId}
                    arrival={arrival}
                    onClick={() => handleViewArrival(arrival.arrivalId)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Ship className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No active arrivals</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Active vessel arrivals will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
