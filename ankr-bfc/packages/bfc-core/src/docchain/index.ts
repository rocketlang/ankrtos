/**
 * DocChain DMS - Document Management System with Blockchain-style Integrity
 *
 * Features:
 * - Immutable audit trails with cryptographic chain-of-custody
 * - All reports auto-docchained for RBI/bank audit compliance
 * - Integration with @ankr/dms, @ankr/audit-trail, @ankr/document-ai
 * - Digital signatures (DSC, Aadhaar eSign)
 * - Regulatory report submission tracking
 * - 7-year retention with automated archival
 */

// Types
export * from './types';

// Services
export { DocChainService, createDocChainService } from './service';
export type { DocChainConfig } from './service';

// Reports
export { ReportService, createReportService, REPORT_DEFINITIONS } from './reports';
