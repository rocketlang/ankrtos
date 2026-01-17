/**
 * ankrBFC Type Definitions
 *
 * Central export for all domain types
 */

// Customer domain
export * from './customer.js';

// Credit domain
export * from './credit.js';

// Compliance domain
export * from './compliance.js';

// Common types

/**
 * Pagination input for list queries
 */
export interface PaginationInput {
  page?: number;
  limit?: number;
  cursor?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * API error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  requestId?: string;
}

/**
 * API success response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    requestId: string;
    duration: number;
  };
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: {
    name: string;
    status: 'up' | 'down';
    latency?: number;
  }[];
}

/**
 * Service configuration
 */
export interface ServiceConfig {
  port: number;
  host: string;
  environment: 'development' | 'staging' | 'production';
  database: {
    url: string;
  };
  redis?: {
    url: string;
  };
  eon?: {
    url: string;
  };
  aiProxy?: {
    url: string;
  };
  complymitra?: {
    url: string;
    apiKey: string;
  };
  encryption: {
    masterKey: string;
  };
  blockchain?: {
    mode: 'local' | 'ethereum' | 'polygon';
    rpcUrl?: string;
  };
}
