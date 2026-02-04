import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const POLICIES_QUERY = gql`
  query InsurancePolicies($vesselId: String, $policyType: String, $status: String) {
    insurancePolicies(vesselId: $vesselId, policyType: $policyType, status: $status) {
      id vesselId policyType policyNumber insurer broker insuredValue deductible
      premiumAnnual currency inceptionDate expiryDate status coverageDetails notes
      vessel { name }
    }
    insuranceSummary {
      totalPolicies totalInsuredValue totalAnnualPremium
      byType { type count totalValue }
      expiringIn90Days
    }
    vessels { id name imo }
  }
`

const CREATE_POLICY = gql`
  mutation CreateInsurancePolicy(
    $vesselId: String!, $policyType: String!, $policyNumber: String!, $insurer: String!,
    $broker: String, $insuredValue: Float!, $deductible: Float, $premiumAnnual: Float!,
    $currency: String!, $inceptionDate: DateTime!, $expiryDate: DateTime!,
    $coverageDetails: String, $notes: String
  ) {
    createInsurancePolicy(
      vesselId: $vesselId, policyType: $policyType, policyNumber: $policyNumber, insurer: $insurer,
      broker: $broker, insuredValue: $insuredValue, deductible: $deductible, premiumAnnual: $premiumAnnual,
      currency: $currency, inceptionDate: $inceptionDate, expiryDate: $expiryDate,
      coverageDetails: $coverageDetails, notes: $notes
    ) { id }
  }
`

const RENEW_POLICY = gql`
  mutation RenewInsurancePolicy(
    $id: String!, $newInceptionDate: DateTime!, $newExpiryDate: DateTime!,
    $newPremiumAnnual: Float!, $newPolicyNumber: String
  ) {
    renewInsurancePolicy(
      id: $id, newInceptionDate: $newInceptionDate, newExpiryDate: $newExpiryDate,
      newPremiumAnnual: $newPremiumAnnual, newPolicyNumber: $newPolicyNumber
    ) { id }
  }
`

const policyTypes = [
  { value: 'hull_machinery', label: 'Hull & Machinery' },
  { value: 'p_and_i', label: 'P&I' },
  { value: 'cargo', label: 'Cargo' },
  { value: 'war_risk', label: 'War Risk' },
  { value: 'loss_of_hire', label: 'Loss of Hire' },
  { value: 'freight_demurrage', label: 'Freight & Demurrage' },
]

const policyTypeBadgeColors: Record<string, string> = {
  hull_machinery: 'bg-blue-900/50 text-blue-400',
  p_and_i: 'bg-purple-900/50 text-purple-400',
  cargo: 'bg-emerald-900/50 text-emerald-400',
  war_risk: 'bg-red-900/50 text-red-400',
  loss_of_hire: 'bg-orange-900/50 text-orange-400',
  freight_demurrage: 'bg-cyan-900/50 text-cyan-400',
}

const policyTypeBarColors: Record<string, string> = {
  hull_machinery: 'bg-blue-500',
  p_and_i: 'bg-purple-500',
  cargo: 'bg-emerald-500',
  war_risk: 'bg-red-500',
  loss_of_hire: 'bg-orange-500',
  freight_demurrage: 'bg-cyan-500',
}

const statusBadgeColors: Record<string, string> = {
  active: 'bg-green-900/50 text-green-400',
  expired: 'bg-red-900/50 text-red-400',
  pending_renewal: 'bg-yellow-900/50 text-yellow-400',
  cancelled: 'bg-gray-800 text-gray-400',
}

type Policy = {
  id: string
  vesselId: string
  policyType: string
  policyNumber: string
  insurer: string
  broker: string | null
  insuredValue: number
  deductible: number | null
  premiumAnnual: number
  currency: string
  inceptionDate: string
  expiryDate: string
  status: string
  coverageDetails: string | null
  notes: string | null
  vessel: { name: string }
}

type ByTypeItem = {
  type: string
  count: number
  totalValue: number
}

function fmtCurrency(n: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function fmtCompact(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function daysRemaining(expiryDate: string): number {
  const now = new Date()
  const exp = new Date(expiryDate)
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function daysRemainingBadge(expiryDate: string): string {
  const days = daysRemaining(expiryDate)
  if (days < 0) return 'text-red-400 font-bold'
  if (days <= 30) return 'text-red-400'
  if (days <= 90) return 'text-yellow-400'
  return 'text-green-400'
}

function fmtDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const emptyCreateForm = {
  vesselId: '', policyType: 'hull_machinery', policyNumber: '', insurer: '',
  broker: '', insuredValue: '', deductible: '', premiumAnnual: '', currency: 'USD',
  inceptionDate: '', expiryDate: '', coverageDetails: '', notes: '',
}

const emptyRenewForm = {
  newInceptionDate: '', newExpiryDate: '', newPremiumAnnual: '', newPolicyNumber: '',
}

export function InsurancePolicies() {
  const [filterVessel, setFilterVessel] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showRenew, setShowRenew] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [renewForm, setRenewForm] = useState(emptyRenewForm)

  const { data, loading, error, refetch } = useQuery(POLICIES_QUERY, {
    variables: {
      vesselId: filterVessel || undefined,
      policyType: filterType || undefined,
      status: filterStatus || undefined,
    },
  })

  const [createPolicy, { loading: creating }] = useMutation(CREATE_POLICY)
  const [renewPolicy, { loading: renewing }] = useMutation(RENEW_POLICY)

  const policies: Policy[] = data?.insurancePolicies ?? []
  const summary = data?.insuranceSummary
  const byType: ByTypeItem[] = summary?.byType ?? []
  const maxTypeValue = Math.max(...byType.map((t) => t.totalValue), 1)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createPolicy({
      variables: {
        vesselId: createForm.vesselId,
        policyType: createForm.policyType,
        policyNumber: createForm.policyNumber,
        insurer: createForm.insurer,
        broker: createForm.broker || null,
        insuredValue: Number(createForm.insuredValue),
        deductible: createForm.deductible ? Number(createForm.deductible) : null,
        premiumAnnual: Number(createForm.premiumAnnual),
        currency: createForm.currency,
        inceptionDate: new Date(createForm.inceptionDate).toISOString(),
        expiryDate: new Date(createForm.expiryDate).toISOString(),
        coverageDetails: createForm.coverageDetails || null,
        notes: createForm.notes || null,
      },
    })
    setCreateForm(emptyCreateForm)
    setShowCreate(false)
    refetch()
  }

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showRenew) return
    await renewPolicy({
      variables: {
        id: showRenew,
        newInceptionDate: new Date(renewForm.newInceptionDate).toISOString(),
        newExpiryDate: new Date(renewForm.newExpiryDate).toISOString(),
        newPremiumAnnual: Number(renewForm.newPremiumAnnual),
        newPolicyNumber: renewForm.newPolicyNumber || null,
      },
    })
    setRenewForm(emptyRenewForm)
    setShowRenew(null)
    refetch()
  }

  const setC = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCreateForm((f) => ({ ...f, [field]: e.target.value }))
  const setR = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRenewForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Insurance Policies</h1>
          <p className="text-maritime-400 text-sm mt-1">H&M, P&I, cargo, war risk, and other marine insurance</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ Add Policy</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Policies', value: summary?.totalPolicies ?? 0, display: String(summary?.totalPolicies ?? 0), color: 'text-white', border: 'border-blue-500' },
          { label: 'Active', value: 0, display: String(policies.filter((p) => p.status === 'active').length), color: 'text-green-400', border: 'border-green-500' },
          { label: 'Total Insured Value', value: 0, display: fmtCompact(summary?.totalInsuredValue ?? 0), color: 'text-cyan-400', border: 'border-cyan-500' },
          { label: 'Annual Premium', value: 0, display: fmtCompact(summary?.totalAnnualPremium ?? 0), color: 'text-orange-400', border: 'border-orange-500' },
        ].map((s) => (
          <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
            <p className="text-maritime-500 text-xs">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{loading ? '-' : s.display}</p>
          </div>
        ))}
      </div>

      {/* Summary by Type */}
      {byType.length > 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5 mb-6">
          <h3 className="text-white text-sm font-medium mb-4">Coverage Breakdown by Type</h3>
          <div className="space-y-3">
            {byType.map((item) => {
              const widthPct = Math.max((item.totalValue / maxTypeValue) * 100, 3)
              const typeLabel = policyTypes.find((t) => t.value === item.type)?.label ?? item.type.replace(/_/g, ' ')
              return (
                <div key={item.type} className="flex items-center gap-3">
                  <span className="text-maritime-400 text-xs w-36 text-right">{typeLabel}</span>
                  <div className="flex-1 bg-maritime-900 rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-5 rounded-full ${policyTypeBarColors[item.type] ?? 'bg-maritime-500'} flex items-center justify-end pr-2`}
                      style={{ width: `${widthPct}%`, minWidth: '60px' }}
                    >
                      <span className="text-[10px] text-white font-mono">{fmtCompact(item.totalValue)}</span>
                    </div>
                  </div>
                  <span className="text-maritime-500 text-xs w-16 text-right">{item.count} {item.count === 1 ? 'policy' : 'policies'}</span>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-maritime-700">
            {policyTypes.map((t) => (
              <div key={t.value} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${policyTypeBarColors[t.value] ?? 'bg-maritime-500'}`} />
                <span className="text-maritime-400 text-[10px]">{t.label}</span>
              </div>
            ))}
          </div>
          {summary?.expiringIn90Days > 0 && (
            <div className="mt-3 bg-yellow-900/20 border border-yellow-900/50 rounded-lg px-3 py-2">
              <span className="text-yellow-400 text-xs font-medium">{summary.expiringIn90Days} {summary.expiringIn90Days === 1 ? 'policy' : 'policies'} expiring within 90 days</span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterVessel} onChange={(e) => setFilterVessel(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded-md px-3 py-2">
          <option value="">All Vessels</option>
          {(data?.vessels ?? []).map((v: { id: string; name: string; imo: string }) => (
            <option key={v.id} value={v.id}>{v.name} ({v.imo})</option>
          ))}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded-md px-3 py-2">
          <option value="">All Types</option>
          {policyTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded-md px-3 py-2">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="pending_renewal">Pending Renewal</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading && <p className="text-maritime-400">Loading policies...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Table */}
      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-maritime-700 text-maritime-400 text-xs">
                  <th className="text-left px-4 py-3 font-medium">Vessel</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Policy #</th>
                  <th className="text-left px-4 py-3 font-medium">Insurer</th>
                  <th className="text-right px-4 py-3 font-medium">Insured Value</th>
                  <th className="text-right px-4 py-3 font-medium">Deductible</th>
                  <th className="text-right px-4 py-3 font-medium">Annual Premium</th>
                  <th className="text-left px-4 py-3 font-medium">Inception</th>
                  <th className="text-left px-4 py-3 font-medium">Expiry</th>
                  <th className="text-center px-4 py-3 font-medium">Days Left</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.length === 0 && (
                  <tr><td colSpan={12} className="text-center py-8 text-maritime-500">No policies found</td></tr>
                )}
                {policies.map((p) => {
                  const days = daysRemaining(p.expiryDate)
                  return (
                    <tr key={p.id} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                      <td className="px-4 py-3 text-white font-medium text-xs">{p.vessel.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${policyTypeBadgeColors[p.policyType] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {policyTypes.find((t) => t.value === p.policyType)?.label ?? p.policyType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-maritime-300 font-mono text-xs">{p.policyNumber}</td>
                      <td className="px-4 py-3 text-maritime-300 text-xs">{p.insurer}</td>
                      <td className="px-4 py-3 text-right text-white font-mono text-xs">{fmtCurrency(p.insuredValue, p.currency)}</td>
                      <td className="px-4 py-3 text-right text-maritime-400 font-mono text-xs">
                        {p.deductible ? fmtCurrency(p.deductible, p.currency) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-400 font-mono text-xs">{fmtCurrency(p.premiumAnnual, p.currency)}</td>
                      <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(p.inceptionDate)}</td>
                      <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(p.expiryDate)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-mono font-medium ${daysRemainingBadge(p.expiryDate)}`}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusBadgeColors[p.status] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {p.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setShowRenew(p.id); setRenewForm(emptyRenewForm) }}
                            className="text-blue-400 hover:text-blue-300 text-[10px] bg-blue-900/30 px-1.5 py-0.5 rounded"
                          >
                            Renew
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Policy Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Insurance Policy">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Vessel *">
              <select value={createForm.vesselId} onChange={setC('vesselId')} className={selectClass} required>
                <option value="">-- Select Vessel --</option>
                {(data?.vessels ?? []).map((v: { id: string; name: string; imo: string }) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.imo})</option>
                ))}
              </select>
            </FormField>
            <FormField label="Policy Type *">
              <select value={createForm.policyType} onChange={setC('policyType')} className={selectClass} required>
                {policyTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Policy Number *">
              <input value={createForm.policyNumber} onChange={setC('policyNumber')} className={inputClass} required placeholder="HM-2026-001" />
            </FormField>
            <FormField label="Insurer *">
              <input value={createForm.insurer} onChange={setC('insurer')} className={inputClass} required placeholder="Gard" />
            </FormField>
            <FormField label="Broker">
              <input value={createForm.broker} onChange={setC('broker')} className={inputClass} placeholder="Marsh" />
            </FormField>
            <FormField label="Currency *">
              <select value={createForm.currency} onChange={setC('currency')} className={selectClass} required>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </FormField>
            <FormField label="Insured Value *">
              <input type="number" step="0.01" value={createForm.insuredValue} onChange={setC('insuredValue')} className={inputClass} required placeholder="25000000" />
            </FormField>
            <FormField label="Deductible">
              <input type="number" step="0.01" value={createForm.deductible} onChange={setC('deductible')} className={inputClass} placeholder="150000" />
            </FormField>
            <FormField label="Annual Premium *">
              <input type="number" step="0.01" value={createForm.premiumAnnual} onChange={setC('premiumAnnual')} className={inputClass} required placeholder="125000" />
            </FormField>
            <div />
            <FormField label="Inception Date *">
              <input type="date" value={createForm.inceptionDate} onChange={setC('inceptionDate')} className={inputClass} required />
            </FormField>
            <FormField label="Expiry Date *">
              <input type="date" value={createForm.expiryDate} onChange={setC('expiryDate')} className={inputClass} required />
            </FormField>
          </div>
          <FormField label="Coverage Details">
            <textarea value={createForm.coverageDetails} onChange={setC('coverageDetails')} className={inputClass} rows={2} placeholder="Coverage specifics..." />
          </FormField>
          <FormField label="Notes">
            <textarea value={createForm.notes} onChange={setC('notes')} className={inputClass} rows={2} placeholder="Additional notes..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Add Policy'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Renew Policy Modal */}
      <Modal open={!!showRenew} onClose={() => setShowRenew(null)} title="Renew Insurance Policy">
        <form onSubmit={handleRenew}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="New Inception Date *">
              <input type="date" value={renewForm.newInceptionDate} onChange={setR('newInceptionDate')} className={inputClass} required />
            </FormField>
            <FormField label="New Expiry Date *">
              <input type="date" value={renewForm.newExpiryDate} onChange={setR('newExpiryDate')} className={inputClass} required />
            </FormField>
            <FormField label="New Annual Premium *">
              <input type="number" step="0.01" value={renewForm.newPremiumAnnual} onChange={setR('newPremiumAnnual')} className={inputClass} required placeholder="130000" />
            </FormField>
            <FormField label="New Policy Number">
              <input value={renewForm.newPolicyNumber} onChange={setR('newPolicyNumber')} className={inputClass} placeholder="Leave blank to keep existing" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowRenew(null)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={renewing} className={btnPrimary}>
              {renewing ? 'Renewing...' : 'Renew Policy'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
