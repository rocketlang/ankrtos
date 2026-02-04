/**
 * Vehicles Page - Fleet Management with Actions
 * Status: AVAILABLE → IN_TRANSIT → MAINTENANCE → INACTIVE
 * Integrates with Fleet.tsx (Live Map) and FleetGPS.tsx (Admin View)
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StatsFilter, FilterIndicator } from '../components/StatsFilter';
import { 
  Truck, User, Phone, MapPin, Calendar, Wrench, 
  ChevronDown, X, CheckCircle, AlertTriangle, Settings,
  Navigation, Fuel, FileText, Clock, Shield
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// GraphQL Queries & Mutations
// ═══════════════════════════════════════════════════════════════════════════

const GET_VEHICLES = gql`
  query GetVehicles {
    vehicles {
      id
      vehicleNumber
      vehicleType
      make
      model
      year
      capacity
      capacityUnit
      status
      ownershipType
      insuranceExpiry
      fitnessExpiry
      permitExpiry
      lastLatitude
      lastLongitude
      lastUpdated
      currentLocation
      driver {
        id
        name
        phone
        status
      }
      createdAt
    }
  }
`;

const GET_AVAILABLE_DRIVERS = gql`
  query GetAvailableDrivers {
    drivers {
      id
      name
      phone
      licenseNumber
      status
    }
  }
`;

const UPDATE_VEHICLE = gql`
  mutation UpdateVehicle($id: ID!, $input: VehicleUpdateInput!) {
    updateVehicle(id: $id, input: $input) {
      id
      status
      driver { id name }
    }
  }
`;

const ASSIGN_DRIVER_TO_VEHICLE = gql`
  mutation AssignDriverToVehicle($vehicleId: ID!, $driverId: ID!) {
    assignDriverToVehicle(vehicleId: $vehicleId, driverId: $driverId) {
      id
      driver { id name phone }
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  make?: string;
  model?: string;
  year?: number;
  capacity: number;
  capacityUnit: string;
  status: string;
  ownershipType?: string;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
  permitExpiry?: string;
  lastLatitude?: number;
  lastLongitude?: number;
  lastUpdated?: string;
  currentLocation?: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
    status: string;
  };
  createdAt: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
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
    actions: ['assignDriver', 'maintenance', 'deactivate', 'track']
  },
  in_transit: { 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/20', 
    icon: '🚛',
    actions: ['track', 'call']
  },
  maintenance: { 
    color: 'text-orange-400', 
    bg: 'bg-orange-500/20', 
    icon: '🔧',
    actions: ['markAvailable', 'deactivate']
  },
  inactive: { 
    color: 'text-gray-400', 
    bg: 'bg-gray-500/20', 
    icon: '⏸️',
    actions: ['activate']
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

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function Vehicles() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');
  const [actionDropdown, setActionDropdown] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Theme colors
  const titleColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const subtitleColor = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const cardBg = theme === 'light' ? 'bg-gray-100' : 'bg-gray-800';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-gray-700';

  // Queries
  const { data, loading, refetch } = useQuery(GET_VEHICLES);
  const { data: driversData } = useQuery(GET_AVAILABLE_DRIVERS);

  // Mutations
  const [updateVehicle] = useMutation(UPDATE_VEHICLE);
  const [assignDriver] = useMutation(ASSIGN_DRIVER_TO_VEHICLE);

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
  const vehicles: Vehicle[] = data?.vehicles || [];
  const availableDrivers: Driver[] = (driversData?.drivers || []).filter(
    (d: Driver) => d.status === 'available' || d.status === 'AVAILABLE'
  );

  // Stats
  const available = vehicles.filter(v => v.status?.toLowerCase() === 'available').length;
  const inTransit = vehicles.filter(v => v.status?.toLowerCase() === 'in_transit').length;
  const maintenance = vehicles.filter(v => v.status?.toLowerCase() === 'maintenance').length;
  const inactive = vehicles.filter(v => v.status?.toLowerCase() === 'inactive').length;

  const stats = [
    { id: 'all', label: 'All Vehicles', value: vehicles.length, color: 'gray' as const, icon: '🚛' },
    { id: 'available', label: 'Available', value: available, color: 'green' as const, icon: '✅' },
    { id: 'in_transit', label: 'In Transit', value: inTransit, color: 'blue' as const, icon: '🚚' },
    { id: 'maintenance', label: 'Maintenance', value: maintenance, color: 'orange' as const, icon: '🔧' },
    { id: 'inactive', label: 'Inactive', value: inactive, color: 'gray' as const, icon: '⏸️' },
  ];

  const filteredVehicles = filter === 'all'
    ? vehicles
    : vehicles.filter(v => v.status?.toLowerCase() === filter.toLowerCase());

  // ═══════════════════════════════════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════════════════════════════════

  const handleAction = async (action: string, vehicle: Vehicle) => {
    setActionDropdown(null);
    
    try {
      switch (action) {
        case 'assignDriver':
          setAssignModal(vehicle);
          break;
          
        case 'maintenance':
          await updateVehicle({ variables: { id: vehicle.id, input: { status: 'maintenance' } } });
          showNotification('success', `${vehicle.vehicleNumber} marked for maintenance`);
          refetch();
          break;
          
        case 'markAvailable':
          await updateVehicle({ variables: { id: vehicle.id, input: { status: 'available' } } });
          showNotification('success', `${vehicle.vehicleNumber} is now available`);
          refetch();
          break;
          
        case 'deactivate':
          await updateVehicle({ variables: { id: vehicle.id, input: { status: 'inactive' } } });
          showNotification('success', `${vehicle.vehicleNumber} deactivated`);
          refetch();
          break;
          
        case 'activate':
          await updateVehicle({ variables: { id: vehicle.id, input: { status: 'available' } } });
          showNotification('success', `${vehicle.vehicleNumber} activated`);
          refetch();
          break;
          
        case 'track':
          navigate(`/fleet?vehicle=${vehicle.id}`);
          break;
          
        case 'call':
          if (vehicle.driver?.phone) {
            window.open(`tel:${vehicle.driver.phone}`);
          }
          break;
      }
    } catch (error: any) {
      showNotification('error', error.message || 'Action failed');
    }
  };

  const handleAssignDriver = async () => {
    if (!assignModal || !selectedDriver) return;
    
    try {
      await assignDriver({ 
        variables: { 
          vehicleId: assignModal.id, 
          driverId: selectedDriver 
        } 
      });
      showNotification('success', `Driver assigned to ${assignModal.vehicleNumber}`);
      setAssignModal(null);
      setSelectedDriver('');
      refetch();
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to assign driver');
    }
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
            <h1 className={`text-2xl font-bold ${titleColor}`}>🚛 Vehicles</h1>
            <p className={subtitleColor}>
              {filteredVehicles.length} vehicles shown
              <FilterIndicator filter={filter} label={filter} onClear={() => setFilter('all')} theme={theme} />
            </p>
            {/* Workflow Guide */}
            <div className="flex items-center gap-1 mt-2 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">AVAILABLE</span>
              <span className="text-gray-500">→</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">IN_TRANSIT</span>
              <span className="text-gray-500">→</span>
              <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">MAINTENANCE</span>
              <span className="text-gray-500">→</span>
              <span className="px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400">INACTIVE</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/fleet')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Live Map
            </button>
            <button 
              onClick={() => navigate('/gps-tracking')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              GPS Admin
            </button>
            <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition">
              + Add Vehicle
            </button>
          </div>
        </div>
      </div>

      {/* Stats Filter */}
      <StatsFilter stats={stats} activeFilter={filter} onFilterChange={setFilter} theme={theme} columns={5} />

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((vehicle) => {
          const status = vehicle.status?.toLowerCase() || 'available';
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.available;
          
          return (
            <div 
              key={vehicle.id} 
              className={`${cardBg} rounded-xl p-4 hover:ring-2 hover:ring-orange-500/50 transition relative`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Truck className={`w-5 h-5 ${config.color}`} />
                  <h3 className={`font-bold ${titleColor}`}>{vehicle.vehicleNumber}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${config.bg} ${config.color}`}>
                    {config.icon} {vehicle.status}
                  </span>
                  
                  {/* Actions Dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionDropdown(actionDropdown === vehicle.id ? null : vehicle.id);
                      }}
                      className={`px-2 py-1 rounded ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-gray-700 hover:bg-gray-600'} transition`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {actionDropdown === vehicle.id && (
                      <div className={`absolute right-0 top-8 z-20 w-48 rounded-lg shadow-xl ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} border ${borderColor} py-1`}>
                        {config.actions.map(action => (
                          <button
                            key={action}
                            onClick={() => handleAction(action, vehicle)}
                            className={`w-full text-left px-4 py-2 text-sm hover:${theme === 'light' ? 'bg-gray-100' : 'bg-gray-700'} ${titleColor} flex items-center gap-2`}
                          >
                            {action === 'assignDriver' && <><User className="w-4 h-4" /> Assign Driver</>}
                            {action === 'maintenance' && <><Wrench className="w-4 h-4" /> Send to Maintenance</>}
                            {action === 'markAvailable' && <><CheckCircle className="w-4 h-4" /> Mark Available</>}
                            {action === 'deactivate' && <><X className="w-4 h-4" /> Deactivate</>}
                            {action === 'activate' && <><CheckCircle className="w-4 h-4" /> Activate</>}
                            {action === 'track' && <><MapPin className="w-4 h-4" /> Track on Map</>}
                            {action === 'call' && <><Phone className="w-4 h-4" /> Call Driver</>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className={`text-sm ${subtitleColor} space-y-2`}>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span>{vehicle.vehicleType} • {vehicle.make} {vehicle.model} {vehicle.year}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4" />
                  <span>{vehicle.capacity} {vehicle.capacityUnit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {vehicle.driver ? (
                    <span className="text-green-400">{vehicle.driver.name}</span>
                  ) : (
                    <span className="text-orange-400">No driver assigned</span>
                  )}
                </div>
                {vehicle.driver?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${vehicle.driver.phone}`} className="text-blue-400 hover:underline">
                      {vehicle.driver.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Documents Status */}
              <div className="mt-3 pt-3 border-t border-gray-700 flex flex-wrap gap-2 text-xs">
                <span className={`px-2 py-1 rounded ${
                  isExpired(vehicle.insuranceExpiry) ? 'bg-red-500/20 text-red-400' :
                  isExpiringSoon(vehicle.insuranceExpiry) ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  <Shield className="w-3 h-3 inline mr-1" />
                  Ins: {formatDate(vehicle.insuranceExpiry)}
                </span>
                <span className={`px-2 py-1 rounded ${
                  isExpired(vehicle.fitnessExpiry) ? 'bg-red-500/20 text-red-400' :
                  isExpiringSoon(vehicle.fitnessExpiry) ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  <FileText className="w-3 h-3 inline mr-1" />
                  Fit: {formatDate(vehicle.fitnessExpiry)}
                </span>
              </div>

              {/* Last Location */}
              {vehicle.lastLatitude && vehicle.lastLongitude && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {vehicle.currentLocation || `${vehicle.lastLatitude.toFixed(4)}, ${vehicle.lastLongitude.toFixed(4)}`}
                  {vehicle.lastUpdated && (
                    <span className="ml-auto">
                      <Clock className="w-3 h-3 inline" /> {new Date(vehicle.lastUpdated).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredVehicles.length === 0 && (
        <div className={`${cardBg} rounded-xl p-12 text-center`}>
          <Truck className={`w-16 h-16 mx-auto mb-4 ${subtitleColor}`} />
          <h3 className={`text-xl font-bold ${titleColor} mb-2`}>No Vehicles Found</h3>
          <p className={subtitleColor}>
            {filter === 'all' ? 'Add your first vehicle to get started' : `No vehicles with status: ${filter}`}
          </p>
        </div>
      )}

      {/* Assign Driver Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setAssignModal(null)}>
          <div className={`${cardBg} rounded-xl p-6 w-full max-w-md mx-4`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${titleColor}`}>Assign Driver</h2>
              <button onClick={() => setAssignModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className={`${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} rounded-lg p-4 mb-4`}>
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-orange-400" />
                <span className={`font-bold ${titleColor}`}>{assignModal.vehicleNumber}</span>
              </div>
              <div className={`text-sm ${subtitleColor}`}>
                {assignModal.vehicleType} • {assignModal.capacity} {assignModal.capacityUnit}
              </div>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${titleColor}`}>Select Driver</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg ${theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-gray-700 text-white'} border ${borderColor}`}
              >
                <option value="">-- Select Driver --</option>
                {availableDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} ({driver.phone})
                  </option>
                ))}
              </select>
              {availableDrivers.length === 0 && (
                <p className="text-orange-400 text-sm mt-2">No available drivers</p>
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
                onClick={handleAssignDriver}
                disabled={!selectedDriver}
                className="flex-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Driver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
