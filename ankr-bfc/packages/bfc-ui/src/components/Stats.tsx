/**
 * Stats/Metrics Components
 */

import React, { type ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn, formatINR, formatIndianNumber } from '../utils.js';
import { Card, CardContent } from './Card.js';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  iconColor?: string;
  format?: 'number' | 'currency' | 'percentage' | 'none';
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconColor = 'blue',
  format = 'none',
  loading,
}: StatCardProps) {
  const colorClasses: Record<string, { bg: string; icon: string }> = {
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
    green: { bg: 'bg-green-100', icon: 'text-green-600' },
    red: { bg: 'bg-red-100', icon: 'text-red-600' },
    yellow: { bg: 'bg-yellow-100', icon: 'text-yellow-600' },
    purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
    cyan: { bg: 'bg-cyan-100', icon: 'text-cyan-600' },
  };

  const colors = colorClasses[iconColor] || colorClasses.blue;

  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    switch (format) {
      case 'currency':
        return formatINR(val);
      case 'number':
        return formatIndianNumber(val);
      case 'percentage':
        return `${val}%`;
      default:
        return String(val);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-slate-200 rounded-lg" />
              <div className="h-4 w-16 bg-slate-200 rounded" />
            </div>
            <div className="mt-4">
              <div className="h-8 w-24 bg-slate-200 rounded" />
              <div className="h-4 w-20 bg-slate-200 rounded mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {icon && (
            <div className={cn('p-2 rounded-lg', colors.bg)}>
              <div className={cn('w-5 h-5', colors.icon)}>{icon}</div>
            </div>
          )}
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-slate-500'
              )}
            >
              {change > 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : change < 0 ? (
                <ArrowDownRight className="w-4 h-4" />
              ) : (
                <Minus className="w-4 h-4" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-slate-900">{formatValue(value)}</p>
          <p className="text-sm text-slate-500">{changeLabel || title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Stats Grid
 */
export interface StatsGridProps {
  children: ReactNode;
  cols?: 2 | 3 | 4;
}

export function StatsGrid({ children, cols = 4 }: StatsGridProps) {
  const colClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return <div className={cn('grid gap-4', colClasses[cols])}>{children}</div>;
}

/**
 * Mini Stat (Inline)
 */
export interface MiniStatProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

export function MiniStat({ label, value, trend }: MiniStatProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500">{label}:</span>
      <span className="font-medium text-slate-900">{value}</span>
      {trend && (
        <span
          className={cn(
            trend === 'up' && 'text-green-600',
            trend === 'down' && 'text-red-600',
            trend === 'neutral' && 'text-slate-400'
          )}
        >
          {trend === 'up' ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : trend === 'down' ? (
            <ArrowDownRight className="w-4 h-4" />
          ) : (
            <Minus className="w-4 h-4" />
          )}
        </span>
      )}
    </div>
  );
}

/**
 * Progress Bar
 */
export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  color = 'blue',
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-600',
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between mb-1.5 text-sm">
          {label && <span className="text-slate-600">{label}</span>}
          {showValue && <span className="text-slate-900 font-medium">{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-slate-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
