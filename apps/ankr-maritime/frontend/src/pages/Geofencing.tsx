import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const GEOFENCES_QUERY = gql`
  query Geofences {
    geofences {
      id name centerLat centerLon radiusNm fenceType active vesselIds
      alertOnEntry alertOnExit dwellThresholdHrs
      alerts { id eventType acknowledged createdAt }
    }
  }
`

const GEOFENCE_ALERTS_QUERY = gql`
  query GeofenceAlerts {
    geofenceAlerts(acknowledged: false) {
      id vesselId eventType latitude longitude speed createdAt
      geofence { name }
    }
  }
`

const CREATE_GEOFENCE = gql`
  mutation CreateGeofence(
    $name: String!, $centerLat: Float!, $centerLon: Float!, $radiusNm: Float!,
    $fenceType: String!, $alertOnEntry: Boolean, $alertOnExit: Boolean, $dwellThresholdHrs: Float
  ) {
    createGeofence(
      name: $name, centerLat: $centerLat, centerLon: $centerLon, radiusNm: $radiusNm,
      fenceType: $fenceType, alertOnEntry: $alertOnEntry, alertOnExit: $alertOnExit,
      dwellThresholdHrs: $dwellThresholdHrs
    ) { id }
  }
`

const ACKNOWLEDGE_ALERT = gql`
  mutation AcknowledgeGeofenceAlert($id: String!, $notes: String) {
    acknowledgeGeofenceAlert(id: $id, notes: $notes) { id }
  }
`

const DELETE_GEOFENCE = gql`
  mutation DeleteGeofence($id: String!) {
    deleteGeofence(id: $id) { id }
  }
`

const fenceTypeLabels: Record<string, string> = {
  circle: 'Circle',
  polygon: 'Polygon',
  port_area: 'Port Area',
}

const fenceTypes = ['circle', 'polygon', 'port_area']

const eventTypeBadge: Record<string, string> = {
  entry: 'bg-green-900/50 text-green-400',
  exit: 'bg-red-900/50 text-red-400',
  dwell_exceeded: 'bg-yellow-900/50 text-yellow-400',
}

const emptyForm = {
  name: '', centerLat: '', centerLon: '', radiusNm: '',
  fenceType: 'circle', alertOnEntry: true, alertOnExit: true, dwellThresholdHrs: '',
}

export function Geofencing() {
  const { data, loading, error, refetch } = useQuery(GEOFENCES_QUERY)
  const { data: alertsData, loading: alertsLoading, refetch: refetchAlerts } = useQuery(GEOFENCE_ALERTS_QUERY)
  const [createGeofence, { loading: creating }] = useMutation(CREATE_GEOFENCE)
  const [acknowledgeAlert] = useMutation(ACKNOWLEDGE_ALERT)
  const [deleteGeofence] = useMutation(DELETE_GEOFENCE)

  const [tab, setTab] = useState<'fences' | 'alerts'>('fences')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [ackNotes, setAckNotes] = useState('')
  const [ackId, setAckId] = useState<string | null>(null)

  const geofences = data?.geofences ?? []
  const alerts = alertsData?.geofenceAlerts ?? []

  const totalFences = geofences.length
  const activeFences = geofences.filter((g: Record<string, unknown>) => g.active).length
  const alertsToday = geofences.reduce((sum: number, g: Record<string, unknown>) => {
    const gAlerts = (g.alerts as Array<Record<string, unknown>>) ?? []
    const today = new Date().toDateString()
    return sum + gAlerts.filter((a) => new Date(a.createdAt as string).toDateString() === today).length
  }, 0)
  const unacknowledged = alerts.length

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createGeofence({
      variables: {
        name: form.name,
        centerLat: Number(form.centerLat),
        centerLon: Number(form.centerLon),
        radiusNm: Number(form.radiusNm),
        fenceType: form.fenceType,
        alertOnEntry: form.alertOnEntry,
        alertOnExit: form.alertOnExit,
        dwellThresholdHrs: form.dwellThresholdHrs ? Number(form.dwellThresholdHrs) : null,
      },
    })
    setForm(emptyForm)
    setShowCreate(false)
    refetch()
  }

  const handleAcknowledge = async (id: string) => {
    await acknowledgeAlert({ variables: { id, notes: ackNotes || null } })
    setAckId(null)
    setAckNotes('')
    refetchAlerts()
    refetch()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this geofence?')) return
    await deleteGeofence({ variables: { id } })
    refetch()
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const setCheck = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.checked }))

  const fmtDate = (d: string) => new Date(d).toLocaleString()
  const fmtCoord = (v: number) => v?.toFixed(4) ?? '-'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Geofencing</h1>
          <p className="text-maritime-400 text-sm mt-1">Define geographic boundaries and monitor vessel movements</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ Create Geofence</button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Fences', value: totalFences, color: 'text-white' },
          { label: 'Active', value: activeFences, color: 'text-green-400' },
          { label: 'Alerts Today', value: alertsToday, color: 'text-blue-400' },
          { label: 'Unacknowledged', value: unacknowledged, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <p className="text-maritime-400 text-xs font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-maritime-700">
        {(['fences', 'alerts'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-maritime-400 hover:text-maritime-300'
            }`}>
            {t === 'fences' ? 'Geofences' : 'Live Alerts'}
            {t === 'alerts' && unacknowledged > 0 && (
              <span className="ml-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">{unacknowledged}</span>
            )}
          </button>
        ))}
      </div>

      {loading && <p className="text-maritime-400">Loading geofences...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Geofences Tab */}
      {!loading && tab === 'fences' && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Center</th>
                <th className="text-right px-4 py-3 font-medium">Radius (NM)</th>
                <th className="text-center px-4 py-3 font-medium">Vessels</th>
                <th className="text-center px-4 py-3 font-medium">Active</th>
                <th className="text-center px-4 py-3 font-medium">Alerts</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(geofences as Array<Record<string, unknown>>).map((g) => {
                const gAlerts = (g.alerts as Array<Record<string, unknown>>) ?? []
                const vesselIds = (g.vesselIds as string[]) ?? []
                return (
                  <tr key={g.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="px-4 py-3 text-white font-medium">{g.name as string}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-maritime-700 text-maritime-300">
                        {fenceTypeLabels[g.fenceType as string] ?? (g.fenceType as string)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-maritime-300 font-mono text-xs">
                      {fmtCoord(g.centerLat as number)}, {fmtCoord(g.centerLon as number)}
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-right">{(g.radiusNm as number)?.toFixed(1) ?? '-'}</td>
                    <td className="px-4 py-3 text-maritime-300 text-center">{vesselIds.length}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        g.active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {g.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-center">{gAlerts.length}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button className="text-blue-400/60 hover:text-blue-400 text-xs">Edit</button>
                        <button onClick={() => handleDelete(g.id as string)}
                          className="text-red-400/60 hover:text-red-400 text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {geofences.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No geofences defined yet</p>
          )}
        </div>
      )}

      {/* Live Alerts Tab */}
      {tab === 'alerts' && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          {alertsLoading && <p className="text-maritime-400 p-4">Loading alerts...</p>}
          {!alertsLoading && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-maritime-700 text-maritime-400">
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                  <th className="text-left px-4 py-3 font-medium">Geofence</th>
                  <th className="text-left px-4 py-3 font-medium">Vessel</th>
                  <th className="text-center px-4 py-3 font-medium">Event</th>
                  <th className="text-left px-4 py-3 font-medium">Position</th>
                  <th className="text-right px-4 py-3 font-medium">Speed (kn)</th>
                  <th className="text-center px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {(alerts as Array<Record<string, unknown>>).map((a) => {
                  const geofence = a.geofence as Record<string, unknown> | null
                  return (
                    <tr key={a.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                      <td className="px-4 py-3 text-maritime-300 text-xs font-mono">{fmtDate(a.createdAt as string)}</td>
                      <td className="px-4 py-3 text-white font-medium">{geofence?.name as string ?? '-'}</td>
                      <td className="px-4 py-3 text-maritime-300">{a.vesselId as string}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          eventTypeBadge[a.eventType as string] ?? 'bg-maritime-700 text-maritime-300'
                        }`}>
                          {(a.eventType as string).replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-maritime-300 font-mono text-xs">
                        {fmtCoord(a.latitude as number)}, {fmtCoord(a.longitude as number)}
                      </td>
                      <td className="px-4 py-3 text-maritime-300 text-right">{(a.speed as number)?.toFixed(1) ?? '-'}</td>
                      <td className="px-4 py-3 text-center">
                        {ackId === (a.id as string) ? (
                          <div className="flex items-center gap-2">
                            <input value={ackNotes} onChange={(e) => setAckNotes(e.target.value)}
                              className="bg-maritime-900 border border-maritime-600 rounded px-2 py-1 text-white text-xs w-32"
                              placeholder="Notes (optional)" />
                            <button onClick={() => handleAcknowledge(a.id as string)}
                              className="text-green-400 hover:text-green-300 text-xs font-medium">Confirm</button>
                            <button onClick={() => { setAckId(null); setAckNotes('') }}
                              className="text-maritime-500 hover:text-maritime-300 text-xs">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setAckId(a.id as string)}
                            className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded hover:bg-green-900/50">
                            Acknowledge
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {!alertsLoading && alerts.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No unacknowledged alerts</p>
          )}
        </div>
      )}

      {/* Create Geofence Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Geofence">
        <form onSubmit={handleCreate}>
          <FormField label="Name *">
            <input value={form.name} onChange={set('name')} className={inputClass} required placeholder="Singapore Strait Zone" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Center Latitude *">
              <input type="number" step="any" value={form.centerLat} onChange={set('centerLat')}
                className={inputClass} required placeholder="1.2644" />
            </FormField>
            <FormField label="Center Longitude *">
              <input type="number" step="any" value={form.centerLon} onChange={set('centerLon')}
                className={inputClass} required placeholder="103.8200" />
            </FormField>
            <FormField label="Radius (NM) *">
              <input type="number" step="any" value={form.radiusNm} onChange={set('radiusNm')}
                className={inputClass} required placeholder="5.0" />
            </FormField>
            <FormField label="Fence Type *">
              <select value={form.fenceType} onChange={set('fenceType')} className={selectClass} required>
                {fenceTypes.map((t) => <option key={t} value={t}>{fenceTypeLabels[t]}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Dwell Threshold (hrs)">
            <input type="number" step="any" value={form.dwellThresholdHrs} onChange={set('dwellThresholdHrs')}
              className={inputClass} placeholder="24" />
          </FormField>
          <div className="flex gap-6 mt-2 mb-4">
            <label className="flex items-center gap-2 text-sm text-maritime-300 cursor-pointer">
              <input type="checkbox" checked={form.alertOnEntry} onChange={setCheck('alertOnEntry')}
                className="rounded border-maritime-600 bg-maritime-900 text-blue-600 focus:ring-blue-500" />
              Alert on Entry
            </label>
            <label className="flex items-center gap-2 text-sm text-maritime-300 cursor-pointer">
              <input type="checkbox" checked={form.alertOnExit} onChange={setCheck('alertOnExit')}
                className="rounded border-maritime-600 bg-maritime-900 text-blue-600 focus:ring-blue-500" />
              Alert on Exit
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Geofence'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
