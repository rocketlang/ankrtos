/**
 * World Port Index (WPI) - NGA Database Integration
 * 13,000+ global ports with comprehensive facility data
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { MapPin, Anchor, Droplets, Wrench, Package, Ship, Activity, Search, Filter, X } from 'lucide-react';

const WPI_PORTS_QUERY = gql`
  query WorldPortIndex($filters: PortFilters) {
    worldPortIndex(filters: $filters) {
      indexNumber
      portName
      unlocode
      country
      latitude
      longitude
      harborSize
      channelDepth
      anchorageDepth
      tidalRange
      facilities {
        wharves
        fuel
        repairs
        provisions
        medical
        wasteDisposal
      }
      cargoCapabilities {
        container
        dryBulk
        oilTanker
        roRo
        lngLpg
      }
      navigationRequirements {
        pilotRequired
        tugsAvailable
        vtsRequired
      }
      securityLevel
      entryRestrictions
    }
  }
`;

interface WPIPort {
  indexNumber: number;
  portName: string;
  unlocode: string;
  country: string;
  latitude: number;
  longitude: number;
  harborSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  channelDepth: number;
  anchorageDepth?: number;
  tidalRange?: number;
  facilities: {
    wharves: boolean;
    fuel: boolean;
    repairs: boolean;
    provisions: boolean;
    medical?: boolean;
    wasteDisposal?: boolean;
  };
  cargoCapabilities: {
    container: boolean;
    dryBulk: boolean;
    oilTanker: boolean;
    roRo?: boolean;
    lngLpg?: boolean;
  };
  navigationRequirements?: {
    pilotRequired: boolean;
    tugsAvailable: boolean;
    vtsRequired: boolean;
  };
  securityLevel?: string;
  entryRestrictions?: string;
}

export function WorldPortIndex() {
  const [search, setSearch] = useState('');
  const [selectedPort, setSelectedPort] = useState<WPIPort | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minDepth: '',
    harborSize: '',
    hasFuel: false,
    hasRepairs: false,
    containerCapable: false,
    bulkCapable: false,
    tankerCapable: false,
  });

  const { data, loading, error } = useQuery(WPI_PORTS_QUERY, {
    variables: { filters: buildFilters() },
  });

  function buildFilters() {
    const result: Record<string, unknown> = {};
    if (filters.minDepth) result.minDepth = parseFloat(filters.minDepth);
    if (filters.harborSize) result.harborSize = filters.harborSize;
    if (filters.hasFuel) result.hasFuel = true;
    if (filters.hasRepairs) result.hasRepairs = true;
    if (filters.containerCapable) result.containerCapable = true;
    if (filters.bulkCapable) result.bulkCapable = true;
    if (filters.tankerCapable) result.tankerCapable = true;
    return result;
  }

  const ports: WPIPort[] = (data?.worldPortIndex ?? []).filter((p: WPIPort) =>
    search === '' ||
    p.portName.toLowerCase().includes(search.toLowerCase()) ||
    p.unlocode.toLowerCase().includes(search.toLowerCase()) ||
    p.country.toLowerCase().includes(search.toLowerCase())
  );

  const getHarborSizeBadge = (size: string) => {
    const colors = {
      SMALL: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      MEDIUM: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      LARGE: 'bg-green-500/20 text-green-300 border-green-500/30',
    };
    return colors[size as keyof typeof colors] || colors.MEDIUM;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Anchor className="w-6 h-6 text-blue-400" />
            World Port Index
          </h1>
          <p className="text-maritime-400 text-sm mt-1">
            NGA Database • 13,000+ Global Ports • Comprehensive Facility Data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-maritime-500" />
            <input
              type="text"
              placeholder="Search port name, UNLOCODE, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-maritime-800 border border-maritime-600 rounded-md pl-10 pr-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-96"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              showFilters
                ? 'bg-blue-600 text-white'
                : 'bg-maritime-700 text-maritime-300 hover:bg-maritime-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Advanced Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-maritime-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-maritime-400 mb-2">Min Channel Depth (m)</label>
              <input
                type="number"
                placeholder="e.g., 12"
                value={filters.minDepth}
                onChange={(e) => setFilters({ ...filters, minDepth: e.target.value })}
                className="w-full bg-maritime-900 border border-maritime-600 rounded px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-maritime-400 mb-2">Harbor Size</label>
              <select
                value={filters.harborSize}
                onChange={(e) => setFilters({ ...filters, harborSize: e.target.value })}
                className="w-full bg-maritime-900 border border-maritime-600 rounded px-3 py-2 text-white text-sm"
              >
                <option value="">All Sizes</option>
                <option value="SMALL">Small</option>
                <option value="MEDIUM">Medium</option>
                <option value="LARGE">Large</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-maritime-400 mb-2">Facilities & Capabilities</label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm text-maritime-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasFuel}
                    onChange={(e) => setFilters({ ...filters, hasFuel: e.target.checked })}
                    className="rounded"
                  />
                  Fuel/Bunkers
                </label>
                <label className="flex items-center gap-2 text-sm text-maritime-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasRepairs}
                    onChange={(e) => setFilters({ ...filters, hasRepairs: e.target.checked })}
                    className="rounded"
                  />
                  Repairs
                </label>
                <label className="flex items-center gap-2 text-sm text-maritime-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.containerCapable}
                    onChange={(e) => setFilters({ ...filters, containerCapable: e.target.checked })}
                    className="rounded"
                  />
                  Container
                </label>
                <label className="flex items-center gap-2 text-sm text-maritime-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.bulkCapable}
                    onChange={(e) => setFilters({ ...filters, bulkCapable: e.target.checked })}
                    className="rounded"
                  />
                  Dry Bulk
                </label>
                <label className="flex items-center gap-2 text-sm text-maritime-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.tankerCapable}
                    onChange={(e) => setFilters({ ...filters, tankerCapable: e.target.checked })}
                    className="rounded"
                  />
                  Tanker
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="text-maritime-400">Loading WPI database...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      <div className="grid grid-cols-3 gap-6">
        {/* Port List */}
        <div className="col-span-2">
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-maritime-900 border-b border-maritime-700">
                  <tr className="text-maritime-400">
                    <th className="text-left px-4 py-3 font-medium">Port</th>
                    <th className="text-left px-4 py-3 font-medium">Size</th>
                    <th className="text-right px-4 py-3 font-medium">Depth (m)</th>
                    <th className="text-left px-4 py-3 font-medium">Facilities</th>
                    <th className="text-left px-4 py-3 font-medium">Cargo Types</th>
                  </tr>
                </thead>
                <tbody>
                  {ports.map((port) => (
                    <tr
                      key={port.indexNumber}
                      onClick={() => setSelectedPort(port)}
                      className={`border-b border-maritime-700/50 hover:bg-maritime-700/30 cursor-pointer transition-colors ${
                        selectedPort?.indexNumber === port.indexNumber ? 'bg-maritime-700/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <div>
                            <div className="text-white font-medium">{port.portName}</div>
                            <div className="text-maritime-400 text-xs font-mono">
                              {port.unlocode} • {port.country}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getHarborSizeBadge(port.harborSize)}`}>
                          {port.harborSize}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-maritime-300 text-right font-mono">
                        {port.channelDepth.toFixed(1)}m
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {port.facilities.fuel && <Droplets className="w-4 h-4 text-green-400" title="Fuel" />}
                          {port.facilities.repairs && <Wrench className="w-4 h-4 text-yellow-400" title="Repairs" />}
                          {port.facilities.provisions && <Package className="w-4 h-4 text-blue-400" title="Provisions" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {port.cargoCapabilities.container && (
                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs">CTR</span>
                          )}
                          {port.cargoCapabilities.dryBulk && (
                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">BULK</span>
                          )}
                          {port.cargoCapabilities.oilTanker && (
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded text-xs">TNK</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ports.length === 0 && !loading && (
                <p className="text-maritime-500 text-center py-12">No ports match your filters</p>
              )}
            </div>
          </div>
          <p className="text-maritime-500 text-sm mt-2">
            Showing {ports.length} of 13,000+ ports
          </p>
        </div>

        {/* Port Details Panel */}
        <div>
          {selectedPort ? (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6 sticky top-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedPort.portName}</h3>
                  <p className="text-maritime-400 text-sm font-mono mt-1">
                    {selectedPort.unlocode} • Index #{selectedPort.indexNumber}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPort(null)}
                  className="text-maritime-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Location */}
                <div>
                  <h4 className="text-sm font-semibold text-maritime-300 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </h4>
                  <div className="text-sm text-maritime-400 space-y-1">
                    <p>Country: <span className="text-white">{selectedPort.country}</span></p>
                    <p>Coordinates: <span className="text-white font-mono">
                      {selectedPort.latitude.toFixed(4)}°, {selectedPort.longitude.toFixed(4)}°
                    </span></p>
                  </div>
                </div>

                {/* Physical Specifications */}
                <div>
                  <h4 className="text-sm font-semibold text-maritime-300 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Physical Specifications
                  </h4>
                  <div className="text-sm text-maritime-400 space-y-1">
                    <p>Harbor Size: <span className={`px-2 py-0.5 rounded text-xs font-medium ${getHarborSizeBadge(selectedPort.harborSize)}`}>
                      {selectedPort.harborSize}
                    </span></p>
                    <p>Channel Depth: <span className="text-white font-mono">{selectedPort.channelDepth}m</span></p>
                    {selectedPort.anchorageDepth && (
                      <p>Anchorage Depth: <span className="text-white font-mono">{selectedPort.anchorageDepth}m</span></p>
                    )}
                    {selectedPort.tidalRange && (
                      <p>Tidal Range: <span className="text-white font-mono">{selectedPort.tidalRange}m</span></p>
                    )}
                  </div>
                </div>

                {/* Facilities */}
                <div>
                  <h4 className="text-sm font-semibold text-maritime-300 mb-2 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Facilities Available
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedPort.facilities).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={value ? 'text-maritime-300' : 'text-maritime-600'}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cargo Capabilities */}
                <div>
                  <h4 className="text-sm font-semibold text-maritime-300 mb-2 flex items-center gap-2">
                    <Ship className="w-4 h-4" />
                    Cargo Capabilities
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedPort.cargoCapabilities).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${value ? 'bg-blue-500' : 'bg-maritime-700'}`} />
                        <span className={value ? 'text-maritime-300' : 'text-maritime-600'}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Requirements */}
                {selectedPort.navigationRequirements && (
                  <div>
                    <h4 className="text-sm font-semibold text-maritime-300 mb-2">Navigation</h4>
                    <div className="text-sm text-maritime-400 space-y-1">
                      <p>Pilot: <span className={selectedPort.navigationRequirements.pilotRequired ? 'text-yellow-400' : 'text-green-400'}>
                        {selectedPort.navigationRequirements.pilotRequired ? 'Required' : 'Not Required'}
                      </span></p>
                      <p>Tugs: <span className={selectedPort.navigationRequirements.tugsAvailable ? 'text-green-400' : 'text-red-400'}>
                        {selectedPort.navigationRequirements.tugsAvailable ? 'Available' : 'Not Available'}
                      </span></p>
                      <p>VTS: <span className={selectedPort.navigationRequirements.vtsRequired ? 'text-yellow-400' : 'text-maritime-400'}>
                        {selectedPort.navigationRequirements.vtsRequired ? 'Required' : 'Not Required'}
                      </span></p>
                    </div>
                  </div>
                )}

                {/* Security & Restrictions */}
                {(selectedPort.securityLevel || selectedPort.entryRestrictions) && (
                  <div>
                    <h4 className="text-sm font-semibold text-maritime-300 mb-2">Security & Access</h4>
                    <div className="text-sm text-maritime-400 space-y-1">
                      {selectedPort.securityLevel && (
                        <p>Security Level: <span className="text-white">{selectedPort.securityLevel}</span></p>
                      )}
                      {selectedPort.entryRestrictions && (
                        <p className="text-yellow-400 text-xs mt-2">
                          ⚠️ {selectedPort.entryRestrictions}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  View on Map
                </button>
                <button className="flex-1 bg-maritime-700 hover:bg-maritime-600 text-maritime-300 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Get Directions
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
              <Anchor className="w-12 h-12 text-maritime-600 mx-auto mb-4" />
              <p className="text-maritime-500">Select a port to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
