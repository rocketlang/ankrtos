import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const FFA_POSITIONS_QUERY = gql`
  query FFAPositions($status: String) {
    ffaPositions(status: $status) {
      id route period direction quantity lotSize entryPrice currentPrice
      mtmValue clearingHouse clearingRef counterparty broker status
      tradeDate expiryDate notes
    }
  }
`

const PORTFOLIO_SUMMARY_QUERY = gql`
  query FFAPortfolioSummary {
    ffaPortfolioSummary {
      totalPositions openPositions totalMtm totalMargin netExposure
      topRoutes {
        route longLots shortLots netLots netExposure mtmPnl
      }
    }
  }
`

const VAR_QUERY = gql`
  query LatestVaR {
    latestVaR {
      id snapshotDate portfolioValue varOneDay95 varOneDay99
      varTenDay95 varTenDay99 cvar95 maxDrawdown sharpeRatio
      positionCount totalExposure methodology
    }
  }
`

const PNL_SUMMARY_QUERY = gql`
  query FFAPnLSummary {
    ffaPnlSummary {
      physicalPnl paperPnl hedgingPnl basisPnl totalPnl
      entries { category subcategory revenue cost pnl }
    }
  }
`

const OPEN_POSITION = gql`
  mutation OpenPosition(
    $route: String!, $period: String!, $direction: String!, $quantity: Float!,
    $entryPrice: Float!, $clearingHouse: String, $counterparty: String, $broker: String
  ) {
    openFFAPosition(
      route: $route, period: $period, direction: $direction, quantity: $quantity,
      entryPrice: $entryPrice, clearingHouse: $clearingHouse,
      counterparty: $counterparty, broker: $broker
    ) { id }
  }
`

const CLOSE_POSITION = gql`
  mutation ClosePosition($id: String!, $closePrice: Float!) {
    closeFFAPosition(id: $id, closePrice: $closePrice) { id status }
  }
`

const UPDATE_MTM = gql`
  mutation UpdateMTM($id: String!, $currentPrice: Float!) {
    updateMTM(id: $id, currentPrice: $currentPrice) { id mtmValue currentPrice }
  }
`

const statusColors: Record<string, string> = {
  open: 'bg-blue-900/50 text-blue-400',
  partially_closed: 'bg-amber-900/50 text-amber-400',
  closed: 'bg-maritime-700 text-maritime-400',
  expired: 'bg-slate-800/50 text-slate-400',
}

const statusTabs = ['All', 'Open', 'Partially Closed', 'Closed', 'Expired']

const ffaRoutes = ['TC2_37', 'TD3C', 'P1A_82', 'C5TC', 'TD7', 'TD20', 'TC6', 'TC14']
const clearingHouses = ['LCH', 'ICE Clear Europe', 'SGX']

const emptyPositionForm = {
  route: 'TC2_37',
  period: '',
  direction: 'LONG',
  quantity: '',
  entryPrice: '',
  clearingHouse: 'LCH',
  counterparty: '',
  broker: '',
}

const fmtUSD = (amt: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt)

const fmtSignedUSD = (amt: number) => {
  const formatted = fmtUSD(Math.abs(amt))
  return amt >= 0 ? `+${formatted}` : `-${formatted}`
}

const fmtCompact = (amt: number) => {
  if (Math.abs(amt) >= 1_000_000) return `$${(amt / 1_000_000).toFixed(1)}M`
  if (Math.abs(amt) >= 1_000) return `$${(amt / 1_000).toFixed(0)}K`
  return fmtUSD(amt)
}

export function FreightDerivatives() {
  const [statusFilter, setStatusFilter] = useState('')
  const [showOpen, setShowOpen] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [showMtm, setShowMtm] = useState(false)
  const [positionForm, setPositionForm] = useState(emptyPositionForm)
  const [closePrice, setClosePrice] = useState('')
  const [mtmPrice, setMtmPrice] = useState('')
  const [selectedPosition, setSelectedPosition] = useState<Record<string, unknown> | null>(null)

  const { data: posData, loading, error, refetch: refetchPositions } = useQuery(FFA_POSITIONS_QUERY, {
    variables: { status: statusFilter || undefined },
  })
  const { data: portfolioData, refetch: refetchPortfolio } = useQuery(PORTFOLIO_SUMMARY_QUERY)
  const { data: varData } = useQuery(VAR_QUERY)
  const { data: pnlData } = useQuery(PNL_SUMMARY_QUERY)

  const [openPosition, { loading: openingPosition }] = useMutation(OPEN_POSITION)
  const [closePosition, { loading: closingPosition }] = useMutation(CLOSE_POSITION)
  const [updateMTM, { loading: updatingMtm }] = useMutation(UPDATE_MTM)

  const positions = posData?.ffaPositions ?? []
  const portfolio = portfolioData?.ffaPortfolioSummary
  const varSnapshot = varData?.latestVaR
  const pnl = pnlData?.ffaPnlSummary
  const topRoutes = portfolio?.topRoutes ?? []

  const refetchAll = () => {
    refetchPositions()
    refetchPortfolio()
  }

  const setPF = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setPositionForm((f) => ({ ...f, [field]: e.target.value }))

  const handleOpenPosition = async (e: React.FormEvent) => {
    e.preventDefault()
    await openPosition({
      variables: {
        route: positionForm.route,
        period: positionForm.period,
        direction: positionForm.direction,
        quantity: parseFloat(positionForm.quantity),
        entryPrice: parseFloat(positionForm.entryPrice),
        clearingHouse: positionForm.clearingHouse || null,
        counterparty: positionForm.counterparty || null,
        broker: positionForm.broker || null,
      },
    })
    setPositionForm(emptyPositionForm)
    setShowOpen(false)
    refetchAll()
  }

  const handleClosePosition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPosition) return
    await closePosition({
      variables: {
        id: selectedPosition.id as string,
        closePrice: parseFloat(closePrice),
      },
    })
    setClosePrice('')
    setSelectedPosition(null)
    setShowClose(false)
    refetchAll()
  }

  const handleUpdateMTM = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPosition) return
    await updateMTM({
      variables: {
        id: selectedPosition.id as string,
        currentPrice: parseFloat(mtmPrice),
      },
    })
    setMtmPrice('')
    setSelectedPosition(null)
    setShowMtm(false)
    refetchAll()
  }

  const openCloseModal = (pos: Record<string, unknown>) => {
    setSelectedPosition(pos)
    setClosePrice('')
    setShowClose(true)
  }

  const openMtmModal = (pos: Record<string, unknown>) => {
    setSelectedPosition(pos)
    setMtmPrice(String(pos.currentPrice ?? ''))
    setShowMtm(true)
  }

  // Computed close P&L preview
  const closePnlPreview = (() => {
    if (!selectedPosition || !closePrice) return null
    const entry = selectedPosition.entryPrice as number
    const close = parseFloat(closePrice)
    const qty = selectedPosition.quantity as number
    const lot = selectedPosition.lotSize as number || 1000
    const dir = (selectedPosition.direction as string) === 'LONG' ? 1 : -1
    if (isNaN(close)) return null
    return (close - entry) * qty * lot * dir
  })()

  // MTM change preview
  const mtmChangePreview = (() => {
    if (!selectedPosition || !mtmPrice) return null
    const entry = selectedPosition.entryPrice as number
    const newPrice = parseFloat(mtmPrice)
    const qty = selectedPosition.quantity as number
    const lot = selectedPosition.lotSize as number || 1000
    const dir = (selectedPosition.direction as string) === 'LONG' ? 1 : -1
    if (isNaN(newPrice)) return null
    return (newPrice - entry) * qty * lot * dir
  })()

  // P&L bar segments
  const pnlSegments = pnl
    ? [
        { label: 'Physical', value: pnl.physicalPnl as number, color: 'bg-blue-500' },
        { label: 'Paper', value: pnl.paperPnl as number, color: 'bg-purple-500' },
        { label: 'Hedging', value: pnl.hedgingPnl as number, color: 'bg-green-500' },
        { label: 'Basis', value: pnl.basisPnl as number, color: 'bg-amber-500' },
      ]
    : []

  const pnlTotal = pnl?.totalPnl as number ?? 0
  const maxAbsPnl = pnlSegments.length > 0
    ? Math.max(...pnlSegments.map((s) => Math.abs(s.value)), 1)
    : 1

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Freight Derivatives (FFA)</h1>
          <p className="text-maritime-400 text-sm mt-1">Forward Freight Agreement trading and risk management</p>
        </div>
        <button onClick={() => setShowOpen(true)} className={btnPrimary}>+ Open Position</button>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-[10px] uppercase tracking-wide">Open Positions</p>
          <p className="text-white text-2xl font-bold mt-1">{portfolio?.openPositions ?? 0}</p>
          <p className="text-maritime-500 text-[10px] mt-1">of {portfolio?.totalPositions ?? 0} total</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-[10px] uppercase tracking-wide">Net Exposure</p>
          <p className={`text-2xl font-bold mt-1 ${(portfolio?.netExposure ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {fmtCompact(portfolio?.netExposure ?? 0)}
          </p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-[10px] uppercase tracking-wide">Total MTM P&L</p>
          <p className={`text-2xl font-bold mt-1 ${(portfolio?.totalMtm ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {fmtSignedUSD(portfolio?.totalMtm ?? 0)}
          </p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-[10px] uppercase tracking-wide">Total Margin</p>
          <p className="text-white text-2xl font-bold mt-1">{fmtCompact(portfolio?.totalMargin ?? 0)}</p>
        </div>
        <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4">
          <p className="text-red-400 text-[10px] uppercase tracking-wide">VaR 1D 95%</p>
          <p className="text-red-400 text-2xl font-bold mt-1">{fmtCompact(varSnapshot?.varOneDay95 ?? 0)}</p>
          <p className="text-maritime-500 text-[10px] mt-1">{varSnapshot?.methodology ?? 'Historical'}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-[10px] uppercase tracking-wide">Sharpe Ratio</p>
          <p className={`text-2xl font-bold mt-1 ${(varSnapshot?.sharpeRatio ?? 0) > 1 ? 'text-green-400' : 'text-white'}`}>
            {(varSnapshot?.sharpeRatio ?? 0).toFixed(2)}
          </p>
          <p className="text-maritime-500 text-[10px] mt-1">Max DD: {fmtCompact(varSnapshot?.maxDrawdown ?? 0)}</p>
        </div>
      </div>

      {/* P&L Attribution Bar */}
      {pnl && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-maritime-300 text-xs font-semibold uppercase tracking-wide">P&L Attribution</h3>
            <span className={`text-sm font-bold ${pnlTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              Total: {fmtSignedUSD(pnlTotal)}
            </span>
          </div>
          {/* Stacked bar */}
          <div className="flex h-8 rounded overflow-hidden mb-3">
            {pnlSegments.map((seg) => {
              const width = maxAbsPnl > 0 ? (Math.abs(seg.value) / pnlSegments.reduce((s, v) => s + Math.abs(v.value), 0)) * 100 : 25
              return (
                <div
                  key={seg.label}
                  className={`${seg.color} flex items-center justify-center text-[10px] text-white font-medium`}
                  style={{ width: `${Math.max(width, 5)}%` }}
                  title={`${seg.label}: ${fmtUSD(seg.value)}`}
                >
                  {width > 10 ? seg.label : ''}
                </div>
              )
            })}
          </div>
          {/* Labels */}
          <div className="flex justify-between">
            {pnlSegments.map((seg) => (
              <div key={seg.label} className="text-center">
                <div className="flex items-center gap-1.5 justify-center">
                  <span className={`w-2.5 h-2.5 rounded-sm ${seg.color}`} />
                  <span className="text-maritime-400 text-[10px]">{seg.label}</span>
                </div>
                <p className={`text-xs font-medium mt-0.5 ${seg.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {fmtSignedUSD(seg.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Route Exposure Table */}
      {topRoutes.length > 0 && (
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-maritime-700">
            <h3 className="text-maritime-300 text-xs font-semibold uppercase tracking-wide">Route Exposure</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-left border-b border-maritime-700">
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium text-right">Long Lots</th>
                <th className="px-4 py-3 font-medium text-right">Short Lots</th>
                <th className="px-4 py-3 font-medium text-right">Net</th>
                <th className="px-4 py-3 font-medium text-right">Net Exposure</th>
                <th className="px-4 py-3 font-medium text-right">MTM P&L</th>
              </tr>
            </thead>
            <tbody>
              {topRoutes.map((r: Record<string, unknown>) => {
                const netLots = r.netLots as number
                const mtmPnl = r.mtmPnl as number
                return (
                  <tr key={r.route as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="px-4 py-3 text-white font-bold text-xs">{r.route as string}</td>
                    <td className="px-4 py-3 text-green-400 text-xs text-right">{r.longLots as number}</td>
                    <td className="px-4 py-3 text-red-400 text-xs text-right">{r.shortLots as number}</td>
                    <td className={`px-4 py-3 text-xs text-right font-medium ${netLots >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {netLots >= 0 ? '+' : ''}{netLots}
                    </td>
                    <td className="px-4 py-3 text-white text-xs text-right">{fmtUSD(r.netExposure as number)}</td>
                    <td className={`px-4 py-3 text-xs text-right font-medium ${mtmPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {fmtSignedUSD(mtmPnl)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          {statusTabs.map((tab) => {
            const value = tab === 'All' ? '' : tab.toLowerCase().replace(/ /g, '_')
            const isActive = statusFilter === value
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(value)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-maritime-400 hover:text-white hover:bg-maritime-700/50'
                }`}
              >
                {tab}
              </button>
            )
          })}
        </div>
        <div className="flex-1" />
        <button onClick={() => setShowOpen(true)} className={btnPrimary}>+ Open Position</button>
      </div>

      {/* Loading / Error */}
      {loading && <p className="text-maritime-400">Loading positions...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Positions Table */}
      {!loading && (
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-left border-b border-maritime-700">
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Direction</th>
                <th className="px-4 py-3 font-medium text-right">Qty (lots)</th>
                <th className="px-4 py-3 font-medium text-right">Lot Size</th>
                <th className="px-4 py-3 font-medium text-right">Entry Price</th>
                <th className="px-4 py-3 font-medium text-right">Current Price</th>
                <th className="px-4 py-3 font-medium text-right">MTM P&L</th>
                <th className="px-4 py-3 font-medium">Clearing</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos: Record<string, unknown>) => {
                const dir = pos.direction as string
                const mtm = pos.mtmValue as number ?? 0
                const status = pos.status as string
                return (
                  <tr key={pos.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="px-4 py-3 text-white font-bold text-xs">{pos.route as string}</td>
                    <td className="px-4 py-3 text-maritime-300 text-xs">{pos.period as string}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        dir === 'LONG' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {dir}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white text-xs text-right">{pos.quantity as number}</td>
                    <td className="px-4 py-3 text-maritime-400 text-xs text-right">{pos.lotSize as number ?? 1000}</td>
                    <td className="px-4 py-3 text-white text-xs text-right">
                      ${(pos.entryPrice as number).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-xs text-right">
                      {pos.currentPrice ? `$${(pos.currentPrice as number).toFixed(2)}` : '-'}
                    </td>
                    <td className={`px-4 py-3 text-xs text-right font-medium ${mtm >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {mtm !== 0 ? fmtSignedUSD(mtm) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {pos.clearingHouse ? (
                        <span className="bg-maritime-700 text-maritime-300 px-2 py-0.5 rounded text-[10px] font-medium">
                          {pos.clearingHouse as string}
                        </span>
                      ) : (
                        <span className="text-maritime-600 text-xs">OTC</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[status] ?? 'bg-maritime-700 text-maritime-300'}`}>
                        {status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openMtmModal(pos)}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                        >
                          MTM
                        </button>
                        {status === 'open' && (
                          <button
                            onClick={() => openCloseModal(pos)}
                            className="text-red-400 hover:text-red-300 text-xs font-medium"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-maritime-500">
                    No FFA positions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Open Position Modal */}
      <Modal open={showOpen} onClose={() => setShowOpen(false)} title="Open FFA Position">
        <form onSubmit={handleOpenPosition}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Route *">
              <select value={positionForm.route} onChange={setPF('route')} className={selectClass} required>
                {ffaRoutes.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
            <FormField label="Period *">
              <input
                value={positionForm.period}
                onChange={setPF('period')}
                className={inputClass}
                required
                placeholder="e.g. Q1 2026, Mar 2026"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Direction *">
              <select value={positionForm.direction} onChange={setPF('direction')} className={selectClass} required>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </FormField>
            <FormField label="Quantity (lots) *">
              <input
                type="number"
                step="1"
                min="1"
                value={positionForm.quantity}
                onChange={setPF('quantity')}
                className={inputClass}
                required
              />
            </FormField>
          </div>
          <FormField label="Entry Price ($/ton) *">
            <input
              type="number"
              step="0.01"
              value={positionForm.entryPrice}
              onChange={setPF('entryPrice')}
              className={inputClass}
              required
              placeholder="e.g. 15.50"
            />
          </FormField>
          <FormField label="Clearing House">
            <select value={positionForm.clearingHouse} onChange={setPF('clearingHouse')} className={selectClass}>
              <option value="">None (OTC)</option>
              {clearingHouses.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Counterparty">
              <input
                value={positionForm.counterparty}
                onChange={setPF('counterparty')}
                className={inputClass}
                placeholder="Counterparty name"
              />
            </FormField>
            <FormField label="Broker">
              <input
                value={positionForm.broker}
                onChange={setPF('broker')}
                className={inputClass}
                placeholder="Broker name"
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowOpen(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={openingPosition} className={btnPrimary}>
              {openingPosition ? 'Opening...' : 'Open Position'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Close Position Modal */}
      <Modal open={showClose} onClose={() => setShowClose(false)} title="Close Position">
        <form onSubmit={handleClosePosition}>
          {selectedPosition && (
            <>
              {/* Position Summary */}
              <div className="bg-maritime-900 border border-maritime-700 rounded-lg p-4 mb-4">
                <h4 className="text-maritime-300 text-xs font-semibold uppercase tracking-wide mb-3">Position Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-maritime-500">Route</span>
                    <p className="text-white font-bold">{selectedPosition.route as string}</p>
                  </div>
                  <div>
                    <span className="text-maritime-500">Period</span>
                    <p className="text-white">{selectedPosition.period as string}</p>
                  </div>
                  <div>
                    <span className="text-maritime-500">Direction</span>
                    <p className={`font-medium ${(selectedPosition.direction as string) === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedPosition.direction as string}
                    </p>
                  </div>
                  <div>
                    <span className="text-maritime-500">Quantity</span>
                    <p className="text-white">{selectedPosition.quantity as number} lots</p>
                  </div>
                  <div>
                    <span className="text-maritime-500">Entry Price</span>
                    <p className="text-white">${(selectedPosition.entryPrice as number).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-maritime-500">Lot Size</span>
                    <p className="text-white">{selectedPosition.lotSize as number ?? 1000} MT</p>
                  </div>
                </div>
              </div>

              <FormField label="Close Price ($/ton) *">
                <input
                  type="number"
                  step="0.01"
                  value={closePrice}
                  onChange={(e) => setClosePrice(e.target.value)}
                  className={inputClass}
                  required
                  placeholder="Settlement / close price"
                />
              </FormField>

              {/* P&L Preview */}
              {closePnlPreview !== null && (
                <div className={`rounded-lg p-4 mb-4 border ${closePnlPreview >= 0 ? 'bg-green-900/20 border-green-900/50' : 'bg-red-900/20 border-red-900/50'}`}>
                  <p className="text-maritime-400 text-[10px] uppercase tracking-wide">Estimated P&L</p>
                  <p className={`text-2xl font-bold mt-1 ${closePnlPreview >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {fmtSignedUSD(closePnlPreview)}
                  </p>
                  <p className="text-maritime-500 text-[10px] mt-1">
                    ({(selectedPosition.direction as string) === 'LONG' ? 'Close' : 'Entry'} - {(selectedPosition.direction as string) === 'LONG' ? 'Entry' : 'Close'}) x {selectedPosition.quantity as number} lots x {selectedPosition.lotSize as number ?? 1000} MT
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowClose(false)} className={btnSecondary}>Cancel</button>
                <button type="submit" disabled={closingPosition} className={`${btnPrimary} bg-red-600 hover:bg-red-700`}>
                  {closingPosition ? 'Closing...' : 'Confirm Close'}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Update MTM Modal */}
      <Modal open={showMtm} onClose={() => setShowMtm(false)} title="Update Mark-to-Market">
        <form onSubmit={handleUpdateMTM}>
          {selectedPosition && (
            <>
              <div className="bg-maritime-900 border border-maritime-700 rounded-lg p-3 mb-4 text-xs">
                <span className="text-white font-bold">{selectedPosition.route as string}</span>
                <span className="text-maritime-500 ml-2">{selectedPosition.period as string}</span>
                <span className={`ml-2 ${(selectedPosition.direction as string) === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedPosition.direction as string}
                </span>
                <span className="text-maritime-400 ml-2">{selectedPosition.quantity as number} lots @ ${(selectedPosition.entryPrice as number).toFixed(2)}</span>
              </div>

              <FormField label="Current Market Price ($/ton) *">
                <input
                  type="number"
                  step="0.01"
                  value={mtmPrice}
                  onChange={(e) => setMtmPrice(e.target.value)}
                  className={inputClass}
                  required
                  placeholder="Current market price"
                />
              </FormField>

              {/* MTM Preview */}
              {mtmChangePreview !== null && (
                <div className={`rounded-lg p-3 mb-4 border ${mtmChangePreview >= 0 ? 'bg-green-900/20 border-green-900/50' : 'bg-red-900/20 border-red-900/50'}`}>
                  <p className="text-maritime-400 text-[10px] uppercase tracking-wide">New MTM Value</p>
                  <p className={`text-xl font-bold mt-1 ${mtmChangePreview >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {fmtSignedUSD(mtmChangePreview)}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowMtm(false)} className={btnSecondary}>Cancel</button>
                <button type="submit" disabled={updatingMtm} className={btnPrimary}>
                  {updatingMtm ? 'Updating...' : 'Apply MTM'}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  )
}
