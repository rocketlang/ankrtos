import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const CTM_LIST = gql`
  query CashToMasterList($voyageId: String) {
    cashToMasterList(voyageId: $voyageId) {
      id date vesselName port purpose currency amount amountUSD status remarks
      voyageId voyageNumber requestedBy approvedBy disbursedBy
      createdAt updatedAt
    }
  }
`

const CTM_SUMMARY = gql`
  query CashToMasterSummary($voyageId: String) {
    cashToMasterSummary(voyageId: $voyageId) {
      totalRequested totalApproved totalDisbursed totalSettled currency
    }
  }
`

const VOYAGES_QUERY = gql`
  query Voyages { voyages { id voyageNumber vessel { name } } }
`

const CREATE_CTM = gql`
  mutation CreateCashToMaster(
    $voyageId: String!, $port: String!, $purpose: String!,
    $currency: String!, $amount: Float!, $remarks: String
  ) {
    createCashToMaster(
      voyageId: $voyageId, port: $port, purpose: $purpose,
      currency: $currency, amount: $amount, remarks: $remarks
    ) { id }
  }
`

const APPROVE_CTM = gql`
  mutation ApproveCashToMaster($id: String!) {
    approveCashToMaster(id: $id) { id status }
  }
`

const DISBURSE_CTM = gql`
  mutation DisburseCashToMaster($id: String!) {
    disburseCashToMaster(id: $id) { id status }
  }
`

const SETTLE_CTM = gql`
  mutation SettleCashToMaster($id: String!) {
    settleCashToMaster(id: $id) { id status }
  }
`

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

const statusBadge: Record<string, string> = {
  requested: 'bg-yellow-900/50 text-yellow-400',
  approved: 'bg-blue-900/50 text-blue-400',
  disbursed: 'bg-purple-900/50 text-purple-400',
  settled: 'bg-green-900/50 text-green-400',
  rejected: 'bg-red-900/50 text-red-400',
}

const purposes = [
  'Port Charges', 'Crew Wages', 'Provisions', 'Repairs',
  'Canal Dues', 'Medical', 'Miscellaneous',
]

const currencies = ['USD', 'EUR', 'GBP', 'SGD', 'AED', 'INR', 'JPY', 'CNY']

const emptyForm = {
  voyageId: '', port: '', purpose: 'Port Charges',
  currency: 'USD', amount: '', remarks: '',
}

export function CashToMaster() {
  const [filterVoyage, setFilterVoyage] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const { data: listData, loading, refetch: refetchList } = useQuery(CTM_LIST, {
    variables: { voyageId: filterVoyage || undefined },
  })
  const { data: summaryData, refetch: refetchSummary } = useQuery(CTM_SUMMARY, {
    variables: { voyageId: filterVoyage || undefined },
  })
  const { data: voyageData } = useQuery(VOYAGES_QUERY)
  const [createCtm, { loading: creating }] = useMutation(CREATE_CTM)
  const [approveCtm] = useMutation(APPROVE_CTM)
  const [disburseCtm] = useMutation(DISBURSE_CTM)
  const [settleCtm] = useMutation(SETTLE_CTM)

  const refetchAll = () => { refetchList(); refetchSummary() }

  const voyages = voyageData?.voyages ?? []
  const summary = summaryData?.cashToMasterSummary
  const allItems = listData?.cashToMasterList ?? []
  const items = filterStatus
    ? allItems.filter((i: Record<string, unknown>) => i.status === filterStatus)
    : allItems

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.voyageId || !form.port || !form.amount) return
    await createCtm({
      variables: {
        ...form,
        amount: parseFloat(form.amount),
      },
    })
    setForm(emptyForm)
    setShowCreate(false)
    refetchAll()
  }

  const handleApprove = async (id: string) => {
    await approveCtm({ variables: { id } })
    refetchAll()
  }

  const handleDisburse = async (id: string) => {
    await disburseCtm({ variables: { id } })
    refetchAll()
  }

  const handleSettle = async (id: string) => {
    await settleCtm({ variables: { id } })
    refetchAll()
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cash to Master</h1>
          <p className="text-maritime-400 text-sm mt-1">CTM requests, approvals, disbursements & settlements</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>
          + New CTM Request
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Requested', value: fmt(summary.totalRequested), color: 'text-yellow-400', border: 'border-yellow-500' },
            { label: 'Approved', value: fmt(summary.totalApproved), color: 'text-blue-400', border: 'border-blue-500' },
            { label: 'Disbursed', value: fmt(summary.totalDisbursed), color: 'text-purple-400', border: 'border-purple-500' },
            { label: 'Settled', value: fmt(summary.totalSettled), color: 'text-green-400', border: 'border-green-500' },
          ].map((s) => (
            <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
              <p className="text-maritime-500 text-xs uppercase tracking-wide">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-maritime-600 text-[10px] mt-0.5">USD</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filterVoyage} onChange={(e) => setFilterVoyage(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Voyages</option>
          {voyages.map((v: Record<string, unknown>) => (
            <option key={v.id as string} value={v.id as string}>
              {v.voyageNumber as string} — {(v.vessel as Record<string, unknown>)?.name as string}
            </option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Statuses</option>
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="disbursed">Disbursed</option>
          <option value="settled">Settled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* CTM Table */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-maritime-400 text-xs border-b border-maritime-700">
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Vessel</th>
              <th className="text-left px-4 py-3">Port</th>
              <th className="text-left px-4 py-3">Purpose</th>
              <th className="text-center px-4 py-3">Currency</th>
              <th className="text-right px-4 py-3">Amount</th>
              <th className="text-right px-4 py-3">Amount USD</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="text-center py-8 text-maritime-500">Loading CTM records...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={9} className="text-center py-8 text-maritime-500">No CTM records found</td></tr>
            )}
            {items.map((item: Record<string, unknown>) => {
              const status = item.status as string
              return (
                <tr key={item.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                  <td className="px-4 py-3 text-maritime-300 text-xs">
                    {item.date ? new Date(item.date as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                  </td>
                  <td className="px-4 py-3 text-white text-xs font-medium">{item.vesselName as string}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs">{item.port as string}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs">{item.purpose as string}</td>
                  <td className="px-4 py-3 text-center text-maritime-400 text-xs font-mono">{item.currency as string}</td>
                  <td className="px-4 py-3 text-right text-white font-mono text-xs">
                    {(item.amount as number)?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-400 font-mono text-xs">
                    {fmt(item.amountUSD as number)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${statusBadge[status] ?? 'bg-maritime-700 text-maritime-300'}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      {status === 'requested' && (
                        <button onClick={() => handleApprove(item.id as string)}
                          className="text-blue-400 hover:text-blue-300 text-[10px] bg-blue-900/30 px-2 py-0.5 rounded">
                          Approve
                        </button>
                      )}
                      {status === 'approved' && (
                        <button onClick={() => handleDisburse(item.id as string)}
                          className="text-purple-400 hover:text-purple-300 text-[10px] bg-purple-900/30 px-2 py-0.5 rounded">
                          Disburse
                        </button>
                      )}
                      {status === 'disbursed' && (
                        <button onClick={() => handleSettle(item.id as string)}
                          className="text-green-400 hover:text-green-300 text-[10px] bg-green-900/30 px-2 py-0.5 rounded">
                          Settle
                        </button>
                      )}
                      {status === 'settled' && (
                        <span className="text-maritime-600 text-[10px]">Completed</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Create CTM Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New CTM Request">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Voyage *">
              <select value={form.voyageId} onChange={set('voyageId')} className={selectClass} required>
                <option value="">Select Voyage</option>
                {voyages.map((v: Record<string, unknown>) => (
                  <option key={v.id as string} value={v.id as string}>
                    {v.voyageNumber as string} — {(v.vessel as Record<string, unknown>)?.name as string}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Port *">
              <input value={form.port} onChange={set('port')} className={inputClass} required placeholder="Singapore" />
            </FormField>
            <FormField label="Purpose *">
              <select value={form.purpose} onChange={set('purpose')} className={selectClass} required>
                {purposes.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
            <FormField label="Currency *">
              <select value={form.currency} onChange={set('currency')} className={selectClass} required>
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Amount *">
              <input type="number" step="any" value={form.amount} onChange={set('amount')} className={inputClass} required placeholder="25000" />
            </FormField>
          </div>
          <FormField label="Remarks">
            <textarea value={form.remarks} onChange={set('remarks')} rows={3} className={inputClass} placeholder="Additional notes..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
