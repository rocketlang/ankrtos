import { useQuery, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';

const LATEST_INDICES_QUERY = gql`
  query LatestFreightIndices {
    latestFreightIndices {
      id indexName date value change changePct
    }
  }
`

const INDEX_HISTORY_QUERY = gql`
  query FreightIndices($indexName: String!, $limit: Int) {
    freightIndices(indexName: $indexName, limit: $limit) {
      id date value change changePct
    }
  }
`

const MARKET_RATES_QUERY = gql`
  query MarketRates($vesselType: String, $rateType: String) {
    marketRates(vesselType: $vesselType, rateType: $rateType) {
      id route vesselType rateType rate rateUnit effectiveDate region
    }
  }
`

const indexLabels: Record<string, string> = {
  BDI: 'Baltic Dry Index',
  BCI: 'Baltic Capesize Index',
  BSI: 'Baltic Supramax Index',
  BPI: 'Baltic Panamax Index',
  BCTI: 'Baltic Clean Tanker Index',
  BDTI: 'Baltic Dirty Tanker Index',
}

const indexOrder = ['BDI', 'BCI', 'BSI', 'BPI', 'BCTI', 'BDTI']

const vesselTypeLabels: Record<string, string> = {
  capesize: 'Capesize',
  panamax: 'Panamax',
  supramax: 'Supramax',
  handysize: 'Handysize',
  vlcc: 'VLCC',
  suezmax: 'Suezmax',
  aframax: 'Aframax',
  mr: 'MR',
}

const vesselTypes = Object.keys(vesselTypeLabels)

function fmtNum(n: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n)
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString() : '-'
}

function Sparkline({ values }: { values: number[] }) {
  if (!values.length) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  return (
    <div className="flex items-end gap-px h-8 w-24">
      {values.slice(-10).map((v, i) => {
        const height = Math.max(4, ((v - min) / range) * 100)
        const isLast = i === values.slice(-10).length - 1
        return (
          <div
            key={i}
            className={`flex-1 rounded-t-sm ${isLast ? 'bg-blue-400' : 'bg-maritime-500'}`}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}

export function MarketIndices() {
  const [tab, setTab] = useState<'indices' | 'spot' | 'tc'>('indices')
  const [selectedIndex, setSelectedIndex] = useState('BDI')
  const [spotVesselFilter, setSpotVesselFilter] = useState('')
  const [tcVesselFilter, setTcVesselFilter] = useState('')

  const { data: latestData, loading: latestLoading, error: latestError } = useQuery(LATEST_INDICES_QUERY)
  const { data: historyData } = useQuery(INDEX_HISTORY_QUERY, {
    variables: { indexName: selectedIndex, limit: 30 },
  })
  const { data: spotData, loading: spotLoading } = useQuery(MARKET_RATES_QUERY, {
    variables: {
      vesselType: spotVesselFilter || undefined,
      rateType: 'spot',
    },
    skip: tab !== 'spot',
  })
  const { data: tcData, loading: tcLoading } = useQuery(MARKET_RATES_QUERY, {
    variables: {
      vesselType: tcVesselFilter || undefined,
      rateType: 'time_charter',
    },
    skip: tab !== 'tc',
  })

  const indices = latestData?.latestFreightIndices ?? []
  const bdiIndex = indices.find((i: Record<string, unknown>) => (i.indexName as string) === 'BDI')
  const routesTracked = (spotData?.marketRates?.length ?? 0) + (tcData?.marketRates?.length ?? 0)
  const historyValues = (historyData?.freightIndices ?? []).map((h: Record<string, unknown>) => h.value as number).reverse()

  const indexHistoryMap: Record<string, number[]> = {}
  for (const name of indexOrder) {
    const idx = indices.find((i: Record<string, unknown>) => (i.indexName as string) === name)
    if (idx) {
      indexHistoryMap[name] = [idx.value as number]
    }
  }
  if (historyData?.freightIndices) {
    indexHistoryMap[selectedIndex] = historyValues
  }

  const tabs = [
    { key: 'indices' as const, label: 'Indices' },
    { key: 'spot' as const, label: 'Spot Rates' },
    { key: 'tc' as const, label: 'TC Rates' },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Freight Market Indices</h1>
          <p className="text-maritime-400 text-sm mt-1">Live market rates and Baltic Exchange indices</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs font-medium">BDI Current</p>
          <p className="text-white text-xl font-bold mt-1">{bdiIndex ? fmtNum(bdiIndex.value as number) : '-'}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs font-medium">BDI Change %</p>
          <p className={`text-xl font-bold mt-1 ${bdiIndex && (bdiIndex.changePct as number) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {bdiIndex ? `${(bdiIndex.changePct as number) >= 0 ? '+' : ''}${fmtNum(bdiIndex.changePct as number)}%` : '-'}
          </p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs font-medium">Routes Tracked</p>
          <p className="text-white text-xl font-bold mt-1">{routesTracked || indices.length}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs font-medium">Last Updated</p>
          <p className="text-white text-xl font-bold mt-1">
            {bdiIndex ? fmtDate(bdiIndex.date as string) : '-'}
          </p>
        </div>
      </div>

      {latestLoading && <p className="text-maritime-400">Loading market data...</p>}
      {latestError && <p className="text-red-400">Error: {latestError.message}</p>}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-maritime-700">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-500 text-white'
                : 'border-transparent text-maritime-400 hover:text-maritime-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Indices */}
      {tab === 'indices' && (
        <div className="grid grid-cols-3 gap-4">
          {indexOrder.map((name) => {
            const idx = indices.find((i: Record<string, unknown>) => (i.indexName as string) === name)
            if (!idx) {
              return (
                <div key={name} className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-bold text-lg">{name}</p>
                      <p className="text-maritime-500 text-xs">{indexLabels[name]}</p>
                    </div>
                  </div>
                  <p className="text-maritime-500 text-sm">No data available</p>
                </div>
              )
            }
            const value = idx.value as number
            const change = idx.change as number
            const changePct = idx.changePct as number
            const isPositive = change >= 0
            const isSelected = selectedIndex === name
            const sparkVals = indexHistoryMap[name] ?? [value]

            return (
              <div
                key={name}
                onClick={() => setSelectedIndex(name)}
                className={`bg-maritime-800 border rounded-lg p-5 cursor-pointer transition-colors ${
                  isSelected ? 'border-blue-500' : 'border-maritime-700 hover:border-maritime-600'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-bold text-lg">{name}</p>
                    <p className="text-maritime-500 text-xs">{indexLabels[name]}</p>
                  </div>
                  <Sparkline values={name === selectedIndex ? historyValues : sparkVals} />
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-white text-2xl font-bold">{fmtNum(value)}</p>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{fmtNum(change)}
                    </p>
                    <p className={`text-xs ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
                      {isPositive ? '+' : ''}{fmtNum(changePct)}%
                    </p>
                  </div>
                </div>
                <p className="text-maritime-500 text-xs mt-2">{fmtDate(idx.date as string)}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Tab 2: Spot Rates */}
      {tab === 'spot' && (
        <div>
          <div className="flex gap-3 mb-4">
            <select
              value={spotVesselFilter}
              onChange={(e) => setSpotVesselFilter(e.target.value)}
              className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="">All Vessel Types</option>
              {vesselTypes.map((t) => (
                <option key={t} value={t}>{vesselTypeLabels[t]}</option>
              ))}
            </select>
          </div>

          {spotLoading && <p className="text-maritime-400">Loading spot rates...</p>}

          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-maritime-700 text-maritime-400">
                  <th className="text-left px-4 py-3 font-medium">Route</th>
                  <th className="text-left px-4 py-3 font-medium">Vessel Type</th>
                  <th className="text-right px-4 py-3 font-medium">Rate</th>
                  <th className="text-left px-4 py-3 font-medium">Unit</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Region</th>
                </tr>
              </thead>
              <tbody>
                {(spotData?.marketRates ?? []).map((r: Record<string, unknown>) => (
                  <tr key={r.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="px-4 py-3 text-white font-medium">{r.route as string}</td>
                    <td className="px-4 py-3 text-maritime-300 capitalize">{vesselTypeLabels[(r.vesselType as string)] ?? r.vesselType}</td>
                    <td className="px-4 py-3 text-white text-right font-mono">${fmtNum(r.rate as number)}</td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">{r.rateUnit as string}</td>
                    <td className="px-4 py-3 text-maritime-300">{fmtDate(r.effectiveDate as string)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-maritime-700 text-maritime-300 text-xs rounded">
                        {r.region as string}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!spotLoading && (spotData?.marketRates ?? []).length === 0 && (
              <p className="text-maritime-500 text-center py-8">No spot rates found</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: TC Rates */}
      {tab === 'tc' && (
        <div>
          <div className="flex gap-3 mb-4">
            <select
              value={tcVesselFilter}
              onChange={(e) => setTcVesselFilter(e.target.value)}
              className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="">All Vessel Types</option>
              {vesselTypes.map((t) => (
                <option key={t} value={t}>{vesselTypeLabels[t]}</option>
              ))}
            </select>
          </div>

          {tcLoading && <p className="text-maritime-400">Loading TC rates...</p>}

          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-maritime-700 text-maritime-400">
                  <th className="text-left px-4 py-3 font-medium">Route</th>
                  <th className="text-left px-4 py-3 font-medium">Vessel Type</th>
                  <th className="text-right px-4 py-3 font-medium">Rate</th>
                  <th className="text-left px-4 py-3 font-medium">Unit</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Region</th>
                </tr>
              </thead>
              <tbody>
                {(tcData?.marketRates ?? []).map((r: Record<string, unknown>) => (
                  <tr key={r.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="px-4 py-3 text-white font-medium">{r.route as string}</td>
                    <td className="px-4 py-3 text-maritime-300 capitalize">{vesselTypeLabels[(r.vesselType as string)] ?? r.vesselType}</td>
                    <td className="px-4 py-3 text-white text-right font-mono">${fmtNum(r.rate as number)}</td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">{r.rateUnit as string}</td>
                    <td className="px-4 py-3 text-maritime-300">{fmtDate(r.effectiveDate as string)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-maritime-700 text-maritime-300 text-xs rounded">
                        {r.region as string}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!tcLoading && (tcData?.marketRates ?? []).length === 0 && (
              <p className="text-maritime-500 text-center py-8">No time charter rates found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
