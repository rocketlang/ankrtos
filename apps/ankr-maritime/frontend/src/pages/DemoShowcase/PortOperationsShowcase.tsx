import React, { useState, useMemo } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface PortEvent {
  id: string;
  time: string;
  event: string;
  status: 'completed' | 'in-progress' | 'pending' | 'delayed';
  duration?: number;
  delay?: number;
  notes?: string;
  laytimeStatus?: 'counting' | 'not-counting' | 'exception';
}

interface CargoOperation {
  hatch: string;
  cargo: string;
  quantity: number;
  loaded: number;
  rate: number;
  targetRate: number;
  status: 'loading' | 'completed' | 'waiting';
  startTime: string;
  estimatedCompletion: string;
}

interface Document {
  name: string;
  type: string;
  status: 'submitted' | 'approved' | 'pending' | 'missing';
  submittedBy?: string;
  timestamp?: string;
  required: boolean;
}

interface Delay {
  id: string;
  type: string;
  description: string;
  startTime: string;
  duration: number;
  responsible: 'owner' | 'charterer' | 'port' | 'weather';
  laytimeImpact: 'excluded' | 'included';
  cost?: number;
}

const PortOperationsShowcase: React.FC = () => {
  const [currentPhase, setCurrentPhase] = useState<number>(3);
  const [showLaytimeDetails, setShowLaytimeDetails] = useState<boolean>(false);

  const portEvents: PortEvent[] = [
    {
      id: '1',
      time: '2026-02-10 06:15',
      event: 'Arrived Pilot Station',
      status: currentPhase >= 1 ? 'completed' : 'pending',
      duration: 0.25,
      notes: '15 min delay due to traffic',
      laytimeStatus: 'not-counting',
    },
    {
      id: '2',
      time: '2026-02-10 07:30',
      event: 'Pilot Onboard',
      status: currentPhase >= 1 ? 'completed' : 'pending',
      duration: 0.5,
      laytimeStatus: 'not-counting',
    },
    {
      id: '3',
      time: '2026-02-10 08:45',
      event: 'All Fast (Berthed)',
      status: currentPhase >= 2 ? 'completed' : currentPhase === 1 ? 'in-progress' : 'pending',
      duration: 1.25,
      notes: 'Tugs: 2x, Linesmen: 8',
      laytimeStatus: 'not-counting',
    },
    {
      id: '4',
      time: '2026-02-10 09:00',
      event: 'NOR Tendered',
      status: currentPhase >= 2 ? 'completed' : 'pending',
      notes: 'Notice of Readiness submitted to charterer',
      laytimeStatus: 'not-counting',
    },
    {
      id: '5',
      time: '2026-02-10 10:00',
      event: 'NOR Accepted',
      status: currentPhase >= 2 ? 'completed' : 'pending',
      duration: 1,
      notes: 'Laytime commences from this point',
      laytimeStatus: 'counting',
    },
    {
      id: '6',
      time: '2026-02-10 11:30',
      event: 'Cargo Operations Begin',
      status: currentPhase >= 3 ? 'completed' : currentPhase === 2 ? 'in-progress' : 'pending',
      duration: 1.5,
      delay: 1.5,
      notes: 'Delayed: Waiting for shore crane availability',
      laytimeStatus: 'counting',
    },
    {
      id: '7',
      time: '2026-02-11 15:30',
      event: 'Weather Interruption',
      status: currentPhase >= 3 ? 'completed' : 'pending',
      duration: 4,
      notes: 'Heavy rain - Operations suspended',
      laytimeStatus: 'exception',
    },
    {
      id: '8',
      time: '2026-02-12 08:00',
      event: 'Cargo Operations Complete',
      status: currentPhase >= 4 ? 'completed' : currentPhase === 3 ? 'in-progress' : 'pending',
      notes: '45,000 MT loaded',
      laytimeStatus: 'counting',
    },
    {
      id: '9',
      time: '2026-02-12 09:30',
      event: 'SOF Signed',
      status: currentPhase >= 4 ? 'completed' : 'pending',
      notes: 'Statement of Facts agreed by all parties',
      laytimeStatus: 'not-counting',
    },
    {
      id: '10',
      time: '2026-02-12 10:15',
      event: 'Port Clearance Obtained',
      status: currentPhase >= 4 ? 'completed' : 'pending',
      laytimeStatus: 'not-counting',
    },
    {
      id: '11',
      time: '2026-02-12 11:00',
      event: 'Unberthed / Departed',
      status: currentPhase >= 5 ? 'completed' : currentPhase === 4 ? 'in-progress' : 'pending',
      notes: 'Pilot disembarked at 11:45',
      laytimeStatus: 'not-counting',
    },
  ];

  const cargoOperations: CargoOperation[] = [
    {
      hatch: 'Hold 1',
      cargo: 'Iron Ore',
      quantity: 12000,
      loaded: currentPhase >= 3 ? 12000 : currentPhase === 2 ? 8500 : 0,
      rate: 850,
      targetRate: 900,
      status: currentPhase >= 3 ? 'completed' : currentPhase === 2 ? 'loading' : 'waiting',
      startTime: '2026-02-10 11:30',
      estimatedCompletion: '2026-02-11 01:00',
    },
    {
      hatch: 'Hold 2',
      cargo: 'Iron Ore',
      quantity: 11500,
      loaded: currentPhase >= 3 ? 11500 : currentPhase === 2 ? 7800 : 0,
      rate: 820,
      targetRate: 900,
      status: currentPhase >= 3 ? 'completed' : currentPhase === 2 ? 'loading' : 'waiting',
      startTime: '2026-02-10 12:00',
      estimatedCompletion: '2026-02-11 01:45',
    },
    {
      hatch: 'Hold 3',
      cargo: 'Iron Ore',
      quantity: 10500,
      loaded: currentPhase >= 3 ? 10500 : currentPhase === 2 ? 6200 : 0,
      rate: 780,
      targetRate: 900,
      status: currentPhase >= 3 ? 'completed' : currentPhase === 2 ? 'loading' : 'waiting',
      startTime: '2026-02-10 12:30',
      estimatedCompletion: '2026-02-11 02:30',
    },
    {
      hatch: 'Hold 4',
      cargo: 'Iron Ore',
      quantity: 11000,
      loaded: currentPhase >= 3 ? 11000 : currentPhase === 2 ? 5900 : 0,
      rate: 795,
      targetRate: 900,
      status: currentPhase >= 3 ? 'completed' : currentPhase === 2 ? 'loading' : 'waiting',
      startTime: '2026-02-10 13:00',
      estimatedCompletion: '2026-02-11 03:00',
    },
  ];

  const documents: Document[] = [
    {
      name: 'Notice of Readiness (NOR)',
      type: 'Operational',
      status: currentPhase >= 2 ? 'approved' : 'pending',
      submittedBy: 'Master',
      timestamp: '2026-02-10 09:00',
      required: true,
    },
    {
      name: 'Crew List',
      type: 'Immigration',
      status: currentPhase >= 1 ? 'approved' : 'pending',
      submittedBy: 'Agent',
      timestamp: '2026-02-09 14:30',
      required: true,
    },
    {
      name: 'Last Port Clearance',
      type: 'Immigration',
      status: currentPhase >= 1 ? 'approved' : 'missing',
      submittedBy: 'Master',
      timestamp: '2026-02-09 16:00',
      required: true,
    },
    {
      name: 'Cargo Declaration',
      type: 'Customs',
      status: currentPhase >= 2 ? 'approved' : 'pending',
      submittedBy: 'Agent',
      timestamp: '2026-02-10 08:00',
      required: true,
    },
    {
      name: 'ISPS Security Declaration',
      type: 'Security',
      status: 'approved',
      submittedBy: 'Master',
      timestamp: '2026-02-09 15:00',
      required: true,
    },
    {
      name: 'Ballast Water Management',
      type: 'Environmental',
      status: currentPhase >= 2 ? 'approved' : 'pending',
      submittedBy: 'Chief Officer',
      timestamp: '2026-02-10 07:30',
      required: true,
    },
    {
      name: 'Statement of Facts (SOF)',
      type: 'Operational',
      status: currentPhase >= 4 ? 'approved' : 'pending',
      submittedBy: 'Master & Agent',
      timestamp: currentPhase >= 4 ? '2026-02-12 09:30' : undefined,
      required: true,
    },
    {
      name: 'Time Sheet',
      type: 'Commercial',
      status: currentPhase >= 4 ? 'submitted' : 'pending',
      submittedBy: 'Agent',
      timestamp: currentPhase >= 4 ? '2026-02-12 10:00' : undefined,
      required: true,
    },
  ];

  const delays: Delay[] = [
    {
      id: '1',
      type: 'Port Congestion',
      description: 'Waiting for berth availability',
      startTime: '2026-02-10 06:15',
      duration: 2.5,
      responsible: 'port',
      laytimeImpact: 'excluded',
    },
    {
      id: '2',
      type: 'Shore Equipment',
      description: 'Crane breakdown - waiting for backup crane',
      startTime: '2026-02-10 11:30',
      duration: 1.5,
      responsible: 'charterer',
      laytimeImpact: 'included',
      cost: 30000,
    },
    {
      id: '3',
      type: 'Weather',
      description: 'Heavy rain - operations suspended',
      startTime: '2026-02-11 15:30',
      duration: 4.0,
      responsible: 'weather',
      laytimeImpact: 'excluded',
    },
    {
      id: '4',
      type: 'Cargo Documentation',
      description: 'Waiting for customs clearance',
      startTime: '2026-02-12 08:00',
      duration: 1.5,
      responsible: 'charterer',
      laytimeImpact: 'included',
      cost: 30000,
    },
  ];

  const totalCargoLoaded = useMemo(() => {
    return cargoOperations.reduce((sum, op) => sum + op.loaded, 0);
  }, [cargoOperations, currentPhase]);

  const totalCargoQuantity = useMemo(() => {
    return cargoOperations.reduce((sum, op) => sum + op.quantity, 0);
  }, []);

  const averageLoadingRate = useMemo(() => {
    const rates = cargoOperations.map((op) => op.rate);
    return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  }, []);

  const laytimeUsed = useMemo(() => {
    const countingEvents = portEvents.filter(
      (e) => e.laytimeStatus === 'counting' && e.status === 'completed'
    );
    return countingEvents.reduce((sum, e) => sum + (e.duration || 0), 0);
  }, [currentPhase]);

  const laytimeExceptions = useMemo(() => {
    const exceptionEvents = portEvents.filter(
      (e) => e.laytimeStatus === 'exception' && e.status === 'completed'
    );
    return exceptionEvents.reduce((sum, e) => sum + (e.duration || 0), 0);
  }, [currentPhase]);

  const getStatusColor = (status: string) => {
    if (status === 'completed' || status === 'approved') return 'text-green-400 bg-green-900/30';
    if (status === 'in-progress' || status === 'loading' || status === 'submitted')
      return 'text-blue-400 bg-blue-900/30';
    if (status === 'delayed' || status === 'missing') return 'text-red-400 bg-red-900/30';
    return 'text-gray-400 bg-gray-800/30';
  };

  const getLaytimeStatusColor = (status?: string) => {
    if (status === 'counting') return 'bg-yellow-900/30 text-yellow-400';
    if (status === 'exception') return 'bg-red-900/30 text-red-400';
    return 'bg-gray-800 text-gray-400';
  };

  const getResponsibleColor = (responsible: string) => {
    if (responsible === 'owner') return 'bg-red-900/30 text-red-400';
    if (responsible === 'charterer') return 'bg-orange-900/30 text-orange-400';
    if (responsible === 'port') return 'bg-blue-900/30 text-blue-400';
    return 'bg-purple-900/30 text-purple-400';
  };

  return (
    <ShowcaseLayout
      title="Port Operations"
      icon="⚓"
      category="Operations Management"
      problem="Port operations tracked through scattered WhatsApp messages, email threads, and manual SOF preparation - resulting in disputed laytime calculations, missing documentation, and agents charging $50k+ for simple errors in timesheet preparation."
      solution="Centralized port operations hub with real-time event tracking, automated SOF generation, document workflow management, and laytime calculation engine - eliminating disputes and reducing agent dependencies by 80%."
      timeSaved="Manual tracking → Real-time"
      roi="28x"
      accuracy="Zero SOF disputes"
      nextSection={{
        title: 'Performance Monitoring',
        path: '/demo-showcase/performance-monitoring',
      }}
    >
      <div className="space-y-6">
        {/* Phase Controls */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Port Call Timeline</h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((phase) => (
              <button
                key={phase}
                onClick={() => setCurrentPhase(phase)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  currentPhase === phase
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Phase {phase}
              </button>
            ))}
          </div>
        </div>

        {/* Port Call Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">Vessel</div>
            <div className="text-white font-semibold">MV OCEAN SPIRIT</div>
            <div className="text-xs text-gray-500">IMO 9876543</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">Port</div>
            <div className="text-white font-semibold">Singapore</div>
            <div className="text-xs text-gray-500">Port ID: SGSIN</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">Operation</div>
            <div className="text-white font-semibold">Loading</div>
            <div className="text-xs text-gray-500">Iron Ore - 45,000 MT</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">Status</div>
            <div className="text-green-400 font-semibold">
              {currentPhase === 5
                ? 'Completed'
                : currentPhase === 4
                ? 'Departing'
                : currentPhase === 3
                ? 'Loading'
                : currentPhase === 2
                ? 'Berthed'
                : 'Arriving'}
            </div>
          </div>
        </div>

        {/* Timeline Events */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Operational Events & Laytime Tracking
          </h3>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                    Time
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                    Event
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">
                    Duration (hrs)
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400">
                    Laytime
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {portEvents.map((event) => (
                  <tr
                    key={event.id}
                    className={`hover:bg-gray-700/30 transition-colors ${
                      event.delay ? 'bg-red-900/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-white font-mono">
                      {event.time}
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {event.event}
                      {event.delay && (
                        <span className="ml-2 text-xs text-red-400">
                          (+{event.delay}h delay)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-300">
                      {event.duration ? event.duration.toFixed(1) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getLaytimeStatusColor(
                          event.laytimeStatus
                        )}`}
                      >
                        {event.laytimeStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{event.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cargo Operations */}
        {currentPhase >= 2 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Real-time Cargo Operations
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {cargoOperations.map((op) => (
                <div
                  key={op.hatch}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold">{op.hatch}</h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                        op.status
                      )}`}
                    >
                      {op.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress:</span>
                      <span className="text-white font-semibold">
                        {op.loaded.toLocaleString()} / {op.quantity.toLocaleString()} MT
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          op.status === 'completed'
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${(op.loaded / op.quantity) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Loading Rate:</span>
                      <span
                        className={`font-semibold ${
                          op.rate >= op.targetRate ? 'text-green-400' : 'text-yellow-400'
                        }`}
                      >
                        {op.rate} MT/hr (Target: {op.targetRate})
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Est. Completion: {op.estimatedCompletion}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cargo Summary */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-gray-400 text-sm mb-1">Total Loaded</div>
                  <div className="text-2xl font-bold text-white">
                    {totalCargoLoaded.toLocaleString()} MT
                  </div>
                  <div className="text-xs text-gray-500">
                    of {totalCargoQuantity.toLocaleString()} MT
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Avg Loading Rate</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {averageLoadingRate.toFixed(0)} MT/hr
                  </div>
                  <div className="text-xs text-gray-500">Target: 900 MT/hr</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Completion</div>
                  <div className="text-2xl font-bold text-green-400">
                    {((totalCargoLoaded / totalCargoQuantity) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentPhase >= 4 ? 'Completed' : 'In Progress'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Documentation Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center gap-4"
              >
                <div
                  className={`text-2xl ${
                    doc.status === 'approved'
                      ? 'text-green-400'
                      : doc.status === 'submitted'
                      ? 'text-blue-400'
                      : doc.status === 'missing'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }`}
                >
                  {doc.status === 'approved'
                    ? '✓'
                    : doc.status === 'submitted'
                    ? '📄'
                    : doc.status === 'missing'
                    ? '✗'
                    : '⏳'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-white font-medium">{doc.name}</div>
                    {doc.required && (
                      <span className="px-1.5 py-0.5 bg-red-900/30 text-red-400 text-xs font-bold rounded">
                        REQ
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {doc.type} • {doc.submittedBy || 'Not submitted'}
                    {doc.timestamp && ` • ${doc.timestamp}`}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                    doc.status
                  )}`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delays & Exceptions */}
        {currentPhase >= 2 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Delays & Laytime Exceptions
            </h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Description
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Start Time
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">
                      Duration (hrs)
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400">
                      Responsible
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400">
                      Laytime Impact
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {delays.map((delay) => (
                    <tr key={delay.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-white font-medium">
                        {delay.type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {delay.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                        {delay.startTime}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-white font-semibold">
                        {delay.duration.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase ${getResponsibleColor(
                            delay.responsible
                          )}`}
                        >
                          {delay.responsible}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            delay.laytimeImpact === 'excluded'
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}
                        >
                          {delay.laytimeImpact}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {delay.cost ? (
                          <span className="text-red-400 font-semibold">
                            ${delay.cost.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Laytime Summary */}
        {currentPhase >= 2 && (
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>⏱️</span> Laytime Calculation Summary
              </h3>
              <button
                onClick={() => setShowLaytimeDetails(!showLaytimeDetails)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
              >
                {showLaytimeDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-gray-400 text-sm mb-1">Allowed Time</div>
                <div className="text-2xl font-bold text-white">72 hours</div>
                <div className="text-xs text-gray-500">3 days @ 24h/day</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Time Used</div>
                <div className="text-2xl font-bold text-blue-400">
                  {laytimeUsed.toFixed(1)} hours
                </div>
                <div className="text-xs text-gray-500">
                  {((laytimeUsed / 72) * 100).toFixed(1)}% of allowed
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Exceptions</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {laytimeExceptions.toFixed(1)} hours
                </div>
                <div className="text-xs text-gray-500">Weather, port delays</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Net Position</div>
                <div
                  className={`text-2xl font-bold ${
                    laytimeUsed - laytimeExceptions < 72
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {laytimeUsed - laytimeExceptions < 72 ? 'On Time' : 'Delayed'}
                </div>
                <div className="text-xs text-gray-500">
                  {(72 - (laytimeUsed - laytimeExceptions)).toFixed(1)}h remaining
                </div>
              </div>
            </div>

            {showLaytimeDetails && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-300 space-y-2">
                  <div className="flex justify-between">
                    <span>Laytime commenced:</span>
                    <span className="text-white font-semibold">2026-02-10 10:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total time elapsed:</span>
                    <span className="text-white font-semibold">
                      {laytimeUsed.toFixed(1)} hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Less: Weather exception (4h)</span>
                    <span className="text-green-400 font-semibold">
                      -{laytimeExceptions.toFixed(1)} hours
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-700">
                    <span className="font-semibold">Net laytime used:</span>
                    <span className="text-blue-400 font-bold text-lg">
                      {(laytimeUsed - laytimeExceptions).toFixed(1)} hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Allowed laytime:</span>
                    <span className="text-white font-semibold">72.0 hours</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-bold text-white">Time saved:</span>
                    <span className="text-green-400 font-bold text-lg">
                      {(72 - (laytimeUsed - laytimeExceptions)).toFixed(1)} hours
                    </span>
                  </div>
                  <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded">
                    <div className="text-green-400 font-semibold mb-1">
                      ✓ Despatch Earned
                    </div>
                    <div className="text-sm text-gray-300">
                      Estimated despatch: $
                      {(
                        ((72 - (laytimeUsed - laytimeExceptions)) / 24) *
                        7500
                      ).toLocaleString()}{' '}
                      (@ $7,500/day)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ShowcaseLayout>
  );
};

export default PortOperationsShowcase;
