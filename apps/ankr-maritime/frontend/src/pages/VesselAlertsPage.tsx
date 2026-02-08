/**
 * VESSEL ALERTS PAGE
 * Main page for viewing and managing vessel alerts
 */

import VesselAlerts from '../components/VesselAlerts';

export default function VesselAlertsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          ⚠️ Vessel Alerts
        </h1>
        <p className="text-gray-600 mt-2">
          Monitor vessel status changes, quality drops, and operational alerts
        </p>
      </div>

      <VesselAlerts showStats={true} limit={50} />
    </div>
  );
}
