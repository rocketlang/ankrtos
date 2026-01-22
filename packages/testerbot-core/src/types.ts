/**
 * Core types and interfaces for TesterBot
 */

export interface TestConfig {
  /** Apps to test (desktop, web, mobile) */
  apps: string[];

  /** Environments to test (dev, staging, prod) */
  environments: string[];

  /** Test types to run (smoke, e2e, performance, visual) */
  testTypes: TestType[];

  /** Optional cron schedule (e.g., '0 *\/6 * * *') */
  schedule?: string;

  /** Attempt auto-fix on failure */
  autoFix?: boolean;

  /** Tags to filter tests */
  tags?: string[];

  /** Timeout in milliseconds */
  timeout?: number;

  /** Number of retries on failure */
  retries?: number;

  /** Notification configuration */
  notifications?: NotificationConfig;
}

export type TestType = 'smoke' | 'e2e' | 'performance' | 'visual' | 'stress' | 'chaos';

export type TestStatus = 'pass' | 'fail' | 'skip' | 'pending';

export interface Test {
  /** Unique test identifier */
  id: string;

  /** Test name */
  name: string;

  /** Test description */
  description?: string;

  /** Test type */
  type: TestType;

  /** App this test targets */
  app: string;

  /** Tags for filtering */
  tags: string[];

  /** Timeout in milliseconds */
  timeout?: number;

  /** Number of retries */
  retries?: number;

  /** Test function */
  fn: (agent: any) => Promise<void>;
}

export interface TestResult {
  /** Test ID */
  testId: string;

  /** Test name */
  testName: string;

  /** Test status */
  status: TestStatus;

  /** Duration in milliseconds */
  duration: number;

  /** Timestamp when test started */
  timestamp: Date;

  /** Error details if failed */
  error?: {
    message: string;
    stack?: string;
    screenshot?: string;
    video?: string;
  };

  /** Console logs captured */
  logs?: string[];

  /** Screenshots taken */
  screenshots?: string[];

  /** Videos recorded (saved on failure) */
  videos?: string[];

  /** Performance metrics */
  metrics?: PerformanceMetrics;

  /** Visual regression comparison result */
  visualComparison?: VisualComparisonResult;

  /** Retry attempt number */
  retryCount?: number;
}

export interface VisualComparisonResult {
  /** Whether images match within threshold */
  matches: boolean;

  /** Number of different pixels */
  diffPixels: number;

  /** Percentage of different pixels (0-100) */
  diffPercentage: number;

  /** Path to diff image (if generated) */
  diffImagePath?: string;

  /** Path to baseline image */
  baselinePath: string;

  /** Path to current screenshot */
  currentPath: string;
}

export interface PerformanceMetrics {
  /** Startup time in ms */
  startupTime?: number;

  /** Memory usage in bytes */
  memoryUsage?: number;

  /** CPU usage percentage */
  cpuUsage?: number;

  /** Network latency in ms */
  networkLatency?: number;

  /** Bundle size in bytes */
  bundleSize?: number;

  /** FPS (frames per second) */
  fps?: number;
}

export interface TestReport {
  /** Report timestamp */
  timestamp: Date;

  /** Environment tested */
  environment: string;

  /** App tested */
  app: string;

  /** Summary statistics */
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };

  /** Individual test results */
  tests: TestResult[];

  /** Aggregated performance metrics */
  performance?: PerformanceMetrics;

  /** Fixes attempted */
  fixes?: FixResult[];

  /** Screenshots directory */
  screenshotsDir?: string;

  /** Videos directory */
  videosDir?: string;
}

export interface FixResult {
  /** Issue type */
  issueType: string;

  /** Fix attempted */
  fixName: string;

  /** Success status */
  success: boolean;

  /** Actions taken */
  actions: string[];

  /** Error if failed */
  error?: string;

  /** Timestamp */
  timestamp: Date;
}

export interface NotificationConfig {
  /** Slack webhook URL */
  slack?: string;

  /** Discord webhook URL */
  discord?: string;

  /** Email configuration */
  email?: {
    to: string[];
    from: string;
    smtp: {
      host: string;
      port: number;
      user: string;
      password: string;
    };
  };

  /** Notify on success */
  notifyOnSuccess?: boolean;

  /** Notify on failure (default: true) */
  notifyOnFailure?: boolean;
}

export interface DeploymentTarget {
  /** Target name */
  name: string;

  /** Host (IP or domain) */
  host: string;

  /** SSH port */
  port?: number;

  /** SSH user */
  user: string;

  /** SSH key path */
  keyPath?: string;

  /** Working directory on remote */
  workDir: string;
}
