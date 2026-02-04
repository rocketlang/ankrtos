import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const BENCHMARKS_QUERY = gql`
  query PortCostBenchmarks($portId: String, $vesselType: String, $costCategory: String) {
    portCostBenchmarks(portId: $portId, vesselType: $vesselType, costCategory: $costCategory) {
      id portName vesselType dwtRange costCategory avgCostUsd minCostUsd maxCostUsd
      medianCostUsd sampleSize periodStart periodEnd trend trendPct
    }
  }
`

const CREATE_BENCHMARK = gql`
  mutation CreatePortCostBenchmark(
    $portName: String!, $vesselType: String!, $dwtRange: String!, $costCategory: String!,
    $avgCostUsd: Float!, $minCostUsd: Float!, $maxCostUsd: Float!, $medianCostUsd: Float!,
    $sampleSize: Int!, $periodStart: String!, $periodEnd: String!, $trend: String!, $trendPct: Float!
  ) {
    createPortCostBenchmark(
      portName: $portName, vesselType: $vesselType, dwtRange: $dwtRange, costCategory: $costCategory,
      avgCostUsd: $avgCostUsd, minCostUsd: $minCostUsd, maxCostUsd: $maxCostUsd, medianCostUsd: $medianCostUsd,
      sampleSize: $sampleSize, periodStart: $periodStart, periodEnd: $periodEnd, trend: $trend, trendPct: $trendPct
    ) { id }
  }
`

const vesselTypes = [
  { value: 'bulk_carrier', label: 'Bulk Carrier' },
  { value: 'tanker', label: 'Tanker' },
  { value: 'container', label: 'Container' },
  { value: 'general_cargo', label: 'General Cargo' },
]

const dwtRanges = [
  '0-10000', '10000-30000', '30000-60000', '60000-100000', '100000+',
]

const costCategories = [
  { value: 'pilotage', label: 'Pilotage' },
  { value: 'towage', label: 'Towage' },
  { value: 'berth_dues', label: 'Berth Dues' },
  { value: 'mooring', label: 'Mooring' },
  { value: 'port_dues', label: 'Port Dues' },
  { value: 'agency_fees', label: 'Agency Fees' },
  { value: 'total', label: 'Total' },
]

const categoryColors: Record<string, string> = {
  pilotage: 'bg-blue-500',
  towage: 'bg-cyan-500',
  berth_dues: 'bg-purple-500',
  mooring: 'bg-orange-500',
  port_dues: 'bg-emerald-500',
  agency_fees: 'bg-pink-500',
  total: 'bg-white',
}

const emptyForm = {
  portName: '', vesselType: 'bulk_carrier', dwtRange: '30000-60000', costCategory: 'total',
  avgCostUsd: '', minCostUsd: '', maxCostUsd: '', medianCostUsd: '',
  sampleSize: '', periodStart: '', periodEnd: '', trend: 'stable', trendPct: '0',
}

type Benchmark = {
  id: string
  portName: string
  vesselType: string
  dwtRange: string
  costCategory: string
  avgCostUsd: number
  minCostUsd: number
  maxCostUsd: number
  medianCostUsd: number
  sampleSize: number
  periodStart: string
  periodEnd: string
  trend: string
  trendPct: number
}

function fmtUsd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function TrendIndicator({ trend, pct }: { trend: string; pct: number }) {
  if (trend === 'rising') {
    return <span className="text-red-400 text-xs font-medium flex items-center gap-0.5">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
      +{pct.toFixed(1)}%
    </span>
  }
  if (trend === 'falling') {
    return <span className="text-green-400 text-xs font-medium flex items-center gap-0.5">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      -{pct.toFixed(1)}%
    </span>
  }
  return <span className="text-maritime-400 text-xs font-medium flex items-center gap-0.5">
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>
    {pct.toFixed(1)}%
  </span>
}

export function CostBenchmark() {
  const [portSearch, setPortSearch] = useState('')
  const [filterVesselType, setFilterVesselType] = useState('')
  const [filterDwtRange, setFilterDwtRange] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [showChart, setShowChart] = useState(true)

  const { data, loading, error, refetch } = useQuery(BENCHMARKS_QUERY, {
    variables: {
      portId: portSearch || undefined,
      vesselType: filterVesselType || undefined,
      costCategory: filterCategory || undefined,
    },
  })

  const [createBenchmark, { loading: creating }] = useMutation(CREATE_BENCHMARK)

  const benchmarks: Benchmark[] = (data?.portCostBenchmarks ?? []).filter((b: Benchmark) => {
    if (portSearch && !b.portName.toLowerCase().includes(portSearch.toLowerCase())) return false
    if (filterDwtRange && b.dwtRange !== filterDwtRange) return false
    return true
  })

  const totalBenchmarks = benchmarks.length
  const portsSet = new Set(benchmarks.map((b) => b.portName))
  const portsCovered = portsSet.size
  const risingCosts = benchmarks.filter((b) => b.trend === 'rising').length
  const fallingCosts = benchmarks.filter((b) => b.trend === 'falling').length

  // Grouped data for bar chart: group by port, show categories
  const portGroups: Record<string, Benchmark[]> = {}
  benchmarks.forEach((b) => {
    if (!portGroups[b.portName]) portGroups[b.portName] = []
    portGroups[b.portName].push(b)
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createBenchmark({
      variables: {
        portName: form.portName,
        vesselType: form.vesselType,
        dwtRange: form.dwtRange,
        costCategory: form.costCategory,
        avgCostUsd: Number(form.avgCostUsd),
        minCostUsd: Number(form.minCostUsd),
        maxCostUsd: Number(form.maxCostUsd),
        medianCostUsd: Number(form.medianCostUsd),
        sampleSize: Number(form.sampleSize),
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        trend: form.trend,
        trendPct: Number(form.trendPct),
      },
    })
    setForm(emptyForm)
    setShowCreate(false)
    refetch()
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Port Cost Benchmarks</h1>
          <p className="text-maritime-400 text-sm mt-1">Compare port costs across vessel types and categories</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ Add Benchmark</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Benchmarks', value: totalBenchmarks, color: 'text-white', border: 'border-blue-500' },
          { label: 'Ports Covered', value: portsCovered, color: 'text-cyan-400', border: 'border-cyan-500' },
          { label: 'Rising Costs', value: risingCosts, color: 'text-red-400', border: 'border-red-500' },
          { label: 'Falling Costs', value: fallingCosts, color: 'text-green-400', border: 'border-green-500' },
        ].map((s) => (
          <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
            <p className="text-maritime-500 text-xs">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{loading ? '-' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search port..."
          value={portSearch}
          onChange={(e) => setPortSearch(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-56"
        />
        <select value={filterVesselType} onChange={(e) => setFilterVesselType(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded-md px-3 py-2">
          <option value="">All Vessel Types</option>
          {vesselTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filterDwtRange} onChange={(e) => setFilterDwtRange(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded-md px-3 py-2">
          <option value="">All DWT Ranges</option>
          {dwtRanges.map((r) => <option key={r} value={r}>{r} DWT</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded-md px-3 py-2">
          <option value="">All Categories</option>
          {costCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button
          onClick={() => setShowChart(!showChart)}
          className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm px-3 py-2 rounded-md"
        >
          {showChart ? 'Hide Chart' : 'Show Chart'}
        </button>
      </div>

      {loading && <p className="text-maritime-400">Loading benchmarks...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Bar Chart Visualization */}
      {showChart && !loading && Object.keys(portGroups).length > 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5 mb-6">
          <h2 className="text-sm font-medium text-white mb-4">Cost Breakdown by Port</h2>
          <div className="space-y-4">
            {Object.entries(portGroups).slice(0, 10).map(([portName, items]) => {
              const maxVal = Math.max(...items.map((b) => b.avgCostUsd), 1)
              return (
                <div key={portName}>
                  <p className="text-maritime-300 text-xs font-medium mb-1.5">{portName}</p>
                  <div className="space-y-1">
                    {items.filter((b) => b.costCategory !== 'total').map((b) => {
                      const widthPct = Math.max((b.avgCostUsd / maxVal) * 100, 2)
                      return (
                        <div key={b.id} className="flex items-center gap-2">
                          <span className="text-maritime-500 text-[10px] w-20 text-right capitalize">
                            {b.costCategory.replace(/_/g, ' ')}
                          </span>
                          <div className="flex-1 bg-maritime-900 rounded-full h-4 overflow-hidden">
                            <div
                              className={`h-4 rounded-full ${categoryColors[b.costCategory] ?? 'bg-maritime-500'} flex items-center justify-end pr-1.5`}
                              style={{ width: `${widthPct}%`, minWidth: '40px' }}
                            >
                              <span className="text-[9px] text-white font-mono">{fmtUsd(b.avgCostUsd)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-maritime-700">
            {costCategories.filter((c) => c.value !== 'total').map((c) => (
              <div key={c.value} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${categoryColors[c.value]}`} />
                <span className="text-maritime-400 text-[10px]">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400 text-xs">
                <th className="text-left px-4 py-3 font-medium">Port</th>
                <th className="text-left px-4 py-3 font-medium">Vessel Type</th>
                <th className="text-left px-4 py-3 font-medium">DWT Range</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-right px-4 py-3 font-medium">Avg Cost</th>
                <th className="text-right px-4 py-3 font-medium">Min-Max</th>
                <th className="text-right px-4 py-3 font-medium">Median</th>
                <th className="text-center px-4 py-3 font-medium">Samples</th>
                <th className="text-left px-4 py-3 font-medium">Period</th>
                <th className="text-center px-4 py-3 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.length === 0 && (
                <tr><td colSpan={10} className="text-center py-8 text-maritime-500">No benchmarks found</td></tr>
              )}
              {benchmarks.map((b) => (
                <tr key={b.id} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white font-medium">{b.portName}</td>
                  <td className="px-4 py-3 text-maritime-300 capitalize text-xs">{b.vesselType.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-maritime-300 font-mono text-xs">{b.dwtRange}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                      categoryColors[b.costCategory] ? `${categoryColors[b.costCategory]}/20 text-white` : 'bg-maritime-700 text-maritime-300'
                    }`}>
                      {b.costCategory.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-mono text-xs">{fmtUsd(b.avgCostUsd)}</td>
                  <td className="px-4 py-3 text-right text-maritime-400 font-mono text-xs">
                    {fmtUsd(b.minCostUsd)} - {fmtUsd(b.maxCostUsd)}
                  </td>
                  <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">{fmtUsd(b.medianCostUsd)}</td>
                  <td className="px-4 py-3 text-center text-maritime-300 text-xs">{b.sampleSize}</td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">
                    {b.periodStart} - {b.periodEnd}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <TrendIndicator trend={b.trend} pct={b.trendPct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Port Cost Benchmark">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Port Name *">
              <input value={form.portName} onChange={set('portName')} className={inputClass} required placeholder="Singapore" />
            </FormField>
            <FormField label="Vessel Type *">
              <select value={form.vesselType} onChange={set('vesselType')} className={selectClass} required>
                {vesselTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="DWT Range *">
              <select value={form.dwtRange} onChange={set('dwtRange')} className={selectClass} required>
                {dwtRanges.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
            <FormField label="Cost Category *">
              <select value={form.costCategory} onChange={set('costCategory')} className={selectClass} required>
                {costCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FormField>
            <FormField label="Average Cost (USD) *">
              <input type="number" step="0.01" value={form.avgCostUsd} onChange={set('avgCostUsd')} className={inputClass} required placeholder="12500" />
            </FormField>
            <FormField label="Min Cost (USD) *">
              <input type="number" step="0.01" value={form.minCostUsd} onChange={set('minCostUsd')} className={inputClass} required placeholder="8000" />
            </FormField>
            <FormField label="Max Cost (USD) *">
              <input type="number" step="0.01" value={form.maxCostUsd} onChange={set('maxCostUsd')} className={inputClass} required placeholder="18000" />
            </FormField>
            <FormField label="Median Cost (USD) *">
              <input type="number" step="0.01" value={form.medianCostUsd} onChange={set('medianCostUsd')} className={inputClass} required placeholder="11500" />
            </FormField>
            <FormField label="Sample Size *">
              <input type="number" value={form.sampleSize} onChange={set('sampleSize')} className={inputClass} required placeholder="45" />
            </FormField>
            <FormField label="Trend *">
              <select value={form.trend} onChange={set('trend')} className={selectClass} required>
                <option value="rising">Rising</option>
                <option value="falling">Falling</option>
                <option value="stable">Stable</option>
              </select>
            </FormField>
            <FormField label="Period Start *">
              <input type="date" value={form.periodStart} onChange={set('periodStart')} className={inputClass} required />
            </FormField>
            <FormField label="Period End *">
              <input type="date" value={form.periodEnd} onChange={set('periodEnd')} className={inputClass} required />
            </FormField>
          </div>
          <FormField label="Trend % *">
            <input type="number" step="0.1" value={form.trendPct} onChange={set('trendPct')} className={inputClass} required placeholder="3.5" />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Add Benchmark'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
