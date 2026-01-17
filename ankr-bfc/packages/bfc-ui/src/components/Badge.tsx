/**
 * Badge Component
 */

import React, { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils.js';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-800',
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-cyan-100 text-cyan-800',
        purple: 'bg-purple-100 text-purple-800',
        outline: 'border border-slate-300 text-slate-700',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({
  className,
  variant,
  size,
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-yellow-500',
            variant === 'danger' && 'bg-red-500',
            variant === 'primary' && 'bg-blue-500',
            variant === 'info' && 'bg-cyan-500',
            (!variant || variant === 'default') && 'bg-slate-500'
          )}
        />
      )}
      {children}
    </span>
  );
}

/**
 * Status Badge - Pre-configured for common banking statuses
 */
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: string;
}

const statusVariants: Record<string, BadgeProps['variant']> = {
  approved: 'success',
  active: 'success',
  completed: 'success',
  verified: 'success',
  pending: 'warning',
  processing: 'warning',
  review: 'warning',
  rejected: 'danger',
  failed: 'danger',
  blocked: 'danger',
  expired: 'danger',
  inactive: 'default',
  draft: 'default',
};

export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const variant = statusVariants[status.toLowerCase()] || 'default';
  return (
    <Badge variant={variant} dot {...props}>
      {status}
    </Badge>
  );
}

/**
 * Risk Badge
 */
export interface RiskBadgeProps extends Omit<BadgeProps, 'variant'> {
  score: number;
}

export function RiskBadge({ score, ...props }: RiskBadgeProps) {
  let variant: BadgeProps['variant'] = 'success';
  let label = 'Low Risk';

  if (score >= 80) {
    variant = 'danger';
    label = 'High Risk';
  } else if (score >= 60) {
    variant = 'warning';
    label = 'Medium Risk';
  } else if (score >= 40) {
    variant = 'info';
    label = 'Moderate';
  }

  return (
    <Badge variant={variant} {...props}>
      {label} ({score})
    </Badge>
  );
}

/**
 * Segment Badge
 */
export interface SegmentBadgeProps extends Omit<BadgeProps, 'variant'> {
  segment: string;
}

const segmentVariants: Record<string, BadgeProps['variant']> = {
  premium: 'purple',
  affluent: 'primary',
  'mass affluent': 'info',
  mass: 'default',
};

export function SegmentBadge({ segment, ...props }: SegmentBadgeProps) {
  const variant = segmentVariants[segment.toLowerCase()] || 'default';
  return (
    <Badge variant={variant} {...props}>
      {segment}
    </Badge>
  );
}
