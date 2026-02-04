import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';

const SNP_TRANSACTIONS_QUERY = gql`
  query SNPTransactions($status: String) {
    snpTransactions(status: $status) {
      id purchasePrice currency moaDate moaRef moaTemplate
      depositAmount depositPercent depositDueDate depositPaidDate
      deliveryDate deliveryPort deliveryCondition status
      saleListing { id vessel { name imo type dwt } }
      buyerOrg { id name }
      sellerOrg { id name }
      commissions { id partyType commissionRate commissionAmount status }
      closingItems { id category item status }
      createdAt
    }
  }
`

const UPDATE_TX_STATUS = gql`
  mutation UpdateTxStatus($id: String!, $status: String!) {
    updateTransactionStatus(id: $id, status: $status) { id status }
  }
`

const RECORD_DEPOSIT = gql`
  mutation RecordDeposit($id: String!, $depositBankRef: String!) {
    recordDeposit(id: $id, depositBankRef: $depositBankRef) { id status }
  }
`

const pipelineSteps = [
  { key: 'moa_draft', label: 'MOA Draft' },
  { key: 'moa_signed', label: 'MOA Signed' },
  { key: 'deposit_paid', label: 'Deposit Paid' },
  { key: 'pre_closing', label: 'Pre-Closing' },
  { key: 'inspection', label: 'Inspection' },
  { key: 'closing', label: 'Closing' },
  { key: 'completed', label: 'Completed' },
]

const statusColors: Record<string, string> = {
  moa_draft: 'bg-gray-800/60 text-gray-400',
  moa_signed: 'bg-blue-900/50 text-blue-400',
  deposit_paid: 'bg-indigo-900/50 text-indigo-400',
  pre_closing: 'bg-yellow-900/50 text-yellow-400',
  inspection: 'bg-orange-900/50 text-orange-400',
  closing: 'bg-purple-900/50 text-purple-400',
  completed: 'bg-green-900/50 text-green-400',
  cancelled: 'bg-red-900/50 text-red-400',
}

const commissionStatusColors: Record<string, string> = {
  pending: 'text-gray-400',
  invoiced: 'text-amber-400',
  paid: 'text-green-400',
}

const nextAction: Record<string, { label: string; nextStatus: string }> = {
  moa_draft: { label: 'Sign MOA', nextStatus: 'moa_signed' },
  moa_signed: { label: 'Record Deposit', nextStatus: 'deposit_paid' },
  deposit_paid: { label: 'Start Pre-Closing', nextStatus: 'pre_closing' },
  pre_closing: { label: 'Schedule Inspection', nextStatus: 'inspection' },
  inspection: { label: 'Start Closing', nextStatus: 'closing' },
  closing: { label: 'Mark Complete', nextStatus: 'completed' },
}

export function SNPDealRoom() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [expandedTx, setExpandedTx] = useState<string | null>(null)
  const [depositRef, setDepositRef] = useState('')

  const { data, loading, error, refetch } = useQuery(SNP_TRANSACTIONS_QUERY, {
    variables: statusFilter ? { status: statusFilter } : {},
  })
  const [updateStatus] = useMutation(UPDATE_TX_STATUS)
  const [recordDeposit] = useMutation(RECORD_DEPOSIT)

  const transactions = data?.snpTransactions ?? []

  const handleAdvance = async (id: string, status: string, nextStatus: string) => {
    if (status === 'moa_signed') {
      if (!depositRef.trim()) {
        alert('Please enter deposit bank reference')
        return
      }
      await recordDeposit({ variables: { id, depositBankRef: depositRef } })
      setDepositRef('')
    } else {
      await updateStatus({ variables: { id, status: nextStatus } })
    }
    refetch()
  }

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)

  const getStepIndex = (status: string) => pipelineSteps.findIndex((s) => s.key === status)

  return (
    <div className="p-8 bg-maritime-900 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">S&amp;P Deal Room</h1>
          <p className="text-maritime-400 text-sm mt-1">Transaction management and closing progress</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {pipelineSteps.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Pipeline Visualization */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6 mb-6">
        <h3 className="text-white text-sm font-medium mb-4">Deal Pipeline</h3>
        <div className="flex items-center">
          {pipelineSteps.map((step, i) => {
            const count = transactions.filter((t: Record<string, unknown>) => t.status === step.key).length
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    count > 0 ? 'bg-blue-600 text-white' : 'bg-maritime-700 text-maritime-500'
                  }`}>
                    {count}
                  </div>
                  <p className="text-maritime-400 text-xs mt-2 text-center">{step.label}</p>
                </div>
                {i < pipelineSteps.length - 1 && (
                  <div className="w-8 h-px bg-maritime-600 flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading transactions...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Transaction Cards */}
      <div className="space-y-4">
        {transactions.map((tx: Record<string, unknown>) => {
          const status = tx.status as string
          const listing = tx.saleListing as Record<string, unknown> | null
          const vessel = listing?.vessel as Record<string, unknown> | null
          const buyer = tx.buyerOrg as Record<string, unknown> | null
          const seller = tx.sellerOrg as Record<string, unknown> | null
          const commissions = tx.commissions as Array<Record<string, unknown>> ?? []
          const closingItems = tx.closingItems as Array<Record<string, unknown>> ?? []
          const isExpanded = expandedTx === (tx.id as string)
          const stepIdx = getStepIndex(status)
          const action = nextAction[status]

          const completedItems = closingItems.filter((c) => c.status === 'completed').length
          const totalItems = closingItems.length
          const closingPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

          return (
            <div key={tx.id as string} className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
              {/* Status Step Bar */}
              <div className="flex bg-maritime-800/50 border-b border-maritime-700">
                {pipelineSteps.map((step, i) => (
                  <div
                    key={step.key}
                    className={`flex-1 py-2 text-center text-xs font-medium border-b-2 ${
                      i < stepIdx ? 'border-blue-500 text-blue-400 bg-blue-900/10' :
                      i === stepIdx ? 'border-blue-500 text-white bg-blue-900/20' :
                      'border-transparent text-maritime-600'
                    }`}
                  >
                    {step.label}
                  </div>
                ))}
              </div>

              {/* Main Content */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">{vessel?.name as string ?? 'Unknown Vessel'}</h3>
                      <span className="text-maritime-400 text-xs font-mono">IMO {vessel?.imo as string ?? '-'}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[status] ?? ''}`}>
                        {status?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-xs mt-3">
                      <div>
                        <p className="text-maritime-500">Purchase Price</p>
                        <p className="text-white font-bold text-base">
                          {formatPrice(tx.purchasePrice as number, tx.currency as string ?? 'USD')}
                        </p>
                      </div>
                      <div>
                        <p className="text-maritime-500">Buyer</p>
                        <p className="text-maritime-300">{buyer?.name as string ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-maritime-500">Seller</p>
                        <p className="text-maritime-300">{seller?.name as string ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-maritime-500">MOA Ref</p>
                        <p className="text-maritime-300 font-mono">{tx.moaRef as string ?? '-'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-xs mt-3">
                      <div>
                        <p className="text-maritime-500">Deposit</p>
                        <p className="text-maritime-300">
                          {tx.depositAmount ? formatPrice(tx.depositAmount as number, tx.currency as string ?? 'USD') : '-'}
                          {tx.depositPercent ? ` (${tx.depositPercent}%)` : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-maritime-500">Deposit Status</p>
                        <p className={tx.depositPaidDate ? 'text-green-400' : 'text-amber-400'}>
                          {tx.depositPaidDate ? 'Paid' : tx.depositDueDate ? `Due ${new Date(tx.depositDueDate as string).toLocaleDateString()}` : 'Pending'}
                        </p>
                      </div>
                      <div>
                        <p className="text-maritime-500">Delivery Date</p>
                        <p className="text-maritime-300">
                          {tx.deliveryDate ? new Date(tx.deliveryDate as string).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-maritime-500">Delivery Port</p>
                        <p className="text-maritime-300">{tx.deliveryPort as string ?? '-'}</p>
                      </div>
                    </div>

                    {/* Closing Progress */}
                    {totalItems > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-maritime-500">Closing Progress:</span>
                          <div className="flex-1 bg-maritime-700 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${closingPercent}%` }} />
                          </div>
                          <span className="text-maritime-400">{completedItems}/{totalItems} ({closingPercent}%)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {action && (
                      <>
                        {status === 'moa_signed' && (
                          <input
                            type="text"
                            placeholder="Bank ref..."
                            value={depositRef}
                            onChange={(e) => setDepositRef(e.target.value)}
                            className="bg-maritime-900 border border-maritime-600 rounded px-2 py-1 text-white text-xs w-32"
                          />
                        )}
                        <button
                          onClick={() => handleAdvance(tx.id as string, status, action.nextStatus)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs whitespace-nowrap"
                        >
                          {action.label}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setExpandedTx(isExpanded ? null : tx.id as string)}
                      className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 px-4 py-2 rounded text-xs"
                    >
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-maritime-700 grid grid-cols-2 gap-6">
                    {/* Commission Summary */}
                    <div>
                      <h4 className="text-white text-sm font-medium mb-3">Commissions</h4>
                      {commissions.length === 0 ? (
                        <p className="text-maritime-500 text-xs">No commissions recorded</p>
                      ) : (
                        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-maritime-700 text-maritime-400">
                                <th className="text-left px-3 py-2">Party</th>
                                <th className="text-right px-3 py-2">Rate</th>
                                <th className="text-right px-3 py-2">Amount</th>
                                <th className="text-center px-3 py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {commissions.map((c) => (
                                <tr key={c.id as string} className="border-b border-maritime-700/50">
                                  <td className="px-3 py-2 text-maritime-300 capitalize">{(c.partyType as string)?.replace('_', ' ')}</td>
                                  <td className="px-3 py-2 text-maritime-300 text-right">{c.commissionRate as number}%</td>
                                  <td className="px-3 py-2 text-white text-right font-medium">
                                    ${(c.commissionAmount as number)?.toLocaleString() ?? '-'}
                                  </td>
                                  <td className={`px-3 py-2 text-center capitalize ${commissionStatusColors[c.status as string] ?? 'text-gray-400'}`}>
                                    {c.status as string}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Closing Checklist by Category */}
                    <div>
                      <h4 className="text-white text-sm font-medium mb-3">Closing Checklist</h4>
                      {closingItems.length === 0 ? (
                        <p className="text-maritime-500 text-xs">No checklist items</p>
                      ) : (
                        <div className="space-y-2">
                          {Array.from(new Set(closingItems.map((c) => c.category as string))).map((cat) => {
                            const catItems = closingItems.filter((c) => c.category === cat)
                            const catDone = catItems.filter((c) => c.status === 'completed').length
                            const catPct = Math.round((catDone / catItems.length) * 100)
                            return (
                              <div key={cat} className="bg-maritime-700/30 rounded p-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-maritime-300 capitalize">{cat}</span>
                                  <span className="text-maritime-400">{catDone}/{catItems.length}</span>
                                </div>
                                <div className="bg-maritime-700 rounded-full h-1.5">
                                  <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${catPct}%` }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {transactions.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-maritime-500 text-sm">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  )
}
