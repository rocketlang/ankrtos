import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const SOF_ENTRIES_QUERY = gql`
  query SofEntries($laytimeCalculationId: String!) {
    sofEntries(laytimeCalculationId: $laytimeCalculationId) {
      id eventType eventTime timeUsed excluded excludeReason remarks
      attachmentUrl attachmentType
      vesselSignOff vesselSignedBy vesselSignedAt
      agentSignOff agentSignedBy agentSignedAt
      terminalSignOff terminalSignedBy terminalSignedAt
      disputed disputeNotes
    }
    sofSignOffStatus(laytimeCalculationId: $laytimeCalculationId) {
      totalEntries vesselSignedCount agentSignedCount terminalSignedCount
      fullySignedCount disputedCount
    }
  }
`

const LAYTIME_LIST_QUERY = gql`
  query LaytimeList {
    laytimeCalculations {
      id voyageId portId type allowedHours usedHours result
      voyage { voyageNumber vessel { name } }
    }
    ports { id unlocode name }
  }
`

const VESSEL_SIGN_SOF = gql`
  mutation VesselSignSof($entryId: String!, $signedBy: String!) {
    vesselSignSof(entryId: $entryId, signedBy: $signedBy) { id vesselSignOff vesselSignedBy vesselSignedAt }
  }
`

const AGENT_SIGN_SOF = gql`
  mutation AgentSignSof($entryId: String!, $signedBy: String!) {
    agentSignSof(entryId: $entryId, signedBy: $signedBy) { id agentSignOff agentSignedBy agentSignedAt }
  }
`

const TERMINAL_SIGN_SOF = gql`
  mutation TerminalSignSof($entryId: String!, $signedBy: String!) {
    terminalSignSof(entryId: $entryId, signedBy: $signedBy) { id terminalSignOff terminalSignedBy terminalSignedAt }
  }
`

const DISPUTE_SOF_ENTRY = gql`
  mutation DisputeSofEntry($entryId: String!, $disputeNotes: String!) {
    disputeSofEntry(entryId: $entryId, disputeNotes: $disputeNotes) { id disputed disputeNotes }
  }
`

const ADD_SOF_ATTACHMENT = gql`
  mutation AddSofAttachment($entryId: String!, $attachmentUrl: String!, $attachmentType: String!) {
    addSofAttachment(entryId: $entryId, attachmentUrl: $attachmentUrl, attachmentType: $attachmentType) { id attachmentUrl attachmentType }
  }
`

const eventTypeBadgeColors: Record<string, string> = {
  nor_tendered: 'bg-blue-900/50 text-blue-400',
  nor_accepted: 'bg-cyan-900/50 text-cyan-400',
  berthed: 'bg-emerald-900/50 text-emerald-400',
  commenced_loading: 'bg-green-900/50 text-green-400',
  completed_loading: 'bg-green-900/50 text-green-300',
  commenced_discharge: 'bg-purple-900/50 text-purple-400',
  completed_discharge: 'bg-purple-900/50 text-purple-300',
  hatch_open: 'bg-orange-900/50 text-orange-400',
  hatch_closed: 'bg-orange-900/50 text-orange-300',
  rain_start: 'bg-sky-900/50 text-sky-400',
  rain_stop: 'bg-sky-900/50 text-sky-300',
  holiday: 'bg-pink-900/50 text-pink-400',
  customs_hold: 'bg-red-900/50 text-red-400',
  equipment_breakdown: 'bg-yellow-900/50 text-yellow-400',
  shift_change: 'bg-gray-800/80 text-gray-400',
}

type SofEntry = {
  id: string
  eventType: string
  eventTime: string
  timeUsed: number
  excluded: boolean
  excludeReason: string | null
  remarks: string | null
  attachmentUrl: string | null
  attachmentType: string | null
  vesselSignOff: boolean
  vesselSignedBy: string | null
  vesselSignedAt: string | null
  agentSignOff: boolean
  agentSignedBy: string | null
  agentSignedAt: string | null
  terminalSignOff: boolean
  terminalSignedBy: string | null
  terminalSignedAt: string | null
  disputed: boolean
  disputeNotes: string | null
}

type SignOffStatus = {
  totalEntries: number
  vesselSignedCount: number
  agentSignedCount: number
  terminalSignedCount: number
  fullySignedCount: number
  disputedCount: number
}

type LaytimeCalc = {
  id: string
  voyageId: string
  portId: string | null
  type: string
  allowedHours: number
  usedHours: number
  result: string
  voyage: { voyageNumber: string; vessel: { name: string } } | null
}

function fmtDateTime(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtTime(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function ProgressBar({ label, current, total, color }: { label: string; current: number; total: number; color: string }) {
  const pct = total > 0 ? (current / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-maritime-400 text-xs w-20">{label}</span>
      <div className="flex-1 bg-maritime-900 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-maritime-300 text-xs font-mono w-20 text-right">
        {current}/{total} ({pct.toFixed(0)}%)
      </span>
    </div>
  )
}

function SignOffCheckbox({
  checked,
  signedBy,
  signedAt,
  label,
  onSign,
  disabled,
}: {
  checked: boolean
  signedBy: string | null
  signedAt: string | null
  label: string
  onSign: () => void
  disabled: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => { e.stopPropagation(); if (!checked) onSign() }}
        disabled={checked || disabled}
        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
          checked
            ? 'bg-green-600 border-green-500 text-white'
            : 'bg-maritime-900 border-maritime-600 hover:border-blue-500 cursor-pointer'
        } ${disabled && !checked ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {checked && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div>
        <span className="text-maritime-400 text-[10px]">{label}</span>
        {checked && signedBy && (
          <p className="text-maritime-500 text-[9px]">{signedBy} {signedAt ? `@ ${fmtTime(signedAt)}` : ''}</p>
        )}
      </div>
    </div>
  )
}

export function SOFManager() {
  const [selectedCalc, setSelectedCalc] = useState('')
  const [signName, setSignName] = useState('')
  const [showDispute, setShowDispute] = useState<string | null>(null)
  const [disputeNotes, setDisputeNotes] = useState('')
  const [showAttachment, setShowAttachment] = useState<string | null>(null)
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [attachmentType, setAttachmentType] = useState('photo')

  const { data: laytimeData, loading: laytimeLoading } = useQuery(LAYTIME_LIST_QUERY)

  const { data: sofData, loading: sofLoading, refetch: refetchSof } = useQuery(SOF_ENTRIES_QUERY, {
    variables: { laytimeCalculationId: selectedCalc },
    skip: !selectedCalc,
  })

  const [vesselSign] = useMutation(VESSEL_SIGN_SOF)
  const [agentSign] = useMutation(AGENT_SIGN_SOF)
  const [terminalSign] = useMutation(TERMINAL_SIGN_SOF)
  const [disputeEntry, { loading: disputing }] = useMutation(DISPUTE_SOF_ENTRY)
  const [addAttachment, { loading: attaching }] = useMutation(ADD_SOF_ATTACHMENT)

  const entries: SofEntry[] = sofData?.sofEntries ?? []
  const signOffStatus: SignOffStatus | null = sofData?.sofSignOffStatus ?? null
  const calcs: LaytimeCalc[] = laytimeData?.laytimeCalculations ?? []
  const portMap = new Map(
    (laytimeData?.ports ?? []).map((p: { id: string; unlocode: string; name: string }) => [p.id, `${p.unlocode} - ${p.name}`])
  )

  const selectedCalcObj = calcs.find((c) => c.id === selectedCalc)

  const handleVesselSign = async (entryId: string) => {
    if (!signName.trim()) { alert('Enter your name to sign'); return }
    await vesselSign({ variables: { entryId, signedBy: signName } })
    refetchSof()
  }

  const handleAgentSign = async (entryId: string) => {
    if (!signName.trim()) { alert('Enter your name to sign'); return }
    await agentSign({ variables: { entryId, signedBy: signName } })
    refetchSof()
  }

  const handleTerminalSign = async (entryId: string) => {
    if (!signName.trim()) { alert('Enter your name to sign'); return }
    await terminalSign({ variables: { entryId, signedBy: signName } })
    refetchSof()
  }

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showDispute) return
    await disputeEntry({ variables: { entryId: showDispute, disputeNotes } })
    setShowDispute(null)
    setDisputeNotes('')
    refetchSof()
  }

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showAttachment) return
    await addAttachment({
      variables: { entryId: showAttachment, attachmentUrl, attachmentType },
    })
    setShowAttachment(null)
    setAttachmentUrl('')
    setAttachmentType('photo')
    refetchSof()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Statement of Facts</h1>
          <p className="text-maritime-400 text-sm mt-1">SOF timeline with multi-party sign-off and dispute management</p>
        </div>
      </div>

      {/* Selector */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div className="flex-1 min-w-72">
          <label className="block text-xs text-maritime-400 mb-1 font-medium">Laytime Calculation</label>
          <select
            value={selectedCalc}
            onChange={(e) => setSelectedCalc(e.target.value)}
            className="w-full bg-maritime-800 border border-maritime-700 text-white text-sm rounded-md px-3 py-2"
          >
            <option value="">-- Select a laytime calculation --</option>
            {laytimeLoading && <option disabled>Loading...</option>}
            {calcs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.voyage?.voyageNumber ?? 'N/A'} - {c.voyage?.vessel?.name ?? ''} | {c.type} {c.portId ? `@ ${portMap.get(c.portId) ?? ''}` : ''} | {c.result.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="w-48">
          <label className="block text-xs text-maritime-400 mb-1 font-medium">Sign as (your name)</label>
          <input
            value={signName}
            onChange={(e) => setSignName(e.target.value)}
            className="w-full bg-maritime-800 border border-maritime-700 text-white text-sm rounded-md px-3 py-2"
            placeholder="Captain Singh"
          />
        </div>
      </div>

      {!selectedCalc && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <span className="text-4xl block mb-4">&#x1F4CB;</span>
          <h3 className="text-white font-medium">Select a Laytime Calculation</h3>
          <p className="text-maritime-400 text-sm mt-2">
            Choose a laytime calculation above to view and manage its Statement of Facts entries.
          </p>
        </div>
      )}

      {selectedCalc && sofLoading && <p className="text-maritime-400">Loading SOF entries...</p>}

      {selectedCalc && !sofLoading && (
        <>
          {/* Selected Calc Info */}
          {selectedCalcObj && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-white font-medium">{selectedCalcObj.voyage?.voyageNumber ?? 'N/A'}</span>
                    <span className="text-maritime-500 text-xs ml-2">{selectedCalcObj.voyage?.vessel?.name ?? ''}</span>
                  </div>
                  <span className="text-maritime-400 text-xs capitalize">{selectedCalcObj.type}</span>
                  {selectedCalcObj.portId && (
                    <span className="text-maritime-400 text-xs">@ {portMap.get(selectedCalcObj.portId) ?? ''}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-maritime-400 text-xs">
                    {selectedCalcObj.usedHours.toFixed(1)}h / {selectedCalcObj.allowedHours}h
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    selectedCalcObj.result === 'on_demurrage' ? 'bg-red-900/50 text-red-400'
                    : selectedCalcObj.result === 'on_despatch' ? 'bg-blue-900/50 text-blue-400'
                    : selectedCalcObj.result === 'within_laytime' ? 'bg-green-900/50 text-green-400'
                    : 'bg-gray-800 text-gray-400'
                  }`}>
                    {selectedCalcObj.result.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sign-off Progress */}
          {signOffStatus && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-sm font-medium">Sign-off Progress</h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green-400">
                    {signOffStatus.fullySignedCount}/{signOffStatus.totalEntries} fully signed
                  </span>
                  {signOffStatus.disputedCount > 0 && (
                    <span className="text-yellow-400">
                      {signOffStatus.disputedCount} disputed
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2.5">
                <ProgressBar
                  label="Vessel"
                  current={signOffStatus.vesselSignedCount}
                  total={signOffStatus.totalEntries}
                  color="bg-blue-500"
                />
                <ProgressBar
                  label="Agent"
                  current={signOffStatus.agentSignedCount}
                  total={signOffStatus.totalEntries}
                  color="bg-emerald-500"
                />
                <ProgressBar
                  label="Terminal"
                  current={signOffStatus.terminalSignedCount}
                  total={signOffStatus.totalEntries}
                  color="bg-purple-500"
                />
              </div>
            </div>
          )}

          {/* Timeline View */}
          {entries.length === 0 && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-8 text-center">
              <p className="text-maritime-500 text-sm">No SOF entries found for this calculation.</p>
            </div>
          )}

          {entries.length > 0 && (
            <div className="space-y-3">
              {entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`bg-maritime-800 border rounded-lg overflow-hidden ${
                    entry.disputed ? 'border-yellow-700' : 'border-maritime-700'
                  }`}
                >
                  <div className="px-4 py-3">
                    {/* Event header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {/* Timeline connector */}
                        <div className="flex flex-col items-center w-6">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            entry.excluded ? 'bg-maritime-600' : entry.disputed ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                          {idx < entries.length - 1 && (
                            <div className="w-px h-4 bg-maritime-700 mt-0.5" />
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          eventTypeBadgeColors[entry.eventType] ?? 'bg-maritime-700 text-maritime-300'
                        }`}>
                          {entry.eventType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-white text-xs font-mono">{fmtDateTime(entry.eventTime)}</span>
                        <span className="text-maritime-400 text-xs">
                          {entry.timeUsed > 0 ? `${entry.timeUsed.toFixed(1)} hrs` : ''}
                        </span>
                        {entry.excluded && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-900/30 text-red-400 font-medium">
                            EXCLUDED {entry.excludeReason ? `(${entry.excludeReason.replace(/_/g, ' ')})` : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.disputed && (
                          <span className="flex items-center gap-1 text-yellow-400 text-xs">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Disputed
                          </span>
                        )}
                        {!entry.disputed && (
                          <button
                            onClick={() => { setShowDispute(entry.id); setDisputeNotes('') }}
                            className="text-maritime-500 hover:text-yellow-400 text-[10px]"
                          >
                            Dispute
                          </button>
                        )}
                        <button
                          onClick={() => { setShowAttachment(entry.id); setAttachmentUrl(''); setAttachmentType('photo') }}
                          className="text-maritime-500 hover:text-blue-400 text-[10px]"
                        >
                          + Attach
                        </button>
                      </div>
                    </div>

                    {/* Remarks */}
                    {entry.remarks && (
                      <div className="ml-9 mb-2">
                        <p className="text-maritime-300 text-xs">{entry.remarks}</p>
                      </div>
                    )}

                    {/* Dispute Notes */}
                    {entry.disputed && entry.disputeNotes && (
                      <div className="ml-9 mb-2 bg-yellow-900/20 border border-yellow-900/50 rounded px-3 py-2">
                        <p className="text-yellow-400 text-[10px] font-medium mb-0.5">Dispute Notes:</p>
                        <p className="text-maritime-300 text-xs">{entry.disputeNotes}</p>
                      </div>
                    )}

                    {/* Attachment */}
                    {entry.attachmentUrl && (
                      <div className="ml-9 mb-2">
                        <a
                          href={entry.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {entry.attachmentType ?? 'Attachment'} attached
                        </a>
                      </div>
                    )}

                    {/* Sign-off row */}
                    <div className="ml-9 flex items-center gap-6 pt-2 border-t border-maritime-700/50">
                      <SignOffCheckbox
                        checked={entry.vesselSignOff}
                        signedBy={entry.vesselSignedBy}
                        signedAt={entry.vesselSignedAt}
                        label="Vessel"
                        onSign={() => handleVesselSign(entry.id)}
                        disabled={!signName.trim()}
                      />
                      <SignOffCheckbox
                        checked={entry.agentSignOff}
                        signedBy={entry.agentSignedBy}
                        signedAt={entry.agentSignedAt}
                        label="Agent"
                        onSign={() => handleAgentSign(entry.id)}
                        disabled={!signName.trim()}
                      />
                      <SignOffCheckbox
                        checked={entry.terminalSignOff}
                        signedBy={entry.terminalSignedBy}
                        signedAt={entry.terminalSignedAt}
                        label="Terminal"
                        onSign={() => handleTerminalSign(entry.id)}
                        disabled={!signName.trim()}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Dispute Modal */}
      <Modal open={!!showDispute} onClose={() => setShowDispute(null)} title="Dispute SOF Entry">
        <form onSubmit={handleDispute}>
          <p className="text-maritime-400 text-xs mb-3">
            Entry: <span className="text-white font-mono">{showDispute?.slice(0, 8)}...</span>
          </p>
          <FormField label="Dispute Notes *">
            <textarea
              value={disputeNotes}
              onChange={(e) => setDisputeNotes(e.target.value)}
              className={inputClass}
              rows={4}
              required
              placeholder="Describe the reason for disputing this SOF entry..."
            />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowDispute(null)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={disputing} className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50">
              {disputing ? 'Filing...' : 'File Dispute'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Attachment Modal */}
      <Modal open={!!showAttachment} onClose={() => setShowAttachment(null)} title="Add Attachment">
        <form onSubmit={handleAddAttachment}>
          <FormField label="Attachment URL *">
            <input
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              className={inputClass}
              required
              placeholder="https://storage.example.com/photo.jpg"
            />
          </FormField>
          <FormField label="Attachment Type *">
            <select
              value={attachmentType}
              onChange={(e) => setAttachmentType(e.target.value)}
              className={selectClass}
              required
            >
              <option value="photo">Photo</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
              <option value="survey_report">Survey Report</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAttachment(null)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={attaching} className={btnPrimary}>
              {attaching ? 'Attaching...' : 'Add Attachment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
