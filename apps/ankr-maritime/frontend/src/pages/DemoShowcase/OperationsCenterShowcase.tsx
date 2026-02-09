import { useState, useMemo } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface DAItem {
  id: string;
  category: string;
  description: string;
  estimatedAmount: number;
  actualAmount?: number;
  status: 'pending' | 'approved' | 'paid' | 'disputed';
  vendor: string;
  dueDate: string;
}

interface NoonReport {
  id: string;
  vessel: string;
  date: string;
  position: { lat: number; lng: number };
  course: number;
  speed: number;
  distanceRun: number;
  distanceToGo: number;
  fuelConsumption: {
    ifo: number;
    mgo: number;
  };
  weather: string;
  seaState: string;
  remarks?: string;
}

interface CriticalPathEvent {
  id: string;
  type: 'arrival' | 'berthing' | 'nor' | 'commence' | 'complete' | 'departure';
  description: string;
  plannedTime: string;
  actualTime?: string;
  status: 'completed' | 'in-progress' | 'upcoming' | 'delayed';
  delay?: number; // hours
  impact?: string;
}

const demoDAItems: DAItem[] = [
  {
    id: '1',
    category: 'Port Charges',
    description: 'Port Authority Dues - Singapore',
    estimatedAmount: 45000,
    actualAmount: 47200,
    status: 'approved',
    vendor: 'Maritime & Port Authority of Singapore',
    dueDate: '2026-02-12',
  },
  {
    id: '2',
    category: 'Agency Fees',
    description: 'Port Agency Services & Documentation',
    estimatedAmount: 8500,
    actualAmount: 8500,
    status: 'paid',
    vendor: 'Singapore Maritime Services Pte Ltd',
    dueDate: '2026-02-10',
  },
  {
    id: '3',
    category: 'Pilotage',
    description: 'Pilot Services (Inbound + Outbound)',
    estimatedAmount: 12000,
    actualAmount: 12350,
    status: 'approved',
    vendor: 'PSA Marine Pte Ltd',
    dueDate: '2026-02-11',
  },
  {
    id: '4',
    category: 'Towage',
    description: 'Tug Assistance - 2 Tugs x 2 Operations',
    estimatedAmount: 18000,
    status: 'pending',
    vendor: 'Singapore Towage Services',
    dueDate: '2026-02-13',
  },
  {
    id: '5',
    category: 'Fresh Water',
    description: 'Fresh Water Supply - 150 MT',
    estimatedAmount: 6750,
    actualAmount: 7100,
    status: 'approved',
    vendor: 'Marine Water Suppliers',
    dueDate: '2026-02-11',
  },
  {
    id: '6',
    category: 'Provisions',
    description: 'Ship Stores & Provisions',
    estimatedAmount: 12500,
    status: 'pending',
    vendor: 'Ocean Ship Chandlers',
    dueDate: '2026-02-14',
  },
  {
    id: '7',
    category: 'Waste Disposal',
    description: 'Garbage & Slop Disposal',
    estimatedAmount: 2800,
    status: 'pending',
    vendor: 'Singapore Marine Services',
    dueDate: '2026-02-12',
  },
  {
    id: '8',
    category: 'Survey Fees',
    description: 'Draft Survey - Loading & Discharge',
    estimatedAmount: 4500,
    actualAmount: 4500,
    status: 'paid',
    vendor: 'Independent Marine Surveyors',
    dueDate: '2026-02-10',
  },
];

const demoNoonReports: NoonReport[] = [
  {
    id: '1',
    vessel: 'MV OCEAN SPIRIT',
    date: '2026-02-09 12:00',
    position: { lat: 10.5, lng: 105.2 },
    course: 285,
    speed: 12.3,
    distanceRun: 295,
    distanceToGo: 1847,
    fuelConsumption: { ifo: 28.5, mgo: 0.8 },
    weather: 'Partly cloudy',
    seaState: 'Moderate (3-4)',
    remarks: 'All well, proceeding as per voyage plan',
  },
  {
    id: '2',
    vessel: 'MV OCEAN SPIRIT',
    date: '2026-02-08 12:00',
    position: { lat: 8.2, lng: 98.5 },
    course: 285,
    speed: 12.1,
    distanceRun: 290,
    distanceToGo: 2142,
    fuelConsumption: { ifo: 29.1, mgo: 0.7 },
    weather: 'Clear',
    seaState: 'Slight (2-3)',
  },
  {
    id: '3',
    vessel: 'MV OCEAN SPIRIT',
    date: '2026-02-07 12:00',
    position: { lat: 5.8, lng: 91.2 },
    course: 285,
    speed: 11.9,
    distanceRun: 286,
    distanceToGo: 2432,
    fuelConsumption: { ifo: 29.5, mgo: 0.8 },
    weather: 'Overcast',
    seaState: 'Moderate (3-4)',
  },
];

const demoCriticalPath: CriticalPathEvent[] = [
  {
    id: '1',
    type: 'arrival',
    description: 'Arrive Singapore Pilot Station',
    plannedTime: '2026-02-10 06:00',
    actualTime: '2026-02-10 06:15',
    status: 'completed',
    delay: 0.25,
    impact: 'Minor delay - no impact on berthing',
  },
  {
    id: '2',
    type: 'nor',
    description: 'Tender Notice of Readiness',
    plannedTime: '2026-02-10 06:30',
    actualTime: '2026-02-10 06:45',
    status: 'completed',
    delay: 0.25,
  },
  {
    id: '3',
    type: 'berthing',
    description: 'Berth at Terminal 5, Berth 14',
    plannedTime: '2026-02-10 08:00',
    actualTime: '2026-02-10 09:30',
    status: 'completed',
    delay: 1.5,
    impact: 'Congestion delay - berth not ready',
  },
  {
    id: '4',
    type: 'commence',
    description: 'Commence Loading Operations',
    plannedTime: '2026-02-10 10:00',
    actualTime: '2026-02-10 11:00',
    status: 'completed',
    delay: 1.0,
  },
  {
    id: '5',
    type: 'complete',
    description: 'Complete Loading',
    plannedTime: '2026-02-11 18:00',
    actualTime: '2026-02-11 22:00',
    status: 'completed',
    delay: 4.0,
    impact: 'Slow loading rate - weather delays',
  },
  {
    id: '6',
    type: 'departure',
    description: 'Depart Singapore',
    plannedTime: '2026-02-11 20:00',
    actualTime: '2026-02-12 00:30',
    status: 'completed',
    delay: 4.5,
  },
];

const statusColors = {
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
  approved: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  paid: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  disputed: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  completed: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  'in-progress': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  upcoming: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
  delayed: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
};

export default function OperationsCenterShowcase() {
  const [activeTab, setActiveTab] = useState<'da-desk' | 'noon-reports' | 'critical-path'>('da-desk');

  // DA Desk calculations
  const daStats = useMemo(() => {
    const total = demoDAItems.reduce((sum, item) => sum + item.estimatedAmount, 0);
    const paid = demoDAItems.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.actualAmount || i.estimatedAmount), 0);
    const pending = demoDAItems.filter((i) => i.status === 'pending').reduce((sum, i) => sum + i.estimatedAmount, 0);
    const variance = demoDAItems.filter((i) => i.actualAmount).reduce((sum, i) => sum + ((i.actualAmount! - i.estimatedAmount)), 0);

    return { total, paid, pending, variance };
  }, []);

  // Noon Report analytics
  const noonAnalytics = useMemo(() => {
    const avgSpeed = demoNoonReports.reduce((sum, r) => sum + r.speed, 0) / demoNoonReports.length;
    const totalDistance = demoNoonReports.reduce((sum, r) => sum + r.distanceRun, 0);
    const totalFuelIFO = demoNoonReports.reduce((sum, r) => sum + r.fuelConsumption.ifo, 0);
    const avgConsumption = totalFuelIFO / demoNoonReports.length;

    return {
      avgSpeed: avgSpeed.toFixed(1),
      totalDistance,
      totalFuel: totalFuelIFO.toFixed(1),
      avgConsumption: avgConsumption.toFixed(1),
    };
  }, []);

  // Critical Path analytics
  const pathStats = useMemo(() => {
    const totalDelay = demoCriticalPath.reduce((sum, e) => sum + (e.delay || 0), 0);
    const delayedEvents = demoCriticalPath.filter((e) => e.delay && e.delay > 0).length;

    return {
      totalEvents: demoCriticalPath.length,
      completed: demoCriticalPath.filter((e) => e.status === 'completed').length,
      totalDelay: totalDelay.toFixed(1),
      delayedEvents,
    };
  }, []);

  return (
    <ShowcaseLayout
      title="Operations Center"
      icon="⚙️"
      category="Voyage Execution"
      problem="Manual DA tracking in spreadsheets, delayed noon report processing, no visibility into critical path delays, port call information scattered across emails, 3+ hours daily on admin tasks"
      solution="Unified operations dashboard with automated DA tracking, instant noon report analysis, real-time critical path monitoring, automated alerts for delays, all voyage data in one place"
      timeSaved="3 hours/day"
      roi="18x"
      accuracy="99%"
      nextSection={{
        title: 'Port Operations',
        path: '/demo-showcase/port-operations',
      }}
    >
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 border-b border-maritime-700">
        <button
          onClick={() => setActiveTab('da-desk')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'da-desk'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-maritime-400 hover:text-maritime-300'
          }`}
        >
          💰 DA Desk
        </button>
        <button
          onClick={() => setActiveTab('noon-reports')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'noon-reports'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-maritime-400 hover:text-maritime-300'
          }`}
        >
          📊 Noon Reports
        </button>
        <button
          onClick={() => setActiveTab('critical-path')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'critical-path'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-maritime-400 hover:text-maritime-300'
          }`}
        >
          🎯 Critical Path
        </button>
      </div>

      {/* DA Desk Tab */}
      {activeTab === 'da-desk' && (
        <div className="space-y-6">
          {/* DA Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4">
              <div className="text-sm text-maritime-400 mb-1">Total Budget</div>
              <div className="text-3xl font-bold text-white">
                ${daStats.total.toLocaleString()}
              </div>
              <div className="text-xs text-maritime-500 mt-1">estimated DA</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="text-sm text-green-400 mb-1">Paid</div>
              <div className="text-3xl font-bold text-green-400">
                ${daStats.paid.toLocaleString()}
              </div>
              <div className="text-xs text-green-500/70 mt-1">settled</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="text-sm text-yellow-400 mb-1">Pending</div>
              <div className="text-3xl font-bold text-yellow-400">
                ${daStats.pending.toLocaleString()}
              </div>
              <div className="text-xs text-yellow-500/70 mt-1">awaiting approval</div>
            </div>
            <div className={`${daStats.variance >= 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-blue-500/10 border-blue-500/30'} border rounded-lg p-4`}>
              <div className={`text-sm ${daStats.variance >= 0 ? 'text-red-400' : 'text-blue-400'} mb-1`}>
                Variance
              </div>
              <div className={`text-3xl font-bold ${daStats.variance >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                {daStats.variance >= 0 ? '+' : ''}${daStats.variance.toLocaleString()}
              </div>
              <div className={`text-xs ${daStats.variance >= 0 ? 'text-red-500/70' : 'text-blue-500/70'} mt-1`}>
                {daStats.variance >= 0 ? 'over budget' : 'under budget'}
              </div>
            </div>
          </div>

          {/* DA Items Table */}
          <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-maritime-700">
              <h3 className="text-lg font-semibold text-white">
                Disbursement Account - MV OCEAN SPIRIT (Singapore Port Call)
              </h3>
              <div className="text-sm text-maritime-400 mt-1">Port Call: Feb 10-12, 2026</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-maritime-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-maritime-400">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-maritime-400">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-maritime-400">Vendor</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-maritime-400">Estimated</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-maritime-400">Actual</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-maritime-400">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-maritime-400">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-maritime-700">
                  {demoDAItems.map((item) => {
                    const colors = statusColors[item.status];
                    const variance = item.actualAmount ? item.actualAmount - item.estimatedAmount : 0;

                    return (
                      <tr key={item.id} className="hover:bg-maritime-900/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-white font-medium">{item.category}</td>
                        <td className="px-4 py-3 text-sm text-maritime-300">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-maritime-400">{item.vendor}</td>
                        <td className="px-4 py-3 text-sm text-right text-white">
                          ${item.estimatedAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {item.actualAmount ? (
                            <div>
                              <div className="text-white">${item.actualAmount.toLocaleString()}</div>
                              {variance !== 0 && (
                                <div className={`text-xs ${variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                  {variance > 0 ? '+' : ''}${variance.toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-maritime-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${colors.bg} ${colors.text} ${colors.border} border inline-block`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-maritime-400">{item.dueDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-maritime-900/50 border-t-2 border-maritime-600">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-white">TOTAL</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-white">
                      ${daStats.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-white">
                      ${(daStats.paid + daStats.pending + daStats.variance).toLocaleString()}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              💾 Save DA Statement
            </button>
            <button className="px-6 py-3 bg-maritime-700 hover:bg-maritime-600 text-white rounded-lg transition-colors">
              📧 Email to Owner
            </button>
            <button className="px-6 py-3 bg-maritime-700 hover:bg-maritime-600 text-white rounded-lg transition-colors">
              📄 Export PDF
            </button>
            <button className="px-6 py-3 bg-maritime-700 hover:bg-maritime-600 text-white rounded-lg transition-colors">
              ➕ Add Item
            </button>
          </div>
        </div>
      )}

      {/* Noon Reports Tab */}
      {activeTab === 'noon-reports' && (
        <div className="space-y-6">
          {/* Analytics Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <div className="text-sm text-cyan-400 mb-1">Average Speed</div>
              <div className="text-3xl font-bold text-cyan-400">{noonAnalytics.avgSpeed}</div>
              <div className="text-xs text-cyan-500/70 mt-1">knots</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="text-sm text-blue-400 mb-1">Distance Run</div>
              <div className="text-3xl font-bold text-blue-400">{noonAnalytics.totalDistance}</div>
              <div className="text-xs text-blue-500/70 mt-1">nautical miles (3 days)</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="text-sm text-orange-400 mb-1">Total Fuel (IFO)</div>
              <div className="text-3xl font-bold text-orange-400">{noonAnalytics.totalFuel}</div>
              <div className="text-xs text-orange-500/70 mt-1">MT consumed</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="text-sm text-purple-400 mb-1">Avg Consumption</div>
              <div className="text-3xl font-bold text-purple-400">{noonAnalytics.avgConsumption}</div>
              <div className="text-xs text-purple-500/70 mt-1">MT/day</div>
            </div>
          </div>

          {/* Noon Reports List */}
          <div className="space-y-4">
            {demoNoonReports.map((report, index) => (
              <div
                key={report.id}
                className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {report.vessel} - Noon Report
                    </h3>
                    <div className="text-sm text-maritime-400">{report.date} UTC</div>
                  </div>
                  <div className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded text-xs text-green-400">
                    Report #{demoNoonReports.length - index}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-4">
                  <div>
                    <h4 className="text-xs text-maritime-400 mb-2">Position & Navigation</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-maritime-400">Position:</span>
                        <span className="text-white">
                          {report.position.lat.toFixed(2)}°N, {report.position.lng.toFixed(2)}°E
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-maritime-400">Course:</span>
                        <span className="text-white">{report.course}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-maritime-400">Speed:</span>
                        <span className="text-cyan-400">{report.speed} knots</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-maritime-400">Distance Run:</span>
                        <span className="text-white">{report.distanceRun} nm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-maritime-400">Distance to Go:</span>
                        <span className="text-white">{report.distanceToGo} nm</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs text-maritime-400 mb-2">Fuel Consumption</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-maritime-400">IFO 380:</span>
                        <span className="text-orange-400">{report.fuelConsumption.ifo} MT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-maritime-400">MGO:</span>
                        <span className="text-orange-400">{report.fuelConsumption.mgo} MT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-maritime-400">Total:</span>
                        <span className="text-orange-400">
                          {(report.fuelConsumption.ifo + report.fuelConsumption.mgo).toFixed(1)} MT
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-maritime-400">Consumption Rate:</span>
                        <span className="text-purple-400">
                          {(report.fuelConsumption.ifo / (report.distanceRun / report.speed)).toFixed(2)} MT/day
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs text-maritime-400 mb-2">Weather & Sea</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-maritime-400">Weather:</span>
                        <span className="text-white">{report.weather}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-maritime-400">Sea State:</span>
                        <span className="text-white">{report.seaState}</span>
                      </div>
                    </div>
                    {report.remarks && (
                      <div className="mt-3 p-2 bg-maritime-900/50 rounded text-xs text-maritime-300">
                        <div className="text-maritime-500 mb-1">Remarks:</div>
                        {report.remarks}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-maritime-700">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                    View Details
                  </button>
                  <button className="px-4 py-2 bg-maritime-700 hover:bg-maritime-600 text-white text-sm rounded transition-colors">
                    Export
                  </button>
                  <button className="px-4 py-2 bg-maritime-700 hover:bg-maritime-600 text-white text-sm rounded transition-colors">
                    Compare
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Path Tab */}
      {activeTab === 'critical-path' && (
        <div className="space-y-6">
          {/* Path Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4">
              <div className="text-sm text-maritime-400 mb-1">Total Events</div>
              <div className="text-3xl font-bold text-white">{pathStats.totalEvents}</div>
              <div className="text-xs text-maritime-500 mt-1">milestones</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="text-sm text-green-400 mb-1">Completed</div>
              <div className="text-3xl font-bold text-green-400">{pathStats.completed}</div>
              <div className="text-xs text-green-500/70 mt-1">on track</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="text-sm text-red-400 mb-1">Total Delay</div>
              <div className="text-3xl font-bold text-red-400">{pathStats.totalDelay}h</div>
              <div className="text-xs text-red-500/70 mt-1">cumulative</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="text-sm text-yellow-400 mb-1">Delayed Events</div>
              <div className="text-3xl font-bold text-yellow-400">{pathStats.delayedEvents}</div>
              <div className="text-xs text-yellow-500/70 mt-1">behind schedule</div>
            </div>
          </div>

          {/* Timeline Visualization */}
          <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Port Call Timeline - Singapore
            </h3>

            <div className="space-y-4">
              {demoCriticalPath.map((event, index) => {
                const colors = statusColors[event.status];
                const isDelayed = event.delay && event.delay > 0;

                return (
                  <div key={event.id} className="flex gap-4">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-2 ${colors.border} ${colors.bg} z-10`} />
                      {index < demoCriticalPath.length - 1 && (
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
                              {isDelayed && (
                                <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-xs text-red-400 rounded">
                                  +{event.delay}h delay
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-maritime-400">
                                Planned: {event.plannedTime}
                              </span>
                              {event.actualTime && (
                                <span className={isDelayed ? 'text-red-400' : 'text-green-400'}>
                                  Actual: {event.actualTime}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded text-xs ${colors.bg} ${colors.text} ${colors.border} border`}>
                            {event.status}
                          </span>
                        </div>

                        {event.impact && (
                          <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-300">
                            <span className="font-semibold">Impact:</span> {event.impact}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delay Analysis */}
          <div className="bg-gradient-to-r from-red-600/10 to-yellow-600/10 border border-red-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">⚠️ Delay Analysis</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-red-400 mb-2">Root Causes</h4>
                <ul className="space-y-1 text-sm text-maritime-300">
                  <li>• Berth congestion: 1.5 hours</li>
                  <li>• Slow loading rate (weather): 4.0 hours</li>
                  <li>• Minor coordination delays: 1.0 hours</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-yellow-400 mb-2">Recommendations</h4>
                <ul className="space-y-1 text-sm text-maritime-300">
                  <li>• Notify charterer of delay immediately</li>
                  <li>• Update ETA for next port</li>
                  <li>• Review charter party for time bar implications</li>
                  <li>• Document weather delays for potential claims</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div className="grid grid-cols-3 gap-6 mt-8">
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
          <div className="text-2xl mb-3">🔔</div>
          <h3 className="text-lg font-semibold text-white mb-2">Automated Alerts</h3>
          <p className="text-sm text-maritime-400">
            Real-time notifications for DA approvals, noon report anomalies, critical path delays,
            and budget variances.
          </p>
        </div>

        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
          <div className="text-2xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-white mb-2">Performance Analytics</h3>
          <p className="text-sm text-maritime-400">
            Compare actual vs planned consumption, track speed/consumption optimization, identify
            delay patterns.
          </p>
        </div>

        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
          <div className="text-2xl mb-3">🔗</div>
          <h3 className="text-lg font-semibold text-white mb-2">Integrated Workflow</h3>
          <p className="text-sm text-maritime-400">
            DA items auto-sync to accounting, noon reports feed performance dashboards, critical
            path updates ETA automatically.
          </p>
        </div>
      </div>
    </ShowcaseLayout>
  );
}
