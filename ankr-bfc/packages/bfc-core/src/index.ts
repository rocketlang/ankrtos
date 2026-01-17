/**
 * @bfc/core
 *
 * Core package for ankrBFC - Transaction Behavioral Intelligence Platform
 *
 * Enterprise-grade banking platform providing:
 * - Type definitions for all domains
 * - Encryption at rest (AES-256-GCM)
 * - Blockchain audit trail
 * - Security (JWT, RBAC, roles)
 * - Observability (logging, metrics, health)
 * - Reliability (circuit breakers, retry, graceful shutdown)
 * - Caching (Redis)
 * - Data masking (PII protection, DPDP/GDPR)
 * - CBS integration (adapters for Finacle, Flexcube, etc.)
 * - EON memory integration (behavioral episodes)
 * - AI Proxy integration (credit decisions)
 */

// =============================================================================
// TYPES
// =============================================================================
export * from './types/index.js';

// =============================================================================
// CRYPTO (Encryption at Rest)
// =============================================================================
export * from './crypto/index.js';

// =============================================================================
// BLOCKCHAIN (Audit Trail with @ankr/docchain)
// =============================================================================
export * from './blockchain/index.js';

// =============================================================================
// SECURITY (JWT, RBAC, Roles, Permissions)
// =============================================================================
export * from './security/index.js';

// =============================================================================
// OBSERVABILITY (Logging, Metrics, Health Checks)
// =============================================================================
export * from './observability/index.js';

// =============================================================================
// RELIABILITY (Circuit Breakers, Retry, Graceful Shutdown)
// =============================================================================
export * from './reliability/index.js';

// =============================================================================
// CACHING (Redis)
// =============================================================================
export * from './cache/index.js';

// =============================================================================
// PRIVACY (Data Masking, PII Protection)
// =============================================================================
export * from './privacy/data-masking.js';

// =============================================================================
// INTEGRATIONS
// =============================================================================
// CBS (Core Banking System) Adapter
export * from './integrations/cbs-adapter.js';

// EON Memory Integration
export * from './integrations/eon.js';

// AI Proxy Integration
export * from './integrations/ai-proxy.js';

// =============================================================================
// NOTIFICATIONS (RBAC + ABAC)
// =============================================================================
export * from './notifications/index.js';

// =============================================================================
// REAL-TIME (WebSocket)
// =============================================================================
export * from './realtime/index.js';

// =============================================================================
// COMPLYMITRA (KYC, AML, GST/TDS)
// =============================================================================
export * from './integrations/complymitra.js';

// =============================================================================
// CREDIT ENGINE (AI Decisioning)
// =============================================================================
export * from './integrations/credit-engine.js';

// =============================================================================
// DOCCHAIN DMS (Document Management with Chain-of-Custody)
// =============================================================================
export * from './docchain/index.js';

// =============================================================================
// ANKR PACKAGES INTEGRATION (HRMS, CRM, ERP, Banking, etc.)
// =============================================================================
export * from './integrations/ankr-packages.js';

// =============================================================================
// ADMIN PANEL (Dashboard, Modules, Roles, Permissions)
// =============================================================================
export * from './admin/index.js';

// =============================================================================
// USER PORTAL (Customer-facing portal configuration)
// =============================================================================
export * from './portal/index.js';

// =============================================================================
// LOCALIZATION (11 Indian Languages + AI Translation)
// =============================================================================
export * from './localization/index.js';

// =============================================================================
// VERSION
// =============================================================================
export const VERSION = '1.0.0';
