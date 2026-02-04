/**
 * Omega Shell Demo - With Real Data
 */
import { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { OmegaShell, useOmega } from '../../../../../libs/omega-ui/src/shell';
import { FleetStatsWidget, VehicleListWidget, VoiceInputWidget, WidgetRegistryBrowser } from '@ankr/widgets';

// Same query as Fleet page
const GET_VEHICLES = gql`
  query GetVehicles {
    vehicles {
      id
      vehicleNumber
      vehicleType
      status
      lastLatitude
      lastLongitude
      lastUpdated
      driver {
        id
        name
        phone
      }
    }
  }
`;

// Transform to widget format
function transformVehicles(vehicles: any[]) {
  return vehicles.map(v => ({
    id: v.id,
    vehicleNumber: v.vehicleNumber,
    driverName: v.driver?.name || 'Unassigned',
    speed: Math.floor(Math.random() * 80), // Simulated speed
    status: v.status === 'ACTIVE' ? 'moving' as const :
            v.status === 'IDLE' ? 'stopped' as const : 'parked' as const,
    lat: v.lastLatitude || 0,
    lng: v.lastLongitude || 0,
  }));
}

// Calculate stats
function calculateStats(vehicles: any[]) {
  const total = vehicles.length;
  const moving = vehicles.filter(v => v.status === 'moving').length;
  const stopped = vehicles.filter(v => v.status === 'stopped').length;
  const parked = vehicles.filter(v => v.status === 'parked').length;
  return { total, moving, stopped, parked };
}

const registryWidgets = [
  { id: 'gps-map', name: 'GPS Map', category: 'gps', description: 'Interactive map with vehicle markers', component: 'GPSMapWidget', hook: 'useGPS', bff: 'gps.bff', tags: ['map', 'tracking'], example: '<GPSMapWidget vehicles={[]} />' },
  { id: 'fleet-stats', name: 'Fleet Stats', category: 'analytics', description: 'Dashboard stat cards', component: 'FleetStatsWidget', tags: ['stats'], example: '<FleetStatsWidget stats={stats} />' },
  { id: 'voice-input', name: 'Voice Input', category: 'voice', description: 'Mic for voice commands', component: 'VoiceInputWidget', hook: 'useVoice', tags: ['voice', 'hindi'], example: '<VoiceInputWidget />' },
  { id: 'vehicle-list', name: 'Vehicle List', category: 'fleet', description: 'List of vehicles with status', component: 'VehicleListWidget', tags: ['list', 'fleet'], example: '<VehicleListWidget vehicles={[]} />' },
];

const registryServices = [
  { id: 'graphql', name: 'GraphQL API', port: 4000, description: 'Main TMS API' },
  { id: 'saathi', name: 'Saathi REST', port: 4002, description: 'Routes & Pincodes' },
  { id: 'gps', name: 'GPS Server', port: 3070, description: 'Real-time tracking' },
];

// Inner content that uses Omega context AND Apollo
function OmegaContent() {
  const { currentProduct, theme } = useOmega();
  const { data, loading, error } = useQuery(GET_VEHICLES, { pollInterval: 30000 });

  const [selectedVehicle, setSelectedVehicle] = useState<string>();
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Transform data
  const vehicles = data?.vehicles ? transformVehicles(data.vehicles) : [];
  const stats = calculateStats(vehicles);

  const titleColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const subtitleColor = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const cardBg = theme === 'light' ? 'bg-gray-100' : 'bg-gray-800';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${cardBg} rounded-xl p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-bold ${titleColor}`}>
              {currentProduct === 'wowtruck' ? '🚛 WowTruck Dashboard' :
               currentProduct === 'system' ? '⚙️ System Administration' :
               '📦 ' + currentProduct}
            </h2>
            <p className={subtitleColor}>
              {loading ? 'Loading real-time data...' : `Live data • ${vehicles.length} vehicles tracked`}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${loading ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
            {loading ? '⏳ Loading...' : '🟢 Live'}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 text-red-400 p-4 rounded-xl">
          Error: {error.message}
        </div>
      )}

      {/* Product-specific content */}
      {currentProduct === 'wowtruck' && (
        <>
          {/* Stats */}
          <div className={`${cardBg} rounded-xl p-4`}>
            <h3 className={`text-lg font-semibold ${titleColor} mb-3`}>📊 Fleet Overview</h3>
            <FleetStatsWidget stats={stats} theme={theme} />
          </div>

          {/* Grid: Vehicle List + Voice */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${cardBg} rounded-xl p-4`}>
              <h3 className={`text-lg font-semibold ${titleColor} mb-3`}>🚛 Vehicles ({vehicles.length})</h3>
              {vehicles.length > 0 ? (
                <VehicleListWidget
                  vehicles={vehicles}
                  selectedId={selectedVehicle}
                  onSelect={(v) => setSelectedVehicle(v.id)}
                  theme={theme}
                  maxHeight="300px"
                />
              ) : (
                <div className={`text-center py-8 ${subtitleColor}`}>
                  {loading ? 'Loading vehicles...' : 'No vehicles found'}
                </div>
              )}
            </div>

            <div className={`${cardBg} rounded-xl p-4`}>
              <h3 className={`text-lg font-semibold ${titleColor} mb-3`}>🎤 Voice Commands</h3>
              <VoiceInputWidget
                recording={recording}
                processing={false}
                transcript={transcript}
                onStartRecording={() => {
                  setRecording(true);
                  setTimeout(() => {
                    setRecording(false);
                    setTranscript('मुझे मुंबई से बैंगलोर ट्रक चाहिए');
                  }, 2000);
                }}
                onStopRecording={() => setRecording(false)}
                onClear={() => setTranscript('')}
                theme={theme}
              />
            </div>
          </div>
        </>
      )}

      {currentProduct === 'system' && (
        <div className={`${cardBg} rounded-xl p-4`}>
          <h3 className={`text-lg font-semibold ${titleColor} mb-3`}>📦 Widget Registry</h3>
          <WidgetRegistryBrowser widgets={registryWidgets} services={registryServices} theme={theme} />
        </div>
      )}

      {/* Architecture */}
      <div className={`${cardBg} rounded-xl p-4`}>
        <h3 className={`text-lg font-semibold ${titleColor} mb-3`}>🏗️ ankrΩmega Architecture</h3>
        <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto font-mono">
{`┌─────────────────────────────────────────────────────────────────┐
│                      ankrΩmega Shell                             │
│  Universal Frontend • White-label Ready • Multi-product         │
├─────────────────────────────────────────────────────────────────┤
│  Products: WowTruck │ EduOS │ WMS │ OMS │ [Your App]            │
├─────────────────────────────────────────────────────────────────┤
│  Widgets:  GPSMap │ VehicleList │ Voice │ Stats │ Registry      │
├─────────────────────────────────────────────────────────────────┤
│  BFF:      gps.bff │ voice.bff │ order.bff │ [domain].bff       │
├─────────────────────────────────────────────────────────────────┤
│  APIs:     GraphQL:4001 │ Saathi:4002 │ GPS:3070                │
└─────────────────────────────────────────────────────────────────┘
                    © 2025-2026 Powerp Box IT Solutions Pvt Limited`}
        </pre>
      </div>
    </div>
  );
}

// Main page - MUST be inside ApolloProvider (which App.tsx provides)
export default function OmegaDemo() {
  return (
    <OmegaShell defaultProduct="wowtruck" defaultTheme="dark" user={{ name: 'Captain', role: 'admin' }}>
      <OmegaContent />
    </OmegaShell>
  );
}
