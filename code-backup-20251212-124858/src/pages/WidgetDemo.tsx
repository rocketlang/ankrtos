/**
 * Widget Demo - Shows all widgets + Registry Browser
 */
import { useState } from 'react';
import { useTheme, useTextColor } from '../contexts/ThemeContext';
import { FleetStatsWidget, VehicleListWidget, VoiceInputWidget, WidgetRegistryBrowser } from '@ankr/widgets';

const sampleVehicles = [
  { id: '1', vehicleNumber: 'MH01-AB-1234', driverName: 'Ramesh', speed: 65, status: 'moving' as const, lat: 19.07, lng: 72.87 },
  { id: '2', vehicleNumber: 'DL01-CD-5678', driverName: 'Suresh', speed: 0, status: 'parked' as const, lat: 28.61, lng: 77.20 },
  { id: '3', vehicleNumber: 'GJ01-EF-9012', driverName: 'Prakash', speed: 12, status: 'stopped' as const, lat: 23.02, lng: 72.57 },
];

const sampleStats = { total: 5, moving: 2, stopped: 1, parked: 2 };

const registryWidgets = [
  { id: 'gps-map', name: 'GPS Map', category: 'gps', description: 'Interactive map with vehicle markers and real-time tracking', component: 'GPSMapWidget', hook: 'useGPS', bff: 'gps.bff', tags: ['map', 'tracking', 'leaflet'], example: '<GPSMapWidget vehicles={vehicles} theme="dark" />' },
  { id: 'vehicle-list', name: 'Vehicle List', category: 'fleet', description: 'Scrollable list of vehicles with status indicators', component: 'VehicleListWidget', hook: 'useGPS', tags: ['list', 'fleet', 'vehicles'], example: '<VehicleListWidget vehicles={vehicles} onSelect={fn} />' },
  { id: 'voice-input', name: 'Voice Input', category: 'voice', description: 'Microphone button for Hindi/English voice commands', component: 'VoiceInputWidget', hook: 'useVoice', bff: 'voice.bff', tags: ['voice', 'hindi', 'speech'], example: '<VoiceInputWidget recording={false} onStart={fn} />' },
  { id: 'fleet-stats', name: 'Fleet Stats', category: 'analytics', description: 'Dashboard cards showing fleet statistics', component: 'FleetStatsWidget', tags: ['stats', 'dashboard', 'analytics'], example: '<FleetStatsWidget stats={stats} compact={false} />' },
  { id: 'registry', name: 'Widget Registry', category: 'ui', description: 'Browse and discover all available widgets', component: 'WidgetRegistryBrowser', tags: ['meta', 'discovery', 'docs'], example: '<WidgetRegistryBrowser widgets={[]} services={[]} />' },
];

const registryServices = [
  { id: 'graphql', name: 'GraphQL API', port: 4000, description: 'Main TMS backend API' },
  { id: 'saathi', name: 'Saathi REST', port: 4002, description: 'Routes, pincodes, tolls' },
  { id: 'gps', name: 'GPS Server', port: 3070, description: 'Real-time GPS tracking' },
];

export default function WidgetDemo() {
  const { theme } = useTheme();
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>();

  // FIXED: Explicit colors based on theme
  const titleColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const subtitleColor = theme === 'light' ? 'text-gray-600' : 'text-gray-300';
  const cardBg = theme === 'light' ? 'bg-gray-100' : 'bg-gray-800';
  const headerBg = theme === 'light' ? 'bg-gray-200' : 'bg-gray-700';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${headerBg} rounded-xl p-4`}>
        <h1 className={`text-2xl font-bold ${titleColor}`}>🧩 Widget Demo</h1>
        <p className={`${subtitleColor} mt-1`}>Pure UI widgets with BFF architecture separation</p>
      </div>

      {/* Stats Widget */}
      <div className={`${cardBg} rounded-xl p-4`}>
        <h2 className={`text-lg font-semibold ${titleColor} mb-3`}>📊 Fleet Stats Widget</h2>
        <FleetStatsWidget stats={sampleStats} theme={theme} />
      </div>

      {/* Grid: List + Voice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${cardBg} rounded-xl p-4`}>
          <h2 className={`text-lg font-semibold ${titleColor} mb-3`}>🚛 Vehicle List Widget</h2>
          <VehicleListWidget
            vehicles={sampleVehicles}
            selectedId={selectedVehicle}
            onSelect={(v) => setSelectedVehicle(v.id)}
            theme={theme}
            maxHeight="250px"
          />
        </div>

        <div className={`${cardBg} rounded-xl p-4`}>
          <h2 className={`text-lg font-semibold ${titleColor} mb-3`}>🎤 Voice Input Widget</h2>
          <VoiceInputWidget
            recording={recording}
            processing={false}
            transcript={transcript}
            onStartRecording={() => {
              setRecording(true);
              setTimeout(() => {
                setRecording(false);
                setTranscript('मुझे चेन्नई से दिल्ली ट्रक चाहिए');
              }, 2000);
            }}
            onStopRecording={() => setRecording(false)}
            onClear={() => setTranscript('')}
            theme={theme}
          />
        </div>
      </div>

      {/* Registry Browser */}
      <div className={`${cardBg} rounded-xl p-4`}>
        <h2 className={`text-lg font-semibold ${titleColor} mb-3`}>📦 Widget Registry Browser</h2>
        <WidgetRegistryBrowser
          widgets={registryWidgets}
          services={registryServices}
          theme={theme}
          onSelect={(w) => console.log('Selected:', w)}
        />
      </div>

      {/* Architecture */}
      <div className={`${cardBg} rounded-xl p-4`}>
        <h2 className={`text-lg font-semibold ${titleColor} mb-3`}>🏗️ Architecture</h2>
        <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto font-mono">
{`┌────────────────────────────────────────────┐
│  @ankr/widgets (Pure UI - just render)     │
│  GPSMap │ VehicleList │ Voice │ Stats      │
└─────────────────┬──────────────────────────┘
                  │ Props only (no API calls)
┌─────────────────▼──────────────────────────┐
│  Hooks (React State Management)            │
│  useGPS │ useVoice │ useBFF                │
└─────────────────┬──────────────────────────┘
                  │ Uses BFF services
┌─────────────────▼──────────────────────────┐
│  BFF Layer (Business Logic)                │
│  gps.bff │ voice.bff │ BFFClient           │
└─────────────────┬──────────────────────────┘
                  │ API calls
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
GraphQL:4001  Saathi:4002   GPS:3070`}
        </pre>
      </div>
    </div>
  );
}
