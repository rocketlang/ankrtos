// sidebar-nav.ts — Grouped navigation data for Mari8x sidebar

export interface NavItem {
  label: string;
  href: string;
}

export interface NavSection {
  id: string;
  label: string;
  icon: string;
  color: string;       // tailwind color name (blue, cyan, green, etc.)
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    id: 'home',
    label: 'Home',
    icon: '\u2693',  // anchor
    color: 'blue',
    items: [
      { label: 'Dashboard', href: '/' },
      { label: 'Vessel Portal', href: '/vessel-portal' },
      { label: 'Fleet Portal', href: '/fleet-portal' },
      { label: 'Owner ROI', href: '/owner-roi-dashboard' },
      { label: 'Companies', href: '/companies' },
      { label: 'Features', href: '/features' },
    ],
  },
  {
    id: 'fleet',
    label: 'Fleet',
    icon: '\u{1F6A2}',  // ship
    color: 'cyan',
    items: [
      { label: 'Vessels', href: '/vessels' },
      { label: 'Positions', href: '/vessel-positions' },
      { label: 'Vsl History', href: '/vessel-history' },
      { label: 'Certificates', href: '/vessel-certificates' },
      { label: 'Inspections', href: '/vessel-inspections' },
    ],
  },
  {
    id: 'ports',
    label: 'Ports & Routes',
    icon: '\u{1F30D}',  // globe
    color: 'green',
    items: [
      { label: 'Ports', href: '/ports' },
      { label: 'Port Map', href: '/port-map' },
      { label: 'Route Calc', href: '/route-calculator' },
      { label: 'Fleet Routes', href: '/fleet-routes' },
      { label: 'Port Intel', href: '/port-intelligence' },
      { label: 'Congestion', href: '/port-congestion' },
      { label: 'Restrictions', href: '/port-restrictions' },
      { label: 'Tariffs', href: '/port-tariffs' },
      { label: 'ECA Zones', href: '/eca-zones' },
      { label: 'Risk Areas', href: '/high-risk-areas' },
      { label: 'Geofence', href: '/geofencing' },
    ],
  },
  {
    id: 'commercial',
    label: 'Commercial',
    icon: '\u{1F4CB}',  // clipboard
    color: 'orange',
    items: [
      { label: 'Chartering', href: '/chartering' },
      { label: 'TC Mgmt', href: '/time-charters' },
      { label: 'COA', href: '/coa' },
      { label: 'Enquiries', href: '/cargo-enquiries' },
      { label: 'Cargo Compat', href: '/cargo-compatibility' },
      { label: 'Tonnage', href: '/open-tonnage' },
      { label: 'Estimate', href: '/voyage-estimate' },
      { label: 'V/E History', href: '/ve-history' },
    ],
  },
  {
    id: 'voyage-ops',
    label: 'Voyage Ops',
    icon: '\u{1F9ED}',  // compass
    color: 'blue',
    items: [
      { label: 'Voyages', href: '/voyages' },
      { label: 'DA Desk', href: '/da-desk' },
      { label: 'Port Docs', href: '/port-documents' },
      { label: 'Laytime', href: '/laytime' },
      { label: 'Noon Rpt', href: '/noon-reports' },
      { label: 'Noon (Auto)', href: '/noon-reports-enhanced' },
      { label: 'Crit Path', href: '/critical-path' },
      { label: 'Weather', href: '/weather-warranty' },
      { label: 'SOF Mgr', href: '/sof-manager' },
      { label: 'Delays', href: '/delay-alerts' },
    ],
  },
  {
    id: 'cargo-docs',
    label: 'Cargo & Docs',
    icon: '\u{1F4C4}',  // page
    color: 'amber',
    items: [
      { label: 'B/L', href: '/bills-of-lading' },
      { label: 'eBL', href: '/ebl-chain' },
      { label: 'Docs', href: '/documents' },
      { label: 'Templates', href: '/document-templates' },
      { label: 'Doc Links', href: '/document-links' },
    ],
  },
  {
    id: 'bunkers',
    label: 'Bunkers & Emissions',
    icon: '\u26FD',  // fuel pump
    color: 'emerald',
    items: [
      { label: 'Bunkers', href: '/bunkers' },
      { label: 'Bunker Mgmt', href: '/bunker-management' },
      { label: 'Bnk Disputes', href: '/bunker-disputes' },
      { label: 'Emissions', href: '/emissions' },
      { label: 'Carbon', href: '/carbon' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: '\u{1F4B0}',  // money bag
    color: 'purple',
    items: [
      { label: 'Invoices', href: '/invoices' },
      { label: 'Hire Pay', href: '/hire-payments' },
      { label: 'CTM', href: '/cash-to-master' },
      { label: 'Benchmarks', href: '/cost-benchmarks' },
      { label: 'Revenue', href: '/revenue-analytics' },
      { label: 'FX', href: '/fx-dashboard' },
      { label: 'L/C', href: '/letters-of-credit' },
      { label: 'Payments', href: '/trade-payments' },
      { label: 'FFA', href: '/freight-derivatives' },
    ],
  },
  {
    id: 'claims',
    label: 'Claims & Compliance',
    icon: '\u2696',  // scales
    color: 'rose',
    items: [
      { label: 'Claims', href: '/claims' },
      { label: 'Claim Pkgs', href: '/claim-packages' },
      { label: 'ISM/ISPS', href: '/compliance' },
      { label: 'KYC', href: '/kyc' },
      { label: 'Insurance', href: '/insurance' },
      { label: 'Sanctions', href: '/sanctions' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM & Contacts',
    icon: '\u{1F465}',  // people
    color: 'pink',
    items: [
      { label: 'Contacts', href: '/contacts' },
      { label: 'CRM', href: '/crm-pipeline' },
      { label: 'Customers', href: '/customer-insights' },
      { label: 'Agents', href: '/agent-directory' },
      { label: 'Agent Portal', href: '/agent-portal' },
      { label: 'Appointments', href: '/agent-appointments' },
      { label: 'Vendors', href: '/vendor-management' },
    ],
  },
  {
    id: 'people',
    label: 'People & Team',
    icon: '\u{1F464}',  // person
    color: 'indigo',
    items: [
      { label: 'Crew', href: '/crew' },
      { label: 'Team', href: '/team' },
      { label: 'Permissions', href: '/permissions' },
      { label: 'HR', href: '/hr' },
      { label: 'Attendance', href: '/attendance' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics & AI',
    icon: '\u{1F4CA}',  // chart
    color: 'violet',
    items: [
      { label: 'Reports', href: '/reports' },
      { label: 'Analytics', href: '/analytics' },
      { label: 'Ops KPI', href: '/operations-kpi' },
      { label: 'Market', href: '/market-indices' },
      { label: 'Market Overview', href: '/market-overview' },
      { label: 'Mari8xLLM', href: '/mari8x-llm' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge & RAG',
    icon: '\u{1F9E0}',  // brain
    color: 'purple',
    items: [
      { label: 'Search', href: '/advanced-search' },
      { label: 'Knowledge', href: '/knowledge-base' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: '\u{1F514}',  // bell
    color: 'amber',
    items: [
      { label: 'Alerts', href: '/alerts' },
      { label: 'Activity', href: '/activity' },
      { label: 'Expiry', href: '/expiry-tracker' },
      { label: 'Mentions', href: '/mentions' },
      { label: 'Approvals', href: '/approvals' },
    ],
  },
  {
    id: 'snp',
    label: 'S&P',
    icon: '\u{1F3F7}',  // label/tag
    color: 'slate',
    items: [
      { label: 'S&P', href: '/sale-listings' },
      { label: 'Deals', href: '/snp-deals' },
      { label: 'Valuation', href: '/snp-valuation' },
      { label: 'Closing', href: '/closing-tracker' },
    ],
  },
];

// ---- Maritime Operations Flow ----
// The typical chartering-to-settlement lifecycle

export const flowSteps: NavItem[] = [
  { label: 'Chartering', href: '/chartering' },
  { label: 'Estimate', href: '/voyage-estimate' },
  { label: 'Voyages', href: '/voyages' },
  { label: 'DA Desk', href: '/da-desk' },
  { label: 'Laytime', href: '/laytime' },
  { label: 'B/L', href: '/bills-of-lading' },
  { label: 'Claims', href: '/claims' },
  { label: 'Reports', href: '/reports' },
];

// Set of hrefs that are part of the flow (for quick lookup)
export const flowHrefs = new Set(flowSteps.map((s) => s.href));

// ---- Next Step Map ----
// Maps current path → next step in maritime operations flow

export const nextStepMap: Record<string, { description: string; label: string; href: string }> = {
  '/chartering': { description: 'Estimate voyage profitability', label: 'Voyage Estimate', href: '/voyage-estimate' },
  '/voyage-estimate': { description: 'Create and track voyages', label: 'Voyages', href: '/voyages' },
  '/voyages': { description: 'Manage disbursement accounts', label: 'DA Desk', href: '/da-desk' },
  '/da-desk': { description: 'Calculate laytime & demurrage', label: 'Laytime', href: '/laytime' },
  '/laytime': { description: 'Issue bills of lading', label: 'Bills of Lading', href: '/bills-of-lading' },
  '/bills-of-lading': { description: 'Manage cargo & freight claims', label: 'Claims', href: '/claims' },
  '/claims': { description: 'View financial reports', label: 'Reports', href: '/reports' },
  '/reports': { description: 'Return to operations dashboard', label: 'Dashboard', href: '/' },
};

// ---- Helpers ----

const STORAGE_KEY = 'ankr-mari8x-sidebar-state';

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

/** Find which section contains a given path */
export function findSectionForPath(path: string): string | null {
  for (const section of navSections) {
    if (section.items.some((item) => item.href === path || (item.href !== '/' && path.startsWith(item.href)))) {
      return section.id;
    }
  }
  return null;
}
