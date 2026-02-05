/**
 * Vessel Quick View Modal
 * Lightweight modal for viewing vessel details from any list/table
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { useQuery, gql } from '@apollo/client';
import { X, Ship, Anchor, Calendar, Flag, Gauge, Package, MapPin, Activity } from 'lucide-react';
import { ComponentErrorBoundary } from './ErrorBoundary';

const VESSEL_QUICK_VIEW_QUERY = gql`
  query VesselQuickView($id: ID!) {
    vessel(id: $id) {
      id
      imo
      name
      flag
      vesselType
      dwt
      builtYear
      classification
      status
      currentPosition {
        latitude
        longitude
        speed
        heading
        destination
        eta
        lastUpdate
      }
      specifications {
        loa
        beam
        draft
        grainCapacity
        teuCapacity
      }
    }
  }
`;

interface VesselQuickViewProps {
  vesselId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VesselQuickView({ vesselId, isOpen, onClose }: VesselQuickViewProps) {
  const { data, loading, error } = useQuery(VESSEL_QUICK_VIEW_QUERY, {
    variables: { id: vesselId },
    skip: !isOpen || !vesselId,
  });

  if (!isOpen) return null;

  const vessel = data?.vessel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-maritime-800 border border-maritime-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-maritime-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Ship className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {loading ? 'Loading...' : vessel?.name || 'Vessel Details'}
              </h2>
              {vessel && (
                <p className="text-maritime-400 text-sm">
                  IMO: {vessel.imo} • {vessel.vesselType}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-maritime-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <ComponentErrorBoundary>
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-maritime-600 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-maritime-400 mt-4">Loading vessel details...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-red-400">Error loading vessel: {error.message}</p>
              </div>
            )}

            {vessel && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <InfoCard
                    icon={<Flag className="w-4 h-4" />}
                    label="Flag"
                    value={vessel.flag}
                  />
                  <InfoCard
                    icon={<Calendar className="w-4 h-4" />}
                    label="Built"
                    value={vessel.builtYear?.toString() || '-'}
                  />
                  <InfoCard
                    icon={<Gauge className="w-4 h-4" />}
                    label="DWT"
                    value={vessel.dwt ? `${vessel.dwt.toLocaleString()} MT` : '-'}
                  />
                  <InfoCard
                    icon={<Anchor className="w-4 h-4" />}
                    label="Status"
                    value={vessel.status}
                    statusColor={getStatusColor(vessel.status)}
                  />
                </div>

                {/* Specifications */}
                {vessel.specifications && (
                  <div>
                    <h3 className="text-sm font-semibold text-maritime-300 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Specifications
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <SpecItem label="LOA" value={vessel.specifications.loa ? `${vessel.specifications.loa}m` : '-'} />
                      <SpecItem label="Beam" value={vessel.specifications.beam ? `${vessel.specifications.beam}m` : '-'} />
                      <SpecItem label="Draft" value={vessel.specifications.draft ? `${vessel.specifications.draft}m` : '-'} />
                      {vessel.specifications.grainCapacity && (
                        <SpecItem label="Grain" value={`${vessel.specifications.grainCapacity.toLocaleString()} cbm`} />
                      )}
                      {vessel.specifications.teuCapacity && (
                        <SpecItem label="TEU" value={vessel.specifications.teuCapacity.toLocaleString()} />
                      )}
                    </div>
                  </div>
                )}

                {/* Current Position */}
                {vessel.currentPosition && (
                  <div>
                    <h3 className="text-sm font-semibold text-maritime-300 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Current Position
                    </h3>
                    <div className="bg-maritime-900 border border-maritime-700 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-maritime-400">Coordinates:</span>
                        <span className="text-white font-mono">
                          {vessel.currentPosition.latitude.toFixed(4)}°, {vessel.currentPosition.longitude.toFixed(4)}°
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-maritime-400">Speed:</span>
                        <span className="text-white">{vessel.currentPosition.speed} kts</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-maritime-400">Heading:</span>
                        <span className="text-white">{vessel.currentPosition.heading}°</span>
                      </div>
                      {vessel.currentPosition.destination && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-maritime-400">Destination:</span>
                            <span className="text-white">{vessel.currentPosition.destination}</span>
                          </div>
                          {vessel.currentPosition.eta && (
                            <div className="flex justify-between text-sm">
                              <span className="text-maritime-400">ETA:</span>
                              <span className="text-white">
                                {new Date(vessel.currentPosition.eta).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between text-sm pt-2 border-t border-maritime-700">
                        <span className="text-maritime-400">Last Update:</span>
                        <span className="text-maritime-500 text-xs">
                          {new Date(vessel.currentPosition.lastUpdate).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Classification */}
                {vessel.classification && (
                  <div className="bg-maritime-900 border border-maritime-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-maritime-400" />
                      <span className="text-sm font-medium text-maritime-300">Classification</span>
                    </div>
                    <p className="text-white">{vessel.classification}</p>
                  </div>
                )}
              </div>
            )}
          </ComponentErrorBoundary>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-maritime-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-maritime-700 hover:bg-maritime-600 text-maritime-300 rounded-md text-sm font-medium transition-colors"
          >
            Close
          </button>
          {vessel && (
            <button
              onClick={() => window.location.href = `/vessels/${vessel.id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              View Full Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, statusColor }: { icon: React.ReactNode; label: string; value: string; statusColor?: string }) {
  return (
    <div className="bg-maritime-900 border border-maritime-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2 text-maritime-400">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-white font-medium ${statusColor || ''}`}>{value}</p>
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-maritime-900 border border-maritime-700 rounded p-2">
      <p className="text-maritime-400 text-xs mb-1">{label}</p>
      <p className="text-white text-sm font-medium">{value}</p>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'text-green-400',
    'IN PORT': 'text-blue-400',
    ANCHORED: 'text-yellow-400',
    'AT SEA': 'text-cyan-400',
    INACTIVE: 'text-maritime-500',
  };
  return colors[status?.toUpperCase()] || '';
}
