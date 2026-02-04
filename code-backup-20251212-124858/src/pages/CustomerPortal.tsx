/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CustomerPortal - WIRED TO GRAPHQL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Real data from backend:
 * - My Orders (customer's orders)
 * - Active Shipments (in-transit trips)
 * - Invoices
 * - Tracking data
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import { useState, useEffect } from 'react';
import { 
  Package, Truck, FileText, MapPin, Clock, IndianRupee,
  Phone, RefreshCw, Eye, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  pickupCity: string;
  deliveryCity: string;
  quotedAmount: number;
  createdAt: string;
}

interface Trip {
  id: string;
  tripNumber: string;
  status: string;
  vehicle?: { vehicleNumber: string };
  driver?: { user: { name: string; phone: string } };
  currentLocation?: string;
  eta?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  dueDate: string;
}

interface PortalStats {
  totalOrders: number;
  activeShipments: number;
  pendingInvoices: number;
  totalSpent: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// GRAPHQL QUERIES
// ═══════════════════════════════════════════════════════════════════════════

const CUSTOMER_PORTAL_QUERY = `
  query CustomerPortalData {
    orders(limit: 10) {
      id
      orderNumber
      status
      pickupCity
      deliveryCity
      quotedAmount
      createdAt
    }
    trips(status: "IN_TRANSIT", limit: 5) {
      id
      tripNumber
      status
      vehicle { vehicleNumber }
      driver { user { name phone } }
    }
    invoices(status: "PENDING", limit: 5) {
      id
      invoiceNumber
      totalAmount
      status
      dueDate
    }
  }
`;

// Fallback to dashboardStats if customer-specific queries don't exist
const DASHBOARD_STATS_QUERY = `
  query DashboardStats {
    dashboardStats {
      totalOrders
      totalVehicles
      availableVehicles
      inTransitVehicles
      totalDrivers
      activeDrivers
      pendingOrders
      completedOrders
      totalRevenue
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// API HELPER
// ═══════════════════════════════════════════════════════════════════════════

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function graphqlFetch<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = localStorage.getItem('wowtruck_token');
  
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });
  
  const result = await response.json();
  
  if (result.errors) {
    console.warn('GraphQL errors:', result.errors);
    throw new Error(result.errors[0]?.message || 'GraphQL error');
  }
  
  return result.data;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CustomerPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'invoices' | 'tracking'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [stats, setStats] = useState<PortalStats>({
    totalOrders: 0,
    activeShipments: 0,
    pendingInvoices: 0,
    totalSpent: 0
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // ═══════════════════════════════════════════════════════════════════════
  // FETCH DATA
  // ═══════════════════════════════════════════════════════════════════════

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try customer-specific queries first
      try {
        const data = await graphqlFetch<any>(CUSTOMER_PORTAL_QUERY);
        
        if (data.orders) setOrders(data.orders);
        if (data.trips) setTrips(data.trips);
        if (data.invoices) setInvoices(data.invoices);
        
        setStats({
          totalOrders: data.orders?.length || 0,
          activeShipments: data.trips?.length || 0,
          pendingInvoices: data.invoices?.length || 0,
          totalSpent: data.orders?.reduce((sum: number, o: Order) => sum + (o.quotedAmount || 0), 0) || 0
        });
      } catch (customerErr) {
        console.log('Customer query failed, trying dashboard stats...');
        
        // Fallback to dashboard stats
        const dashData = await graphqlFetch<any>(DASHBOARD_STATS_QUERY);
        
        if (dashData.dashboardStats) {
          const ds = dashData.dashboardStats;
          setStats({
            totalOrders: ds.totalOrders || 0,
            activeShipments: ds.inTransitVehicles || 0,
            pendingInvoices: ds.pendingOrders || 0,
            totalSpent: ds.totalRevenue || 0
          });
        }
      }
    } catch (err) {
      console.error('Portal data fetch error:', err);
      setError('Failed to load portal data. Using demo mode.');
      
      // Demo fallback
      setStats({
        totalOrders: 24,
        activeShipments: 3,
        pendingInvoices: 2,
        totalSpent: 245000
      });
      
      setOrders([
        { id: '1', orderNumber: 'ORD-2024-001', status: 'DELIVERED', pickupCity: 'Mumbai', deliveryCity: 'Delhi', quotedAmount: 45000, createdAt: '2024-12-08' },
        { id: '2', orderNumber: 'ORD-2024-002', status: 'IN_TRANSIT', pickupCity: 'Pune', deliveryCity: 'Bangalore', quotedAmount: 32000, createdAt: '2024-12-09' },
        { id: '3', orderNumber: 'ORD-2024-003', status: 'PENDING', pickupCity: 'Chennai', deliveryCity: 'Hyderabad', quotedAmount: 28000, createdAt: '2024-12-10' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // STATUS BADGE
  // ═══════════════════════════════════════════════════════════════════════

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      'PENDING': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock },
      'CONFIRMED': { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: CheckCircle },
      'IN_TRANSIT': { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Truck },
      'DELIVERED': { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      'CANCELLED': { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle },
      'PAID': { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      'OVERDUE': { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle },
    };
    
    const config = statusConfig[status] || statusConfig['PENDING'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Portal</h1>
          <p className="text-slate-400 text-sm">Welcome, {user?.name || 'Customer'}</p>
        </div>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Package className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Orders</p>
              <p className="text-xl font-bold">{loading ? '...' : stats.totalOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Truck className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Active Shipments</p>
              <p className="text-xl font-bold">{loading ? '...' : stats.activeShipments}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Pending Invoices</p>
              <p className="text-xl font-bold">{loading ? '...' : stats.pendingInvoices}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <IndianRupee className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Spent</p>
              <p className="text-xl font-bold">₹{loading ? '...' : (stats.totalSpent / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['overview', 'orders', 'invoices', 'tracking'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-orange-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : activeTab === 'overview' ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Recent Orders</h3>
            {orders.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-slate-400">{order.pickupCity} → {order.deliveryCity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                      <p className="text-sm text-slate-400 mt-1">₹{order.quotedAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'orders' ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">All Orders</h3>
            {orders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-slate-400">{order.pickupCity} → {order.deliveryCity}</p>
                  <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(order.status)}
                  <p className="text-lg font-bold mt-1">₹{order.quotedAmount?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'invoices' ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Invoices</h3>
            {invoices.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No invoices</p>
            ) : (
              invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="font-medium">{inv.invoiceNumber}</p>
                    <p className="text-sm text-slate-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(inv.status)}
                    <p className="text-lg font-bold mt-1">₹{inv.totalAmount?.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Live Tracking</h3>
            {trips.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No active shipments to track</p>
            ) : (
              trips.map(trip => (
                <div key={trip.id} className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium">{trip.tripNumber}</p>
                    {getStatusBadge(trip.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Vehicle</p>
                      <p>{trip.vehicle?.vehicleNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Driver</p>
                      <p>{trip.driver?.user?.name || 'N/A'}</p>
                    </div>
                  </div>
                  {trip.driver?.user?.phone && (
                    <a 
                      href={`tel:${trip.driver.user.phone}`}
                      className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call Driver
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <button className="flex items-center justify-center gap-2 p-4 bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors">
          <Package className="w-5 h-5" />
          <span>New Order</span>
        </button>
        <button className="flex items-center justify-center gap-2 p-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
          <Phone className="w-5 h-5" />
          <span>Support</span>
        </button>
      </div>
    </div>
  );
}
