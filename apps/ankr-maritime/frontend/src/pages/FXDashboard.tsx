import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const FX_QUERY = gql`
  query FXExposures($status: String, $currency: String) {
    fxExposures(status: $status, currency: $currency) {
      id currency baseCurrency exposureType amount spotRate
      hedgedAmount hedgeRate hedgeInstrument hedgeMaturity
      counterparty notes status createdAt
    }
    fxExposureSummary {
      currency exposureType totalAmount hedgedAmount unhedgedAmount avgRate
    }
    tradeFinanceDashboard {
      lcStats { totalActive totalAmount expiringIn30Days discrepantCount }
      paymentStats { pendingAmount overdueAmount paidThisMonth avgPaymentDays }
      fxStats { totalExposure hedgedPercent topCurrencies { currency amount hedged } }
    }
  }
`

const CREATE_EXPOSURE = gql`
  mutation CreateExposure(
    $currency: String!, $baseCurrency: String!, $exposureType: String!,
    $amount: Float!, $spotRate: Float!, $counterparty: String, $notes: String
  ) {
    createFXExposure(
      currency: $currency, baseCurrency: $baseCurrency, exposureType: $exposureType,
      amount: $amount, spotRate: $spotRate, counterparty: $counterparty, notes: $notes
    ) { id }
  }
`

const ADD_HEDGE = gql`
  mutation AddHedge($id: String!, $hedgedAmount: Float!, $hedgeRate: Float!, $hedgeInstrument: String!) {
    addHedge(id: $id, hedgedAmount: $hedgedAmount, hedgeRate: $hedgeRate, hedgeInstrument: $hedgeInstrument) { id status }
  }
`

const SETTLE_EXPOSURE = gql`
  mutation SettleExposure($id: String!) {
    settleFXExposure(id: $id) { id status }
  }
`

const statusColors: Record<string, string> = {
  open: 'bg-blue-900/50 text-blue-400',
  partially_hedged: 'bg-amber-900/50 text-amber-400',
  fully_hedged: 'bg-green-900/50 text-green-400',
  settled: 'bg-maritime-700 text-maritime-400',
}

const instrumentColors: Record<string, string> = {
  forward: 'bg-blue-900/50 text-blue-400',
  option: 'bg-purple-900/50 text-purple-400',
  swap: 'bg-amber-900/50 text-amber-400',
}

const currencies = ['EUR', 'GBP', 'JPY', 'CNY', 'SGD', 'INR', 'AED', 'NOK', 'KRW', 'BRL']
const hedgeInstruments = ['forward', 'option', 'swap']

const emptyExposureForm = {
  currency: 'EUR', baseCurrency: 'USD', exposureType: 'receivable',
  amount: '', spotRate: '', counterparty: '', notes: '',
}

const emptyHedgeForm = {
  hedgedAmount: '', hedgeRate: '', hedgeInstrument: 'forward', hedgeMaturity: '',
}

export function FXDashboard() {
  const [statusFilter, setStatusFilter] = useState('')
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [showExposure, setShowExposure] = useState(false)
  const [showHedge, setShowHedge] = useState(false)
  const [hedgeTargetId, setHedgeTargetId] = useState('')
  const [exposureForm, setExposureForm] = useState(emptyExposureForm)
  const [hedgeForm, setHedgeForm] = useState(emptyHedgeForm)

  const { data, loading, error, refetch } = useQuery(FX_QUERY, {
    variables: { status: statusFilter || undefined, currency: currencyFilter || undefined },
  })
  const [createExposure, { loading: creatingExposure }] = useMutation(CREATE_EXPOSURE)
  const [addHedge, { loading: addingHedge }] = useMutation(ADD_HEDGE)
  const [settleExposure] = useMutation(SETTLE_EXPOSURE)

  const exposures = data?.fxExposures ?? []
  const summaryByCcy = data?.fxExposureSummary ?? []
  const dashboard = data?.tradeFinanceDashboard
  const lcStats = dashboard?.lcStats
  const payStats = dashboard?.paymentStats
  const fxStats = dashboard?.fxStats

  const fmtMoney = (amt: number, ccy = 'USD') =>
    `${ccy} ${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const fmtCompact = (amt: number) => {
    if (amt >= 1_000_000) return `$${(amt / 1_000_000).toFixed(1)}M`
    if (amt >= 1_000) return `$${(amt / 1_000).toFixed(0)}K`
    return `$${amt.toFixed(0)}`
  }

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

  const setEF = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setExposureForm((f) => ({ ...f, [field]: e.target.value }))

  const setHF = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setHedgeForm((f) => ({ ...f, [field]: e.target.value }))

  const handleCreateExposure = async (e: React.FormEvent) => {
    e.preventDefault()
    await createExposure({
      variables: {
        currency: exposureForm.currency, baseCurrency: exposureForm.baseCurrency,
        exposureType: exposureForm.exposureType, amount: parseFloat(exposureForm.amount),
        spotRate: parseFloat(exposureForm.spotRate),
        counterparty: exposureForm.counterparty || null,
        notes: exposureForm.notes || null,
      },
    })
    setExposureForm(emptyExposureForm)
    setShowExposure(false)
    refetch()
  }

  const handleAddHedge = async (e: React.FormEvent) => {
    e.preventDefault()
    await addHedge({
      variables: {
        id: hedgeTargetId,
        hedgedAmount: parseFloat(hedgeForm.hedgedAmount),
        hedgeRate: parseFloat(hedgeForm.hedgeRate),
        hedgeInstrument: hedgeForm.hedgeInstrument,
      },
    })
    setHedgeForm(emptyHedgeForm)
    setHedgeTargetId('')
    setShowHedge(false)
    refetch()
  }

  const handleSettle = async (id: string) => {
    await settleExposure({ variables: { id } })
    refetch()
  }

  const openHedge = (id: string) => {
    setHedgeTargetId(id)
    setHedgeForm(emptyHedgeForm)
    setShowHedge(true)
  }

  // Group summary by currency for cards
  const currencyGroups: Record<string, { total: number; hedged: number; unhedged: number }> = {}
  summaryByCcy.forEach((s: Record<string, unknown>) => {
    const ccy = s.currency as string
    if (!currencyGroups[ccy]) currencyGroups[ccy] = { total: 0, hedged: 0, unhedged: 0 }
    currencyGroups[ccy].total += (s.totalAmount as number)
    currencyGroups[ccy].hedged += (s.hedgedAmount as number)
    currencyGroups[ccy].unhedged += (s.unhedgedAmount as number)
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">FX & Trade Finance Dashboard</h1>
          <p className="text-maritime-400 text-sm mt-1">Foreign exchange exposure monitoring and hedging</p>
        </div>
        <button onClick={() => setShowExposure(true)} className={btnPrimary}>+ New Exposure</button>
      </div>

      {/* Trade Finance Dashboard Summary */}
      {dashboard && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* LC Overview */}
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <h3 className="text-maritime-300 text-xs font-semibold mb-3 uppercase tracking-wide">L/C Overview</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-maritime-500 text-[10px]">Active</p>
                <p className="text-white text-lg font-bold">{lcStats?.totalActive ?? 0}</p>
              </div>
              <div>
                <p className="text-maritime-500 text-[10px]">Total Amount</p>
                <p className="text-white text-lg font-bold">{fmtCompact(lcStats?.totalAmount ?? 0)}</p>
              </div>
              <div>
                <p className="text-maritime-500 text-[10px]">Expiring Soon</p>
                <p className={`text-lg font-bold ${(lcStats?.expiringIn30Days ?? 0) > 0 ? 'text-amber-400' : 'text-white'}`}>
                  {lcStats?.expiringIn30Days ?? 0}
                </p>
              </div>
              <div>
                <p className="text-maritime-500 text-[10px]">Discrepant</p>
                <p className={`text-lg font-bold ${(lcStats?.discrepantCount ?? 0) > 0 ? 'text-red-400' : 'text-white'}`}>
                  {lcStats?.discrepantCount ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <h3 className="text-maritime-300 text-xs font-semibold mb-3 uppercase tracking-wide">Payments</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-maritime-500 text-[10px]">Pending</p>
                <p className="text-white text-lg font-bold">{fmtCompact(payStats?.pendingAmount ?? 0)}</p>
              </div>
              <div>
                <p className="text-maritime-500 text-[10px]">Overdue</p>
                <p className="text-red-400 text-lg font-bold">{fmtCompact(payStats?.overdueAmount ?? 0)}</p>
              </div>
              <div>
                <p className="text-maritime-500 text-[10px]">Paid This Month</p>
                <p className="text-green-400 text-lg font-bold">{fmtCompact(payStats?.paidThisMonth ?? 0)}</p>
              </div>
              <div>
                <p className="text-maritime-500 text-[10px]">Avg Payment Days</p>
                <p className="text-white text-lg font-bold">{payStats?.avgPaymentDays ?? 0}d</p>
              </div>
            </div>
          </div>

          {/* FX Stats */}
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <h3 className="text-maritime-300 text-xs font-semibold mb-3 uppercase tracking-wide">FX Exposure</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-maritime-500 text-[10px]">Total Exposure</p>
                <p className="text-white text-lg font-bold">{fmtCompact(fxStats?.totalExposure ?? 0)}</p>
              </div>
              <div>
                <p className="text-maritime-500 text-[10px]">Hedged %</p>
                <p className="text-white text-lg font-bold">{(fxStats?.hedgedPercent ?? 0).toFixed(1)}%</p>
              </div>
            </div>
            {/* Top currencies bar */}
            <div className="space-y-1">
              {(fxStats?.topCurrencies ?? []).slice(0, 3).map((tc: Record<string, unknown>) => {
                const pct = (tc.amount as number) > 0 ? ((tc.hedged as number) / (tc.amount as number)) * 100 : 0
                return (
                  <div key={tc.currency as string} className="flex items-center gap-2">
                    <span className="text-maritime-400 text-[10px] w-8">{tc.currency as string}</span>
                    <div className="flex-1 h-3 bg-maritime-700 rounded overflow-hidden">
                      <div className="h-full bg-blue-500 rounded" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className="text-maritime-500 text-[10px] w-10 text-right">{pct.toFixed(0)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Currency Exposure Cards */}
      {Object.keys(currencyGroups).length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(currencyGroups).map(([ccy, grp]) => {
            const hedgePct = grp.total > 0 ? (grp.hedged / grp.total) * 100 : 0
            return (
              <div key={ccy} className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white text-sm font-bold">{ccy}</h4>
                  <span className="text-maritime-400 text-xs">{hedgePct.toFixed(0)}% hedged</span>
                </div>
                <div className="space-y-1 text-xs mb-2">
                  <div className="flex justify-between">
                    <span className="text-maritime-400">Total Exposure</span>
                    <span className="text-white font-medium">{fmtMoney(grp.total, ccy)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-maritime-400">Hedged</span>
                    <span className="text-green-400">{fmtMoney(grp.hedged, ccy)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-maritime-400">Unhedged</span>
                    <span className="text-amber-400">{fmtMoney(grp.unhedged, ccy)}</span>
                  </div>
                </div>
                <div className="h-2 bg-maritime-700 rounded overflow-hidden">
                  <div className="h-full bg-green-500 rounded" style={{ width: `${Math.min(hedgePct, 100)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm"
        >
          <option value="">All Statuses</option>
          {Object.keys(statusColors).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={currencyFilter}
          onChange={(e) => setCurrencyFilter(e.target.value)}
          className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm"
        >
          <option value="">All Currencies</option>
          {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading && <p className="text-maritime-400">Loading...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* FX Exposure Table */}
      {!loading && (
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-left border-b border-maritime-700">
                <th className="px-4 py-3 font-medium">Currency</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Spot Rate</th>
                <th className="px-4 py-3 font-medium">Hedged</th>
                <th className="px-4 py-3 font-medium">Hedge %</th>
                <th className="px-4 py-3 font-medium">Instrument</th>
                <th className="px-4 py-3 font-medium">Maturity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exposures.map((exp: Record<string, unknown>) => {
                const hedgePct = (exp.amount as number) > 0
                  ? ((exp.hedgedAmount as number) / (exp.amount as number)) * 100
                  : 0
                return (
                  <tr key={exp.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="px-4 py-3 text-white font-bold text-xs">
                      {exp.currency as string}/{exp.baseCurrency as string}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        exp.exposureType === 'receivable' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {exp.exposureType as string}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium text-xs">
                      {fmtMoney(exp.amount as number, exp.currency as string)}
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-xs">
                      {(exp.spotRate as number)?.toFixed(4) ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-green-400">{fmtMoney(exp.hedgedAmount as number ?? 0, exp.currency as string)}</span>
                      {exp.hedgeRate && (
                        <span className="text-maritime-500 ml-1 text-[10px]">@{(exp.hedgeRate as number).toFixed(4)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-maritime-700 rounded overflow-hidden">
                          <div className="h-full bg-green-500 rounded" style={{ width: `${Math.min(hedgePct, 100)}%` }} />
                        </div>
                        <span className="text-maritime-400">{hedgePct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {exp.hedgeInstrument ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${instrumentColors[exp.hedgeInstrument as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {exp.hedgeInstrument as string}
                        </span>
                      ) : (
                        <span className="text-maritime-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(exp.hedgeMaturity as string | null)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[exp.status as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                        {(exp.status as string).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {exp.status !== 'settled' && (
                          <button onClick={() => openHedge(exp.id as string)} className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                            Hedge
                          </button>
                        )}
                        {exp.status === 'fully_hedged' && (
                          <button onClick={() => handleSettle(exp.id as string)} className="text-green-400 hover:text-green-300 text-xs font-medium">
                            Settle
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {exposures.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-maritime-500">No FX exposures found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Exposure Modal */}
      <Modal open={showExposure} onClose={() => setShowExposure(false)} title="Add FX Exposure">
        <form onSubmit={handleCreateExposure}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Currency *">
              <select value={exposureForm.currency} onChange={setEF('currency')} className={selectClass} required>
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Base Currency">
              <select value={exposureForm.baseCurrency} onChange={setEF('baseCurrency')} className={selectClass}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount *">
              <input type="number" step="0.01" value={exposureForm.amount} onChange={setEF('amount')} className={inputClass} required />
            </FormField>
            <FormField label="Type *">
              <select value={exposureForm.exposureType} onChange={setEF('exposureType')} className={selectClass}>
                <option value="receivable">Receivable</option>
                <option value="payable">Payable</option>
              </select>
            </FormField>
          </div>
          <FormField label="Spot Rate *">
            <input type="number" step="0.0001" value={exposureForm.spotRate} onChange={setEF('spotRate')} className={inputClass} required placeholder="1.0850" />
          </FormField>
          <FormField label="Counterparty">
            <input value={exposureForm.counterparty} onChange={setEF('counterparty')} className={inputClass} placeholder="Bank / Broker name" />
          </FormField>
          <FormField label="Notes">
            <textarea value={exposureForm.notes} onChange={setEF('notes')} className={`${inputClass} h-16 resize-none`} placeholder="Details..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowExposure(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creatingExposure} className={btnPrimary}>
              {creatingExposure ? 'Creating...' : 'Add Exposure'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Hedge Modal */}
      <Modal open={showHedge} onClose={() => setShowHedge(false)} title="Add Hedge">
        <form onSubmit={handleAddHedge}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Hedged Amount *">
              <input type="number" step="0.01" value={hedgeForm.hedgedAmount} onChange={setHF('hedgedAmount')} className={inputClass} required />
            </FormField>
            <FormField label="Hedge Rate *">
              <input type="number" step="0.0001" value={hedgeForm.hedgeRate} onChange={setHF('hedgeRate')} className={inputClass} required placeholder="1.0900" />
            </FormField>
          </div>
          <FormField label="Instrument *">
            <select value={hedgeForm.hedgeInstrument} onChange={setHF('hedgeInstrument')} className={selectClass} required>
              {hedgeInstruments.map((i) => <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
            </select>
          </FormField>
          <FormField label="Maturity Date">
            <input type="date" value={hedgeForm.hedgeMaturity} onChange={setHF('hedgeMaturity')} className={inputClass} />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowHedge(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={addingHedge} className={btnPrimary}>
              {addingHedge ? 'Adding...' : 'Add Hedge'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
