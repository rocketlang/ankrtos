import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const LCS_QUERY = gql`
  query LettersOfCredit($status: String) {
    lettersOfCredit(status: $status) {
      id reference type amount currency issuingBank advisingBank
      beneficiary applicant issueDate expiryDate latestShipment
      portOfLoading portOfDischarge cargoDescription incoterms
      paymentTerms tolerancePercent partialShipment transhipment status
      documents { id documentType required status discrepancy }
      amendments { id amendmentNumber description status }
      drawings { id drawingNumber amount status }
      voyage { id voyageNumber }
      createdAt
    }
  }
`

const CREATE_LC = gql`
  mutation CreateLC(
    $reference: String!, $type: String!, $amount: Float!, $currency: String!,
    $issuingBank: String!, $beneficiary: String!, $expiryDate: String!,
    $incoterms: String, $paymentTerms: String
  ) {
    createLetterOfCredit(
      reference: $reference, type: $type, amount: $amount, currency: $currency,
      issuingBank: $issuingBank, beneficiary: $beneficiary, expiryDate: $expiryDate,
      incoterms: $incoterms, paymentTerms: $paymentTerms
    ) { id }
  }
`

const UPDATE_LC_STATUS = gql`
  mutation UpdateLCStatus($id: String!, $status: String!) {
    updateLCStatus(id: $id, status: $status) { id status }
  }
`

const ADD_LC_DOC = gql`
  mutation AddLCDoc($lcId: String!, $documentType: String!, $required: Boolean!) {
    addLCDocument(lcId: $lcId, documentType: $documentType, required: $required) { id }
  }
`

const statusColors: Record<string, string> = {
  draft: 'bg-maritime-700 text-maritime-300',
  issued: 'bg-blue-900/50 text-blue-400',
  advised: 'bg-indigo-900/50 text-indigo-400',
  confirmed: 'bg-green-900/50 text-green-400',
  drawing_submitted: 'bg-amber-900/50 text-amber-400',
  discrepant: 'bg-red-900/50 text-red-400',
  paid: 'bg-emerald-900/50 text-emerald-400',
  expired: 'bg-slate-700 text-slate-400',
}

const typeColors: Record<string, string> = {
  irrevocable: 'bg-blue-900/50 text-blue-400',
  confirmed: 'bg-green-900/50 text-green-400',
  standby: 'bg-purple-900/50 text-purple-400',
  transferable: 'bg-amber-900/50 text-amber-400',
}

const docStatusIcons: Record<string, string> = {
  received: '\u2705',
  pending: '\u23F3',
  rejected: '\u274C',
  discrepant: '\u26A0\uFE0F',
}

const statusTabs = ['All', 'Draft', 'Issued', 'Confirmed', 'Drawing', 'Paid', 'Expired']
const lcTypes = ['irrevocable', 'confirmed', 'standby', 'transferable']
const incotermsOptions = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP']
const paymentTermsOptions = ['at_sight', 'deferred_30', 'deferred_60', 'deferred_90', 'usance_30', 'usance_60', 'usance_90', 'acceptance']

const emptyForm = {
  reference: '', type: 'irrevocable', amount: '', currency: 'USD',
  issuingBank: '', beneficiary: '', expiryDate: '', incoterms: 'FOB', paymentTerms: 'at_sight',
}

export function LetterOfCreditPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const { data, loading, error, refetch } = useQuery(LCS_QUERY, {
    variables: { status: statusFilter || undefined },
  })
  const [createLC, { loading: creating }] = useMutation(CREATE_LC)
  const [updateStatus] = useMutation(UPDATE_LC_STATUS)

  const lcs = data?.lettersOfCredit ?? []

  const fmtMoney = (amt: number, ccy = 'USD') =>
    `${ccy} ${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

  const daysToExpiry = (d: string | null) => {
    if (!d) return null
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const setF = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createLC({
      variables: {
        reference: form.reference, type: form.type,
        amount: parseFloat(form.amount), currency: form.currency,
        issuingBank: form.issuingBank, beneficiary: form.beneficiary,
        expiryDate: form.expiryDate, incoterms: form.incoterms,
        paymentTerms: form.paymentTerms,
      },
    })
    setForm(emptyForm)
    setShowCreate(false)
    refetch()
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    await updateStatus({ variables: { id, status } })
    refetch()
  }

  // Summary stats
  const totalLCs = lcs.length
  const activeAmount = lcs
    .filter((lc: Record<string, unknown>) => !['expired', 'paid'].includes(lc.status as string))
    .reduce((sum: number, lc: Record<string, unknown>) => sum + (lc.amount as number), 0)
  const expiringIn30 = lcs.filter((lc: Record<string, unknown>) => {
    const days = daysToExpiry(lc.expiryDate as string)
    return days !== null && days > 0 && days <= 30 && !['expired', 'paid'].includes(lc.status as string)
  }).length
  const discrepantCount = lcs.filter((lc: Record<string, unknown>) => lc.status === 'discrepant').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Letters of Credit</h1>
          <p className="text-maritime-400 text-sm mt-1">Documentary credit management and compliance tracking</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New L/C</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs mb-1">Total LCs</p>
          <p className="text-white text-xl font-bold">{totalLCs}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs mb-1">Active Amount</p>
          <p className="text-white text-xl font-bold">{fmtMoney(activeAmount)}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs mb-1">Expiring in 30 Days</p>
          <p className={`text-xl font-bold ${expiringIn30 > 0 ? 'text-amber-400' : 'text-white'}`}>{expiringIn30}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs mb-1">Discrepant</p>
          <p className={`text-xl font-bold ${discrepantCount > 0 ? 'text-red-400' : 'text-white'}`}>{discrepantCount}</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 mb-4 border-b border-maritime-700 pb-2">
        {statusTabs.map((tab) => {
          const val = tab === 'All' ? '' : tab === 'Drawing' ? 'drawing_submitted' : tab.toLowerCase()
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

      {loading && <p className="text-maritime-400">Loading...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && (
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-left border-b border-maritime-700">
                <th className="px-4 py-3 font-medium w-8"></th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Issuing Bank</th>
                <th className="px-4 py-3 font-medium">Beneficiary</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Days Left</th>
                <th className="px-4 py-3 font-medium">Docs</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {lcs.map((lc: Record<string, unknown>) => {
                const days = daysToExpiry(lc.expiryDate as string)
                const docs = (lc.documents as Record<string, unknown>[]) ?? []
                const compliantDocs = docs.filter((d) => d.status === 'received').length
                const isExpanded = expandedId === (lc.id as string)
                const amendments = (lc.amendments as Record<string, unknown>[]) ?? []
                const drawings = (lc.drawings as Record<string, unknown>[]) ?? []

                return (
                  <>
                    <tr
                      key={lc.id as string}
                      className="border-b border-maritime-700/50 hover:bg-maritime-700/30 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : (lc.id as string))}
                    >
                      <td className="px-4 py-3 text-maritime-500 text-xs">{isExpanded ? '\u25BC' : '\u25B6'}</td>
                      <td className="px-4 py-3 text-white font-mono text-xs">{lc.reference as string}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[lc.type as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {(lc.type as string).replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white font-medium text-xs">{fmtMoney(lc.amount as number, lc.currency as string)}</td>
                      <td className="px-4 py-3 text-maritime-300 text-xs">{lc.issuingBank as string}</td>
                      <td className="px-4 py-3 text-maritime-300 text-xs">{lc.beneficiary as string}</td>
                      <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(lc.expiryDate as string)}</td>
                      <td className="px-4 py-3 text-xs">
                        {days !== null ? (
                          <span className={days <= 0 ? 'text-slate-500' : days <= 30 ? 'text-red-400 font-bold' : 'text-maritime-300'}>
                            {days <= 0 ? 'Expired' : `${days}d`}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-maritime-300">
                        {compliantDocs}/{docs.length}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[lc.status as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {(lc.status as string).replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${lc.id}-detail`} className="border-b border-maritime-700/50">
                        <td colSpan={10} className="px-6 py-4 bg-maritime-900/50">
                          <div className="grid grid-cols-3 gap-6">
                            {/* LC Details */}
                            <div>
                              <h4 className="text-white text-xs font-semibold mb-2">L/C Details</h4>
                              <div className="space-y-1 text-xs">
                                <p className="text-maritime-400">Applicant: <span className="text-maritime-300">{(lc.applicant as string) || '-'}</span></p>
                                <p className="text-maritime-400">Advising Bank: <span className="text-maritime-300">{(lc.advisingBank as string) || '-'}</span></p>
                                <p className="text-maritime-400">POL: <span className="text-maritime-300">{(lc.portOfLoading as string) || '-'}</span></p>
                                <p className="text-maritime-400">POD: <span className="text-maritime-300">{(lc.portOfDischarge as string) || '-'}</span></p>
                                <p className="text-maritime-400">Incoterms: <span className="text-maritime-300">{(lc.incoterms as string) || '-'}</span></p>
                                <p className="text-maritime-400">Payment: <span className="text-maritime-300">{(lc.paymentTerms as string)?.replace(/_/g, ' ') || '-'}</span></p>
                                <p className="text-maritime-400">Tolerance: <span className="text-maritime-300">{lc.tolerancePercent ? `\u00B1${lc.tolerancePercent}%` : '-'}</span></p>
                                <p className="text-maritime-400">Partial: <span className="text-maritime-300">{lc.partialShipment ? 'Allowed' : 'Not Allowed'}</span></p>
                                <p className="text-maritime-400">Transhipment: <span className="text-maritime-300">{lc.transhipment ? 'Allowed' : 'Not Allowed'}</span></p>
                                {lc.voyage && (
                                  <p className="text-maritime-400">Voyage: <span className="text-blue-400">{(lc.voyage as Record<string, unknown>).voyageNumber as string}</span></p>
                                )}
                              </div>
                              <div className="flex gap-2 mt-3">
                                {lc.status === 'draft' && (
                                  <button onClick={() => handleStatusUpdate(lc.id as string, 'issued')} className="text-blue-400 hover:text-blue-300 text-xs font-medium">Issue</button>
                                )}
                                {lc.status === 'issued' && (
                                  <button onClick={() => handleStatusUpdate(lc.id as string, 'confirmed')} className="text-green-400 hover:text-green-300 text-xs font-medium">Confirm</button>
                                )}
                              </div>
                            </div>

                            {/* Document Checklist */}
                            <div>
                              <h4 className="text-white text-xs font-semibold mb-2">Document Checklist</h4>
                              {docs.length === 0 ? (
                                <p className="text-maritime-500 text-xs">No documents attached</p>
                              ) : (
                                <div className="space-y-1">
                                  {docs.map((doc: Record<string, unknown>) => (
                                    <div key={doc.id as string} className="flex items-center gap-2 text-xs">
                                      <span>{docStatusIcons[doc.status as string] ?? '\u2B55'}</span>
                                      <span className="text-maritime-300">{(doc.documentType as string).replace(/_/g, ' ')}</span>
                                      {doc.required && <span className="text-red-400 text-[10px]">*</span>}
                                      {doc.discrepancy && (
                                        <span className="text-red-400 text-[10px] ml-1">({doc.discrepancy as string})</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Amendments & Drawings */}
                            <div>
                              <h4 className="text-white text-xs font-semibold mb-2">Amendments</h4>
                              {amendments.length === 0 ? (
                                <p className="text-maritime-500 text-xs mb-3">No amendments</p>
                              ) : (
                                <div className="space-y-1 mb-3">
                                  {amendments.map((a: Record<string, unknown>) => (
                                    <div key={a.id as string} className="flex items-center gap-2 text-xs">
                                      <span className="text-maritime-500">#{a.amendmentNumber as number}</span>
                                      <span className="text-maritime-300 flex-1 truncate">{a.description as string}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        a.status === 'accepted' ? 'bg-green-900/50 text-green-400'
                                        : a.status === 'rejected' ? 'bg-red-900/50 text-red-400'
                                        : 'bg-amber-900/50 text-amber-400'
                                      }`}>{a.status as string}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <h4 className="text-white text-xs font-semibold mb-2">Drawings</h4>
                              {drawings.length === 0 ? (
                                <p className="text-maritime-500 text-xs">No drawings</p>
                              ) : (
                                <div className="space-y-1">
                                  {drawings.map((d: Record<string, unknown>) => (
                                    <div key={d.id as string} className="flex items-center gap-2 text-xs">
                                      <span className="text-maritime-500">#{d.drawingNumber as number}</span>
                                      <span className="text-white font-medium">{fmtMoney(d.amount as number, lc.currency as string)}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        d.status === 'paid' ? 'bg-green-900/50 text-green-400'
                                        : d.status === 'rejected' ? 'bg-red-900/50 text-red-400'
                                        : 'bg-blue-900/50 text-blue-400'
                                      }`}>{d.status as string}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
              {lcs.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-maritime-500">No letters of credit found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create LC Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Letter of Credit">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Reference *">
              <input value={form.reference} onChange={setF('reference')} className={inputClass} required placeholder="LC-2026-001" />
            </FormField>
            <FormField label="Type *">
              <select value={form.type} onChange={setF('type')} className={selectClass} required>
                {lcTypes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
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
          <FormField label="Issuing Bank *">
            <input value={form.issuingBank} onChange={setF('issuingBank')} className={inputClass} required placeholder="HSBC, London" />
          </FormField>
          <FormField label="Beneficiary *">
            <input value={form.beneficiary} onChange={setF('beneficiary')} className={inputClass} required placeholder="Seller / Charterer name" />
          </FormField>
          <FormField label="Expiry Date *">
            <input type="date" value={form.expiryDate} onChange={setF('expiryDate')} className={inputClass} required />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Incoterms">
              <select value={form.incoterms} onChange={setF('incoterms')} className={selectClass}>
                {incotermsOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Payment Terms">
              <select value={form.paymentTerms} onChange={setF('paymentTerms')} className={selectClass}>
                {paymentTermsOptions.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create L/C'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
