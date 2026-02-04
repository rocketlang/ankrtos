import { useQuery, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';

const HIGH_RISK_AREAS_QUERY = gql`
  query HighRiskAreas {
    highRiskAreas {
      id name riskType riskLevel description advisory
      insuranceSurcharge bmpRequired armedGuardsRecommended
      coordinates effectiveFrom effectiveTo source active
    }
  }
`

const riskLevelColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  critical: { bg: 'bg-red-900/50', text: 'text-red-400', border: 'border-red-500', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-900/50', text: 'text-orange-400', border: 'border-orange-500', dot: 'bg-orange-500' },
  medium: { bg: 'bg-yellow-900/50', text: 'text-yellow-400', border: 'border-yellow-500', dot: 'bg-yellow-500' },
  low: { bg: 'bg-green-900/50', text: 'text-green-400', border: 'border-green-500', dot: 'bg-green-500' },
}

const riskTypes = ['piracy', 'war_risk', 'terrorism', 'sanctions', 'environmental', 'political']

const riskTypeBadge: Record<string, string> = {
  piracy: 'bg-red-900/40 text-red-300',
  war_risk: 'bg-orange-900/40 text-orange-300',
  terrorism: 'bg-purple-900/40 text-purple-300',
  sanctions: 'bg-blue-900/40 text-blue-300',
  environmental: 'bg-green-900/40 text-green-300',
  political: 'bg-yellow-900/40 text-yellow-300',
}

export function HighRiskAreas() {
  const { data, loading, error } = useQuery(HIGH_RISK_AREAS_QUERY)
  const [filterType, setFilterType] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [selectedArea, setSelectedArea] = useState<Record<string, unknown> | null>(null)

  const allAreas = data?.highRiskAreas ?? []
  const areas = allAreas.filter((a: Record<string, unknown>) => {
    if (filterType && a.riskType !== filterType) return false
    if (filterLevel && a.riskLevel !== filterLevel) return false
    return true
  })

  const countByLevel = (level: string) => allAreas.filter((a: Record<string, unknown>) => a.riskLevel === level).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">High Risk Areas</h1>
          <p className="text-maritime-400 text-sm mt-1">Maritime security zones, piracy corridors & war risk areas</p>
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading risk areas...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Risk Level Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['critical', 'high', 'medium', 'low'] as const).map((level) => {
          const colors = riskLevelColors[level]
          return (
            <div key={level} className={`bg-maritime-800 border-l-4 ${colors.border} rounded-lg p-4`}>
              <p className="text-maritime-500 text-xs uppercase tracking-wide">{level}</p>
              <p className={`text-2xl font-bold mt-1 ${colors.text}`}>{countByLevel(level)}</p>
              <p className="text-maritime-600 text-[10px] mt-0.5">areas</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Risk Types</option>
          {riskTypes.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Risk Levels</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {(filterType || filterLevel) && (
          <button onClick={() => { setFilterType(''); setFilterLevel('') }}
            className="text-maritime-400 text-sm hover:text-white">
            Clear Filters
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Cards Grid */}
        <div className={`${selectedArea ? 'w-2/3' : 'w-full'} transition-all`}>
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {areas.map((area: Record<string, unknown>) => {
                const level = area.riskLevel as string
                const colors = riskLevelColors[level] ?? riskLevelColors.medium
                const isSelected = selectedArea?.id === area.id
                return (
                  <div key={area.id as string}
                    onClick={() => setSelectedArea(isSelected ? null : area)}
                    className={`bg-maritime-800 border-l-4 ${colors.border} border border-maritime-700 rounded-lg p-4 cursor-pointer transition-all hover:bg-maritime-700/30 ${isSelected ? 'ring-1 ring-blue-500' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-medium text-sm">{area.name as string}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colors.bg} ${colors.text}`}>
                        {level}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${riskTypeBadge[(area.riskType as string)] ?? 'bg-maritime-700 text-maritime-300'}`}>
                        {(area.riskType as string).replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-maritime-400 text-xs mb-3 line-clamp-2">{area.advisory as string}</p>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-maritime-500">Insurance Surcharge</span>
                        <span className="text-orange-400 font-mono">{area.insuranceSurcharge as number}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-maritime-500">BMP Required</span>
                        <span className={area.bmpRequired ? 'text-red-400' : 'text-green-400'}>
                          {area.bmpRequired ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-maritime-500">Armed Guards</span>
                        <span className={area.armedGuardsRecommended ? 'text-red-400' : 'text-maritime-400'}>
                          {area.armedGuardsRecommended ? 'Recommended' : 'Not Required'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && areas.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No risk areas match the selected filters</p>
          )}
        </div>

        {/* Detail Panel */}
        {selectedArea && (
          <div className="w-1/3 bg-maritime-800 border border-maritime-700 rounded-lg p-5 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">{selectedArea.name as string}</h2>
              <button onClick={() => setSelectedArea(null)} className="text-maritime-400 hover:text-white text-lg">
                &#x2715;
              </button>
            </div>

            {(() => {
              const level = selectedArea.riskLevel as string
              const colors = riskLevelColors[level] ?? riskLevelColors.medium
              return (
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${colors.bg} ${colors.text}`}>
                    {level}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${riskTypeBadge[(selectedArea.riskType as string)] ?? ''}`}>
                    {(selectedArea.riskType as string).replace(/_/g, ' ')}
                  </span>
                </div>
              )
            })()}

            <div className="space-y-4">
              <div>
                <p className="text-maritime-500 text-xs font-medium mb-1">Description</p>
                <p className="text-maritime-300 text-sm leading-relaxed">{selectedArea.description as string}</p>
              </div>

              <div>
                <p className="text-maritime-500 text-xs font-medium mb-1">Advisory</p>
                <p className="text-maritime-300 text-sm leading-relaxed">{selectedArea.advisory as string}</p>
              </div>

              <div className="border-t border-maritime-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-maritime-500">Insurance Surcharge</span>
                  <span className="text-orange-400 font-bold">{selectedArea.insuranceSurcharge as number}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-maritime-500">BMP Required</span>
                  <span className={`font-medium ${selectedArea.bmpRequired ? 'text-red-400' : 'text-green-400'}`}>
                    {selectedArea.bmpRequired ? 'Yes - Mandatory' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-maritime-500">Armed Guards</span>
                  <span className={`font-medium ${selectedArea.armedGuardsRecommended ? 'text-red-400' : 'text-maritime-400'}`}>
                    {selectedArea.armedGuardsRecommended ? 'Recommended' : 'Not Required'}
                  </span>
                </div>
                {selectedArea.source && (
                  <div className="flex justify-between text-sm">
                    <span className="text-maritime-500">Source</span>
                    <span className="text-maritime-300">{selectedArea.source as string}</span>
                  </div>
                )}
                {selectedArea.effectiveFrom && (
                  <div className="flex justify-between text-sm">
                    <span className="text-maritime-500">Effective From</span>
                    <span className="text-maritime-300">
                      {new Date(selectedArea.effectiveFrom as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span className={`w-2 h-2 rounded-full ${selectedArea.active ? 'bg-green-500' : 'bg-maritime-600'}`} />
                <span className="text-maritime-400 text-xs">{selectedArea.active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
