/**
 * Orders Page - With Trip Assignment Modal
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import { StatsFilter, FilterIndicator } from '../components/StatsFilter';
import { 
  CheckCircle, PauseCircle, PlayCircle, Truck, FileText, 
  X, Loader2, AlertCircle, ChevronDown, User, Car
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// GraphQL Queries & Mutations
// ═══════════════════════════════════════════════════════════════════════════

const GET_ORDERS = gql`
  query GetOrders {
    orders {
      id
      orderNumber
      status
      originCity
      destCity
      cargoType
      quotedAmount
      customer { 
        id
        companyName 
      }
      createdAt
    }
  }
`;

const GET_AVAILABLE_DRIVERS = gql`
  query GetDrivers {
    drivers {
      id
      name
      phone
      licenseNumber
      status
    }
  }
`;

const GET_AVAILABLE_VEHICLES = gql`
  query GetVehicles {
    vehicles {
      id
      vehicleNumber
      vehicleType
      status
      capacity
    }
  }
`;

const CONFIRM_ORDER = gql`
  mutation ConfirmOrder($id: ID!) {
    confirmOrder(id: $id) {
      id
      status
    }
  }
`;

const HOLD_ORDER = gql`
  mutation HoldOrder($id: ID!, $reason: String!) {
    holdOrder(id: $id, reason: $reason) {
      id
      status
    }
  }
`;

const RESUME_ORDER = gql`
  mutation ResumeOrder($id: ID!) {
    resumeOrder(id: $id) {
      id
      status
    }
  }
`;

const CANCEL_ORDER = gql`
  mutation CancelOrder($id: ID!, $reason: String!) {
    cancelOrder(id: $id, reason: $reason) {
      id
      status
    }
  }
`;

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: String!) {
    updateOrderStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

const GENERATE_INVOICE = gql`
  mutation GenerateInvoiceFromOrder($orderId: ID!) {
    generateInvoiceFromOrder(orderId: $orderId) {
      id
      invoiceNumber
      totalAmount
    }
  }
`;

const CREATE_TRIP = gql`
  mutation CreateTrip($input: TripInput!) {
    createTrip(input: $input) {
      id
      tripNumber
      status
      driver { name }
      vehicle { vehicleNumber }
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// Status Configuration
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<string, { 
  color: string; 
  bg: string; 
  actions: string[];
}> = {
  PENDING: { 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-500/20', 
    actions: ['confirm', 'cancel']
  },
  CONFIRMED: { 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/20', 
    actions: ['createTrip', 'hold', 'cancel']
  },
  ON_HOLD: { 
    color: 'text-orange-400', 
    bg: 'bg-orange-500/20', 
    actions: ['resume', 'cancel']
  },
  DISPATCHED: { 
    color: 'text-indigo-400', 
    bg: 'bg-indigo-500/20', 
    actions: ['inTransit']
  },
  IN_TRANSIT: { 
    color: 'text-purple-400', 
    bg: 'bg-purple-500/20', 
    actions: ['deliver']
  },
  DELIVERED: { 
    color: 'text-green-400', 
    bg: 'bg-green-500/20', 
    actions: ['invoice']
  },
  INVOICED: { 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/20', 
    actions: []
  },
  CANCELLED: { 
    color: 'text-red-400', 
    bg: 'bg-red-500/20', 
    actions: []
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  originCity: string;
  destCity: string;
  cargoType?: string;
  quotedAmount?: number;
  customer?: { id: string; companyName: string };
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: string;
}

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  status: string;
  capacity?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export default function Orders() {
  const { theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilter = searchParams.get('status') || 'all';
  const [filter, setFilter] = useState(urlFilter);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [holdModal, setHoldModal] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [holdReason, setHoldReason] = useState('');
  const [tripModal, setTripModal] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Theme colors
  const titleColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const subtitleColor = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const cardBg = theme === 'light' ? 'bg-gray-100' : 'bg-gray-800';
  const tableBg = theme === 'light' ? 'bg-white' : 'bg-gray-800';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-gray-700';
  const dropdownBg = theme === 'light' ? 'bg-white' : 'bg-gray-700';
  const inputBg = theme === 'light' ? 'bg-white' : 'bg-gray-700';

  // Queries & Mutations
  const { data, loading, error, refetch } = useQuery(GET_ORDERS);
  const { data: driversData } = useQuery(GET_AVAILABLE_DRIVERS);
  const { data: vehiclesData } = useQuery(GET_AVAILABLE_VEHICLES);
  
  const [confirmOrder, { loading: confirming }] = useMutation(CONFIRM_ORDER, {
    onCompleted: () => { showNotification('success', 'Order confirmed'); refetch(); },
    onError: (err) => showNotification('error', err.message),
  });

  const [holdOrder, { loading: holding }] = useMutation(HOLD_ORDER, {
    onCompleted: () => { 
      showNotification('success', 'Order placed on hold'); 
      setHoldModal(null);
      setHoldReason('');
      refetch(); 
    },
    onError: (err) => showNotification('error', err.message),
  });

  const [resumeOrder, { loading: resuming }] = useMutation(RESUME_ORDER, {
    onCompleted: () => { showNotification('success', 'Order resumed'); refetch(); },
    onError: (err) => showNotification('error', err.message),
  });

  const [cancelOrder, { loading: cancelling }] = useMutation(CANCEL_ORDER, {
    onCompleted: () => { showNotification('success', 'Order cancelled'); refetch(); },
    onError: (err) => showNotification('error', err.message),
  });

  const [updateStatus, { loading: updating }] = useMutation(UPDATE_ORDER_STATUS, {
    onCompleted: () => { showNotification('success', 'Status updated'); refetch(); },
    onError: (err) => showNotification('error', err.message),
  });

  const [generateInvoice, { loading: invoicing }] = useMutation(GENERATE_INVOICE, {
    onCompleted: (data) => { 
      showNotification('success', `Invoice ${data.generateInvoiceFromOrder.invoiceNumber} created!`); 
      refetch(); 
    },
    onError: (err) => showNotification('error', err.message),
  });

  const [createTrip, { loading: creatingTrip }] = useMutation(CREATE_TRIP, {
    onCompleted: (data) => { 
      showNotification('success', `Trip ${data.createTrip.tripNumber} created! Driver: ${data.createTrip.driver.name}`); 
      setTripModal(null);
      setSelectedDriver('');
      setSelectedVehicle('');
      refetch(); 
    },
    onError: (err) => showNotification('error', err.message),
  });

  const isLoading = confirming || holding || resuming || cancelling || updating || invoicing || creatingTrip;

  // Filter available drivers and vehicles
  const availableDrivers = (driversData?.drivers || []).filter(
    (d: Driver) => d.status?.toLowerCase() === 'available'
  );
  const availableVehicles = (vehiclesData?.vehicles || []).filter(
    (v: Vehicle) => v.status?.toLowerCase() === 'available'
  );

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

  const orders = data?.orders || [];

  // Calculate stats
  const pending = orders.filter((o: Order) => o.status === 'PENDING').length;
  const confirmed = orders.filter((o: Order) => o.status === 'CONFIRMED').length;
  const inTransit = orders.filter((o: Order) => o.status === 'IN_TRANSIT').length;
  const delivered = orders.filter((o: Order) => o.status === 'DELIVERED').length;

  const stats = [
    { id: 'all', label: 'All Orders', value: orders.length, color: 'gray' as const, icon: '📦' },
    { id: 'PENDING', label: 'Pending', value: pending, color: 'yellow' as const, icon: '⏳' },
    { id: 'CONFIRMED', label: 'Confirmed', value: confirmed, color: 'blue' as const, icon: '✅' },
    { id: 'IN_TRANSIT', label: 'In Transit', value: inTransit, color: 'purple' as const, icon: '🚛' },
    { id: 'DELIVERED', label: 'Delivered', value: delivered, color: 'green' as const, icon: '📬' },
  ];

  // Filter orders
  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter((o: Order) => o.status === filter);

  // ─────────────────────────────────────────────────────────────────────────
  // Action Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleAction = (action: string, order: Order) => {
    setActiveDropdown(null);
    
    switch (action) {
      case 'confirm':
        confirmOrder({ variables: { id: order.id } });
        break;
      case 'hold':
        setHoldModal({ orderId: order.id, orderNumber: order.orderNumber });
        break;
      case 'resume':
        resumeOrder({ variables: { id: order.id } });
        break;
      case 'cancel':
        if (confirm(`Cancel order ${order.orderNumber}?`)) {
          cancelOrder({ variables: { id: order.id, reason: 'Cancelled by user' } });
        }
        break;
      case 'createTrip':
        setTripModal(order);
        break;
      case 'inTransit':
        updateStatus({ variables: { id: order.id, status: 'IN_TRANSIT' } });
        break;
      case 'deliver':
        updateStatus({ variables: { id: order.id, status: 'DELIVERED' } });
        break;
      case 'invoice':
        generateInvoice({ variables: { orderId: order.id } });
        break;
    }
  };

  const submitHold = () => {
    if (holdModal && holdReason) {
      holdOrder({ variables: { id: holdModal.orderId, reason: holdReason } });
    }
  };

  const submitTrip = () => {
    if (tripModal && selectedDriver && selectedVehicle) {
      createTrip({
        variables: {
          input: {
            orderId: tripModal.id,
            driverId: selectedDriver,
            vehicleId: selectedVehicle,
            startLocation: tripModal.originCity,
            endLocation: tripModal.destCity,
          }
        }
      });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render Actions Dropdown
  // ─────────────────────────────────────────────────────────────────────────

  const renderActions = (order: Order) => {
    const config = STATUS_CONFIG[order.status] || { actions: [] };
    
    if (config.actions.length === 0) {
      return <span className="text-gray-500 text-sm">—</span>;
    }

    const actionLabels: Record<string, { label: string; icon: any; color: string }> = {
      confirm: { label: 'Confirm', icon: CheckCircle, color: 'text-green-400 hover:bg-green-500/20' },
      hold: { label: 'Hold', icon: PauseCircle, color: 'text-orange-400 hover:bg-orange-500/20' },
      resume: { label: 'Resume', icon: PlayCircle, color: 'text-blue-400 hover:bg-blue-500/20' },
      createTrip: { label: '🚛 Create Trip', icon: Truck, color: 'text-indigo-400 hover:bg-indigo-500/20' },
      inTransit: { label: 'Start Transit', icon: Truck, color: 'text-purple-400 hover:bg-purple-500/20' },
      deliver: { label: 'Mark Delivered', icon: CheckCircle, color: 'text-green-400 hover:bg-green-500/20' },
      invoice: { label: 'Generate Invoice', icon: FileText, color: 'text-emerald-400 hover:bg-emerald-500/20' },
      cancel: { label: 'Cancel', icon: X, color: 'text-red-400 hover:bg-red-500/20' },
    };

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(activeDropdown === order.id ? null : order.id);
          }}
          disabled={isLoading}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition
            ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-gray-600 hover:bg-gray-500 text-white'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Actions'}
          <ChevronDown className="w-4 h-4" />
        </button>

        {activeDropdown === order.id && (
          <div className={`absolute right-0 mt-1 w-48 rounded-lg shadow-lg z-50 py-1 ${dropdownBg} border ${borderColor}`}>
            {config.actions.map((action) => {
              const actionConfig = actionLabels[action];
              if (!actionConfig) return null;
              const Icon = actionConfig.icon;
              
              return (
                <button
                  key={action}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(action, order);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${actionConfig.color} transition`}
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
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className={`ml-2 ${subtitleColor}`}>Loading orders...</span>
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
            <h1 className={`text-2xl font-bold ${titleColor}`}>📦 Orders</h1>
            <p className={subtitleColor}>
              Click stats to filter • {filteredOrders.length} orders shown
              <FilterIndicator filter={filter} label={filter} onClear={() => setFilter('all')} theme={theme} />
            {/* Workflow Guide */}
            <div className="flex items-center gap-1 mt-2 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">PENDING</span>
              <span className="text-gray-500">→</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">CONFIRMED</span>
              <span className="text-gray-500">→</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">DISPATCHED</span>
              <span className="text-gray-500">→</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">IN_TRANSIT</span>
              <span className="text-gray-500">→</span>
              <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">DELIVERED</span>
              <span className="text-gray-500">→</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">INVOICED</span>
            </div>
            </p>
          </div>
          <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition">
            + New Order
          </button>
        </div>
      </div>

      {/* Stats Filter */}
      <StatsFilter
        stats={stats}
        activeFilter={filter}
        onFilterChange={setFilter}
        theme={theme}
        columns={5}
      />

      {/* Orders Table */}
      <div className={`${tableBg} rounded-xl overflow-hidden`}>
        <table className="w-full">
          <thead className={`${cardBg} border-b ${borderColor}`}>
            <tr>
              <th className={`text-left p-4 ${titleColor}`}>Order #</th>
              <th className={`text-left p-4 ${titleColor}`}>Customer</th>
              <th className={`text-left p-4 ${titleColor}`}>Route</th>
              <th className={`text-left p-4 ${titleColor}`}>Amount</th>
              <th className={`text-left p-4 ${titleColor}`}>Status</th>
              <th className={`text-left p-4 ${titleColor}`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order: Order) => {
              const statusConfig = STATUS_CONFIG[order.status] || { color: 'text-gray-400', bg: 'bg-gray-500/20' };
              
              return (
                <tr key={order.id} className={`border-b ${borderColor} hover:bg-gray-700/20`}>
                  <td className={`p-4 font-mono text-sm ${titleColor}`}>
                    {order.orderNumber}
                  </td>
                  <td className={`p-4 ${titleColor}`}>
                    {order.customer?.companyName || '-'}
                  </td>
                  <td className={`p-4 ${subtitleColor}`}>
                    {order.originCity} → {order.destCity}
                  </td>
                  <td className={`p-4 ${titleColor}`}>
                    ₹{order.quotedAmount?.toLocaleString() || '0'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {renderActions(order)}
                  </td>
                </tr>
              );
            })}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} className={`p-8 text-center ${subtitleColor}`}>
                  No orders found {filter !== 'all' && `with status "${filter}"`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Hold Order Modal */}
      {holdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${cardBg} rounded-xl p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-lg font-bold ${titleColor} mb-2`}>⏸️ Hold Order</h3>
            <p className={`${subtitleColor} mb-4`}>
              Put order <span className="font-mono text-orange-400">{holdModal.orderNumber}</span> on hold
            </p>
            <textarea
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              placeholder="Enter reason for holding..."
              className={`w-full p-3 rounded-lg border ${borderColor} ${inputBg} ${titleColor} mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500`}
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setHoldModal(null); setHoldReason(''); }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={submitHold}
                disabled={!holdReason || holding}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {holding && <Loader2 className="w-4 h-4 animate-spin" />}
                Hold Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TRIP ASSIGNMENT MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {tripModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${cardBg} rounded-xl p-6 w-full max-w-lg mx-4`}>
            <h3 className={`text-xl font-bold ${titleColor} mb-2 flex items-center gap-2`}>
              <Truck className="w-6 h-6 text-indigo-400" />
              Create Trip
            </h3>
            <p className={`${subtitleColor} mb-4`}>
              Assign driver and vehicle for order{' '}
              <span className="font-mono text-orange-400">{tripModal.orderNumber}</span>
            </p>

            {/* Order Summary */}
            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} mb-4`}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className={subtitleColor}>Route:</span>
                  <p className={`font-medium ${titleColor}`}>{tripModal.originCity} → {tripModal.destCity}</p>
                </div>
                <div>
                  <span className={subtitleColor}>Customer:</span>
                  <p className={`font-medium ${titleColor}`}>{tripModal.customer?.companyName || '-'}</p>
                </div>
                <div>
                  <span className={subtitleColor}>Cargo:</span>
                  <p className={`font-medium ${titleColor}`}>{tripModal.cargoType || 'General'}</p>
                </div>
                <div>
                  <span className={subtitleColor}>Amount:</span>
                  <p className={`font-medium ${titleColor}`}>₹{tripModal.quotedAmount?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </div>

            {/* Driver Selection */}
            <div className="mb-4">
              <label className={`block text-sm font-medium ${titleColor} mb-2 flex items-center gap-2`}>
                <User className="w-4 h-4 text-blue-400" />
                Select Driver ({availableDrivers.length} available)
              </label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className={`w-full p-3 rounded-lg border ${borderColor} ${inputBg} ${titleColor} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <option value="">-- Choose Driver --</option>
                {availableDrivers.map((driver: Driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} • {driver.phone} • {driver.licenseNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Selection */}
            <div className="mb-6">
              <label className={`block text-sm font-medium ${titleColor} mb-2 flex items-center gap-2`}>
                <Car className="w-4 h-4 text-green-400" />
                Select Vehicle ({availableVehicles.length} available)
              </label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className={`w-full p-3 rounded-lg border ${borderColor} ${inputBg} ${titleColor} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <option value="">-- Choose Vehicle --</option>
                {availableVehicles.map((vehicle: Vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicleNumber} • {vehicle.vehicleType} • {vehicle.capacity || '-'} tons
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { 
                  setTripModal(null); 
                  setSelectedDriver(''); 
                  setSelectedVehicle(''); 
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={submitTrip}
                disabled={!selectedDriver || !selectedVehicle || creatingTrip}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creatingTrip && <Loader2 className="w-4 h-4 animate-spin" />}
                <Truck className="w-4 h-4" />
                Create Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
