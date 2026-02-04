/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WowTruck 2.0 - Layout with COLLAPSED Sidebar by Default
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CHANGES:
 * - Sidebar sections collapsed by default (clean look)
 * - Hover tooltips on each section
 * - Intuitive expand on click
 * - No "NEW" badges (clean)
 * - Added Fleet Analytics to Fleet section
 *
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import { useState, useMemo } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, MapPin, Truck, Users, Radio, Smartphone,
  Route, IndianRupee, Building2, Receipt, TrendingUp, Link2, LogOut, Menu, X,
  ChevronDown, ChevronRight, FileText, Settings, LayoutGrid, Globe, Mic,
  MessageSquare, Navigation, MessageCircle, Eye, FolderOpen, Shield, Zap,
  UserCircle, Car, HelpCircle, BarChart3, Brain
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Breadcrumbs } from './Breadcrumbs';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ROLE_LABELS, ROLE_COLORS, UserRole } from '../contexts/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles?: UserRole[];
}

interface NavGroup {
  name: string;
  icon: any;
  description: string;  // For tooltip
  items: NavItem[];
  roles?: UserRole[];
}

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION WITH DESCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════════

const navigation: NavGroup[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & Command Center',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Command Center', href: '/command-center', icon: Zap },
    ]
  },
  {
    name: 'Portals',
    icon: UserCircle,
    description: 'Customer, Vendor & Driver Apps',
    roles: ['super_admin', 'branch_manager'],
    items: [
      { name: 'Customer Portal', href: '/customer-portal', icon: UserCircle },
      { name: 'Vendor Portal', href: '/vendor-portal', icon: Building2 },
      { name: 'Driver App', href: '/driver-app', icon: Car },
      { name: 'Driver Voice', href: '/driver-voice', icon: Mic },
    ]
  },
  {
    name: 'Operations',
    icon: Package,
    description: 'Orders & Trip Management',
    roles: ['super_admin', 'branch_manager', 'dispatcher'],
    items: [
      { name: 'Orders', href: '/orders', icon: Package },
      { name: 'Trips', href: '/trips', icon: MapPin },
    ]
  },
  {
    name: 'Fleet',
    icon: Truck,
    description: 'Vehicles, Drivers & Tracking',
    roles: ['super_admin', 'branch_manager', 'dispatcher'],
    items: [
      { name: 'Vehicles', href: '/vehicles', icon: Truck },
      { name: 'Drivers', href: '/drivers', icon: Users },
      { name: 'Live Tracking', href: '/fleet', icon: Radio },
      { name: 'GPS Tracking', href: '/gps-tracking', icon: Navigation },
      { name: 'Fleet GPS', href: '/fleet-gps', icon: MapPin },
      { name: 'Fleet Analytics', href: '/fleet/analytics', icon: BarChart3 },
    ]
  },
  {
    name: 'Documents',
    icon: FolderOpen,
    description: 'OCR Scanner & DocChain',
    roles: ['super_admin', 'branch_manager', 'dispatcher', 'accountant'],
    items: [
      { name: 'OCR Scanner', href: '/ocr', icon: Eye },
      { name: 'DocChain', href: '/docchain', icon: Link2 },
    ]
  },
  {
    name: 'Planning',
    icon: Route,
    description: 'Routes, Rates & RFQ',
    roles: ['super_admin', 'branch_manager', 'dispatcher'],
    items: [
      { name: 'Route Calculator', href: '/route', icon: Route },
      { name: 'RFQ Processor', href: '/rfq', icon: FileText },
      { name: 'Rate Card', href: '/rates', icon: IndianRupee },
      { name: 'Freight Exchange', href: '/freight', icon: TrendingUp },
    ]
  },
  {
    name: 'Business',
    icon: Building2,
    description: 'Customers & Invoices',
    roles: ['super_admin', 'branch_manager', 'accountant'],
    items: [
      { name: 'Customers', href: '/customers', icon: Building2 },
      { name: 'Invoices', href: '/invoices', icon: Receipt },
    ]
  },
  {
    name: 'Messaging',
    icon: MessageSquare,
    description: 'WhatsApp Integration',
    roles: ['super_admin', 'branch_manager', 'dispatcher'],
    items: [
      { name: 'WhatsApp', href: '/whatsapp', icon: MessageCircle },
      { name: 'WhatsApp Admin', href: '/whatsapp-admin', icon: Settings, roles: ['super_admin'] },
    ]
  },
  {
    name: 'System',
    icon: Settings,
    description: 'Security & Administration',
    roles: ['super_admin'],
    items: [
      { name: 'Security', href: '/security', icon: Shield },
      { name: 'Widgets', href: '/widgets', icon: LayoutGrid },
      { name: 'Ωmega Shell', href: '/omega', icon: Globe },
      { name: 'Pulse Monitor', href: '/pulse', icon: Radio },
      { name: 'System Health', href: '/system-health', icon: Brain },
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// THEME COLORS (unchanged)
// ═══════════════════════════════════════════════════════════════════════════

const getThemeColors = (theme: string) => {
  const themes: Record<string, any> = {
    light: {
      sidebar: 'bg-white',
      main: 'bg-gray-100',
      text: 'text-gray-900',
      subtext: 'text-gray-600',
      border: 'border-gray-200',
      hover: 'hover:bg-gray-100',
      active: 'bg-blue-600',
      activeText: 'text-white',
      accent: 'text-blue-600',
      tooltip: 'bg-gray-800 text-white',
    },
    dark: {
      sidebar: 'bg-gray-900',
      main: 'bg-gray-800',
      text: 'text-white',
      subtext: 'text-gray-400',
      border: 'border-gray-700',
      hover: 'hover:bg-gray-800',
      active: 'bg-blue-600',
      activeText: 'text-white',
      accent: 'text-blue-500',
      tooltip: 'bg-gray-700 text-white',
    },
    orange: {
      sidebar: 'bg-[#1E293B]',
      main: 'bg-[#0F172A]',
      text: 'text-white',
      subtext: 'text-slate-400',
      border: 'border-slate-600',
      hover: 'hover:bg-slate-700',
      active: 'bg-orange-600',
      activeText: 'text-white',
      accent: 'text-orange-500',
      tooltip: 'bg-slate-800 text-white',
    },
    neon: {
      sidebar: 'bg-black',
      main: 'bg-gray-950',
      text: 'text-green-400',
      subtext: 'text-green-600',
      border: 'border-green-900',
      hover: 'hover:bg-green-950',
      active: 'bg-green-600',
      activeText: 'text-black',
      accent: 'text-green-400',
      tooltip: 'bg-green-900 text-green-100',
    },
    wowtruck: {
      sidebar: 'bg-[#1A1A2E]',
      main: 'bg-[#0F0F1A]',
      text: 'text-white',
      subtext: 'text-purple-300',
      border: 'border-purple-500/20',
      hover: 'hover:bg-purple-500/10',
      active: 'bg-orange-600',
      activeText: 'text-white',
      accent: 'text-orange-500',
      tooltip: 'bg-purple-900 text-white',
    },
  };

  return themes[theme] || themes.orange;
};

// ═══════════════════════════════════════════════════════════════════════════
// TOOLTIP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const Tooltip = ({ children, content, colors }: { children: React.ReactNode; content: string; colors: any }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={`
          absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50
          px-2 py-1 rounded text-xs whitespace-nowrap
          ${colors.tooltip}
          shadow-lg
        `}>
          {content}
          {/* Arrow */}
          <div className={`
            absolute right-full top-1/2 -translate-y-1/2
            border-4 border-transparent border-r-current
          `} style={{ borderRightColor: 'inherit' }} />
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface LayoutProps {
  children?: React.ReactNode;
  user: { name: string; email: string; role: string; permissions?: string[] } | null;
  onLogout: () => void;
}

export default function Layout({ children, user, onLogout }: LayoutProps) {
  const location = useLocation();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════
  // KEY CHANGE: Empty array = all sections collapsed by default
  // ═══════════════════════════════════════════════════════════════════════
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const colors = getThemeColors(theme);
  const isDark = !["light"].includes(theme);
  const userRole = (user?.role || 'customer') as UserRole;

  const filteredNavigation = useMemo(() => {
    return navigation
      .filter(group => {
        if (!group.roles) return true;
        return group.roles.includes(userRole);
      })
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          if (!item.roles) return true;
          return item.roles.includes(userRole);
        })
      }))
      .filter(group => group.items.length > 0);
  }, [userRole]);

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev =>
      prev.includes(name)
        ? prev.filter(g => g !== name)
        : [...prev, name]
    );
  };

  // Auto-expand current section based on URL
  const currentSection = useMemo(() => {
    for (const group of filteredNavigation) {
      if (group.items.some(item => location.pathname === item.href || location.pathname.startsWith(item.href + '/'))) {
        return group.name;
      }
    }
    return null;
  }, [location.pathname, filteredNavigation]);

  // Auto-expand current section when navigating
  useMemo(() => {
    if (currentSection && !expandedGroups.includes(currentSection)) {
      setExpandedGroups(prev => [...prev, currentSection]);
    }
  }, [currentSection]);

  const headerBg = isDark ? 'bg-gray-900/80 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md';
  const roleColor = ROLE_COLORS[userRole] || 'bg-gray-500';

  return (
    <div className={`min-h-screen ${colors.main}`}>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-52 ${colors.sidebar} transition-transform ${sidebarOpen ? '' : '-translate-x-full'} lg:translate-x-0`}>
        <div className={`flex items-center justify-between h-11 px-3 border-b ${colors.border}`}>
          <Link to="/" className="flex items-center gap-2">
            <Truck className={`w-5 h-5 ${colors.accent}`} />
            <span className={`font-bold ${colors.text}`}>WowTruck</span>
            <span className={`text-[10px] ${colors.subtext}`}>2.0</span>
          </Link>
          <button className={`lg:hidden ${colors.subtext}`} onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-2 py-2 overflow-y-auto" style={{ height: 'calc(100vh - 110px)' }}>
          {filteredNavigation.map((group) => {
            const isExpanded = expandedGroups.includes(group.name);
            const isSingle = group.items.length === 1;
            const hasActiveItem = group.items.some(item => location.pathname === item.href || location.pathname.startsWith(item.href + '/'));

            if (isSingle) {
              const item = group.items[0];
              const isActive = location.pathname === item.href;
              return (
                <Tooltip key={group.name} content={group.description} colors={colors}>
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-2 px-3 py-2 mb-1 rounded text-sm transition-colors
                      ${isActive ? `${colors.active} ${colors.activeText}` : `${colors.subtext} ${colors.hover}`}
                    `}
                  >
                    <group.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                </Tooltip>
              );
            }

            return (
              <div key={group.name} className="mb-1">
                <Tooltip content={group.description} colors={colors}>
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className={`
                      flex items-center justify-between w-full px-3 py-2 rounded text-sm transition-colors
                      ${hasActiveItem ? colors.text : colors.subtext}
                      ${colors.hover}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <group.icon className={`w-4 h-4 ${hasActiveItem ? colors.accent : ''}`} />
                      <span>{group.name}</span>
                    </div>
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                </Tooltip>

                {isExpanded && (
                  <div className="ml-3 mt-1 space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors
                            ${isActive ? `${colors.active} ${colors.activeText}` : `${colors.subtext} ${colors.hover}`}
                          `}
                        >
                          <item.icon className="w-3 h-3" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className={`absolute bottom-0 left-0 right-0 p-2 border-t ${colors.border} ${colors.sidebar}`}>
          <div className="flex flex-col gap-2">
            <div className={`px-2 py-1 rounded text-[10px] font-medium text-white text-center ${roleColor}`}>
              {ROLE_LABELS[userRole] || userRole}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full ${colors.active} flex items-center justify-center ${colors.activeText} text-xs font-medium`}>
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${colors.text} truncate`}>{user?.name?.split(' ')[0] || 'User'}</p>
                <p className={`text-[10px] ${colors.subtext} truncate`}>{user?.email}</p>
              </div>
              <button
                onClick={onLogout}
                className={`p-1.5 rounded ${colors.subtext} hover:bg-red-500/20 hover:text-red-400 transition-colors`}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="lg:pl-52">
        <header className={`sticky top-0 z-30 ${headerBg} shadow-sm h-11 flex items-center px-4`}>
          <button className={`lg:hidden ${colors.subtext} mr-3`} onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <span className={`text-xs mr-4 ${colors.subtext}`}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <div className="flex items-center gap-4">
            <ThemeSwitcher position="inline" compact={true} showLabel={false} />
            <LanguageSwitcher />
          </div>
        </header>

        <main className="p-3">
          <Breadcrumbs />
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
