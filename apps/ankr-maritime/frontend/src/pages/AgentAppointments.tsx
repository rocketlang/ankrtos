import { useQuery, useMutation, gql } from '@apollo/client'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const APPOINTMENTS_QUERY = gql`
  query AgentAppointments($status: String) {
    agentAppointments(status: $status) {
      id agentId voyageId portName serviceType status appointedDate
      startDate endDate estimatedCost actualCost currency performanceRating
      agent { companyName }
    }
    portAgents {
      id companyName serviceTypes
    }
  }
`

const APPOINT_AGENT = gql`
  mutation AppointAgent(
    $agentId: String!, $voyageId: String, $portName: String!, $serviceType: String!,
    $estimatedCost: Float, $instructions: String
  ) {
    appointAgent(
      agentId: $agentId, voyageId: $voyageId, portName: $portName, serviceType: $serviceType,
      estimatedCost: $estimatedCost, instructions: $instructions
    ) { id }
  }
`

const CONFIRM_APPOINTMENT = gql`
  mutation ConfirmAppointment($id: String!) {
    confirmAppointment(id: $id) { id status }
  }
`

const COMPLETE_APPOINTMENT = gql`
  mutation CompleteAppointment($id: String!, $actualCost: Float, $performanceRating: Int, $performanceNotes: String) {
    completeAppointment(id: $id, actualCost: $actualCost, performanceRating: $performanceRating, performanceNotes: $performanceNotes) { id status }
  }
`

const CANCEL_APPOINTMENT = gql`
  mutation CancelAppointment($id: String!) {
    cancelAppointment(id: $id) { id status }
  }
`

const statusOptions = ['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled']

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-900/50 text-yellow-400',
  confirmed: 'bg-blue-900/50 text-blue-400',
  active: 'bg-cyan-900/50 text-cyan-400',
  completed: 'bg-green-900/50 text-green-400',
  cancelled: 'bg-red-900/50 text-red-400',
}

const serviceTypeBadge: Record<string, string> = {
  husbandry: 'bg-blue-900/50 text-blue-400',
  protective: 'bg-purple-900/50 text-purple-400',
  liner: 'bg-teal-900/50 text-teal-400',
  customs: 'bg-yellow-900/50 text-yellow-400',
  forwarding: 'bg-green-900/50 text-green-400',
}

function fmt(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.3
  const sz = size === 'lg' ? 'text-lg' : 'text-sm'
  return (
    <span className={`${sz} inline-flex gap-0.5`}>
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < full ? 'text-yellow-400' : (i === full && half) ? 'text-yellow-600' : 'text-maritime-700'}>
          &#9733;
        </span>
      ))}
    </span>
  )
}

function ClickableStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2 items-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl transition-colors ${
            n <= value ? 'text-yellow-400' : 'text-maritime-700 hover:text-maritime-500'
          }`}
        >
          &#9733;
        </button>
      ))}
      <span className="text-white text-sm ml-2">{value}/5</span>
    </div>
  )
}

const emptyAppointForm = {
  agentId: '', voyageId: '', portName: '', serviceType: 'husbandry',
  estimatedCost: '', instructions: '',
}

const emptyCompleteForm = {
  actualCost: '', performanceRating: 5, performanceNotes: '',
}

export function AgentAppointments() {
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAppoint, setShowAppoint] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [completeId, setCompleteId] = useState<string | null>(null)
  const [appointForm, setAppointForm] = useState(emptyAppointForm)
  const [completeForm, setCompleteForm] = useState(emptyCompleteForm)

  const { data, loading, error, refetch } = useQuery(APPOINTMENTS_QUERY, {
    variables: {
      status: filterStatus !== 'all' ? filterStatus : undefined,
    },
  })

  const [appointAgent, { loading: appointing }] = useMutation(APPOINT_AGENT)
  const [confirmAppointment] = useMutation(CONFIRM_APPOINTMENT)
  const [completeAppointment, { loading: completing }] = useMutation(COMPLETE_APPOINTMENT)
  const [cancelAppointment] = useMutation(CANCEL_APPOINTMENT)

  const appointments = data?.agentAppointments ?? []
  const agents = data?.portAgents ?? []

  const stats = useMemo(() => {
    const all = appointments as Array<Record<string, unknown>>
    const pending = all.filter((a) => a.status === 'pending').length
    const active = all.filter((a) => a.status === 'active' || a.status === 'confirmed').length
    const now = new Date()
    const completedThisMonth = all.filter((a) => {
      if (a.status !== 'completed') return false
      const d = a.endDate ? new Date(a.endDate as string) : null
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    return { total: all.length, pending, active, completedThisMonth }
  }, [appointments])

  const handleAppoint = async (e: React.FormEvent) => {
    e.preventDefault()
    await appointAgent({
      variables: {
        agentId: appointForm.agentId,
        voyageId: appointForm.voyageId || null,
        portName: appointForm.portName,
        serviceType: appointForm.serviceType,
        estimatedCost: appointForm.estimatedCost ? Number(appointForm.estimatedCost) : null,
        instructions: appointForm.instructions || null,
      },
    })
    setAppointForm(emptyAppointForm)
    setShowAppoint(false)
    refetch()
  }

  const handleConfirm = async (id: string) => {
    await confirmAppointment({ variables: { id } })
    refetch()
  }

  const openComplete = (id: string) => {
    setCompleteId(id)
    setCompleteForm(emptyCompleteForm)
    setShowComplete(true)
  }

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!completeId) return
    await completeAppointment({
      variables: {
        id: completeId,
        actualCost: completeForm.actualCost ? Number(completeForm.actualCost) : null,
        performanceRating: completeForm.performanceRating,
        performanceNotes: completeForm.performanceNotes || null,
      },
    })
    setShowComplete(false)
    setCompleteId(null)
    refetch()
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return
    await cancelAppointment({ variables: { id } })
    refetch()
  }

  const setA = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setAppointForm((f) => ({ ...f, [field]: e.target.value }))

  const setC = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCompleteForm((f) => ({ ...f, [field]: e.target.value }))

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Appointments</h1>
          <p className="text-maritime-400 text-sm mt-1">Appoint, track and evaluate port agent engagements</p>
        </div>
        <button onClick={() => setShowAppoint(true)} className={btnPrimary}>+ Appoint Agent</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-white', border: 'border-maritime-500' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-400', border: 'border-yellow-500' },
          { label: 'Active', value: stats.active, color: 'text-cyan-400', border: 'border-cyan-500' },
          { label: 'Completed This Month', value: stats.completedThisMonth, color: 'text-green-400', border: 'border-green-500' },
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
      {loading && <p className="text-maritime-400">Loading appointments...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Table */}
      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Agent</th>
                <th className="text-left px-4 py-3 font-medium">Port</th>
                <th className="text-left px-4 py-3 font-medium">Service</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Appointed</th>
                <th className="text-right px-4 py-3 font-medium">Est. Cost</th>
                <th className="text-right px-4 py-3 font-medium">Actual Cost</th>
                <th className="text-center px-4 py-3 font-medium">Rating</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(appointments as Array<Record<string, unknown>>).map((apt) => {
                const agent = apt.agent as Record<string, unknown> | null
                const status = apt.status as string
                return (
                  <tr key={apt.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="px-4 py-3 text-white text-xs font-medium">
                      {agent?.companyName as string ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-xs">{apt.portName as string}</td>
                    <td className="px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${serviceTypeBadge[apt.serviceType as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                        {apt.serviceType as string}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusBadge[status] ?? ''}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">
                      {fmtDate(apt.appointedDate as string)}
                    </td>
                    <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">
                      {apt.estimatedCost ? fmt(apt.estimatedCost as number, (apt.currency as string) ?? 'USD') : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {apt.actualCost ? (
                        <span className={
                          (apt.actualCost as number) > (apt.estimatedCost as number ?? 0)
                            ? 'text-red-400'
                            : 'text-green-400'
                        }>
                          {fmt(apt.actualCost as number, (apt.currency as string) ?? 'USD')}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {status === 'completed' && apt.performanceRating ? (
                        <Stars rating={apt.performanceRating as number} />
                      ) : (
                        <span className="text-maritime-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        {status === 'pending' && (
                          <button
                            onClick={() => handleConfirm(apt.id as string)}
                            className="text-blue-400 hover:text-blue-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded"
                          >
                            Confirm
                          </button>
                        )}
                        {(status === 'confirmed' || status === 'active') && (
                          <button
                            onClick={() => openComplete(apt.id as string)}
                            className="text-green-400 hover:text-green-300 text-[10px] bg-green-900/30 px-1.5 py-0.5 rounded"
                          >
                            Complete
                          </button>
                        )}
                        {status !== 'completed' && status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(apt.id as string)}
                            className="text-red-400 hover:text-red-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {appointments.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No appointments found</p>
          )}
        </div>
      )}

      {/* Appoint Agent Modal */}
      <Modal open={showAppoint} onClose={() => setShowAppoint(false)} title="Appoint Agent">
        <form onSubmit={handleAppoint}>
          <FormField label="Agent *">
            <select value={appointForm.agentId} onChange={setA('agentId')} className={selectClass} required>
              <option value="">-- Select Agent --</option>
              {(agents as Array<Record<string, unknown>>).map((ag) => (
                <option key={ag.id as string} value={ag.id as string}>
                  {ag.companyName as string}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Port Name *">
              <input value={appointForm.portName} onChange={setA('portName')} className={inputClass} required placeholder="Singapore" />
            </FormField>
            <FormField label="Service Type *">
              <select value={appointForm.serviceType} onChange={setA('serviceType')} className={selectClass} required>
                <option value="husbandry">Husbandry</option>
                <option value="protective">Protective</option>
                <option value="liner">Liner</option>
                <option value="customs">Customs</option>
                <option value="forwarding">Forwarding</option>
              </select>
            </FormField>
            <FormField label="Voyage Ref (optional)">
              <input value={appointForm.voyageId} onChange={setA('voyageId')} className={inputClass} placeholder="V-2026-001" />
            </FormField>
            <FormField label="Estimated Cost ($)">
              <input type="number" step="any" value={appointForm.estimatedCost} onChange={setA('estimatedCost')} className={inputClass} placeholder="5000" />
            </FormField>
          </div>
          <FormField label="Instructions">
            <textarea
              value={appointForm.instructions}
              onChange={setA('instructions')}
              className={`${inputClass} h-20 resize-none`}
              placeholder="Special requirements, crew change details, etc."
            />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAppoint(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={appointing} className={btnPrimary}>
              {appointing ? 'Appointing...' : 'Appoint Agent'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Appointment Modal */}
      <Modal open={showComplete} onClose={() => { setShowComplete(false); setCompleteId(null) }} title="Complete Appointment">
        <form onSubmit={handleComplete}>
          <FormField label="Actual Cost ($)">
            <input
              type="number"
              step="any"
              value={completeForm.actualCost}
              onChange={setC('actualCost')}
              className={inputClass}
              placeholder="4800"
            />
          </FormField>
          <FormField label="Performance Rating *">
            <ClickableStars
              value={completeForm.performanceRating}
              onChange={(v) => setCompleteForm((f) => ({ ...f, performanceRating: v }))}
            />
          </FormField>
          <FormField label="Performance Notes">
            <textarea
              value={completeForm.performanceNotes}
              onChange={setC('performanceNotes')}
              className={`${inputClass} h-20 resize-none`}
              placeholder="Agent was responsive and handled customs efficiently..."
            />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => { setShowComplete(false); setCompleteId(null) }} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={completing} className={btnPrimary}>
              {completing ? 'Completing...' : 'Mark Complete'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
