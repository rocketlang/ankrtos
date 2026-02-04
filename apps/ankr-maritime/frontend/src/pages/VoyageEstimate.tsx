import { useLazyQuery, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { NextStepBanner } from '../components/NextStepBanner';

const ESTIMATE_QUERY = gql`
  query Estimate($input: VoyageEstimateInput!) {
    calculateVoyageEstimate(input: $input) {
      grossRevenue brokerComm addressComm netRevenue
      seaDays portDays totalDays
      bunkerIfoSea bunkerIfoPort bunkerMgo totalBunkerCost
      loadPortCost dischargePortCost totalPortCost
      canalDues insurance miscCosts totalCosts
      netResult tce currency
    }
  }
`;

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const defaults = {
  vesselDwt: '82000', cargoQuantity: '75000', freightRate: '14.5', freightUnit: 'per_mt',
  seaDistanceNm: '4200', speedKnots: '13.5',
  bunkerPriceIfo: '450', bunkerPriceMgo: '850',
  consumptionSeaIfo: '32', consumptionPortIfo: '4', consumptionMgo: '2',
  loadPortDa: '45000', dischargePortDa: '55000',
  loadDays: '3', dischargeDays: '4',
  brokerCommPct: '1.25', addressCommPct: '3.75',
  canalDues: '0', insurance: '0', miscCosts: '5000',
};

export function VoyageEstimate() {
  const [form, setForm] = useState(defaults);
  const [calculate, { data, loading }] = useLazyQuery(ESTIMATE_QUERY);

  const handleCalculate = () => {
    calculate({
      variables: {
        input: {
          vesselDwt: parseFloat(form.vesselDwt),
          cargoQuantity: parseFloat(form.cargoQuantity),
          freightRate: parseFloat(form.freightRate),
          freightUnit: form.freightUnit,
          seaDistanceNm: parseFloat(form.seaDistanceNm),
          speedKnots: parseFloat(form.speedKnots),
          bunkerPriceIfo: parseFloat(form.bunkerPriceIfo),
          bunkerPriceMgo: parseFloat(form.bunkerPriceMgo),
          consumptionSeaIfo: parseFloat(form.consumptionSeaIfo),
          consumptionPortIfo: parseFloat(form.consumptionPortIfo),
          consumptionMgo: parseFloat(form.consumptionMgo),
          loadPortDa: parseFloat(form.loadPortDa),
          dischargePortDa: parseFloat(form.dischargePortDa),
          loadDays: parseFloat(form.loadDays),
          dischargeDays: parseFloat(form.dischargeDays),
          brokerCommPct: parseFloat(form.brokerCommPct),
          addressCommPct: parseFloat(form.addressCommPct),
          canalDues: parseFloat(form.canalDues),
          insurance: parseFloat(form.insurance),
          miscCosts: parseFloat(form.miscCosts),
        },
      },
    });
  };

  const r = data?.calculateVoyageEstimate;
  const f = (key: string, label: string, half = false) => (
    <div className={half ? '' : ''}>
      <label className="text-maritime-400 text-xs">{label}</label>
      <input
        value={form[key as keyof typeof form]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1"
        type="number"
        step="any"
      />
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-4">Voyage Estimate Calculator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-4">
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-3">Cargo & Freight</h3>
            <div className="grid grid-cols-2 gap-3">
              {f('vesselDwt', 'Vessel DWT (MT)')}
              {f('cargoQuantity', 'Cargo Qty (MT)')}
              {f('freightRate', 'Freight Rate')}
              <div>
                <label className="text-maritime-400 text-xs">Freight Unit</label>
                <select value={form.freightUnit} onChange={(e) => setForm({ ...form, freightUnit: e.target.value })}
                  className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1">
                  <option value="per_mt">Per MT</option>
                  <option value="lumpsum">Lumpsum</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-3">Voyage</h3>
            <div className="grid grid-cols-2 gap-3">
              {f('seaDistanceNm', 'Sea Distance (NM)')}
              {f('speedKnots', 'Speed (knots)')}
              {f('loadDays', 'Loading Days')}
              {f('dischargeDays', 'Discharge Days')}
            </div>
          </div>

          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-3">Bunkers</h3>
            <div className="grid grid-cols-2 gap-3">
              {f('bunkerPriceIfo', 'IFO Price ($/MT)')}
              {f('bunkerPriceMgo', 'MGO Price ($/MT)')}
              {f('consumptionSeaIfo', 'Sea IFO (MT/day)')}
              {f('consumptionPortIfo', 'Port IFO (MT/day)')}
              {f('consumptionMgo', 'MGO (MT/day)')}
            </div>
          </div>

          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-3">Costs & Commission</h3>
            <div className="grid grid-cols-2 gap-3">
              {f('loadPortDa', 'Load Port DA ($)')}
              {f('dischargePortDa', 'Disch Port DA ($)')}
              {f('brokerCommPct', 'Broker Comm %')}
              {f('addressCommPct', 'Address Comm %')}
              {f('canalDues', 'Canal Dues ($)')}
              {f('miscCosts', 'Misc Costs ($)')}
            </div>
          </div>

          <button onClick={handleCalculate} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-maritime-700 text-white font-medium py-2.5 rounded-lg">
            {loading ? 'Calculating...' : 'Calculate Estimate'}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {r ? (
            <>
              {/* TCE Highlight */}
              <div className={`rounded-lg p-6 text-center ${r.netResult >= 0 ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'}`}>
                <p className="text-maritime-400 text-xs">Time Charter Equivalent (TCE)</p>
                <p className={`text-3xl font-bold mt-1 ${r.tce >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {fmt(r.tce)}/day
                </p>
                <p className="text-maritime-500 text-xs mt-2">
                  Net Result: <span className={r.netResult >= 0 ? 'text-green-400' : 'text-red-400'}>{fmt(r.netResult)}</span>
                  &nbsp;&middot;&nbsp; {r.totalDays} days
                </p>
              </div>

              {/* Revenue */}
              <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
                <h3 className="text-emerald-400 text-xs font-medium mb-2">Revenue</h3>
                {[
                  ['Gross Freight', r.grossRevenue],
                  ['Broker Comm', -r.brokerComm],
                  ['Address Comm', -r.addressComm],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between py-1 text-xs">
                    <span className="text-maritime-300">{label as string}</span>
                    <span className={`font-mono ${(val as number) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(val as number)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1 text-xs border-t border-maritime-700 mt-1 pt-2 font-bold">
                  <span className="text-white">Net Revenue</span>
                  <span className="text-emerald-400 font-mono">{fmt(r.netRevenue)}</span>
                </div>
              </div>

              {/* Voyage Time */}
              <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
                <h3 className="text-blue-400 text-xs font-medium mb-2">Voyage Duration</h3>
                {[
                  ['Sea Days', `${r.seaDays} days`],
                  ['Port Days', `${r.portDays} days`],
                  ['Total', `${r.totalDays} days`],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between py-1 text-xs">
                    <span className="text-maritime-300">{label as string}</span>
                    <span className="text-white">{val as string}</span>
                  </div>
                ))}
              </div>

              {/* Costs */}
              <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
                <h3 className="text-orange-400 text-xs font-medium mb-2">Costs</h3>
                {[
                  ['Bunker — IFO Sea', r.bunkerIfoSea],
                  ['Bunker — IFO Port', r.bunkerIfoPort],
                  ['Bunker — MGO', r.bunkerMgo],
                  ['Load Port DA', r.loadPortCost],
                  ['Discharge Port DA', r.dischargePortCost],
                  ['Canal Dues', r.canalDues],
                  ['Insurance', r.insurance],
                  ['Miscellaneous', r.miscCosts],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between py-1 text-xs">
                    <span className="text-maritime-300">{label as string}</span>
                    <span className="text-orange-400 font-mono">{fmt(val as number)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1 text-xs border-t border-maritime-700 mt-1 pt-2 font-bold">
                  <span className="text-white">Total Costs</span>
                  <span className="text-orange-400 font-mono">{fmt(r.totalCosts)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
              <p className="text-maritime-400 text-sm">Enter voyage parameters and click Calculate</p>
              <p className="text-maritime-600 text-xs mt-2">Pre-filled with typical Supramax bulk carrier values</p>
            </div>
          )}
        </div>
      </div>

      <NextStepBanner />
    </div>
  );
}
