import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const CERTIFICATES_QUERY = gql`
  query VesselCertificates($vesselId: String, $certificateType: String) {
    vesselCertificates(vesselId: $vesselId, certificateType: $certificateType) {
      id vesselId certificateType certificateNumber issuedBy issuedDate expiryDate
      lastSurveyDate nextSurveyDue status documentUrl notes
      vessel { name }
    }
    certificateExpiryDashboard {
      valid { id certificateType vessel { name } expiryDate }
      expiringSoon { id certificateType vessel { name } expiryDate }
      expired { id certificateType vessel { name } expiryDate }
    }
    vessels { id name imo }
  }
`

const CREATE_CERTIFICATE = gql`
  mutation CreateVesselCertificate(
    $vesselId: String!, $certificateType: String!, $certificateNumber: String!,
    $issuedBy: String!, $issuedDate: DateTime!, $expiryDate: DateTime!,
    $lastSurveyDate: DateTime, $nextSurveyDue: DateTime, $documentUrl: String, $notes: String
  ) {
    createVesselCertificate(
      vesselId: $vesselId, certificateType: $certificateType, certificateNumber: $certificateNumber,
      issuedBy: $issuedBy, issuedDate: $issuedDate, expiryDate: $expiryDate,
      lastSurveyDate: $lastSurveyDate, nextSurveyDue: $nextSurveyDue,
      documentUrl: $documentUrl, notes: $notes
    ) { id }
  }
`

const RENEW_CERTIFICATE = gql`
  mutation RenewVesselCertificate(
    $id: String!, $newExpiryDate: DateTime!, $newCertificateNumber: String, $documentUrl: String
  ) {
    renewVesselCertificate(
      id: $id, newExpiryDate: $newExpiryDate, newCertificateNumber: $newCertificateNumber,
      documentUrl: $documentUrl
    ) { id }
  }
`

const certificateTypes = [
  { value: 'safety_construction', label: 'Safety Construction' },
  { value: 'safety_equipment', label: 'Safety Equipment' },
  { value: 'safety_radio', label: 'Safety Radio' },
  { value: 'iopp', label: 'IOPP' },
  { value: 'isps', label: 'ISPS' },
  { value: 'ism_doc', label: 'ISM DOC' },
  { value: 'ism_smc', label: 'ISM SMC' },
  { value: 'class', label: 'Class Certificate' },
  { value: 'load_line', label: 'Load Line' },
  { value: 'tonnage', label: 'Tonnage' },
  { value: 'registry', label: 'Registry' },
  { value: 'civil_liability', label: 'Civil Liability' },
  { value: 'wreck_removal', label: 'Wreck Removal' },
  { value: 'marpol_annex_vi', label: 'MARPOL Annex VI' },
]

const certTypeBadgeColors: Record<string, string> = {
  safety_construction: 'bg-blue-900/50 text-blue-400',
  safety_equipment: 'bg-teal-900/50 text-teal-400',
  safety_radio: 'bg-sky-900/50 text-sky-400',
  iopp: 'bg-green-900/50 text-green-400',
  isps: 'bg-red-900/50 text-red-400',
  ism_doc: 'bg-purple-900/50 text-purple-400',
  ism_smc: 'bg-violet-900/50 text-violet-400',
  class: 'bg-orange-900/50 text-orange-400',
  load_line: 'bg-amber-900/50 text-amber-400',
  tonnage: 'bg-lime-900/50 text-lime-400',
  registry: 'bg-indigo-900/50 text-indigo-400',
  civil_liability: 'bg-rose-900/50 text-rose-400',
  wreck_removal: 'bg-fuchsia-900/50 text-fuchsia-400',
  marpol_annex_vi: 'bg-emerald-900/50 text-emerald-400',
}

const statusBadgeColors: Record<string, string> = {
  valid: 'bg-green-900/50 text-green-400',
  expiring_soon: 'bg-yellow-900/50 text-yellow-400',
  expired: 'bg-red-900/50 text-red-400',
  suspended: 'bg-gray-800 text-gray-400',
}

type Certificate = {
  id: string
  vesselId: string
  certificateType: string
  certificateNumber: string
  issuedBy: string
  issuedDate: string
  expiryDate: string
  lastSurveyDate: string | null
  nextSurveyDue: string | null
  status: string
  documentUrl: string | null
  notes: string | null
  vessel: { name: string }
}

type ExpiryItem = {
  id: string
  certificateType: string
  vessel: { name: string }
  expiryDate: string
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
  vesselId: '', certificateType: 'safety_construction', certificateNumber: '',
  issuedBy: '', issuedDate: '', expiryDate: '', lastSurveyDate: '',
  nextSurveyDue: '', documentUrl: '', notes: '',
}

const emptyRenewForm = {
  newExpiryDate: '', newCertificateNumber: '', documentUrl: '',
}

export function VesselCertificates() {
  const [filterVessel, setFilterVessel] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showRenew, setShowRenew] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [renewForm, setRenewForm] = useState(emptyRenewForm)

  const { data, loading, error, refetch } = useQuery(CERTIFICATES_QUERY, {
    variables: {
      vesselId: filterVessel || undefined,
      certificateType: filterType || undefined,
    },
  })

  const [createCertificate, { loading: creating }] = useMutation(CREATE_CERTIFICATE)
  const [renewCertificate, { loading: renewing }] = useMutation(RENEW_CERTIFICATE)

  const certs: Certificate[] = (data?.vesselCertificates ?? []).filter((c: Certificate) => {
    if (filterStatus && c.status !== filterStatus) return false
    return true
  })

  const dashboard = data?.certificateExpiryDashboard
  const validCount = dashboard?.valid?.length ?? 0
  const expiringSoonCount = dashboard?.expiringSoon?.length ?? 0
  const expiredCount = dashboard?.expired?.length ?? 0
  const totalCount = validCount + expiringSoonCount + expiredCount

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createCertificate({
      variables: {
        vesselId: createForm.vesselId,
        certificateType: createForm.certificateType,
        certificateNumber: createForm.certificateNumber,
        issuedBy: createForm.issuedBy,
        issuedDate: new Date(createForm.issuedDate).toISOString(),
        expiryDate: new Date(createForm.expiryDate).toISOString(),
        lastSurveyDate: createForm.lastSurveyDate ? new Date(createForm.lastSurveyDate).toISOString() : null,
        nextSurveyDue: createForm.nextSurveyDue ? new Date(createForm.nextSurveyDue).toISOString() : null,
        documentUrl: createForm.documentUrl || null,
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
    await renewCertificate({
      variables: {
        id: showRenew,
        newExpiryDate: new Date(renewForm.newExpiryDate).toISOString(),
        newCertificateNumber: renewForm.newCertificateNumber || null,
        documentUrl: renewForm.documentUrl || null,
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
          <h1 className="text-2xl font-bold text-white">Vessel Certificates</h1>
          <p className="text-maritime-400 text-sm mt-1">Track statutory certificates, surveys, and expiry dates</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ Add Certificate</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Certificates', value: totalCount, color: 'text-white', border: 'border-blue-500' },
          { label: 'Valid', value: validCount, color: 'text-green-400', border: 'border-green-500' },
          { label: 'Expiring Soon (<90d)', value: expiringSoonCount, color: 'text-yellow-400', border: 'border-yellow-500' },
          { label: 'Expired', value: expiredCount, color: 'text-red-400', border: 'border-red-500' },
        ].map((s) => (
          <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
            <p className="text-maritime-500 text-xs">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{loading ? '-' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Expiry Alerts */}
      {dashboard && (expiringSoonCount > 0 || expiredCount > 0) && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4 mb-6">
          <h3 className="text-white text-sm font-medium mb-3">Expiry Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {expiredCount > 0 && (
              <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-3">
                <p className="text-red-400 text-xs font-medium mb-2">Expired Certificates</p>
                {dashboard.expired.slice(0, 5).map((item: ExpiryItem) => (
                  <div key={item.id} className="flex items-center justify-between py-1">
                    <span className="text-maritime-300 text-xs">{item.vessel.name} - {item.certificateType.replace(/_/g, ' ')}</span>
                    <span className="text-red-400 text-xs font-mono">{fmtDate(item.expiryDate)}</span>
                  </div>
                ))}
              </div>
            )}
            {expiringSoonCount > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-lg p-3">
                <p className="text-yellow-400 text-xs font-medium mb-2">Expiring Within 90 Days</p>
                {dashboard.expiringSoon.slice(0, 5).map((item: ExpiryItem) => (
                  <div key={item.id} className="flex items-center justify-between py-1">
                    <span className="text-maritime-300 text-xs">{item.vessel.name} - {item.certificateType.replace(/_/g, ' ')}</span>
                    <span className="text-yellow-400 text-xs font-mono">{daysRemaining(item.expiryDate)}d left</span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
          {certificateTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded-md px-3 py-2">
          <option value="">All Statuses</option>
          <option value="valid">Valid</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading && <p className="text-maritime-400">Loading certificates...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Table */}
      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-maritime-700 text-maritime-400 text-xs">
                  <th className="text-left px-4 py-3 font-medium">Vessel</th>
                  <th className="text-left px-4 py-3 font-medium">Certificate Type</th>
                  <th className="text-left px-4 py-3 font-medium">Cert #</th>
                  <th className="text-left px-4 py-3 font-medium">Issued By</th>
                  <th className="text-left px-4 py-3 font-medium">Issued</th>
                  <th className="text-left px-4 py-3 font-medium">Expiry</th>
                  <th className="text-center px-4 py-3 font-medium">Days Left</th>
                  <th className="text-left px-4 py-3 font-medium">Next Survey</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certs.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-8 text-maritime-500">No certificates found</td></tr>
                )}
                {certs.map((c) => {
                  const days = daysRemaining(c.expiryDate)
                  return (
                    <tr key={c.id} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                      <td className="px-4 py-3 text-white font-medium text-xs">{c.vessel.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${certTypeBadgeColors[c.certificateType] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {c.certificateType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-maritime-300 font-mono text-xs">{c.certificateNumber}</td>
                      <td className="px-4 py-3 text-maritime-300 text-xs">{c.issuedBy}</td>
                      <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(c.issuedDate)}</td>
                      <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(c.expiryDate)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-mono font-medium ${daysRemainingBadge(c.expiryDate)}`}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(c.nextSurveyDue)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusBadgeColors[c.status] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setShowRenew(c.id); setRenewForm(emptyRenewForm) }}
                            className="text-blue-400 hover:text-blue-300 text-[10px] bg-blue-900/30 px-1.5 py-0.5 rounded"
                          >
                            Renew
                          </button>
                          {c.documentUrl && (
                            <a
                              href={c.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 text-[10px] bg-cyan-900/30 px-1.5 py-0.5 rounded"
                            >
                              Doc
                            </a>
                          )}
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

      {/* Create Certificate Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Vessel Certificate">
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
            <FormField label="Certificate Type *">
              <select value={createForm.certificateType} onChange={setC('certificateType')} className={selectClass} required>
                {certificateTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Certificate Number *">
              <input value={createForm.certificateNumber} onChange={setC('certificateNumber')} className={inputClass} required placeholder="SC-2026-001" />
            </FormField>
            <FormField label="Issued By *">
              <input value={createForm.issuedBy} onChange={setC('issuedBy')} className={inputClass} required placeholder="Lloyd's Register" />
            </FormField>
            <FormField label="Issued Date *">
              <input type="date" value={createForm.issuedDate} onChange={setC('issuedDate')} className={inputClass} required />
            </FormField>
            <FormField label="Expiry Date *">
              <input type="date" value={createForm.expiryDate} onChange={setC('expiryDate')} className={inputClass} required />
            </FormField>
            <FormField label="Last Survey Date">
              <input type="date" value={createForm.lastSurveyDate} onChange={setC('lastSurveyDate')} className={inputClass} />
            </FormField>
            <FormField label="Next Survey Due">
              <input type="date" value={createForm.nextSurveyDue} onChange={setC('nextSurveyDue')} className={inputClass} />
            </FormField>
          </div>
          <FormField label="Document URL">
            <input value={createForm.documentUrl} onChange={setC('documentUrl')} className={inputClass} placeholder="https://..." />
          </FormField>
          <FormField label="Notes">
            <textarea value={createForm.notes} onChange={setC('notes')} className={inputClass} rows={2} placeholder="Additional notes..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Add Certificate'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Renew Certificate Modal */}
      <Modal open={!!showRenew} onClose={() => setShowRenew(null)} title="Renew Certificate">
        <form onSubmit={handleRenew}>
          <div className="grid grid-cols-1 gap-4">
            <FormField label="New Expiry Date *">
              <input type="date" value={renewForm.newExpiryDate} onChange={setR('newExpiryDate')} className={inputClass} required />
            </FormField>
            <FormField label="New Certificate Number">
              <input value={renewForm.newCertificateNumber} onChange={setR('newCertificateNumber')} className={inputClass} placeholder="Leave blank to keep existing" />
            </FormField>
            <FormField label="New Document URL">
              <input value={renewForm.documentUrl} onChange={setR('documentUrl')} className={inputClass} placeholder="https://..." />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowRenew(null)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={renewing} className={btnPrimary}>
              {renewing ? 'Renewing...' : 'Renew Certificate'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
