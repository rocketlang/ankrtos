import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const PAYMENTS_QUERY = gql`
  query TradePayments($status: String, $paymentType: String) {
    tradePayments(status: $status, paymentType: $paymentType) {
      id reference paymentType payer payee amount currency
      amountUsd dueDate paidDate bankReference swiftRef
      paymentMethod invoiceRef notes status
      voyage { id voyageNumber }
      createdAt
    }
    paymentSummary {
      totalPending totalOverdue totalPaid
      byType { paymentType count totalAmount }
      byCurrency { currency totalAmount }
    }
  }
`

const CREATE_PAYMENT = gql`
  mutation CreatePayment(
    $reference: String!, $paymentType: String!, $payer: String!, $payee: String!,
    $amount: Float!, $currency: String!, $dueDate: String!, $invoiceRef: String, $notes: String
  ) {
    createTradePayment(
      reference: $reference, paymentType: $paymentType, payer: $payer, payee: $payee,
      amount: $amount, currency: $currency, dueDate: $dueDate, invoiceRef: $invoiceRef, notes: $notes
    ) { id }
  }
`

const RECORD_PAYMENT = gql`
  mutation RecordPayment($id: String!, $bankReference: String) {
    recordPayment(id: $id, bankReference: $bankReference) { id status }
  }
`

const APPROVE_PAYMENT = gql`
  mutation ApprovePayment($id: String!) {
    approvePayment(id: $id) { id status }
  }
`

const statusColors: Record<string, string> = {
  pending: 'bg-maritime-700 text-maritime-300',
  approved: 'bg-blue-900/50 text-blue-400',
  processing: 'bg-yellow-900/50 text-yellow-400',
  paid: 'bg-green-900/50 text-green-400',
  overdue: 'bg-red-900/50 text-red-400',
  disputed: 'bg-orange-900/50 text-orange-400',
  cancelled: 'bg-slate-700 text-slate-400',
}

const typeColors: Record<string, string> = {
  freight_advance: 'bg-blue-900/50 text-blue-400',
  freight_balance: 'bg-indigo-900/50 text-indigo-400',
  demurrage: 'bg-red-900/50 text-red-400',
  despatch: 'bg-green-900/50 text-green-400',
  commission: 'bg-purple-900/50 text-purple-400',
  da_payment: 'bg-amber-900/50 text-amber-400',
  bunker_payment: 'bg-cyan-900/50 text-cyan-400',
  hire_payment: 'bg-pink-900/50 text-pink-400',
}

const paymentTypes = [
  'freight_advance', 'freight_balance', 'demurrage', 'despatch',
  'commission', 'da_payment', 'bunker_payment', 'hire_payment',
]

const statusTabs = ['All', 'Pending', 'Approved', 'Processing', 'Paid', 'Overdue', 'Disputed']

const emptyForm = {
  reference: '', paymentType: 'freight_advance', payer: '', payee: '',
  amount: '', currency: 'USD', dueDate: '', invoiceRef: '', notes: '',
}

export function TradePayments() {
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showRecord, setShowRecord] = useState(false)
  const [recordId, setRecordId] = useState('')
  const [bankRef, setBankRef] = useState('')
  const [form, setForm] = useState(emptyForm)

  const { data, loading, error, refetch } = useQuery(PAYMENTS_QUERY, {
    variables: { status: statusFilter || undefined, paymentType: typeFilter || undefined },
  })
  const [createPayment, { loading: creating }] = useMutation(CREATE_PAYMENT)
  const [recordPayment, { loading: recording }] = useMutation(RECORD_PAYMENT)
  const [approvePayment] = useMutation(APPROVE_PAYMENT)

  const payments = data?.tradePayments ?? []
  const summary = data?.paymentSummary

  const fmtMoney = (amt: number, ccy = 'USD') =>
    `${ccy} ${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

  const isOverdue = (d: string | null, status: string) => {
    if (!d || status === 'paid' || status === 'cancelled') return false
    return new Date(d).getTime() < Date.now()
  }

  const setF = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createPayment({
      variables: {
        reference: form.reference, paymentType: form.paymentType,
        payer: form.payer, payee: form.payee,
        amount: parseFloat(form.amount), currency: form.currency,
        dueDate: form.dueDate, invoiceRef: form.invoiceRef || null,
        notes: form.notes || null,
      },
    })
    setForm(emptyForm)
    setShowCreate(false)
    refetch()
  }

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    await recordPayment({ variables: { id: recordId, bankReference: bankRef || null } })
    setBankRef('')
    setRecordId('')
    setShowRecord(false)
    refetch()
  }

  const handleApprove = async (id: string) => {
    await approvePayment({ variables: { id } })
    refetch()
  }

  const openRecord = (id: string) => {
    setRecordId(id)
    setBankRef('')
    setShowRecord(true)
  }

  // Payment aging calculation
  const agingBuckets = payments.reduce(
    (acc: Record<string, number>, p: Record<string, unknown>) => {
      if (p.status === 'paid' || p.status === 'cancelled') return acc
      if (!p.dueDate) return acc
      const days = Math.ceil((Date.now() - new Date(p.dueDate as string).getTime()) / (1000 * 60 * 60 * 24))
      if (days <= 0) acc.current += (p.amount as number)
      else if (days <= 30) acc['30d'] += (p.amount as number)
      else if (days <= 60) acc['60d'] += (p.amount as number)
      else if (days <= 90) acc['90d'] += (p.amount as number)
      else acc['90d+'] += (p.amount as number)
      return acc
    },
    { current: 0, '30d': 0, '60d': 0, '90d': 0, '90d+': 0 }
  )

  const agingTotal = Object.values(agingBuckets).reduce((s, v) => s + v, 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Trade Payments</h1>
          <p className="text-maritime-400 text-sm mt-1">Payment tracking, approvals, and settlement management</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New Payment</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs mb-1">Pending</p>
          <p className="text-white text-xl font-bold">{fmtMoney(summary?.totalPending ?? 0)}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs mb-1">Overdue</p>
          <p className="text-red-400 text-xl font-bold">{fmtMoney(summary?.totalOverdue ?? 0)}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs mb-1">Paid This Period</p>
          <p className="text-green-400 text-xl font-bold">{fmtMoney(summary?.totalPaid ?? 0)}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs mb-1">By Type</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {(summary?.byType ?? []).slice(0, 4).map((t: Record<string, unknown>) => (
              <span key={t.paymentType as string} className="text-[10px] text-maritime-400">
                {(t.paymentType as string).replace(/_/g, ' ')}: {t.count as number}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Aging Bar */}
      {agingTotal > 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4 mb-6">
          <p className="text-maritime-400 text-xs mb-2 font-medium">Payment Aging</p>
          <div className="flex h-6 rounded overflow-hidden">
            {agingBuckets.current > 0 && (
              <div
                className="bg-green-600 flex items-center justify-center text-[10px] text-white font-medium"
                style={{ width: `${(agingBuckets.current / agingTotal) * 100}%` }}
              >Current</div>
            )}
            {agingBuckets['30d'] > 0 && (
              <div
                className="bg-yellow-600 flex items-center justify-center text-[10px] text-white font-medium"
                style={{ width: `${(agingBuckets['30d'] / agingTotal) * 100}%` }}
              >30d</div>
            )}
            {agingBuckets['60d'] > 0 && (
              <div
                className="bg-orange-600 flex items-center justify-center text-[10px] text-white font-medium"
                style={{ width: `${(agingBuckets['60d'] / agingTotal) * 100}%` }}
              >60d</div>
            )}
            {agingBuckets['90d'] > 0 && (
              <div
                className="bg-red-600 flex items-center justify-center text-[10px] text-white font-medium"
                style={{ width: `${(agingBuckets['90d'] / agingTotal) * 100}%` }}
              >90d</div>
            )}
            {agingBuckets['90d+'] > 0 && (
              <div
                className="bg-red-800 flex items-center justify-center text-[10px] text-white font-medium"
                style={{ width: `${(agingBuckets['90d+'] / agingTotal) * 100}%` }}
              >90d+</div>
            )}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-maritime-500">
            <span>Current: {fmtMoney(agingBuckets.current)}</span>
            <span>30d: {fmtMoney(agingBuckets['30d'])}</span>
            <span>60d: {fmtMoney(agingBuckets['60d'])}</span>
            <span>90d: {fmtMoney(agingBuckets['90d'])}</span>
            <span>90d+: {fmtMoney(agingBuckets['90d+'])}</span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1 border-b border-maritime-700 pb-2 flex-1">
          {statusTabs.map((tab) => {
            const val = tab === 'All' ? '' : tab.toLowerCase()
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(val)}
                className={`px-4 py-2 rounded-t text-sm font-medium ${
                  statusFilter === val
                    ? 'bg-maritime-800 text-white border-b-2 border-blue-500'
                    : 'text-maritime-500 hover:text-maritime-300'
                }`}
              >
                {tab}
              </button>
            )
          })}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm"
        >
          <option value="">All Types</option>
          {paymentTypes.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-maritime-400">Loading...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && (
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-left border-b border-maritime-700">
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Payer / Payee</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Paid Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: Record<string, unknown>) => {
                const overdue = isOverdue(p.dueDate as string, p.status as string)
                return (
                  <tr key={p.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="px-4 py-3 text-white font-mono text-xs">
                      {p.reference as string}
                      {p.voyage && (
                        <span className="text-maritime-500 ml-1 text-[10px]">
                          ({(p.voyage as Record<string, unknown>).voyageNumber as string})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[p.paymentType as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                        {(p.paymentType as string).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-maritime-300">{p.payer as string}</span>
                      <span className="text-maritime-600 mx-1">{'\u2192'}</span>
                      <span className="text-maritime-300">{p.payee as string}</span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium text-xs">{fmtMoney(p.amount as number, p.currency as string)}</td>
                    <td className={`px-4 py-3 text-xs ${overdue ? 'text-red-400 font-bold' : 'text-maritime-400'}`}>
                      {fmtDate(p.dueDate as string)}
                      {overdue && <span className="ml-1 text-[10px]">(overdue)</span>}
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(p.paidDate as string | null)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[p.status as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                        {(p.status as string).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {p.status === 'pending' && (
                          <button onClick={() => handleApprove(p.id as string)} className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                            Approve
                          </button>
                        )}
                        {p.status === 'approved' && (
                          <button onClick={() => openRecord(p.id as string)} className="text-green-400 hover:text-green-300 text-xs font-medium">
                            Record
                          </button>
                        )}
                        {!['paid', 'cancelled', 'overdue'].includes(p.status as string) && overdue && (
                          <span className="text-red-400 text-[10px] font-medium">OVERDUE</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {payments.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-maritime-500">No payments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Payment Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Trade Payment">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Reference *">
              <input value={form.reference} onChange={setF('reference')} className={inputClass} required placeholder="PAY-2026-001" />
            </FormField>
            <FormField label="Payment Type *">
              <select value={form.paymentType} onChange={setF('paymentType')} className={selectClass} required>
                {paymentTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Payer *">
              <input value={form.payer} onChange={setF('payer')} className={inputClass} required placeholder="Company paying" />
            </FormField>
            <FormField label="Payee *">
              <input value={form.payee} onChange={setF('payee')} className={inputClass} required placeholder="Company receiving" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount *">
              <input type="number" step="0.01" value={form.amount} onChange={setF('amount')} className={inputClass} required />
            </FormField>
            <FormField label="Currency *">
              <select value={form.currency} onChange={setF('currency')} className={selectClass}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="SGD">SGD</option>
                <option value="JPY">JPY</option>
                <option value="CNY">CNY</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Due Date *">
              <input type="date" value={form.dueDate} onChange={setF('dueDate')} className={inputClass} required />
            </FormField>
            <FormField label="Invoice Ref">
              <input value={form.invoiceRef} onChange={setF('invoiceRef')} className={inputClass} placeholder="INV-2026-XXX" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={form.notes} onChange={setF('notes')} className={`${inputClass} h-16 resize-none`} placeholder="Payment details..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal open={showRecord} onClose={() => setShowRecord(false)} title="Record Payment">
        <form onSubmit={handleRecord}>
          <FormField label="Bank Reference">
            <input value={bankRef} onChange={(e) => setBankRef(e.target.value)} className={inputClass} placeholder="SWIFT/TT Reference" />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowRecord(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={recording} className={btnPrimary}>
              {recording ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
