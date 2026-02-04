import { useQuery, useMutation, gql } from '@apollo/client'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const DISPUTES_QUERY = gql`
  query BunkerQuantityDisputes($status: String) {
    bunkerQuantityDisputes(status: $status) {
      id vesselId voyageId portName fuelType deliveredQtyMt claimedQtyMt
      discrepancyMt discrepancyPct unitPrice disputeValueUsd supplierName
      status resolution creditAmount notes createdAt
      vessel { name }
    }
    bunkerDisputeSummary {
      totalOpen totalSettled totalDisputeValue avgDiscrepancyPct
    }
    vessels { id name }
  }
`

const FILE_DISPUTE = gql`
  mutation FileBunkerDispute(
    $vesselId: String!, $voyageId: String, $portName: String!, $fuelType: String!,
    $deliveredQtyMt: Float!, $claimedQtyMt: Float!, $unitPrice: Float!, $supplierName: String!
  ) {
    fileBunkerDispute(
      vesselId: $vesselId, voyageId: $voyageId, portName: $portName, fuelType: $fuelType,
      deliveredQtyMt: $deliveredQtyMt, claimedQtyMt: $claimedQtyMt, unitPrice: $unitPrice,
      supplierName: $supplierName
    ) { id }
  }
`

const UPDATE_DISPUTE = gql`
  mutation UpdateBunkerDispute($id: String!, $status: String!, $resolution: String, $creditAmount: Float, $notes: String) {
    updateBunkerDispute(id: $id, status: $status, resolution: $resolution, creditAmount: $creditAmount, notes: $notes) { id }
  }
`

const statusOptions = ['all', 'open', 'investigation', 'negotiation', 'settled', 'closed']

const statusBadge: Record<string, string> = {
  open: 'bg-red-900/50 text-red-400',
  investigation: 'bg-yellow-900/50 text-yellow-400',
  negotiation: 'bg-blue-900/50 text-blue-400',
  settled: 'bg-green-900/50 text-green-400',
  closed: 'bg-maritime-700 text-maritime-300',
}

const fuelTypeBadge: Record<string, string> = {
  HFO: 'bg-gray-800 text-gray-400',
  VLSFO: 'bg-blue-900/50 text-blue-400',
  MGO: 'bg-green-900/50 text-green-400',
  LNG: 'bg-purple-900/50 text-purple-400',
}

const fuelTypes = ['HFO', 'VLSFO', 'MGO', 'LNG']

const resolutionOptions = [
  { value: '', label: '-- Select --' },
  { value: 'credit_note', label: 'Credit Note' },
  { value: 'replacement', label: 'Replacement Delivery' },
  { value: 'price_adjustment', label: 'Price Adjustment' },
  { value: 'no_action', label: 'No Action (within tolerance)' },
  { value: 'arbitration', label: 'Referred to Arbitration' },
]

const disputeStatusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'investigation', label: 'Under Investigation' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'settled', label: 'Settled' },
  { value: 'closed', label: 'Closed' },
]

function fmtUsd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtQty(n: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n)
}

const emptyDisputeForm = {
  vesselId: '', voyageId: '', portName: '', fuelType: 'VLSFO',
  deliveredQtyMt: '', claimedQtyMt: '', unitPrice: '', supplierName: '',
}

const emptyUpdateForm = {
  status: 'investigation', resolution: '', creditAmount: '', notes: '',
}

export function BunkerDisputes() {
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFile, setShowFile] = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)
  const [updateId, setUpdateId] = useState<string | null>(null)
  const [disputeForm, setDisputeForm] = useState(emptyDisputeForm)
  const [updateForm, setUpdateForm] = useState(emptyUpdateForm)

  const { data, loading, error, refetch } = useQuery(DISPUTES_QUERY, {
    variables: {
      status: filterStatus !== 'all' ? filterStatus : undefined,
    },
  })

  const [fileDispute, { loading: filing }] = useMutation(FILE_DISPUTE)
  const [updateDispute, { loading: updating }] = useMutation(UPDATE_DISPUTE)

  const disputes = data?.bunkerQuantityDisputes ?? []
  const summary = data?.bunkerDisputeSummary
  const vessels = data?.vessels ?? []

  // Auto-calculated fields for the dispute form
  const calculated = useMemo(() => {
    const delivered = parseFloat(disputeForm.deliveredQtyMt) || 0
    const claimed = parseFloat(disputeForm.claimedQtyMt) || 0
    const price = parseFloat(disputeForm.unitPrice) || 0
    const discrepancyMt = delivered > 0 && claimed > 0 ? delivered - claimed : 0
    const discrepancyPct = claimed > 0 ? ((discrepancyMt / claimed) * 100) : 0
    const disputeValue = Math.abs(discrepancyMt) * price
    return { discrepancyMt, discrepancyPct, disputeValue }
  }, [disputeForm.deliveredQtyMt, disputeForm.claimedQtyMt, disputeForm.unitPrice])

  const handleFileDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    await fileDispute({
      variables: {
        vesselId: disputeForm.vesselId,
        voyageId: disputeForm.voyageId || null,
        portName: disputeForm.portName,
        fuelType: disputeForm.fuelType,
        deliveredQtyMt: Number(disputeForm.deliveredQtyMt),
        claimedQtyMt: Number(disputeForm.claimedQtyMt),
        unitPrice: Number(disputeForm.unitPrice),
        supplierName: disputeForm.supplierName,
      },
    })
    setDisputeForm(emptyDisputeForm)
    setShowFile(false)
    refetch()
  }

  const openUpdate = (id: string, currentStatus: string) => {
    setUpdateId(id)
    setUpdateForm({ ...emptyUpdateForm, status: currentStatus })
    setShowUpdate(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!updateId) return
    await updateDispute({
      variables: {
        id: updateId,
        status: updateForm.status,
        resolution: updateForm.resolution || null,
        creditAmount: updateForm.creditAmount ? Number(updateForm.creditAmount) : null,
        notes: updateForm.notes || null,
      },
    })
    setShowUpdate(false)
    setUpdateId(null)
    refetch()
  }

  const setD = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDisputeForm((f) => ({ ...f, [field]: e.target.value }))

  const setU = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setUpdateForm((f) => ({ ...f, [field]: e.target.value }))

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bunker Quantity Disputes</h1>
          <p className="text-maritime-400 text-sm mt-1">Track and resolve fuel delivery discrepancies</p>
        </div>
        <button onClick={() => setShowFile(true)} className={btnPrimary}>+ File Dispute</button>
      </div>

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Open', value: summary.totalOpen, color: 'text-red-400', border: 'border-red-500' },
            { label: 'Investigation', value: (disputes as Array<Record<string, unknown>>).filter((d) => d.status === 'investigation').length, color: 'text-yellow-400', border: 'border-yellow-500' },
            { label: 'Settled', value: summary.totalSettled, color: 'text-green-400', border: 'border-green-500' },
            { label: 'Total Dispute Value', value: fmtUsd(summary.totalDisputeValue ?? 0), color: 'text-orange-400', border: 'border-orange-500' },
          ].map((s) => (
            <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
              <p className="text-maritime-500 text-xs">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-sm px-3 py-1.5 rounded capitalize ${
              filterStatus === s
                ? 'bg-blue-600 text-white'
                : 'bg-maritime-800 text-maritime-400 hover:text-white border border-maritime-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && <p className="text-maritime-400">Loading disputes...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Table */}
      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-maritime-700 text-maritime-400">
                  <th className="text-left px-4 py-3 font-medium">Vessel</th>
                  <th className="text-left px-4 py-3 font-medium">Port</th>
                  <th className="text-left px-4 py-3 font-medium">Fuel</th>
                  <th className="text-right px-4 py-3 font-medium">Delivered (MT)</th>
                  <th className="text-right px-4 py-3 font-medium">Claimed (MT)</th>
                  <th className="text-right px-4 py-3 font-medium">Discrepancy</th>
                  <th className="text-right px-4 py-3 font-medium">Value (USD)</th>
                  <th className="text-left px-4 py-3 font-medium">Supplier</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Resolution</th>
                  <th className="text-center px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(disputes as Array<Record<string, unknown>>).map((d) => {
                  const vessel = d.vessel as Record<string, unknown> | null
                  const pct = d.discrepancyPct as number
                  const isHighDiscrepancy = Math.abs(pct) > 1
                  return (
                    <tr key={d.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                      <td className="px-4 py-3 text-white text-xs font-medium">
                        {vessel?.name as string ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-maritime-300 text-xs">{d.portName as string}</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${fuelTypeBadge[d.fuelType as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {d.fuelType as string}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">
                        {fmtQty(d.deliveredQtyMt as number)}
                      </td>
                      <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">
                        {fmtQty(d.claimedQtyMt as number)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        <span className={isHighDiscrepancy ? 'text-red-400 font-bold' : 'text-yellow-400'}>
                          {fmtQty(d.discrepancyMt as number)} MT
                        </span>
                        <span className={`ml-1 text-[10px] ${isHighDiscrepancy ? 'text-red-400' : 'text-maritime-500'}`}>
                          ({(d.discrepancyPct as number)?.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-orange-400 font-mono text-xs font-semibold">
                        {fmtUsd(d.disputeValueUsd as number)}
                      </td>
                      <td className="px-4 py-3 text-maritime-300 text-xs">{d.supplierName as string}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusBadge[d.status as string] ?? ''}`}>
                          {(d.status as string).replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-maritime-400 text-xs capitalize">
                        {d.resolution ? (d.resolution as string).replace(/_/g, ' ') : '-'}
                        {d.creditAmount ? (
                          <span className="block text-green-400 font-mono text-[10px]">
                            Credit: {fmtUsd(d.creditAmount as number)}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(d.status as string) !== 'closed' && (
                          <button
                            onClick={() => openUpdate(d.id as string, d.status as string)}
                            className="text-blue-400 hover:text-blue-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded"
                          >
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {disputes.length === 0 && (
              <p className="text-maritime-500 text-center py-8">No disputes found</p>
            )}
          </div>
        </div>
      )}

      {/* File Dispute Modal */}
      <Modal open={showFile} onClose={() => setShowFile(false)} title="File Bunker Dispute">
        <form onSubmit={handleFileDispute}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Vessel *">
              <select value={disputeForm.vesselId} onChange={setD('vesselId')} className={selectClass} required>
                <option value="">-- Select Vessel --</option>
                {(vessels as Array<Record<string, unknown>>).map((v) => (
                  <option key={v.id as string} value={v.id as string}>{v.name as string}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Voyage Ref (optional)">
              <input value={disputeForm.voyageId} onChange={setD('voyageId')} className={inputClass} placeholder="V-2026-001" />
            </FormField>
            <FormField label="Port Name *">
              <input value={disputeForm.portName} onChange={setD('portName')} className={inputClass} required placeholder="Singapore" />
            </FormField>
            <FormField label="Fuel Type *">
              <select value={disputeForm.fuelType} onChange={setD('fuelType')} className={selectClass} required>
                {fuelTypes.map((ft) => (
                  <option key={ft} value={ft}>{ft}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Delivered Qty (MT) *">
              <input type="number" step="any" value={disputeForm.deliveredQtyMt} onChange={setD('deliveredQtyMt')} className={inputClass} required placeholder="500.00" />
            </FormField>
            <FormField label="Claimed Qty (MT) *">
              <input type="number" step="any" value={disputeForm.claimedQtyMt} onChange={setD('claimedQtyMt')} className={inputClass} required placeholder="490.00" />
            </FormField>
            <FormField label="Unit Price ($/MT) *">
              <input type="number" step="any" value={disputeForm.unitPrice} onChange={setD('unitPrice')} className={inputClass} required placeholder="620.50" />
            </FormField>
            <FormField label="Supplier Name *">
              <input value={disputeForm.supplierName} onChange={setD('supplierName')} className={inputClass} required placeholder="Peninsula Petroleum" />
            </FormField>
          </div>

          {/* Auto-calculated preview */}
          {(calculated.discrepancyMt !== 0) && (
            <div className="bg-maritime-900/50 border border-maritime-700 rounded-lg p-3 mt-4">
              <p className="text-maritime-400 text-[10px] font-medium mb-2">CALCULATED VALUES</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-maritime-500 text-[10px]">Discrepancy</p>
                  <p className={`text-sm font-bold ${Math.abs(calculated.discrepancyPct) > 1 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {fmtQty(calculated.discrepancyMt)} MT
                  </p>
                </div>
                <div>
                  <p className="text-maritime-500 text-[10px]">Discrepancy %</p>
                  <p className={`text-sm font-bold ${Math.abs(calculated.discrepancyPct) > 1 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {calculated.discrepancyPct.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-maritime-500 text-[10px]">Dispute Value</p>
                  <p className="text-sm font-bold text-orange-400">{fmtUsd(calculated.disputeValue)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowFile(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={filing} className={btnPrimary}>
              {filing ? 'Filing...' : 'File Dispute'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal open={showUpdate} onClose={() => { setShowUpdate(false); setUpdateId(null) }} title="Update Dispute Status">
        <form onSubmit={handleUpdate}>
          <FormField label="Status *">
            <select value={updateForm.status} onChange={setU('status')} className={selectClass} required>
              {disputeStatusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Resolution">
            <select value={updateForm.resolution} onChange={setU('resolution')} className={selectClass}>
              {resolutionOptions.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Credit Amount ($)">
            <input type="number" step="any" value={updateForm.creditAmount} onChange={setU('creditAmount')} className={inputClass} placeholder="0.00" />
          </FormField>
          <FormField label="Notes">
            <textarea
              value={updateForm.notes}
              onChange={setU('notes')}
              className={`${inputClass} h-20 resize-none`}
              placeholder="Investigation findings, settlement details..."
            />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => { setShowUpdate(false); setUpdateId(null) }} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={updating} className={btnPrimary}>
              {updating ? 'Updating...' : 'Update Dispute'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
