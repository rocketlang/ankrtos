import { useQuery, useMutation, gql } from '@apollo/client'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const PACKAGES_QUERY = gql`
  query ClaimPackages($status: String) {
    claimPackages(status: $status) {
      id claimId packageType status
      hasNoticeOfClaim hasStatementOfFacts hasNorDocument hasLaytimeCalc
      hasSurveyReport hasWeatherLog hasPhotos hasBolCopy
      hasCharterPartyCopy hasCorrespondence
      totalDocsRequired totalDocsPresent completenessScore
      submittedTo submittedAt
      claim { claimNumber type amount }
    }
    claims { id claimNumber type amount }
  }
`

const ASSEMBLE_PACKAGE = gql`
  mutation AssembleClaimPackage($claimId: String!, $packageType: String!) {
    assembleClaimPackage(claimId: $claimId, packageType: $packageType) { id }
  }
`

const UPDATE_DOC = gql`
  mutation UpdateClaimPackageDoc($id: String!, $field: String!, $value: Boolean!) {
    updateClaimPackageDoc(id: $id, field: $field, value: $value) {
      id hasNoticeOfClaim hasStatementOfFacts hasNorDocument hasLaytimeCalc
      hasSurveyReport hasWeatherLog hasPhotos hasBolCopy
      hasCharterPartyCopy hasCorrespondence totalDocsPresent completenessScore
    }
  }
`

const SUBMIT_PACKAGE = gql`
  mutation SubmitClaimPackage($id: String!, $submittedTo: String!) {
    submitClaimPackage(id: $id, submittedTo: $submittedTo) { id status submittedTo submittedAt }
  }
`

const statusOptions = ['all', 'assembling', 'review', 'complete', 'submitted']

const statusBadge: Record<string, string> = {
  assembling: 'bg-yellow-900/50 text-yellow-400',
  review: 'bg-blue-900/50 text-blue-400',
  complete: 'bg-green-900/50 text-green-400',
  submitted: 'bg-purple-900/50 text-purple-400',
}

const packageTypes = [
  { value: 'cargo_damage', label: 'Cargo Damage' },
  { value: 'cargo_shortage', label: 'Cargo Shortage' },
  { value: 'demurrage', label: 'Demurrage' },
  { value: 'dead_freight', label: 'Dead Freight' },
  { value: 'deviation', label: 'Deviation' },
  { value: 'general_average', label: 'General Average' },
]

const claimTypeBadge: Record<string, string> = {
  cargo_damage: 'bg-red-900/50 text-red-400',
  cargo_shortage: 'bg-orange-900/50 text-orange-400',
  demurrage: 'bg-yellow-900/50 text-yellow-400',
  dead_freight: 'bg-blue-900/50 text-blue-400',
  deviation: 'bg-purple-900/50 text-purple-400',
  general_average: 'bg-teal-900/50 text-teal-400',
}

interface DocCheckItem {
  field: string
  label: string
}

const docChecklist: DocCheckItem[] = [
  { field: 'hasNoticeOfClaim', label: 'Notice of Claim' },
  { field: 'hasStatementOfFacts', label: 'Statement of Facts' },
  { field: 'hasNorDocument', label: 'NOR Document' },
  { field: 'hasLaytimeCalc', label: 'Laytime Calculation' },
  { field: 'hasSurveyReport', label: 'Survey Report' },
  { field: 'hasWeatherLog', label: 'Weather Log' },
  { field: 'hasPhotos', label: 'Photographs' },
  { field: 'hasBolCopy', label: 'Bill of Lading Copy' },
  { field: 'hasCharterPartyCopy', label: 'Charter Party Copy' },
  { field: 'hasCorrespondence', label: 'Correspondence' },
]

function fmtUsd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function completenessColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

function completenessTextColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

const emptyAssembleForm = {
  claimId: '', packageType: 'cargo_damage',
}

export function ClaimPackages() {
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAssemble, setShowAssemble] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [submitId, setSubmitId] = useState<string | null>(null)
  const [submitTo, setSubmitTo] = useState('')
  const [assembleForm, setAssembleForm] = useState(emptyAssembleForm)

  const { data, loading, error, refetch } = useQuery(PACKAGES_QUERY, {
    variables: {
      status: filterStatus !== 'all' ? filterStatus : undefined,
    },
  })

  const [assemblePackage, { loading: assembling }] = useMutation(ASSEMBLE_PACKAGE)
  const [updateDoc] = useMutation(UPDATE_DOC)
  const [submitPackage, { loading: submitting }] = useMutation(SUBMIT_PACKAGE)

  const packages = data?.claimPackages ?? []
  const claims = data?.claims ?? []

  const stats = useMemo(() => {
    const all = packages as Array<Record<string, unknown>>
    return {
      total: all.length,
      assembling: all.filter((p) => p.status === 'assembling').length,
      complete: all.filter((p) => p.status === 'complete' || p.status === 'review').length,
      submitted: all.filter((p) => p.status === 'submitted').length,
    }
  }, [packages])

  const handleAssemble = async (e: React.FormEvent) => {
    e.preventDefault()
    await assemblePackage({
      variables: {
        claimId: assembleForm.claimId,
        packageType: assembleForm.packageType,
      },
    })
    setAssembleForm(emptyAssembleForm)
    setShowAssemble(false)
    refetch()
  }

  const handleToggleDoc = async (packageId: string, field: string, currentValue: boolean) => {
    await updateDoc({
      variables: {
        id: packageId,
        field,
        value: !currentValue,
      },
    })
    refetch()
  }

  const openSubmit = (id: string) => {
    setSubmitId(id)
    setSubmitTo('')
    setShowSubmit(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submitId) return
    await submitPackage({
      variables: {
        id: submitId,
        submittedTo: submitTo,
      },
    })
    setShowSubmit(false)
    setSubmitId(null)
    refetch()
  }

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Claim Packages</h1>
          <p className="text-maritime-400 text-sm mt-1">Assemble, verify and submit claim documentation packages</p>
        </div>
        <button onClick={() => setShowAssemble(true)} className={btnPrimary}>+ Assemble Package</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-white', border: 'border-maritime-500' },
          { label: 'Assembling', value: stats.assembling, color: 'text-yellow-400', border: 'border-yellow-500' },
          { label: 'Complete', value: stats.complete, color: 'text-green-400', border: 'border-green-500' },
          { label: 'Submitted', value: stats.submitted, color: 'text-purple-400', border: 'border-purple-500' },
        ].map((s) => (
          <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
            <p className="text-maritime-500 text-xs">{s.label}</p>
            <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

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
      {loading && <p className="text-maritime-400">Loading packages...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Cards View */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(packages as Array<Record<string, unknown>>).map((pkg) => {
            const claim = pkg.claim as Record<string, unknown> | null
            const score = (pkg.completenessScore as number) ?? 0
            const status = pkg.status as string
            const docsPresent = (pkg.totalDocsPresent as number) ?? 0
            const docsRequired = (pkg.totalDocsRequired as number) ?? 10

            return (
              <div key={pkg.id as string} className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden hover:border-maritime-500 transition-colors">
                {/* Card Header: Claim info */}
                <div className="px-4 pt-4 pb-3 border-b border-maritime-700">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium text-sm">
                        {claim?.claimNumber as string ?? 'N/A'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${claimTypeBadge[claim?.type as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {((claim?.type as string) ?? 'unknown').replace(/_/g, ' ')}
                        </span>
                        <span className="text-orange-400 font-mono text-xs font-semibold">
                          {claim?.amount ? fmtUsd(claim.amount as number) : '-'}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusBadge[status] ?? 'bg-maritime-700 text-maritime-300'}`}>
                      {status}
                    </span>
                  </div>
                  {pkg.packageType && (
                    <p className="text-maritime-500 text-[10px] mt-1">
                      Package: {(pkg.packageType as string).replace(/_/g, ' ')}
                    </p>
                  )}
                </div>

                {/* Completeness Progress Bar */}
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-maritime-400 text-[10px] font-medium">COMPLETENESS</span>
                    <span className={`text-xs font-bold ${completenessTextColor(score)}`}>
                      {score}% ({docsPresent}/{docsRequired})
                    </span>
                  </div>
                  <div className="w-full bg-maritime-900 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${completenessColor(score)}`}
                      style={{ width: `${Math.min(score, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Document Checklist */}
                <div className="px-4 pb-3">
                  <p className="text-maritime-400 text-[10px] font-medium mb-2">DOCUMENT CHECKLIST</p>
                  <div className="grid grid-cols-1 gap-1">
                    {docChecklist.map((doc) => {
                      const hasDoc = pkg[doc.field as keyof typeof pkg] as boolean
                      return (
                        <button
                          key={doc.field}
                          onClick={() => handleToggleDoc(pkg.id as string, doc.field, hasDoc)}
                          className="flex items-center gap-2 text-left hover:bg-maritime-700/30 rounded px-1.5 py-0.5 transition-colors group"
                          disabled={status === 'submitted'}
                        >
                          <span className={`text-sm flex-shrink-0 ${hasDoc ? 'text-green-400' : 'text-red-400/60 group-hover:text-red-400'}`}>
                            {hasDoc ? '\u2713' : '\u2717'}
                          </span>
                          <span className={`text-xs ${hasDoc ? 'text-maritime-300' : 'text-maritime-500'}`}>
                            {doc.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Submitted Info */}
                {pkg.submittedTo && (
                  <div className="px-4 py-2 bg-maritime-900/50 border-t border-maritime-700">
                    <p className="text-maritime-500 text-[10px]">
                      Submitted to: <span className="text-maritime-300">{pkg.submittedTo as string}</span>
                    </p>
                    {pkg.submittedAt && (
                      <p className="text-maritime-500 text-[10px]">
                        Date: <span className="text-maritime-300">{fmtDate(pkg.submittedAt as string)}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="px-4 py-3 border-t border-maritime-700 flex gap-2">
                  {status !== 'submitted' && score >= 80 && (
                    <button
                      onClick={() => openSubmit(pkg.id as string)}
                      className="text-green-400 hover:text-green-300 text-xs bg-green-900/30 px-2.5 py-1 rounded transition-colors"
                    >
                      Submit Package
                    </button>
                  )}
                  {status !== 'submitted' && score < 80 && (
                    <span className="text-maritime-500 text-[10px] py-1">
                      {score < 50 ? 'More documents needed to submit' : 'Almost ready - continue gathering documents'}
                    </span>
                  )}
                  {status === 'submitted' && (
                    <span className="text-purple-400 text-[10px] py-1">Package submitted</span>
                  )}
                </div>
              </div>
            )
          })}

          {packages.length === 0 && (
            <div className="col-span-3 text-center py-12">
              <p className="text-maritime-500">No claim packages found</p>
              <button onClick={() => setShowAssemble(true)} className={`${btnPrimary} mt-4`}>
                Assemble First Package
              </button>
            </div>
          )}
        </div>
      )}

      {/* Assemble Package Modal */}
      <Modal open={showAssemble} onClose={() => setShowAssemble(false)} title="Assemble Claim Package">
        <form onSubmit={handleAssemble}>
          <FormField label="Claim *">
            <select
              value={assembleForm.claimId}
              onChange={(e) => setAssembleForm((f) => ({ ...f, claimId: e.target.value }))}
              className={selectClass}
              required
            >
              <option value="">-- Select Claim --</option>
              {(claims as Array<Record<string, unknown>>).map((c) => (
                <option key={c.id as string} value={c.id as string}>
                  {c.claimNumber as string} - {((c.type as string) ?? '').replace(/_/g, ' ')} ({fmtUsd((c.amount as number) ?? 0)})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Package Type *">
            <select
              value={assembleForm.packageType}
              onChange={(e) => setAssembleForm((f) => ({ ...f, packageType: e.target.value }))}
              className={selectClass}
              required
            >
              {packageTypes.map((pt) => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAssemble(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={assembling} className={btnPrimary}>
              {assembling ? 'Assembling...' : 'Assemble Package'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Submit Package Modal */}
      <Modal open={showSubmit} onClose={() => { setShowSubmit(false); setSubmitId(null) }} title="Submit Claim Package">
        <form onSubmit={handleSubmit}>
          <FormField label="Submitted To *">
            <input
              value={submitTo}
              onChange={(e) => setSubmitTo(e.target.value)}
              className={inputClass}
              required
              placeholder="P&I Club, Charterer Legal Dept, etc."
            />
          </FormField>
          <p className="text-maritime-500 text-xs mt-2 mb-4">
            Once submitted, document checklist items cannot be modified. Make sure all required documents are included.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => { setShowSubmit(false); setSubmitId(null) }} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting ? 'Submitting...' : 'Submit Package'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
