import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const COMPLIANCE_OVERVIEW = gql`
  query ComplianceOverview {
    complianceOverview {
      totalScreenings pendingScreenings matchCount escalatedCount clearRate
      riskDistribution { category count avgScore }
      uboVerifiedRate
    }
  }
`

const SANCTION_SCREENINGS = gql`
  query SanctionScreenings($entityType: String, $status: String) {
    sanctionScreenings(entityType: $entityType, status: $status) {
      id entityType entityName entityId imoNumber flagState nationality
      screeningType status riskLevel matchDetails sanctionLists pepMatch
      adverseMedia screenedBy reviewedBy reviewDate expiresAt notes createdAt
    }
  }
`

const COUNTERPARTY_RISKS = gql`
  query CounterpartyRisks($riskCategory: String) {
    counterpartyRisks(riskCategory: $riskCategory) {
      id companyId companyName overallScore riskCategory financialScore
      complianceScore operationalScore reputationScore sanctionRisk
      pepExposure adverseMedia countryRisk creditLimit paymentHistory
      validUntil createdAt
    }
  }
`

const UBOS_QUERY = gql`
  query UBOs($companyId: String) {
    ubos(companyId: $companyId) {
      id companyId companyName ownerName nationality ownershipPercent
      isDirectOwner controlType pepStatus sanctionStatus verificationStatus
      verifiedDate documentRef createdAt
    }
  }
`

const CREATE_SCREENING = gql`
  mutation CreateScreening(
    $entityType: String!, $entityName: String!, $imoNumber: String,
    $flagState: String, $nationality: String, $screeningType: String!,
    $sanctionLists: [String!]!
  ) {
    createSanctionScreening(
      entityType: $entityType, entityName: $entityName, imoNumber: $imoNumber,
      flagState: $flagState, nationality: $nationality, screeningType: $screeningType,
      sanctionLists: $sanctionLists
    ) { id }
  }
`

const REVIEW_SCREENING = gql`
  mutation ReviewScreening($id: String!, $status: String!, $notes: String) {
    reviewScreening(id: $id, status: $status, notes: $notes) { id status }
  }
`

const statusColors: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-400',
  clear: 'bg-green-900/50 text-green-400',
  match: 'bg-red-900/50 text-red-400',
  possible_match: 'bg-orange-900/50 text-orange-400',
  escalated: 'bg-purple-900/50 text-purple-400',
}

const riskColors: Record<string, string> = {
  low: 'bg-green-900/50 text-green-400',
  medium: 'bg-amber-900/50 text-amber-400',
  high: 'bg-orange-900/50 text-orange-400',
  critical: 'bg-red-900/50 text-red-400',
}

const riskBarColors: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
}

const verificationColors: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-400',
  verified: 'bg-green-900/50 text-green-400',
  rejected: 'bg-red-900/50 text-red-400',
  expired: 'bg-maritime-700 text-maritime-400',
}

const entityTypeOptions = ['All', 'Vessel', 'Company', 'Individual', 'Cargo']
const statusOptions = ['All', 'Pending', 'Clear', 'Match', 'Possible Match', 'Escalated']
const riskCategoryOptions = ['All', 'Low', 'Medium', 'High', 'Critical']
const screeningTypeOptions = ['initial', 'periodic', 'transaction', 'enhanced']
const sanctionListOptions = ['OFAC', 'EU', 'UN', 'UK_OFSI']

const tabs = ['Screenings', 'Risk Scores', 'UBO Registry', 'KYC Status']

const emptyScreeningForm = {
  entityType: 'vessel',
  entityName: '',
  imoNumber: '',
  flagState: '',
  nationality: '',
  screeningType: 'initial',
  sanctionLists: ['OFAC', 'EU', 'UN'] as string[],
}

const fmtDate = (d: string) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtCurrency = (amt: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amt)

export function SanctionsScreening() {
  const [activeTab, setActiveTab] = useState('Screenings')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [riskCategoryFilter, setRiskCategoryFilter] = useState('')
  const [showNewScreening, setShowNewScreening] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [screeningForm, setScreeningForm] = useState(emptyScreeningForm)
  const [reviewStatus, setReviewStatus] = useState('clear')
  const [reviewNotes, setReviewNotes] = useState('')
  const [selectedScreening, setSelectedScreening] = useState<Record<string, unknown> | null>(null)

  const { data: overviewData } = useQuery(COMPLIANCE_OVERVIEW)
  const { data: screeningsData, loading: screeningsLoading, refetch: refetchScreenings } = useQuery(SANCTION_SCREENINGS, {
    variables: {
      entityType: entityTypeFilter || undefined,
      status: statusFilter || undefined,
    },
  })
  const { data: risksData, loading: risksLoading } = useQuery(COUNTERPARTY_RISKS, {
    variables: { riskCategory: riskCategoryFilter || undefined },
    skip: activeTab !== 'Risk Scores',
  })
  const { data: ubosData, loading: ubosLoading } = useQuery(UBOS_QUERY, {
    skip: activeTab !== 'UBO Registry',
  })

  const [createScreening, { loading: creating }] = useMutation(CREATE_SCREENING)
  const [reviewScreening, { loading: reviewing }] = useMutation(REVIEW_SCREENING)

  const overview = overviewData?.complianceOverview
  const screenings = screeningsData?.sanctionScreenings ?? []
  const risks = risksData?.counterpartyRisks ?? []
  const ubos = ubosData?.ubos ?? []
  const riskDistribution = overview?.riskDistribution ?? []

  const maxRiskCount = riskDistribution.length > 0
    ? Math.max(...riskDistribution.map((r: Record<string, unknown>) => r.count as number), 1)
    : 1

  const setSF = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setScreeningForm((f) => ({ ...f, [field]: e.target.value }))

  const toggleSanctionList = (list: string) => {
    setScreeningForm((f) => ({
      ...f,
      sanctionLists: f.sanctionLists.includes(list)
        ? f.sanctionLists.filter((l) => l !== list)
        : [...f.sanctionLists, list],
    }))
  }

  const handleCreateScreening = async (e: React.FormEvent) => {
    e.preventDefault()
    await createScreening({
      variables: {
        entityType: screeningForm.entityType,
        entityName: screeningForm.entityName,
        imoNumber: screeningForm.imoNumber || null,
        flagState: screeningForm.flagState || null,
        nationality: screeningForm.nationality || null,
        screeningType: screeningForm.screeningType,
        sanctionLists: screeningForm.sanctionLists,
      },
    })
    setScreeningForm(emptyScreeningForm)
    setShowNewScreening(false)
    refetchScreenings()
  }

  const handleReviewScreening = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedScreening) return
    await reviewScreening({
      variables: {
        id: selectedScreening.id as string,
        status: reviewStatus,
        notes: reviewNotes || null,
      },
    })
    setReviewNotes('')
    setReviewStatus('clear')
    setSelectedScreening(null)
    setShowReview(false)
    refetchScreenings()
  }

  const openReviewModal = (screening: Record<string, unknown>) => {
    setSelectedScreening(screening)
    setReviewStatus('clear')
    setReviewNotes('')
    setShowReview(true)
  }

  const clearRate = overview?.clearRate ?? 0
  const clearRateColor = clearRate >= 90 ? 'text-green-400' : clearRate >= 70 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sanctions Screening</h1>
          <p className="text-maritime-400 text-sm mt-1">Compliance, counterparty risk and UBO verification</p>
        </div>
        <button onClick={() => setShowNewScreening(true)} className={btnPrimary}>+ New Screening</button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-[10px] uppercase tracking-wide">Total Screenings</p>
          <p className="text-white text-2xl font-bold mt-1">{overview?.totalScreenings ?? 0}</p>
        </div>
        <div className={`border rounded-lg p-4 ${(overview?.pendingScreenings ?? 0) > 0 ? 'bg-amber-900/20 border-amber-900/50' : 'bg-maritime-800 border-maritime-700'}`}>
          <p className={`text-[10px] uppercase tracking-wide ${(overview?.pendingScreenings ?? 0) > 0 ? 'text-amber-400' : 'text-maritime-500'}`}>Pending Review</p>
          <p className={`text-2xl font-bold mt-1 ${(overview?.pendingScreenings ?? 0) > 0 ? 'text-amber-400' : 'text-white'}`}>{overview?.pendingScreenings ?? 0}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-[10px] uppercase tracking-wide">Matches Found</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-white text-2xl font-bold">{overview?.matchCount ?? 0}</p>
            {(overview?.matchCount ?? 0) > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{overview?.matchCount}</span>
            )}
          </div>
        </div>
        <div className={`border rounded-lg p-4 ${(overview?.escalatedCount ?? 0) > 0 ? 'bg-red-900/20 border-red-900/50' : 'bg-maritime-800 border-maritime-700'}`}>
          <p className={`text-[10px] uppercase tracking-wide ${(overview?.escalatedCount ?? 0) > 0 ? 'text-red-400' : 'text-maritime-500'}`}>Escalated</p>
          <p className={`text-2xl font-bold mt-1 ${(overview?.escalatedCount ?? 0) > 0 ? 'text-red-400' : 'text-white'}`}>{overview?.escalatedCount ?? 0}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-500 text-[10px] uppercase tracking-wide">Clear Rate</p>
          <p className={`text-2xl font-bold mt-1 ${clearRateColor}`}>{clearRate.toFixed(1)}%</p>
          <p className="text-maritime-500 text-[10px] mt-1">UBO verified: {(overview?.uboVerifiedRate ?? 0).toFixed(0)}%</p>
        </div>
      </div>

      {/* Risk Distribution */}
      {riskDistribution.length > 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4 mb-6">
          <h3 className="text-maritime-300 text-xs font-semibold uppercase tracking-wide mb-3">Risk Distribution</h3>
          <div className="space-y-2">
            {riskDistribution.map((rd: Record<string, unknown>) => {
              const category = (rd.category as string) ?? 'unknown'
              const count = (rd.count as number) ?? 0
              const avgScore = (rd.avgScore as number) ?? 0
              const barWidth = maxRiskCount > 0 ? (count / maxRiskCount) * 100 : 0
              const barColor = riskBarColors[category.toLowerCase()] ?? 'bg-maritime-500'
              return (
                <div key={category} className="flex items-center gap-3">
                  <span className="text-maritime-400 text-xs w-16 capitalize">{category}</span>
                  <div className="flex-1 h-5 bg-maritime-900 rounded overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded transition-all duration-300 flex items-center px-2`}
                      style={{ width: `${Math.max(barWidth, 3)}%` }}
                    >
                      {barWidth > 15 && <span className="text-[10px] text-white font-medium">{count}</span>}
                    </div>
                  </div>
                  <span className="text-maritime-400 text-xs w-12 text-right">{count}</span>
                  <span className="text-maritime-500 text-[10px] w-20 text-right">avg {avgScore.toFixed(1)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'text-maritime-400 hover:text-white hover:bg-maritime-700/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Screenings Tab */}
      {activeTab === 'Screenings' && (
        <>
          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-4">
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className={`${selectClass} w-40`}
            >
              {entityTypeOptions.map((opt) => (
                <option key={opt} value={opt === 'All' ? '' : opt.toLowerCase()}>{opt}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${selectClass} w-44`}
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt === 'All' ? '' : opt.toLowerCase().replace(/ /g, '_')}>{opt}</option>
              ))}
            </select>
            <div className="flex-1" />
            <button onClick={() => setShowNewScreening(true)} className={btnPrimary}>+ New Screening</button>
          </div>

          {screeningsLoading && <p className="text-maritime-400">Loading screenings...</p>}

          {!screeningsLoading && (
            <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-maritime-400 text-left border-b border-maritime-700">
                      <th className="px-4 py-3 font-medium">Entity Name</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">IMO / Flag / Nationality</th>
                      <th className="px-4 py-3 font-medium">Screening</th>
                      <th className="px-4 py-3 font-medium">Lists</th>
                      <th className="px-4 py-3 font-medium">PEP</th>
                      <th className="px-4 py-3 font-medium">Risk</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {screenings.map((s: Record<string, unknown>) => {
                      const status = (s.status as string) ?? 'pending'
                      const risk = (s.riskLevel as string) ?? 'low'
                      const lists = (s.sanctionLists as string[]) ?? []
                      const isPep = s.pepMatch as boolean
                      const entityType = (s.entityType as string) ?? ''
                      return (
                        <tr key={s.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                          <td className="px-4 py-3 text-white font-bold text-xs">{s.entityName as string}</td>
                          <td className="px-4 py-3">
                            <span className="bg-maritime-700 text-maritime-300 px-2 py-0.5 rounded text-[10px] font-medium capitalize">
                              {entityType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-maritime-300 text-xs">
                            {s.imoNumber && <span className="mr-2">IMO: {s.imoNumber as string}</span>}
                            {s.flagState && <span className="mr-2">{s.flagState as string}</span>}
                            {s.nationality && <span>{s.nationality as string}</span>}
                            {!s.imoNumber && !s.flagState && !s.nationality && '-'}
                          </td>
                          <td className="px-4 py-3 text-maritime-300 text-xs capitalize">{(s.screeningType as string)?.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {lists.map((list) => (
                                <span key={list} className="bg-maritime-700 text-maritime-300 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                  {list}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isPep ? (
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" title="PEP Match" />
                            ) : (
                              <span className="text-maritime-600 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${riskColors[risk] ?? 'bg-maritime-700 text-maritime-300'}`}>
                              {risk}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[status] ?? 'bg-maritime-700 text-maritime-300'}`}>
                              {status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(s.createdAt as string)}</td>
                          <td className="px-4 py-3">
                            {status === 'pending' && (
                              <button
                                onClick={() => openReviewModal(s)}
                                className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                              >
                                Review
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {screenings.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-maritime-500">
                          No screenings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Risk Scores Tab */}
      {activeTab === 'Risk Scores' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={riskCategoryFilter}
              onChange={(e) => setRiskCategoryFilter(e.target.value)}
              className={`${selectClass} w-40`}
            >
              {riskCategoryOptions.map((opt) => (
                <option key={opt} value={opt === 'All' ? '' : opt.toLowerCase()}>{opt}</option>
              ))}
            </select>
          </div>

          {risksLoading && <p className="text-maritime-400">Loading risk scores...</p>}

          {!risksLoading && (
            <div className="grid grid-cols-2 gap-4">
              {risks.map((r: Record<string, unknown>) => {
                const overall = (r.overallScore as number) ?? 0
                const category = (r.riskCategory as string) ?? 'low'
                const financial = (r.financialScore as number) ?? 0
                const compliance = (r.complianceScore as number) ?? 0
                const operational = (r.operationalScore as number) ?? 0
                const reputation = (r.reputationScore as number) ?? 0
                const hasSanctionRisk = r.sanctionRisk as boolean
                const hasPepExposure = r.pepExposure as boolean
                const hasAdverseMedia = r.adverseMedia as boolean

                const scoreBarColor = (score: number) =>
                  score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500'

                const subScores = [
                  { label: 'Financial', value: financial },
                  { label: 'Compliance', value: compliance },
                  { label: 'Operational', value: operational },
                  { label: 'Reputation', value: reputation },
                ]

                return (
                  <div key={r.id as string} className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-white font-bold text-sm">{r.companyName as string}</h4>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium capitalize ${riskColors[category] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {category} risk
                        </span>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${overall >= 70 ? 'text-green-400' : overall >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                          {overall}
                        </p>
                        <p className="text-maritime-500 text-[10px]">overall score</p>
                      </div>
                    </div>

                    {/* Sub-scores */}
                    <div className="space-y-2 mb-4">
                      {subScores.map((ss) => (
                        <div key={ss.label} className="flex items-center gap-2">
                          <span className="text-maritime-400 text-[10px] w-20">{ss.label}</span>
                          <div className="flex-1 h-2 bg-maritime-900 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${scoreBarColor(ss.value)} rounded-full transition-all duration-300`}
                              style={{ width: `${ss.value}%` }}
                            />
                          </div>
                          <span className="text-maritime-300 text-[10px] w-8 text-right">{ss.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Risk Flags */}
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-maritime-700">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${hasSanctionRisk ? 'bg-red-500' : 'bg-maritime-600'}`} />
                        <span className="text-maritime-400 text-[10px]">Sanction Risk</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${hasPepExposure ? 'bg-red-500' : 'bg-maritime-600'}`} />
                        <span className="text-maritime-400 text-[10px]">PEP Exposure</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${hasAdverseMedia ? 'bg-red-500' : 'bg-maritime-600'}`} />
                        <span className="text-maritime-400 text-[10px]">Adverse Media</span>
                      </div>
                    </div>

                    {/* Footer details */}
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <span className="text-maritime-500">Credit Limit</span>
                        <p className="text-white font-medium">{r.creditLimit ? fmtCurrency(r.creditLimit as number) : '-'}</p>
                      </div>
                      <div>
                        <span className="text-maritime-500">Payment History</span>
                        <p className="text-white font-medium capitalize">{(r.paymentHistory as string) ?? '-'}</p>
                      </div>
                      <div>
                        <span className="text-maritime-500">Valid Until</span>
                        <p className="text-white font-medium">{fmtDate(r.validUntil as string)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              {risks.length === 0 && (
                <div className="col-span-2 bg-maritime-800 border border-maritime-700 rounded-lg p-8 text-center text-maritime-500">
                  No counterparty risk records found
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* UBO Registry Tab */}
      {activeTab === 'UBO Registry' && (
        <>
          {ubosLoading && <p className="text-maritime-400">Loading UBO registry...</p>}

          {!ubosLoading && (
            <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-maritime-400 text-left border-b border-maritime-700">
                      <th className="px-4 py-3 font-medium">Company</th>
                      <th className="px-4 py-3 font-medium">Owner Name</th>
                      <th className="px-4 py-3 font-medium">Nationality</th>
                      <th className="px-4 py-3 font-medium text-right">Ownership %</th>
                      <th className="px-4 py-3 font-medium">Direct/Indirect</th>
                      <th className="px-4 py-3 font-medium">Control Type</th>
                      <th className="px-4 py-3 font-medium">PEP</th>
                      <th className="px-4 py-3 font-medium">Sanction Status</th>
                      <th className="px-4 py-3 font-medium">Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ubos.map((u: Record<string, unknown>) => {
                      const verStatus = (u.verificationStatus as string) ?? 'pending'
                      const pepStatus = u.pepStatus as boolean
                      const sanctionSt = (u.sanctionStatus as string) ?? 'clear'
                      return (
                        <tr key={u.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                          <td className="px-4 py-3 text-white font-bold text-xs">{u.companyName as string}</td>
                          <td className="px-4 py-3 text-maritime-300 text-xs">{u.ownerName as string}</td>
                          <td className="px-4 py-3 text-maritime-300 text-xs">{u.nationality as string}</td>
                          <td className="px-4 py-3 text-white text-xs text-right font-medium">{(u.ownershipPercent as number)?.toFixed(1)}%</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${u.isDirectOwner ? 'bg-blue-900/50 text-blue-400' : 'bg-maritime-700 text-maritime-400'}`}>
                              {u.isDirectOwner ? 'Direct' : 'Indirect'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-maritime-300 text-xs capitalize">{(u.controlType as string)?.replace(/_/g, ' ') ?? '-'}</td>
                          <td className="px-4 py-3 text-center">
                            {pepStatus ? (
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" title="PEP" />
                            ) : (
                              <span className="text-maritime-600 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                              sanctionSt === 'clear' ? 'bg-green-900/50 text-green-400'
                                : sanctionSt === 'match' ? 'bg-red-900/50 text-red-400'
                                : 'bg-amber-900/50 text-amber-400'
                            }`}>
                              {sanctionSt}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${verificationColors[verStatus] ?? 'bg-maritime-700 text-maritime-300'}`}>
                              {verStatus}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    {ubos.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-maritime-500">
                          No UBO records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* KYC Status Tab */}
      {activeTab === 'KYC Status' && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6">
          <h3 className="text-white text-sm font-semibold mb-4">KYC Compliance Summary</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-maritime-900 border border-maritime-700 rounded-lg p-4">
              <p className="text-maritime-500 text-[10px] uppercase tracking-wide">UBO Verified Rate</p>
              <p className={`text-3xl font-bold mt-2 ${(overview?.uboVerifiedRate ?? 0) >= 80 ? 'text-green-400' : 'text-amber-400'}`}>
                {(overview?.uboVerifiedRate ?? 0).toFixed(1)}%
              </p>
              <p className="text-maritime-500 text-[10px] mt-1">of all beneficial owners</p>
            </div>
            <div className="bg-maritime-900 border border-maritime-700 rounded-lg p-4">
              <p className="text-maritime-500 text-[10px] uppercase tracking-wide">Screenings Clear Rate</p>
              <p className={`text-3xl font-bold mt-2 ${clearRateColor}`}>
                {clearRate.toFixed(1)}%
              </p>
              <p className="text-maritime-500 text-[10px] mt-1">passed all checks</p>
            </div>
            <div className="bg-maritime-900 border border-maritime-700 rounded-lg p-4">
              <p className="text-maritime-500 text-[10px] uppercase tracking-wide">Pending Actions</p>
              <p className={`text-3xl font-bold mt-2 ${(overview?.pendingScreenings ?? 0) > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                {overview?.pendingScreenings ?? 0}
              </p>
              <p className="text-maritime-500 text-[10px] mt-1">require review</p>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="text-maritime-300 text-xs font-semibold uppercase tracking-wide mb-3">Risk Breakdown</h4>
            <div className="grid grid-cols-4 gap-3">
              {riskDistribution.map((rd: Record<string, unknown>) => {
                const cat = (rd.category as string) ?? ''
                const count = (rd.count as number) ?? 0
                const barColor = riskBarColors[cat.toLowerCase()] ?? 'bg-maritime-500'
                return (
                  <div key={cat} className="bg-maritime-900 border border-maritime-700 rounded-lg p-3 text-center">
                    <span className={`inline-block w-3 h-3 rounded-full ${barColor} mb-2`} />
                    <p className="text-white text-lg font-bold">{count}</p>
                    <p className="text-maritime-500 text-[10px] capitalize">{cat}</p>
                  </div>
                )
              })}
              {riskDistribution.length === 0 && (
                <p className="col-span-4 text-maritime-500 text-xs text-center py-4">No risk data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Screening Modal */}
      <Modal open={showNewScreening} onClose={() => setShowNewScreening(false)} title="New Sanctions Screening">
        <form onSubmit={handleCreateScreening}>
          <FormField label="Entity Type *">
            <select value={screeningForm.entityType} onChange={setSF('entityType')} className={selectClass} required>
              <option value="vessel">Vessel</option>
              <option value="company">Company</option>
              <option value="individual">Individual</option>
              <option value="cargo">Cargo</option>
            </select>
          </FormField>

          <FormField label="Entity Name *">
            <input
              value={screeningForm.entityName}
              onChange={setSF('entityName')}
              className={inputClass}
              required
              placeholder="Enter entity name"
            />
          </FormField>

          {screeningForm.entityType === 'vessel' && (
            <>
              <FormField label="IMO Number">
                <input
                  value={screeningForm.imoNumber}
                  onChange={setSF('imoNumber')}
                  className={inputClass}
                  placeholder="e.g. 9876543"
                />
              </FormField>
              <FormField label="Flag State">
                <input
                  value={screeningForm.flagState}
                  onChange={setSF('flagState')}
                  className={inputClass}
                  placeholder="e.g. Panama"
                />
              </FormField>
            </>
          )}

          {screeningForm.entityType === 'individual' && (
            <FormField label="Nationality">
              <input
                value={screeningForm.nationality}
                onChange={setSF('nationality')}
                className={inputClass}
                placeholder="e.g. Greek"
              />
            </FormField>
          )}

          <FormField label="Screening Type *">
            <select value={screeningForm.screeningType} onChange={setSF('screeningType')} className={selectClass} required>
              {screeningTypeOptions.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Sanction Lists *">
            <div className="flex flex-wrap gap-3 mt-1">
              {sanctionListOptions.map((list) => (
                <label key={list} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={screeningForm.sanctionLists.includes(list)}
                    onChange={() => toggleSanctionList(list)}
                    className="w-4 h-4 rounded border-maritime-600 bg-maritime-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-maritime-300 text-sm">{list.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </FormField>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowNewScreening(false)} className={btnSecondary}>Cancel</button>
            <button
              type="submit"
              disabled={creating || screeningForm.sanctionLists.length === 0}
              className={btnPrimary}
            >
              {creating ? 'Submitting...' : 'Submit Screening'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Screening Modal */}
      <Modal open={showReview} onClose={() => setShowReview(false)} title="Review Screening">
        <form onSubmit={handleReviewScreening}>
          {selectedScreening && (
            <>
              {/* Screening details */}
              <div className="bg-maritime-900 border border-maritime-700 rounded-lg p-4 mb-4">
                <h4 className="text-maritime-300 text-xs font-semibold uppercase tracking-wide mb-3">Screening Details</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-maritime-500">Entity</span>
                    <p className="text-white font-bold">{selectedScreening.entityName as string}</p>
                  </div>
                  <div>
                    <span className="text-maritime-500">Type</span>
                    <p className="text-white capitalize">{selectedScreening.entityType as string}</p>
                  </div>
                  <div>
                    <span className="text-maritime-500">Screening Type</span>
                    <p className="text-white capitalize">{(selectedScreening.screeningType as string)?.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-maritime-500">Risk Level</span>
                    <p className="text-white capitalize">{selectedScreening.riskLevel as string}</p>
                  </div>
                </div>
                {/* Match info */}
                <div className="mt-3 pt-3 border-t border-maritime-700 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-maritime-500">Match Details</span>
                    <p className="text-maritime-300">{(selectedScreening.matchDetails as string) || 'None'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${selectedScreening.pepMatch ? 'bg-red-500' : 'bg-maritime-600'}`} />
                    <span className="text-maritime-400">PEP Match</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${selectedScreening.adverseMedia ? 'bg-red-500' : 'bg-maritime-600'}`} />
                    <span className="text-maritime-400">Adverse Media</span>
                  </div>
                </div>
              </div>

              <FormField label="Review Decision *">
                <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} className={selectClass} required>
                  <option value="clear">Clear</option>
                  <option value="match">Match</option>
                  <option value="possible_match">Possible Match</option>
                  <option value="escalated">Escalated</option>
                </select>
              </FormField>

              <FormField label="Notes">
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className={`${inputClass} h-24 resize-none`}
                  placeholder="Add review notes..."
                />
              </FormField>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowReview(false)} className={btnSecondary}>Cancel</button>
                <button type="submit" disabled={reviewing} className={btnPrimary}>
                  {reviewing ? 'Confirming...' : 'Confirm Review'}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  )
}
