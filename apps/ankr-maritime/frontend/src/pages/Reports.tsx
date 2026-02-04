import { useQuery, useLazyQuery, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { NextStepBanner } from '../components/NextStepBanner';

const FLEET_SUMMARY = gql`
  query FleetSummary {
    fleetSummary {
      totalVoyages completedVoyages activeVoyages
      totalRevenue totalCosts totalDemurrage totalDespatch netProfit currency
    }
  }
`;

const VOYAGE_PNL = gql`
  query VoyagePnL($voyageId: String!) {
    voyagePnL(voyageId: $voyageId) {
      voyageId voyageNumber vesselName status
      revenue daCosts demurrage despatch netResult currency
      revenueItems { category description amount currency }
      costItems { category description amount currency }
    }
  }
`;

const VOYAGES_LIST = gql`
  query Voyages { voyages { id voyageNumber status } }
`;

function fmt(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

export function Reports() {
  const { data: fleetData, loading: fleetLoading } = useQuery(FLEET_SUMMARY);
  const { data: voyagesData } = useQuery(VOYAGES_LIST);
  const [fetchPnL, { data: pnlData, loading: pnlLoading }] = useLazyQuery(VOYAGE_PNL);
  const [selectedVoyage, setSelectedVoyage] = useState('');

  const fleet = fleetData?.fleetSummary;
  const pnl = pnlData?.voyagePnL;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Financial Reports</h1>

      {/* Fleet Summary */}
      <section>
        <h2 className="text-sm font-medium text-maritime-400 mb-3">Fleet Summary</h2>
        {fleetLoading ? (
          <p className="text-maritime-500 text-sm">Loading fleet data...</p>
        ) : fleet ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Voyages', value: fleet.totalVoyages, color: 'text-white' },
              { label: 'Active', value: fleet.activeVoyages, color: 'text-blue-400' },
              { label: 'Completed', value: fleet.completedVoyages, color: 'text-green-400' },
              { label: 'Net Profit', value: fmt(fleet.netProfit, fleet.currency), color: fleet.netProfit >= 0 ? 'text-green-400' : 'text-red-400' },
              { label: 'Revenue', value: fmt(fleet.totalRevenue, fleet.currency), color: 'text-emerald-400' },
              { label: 'DA Costs', value: fmt(fleet.totalCosts, fleet.currency), color: 'text-orange-400' },
              { label: 'Demurrage', value: fmt(fleet.totalDemurrage, fleet.currency), color: 'text-red-400' },
              { label: 'Despatch', value: fmt(fleet.totalDespatch, fleet.currency), color: 'text-cyan-400' },
            ].map((s) => (
              <div key={s.label} className="bg-maritime-800 border border-maritime-700 rounded p-4">
                <p className="text-maritime-500 text-xs">{s.label}</p>
                <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-maritime-500 text-sm">No fleet data</p>
        )}
      </section>

      {/* Voyage P&L Selector */}
      <section>
        <h2 className="text-sm font-medium text-maritime-400 mb-3">Voyage P&L Report</h2>
        <div className="flex gap-3 items-center mb-4">
          <select
            value={selectedVoyage}
            onChange={(e) => setSelectedVoyage(e.target.value)}
            className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-2"
          >
            <option value="">Select a voyage...</option>
            {voyagesData?.voyages?.map((v: { id: string; voyageNumber: string; status: string }) => (
              <option key={v.id} value={v.id}>
                {v.voyageNumber} ({v.status})
              </option>
            ))}
          </select>
          <button
            onClick={() => selectedVoyage && fetchPnL({ variables: { voyageId: selectedVoyage } })}
            disabled={!selectedVoyage || pnlLoading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-maritime-700 text-white text-sm px-4 py-2 rounded"
          >
            {pnlLoading ? 'Loading...' : 'Generate P&L'}
          </button>
        </div>

        {/* P&L Result */}
        {pnl && (
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-maritime-700 flex justify-between items-center">
              <div>
                <h3 className="text-white font-medium">{pnl.voyageNumber} — {pnl.vesselName}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  pnl.status === 'completed' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                }`}>{pnl.status}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-maritime-500">Net Result</p>
                  <p className={`text-xl font-bold ${pnl.netResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {fmt(pnl.netResult, pnl.currency)}
                  </p>
                </div>
                <a href={`/api/pdf/voyage-pnl/${pnl.voyageId}`} target="_blank" rel="noreferrer"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded">
                  PDF
                </a>
              </div>
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-4 gap-0 border-b border-maritime-700">
              {[
                { label: 'Revenue', val: pnl.revenue, color: 'text-emerald-400' },
                { label: 'DA Costs', val: pnl.daCosts, color: 'text-orange-400' },
                { label: 'Demurrage', val: pnl.demurrage, color: 'text-red-400' },
                { label: 'Despatch', val: pnl.despatch, color: 'text-cyan-400' },
              ].map((s) => (
                <div key={s.label} className="p-3 border-r border-maritime-700 last:border-r-0">
                  <p className="text-maritime-500 text-xs">{s.label}</p>
                  <p className={`text-sm font-semibold ${s.color}`}>{fmt(s.val, pnl.currency)}</p>
                </div>
              ))}
            </div>

            {/* Line items */}
            <div className="grid grid-cols-2 divide-x divide-maritime-700">
              {/* Revenue items */}
              <div className="p-4">
                <h4 className="text-emerald-400 text-xs font-medium mb-2">Revenue Items</h4>
                {pnl.revenueItems.length === 0 && <p className="text-maritime-600 text-xs">No revenue recorded</p>}
                {pnl.revenueItems.map((item: { category: string; description: string; amount: number; currency: string }, i: number) => (
                  <div key={i} className="flex justify-between py-1 text-xs">
                    <span className="text-maritime-300">{item.description}</span>
                    <span className="text-emerald-400 font-mono">{fmt(item.amount, item.currency)}</span>
                  </div>
                ))}
              </div>
              {/* Cost items */}
              <div className="p-4">
                <h4 className="text-orange-400 text-xs font-medium mb-2">Cost Items</h4>
                {pnl.costItems.length === 0 && <p className="text-maritime-600 text-xs">No costs recorded</p>}
                {pnl.costItems.map((item: { category: string; description: string; amount: number; currency: string }, i: number) => (
                  <div key={i} className="flex justify-between py-1 text-xs">
                    <span className="text-maritime-300">{item.description}</span>
                    <span className="text-orange-400 font-mono">{fmt(item.amount, item.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <NextStepBanner />
    </div>
  );
}
