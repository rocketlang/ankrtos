/**
 * Email Indicators Component
 * Real-time badge counters for unread, starred, and actionable emails
 */

import React from 'react';
import { Inbox, Star, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { gql, useQuery } from '@apollo/client';

const GET_INDICATORS = gql`
  query GetEmailIndicators {
    emailIndicators {
      total
      byFolder
      byUrgency
      starred
      requiresResponse
      requiresApproval
      overdue
    }
  }
`;

interface EmailIndicators {
  total: number;
  byFolder: Record<string, number>;
  byUrgency: Record<string, number>;
  starred: number;
  requiresResponse: number;
  requiresApproval: number;
  overdue: number;
}

interface IndicatorsProps {
  variant?: 'compact' | 'detailed';
  className?: string;
}

export const Indicators: React.FC<IndicatorsProps> = ({ variant = 'compact', className = '' }) => {
  const { data, loading } = useQuery(GET_INDICATORS, {
    pollInterval: 10000, // Refresh every 10s
  });

  const indicators: EmailIndicators = data?.emailIndicators || {
    total: 0,
    byFolder: {},
    byUrgency: {},
    starred: 0,
    requiresResponse: 0,
    requiresApproval: 0,
    overdue: 0,
  };

  if (loading && !data) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Unread */}
        {indicators.total > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full">
            <Inbox className="w-4 h-4" />
            <span className="text-sm font-medium">{indicators.total}</span>
          </div>
        )}

        {/* Starred */}
        {indicators.starred > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">{indicators.starred}</span>
          </div>
        )}

        {/* Requires Response */}
        {indicators.requiresResponse > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{indicators.requiresResponse}</span>
          </div>
        )}

        {/* Overdue */}
        {indicators.overdue > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full animate-pulse">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{indicators.overdue}</span>
          </div>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {/* Total Unread */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <Inbox className="w-5 h-5 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">{indicators.total}</span>
        </div>
        <div className="text-sm text-gray-600">Unread</div>
        {indicators.byUrgency.critical > 0 && (
          <div className="mt-2 text-xs text-red-600 font-medium">
            {indicators.byUrgency.critical} critical
          </div>
        )}
      </div>

      {/* Starred */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <Star className="w-5 h-5 text-yellow-600" />
          <span className="text-2xl font-bold text-gray-900">{indicators.starred}</span>
        </div>
        <div className="text-sm text-gray-600">Starred</div>
      </div>

      {/* Requires Response */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-2xl font-bold text-gray-900">{indicators.requiresResponse}</span>
        </div>
        <div className="text-sm text-gray-600">Requires Response</div>
        {indicators.requiresApproval > 0 && (
          <div className="mt-2 text-xs text-purple-600 font-medium">
            +{indicators.requiresApproval} approval
          </div>
        )}
      </div>

      {/* Overdue */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-2xl font-bold text-gray-900">{indicators.overdue}</span>
        </div>
        <div className="text-sm text-gray-600">Overdue</div>
      </div>
    </div>
  );
};

// Export individual indicator badges
export const UnreadBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-blue-600 rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  );
};

export const StarredBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-yellow-700 bg-yellow-100 rounded-full">
      {count}
    </span>
  );
};

export const ActionBadge: React.FC<{ count: number; type: 'response' | 'approval' | 'action' }> = ({
  count,
  type,
}) => {
  if (count === 0) return null;

  const colors = {
    response: 'text-blue-700 bg-blue-100',
    approval: 'text-purple-700 bg-purple-100',
    action: 'text-orange-700 bg-orange-100',
  };

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${colors[type]}`}>
      {count}
    </span>
  );
};
