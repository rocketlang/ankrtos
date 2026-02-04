/**
 * Port Congestion Monitoring Dashboard
 * Real-time congestion status, vessel tracking, and alerts
 */

import React, { useState } from 'react'
import { useQuery, gql, useMutation } from '@apollo/client'
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const GET_CONGESTION_STATUS = gql`
  query GetCongestionStatus($portId: String!) {
    portCongestionStatus(portId: $portId) {
      id
      timestamp
      vesselCount
      anchoredCount
      mooredCount
      avgWaitTimeHours
      maxWaitTimeHours
      congestionLevel
      capacityPercent
      trend
      zone {
        zoneName
        zoneType
      }
    }
  }
`

const GET_ACTIVE_DETECTIONS = gql`
  query GetActiveDetections($portId: String!) {
    activeCongestionDetections(portId: $portId) {
      id
      vessel {
        name
        imo
        type
      }
      latitude
      longitude
      arrivalTime
      navigationStatus
      congestionLevel
      waitTimeHours
      zone {
        zoneName
      }
    }
  }
`

const GET_ALERTS = gql`
  query GetAlerts($portId: String) {
    portCongestionAlerts(portId: $portId, status: "ACTIVE") {
      id
      alertType
      severity
      title
      message
      triggeredAt
      port {
        name
      }
      zone {
        zoneName
      }
    }
  }
`

const ACKNOWLEDGE_ALERT = gql`
  mutation AcknowledgeAlert($alertId: String!, $userId: String!) {
    acknowledgePortCongestionAlert(alertId: $alertId, userId: $userId) {
      id
      status
    }
  }
`

// Major ports for dropdown
const MAJOR_PORTS = [
  { id: 'port-sgsin', name: 'Singapore', unlocode: 'SGSIN', center: [1.2897, 103.8501] },
  { id: 'port-inmun', name: 'Mumbai', unlocode: 'INMUN', center: [18.9220, 72.8347] },
  { id: 'port-innsa', name: 'Nhava Sheva (JNPT)', unlocode: 'INNSA', center: [18.9480, 72.9508] },
  { id: 'port-cnsha', name: 'Shanghai', unlocode: 'CNSHA', center: [31.2304, 121.4737] },
  { id: 'port-nlrtm', name: 'Rotterdam', unlocode: 'NLRTM', center: [51.9244, 4.4777] },
  { id: 'port-aejea', name: 'Jebel Ali (Dubai)', unlocode: 'AEJEA', center: [25.0118, 55.1136] },
]

export default function PortCongestionDashboard() {
  const [selectedPortId, setSelectedPortId] = useState(MAJOR_PORTS[0].id)

  const selectedPort = MAJOR_PORTS.find((p) => p.id === selectedPortId)!

  const { data: statusData, loading: statusLoading } = useQuery(GET_CONGESTION_STATUS, {
    variables: { portId: selectedPortId },
    pollInterval: 60000, // Refresh every minute
  })

  const { data: detectionsData } = useQuery(GET_ACTIVE_DETECTIONS, {
    variables: { portId: selectedPortId },
    pollInterval: 30000,
  })

  const { data: alertsData } = useQuery(GET_ALERTS, {
    variables: { portId: selectedPortId },
    pollInterval: 30000,
  })

  const [acknowledgeAlert] = useMutation(ACKNOWLEDGE_ALERT)

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return '#EF4444' // red-500
      case 'HIGH':
        return '#F59E0B' // amber-500
      case 'MODERATE':
        return '#FCD34D' // amber-300
      default:
        return '#10B981' // green-500
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 border-red-500 text-red-900'
      case 'WARNING':
        return 'bg-amber-100 border-amber-500 text-amber-900'
      default:
        return 'bg-blue-100 border-blue-500 text-blue-900'
    }
  }

  const status = statusData?.portCongestionStatus || []
  const detections = detectionsData?.activeCongestionDetections || []
  const alerts = alertsData?.portCongestionAlerts || []

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading congestion data...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Port Congestion Monitor</h1>
          <p className="text-gray-600 mt-1">Real-time vessel tracking and congestion analysis</p>
        </div>
        <select
          value={selectedPortId}
          onChange={(e) => setSelectedPortId(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {MAJOR_PORTS.map((port) => (
            <option key={port.id} value={port.id}>
              {port.name} ({port.unlocode})
            </option>
          ))}
        </select>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {alerts.length} active congestion alert{alerts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {status.map((zone: any) => (
          <div key={zone.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="text-sm font-medium text-gray-600">{zone.zone?.zoneName}</div>
            <div className="mt-3 flex items-baseline">
              <div className="text-4xl font-bold text-gray-900">{zone.vesselCount}</div>
              <div className="ml-2 text-sm text-gray-500">vessels</div>
            </div>
            <div className="mt-3">
              <span
                className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                style={{
                  backgroundColor: getCongestionColor(zone.congestionLevel) + '20',
                  color: getCongestionColor(zone.congestionLevel),
                }}
              >
                {zone.congestionLevel}
              </span>
            </div>
            <div className="mt-4 space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Avg wait:</span>
                <span className="font-medium">{zone.avgWaitTimeHours?.toFixed(1) || '0'} hrs</span>
              </div>
              <div className="flex justify-between">
                <span>Capacity:</span>
                <span className="font-medium">{zone.capacityPercent?.toFixed(0) || '0'}%</span>
              </div>
              <div className="flex justify-between">
                <span>Trend:</span>
                <span className="font-medium capitalize">{zone.trend?.toLowerCase()}</span>
              </div>
            </div>
          </div>
        ))}

        {status.length === 0 && (
          <div className="col-span-4 bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No congestion data available for this port yet.
          </div>
        )}
      </div>

      {/* Live Map */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Live Vessel Positions</h2>
        <div style={{ height: '500px' }} className="rounded-lg overflow-hidden">
          <MapContainer
            center={selectedPort.center as [number, number]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
          >
            {/* Base map layer */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* OpenSeaMap nautical overlay - anchorages, navigation marks, depth contours */}
            <TileLayer
              url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://www.openseamap.org">OpenSeaMap</a>'
            />

            {/* Plot active detections */}
            {detections.map((detection: any) => (
              <Circle
                key={detection.id}
                center={[detection.latitude, detection.longitude]}
                radius={500}
                pathOptions={{
                  color: getCongestionColor(detection.congestionLevel),
                  fillColor: getCongestionColor(detection.congestionLevel),
                  fillOpacity: 0.5,
                }}
              >
                <Popup>
                  <div className="p-2">
                    <strong className="text-lg">{detection.vessel.name}</strong>
                    <br />
                    <span className="text-gray-600">IMO: {detection.vessel.imo}</span>
                    <br />
                    <span className="text-gray-600">Type: {detection.vessel.type}</span>
                    <br />
                    <span className="text-gray-600">Zone: {detection.zone?.zoneName}</span>
                    <br />
                    <span className="text-gray-600">Status: {detection.navigationStatus}</span>
                    <br />
                    <span className="text-gray-600">
                      Arrived: {new Date(detection.arrivalTime).toLocaleString()}
                    </span>
                  </div>
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Waiting Vessels Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Vessels Currently Waiting</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vessel Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IMO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arrival
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wait Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {detections.map((detection: any) => {
                const waitHours =
                  (Date.now() - new Date(detection.arrivalTime).getTime()) / (1000 * 60 * 60)
                return (
                  <tr key={detection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {detection.vessel.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detection.vessel.imo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detection.vessel.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detection.zone?.zoneName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(detection.arrivalTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {waitHours.toFixed(1)} hrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-2 py-1 text-xs font-semibold rounded-full"
                        style={{
                          backgroundColor: getCongestionColor(detection.congestionLevel) + '20',
                          color: getCongestionColor(detection.congestionLevel),
                        }}
                      >
                        {detection.navigationStatus}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {detections.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No vessels currently waiting at this port.
            </div>
          )}
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Active Alerts</h2>
          </div>
          <div className="p-6 space-y-4">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`border-l-4 p-4 rounded ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-lg">{alert.title}</div>
                    <div className="text-sm mt-1">{alert.message}</div>
                    <div className="text-xs mt-2 opacity-75">
                      {new Date(alert.triggeredAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      acknowledgeAlert({
                        variables: { alertId: alert.id, userId: 'current-user' },
                        refetchQueries: ['GetAlerts'],
                      })
                    }
                    className="ml-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
