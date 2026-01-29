import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LiveDot } from './live-dot';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  live?: boolean;
}

const variantStyles = {
  default: 'text-gray-900',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger: 'text-red-600',
  info: 'text-blue-600',
};

export function StatCard({ title, value, subtitle, icon: Icon, variant = 'default', live }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="flex items-center gap-1">
            {live && <LiveDot />}
            {Icon && <Icon className="h-4 w-4 text-gray-400" />}
          </div>
        </div>
        <p className={cn('mt-2 text-2xl font-bold', variantStyles[variant])}>{value}</p>
        {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
