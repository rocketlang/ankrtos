import { useState, useMemo } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface LaytimeEvent {
  id: string;
  type: 'arrival' | 'nor-tendered' | 'nor-accepted' | 'berthing' | 'commence' | 'complete' | 'sailing';
  dateTime: string;
  description: string;
  timeUsed?: number; // hours
  remarks?: string;
}

interface LaytimeTerms {
  allowedTime: number; // hours
  laytimeType: 'reversible' | 'non-reversible';
  loadingRate: number; // MT/day
  dischargingRate: number; // MT/day
  demurrageRate: number; // $/day
  despatchRate: number; // $/day (usually 50% of demurrage)
  exceptions: string[];
  terms: string; // e.g., "SHEX" (Sundays/Holidays Excluded)
}

const demoTerms: LaytimeTerms = {
  allowedTime: 72, // 3 days
  laytimeType: 'reversible',
  loadingRate: 10000,
  dischargingRate: 12000,
  demurrageRate: 15000,
  despatchRate: 7500,
  exceptions: [
    'Sundays and holidays',
    'Weather working days',
    'Strikes and lock-outs',
    'Breakdown of ship\'s equipment',
  ],
  terms: 'SHEX (Sundays/Holidays Excluded)',
};

const demoEvents: LaytimeEvent[] = [
  {
    id: '1',
    type: 'arrival',
    dateTime: '2026-02-10 06:00',
    description: 'Arrived Singapore Anchorage',
    remarks: 'Vessel all fast at anchorage',
  },
  {
    id: '2',
    type: 'nor-tendered',
    dateTime: '2026-02-10 06:30',
    description: 'Notice of Readiness Tendered',
    remarks: 'NOR tendered to charterer\'s agents',
  },
  {
    id: '3',
    type: 'nor-accepted',
    dateTime: '2026-02-10 08:00',
    description: 'Notice of Readiness Accepted',
    timeUsed: 1.5,
    remarks: 'Laytime commenced at 08:00 LT',
  },
  {
    id: '4',
    type: 'berthing',
    dateTime: '2026-02-10 14:00',
    description: 'Berthed at Terminal 5, Berth 14',
    timeUsed: 6,
    remarks: 'All fast alongside',
  },
  {
    id: '5',
    type: 'commence',
    dateTime: '2026-02-10 15:30',
    description: 'Commenced Loading Operations',
    timeUsed: 1.5,
    remarks: 'First cargo on board at 15:30',
  },
  {
    id: '6',
    type: 'complete',
    dateTime: '2026-02-12 10:00',
    description: 'Completed Loading - 32,000 MT',
    timeUsed: 42.5,
    remarks: 'Loading completed, hatches secured',
  },
  {
    id: '7',
    type: 'sailing',
    dateTime: '2026-02-12 12:00',
    description: 'Sailed from Singapore',
    timeUsed: 2,
    remarks: 'Let go all ropes, proceeding to sea',
  },
];

// Sundays and holidays for calculation
const holidays = ['2026-02-08']; // Example: 1 Sunday during the period

const clauseLibrary = [
  {
    id: '1',
    title: 'SHEX (Sundays/Holidays Excluded)',
    description: 'Sundays and holidays excluded from laytime counting',
    clause: 'Time used at loading and discharging ports to count unless lost due to vessel\'s breakdown or deficiency of men or stores. Sundays and holidays excluded unless used.',
    type: 'Exception',
  },
  {
    id: '2',
    title: 'SHINC (Sundays/Holidays Included)',
    description: 'Sundays and holidays count as laytime',
    clause: 'All time including Sundays and holidays to count as laytime whether used or not.',
    type: 'Exception',
  },
  {
    id: '3',
    title: 'WWD (Weather Working Days)',
    description: 'Time lost due to weather excluded',
    clause: 'Only weather working days to count. Time lost due to inclement weather preventing cargo operations shall not count as laytime.',
    type: 'Exception',
  },
  {
    id: '4',
    title: 'Reversible Laytime',
    description: 'Total time for loading and discharge combined',
    clause: 'Total laytime allowed for both loading and discharging shall be combined and reversible between ports.',
    type: 'Calculation',
  },
  {
    id: '5',
    title: 'Once on Demurrage, Always on Demurrage',
    description: 'Standard demurrage principle',
    clause: 'Once the vessel is on demurrage, time shall continue to count without interruption, and there shall be no exceptions thereafter.',
    type: 'Demurrage',
  },
];

export default function LaytimeCalculatorShowcase() {
  const [selectedClause, setSelectedClause] = useState<string | null>(null);
  const [showCalculation, setShowCalculation] = useState(false);
  const [cargoQuantity, setCargoQuantity] = useState(32000); // MT

  // Calculate laytime
  const calculation = useMemo(() => {
    // Calculate allowed laytime based on cargo quantity and rate
    const loadingDays = cargoQuantity / demoTerms.loadingRate;
    const dischargingDays = cargoQuantity / demoTerms.dischargingRate;
    const calculatedAllowedTime = demoTerms.laytimeType === 'reversible'
      ? (loadingDays + dischargingDays) * 24
      : Math.max(loadingDays, dischargingDays) * 24;

    // Use charter party allowed time (overrides calculation)
    const allowedTime = demoTerms.allowedTime;

    // Calculate time used from events
    const totalTimeUsed = demoEvents.reduce((sum, e) => sum + (e.timeUsed || 0), 0);

    // Subtract excluded time (Sundays/holidays)
    const excludedTime = holidays.length * 24; // Simplified
    const netTimeUsed = totalTimeUsed - excludedTime;

    // Calculate demurrage or despatch
    const timeDifference = netTimeUsed - allowedTime;
    const isOnDemurrage = timeDifference > 0;

    let amount = 0;
    if (isOnDemurrage) {
      // Demurrage
      const demurrageDays = timeDifference / 24;
      amount = demurrageDays * demoTerms.demurrageRate;
    } else {
      // Despatch
      const despatchDays = Math.abs(timeDifference) / 24;
      amount = despatchDays * demoTerms.despatchRate;
    }

    return {
      allowedTime,
      totalTimeUsed,
      excludedTime,
      netTimeUsed,
      timeDifference,
      isOnDemurrage,
      amount,
      days: Math.abs(timeDifference) / 24,
    };
  }, [cargoQuantity]);

  return (
    <ShowcaseLayout
      title="Laytime & Demurrage Calculator"
      icon="⏱️"
      category="Commercial & Settlement"
      problem="Manual laytime calculations take 3+ hours, prone to errors, disputes over time counting, difficult to track exceptions, no clause library reference, Excel spreadsheets everywhere"
      solution="Automated laytime calculation with visual timeline, instant demurrage/despatch computation, built-in clause library, exception handling, PDF reports, dispute prevention through transparency"
      timeSaved="3 hours/calculation"
      roi="16x"
      accuracy="99.9%"
      nextSection={{
        title: 'Document Chain',
        path: '/demo-showcase/document-chain',
      }}
    >
      {/* Charter Party Terms */}
      <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">📋 Charter Party Terms</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-maritime-400 mb-1">Laytime Allowed</div>
            <div className="text-2xl font-bold text-blue-400">{demoTerms.allowedTime} hours</div>
            <div className="text-xs text-maritime-500 mt-1">({(demoTerms.allowedTime / 24).toFixed(1)} days)</div>
          </div>
          <div>
            <div className="text-sm text-maritime-400 mb-1">Laytime Type</div>
            <div className="text-2xl font-bold text-cyan-400 capitalize">{demoTerms.laytimeType}</div>
            <div className="text-xs text-maritime-500 mt-1">{demoTerms.terms}</div>
          </div>
          <div>
            <div className="text-sm text-maritime-400 mb-1">Demurrage Rate</div>
            <div className="text-2xl font-bold text-red-400">${demoTerms.demurrageRate.toLocaleString()}</div>
            <div className="text-xs text-maritime-500 mt-1">per day</div>
          </div>
          <div>
            <div className="text-sm text-maritime-400 mb-1">Despatch Rate</div>
            <div className="text-2xl font-bold text-green-400">${demoTerms.despatchRate.toLocaleString()}</div>
            <div className="text-xs text-maritime-500 mt-1">per day (50%)</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-maritime-700">
          <div className="text-sm text-maritime-400 mb-2">Exceptions:</div>
          <div className="flex flex-wrap gap-2">
            {demoTerms.exceptions.map((exception, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 text-xs text-purple-400 rounded"
              >
                {exception}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Cargo Quantity Adjuster */}
      <div className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-500/30 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">🎛️ Adjust Cargo Quantity</h3>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium text-maritime-300">
            Cargo Loaded:
          </label>
          <input
            type="range"
            min="20000"
            max="45000"
            step="1000"
            value={cargoQuantity}
            onChange={(e) => setCargoQuantity(parseInt(e.target.value))}
            className="flex-1 h-2 bg-maritime-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-2xl font-bold text-blue-400 w-32 text-right">
            {cargoQuantity.toLocaleString()} MT
          </span>
        </div>
        <div className="flex justify-between text-xs text-maritime-500">
          <span>20,000 MT (Minimum)</span>
          <span>45,000 MT (Maximum)</span>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-6">📊 Laytime Timeline</h3>

        <div className="space-y-4">
          {demoEvents.map((event, index) => {
            const isTimeEvent = event.timeUsed !== undefined;

            return (
              <div key={event.id} className="flex gap-4">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full border-2 z-10 ${
                    isTimeEvent
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-maritime-600 bg-maritime-800'
                  }`} />
                  {index < demoEvents.length - 1 && (
                    <div className="w-0.5 h-full bg-maritime-700 mt-1" />
                  )}
                </div>

                {/* Event content */}
                <div className="flex-1 pb-6">
                  <div className="bg-maritime-900/50 border border-maritime-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-base font-semibold text-white">
                            {event.description}
                          </h4>
                          {isTimeEvent && (
                            <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/50 text-xs text-blue-400 rounded">
                              {event.timeUsed}h used
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-maritime-400">
                          {event.dateTime}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-maritime-800 border border-maritime-600 rounded text-xs text-maritime-400 capitalize">
                        {event.type.replace('-', ' ')}
                      </span>
                    </div>

                    {event.remarks && (
                      <div className="mt-3 p-2 bg-maritime-800/50 rounded text-xs text-maritime-300">
                        <span className="text-maritime-500">Remarks:</span> {event.remarks}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calculation Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowCalculation(!showCalculation)}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/30"
        >
          {showCalculation ? '🔄 Recalculate' : '🧮 Calculate Laytime & Demurrage'}
        </button>
      </div>

      {/* Calculation Results */}
      {showCalculation && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="text-sm text-blue-400 mb-1">Allowed Time</div>
              <div className="text-3xl font-bold text-blue-400">{calculation.allowedTime}h</div>
              <div className="text-xs text-blue-500/70 mt-1">charter party</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="text-sm text-purple-400 mb-1">Time Used</div>
              <div className="text-3xl font-bold text-purple-400">{calculation.netTimeUsed}h</div>
              <div className="text-xs text-purple-500/70 mt-1">net (excl. exceptions)</div>
            </div>
            <div className={`${calculation.isOnDemurrage ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'} border rounded-lg p-4`}>
              <div className={`text-sm ${calculation.isOnDemurrage ? 'text-red-400' : 'text-green-400'} mb-1`}>
                Time Difference
              </div>
              <div className={`text-3xl font-bold ${calculation.isOnDemurrage ? 'text-red-400' : 'text-green-400'}`}>
                {calculation.isOnDemurrage ? '+' : ''}{calculation.timeDifference.toFixed(1)}h
              </div>
              <div className={`text-xs ${calculation.isOnDemurrage ? 'text-red-500/70' : 'text-green-500/70'} mt-1`}>
                ({calculation.days.toFixed(2)} days)
              </div>
            </div>
            <div className={`${calculation.isOnDemurrage ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'} border rounded-lg p-4`}>
              <div className={`text-sm ${calculation.isOnDemurrage ? 'text-red-400' : 'text-green-400'} mb-1`}>
                {calculation.isOnDemurrage ? 'Demurrage Due' : 'Despatch Due'}
              </div>
              <div className={`text-3xl font-bold ${calculation.isOnDemurrage ? 'text-red-400' : 'text-green-400'}`}>
                ${calculation.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className={`text-xs ${calculation.isOnDemurrage ? 'text-red-500/70' : 'text-green-500/70'} mt-1`}>
                {calculation.isOnDemurrage ? 'payable to owner' : 'payable to charterer'}
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📊 Calculation Breakdown</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-maritime-700">
                <span className="text-maritime-400">Cargo Quantity:</span>
                <span className="text-white font-semibold">{cargoQuantity.toLocaleString()} MT</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-maritime-700">
                <span className="text-maritime-400">Loading Rate:</span>
                <span className="text-white">{demoTerms.loadingRate.toLocaleString()} MT/day</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-maritime-700">
                <span className="text-maritime-400">Laytime Type:</span>
                <span className="text-white capitalize">{demoTerms.laytimeType}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-maritime-700">
                <span className="text-maritime-400">Charter Party Allowed Time:</span>
                <span className="text-blue-400 font-semibold">{calculation.allowedTime} hours</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-maritime-700">
                <span className="text-maritime-400">Total Time Used (Gross):</span>
                <span className="text-white">{calculation.totalTimeUsed} hours</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-maritime-700">
                <span className="text-maritime-400">Less: Excluded Time (Sundays/Holidays):</span>
                <span className="text-yellow-400">-{calculation.excludedTime} hours</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b-2 border-maritime-600">
                <span className="text-maritime-400 font-semibold">Net Time Used:</span>
                <span className="text-purple-400 font-bold">{calculation.netTimeUsed} hours</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-maritime-900/50 rounded px-3">
                <span className="text-white font-semibold">Time Over/Under Allowed:</span>
                <span className={`font-bold text-lg ${calculation.isOnDemurrage ? 'text-red-400' : 'text-green-400'}`}>
                  {calculation.isOnDemurrage ? '+' : ''}{calculation.timeDifference.toFixed(1)} hours ({calculation.days.toFixed(2)} days)
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded px-3">
                <span className="text-white font-semibold text-lg">
                  {calculation.isOnDemurrage ? 'DEMURRAGE DUE TO OWNER:' : 'DESPATCH DUE TO CHARTERER:'}
                </span>
                <span className={`font-bold text-2xl ${calculation.isOnDemurrage ? 'text-red-400' : 'text-green-400'}`}>
                  ${calculation.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-maritime-500 pt-2">
                <span>Calculation: {calculation.days.toFixed(4)} days × ${calculation.isOnDemurrage ? demoTerms.demurrageRate.toLocaleString() : demoTerms.despatchRate.toLocaleString()}/day</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              📄 Generate PDF Report
            </button>
            <button className="px-6 py-3 bg-maritime-700 hover:bg-maritime-600 text-white rounded-lg transition-colors">
              📧 Email to Charterer
            </button>
            <button className="px-6 py-3 bg-maritime-700 hover:bg-maritime-600 text-white rounded-lg transition-colors">
              💾 Save Calculation
            </button>
            <button className="px-6 py-3 bg-maritime-700 hover:bg-maritime-600 text-white rounded-lg transition-colors">
              🔄 Export to Excel
            </button>
          </div>
        </div>
      )}

      {/* Clause Library */}
      <div className="mt-8 bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📚 Laytime Clause Library</h3>
        <p className="text-sm text-maritime-400 mb-4">
          Reference standard laytime clauses and definitions
        </p>

        <div className="grid grid-cols-2 gap-4">
          {clauseLibrary.map((clause) => (
            <button
              key={clause.id}
              onClick={() => setSelectedClause(selectedClause === clause.id ? null : clause.id)}
              className={`text-left p-4 rounded-lg border transition-all ${
                selectedClause === clause.id
                  ? 'bg-blue-600/20 border-blue-500'
                  : 'bg-maritime-900/50 border-maritime-700 hover:border-maritime-600'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">{clause.title}</h4>
                <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/50 text-xs text-purple-400 rounded">
                  {clause.type}
                </span>
              </div>
              <p className="text-xs text-maritime-400 mb-2">{clause.description}</p>

              {selectedClause === clause.id && (
                <div className="mt-3 pt-3 border-t border-maritime-600">
                  <div className="text-xs text-maritime-500 mb-1">Full Clause:</div>
                  <p className="text-xs text-maritime-300 italic leading-relaxed">
                    "{clause.clause}"
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-3 gap-6 mt-8">
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
          <div className="text-2xl mb-3">⚡</div>
          <h3 className="text-lg font-semibold text-white mb-2">Instant Calculation</h3>
          <p className="text-sm text-maritime-400">
            Complex laytime calculations done in seconds with automatic exception handling and
            SHEX/SHINC/WWD support.
          </p>
        </div>

        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
          <div className="text-2xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-white mb-2">Clause Library</h3>
          <p className="text-sm text-maritime-400">
            Built-in library of standard clauses (BIMCO, GENCON, Worldscale) with explanations
            and precedents.
          </p>
        </div>

        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
          <div className="text-2xl mb-3">🛡️</div>
          <h3 className="text-lg font-semibold text-white mb-2">Dispute Prevention</h3>
          <p className="text-sm text-maritime-400">
            Transparent calculations with full audit trail, PDF reports, and automatic time bar
            reminders prevent disputes.
          </p>
        </div>
      </div>
    </ShowcaseLayout>
  );
}
