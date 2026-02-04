import { useQuery, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';

const ECA_ZONES_QUERY = gql`
  query ECAZones {
    ecaZones {
      id name type description fuelRequirement effectiveDate
      maxSulphurContent maxNOxTier source active
      coordinates
    }
  }
`

const typeBadge: Record<string, { bg: string; text: string; border: string; label: string }> = {
  seca: { bg: 'bg-blue-900/50', text: 'text-blue-400', border: 'border-blue-500', label: 'SECA' },
  neca: { bg: 'bg-orange-900/50', text: 'text-orange-400', border: 'border-orange-500', label: 'NECA' },
  ceca: { bg: 'bg-purple-900/50', text: 'text-purple-400', border: 'border-purple-500', label: 'CECA' },
}

const fuelInfo: Record<string, { requirement: string; description: string }> = {
  seca: {
    requirement: 'Max 0.10% sulphur fuel or exhaust gas cleaning system (scrubber)',
    description: 'Sulphur Emission Control Areas require vessels to use fuel with sulphur content not exceeding 0.10% m/m, or use an approved equivalent compliance method such as scrubbers.',
  },
  neca: {
    requirement: 'Tier III NOx standards for engines installed after 2016',
    description: 'NOx Emission Control Areas require marine diesel engines installed on ships constructed on or after 1 January 2016 to meet Tier III NOx emission standards.',
  },
  ceca: {
    requirement: 'Combined SECA + NECA requirements',
    description: 'Combined Emission Control Areas enforce both sulphur and NOx restrictions simultaneously. Vessels must comply with both fuel sulphur limits and NOx emission standards.',
  },
}

export function ECAZones() {
  const { data, loading, error } = useQuery(ECA_ZONES_QUERY)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const zones = data?.ecaZones ?? []
  const activeZones = zones.filter((z: Record<string, unknown>) => z.active)
  const inactiveZones = zones.filter((z: Record<string, unknown>) => !z.active)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ECA Zones</h1>
          <p className="text-maritime-400 text-sm mt-1">Emission Control Areas and fuel compliance requirements</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`text-sm px-3 py-1.5 rounded ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-maritime-800 text-maritime-400 border border-maritime-700'}`}>
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`text-sm px-3 py-1.5 rounded ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-maritime-800 text-maritime-400 border border-maritime-700'}`}>
            Table
          </button>
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading ECA zones...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Info Panel */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
        <h2 className="text-white font-semibold text-sm mb-3">Fuel Requirements by Zone Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(fuelInfo).map(([type, info]) => {
            const badge = typeBadge[type]
            return (
              <div key={type} className={`border-l-4 ${badge.border} bg-maritime-900/50 rounded-r-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-maritime-300 text-xs leading-relaxed mb-2">{info.requirement}</p>
                <p className="text-maritime-500 text-[10px] leading-relaxed">{info.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && !loading && (
        <>
          {activeZones.length > 0 && (
            <div>
              <h2 className="text-white font-semibold text-sm mb-3">Active Zones ({activeZones.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeZones.map((zone: Record<string, unknown>) => {
                  const type = zone.type as string
                  const badge = typeBadge[type] ?? typeBadge.seca
                  return (
                    <div key={zone.id as string}
                      className={`bg-maritime-800 border-l-4 ${badge.border} border border-l-4 border-maritime-700 rounded-lg p-4 hover:bg-maritime-700/30 transition-colors`}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-white font-medium text-sm">{zone.name as string}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-maritime-400 text-xs mb-3 line-clamp-2">{zone.description as string}</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-maritime-500">Fuel Requirement</span>
                          <span className="text-maritime-300">{zone.fuelRequirement as string}</span>
                        </div>
                        {zone.maxSulphurContent && (
                          <div className="flex justify-between text-xs">
                            <span className="text-maritime-500">Max Sulphur</span>
                            <span className="text-yellow-400 font-mono">{zone.maxSulphurContent as string}%</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs">
                          <span className="text-maritime-500">Effective</span>
                          <span className="text-maritime-300">
                            {zone.effectiveDate
                              ? new Date(zone.effectiveDate as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '-'}
                          </span>
                        </div>
                        {zone.source && (
                          <div className="flex justify-between text-xs">
                            <span className="text-maritime-500">Source</span>
                            <span className="text-maritime-400">{zone.source as string}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {inactiveZones.length > 0 && (
            <div>
              <h2 className="text-maritime-500 font-semibold text-sm mb-3">Inactive Zones ({inactiveZones.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {inactiveZones.map((zone: Record<string, unknown>) => {
                  const type = zone.type as string
                  const badge = typeBadge[type] ?? typeBadge.seca
                  return (
                    <div key={zone.id as string}
                      className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-maritime-400 font-medium text-sm">{zone.name as string}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-maritime-500 text-xs">{zone.description as string}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Table View */}
      {viewMode === 'table' && !loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                <th className="text-left px-4 py-3">Zone Name</th>
                <th className="text-center px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">Fuel Requirement</th>
                <th className="text-left px-4 py-3">Effective Date</th>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-center px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {zones.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-maritime-500">No ECA zones found</td></tr>
              )}
              {zones.map((zone: Record<string, unknown>) => {
                const type = zone.type as string
                const badge = typeBadge[type] ?? typeBadge.seca
                return (
                  <tr key={zone.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                    <td className="px-4 py-3 text-white font-medium text-xs">{zone.name as string}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-xs max-w-xs truncate">{zone.description as string}</td>
                    <td className="px-4 py-3 text-maritime-300 text-xs">{zone.fuelRequirement as string}</td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">
                      {zone.effectiveDate
                        ? new Date(zone.effectiveDate as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">{(zone.source as string) ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-3 h-3 rounded-full ${zone.active ? 'bg-green-500' : 'bg-maritime-600'}`} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {zones.length === 0 && !loading && (
        <p className="text-maritime-500 text-center py-8">No ECA zones configured</p>
      )}
    </div>
  )
}
