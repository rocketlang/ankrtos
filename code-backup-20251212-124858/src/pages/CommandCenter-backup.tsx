/**
 * ANKR Shell - Command Center v5
 * 
 * 🎯 Philosophy: Show richness NOW, filter by RBAC/ABAC LATER
 * 
 * Features:
 * - 6 Category Groups (Operations, Exchange, Fleet, Business, Insights, System)
 * - Freight Exchange Flow (NEW!)
 * - RBAC/ABAC Ready (reads from auth context)
 * - Fixed z-index for dropdowns
 * - Role-based dashboard views
 * 
 * Security Stack: OAuth 2.0 + IAM + RBAC + ABAC
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Package, Truck, MapPin, CheckCircle, Receipt, 
  FileText, Send, Clock, CreditCard, Camera,
  Search, Bot, Shield, Database, MessageCircle,
  AlertTriangle, TrendingUp, Users, ArrowRight,
  Mic, X, Sparkles, Zap, Bell, AlertCircle,
  HelpCircle, UserCircle, Eye, ChevronRight,
  Headphones, BookOpen, RefreshCw, Settings, 
  LayoutDashboard, Building, User, Wallet, BarChart3, 
  Wrench, ChevronDown, Fuel, FileCheck, IndianRupee, 
  Route, Calculator, PieChart, Star, Crown, Briefcase,
  ArrowLeftRight, QrCode, Target, Gavel, UserCheck,
  Globe, Repeat, Filter, Layers, Lock, Unlock,
  TrendingDown, DollarSign, Activity, Gauge
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type UserRole = 
  | 'super_admin' | 'tenant_admin' 
  | 'ceo' | 'cfo' | 'cto' | 'coo'
  | 'ops_manager' | 'fleet_owner' | 'dispatcher' | 'accountant'
  | 'driver' | 'customer' | 'vendor';

type Permission = 'view' | 'edit' | 'admin' | 'none';

interface Category {
  id: string;
  title: string;
  titleHindi: string;
  icon: React.ReactNode;
  color: string;
  flows: Flow[];
  requiredRoles?: UserRole[];
  requiredPermission?: string;
}

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
  badge?: number | string;
  status?: 'idle' | 'active' | 'waiting' | 'complete' | 'alert';
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

const ROLE_CONFIGS: Record<UserRole, {
  label: string;
  icon: React.ReactNode;
  color: string;
  greeting: string;
  greetingHindi: string;
  categories: string[];
  quickActions: string[];
}> = {
  super_admin: {
    label: 'Super Admin',
    icon: <Crown className="w-4 h-4" />,
    color: 'red',
    greeting: 'Welcome, Commander',
    greetingHindi: 'स्वागत है, कमांडर',
    categories: ['operations', 'exchange', 'fleet', 'business', 'insights', 'system'],
    quickActions: ['order', 'dispatch', 'exchange', 'invoice', 'scan', 'reports', 'settings'],
  },
  tenant_admin: {
    label: 'Admin',
    icon: <Shield className="w-4 h-4" />,
    color: 'purple',
    greeting: 'Welcome, Admin',
    greetingHindi: 'स्वागत है, एडमिन',
    categories: ['operations', 'exchange', 'fleet', 'business', 'insights', 'system'],
    quickActions: ['order', 'dispatch', 'exchange', 'invoice', 'scan', 'reports', 'settings'],
  },
  ceo: {
    label: 'CEO',
    icon: <Crown className="w-4 h-4" />,
    color: 'amber',
    greeting: 'Welcome, Chief',
    greetingHindi: 'स्वागत है, चीफ',
    categories: ['insights', 'operations', 'business'],
    quickActions: ['dashboard', 'reports', 'revenue', 'alerts'],
  },
  cfo: {
    label: 'CFO',
    icon: <IndianRupee className="w-4 h-4" />,
    color: 'green',
    greeting: 'Welcome, CFO',
    greetingHindi: 'स्वागत है, सीएफओ',
    categories: ['insights', 'business', 'operations'],
    quickActions: ['revenue', 'cashflow', 'invoices', 'gst', 'reports'],
  },
  cto: {
    label: 'CTO',
    icon: <Database className="w-4 h-4" />,
    color: 'blue',
    greeting: 'Welcome, CTO',
    greetingHindi: 'स्वागत है, सीटीओ',
    categories: ['system', 'insights'],
    quickActions: ['system', 'apis', 'logs', 'integrations'],
  },
  coo: {
    label: 'COO',
    icon: <Activity className="w-4 h-4" />,
    color: 'orange',
    greeting: 'Welcome, COO',
    greetingHindi: 'स्वागत है, सीओओ',
    categories: ['operations', 'fleet', 'exchange', 'insights'],
    quickActions: ['operations', 'fleet', 'sla', 'reports'],
  },
  ops_manager: {
    label: 'Ops Manager',
    icon: <Settings className="w-4 h-4" />,
    color: 'green',
    greeting: 'Welcome, Ops Lead',
    greetingHindi: 'स्वागत है, ऑप्स लीड',
    categories: ['operations', 'exchange', 'fleet'],
    quickActions: ['order', 'dispatch', 'track', 'scan', 'whatsapp'],
  },
  fleet_owner: {
    label: 'Fleet Owner',
    icon: <Truck className="w-4 h-4" />,
    color: 'blue',
    greeting: 'Welcome, Partner',
    greetingHindi: 'स्वागत है, पार्टनर',
    categories: ['fleet', 'exchange', 'operations'],
    quickActions: ['vehicles', 'drivers', 'fuel', 'earnings', 'postTruck'],
  },
  dispatcher: {
    label: 'Dispatcher',
    icon: <Route className="w-4 h-4" />,
    color: 'orange',
    greeting: 'Ready to Dispatch',
    greetingHindi: 'डिस्पैच के लिए तैयार',
    categories: ['operations', 'fleet'],
    quickActions: ['dispatch', 'track', 'whatsapp', 'drivers'],
  },
  accountant: {
    label: 'Accounts',
    icon: <Calculator className="w-4 h-4" />,
    color: 'yellow',
    greeting: 'Welcome, Accounts',
    greetingHindi: 'स्वागत है, अकाउंट्स',
    categories: ['business', 'insights'],
    quickActions: ['invoice', 'payment', 'ledger', 'gst', 'reports'],
  },
  driver: {
    label: 'Driver',
    icon: <User className="w-4 h-4" />,
    color: 'cyan',
    greeting: 'Safe Journey',
    greetingHindi: 'सुरक्षित यात्रा',
    categories: ['operations'],
    quickActions: ['myTrips', 'epod', 'expense', 'navigate', 'help'],
  },
  customer: {
    label: 'Customer',
    icon: <Building className="w-4 h-4" />,
    color: 'emerald',
    greeting: 'Welcome',
    greetingHindi: 'स्वागत है',
    categories: ['operations', 'business'],
    quickActions: ['book', 'track', 'documents', 'invoices', 'support'],
  },
  vendor: {
    label: 'Vendor',
    icon: <Briefcase className="w-4 h-4" />,
    color: 'pink',
    greeting: 'Welcome, Partner',
    greetingHindi: 'स्वागत है, पार्टनर',
    categories: ['exchange', 'operations'],
    quickActions: ['findLoads', 'bid', 'trips', 'pod', 'payments'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY & FLOW DEFINITIONS
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
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

const QUICK_ACTIONS: Record<string, { icon: React.ReactNode; label: string; link: string; color: string }> = {
  order: { icon: <Package className="w-4 h-4" />, label: 'New Order', link: '/orders/new', color: 'blue' },
  dispatch: { icon: <Truck className="w-4 h-4" />, label: 'Dispatch', link: '/trips', color: 'green' },
  exchange: { icon: <ArrowLeftRight className="w-4 h-4" />, label: 'Exchange', link: '/exchange', color: 'orange' },
  invoice: { icon: <Receipt className="w-4 h-4" />, label: 'Invoice', link: '/invoices/new', color: 'yellow' },
  scan: { icon: <Camera className="w-4 h-4" />, label: 'Scan', link: '/ocr', color: 'purple' },
  whatsapp: { icon: <MessageCircle className="w-4 h-4" />, label: 'WhatsApp', link: '/whatsapp', color: 'green' },
  track: { icon: <MapPin className="w-4 h-4" />, label: 'Track', link: '/gps-tracking', color: 'red' },
  reports: { icon: <BarChart3 className="w-4 h-4" />, label: 'Reports', link: '/dashboard', color: 'violet' },
  settings: { icon: <Settings className="w-4 h-4" />, label: 'Settings', link: '/settings', color: 'gray' },
  dashboard: { icon: <PieChart className="w-4 h-4" />, label: 'Dashboard', link: '/dashboard', color: 'blue' },
  revenue: { icon: <TrendingUp className="w-4 h-4" />, label: 'Revenue', link: '/kpi/revenue', color: 'green' },
  alerts: { icon: <Bell className="w-4 h-4" />, label: 'Alerts', link: '/alerts', color: 'red' },
  vehicles: { icon: <Truck className="w-4 h-4" />, label: 'Vehicles', link: '/vehicles', color: 'blue' },
  drivers: { icon: <Users className="w-4 h-4" />, label: 'Drivers', link: '/drivers', color: 'cyan' },
  fuel: { icon: <Fuel className="w-4 h-4" />, label: 'Fuel', link: '/fuel', color: 'amber' },
  earnings: { icon: <IndianRupee className="w-4 h-4" />, label: 'Earnings', link: '/earnings', color: 'emerald' },
  postTruck: { icon: <Truck className="w-4 h-4" />, label: 'Post Truck', link: '/exchange/post-truck', color: 'orange' },
  findLoads: { icon: <Search className="w-4 h-4" />, label: 'Find Loads', link: '/exchange/find-loads', color: 'blue' },
  bid: { icon: <Gavel className="w-4 h-4" />, label: 'Bid', link: '/exchange/bid', color: 'purple' },
  payment: { icon: <CreditCard className="w-4 h-4" />, label: 'Payment', link: '/payments', color: 'green' },
  ledger: { icon: <Wallet className="w-4 h-4" />, label: 'Ledger', link: '/ledger', color: 'indigo' },
  gst: { icon: <FileText className="w-4 h-4" />, label: 'GST', link: '/gst', color: 'rose' },
  cashflow: { icon: <Activity className="w-4 h-4" />, label: 'Cashflow', link: '/cashflow', color: 'cyan' },
  invoices: { icon: <Receipt className="w-4 h-4" />, label: 'Invoices', link: '/invoices', color: 'yellow' },
  system: { icon: <Database className="w-4 h-4" />, label: 'System', link: '/admin/system', color: 'gray' },
  apis: { icon: <Zap className="w-4 h-4" />, label: 'APIs', link: '/admin/apis', color: 'blue' },
  logs: { icon: <FileText className="w-4 h-4" />, label: 'Logs', link: '/admin/logs', color: 'slate' },
  integrations: { icon: <Zap className="w-4 h-4" />, label: 'Integrations', link: '/settings/integrations', color: 'purple' },
  operations: { icon: <Package className="w-4 h-4" />, label: 'Ops', link: '/operations', color: 'blue' },
  fleet: { icon: <Truck className="w-4 h-4" />, label: 'Fleet', link: '/vehicles', color: 'cyan' },
  sla: { icon: <Target className="w-4 h-4" />, label: 'SLA', link: '/kpi/sla', color: 'orange' },
  myTrips: { icon: <Route className="w-4 h-4" />, label: 'My Trips', link: '/my-trips', color: 'blue' },
  epod: { icon: <FileCheck className="w-4 h-4" />, label: 'ePOD', link: '/epod', color: 'green' },
  expense: { icon: <IndianRupee className="w-4 h-4" />, label: 'Expense', link: '/expenses', color: 'yellow' },
  navigate: { icon: <MapPin className="w-4 h-4" />, label: 'Navigate', link: '/navigate', color: 'red' },
  help: { icon: <HelpCircle className="w-4 h-4" />, label: 'Help', link: '/help', color: 'cyan' },
  book: { icon: <Package className="w-4 h-4" />, label: 'Book', link: '/book', color: 'blue' },
  documents: { icon: <FileText className="w-4 h-4" />, label: 'Documents', link: '/my-documents', color: 'purple' },
  support: { icon: <Headphones className="w-4 h-4" />, label: 'Support', link: '/support', color: 'cyan' },
  trips: { icon: <Truck className="w-4 h-4" />, label: 'Trips', link: '/vendor-trips', color: 'blue' },
  pod: { icon: <FileCheck className="w-4 h-4" />, label: 'POD', link: '/pod-upload', color: 'green' },
  payments: { icon: <CreditCard className="w-4 h-4" />, label: 'Payments', link: '/my-payments', color: 'emerald' },
};

// ═══════════════════════════════════════════════════════════════════════════
// GRAPHQL
// ═══════════════════════════════════════════════════════════════════════════

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
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function RoleSwitcher({ currentRole, onSwitch, isAdmin }: { 
  currentRole: UserRole; 
  onSwitch: (role: UserRole) => void;
  isAdmin: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!isAdmin) return null;
  
  const config = ROLE_CONFIGS[currentRole];
  
  return (
    <div className="relative z-[100]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg text-sm hover:bg-gray-700`}
      >
        <span className={`text-${config.color}-400`}>{config.icon}</span>
        <span className="text-white">{config.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[99]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 right-0 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-[100] overflow-hidden max-h-[70vh] overflow-y-auto">
            <div className="p-2 border-b border-gray-700 text-xs text-gray-500 sticky top-0 bg-gray-800">
              Preview as role:
            </div>
            {Object.entries(ROLE_CONFIGS).map(([role, cfg]) => (
              <button
                key={role}
                onClick={() => { onSwitch(role as UserRole); setIsOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700 ${
                  role === currentRole ? 'bg-gray-700 text-white' : 'text-gray-300'
                }`}
              >
                <span className={`text-${cfg.color}-400`}>{cfg.icon}</span>
                {cfg.label}
                {role === currentRole && <CheckCircle className="w-3 h-3 ml-auto text-green-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FlowCard({ flow }: { flow: Flow }) {
  return (
    <div className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/50 hover:border-gray-600 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-2 text-${flow.color}-400`}>
          {flow.icon}
          <span className="font-semibold text-sm text-white">{flow.title}</span>
        </div>
        <span className="text-[10px] text-gray-500">{flow.subtitle}</span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {flow.steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <Link
              to={step.link}
              className={`
                flex flex-col items-center p-2 rounded-lg border border-gray-700/50
                hover:border-${flow.color}-500/50 hover:bg-${flow.color}-500/10
                transition-all min-w-[60px] group
              `}
            >
              <div className={`text-${flow.color}-400 group-hover:scale-110 transition-transform`}>
                {step.icon}
              </div>
              <span className="text-[9px] text-gray-400 mt-1">{step.label}</span>
            </Link>
            {i < flow.steps.length - 1 && (
              <ArrowRight className="w-3 h-3 text-gray-600 mx-0.5 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CategorySection({ category, isExpanded, onToggle }: { 
  category: Category; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-gray-800/30 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 hover:bg-gray-700/30 transition-colors`}
      >
        <div className={`flex items-center gap-2 text-${category.color}-400`}>
          {category.icon}
          <span className="font-bold text-sm text-white">{category.title}</span>
          <span className="text-[10px] text-gray-500">({category.flows.length})</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      {isExpanded && (
        <div className="p-3 pt-0 grid gap-2">
          {category.flows.map(flow => (
            <FlowCard key={flow.id} flow={flow} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuickActionsBar({ actions }: { actions: string[] }) {
  return (
    <div className="bg-gray-800/30 backdrop-blur rounded-xl p-3 border border-gray-700/50">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-xs font-semibold text-gray-400">QUICK ACTIONS</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {actions.map(actionId => {
          const action = QUICK_ACTIONS[actionId];
          if (!action) return null;
          return (
            <Link
              key={actionId}
              to={action.link}
              className={`
                flex flex-col items-center p-2.5 rounded-lg 
                bg-gray-700/30 hover:bg-gray-700/50
                border border-gray-600/50 hover:border-${action.color}-500/50
                min-w-[65px] transition-all hover:scale-105
              `}
            >
              <span className={`text-${action.color}-400`}>{action.icon}</span>
              <span className="text-[9px] text-gray-300 mt-1">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatsBar({ stats }: { stats: any }) {
  return (
    <div className="flex items-center gap-4 px-3 py-1.5 bg-gray-700/30 rounded-lg text-sm">
      <div className="text-center">
        <div className="font-bold text-blue-400">{stats?.totalOrders || 0}</div>
        <div className="text-[9px] text-gray-500">Orders</div>
      </div>
      <div className="text-center">
        <div className="font-bold text-green-400">{stats?.activeTrips || 0}</div>
        <div className="text-[9px] text-gray-500">Active</div>
      </div>
      <div className="text-center">
        <div className="font-bold text-yellow-400">₹{((stats?.monthRevenue || 0) / 1000).toFixed(0)}K</div>
        <div className="text-[9px] text-gray-500">Revenue</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CommandCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Role management
  const actualRole = (user?.role as UserRole) || 'ops_manager';
  const [viewAsRole, setViewAsRole] = useState<UserRole>(actualRole);
  const isActuallyAdmin = ['super_admin', 'tenant_admin'].includes(actualRole);
  
  // Category expansion state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['operations', 'exchange']));
  
  // Bot state
  const [showBot, setShowBot] = useState(false);
  
  // Role config
  const roleConfig = ROLE_CONFIGS[viewAsRole];
  
  // GraphQL
  const { data: statsData, loading } = useQuery(GET_DASHBOARD_STATS, {
    pollInterval: 15000,
  });
  const stats = statsData?.dashboardStats || {};
  
  // Filter categories based on role
  const visibleCategories = CATEGORIES.filter(cat => {
    // If category has required roles, check if current role is allowed
    if (cat.requiredRoles && !cat.requiredRoles.includes(viewAsRole)) {
      return false;
    }
    // Check if role config includes this category
    return roleConfig.categories.includes(cat.id);
  });
  
  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading Command Center...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-3 space-y-3">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur rounded-xl p-3 border border-gray-700/50 relative z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-orange-500 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                WowTruck
                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">LIVE</span>
              </h1>
              <p className="text-gray-500 text-xs">
                {roleConfig.greetingHindi} • <span className={`text-${roleConfig.color}-400`}>{roleConfig.label}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <RoleSwitcher 
              currentRole={viewAsRole} 
              onSwitch={setViewAsRole}
              isAdmin={isActuallyAdmin}
            />
            
            <button className="relative p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">3</span>
            </button>
            
            <StatsBar stats={stats} />
            
            <button 
              onClick={() => setShowBot(!showBot)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Help</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <QuickActionsBar actions={roleConfig.quickActions} />
      
      {/* Categories */}
      <div className="space-y-2">
        {visibleCategories.map(category => (
          <CategorySection
            key={category.id}
            category={category}
            isExpanded={expandedCategories.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
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
          <div key={i} className="bg-gray-800/30 backdrop-blur rounded-xl p-3 border border-gray-700/50">
            <div className="flex items-start justify-between">
              <div>
                <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
              <div className={`text-${stat.color}-400/50`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Floating Bot Button */}
      <button
        onClick={() => setShowBot(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <Bot className="w-6 h-6 text-white" />
      </button>
      
      {/* Footer */}
      <div className="text-center text-[10px] text-gray-600 py-2">
        🙏 Jai Guru Ji | ANKR Shell v5 | © 2025 ANKR Labs
      </div>
    </div>
  );
}
