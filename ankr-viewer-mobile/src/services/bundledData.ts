/**
 * Bundled Data Service
 * Pre-indexed documentation and app links for offline viewing
 * Perfect for investor presentations
 */

export interface BundledDocument {
  id: string;
  title: string;
  path: string;
  category: string;
  description: string;
  tags: string[];
  lastUpdated: string;
}

export interface BundledApp {
  id: string;
  name: string;
  description: string;
  platform: ('ios' | 'android' | 'web')[];
  status: 'live' | 'beta' | 'development';
  urls: {
    web?: string;
    ios?: string;
    android?: string;
    docs?: string;
  };
  icon: string;
  color: string;
}

export interface BundledCategory {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  icon: string;
}

// Pre-bundled apps for investor viewing
export const bundledApps: BundledApp[] = [
  {
    id: 'wowtruck',
    name: 'WowTruck TMS',
    description: 'Complete Transportation Management System with GPS tracking, e-way bills, and fleet management',
    platform: ['web', 'android', 'ios'],
    status: 'live',
    urls: {
      web: 'https://wowtruck.in',
      android: 'https://play.google.com/store/apps/details?id=in.wowtruck.app',
      docs: 'https://ankr.in/viewer/wowtruck',
    },
    icon: 'car',
    color: '#f59e0b',
  },
  {
    id: 'complymitra',
    name: 'ComplyMitra',
    description: 'AI-powered compliance management for GST, IT, MCA, and labor laws',
    platform: ['web', 'android'],
    status: 'live',
    urls: {
      web: 'https://complymitra.in',
      docs: 'https://ankr.in/viewer/complymitra',
    },
    icon: 'shield-checkmark',
    color: '#22c55e',
  },
  {
    id: 'bfc',
    name: 'BFC Platform',
    description: 'Banking, Finance & Credit platform with telematics-based insurance products',
    platform: ['web', 'android', 'ios'],
    status: 'beta',
    urls: {
      web: 'https://bfc.ankr.in',
      docs: 'https://ankr.in/viewer/bfc',
    },
    icon: 'card',
    color: '#3b82f6',
  },
  {
    id: 'swayam',
    name: 'Swayam AI',
    description: 'Autonomous AI agent with 43+ specialized tools for logistics and compliance',
    platform: ['web'],
    status: 'live',
    urls: {
      web: 'https://swayam.ankr.in',
      docs: 'https://ankr.in/viewer/swayam',
    },
    icon: 'hardware-chip',
    color: '#8b5cf6',
  },
  {
    id: 'eon',
    name: 'EON Platform',
    description: 'Backend infrastructure with hybrid search, vector DB, and event streaming',
    platform: ['web'],
    status: 'live',
    urls: {
      web: 'https://eon.ankr.in',
      docs: 'https://ankr.in/viewer/eon',
    },
    icon: 'server',
    color: '#06b6d4',
  },
  {
    id: 'ankr-viewer',
    name: 'ANKR Viewer',
    description: 'Knowledge browser with Obsidian-like features for documentation',
    platform: ['web', 'android', 'ios'],
    status: 'live',
    urls: {
      web: 'https://ankr.in/viewer',
      docs: 'https://ankr.in/viewer/docs',
    },
    icon: 'book',
    color: '#ec4899',
  },
  {
    id: 'everpure',
    name: 'Everpure',
    description: 'Water purifier service management with IoT integration',
    platform: ['web', 'android'],
    status: 'live',
    urls: {
      web: 'https://everpure.in',
      docs: 'https://ankr.in/viewer/everpure',
    },
    icon: 'water',
    color: '#0ea5e9',
  },
  {
    id: 'kinara',
    name: 'Kinara Platform',
    description: 'Financial services platform for SME lending',
    platform: ['web'],
    status: 'development',
    urls: {
      docs: 'https://ankr.in/viewer/kinara',
    },
    icon: 'cash',
    color: '#10b981',
  },
];

// Pre-bundled document categories
export const bundledCategories: BundledCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Quick start guides and tutorials',
    documentCount: 15,
    icon: 'rocket',
  },
  {
    id: 'api-reference',
    name: 'API Reference',
    description: 'Complete API documentation and endpoints',
    documentCount: 45,
    icon: 'code-slash',
  },
  {
    id: 'integrations',
    name: 'Integrations',
    description: 'Third-party integration guides',
    documentCount: 43,
    icon: 'extension-puzzle',
  },
  {
    id: 'architecture',
    name: 'Architecture',
    description: 'System design and technical architecture',
    documentCount: 12,
    icon: 'git-network',
  },
  {
    id: 'packages',
    name: 'Packages',
    description: 'NPM packages documentation',
    documentCount: 21,
    icon: 'cube',
  },
  {
    id: 'compliance',
    name: 'Compliance',
    description: 'Regulatory and compliance documentation',
    documentCount: 18,
    icon: 'shield-checkmark',
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Security policies and best practices',
    documentCount: 8,
    icon: 'lock-closed',
  },
  {
    id: 'deployment',
    name: 'Deployment',
    description: 'Deployment and DevOps guides',
    documentCount: 9,
    icon: 'cloud-upload',
  },
];

// Pre-indexed documents (metadata only, content fetched on demand)
export const bundledDocuments: BundledDocument[] = [
  // Getting Started
  {
    id: 'quickstart',
    title: 'Quick Start Guide',
    path: 'docs/getting-started/quickstart.md',
    category: 'getting-started',
    description: 'Get up and running with ANKR platform in 5 minutes',
    tags: ['beginner', 'setup', 'tutorial'],
    lastUpdated: '2026-01-15',
  },
  {
    id: 'installation',
    title: 'Installation Guide',
    path: 'docs/getting-started/installation.md',
    category: 'getting-started',
    description: 'Step-by-step installation instructions',
    tags: ['setup', 'npm', 'installation'],
    lastUpdated: '2026-01-10',
  },
  // API Reference
  {
    id: 'api-overview',
    title: 'API Overview',
    path: 'docs/api/overview.md',
    category: 'api-reference',
    description: 'Introduction to ANKR APIs',
    tags: ['api', 'rest', 'graphql'],
    lastUpdated: '2026-01-18',
  },
  {
    id: 'authentication',
    title: 'Authentication',
    path: 'docs/api/authentication.md',
    category: 'api-reference',
    description: 'API authentication and authorization',
    tags: ['api', 'auth', 'jwt', 'oauth'],
    lastUpdated: '2026-01-12',
  },
  // Integrations
  {
    id: 'upi-integration',
    title: 'UPI Integration',
    path: 'docs/integrations/upi.md',
    category: 'integrations',
    description: 'Integrate UPI payments via Razorpay/PayU',
    tags: ['payments', 'upi', 'razorpay'],
    lastUpdated: '2026-01-08',
  },
  {
    id: 'whatsapp-integration',
    title: 'WhatsApp Integration',
    path: 'docs/integrations/whatsapp.md',
    category: 'integrations',
    description: 'WhatsApp Business API integration',
    tags: ['messaging', 'whatsapp', 'notifications'],
    lastUpdated: '2026-01-14',
  },
  {
    id: 'telegram-integration',
    title: 'Telegram Integration',
    path: 'docs/integrations/telegram.md',
    category: 'integrations',
    description: 'Telegram bot integration for alerts',
    tags: ['messaging', 'telegram', 'bots'],
    lastUpdated: '2026-01-11',
  },
  // Packages
  {
    id: 'ankr-core',
    title: '@ankr/core',
    path: 'packages/ankr-core/README.md',
    category: 'packages',
    description: 'Core utilities and shared functionality',
    tags: ['npm', 'package', 'core'],
    lastUpdated: '2026-01-17',
  },
  {
    id: 'ankr-ui',
    title: '@ankr/ui',
    path: 'packages/ankr-ui/README.md',
    category: 'packages',
    description: 'UI component library',
    tags: ['npm', 'package', 'ui', 'components'],
    lastUpdated: '2026-01-16',
  },
  // Architecture
  {
    id: 'system-architecture',
    title: 'System Architecture',
    path: 'docs/architecture/overview.md',
    category: 'architecture',
    description: 'High-level system architecture overview',
    tags: ['architecture', 'design', 'microservices'],
    lastUpdated: '2026-01-05',
  },
  {
    id: 'data-flow',
    title: 'Data Flow',
    path: 'docs/architecture/data-flow.md',
    category: 'architecture',
    description: 'Data flow and event streaming architecture',
    tags: ['architecture', 'events', 'kafka'],
    lastUpdated: '2026-01-03',
  },
  // Compliance
  {
    id: 'gst-compliance',
    title: 'GST Compliance',
    path: 'docs/compliance/gst.md',
    category: 'compliance',
    description: 'GST filing and compliance automation',
    tags: ['compliance', 'gst', 'tax'],
    lastUpdated: '2026-01-19',
  },
  // Security
  {
    id: 'security-overview',
    title: 'Security Overview',
    path: 'docs/security/overview.md',
    category: 'security',
    description: 'Security policies and practices',
    tags: ['security', 'encryption', 'compliance'],
    lastUpdated: '2026-01-02',
  },
];

// Search within bundled data
export function searchBundledData(query: string): {
  apps: BundledApp[];
  documents: BundledDocument[];
  categories: BundledCategory[];
} {
  const lowerQuery = query.toLowerCase();

  const apps = bundledApps.filter(
    (app) =>
      app.name.toLowerCase().includes(lowerQuery) ||
      app.description.toLowerCase().includes(lowerQuery)
  );

  const documents = bundledDocuments.filter(
    (doc) =>
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.description.toLowerCase().includes(lowerQuery) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );

  const categories = bundledCategories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(lowerQuery) ||
      cat.description.toLowerCase().includes(lowerQuery)
  );

  return { apps, documents, categories };
}

// Get documents by category
export function getDocumentsByCategory(categoryId: string): BundledDocument[] {
  return bundledDocuments.filter((doc) => doc.category === categoryId);
}

// Get app by ID
export function getAppById(appId: string): BundledApp | undefined {
  return bundledApps.find((app) => app.id === appId);
}

// Get total counts for stats
export function getBundledStats() {
  return {
    totalApps: bundledApps.length,
    totalDocuments: bundledDocuments.length,
    totalCategories: bundledCategories.length,
    liveApps: bundledApps.filter((app) => app.status === 'live').length,
    totalIntegrations: 43,
    totalPackages: 21,
  };
}
