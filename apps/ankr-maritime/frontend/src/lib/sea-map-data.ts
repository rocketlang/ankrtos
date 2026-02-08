import { navSections } from './sidebar-nav';

export interface Island {
  id: string;
  label: string;
  href: string;
  archipelago: string; // Which group it belongs to
  position: { x: number; y: number };
  icon: string;
  color: string;
  size: 'small' | 'medium' | 'large';
  description?: string;
}

export interface Archipelago {
  id: string;
  label: string;
  color: string;
  icon: string;
  center: { x: number; y: number };
  description: string;
}

/**
 * Define archipelagos (groups of related islands)
 */
export const archipelagos: Archipelago[] = [
  {
    id: 'home',
    label: 'Home Port',
    color: '#60a5fa', // blue
    icon: '🏠',
    center: { x: 0, y: 0 },
    description: 'Your starting point and main dashboard',
  },
  {
    id: 'fleet',
    label: 'Fleet Archipelago',
    color: '#22d3ee', // cyan
    icon: '🚢',
    center: { x: -600, y: -300 },
    description: 'Vessels, fleet management, and tracking',
  },
  {
    id: 'ports',
    label: 'Port Islands',
    color: '#4ade80', // green
    icon: '⚓',
    center: { x: 600, y: -300 },
    description: 'Ports, routes, and pre-arrival intelligence',
  },
  {
    id: 'commercial',
    label: 'Commerce Cluster',
    color: '#fb923c', // orange
    icon: '💰',
    center: { x: -600, y: 300 },
    description: 'Chartering, cargo, and freight operations',
  },
  {
    id: 'operations',
    label: 'Operations Bay',
    color: '#a78bfa', // purple
    icon: '⚙️',
    center: { x: 600, y: 300 },
    description: 'Voyage operations and calculations',
  },
  {
    id: 'finance',
    label: 'Finance Harbor',
    color: '#c084fc', // purple
    icon: '📊',
    center: { x: -300, y: 500 },
    description: 'Invoicing, payments, and financial management',
  },
  {
    id: 'documents',
    label: 'Document Cove',
    color: '#fbbf24', // amber
    icon: '📄',
    center: { x: 300, y: 500 },
    description: 'Bills of lading, documents, and cargo docs',
  },
  {
    id: 'analytics',
    label: 'Analytics Lighthouse',
    color: '#a855f7', // violet
    icon: '🔭',
    center: { x: 0, y: -600 },
    description: 'Reports, dashboards, and AI insights',
  },
];

/**
 * Map navigation sections to archipelagos
 */
const sectionToArchipelago: Record<string, string> = {
  home: 'home',
  fleet: 'fleet',
  ports: 'ports',
  commercial: 'commercial',
  'voyage-ops': 'operations',
  'cargo-docs': 'documents',
  'bunkers-emissions': 'fleet',
  finance: 'finance',
  'claims-compliance': 'operations',
  'crm-contacts': 'commercial',
  'people-team': 'home',
  'analytics-ai': 'analytics',
  'knowledge-rag': 'analytics',
  notifications: 'home',
  'ship-purchase': 'commercial',
};

/**
 * Generate island positions in a spiral pattern around archipelago centers
 */
function generateIslandPosition(
  archipelagoCenter: { x: number; y: number },
  index: number,
  total: number
): { x: number; y: number } {
  const radius = 150 + (index * 50) / total; // Spread islands
  const angle = (index / total) * Math.PI * 2 + Math.random() * 0.3; // Add randomness

  return {
    x: archipelagoCenter.x + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
    y: archipelagoCenter.y + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
  };
}

/**
 * Convert navigation data to islands
 */
export function generateIslands(): Island[] {
  const islands: Island[] = [];

  navSections.forEach((section) => {
    const archipelagoId = sectionToArchipelago[section.id] || 'home';
    const archipelago = archipelagos.find((a) => a.id === archipelagoId);

    if (!archipelago) return;

    section.items.forEach((item, index) => {
      const position = generateIslandPosition(
        archipelago.center,
        index,
        section.items.length
      );

      islands.push({
        id: item.href,
        label: item.label,
        href: item.href,
        archipelago: archipelagoId,
        position,
        icon: section.icon,
        color: archipelago.color,
        size: index < 3 ? 'large' : index < 8 ? 'medium' : 'small', // First few are larger
        description: item.label,
      });
    });
  });

  return islands;
}

/**
 * Generate connections between related islands
 */
export function generateConnections(islands: Island[]): Array<{ from: string; to: string }> {
  const connections: Array<{ from: string; to: string }> = [];

  // Connect islands within same archipelago
  const archipelagoGroups = new Map<string, Island[]>();
  islands.forEach((island) => {
    if (!archipelagoGroups.has(island.archipelago)) {
      archipelagoGroups.set(island.archipelago, []);
    }
    archipelagoGroups.get(island.archipelago)!.push(island);
  });

  // Create connections within archipelagos
  archipelagoGroups.forEach((group) => {
    if (group.length > 1) {
      // Connect first island to a few others
      const mainIsland = group[0];
      for (let i = 1; i < Math.min(4, group.length); i++) {
        connections.push({
          from: mainIsland.id,
          to: group[i].id,
        });
      }
    }
  });

  // Connect key islands across archipelagos
  const keyIslands = [
    '/vessels',
    '/ports',
    '/chartering',
    '/voyages',
    '/invoices',
  ];

  for (let i = 0; i < keyIslands.length - 1; i++) {
    connections.push({
      from: keyIslands[i],
      to: keyIslands[i + 1],
    });
  }

  return connections;
}
