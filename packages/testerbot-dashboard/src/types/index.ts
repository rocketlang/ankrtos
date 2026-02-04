export type TestStatus = 'passed' | 'failed' | 'skipped' | 'pending' | 'running';

export interface TestResult {
  id: string;
  name: string;
  suite: string;
  status: TestStatus;
  duration: number; // ms
  error?: string;
  stackTrace?: string;
  timestamp: Date;
  retries: number;
  browser?: string;
  viewport?: string;
}

export interface TestRun {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  duration: number;
  results: TestResult[];
}

export interface TestStats {
  totalRuns: number;
  totalTests: number;
  passRate: number;
  avgDuration: number;
  failedTests: number;
  lastRun?: Date;
}

export interface ChartData {
  name: string;
  passed: number;
  failed: number;
  skipped: number;
}

export interface DurationData {
  name: string;
  duration: number;
  avg: number;
}
