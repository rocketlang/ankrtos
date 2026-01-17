/**
 * BFC Observability
 *
 * Enterprise-grade logging, metrics, and tracing
 * Integrates with @ankr/pulse for dashboard
 */

// ============================================================================
// STRUCTURED LOGGING
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  requestId?: string;
  userId?: string;
  customerId?: string;
  sessionId?: string;
  branchCode?: string;
  module?: string;
  operation?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * BFC Logger
 *
 * Structured logging with context propagation
 */
export class BfcLogger {
  private defaultContext: LogContext = {};

  constructor(context?: LogContext) {
    if (context) {
      this.defaultContext = context;
    }
  }

  child(context: LogContext): BfcLogger {
    const logger = new BfcLogger({
      ...this.defaultContext,
      ...context,
    });
    return logger;
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.log('fatal', message, context, error);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...this.defaultContext,
        ...context,
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Output as JSON for log aggregation
    const output = JSON.stringify(entry);

    switch (level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
      case 'fatal':
        console.error(output);
        break;
    }
  }
}

// ============================================================================
// METRICS
// ============================================================================

export interface MetricLabels {
  [key: string]: string;
}

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  help: string;
  labels?: string[];
}

/**
 * BFC Metrics Collector
 *
 * Prometheus-compatible metrics
 */
export class BfcMetrics {
  private counters = new Map<string, Map<string, number>>();
  private gauges = new Map<string, Map<string, number>>();
  private histograms = new Map<string, Map<string, number[]>>();

  // Pre-defined BFC metrics
  static readonly METRICS = {
    // API metrics
    HTTP_REQUESTS_TOTAL: 'bfc_http_requests_total',
    HTTP_REQUEST_DURATION: 'bfc_http_request_duration_seconds',
    HTTP_REQUEST_SIZE: 'bfc_http_request_size_bytes',

    // Credit metrics
    CREDIT_APPLICATIONS_TOTAL: 'bfc_credit_applications_total',
    CREDIT_DECISIONS_TOTAL: 'bfc_credit_decisions_total',
    CREDIT_DECISION_DURATION: 'bfc_credit_decision_duration_seconds',

    // Customer metrics
    CUSTOMERS_TOTAL: 'bfc_customers_total',
    ACTIVE_SESSIONS: 'bfc_active_sessions',

    // Episode metrics
    EPISODES_TOTAL: 'bfc_episodes_total',
    EPISODE_SUCCESS_RATE: 'bfc_episode_success_rate',

    // Compliance metrics
    KYC_VERIFICATIONS_TOTAL: 'bfc_kyc_verifications_total',
    AML_ALERTS_TOTAL: 'bfc_aml_alerts_total',
    CONSENT_CHANGES_TOTAL: 'bfc_consent_changes_total',

    // CBS sync metrics
    CBS_SYNC_TOTAL: 'bfc_cbs_sync_total',
    CBS_SYNC_DURATION: 'bfc_cbs_sync_duration_seconds',
    CBS_SYNC_ERRORS: 'bfc_cbs_sync_errors_total',
  };

  increment(metric: string, labels?: MetricLabels, value = 1): void {
    const key = this.labelsToKey(labels);
    const current = this.counters.get(metric)?.get(key) || 0;

    if (!this.counters.has(metric)) {
      this.counters.set(metric, new Map());
    }
    this.counters.get(metric)!.set(key, current + value);
  }

  gauge(metric: string, value: number, labels?: MetricLabels): void {
    const key = this.labelsToKey(labels);

    if (!this.gauges.has(metric)) {
      this.gauges.set(metric, new Map());
    }
    this.gauges.get(metric)!.set(key, value);
  }

  histogram(metric: string, value: number, labels?: MetricLabels): void {
    const key = this.labelsToKey(labels);

    if (!this.histograms.has(metric)) {
      this.histograms.set(metric, new Map());
    }

    const values = this.histograms.get(metric)!.get(key) || [];
    values.push(value);
    this.histograms.get(metric)!.set(key, values);
  }

  /**
   * Timer utility for measuring durations
   */
  startTimer(): () => number {
    const start = process.hrtime.bigint();
    return () => {
      const end = process.hrtime.bigint();
      return Number(end - start) / 1e9; // Convert to seconds
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  export(): string {
    const lines: string[] = [];

    // Counters
    for (const [metric, values] of this.counters) {
      lines.push(`# TYPE ${metric} counter`);
      for (const [labels, value] of values) {
        lines.push(`${metric}${labels} ${value}`);
      }
    }

    // Gauges
    for (const [metric, values] of this.gauges) {
      lines.push(`# TYPE ${metric} gauge`);
      for (const [labels, value] of values) {
        lines.push(`${metric}${labels} ${value}`);
      }
    }

    // Histograms (simplified)
    for (const [metric, values] of this.histograms) {
      lines.push(`# TYPE ${metric} histogram`);
      for (const [labels, samples] of values) {
        const sum = samples.reduce((a, b) => a + b, 0);
        const count = samples.length;
        lines.push(`${metric}_sum${labels} ${sum}`);
        lines.push(`${metric}_count${labels} ${count}`);
      }
    }

    return lines.join('\n');
  }

  private labelsToKey(labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    const pairs = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `{${pairs}}`;
  }
}

// ============================================================================
// HEALTH CHECKS
// ============================================================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  message?: string;
}

export type HealthCheckFn = () => Promise<HealthCheck>;

/**
 * BFC Health Checker
 */
export class BfcHealthChecker {
  private checks: Map<string, HealthCheckFn> = new Map();
  private startTime = Date.now();
  private version: string;

  constructor(version: string) {
    this.version = version;
  }

  registerCheck(name: string, check: HealthCheckFn): void {
    this.checks.set(name, check);
  }

  async getHealth(): Promise<HealthStatus> {
    const checkResults: HealthCheck[] = [];

    for (const [name, checkFn] of this.checks) {
      try {
        const start = Date.now();
        const result = await checkFn();
        result.latency = Date.now() - start;
        checkResults.push(result);
      } catch (error) {
        checkResults.push({
          name,
          status: 'down',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const allUp = checkResults.every(c => c.status === 'up');
    const anyDown = checkResults.some(c => c.status === 'down');

    return {
      status: anyDown ? 'unhealthy' : allUp ? 'healthy' : 'degraded',
      version: this.version,
      uptime: Date.now() - this.startTime,
      timestamp: new Date().toISOString(),
      checks: checkResults,
    };
  }

  /**
   * Liveness check (is the service running?)
   */
  async getLiveness(): Promise<{ status: 'ok' | 'error' }> {
    return { status: 'ok' };
  }

  /**
   * Readiness check (is the service ready to serve requests?)
   */
  async getReadiness(): Promise<{ status: 'ok' | 'error'; checks: HealthCheck[] }> {
    const health = await this.getHealth();
    return {
      status: health.status === 'unhealthy' ? 'error' : 'ok',
      checks: health.checks,
    };
  }
}

// ============================================================================
// DEFAULT INSTANCES
// ============================================================================

export const logger = new BfcLogger({ module: 'bfc' });
export const metrics = new BfcMetrics();
export const healthChecker = new BfcHealthChecker('1.0.0');

// ============================================================================
// FASTIFY PLUGIN
// ============================================================================

export function observabilityPlugin(app: any, options: { prefix?: string } = {}): void {
  const prefix = options.prefix || '';

  // Health endpoint
  app.get(`${prefix}/health`, async () => {
    return healthChecker.getHealth();
  });

  // Liveness probe
  app.get(`${prefix}/livez`, async () => {
    return healthChecker.getLiveness();
  });

  // Readiness probe
  app.get(`${prefix}/readyz`, async () => {
    return healthChecker.getReadiness();
  });

  // Metrics endpoint
  app.get(`${prefix}/metrics`, async (req: any, reply: any) => {
    reply.type('text/plain');
    return metrics.export();
  });

  // Request logging & metrics hook
  app.addHook('onRequest', async (request: any) => {
    request.startTime = process.hrtime.bigint();
    request.logger = logger.child({
      requestId: request.id,
      method: request.method,
      url: request.url,
    });
  });

  app.addHook('onResponse', async (request: any, reply: any) => {
    const duration = Number(process.hrtime.bigint() - request.startTime) / 1e9;

    metrics.increment(BfcMetrics.METRICS.HTTP_REQUESTS_TOTAL, {
      method: request.method,
      path: request.routeOptions?.url || request.url,
      status: reply.statusCode.toString(),
    });

    metrics.histogram(BfcMetrics.METRICS.HTTP_REQUEST_DURATION, duration, {
      method: request.method,
      path: request.routeOptions?.url || request.url,
    });

    request.logger?.info(`${request.method} ${request.url} ${reply.statusCode}`, {
      duration,
      statusCode: reply.statusCode,
    });
  });
}
