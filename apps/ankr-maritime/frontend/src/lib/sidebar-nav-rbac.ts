// sidebar-nav-rbac.ts — Workflow-based navigation with RBAC/ABAC

export type UserRole =
  | 'admin'
  | 'agent'
  | 'charterer'
  | 'fleet-owner'
  | 'broker'
  | 'operations'
  | 'commercial'
  | 'technical'
  | 'finance'
  | 'compliance'
  | 'master'
  | 'crew';

export interface NavItem {
  label: string;
  href: string;
  roles: UserRole[] | 'all'; // Roles that can see this item
  permissions?: string[]; // Optional fine-grained permissions
}

export interface NavStage {
  id: string;
  label: string;
  icon: string;
  color: string; // tailwind color name
  description: string; // Tooltip description
  items: NavItem[];
}

/**
 * Workflow-based navigation stages
 * Same structure for all users, filtered by role
 */
export const workflowStages: NavStage[] = [
  {
    id: 'pre-fixture',
    label: 'Pre-Fixture',
    icon: '🔍',
    color: 'blue',
    description: 'Finding cargo and negotiating fixtures',
    items: [
      { label: 'Market Overview', href: '/market-overview', roles: ['broker', 'commercial', 'charterer', 'admin'] },
      { label: 'Chartering', href: '/chartering', roles: ['broker', 'commercial', 'charterer', 'admin'] },
      { label: 'Cargo Enquiries', href: '/cargo-enquiries', roles: ['broker', 'commercial', 'charterer', 'admin'] },
      { label: 'Open Tonnage', href: '/open-tonnage', roles: ['broker', 'commercial', 'admin'] },
      { label: 'Market Indices', href: '/market-indices', roles: ['broker', 'commercial', 'finance', 'admin'] },
      { label: 'CRM Pipeline', href: '/crm-pipeline', roles: ['broker', 'commercial', 'admin'] },
      { label: 'Contacts', href: '/contacts', roles: ['broker', 'commercial', 'operations', 'admin'] },
    ],
  },
  {
    id: 'planning',
    label: 'Planning',
    icon: '📋',
    color: 'cyan',
    description: 'Post-fixture planning and estimation',
    items: [
      { label: 'Estimate', href: '/voyage-estimate', roles: ['commercial', 'operations', 'charterer', 'admin'] },
      { label: 'Voyages', href: '/voyages', roles: ['operations', 'commercial', 'charterer', 'agent', 'admin'] },
      { label: 'Route Calc', href: '/route-calculator', roles: ['operations', 'commercial', 'technical', 'admin'] },
      { label: 'Port Intel', href: '/port-intelligence', roles: ['operations', 'agent', 'commercial', 'admin'] },
      { label: 'Weather', href: '/weather-warranty', roles: ['operations', 'technical', 'admin'] },
      { label: 'Cargo Compat', href: '/cargo-compatibility', roles: ['operations', 'technical', 'admin'] },
      { label: 'Agent Dir', href: '/agent-directory', roles: ['operations', 'commercial', 'admin'] },
      { label: 'Port Map', href: '/port-map', roles: ['operations', 'commercial', 'agent', 'admin'] },
    ],
  },
  {
    id: 'execution',
    label: 'Execution',
    icon: '🚢',
    color: 'green',
    description: 'Voyage in progress - real-time operations',
    items: [
      { label: 'Dashboard', href: '/', roles: 'all' },
      { label: 'AIS Live', href: '/ais/live', roles: ['operations', 'commercial', 'fleet-owner', 'admin'] },
      { label: 'DA Desk', href: '/da-desk', roles: ['operations', 'agent', 'admin'] },
      { label: 'Port Docs', href: '/port-documents', roles: ['operations', 'agent', 'admin'] },
      { label: 'Noon Rpt', href: '/noon-reports', roles: ['operations', 'technical', 'master', 'admin'] },
      { label: 'Noon (Auto)', href: '/noon-reports-enhanced', roles: ['operations', 'technical', 'admin'] },
      { label: 'SOF Mgr', href: '/sof-manager', roles: ['operations', 'agent', 'admin'] },
      { label: 'Delays', href: '/delay-alerts', roles: ['operations', 'commercial', 'admin'] },
      { label: 'Crit Path', href: '/critical-path', roles: ['operations', 'admin'] },
      { label: 'Agent Portal', href: '/agent-portal', roles: ['agent', 'operations', 'admin'] },
    ],
  },
  {
    id: 'settlement',
    label: 'Settlement',
    icon: '💰',
    color: 'amber',
    description: 'Post-voyage settlement and documentation',
    items: [
      { label: 'Laytime', href: '/laytime', roles: ['operations', 'commercial', 'admin'] },
      { label: 'B/L', href: '/bills-of-lading', roles: ['operations', 'commercial', 'admin'] },
      { label: 'eBL', href: '/ebl-chain', roles: ['operations', 'commercial', 'admin'] },
      { label: 'Claims', href: '/claims', roles: ['operations', 'commercial', 'compliance', 'admin'] },
      { label: 'Claim Pkgs', href: '/claim-packages', roles: ['operations', 'commercial', 'admin'] },
      { label: 'Invoices', href: '/invoices', roles: ['finance', 'commercial', 'admin'] },
      { label: 'FDA Disputes', href: '/fda-disputes', roles: ['operations', 'finance', 'agent', 'admin'] },
      { label: 'Hire Pay', href: '/hire-payments', roles: ['finance', 'fleet-owner', 'admin'] },
    ],
  },
  {
    id: 'fleet',
    label: 'Fleet & Assets',
    icon: '⚓',
    color: 'purple',
    description: 'Vessel and crew management',
    items: [
      { label: 'Vessels', href: '/vessels', roles: ['fleet-owner', 'technical', 'operations', 'admin'] },
      { label: 'Vsl Portal', href: '/vessel-portal', roles: ['fleet-owner', 'technical', 'admin'] },
      { label: 'Fleet Portal', href: '/fleet-portal', roles: ['fleet-owner', 'technical', 'admin'] },
      { label: 'Positions', href: '/vessel-positions', roles: ['fleet-owner', 'operations', 'commercial', 'admin'] },
      { label: 'Vsl History', href: '/vessel-history', roles: ['fleet-owner', 'technical', 'admin'] },
      { label: 'Certificates', href: '/vessel-certificates', roles: ['fleet-owner', 'technical', 'compliance', 'admin'] },
      { label: 'Inspections', href: '/vessel-inspections', roles: ['fleet-owner', 'technical', 'compliance', 'admin'] },
      { label: 'Crew', href: '/crew', roles: ['fleet-owner', 'technical', 'admin'] },
      { label: 'Team', href: '/team', roles: ['fleet-owner', 'technical', 'admin'] },
      { label: 'Bunkers', href: '/bunkers', roles: ['fleet-owner', 'technical', 'operations', 'admin'] },
      { label: 'Bunker Mgmt', href: '/bunker-management', roles: ['fleet-owner', 'technical', 'operations', 'admin'] },
      { label: 'Bnk Disputes', href: '/bunker-disputes', roles: ['fleet-owner', 'technical', 'operations', 'admin'] },
      { label: 'Emissions', href: '/emissions', roles: ['fleet-owner', 'technical', 'compliance', 'admin'] },
      { label: 'Carbon', href: '/carbon', roles: ['fleet-owner', 'technical', 'compliance', 'admin'] },
    ],
  },
  {
    id: 'commercial',
    label: 'Commercial',
    icon: '📊',
    color: 'orange',
    description: 'Commercial management and contracts',
    items: [
      { label: 'TC Mgmt', href: '/time-charters', roles: ['commercial', 'fleet-owner', 'admin'] },
      { label: 'COA', href: '/coa', roles: ['commercial', 'admin'] },
      { label: 'V/E History', href: '/ve-history', roles: ['commercial', 'operations', 'admin'] },
      { label: 'Benchmarks', href: '/cost-benchmarks', roles: ['finance', 'commercial', 'admin'] },
      { label: 'Revenue', href: '/revenue-analytics', roles: ['finance', 'commercial', 'admin'] },
      { label: 'Owner ROI', href: '/owner-roi-dashboard', roles: ['fleet-owner', 'commercial', 'finance', 'admin'] },
    ],
  },
  {
    id: 'ports',
    label: 'Ports & Routes',
    icon: '🌍',
    color: 'emerald',
    description: 'Port information and route planning',
    items: [
      { label: 'Ports', href: '/ports', roles: ['operations', 'commercial', 'agent', 'admin'] },
      { label: 'Fleet Routes', href: '/fleet-routes', roles: ['operations', 'commercial', 'technical', 'admin'] },
      { label: 'Congestion', href: '/port-congestion', roles: ['operations', 'commercial', 'admin'] },
      { label: 'Restrictions', href: '/port-restrictions', roles: ['operations', 'commercial', 'admin'] },
      { label: 'Tariffs', href: '/port-tariffs', roles: ['operations', 'commercial', 'finance', 'admin'] },
      { label: 'ECA Zones', href: '/eca-zones', roles: ['operations', 'technical', 'compliance', 'admin'] },
      { label: 'Risk Areas', href: '/high-risk-areas', roles: ['operations', 'technical', 'compliance', 'admin'] },
      { label: 'Geofence', href: '/geofencing', roles: ['operations', 'technical', 'admin'] },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: '💵',
    color: 'rose',
    description: 'Financial management and payments',
    items: [
      { label: 'CTM', href: '/cash-to-master', roles: ['finance', 'operations', 'admin'] },
      { label: 'FX', href: '/fx-dashboard', roles: ['finance', 'admin'] },
      { label: 'L/C', href: '/letters-of-credit', roles: ['finance', 'commercial', 'admin'] },
      { label: 'Payments', href: '/trade-payments', roles: ['finance', 'admin'] },
      { label: 'FFA', href: '/freight-derivatives', roles: ['finance', 'commercial', 'admin'] },
      { label: 'Bank Recon', href: '/bank-reconciliation', roles: ['finance', 'admin'] },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: '⚖️',
    color: 'pink',
    description: 'Compliance and risk management',
    items: [
      { label: 'ISM/ISPS', href: '/compliance', roles: ['compliance', 'technical', 'admin'] },
      { label: 'KYC', href: '/kyc', roles: ['compliance', 'commercial', 'admin'] },
      { label: 'Insurance', href: '/insurance', roles: ['compliance', 'fleet-owner', 'admin'] },
      { label: 'Sanctions', href: '/sanctions', roles: ['compliance', 'commercial', 'admin'] },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: '📄',
    color: 'indigo',
    description: 'Document management',
    items: [
      { label: 'Docs', href: '/documents', roles: 'all' },
      { label: 'Templates', href: '/document-templates', roles: ['operations', 'commercial', 'admin'] },
      { label: 'Doc Links', href: '/document-links', roles: ['operations', 'commercial', 'admin'] },
    ],
  },
  {
    id: 'snp',
    label: 'S&P',
    icon: '🏷️',
    color: 'slate',
    description: 'Sale and purchase',
    items: [
      { label: 'S&P', href: '/sale-listings', roles: ['broker', 'fleet-owner', 'admin'] },
      { label: 'SNP Desk', href: '/snp-desk', roles: ['broker', 'fleet-owner', 'admin'] },
      { label: 'Deals', href: '/snp-deals', roles: ['broker', 'fleet-owner', 'admin'] },
      { label: 'Valuation', href: '/snp-valuation', roles: ['broker', 'fleet-owner', 'finance', 'admin'] },
      { label: 'Closing', href: '/closing-tracker', roles: ['broker', 'fleet-owner', 'admin'] },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: '🧠',
    color: 'violet',
    description: 'Analytics, reporting, and AI tools',
    items: [
      { label: 'Analytics', href: '/analytics', roles: 'all' },
      { label: 'Reports', href: '/reports', roles: 'all' },
      { label: 'Ops KPI', href: '/operations-kpi', roles: ['operations', 'commercial', 'admin'] },
      { label: 'Mari8xLLM', href: '/mari8x-llm', roles: 'all' },
      { label: 'AI Engine', href: '/ai-engine', roles: ['operations', 'commercial', 'admin'] },
      { label: 'Knowledge', href: '/knowledge-base', roles: 'all' },
      { label: 'Search', href: '/advanced-search', roles: 'all' },
      { label: 'Flow Canvas', href: '/flow-canvas', roles: ['admin', 'operations'] },
      { label: 'Features', href: '/features', roles: 'all' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: '🔔',
    color: 'amber',
    description: 'Alerts and notifications',
    items: [
      { label: 'Alerts', href: '/alerts', roles: 'all' },
      { label: 'Activity', href: '/activity', roles: 'all' },
      { label: 'Expiry', href: '/expiry-tracker', roles: ['operations', 'technical', 'compliance', 'admin'] },
      { label: 'Mentions', href: '/mentions', roles: 'all' },
      { label: 'Approvals', href: '/approvals', roles: ['operations', 'commercial', 'finance', 'admin'] },
    ],
  },
  {
    id: 'people',
    label: 'People',
    icon: '👥',
    color: 'cyan',
    description: 'Team and contact management',
    items: [
      { label: 'Customers', href: '/customer-insights', roles: ['commercial', 'broker', 'admin'] },
      { label: 'Vendors', href: '/vendor-management', roles: ['operations', 'finance', 'admin'] },
      { label: 'Appointments', href: '/agent-appointments', roles: ['agent', 'operations', 'admin'] },
      { label: 'Permissions', href: '/permissions', roles: ['admin'] },
      { label: 'HR', href: '/hr', roles: ['admin', 'technical'] },
      { label: 'Attendance', href: '/attendance', roles: ['admin', 'technical'] },
    ],
  },
  {
    id: 'company',
    label: 'Company',
    icon: '🏢',
    color: 'slate',
    description: 'Company management',
    items: [
      { label: 'Companies', href: '/companies', roles: ['admin', 'commercial'] },
      { label: 'Cost Optim', href: '/cost-optimization', roles: ['finance', 'admin'] },
      { label: 'Tariff Mgmt', href: '/tariff-management', roles: ['operations', 'finance', 'admin'] },
      { label: 'Agents Mgmt', href: '/protecting-agents', roles: ['operations', 'admin'] },
    ],
  },
];

/**
 * Filter navigation stages based on user roles
 * Hides stages where user has no access to any items
 */
export function filterNavForUser(
  user: { roles: UserRole[] } | null
): NavStage[] {
  if (!user || !user.roles) return [];

  const userRoles = user.roles;
  const isAdmin = userRoles.includes('admin');

  return workflowStages
    .map((stage) => {
      // Filter items in this stage
      const filteredItems = stage.items.filter((item) => {
        if (isAdmin) return true; // Admin sees everything
        if (item.roles === 'all') return true; // Public items

        // Check if user has any of the required roles
        return item.roles.some((role) => userRoles.includes(role));
      });

      return {
        ...stage,
        items: filteredItems,
      };
    })
    .filter((stage) => stage.items.length > 0); // Hide stages with no visible items
}

/**
 * Get stage visibility counts for user
 */
export function getStageVisibility(
  user: { roles: UserRole[] } | null
): Record<string, number> {
  const filtered = filterNavForUser(user);
  return filtered.reduce((acc, stage) => {
    acc[stage.id] = stage.items.length;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Find which stage contains a given path
 */
export function findStageForPath(
  stages: NavStage[],
  path: string
): string | null {
  for (const stage of stages) {
    if (
      stage.items.some(
        (item) =>
          item.href === path || (item.href !== '/' && path.startsWith(item.href))
      )
    ) {
      return stage.id;
    }
  }
  return null;
}

// Storage key for sidebar state
const STORAGE_KEY = 'mari8x-sidebar-state-rbac';

export function loadSidebarState(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveSidebarState(state: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}
