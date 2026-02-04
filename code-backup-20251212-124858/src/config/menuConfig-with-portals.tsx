/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WowTruck 2.0 - Sidebar Menu Configuration with Portals
 * Add this to your App.tsx or sidebar component
 * ═══════════════════════════════════════════════════════════════════════════
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  MapPin,
  FileText,
  CreditCard,
  Settings,
  BarChart3,
  Building2,
  Smartphone,
  Mic,
  Globe,
  ShoppingCart,
  Route,
  Shield,
  MessageSquare,
  FileCheck,
  Calculator,
  UserCircle
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// MENU CONFIGURATION WITH PORTALS SECTION
// ═══════════════════════════════════════════════════════════════════════════

export const menuItems = [
  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: ['super_admin', 'admin', 'dispatcher', 'branch_manager', 'accountant'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PORTALS - NEW SECTION (Recommended placement: After Dashboard)
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Portals',
    icon: Globe,
    roles: ['super_admin', 'admin', 'customer', 'vendor', 'driver'],
    children: [
      {
        title: 'Customer Portal',
        icon: Building2,
        path: '/customer-portal',
        roles: ['super_admin', 'admin', 'customer'],
        description: 'Track shipments, approve invoices, rate service',
        badge: 'NEW',
        badgeColor: 'green',
      },
      {
        title: 'Vendor Portal',
        icon: Truck,
        path: '/vendor-portal',
        roles: ['super_admin', 'admin', 'vendor'],
        description: 'Manage fleet, view earnings, track settlements',
        badge: 'NEW',
        badgeColor: 'green',
      },
      {
        title: 'Driver App',
        icon: Smartphone,
        path: '/driver-app',
        roles: ['super_admin', 'admin', 'driver'],
        description: 'Trip management, ePOD, navigation',
        badge: 'NEW',
        badgeColor: 'green',
      },
      {
        title: 'Driver Voice',
        icon: Mic,
        path: '/driver-voice',
        roles: ['super_admin', 'admin', 'driver'],
        description: 'Voice-first interface, 103 languages',
        badge: 'AI',
        badgeColor: 'purple',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ORDERS
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Orders',
    icon: Package,
    roles: ['super_admin', 'admin', 'dispatcher', 'branch_manager'],
    children: [
      {
        title: 'All Orders',
        path: '/orders',
        icon: Package,
      },
      {
        title: 'Create Order',
        path: '/orders/new',
        icon: Package,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FLEET
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Fleet',
    icon: Truck,
    roles: ['super_admin', 'admin', 'dispatcher', 'branch_manager'],
    children: [
      {
        title: 'Vehicles',
        path: '/vehicles',
        icon: Truck,
      },
      {
        title: 'Drivers',
        path: '/drivers',
        icon: Users,
      },
      {
        title: 'GPS Tracking',
        path: '/fleet',
        icon: MapPin,
      },
      {
        title: 'Fleet GPS Admin',
      {
        title: 'Fleet Analytics',
        path: '/fleet/analytics',
        icon: BarChart3,
        badge: 'NEW',
        badgeColor: 'green',
      },
        path: '/fleet-gps',
        icon: MapPin,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Operations',
    icon: Route,
    roles: ['super_admin', 'admin', 'dispatcher', 'branch_manager'],
    children: [
      {
        title: 'Trips',
        path: '/trips',
        icon: Route,
      },
      {
        title: 'Route Calculator',
        path: '/route-calculator',
        icon: Calculator,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FINANCE
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Finance',
    icon: CreditCard,
    roles: ['super_admin', 'admin', 'accountant', 'branch_manager'],
    children: [
      {
        title: 'Invoices',
        path: '/invoices',
        icon: FileText,
      },
      {
        title: 'Rates',
        path: '/rates',
        icon: CreditCard,
      },
      {
        title: 'RFQ',
        path: '/rfq',
        icon: FileCheck,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FREIGHT EXCHANGE
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Freight Exchange',
    icon: ShoppingCart,
    roles: ['super_admin', 'admin', 'dispatcher', 'vendor'],
    children: [
      {
        title: 'Marketplace',
        path: '/freight-exchange',
        icon: ShoppingCart,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DOCUMENTS
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Documents',
    icon: FileCheck,
    roles: ['super_admin', 'admin', 'dispatcher', 'accountant'],
    children: [
      {
        title: 'DocChain',
        path: '/docchain',
        icon: FileCheck,
        badge: 'AI',
        badgeColor: 'purple',
      },
      {
        title: 'OCR Demo',
        path: '/ocr-demo',
        icon: FileText,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COMMUNICATION
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Communication',
    icon: MessageSquare,
    roles: ['super_admin', 'admin'],
    children: [
      {
        title: 'WhatsApp Admin',
        path: '/whatsapp-admin',
        icon: MessageSquare,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SECURITY
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Security',
    icon: Shield,
    path: '/security-dashboard',
    roles: ['super_admin', 'admin'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MASTER DATA
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Master Data',
    icon: Users,
    roles: ['super_admin', 'admin'],
    children: [
      {
        title: 'Customers',
        path: '/customers',
        icon: Building2,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SETTINGS
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: 'Settings',
    icon: Settings,
    roles: ['super_admin', 'admin'],
    children: [
      {
        title: 'Configuration',
        path: '/settings',
        icon: Settings,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Filter menu by user role
// ═══════════════════════════════════════════════════════════════════════════

export function getMenuForRole(userRole: string) {
  return menuItems
    .filter(item => item.roles?.includes(userRole) || item.roles?.includes('super_admin'))
    .map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(
            child => !child.roles || child.roles.includes(userRole) || child.roles.includes('super_admin')
          ),
        };
      }
      return item;
    })
    .filter(item => !item.children || item.children.length > 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Get portal-only menu for external users
// ═══════════════════════════════════════════════════════════════════════════

export function getPortalMenu(userRole: string) {
  const portalSection = menuItems.find(item => item.title === 'Portals');
  if (!portalSection?.children) return [];
  
  return portalSection.children.filter(
    child => child.roles?.includes(userRole)
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BADGE COMPONENT (for "NEW" and "AI" badges)
// ═══════════════════════════════════════════════════════════════════════════

export function MenuBadge({ text, color }: { text: string; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <span className={`ml-2 px-1.5 py-0.5 text-xs font-medium rounded ${colors[color] || colors.blue}`}>
      {text}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLE IN SIDEBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/*
import { menuItems, getMenuForRole, MenuBadge } from './menuConfig';

function Sidebar() {
  const { user } = useAuth();
  const filteredMenu = getMenuForRole(user?.role || 'guest');

  return (
    <nav>
      {filteredMenu.map(item => (
        <div key={item.title}>
          <Link to={item.path || '#'}>
            <item.icon className="w-5 h-5" />
            <span>{item.title}</span>
            {item.badge && <MenuBadge text={item.badge} color={item.badgeColor} />}
          </Link>
          
          {item.children && (
            <div className="ml-4">
              {item.children.map(child => (
                <Link key={child.title} to={child.path}>
                  <child.icon className="w-4 h-4" />
                  <span>{child.title}</span>
                  {child.badge && <MenuBadge text={child.badge} color={child.badgeColor} />}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
*/
