import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const HIRE_SCHEDULES_QUERY = gql`
  query HirePaymentSchedules($timeCharterId: String, $status: String) {
    hirePaymentSchedules(timeCharterId: $timeCharterId, status: $status) {
      id periodNumber periodStart periodEnd daysInPeriod dailyRate
      grossHire offHireDeduction bunkerAdjustment addressCommission brokerCommission
      netHire invoiceNumber dueDate paidDate paidAmount status
    }
  }
`

const HIRE_SUMMARY_QUERY = gql`
  query HirePaymentSummary($timeCharterId: String) {
    hirePaymentSummary(timeCharterId: $timeCharterId) {
      totalGrossHire totalDeductions totalNetHire paidAmount outstandingAmount overdueCount
    }
  }
`

const TIME_CHARTERS_QUERY = gql`
  query TimeChartersForHire {
    timeCharters {
      id reference vessel { name }
    }
  }
`

const GENERATE_SCHEDULE = gql`
  mutation GenerateHireSchedule(
    $timeCharterId: String!, $periodDays: Int!, $dailyRate: Float!,
    $addressCommissionPct: Float, $brokerCommissionPct: Float
  ) {
    generateHireSchedule(
      timeCharterId: $timeCharterId, periodDays: $periodDays, dailyRate: $dailyRate,
      addressCommissionPct: $addressCommissionPct, brokerCommissionPct: $brokerCommissionPct
    ) { id }
  }
`

const RECORD_PAYMENT = gql`
  mutation RecordHirePayment($id: String!, $paidAmount: Float!, $paidDate: DateTime!) {
    recordHirePayment(id: $id, paidAmount: $paidAmount, paidDate: $paidDate) { id }
  }
`

const INVOICE_HIRE = gql`
  mutation InvoiceHirePayment($id: String!, $invoiceNumber: String!) {
    invoiceHirePayment(id: $id, invoiceNumber: $invoiceNumber) { id }
  }
`

const statusColors: Record<string, string> = {
  paid: 'bg-green-900/50 text-green-400',
  invoiced: 'bg-blue-900/50 text-blue-400',
  overdue: 'bg-red-900/50 text-red-400',
  draft: 'bg-gray-800 text-gray-400',
  pending: 'bg-yellow-900/50 text-yellow-400',
}

function fmtMoney(n: number | null | undefined) {
  if (n == null) return '-'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString() : '-'
}

const emptyGenForm = {
  timeCharterId: '',
  periodDays: '15',
  dailyRate: '',
  addressCommissionPct: '3.75',
  brokerCommissionPct: '1.25',
}

const emptyPayForm = {
  paidAmount: '',
  paidDate: '',
}

export function HirePayments() {
  const [tcFilter, setTcFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showGenerate, setShowGenerate] = useState(false)
  const [showPayment, setShowPayment] = useState<string | null>(null)
  const [showInvoice, setShowInvoice] = useState<string | null>(null)
  const [invoiceNum, setInvoiceNum] = useState('')
  const [genForm, setGenForm] = useState(emptyGenForm)
  const [payForm, setPayForm] = useState(emptyPayForm)

  const queryVars: Record<string, string | undefined> = {}
  if (tcFilter) queryVars.timeCharterId = tcFilter
  if (statusFilter) queryVars.status = statusFilter

  const { data, loading, error, refetch } = useQuery(HIRE_SCHEDULES_QUERY, { variables: queryVars })
  const { data: summaryData, refetch: refetchSummary } = useQuery(HIRE_SUMMARY_QUERY, {
    variables: { timeCharterId: tcFilter || undefined },
  })
  const { data: tcData } = useQuery(TIME_CHARTERS_QUERY)
  const [generateSchedule, { loading: generating }] = useMutation(GENERATE_SCHEDULE)
  const [recordPayment, { loading: recording }] = useMutation(RECORD_PAYMENT)
  const [invoiceHire] = useMutation(INVOICE_HIRE)

  const schedules = data?.hirePaymentSchedules ?? []
  const summary = summaryData?.hirePaymentSummary
  const timeCharters = tcData?.timeCharters ?? []

  const totalNetHire = summary?.totalNetHire ?? 0
  const paidAmount = summary?.paidAmount ?? 0
  const outstanding = summary?.outstandingAmount ?? 0
  const overdueCount = summary?.overdueCount ?? 0

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    await generateSchedule({
      variables: {
        timeCharterId: genForm.timeCharterId,
        periodDays: Number(genForm.periodDays),
        dailyRate: Number(genForm.dailyRate),
        addressCommissionPct: genForm.addressCommissionPct ? Number(genForm.addressCommissionPct) : null,
        brokerCommissionPct: genForm.brokerCommissionPct ? Number(genForm.brokerCommissionPct) : null,
      },
    })
    setGenForm(emptyGenForm)
    setShowGenerate(false)
    refetch()
    refetchSummary()
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showPayment) return
    await recordPayment({
      variables: {
        id: showPayment,
        paidAmount: Number(payForm.paidAmount),
        paidDate: new Date(payForm.paidDate).toISOString(),
      },
    })
    setPayForm(emptyPayForm)
    setShowPayment(null)
    refetch()
    refetchSummary()
  }

  const handleInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showInvoice) return
    await invoiceHire({
      variables: { id: showInvoice, invoiceNumber: invoiceNum },
    })
    setInvoiceNum('')
    setShowInvoice(null)
    refetch()
  }

  const setGen = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setGenForm((f) => ({ ...f, [field]: e.target.value }))

  const setPay = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPayForm((f) => ({ ...f, [field]: e.target.value }))

  // Waterfall bar widths
  const grossHire = summary?.totalGrossHire ?? 0
  const deductions = summary?.totalDeductions ?? 0
  const maxVal = Math.max(grossHire, 1)
  const grossPct = 100
  const deductPct = (deductions / maxVal) * 100
  const netPct = (totalNetHire / maxVal) * 100

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Hire Payments</h1>
          <p className="text-maritime-400 text-sm mt-1">Time charter hire payment schedules and tracking</p>
        </div>
        <button onClick={() => setShowGenerate(true)} className={btnPrimary}>+ Generate Schedule</button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs font-medium">Total Net Hire</p>
          <p className="text-white text-xl font-bold mt-1">{fmtMoney(totalNetHire)}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs font-medium">Paid</p>
          <p className="text-green-400 text-xl font-bold mt-1">{fmtMoney(paidAmount)}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs font-medium">Outstanding</p>
          <p className="text-yellow-400 text-xl font-bold mt-1">{fmtMoney(outstanding)}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs font-medium">Overdue</p>
          <p className="text-red-400 text-xl font-bold mt-1">{overdueCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={tcFilter}
          onChange={(e) => setTcFilter(e.target.value)}
          className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm"
        >
          <option value="">All Time Charters</option>
          {timeCharters.map((tc: Record<string, unknown>) => (
            <option key={tc.id as string} value={tc.id as string}>
              {tc.reference as string} {(tc.vessel as Record<string, string>)?.name ? `- ${(tc.vessel as Record<string, string>).name}` : ''}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="invoiced">Invoiced</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Waterfall Summary Bar */}
      {summary && grossHire > 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4 mb-6">
          <h3 className="text-maritime-400 text-xs font-medium mb-3">Hire Waterfall</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-maritime-400 text-xs w-24">Gross Hire</span>
                <div className="flex-1 h-6 bg-maritime-900 rounded overflow-hidden">
                  <div className="h-full bg-blue-500 rounded" style={{ width: `${grossPct}%` }} />
                </div>
                <span className="text-white text-xs font-mono w-28 text-right">{fmtMoney(grossHire)}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-maritime-400 text-xs w-24">Deductions</span>
                <div className="flex-1 h-6 bg-maritime-900 rounded overflow-hidden">
                  <div className="h-full bg-red-500/70 rounded" style={{ width: `${deductPct}%` }} />
                </div>
                <span className="text-red-400 text-xs font-mono w-28 text-right">-{fmtMoney(deductions)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-maritime-400 text-xs w-24">Net Hire</span>
                <div className="flex-1 h-6 bg-maritime-900 rounded overflow-hidden">
                  <div className="h-full bg-green-500 rounded" style={{ width: `${netPct}%` }} />
                </div>
                <span className="text-green-400 text-xs font-mono w-28 text-right">{fmtMoney(totalNetHire)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="text-maritime-400">Loading hire payments...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Table */}
      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-3 py-3 font-medium">#</th>
                <th className="text-left px-3 py-3 font-medium">Period</th>
                <th className="text-right px-3 py-3 font-medium">Days</th>
                <th className="text-right px-3 py-3 font-medium">Daily Rate</th>
                <th className="text-right px-3 py-3 font-medium">Gross Hire</th>
                <th className="text-right px-3 py-3 font-medium">Off-Hire</th>
                <th className="text-right px-3 py-3 font-medium">Commissions</th>
                <th className="text-right px-3 py-3 font-medium">Net Hire</th>
                <th className="text-left px-3 py-3 font-medium">Invoice #</th>
                <th className="text-left px-3 py-3 font-medium">Due Date</th>
                <th className="text-center px-3 py-3 font-medium">Status</th>
                <th className="text-center px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((hp: Record<string, unknown>) => {
                const totalComm = ((hp.addressCommission as number) ?? 0) + ((hp.brokerCommission as number) ?? 0)
                return (
                  <tr key={hp.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="px-3 py-3 text-maritime-300 font-mono text-xs">{hp.periodNumber as number}</td>
                    <td className="px-3 py-3 text-maritime-300 text-xs">
                      {fmtDate(hp.periodStart as string)} - {fmtDate(hp.periodEnd as string)}
                    </td>
                    <td className="px-3 py-3 text-maritime-300 text-right">{hp.daysInPeriod as number}</td>
                    <td className="px-3 py-3 text-maritime-300 text-right font-mono">{fmtMoney(hp.dailyRate as number)}</td>
                    <td className="px-3 py-3 text-white text-right font-mono">{fmtMoney(hp.grossHire as number)}</td>
                    <td className="px-3 py-3 text-red-400 text-right font-mono">
                      {(hp.offHireDeduction as number) ? `-${fmtMoney(hp.offHireDeduction as number)}` : '-'}
                    </td>
                    <td className="px-3 py-3 text-orange-400 text-right font-mono">
                      {totalComm ? `-${fmtMoney(totalComm)}` : '-'}
                    </td>
                    <td className="px-3 py-3 text-green-400 text-right font-mono font-medium">{fmtMoney(hp.netHire as number)}</td>
                    <td className="px-3 py-3 text-maritime-300 font-mono text-xs">{(hp.invoiceNumber as string) || '-'}</td>
                    <td className="px-3 py-3 text-maritime-300 text-xs">{fmtDate(hp.dueDate as string)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[(hp.status as string)] ?? 'bg-maritime-700 text-maritime-300'}`}>
                        {hp.status as string}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        {(hp.status as string) === 'draft' && (
                          <button
                            onClick={() => { setShowInvoice(hp.id as string); setInvoiceNum('') }}
                            className="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-xs rounded hover:bg-blue-900/50"
                          >
                            Invoice
                          </button>
                        )}
                        {((hp.status as string) === 'invoiced' || (hp.status as string) === 'overdue') && (
                          <button
                            onClick={() => { setShowPayment(hp.id as string); setPayForm(emptyPayForm) }}
                            className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded hover:bg-green-900/50"
                          >
                            Record Payment
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {schedules.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No hire payment schedules found</p>
          )}
        </div>
      )}

      {/* Generate Schedule Modal */}
      <Modal open={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Hire Schedule">
        <form onSubmit={handleGenerate}>
          <FormField label="Time Charter *">
            <select value={genForm.timeCharterId} onChange={setGen('timeCharterId')} className={selectClass} required>
              <option value="">-- Select Time Charter --</option>
              {timeCharters.map((tc: Record<string, unknown>) => (
                <option key={tc.id as string} value={tc.id as string}>
                  {tc.reference as string} {(tc.vessel as Record<string, string>)?.name ? `- ${(tc.vessel as Record<string, string>).name}` : ''}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Period Days *">
              <input type="number" value={genForm.periodDays} onChange={setGen('periodDays')} className={inputClass} required placeholder="15" />
            </FormField>
            <FormField label="Daily Rate (USD) *">
              <input type="number" step="0.01" value={genForm.dailyRate} onChange={setGen('dailyRate')} className={inputClass} required placeholder="15000" />
            </FormField>
            <FormField label="Address Commission %">
              <input type="number" step="0.01" value={genForm.addressCommissionPct} onChange={setGen('addressCommissionPct')} className={inputClass} placeholder="3.75" />
            </FormField>
            <FormField label="Broker Commission %">
              <input type="number" step="0.01" value={genForm.brokerCommissionPct} onChange={setGen('brokerCommissionPct')} className={inputClass} placeholder="1.25" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowGenerate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={generating} className={btnPrimary}>
              {generating ? 'Generating...' : 'Generate Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal open={!!showPayment} onClose={() => setShowPayment(null)} title="Record Payment">
        <form onSubmit={handlePayment}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Paid Amount *">
              <input type="number" step="0.01" value={payForm.paidAmount} onChange={setPay('paidAmount')} className={inputClass} required placeholder="225000" />
            </FormField>
            <FormField label="Paid Date *">
              <input type="date" value={payForm.paidDate} onChange={setPay('paidDate')} className={inputClass} required />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowPayment(null)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={recording} className={btnPrimary}>
              {recording ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal */}
      <Modal open={!!showInvoice} onClose={() => setShowInvoice(null)} title="Create Invoice">
        <form onSubmit={handleInvoice}>
          <FormField label="Invoice Number *">
            <input value={invoiceNum} onChange={(e) => setInvoiceNum(e.target.value)} className={inputClass} required placeholder="INV-2026-001" />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowInvoice(null)} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary}>Create Invoice</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
