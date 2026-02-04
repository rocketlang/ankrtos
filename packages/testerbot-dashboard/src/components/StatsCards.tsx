import type { TestStats } from '../types';

interface StatsCardsProps {
  stats: TestStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Runs',
      value: stats.totalRuns.toLocaleString(),
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      color: 'text-blue-400',
    },
    {
      label: 'Pass Rate',
      value: `${stats.passRate}%`,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: stats.passRate >= 90 ? 'text-green-400' : stats.passRate >= 70 ? 'text-yellow-400' : 'text-red-400',
    },
    {
      label: 'Failed Tests',
      value: stats.failedTests.toLocaleString(),
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-red-400',
    },
    {
      label: 'Avg Duration',
      value: `${(stats.avgDuration / 1000).toFixed(1)}s`,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className="stat-card">
          <div className={card.color}>{card.icon}</div>
          <div className={`stat-value ${card.color}`}>{card.value}</div>
          <div className="stat-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
