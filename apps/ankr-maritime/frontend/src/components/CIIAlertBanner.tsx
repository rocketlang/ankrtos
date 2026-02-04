/**
 * CII Alert Banner - Display CII downgrade warnings
 *
 * Shows critical/high severity CII downgrades at the top of dashboard
 */

import { useQuery } from '@apollo/client';
import { gql } from '../__generated__/gql';
import { AlertTriangle, TrendingDown, X } from 'lucide-react';
import { useState } from 'react';

const CII_DOWNGRADE_STATS = gql(`
  query CIIDowngradeStats {
    ciiDowngradeStats {
      totalVessels
      vesselsWithDowngrade
      criticalDowngrades
      downgradeRate
      ratingDistribution
    }
  }
`);

const GET_ACTIVE_ALERTS = gql(`
  query GetActiveAlerts {
    alerts(
      where: { type: "cii_downgrade", status: "active" }
      orderBy: { createdAt: DESC }
      take: 5
    ) {
      id
      severity
      title
      message
      metadata
      createdAt
    }
  }
`);

export function CIIAlertBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data: statsData } = useQuery(CII_DOWNGRADE_STATS);
  const { data: alertsData } = useQuery(GET_ACTIVE_ALERTS);

  if (dismissed) return null;

  const stats = statsData?.ciiDowngradeStats;
  const alerts = alertsData?.alerts || [];

  // Only show if there are downgrades
  if (!stats || stats.vesselsWithDowngrade === 0) return null;

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');

  if (criticalAlerts.length === 0) return null;

  return (
    <div className="mb-6 relative">
      {/* Critical/High Severity Banner */}
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-red-900">
                  CII Rating Downgrades Detected
                </h3>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  {stats.vesselsWithDowngrade} Vessel{stats.vesselsWithDowngrade > 1 ? 's' : ''}
                </span>
                {stats.criticalDowngrades > 0 && (
                  <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                    {stats.criticalDowngrades} Critical
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {criticalAlerts.slice(0, 3).map((alert) => {
                  const metadata = alert.metadata as any;
                  return (
                    <div
                      key={alert.id}
                      className="bg-white rounded p-3 border border-red-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-gray-900">
                              {metadata?.vesselName || 'Unknown Vessel'}
                            </span>
                            <span className="text-sm text-gray-500">
                              IMO: {metadata?.vesselId?.substring(0, 7) || 'N/A'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-600">Rating:</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 font-bold rounded">
                              {metadata?.previousRating || '-'}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="px-2 py-1 bg-red-100 text-red-800 font-bold rounded">
                              {metadata?.currentRating || '-'}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({metadata?.year || new Date().getFullYear()})
                            </span>
                          </div>

                          {metadata?.currentRating === 'E' && (
                            <div className="mt-2 text-xs text-red-700 font-medium">
                              ⚠️ Rating E may face port restrictions and additional costs
                            </div>
                          )}
                        </div>

                        <a
                          href={`/vessels/${metadata?.vesselId}`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details →
                        </a>
                      </div>
                    </div>
                  );
                })}

                {criticalAlerts.length > 3 && (
                  <a
                    href="/compliance/cii-dashboard"
                    className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium pt-2"
                  >
                    View all {criticalAlerts.length} CII alerts →
                  </a>
                )}
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Fleet Status:</span>{' '}
                  {stats.totalVessels} vessels monitored
                </div>
                <div>
                  <span className="font-medium">Downgrade Rate:</span>{' '}
                  <span className={stats.downgradeRate > 20 ? 'text-red-600 font-bold' : ''}>
                    {stats.downgradeRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 text-red-400 hover:text-red-600 ml-4"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Rating Distribution Mini-Chart */}
      <div className="mt-3 bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
        <div className="text-xs font-medium text-gray-700 mb-2">Fleet CII Rating Distribution</div>
        <div className="flex gap-2">
          {Object.entries(stats.ratingDistribution || {}).map(([rating, count]) => (
            <div
              key={rating}
              className="flex-1 text-center"
            >
              <div
                className={`rounded-t px-2 py-1 font-bold text-sm ${
                  rating === 'A' ? 'bg-green-500 text-white' :
                  rating === 'B' ? 'bg-blue-500 text-white' :
                  rating === 'C' ? 'bg-yellow-500 text-white' :
                  rating === 'D' ? 'bg-orange-500 text-white' :
                  'bg-red-500 text-white'
                }`}
                style={{ height: count ? `${Math.max(20, (count as number) * 4)}px` : '20px' }}
              >
                {count || 0}
              </div>
              <div className="text-xs font-medium text-gray-600 mt-1">{rating}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
