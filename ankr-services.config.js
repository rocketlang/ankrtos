/**
 * ANKR Services Central Configuration
 * ====================================
 * Single source of truth for ALL service ports, paths, and settings.
 * 
 * HOW TO USE IN YOUR APP:
 * -----------------------
 * const { getServiceConfig, getPort } = require('/root/ankr-services.config.js');
 * const config = getServiceConfig('my-service-name');
 * const port = getPort('my-service-name');
 * 
 * PM2 Usage:
 *   pm2 start /root/ecosystem.config.js
 *   /root/ankr-ctl.sh start|stop|restart|status|ports|health
 * 
 * Updated: 2026-01-09
 */

// =============================================================================
// SERVICE DEFINITIONS
// =============================================================================

const SERVICES = {
  // ==================== AI/Gateway Services (4400-4499) ====================
  'ai-proxy': {
    port: 4444,
    path: '/root/ankr-labs-nx/apps/ai-proxy',
    command: 'npx tsx src/server.ts',
    description: 'Central AI Gateway - routes to Groq, OpenAI, DeepSeek, LongCat',
    domains: ['compliance.ankr.digital/api/ai', 'saathi.ankr.in'],
    healthEndpoint: '/health',
  },

  // ==================== Compliance/CompliMitra (4001, 4015) ====================
  'ankr-compliance-api': {
    port: 4001,
    path: '/root/ankr-compliance',
    command: 'node dist/apps/api/main.js',
    instances: 2,
    cluster: true,
    description: 'Compliance API (GraphQL) - 38 compliance rules, full frontend backend',
    domains: ['compliance.ankr.digital', 'app.complymitra.in'],
    healthEndpoint: '/health',
    env: {
      DATABASE_URL: 'postgresql://ankr:ankrSecure2025@localhost:5434/compliance',
      REDIS_URL: 'redis://localhost:6381',
    },
  },
  'complymitra-api': {
    port: 4015,
    path: '/root/ankr-labs-nx/apps/complymitra-api',
    command: 'npx tsx src/index.ts',
    description: 'ComplyMitra Tools API - 105 AI tools, ULIP wizards, Work Wizard',
    domains: ['api.complymitra.in'],
    healthEndpoint: '/health',
    env: {
      PORT: 4015,
    },
  },

  // ==================== CRM Services (4010-4019, 5177) ====================
  'ankr-crm-backend': {
    port: 4010,
    path: '/root/ankr-labs-nx/apps/ankr-crm/backend',
    command: 'npx tsx src/index.ts',
    description: 'CRM Backend API (Internal)',
    healthEndpoint: '/health',
    env: {
      BACKEND_PORT: 4010,
      DATABASE_URL: 'postgresql://postgres:indrA@0612@localhost:5432/ankr_crm?schema=public',
    },
  },
  'ankr-crm-bff': {
    port: 4011,
    path: '/root/ankr-labs-nx/apps/ankr-crm/bff',
    command: 'npx tsx src/index.ts',
    description: 'CRM BFF (GraphQL Gateway)',
    domains: ['crm.ankr.in'],
    healthEndpoint: '/health',
    env: {
      BFF_PORT: 4011,
      BACKEND_URL: 'http://localhost:4010',
      DATABASE_URL: 'postgresql://postgres:indrA@0612@localhost:5432/ankr_crm?schema=public',
    },
  },
  'ankr-crm-frontend': {
    port: 5177,
    path: '/root/ankr-labs-nx/apps/ankr-crm/frontend',
    command: 'npx vite --host 0.0.0.0 --port 5177',
    description: 'CRM Frontend (Vite)',
    domains: ['crm.ankr.in'],
    healthEndpoint: '/',
  },

  // ==================== WowTruck Services (4000, 3002) ====================
  'wowtruck-backend': {
    port: 4000,
    path: '/root/ankr-labs-nx/apps/wowtruck/backend',
    command: 'npx tsx src/index.ts',
    description: 'WowTruck TMS Backend (GraphQL + ANKR Stack)',
    domains: ['wowtruck.ankr.in'],
    healthEndpoint: '/health',
    env: {
      PORT: 4000,
      DATABASE_URL: 'postgresql://ankr:indrA@0612@localhost:5433/ankr_eon',
    },
  },

  // ==================== Swayam/BANI Voice Services (7777-7799) ====================
  'swayam-bani': {
    port: 7777,
    path: '/root/swayam/api-bani',
    command: 'npx tsx server.ts',
    description: 'BANI Voice AI (21 languages, 30 voices, MCP tools)',
    domains: ['baniai.io', 'bani.ankr.in', 'swayam.ankr.in/voice'],
    healthEndpoint: '/health',
    env: {
      PORT: 7777,
    },
  },
  'swayam-dashboard': {
    port: 7780,
    path: '/root/swayam',
    command: 'npx serve -s . -l 7780',
    description: 'Swayam Dashboard (Static)',
    domains: ['swayam.ankr.in', 'swayam.digimitra.guru'],
    healthEndpoint: '/',
    env: {
      PORT: 7780,
    },
  },

  // ==================== Saathi Service (4008) - 4002 reserved for BitNinja ====================
  'saathi-server': {
    port: 4008,
    path: '/root/ankr-labs-nx/apps/saathi-server',
    command: 'npx tsx src/main.ts',
    description: 'Saathi Server (Fastify)',
    domains: ['saathi.ankr.in'],
    healthEndpoint: '/health',
    disabled: false,
    env: {
      PORT: 4008,
    },
  },

  // ==================== Internal Services ====================
  'verdaccio': {
    port: 4873,
    path: '/root/ankr-labs-nx',
    command: 'npx verdaccio --config /root/.config/verdaccio/config.yaml',
    description: 'Local NPM Registry for @ankr/* packages',
    healthEndpoint: '/-/ping',
    disabled: false,
  },

  'ankr-eon': {
    port: 4005,
    path: '/root/ankr-labs-nx/packages/ankr-eon',
    command: 'npx tsx src/server.ts',
    description: 'EON Memory & Learning System (GraphQL)',
    healthEndpoint: '/health',
    disabled: false,
    env: {
      PORT: 4005,
      DATABASE_URL: 'postgresql://ankr:indrA@0612@localhost:5433/ankr_eon',
    },
  },

  'ankr-interact': {
    port: 3199,
    path: '/root/ankr-labs-nx/packages/ankr-interact',
    command: 'npx tsx src/server/index.ts',
    description: 'ANKR Interact - Knowledge Browser & Viewer (GuruJi Reports + 491 docs)',
    domains: ['ankr.in', 'ankr.in/documents', 'ankr.in/project'],
    healthEndpoint: '/api/files',
    disabled: false,
    env: {
      PORT: 3199,
      DATABASE_URL: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon',
      DOCS_DIR: '/root/ankr-labs-nx/packages/ankr-interact/data/documents',
      GURUJI_REPORTS: '/root/ankr-labs-nx/packages/ankr-interact/data/documents/guruji-reports',
    },
  },

  'ankr-viewer': {
    port: 4350,
    path: '/root/ankr-viewer-wrapper',
    command: 'node server.js',
    description: 'ANKR Document Viewer (Legacy - use ankr-interact instead)',
    healthEndpoint: '/',
    disabled: true,
    env: {
      PORT: 4350,
    },
  },

  'ankr-security': {
    port: 4480,
    path: '/root/ankr-labs-nx/packages/ankr-security',
    command: 'node dist/server.js',
    description: 'ANKR Security Gateway (WAF, Rate Limiting)',
    healthEndpoint: '/health',
    disabled: false,
    cluster: true,
    env: {
      PORT: 4480,
    },
  },

  'bfc-api': {
    port: 4020,
    path: '/root/ankr-bfc/apps/bfc-api',
    command: 'npx tsx src/main.ts',
    description: 'BFC Banking Finance Customer API (GraphQL)',
    domains: ['bfc.ankr.in'],
    healthEndpoint: '/health',
    disabled: false,
    env: {
      PORT: 4020,
      DATABASE_URL: 'postgresql://ankr:indrA@0612@localhost:5433/ankr_eon',
    },
  },

  // ==================== ankrshield Services (4250, 5250) ====================
  'ankrshield-api': {
    port: 4250,
    path: '/root/ankrshield/apps/api',
    command: 'npx tsx src/main.ts',
    description: 'ankrshield API - Privacy & AI Governance Platform (GraphQL)',
    domains: ['shield.ankr.in'],
    healthEndpoint: '/health',
    disabled: false,
    env: {
      PORT: 4250,
      DATABASE_URL: 'postgresql://ankrshield:ankrshield123@localhost:5432/ankrshield',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'ankrshield-jwt-secret-change-in-production',
      NODE_ENV: 'development',
    },
  },

  'ankrshield-web': {
    port: 5250,
    path: '/root/ankrshield/apps/web',
    command: 'npx vite --host 0.0.0.0 --port 5250',
    description: 'ankrshield Web Dashboard (Vite + React)',
    domains: ['shield.ankr.in'],
    healthEndpoint: '/',
    disabled: false,
    env: {
      PORT: 5250,
      VITE_API_URL: 'http://localhost:4250/graphql',
    },
  },

  // ==================== ankr-maritime (Maritime Operations) (4051, 3008) ====================
  'ankr-maritime-backend': {
    port: 4051,
    path: '/root/apps/ankr-maritime/backend',
    command: 'npx tsx src/main.ts',
    description: 'ankrMrk8X Maritime Operations API (Fastify + Mercurius GraphQL)',
    domains: ['maritime.ankr.in'],
    healthEndpoint: '/health',
    disabled: false,
    env: {
      PORT: 4051,
      DATABASE_URL: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_maritime',
      JWT_SECRET: 'ankr-maritime-jwt-secret-change-in-production',
      FRONTEND_URL: 'http://localhost:3008',
    },
  },
  'ankr-maritime-frontend': {
    port: 3008,
    path: '/root/apps/ankr-maritime/frontend',
    command: 'npx vite --host 0.0.0.0 --port 3008',
    description: 'ankrMrk8X Maritime Frontend (Vite + React 19)',
    domains: ['maritime.ankr.in'],
    healthEndpoint: '/',
    disabled: false,
    env: {
      PORT: 3008,
    },
  },

  'fr8x-backend': {
    port: 4050,
    path: '/root/ankr-labs-nx/apps/fr8x/backend',
    command: 'npx tsx src/main.ts',
    description: 'Fr8X Freight Exchange API (GraphQL)',
    domains: ['fr8x.in'],
    healthEndpoint: '/health',
    disabled: true,  // Disabled - needs fixing (had 6900+ restarts)
    env: {
      PORT: 4050,
    },
  },

  'driver-app': {
    port: 3004,
    path: '/root/ankr-labs-nx/apps/driver-app',
    command: 'npx expo start --web --port 3004',
    description: 'Driver Mobile App (Expo Web)',
    healthEndpoint: '/',
    disabled: true,  // Enable when needed
    env: {
      PORT: 3004,
    },
  },

  'ankr-voice-service': {
    port: 4100,
    path: '/root/ankr-labs-nx/ankr-voice-service',
    command: 'npx tsx src/main.ts',
    description: 'Voice Service (Hindi/Multilingual)',
    healthEndpoint: '/health',
    disabled: true,  // Disabled to save memory - enable when needed
    env: {
      PORT: 4100,
    },
  },

  'ankr-omega': {
    port: 4200,
    path: '/root/ankr-labs-nx/apps/ankr-omega',
    command: 'npx tsx src/main.ts',
    description: 'AI Builder Interface (EON Brain) - Express/WebSocket',
    healthEndpoint: '/health',
    disabled: true,  // Disabled to save memory - enable when needed
  },

  'ankr-pulse': {
    port: 4888,
    path: '/root/ankr-labs-nx/apps/ankr-pulse',
    command: 'npx vite --host 0.0.0.0 --port 4888',
    description: 'Real-time Observability Dashboard (Internal Tools port range)',
    healthEndpoint: '/',
    disabled: true,  // Disabled to save memory - enable when needed
  },

  // ==================== Freightbox ====================
  'freightbox-backend': {
    port: 4003,
    path: '/root/ankr-labs-nx/apps/freightbox/backend',
    command: 'npx tsx src/main.ts',
    description: 'Freightbox BFF (GraphQL)',
    domains: ['api.freightbox.org'],
    healthEndpoint: '/health',
    disabled: false,
    maxMemory: '256M',
    env: {
      PORT: 4003,
      NODE_OPTIONS: '--max-old-space-size=256',
    },
  },
  'freightbox-frontend': {
    port: 3001,
    path: '/root/ankr-labs-nx/apps/freightbox/frontend',
    command: 'node node_modules/next/dist/bin/next start -p 3001',
    description: 'Freightbox Dashboard (Next.js)',
    domains: ['freightbox.org', 'freightbox.ankr.in'],
    healthEndpoint: '/',
    disabled: false,
    maxMemory: '512M',
  },

  // ==================== ERP Bharat (Static + API) ====================
  'erpbharat-api': {
    port: 3002,
    path: '/root/power-erp/apps/api',
    command: 'npx tsx src/index.ts',
    description: 'ERP Bharat API Backend',
    domains: ['erpbharat.org'],
    healthEndpoint: '/health',
    disabled: false,
    env: {
      PORT: 3002,
    },
  },

  // ==================== Ever Pure (E-commerce) ====================
  'everpure-api': {
    port: 3005,
    path: '/root/everpure-backend',
    command: 'npx tsx src/server.ts',
    description: 'Ever Pure E-commerce API (Fastify + GraphQL)',
    domains: ['ever-pure.in'],
    healthEndpoint: '/health',
    disabled: false,
    env: {
      PORT: 3005,
    },
  },

  // ==================== DevBrain (4030) ====================
  'devbrain': {
    port: 4030,
    path: '/root/ankr-labs-nx/packages/ankr-devbrain',
    command: 'node devbrain-api.js',
    description: 'DevBrain API - Code search with embeddings (Nomic/Cohere)',
    domains: ['ankr.in/devbrain'],
    healthEndpoint: '/health',
    disabled: true,  // Disabled to save memory - enable when needed
    env: {
      PORT: 4030,
    },
  },

  // ==================== AnkrForge (Custom-Fit Platform) ====================
  'ankrforge-api': {
    port: 4201,
    path: '/root/ankr-forge/apps/forge-api',
    command: 'npx tsx src/index.ts',
    description: 'AnkrForge API - Custom-Fit-as-a-Service (Fastify + GraphQL)',
    domains: ['ankrforge.in', 'forge.ankr.in'],
    healthEndpoint: '/health',
    disabled: false,
    env: {
      PORT: 4201,
      DATABASE_URL: 'postgresql://ankr:indrA@0612@localhost:5432/ankrforge',
    },
  },
  'ankrforge-web': {
    port: 3200,
    path: '/root/ankr-forge/apps/forge-web',
    command: 'npx vite --host 0.0.0.0 --port 3200',
    description: 'AnkrForge Web - Custom-Fit Product Frontend (React + Vite)',
    domains: ['ankrforge.in', 'forge.ankr.in'],
    healthEndpoint: '/',
    disabled: false,
  },
};

// =============================================================================
// DATABASE CONFIGURATIONS
// =============================================================================

const DATABASES = {
  // PostgreSQL
  postgres_main: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'indrA@0612',
    database: 'ankr_crm',
  },
  postgres_eon: {
    host: 'localhost',
    port: 5433,
    user: 'ankr',
    password: 'indrA@0612',
    database: 'ankr_eon',
    description: 'WowTruck, Swayam, EON Memory',
  },
  postgres_compliance: {
    host: 'localhost',
    port: 5434,
    user: 'ankr',
    password: 'ankrSecure2025',
    database: 'compliance',
    description: 'Ankr Compliance/CompliMitra',
  },

  // Redis
  redis_main: { host: 'localhost', port: 6379 },
  redis_eon: { host: 'localhost', port: 6380 },
  redis_compliance: { host: 'localhost', port: 6381 },
};

// =============================================================================
// PORT RANGES (Reserved)
// =============================================================================

const PORT_RANGES = {
  frontends: { start: 3000, end: 3099, description: 'Frontend apps (Vite, Next.js)' },
  backends: { start: 4000, end: 4099, description: 'Backend APIs' },
  ai_gateway: { start: 4400, end: 4499, description: 'AI/Gateway services' },
  internal: { start: 4800, end: 4899, description: 'Internal tools (Verdaccio, etc)' },
  crm: { start: 5170, end: 5199, description: 'CRM frontends' },
  postgres: { start: 5432, end: 5434, description: 'PostgreSQL databases' },
  redis: { start: 6379, end: 6381, description: 'Redis instances' },
  voice: { start: 7700, end: 7799, description: 'Voice/Swayam services' },
};

// Reserved ports - DO NOT USE
const RESERVED_PORTS = {
  1167: 'R1Soft Backup Agent',
  4002: 'BitNinja Security Service',
  22: 'SSH',
  25: 'SMTP',
  53: 'DNS',
  80: 'Nginx HTTP',
  443: 'Nginx HTTPS',
};

// =============================================================================
// HELPER FUNCTIONS (for use by individual apps)
// =============================================================================

/**
 * Get full config for a service
 * @param {string} serviceName 
 * @returns {object} Service configuration
 */
function getServiceConfig(serviceName) {
  const config = SERVICES[serviceName];
  if (!config) {
    throw new Error(`Service '${serviceName}' not found in central config`);
  }
  return config;
}

/**
 * Get port for a service
 * @param {string} serviceName 
 * @returns {number} Port number
 */
function getPort(serviceName) {
  return getServiceConfig(serviceName).port;
}

/**
 * Get database config
 * @param {string} dbName 
 * @returns {object} Database configuration
 */
function getDatabase(dbName) {
  const db = DATABASES[dbName];
  if (!db) {
    throw new Error(`Database '${dbName}' not found in central config`);
  }
  return db;
}

/**
 * Get database URL for a database
 * @param {string} dbName 
 * @returns {string} PostgreSQL connection URL
 */
function getDatabaseUrl(dbName) {
  const db = getDatabase(dbName);
  return `postgresql://${db.user}:${db.password}@${db.host}:${db.port}/${db.database}`;
}

/**
 * Get internal service URL
 * @param {string} serviceName 
 * @returns {string} http://localhost:port
 */
function getServiceUrl(serviceName) {
  const port = getPort(serviceName);
  return `http://localhost:${port}`;
}

/**
 * List all enabled services
 * @returns {string[]} Array of service names
 */
function getEnabledServices() {
  return Object.entries(SERVICES)
    .filter(([_, config]) => !config.disabled)
    .map(([name]) => name);
}

/**
 * List all services (including disabled)
 * @returns {string[]} Array of service names
 */
function getAllServices() {
  return Object.keys(SERVICES);
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  SERVICES,
  DATABASES,
  PORT_RANGES,
  // Helper functions
  getServiceConfig,
  getPort,
  getDatabase,
  getDatabaseUrl,
  getServiceUrl,
  getEnabledServices,
  getAllServices,
};
