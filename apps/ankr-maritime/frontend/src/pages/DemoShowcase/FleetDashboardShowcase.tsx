import { useState, useMemo, useEffect } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface Vessel {
  id: string;
  name: string;
  imo: string;
  flag: string;
  type: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  status: 'underway' | 'at-anchor' | 'moored' | 'not-under-command';
  destination: string;
  eta: string;
  lastUpdate: string;
}

// Demo fleet data with realistic positions
const demoVessels: Vessel[] = [
  {
    id: '1',
    name: 'MV OCEAN SPIRIT',
    imo: 'IMO 9876543',
    flag: '🇵🇦',
    type: 'Bulk Carrier',
    lat: 1.2897,
    lng: 103.8501,
    speed: 0.2,
    heading: 45,
    status: 'at-anchor',
    destination: 'SINGAPORE',
    eta: '2026-02-09 14:00',
    lastUpdate: '2 min ago',
  },
  {
    id: '2',
    name: 'MV ATLANTIC VOYAGER',
    imo: 'IMO 9876544',
    flag: '🇱🇷',
    type: 'Container',
    lat: 22.3964,
    lng: 114.1095,
    speed: 14.3,
    heading: 120,
    status: 'underway',
    destination: 'HONG KONG',
    eta: '2026-02-09 18:30',
    lastUpdate: '1 min ago',
  },
  {
    id: '3',
    name: 'MV PACIFIC STAR',
    imo: 'IMO 9876545',
    flag: '🇲🇭',
    type: 'Tanker',
    lat: 35.4437,
    lng: 139.6380,
    speed: 11.8,
    heading: 280,
    status: 'underway',
    destination: 'YOKOHAMA',
    eta: '2026-02-10 08:00',
    lastUpdate: '3 min ago',
  },
  {
    id: '4',
    name: 'MV MEDITERRANEAN PRIDE',
    imo: 'IMO 9876546',
    flag: '🇬🇷',
    type: 'Bulk Carrier',
    lat: 37.9475,
    lng: 23.6372,
    speed: 0,
    heading: 0,
    status: 'moored',
    destination: 'PIRAEUS',
    eta: '2026-02-09 12:00',
    lastUpdate: '5 min ago',
  },
  {
    id: '5',
    name: 'MV INDIAN OCEAN',
    imo: 'IMO 9876547',
    flag: '🇮🇳',
    type: 'Container',
    lat: 18.9500,
    lng: 72.9500,
    speed: 0.1,
    heading: 90,
    status: 'moored',
    destination: 'MUMBAI',
    eta: '2026-02-09 16:00',
    lastUpdate: '1 min ago',
  },
  {
    id: '6',
    name: 'MV NORDIC EXPLORER',
    imo: 'IMO 9876548',
    flag: '🇳🇴',
    type: 'Tanker',
    lat: 51.9225,
    lng: 4.4792,
    speed: 13.2,
    heading: 315,
    status: 'underway',
    destination: 'ROTTERDAM',
    eta: '2026-02-10 06:00',
    lastUpdate: '2 min ago',
  },
  {
    id: '7',
    name: 'MV SUEZ TRANSIT',
    imo: 'IMO 9876549',
    flag: '🇵🇦',
    type: 'Bulk Carrier',
    lat: 31.2653,
    lng: 32.3019,
    speed: 8.5,
    heading: 0,
    status: 'underway',
    destination: 'PORT SAID',
    eta: '2026-02-09 20:00',
    lastUpdate: '4 min ago',
  },
  {
    id: '8',
    name: 'MV CARIBBEAN QUEEN',
    imo: 'IMO 9876550',
    flag: '🇧🇸',
    type: 'Container',
    lat: 8.9500,
    lng: -79.5667,
    speed: 12.1,
    heading: 90,
    status: 'underway',
    destination: 'BALBOA',
    eta: '2026-02-10 12:00',
    lastUpdate: '1 min ago',
  },
];

const statusColors = {
  'underway': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  'at-anchor': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
  'moored': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  'not-under-command': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
};

const typeIcons = {
  'Bulk Carrier': '🚢',
  'Container': '📦',
  'Tanker': '🛢️',
};

export default function FleetDashboardShowcase() {
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(demoVessels[1]); // Atlantic Voyager
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [liveUpdate, setLiveUpdate] = useState(true);
  const [simulatedTime, setSimulatedTime] = useState(0);

  // Simulate live updates
  useEffect(() => {
    if (!liveUpdate) return;

    const interval = setInterval(() => {
      setSimulatedTime((t) => t + 1);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [liveUpdate]);

  // Filter vessels by status
  const filteredVessels = useMemo(() => {
    if (filterStatus === 'all') return demoVessels;
    return demoVessels.filter((v) => v.status === filterStatus);
  }, [filterStatus]);

  // Fleet statistics
  const stats = useMemo(() => {
    return {
      total: demoVessels.length,
      underway: demoVessels.filter((v) => v.status === 'underway').length,
      atAnchor: demoVessels.filter((v) => v.status === 'at-anchor').length,
      moored: demoVessels.filter((v) => v.status === 'moored').length,
      avgSpeed: (demoVessels.reduce((sum, v) => sum + v.speed, 0) / demoVessels.length).toFixed(1),
    };
  }, []);

  return (
    <ShowcaseLayout
      title="Live Fleet Dashboard"
      icon="🌍"
      category="Voyage Execution"
      problem="Tracking vessels across multiple platforms, delayed AIS updates (15-30 min), no unified view, manual position checks, missed geofencing alerts"
      solution="Real-time AIS tracking with 1-minute updates, unified fleet dashboard, automatic geofencing alerts, journey playback, predictive ETA, mobile alerts"
      timeSaved="5 hours/week"
      roi="20x"
      accuracy="99.9%"
      nextSection={{
        title: 'Operations Center',
        path: '/demo-showcase/operations-center',
      }}
    >
      {/* Fleet Overview Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4">
          <div className="text-sm text-maritime-400 mb-1">Total Fleet</div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-maritime-500 mt-1">vessels</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="text-sm text-green-400 mb-1">Underway</div>
          <div className="text-3xl font-bold text-green-400">{stats.underway}</div>
          <div className="text-xs text-green-500/70 mt-1">active voyages</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="text-sm text-yellow-400 mb-1">At Anchor</div>
          <div className="text-3xl font-bold text-yellow-400">{stats.atAnchor}</div>
          <div className="text-xs text-yellow-500/70 mt-1">waiting</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="text-sm text-blue-400 mb-1">Moored</div>
          <div className="text-3xl font-bold text-blue-400">{stats.moored}</div>
          <div className="text-xs text-blue-500/70 mt-1">in port</div>
        </div>
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4">
          <div className="text-sm text-maritime-400 mb-1">Avg Speed</div>
          <div className="text-3xl font-bold text-cyan-400">{stats.avgSpeed}</div>
          <div className="text-xs text-maritime-500 mt-1">knots</div>
        </div>
      </div>

      {/* Live Update Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Fleet Positions</h2>
          <div className="flex items-center gap-2">
            {liveUpdate && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-green-400">Live ({simulatedTime}s)</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLiveUpdate(!liveUpdate)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              liveUpdate
                ? 'bg-green-600/20 border-green-500/50 text-green-400'
                : 'bg-maritime-800 border-maritime-600 text-maritime-400'
            }`}
          >
            {liveUpdate ? '📡 Live Updates ON' : '⏸️ Paused'}
          </button>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Vessel List */}
        <div className="col-span-1 bg-maritime-800/50 border border-maritime-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Vessels</h3>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 bg-maritime-900 border border-maritime-600 rounded text-sm text-maritime-300"
            >
              <option value="all">All Status</option>
              <option value="underway">Underway</option>
              <option value="at-anchor">At Anchor</option>
              <option value="moored">Moored</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredVessels.map((vessel) => {
              const colors = statusColors[vessel.status];
              const isSelected = selectedVessel?.id === vessel.id;

              return (
                <button
                  key={vessel.id}
                  onClick={() => setSelectedVessel(vessel)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-maritime-900/50 border-maritime-700 hover:border-maritime-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{typeIcons[vessel.type as keyof typeof typeIcons]}</span>
                      <span className="text-lg">{vessel.flag}</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs ${colors.bg} ${colors.text} ${colors.border} border`}>
                      {vessel.status}
                    </div>
                  </div>
                  <div className="font-semibold text-white mb-1">{vessel.name}</div>
                  <div className="text-xs text-maritime-400 space-y-1">
                    <div>{vessel.imo}</div>
                    <div className="flex items-center gap-2">
                      <span>⚡ {vessel.speed} kn</span>
                      <span>→ {vessel.destination}</span>
                    </div>
                    <div className="text-maritime-500">{vessel.lastUpdate}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Map Visualization */}
        <div className="col-span-2 bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
          <h3 className="font-semibold text-white mb-4">Global Fleet Map</h3>

          {/* Simplified world map with vessel positions */}
          <div className="relative bg-gradient-to-br from-blue-950 to-maritime-950 rounded-lg p-8 h-[600px] border border-maritime-700 overflow-hidden">
            {/* World map background (simplified) */}
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 800 400" className="w-full h-full">
                {/* Simplified continents outline */}
                <path
                  d="M 100 100 L 200 80 L 280 120 L 320 100 L 350 140 L 300 180 L 250 160 L 180 190 L 120 150 Z"
                  fill="rgba(100,200,255,0.3)"
                  stroke="rgba(100,200,255,0.5)"
                />
                <path
                  d="M 400 120 L 500 100 L 580 140 L 620 120 L 650 160 L 600 200 L 520 190 L 450 180 Z"
                  fill="rgba(100,200,255,0.3)"
                  stroke="rgba(100,200,255,0.5)"
                />
                <path
                  d="M 350 250 L 420 230 L 480 260 L 450 300 L 380 290 Z"
                  fill="rgba(100,200,255,0.3)"
                  stroke="rgba(100,200,255,0.5)"
                />
              </svg>
            </div>

            {/* Vessel markers */}
            {demoVessels.map((vessel) => {
              // Convert lat/lng to pixel positions (simplified projection)
              const x = ((vessel.lng + 180) / 360) * 100;
              const y = ((90 - vessel.lat) / 180) * 100;
              const isSelected = selectedVessel?.id === vessel.id;
              const colors = statusColors[vessel.status];

              return (
                <div
                  key={vessel.id}
                  className="absolute transition-all cursor-pointer"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => setSelectedVessel(vessel)}
                >
                  {/* Vessel marker */}
                  <div
                    className={`relative transition-all ${
                      isSelected ? 'scale-150' : 'scale-100 hover:scale-125'
                    }`}
                  >
                    {/* Pulse animation for underway vessels */}
                    {vessel.status === 'underway' && (
                      <div className={`absolute inset-0 ${colors.bg} rounded-full animate-ping`} />
                    )}

                    {/* Marker dot */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${colors.bg} ${colors.border} relative z-10`}
                      style={{
                        transform: `rotate(${vessel.heading}deg)`,
                      }}
                    >
                      {vessel.status === 'underway' && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-green-400" />
                      )}
                    </div>

                    {/* Vessel label */}
                    {isSelected && (
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-maritime-900/95 border border-blue-500 rounded px-2 py-1 whitespace-nowrap z-20">
                        <div className="text-xs font-semibold text-white">{vessel.name}</div>
                        <div className="text-xs text-maritime-400">{vessel.speed} kn → {vessel.destination}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Map legend */}
            <div className="absolute bottom-4 right-4 bg-maritime-900/90 border border-maritime-700 rounded-lg p-3 text-xs">
              <div className="font-semibold text-white mb-2">Status Legend</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                  <span className="text-maritime-400">Underway</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  <span className="text-maritime-400">At Anchor</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/50" />
                  <span className="text-maritime-400">Moored</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Vessel Details */}
      {selectedVessel && (
        <div className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{typeIcons[selectedVessel.type as keyof typeof typeIcons]}</span>
                <span className="text-2xl">{selectedVessel.flag}</span>
                <h3 className="text-2xl font-bold text-white">{selectedVessel.name}</h3>
              </div>
              <div className="text-sm text-maritime-400">{selectedVessel.imo} • {selectedVessel.type}</div>
            </div>
            <div className={`px-4 py-2 rounded-lg border ${statusColors[selectedVessel.status].bg} ${statusColors[selectedVessel.status].text} ${statusColors[selectedVessel.status].border}`}>
              {selectedVessel.status.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-maritime-400 mb-1">Position</div>
              <div className="text-lg font-semibold text-white">
                {selectedVessel.lat.toFixed(4)}°N
              </div>
              <div className="text-lg font-semibold text-white">
                {selectedVessel.lng.toFixed(4)}°E
              </div>
            </div>
            <div>
              <div className="text-sm text-maritime-400 mb-1">Speed / Heading</div>
              <div className="text-lg font-semibold text-cyan-400">{selectedVessel.speed} knots</div>
              <div className="text-lg font-semibold text-cyan-400">{selectedVessel.heading}°</div>
            </div>
            <div>
              <div className="text-sm text-maritime-400 mb-1">Destination</div>
              <div className="text-lg font-semibold text-white">{selectedVessel.destination}</div>
              <div className="text-sm text-maritime-500">ETA: {selectedVessel.eta}</div>
            </div>
            <div>
              <div className="text-sm text-maritime-400 mb-1">Last Update</div>
              <div className="text-lg font-semibold text-green-400">{selectedVessel.lastUpdate}</div>
              <div className="text-sm text-maritime-500">AIS Signal: Strong</div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
              📍 View Journey History
            </button>
            <button className="px-4 py-2 bg-maritime-700 hover:bg-maritime-600 text-white rounded-lg transition-colors text-sm">
              🔔 Set Alert
            </button>
            <button className="px-4 py-2 bg-maritime-700 hover:bg-maritime-600 text-white rounded-lg transition-colors text-sm">
              📊 Performance Report
            </button>
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-3 gap-6 mt-8">
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
          <div className="text-2xl mb-3">🔔</div>
          <h3 className="text-lg font-semibold text-white mb-2">Geofencing Alerts</h3>
          <p className="text-sm text-maritime-400 mb-3">
            Automatic notifications when vessels enter/exit defined zones: ports, ECA areas, high-risk regions
          </p>
          <div className="text-xs text-green-400">✓ 3 active geofences</div>
        </div>

        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
          <div className="text-2xl mb-3">⏪</div>
          <h3 className="text-lg font-semibold text-white mb-2">Journey Playback</h3>
          <p className="text-sm text-maritime-400 mb-3">
            Replay vessel movements over any time period with speed controls and event markers
          </p>
          <div className="text-xs text-blue-400">✓ 90-day history available</div>
        </div>

        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
          <div className="text-2xl mb-3">📱</div>
          <h3 className="text-lg font-semibold text-white mb-2">Mobile Alerts</h3>
          <p className="text-sm text-maritime-400 mb-3">
            Push notifications for critical events: arrival, deviation, delay, emergency
          </p>
          <div className="text-xs text-purple-400">✓ iOS & Android apps</div>
        </div>
      </div>
    </ShowcaseLayout>
  );
}
