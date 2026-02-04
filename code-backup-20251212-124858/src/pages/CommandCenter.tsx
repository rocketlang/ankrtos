/**
 * ANKR Shell - Command Center v6 (Themed + Drawers)
 *
 * 🎯 Changes from v5:
 * - Uses useTheme() for all colors (respects theme settings)
 * - Drawer support for icon clicks (no navigation away)
 * - Same beautiful UI, now theme-aware
 *
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import { useState, lazy, Suspense } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, useThemeStyles } from '../contexts/ThemeContext';
import { BottomDrawer } from '../components/BottomDrawer';
import {
  Package, Truck, MapPin, CheckCircle, Receipt,
  FileText, Send, Clock, CreditCard, Camera,
  Search, Bot, Shield, Database, MessageCircle,
  AlertTriangle, TrendingUp, Users, ArrowRight,
  Mic, X, Sparkles, Zap, Bell, AlertCircle,
  HelpCircle, UserCircle, Eye, ChevronRight,
  Headphones, BookOpen, RefreshCw, Settings, Server,
  LayoutDashboard, Building, User, Wallet, BarChart3,
  Wrench, ChevronDown, Fuel, FileCheck, IndianRupee,
  Route, Calculator, PieChart, Star, Crown, Briefcase,
  ArrowLeftRight, QrCode, Target, Gavel, UserCheck,
  Globe, Repeat, Filter, Layers, Lock, Unlock,
  TrendingDown, DollarSign, Activity, Brain, Gauge
} from 'lucide-react';

// Lazy load pages for drawers
const Orders = lazy(() => import('./Orders'));
const Trips = lazy(() => import('./Trips'));
const Vehicles = lazy(() => import('./Vehicles'));
const Drivers = lazy(() => import('./Drivers'));
const Invoices = lazy(() => import('./Invoices'));
const GPSTracking = lazy(() => import('./GPSTracking'));

// ═══════════════════════════════════════════════════════════════════════════
// TYPES (same as before)
// ═══════════════════════════════════════════════════════════════════════════

type UserRole = 'super_admin' | 'tenant_admin' | 'ceo' | 'cfo' | 'cto' | 'coo' | 'ops_manager' | 'fleet_owner' | 'dispatcher' | 'accountant' | 'driver' | 'customer' | 'vendor';

interface Flow {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  steps: FlowStep[];
}

interface FlowStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  link: string;
  drawerType?: string; // NEW: which drawer to open
  badge?: number | string;
}

interface Category {
  id: string;
  title: string;
  titleHindi: string;
  icon: React.ReactNode;
  color: string;
  flows: Flow[];
  requiredRoles?: UserRole[];
}

// Drawer types
type DrawerType = 'orders' | 'trips' | 'vehicles' | 'drivers' | 'invoices' | 'tracking' | 'ocr' | 'whatsapp' | null;

// Map link paths to drawer types
const DRAWER_MAP: Record<string, DrawerType> = {
  '/orders': 'orders',
  '/orders/new': 'orders',
  '/trips': 'trips',
  '/vehicles': 'vehicles',
  '/drivers': 'drivers',
  '/invoices': 'invoices',
  '/invoices/new': 'invoices',
  '/gps-tracking': 'tracking',
  '/ocr': 'ocr',
  '/whatsapp': 'whatsapp',
};

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORIES (same structure, just reference)
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORIES: Category[] = [
  {
    id: 'operations',
    title: 'Operations',
    titleHindi: 'संचालन',
    icon: <Package className="w-5 h-5" />,
    color: 'blue',
    flows: [
      {
        id: 'freight',
        title: 'Freight Flow',
        subtitle: 'Order → Delivery',
        icon: <Package className="w-4 h-4" />,
        color: 'blue',
        steps: [
          { id: 'order', label: 'Order', icon: <Package className="w-5 h-5" />, link: '/orders' },
          { id: 'dispatch', label: 'Dispatch', icon: <Truck className="w-5 h-5" />, link: '/trips' },
          { id: 'track', label: 'Track', icon: <MapPin className="w-5 h-5" />, link: '/gps-tracking' },
          { id: 'deliver', label: 'Deliver', icon: <CheckCircle className="w-5 h-5" />, link: '/driver-app' },
          { id: 'invoice', label: 'Invoice', icon: <Receipt className="w-5 h-5" />, link: '/invoices' },
        ]
      },
      {
        id: 'financial',
        title: 'Financial Flow',
        subtitle: 'Invoice → Payment',
        icon: <CreditCard className="w-4 h-4" />,
        color: 'yellow',
        steps: [
          { id: 'invoice', label: 'Invoice', icon: <FileText className="w-5 h-5" />, link: '/invoices' },
          { id: 'send', label: 'Send', icon: <Send className="w-5 h-5" />, link: '/whatsapp' },
          { id: 'pending', label: 'Pending', icon: <Clock className="w-5 h-5" />, link: '/invoices?status=pending' },
          { id: 'payment', label: 'Payment', icon: <CreditCard className="w-5 h-5" />, link: '/payments' },
          { id: 'done', label: 'Done', icon: <CheckCircle className="w-5 h-5" />, link: '/invoices?status=paid' },
        ]
      },
      {
        id: 'document',
        title: 'Document Flow',
        subtitle: 'Scan → Verify',
        icon: <FileText className="w-4 h-4" />,
        color: 'purple',
        steps: [
          { id: 'scan', label: 'Scan', icon: <Camera className="w-5 h-5" />, link: '/ocr' },
          { id: 'ocr', label: 'OCR', icon: <Search className="w-5 h-5" />, link: '/ocr' },
          { id: 'ai', label: 'AI', icon: <Bot className="w-5 h-5" />, link: '/docchain' },
          { id: 'verify', label: 'Verify', icon: <Shield className="w-5 h-5" />, link: '/docchain' },
        ]
      },
      {
        id: 'communication',
        title: 'Communication',
        subtitle: 'Auto-notify',
        icon: <MessageCircle className="w-4 h-4" />,
        color: 'green',
        steps: [
          { id: 'event', label: 'Event', icon: <AlertTriangle className="w-5 h-5" />, link: '/events' },
          { id: 'template', label: 'Template', icon: <FileText className="w-5 h-5" />, link: '/whatsapp-admin' },
          { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-5 h-5" />, link: '/whatsapp' },
          { id: 'sent', label: 'Sent', icon: <CheckCircle className="w-5 h-5" />, link: '/whatsapp?status=sent' },
        ]
      },
    ]
  },
  {
    id: 'exchange',
    title: 'Freight Exchange',
    titleHindi: 'माल एक्सचेंज',
    icon: <ArrowLeftRight className="w-5 h-5" />,
    color: 'orange',
    flows: [
      {
        id: 'postLoad',
        title: 'Post Load',
        subtitle: 'Find Trucks',
        icon: <Package className="w-4 h-4" />,
        color: 'orange',
        steps: [
          { id: 'post', label: 'Post', icon: <Package className="w-5 h-5" />, link: '/exchange/post-load' },
          { id: 'match', label: 'Match', icon: <Search className="w-5 h-5" />, link: '/exchange/matches' },
          { id: 'select', label: 'Select', icon: <CheckCircle className="w-5 h-5" />, link: '/exchange/select' },
          { id: 'book', label: 'Book', icon: <UserCheck className="w-5 h-5" />, link: '/exchange/book' },
        ]
      },
      {
        id: 'postTruck',
        title: 'Post Truck',
        subtitle: 'Find Loads',
        icon: <Truck className="w-4 h-4" />,
        color: 'blue',
        steps: [
          { id: 'post', label: 'Post', icon: <Truck className="w-5 h-5" />, link: '/exchange/post-truck' },
          { id: 'find', label: 'Find', icon: <Search className="w-5 h-5" />, link: '/exchange/find-loads' },
          { id: 'bid', label: 'Bid', icon: <Gavel className="w-5 h-5" />, link: '/exchange/bid' },
          { id: 'won', label: 'Won', icon: <Target className="w-5 h-5" />, link: '/exchange/won' },
        ]
      },
      {
        id: 'liveBoard',
        title: 'Live Board',
        subtitle: 'Real-time',
        icon: <Globe className="w-4 h-4" />,
        color: 'green',
        steps: [
          { id: 'loads', label: 'Loads', icon: <Package className="w-5 h-5" />, link: '/exchange/live-loads' },
          { id: 'trucks', label: 'Trucks', icon: <Truck className="w-5 h-5" />, link: '/exchange/live-trucks' },
          { id: 'rates', label: 'Rates', icon: <TrendingUp className="w-5 h-5" />, link: '/exchange/market-rates' },
          { id: 'qr', label: 'QR', icon: <QrCode className="w-5 h-5" />, link: '/exchange/qr' },
        ]
      },
    ]
  },
  {
    id: 'fleet',
    title: 'Fleet & Team',
    titleHindi: 'बेड़ा और टीम',
    icon: <Truck className="w-5 h-5" />,
    color: 'cyan',
    flows: [
      {
        id: 'vehicles',
        title: 'Fleet Management',
        subtitle: 'Vehicles & Docs',
        icon: <Truck className="w-4 h-4" />,
        color: 'blue',
        steps: [
          { id: 'vehicles', label: 'Vehicles', icon: <Truck className="w-5 h-5" />, link: '/vehicles' },
          { id: 'fuel', label: 'Fuel', icon: <Fuel className="w-5 h-5" />, link: '/fuel' },
          { id: 'service', label: 'Service', icon: <Wrench className="w-5 h-5" />, link: '/maintenance' },
          { id: 'docs', label: 'Docs', icon: <FileCheck className="w-5 h-5" />, link: '/vehicle-docs' },
        ]
      },
      {
        id: 'drivers',
        title: 'Driver Management',
        subtitle: 'Team & Performance',
        icon: <Users className="w-4 h-4" />,
        color: 'cyan',
        steps: [
          { id: 'list', label: 'Drivers', icon: <Users className="w-5 h-5" />, link: '/drivers' },
          { id: 'assign', label: 'Assign', icon: <Route className="w-5 h-5" />, link: '/assign-driver' },
          { id: 'track', label: 'Track', icon: <MapPin className="w-5 h-5" />, link: '/driver-tracking' },
          { id: 'rating', label: 'Rating', icon: <Star className="w-5 h-5" />, link: '/driver-performance' },
        ]
      },
    ]
  },
  {
    id: 'business',
    title: 'Business',
    titleHindi: 'व्यापार',
    icon: <Briefcase className="w-5 h-5" />,
    color: 'emerald',
    flows: [
      {
        id: 'customers',
        title: 'Customers',
        subtitle: 'CRM & Contracts',
        icon: <Building className="w-4 h-4" />,
        color: 'emerald',
        steps: [
          { id: 'list', label: 'Customers', icon: <Building className="w-5 h-5" />, link: '/customers' },
          { id: 'contracts', label: 'Contracts', icon: <FileText className="w-5 h-5" />, link: '/contracts' },
          { id: 'rates', label: 'Rates', icon: <IndianRupee className="w-5 h-5" />, link: '/rates' },
          { id: 'ledger', label: 'Ledger', icon: <Wallet className="w-5 h-5" />, link: '/customer-ledger' },
        ]
      },
      {
        id: 'vendors',
        title: 'Vendors',
        subtitle: 'Partners & Payments',
        icon: <Briefcase className="w-4 h-4" />,
        color: 'pink',
        steps: [
          { id: 'list', label: 'Vendors', icon: <Briefcase className="w-5 h-5" />, link: '/vendors' },
          { id: 'rates', label: 'Rates', icon: <IndianRupee className="w-5 h-5" />, link: '/vendor-rates' },
          { id: 'payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" />, link: '/vendor-payments' },
          { id: 'ledger', label: 'Ledger', icon: <Wallet className="w-5 h-5" />, link: '/vendor-ledger' },
        ]
      },
    ]
  },
  {
    id: 'insights',
    title: 'Insights',
    titleHindi: 'अंतर्दृष्टि',
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'violet',
    flows: [
      {
        id: 'reports',
        title: 'Reports',
        subtitle: 'Analytics',
        icon: <BarChart3 className="w-4 h-4" />,
        color: 'violet',
        steps: [
          { id: 'dashboard', label: 'Dashboard', icon: <PieChart className="w-5 h-5" />, link: '/dashboard' },
          { id: 'operations', label: 'Operations', icon: <BarChart3 className="w-5 h-5" />, link: '/reports/operations' },
          { id: 'financial', label: 'Financial', icon: <TrendingUp className="w-5 h-5" />, link: '/reports/financial' },
          { id: 'export', label: 'Export', icon: <FileText className="w-5 h-5" />, link: '/reports/export' },
        ]
      },
      {
        id: 'kpis',
        title: 'KPIs',
        subtitle: 'Performance',
        icon: <Gauge className="w-4 h-4" />,
        color: 'amber',
        steps: [
          { id: 'revenue', label: 'Revenue', icon: <TrendingUp className="w-5 h-5" />, link: '/kpi/revenue' },
          { id: 'costs', label: 'Costs', icon: <TrendingDown className="w-5 h-5" />, link: '/kpi/costs' },
          { id: 'sla', label: 'SLA', icon: <Target className="w-5 h-5" />, link: '/kpi/sla' },
          { id: 'growth', label: 'Growth', icon: <Activity className="w-5 h-5" />, link: '/kpi/growth' },
        ]
      },
    ]
  },
  {
    id: 'system',
    title: 'System',
    titleHindi: 'सिस्टम',
    icon: <Settings className="w-5 h-5" />,
    color: 'gray',
    requiredRoles: ['super_admin', 'tenant_admin', 'cto'],
    flows: [
      {
        id: 'settings',
        title: 'Settings',
        subtitle: 'Configuration',
        icon: <Settings className="w-4 h-4" />,
        color: 'gray',
        steps: [
          { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" />, link: '/settings/profile' },
          { id: 'company', label: 'Company', icon: <Building className="w-5 h-5" />, link: '/settings/company' },
          { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" />, link: '/settings/users' },
          { id: 'integrate', label: 'Integrate', icon: <Zap className="w-5 h-5" />, link: '/settings/integrations' },
        ]
      },
      {
        id: 'admin',
        title: 'Admin',
        subtitle: 'Super Admin',
        icon: <Shield className="w-4 h-4" />,
        color: 'red',
        steps: [
          { id: 'tenants', label: 'Tenants', icon: <Building className="w-5 h-5" />, link: '/admin/tenants' },
          { id: 'billing', label: 'Billing', icon: <CreditCard className="w-5 h-5" />, link: '/admin/billing' },
          { id: 'system', label: 'System', icon: <Database className="w-5 h-5" />, link: '/admin/system' },
          { id: 'logs', label: 'Logs', icon: <FileText className="w-5 h-5" />, link: '/admin/logs' },
        ]
      },
      {
        id: 'help',
        title: 'Help',
        subtitle: 'Support',
        icon: <HelpCircle className="w-4 h-4" />,
        color: 'cyan',
        steps: [
          { id: 'search', label: 'Search', icon: <Search className="w-5 h-5" />, link: '/help' },
          { id: 'docs', label: 'Docs', icon: <BookOpen className="w-5 h-5" />, link: '/help/docs' },
          { id: 'bot', label: 'AI Bot', icon: <Bot className="w-5 h-5" />, link: '#bot' },
          { id: 'contact', label: 'Contact', icon: <Headphones className="w-5 h-5" />, link: '/help/contact' },
        ]
      },
      {
        id: 'devbrain',
        title: 'Health',
        subtitle: 'DevBrain',
        icon: <Brain className="w-4 h-4" />,
        color: 'purple',
        steps: [
          { id: 'health', label: 'Monitor', icon: <Activity className="w-5 h-5" />, link: '/system-health' },
          { id: 'services', label: 'Services', icon: <Server className="w-5 h-5" />, link: '/system-health' },
          { id: 'errors', label: 'Errors', icon: <AlertTriangle className="w-5 h-5" />, link: '/system-health' },
          { id: 'healing', label: 'Auto-Heal', icon: <Zap className="w-5 h-5" />, link: '/system-health' },
        ]
      }
    ]
  },
];

// Quick actions (same as before)
const QUICK_ACTIONS: Record<string, { icon: React.ReactNode; label: string; link: string; color: string }> = {
  order: { icon: <Package className="w-4 h-4" />, label: 'New Order', link: '/orders/new', color: 'blue' },
  dispatch: { icon: <Truck className="w-4 h-4" />, label: 'Dispatch', link: '/trips', color: 'green' },
  exchange: { icon: <ArrowLeftRight className="w-4 h-4" />, label: 'Exchange', link: '/exchange', color: 'orange' },
  invoice: { icon: <Receipt className="w-4 h-4" />, label: 'Invoice', link: '/invoices/new', color: 'yellow' },
  scan: { icon: <Camera className="w-4 h-4" />, label: 'Scan', link: '/ocr', color: 'purple' },
  reports: { icon: <BarChart3 className="w-4 h-4" />, label: 'Reports', link: '/dashboard', color: 'violet' },
  settings: { icon: <Settings className="w-4 h-4" />, label: 'Settings', link: '/settings', color: 'gray' },
};

// Role configs (simplified)
const ROLE_CONFIGS: Record<UserRole, { label: string; icon: React.ReactNode; color: string; greeting: string; greetingHindi: string; quickActions: string[] }> = {
  super_admin: { label: 'Super Admin', icon: <Crown className="w-4 h-4" />, color: 'red', greeting: 'Welcome, Commander', greetingHindi: 'स्वागत है, कमांडर', quickActions: ['order', 'dispatch', 'exchange', 'invoice', 'scan', 'reports', 'settings'] },
  tenant_admin: { label: 'Admin', icon: <Shield className="w-4 h-4" />, color: 'purple', greeting: 'Welcome, Admin', greetingHindi: 'स्वागत है, एडमिन', quickActions: ['order', 'dispatch', 'exchange', 'invoice', 'scan', 'reports', 'settings'] },
  ceo: { label: 'CEO', icon: <Crown className="w-4 h-4" />, color: 'amber', greeting: 'Welcome, Chief', greetingHindi: 'स्वागत है, चीफ', quickActions: ['reports', 'invoice'] },
  cfo: { label: 'CFO', icon: <IndianRupee className="w-4 h-4" />, color: 'green', greeting: 'Welcome, CFO', greetingHindi: 'स्वागत है, सीएफओ', quickActions: ['invoice', 'reports'] },
  cto: { label: 'CTO', icon: <Database className="w-4 h-4" />, color: 'blue', greeting: 'Welcome, CTO', greetingHindi: 'स्वागत है, सीटीओ', quickActions: ['settings', 'reports'] },
  coo: { label: 'COO', icon: <Activity className="w-4 h-4" />, color: 'orange', greeting: 'Welcome, COO', greetingHindi: 'स्वागत है, सीओओ', quickActions: ['order', 'dispatch', 'reports'] },
  ops_manager: { label: 'Ops Manager', icon: <Settings className="w-4 h-4" />, color: 'green', greeting: 'Welcome, Ops Lead', greetingHindi: 'स्वागत है, ऑप्स लीड', quickActions: ['order', 'dispatch', 'scan'] },
  fleet_owner: { label: 'Fleet Owner', icon: <Truck className="w-4 h-4" />, color: 'blue', greeting: 'Welcome, Partner', greetingHindi: 'स्वागत है, पार्टनर', quickActions: ['dispatch', 'reports'] },
  dispatcher: { label: 'Dispatcher', icon: <Route className="w-4 h-4" />, color: 'orange', greeting: 'Ready to Dispatch', greetingHindi: 'डिस्पैच के लिए तैयार', quickActions: ['dispatch', 'order'] },
  accountant: { label: 'Accounts', icon: <Calculator className="w-4 h-4" />, color: 'yellow', greeting: 'Welcome, Accounts', greetingHindi: 'स्वागत है, अकाउंट्स', quickActions: ['invoice', 'reports'] },
  driver: { label: 'Driver', icon: <User className="w-4 h-4" />, color: 'cyan', greeting: 'Safe Journey', greetingHindi: 'सुरक्षित यात्रा', quickActions: ['dispatch'] },
  customer: { label: 'Customer', icon: <Building className="w-4 h-4" />, color: 'emerald', greeting: 'Welcome', greetingHindi: 'स्वागत है', quickActions: ['order', 'invoice'] },
  vendor: { label: 'Vendor', icon: <Briefcase className="w-4 h-4" />, color: 'pink', greeting: 'Welcome, Partner', greetingHindi: 'स्वागत है, पार्टनर', quickActions: ['exchange'] },
};

// GraphQL
const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalOrders
      totalVehicles
      totalDrivers
      activeTrips
      pendingInvoices
      monthRevenue
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// THEMED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function DrawerLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>
  );
}

function FlowCard({ flow, onStepClick }: { flow: Flow; onStepClick: (step: FlowStep) => void }) {
  const { colors, isDark } = useTheme();
  
  return (
    <div 
      className="rounded-xl p-3 border transition-all"
      style={{ 
        backgroundColor: `${colors.bg.card}90`,
        borderColor: `${colors.border}50`
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-2 text-${flow.color}-400`}>
          {flow.icon}
          <span className="font-semibold text-sm" style={{ color: colors.text.primary }}>{flow.title}</span>
        </div>
        <span className="text-[10px]" style={{ color: colors.text.muted }}>{flow.subtitle}</span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {flow.steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => onStepClick(step)}
              className={`
                flex flex-col items-center p-2 rounded-lg border
                transition-all min-w-[60px] group hover:scale-105
              `}
              style={{
                borderColor: `${colors.border}50`,
                backgroundColor: 'transparent'
              }}
            >
              <div className={`text-${flow.color}-400 group-hover:scale-110 transition-transform`}>
                {step.icon}
              </div>
              <span className="text-[9px] mt-1" style={{ color: colors.text.muted }}>{step.label}</span>
            </button>
            {i < flow.steps.length - 1 && (
              <ArrowRight className="w-3 h-3 mx-0.5 flex-shrink-0" style={{ color: colors.text.muted }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CategorySection({ category, isExpanded, onToggle, onStepClick }: {
  category: Category;
  isExpanded: boolean;
  onToggle: () => void;
  onStepClick: (step: FlowStep) => void;
}) {
  const { colors } = useTheme();
  
  return (
    <div 
      className="backdrop-blur rounded-xl border overflow-hidden"
      style={{ 
        backgroundColor: `${colors.bg.card}30`,
        borderColor: `${colors.border}50`
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 transition-colors"
        style={{ backgroundColor: 'transparent' }}
      >
        <div className={`flex items-center gap-2 text-${category.color}-400`}>
          {category.icon}
          <span className="font-bold text-sm" style={{ color: colors.text.primary }}>{category.title}</span>
          <span className="text-[10px]" style={{ color: colors.text.muted }}>({category.flows.length})</span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          style={{ color: colors.text.muted }}
        />
      </button>

      {isExpanded && (
        <div className="p-3 pt-0 grid gap-2">
          {category.flows.map(flow => (
            <FlowCard key={flow.id} flow={flow} onStepClick={onStepClick} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuickActionsBar({ actions, onActionClick }: { actions: string[]; onActionClick: (link: string) => void }) {
  const { colors } = useTheme();
  
  return (
    <div 
      className="backdrop-blur rounded-xl p-3 border"
      style={{ 
        backgroundColor: `${colors.bg.card}30`,
        borderColor: `${colors.border}50`
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-xs font-semibold" style={{ color: colors.text.muted }}>QUICK ACTIONS</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {actions.map(actionId => {
          const action = QUICK_ACTIONS[actionId];
          if (!action) return null;
          return (
            <button
              key={actionId}
              onClick={() => onActionClick(action.link)}
              className={`
                flex flex-col items-center p-2.5 rounded-lg
                border min-w-[65px] transition-all hover:scale-105
              `}
              style={{
                backgroundColor: `${colors.bg.card}50`,
                borderColor: `${colors.border}50`
              }}
            >
              <span className={`text-${action.color}-400`}>{action.icon}</span>
              <span className="text-[9px] mt-1" style={{ color: colors.text.secondary }}>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CommandCenter() {
  const { user } = useAuth();
  const { colors, isDark, accent } = useTheme();
  const navigate = useNavigate();

  // Role management
  const actualRole = (user?.role as UserRole) || 'ops_manager';
  const [viewAsRole, setViewAsRole] = useState<UserRole>(actualRole);
  const roleConfig = ROLE_CONFIGS[viewAsRole];

  // Category expansion
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['operations', 'exchange']));

  // Drawer state
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);

  // GraphQL
  const { data: statsData, loading } = useQuery(GET_DASHBOARD_STATS, { pollInterval: 15000 });
  const stats = statsData?.dashboardStats || {};

  // Handlers
  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  };

  const handleStepClick = (step: FlowStep) => {
    const drawerType = DRAWER_MAP[step.link];
    if (drawerType) {
      setActiveDrawer(drawerType);
    } else {
      // No drawer for this, navigate normally
      navigate(step.link);
    }
  };

  const handleActionClick = (link: string) => {
    const drawerType = DRAWER_MAP[link];
    if (drawerType) {
      setActiveDrawer(drawerType);
    } else {
      navigate(link);
    }
  };

  const closeDrawer = () => setActiveDrawer(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: colors.bg.primary }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: colors.accent }} />
          <p style={{ color: colors.text.muted }}>Loading Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-3 space-y-3"
      style={{ backgroundColor: colors.bg.primary }}
    >
      {/* Header */}
      <div 
        className="backdrop-blur rounded-xl p-3 border relative z-50"
        style={{ 
          backgroundColor: `${colors.bg.card}50`,
          borderColor: `${colors.border}50`
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${colors.accent}, #8b5cf6)` }}
            >
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: colors.text.primary }}>
                WowTruck
                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">LIVE</span>
              </h1>
              <p className="text-xs" style={{ color: colors.text.muted }}>
                {roleConfig.greetingHindi} • <span style={{ color: colors.accent }}>{roleConfig.label}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              className="relative p-2 rounded-lg"
              style={{ backgroundColor: `${colors.bg.card}50` }}
            >
              <Bell className="w-5 h-5" style={{ color: colors.text.muted }} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">3</span>
            </button>

            {/* Stats */}
            <div 
              className="flex items-center gap-4 px-3 py-1.5 rounded-lg text-sm"
              style={{ backgroundColor: `${colors.bg.card}30` }}
            >
              <div className="text-center">
                <div className="font-bold text-blue-400">{stats?.totalOrders || 0}</div>
                <div className="text-[9px]" style={{ color: colors.text.muted }}>Orders</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-400">{stats?.activeTrips || 0}</div>
                <div className="text-[9px]" style={{ color: colors.text.muted }}>Active</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-yellow-400">₹{((stats?.monthRevenue || 0) / 1000).toFixed(0)}K</div>
                <div className="text-[9px]" style={{ color: colors.text.muted }}>Revenue</div>
              </div>
            </div>

            <button
              className="flex items-center gap-2 px-3 py-2 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all"
              style={{ background: `linear-gradient(135deg, ${colors.accent}, #8b5cf6)` }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Help</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActionsBar actions={roleConfig.quickActions} onActionClick={handleActionClick} />

      {/* Categories */}
      <div className="space-y-2">
        {CATEGORIES.map(category => (
          <CategorySection
            key={category.id}
            category={category}
            isExpanded={expandedCategories.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
            onStepClick={handleStepClick}
          />
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { value: stats.totalOrders || 0, label: 'Orders', icon: <Package className="w-5 h-5" />, color: 'blue' },
          { value: stats.totalVehicles || 0, label: 'Fleet', icon: <Truck className="w-5 h-5" />, color: 'green' },
          { value: stats.totalDrivers || 0, label: 'Drivers', icon: <Users className="w-5 h-5" />, color: 'purple' },
          { value: `₹${((stats.monthRevenue || 0) / 1000).toFixed(0)}K`, label: 'Revenue', icon: <TrendingUp className="w-5 h-5" />, color: 'orange' },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="backdrop-blur rounded-xl p-3 border"
            style={{ 
              backgroundColor: `${colors.bg.card}30`,
              borderColor: `${colors.border}50`
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
                <div className="text-xs" style={{ color: colors.text.muted }}>{stat.label}</div>
              </div>
              <div className={`text-${stat.color}-400/50`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Bot Button */}
      <button
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-40"
        style={{ background: `linear-gradient(135deg, ${colors.accent}, #8b5cf6)` }}
      >
        <Bot className="w-6 h-6 text-white" />
      </button>

      {/* Footer */}
      <div className="text-center text-[10px] py-2" style={{ color: colors.text.muted }}>
        🙏 Jai Guru Ji | ANKR Shell v6 | © 2025 ANKR Labs
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* DRAWERS - Open on top, user stays in Command Center */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      <BottomDrawer isOpen={activeDrawer === 'orders'} onClose={closeDrawer} title="📦 Orders" height="large">
        <Suspense fallback={<DrawerLoading />}><Orders /></Suspense>
      </BottomDrawer>

      <BottomDrawer isOpen={activeDrawer === 'trips'} onClose={closeDrawer} title="🚛 Trips" height="large">
        <Suspense fallback={<DrawerLoading />}><Trips /></Suspense>
      </BottomDrawer>

      <BottomDrawer isOpen={activeDrawer === 'vehicles'} onClose={closeDrawer} title="🚚 Vehicles" height="large">
        <Suspense fallback={<DrawerLoading />}><Vehicles /></Suspense>
      </BottomDrawer>

      <BottomDrawer isOpen={activeDrawer === 'drivers'} onClose={closeDrawer} title="👤 Drivers" height="large">
        <Suspense fallback={<DrawerLoading />}><Drivers /></Suspense>
      </BottomDrawer>

      <BottomDrawer isOpen={activeDrawer === 'invoices'} onClose={closeDrawer} title="📄 Invoices" height="large">
        <Suspense fallback={<DrawerLoading />}><Invoices /></Suspense>
      </BottomDrawer>

      <BottomDrawer isOpen={activeDrawer === 'tracking'} onClose={closeDrawer} title="📍 Live Tracking" height="full">
        <Suspense fallback={<DrawerLoading />}><GPSTracking /></Suspense>
      </BottomDrawer>
    </div>
  );
}
