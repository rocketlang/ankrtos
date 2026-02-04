import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const EXPIRY_ALERTS_QUERY = gql`
  query ExpiryAlerts {
    expiryAlerts(status: "active") {
      id entityType entityId entityName vesselId expiryDate status lastAlertSent notes
    }
  }
`

const EXPIRY_SUMMARY_QUERY = gql`
  query ExpiryAlertSummary {
    expiryAlertSummary {
      totalActive expiredCount expiringIn30 expiringIn60 expiringIn90
    }
  }
`

const CREATE_EXPIRY_ALERT = gql`
  mutation CreateExpiryAlert(
    $entityType: String!, $entityId: String!, $entityName: String!,
    $vesselId: String, $expiryDate: DateTime!, $notes: String
  ) {
    createExpiryAlert(
      entityType: $entityType, entityId: $entityId, entityName: $entityName,
      vesselId: $vesselId, expiryDate: $expiryDate, notes: $notes
    ) { id }
  }
`

const RENEW_EXPIRY_ALERT = gql`
  mutation RenewExpiryAlert($id: String!, $renewedDate: DateTime!) {
    renewExpiryAlert(id: $id, renewedDate: $renewedDate) { id }
  }
`

const DISMISS_EXPIRY_ALERT = gql`
  mutation DismissExpiryAlert($id: String!) {
    dismissExpiryAlert(id: $id) { id }
  }
`

const entityTypeOptions = [
  { value: 'vessel_certificate', label: 'Vessel Certificate' },
  { value: 'crew_certificate', label: 'Crew Certificate' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'class_survey', label: 'Class Survey' },
  { value: 'p_and_i', label: 'P&I' },
]

const entityTypeBadge: Record<string, string> = {
  vessel_certificate: 'bg-blue-900/50 text-blue-400',
  crew_certificate: 'bg-purple-900/50 text-purple-400',
  insurance: 'bg-green-900/50 text-green-400',
  class_survey: 'bg-teal-900/50 text-teal-400',
  p_and_i: 'bg-indigo-900/50 text-indigo-400',
}

const emptyForm = {
  entityType: 'vessel_certificate', entityId: '', entityName: '', vesselId: '', expiryDate: '', notes: '',
}

function getDaysRemaining(expiryDate: string): number {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diffMs = expiry.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function getDaysColor(days: number): string {
  if (days < 0) return 'text-red-400'
  if (days <= 30) return 'text-red-400'
  if (days <= 90) return 'text-yellow-400'
  return 'text-green-400'
}

function getDaysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return 'Expires today'
  return `${days} days`
}

export function ExpiryTracker() {
  const { data, loading, error, refetch } = useQuery(EXPIRY_ALERTS_QUERY)
  const { data: summaryData } = useQuery(EXPIRY_SUMMARY_QUERY)
  const [createExpiryAlert, { loading: creating }] = useMutation(CREATE_EXPIRY_ALERT)
  const [renewExpiryAlert] = useMutation(RENEW_EXPIRY_ALERT)
  const [dismissExpiryAlert] = useMutation(DISMISS_EXPIRY_ALERT)

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [filterType, setFilterType] = useState('all')
  const [renewId, setRenewId] = useState<string | null>(null)
  const [renewDate, setRenewDate] = useState('')

  const alerts = data?.expiryAlerts ?? []
  const summary = summaryData?.expiryAlertSummary

  const filteredAlerts = filterType === 'all'
    ? alerts
    : (alerts as Array<Record<string, unknown>>).filter((a) => a.entityType === filterType)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createExpiryAlert({
      variables: {
        entityType: form.entityType,
        entityId: form.entityId,
        entityName: form.entityName,
        vesselId: form.vesselId || null,
        expiryDate: new Date(form.expiryDate).toISOString(),
        notes: form.notes || null,
      },
    })
    setForm(emptyForm)
    setShowCreate(false)
    refetch()
  }

  const handleRenew = async (id: string) => {
    if (!renewDate) return
    await renewExpiryAlert({ variables: { id, renewedDate: new Date(renewDate).toISOString() } })
    setRenewId(null)
    setRenewDate('')
    refetch()
  }

  const handleDismiss = async (id: string) => {
    if (!confirm('Dismiss this expiry alert?')) return
    await dismissExpiryAlert({ variables: { id } })
    refetch()
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Expiry Tracker</h1>
          <p className="text-maritime-400 text-sm mt-1">Track certificate, insurance and compliance expiry dates</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ Add Alert</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Active', value: summary?.totalActive ?? 0, color: 'text-white' },
          { label: 'Expired', value: summary?.expiredCount ?? 0, color: 'text-red-400' },
          { label: 'Expiring in 30d', value: summary?.expiringIn30 ?? 0, color: 'text-red-400' },
          { label: 'Expiring in 90d', value: summary?.expiringIn90 ?? 0, color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <p className="text-maritime-400 text-xs font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-maritime-800 text-maritime-400 hover:text-maritime-300 border border-maritime-700'
          }`}>
          All
        </button>
        {entityTypeOptions.map((opt) => (
          <button key={opt.value} onClick={() => setFilterType(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType === opt.value ? 'bg-blue-600 text-white' : 'bg-maritime-800 text-maritime-400 hover:text-maritime-300 border border-maritime-700'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-maritime-400">Loading expiry alerts...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Table */}
      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Entity Name</th>
                <th className="text-center px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Vessel</th>
                <th className="text-left px-4 py-3 font-medium">Expiry Date</th>
                <th className="text-center px-4 py-3 font-medium">Days Remaining</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Last Alert</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(filteredAlerts as Array<Record<string, unknown>>).map((a) => {
                const days = getDaysRemaining(a.expiryDate as string)
                const daysColor = getDaysColor(days)
                const daysLabel = getDaysLabel(days)
                return (
                  <tr key={a.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="px-4 py-3 text-white font-medium">{a.entityName as string}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        entityTypeBadge[a.entityType as string] ?? 'bg-maritime-700 text-maritime-300'
                      }`}>
                        {entityTypeOptions.find((o) => o.value === a.entityType)?.label ?? (a.entityType as string)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-maritime-300">{(a.vesselId as string) || '-'}</td>
                    <td className="px-4 py-3 text-maritime-300">{new Date(a.expiryDate as string).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium text-xs ${daysColor}`}>{daysLabel}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        a.status === 'active' ? 'bg-green-900/50 text-green-400'
                        : a.status === 'expired' ? 'bg-red-900/50 text-red-400'
                        : 'bg-maritime-700 text-maritime-300'
                      }`}>
                        {a.status as string}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">
                      {a.lastAlertSent ? new Date(a.lastAlertSent as string).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renewId === (a.id as string) ? (
                        <div className="flex items-center gap-2">
                          <input type="date" value={renewDate} onChange={(e) => setRenewDate(e.target.value)}
                            className="bg-maritime-900 border border-maritime-600 rounded px-2 py-1 text-white text-xs" />
                          <button onClick={() => handleRenew(a.id as string)}
                            className="text-green-400 hover:text-green-300 text-xs font-medium">Save</button>
                          <button onClick={() => { setRenewId(null); setRenewDate('') }}
                            className="text-maritime-500 hover:text-maritime-300 text-xs">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => setRenewId(a.id as string)}
                            className="text-blue-400/60 hover:text-blue-400 text-xs">Renew</button>
                          <button onClick={() => handleDismiss(a.id as string)}
                            className="text-red-400/60 hover:text-red-400 text-xs">Dismiss</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredAlerts.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No expiry alerts found</p>
          )}
        </div>
      )}

      {/* Create Alert Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Expiry Alert">
        <form onSubmit={handleCreate}>
          <FormField label="Entity Type *">
            <select value={form.entityType} onChange={set('entityType')} className={selectClass} required>
              {entityTypeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Entity ID *">
              <input value={form.entityId} onChange={set('entityId')} className={inputClass} required placeholder="CERT-2026-001" />
            </FormField>
            <FormField label="Entity Name *">
              <input value={form.entityName} onChange={set('entityName')} className={inputClass} required placeholder="Safety Management Certificate" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Vessel ID">
              <input value={form.vesselId} onChange={set('vesselId')} className={inputClass} placeholder="Optional" />
            </FormField>
            <FormField label="Expiry Date *">
              <input type="date" value={form.expiryDate} onChange={set('expiryDate')} className={inputClass} required />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={form.notes} onChange={set('notes')}
              className={`${inputClass} h-16 resize-none`} placeholder="Additional details..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Add Alert'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
