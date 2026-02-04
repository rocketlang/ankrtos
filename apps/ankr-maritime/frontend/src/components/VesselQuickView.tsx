/**
 * Vessel Quick View Modal
 * QW3 Implementation - Feb 2, 2026
 */

import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { Modal } from './Modal';

const GET_VESSEL_DETAILS = gql`
  query GetVesselDetails($id: String!) {
    vessel(id: $id) {
      id
      name
      imo
      type
      dwt
      yearBuilt
      flag
      registeredOwner
      callSign
      length
      beam
      draft
      grossTonnage
      netTonnage
      createdAt
      updatedAt
    }
    vesselPositions(vesselId: $id, limit: 1) {
      id
      latitude
      longitude
      speed
      course
      timestamp
    }
    voyages(vesselId: $id, limit: 3) {
      id
      reference
      status
      departurePort
      arrivalPort
      eta
      etd
      createdAt
    }
    vesselCertificates(vesselId: $id) {
      id
      name
      type
      issuedBy
      issuedDate
      expiryDate
      status
    }
  }
`;

interface VesselQuickViewProps {
  vesselId: string | null;
  onClose: () => void;
}

export function VesselQuickView({ vesselId, onClose }: VesselQuickViewProps) {
  const { data, loading, error } = useQuery(GET_VESSEL_DETAILS, {
    variables: { id: vesselId },
    skip: !vesselId,
  });

  const vessel = data?.vessel;
  const position = data?.vesselPositions?.[0];
  const voyages = data?.voyages || [];
  const certificates = data?.vesselCertificates || [];

  // Calculate expiring certificates (within 30 days)
  const expiringCertificates = certificates.filter((cert: any) => {
    if (!cert.expiryDate) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(cert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  if (!vesselId) return null;

  return (
    <Modal open={!!vesselId} onClose={onClose} title="Vessel Quick View">
      {loading ? (
        <div className="text-center py-8 text-maritime-400">
          Loading vessel details...
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-400">
          Error loading vessel details
        </div>
      ) : !vessel ? (
        <div className="text-center py-8 text-maritime-400">
          Vessel not found
        </div>
      ) : (
        <div className="space-y-6">
          {/* Vessel Header */}
          <div className="pb-4 border-b border-maritime-700">
            <h3 className="text-2xl font-bold text-white mb-2">
              {vessel.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-maritime-400">
              <span>IMO: {vessel.imo}</span>
              <span>•</span>
              <span className="px-2 py-1 bg-maritime-700 rounded text-maritime-300">
                {vessel.type}
              </span>
            </div>
          </div>

          {/* Vessel Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-maritime-500 uppercase mb-1">DWT</p>
              <p className="text-white font-medium">
                {vessel.dwt?.toLocaleString() || 'N/A'} MT
              </p>
            </div>
            <div>
              <p className="text-xs text-maritime-500 uppercase mb-1">Year Built</p>
              <p className="text-white font-medium">{vessel.yearBuilt || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-maritime-500 uppercase mb-1">Flag</p>
              <p className="text-white font-medium">{vessel.flag || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-maritime-500 uppercase mb-1">Call Sign</p>
              <p className="text-white font-medium">{vessel.callSign || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-maritime-500 uppercase mb-1">Length</p>
              <p className="text-white font-medium">
                {vessel.length ? `${vessel.length} m` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-maritime-500 uppercase mb-1">Beam</p>
              <p className="text-white font-medium">
                {vessel.beam ? `${vessel.beam} m` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-maritime-500 uppercase mb-1">Draft</p>
              <p className="text-white font-medium">
                {vessel.draft ? `${vessel.draft} m` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-maritime-500 uppercase mb-1">GT</p>
              <p className="text-white font-medium">
                {vessel.grossTonnage?.toLocaleString() || 'N/A'}
              </p>
            </div>
          </div>

          {/* Owner */}
          {vessel.registeredOwner && (
            <div className="pt-4 border-t border-maritime-700">
              <p className="text-xs text-maritime-500 uppercase mb-1">Registered Owner</p>
              <p className="text-white font-medium">{vessel.registeredOwner}</p>
            </div>
          )}

          {/* Current Position */}
          {position && (
            <div className="pt-4 border-t border-maritime-700">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                <span className="mr-2">📍</span>
                Current Position
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-maritime-500">Latitude</p>
                  <p className="text-white">{position.latitude?.toFixed(4) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-maritime-500">Longitude</p>
                  <p className="text-white">{position.longitude?.toFixed(4) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-maritime-500">Speed</p>
                  <p className="text-white">{position.speed ? `${position.speed} kts` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-maritime-500">Course</p>
                  <p className="text-white">{position.course ? `${position.course}°` : 'N/A'}</p>
                </div>
              </div>
              <p className="text-xs text-maritime-500 mt-2">
                Last updated: {position.timestamp ? new Date(position.timestamp).toLocaleString() : 'N/A'}
              </p>
            </div>
          )}

          {/* Recent Voyages */}
          {voyages.length > 0 && (
            <div className="pt-4 border-t border-maritime-700">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                <span className="mr-2">🚢</span>
                Recent Voyages ({voyages.length})
              </h4>
              <div className="space-y-2">
                {voyages.map((voyage: any) => (
                  <div key={voyage.id} className="p-3 bg-maritime-900 rounded border border-maritime-700">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-white">{voyage.reference || 'N/A'}</p>
                      <span className={`px-2 py-0.5 text-xs rounded
                        ${voyage.status === 'completed' ? 'bg-green-900 text-green-300' :
                          voyage.status === 'in_progress' ? 'bg-blue-900 text-blue-300' :
                          'bg-gray-900 text-gray-300'}`}>
                        {voyage.status}
                      </span>
                    </div>
                    <p className="text-xs text-maritime-400">
                      {voyage.departurePort || 'N/A'} → {voyage.arrivalPort || 'N/A'}
                    </p>
                    {voyage.eta && (
                      <p className="text-xs text-maritime-500 mt-1">
                        ETA: {new Date(voyage.eta).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiring Certificates Alert */}
          {expiringCertificates.length > 0 && (
            <div className="pt-4 border-t border-maritime-700">
              <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded">
                <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Expiring Certificates ({expiringCertificates.length})
                </h4>
                <div className="space-y-2">
                  {expiringCertificates.map((cert: any) => {
                    const daysLeft = Math.ceil(
                      (new Date(cert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div key={cert.id} className="text-sm">
                        <p className="text-yellow-300 font-medium">{cert.name}</p>
                        <p className="text-yellow-500 text-xs">
                          Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''} ({new Date(cert.expiryDate).toLocaleDateString()})
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* No recent activity message */}
          {voyages.length === 0 && !position && (
            <div className="pt-4 border-t border-maritime-700 text-center text-maritime-500 text-sm">
              No recent activity or position data available
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
