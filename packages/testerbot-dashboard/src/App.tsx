import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { TestChart } from './components/TestChart';
import { DurationChart } from './components/DurationChart';
import { TestResultsTable } from './components/TestResultsTable';
import { ErrorDetails } from './components/ErrorDetails';
import { useWebSocket } from './hooks/useWebSocket';
import type { TestResult, TestStats, ChartData, DurationData } from './types';

// Demo data for development
const generateDemoData = () => {
  const statuses = ['passed', 'failed', 'skipped'] as const;
  const suites = ['Auth Tests', 'API Tests', 'UI Tests', 'Integration Tests', 'E2E Tests'];

  return Array.from({ length: 50 }, (_, i) => ({
    id: `test-${i + 1}`,
    name: `Test case ${i + 1}`,
    suite: suites[Math.floor(Math.random() * suites.length)],
    status: statuses[Math.floor(Math.random() * (i < 40 ? 1 : 3))] as TestResult['status'],
    duration: Math.floor(Math.random() * 5000) + 100,
    error: Math.random() > 0.7 ? 'AssertionError: Expected true to be false' : undefined,
    stackTrace: Math.random() > 0.7 ? `at Object.<anonymous> (test.ts:${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 50)})` : undefined,
    timestamp: new Date(Date.now() - Math.random() * 3600000),
    retries: Math.floor(Math.random() * 3),
    browser: 'chromium',
    viewport: '1920x1080',
  }));
};

const demoResults = generateDemoData();

const demoStats: TestStats = {
  totalRuns: 127,
  totalTests: 4523,
  passRate: 94.2,
  avgDuration: 1234,
  failedTests: 262,
  lastRun: new Date(),
};

const demoChartData: ChartData[] = [
  { name: 'Mon', passed: 45, failed: 3, skipped: 2 },
  { name: 'Tue', passed: 52, failed: 5, skipped: 1 },
  { name: 'Wed', passed: 48, failed: 2, skipped: 3 },
  { name: 'Thu', passed: 51, failed: 4, skipped: 2 },
  { name: 'Fri', passed: 55, failed: 1, skipped: 4 },
  { name: 'Sat', passed: 40, failed: 2, skipped: 1 },
  { name: 'Sun', passed: 42, failed: 3, skipped: 2 },
];

const demoDurationData: DurationData[] = [
  { name: 'Auth', duration: 1200, avg: 1100 },
  { name: 'API', duration: 850, avg: 900 },
  { name: 'UI', duration: 2100, avg: 1800 },
  { name: 'Integration', duration: 3500, avg: 3200 },
  { name: 'E2E', duration: 5200, avg: 4800 },
];

function App() {
  const { isConnected, recentResults } = useWebSocket({ autoConnect: false });
  const [results, setResults] = useState<TestResult[]>(demoResults);
  const [stats] = useState<TestStats>(demoStats);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Update with real-time results when connected
  useEffect(() => {
    if (recentResults.length > 0) {
      setResults(recentResults);
    }
  }, [recentResults]);

  const filteredResults = results.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const currentStats = {
    ...stats,
    passRate: Math.round((results.filter(r => r.status === 'passed').length / results.length) * 1000) / 10,
    failedTests: results.filter(r => r.status === 'failed').length,
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header isConnected={isConnected} />

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <StatsCards stats={currentStats} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <TestChart data={demoChartData} />
          <DurationChart data={demoDurationData} />
        </div>

        {/* Results Table */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            <div className="flex gap-2">
              {['all', 'passed', 'failed', 'skipped'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} capitalize`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <TestResultsTable
            results={filteredResults}
            onSelect={setSelectedResult}
          />
        </div>

        {/* Error Details Modal */}
        {selectedResult && (
          <ErrorDetails
            result={selectedResult}
            onClose={() => setSelectedResult(null)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
