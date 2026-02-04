/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GEOFENCE MANAGER - Create, Edit, View Geofences on Map
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * WHO CAN USE:
 * - Fleet Manager
 * - Operations Head
 * - System Admin
 *
 * FEATURES:
 * - Draw circles/polygons on map
 * - Auto-create from trips
 * - Import from CSV
 * - View all geofences
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Circle, Square, Upload, Trash2, Edit, Eye, Bell, Plus } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Geofence {
  id: string;
  name: string;
  type: 'pickup' | 'delivery' | 'hub' | 'toll' | 'fuel' | 'restricted' | 'custom';
  shape: 'circle' | 'polygon';
  centerLat?: number;
  centerLng?: number;
  radiusMeters?: number;
  triggers: Array<'enter' | 'exit' | 'dwell'>;
  isActive: boolean;
  createdBy: 'system' | 'admin' | 'import';
}

// Mock data
const MOCK_GEOFENCES: Geofence[] = [
  { id: 'g1', name: 'Mumbai Hub', type: 'hub', shape: 'circle', centerLat: 19.076, centerLng: 72.877, radiusMeters: 1000, triggers: ['enter', 'exit'], isActive: true, createdBy: 'admin' },
  { id: 'g2', name: 'Pune Warehouse', type: 'delivery', shape: 'circle', centerLat: 18.520, centerLng: 73.856, radiusMeters: 500, triggers: ['enter', 'dwell'], isActive: true, createdBy: 'system' },
  { id: 'g3', name: 'Bangalore Factory', type: 'pickup', shape: 'circle', centerLat: 12.971, centerLng: 77.594, radiusMeters: 800, triggers: ['enter', 'exit'], isActive: true, createdBy: 'system' },
  { id: 'g4', name: 'Restricted Zone - Army', type: 'restricted', shape: 'circle', centerLat: 28.613, centerLng: 77.209, radiusMeters: 2000, triggers: ['enter'], isActive: true, createdBy: 'admin' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface Props {
  onGeofenceSelect?: (geofence: Geofence) => void;
}

export default function GeofenceManager({ onGeofenceSelect }: Props) {
  const [geofences, setGeofences] = useState<Geofence[]>(MOCK_GEOFENCES);
  const [filter, setFilter] = useState<'all' | Geofence['type']>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);

  const filteredGeofences = filter === 'all' 
    ? geofences 
    : geofences.filter(g => g.type === filter);

  const getTypeColor = (type: Geofence['type']) => {
    const colors: Record<string, string> = {
      pickup: 'bg-green-500',
      delivery: 'bg-blue-500',
      hub: 'bg-purple-500',
      toll: 'bg-yellow-500',
      fuel: 'bg-orange-500',
      restricted: 'bg-red-500',
      custom: 'bg-gray-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const getTypeIcon = (type: Geofence['type']) => {
    const icons: Record<string, string> = {
      pickup: '📦',
      delivery: '🏭',
      hub: '🏢',
      toll: '🛣️',
      fuel: '⛽',
      restricted: '⛔',
      custom: '📍',
    };
    return icons[type] || '📍';
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Circle className="w-5 h-5" />
              Geofence Manager
            </h3>
            <p className="text-purple-100 text-sm">
              {geofences.length} geofences • {geofences.filter(g => g.isActive).length} active
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-purple-50"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>

        {/* Type Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {['all', 'pickup', 'delivery', 'hub', 'toll', 'fuel', 'restricted'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === type
                  ? 'bg-white text-purple-600'
                  : 'bg-purple-500/50 text-white hover:bg-purple-500'
              }`}
            >
              {type === 'all' ? 'All' : `${getTypeIcon(type as any)} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </button>
          ))}
        </div>
      </div>

      {/* Geofence List */}
      <div className="divide-y divide-gray-700 max-h-[400px] overflow-y-auto">
        {filteredGeofences.map(geofence => (
          <div
            key={geofence.id}
            onClick={() => {
              setSelectedGeofence(geofence);
              onGeofenceSelect?.(geofence);
            }}
            className={`p-4 hover:bg-gray-700 cursor-pointer transition-all ${
              selectedGeofence?.id === geofence.id ? 'bg-gray-700 border-l-4 border-purple-500' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${getTypeColor(geofence.type)} flex items-center justify-center text-xl`}>
                  {getTypeIcon(geofence.type)}
                </div>
                <div>
                  <p className="font-bold text-white">{geofence.name}</p>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${geofence.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                    {geofence.radiusMeters}m radius • {geofence.createdBy}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {geofence.triggers.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-gray-600 text-gray-300 text-xs rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="p-4 bg-gray-700 border-t border-gray-600">
        <div className="flex gap-2">
          <button className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm">
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm">
            <Eye className="w-4 h-4" />
            View on Map
          </button>
        </div>
      </div>

      {/* Create Modal (simplified) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-4">Create Geofence</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g., Mumbai Warehouse"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 block mb-1">Type</label>
                <select className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg">
                  <option value="hub">🏢 Hub</option>
                  <option value="pickup">📦 Pickup Point</option>
                  <option value="delivery">🏭 Delivery Point</option>
                  <option value="toll">🛣️ Toll Plaza</option>
                  <option value="fuel">⛽ Fuel Station</option>
                  <option value="restricted">⛔ Restricted Zone</option>
                  <option value="custom">📍 Custom</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Latitude</label>
                  <input type="number" step="0.0001" className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg" placeholder="19.0760" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Longitude</label>
                  <input type="number" step="0.0001" className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg" placeholder="72.8777" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Radius (meters)</label>
                <input type="number" defaultValue={500} className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg" />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">Triggers</label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 text-white">
                    <input type="checkbox" defaultChecked /> Enter
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input type="checkbox" defaultChecked /> Exit
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input type="checkbox" /> Dwell
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Would call GraphQL mutation
                  setShowCreateModal(false);
                }}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg"
              >
                Create Geofence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
