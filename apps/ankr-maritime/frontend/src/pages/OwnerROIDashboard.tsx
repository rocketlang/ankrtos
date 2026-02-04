/**
 * Owner ROI Dashboard
 * Complete ROI visibility for fleet owners with smart recommendations and analytics
 *
 * Purpose: Show owners the value they're getting from Mari8X
 */

import { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Ship,
  Zap,
  Target,
  Award,
} from 'lucide-react';

const OWNER_ROI_QUERY = gql`
  query OwnerROIDashboard {
    vessels {
      id
      name
      imo
      type
      dwt
    }

    voyages(status: "in_progress") {
      id
      voyageNumber
      vessel { name }
    }
  }
`;

export default function OwnerROIDashboard() {
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);

  const { data, loading } = useQuery(OWNER_ROI_QUERY, {
    pollInterval: 60000, // Refresh every minute
  });

  const vessels = data?.vessels || [];
  const selectedVesselData = vessels.find((v: any) => v.id === selectedVessel);

  // Mock ROI data (would come from backend analytics service)
  const roiData = {
    // Mari8X Savings
    portDocumentSavings: 26325,      // Per vessel per year
    noonReportSavings: 5925,         // Per vessel per year
    daOptimizationSavings: 15000,    // Per vessel per year
    routeOptimizationSavings: 35000, // Per vessel per year
    totalAnnualSavings: 82250,       // Per vessel per year

    // Mari8X Cost
    subscriptionCost: 24000,         // Premium tier per vessel per year

    // ROI Calculation
    netSavings: 58250,               // Savings - Cost
    roi: 243,                        // % return (58250/24000 * 100)

    // Fleet-wide (for 10 vessels)
    fleetSize: 10,
    fleetTotalSavings: 822500,
    fleetTotalCost: 240000,
    fleetNetSavings: 582500,
  };

  // Mock smart recommendations (would come from backend)
  const recommendations = [
    {
      id: '1',
      category: 'cost_savings',
      priority: 'high',
      title: 'Route Optimization: Save $3,500',
      description: 'Fleet collaborative routing suggests more efficient path',
      potentialSavings: 3500,
    },
    {
      id: '2',
      category: 'risk',
      priority: 'high',
      title: 'Severe Weather Alert',
      description: 'Storm detected ahead. Consider route deviation.',
      potentialSavings: 0,
    },
    {
      id: '3',
      category: 'efficiency',
      priority: 'medium',
      title: '3 DA Accounts Pending Approval',
      description: 'Review and approve to prevent delays',
      potentialSavings: 0,
    },
    {
      id: '4',
      category: 'cost_savings',
      priority: 'medium',
      title: 'Bunker Price Opportunity',
      description: 'Prices 8% below average at next port',
      potentialSavings: 8500,
    },
    {
      id: '5',
      category: 'compliance',
      priority: 'medium',
      title: 'Certificate Expiring in 22 Days',
      description: 'Schedule renewal to avoid issues',
      potentialSavings: 0,
    },
  ];

  // Performance metrics (mock - would come from analytics service)
  const performance = {
    utilizationRate: 84.5,
    avgOnTimePerformance: 92.3,
    fuelEfficiency: 156.2,
    profitMargin: 26.7,

    vsFleetAverage: {
      utilizationRate: +4.5,
      onTimePerformance: +4.3,
      fuelEfficiency: +6.2,
      profitMargin: +1.2,
    },
  };

  const totalPotentialSavings = recommendations.reduce(
    (sum, r) => sum + r.potentialSavings,
    0
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-8 h-8 text-green-400" />
          <h1 className="text-3xl font-bold">Owner ROI Dashboard</h1>
          <span className="px-3 py-1 bg-green-600 rounded text-sm font-semibold">
            Live Tracking
          </span>
        </div>
        <p className="text-gray-400">
          Real-time ROI visibility • Cost savings tracking • Performance analytics
        </p>
      </div>

      {/* ROI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Annual Savings */}
        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-lg p-6 border border-green-600/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h3 className="font-semibold text-green-400">Annual Savings</h3>
          </div>
          <p className="text-4xl font-bold text-white mb-1">
            ${roiData.totalAnnualSavings.toLocaleString()}
          </p>
          <p className="text-sm text-gray-300">Per vessel per year</p>
        </div>

        {/* Subscription Cost */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-6 h-6 text-blue-400" />
            <h3 className="font-semibold">Mari8X Cost</h3>
          </div>
          <p className="text-4xl font-bold mb-1">
            ${roiData.subscriptionCost.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400">Premium tier/year</p>
        </div>

        {/* Net Savings */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-6 h-6 text-yellow-400" />
            <h3 className="font-semibold">Net Savings</h3>
          </div>
          <p className="text-4xl font-bold text-yellow-400 mb-1">
            ${roiData.netSavings.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400">Profit from Mari8X</p>
        </div>

        {/* ROI Percentage */}
        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-lg p-6 border border-purple-600/30">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-6 h-6 text-purple-400" />
            <h3 className="font-semibold text-purple-400">ROI</h3>
          </div>
          <p className="text-4xl font-bold text-white mb-1">{roiData.roi}%</p>
          <p className="text-sm text-gray-300">Return on investment</p>
        </div>
      </div>

      {/* Fleet-Wide Impact */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 mb-6 border border-blue-600/30">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Ship className="w-6 h-6 text-blue-400" />
          Fleet-Wide Impact ({roiData.fleetSize} Vessels)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Annual Savings</p>
            <p className="text-3xl font-bold text-green-400">
              ${roiData.fleetTotalSavings.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">Total Mari8X Cost</p>
            <p className="text-3xl font-bold text-blue-400">
              ${roiData.fleetTotalCost.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">Fleet Net Savings</p>
            <p className="text-3xl font-bold text-yellow-400">
              ${roiData.fleetNetSavings.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Savings Breakdown */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">Savings Breakdown (Per Vessel)</h3>

        <div className="space-y-3">
          <SavingsBar
            label="Route Optimization"
            amount={roiData.routeOptimizationSavings}
            total={roiData.totalAnnualSavings}
            color="bg-blue-500"
          />
          <SavingsBar
            label="Port Document Automation"
            amount={roiData.portDocumentSavings}
            total={roiData.totalAnnualSavings}
            color="bg-green-500"
          />
          <SavingsBar
            label="DA Optimization"
            amount={roiData.daOptimizationSavings}
            total={roiData.totalAnnualSavings}
            color="bg-purple-500"
          />
          <SavingsBar
            label="Noon Report Automation"
            amount={roiData.noonReportSavings}
            total={roiData.totalAnnualSavings}
            color="bg-yellow-500"
          />
        </div>
      </div>

      {/* Smart Recommendations */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            Smart Recommendations
          </h3>
          <div className="text-sm text-gray-400">
            Potential additional savings: ${totalPotentialSavings.toLocaleString()}
          </div>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      </div>

      {/* Performance vs Fleet Average */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-400" />
          Performance vs Fleet Average
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <PerformanceMetric
            label="Utilization Rate"
            value={performance.utilizationRate}
            vsAverage={performance.vsFleetAverage.utilizationRate}
            unit="%"
          />
          <PerformanceMetric
            label="On-Time Performance"
            value={performance.avgOnTimePerformance}
            vsAverage={performance.vsFleetAverage.onTimePerformance}
            unit="%"
          />
          <PerformanceMetric
            label="Fuel Efficiency"
            value={performance.fuelEfficiency}
            vsAverage={performance.vsFleetAverage.fuelEfficiency}
            unit=" NM/MT"
          />
          <PerformanceMetric
            label="Profit Margin"
            value={performance.profitMargin}
            vsAverage={performance.vsFleetAverage.profitMargin}
            unit="%"
          />
        </div>
      </div>
    </div>
  );
}

// Savings Bar Component
function SavingsBar({
  label,
  amount,
  total,
  color,
}: {
  label: string;
  amount: number;
  total: number;
  color: string;
}) {
  const percentage = (amount / total) * 100;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-semibold">${amount.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {percentage.toFixed(1)}% of total savings
      </p>
    </div>
  );
}

// Recommendation Card Component
function RecommendationCard({ recommendation }: { recommendation: any }) {
  const categoryColors: Record<string, string> = {
    cost_savings: 'bg-green-600',
    risk: 'bg-red-600',
    efficiency: 'bg-blue-600',
    compliance: 'bg-yellow-600',
    maintenance: 'bg-purple-600',
  };

  const priorityIcons: Record<string, any> = {
    high: <AlertCircle className="w-5 h-5 text-red-400" />,
    medium: <AlertCircle className="w-5 h-5 text-yellow-400" />,
    low: <AlertCircle className="w-5 h-5 text-gray-400" />,
  };

  const categoryColor = categoryColors[recommendation.category] || 'bg-gray-600';

  return (
    <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600/50 transition-colors">
      <div className="flex items-start gap-4">
        <div>{priorityIcons[recommendation.priority]}</div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold">{recommendation.title}</h4>
              <p className="text-sm text-gray-400">{recommendation.description}</p>
            </div>

            {recommendation.potentialSavings > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-400">Potential Savings</p>
                <p className="text-lg font-bold text-green-400">
                  ${recommendation.potentialSavings.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${categoryColor}`}>
              {recommendation.category.replace('_', ' ')}
            </span>
            <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-800">
              {recommendation.priority} priority
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Performance Metric Component
function PerformanceMetric({
  label,
  value,
  vsAverage,
  unit,
}: {
  label: string;
  value: number;
  vsAverage: number;
  unit: string;
}) {
  const isPositive = vsAverage > 0;

  return (
    <div>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold mb-1">
        {value.toFixed(1)}
        {unit}
      </p>
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}
        {vsAverage.toFixed(1)}
        {unit} vs avg
      </div>
    </div>
  );
}
