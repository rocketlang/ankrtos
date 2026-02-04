import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const INSPECTIONS_QUERY = gql`
  query VesselInspections($vesselId: String, $inspectionType: String, $status: String) {
    vesselInspections(vesselId: $vesselId, inspectionType: $inspectionType, status: $status) {
      id vesselId inspectionType inspectorName inspectorOrg inspectionDate portOfInspection
      overallScore grade deficienciesFound observationsCount
      navigation safety pollution structural operational documentation
      status detentionIssued detentionDays reportUrl nextInspectionDue
      vessel { name }
    }
  }
`

const INSPECTION_DASHBOARD_QUERY = gql`
  query InspectionDashboard($vesselId: String) {
    inspectionDashboard(vesselId: $vesselId) {
      totalInspections passRate avgScore
      deficienciesByCategory { category total }
      upcomingInspections detentionCount
    }
  }
`

const VESSELS_QUERY = gql`
  query VesselsForInspections {
    vessels { id name imo }
  }
`

const SCHEDULE_INSPECTION = gql`
  mutation ScheduleInspection(
    $vesselId: String!, $inspectionType: String!, $inspectionDate: DateTime!,
    $portOfInspection: String!, $inspectorName: String, $inspectorOrg: String
  ) {
    scheduleInspection(
      vesselId: $vesselId, inspectionType: $inspectionType, inspectionDate: $inspectionDate,
      portOfInspection: $portOfInspection, inspectorName: $inspectorName, inspectorOrg: $inspectorOrg
    ) { id }
  }
`

const COMPLETE_INSPECTION = gql`
  mutation CompleteInspection(
    $id: String!, $overallScore: Float!, $grade: String!, $navigation: Int, $safety: Int,
    $pollution: Int, $structural: Int, $operational: Int, $documentation: Int,
    $observationsCount: Int, $reportUrl: String, $detentionIssued: Boolean, $detentionDays: Int
  ) {
    completeInspection(
      id: $id, overallScore: $overallScore, grade: $grade, navigation: $navigation, safety: $safety,
      pollution: $pollution, structural: $structural, operational: $operational, documentation: $documentation,
      observationsCount: $observationsCount, reportUrl: $reportUrl, detentionIssued: $detentionIssued, detentionDays: $detentionDays
    ) { id }
  }
`

const inspectionTypes = [
  { value: 'sire', label: 'SIRE', color: 'bg-blue-900/50 text-blue-400' },
  { value: 'cdi', label: 'CDI', color: 'bg-cyan-900/50 text-cyan-400' },
  { value: 'psc', label: 'PSC', color: 'bg-yellow-900/50 text-yellow-400' },
  { value: 'rightship', label: 'RightShip', color: 'bg-green-900/50 text-green-400' },
  { value: 'flag_state', label: 'Flag State', color: 'bg-purple-900/50 text-purple-400' },
  { value: 'class', label: 'Class', color: 'bg-indigo-900/50 text-indigo-400' },
  { value: 'internal', label: 'Internal', color: 'bg-maritime-700 text-maritime-300' },
  { value: 'oil_major', label: 'Oil Major', color: 'bg-orange-900/50 text-orange-400' },
]

const inspTypeMap = Object.fromEntries(inspectionTypes.map((t) => [t.value, t]))

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-900/50 text-blue-400',
  in_progress: 'bg-yellow-900/50 text-yellow-400',
  completed: 'bg-green-900/50 text-green-400',
  passed: 'bg-green-900/50 text-green-400',
  failed: 'bg-red-900/50 text-red-400',
  cancelled: 'bg-gray-800 text-gray-400',
}

const deficiencyColors: Record<string, { bg: string; label: string }> = {
  navigation: { bg: 'bg-blue-500', label: 'Nav' },
  safety: { bg: 'bg-red-500', label: 'Safety' },
  pollution: { bg: 'bg-green-500', label: 'Pollution' },
  structural: { bg: 'bg-orange-500', label: 'Structural' },
  operational: { bg: 'bg-purple-500', label: 'Operational' },
  documentation: { bg: 'bg-gray-500', label: 'Docs' },
}

function fmtDate(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString() : '-'
}

function DeficiencyBar({ row }: { row: Record<string, unknown> }) {
  const cats = ['navigation', 'safety', 'pollution', 'structural', 'operational', 'documentation']
  const values = cats.map((c) => (row[c] as number) ?? 0)
  const total = values.reduce((a, b) => a + b, 0)
  if (total === 0) return <span className="text-maritime-500 text-xs">None</span>

  return (
    <div className="flex items-center gap-1">
      <div className="flex h-4 w-24 rounded overflow-hidden">
        {cats.map((cat, i) => {
          const val = values[i]
          if (!val) return null
          const pct = (val / total) * 100
          return (
            <div
              key={cat}
              className={`${deficiencyColors[cat].bg} h-full`}
              style={{ width: `${pct}%` }}
              title={`${deficiencyColors[cat].label}: ${val}`}
            />
          )
        })}
      </div>
      <span className="text-maritime-400 text-xs">{total}</span>
    </div>
  )
}

const emptyScheduleForm = {
  vesselId: '', inspectionType: 'sire', inspectionDate: '', portOfInspection: '',
  inspectorName: '', inspectorOrg: '',
}

const emptyCompleteForm = {
  overallScore: '', grade: '', navigation: '0', safety: '0', pollution: '0',
  structural: '0', operational: '0', documentation: '0', observationsCount: '0',
  reportUrl: '', detentionIssued: false, detentionDays: '0',
}

export function VesselInspections() {
  const [vesselFilter, setVesselFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const [showComplete, setShowComplete] = useState<string | null>(null)
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm)
  const [completeForm, setCompleteForm] = useState(emptyCompleteForm)

  const queryVars: Record<string, string | undefined> = {}
  if (vesselFilter) queryVars.vesselId = vesselFilter
  if (typeFilter) queryVars.inspectionType = typeFilter
  if (statusFilter) queryVars.status = statusFilter

  const { data, loading, error, refetch } = useQuery(INSPECTIONS_QUERY, { variables: queryVars })
  const { data: dashData } = useQuery(INSPECTION_DASHBOARD_QUERY, {
    variables: { vesselId: vesselFilter || undefined },
  })
  const { data: vesselData } = useQuery(VESSELS_QUERY)
  const [scheduleInspection, { loading: scheduling }] = useMutation(SCHEDULE_INSPECTION)
  const [completeInspection, { loading: completing }] = useMutation(COMPLETE_INSPECTION)

  const inspections = data?.vesselInspections ?? []
  const dashboard = dashData?.inspectionDashboard
  const vessels = vesselData?.vessels ?? []

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    await scheduleInspection({
      variables: {
        vesselId: scheduleForm.vesselId,
        inspectionType: scheduleForm.inspectionType,
        inspectionDate: new Date(scheduleForm.inspectionDate).toISOString(),
        portOfInspection: scheduleForm.portOfInspection,
        inspectorName: scheduleForm.inspectorName || null,
        inspectorOrg: scheduleForm.inspectorOrg || null,
      },
    })
    setScheduleForm(emptyScheduleForm)
    setShowSchedule(false)
    refetch()
  }

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showComplete) return
    await completeInspection({
      variables: {
        id: showComplete,
        overallScore: Number(completeForm.overallScore),
        grade: completeForm.grade,
        navigation: Number(completeForm.navigation),
        safety: Number(completeForm.safety),
        pollution: Number(completeForm.pollution),
        structural: Number(completeForm.structural),
        operational: Number(completeForm.operational),
        documentation: Number(completeForm.documentation),
        observationsCount: Number(completeForm.observationsCount),
        reportUrl: completeForm.reportUrl || null,
        detentionIssued: completeForm.detentionIssued,
        detentionDays: completeForm.detentionIssued ? Number(completeForm.detentionDays) : null,
      },
    })
    setCompleteForm(emptyCompleteForm)
    setShowComplete(null)
    refetch()
  }

  const setSched = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setScheduleForm((f) => ({ ...f, [field]: e.target.value }))

  const setComp = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCompleteForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Vessel Inspections</h1>
          <p className="text-maritime-400 text-sm mt-1">SIRE, CDI, PSC, RightShip, and internal inspections</p>
        </div>
        <button onClick={() => setShowSchedule(true)} className={btnPrimary}>+ Schedule Inspection</button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs font-medium">Total Inspections</p>
          <p className="text-white text-xl font-bold mt-1">{dashboard?.totalInspections ?? inspections.length}</p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs font-medium">Pass Rate</p>
          <p className="text-green-400 text-xl font-bold mt-1">
            {dashboard?.passRate != null ? `${dashboard.passRate.toFixed(1)}%` : '-'}
          </p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs font-medium">Avg Score</p>
          <p className="text-white text-xl font-bold mt-1">
            {dashboard?.avgScore != null ? dashboard.avgScore.toFixed(1) : '-'}
          </p>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs font-medium">Detentions</p>
          <p className="text-red-400 text-xl font-bold mt-1">{dashboard?.detentionCount ?? 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={vesselFilter}
          onChange={(e) => setVesselFilter(e.target.value)}
          className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm"
        >
          <option value="">All Vessels</option>
          {vessels.map((v: Record<string, unknown>) => (
            <option key={v.id as string} value={v.id as string}>{v.name as string} ({v.imo as string})</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm"
        >
          <option value="">All Types</option>
          {inspectionTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm"
        >
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Deficiency Legend */}
      <div className="flex gap-4 mb-4">
        {Object.entries(deficiencyColors).map(([key, { bg, label }]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-sm ${bg}`} />
            <span className="text-maritime-400 text-xs">{label}</span>
          </div>
        ))}
      </div>

      {loading && <p className="text-maritime-400">Loading inspections...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Table */}
      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-3 py-3 font-medium">Vessel</th>
                <th className="text-left px-3 py-3 font-medium">Type</th>
                <th className="text-left px-3 py-3 font-medium">Inspector</th>
                <th className="text-left px-3 py-3 font-medium">Port</th>
                <th className="text-left px-3 py-3 font-medium">Date</th>
                <th className="text-center px-3 py-3 font-medium">Score</th>
                <th className="text-left px-3 py-3 font-medium">Deficiencies</th>
                <th className="text-center px-3 py-3 font-medium">Status</th>
                <th className="text-center px-3 py-3 font-medium">Detention</th>
                <th className="text-left px-3 py-3 font-medium">Report</th>
                <th className="text-left px-3 py-3 font-medium">Next Due</th>
                <th className="text-center px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((insp: Record<string, unknown>) => {
                const typeInfo = inspTypeMap[(insp.inspectionType as string)] ?? { label: insp.inspectionType, color: 'bg-maritime-700 text-maritime-300' }
                return (
                  <tr key={insp.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="px-3 py-3 text-white font-medium">
                      {(insp.vessel as Record<string, string>)?.name ?? '-'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-maritime-300">
                      <div>{insp.inspectorName as string || '-'}</div>
                      {insp.inspectorOrg && (
                        <div className="text-maritime-500 text-xs">{insp.inspectorOrg as string}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-maritime-300">{insp.portOfInspection as string || '-'}</td>
                    <td className="px-3 py-3 text-maritime-300 text-xs">{fmtDate(insp.inspectionDate as string)}</td>
                    <td className="px-3 py-3 text-center">
                      {(insp.overallScore as number) != null ? (
                        <div>
                          <span className="text-white font-bold">{(insp.overallScore as number).toFixed(1)}</span>
                          {insp.grade && (
                            <span className="text-maritime-400 text-xs ml-1">({insp.grade as string})</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-maritime-500">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <DeficiencyBar row={insp} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[(insp.status as string)] ?? 'bg-maritime-700 text-maritime-300'}`}>
                        {(insp.status as string).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {(insp.detentionIssued as boolean) ? (
                        <span className="px-2 py-0.5 bg-red-900/50 text-red-400 rounded text-xs font-medium">
                          {(insp.detentionDays as number) ?? 0}d
                        </span>
                      ) : (
                        <span className="text-maritime-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {insp.reportUrl ? (
                        <a href={insp.reportUrl as string} target="_blank" rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs underline">
                          View
                        </a>
                      ) : (
                        <span className="text-maritime-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-maritime-300 text-xs">{fmtDate(insp.nextInspectionDue as string)}</td>
                    <td className="px-3 py-3 text-center">
                      {((insp.status as string) === 'scheduled' || (insp.status as string) === 'in_progress') && (
                        <button
                          onClick={() => {
                            setShowComplete(insp.id as string)
                            setCompleteForm(emptyCompleteForm)
                          }}
                          className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded hover:bg-green-900/50"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {inspections.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No inspections found</p>
          )}
        </div>
      )}

      {/* Schedule Inspection Modal */}
      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule Inspection">
        <form onSubmit={handleSchedule}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Vessel *">
              <select value={scheduleForm.vesselId} onChange={setSched('vesselId')} className={selectClass} required>
                <option value="">-- Select Vessel --</option>
                {vessels.map((v: Record<string, unknown>) => (
                  <option key={v.id as string} value={v.id as string}>{v.name as string} ({v.imo as string})</option>
                ))}
              </select>
            </FormField>
            <FormField label="Inspection Type *">
              <select value={scheduleForm.inspectionType} onChange={setSched('inspectionType')} className={selectClass} required>
                {inspectionTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Inspection Date *">
              <input type="date" value={scheduleForm.inspectionDate} onChange={setSched('inspectionDate')} className={inputClass} required />
            </FormField>
            <FormField label="Port *">
              <input value={scheduleForm.portOfInspection} onChange={setSched('portOfInspection')} className={inputClass} required placeholder="Singapore" />
            </FormField>
            <FormField label="Inspector Name">
              <input value={scheduleForm.inspectorName} onChange={setSched('inspectorName')} className={inputClass} placeholder="Capt. Smith" />
            </FormField>
            <FormField label="Inspector Org">
              <input value={scheduleForm.inspectorOrg} onChange={setSched('inspectorOrg')} className={inputClass} placeholder="Lloyd's Register" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowSchedule(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={scheduling} className={btnPrimary}>
              {scheduling ? 'Scheduling...' : 'Schedule Inspection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Inspection Modal */}
      <Modal open={!!showComplete} onClose={() => setShowComplete(null)} title="Complete Inspection">
        <form onSubmit={handleComplete}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Overall Score *">
              <input type="number" step="0.1" value={completeForm.overallScore} onChange={setComp('overallScore')} className={inputClass} required placeholder="85.5" />
            </FormField>
            <FormField label="Grade *">
              <select value={completeForm.grade} onChange={setComp('grade')} className={selectClass} required>
                <option value="">-- Select --</option>
                <option value="A">A - Excellent</option>
                <option value="B">B - Good</option>
                <option value="C">C - Satisfactory</option>
                <option value="D">D - Needs Improvement</option>
                <option value="F">F - Fail</option>
              </select>
            </FormField>
          </div>

          <h4 className="text-maritime-300 text-xs font-medium mt-4 mb-2">Deficiency Counts per Category</h4>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Navigation">
              <input type="number" value={completeForm.navigation} onChange={setComp('navigation')} className={inputClass} min="0" />
            </FormField>
            <FormField label="Safety">
              <input type="number" value={completeForm.safety} onChange={setComp('safety')} className={inputClass} min="0" />
            </FormField>
            <FormField label="Pollution">
              <input type="number" value={completeForm.pollution} onChange={setComp('pollution')} className={inputClass} min="0" />
            </FormField>
            <FormField label="Structural">
              <input type="number" value={completeForm.structural} onChange={setComp('structural')} className={inputClass} min="0" />
            </FormField>
            <FormField label="Operational">
              <input type="number" value={completeForm.operational} onChange={setComp('operational')} className={inputClass} min="0" />
            </FormField>
            <FormField label="Documentation">
              <input type="number" value={completeForm.documentation} onChange={setComp('documentation')} className={inputClass} min="0" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <FormField label="Observations Count">
              <input type="number" value={completeForm.observationsCount} onChange={setComp('observationsCount')} className={inputClass} min="0" />
            </FormField>
            <FormField label="Report URL">
              <input value={completeForm.reportUrl} onChange={setComp('reportUrl')} className={inputClass} placeholder="https://..." />
            </FormField>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={completeForm.detentionIssued}
                onChange={(e) => setCompleteForm((f) => ({ ...f, detentionIssued: e.target.checked }))}
                className="rounded border-maritime-600 bg-maritime-900 text-blue-500"
              />
              <span className="text-maritime-300 text-sm">Detention Issued</span>
            </label>
            {completeForm.detentionIssued && (
              <div className="flex items-center gap-2">
                <span className="text-maritime-400 text-xs">Days:</span>
                <input
                  type="number"
                  value={completeForm.detentionDays}
                  onChange={setComp('detentionDays')}
                  className={`${inputClass} w-20`}
                  min="0"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowComplete(null)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={completing} className={btnPrimary}>
              {completing ? 'Saving...' : 'Complete Inspection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
