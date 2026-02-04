/**
 * Cost Optimization Dashboard
 * Phase 6: DA Desk & Port Agency
 * Business Value: $100-150K/year savings
 */

import { useQuery, gql } from '@apollo/client';
import { useState } from 'react';

// ========================================
// GRAPHQL QUERIES
// ========================================

const VOYAGE_OPTIMIZATIONS = gql`
  query VoyageOptimizations($voyageId: String!) {
    voyageOptimizations(voyageId: $voyageId) {
      voyageId
      totalCurrentCost
      totalOptimizedCost
      totalSavings
      totalSavingsPercent
      implementedRecommendations
      actualSavingsAchieved
      recommendations {
        type
        title
        description
        currentCost
        optimizedCost
        savings
        savingsPercent
        confidence
        priority
        implementationSteps
        risks
        estimatedImplementationTime
        details
      }
    }
  }
`;

const PORT_OPTIMIZATIONS = gql`
  query PortOptimizations($portId: String!) {
    portOptimizations(portId: $portId) {
      portId
      totalCurrentCost
      totalOptimizedCost
      totalSavings
      totalSavingsPercent
      implementedRecommendations
      actualSavingsAchieved
      recommendations {
        type
        title
        description
        currentCost
        optimizedCost
        savings
        savingsPercent
        confidence
        priority
        implementationSteps
        risks
        estimatedImplementationTime
        details
      }
    }
  }
`;

const GLOBAL_OPTIMIZATIONS = gql`
  query GlobalOptimizations {
    globalOptimizationSummary {
      totalVoyages
      totalPorts
      totalCurrentCost
      totalOptimizedCost
      totalPotentialSavings
      totalSavingsPercent
      implementedRecommendations
      actualSavingsAchieved
      topRecommendations {
        type
        title
        description
        currentCost
        optimizedCost
        savings
        savingsPercent
        confidence
        priority
        implementationSteps
        risks
        estimatedImplementationTime
        details
      }
    }
  }
`;

// ========================================
// TYPES
// ========================================

interface Recommendation {
  type: string;
  title: string;
  description: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercent: number;
  confidence: number;
  priority: string;
  implementationSteps: string[];
  risks: string[];
  estimatedImplementationTime: string;
  details: any;
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-800 text-gray-400',
  medium: 'bg-blue-900/50 text-blue-400',
  high: 'bg-orange-900/50 text-orange-400',
  critical: 'bg-red-900/50 text-red-400',
};

const typeIcons: Record<string, string> = {
  alternative_port: '🏝️',
  alternative_agent: '🤝',
  bundled_services: '📦',
  timing_optimization: '⏰',
  tariff_optimization: '💰',
  service_reduction: '✂️',
  negotiation_opportunity: '💬',
  other: '💡',
};

// ========================================
// COMPONENT
// ========================================

export function CostOptimization() {
  const [mode, setMode] = useState<'global' | 'voyage' | 'port'>('global');
  const [voyageId, setVoyageId] = useState('');
  const [portId, setPortId] = useState('');
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  const { data: globalData, loading: globalLoading } = useQuery(GLOBAL_OPTIMIZATIONS, {
    skip: mode !== 'global',
  });

  const { data: voyageData, loading: voyageLoading } = useQuery(VOYAGE_OPTIMIZATIONS, {
    variables: { voyageId },
    skip: mode !== 'voyage' || !voyageId,
  });

  const { data: portData, loading: portLoading } = useQuery(PORT_OPTIMIZATIONS, {
    variables: { portId },
    skip: mode !== 'port' || !portId,
  });

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const report = mode === 'global'
    ? globalData?.globalOptimizationSummary
    : mode === 'voyage'
    ? voyageData?.voyageOptimizations
    : portData?.portOptimizations;

  const recommendations = report?.recommendations || report?.topRecommendations || [];
  const loading = globalLoading || voyageLoading || portLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          Cost Optimization Engine
        </h1>
        <p className="text-gray-400">AI-powered cost reduction recommendations • $100-150K/year savings</p>
      </div>

      {/* Mode Selector */}
      <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 mb-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setMode('global')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              mode === 'global'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-950/50 text-gray-400 hover:bg-blue-900/50'
            }`}
          >
            🌍 Global Overview
          </button>
          <button
            onClick={() => setMode('voyage')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              mode === 'voyage'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-950/50 text-gray-400 hover:bg-blue-900/50'
            }`}
          >
            🚢 Voyage Analysis
          </button>
          <button
            onClick={() => setMode('port')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              mode === 'port'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-950/50 text-gray-400 hover:bg-blue-900/50'
            }`}
          >
            ⚓ Port Analysis
          </button>
        </div>

        {mode === 'voyage' && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Voyage ID</label>
            <input
              type="text"
              value={voyageId}
              onChange={(e) => setVoyageId(e.target.value)}
              placeholder="Enter voyage ID..."
              className="w-full bg-blue-950/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white"
            />
          </div>
        )}

        {mode === 'port' && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Port ID</label>
            <input
              type="text"
              value={portId}
              onChange={(e) => setPortId(e.target.value)}
              placeholder="Enter port ID..."
              className="w-full bg-blue-950/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white"
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Current Cost</div>
            <div className="text-3xl font-bold text-white">{fmt(report.totalCurrentCost)}</div>
            {mode === 'global' && (
              <div className="text-xs text-gray-500 mt-1">
                {report.totalVoyages} voyages • {report.totalPorts} ports
              </div>
            )}
          </div>

          <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Optimized Cost</div>
            <div className="text-3xl font-bold text-blue-400">{fmt(report.totalOptimizedCost)}</div>
            <div className="text-xs text-gray-500 mt-1">After implementing recommendations</div>
          </div>

          <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Potential Savings</div>
            <div className="text-3xl font-bold text-green-400">
              {fmt(report.totalSavings || report.totalPotentialSavings)}
            </div>
            <div className="text-xs text-green-500 mt-1">
              {(report.totalSavingsPercent || 0).toFixed(1)}% reduction
            </div>
          </div>

          <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Actual Savings</div>
            <div className="text-3xl font-bold text-green-400">{fmt(report.actualSavingsAchieved)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {report.implementedRecommendations} recommendations implemented
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recommendation List */}
        <div className="lg:col-span-2 bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            Cost Optimization Recommendations ({recommendations.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading recommendations...</div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {mode === 'voyage' && !voyageId
                ? 'Enter a voyage ID to analyze'
                : mode === 'port' && !portId
                ? 'Enter a port ID to analyze'
                : 'No optimization opportunities found'}
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec: Recommendation, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setSelectedRec(rec)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedRec === rec
                      ? 'bg-blue-800/50 border-blue-400'
                      : 'bg-blue-950/30 border-blue-500/20 hover:border-blue-400/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{typeIcons[rec.type] || '💡'}</span>
                      <div>
                        <div className="text-white font-semibold">{rec.title}</div>
                        <div className="text-sm text-gray-400 mt-1">{rec.description}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-4">
                      <span className={`px-2 py-1 rounded text-xs ${priorityColors[rec.priority]}`}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mt-3 pt-3 border-t border-blue-500/30">
                    <div>
                      <span className="text-gray-400">Current:</span>
                      <span className="text-white ml-2">{fmt(rec.currentCost)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Optimized:</span>
                      <span className="text-blue-400 ml-2">{fmt(rec.optimizedCost)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Savings:</span>
                      <span className="text-green-400 ml-2 font-semibold">
                        {fmt(rec.savings)} ({rec.savingsPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <div className="text-gray-500">
                      Confidence: <span className="text-blue-400">{(rec.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="text-gray-500">
                      Implementation: <span className="text-gray-400">{rec.estimatedImplementationTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recommendation Detail */}
        <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
          {!selectedRec ? (
            <div className="text-center py-12 text-gray-400">
              Select a recommendation to view implementation details
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl">{typeIcons[selectedRec.type] || '💡'}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedRec.title}</h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${priorityColors[selectedRec.priority]}`}>
                    {selectedRec.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>

              {/* Savings Summary */}
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
                <div className="text-sm text-green-400 font-semibold mb-2">💰 Potential Savings</div>
                <div className="text-3xl font-bold text-green-400">{fmt(selectedRec.savings)}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {selectedRec.savingsPercent.toFixed(1)}% reduction from {fmt(selectedRec.currentCost)}
                </div>
              </div>

              {/* Implementation Steps */}
              <div className="mb-4">
                <div className="text-sm text-gray-400 font-semibold mb-2">📋 Implementation Steps</div>
                <ol className="space-y-2">
                  {selectedRec.implementationSteps.map((step, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-gray-300">
                      <span className="text-blue-400 font-semibold">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Risks */}
              {selectedRec.risks && selectedRec.risks.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-400 font-semibold mb-2">⚠️ Risks to Consider</div>
                  <ul className="space-y-1">
                    {selectedRec.risks.map((risk, idx) => (
                      <li key={idx} className="text-sm text-orange-300 flex gap-2">
                        <span>•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-950/50 rounded p-3">
                  <div className="text-xs text-gray-400">Confidence</div>
                  <div className="text-lg font-bold text-blue-400">
                    {(selectedRec.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-blue-950/50 rounded p-3">
                  <div className="text-xs text-gray-400">Est. Time</div>
                  <div className="text-lg font-bold text-white">
                    {selectedRec.estimatedImplementationTime}
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              {selectedRec.details && Object.keys(selectedRec.details).length > 0 && (
                <div className="bg-blue-950/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 font-semibold mb-2">📊 Additional Details</div>
                  <div className="space-y-1 text-sm">
                    {Object.entries(selectedRec.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-400">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-white">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg mt-4 transition-colors">
                ✓ Implement This Recommendation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
