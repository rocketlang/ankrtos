/**
 * Drivers Page - Fleet Management with Actions
 * Status: AVAILABLE → ON_TRIP → OFF_DUTY → ON_LEAVE
 * Integrates with DriverApp.tsx and DriverAppVoice.tsx
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StatsFilter, FilterIndicator } from '../components/StatsFilter';
import { 
  User, Phone, Truck, Calendar, Star, MapPin,
  ChevronDown, X, CheckCircle, AlertTriangle, 
  FileText, Clock, Shield, Navigation, Award, TrendingUp,
  Compass, Route, Volume2, Languages
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// ANKR-NAV Turn-by-Turn Integration
// Server: localhost:4001 (GraphQL) | FREE OSRM routing
// ═══════════════════════════════════════════════════════════════════════════

const ANKR_NAV_API = 'http://localhost:4001';

interface NavigationStep {
  instruction: string;
  instructionHi?: string;
  distance: number;
  duration: number;
  maneuver: string;
  roadName?: string;
}

interface RouteInfo {
  id: string;
  distance: number;
  duration: number;
  steps: NavigationStep[];
  summary: string;
  provider: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// GraphQL Queries & Mutations
// ═══════════════════════════════════════════════════════════════════════════

const GET_DRIVERS = gql`
  query GetDrivers {
    drivers {
      id
      name
      phone
      altPhone
      email
      licenseNumber
      licenseType
      licenseExpiry
      address
      city
      state
      status
      rating
      totalTrips
      totalKms
      vehicles {
        id
        vehicleNumber
        vehicleType
      }
      createdAt
    }
  }
`;

const GET_AVAILABLE_VEHICLES = gql`
  query GetAvailableVehicles {
    vehicles {
      id
      vehicleNumber
      vehicleType
      capacity
      capacityUnit
      status
    }
  }
`;

const UPDATE_DRIVER = gql`
  mutation UpdateDriver($id: ID!, $input: DriverUpdateInput!) {
    updateDriver(id: $id, input: $input) {
      id
      status
    }
  }
`;

const ASSIGN_VEHICLE_TO_DRIVER = gql`
  mutation AssignVehicleToDriver($driverId: ID!, $vehicleId: ID!) {
    assignVehicleToDriver(driverId: $driverId, vehicleId: $vehicleId) {
      id
      vehicles { id vehicleNumber }
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface Driver {
  id: string;
  name: string;
  phone: string;
  altPhone?: string;
  email?: string;
  licenseNumber: string;
  licenseType?: string;
  licenseExpiry?: string;
  address?: string;
  city?: string;
  state?: string;
  status: string;
  rating: number;
  totalTrips: number;
  totalKms: number;
  vehicles?: {
    id: string;
    vehicleNumber: string;
    vehicleType: string;
  }[];
  createdAt: string;
}

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  capacity: number;
  capacityUnit: string;
  status: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Status Configuration
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<string, { 
  color: string; 
  bg: string; 
  icon: string;
  actions: string[];
}> = {
  available: { 
    color: 'text-green-400', 
    bg: 'bg-green-500/20', 
    icon: '✅',
    actions: ['assignVehicle', 'navigate', 'markOffDuty', 'markOnLeave', 'call']
  },
  on_trip: { 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/20', 
    icon: '🚛',
    actions: ['navigate', 'track', 'call']
  },
  off_duty: { 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-500/20', 
    icon: '😴',
    actions: ['markAvailable', 'call']
  },
  on_leave: { 
    color: 'text-orange-400', 
    bg: 'bg-orange-500/20', 
    icon: '🏖️',
    actions: ['markAvailable', 'call']
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

const isExpiringSoon = (dateStr?: string) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && diffDays > 0;
};

const isExpired = (dateStr?: string) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

const formatKms = (kms: number) => {
  if (kms >= 100000) return `${(kms / 100000).toFixed(1)}L km`;
  if (kms >= 1000) return `${(kms / 1000).toFixed(1)}K km`;
  return `${kms} km`;
};

const renderStars = (rating: number) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />);
    } else if (i === fullStars && hasHalf) {
      stars.push(<Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400/50" />);
    } else {
      stars.push(<Star key={i} className="w-4 h-4 text-gray-500" />);
    }
  }
  return stars;
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function Drivers() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');
  const [actionDropdown, setActionDropdown] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<Driver | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [navModal, setNavModal] = useState<Driver | null>(null);
  const [navRoute, setNavRoute] = useState<RouteInfo | null>(null);
  const [navLoading, setNavLoading] = useState(false);
  const [navLang, setNavLang] = useState<'en' | 'hi'>('en');

  // Theme colors
  const titleColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const subtitleColor = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const cardBg = theme === 'light' ? 'bg-gray-100' : 'bg-gray-800';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-gray-700';

  // Queries
  const { data, loading, refetch } = useQuery(GET_DRIVERS);
  const { data: vehiclesData } = useQuery(GET_AVAILABLE_VEHICLES);

  // Mutations
  const [updateDriver] = useMutation(UPDATE_DRIVER);
  const [assignVehicle] = useMutation(ASSIGN_VEHICLE_TO_DRIVER);

  // URL sync
  useEffect(() => {
    if (filter === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', filter);
    }
    setSearchParams(searchParams);
  }, [filter]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClick = () => setActionDropdown(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  // Data processing
  const drivers: Driver[] = data?.drivers || [];
  const availableVehicles: Vehicle[] = (vehiclesData?.vehicles || []).filter(
    (v: Vehicle) => v.status?.toLowerCase() === 'available'
  );

  // Stats
  const available = drivers.filter(d => d.status?.toLowerCase() === 'available').length;
  const onTrip = drivers.filter(d => d.status?.toLowerCase() === 'on_trip').length;
  const offDuty = drivers.filter(d => d.status?.toLowerCase() === 'off_duty').length;
  const onLeave = drivers.filter(d => d.status?.toLowerCase() === 'on_leave').length;

  const stats = [
    { id: 'all', label: 'All Drivers', value: drivers.length, color: 'gray' as const, icon: '👤' },
    { id: 'available', label: 'Available', value: available, color: 'green' as const, icon: '✅' },
    { id: 'on_trip', label: 'On Trip', value: onTrip, color: 'blue' as const, icon: '🚛' },
    { id: 'off_duty', label: 'Off Duty', value: offDuty, color: 'yellow' as const, icon: '😴' },
    { id: 'on_leave', label: 'On Leave', value: onLeave, color: 'orange' as const, icon: '🏖️' },
  ];

  const filteredDrivers = filter === 'all'
    ? drivers
    : drivers.filter(d => d.status?.toLowerCase() === filter.toLowerCase());

  // ═══════════════════════════════════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════════════════════════════════

  const handleAction = async (action: string, driver: Driver) => {
    setActionDropdown(null);
    
    try {
      switch (action) {
        case 'assignVehicle':
          setAssignModal(driver);
          break;
          
        case 'navigate':
          setNavModal(driver);
          // Demo: fetch route from Faridabad to Delhi
          fetchDemoRoute();
          break;
          
        case 'markOffDuty':
          await updateDriver({ variables: { id: driver.id, input: { status: 'off_duty' } } });
          showNotification('success', `${driver.name} marked off duty`);
          refetch();
          break;
          
        case 'markOnLeave':
          await updateDriver({ variables: { id: driver.id, input: { status: 'on_leave' } } });
          showNotification('success', `${driver.name} marked on leave`);
          refetch();
          break;
          
        case 'markAvailable':
          await updateDriver({ variables: { id: driver.id, input: { status: 'available' } } });
          showNotification('success', `${driver.name} is now available`);
          refetch();
          break;
          
        case 'track':
          navigate(`/fleet?driver=${driver.id}`);
          break;
          
        case 'call':
          window.open(`tel:${driver.phone}`);
          break;
      }
    } catch (error: any) {
      showNotification('error', error.message || 'Action failed');
    }
  };

  const handleAssignVehicle = async () => {
    if (!assignModal || !selectedVehicle) return;
    
    try {
      await assignVehicle({ 
        variables: { 
          driverId: assignModal.id, 
          vehicleId: selectedVehicle 
        } 
      });
      showNotification('success', `Vehicle assigned to ${assignModal.name}`);
      setAssignModal(null);
      setSelectedVehicle('');
      refetch();
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to assign vehicle');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ANKR-NAV: Fetch Turn-by-Turn Route
  // ═══════════════════════════════════════════════════════════════════════════
  
  const fetchDemoRoute = async () => {
    setNavLoading(true);
    try {
      // Demo route: Faridabad → Delhi (via GraphQL)
      const query = `
        query GetRoute($start: CoordinateInput!, $end: CoordinateInput!) {
          getRoute(start: $start, end: $end) {
            id
            distance
            duration
            summary
            provider
            steps {
              instruction
              instructionHi
              distance
              duration
              maneuver
              roadName
            }
          }
        }
      `;
      
      // Try ANKR-NAV first, fallback to mock
      try {
        const res = await fetch(`${ANKR_NAV_API}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            variables: {
              start: { lat: 28.4089, lng: 77.3178 }, // Faridabad
              end: { lat: 28.6139, lng: 77.2090 }    // Delhi
            }
          })
        });
        const data = await res.json();
        if (data.data?.getRoute) {
          setNavRoute(data.data.getRoute);
          setNavLoading(false);
          return;
        }
      } catch (e) {
        console.log('ANKR-NAV not available, using demo data');
      }
      
      // Demo data (OSRM-style response)
      setNavRoute({
        id: 'demo_route_1',
        distance: 28500,  // 28.5 km
        duration: 2700,   // 45 min
        summary: 'Mathura Road → Ring Road → ITO',
        provider: 'demo',
        steps: [
          { instruction: 'Head north on Mathura Road', instructionHi: 'मथुरा रोड पर उत्तर की ओर जाएं', distance: 5200, duration: 480, maneuver: 'depart', roadName: 'Mathura Road' },
          { instruction: 'Turn right onto Badarpur Flyover', instructionHi: 'बदरपुर फ्लाईओवर पर दाएं मुड़ें', distance: 3800, duration: 360, maneuver: 'turn-right', roadName: 'Badarpur Flyover' },
          { instruction: 'Continue on Ring Road', instructionHi: 'रिंग रोड पर जारी रखें', distance: 8500, duration: 720, maneuver: 'continue', roadName: 'Ring Road' },
          { instruction: 'Take the exit toward Ashram', instructionHi: 'आश्रम की ओर निकास लें', distance: 2200, duration: 240, maneuver: 'exit-roundabout', roadName: 'Ashram Chowk' },
          { instruction: 'Turn left onto Mathura Road', instructionHi: 'मथुरा रोड पर बाएं मुड़ें', distance: 4100, duration: 420, maneuver: 'turn-left', roadName: 'Mathura Road' },
          { instruction: 'Continue to ITO', instructionHi: 'आईटीओ तक जारी रखें', distance: 3500, duration: 360, maneuver: 'continue', roadName: 'Bahadur Shah Zafar Marg' },
          { instruction: 'You have arrived at your destination', instructionHi: 'आप अपने गंतव्य पर पहुंच गए हैं', distance: 0, duration: 0, maneuver: 'arrive', roadName: 'ITO' },
        ]
      });
    } catch (error) {
      console.error('Route fetch failed:', error);
    }
    setNavLoading(false);
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${meters} m`;
  };

  const getManeuverIcon = (maneuver: string) => {
    const icons: Record<string, string> = {
      'depart': '🚀',
      'turn-left': '⬅️',
      'turn-right': '➡️',
      'turn-slight-left': '↖️',
      'turn-slight-right': '↗️',
      'continue': '⬆️',
      'roundabout': '🔄',
      'exit-roundabout': '↪️',
      'arrive': '🏁',
      'uturn-left': '↩️',
      'uturn-right': '↪️',
    };
    return icons[maneuver] || '➡️';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className={`${cardBg} rounded-xl p-6`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${titleColor}`}>👤 Drivers</h1>
            <p className={subtitleColor}>
              {filteredDrivers.length} drivers shown
              <FilterIndicator filter={filter} label={filter} onClear={() => setFilter('all')} theme={theme} />
            </p>
            {/* Workflow Guide */}
            <div className="flex items-center gap-1 mt-2 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">AVAILABLE</span>
              <span className="text-gray-500">→</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">ON_TRIP</span>
              <span className="text-gray-500">→</span>
              <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">OFF_DUTY</span>
              <span className="text-gray-500">→</span>
              <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">ON_LEAVE</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/driver-app')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Driver App
            </button>
            <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition">
              + Add Driver
            </button>
          </div>
        </div>
      </div>

      {/* Stats Filter */}
      <StatsFilter stats={stats} activeFilter={filter} onFilterChange={setFilter} theme={theme} columns={5} />

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers.map((driver) => {
          const status = driver.status?.toLowerCase() || 'available';
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.available;
          
          return (
            <div 
              key={driver.id} 
              className={`${cardBg} rounded-xl p-4 hover:ring-2 hover:ring-orange-500/50 transition relative`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${config.bg} flex items-center justify-center`}>
                    <User className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <div>
                    <h3 className={`font-bold ${titleColor}`}>{driver.name}</h3>
                    <div className="flex items-center gap-1">
                      {renderStars(driver.rating)}
                      <span className={`text-xs ${subtitleColor} ml-1`}>({driver.rating.toFixed(1)})</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs ${config.bg} ${config.color}`}>
                    {config.icon} {driver.status?.replace('_', ' ')}
                  </span>
                  
                  {/* Actions Dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionDropdown(actionDropdown === driver.id ? null : driver.id);
                      }}
                      className={`px-2 py-1 rounded text-xs ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-700 hover:bg-gray-600'} transition`}
                    >
                      Actions <ChevronDown className="w-3 h-3 inline" />
                    </button>
                    
                    {actionDropdown === driver.id && (
                      <div className={`absolute right-0 top-8 z-20 w-48 rounded-lg shadow-xl ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} border ${borderColor} py-1`}>
                        {config.actions.map(action => (
                          <button
                            key={action}
                            onClick={() => handleAction(action, driver)}
                            className={`w-full text-left px-4 py-2 text-sm hover:${theme === 'light' ? 'bg-gray-100' : 'bg-gray-700'} ${titleColor} flex items-center gap-2`}
                          >
                            {action === 'assignVehicle' && <><Truck className="w-4 h-4" /> Assign Vehicle</>}
                            {action === 'navigate' && <><Compass className="w-4 h-4 text-blue-400" /> Turn-by-Turn Nav</>}
                            {action === 'markOffDuty' && <><Clock className="w-4 h-4" /> Mark Off Duty</>}
                            {action === 'markOnLeave' && <><Calendar className="w-4 h-4" /> Mark On Leave</>}
                            {action === 'markAvailable' && <><CheckCircle className="w-4 h-4" /> Mark Available</>}
                            {action === 'track' && <><MapPin className="w-4 h-4" /> Track Location</>}
                            {action === 'call' && <><Phone className="w-4 h-4" /> Call Driver</>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Driver Info */}
              <div className={`text-sm ${subtitleColor} space-y-2`}>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${driver.phone}`} className="text-blue-400 hover:underline">{driver.phone}</a>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{driver.licenseNumber} ({driver.licenseType || 'HMV'})</span>
                </div>
                {driver.vehicles && driver.vehicles.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span className="text-green-400">{driver.vehicles.map(v => v.vehicleNumber).join(', ')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span className="text-orange-400">No vehicle assigned</span>
                  </div>
                )}
                {driver.city && driver.state && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{driver.city}, {driver.state}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs">
                <div className="text-center">
                  <div className={`font-bold ${titleColor}`}>{driver.totalTrips}</div>
                  <div className={subtitleColor}>Trips</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold ${titleColor}`}>{formatKms(driver.totalKms)}</div>
                  <div className={subtitleColor}>Distance</div>
                </div>
                <div className={`text-center px-2 py-1 rounded ${
                  isExpired(driver.licenseExpiry) ? 'bg-red-500/20 text-red-400' :
                  isExpiringSoon(driver.licenseExpiry) ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  <div className="font-bold">{formatDate(driver.licenseExpiry)}</div>
                  <div>License</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredDrivers.length === 0 && (
        <div className={`${cardBg} rounded-xl p-12 text-center`}>
          <User className={`w-16 h-16 mx-auto mb-4 ${subtitleColor}`} />
          <h3 className={`text-xl font-bold ${titleColor} mb-2`}>No Drivers Found</h3>
          <p className={subtitleColor}>
            {filter === 'all' ? 'Add your first driver to get started' : `No drivers with status: ${filter}`}
          </p>
        </div>
      )}

      {/* Assign Vehicle Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setAssignModal(null)}>
          <div className={`${cardBg} rounded-xl p-6 w-full max-w-md mx-4`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${titleColor}`}>Assign Vehicle</h2>
              <button onClick={() => setAssignModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className={`${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} rounded-lg p-4 mb-4`}>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-orange-400" />
                <span className={`font-bold ${titleColor}`}>{assignModal.name}</span>
              </div>
              <div className={`text-sm ${subtitleColor}`}>
                {assignModal.phone} • {assignModal.licenseNumber}
              </div>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${titleColor}`}>Select Vehicle</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg ${theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-gray-700 text-white'} border ${borderColor}`}
              >
                <option value="">-- Select Vehicle --</option>
                {availableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicleNumber} ({vehicle.vehicleType} - {vehicle.capacity} {vehicle.capacityUnit})
                  </option>
                ))}
              </select>
              {availableVehicles.length === 0 && (
                <p className="text-orange-400 text-sm mt-2">No available vehicles</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setAssignModal(null)}
                className={`flex-1 px-4 py-2 rounded-lg ${theme === 'light' ? 'bg-gray-300 hover:bg-gray-400 text-gray-800' : 'bg-gray-600 hover:bg-gray-500 text-white'} transition`}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignVehicle}
                disabled={!selectedVehicle}
                className="flex-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Turn-by-Turn Navigation Modal */}
      {navModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => { setNavModal(null); setNavRoute(null); }}>
          <div className={`${cardBg} rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden`} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Compass className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-lg font-bold text-white">Turn-by-Turn Navigation</h2>
                  <p className="text-blue-100 text-sm">ANKR Nav • {navRoute?.provider || 'Loading...'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Language Toggle */}
                <button
                  onClick={() => setNavLang(navLang === 'en' ? 'hi' : 'en')}
                  className="bg-white/20 px-3 py-1 rounded-full text-white text-sm flex items-center gap-1 hover:bg-white/30"
                >
                  <Languages className="w-4 h-4" />
                  {navLang === 'en' ? 'हिंदी' : 'English'}
                </button>
                <button onClick={() => { setNavModal(null); setNavRoute(null); }} className="text-white/80 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Driver Info */}
            <div className={`p-4 border-b ${borderColor}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center`}>
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className={`font-bold ${titleColor}`}>{navModal.name}</p>
                  <p className={`text-sm ${subtitleColor}`}>{navModal.phone}</p>
                </div>
              </div>
            </div>

            {/* Route Summary */}
            {navRoute && (
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border-b border-green-500/20">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${titleColor}`}>{formatDistance(navRoute.distance)}</p>
                      <p className={`text-xs ${subtitleColor}`}>Distance</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${titleColor}`}>{formatDuration(navRoute.duration)}</p>
                      <p className={`text-xs ${subtitleColor}`}>Duration</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${subtitleColor}`}>{navRoute.summary}</p>
                    <p className="text-xs text-green-400">via {navRoute.provider.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Steps */}
            <div className="overflow-y-auto max-h-[50vh] p-4">
              {navLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  <span className={`ml-3 ${subtitleColor}`}>Calculating route...</span>
                </div>
              ) : navRoute?.steps ? (
                <div className="space-y-3">
                  {navRoute.steps.map((step, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        idx === 0 ? 'bg-green-500/10 ring-1 ring-green-500/30' : 
                        idx === navRoute.steps.length - 1 ? 'bg-blue-500/10 ring-1 ring-blue-500/30' :
                        theme === 'light' ? 'bg-gray-100' : 'bg-gray-700/50'
                      }`}
                    >
                      <div className="text-2xl">{getManeuverIcon(step.maneuver)}</div>
                      <div className="flex-1">
                        <p className={`font-medium ${titleColor}`}>
                          {navLang === 'hi' && step.instructionHi ? step.instructionHi : step.instruction}
                        </p>
                        {step.roadName && (
                          <p className={`text-sm ${subtitleColor}`}>{step.roadName}</p>
                        )}
                        <div className="flex gap-4 mt-1 text-xs">
                          <span className="text-blue-400">{formatDistance(step.distance)}</span>
                          <span className="text-green-400">{formatDuration(step.duration)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-center py-8 ${subtitleColor}`}>No route available</p>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => { setNavModal(null); setNavRoute(null); }}
                className={`flex-1 px-4 py-2 rounded-lg ${theme === 'light' ? 'bg-gray-300 hover:bg-gray-400 text-gray-800' : 'bg-gray-600 hover:bg-gray-500 text-white'} transition`}
              >
                Close
              </button>
              <button
                onClick={() => navigate('/driver-app-voice')}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition flex items-center justify-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                Voice Nav
              </button>
              <button
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=28.6139,77.2090`, '_blank')}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Open Maps
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
