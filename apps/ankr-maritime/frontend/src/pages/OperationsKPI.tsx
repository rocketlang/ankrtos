import { useQuery, gql } from '@apollo/client';

const VOYAGES = gql`
  query Voyages { voyages { id reference status departureDate arrivalDate vessel { name } } }
`;

const LAYTIME_CALCS = gql`
  query LaytimeCalcs { laytimeCalculations { id voyageId type result amountDue usedHours allowedHours timeBarDate timeBarDays completedAt commencementRule exceptionRule } }
`;

const PORT_CALLS = gql`
  query PortCalls($voyageId: String!) {
    voyagePortCalls(voyageId: $voyageId) { id status purpose eta ata etd atd }
  }
`;

export function OperationsKPI() {
  const { data: voyagesData } = useQuery(VOYAGES);
  const { data: laytimeData } = useQuery(LAYTIME_CALCS);

  const voyages = voyagesData?.voyages ?? [];
  const calcs = laytimeData?.laytimeCalculations ?? [];

  // KPI calculations
  const completedVoyages = voyages.filter((v: any) => v.status === 'completed');
  const activeVoyages = voyages.filter((v: any) => ['in_progress', 'loading', 'discharging', 'at_sea'].includes(v.status));

  // Demurrage exposure
  const onDemurrage = calcs.filter((c: any) => c.result === 'on_demurrage');
  const totalDemurrage = onDemurrage.reduce((sum: number, c: any) => sum + (c.amountDue ?? 0), 0);
  const onDespatch = calcs.filter((c: any) => c.result === 'on_despatch');
  const totalDespatch = onDespatch.reduce((sum: number, c: any) => sum + Math.abs(c.amountDue ?? 0), 0);

  // Laytime utilization
  const withHours = calcs.filter((c: any) => c.allowedHours > 0 && c.usedHours > 0);
  const avgUtilization = withHours.length > 0
    ? withHours.reduce((sum: number, c: any) => sum + (c.usedHours / c.allowedHours) * 100, 0) / withHours.length
    : 0;

  // Time bar alerts (claims due within 30 days)
  const now = new Date();
  const timeBarAlerts = calcs
    .filter((c: any) => c.timeBarDate && c.result === 'on_demurrage')
    .map((c: any) => {
      const deadline = new Date(c.timeBarDate);
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...c, deadline, daysLeft };
    })
    .filter((c: any) => c.daysLeft > 0 && c.daysLeft <= 90)
    .sort((a: any, b: any) => a.daysLeft - b.daysLeft);

  const kpiCards = [
    { label: 'Total Voyages', value: voyages.length, sub: `${activeVoyages.length} active`, color: 'text-blue-400' },
    { label: 'Completed', value: completedVoyages.length, sub: `${((completedVoyages.length / Math.max(voyages.length, 1)) * 100).toFixed(0)}% completion rate`, color: 'text-green-400' },
    { label: 'Demurrage Exposure', value: `$${(totalDemurrage / 1000).toFixed(0)}K`, sub: `${onDemurrage.length} cases`, color: 'text-red-400' },
    { label: 'Despatch Earned', value: `$${(totalDespatch / 1000).toFixed(0)}K`, sub: `${onDespatch.length} cases`, color: 'text-green-400' },
    { label: 'Avg Laytime Usage', value: `${avgUtilization.toFixed(0)}%`, sub: `${withHours.length} calculations`, color: avgUtilization > 100 ? 'text-red-400' : 'text-green-400' },
    { label: 'Time Bar Alerts', value: timeBarAlerts.length, sub: timeBarAlerts.length > 0 ? `Next: ${timeBarAlerts[0]?.daysLeft}d left` : 'All clear', color: timeBarAlerts.length > 0 ? 'text-yellow-400' : 'text-green-400' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Operations KPI Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-maritime-800 rounded-lg border border-maritime-700 p-4">
            <p className="text-maritime-400 text-xs">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            <p className="text-maritime-500 text-xs mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Time Bar Tracking */}
      <div className="bg-maritime-800 rounded-lg border border-maritime-700 mb-6">
        <div className="p-4 border-b border-maritime-700">
          <h2 className="text-white font-medium">Time Bar Tracking — Demurrage Claims</h2>
          <p className="text-maritime-400 text-xs mt-1">Claims must be submitted before the time bar deadline</p>
        </div>
        {timeBarAlerts.length === 0 ? (
          <p className="p-6 text-center text-maritime-500 text-sm">No pending time bar deadlines</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left p-3">Voyage</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Rule</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-left p-3">Deadline</th>
                <th className="text-right p-3">Days Left</th>
                <th className="text-left p-3">Urgency</th>
              </tr>
            </thead>
            <tbody>
              {timeBarAlerts.map((c: any) => (
                <tr key={c.id} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="p-3 text-white">{c.voyageId?.slice(0, 8)}</td>
                  <td className="p-3 text-maritime-300 capitalize">{c.type}</td>
                  <td className="p-3 text-maritime-300 uppercase">{c.exceptionRule}</td>
                  <td className="p-3 text-right text-red-400">${c.amountDue?.toLocaleString()}</td>
                  <td className="p-3 text-maritime-300">{c.deadline.toLocaleDateString()}</td>
                  <td className="p-3 text-right font-medium">{c.daysLeft}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      c.daysLeft <= 7 ? 'bg-red-900/50 text-red-300' :
                      c.daysLeft <= 30 ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-green-900/50 text-green-300'
                    }`}>
                      {c.daysLeft <= 7 ? 'CRITICAL' : c.daysLeft <= 30 ? 'URGENT' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Laytime Calculations Summary */}
      <div className="bg-maritime-800 rounded-lg border border-maritime-700">
        <div className="p-4 border-b border-maritime-700">
          <h2 className="text-white font-medium">Laytime Calculations</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-maritime-700 text-maritime-400">
              <th className="text-left p-3">Voyage</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Commencement</th>
              <th className="text-left p-3">Exception</th>
              <th className="text-right p-3">Allowed (h)</th>
              <th className="text-right p-3">Used (h)</th>
              <th className="text-left p-3">Result</th>
              <th className="text-right p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {calcs.map((c: any) => (
              <tr key={c.id} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                <td className="p-3 text-white">{c.voyageId?.slice(0, 8)}</td>
                <td className="p-3 text-maritime-300 capitalize">{c.type}</td>
                <td className="p-3 text-maritime-300 uppercase">{c.commencementRule}</td>
                <td className="p-3 text-maritime-300 uppercase">{c.exceptionRule}</td>
                <td className="p-3 text-right text-maritime-300">{c.allowedHours?.toFixed(1)}</td>
                <td className="p-3 text-right text-white">{c.usedHours?.toFixed(1)}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    c.result === 'on_demurrage' ? 'bg-red-900/50 text-red-300' :
                    c.result === 'on_despatch' ? 'bg-green-900/50 text-green-300' :
                    c.result === 'within_laytime' ? 'bg-blue-900/50 text-blue-300' :
                    'bg-maritime-700 text-maritime-400'
                  }`}>
                    {c.result?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className={`p-3 text-right font-medium ${c.amountDue > 0 ? 'text-red-400' : c.amountDue < 0 ? 'text-green-400' : 'text-maritime-300'}`}>
                  ${Math.abs(c.amountDue ?? 0).toLocaleString()}
                </td>
              </tr>
            ))}
            {calcs.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-maritime-500">No laytime calculations yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
