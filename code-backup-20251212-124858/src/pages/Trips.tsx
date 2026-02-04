/**
 * Trips Page - With Action Buttons
 * Start Trip, Complete Trip, Cancel Trip
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import { StatsFilter, FilterIndicator } from '../components/StatsFilter';
import { 
  Play, Square, CheckCircle, X, Loader2, AlertCircle, 
  ChevronDown, Truck, User, MapPin, Clock, Package
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// GraphQL Queries & Mutations
// ═══════════════════════════════════════════════════════════════════════════

const GET_TRIPS = gql`
  query GetTrips {
    trips {
      id
      tripNumber
      status
      startLocation
      endLocation
      plannedDistance
      actualDistance
      plannedStart
      actualStart
      plannedEnd
      actualEnd
      vehicle { 
        id
        vehicleNumber 
        vehicleType
      }
      driver { 
        id
        name 
        phone
      }
      order { 
        id
        orderNumber 
        customer { companyName }
        quotedAmount
      }
    }
  }
`;

const START_TRIP = gql`
  mutation StartTrip($id: ID!) {
    startTrip(id: $id) {
      id
      status
      actualStart
    }
  }
`;

const COMPLETE_TRIP = gql`
  mutation CompleteTrip($id: ID!) {
    completeTrip(id: $id) {
      id
      status
      actualEnd
    }
  }
`;

const CANCEL_TRIP = gql`
  mutation CancelTrip($id: ID!, $reason: String!) {
    cancelTrip(id: $id, reason: $reason) {
      id
      status
    }
  }
`;

const HOLD_TRIP = gql`
  mutation HoldTrip($id: ID!, $input: TripUpdateInput!) {
    updateTrip(id: $id, input: $input) {
      id
      status
    }
  }
`;

const RESUME_TRIP = gql`
  mutation ResumeTrip($id: ID!, $input: TripUpdateInput!) {
    updateTrip(id: $id, input: $input) {
      id
      status
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// Status Configuration
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<string, { 
  color: string; 
  bg: string; 
  icon: string;
  actions: string[];
}> = {
  PLANNED: { 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/20', 
    icon: '📅',
    actions: ['start', 'cancel']
  },
  DISPATCHED: { 
    color: 'text-indigo-400', 
    bg: 'bg-indigo-500/20', 
    icon: '🚛',
    actions: ['start', 'hold', 'cancel']
  },
  IN_PROGRESS: { 
    color: 'text-purple-400', 
    bg: 'bg-purple-500/20', 
    icon: '🚚',
    actions: ['complete', 'hold', 'cancel']
  },
  ON_HOLD: { 
    color: 'text-orange-400', 
    bg: 'bg-orange-500/20', 
    icon: '⏸️',
    actions: ['resume', 'cancel']
  },
  COMPLETED: { 
    color: 'text-green-400', 
    bg: 'bg-green-500/20', 
    icon: '✅',
    actions: []
  },
  CANCELLED: { 
    color: 'text-red-400', 
    bg: 'bg-red-500/20', 
    icon: '❌',
    actions: []
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface Trip {
  id: string;
  tripNumber: string;
  status: string;
  startLocation: string;
  endLocation: string;
  plannedDistance?: number;
  actualDistance?: number;
  plannedStart?: string;
  actualStart?: string;
  plannedEnd?: string;
  actualEnd?: string;
  vehicle?: { id: string; vehicleNumber: string; vehicleType: string };
  driver?: { id: string; name: string; phone: string };
  order?: { id: string; orderNumber: string; customer?: { companyName: string }; quotedAmount?: number };
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export default function Trips() {
  const { theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Theme colors
  const titleColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const subtitleColor = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const cardBg = theme === 'light' ? 'bg-gray-100' : 'bg-gray-800';
  const dropdownBg = theme === 'light' ? 'bg-white' : 'bg-gray-700';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-gray-700';

  // Queries & Mutations
  const { data, loading, error, refetch } = useQuery(GET_TRIPS);

  const [startTrip, { loading: starting }] = useMutation(START_TRIP, {
    onCompleted: (data) => { 
      showNotification('success', `Trip started at ${new Date().toLocaleTimeString()}`); 
      refetch(); 
    },
    onError: (err) => showNotification('error', err.message),
  });

  const [completeTrip, { loading: completing }] = useMutation(COMPLETE_TRIP, {
    onCompleted: () => { 
      showNotification('success', 'Trip completed successfully!'); 
      refetch(); 
    },
    onError: (err) => showNotification('error', err.message),
  });

  const [cancelTrip, { loading: cancelling }] = useMutation(CANCEL_TRIP, {
    onCompleted: () => { 
      showNotification('success', 'Trip cancelled'); 
      refetch(); 
    },
    onError: (err) => showNotification('error', err.message),
  });

  const [holdTrip, { loading: holding }] = useMutation(HOLD_TRIP, {
    onCompleted: () => { 
      showNotification('success', 'Trip placed on hold'); 
      refetch(); 
    },
    onError: (err) => showNotification('error', err.message),
  });

  const [resumeTrip, { loading: resuming }] = useMutation(RESUME_TRIP, {
    onCompleted: () => { 
      showNotification('success', 'Trip resumed'); 
      refetch(); 
    },
    onError: (err) => showNotification('error', err.message),
  });

  const isLoading = starting || completing || cancelling || holding || resuming;

  // Notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Sync URL with filter
  useEffect(() => {
    if (filter === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', filter);
    }
    setSearchParams(searchParams);
  }, [filter]);

  const trips = data?.trips || [];

  // Calculate stats
  const planned = trips.filter((t: Trip) => t.status === 'PLANNED').length;
  const dispatched = trips.filter((t: Trip) => t.status === 'DISPATCHED').length;
  const inProgress = trips.filter((t: Trip) => t.status === 'IN_PROGRESS').length;
  const onHold = trips.filter((t: Trip) => t.status === 'ON_HOLD').length;
  const completed = trips.filter((t: Trip) => t.status === 'COMPLETED').length;
  const cancelled = trips.filter((t: Trip) => t.status === 'CANCELLED').length;

  const stats = [
    { id: 'all', label: 'All Trips', value: trips.length, color: 'gray' as const, icon: '🛣️' },
    { id: 'PLANNED', label: 'Planned', value: planned, color: 'blue' as const, icon: '📅' },
    { id: 'IN_PROGRESS', label: 'In Progress', value: inProgress, color: 'purple' as const, icon: '🚚' },
    { id: 'ON_HOLD', label: 'On Hold', value: onHold, color: 'orange' as const, icon: '⏸️' },
    { id: 'COMPLETED', label: 'Completed', value: completed, color: 'green' as const, icon: '✅' },
  ];

  // Filter trips
  const filteredTrips = filter === 'all'
    ? trips
    : trips.filter((t: Trip) => t.status === filter);

  // ─────────────────────────────────────────────────────────────────────────
  // Action Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleAction = (action: string, trip: Trip) => {
    setActiveDropdown(null);
    
    switch (action) {
      case 'start':
        startTrip({ variables: { id: trip.id } });
        break;
      case 'complete':
        completeTrip({ variables: { id: trip.id } });
        break;
      case 'hold':
        holdTrip({ variables: { id: trip.id, input: { status: 'ON_HOLD' } } });
        break;
      case 'resume':
        resumeTrip({ variables: { id: trip.id, input: { status: 'IN_PROGRESS' } } });
        break;
      case 'cancel':
        if (confirm(`Cancel trip ${trip.tripNumber}?`)) {
          cancelTrip({ variables: { id: trip.id, reason: 'Cancelled by dispatcher' } });
        }
        break;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render Actions
  // ─────────────────────────────────────────────────────────────────────────

  const renderActions = (trip: Trip) => {
    const config = STATUS_CONFIG[trip.status] || { actions: [] };
    
    if (config.actions.length === 0) {
      return <span className="text-gray-500 text-xs">—</span>;
    }

    const actionLabels: Record<string, { label: string; icon: any; color: string }> = {
      start: { label: '▶️ Start Trip', icon: Play, color: 'text-green-400 hover:bg-green-500/20' },
      complete: { label: '✅ Complete', icon: CheckCircle, color: 'text-blue-400 hover:bg-blue-500/20' },
      hold: { label: '⏸️ Hold', icon: Square, color: 'text-orange-400 hover:bg-orange-500/20' },
      resume: { label: '▶️ Resume', icon: Play, color: 'text-green-400 hover:bg-green-500/20' },
      cancel: { label: '❌ Cancel', icon: X, color: 'text-red-400 hover:bg-red-500/20' },
    };

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(activeDropdown === trip.id ? null : trip.id);
          }}
          disabled={isLoading}
          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition
            ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-gray-600 hover:bg-gray-500 text-white'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Actions'}
          <ChevronDown className="w-3 h-3" />
        </button>

        {activeDropdown === trip.id && (
          <div className={`absolute right-0 mt-1 w-40 rounded-lg shadow-lg z-50 py-1 ${dropdownBg} border ${borderColor}`}>
            {config.actions.map((action) => {
              const actionConfig = actionLabels[action];
              if (!actionConfig) return null;
              const Icon = actionConfig.icon;
              
              return (
                <button
                  key={action}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(action, trip);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${actionConfig.color} transition`}
                >
                  <Icon className="w-4 h-4" />
                  {actionConfig.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Format time
  // ─────────────────────────────────────────────────────────────────────────

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className={`ml-2 ${subtitleColor}`}>Loading trips...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-400">
        <AlertCircle className="w-6 h-6 mr-2" />
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white max-w-md`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className={`${cardBg} rounded-xl p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${titleColor}`}>🛣️ Trips</h1>
            <p className={subtitleColor}>
              {filteredTrips.length} trips shown
              <FilterIndicator filter={filter} label={filter} onClear={() => setFilter('all')} theme={theme} />
            {/* Workflow Guide */}
            <div className="flex items-center gap-1 mt-2 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">PLANNED</span>
              <span className="text-gray-500">→</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">IN_PROGRESS</span>
              <span className="text-gray-500">→</span>
              <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">ON_HOLD</span>
              <span className="text-gray-500">→</span>
              <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">COMPLETED</span>
            </div>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Filter */}
      <StatsFilter stats={stats} activeFilter={filter} onFilterChange={setFilter} theme={theme} columns={5} />

      {/* Trips Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTrips.map((trip: Trip) => {
          const statusConfig = STATUS_CONFIG[trip.status] || { color: 'text-gray-400', bg: 'bg-gray-500/20', icon: '?' };
          
          return (
            <div 
              key={trip.id} 
              className={`${cardBg} rounded-xl p-4 hover:ring-2 hover:ring-orange-500/50 transition`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{statusConfig.icon}</span>
                  <h3 className={`font-semibold ${titleColor}`}>{trip.tripNumber}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                    {trip.status.replace('_', ' ')}
                  </span>
                  {renderActions(trip)}
                </div>
              </div>

              {/* Route */}
              <div className={`flex items-center gap-2 mb-3 ${subtitleColor}`}>
                <MapPin className="w-4 h-4 text-orange-400" />
                <span className="text-sm">{trip.startLocation}</span>
                <span className="text-orange-400">→</span>
                <span className="text-sm">{trip.endLocation}</span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {/* Driver */}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className={subtitleColor}>Driver: </span>
                    <span className={titleColor}>{trip.driver?.name || '-'}</span>
                  </div>
                </div>

                {/* Vehicle */}
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-green-400" />
                  <div>
                    <span className={subtitleColor}>Vehicle: </span>
                    <span className={titleColor}>{trip.vehicle?.vehicleNumber || '-'}</span>
                  </div>
                </div>

                {/* Order */}
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className={subtitleColor}>Order: </span>
                    <span className={`${titleColor} font-mono text-xs`}>{trip.order?.orderNumber || '-'}</span>
                  </div>
                </div>

                {/* Customer */}
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">🏢</span>
                  <div>
                    <span className={subtitleColor}>Customer: </span>
                    <span className={titleColor}>{trip.order?.customer?.companyName || '-'}</span>
                  </div>
                </div>

                {/* Start Time */}
                {trip.actualStart && (
                  <div className="flex items-center gap-2 col-span-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className={subtitleColor}>Started: </span>
                      <span className={titleColor}>{formatTime(trip.actualStart)}</span>
                    </div>
                  </div>
                )}

                {/* End Time */}
                {trip.actualEnd && (
                  <div className="flex items-center gap-2 col-span-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <div>
                      <span className={subtitleColor}>Completed: </span>
                      <span className={titleColor}>{formatTime(trip.actualEnd)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount */}
              {trip.order?.quotedAmount && (
                <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-between items-center">
                  <span className={subtitleColor}>Order Value:</span>
                  <span className={`${titleColor} font-semibold`}>₹{trip.order.quotedAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          );
        })}

        {filteredTrips.length === 0 && (
          <div className={`col-span-2 text-center py-12 ${subtitleColor}`}>
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No trips found {filter !== 'all' && `with status "${filter}"`}</p>
          </div>
        )}
      </div>
    </div>
  );
}
