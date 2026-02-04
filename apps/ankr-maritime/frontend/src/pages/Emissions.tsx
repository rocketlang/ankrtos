import { useQuery, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;

const EMISSIONS = gql`
  query Emissions($vesselId: String, $year: Int) {
    vesselEmissions(vesselId: $vesselId, year: $year) {
      id vesselId year distanceNm fuelConsumedMt co2EmissionsMt
      attainedCII requiredCII ciiRating
      euEtsApplicable euEtsCo2Mt euEtsAllowancesNeeded euEtsCostEur
      fuelEuGhgIntensity fuelEuTarget fuelEuCompliant fuelEuPenalty
      vessel { name imo }
    }
  }
`;

const CII_SUMMARY = gql`
  query CiiSummary($year: Int!) {
    fleetCiiSummary(year: $year) {
      totalVessels avgCII worstVessel bestVessel
      ratingDistribution { rating count }
    }
  }
`;

const ETS_SUMMARY = gql`
  query EtsSummary($year: Int!) {
    euEtsSummary(year: $year) {
      totalCo2Mt totalAllowancesNeeded totalCostEur vesselCount
    }
  }
`;

const ratingColor: Record<string, string> = {
  A: 'bg-green-500',
  B: 'bg-lime-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-500',
};

const ratingTextColor: Record<string, string> = {
  A: 'text-green-400',
  B: 'text-lime-400',
  C: 'text-yellow-400',
  D: 'text-orange-400',
  E: 'text-red-400',
};

const ratingBadge: Record<string, string> = {
  A: 'bg-green-500/20 text-green-400',
  B: 'bg-lime-500/20 text-lime-400',
  C: 'bg-yellow-500/20 text-yellow-400',
  D: 'bg-orange-500/20 text-orange-400',
  E: 'bg-red-500/20 text-red-400',
};

function fmtNum(n: number, decimals = 2) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export function Emissions() {
  const [year, setYear] = useState(2025);
  const [activeTab, setActiveTab] = useState<'cii' | 'ets' | 'fueleu'>('cii');

  const { data: emissionsData, loading: emissionsLoading } = useQuery(EMISSIONS, {
    variables: { year },
  });

  const { data: ciiData, loading: ciiLoading } = useQuery(CII_SUMMARY, {
    variables: { year },
  });

  const { data: etsData, loading: etsLoading } = useQuery(ETS_SUMMARY, {
    variables: { year },
  });

  const emissions = emissionsData?.vesselEmissions ?? [];
  const ciiSummary = ciiData?.fleetCiiSummary;
  const etsSummary = etsData?.euEtsSummary;
  const distribution = ciiSummary?.ratingDistribution ?? [];

  const totalDistribution = distribution.reduce(
    (sum: number, d: Record<string, unknown>) => sum + (d.count as number), 0
  );

  const tabs = [
    { key: 'cii' as const, label: 'CII Ratings' },
    { key: 'ets' as const, label: 'EU ETS' },
    { key: 'fueleu' as const, label: 'FuelEU Maritime' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Emissions & Compliance</h1>
          <p className="text-maritime-400 text-sm mt-1">CII ratings, EU ETS, and FuelEU Maritime dashboard</p>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-maritime-400 text-sm">Year:</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-maritime-800 rounded-lg p-1 border border-maritime-700 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-sm px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-maritime-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CII Ratings Tab */}
      {activeTab === 'cii' && (
        <div className="space-y-6">
          {ciiLoading && <p className="text-maritime-500 text-sm">Loading CII summary...</p>}

          {/* Fleet Summary Cards */}
          {ciiSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-maritime-800 border-l-4 border-maritime-500 rounded-lg p-4">
                <p className="text-maritime-500 text-xs">Total Vessels</p>
                <p className="text-lg font-bold mt-1 text-white">{ciiSummary.totalVessels}</p>
              </div>
              <div className="bg-maritime-800 border-l-4 border-blue-500 rounded-lg p-4">
                <p className="text-maritime-500 text-xs">Average CII</p>
                <p className="text-lg font-bold mt-1 text-blue-400">{fmtNum(ciiSummary.avgCII, 4)}</p>
              </div>
              <div className="bg-maritime-800 border-l-4 border-green-500 rounded-lg p-4">
                <p className="text-maritime-500 text-xs">Best Vessel</p>
                <p className="text-sm font-bold mt-1 text-green-400">{ciiSummary.bestVessel ?? '-'}</p>
              </div>
              <div className="bg-maritime-800 border-l-4 border-red-500 rounded-lg p-4">
                <p className="text-maritime-500 text-xs">Worst Vessel</p>
                <p className="text-sm font-bold mt-1 text-red-400">{ciiSummary.worstVessel ?? '-'}</p>
              </div>
            </div>
          )}

          {/* Rating Distribution Bar */}
          {distribution.length > 0 && (
            <div className="bg-maritime-800 rounded-lg p-4 border border-maritime-700">
              <p className="text-maritime-400 text-xs font-medium mb-3">CII Rating Distribution</p>
              <div className="flex rounded-lg overflow-hidden h-10">
                {distribution.map((d: Record<string, unknown>) => {
                  const pct = totalDistribution > 0 ? ((d.count as number) / totalDistribution) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={d.rating as string}
                      className={`${ratingColor[d.rating as string] ?? 'bg-gray-500'} flex items-center justify-center transition-all`}
                      style={{ width: `${pct}%` }}
                      title={`Rating ${d.rating}: ${d.count} vessels (${pct.toFixed(0)}%)`}
                    >
                      <span className="text-white text-xs font-bold">{d.rating as string}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-3">
                {distribution.map((d: Record<string, unknown>) => (
                  <div key={d.rating as string} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${ratingColor[d.rating as string] ?? 'bg-gray-500'}`} />
                    <span className="text-maritime-400 text-xs">
                      {d.rating as string}: {d.count as number}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-vessel CII Table */}
          {emissionsLoading && <p className="text-maritime-500 text-sm">Loading vessel data...</p>}

          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                  <th className="text-left px-4 py-3">Vessel</th>
                  <th className="text-left px-4 py-3">IMO</th>
                  <th className="text-right px-4 py-3">Distance (NM)</th>
                  <th className="text-right px-4 py-3">Fuel (MT)</th>
                  <th className="text-right px-4 py-3">CO2 (MT)</th>
                  <th className="text-right px-4 py-3">Attained CII</th>
                  <th className="text-right px-4 py-3">Required CII</th>
                  <th className="text-center px-4 py-3">Rating</th>
                </tr>
              </thead>
              <tbody>
                {!emissionsLoading && emissions.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-maritime-500">No emissions data for {year}</td></tr>
                )}
                {emissions.map((e: Record<string, unknown>) => {
                  const vessel = e.vessel as Record<string, unknown> | null;
                  const rating = e.ciiRating as string;
                  return (
                    <tr key={e.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                      <td className="px-4 py-3 text-white text-xs font-medium">{vessel?.name as string ?? '-'}</td>
                      <td className="px-4 py-3 text-maritime-400 text-xs font-mono">{vessel?.imo as string ?? '-'}</td>
                      <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">
                        {(e.distanceNm as number)?.toLocaleString() ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-maritime-300 font-mono text-xs">
                        {fmtNum(e.fuelConsumedMt as number)}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-400 font-mono text-xs">
                        {fmtNum(e.co2EmissionsMt as number)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono text-xs ${ratingTextColor[rating] ?? 'text-maritime-300'}`}>
                        {fmtNum(e.attainedCII as number, 4)}
                      </td>
                      <td className="px-4 py-3 text-right text-maritime-400 font-mono text-xs">
                        {fmtNum(e.requiredCII as number, 4)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${ratingBadge[rating] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {rating ?? '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EU ETS Tab */}
      {activeTab === 'ets' && (
        <div className="space-y-6">
          {etsLoading && <p className="text-maritime-500 text-sm">Loading EU ETS summary...</p>}

          {/* ETS Summary Cards */}
          {etsSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-maritime-800 border-l-4 border-maritime-500 rounded-lg p-4">
                <p className="text-maritime-500 text-xs">Vessels in Scope</p>
                <p className="text-lg font-bold mt-1 text-white">{etsSummary.vesselCount}</p>
              </div>
              <div className="bg-maritime-800 border-l-4 border-orange-500 rounded-lg p-4">
                <p className="text-maritime-500 text-xs">Total CO2 (MT)</p>
                <p className="text-lg font-bold mt-1 text-orange-400">{fmtNum(etsSummary.totalCo2Mt, 0)}</p>
              </div>
              <div className="bg-maritime-800 border-l-4 border-yellow-500 rounded-lg p-4">
                <p className="text-maritime-500 text-xs">Allowances Needed</p>
                <p className="text-lg font-bold mt-1 text-yellow-400">{fmtNum(etsSummary.totalAllowancesNeeded, 0)}</p>
              </div>
              <div className="bg-maritime-800 border-l-4 border-red-500 rounded-lg p-4">
                <p className="text-maritime-500 text-xs">Total Cost</p>
                <p className="text-lg font-bold mt-1 text-red-400">{fmtEur(etsSummary.totalCostEur)}</p>
              </div>
            </div>
          )}

          {/* Per-vessel ETS Table */}
          {emissionsLoading && <p className="text-maritime-500 text-sm">Loading vessel data...</p>}

          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                  <th className="text-left px-4 py-3">Vessel</th>
                  <th className="text-left px-4 py-3">IMO</th>
                  <th className="text-center px-4 py-3">Applicable</th>
                  <th className="text-right px-4 py-3">EU ETS CO2 (MT)</th>
                  <th className="text-right px-4 py-3">Allowances</th>
                  <th className="text-right px-4 py-3">Cost (EUR)</th>
                </tr>
              </thead>
              <tbody>
                {!emissionsLoading && emissions.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-maritime-500">No emissions data for {year}</td></tr>
                )}
                {emissions.map((e: Record<string, unknown>) => {
                  const vessel = e.vessel as Record<string, unknown> | null;
                  const applicable = e.euEtsApplicable as boolean;
                  return (
                    <tr key={e.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                      <td className="px-4 py-3 text-white text-xs font-medium">{vessel?.name as string ?? '-'}</td>
                      <td className="px-4 py-3 text-maritime-400 text-xs font-mono">{vessel?.imo as string ?? '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          applicable
                            ? 'bg-blue-900/50 text-blue-400'
                            : 'bg-maritime-700 text-maritime-500'
                        }`}>
                          {applicable ? 'Applicable' : 'Not Applicable'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-orange-400 font-mono text-xs">
                        {applicable ? fmtNum(e.euEtsCo2Mt as number) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-yellow-400 font-mono text-xs">
                        {applicable ? fmtNum(e.euEtsAllowancesNeeded as number, 0) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-red-400 font-mono text-xs">
                        {applicable ? fmtEur(e.euEtsCostEur as number) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FuelEU Maritime Tab */}
      {activeTab === 'fueleu' && (
        <div className="space-y-6">
          {emissionsLoading && <p className="text-maritime-500 text-sm">Loading FuelEU data...</p>}

          {/* Compliance Overview */}
          {!emissionsLoading && emissions.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(() => {
                const compliant = emissions.filter((e: Record<string, unknown>) => e.fuelEuCompliant === true).length;
                const nonCompliant = emissions.filter((e: Record<string, unknown>) => e.fuelEuCompliant === false).length;
                const totalPenalty = emissions.reduce(
                  (sum: number, e: Record<string, unknown>) => sum + ((e.fuelEuPenalty as number) ?? 0), 0
                );
                return (
                  <>
                    <div className="bg-maritime-800 border-l-4 border-green-500 rounded-lg p-4">
                      <p className="text-maritime-500 text-xs">Compliant Vessels</p>
                      <p className="text-lg font-bold mt-1 text-green-400">{compliant}</p>
                    </div>
                    <div className="bg-maritime-800 border-l-4 border-red-500 rounded-lg p-4">
                      <p className="text-maritime-500 text-xs">Non-Compliant</p>
                      <p className="text-lg font-bold mt-1 text-red-400">{nonCompliant}</p>
                    </div>
                    <div className="bg-maritime-800 border-l-4 border-orange-500 rounded-lg p-4">
                      <p className="text-maritime-500 text-xs">Total Penalties</p>
                      <p className="text-lg font-bold mt-1 text-orange-400">{fmtEur(totalPenalty)}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Per-vessel FuelEU Table */}
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                  <th className="text-left px-4 py-3">Vessel</th>
                  <th className="text-left px-4 py-3">IMO</th>
                  <th className="text-center px-4 py-3">Compliance</th>
                  <th className="text-right px-4 py-3">GHG Intensity</th>
                  <th className="text-right px-4 py-3">Target</th>
                  <th className="text-right px-4 py-3">Variance</th>
                  <th className="text-right px-4 py-3">Penalty (EUR)</th>
                </tr>
              </thead>
              <tbody>
                {!emissionsLoading && emissions.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-maritime-500">No FuelEU data for {year}</td></tr>
                )}
                {emissions.map((e: Record<string, unknown>) => {
                  const vessel = e.vessel as Record<string, unknown> | null;
                  const compliant = e.fuelEuCompliant as boolean;
                  const intensity = e.fuelEuGhgIntensity as number;
                  const target = e.fuelEuTarget as number;
                  const variance = intensity && target ? intensity - target : null;
                  return (
                    <tr key={e.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                      <td className="px-4 py-3 text-white text-xs font-medium">{vessel?.name as string ?? '-'}</td>
                      <td className="px-4 py-3 text-maritime-400 text-xs font-mono">{vessel?.imo as string ?? '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          compliant
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {compliant ? 'Compliant' : 'Non-Compliant'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono text-xs ${
                        compliant ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {intensity ? fmtNum(intensity, 2) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-maritime-400 font-mono text-xs">
                        {target ? fmtNum(target, 2) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {variance !== null ? (
                          <span className={variance > 0 ? 'text-red-400' : 'text-green-400'}>
                            {variance > 0 ? '+' : ''}{fmtNum(variance, 2)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-400 font-mono text-xs">
                        {(e.fuelEuPenalty as number) ? fmtEur(e.fuelEuPenalty as number) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
