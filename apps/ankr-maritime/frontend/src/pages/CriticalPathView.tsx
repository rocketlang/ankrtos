import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const CRITICAL_PATH_QUERY = gql`
  query CriticalPath($voyageId: String!) {
    criticalPath(voyageId: $voyageId) {
      id name description category plannedStart plannedEnd actualStart actualEnd
      duration progress status isCritical dependsOn estimatedDelay
      assignedTo
    }
  }
`

const CRITICAL_PATH_ANALYSIS = gql`
  query CriticalPathAnalysis($voyageId: String!) {
    criticalPathAnalysis(voyageId: $voyageId) {
      totalItems completedItems criticalItems estimatedTotalDelay
      completionPercentage longestPath
    }
  }
`

const VOYAGES_QUERY = gql`
  query Voyages { voyages { id voyageNumber vessel { name } } }
`

const ADD_CRITICAL_PATH_ITEM = gql`
  mutation AddCriticalPathItem(
    $voyageId: String!, $name: String!, $category: String!,
    $plannedStart: String!, $plannedEnd: String!, $isCritical: Boolean,
    $dependsOn: [String!], $assignedTo: String, $description: String
  ) {
    addCriticalPathItem(
      voyageId: $voyageId, name: $name, category: $category,
      plannedStart: $plannedStart, plannedEnd: $plannedEnd, isCritical: $isCritical,
      dependsOn: $dependsOn, assignedTo: $assignedTo, description: $description
    ) { id }
  }
`

const UPDATE_PROGRESS = gql`
  mutation UpdateCriticalPathProgress($id: String!, $progress: Int!, $status: String, $actualStart: String, $actualEnd: String) {
    updateCriticalPathProgress(id: $id, progress: $progress, status: $status, actualStart: $actualStart, actualEnd: $actualEnd) { id }
  }
`

const categories = ['loading', 'discharge', 'transit', 'documentation', 'inspection', 'bunkering', 'customs', 'maintenance']

const statusColors: Record<string, string> = {
  pending: 'bg-maritime-600',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  delayed: 'bg-orange-500',
  blocked: 'bg-red-500',
}

const emptyForm = {
  name: '', category: 'loading', plannedStart: '', plannedEnd: '',
  isCritical: false, dependsOn: '' as string, assignedTo: '', description: '',
}

const emptyProgress = { progress: '', status: 'in_progress', actualStart: '', actualEnd: '' }

export function CriticalPathView() {
  const [voyageId, setVoyageId] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showProgress, setShowProgress] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [progressForm, setProgressForm] = useState(emptyProgress)

  const { data: voyageData } = useQuery(VOYAGES_QUERY)
  const { data: pathData, loading, refetch: refetchPath } = useQuery(CRITICAL_PATH_QUERY, {
    variables: { voyageId },
    skip: !voyageId,
  })
  const { data: analysisData, refetch: refetchAnalysis } = useQuery(CRITICAL_PATH_ANALYSIS, {
    variables: { voyageId },
    skip: !voyageId,
  })
  const [addItem, { loading: adding }] = useMutation(ADD_CRITICAL_PATH_ITEM)
  const [updateProgress, { loading: updating }] = useMutation(UPDATE_PROGRESS)

  const voyages = voyageData?.voyages ?? []
  const items = pathData?.criticalPath ?? []
  const analysis = analysisData?.criticalPathAnalysis

  const refetchAll = () => { refetchPath(); refetchAnalysis() }

  const sortedItems = [...items].sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
    const aStart = new Date(a.plannedStart as string).getTime()
    const bStart = new Date(b.plannedStart as string).getTime()
    return aStart - bStart
  })

  // Calculate chart dimensions
  const allDates = items.flatMap((item: Record<string, unknown>) => [
    new Date(item.plannedStart as string).getTime(),
    new Date(item.plannedEnd as string).getTime(),
  ])
  const minDate = allDates.length > 0 ? Math.min(...allDates) : Date.now()
  const maxDate = allDates.length > 0 ? Math.max(...allDates) : Date.now() + 86400000 * 30
  const totalSpan = maxDate - minDate || 1

  const getBarPosition = (start: string, end: string) => {
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    const left = ((startTime - minDate) / totalSpan) * 100
    const width = ((endTime - startTime) / totalSpan) * 100
    return { left: `${Math.max(0, left)}%`, width: `${Math.max(2, width)}%` }
  }

  const getBarColor = (item: Record<string, unknown>) => {
    if (item.status === 'completed') return 'bg-green-500'
    if (item.status === 'delayed') return 'bg-orange-500'
    if (item.isCritical) return 'bg-red-500'
    return 'bg-blue-500'
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.plannedStart || !form.plannedEnd) return
    await addItem({
      variables: {
        voyageId,
        name: form.name,
        category: form.category,
        plannedStart: form.plannedStart,
        plannedEnd: form.plannedEnd,
        isCritical: form.isCritical,
        dependsOn: form.dependsOn ? form.dependsOn.split(',').map((s: string) => s.trim()) : [],
        assignedTo: form.assignedTo || undefined,
        description: form.description || undefined,
      },
    })
    setForm(emptyForm)
    setShowAdd(false)
    refetchAll()
  }

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showProgress || !progressForm.progress) return
    await updateProgress({
      variables: {
        id: showProgress,
        progress: parseInt(progressForm.progress),
        status: progressForm.status,
        actualStart: progressForm.actualStart || undefined,
        actualEnd: progressForm.actualEnd || undefined,
      },
    })
    setShowProgress(null)
    setProgressForm(emptyProgress)
    refetchAll()
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const setP = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setProgressForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Critical Path</h1>
          <p className="text-maritime-400 text-sm mt-1">Voyage milestone tracking and critical path analysis</p>
        </div>
        <div className="flex gap-3">
          <select value={voyageId} onChange={(e) => setVoyageId(e.target.value)}
            className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
            <option value="">Select Voyage</option>
            {voyages.map((v: Record<string, unknown>) => (
              <option key={v.id as string} value={v.id as string}>
                {v.voyageNumber as string} — {(v.vessel as Record<string, unknown>)?.name as string}
              </option>
            ))}
          </select>
          {voyageId && (
            <button onClick={() => setShowAdd(true)} className={btnPrimary}>+ Add Item</button>
          )}
        </div>
      </div>

      {!voyageId && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <p className="text-maritime-500 text-lg">Select a voyage to view the critical path</p>
        </div>
      )}

      {/* Summary Bar */}
      {analysis && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div>
              <p className="text-maritime-500 text-xs">Total Items</p>
              <p className="text-white text-xl font-bold">{analysis.totalItems}</p>
            </div>
            <div>
              <p className="text-maritime-500 text-xs">Completed</p>
              <p className="text-green-400 text-xl font-bold">{analysis.completedItems}</p>
            </div>
            <div>
              <p className="text-maritime-500 text-xs">Critical Items</p>
              <p className="text-red-400 text-xl font-bold">{analysis.criticalItems}</p>
            </div>
            <div>
              <p className="text-maritime-500 text-xs">Est. Delay</p>
              <p className="text-orange-400 text-xl font-bold">{analysis.estimatedTotalDelay}h</p>
            </div>
            <div>
              <p className="text-maritime-500 text-xs">Completion</p>
              <p className="text-blue-400 text-xl font-bold">{analysis.completionPercentage}%</p>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-maritime-700 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${analysis.completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Gantt Chart */}
      {voyageId && sortedItems.length > 0 && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5 overflow-x-auto">
          <h2 className="text-white font-semibold text-sm mb-4">Gantt View</h2>
          <div className="space-y-2 min-w-[600px]">
            {sortedItems.map((item: Record<string, unknown>) => {
              const pos = getBarPosition(item.plannedStart as string, item.plannedEnd as string)
              const barColor = getBarColor(item)
              const progress = (item.progress as number) ?? 0
              const hasDeps = item.dependsOn && (item.dependsOn as string[]).length > 0
              return (
                <div key={item.id as string} className="flex items-center gap-3">
                  {/* Label */}
                  <div className="w-40 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      {item.isCritical && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                      <span className="text-white text-xs font-medium truncate">{item.name as string}</span>
                    </div>
                    <span className="text-maritime-500 text-[10px] capitalize">{(item.category as string).replace(/_/g, ' ')}</span>
                  </div>
                  {/* Bar Area */}
                  <div className="flex-1 relative h-8 bg-maritime-900/50 rounded">
                    {hasDeps && (
                      <div className="absolute top-1/2 left-0 w-full h-0 border-t border-dashed border-maritime-600 -translate-y-1/2 z-0" />
                    )}
                    <div
                      className={`absolute top-1 h-6 rounded ${barColor} opacity-80 z-10 flex items-center justify-end pr-1.5`}
                      style={{ left: pos.left, width: pos.width }}
                    >
                      <span className="text-white text-[9px] font-bold">{progress}%</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <button
                    onClick={() => { setShowProgress(item.id as string); setProgressForm({ progress: String(progress), status: (item.status as string) || 'in_progress', actualStart: '', actualEnd: '' }) }}
                    className="text-blue-400 hover:text-blue-300 text-[10px] flex-shrink-0">
                    Update
                  </button>
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-3 border-t border-maritime-700">
            <div className="flex items-center gap-1.5 text-[10px] text-maritime-400">
              <span className="w-3 h-2 rounded bg-red-500" /> Critical Path
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-maritime-400">
              <span className="w-3 h-2 rounded bg-green-500" /> Completed
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-maritime-400">
              <span className="w-3 h-2 rounded bg-orange-500" /> Delayed
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-maritime-400">
              <span className="w-3 h-2 rounded bg-blue-500" /> In Progress
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-maritime-400">
              <span className="w-8 border-t border-dashed border-maritime-600" /> Dependency
            </div>
          </div>
        </div>
      )}

      {/* Items Table */}
      {voyageId && !loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Planned Start</th>
                <th className="text-left px-4 py-3">Planned End</th>
                <th className="text-center px-4 py-3">Progress</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Critical</th>
                <th className="text-center px-4 py-3">Delay</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-maritime-500">No critical path items</td></tr>
              )}
              {sortedItems.map((item: Record<string, unknown>) => (
                <tr key={item.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                  <td className="px-4 py-3 text-white text-xs font-medium">{item.name as string}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs capitalize">{(item.category as string).replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">
                    {new Date(item.plannedStart as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">
                    {new Date(item.plannedEnd as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 bg-maritime-700 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(item.progress as number) ?? 0}%` }} />
                      </div>
                      <span className="text-maritime-300 text-[10px]">{(item.progress as number) ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusColors[(item.status as string)] ?? 'bg-maritime-600'}`} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.isCritical ? (
                      <span className="text-red-400 text-xs font-bold">YES</span>
                    ) : (
                      <span className="text-maritime-600 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(item.estimatedDelay as number) ? (
                      <span className="text-orange-400 text-xs font-mono">{item.estimatedDelay as number}h</span>
                    ) : (
                      <span className="text-maritime-600 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && voyageId && <p className="text-maritime-400">Loading critical path...</p>}

      {/* Add Item Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Critical Path Item">
        <form onSubmit={handleAdd}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Name *">
              <input value={form.name} onChange={set('name')} className={inputClass} required placeholder="Cargo Loading" />
            </FormField>
            <FormField label="Category *">
              <select value={form.category} onChange={set('category')} className={selectClass} required>
                {categories.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Planned Start *">
              <input type="datetime-local" value={form.plannedStart} onChange={set('plannedStart')} className={inputClass} required />
            </FormField>
            <FormField label="Planned End *">
              <input type="datetime-local" value={form.plannedEnd} onChange={set('plannedEnd')} className={inputClass} required />
            </FormField>
            <FormField label="Assigned To">
              <input value={form.assignedTo} onChange={set('assignedTo')} className={inputClass} placeholder="Chief Officer" />
            </FormField>
            <FormField label="Depends On (comma-separated IDs)">
              <input value={form.dependsOn} onChange={set('dependsOn')} className={inputClass} placeholder="id1, id2" />
            </FormField>
          </div>
          <FormField label="Description">
            <textarea value={form.description} onChange={set('description')} rows={2} className={inputClass} placeholder="Item description..." />
          </FormField>
          <div className="flex items-center gap-2 mb-4">
            <input type="checkbox" checked={form.isCritical}
              onChange={(e) => setForm((f) => ({ ...f, isCritical: e.target.checked }))}
              className="rounded border-maritime-600" />
            <span className="text-maritime-300 text-sm">Mark as critical path item</span>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={adding} className={btnPrimary}>
              {adding ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Progress Modal */}
      <Modal open={!!showProgress} onClose={() => setShowProgress(null)} title="Update Progress">
        <form onSubmit={handleUpdateProgress}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Progress (0-100) *">
              <input type="number" min="0" max="100" value={progressForm.progress} onChange={setP('progress')}
                className={inputClass} required placeholder="50" />
            </FormField>
            <FormField label="Status">
              <select value={progressForm.status} onChange={setP('status')} className={selectClass}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
                <option value="blocked">Blocked</option>
              </select>
            </FormField>
            <FormField label="Actual Start">
              <input type="datetime-local" value={progressForm.actualStart} onChange={setP('actualStart')} className={inputClass} />
            </FormField>
            <FormField label="Actual End">
              <input type="datetime-local" value={progressForm.actualEnd} onChange={setP('actualEnd')} className={inputClass} />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowProgress(null)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={updating} className={btnPrimary}>
              {updating ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
