/**
 * VOYAGE COST WIDGET
 * Display voyage cost breakdown with bunker, port, and canal fees
 */

import { useQuery, gql } from '@apollo/client';

const VOYAGE_COST_QUERY = gql`
  query EstimateVoyageCost(
    $mmsi: String!
    $daysBack: Int
    $bunkerPriceIfo: Float
    $bunkerPriceMgo: Float
  ) {
    estimateVoyageCost(
      mmsi: $mmsi
      daysBack: $daysBack
      bunkerPriceIfo: $bunkerPriceIfo
      bunkerPriceMgo: $bunkerPriceMgo
    ) {
      journeyId
      vesselMmsi
      vesselName
      vesselType
      vesselDwt
      totalDistanceNm
      totalDurationHrs
      seaDaysAtSpeed
      portDays
      bunkerCostUsd
      portCostsUsd
      canalFeesUsd
      totalCostsUsd
      costPerNm
      costPerDay
      breakdown {
        bunkerSeaIfo
        bunkerPortIfo
        bunkerMgo
        ports
        canals
      }
    }
  }
`;

interface VoyageCostWidgetProps {
  mmsi: string;
  daysBack?: number;
  bunkerPriceIfo?: number;
  bunkerPriceMgo?: number;
}

export default function VoyageCostWidget({
  mmsi,
  daysBack = 30,
  bunkerPriceIfo = 450,
  bunkerPriceMgo = 850,
}: VoyageCostWidgetProps) {
  const { data, loading, error } = useQuery(VOYAGE_COST_QUERY, {
    variables: { mmsi, daysBack, bunkerPriceIfo, bunkerPriceMgo },
    skip: !mmsi,
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-48"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.estimateVoyageCost) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">💰 Voyage Cost Estimate</h3>
        <p className="text-gray-600">No cost data available for this vessel.</p>
      </div>
    );
  }

  const cost = data.estimateVoyageCost;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">💰 Voyage Cost Estimate</h3>

      {/* Vessel Info */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          {cost.vesselName || cost.vesselMmsi} • {cost.vesselType}
          {cost.vesselDwt && <span> • {cost.vesselDwt.toLocaleString()} DWT</span>}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Last {daysBack} days • IFO ${bunkerPriceIfo}/MT • MGO ${bunkerPriceMgo}/MT
        </p>
      </div>

      {/* Total Cost */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
        <div className="text-sm text-gray-600 mb-1">Total Estimated Cost</div>
        <div className="text-3xl font-bold text-blue-900">
          ${cost.totalCostsUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">⛽</span>
            <div>
              <div className="font-medium text-gray-900">Bunker Fuel</div>
              <div className="text-xs text-gray-500">
                Sea IFO: ${cost.breakdown.bunkerSeaIfo.toLocaleString(undefined, { maximumFractionDigits: 0 })} •
                Port IFO: ${cost.breakdown.bunkerPortIfo.toLocaleString(undefined, { maximumFractionDigits: 0 })} •
                MGO: ${cost.breakdown.bunkerMgo.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              ${cost.bunkerCostUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-500">
              {((cost.bunkerCostUsd / cost.totalCostsUsd) * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚓</span>
            <div>
              <div className="font-medium text-gray-900">Port Charges</div>
              <div className="text-xs text-gray-500">
                Dues, pilotage, towage, berth hire
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              ${cost.portCostsUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-500">
              {((cost.portCostsUsd / cost.totalCostsUsd) * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {cost.canalFeesUsd > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌊</span>
              <div>
                <div className="font-medium text-gray-900">Canal Fees</div>
                <div className="text-xs text-gray-500">
                  Suez / Panama transit fees
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                ${cost.canalFeesUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-gray-500">
                {((cost.canalFeesUsd / cost.totalCostsUsd) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Journey Statistics */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {cost.totalDistanceNm.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-gray-600">Nautical Miles</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {cost.seaDaysAtSpeed.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600">Days at Sea</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {cost.portDays.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600">Days in Port</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {(cost.totalDurationHrs / 24).toFixed(1)}
          </div>
          <div className="text-xs text-gray-600">Total Days</div>
        </div>
      </div>

      {/* Cost Metrics */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded p-3">
          <div className="text-xs text-gray-600 mb-1">Cost per Mile</div>
          <div className="text-lg font-semibold text-gray-900">
            ${cost.costPerNm.toFixed(2)}
          </div>
        </div>

        <div className="bg-gray-50 rounded p-3">
          <div className="text-xs text-gray-600 mb-1">Cost per Day</div>
          <div className="text-lg font-semibold text-gray-900">
            ${cost.costPerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown (Collapsible) */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium">
          View Detailed Breakdown
        </summary>
        <div className="mt-3 bg-gray-50 rounded p-4">
          <pre className="text-xs text-gray-700 overflow-auto">
            {JSON.stringify(
              {
                bunker: {
                  seaIfo: `$${cost.breakdown.bunkerSeaIfo.toFixed(2)}`,
                  portIfo: `$${cost.breakdown.bunkerPortIfo.toFixed(2)}`,
                  mgo: `$${cost.breakdown.bunkerMgo.toFixed(2)}`,
                  total: `$${cost.bunkerCostUsd.toFixed(2)}`,
                },
                ports: `$${cost.breakdown.ports.toFixed(2)}`,
                canals: `$${cost.breakdown.canals.toFixed(2)}`,
                total: `$${cost.totalCostsUsd.toFixed(2)}`,
              },
              null,
              2
            )}
          </pre>
        </div>
      </details>

      {/* Disclaimer */}
      <p className="mt-4 text-xs text-gray-500 italic">
        * Estimates based on vessel type averages and typical port charges. Actual costs may vary.
      </p>
    </div>
  );
}
