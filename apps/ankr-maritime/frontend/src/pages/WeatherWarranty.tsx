import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const BEAUFORT_LOGS = gql`
  query BeaufortLogs($voyageId: String!) {
    beaufortLogs(voyageId: $voyageId) {
      id date latitude longitude beaufortScale windSpeed windDirection
      waveHeight seaState swellHeight swellDirection
      warrantySpeed actualSpeed warrantyConsumption actualConsumption
      withinWarranty remarks voyageId
    }
  }
`

const BEAUFORT_SUMMARY = gql`
  query BeaufortSummary($voyageId: String!) {
    beaufortSummary(voyageId: $voyageId) {
      avgBeaufort maxBeaufort daysAboveWarranty warrantyCompliancePercent
      totalEntries avgWindSpeed avgWaveHeight
    }
  }
`

const VOYAGES_QUERY = gql`
  query Voyages { voyages { id voyageNumber vessel { name } } }
`

const ADD_BEAUFORT_LOG = gql`
  mutation AddBeaufortLog(
    $voyageId: String!, $date: String!, $latitude: Float!, $longitude: Float!,
    $beaufortScale: Int!, $windSpeed: Float!, $windDirection: String,
    $waveHeight: Float!, $seaState: String, $swellHeight: Float, $swellDirection: String,
    $warrantySpeed: Float, $actualSpeed: Float, $warrantyConsumption: Float, $actualConsumption: Float,
    $remarks: String
  ) {
    addBeaufortLog(
      voyageId: $voyageId, date: $date, latitude: $latitude, longitude: $longitude,
      beaufortScale: $beaufortScale, windSpeed: $windSpeed, windDirection: $windDirection,
      waveHeight: $waveHeight, seaState: $seaState, swellHeight: $swellHeight, swellDirection: $swellDirection,
      warrantySpeed: $warrantySpeed, actualSpeed: $actualSpeed, warrantyConsumption: $warrantyConsumption,
      actualConsumption: $actualConsumption, remarks: $remarks
    ) { id }
  }
`

function getBeaufortColor(scale: number): string {
  if (scale <= 3) return 'bg-green-500'
  if (scale <= 6) return 'bg-yellow-500'
  if (scale <= 9) return 'bg-orange-500'
  return 'bg-red-500'
}

function getBeaufortTextColor(scale: number): string {
  if (scale <= 3) return 'text-green-400'
  if (scale <= 6) return 'text-yellow-400'
  if (scale <= 9) return 'text-orange-400'
  return 'text-red-400'
}

const beaufortDescriptions: Record<number, string> = {
  0: 'Calm', 1: 'Light Air', 2: 'Light Breeze', 3: 'Gentle Breeze',
  4: 'Moderate Breeze', 5: 'Fresh Breeze', 6: 'Strong Breeze',
  7: 'High Wind', 8: 'Gale', 9: 'Strong Gale',
  10: 'Storm', 11: 'Violent Storm', 12: 'Hurricane',
}

const seaStates = ['Calm', 'Smooth', 'Slight', 'Moderate', 'Rough', 'Very Rough', 'High', 'Very High', 'Phenomenal']
const windDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

const emptyForm = {
  date: '', latitude: '', longitude: '', beaufortScale: '4',
  windSpeed: '', windDirection: 'N', waveHeight: '', seaState: 'Moderate',
  swellHeight: '', swellDirection: '', warrantySpeed: '', actualSpeed: '',
  warrantyConsumption: '', actualConsumption: '', remarks: '',
}

export function WeatherWarranty() {
  const [voyageId, setVoyageId] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const { data: voyageData } = useQuery(VOYAGES_QUERY)
  const { data: logData, loading, refetch: refetchLogs } = useQuery(BEAUFORT_LOGS, {
    variables: { voyageId },
    skip: !voyageId,
  })
  const { data: summaryData, refetch: refetchSummary } = useQuery(BEAUFORT_SUMMARY, {
    variables: { voyageId },
    skip: !voyageId,
  })
  const [addLog, { loading: adding }] = useMutation(ADD_BEAUFORT_LOG)

  const voyages = voyageData?.voyages ?? []
  const logs = logData?.beaufortLogs ?? []
  const summary = summaryData?.beaufortSummary

  const refetchAll = () => { refetchLogs(); refetchSummary() }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.latitude || !form.longitude || !form.windSpeed || !form.waveHeight) return
    await addLog({
      variables: {
        voyageId,
        date: form.date,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        beaufortScale: parseInt(form.beaufortScale),
        windSpeed: parseFloat(form.windSpeed),
        windDirection: form.windDirection || undefined,
        waveHeight: parseFloat(form.waveHeight),
        seaState: form.seaState || undefined,
        swellHeight: form.swellHeight ? parseFloat(form.swellHeight) : undefined,
        swellDirection: form.swellDirection || undefined,
        warrantySpeed: form.warrantySpeed ? parseFloat(form.warrantySpeed) : undefined,
        actualSpeed: form.actualSpeed ? parseFloat(form.actualSpeed) : undefined,
        warrantyConsumption: form.warrantyConsumption ? parseFloat(form.warrantyConsumption) : undefined,
        actualConsumption: form.actualConsumption ? parseFloat(form.actualConsumption) : undefined,
        remarks: form.remarks || undefined,
      },
    })
    setForm(emptyForm)
    setShowAdd(false)
    refetchAll()
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Weather Warranty</h1>
          <p className="text-maritime-400 text-sm mt-1">Beaufort scale logs, sea state tracking & warranty compliance</p>
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
            <button onClick={() => setShowAdd(true)} className={btnPrimary}>+ Add Log Entry</button>
          )}
        </div>
      </div>

      {!voyageId && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <p className="text-maritime-500 text-lg">Select a voyage to view weather warranty data</p>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-maritime-800 border-l-4 border-blue-500 rounded-lg p-4">
            <p className="text-maritime-500 text-xs uppercase tracking-wide">Avg Beaufort</p>
            <p className={`text-2xl font-bold mt-1 ${getBeaufortTextColor(Math.round(summary.avgBeaufort))}`}>
              {summary.avgBeaufort.toFixed(1)}
            </p>
            <p className="text-maritime-600 text-[10px] mt-0.5">
              {beaufortDescriptions[Math.round(summary.avgBeaufort)] ?? ''}
            </p>
          </div>
          <div className="bg-maritime-800 border-l-4 border-orange-500 rounded-lg p-4">
            <p className="text-maritime-500 text-xs uppercase tracking-wide">Max Beaufort</p>
            <p className={`text-2xl font-bold mt-1 ${getBeaufortTextColor(summary.maxBeaufort)}`}>
              {summary.maxBeaufort}
            </p>
            <p className="text-maritime-600 text-[10px] mt-0.5">
              {beaufortDescriptions[summary.maxBeaufort] ?? ''}
            </p>
          </div>
          <div className="bg-maritime-800 border-l-4 border-red-500 rounded-lg p-4">
            <p className="text-maritime-500 text-xs uppercase tracking-wide">Days Above Warranty</p>
            <p className="text-2xl font-bold mt-1 text-red-400">{summary.daysAboveWarranty}</p>
            <p className="text-maritime-600 text-[10px] mt-0.5">days</p>
          </div>
          <div className="bg-maritime-800 border-l-4 border-green-500 rounded-lg p-4">
            <p className="text-maritime-500 text-xs uppercase tracking-wide">Warranty Compliance</p>
            <p className={`text-2xl font-bold mt-1 ${summary.warrantyCompliancePercent >= 80 ? 'text-green-400' : summary.warrantyCompliancePercent >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {summary.warrantyCompliancePercent.toFixed(1)}%
            </p>
            <div className="w-full bg-maritime-700 rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full ${summary.warrantyCompliancePercent >= 80 ? 'bg-green-500' : summary.warrantyCompliancePercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${summary.warrantyCompliancePercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Beaufort Scale Legend */}
      {voyageId && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
          <h3 className="text-maritime-400 text-xs font-medium mb-2">Beaufort Scale Reference</h3>
          <div className="flex gap-0.5">
            {Array.from({ length: 13 }, (_, i) => (
              <div key={i} className="flex-1 text-center">
                <div className={`h-4 rounded-sm ${getBeaufortColor(i)} opacity-80`} />
                <span className="text-maritime-500 text-[9px]">{i}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-green-400 text-[9px]">Calm</span>
            <span className="text-yellow-400 text-[9px]">Moderate</span>
            <span className="text-orange-400 text-[9px]">High</span>
            <span className="text-red-400 text-[9px]">Storm</span>
          </div>
        </div>
      )}

      {/* Logs Table */}
      {voyageId && !loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Position</th>
                <th className="text-center px-4 py-3">Beaufort</th>
                <th className="text-right px-4 py-3">Wind (kn)</th>
                <th className="text-right px-4 py-3">Wave (m)</th>
                <th className="text-left px-4 py-3">Sea State</th>
                <th className="text-right px-4 py-3">W.Speed</th>
                <th className="text-right px-4 py-3">Act.Speed</th>
                <th className="text-right px-4 py-3">W.Cons</th>
                <th className="text-right px-4 py-3">Act.Cons</th>
                <th className="text-center px-4 py-3">Warranty</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={11} className="text-center py-8 text-maritime-500">No beaufort logs recorded</td></tr>
              )}
              {logs.map((log: Record<string, unknown>) => {
                const bf = log.beaufortScale as number
                return (
                  <tr key={log.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                    <td className="px-4 py-3 text-maritime-300 text-xs">
                      {log.date ? new Date(log.date as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs font-mono">
                      {(log.latitude as number)?.toFixed(2)}, {(log.longitude as number)?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* Visual scale bar */}
                        <div className="w-20 h-3 bg-maritime-900 rounded-full overflow-hidden flex">
                          <div
                            className={`h-full rounded-full ${getBeaufortColor(bf)}`}
                            style={{ width: `${(bf / 12) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${getBeaufortTextColor(bf)}`}>{bf}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-maritime-300 text-xs font-mono">{(log.windSpeed as number)?.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-maritime-300 text-xs font-mono">{(log.waveHeight as number)?.toFixed(1)}</td>
                    <td className="px-4 py-3 text-maritime-300 text-xs">{(log.seaState as string) ?? '-'}</td>
                    <td className="px-4 py-3 text-right text-maritime-400 text-xs font-mono">
                      {(log.warrantySpeed as number)?.toFixed(1) ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-white text-xs font-mono">
                      {(log.actualSpeed as number)?.toFixed(1) ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-maritime-400 text-xs font-mono">
                      {(log.warrantyConsumption as number)?.toFixed(1) ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-white text-xs font-mono">
                      {(log.actualConsumption as number)?.toFixed(1) ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {log.withinWarranty !== null && log.withinWarranty !== undefined ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${log.withinWarranty ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                          {log.withinWarranty ? 'Within' : 'Exceeded'}
                        </span>
                      ) : (
                        <span className="text-maritime-600 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {loading && voyageId && <p className="text-maritime-400">Loading beaufort logs...</p>}

      {/* Add Log Entry Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Beaufort Log Entry">
        <form onSubmit={handleAdd}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date/Time *">
              <input type="datetime-local" value={form.date} onChange={set('date')} className={inputClass} required />
            </FormField>
            <FormField label="Beaufort Scale (0-12) *">
              <select value={form.beaufortScale} onChange={set('beaufortScale')} className={selectClass} required>
                {Array.from({ length: 13 }, (_, i) => (
                  <option key={i} value={String(i)}>{i} - {beaufortDescriptions[i]}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Latitude *">
              <input type="number" step="any" value={form.latitude} onChange={set('latitude')} className={inputClass} required placeholder="25.0343" />
            </FormField>
            <FormField label="Longitude *">
              <input type="number" step="any" value={form.longitude} onChange={set('longitude')} className={inputClass} required placeholder="55.1562" />
            </FormField>
            <FormField label="Wind Speed (knots) *">
              <input type="number" step="any" value={form.windSpeed} onChange={set('windSpeed')} className={inputClass} required placeholder="22.5" />
            </FormField>
            <FormField label="Wind Direction">
              <select value={form.windDirection} onChange={set('windDirection')} className={selectClass}>
                {windDirections.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </FormField>
            <FormField label="Wave Height (m) *">
              <input type="number" step="any" value={form.waveHeight} onChange={set('waveHeight')} className={inputClass} required placeholder="2.5" />
            </FormField>
            <FormField label="Sea State">
              <select value={form.seaState} onChange={set('seaState')} className={selectClass}>
                {seaStates.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Swell Height (m)">
              <input type="number" step="any" value={form.swellHeight} onChange={set('swellHeight')} className={inputClass} placeholder="1.5" />
            </FormField>
            <FormField label="Swell Direction">
              <select value={form.swellDirection} onChange={set('swellDirection')} className={selectClass}>
                <option value="">-</option>
                {windDirections.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </FormField>
          </div>

          <div className="border-t border-maritime-700 mt-4 pt-4">
            <h3 className="text-maritime-400 text-xs font-medium mb-3">Warranty Comparison</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Warranty Speed (kn)">
                <input type="number" step="any" value={form.warrantySpeed} onChange={set('warrantySpeed')} className={inputClass} placeholder="14.5" />
              </FormField>
              <FormField label="Actual Speed (kn)">
                <input type="number" step="any" value={form.actualSpeed} onChange={set('actualSpeed')} className={inputClass} placeholder="13.8" />
              </FormField>
              <FormField label="Warranty Consumption (mt/d)">
                <input type="number" step="any" value={form.warrantyConsumption} onChange={set('warrantyConsumption')} className={inputClass} placeholder="32.0" />
              </FormField>
              <FormField label="Actual Consumption (mt/d)">
                <input type="number" step="any" value={form.actualConsumption} onChange={set('actualConsumption')} className={inputClass} placeholder="33.5" />
              </FormField>
            </div>
          </div>

          <FormField label="Remarks">
            <textarea value={form.remarks} onChange={set('remarks')} rows={2} className={inputClass} placeholder="Additional observations..." />
          </FormField>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAdd(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={adding} className={btnPrimary}>
              {adding ? 'Adding...' : 'Add Log Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
