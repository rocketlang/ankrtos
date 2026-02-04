/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WowTruck 2.0 - Analytics Dashboard with RBAC
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Role-based widget visibility
 * - Real-time analytics charts (Recharts)
 * - Glass-effect themed cards
 * - KPI tiles with trend indicators
 * - i18n support
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Truck, Package, Users, Building2,
  IndianRupee, MapPin, Clock, CheckCircle, AlertTriangle, Activity,
  Zap, Eye, FileText, Navigation
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AICommandBar } from '../components/AICommandBar';

// ═══════════════════════════════════════════════════════════════════════════
// GRAPHQL QUERIES
// ═══════════════════════════════════════════════════════════════════════════

const GET_DASHBOARD_ANALYTICS = gql`
  query GetDashboardAnalytics {
    vehicles { id status vehicleNumber }
    drivers { id name status }
    orders { id status createdAt totalAmount }
    customers { id name }
    trips { id status startTime endTime }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type UserRole = 'super_admin' | 'branch_manager' | 'dispatcher' | 'accountant' | 'driver' | 'customer';

interface DashboardProps {
  userRole?: UserRole;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA FOR CHARTS (Replace with real API data)
// ═══════════════════════════════════════════════════════════════════════════

const revenueData = [
  { name: 'Mon', revenue: 42000, orders: 12 },
  { name: 'Tue', revenue: 53000, orders: 18 },
  { name: 'Wed', revenue: 48000, orders: 15 },
  { name: 'Thu', revenue: 61000, orders: 22 },
  { name: 'Fri', revenue: 55000, orders: 19 },
  { name: 'Sat', revenue: 67000, orders: 25 },
  { name: 'Sun', revenue: 45000, orders: 14 },
];

const fleetStatusData = [
  { name: 'Active', value: 45, color: '#22c55e' },
  { name: 'In Transit', value: 28, color: '#3b82f6' },
  { name: 'Maintenance', value: 8, color: '#f59e0b' },
  { name: 'Inactive', value: 12, color: '#6b7280' },
];

const orderTrendData = [
  { name: 'Week 1', pending: 24, completed: 45, cancelled: 3 },
  { name: 'Week 2', pending: 18, completed: 52, cancelled: 5 },
  { name: 'Week 3', pending: 32, completed: 48, cancelled: 2 },
  { name: 'Week 4', pending: 15, completed: 61, cancelled: 4 },
];

// ═══════════════════════════════════════════════════════════════════════════
// ROLE-BASED WIDGET CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const ROLE_WIDGETS: Record<UserRole, string[]> = {
  super_admin: ['kpis', 'revenue', 'fleet', 'orders', 'actions', 'system'],
  branch_manager: ['kpis', 'revenue', 'fleet', 'orders', 'actions'],
  dispatcher: ['kpis', 'fleet', 'orders', 'actions'],
  accountant: ['kpis', 'revenue', 'invoices'],
  driver: ['myTrips', 'earnings', 'actions'],
  customer: ['myOrders', 'tracking'],
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function Dashboard({ userRole = 'super_admin' }: DashboardProps) {
  const { theme, colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { data, loading } = useQuery(GET_DASHBOARD_ANALYTICS);
  const [aiActions, setAIActions] = useState<any[]>([]);

  // Allowed widgets for this role
  const allowedWidgets = ROLE_WIDGETS[userRole] || ROLE_WIDGETS.customer;

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED STATS
  // ═══════════════════════════════════════════════════════════════════════════

  const stats = useMemo(() => {
    const vehicles = data?.vehicles || [];
    const drivers = data?.drivers || [];
    const orders = data?.orders || [];
    const customers = data?.customers || [];
    const trips = data?.trips || [];

    const activeVehicles = vehicles.filter((v: any) => v.status === 'ACTIVE').length;
    const inTransitVehicles = vehicles.filter((v: any) => v.status === 'IN_TRANSIT').length;
    const pendingOrders = orders.filter((o: any) => o.status === 'PENDING').length;
    const completedOrders = orders.filter((o: any) => o.status === 'DELIVERED').length;
    const activeTrips = trips.filter((t: any) => t.status === 'IN_PROGRESS').length;

    // Calculate revenue (mock calculation)
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

    return {
      totalVehicles: vehicles.length,
      activeVehicles,
      inTransitVehicles,
      totalDrivers: drivers.length,
      totalOrders: orders.length,
      pendingOrders,
      completedOrders,
      totalCustomers: customers.length,
      activeTrips,
      totalRevenue,
      // Trends (mock - would come from API comparing periods)
      vehicleTrend: 5,
      orderTrend: 12,
      revenueTrend: 8,
      customerTrend: 3,
    };
  }, [data]);

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLING
  // ═══════════════════════════════════════════════════════════════════════════

  // Glass card styling
  const glassCard = `
    backdrop-blur-md 
    ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}
    border rounded-xl
  `;

  const cardTitle = `text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`;
  const cardValue = `text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`;
  const subtleText = isDark ? 'text-gray-400' : 'text-gray-500';

  // Chart colors based on theme
  const chartColors = {
    primary: isDark ? '#22c55e' : '#16a34a',
    secondary: isDark ? '#3b82f6' : '#2563eb',
    accent: isDark ? '#f97316' : '#ea580c',
    muted: isDark ? '#6b7280' : '#9ca3af',
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // KPI CARD COMPONENT
  // ═══════════════════════════════════════════════════════════════════════════

  const KPICard = ({ 
    icon: Icon, 
    label, 
    value, 
    trend, 
    trendLabel,
    color,
    linkTo 
  }: {
    icon: any;
    label: string;
    value: string | number;
    trend?: number;
    trendLabel?: string;
    color: string;
    linkTo?: string;
  }) => {
    const content = (
      <div className={`${glassCard} p-4 hover:scale-[1.02] transition-transform cursor-pointer`}>
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className="mt-3">
          <div className={cardValue}>{value}</div>
          <div className={cardTitle}>{label}</div>
          {trendLabel && <div className={`text-xs mt-1 ${subtleText}`}>{trendLabel}</div>}
        </div>
      </div>
    );

    return linkTo ? <Link to={linkTo}>{content}</Link> : content;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CHART CARD COMPONENT
  // ═══════════════════════════════════════════════════════════════════════════

  const ChartCard = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
    <div className={`${glassCard} p-4 ${className}`}>
      <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      {children}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 animate-pulse text-orange-500" />
          <span className={`text-lg ${subtleText}`}>{t('common.loading') || 'Loading analytics...'}</span>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className={`${glassCard} p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              🚛 {t('dashboard.title') || 'WowTruck Dashboard'}
            </h1>
            <p className={`text-sm ${subtleText}`}>
              {t('dashboard.subtitle') || 'Transport Management System'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
              ● Live
            </span>
            <span className={`text-xs ${subtleText}`}>
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          AI COMMAND BAR
          ═══════════════════════════════════════════════════════════════════ */}
      <AICommandBar
        onIntentParsed={(intent) => console.log('Intent:', intent)}
        onActionExecuted={(action) => setAIActions(prev => [action, ...prev.slice(0, 19)])}
        guruUrl="http://localhost:4020"
        eonUrl="http://localhost:4005"
        simUrl="http://localhost:4010"
      />

      {/* ═══════════════════════════════════════════════════════════════════
          REVENUE CHART - Only for admin/accountant
          ═══════════════════════════════════════════════════════════════════ */}
      {allowedWidgets.includes('revenue') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Trend */}
          <ChartCard title="📈 Revenue Trend (This Week)" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="name" stroke={subtleText} fontSize={12} />
                <YAxis stroke={subtleText} fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={chartColors.primary} 
                  fill="url(#revenueGradient)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Revenue Summary */}
          <ChartCard title="💰 Revenue Summary">
            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                <div className={`text-sm ${subtleText}`}>This Week</div>
                <div className="text-2xl font-bold text-green-500">₹3,71,000</div>
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12% vs last week
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <div className={`text-sm ${subtleText}`}>This Month</div>
                <div className="text-2xl font-bold text-blue-500">₹14,85,000</div>
                <div className="text-xs text-blue-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +8% vs last month
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                <div className={`text-sm ${subtleText}`}>Outstanding</div>
                <div className="text-2xl font-bold text-orange-500">₹2,45,000</div>
                <div className="text-xs text-orange-400">12 pending invoices</div>
              </div>
            </div>
          </ChartCard>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FLEET & ORDERS CHARTS
          ═══════════════════════════════════════════════════════════════════ */}
      {(allowedWidgets.includes('fleet') || allowedWidgets.includes('orders')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Fleet Status Pie */}
          {allowedWidgets.includes('fleet') && (
            <ChartCard title="🚛 Fleet Status">
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={fleetStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {fleetStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => <span className={subtleText}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}

          {/* Order Trends Bar */}
          {allowedWidgets.includes('orders') && (
            <ChartCard title="📦 Order Trends (Last 4 Weeks)">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={orderTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="name" stroke={subtleText} fontSize={12} />
                  <YAxis stroke={subtleText} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="completed" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" fill={chartColors.accent} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" fill={chartColors.muted} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          KPI CARDS - Role filtered
          ═══════════════════════════════════════════════════════════════════ */}
      {allowedWidgets.includes('kpis') && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard
            icon={Truck}
            label={t('dashboard.totalFleet') || 'Total Fleet'}
            value={stats.totalVehicles}
            trend={stats.vehicleTrend}
            trendLabel="vs last month"
            color="bg-blue-500"
            linkTo="/vehicles"
          />
          <KPICard
            icon={CheckCircle}
            label={t('dashboard.active') || 'Active'}
            value={stats.activeVehicles}
            color="bg-green-500"
            linkTo="/vehicles?status=active"
          />
          <KPICard
            icon={Package}
            label={t('dashboard.pendingOrders') || 'Pending Orders'}
            value={stats.pendingOrders}
            color="bg-yellow-500"
            linkTo="/orders?status=pending"
          />
          <KPICard
            icon={Package}
            label={t('dashboard.totalOrders') || 'Total Orders'}
            value={stats.totalOrders}
            trend={stats.orderTrend}
            trendLabel="vs last week"
            color="bg-orange-500"
            linkTo="/orders"
          />
          <KPICard
            icon={Users}
            label={t('dashboard.drivers') || 'Drivers'}
            value={stats.totalDrivers}
            color="bg-purple-500"
            linkTo="/drivers"
          />
          <KPICard
            icon={Building2}
            label={t('dashboard.customers') || 'Customers'}
            value={stats.totalCustomers}
            trend={stats.customerTrend}
            color="bg-pink-500"
            linkTo="/customers"
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          QUICK ACTIONS - Role based
          ═══════════════════════════════════════════════════════════════════ */}
      {allowedWidgets.includes('actions') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/orders/new" className={`${glassCard} p-4 hover:scale-[1.02] transition-transform text-center`}>
            <Package className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>New Order</div>
            <div className={`text-xs ${subtleText}`}>Create booking</div>
          </Link>
          <Link to="/trips" className={`${glassCard} p-4 hover:scale-[1.02] transition-transform text-center`}>
            <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Dispatch</div>
            <div className={`text-xs ${subtleText}`}>Assign vehicles</div>
          </Link>
          <Link to="/fleet" className={`${glassCard} p-4 hover:scale-[1.02] transition-transform text-center`}>
            <Navigation className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Live Track</div>
            <div className={`text-xs ${subtleText}`}>Fleet monitoring</div>
          </Link>
          <Link to="/invoices" className={`${glassCard} p-4 hover:scale-[1.02] transition-transform text-center`}>
            <FileText className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Invoices</div>
            <div className={`text-xs ${subtleText}`}>Billing & payments</div>
          </Link>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SYSTEM STATUS - Admin only
          ═══════════════════════════════════════════════════════════════════ */}
      {allowedWidgets.includes('system') && (
        <ChartCard title="⚡ System Status">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>API Server</div>
                <div className={`text-xs ${subtleText}`}>Healthy • 12ms</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Database</div>
                <div className={`text-xs ${subtleText}`}>Connected • 5ms</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>GPS Server</div>
                <div className={`text-xs ${subtleText}`}>Online • 93 devices</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
              <div>
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Services</div>
                <div className={`text-xs ${subtleText}`}>Warming up...</div>
              </div>
            </div>
          </div>
        </ChartCard>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════════ */}
      <div className={`text-center text-xs ${subtleText} py-4`}>
        <span>🙏 Jai Guru Ji</span>
        <span className="mx-2">•</span>
        <span>WowTruck 2.0 powered by ANKR Labs</span>
        <span className="mx-2">•</span>
        <span>Role: {userRole}</span>
      </div>
    </div>
  );
}
