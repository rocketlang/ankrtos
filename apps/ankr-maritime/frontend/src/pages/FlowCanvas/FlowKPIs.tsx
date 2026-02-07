/**
 * Flow Canvas - KPI Cards
 *
 * Clickable stat cards that show key metrics and navigate to details
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FlowData, FlowDefinition, FlowKPI } from '../../types/flow-canvas';

interface FlowKPIsProps {
  flowData: FlowData;
  flowDefinition: FlowDefinition;
}

/**
 * Flow KPIs Component
 */
export default function FlowKPIs({ flowData, flowDefinition }: FlowKPIsProps) {
  const navigate = useNavigate();

  const handleKPIClick = (kpi: FlowKPI) => {
    if (kpi.onClick) {
      navigate(kpi.onClick);
    }
  };

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {flowData.kpis.map((kpi, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleKPIClick(kpi)}
            className={`
              bg-white rounded-lg border-2 p-5 transition-all duration-200
              ${kpi.alert ? 'border-red-300 bg-red-50' : 'border-gray-200'}
              ${kpi.onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Label */}
                <p className="text-sm font-medium text-gray-600 mb-1">{kpi.label}</p>

                {/* Value */}
                <div className="flex items-baseline gap-2">
                  <p
                    className="text-3xl font-bold"
                    style={{ color: kpi.color || '#1f2937' }}
                  >
                    {kpi.value}
                  </p>

                  {/* Trend */}
                  {kpi.trend && kpi.trendPercent !== undefined && (
                    <div
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${
                          kpi.trend === 'up'
                            ? 'bg-green-100 text-green-700'
                            : kpi.trend === 'down'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      {kpi.trend === 'up' && '↑'}
                      {kpi.trend === 'down' && '↓'}
                      {kpi.trend === 'stable' && '→'}
                      <span>{kpi.trendPercent}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Icon */}
              {kpi.icon && (
                <div
                  className="text-3xl opacity-80"
                  style={{ color: kpi.color || '#6b7280' }}
                >
                  {kpi.icon}
                </div>
              )}
            </div>

            {/* Alert Badge */}
            {kpi.alert && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-600 font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span>Needs attention</span>
              </div>
            )}

            {/* Click hint */}
            {kpi.onClick && (
              <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                <span>Click to view details</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Last updated: {new Date(flowData.lastUpdated).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
