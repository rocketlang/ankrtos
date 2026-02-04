import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'
import { Zap, Send, FileText, Package, AlertCircle, CheckCircle, Clock } from 'lucide-react'

const PORT_AGENT_APPOINTMENTS_QUERY = gql`
  query PortAgentAppointments($status: String) {
    portAgentAppointments(status: $status) {
      id
      portCode
      vesselId
      serviceType
      status
      eta
      etb
      etd
      nominatedAt
      confirmedAt
      vessel {
        id
        name
        imo
        flag
        grt
      }
      pdas {
        id
        reference
        status
        totalAmount
        baseCurrency
        confidenceScore
        generatedAt
      }
    }
  }
`

const CREATE_APPOINTMENT = gql`
  mutation CreatePortAgentAppointment(
    $vesselId: String!
    $portCode: String!
    $eta: DateTime!
    $etb: DateTime
    $etd: DateTime
    $serviceType: String!
  ) {
    createPortAgentAppointment(
      vesselId: $vesselId
      portCode: $portCode
      eta: $eta
      etb: $etb
      etd: $etd
      serviceType: $serviceType
    ) {
      id
    }
  }
`

const GENERATE_PDA = gql`
  mutation GeneratePDA($appointmentId: String!, $baseCurrency: String, $targetCurrency: String) {
    generatePDAFromAppointment(
      appointmentId: $appointmentId
      baseCurrency: $baseCurrency
      targetCurrency: $targetCurrency
    ) {
      pdaId
      reference
      totalAmount
      baseCurrency
      totalAmountLocal
      localCurrency
      fxRate
      lineItems
      generationTime
      confidenceScore
    }
  }
`

const SEND_PDA_EMAIL = gql`
  mutation SendPDAEmail($pdaId: String!, $ownerEmail: String!) {
    sendPDAApprovalEmail(pdaId: $pdaId, ownerEmail: $ownerEmail) {
      success
      message
    }
  }
`

const statusBadge: Record<string, { bg: string; text: string; icon: any }> = {
  nominated: { bg: 'bg-blue-900/50', text: 'text-blue-400', icon: Clock },
  confirmed: { bg: 'bg-green-900/50', text: 'text-green-400', icon: CheckCircle },
  completed: { bg: 'bg-maritime-700', text: 'text-maritime-300', icon: CheckCircle },
  cancelled: { bg: 'bg-red-900/50', text: 'text-red-400', icon: AlertCircle },
}

const pdaStatusBadge: Record<string, string> = {
  draft: 'bg-gray-900/50 text-gray-400',
  sent: 'bg-blue-900/50 text-blue-400',
  approved: 'bg-green-900/50 text-green-400',
  rejected: 'bg-red-900/50 text-red-400',
}

const serviceTypeBadge: Record<string, string> = {
  husbandry: 'bg-blue-900/50 text-blue-400',
  cargo: 'bg-purple-900/50 text-purple-400',
  crew_change: 'bg-teal-900/50 text-teal-400',
  bunker: 'bg-yellow-900/50 text-yellow-400',
}

function fmt(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PortAgencyPortal() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPDAModal, setShowPDAModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [generatingPDA, setGeneratingPDA] = useState<string | null>(null)

  const { data, loading, refetch } = useQuery(PORT_AGENT_APPOINTMENTS_QUERY, {
    variables: { status: statusFilter === 'all' ? undefined : statusFilter },
    fetchPolicy: 'network-only',
  })

  const [createAppointment] = useMutation(CREATE_APPOINTMENT, {
    onCompleted: () => {
      setShowCreateModal(false)
      refetch()
    },
  })

  const [generatePDA] = useMutation(GENERATE_PDA, {
    onCompleted: (data) => {
      console.log('✅ PDA Generated:', data.generatePDAFromAppointment)
      setGeneratingPDA(null)
      refetch()
    },
    onError: (error) => {
      console.error('❌ PDA Generation Failed:', error)
      setGeneratingPDA(null)
      alert(`Failed to generate PDA: ${error.message}`)
    },
  })

  const [sendPDAEmail] = useMutation(SEND_PDA_EMAIL, {
    onCompleted: (data) => {
      if (data.sendPDAApprovalEmail.success) {
        alert(data.sendPDAApprovalEmail.message)
        refetch()
      } else {
        alert(`Failed: ${data.sendPDAApprovalEmail.message}`)
      }
    },
  })

  const appointments = data?.portAgentAppointments || []

  const handleGeneratePDA = async (appointmentId: string) => {
    if (!confirm('Generate PDA for this appointment?')) return
    setGeneratingPDA(appointmentId)
    try {
      await generatePDA({
        variables: {
          appointmentId,
          baseCurrency: 'USD',
        },
      })
    } catch (error) {
      console.error('PDA generation error:', error)
      setGeneratingPDA(null)
    }
  }

  const handleSendPDA = async (pdaId: string) => {
    const email = prompt('Enter ship owner email:')
    if (!email) return
    await sendPDAEmail({
      variables: { pdaId, ownerEmail: email },
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-maritime-950 text-maritime-100 p-6">
        <div className="text-center text-maritime-400">Loading appointments...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-maritime-950 text-maritime-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-maritime-50">Port Agency Portal</h1>
            <p className="text-maritime-400 mt-1">Manage port appointments and generate PDAs</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Package className="w-5 h-5" />
            New Appointment
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {['all', 'nominated', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-cyan-600 text-white'
                  : 'bg-maritime-800 text-maritime-300 hover:bg-maritime-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Grid */}
      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <div className="text-center py-12 text-maritime-400">
            No appointments found. Create your first appointment to get started.
          </div>
        ) : (
          appointments.map((apt: any) => {
            const StatusIcon = statusBadge[apt.status]?.icon || Clock
            const latestPDA = apt.pdas?.[0]

            return (
              <div
                key={apt.id}
                className="bg-maritime-900 border border-maritime-700 rounded-lg p-6 hover:border-maritime-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  {/* Left: Appointment Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-maritime-50">
                        {apt.vessel?.name || 'Unknown Vessel'}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge[apt.status]?.bg} ${statusBadge[apt.status]?.text} flex items-center gap-1`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {apt.status}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${serviceTypeBadge[apt.serviceType] || 'bg-maritime-800 text-maritime-300'}`}
                      >
                        {apt.serviceType}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-maritime-400">Port:</span>
                        <div className="text-maritime-100 font-medium">{apt.portCode}</div>
                      </div>
                      <div>
                        <span className="text-maritime-400">IMO:</span>
                        <div className="text-maritime-100 font-medium">{apt.vessel?.imo || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-maritime-400">ETA:</span>
                        <div className="text-maritime-100 font-medium">{fmtDate(apt.eta)}</div>
                      </div>
                      <div>
                        <span className="text-maritime-400">ETD:</span>
                        <div className="text-maritime-100 font-medium">
                          {apt.etd ? fmtDate(apt.etd) : 'TBD'}
                        </div>
                      </div>
                    </div>

                    {/* PDA Info */}
                    {latestPDA && (
                      <div className="mt-4 p-3 bg-maritime-800/50 border border-maritime-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-cyan-400" />
                            <div>
                              <div className="font-medium text-maritime-100">
                                {latestPDA.reference}
                              </div>
                              <div className="text-sm text-maritime-400">
                                {fmt(latestPDA.totalAmount, latestPDA.baseCurrency)} •{' '}
                                {latestPDA.confidenceScore
                                  ? `${(latestPDA.confidenceScore * 100).toFixed(1)}% confidence`
                                  : 'Manual entry'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${pdaStatusBadge[latestPDA.status]}`}
                            >
                              {latestPDA.status}
                            </span>
                            {latestPDA.status === 'draft' && (
                              <button
                                onClick={() => handleSendPDA(latestPDA.id)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                                Send to Owner
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    {!latestPDA && apt.status === 'confirmed' && (
                      <button
                        onClick={() => handleGeneratePDA(apt.id)}
                        disabled={generatingPDA === apt.id}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Zap className="w-4 h-4" />
                        {generatingPDA === apt.id ? 'Generating...' : 'Generate PDA'}
                      </button>
                    )}
                    {latestPDA && (
                      <button
                        onClick={() => {
                          setSelectedAppointment(apt)
                          setShowPDAModal(true)
                        }}
                        className="px-4 py-2 bg-maritime-800 hover:bg-maritime-700 text-maritime-100 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View PDA
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <CreateAppointmentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createAppointment}
        />
      )}

      {/* PDA Review Modal */}
      {showPDAModal && selectedAppointment && (
        <PDAReviewModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowPDAModal(false)
            setSelectedAppointment(null)
          }}
        />
      )}
    </div>
  )
}

function CreateAppointmentModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: any
}) {
  const [form, setForm] = useState({
    vesselId: '',
    portCode: '',
    eta: '',
    etb: '',
    etd: '',
    serviceType: 'husbandry',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({
      variables: {
        ...form,
        eta: new Date(form.eta).toISOString(),
        etb: form.etb ? new Date(form.etb).toISOString() : undefined,
        etd: form.etd ? new Date(form.etd).toISOString() : undefined,
      },
    })
  }

  return (
    <Modal onClose={onClose} title="Create Port Agent Appointment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Vessel ID" required>
          <input
            type="text"
            value={form.vesselId}
            onChange={(e) => setForm({ ...form, vesselId: e.target.value })}
            className={inputClass}
            placeholder="vessel_123"
            required
          />
        </FormField>

        <FormField label="Port Code (UNLOCODE)" required>
          <input
            type="text"
            value={form.portCode}
            onChange={(e) => setForm({ ...form, portCode: e.target.value.toUpperCase() })}
            className={inputClass}
            placeholder="SGSIN"
            maxLength={5}
            required
          />
        </FormField>

        <FormField label="Service Type" required>
          <select
            value={form.serviceType}
            onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
            className={selectClass}
          >
            <option value="husbandry">Husbandry</option>
            <option value="cargo">Cargo</option>
            <option value="crew_change">Crew Change</option>
            <option value="bunker">Bunker</option>
          </select>
        </FormField>

        <FormField label="ETA (Estimated Time of Arrival)" required>
          <input
            type="datetime-local"
            value={form.eta}
            onChange={(e) => setForm({ ...form, eta: e.target.value })}
            className={inputClass}
            required
          />
        </FormField>

        <FormField label="ETB (Estimated Time of Berthing)">
          <input
            type="datetime-local"
            value={form.etb}
            onChange={(e) => setForm({ ...form, etb: e.target.value })}
            className={inputClass}
          />
        </FormField>

        <FormField label="ETD (Estimated Time of Departure)">
          <input
            type="datetime-local"
            value={form.etd}
            onChange={(e) => setForm({ ...form, etd: e.target.value })}
            className={inputClass}
          />
        </FormField>

        <div className="flex gap-3 pt-4">
          <button type="submit" className={btnPrimary}>
            Create Appointment
          </button>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

function PDAReviewModal({ appointment, onClose }: { appointment: any; onClose: () => void }) {
  const pda = appointment.pdas?.[0]

  if (!pda) {
    return null
  }

  return (
    <Modal onClose={onClose} title={`PDA Review: ${pda.reference}`} wide>
      <div className="space-y-6">
        {/* PDA Header */}
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-maritime-400">Vessel:</span>
              <div className="text-maritime-100 font-medium">{appointment.vessel?.name}</div>
            </div>
            <div>
              <span className="text-maritime-400">Port:</span>
              <div className="text-maritime-100 font-medium">{appointment.portCode}</div>
            </div>
            <div>
              <span className="text-maritime-400">Total:</span>
              <div className="text-maritime-100 font-medium text-lg">
                {fmt(pda.totalAmount, pda.baseCurrency)}
              </div>
            </div>
            <div>
              <span className="text-maritime-400">Confidence:</span>
              <div className="text-maritime-100 font-medium">
                {pda.confidenceScore ? `${(pda.confidenceScore * 100).toFixed(1)}%` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="text-maritime-400 text-sm">
          <p>
            Full line item details are available via GraphQL query. This modal shows summary
            information.
          </p>
          <p className="mt-2">
            Status: <span className={`font-medium ${pdaStatusBadge[pda.status]}`}>{pda.status}</span>
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className={btnPrimary}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
