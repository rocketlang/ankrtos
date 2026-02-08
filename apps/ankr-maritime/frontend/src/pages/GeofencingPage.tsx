/**
 * GEOFENCING PAGE
 * Define zones on map and receive alerts when vessels enter/exit/dwell
 */

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { MapContainer, TileLayer, Circle, Polygon, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const GEOFENCES_QUERY = gql`
  query Geofences($active: Boolean) {
    geofences(active: $active) {
      id
      name
      description
      fenceType
      centerLat
      centerLon
      radiusNm
      polygonCoords
      vesselIds
      alertOnEntry
      alertOnExit
      alertOnDwell
      dwellThresholdHrs
      active
      createdAt
    }
  }
`;

const GEOFENCE_ALERTS_QUERY = gql`
  query GeofenceAlerts($vesselId: String, $acknowledged: Boolean, $limit: Int) {
    geofenceAlerts(vesselId: $vesselId, acknowledged: $acknowledged, limit: $limit) {
      id
      geofenceId
      vesselId
      eventType
      latitude
      longitude
      speed
      heading
      eventAt
      acknowledged
      acknowledgedAt
      createdAt
    }
  }
`;

const CREATE_GEOFENCE = gql`
  mutation CreateGeofence(
    $name: String!
    $description: String
    $fenceType: String!
    $centerLat: Float
    $centerLon: Float
    $radiusNm: Float
    $polygonCoords: JSON
    $vesselIds: [String!]!
    $alertOnEntry: Boolean
    $alertOnExit: Boolean
    $alertOnDwell: Boolean
    $dwellThresholdHrs: Float
  ) {
    createGeofence(
      name: $name
      description: $description
      fenceType: $fenceType
      centerLat: $centerLat
      centerLon: $centerLon
      radiusNm: $radiusNm
      polygonCoords: $polygonCoords
      vesselIds: $vesselIds
      alertOnEntry: $alertOnEntry
      alertOnExit: $alertOnExit
      alertOnDwell: $alertOnDwell
      dwellThresholdHrs: $dwellThresholdHrs
    ) {
      id
      name
    }
  }
`;

const ACKNOWLEDGE_ALERT = gql`
  mutation AcknowledgeGeofenceAlert($id: String!) {
    acknowledgeGeofenceAlert(id: $id) {
      id
      acknowledged
      acknowledgedAt
    }
  }
`;

export default function GeofencingPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    description: '',
    fenceType: 'circle',
    centerLat: 19.0,
    centerLon: 72.8,
    radiusNm: 50,
    vesselIds: '',
    alertOnEntry: true,
    alertOnExit: true,
    alertOnDwell: false,
    dwellThresholdHrs: 24,
  });

  const { data: geofencesData, loading: geofencesLoading, refetch: refetchGeofences } = useQuery(GEOFENCES_QUERY, {
    variables: { active: true },
  });

  const { data: alertsData, loading: alertsLoading, refetch: refetchAlerts } = useQuery(GEOFENCE_ALERTS_QUERY, {
    variables: { acknowledged: false, limit: 50 },
  });

  const [createGeofence, { loading: creating }] = useMutation(CREATE_GEOFENCE, {
    onCompleted: () => {
      alert('Geofence created successfully!');
      setShowCreateForm(false);
      setNewGeofence({
        name: '',
        description: '',
        fenceType: 'circle',
        centerLat: 19.0,
        centerLon: 72.8,
        radiusNm: 50,
        vesselIds: '',
        alertOnEntry: true,
        alertOnExit: true,
        alertOnDwell: false,
        dwellThresholdHrs: 24,
      });
      refetchGeofences();
    },
    onError: (error) => {
      alert(`Error creating geofence: ${error.message}`);
    },
  });

  const [acknowledgeAlert] = useMutation(ACKNOWLEDGE_ALERT, {
    onCompleted: () => {
      refetchAlerts();
    },
  });

  const handleCreateGeofence = (e: React.FormEvent) => {
    e.preventDefault();

    const vesselIdsList = newGeofence.vesselIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (vesselIdsList.length === 0) {
      alert('Please enter at least one vessel ID');
      return;
    }

    createGeofence({
      variables: {
        name: newGeofence.name,
        description: newGeofence.description,
        fenceType: newGeofence.fenceType,
        centerLat: newGeofence.centerLat,
        centerLon: newGeofence.centerLon,
        radiusNm: newGeofence.radiusNm,
        vesselIds: vesselIdsList,
        alertOnEntry: newGeofence.alertOnEntry,
        alertOnExit: newGeofence.alertOnExit,
        alertOnDwell: newGeofence.alertOnDwell,
        dwellThresholdHrs: newGeofence.dwellThresholdHrs,
      },
    });
  };

  const geofences = geofencesData?.geofences || [];
  const alerts = alertsData?.geofenceAlerts || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🚨 Geofencing & Alerts</h1>
          <p className="text-gray-600">Define zones on map and monitor vessel movements</p>
        </div>

        {/* Create Geofence Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            {showCreateForm ? '✕ Cancel' : '+ Create Geofence'}
          </button>
        </div>

        {/* Create Geofence Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Create New Geofence</h2>
            <form onSubmit={handleCreateGeofence} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={newGeofence.name}
                    onChange={(e) => setNewGeofence({ ...newGeofence, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mumbai Port Zone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={newGeofence.description}
                    onChange={(e) => setNewGeofence({ ...newGeofence, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Center Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newGeofence.centerLat}
                    onChange={(e) => setNewGeofence({ ...newGeofence, centerLat: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Center Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newGeofence.centerLon}
                    onChange={(e) => setNewGeofence({ ...newGeofence, centerLon: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Radius (Nautical Miles)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newGeofence.radiusNm}
                    onChange={(e) => setNewGeofence({ ...newGeofence, radiusNm: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vessel IDs * (comma-separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={newGeofence.vesselIds}
                    onChange={(e) => setNewGeofence({ ...newGeofence, vesselIds: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 477995900, 564873000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newGeofence.alertOnEntry}
                    onChange={(e) => setNewGeofence({ ...newGeofence, alertOnEntry: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Alert on Entry</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newGeofence.alertOnExit}
                    onChange={(e) => setNewGeofence({ ...newGeofence, alertOnExit: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Alert on Exit</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newGeofence.alertOnDwell}
                    onChange={(e) => setNewGeofence({ ...newGeofence, alertOnDwell: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Alert on Dwell</span>
                  {newGeofence.alertOnDwell && (
                    <input
                      type="number"
                      step="0.1"
                      value={newGeofence.dwellThresholdHrs}
                      onChange={(e) => setNewGeofence({ ...newGeofence, dwellThresholdHrs: parseFloat(e.target.value) })}
                      className="ml-2 px-2 py-1 border border-gray-300 rounded w-20"
                      placeholder="Hours"
                    />
                  )}
                  {newGeofence.alertOnDwell && <span className="text-sm text-gray-600">hours</span>}
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
                >
                  {creating ? 'Creating...' : 'Create Geofence'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Geofence Map</h2>
            <div style={{ height: '500px' }}>
              <MapContainer
                center={[19.0, 72.8]}
                zoom={6}
                style={{ height: '100%', width: '100%', borderRadius: '8px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Render geofences */}
                {geofences.map((geofence: any) =>
                  geofence.fenceType === 'circle' ? (
                    <Circle
                      key={geofence.id}
                      center={[geofence.centerLat, geofence.centerLon]}
                      radius={geofence.radiusNm * 1852} // Convert nm to meters
                      pathOptions={{
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.2,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <div className="font-bold text-blue-600">{geofence.name}</div>
                          {geofence.description && (
                            <div className="text-sm text-gray-600 mt-1">{geofence.description}</div>
                          )}
                          <div className="text-sm text-gray-600 mt-1">Radius: {geofence.radiusNm} nm</div>
                          <div className="text-sm text-gray-600">Monitoring {geofence.vesselIds.length} vessels</div>
                        </div>
                      </Popup>
                    </Circle>
                  ) : (
                    <Polygon
                      key={geofence.id}
                      positions={geofence.polygonCoords.map((c: any) => [c.lat, c.lon])}
                      pathOptions={{
                        color: '#8b5cf6',
                        fillColor: '#8b5cf6',
                        fillOpacity: 0.2,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <div className="font-bold text-purple-600">{geofence.name}</div>
                          {geofence.description && (
                            <div className="text-sm text-gray-600 mt-1">{geofence.description}</div>
                          )}
                          <div className="text-sm text-gray-600 mt-1">Monitoring {geofence.vesselIds.length} vessels</div>
                        </div>
                      </Popup>
                    </Polygon>
                  )
                )}

                {/* Render alert locations */}
                {alerts.map((alert: any) => (
                  <Marker key={alert.id} position={[alert.latitude, alert.longitude]}>
                    <Popup>
                      <div className="p-2">
                        <div className="font-bold text-red-600">{alert.eventType.toUpperCase()}</div>
                        <div className="text-sm text-gray-600 mt-1">Vessel: {alert.vesselId}</div>
                        <div className="text-sm text-gray-600">{new Date(alert.eventAt).toLocaleString()}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Alerts List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Recent Alerts</h2>
            {alertsLoading ? (
              <div className="text-center py-8 text-gray-600">Loading alerts...</div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-600">No unacknowledged alerts</div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {alerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className={`border-l-4 pl-4 py-3 ${
                      alert.eventType === 'entry'
                        ? 'border-green-500 bg-green-50'
                        : alert.eventType === 'exit'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-red-500 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {alert.eventType === 'entry' ? '🟢 Entry' :
                           alert.eventType === 'exit' ? '🟠 Exit' :
                           '🔴 Dwell'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Vessel: {alert.vesselId}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(alert.eventAt).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          Position: {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                        </div>
                      </div>
                      <button
                        onClick={() => acknowledgeAlert({ variables: { id: alert.id } })}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Geofences List */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Active Geofences</h2>
          {geofencesLoading ? (
            <div className="text-center py-8 text-gray-600">Loading geofences...</div>
          ) : geofences.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No active geofences</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {geofences.map((geofence: any) => (
                <div key={geofence.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-bold text-gray-900 mb-2">{geofence.name}</div>
                  {geofence.description && (
                    <div className="text-sm text-gray-600 mb-2">{geofence.description}</div>
                  )}
                  <div className="text-sm text-gray-600">
                    Type: {geofence.fenceType === 'circle' ? '⭕ Circle' : '⬟ Polygon'}
                  </div>
                  {geofence.fenceType === 'circle' && (
                    <div className="text-sm text-gray-600">Radius: {geofence.radiusNm} nm</div>
                  )}
                  <div className="text-sm text-gray-600">Vessels: {geofence.vesselIds.length}</div>
                  <div className="text-sm text-gray-600 mt-2">
                    {geofence.alertOnEntry && '✓ Entry '}
                    {geofence.alertOnExit && '✓ Exit '}
                    {geofence.alertOnDwell && `✓ Dwell (${geofence.dwellThresholdHrs}h)`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
