import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { navSections } from '../lib/sidebar-nav';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ServiceCluster {
  id: string;
  label: string;
  services: Array<{ label: string; href: string }>;
  position: [number, number]; // [lat, lng]
  icon: string;
  color: string;
}

/**
 * Service clusters positioned at major maritime hubs worldwide
 */
const serviceClusters: ServiceCluster[] = [
  {
    id: 'singapore',
    label: 'Fleet Operations',
    position: [1.3521, 103.8198], // Singapore
    icon: '🚢',
    color: '#22d3ee',
    services: [
      { label: 'Vessels', href: '/vessels' },
      { label: 'Fleet Portal', href: '/fleet-portal' },
      { label: 'Vessel Tracker', href: '/vessel-tracker' },
      { label: 'Vessel Positions', href: '/vessel-positions' },
      { label: 'Open Tonnage', href: '/open-tonnage' },
    ],
  },
  {
    id: 'rotterdam',
    label: 'Port Services',
    position: [51.9244, 4.4777], // Rotterdam
    icon: '⚓',
    color: '#4ade80',
    services: [
      { label: 'Ports', href: '/ports' },
      { label: 'Port Intelligence', href: '/port-intelligence' },
      { label: 'Port Map', href: '/port-map' },
      { label: 'World Port Index', href: '/world-port-index' },
      { label: 'Port Tariffs', href: '/port-tariffs' },
    ],
  },
  {
    id: 'london',
    label: 'Chartering & Commercial',
    position: [51.5074, -0.1278], // London
    icon: '💼',
    color: '#fb923c',
    services: [
      { label: 'Chartering', href: '/chartering' },
      { label: 'Cargo Enquiries', href: '/cargo-enquiries' },
      { label: 'Time Charters', href: '/time-charters' },
      { label: 'COA Management', href: '/coa-management' },
      { label: 'Freight Estimates', href: '/freight-estimates' },
    ],
  },
  {
    id: 'dubai',
    label: 'Voyage Operations',
    position: [25.2048, 55.2708], // Dubai
    icon: '⚙️',
    color: '#a78bfa',
    services: [
      { label: 'Voyages', href: '/voyages' },
      { label: 'DA Desk', href: '/da-desk' },
      { label: 'Laytime', href: '/laytime' },
      { label: 'Voyage Timeline', href: '/voyage-timeline' },
      { label: 'Operations KPI', href: '/operations-kpi' },
    ],
  },
  {
    id: 'newyork',
    label: 'Finance & Invoicing',
    position: [40.7128, -74.0060], // New York
    icon: '💰',
    color: '#c084fc',
    services: [
      { label: 'Invoices', href: '/invoices' },
      { label: 'FX Dashboard', href: '/fx-dashboard' },
      { label: 'Letters of Credit', href: '/letters-of-credit' },
      { label: 'Vendor Management', href: '/vendor-management' },
    ],
  },
  {
    id: 'hongkong',
    label: 'Documents & Cargo',
    position: [22.3193, 114.1694], // Hong Kong
    icon: '📄',
    color: '#fbbf24',
    services: [
      { label: 'Bills of Lading', href: '/bills-of-lading' },
      { label: 'Document Vault', href: '/document-vault' },
      { label: 'Cargo Compatibility', href: '/cargo-compatibility' },
      { label: 'EBL Chain', href: '/ebl-chain' },
    ],
  },
  {
    id: 'mumbai',
    label: 'Analytics & Intelligence',
    position: [19.0760, 72.8777], // Mumbai
    icon: '📊',
    color: '#a855f7',
    services: [
      { label: 'Analytics', href: '/analytics' },
      { label: 'Reports', href: '/reports' },
      { label: 'Mari8X LLM', href: '/mari8x-llm' },
      { label: 'Advanced Search', href: '/advanced-search' },
    ],
  },
  {
    id: 'panama',
    label: 'Compliance & Alerts',
    position: [9.0765, -79.5343], // Panama
    icon: '⚠️',
    color: '#f43f5e',
    services: [
      { label: 'Alerts', href: '/alerts' },
      { label: 'Delay Alerts', href: '/delay-alerts' },
      { label: 'Compliance', href: '/compliance' },
      { label: 'Claims', href: '/claims' },
    ],
  },
];

// Map tile options
const mapStyles = {
  light: {
    name: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    bg: '#f8fafc',
  },
  dark: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    bg: '#0f172a',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    bg: '#1e293b',
  },
  ocean: {
    name: 'Ocean Focus',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    bg: '#0a192f',
  },
  classic: {
    name: 'Classic',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    bg: '#ffffff',
  },
};

type MapStyleKey = keyof typeof mapStyles;

export default function WorldServiceMap() {
  const navigate = useNavigate();
  const [selectedCluster, setSelectedCluster] = useState<ServiceCluster | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('light');

  const createCustomIcon = (cluster: ServiceCluster) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="flex flex-col items-center cursor-pointer group">
          <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-transform group-hover:scale-125"
               style="background: ${cluster.color}; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
            ${cluster.icon}
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
  };

  return (
    <div className="w-full h-screen relative bg-slate-100">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mari8X Global Operations</h1>
            <p className="text-sm text-slate-600">
              {serviceClusters.length} service hubs • {serviceClusters.reduce((sum, c) => sum + c.services.length, 0)} services worldwide
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500 hidden sm:block">
              Map Style →
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* World Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="w-full h-full"
        style={{ background: mapStyles[mapStyle].bg }}
        zoomControl={true}
        minZoom={2}
        maxZoom={8}
      >
        {/* Map Tiles - User Selectable */}
        <TileLayer
          key={mapStyle}
          attribution='&copy; Map Data Providers'
          url={mapStyles[mapStyle].url}
        />

        {/* Service Cluster Markers */}
        {serviceClusters.map((cluster) => (
          <div key={cluster.id}>
            {/* Marker */}
            <Marker
              position={cluster.position}
              icon={createCustomIcon(cluster)}
              eventHandlers={{
                click: () => setSelectedCluster(cluster),
              }}
            >
              <Popup className="custom-popup" maxWidth={300}>
                <div className="p-2">
                  <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                    <span className="text-2xl">{cluster.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{cluster.label}</h3>
                      <p className="text-xs text-slate-600">{cluster.services.length} services</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {cluster.services.map((service) => (
                      <button
                        key={service.href}
                        onClick={() => navigate(service.href)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 transition-colors text-sm text-slate-700 font-medium"
                      >
                        → {service.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Subtle radius circle */}
            <Circle
              center={cluster.position}
              radius={200000} // 200km
              pathOptions={{
                fillColor: cluster.color,
                fillOpacity: 0.1,
                color: cluster.color,
                weight: 1,
                opacity: 0.3,
              }}
            />
          </div>
        ))}
      </MapContainer>

      {/* Map Style Selector */}
      <div className="absolute top-24 right-6 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-300 rounded-xl shadow-lg overflow-hidden">
        {Object.entries(mapStyles).map(([key, style]) => (
          <button
            key={key}
            onClick={() => setMapStyle(key as MapStyleKey)}
            className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors border-b border-slate-200 last:border-b-0 ${
              mapStyle === key
                ? 'bg-cyan-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {style.name}
          </button>
        ))}
      </div>

      {/* Service Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-300 rounded-xl p-4 max-w-xs shadow-lg">
        <h3 className="text-slate-900 font-bold mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
          <span className="text-xl">🌍</span>
          Service Hubs
        </h3>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {serviceClusters.map((cluster) => (
            <button
              key={cluster.id}
              onClick={() => {
                setSelectedCluster(cluster);
                // Fly to location (would need map instance)
              }}
              className="w-full text-left p-2 rounded-lg hover:bg-slate-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm"
                  style={{ backgroundColor: cluster.color }}
                >
                  {cluster.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 text-sm font-medium truncate group-hover:text-cyan-600">
                    {cluster.label}
                  </p>
                  <p className="text-slate-600 text-xs">
                    {cluster.services.length} services
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
