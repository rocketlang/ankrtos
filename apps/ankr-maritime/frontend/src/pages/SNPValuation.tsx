import { useQuery, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';

const VESSELS_QUERY = gql`
  query VesselsForValuation {
    vessels {
      id name imo type dwt yearBuilt flag classificationSociety
    }
  }
`

interface ComparableSale {
  type: string
  dwt: string
  yearBuilt: string
  salePrice: string
  saleDate: string
}

interface ValuationResult {
  comparable: number | null
  dcf: number | null
  replacement: number | null
  scrap: number | null
  ensemble: number | null
}

const emptyComparable: ComparableSale = { type: '', dwt: '', yearBuilt: '', salePrice: '', saleDate: '' }

const confidenceLevel = (value: number | null, ensemble: number | null): { label: string; color: string } => {
  if (!value || !ensemble) return { label: 'N/A', color: 'bg-gray-800/60 text-gray-400' }
  const diff = Math.abs(value - ensemble) / ensemble
  if (diff < 0.1) return { label: 'High', color: 'bg-green-900/50 text-green-400' }
  if (diff < 0.25) return { label: 'Medium', color: 'bg-yellow-900/50 text-yellow-400' }
  return { label: 'Low', color: 'bg-red-900/50 text-red-400' }
}

export function SNPValuation() {
  const { data } = useQuery(VESSELS_QUERY)
  const [selectedVesselId, setSelectedVesselId] = useState('')
  const [comparables, setComparables] = useState<ComparableSale[]>([{ ...emptyComparable }])
  const [dcfInputs, setDcfInputs] = useState({ dailyTCE: '15000', dailyOPEX: '7000', remainingLife: '15', discountRate: '8' })
  const [replacementInputs, setReplacementInputs] = useState({ newbuildPrice: '35000000', economicLife: '25' })
  const [scrapInputs, setScrapInputs] = useState({ ldtPricePerTon: '450' })
  const [results, setResults] = useState<ValuationResult | null>(null)

  const vessels = data?.vessels ?? []
  const selectedVessel = vessels.find((v: Record<string, unknown>) => v.id === selectedVesselId) as Record<string, unknown> | undefined

  const currentYear = new Date().getFullYear()
  const vesselAge = selectedVessel ? currentYear - (selectedVessel.yearBuilt as number) : 0
  const vesselDwt = (selectedVessel?.dwt as number) ?? 0

  const addComparable = () => setComparables((c) => [...c, { ...emptyComparable }])
  const removeComparable = (i: number) => setComparables((c) => c.filter((_, idx) => idx !== i))
  const updateComparable = (i: number, field: keyof ComparableSale, value: string) => {
    setComparables((c) => c.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const calculate = () => {
    // 1. Comparable Sales - age-adjusted weighted average
    let compValue: number | null = null
    const validComps = comparables.filter((c) => c.salePrice && c.yearBuilt && c.dwt)
    if (validComps.length > 0) {
      let totalWeight = 0
      let weightedSum = 0
      validComps.forEach((c) => {
        const compAge = currentYear - Number(c.yearBuilt)
        const ageDiff = Math.abs(compAge - vesselAge)
        const dwtRatio = vesselDwt / Number(c.dwt)
        const weight = 1 / (1 + ageDiff * 0.1)
        const adjustedPrice = Number(c.salePrice) * dwtRatio * (1 - (vesselAge - compAge) * 0.02)
        weightedSum += adjustedPrice * weight
        totalWeight += weight
      })
      compValue = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null
    }

    // 2. DCF - standard NPV formula
    let dcfValue: number | null = null
    const dailyTCE = Number(dcfInputs.dailyTCE)
    const dailyOPEX = Number(dcfInputs.dailyOPEX)
    const remainingLife = Number(dcfInputs.remainingLife)
    const discountRate = Number(dcfInputs.discountRate) / 100
    if (dailyTCE && dailyOPEX && remainingLife && discountRate) {
      const annualCashFlow = (dailyTCE - dailyOPEX) * 350
      let npv = 0
      for (let y = 1; y <= remainingLife; y++) {
        npv += annualCashFlow / Math.pow(1 + discountRate, y)
      }
      dcfValue = Math.round(npv)
    }

    // 3. Replacement Cost - straight-line depreciation
    let replValue: number | null = null
    const newbuildPrice = Number(replacementInputs.newbuildPrice)
    const economicLife = Number(replacementInputs.economicLife)
    if (newbuildPrice && economicLife) {
      const depreciation = newbuildPrice / economicLife
      replValue = Math.max(0, Math.round(newbuildPrice - (depreciation * vesselAge)))
    }

    // 4. Scrap Floor - DWT * LDT factor * price
    let scrapValue: number | null = null
    const ldtPrice = Number(scrapInputs.ldtPricePerTon)
    if (ldtPrice && vesselDwt) {
      const estimatedLDT = vesselDwt * 0.15
      scrapValue = Math.round(estimatedLDT * ldtPrice)
    }

    // Ensemble - weighted average of available methods
    const methods = [
      { value: compValue, weight: 0.35 },
      { value: dcfValue, weight: 0.30 },
      { value: replValue, weight: 0.25 },
      { value: scrapValue, weight: 0.10 },
    ].filter((m) => m.value !== null && m.value > 0)
    const totalWeight = methods.reduce((s, m) => s + m.weight, 0)
    const ensemble = methods.length > 0
      ? Math.round(methods.reduce((s, m) => s + (m.value as number) * (m.weight / totalWeight), 0))
      : null

    setResults({ comparable: compValue, dcf: dcfValue, replacement: replValue, scrap: scrapValue, ensemble })
  }

  const formatUSD = (v: number | null) =>
    v !== null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : 'N/A'

  const maxVal = results ? Math.max(
    results.comparable ?? 0, results.dcf ?? 0, results.replacement ?? 0, results.scrap ?? 0
  ) : 1

  return (
    <div className="p-8 bg-maritime-900 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Vessel Valuation Calculator</h1>
        <p className="text-maritime-400 text-sm mt-1">Multi-method valuation for S&amp;P decision support</p>
      </div>

      {/* Vessel Selector */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5 mb-6">
        <h3 className="text-white text-sm font-medium mb-3">Select Vessel</h3>
        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-maritime-400 mb-1">Vessel</label>
            <select
              value={selectedVesselId}
              onChange={(e) => setSelectedVesselId(e.target.value)}
              className="w-full bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select vessel...</option>
              {vessels.map((v: Record<string, unknown>) => (
                <option key={v.id as string} value={v.id as string}>
                  {v.name as string} (IMO {v.imo as string})
                </option>
              ))}
            </select>
          </div>
          {selectedVessel && (
            <>
              <div>
                <label className="block text-xs text-maritime-400 mb-1">Type</label>
                <p className="text-maritime-300 text-sm capitalize">{(selectedVessel.type as string)?.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-xs text-maritime-400 mb-1">DWT</label>
                <p className="text-maritime-300 text-sm">{vesselDwt.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs text-maritime-400 mb-1">Year Built / Age</label>
                <p className="text-maritime-300 text-sm">{selectedVessel.yearBuilt as number} ({vesselAge} yrs)</p>
              </div>
              <div>
                <label className="block text-xs text-maritime-400 mb-1">Flag</label>
                <p className="text-maritime-300 text-sm">{selectedVessel.flag as string}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Comparable Sales */}
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-medium">1. Comparable Sales</h3>
            <button onClick={addComparable} className="text-blue-400 hover:text-blue-300 text-xs">+ Add Row</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-maritime-700 text-maritime-400">
                  <th className="text-left px-2 py-2">Type</th>
                  <th className="text-left px-2 py-2">DWT</th>
                  <th className="text-left px-2 py-2">Year</th>
                  <th className="text-left px-2 py-2">Sale Price ($)</th>
                  <th className="text-left px-2 py-2">Date</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {comparables.map((c, i) => (
                  <tr key={i} className="border-b border-maritime-700/50">
                    <td className="px-1 py-1">
                      <input value={c.type} onChange={(e) => updateComparable(i, 'type', e.target.value)}
                        className="bg-maritime-900 border border-maritime-600 rounded px-2 py-1 text-white text-xs w-full" placeholder="Bulk" />
                    </td>
                    <td className="px-1 py-1">
                      <input type="number" value={c.dwt} onChange={(e) => updateComparable(i, 'dwt', e.target.value)}
                        className="bg-maritime-900 border border-maritime-600 rounded px-2 py-1 text-white text-xs w-full" placeholder="75000" />
                    </td>
                    <td className="px-1 py-1">
                      <input type="number" value={c.yearBuilt} onChange={(e) => updateComparable(i, 'yearBuilt', e.target.value)}
                        className="bg-maritime-900 border border-maritime-600 rounded px-2 py-1 text-white text-xs w-full" placeholder="2015" />
                    </td>
                    <td className="px-1 py-1">
                      <input type="number" value={c.salePrice} onChange={(e) => updateComparable(i, 'salePrice', e.target.value)}
                        className="bg-maritime-900 border border-maritime-600 rounded px-2 py-1 text-white text-xs w-full" placeholder="12000000" />
                    </td>
                    <td className="px-1 py-1">
                      <input type="date" value={c.saleDate} onChange={(e) => updateComparable(i, 'saleDate', e.target.value)}
                        className="bg-maritime-900 border border-maritime-600 rounded px-2 py-1 text-white text-xs w-full" />
                    </td>
                    <td className="px-1 py-1">
                      {comparables.length > 1 && (
                        <button onClick={() => removeComparable(i)} className="text-red-400 hover:text-red-300 text-xs px-1">X</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DCF */}
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
          <h3 className="text-white text-sm font-medium mb-3">2. Discounted Cash Flow (DCF)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-maritime-400 mb-1">Daily TCE Rate ($)</label>
              <input type="number" value={dcfInputs.dailyTCE}
                onChange={(e) => setDcfInputs((f) => ({ ...f, dailyTCE: e.target.value }))}
                className="w-full bg-maritime-900 border border-maritime-600 rounded px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-maritime-400 mb-1">Daily OPEX ($)</label>
              <input type="number" value={dcfInputs.dailyOPEX}
                onChange={(e) => setDcfInputs((f) => ({ ...f, dailyOPEX: e.target.value }))}
                className="w-full bg-maritime-900 border border-maritime-600 rounded px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-maritime-400 mb-1">Remaining Life (years)</label>
              <input type="number" value={dcfInputs.remainingLife}
                onChange={(e) => setDcfInputs((f) => ({ ...f, remainingLife: e.target.value }))}
                className="w-full bg-maritime-900 border border-maritime-600 rounded px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-maritime-400 mb-1">Discount Rate (%)</label>
              <input type="number" value={dcfInputs.discountRate}
                onChange={(e) => setDcfInputs((f) => ({ ...f, discountRate: e.target.value }))}
                className="w-full bg-maritime-900 border border-maritime-600 rounded px-3 py-2 text-white text-sm" />
            </div>
          </div>
        </div>

        {/* Replacement Cost */}
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
          <h3 className="text-white text-sm font-medium mb-3">3. Replacement Cost</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-maritime-400 mb-1">Newbuild Price ($)</label>
              <input type="number" value={replacementInputs.newbuildPrice}
                onChange={(e) => setReplacementInputs((f) => ({ ...f, newbuildPrice: e.target.value }))}
                className="w-full bg-maritime-900 border border-maritime-600 rounded px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-maritime-400 mb-1">Economic Life (years)</label>
              <input type="number" value={replacementInputs.economicLife}
                onChange={(e) => setReplacementInputs((f) => ({ ...f, economicLife: e.target.value }))}
                className="w-full bg-maritime-900 border border-maritime-600 rounded px-3 py-2 text-white text-sm" />
            </div>
          </div>
        </div>

        {/* Scrap Floor */}
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
          <h3 className="text-white text-sm font-medium mb-3">4. Scrap Floor</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-maritime-400 mb-1">LDT Price ($/ton)</label>
              <input type="number" value={scrapInputs.ldtPricePerTon}
                onChange={(e) => setScrapInputs((f) => ({ ...f, ldtPricePerTon: e.target.value }))}
                className="w-full bg-maritime-900 border border-maritime-600 rounded px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-maritime-400 mb-1">Estimated LDT (tons)</label>
              <p className="text-maritime-300 text-sm mt-1">
                {vesselDwt ? `${Math.round(vesselDwt * 0.15).toLocaleString()} (15% of DWT)` : 'Select vessel first'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={calculate}
          disabled={!selectedVesselId}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg text-sm font-medium transition-colors"
        >
          Calculate Valuation
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Ensemble Value */}
          <div className="bg-maritime-800 border border-blue-600/50 rounded-lg p-6 text-center">
            <p className="text-maritime-400 text-sm mb-1">Ensemble Valuation</p>
            <p className="text-white text-4xl font-bold">{formatUSD(results.ensemble)}</p>
            <p className="text-maritime-500 text-xs mt-2">
              Weighted average: Comparable (35%), DCF (30%), Replacement (25%), Scrap (10%)
            </p>
          </div>

          {/* Method Cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Comparable Sales', value: results.comparable },
              { label: 'Discounted Cash Flow', value: results.dcf },
              { label: 'Replacement Cost', value: results.replacement },
              { label: 'Scrap Floor', value: results.scrap },
            ].map((m) => {
              const conf = confidenceLevel(m.value, results.ensemble)
              return (
                <div key={m.label} className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
                  <p className="text-maritime-400 text-xs mb-1">{m.label}</p>
                  <p className="text-white text-xl font-bold">{formatUSD(m.value)}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${conf.color}`}>
                    {conf.label} confidence
                  </span>
                </div>
              )
            })}
          </div>

          {/* Bar Chart Comparison */}
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
            <h3 className="text-white text-sm font-medium mb-4">Method Comparison</h3>
            <div className="space-y-3">
              {[
                { label: 'Comparable', value: results.comparable, color: 'bg-blue-500' },
                { label: 'DCF', value: results.dcf, color: 'bg-indigo-500' },
                { label: 'Replacement', value: results.replacement, color: 'bg-purple-500' },
                { label: 'Scrap', value: results.scrap, color: 'bg-amber-500' },
              ].map((m) => {
                const pct = m.value && maxVal ? Math.round((m.value / maxVal) * 100) : 0
                return (
                  <div key={m.label} className="flex items-center gap-3">
                    <span className="text-maritime-400 text-xs w-24">{m.label}</span>
                    <div className="flex-1 bg-maritime-700 rounded h-6 relative">
                      <div className={`${m.color} h-6 rounded transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-white text-xs w-28 text-right">{formatUSD(m.value)}</span>
                  </div>
                )
              })}
              {/* Ensemble line */}
              {results.ensemble && maxVal > 0 && (
                <div className="flex items-center gap-3 pt-2 border-t border-maritime-700">
                  <span className="text-white text-xs w-24 font-bold">Ensemble</span>
                  <div className="flex-1 bg-maritime-700 rounded h-6 relative">
                    <div className="bg-green-500 h-6 rounded transition-all" style={{ width: `${Math.round((results.ensemble / maxVal) * 100)}%` }} />
                  </div>
                  <span className="text-white text-xs w-28 text-right font-bold">{formatUSD(results.ensemble)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
