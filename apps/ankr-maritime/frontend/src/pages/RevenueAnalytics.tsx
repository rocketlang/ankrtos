import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const REVENUE_FORECASTS = gql`
  query RevenueForecasts($year: Int!) {
    revenueForecasts(year: $year) {
      id period year month category projectedAmount actualAmount variance confidence methodology
    }
  }
`;

const REVENUE_FORECAST_SUMMARY = gql`
  query RevenueForecastSummary($year: Int!) {
    revenueForecastSummary(year: $year) {
      year month totalProjected totalActual variance
    }
  }
`;

const CASH_FLOW_SUMMARY = gql`
  query CashFlowSummary {
    cashFlowSummary {
      totalInflow totalOutflow netCashFlow
    }
  }
`;

const CREATE_FORECAST = gql`
  mutation CreateRevenueForecast(
    $year: Int!, $month: Int!, $category: String!,
    $projectedAmount: Float!, $confidence: Float,
    $methodology: String, $assumptions: String
  ) {
    createRevenueForecast(
      year: $year, month: $month, category: $category,
      projectedAmount: $projectedAmount, confidence: $confidence,
      methodology: $methodology, assumptions: $assumptions
    ) { id period }
  }
`;

const RECORD_ACTUAL = gql`
  mutation RecordActualRevenue($forecastId: String!, $actualAmount: Float!) {
    recordActualRevenue(forecastId: $forecastId, actualAmount: $actualAmount) {
      id actualAmount variance
    }
  }
`;

const CREATE_CASH_FLOW_ENTRY = gql`
  mutation CreateCashFlowEntry(
    $type: String!, $category: String!, $amount: Float!,
    $currency: String, $description: String, $entryDate: String
  ) {
    createCashFlowEntry(
      type: $type, category: $category, amount: $amount,
      currency: $currency, description: $description, entryDate: $entryDate
    ) { id }
  }
`;

const categories = ['freight', 'hire', 'demurrage', 'commission', 'bunker_hedge', 'other'] as const;

const categoryColors: Record<string, string> = {
  freight: 'bg-blue-500',
  hire: 'bg-green-500',
  demurrage: 'bg-yellow-500',
  commission: 'bg-purple-500',
  bunker_hedge: 'bg-orange-500',
  other: 'bg-gray-500',
};

const categoryBarColors: Record<string, { projected: string; actual: string }> = {
  freight: { projected: 'bg-blue-500', actual: 'bg-blue-400/60' },
  hire: { projected: 'bg-green-500', actual: 'bg-green-400/60' },
  demurrage: { projected: 'bg-yellow-500', actual: 'bg-yellow-400/60' },
  commission: { projected: 'bg-purple-500', actual: 'bg-purple-400/60' },
  bunker_hedge: { projected: 'bg-orange-500', actual: 'bg-orange-400/60' },
  other: { projected: 'bg-gray-500', actual: 'bg-gray-400/60' },
};

const methodologies = ['historical_average', 'weighted_trend', 'seasonal_adjustment', 'expert_estimate', 'regression', 'manual'] as const;

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Forecast = {
  id: string;
  period: string;
  year: number;
  month: number;
  category: string;
  projectedAmount: number;
  actualAmount: number | null;
  variance: number | null;
  confidence: number | null;
  methodology: string | null;
};

type MonthlySummary = {
  year: number;
  month: number;
  totalProjected: number;
  totalActual: number;
  variance: number;
};

type CashFlow = {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
};

function fmtMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtFull(n: number): string {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const emptyForecastForm = {
  year: '2026',
  month: '1',
  category: 'freight',
  projectedAmount: '',
  confidence: '80',
  methodology: 'historical_average',
  assumptions: '',
};

const emptyActualForm = {
  forecastId: '',
  actualAmount: '',
};

const emptyCashFlowForm = {
  type: 'inflow',
  category: 'freight_receivable',
  amount: '',
  currency: 'USD',
  description: '',
  entryDate: '',
};

export function RevenueAnalytics() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showForecastModal, setShowForecastModal] = useState(false);
  const [showActualModal, setShowActualModal] = useState(false);
  const [showCashFlowModal, setShowCashFlowModal] = useState(false);
  const [forecastForm, setForecastForm] = useState(emptyForecastForm);
  const [actualForm, setActualForm] = useState(emptyActualForm);
  const [cashFlowForm, setCashFlowForm] = useState(emptyCashFlowForm);

  const { data: forecastData, loading: forecastLoading, refetch: refetchForecasts } = useQuery(REVENUE_FORECASTS, {
    variables: { year: selectedYear },
  });
  const { data: summaryData, refetch: refetchSummary } = useQuery(REVENUE_FORECAST_SUMMARY, {
    variables: { year: selectedYear },
  });
  const { data: cashFlowData, refetch: refetchCashFlow } = useQuery(CASH_FLOW_SUMMARY);

  const [createForecast, { loading: creatingForecast }] = useMutation(CREATE_FORECAST);
  const [recordActual, { loading: recordingActual }] = useMutation(RECORD_ACTUAL);
  const [createCashFlowEntry, { loading: creatingCashFlow }] = useMutation(CREATE_CASH_FLOW_ENTRY);

  const forecasts: Forecast[] = forecastData?.revenueForecasts ?? [];
  const monthlySummaries: MonthlySummary[] = summaryData?.revenueForecastSummary ?? [];
  const cashFlow: CashFlow | null = cashFlowData?.cashFlowSummary ?? null;

  // Compute aggregated totals
  const totalProjected = monthlySummaries.reduce((s, m) => s + m.totalProjected, 0);
  const totalActual = monthlySummaries.reduce((s, m) => s + m.totalActual, 0);
  const totalVariance = totalActual - totalProjected;
  const forecastAccuracy = totalProjected > 0 && totalActual > 0
    ? Math.max(0, 100 - Math.abs((totalVariance / totalProjected) * 100))
    : 0;

  // Aggregate by category for breakdown bars
  const categoryAggregates = categories.map((cat) => {
    const catForecasts = forecasts.filter((f) => f.category === cat);
    const projected = catForecasts.reduce((s, f) => s + f.projectedAmount, 0);
    const actual = catForecasts.reduce((s, f) => s + (f.actualAmount ?? 0), 0);
    return { category: cat, projected, actual };
  });
  const maxCategoryAmount = Math.max(...categoryAggregates.flatMap((c) => [c.projected, c.actual]), 1);

  // Forecasts without actuals (for Record Actual modal)
  const forecastsWithoutActual = forecasts.filter((f) => f.actualAmount === null || f.actualAmount === 0);

  const setF = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForecastForm((f) => ({ ...f, [field]: e.target.value }));

  const setA = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setActualForm((f) => ({ ...f, [field]: e.target.value }));

  const setCF = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCashFlowForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreateForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    await createForecast({
      variables: {
        year: parseInt(forecastForm.year),
        month: parseInt(forecastForm.month),
        category: forecastForm.category,
        projectedAmount: parseFloat(forecastForm.projectedAmount),
        confidence: forecastForm.confidence ? parseFloat(forecastForm.confidence) : null,
        methodology: forecastForm.methodology || null,
        assumptions: forecastForm.assumptions || null,
      },
    });
    setForecastForm(emptyForecastForm);
    setShowForecastModal(false);
    refetchForecasts();
    refetchSummary();
  };

  const handleRecordActual = async (e: React.FormEvent) => {
    e.preventDefault();
    await recordActual({
      variables: {
        forecastId: actualForm.forecastId,
        actualAmount: parseFloat(actualForm.actualAmount),
      },
    });
    setActualForm(emptyActualForm);
    setShowActualModal(false);
    refetchForecasts();
    refetchSummary();
  };

  const handleCreateCashFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCashFlowEntry({
      variables: {
        type: cashFlowForm.type,
        category: cashFlowForm.category,
        amount: parseFloat(cashFlowForm.amount),
        currency: cashFlowForm.currency || 'USD',
        description: cashFlowForm.description || null,
        entryDate: cashFlowForm.entryDate || null,
      },
    });
    setCashFlowForm(emptyCashFlowForm);
    setShowCashFlowModal(false);
    refetchCashFlow();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
          <p className="text-maritime-400 text-sm mt-1">
            Forecasting, actuals tracking, and cash flow analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <button onClick={() => setShowForecastModal(true)} className={btnPrimary}>
            + New Forecast
          </button>
          <button onClick={() => setShowActualModal(true)} className={btnSecondary}>
            Record Actual
          </button>
        </div>
      </div>

      {forecastLoading && <p className="text-maritime-400 text-sm">Loading forecasts...</p>}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-xs uppercase tracking-wide">Total Projected</p>
          <p className="text-2xl font-bold text-white mt-2">{fmtMoney(totalProjected)}</p>
          <p className="text-maritime-400 text-xs mt-1">{selectedYear} full year</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-xs uppercase tracking-wide">Total Actual</p>
          <p className="text-2xl font-bold text-white mt-2">{fmtMoney(totalActual)}</p>
          <p className="text-maritime-400 text-xs mt-1">{forecasts.filter((f) => f.actualAmount).length} recorded</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-xs uppercase tracking-wide">Variance</p>
          <p className={`text-2xl font-bold mt-2 ${totalVariance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalVariance >= 0 ? '+' : ''}{fmtMoney(totalVariance)}
          </p>
          <p className="text-maritime-400 text-xs mt-1">
            {totalProjected > 0 ? `${((totalVariance / totalProjected) * 100).toFixed(1)}%` : '0%'} of projected
          </p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-xs uppercase tracking-wide">Forecast Accuracy</p>
          <p className={`text-2xl font-bold mt-2 ${forecastAccuracy >= 80 ? 'text-green-400' : forecastAccuracy >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {forecastAccuracy.toFixed(1)}%
          </p>
          <p className="text-maritime-400 text-xs mt-1">
            {forecastAccuracy >= 80 ? 'Excellent' : forecastAccuracy >= 60 ? 'Moderate' : 'Needs improvement'}
          </p>
        </div>
      </div>

      {/* Revenue Breakdown by Category */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6">
        <h2 className="text-white font-medium text-sm mb-6">Revenue Breakdown by Category</h2>
        <div className="space-y-4">
          {categoryAggregates.map((cat) => {
            const projectedWidth = maxCategoryAmount > 0 ? Math.max((cat.projected / maxCategoryAmount) * 100, 2) : 2;
            const actualWidth = maxCategoryAmount > 0 ? Math.max((cat.actual / maxCategoryAmount) * 100, 2) : 2;
            const colors = categoryBarColors[cat.category];
            return (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-sm ${categoryColors[cat.category]}`} />
                    <span className="text-maritime-300 text-sm capitalize">
                      {cat.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-maritime-400">Projected: <span className="text-white font-mono">{fmtMoney(cat.projected)}</span></span>
                    <span className="text-maritime-400">Actual: <span className="text-white font-mono">{fmtMoney(cat.actual)}</span></span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-maritime-500 text-[10px] w-14 text-right">Projected</span>
                    <div className="flex-1 bg-maritime-900 rounded-full h-4 overflow-hidden">
                      <div
                        className={`${colors.projected} h-full rounded-full transition-all flex items-center px-2`}
                        style={{ width: `${projectedWidth}%`, minWidth: '20px' }}
                      >
                        {cat.projected > 0 && <span className="text-white text-[10px] font-medium">{fmtMoney(cat.projected)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-maritime-500 text-[10px] w-14 text-right">Actual</span>
                    <div className="flex-1 bg-maritime-900 rounded-full h-4 overflow-hidden">
                      <div
                        className={`${colors.actual} h-full rounded-full transition-all flex items-center px-2`}
                        style={{ width: `${actualWidth}%`, minWidth: '20px' }}
                      >
                        {cat.actual > 0 && <span className="text-white text-[10px] font-medium">{fmtMoney(cat.actual)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cash Flow Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-medium text-sm">Cash Flow Summary</h2>
          <button onClick={() => setShowCashFlowModal(true)} className={btnSecondary}>
            + Cash Flow Entry
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-maritime-800 border-l-4 border-green-500 rounded-lg p-4">
            <p className="text-maritime-500 text-xs uppercase tracking-wide">Total Inflow</p>
            <p className="text-2xl font-bold text-green-400 mt-2">
              {cashFlow ? fmtMoney(cashFlow.totalInflow) : '$0'}
            </p>
            <p className="text-maritime-400 text-xs mt-1">All receivables</p>
          </div>
          <div className="bg-maritime-800 border-l-4 border-red-500 rounded-lg p-4">
            <p className="text-maritime-500 text-xs uppercase tracking-wide">Total Outflow</p>
            <p className="text-2xl font-bold text-red-400 mt-2">
              {cashFlow ? fmtMoney(cashFlow.totalOutflow) : '$0'}
            </p>
            <p className="text-maritime-400 text-xs mt-1">All payables</p>
          </div>
          <div className="bg-maritime-800 border-l-4 border-blue-500 rounded-lg p-4">
            <p className="text-maritime-500 text-xs uppercase tracking-wide">Net Cash Flow</p>
            <p className={`text-2xl font-bold mt-2 ${cashFlow && cashFlow.netCashFlow >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {cashFlow ? fmtMoney(cashFlow.netCashFlow) : '$0'}
            </p>
            <p className="text-maritime-400 text-xs mt-1">Inflow - Outflow</p>
          </div>
        </div>
      </div>

      {/* Forecast Table */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-maritime-700 flex items-center justify-between">
          <h3 className="text-white font-medium text-sm">
            Revenue Forecasts &mdash; {selectedYear}
          </h3>
          <span className="text-maritime-400 text-xs">{forecasts.length} entries</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-maritime-400 text-xs text-left border-b border-maritime-700">
              <th className="px-4 py-3 font-medium">Month</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium text-right">Projected</th>
              <th className="px-4 py-3 font-medium text-right">Actual</th>
              <th className="px-4 py-3 font-medium text-right">Variance</th>
              <th className="px-4 py-3 font-medium text-right">Confidence</th>
              <th className="px-4 py-3 font-medium">Methodology</th>
            </tr>
          </thead>
          <tbody>
            {forecasts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-maritime-500">
                  No forecasts for {selectedYear}. Create one to get started.
                </td>
              </tr>
            )}
            {forecasts.map((f) => {
              const variance = f.actualAmount != null ? f.actualAmount - f.projectedAmount : null;
              return (
                <tr key={f.id} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white">
                    {monthNames[f.month - 1] ?? f.month} {f.year}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-sm ${categoryColors[f.category] ?? 'bg-gray-500'}`} />
                      <span className="text-maritime-300 capitalize">{f.category.replace(/_/g, ' ')}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-mono text-xs">
                    {fmtFull(f.projectedAmount)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {f.actualAmount != null ? (
                      <span className="text-white">{fmtFull(f.actualAmount)}</span>
                    ) : (
                      <span className="text-maritime-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {variance != null ? (
                      <span className={variance >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {variance >= 0 ? '+' : ''}{fmtFull(variance)}
                      </span>
                    ) : (
                      <span className="text-maritime-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {f.confidence != null ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        f.confidence >= 80 ? 'bg-green-900/50 text-green-400' :
                        f.confidence >= 60 ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                        {f.confidence.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-maritime-500 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-maritime-400 text-xs capitalize">
                    {f.methodology ? f.methodology.replace(/_/g, ' ') : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Monthly Summary Table */}
      {monthlySummaries.length > 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-maritime-700">
            <h3 className="text-white font-medium text-sm">Monthly Summary</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-xs text-left border-b border-maritime-700">
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium text-right">Total Projected</th>
                <th className="px-4 py-3 font-medium text-right">Total Actual</th>
                <th className="px-4 py-3 font-medium text-right">Variance</th>
                <th className="px-4 py-3 font-medium text-right">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {monthlySummaries.map((m) => {
                const acc = m.totalProjected > 0 && m.totalActual > 0
                  ? Math.max(0, 100 - Math.abs(((m.totalActual - m.totalProjected) / m.totalProjected) * 100))
                  : 0;
                return (
                  <tr key={`${m.year}-${m.month}`} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="px-4 py-3 text-white">{monthNames[m.month - 1]} {m.year}</td>
                    <td className="px-4 py-3 text-right text-white font-mono text-xs">{fmtFull(m.totalProjected)}</td>
                    <td className="px-4 py-3 text-right text-white font-mono text-xs">
                      {m.totalActual > 0 ? fmtFull(m.totalActual) : <span className="text-maritime-500">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      <span className={m.variance >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {m.variance >= 0 ? '+' : ''}{fmtFull(m.variance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.totalActual > 0 ? (
                        <span className={`text-xs font-medium ${acc >= 80 ? 'text-green-400' : acc >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {acc.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-maritime-500 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Forecast Modal */}
      <Modal open={showForecastModal} onClose={() => setShowForecastModal(false)} title="Create Revenue Forecast">
        <form onSubmit={handleCreateForecast}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Year *">
              <select value={forecastForm.year} onChange={setF('year')} className={selectClass} required>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </FormField>
            <FormField label="Month *">
              <select value={forecastForm.month} onChange={setF('month')} className={selectClass} required>
                {monthNames.map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category *">
              <select value={forecastForm.category} onChange={setF('category')} className={selectClass} required>
                {categories.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Projected Amount ($) *">
              <input
                type="number"
                step="0.01"
                value={forecastForm.projectedAmount}
                onChange={setF('projectedAmount')}
                className={inputClass}
                placeholder="1500000.00"
                required
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Confidence (%)">
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={forecastForm.confidence}
                onChange={setF('confidence')}
                className={inputClass}
                placeholder="80"
              />
            </FormField>
            <FormField label="Methodology">
              <select value={forecastForm.methodology} onChange={setF('methodology')} className={selectClass}>
                {methodologies.map((m) => (
                  <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Assumptions / Notes">
            <textarea
              value={forecastForm.assumptions}
              onChange={setF('assumptions')}
              className={`${inputClass} h-20 resize-none`}
              placeholder="Based on Q3 trend with seasonal adjustments..."
            />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowForecastModal(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={creatingForecast} className={btnPrimary}>
              {creatingForecast ? 'Creating...' : 'Create Forecast'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Actual Modal */}
      <Modal open={showActualModal} onClose={() => setShowActualModal(false)} title="Record Actual Revenue">
        <form onSubmit={handleRecordActual}>
          <FormField label="Select Forecast *">
            <select
              value={actualForm.forecastId}
              onChange={setA('forecastId')}
              className={selectClass}
              required
            >
              <option value="">-- Select a forecast --</option>
              {forecastsWithoutActual.map((f) => (
                <option key={f.id} value={f.id}>
                  {monthNames[f.month - 1]} {f.year} - {f.category.replace(/_/g, ' ')} ({fmtMoney(f.projectedAmount)} projected)
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Actual Amount ($) *">
            <input
              type="number"
              step="0.01"
              value={actualForm.actualAmount}
              onChange={setA('actualAmount')}
              className={inputClass}
              placeholder="1480000.00"
              required
            />
          </FormField>
          {actualForm.forecastId && actualForm.actualAmount && (() => {
            const selected = forecasts.find((f) => f.id === actualForm.forecastId);
            if (!selected) return null;
            const diff = parseFloat(actualForm.actualAmount) - selected.projectedAmount;
            return (
              <div className="bg-maritime-900 rounded-md p-3 mb-4">
                <p className="text-maritime-400 text-xs mb-1">Variance Preview</p>
                <p className={`text-lg font-bold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {diff >= 0 ? '+' : ''}{fmtFull(diff)}
                </p>
                <p className="text-maritime-500 text-xs mt-1">
                  {selected.projectedAmount > 0
                    ? `${((diff / selected.projectedAmount) * 100).toFixed(1)}% of projected`
                    : ''}
                </p>
              </div>
            );
          })()}
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowActualModal(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={recordingActual} className={btnPrimary}>
              {recordingActual ? 'Recording...' : 'Record Actual'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cash Flow Entry Modal */}
      <Modal open={showCashFlowModal} onClose={() => setShowCashFlowModal(false)} title="Create Cash Flow Entry">
        <form onSubmit={handleCreateCashFlow}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type *">
              <select value={cashFlowForm.type} onChange={setCF('type')} className={selectClass} required>
                <option value="inflow">Inflow</option>
                <option value="outflow">Outflow</option>
              </select>
            </FormField>
            <FormField label="Category *">
              <select value={cashFlowForm.category} onChange={setCF('category')} className={selectClass} required>
                <option value="freight_receivable">Freight Receivable</option>
                <option value="hire_income">Hire Income</option>
                <option value="demurrage_claim">Demurrage Claim</option>
                <option value="bunker_payment">Bunker Payment</option>
                <option value="port_disbursement">Port Disbursement</option>
                <option value="crew_wages">Crew Wages</option>
                <option value="insurance">Insurance</option>
                <option value="other">Other</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount *">
              <input
                type="number"
                step="0.01"
                value={cashFlowForm.amount}
                onChange={setCF('amount')}
                className={inputClass}
                placeholder="250000.00"
                required
              />
            </FormField>
            <FormField label="Currency">
              <select value={cashFlowForm.currency} onChange={setCF('currency')} className={selectClass}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="SGD">SGD</option>
              </select>
            </FormField>
          </div>
          <FormField label="Entry Date">
            <input type="date" value={cashFlowForm.entryDate} onChange={setCF('entryDate')} className={inputClass} />
          </FormField>
          <FormField label="Description">
            <textarea
              value={cashFlowForm.description}
              onChange={setCF('description')}
              className={`${inputClass} h-16 resize-none`}
              placeholder="V-2026-003 freight receivable from ABC Shipping"
            />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCashFlowModal(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={creatingCashFlow} className={btnPrimary}>
              {creatingCashFlow ? 'Creating...' : 'Create Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
