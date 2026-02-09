import React, { useState } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface RevenueForecast {
  month: string;
  category: 'freight' | 'hire' | 'demurrage' | 'commission' | 'bunker_hedge' | 'other';
  projected: number;
  actual: number;
  variance: number;
  confidence: number;
}

interface CashFlowEntry {
  type: 'inflow' | 'outflow';
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'cleared' | 'pending';
}

const FinancialDashboardShowcase: React.FC = () => {
  const [selectedYear] = useState<number>(2026);
  const [timeRange, setTimeRange] = useState<string>('6M');

  const revenueForecasts: RevenueForecast[] = [
    { month: 'Jan', category: 'freight', projected: 2850000, actual: 2920000, variance: 70000, confidence: 92 },
    { month: 'Jan', category: 'hire', projected: 1200000, actual: 1180000, variance: -20000, confidence: 88 },
    { month: 'Jan', category: 'demurrage', projected: 150000, actual: 185000, variance: 35000, confidence: 75 },
    { month: 'Feb', category: 'freight', projected: 3100000, actual: 0, variance: 0, confidence: 89 },
    { month: 'Feb', category: 'hire', projected: 1350000, actual: 0, variance: 0, confidence: 90 },
    { month: 'Feb', category: 'demurrage', projected: 120000, actual: 0, variance: 0, confidence: 70 },
  ];

  const cashFlowEntries: CashFlowEntry[] = [
    { type: 'inflow', category: 'Freight Revenue', amount: 2920000, date: '2026-01-28', description: 'VOY-SG-RTM-045 Final Payment', status: 'cleared' },
    { type: 'inflow', category: 'Time Charter Hire', amount: 1180000, date: '2026-01-15', description: 'Jan 2026 - MV FORTUNE STAR', status: 'cleared' },
    { type: 'inflow', category: 'Demurrage', amount: 185000, date: '2026-01-20', description: 'VOY-SH-SG-032 Settlement', status: 'cleared' },
    { type: 'outflow', category: 'Bunker Costs', amount: 845000, date: '2026-01-10', description: 'Singapore Bunker Purchase', status: 'cleared' },
    { type: 'outflow', category: 'Port Charges', amount: 125000, date: '2026-01-12', description: 'Singapore Port Dues', status: 'cleared' },
    { type: 'outflow', category: 'Crew Wages', amount: 380000, date: '2026-01-31', description: 'Monthly Payroll', status: 'cleared' },
    { type: 'outflow', category: 'Insurance', amount: 95000, date: '2026-01-05', description: 'P&I Premium Q1', status: 'cleared' },
    { type: 'inflow', category: 'Freight Revenue', amount: 1500000, date: '2026-02-15', description: 'VOY-BR-CN-048 Advance', status: 'pending' },
  ];

  const categoryColors = {
    freight: { bg: 'bg-blue-500', text: 'text-blue-400' },
    hire: { bg: 'bg-green-500', text: 'text-green-400' },
    demurrage: { bg: 'bg-yellow-500', text: 'text-yellow-400' },
    commission: { bg: 'bg-purple-500', text: 'text-purple-400' },
    bunker_hedge: { bg: 'bg-orange-500', text: 'text-orange-400' },
    other: { bg: 'bg-gray-500', text: 'text-gray-400' },
  };

  const totalProjected = revenueForecasts.reduce((sum, f) => sum + f.projected, 0);
  const totalActual = revenueForecasts.filter(f => f.actual > 0).reduce((sum, f) => sum + f.actual, 0);
  const totalInflow = cashFlowEntries.filter(e => e.type === 'inflow').reduce((sum, e) => sum + e.amount, 0);
  const totalOutflow = cashFlowEntries.filter(e => e.type === 'outflow').reduce((sum, e) => sum + e.amount, 0);
  const netCashFlow = totalInflow - totalOutflow;

  return (
    <ShowcaseLayout
      title="Financial Dashboard"
      icon="💰"
      category="Financial Management"
      problem="Revenue tracking in Excel, cash flow managed via bank statements, no forecasting visibility, financial reporting takes 2 weeks to close each month, and P&L accuracy under 85% due to missing accruals."
      solution="Real-time financial dashboard with automated revenue recognition, cash flow forecasting, category-based tracking (freight/hire/demurrage), variance analysis, and instant P&L reports - improving forecast accuracy to 94% and reducing month-end close to 3 days."
      timeSaved="2 weeks → 3 days"
      roi="42x"
      accuracy="94% forecast accuracy"
      nextSection={{
        title: 'Contract Management',
        path: '/demo-showcase/contract-management',
      }}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-4">
            <div className="text-blue-400 text-sm mb-1">Total Revenue (YTD)</div>
            <div className="text-3xl font-bold text-white">${(totalActual / 1000000).toFixed(1)}M</div>
            <div className="text-xs text-gray-500">+8.2% vs target</div>
          </div>
          <div className="bg-green-900/20 border-l-4 border-green-500 rounded-lg p-4">
            <div className="text-green-400 text-sm mb-1">Cash Inflow</div>
            <div className="text-3xl font-bold text-white">${(totalInflow / 1000000).toFixed(1)}M</div>
            <div className="text-xs text-gray-500">Last 30 days</div>
          </div>
          <div className="bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
            <div className="text-red-400 text-sm mb-1">Cash Outflow</div>
            <div className="text-3xl font-bold text-white">${(totalOutflow / 1000000).toFixed(1)}M</div>
            <div className="text-xs text-gray-500">Last 30 days</div>
          </div>
          <div className={`${netCashFlow > 0 ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'} border-l-4 rounded-lg p-4`}>
            <div className={`${netCashFlow > 0 ? 'text-green-400' : 'text-red-400'} text-sm mb-1`}>Net Cash Flow</div>
            <div className="text-3xl font-bold text-white">${(netCashFlow / 1000000).toFixed(1)}M</div>
            <div className="text-xs text-gray-500">Positive position</div>
          </div>
        </div>

        {/* Revenue Forecast */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Revenue Forecast vs Actual</h3>
            <div className="flex gap-2">
              {['3M', '6M', '1Y'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-sm ${
                    timeRange === range ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="grid grid-cols-6 gap-4 mb-6">
              {Object.entries(categoryColors).map(([category, colors]) => (
                <div key={category} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${colors.bg}`} />
                  <span className="text-xs text-gray-400 capitalize">{category.replace('_', ' ')}</span>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {['Jan', 'Feb'].map((month) => {
                const monthData = revenueForecasts.filter(f => f.month === month);
                const monthProjected = monthData.reduce((sum, f) => sum + f.projected, 0);
                const monthActual = monthData.reduce((sum, f) => sum + f.actual, 0);

                return (
                  <div key={month}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white font-semibold">{month} {selectedYear}</div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Projected:</span>
                          <span className="text-white font-semibold ml-2">${(monthProjected / 1000000).toFixed(2)}M</span>
                        </div>
                        {monthActual > 0 && (
                          <div>
                            <span className="text-gray-400">Actual:</span>
                            <span className="text-green-400 font-semibold ml-2">${(monthActual / 1000000).toFixed(2)}M</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 h-12 mb-2">
                      {monthData.map((forecast, idx) => {
                        const width = (forecast.projected / monthProjected) * 100;
                        return (
                          <div
                            key={idx}
                            className={`${categoryColors[forecast.category].bg} rounded transition-all hover:opacity-80 cursor-pointer`}
                            style={{ width: `${width}%` }}
                            title={`${forecast.category}: $${(forecast.projected / 1000).toFixed(0)}K`}
                          />
                        );
                      })}
                    </div>

                    {monthActual > 0 && (
                      <div className="flex gap-1 h-12">
                        {monthData.map((forecast, idx) => {
                          const width = (forecast.actual / monthActual) * 100;
                          return (
                            <div
                              key={idx}
                              className={`${categoryColors[forecast.category].bg} opacity-60 rounded transition-all hover:opacity-80 cursor-pointer`}
                              style={{ width: `${width}%` }}
                              title={`${forecast.category}: $${(forecast.actual / 1000).toFixed(0)}K (actual)`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cash Flow */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Recent Cash Flow Activity</h3>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">Amount</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {cashFlowEntries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">{entry.date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        entry.type === 'inflow' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{entry.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{entry.description}</td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${
                      entry.type === 'inflow' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {entry.type === 'inflow' ? '+' : '-'}${entry.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        entry.status === 'cleared' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📈</span> Financial Performance Indicators
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Forecast Accuracy</div>
              <div className="text-2xl font-bold text-green-400">94%</div>
              <div className="text-xs text-gray-500">vs 85% industry avg</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Month-End Close</div>
              <div className="text-2xl font-bold text-blue-400">3 days</div>
              <div className="text-xs text-gray-500">vs 14 days traditional</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Working Capital</div>
              <div className="text-2xl font-bold text-purple-400">$8.2M</div>
              <div className="text-xs text-gray-500">healthy position</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">EBITDA Margin</div>
              <div className="text-2xl font-bold text-yellow-400">32%</div>
              <div className="text-xs text-gray-500">above target</div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
};

export default FinancialDashboardShowcase;
