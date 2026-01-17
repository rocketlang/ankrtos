/**
 * Avatar Component
 */

import React, { type ImgHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, getInitials } from '../utils.js';

const avatarVariants = cva(
  'relative inline-flex items-center justify-center rounded-full bg-slate-100 font-medium text-slate-600 overflow-hidden',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
        '2xl': 'h-20 w-20 text-xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'>,
    VariantProps<typeof avatarVariants> {
  name?: string;
  src?: string;
  fallback?: React.ReactNode;
  status?: 'online' | 'offline' | 'busy' | 'away';
}

export function Avatar({
  className,
  size,
  name,
  src,
  fallback,
  status,
  alt,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const showFallback = !src || imageError;
  const initials = name ? getInitials(name) : null;

  return (
    <div className={cn(avatarVariants({ size }), className)}>
      {!showFallback ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
          {...props}
        />
      ) : fallback ? (
        fallback
      ) : initials ? (
        initials
      ) : (
        <svg
          className="h-full w-full text-slate-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            size === 'xs' && 'h-1.5 w-1.5',
            size === 'sm' && 'h-2 w-2',
            (size === 'md' || !size) && 'h-2.5 w-2.5',
            size === 'lg' && 'h-3 w-3',
            size === 'xl' && 'h-3.5 w-3.5',
            size === '2xl' && 'h-4 w-4',
            status === 'online' && 'bg-green-500',
            status === 'offline' && 'bg-slate-400',
            status === 'busy' && 'bg-red-500',
            status === 'away' && 'bg-yellow-500'
          )}
        />
      )}
    </div>
  );
}

/**
 * Avatar Group
 */
export interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: AvatarProps['size'];
}

export function AvatarGroup({ children, max = 4, size = 'md' }: AvatarGroupProps) {
  const avatars = React.Children.toArray(children);
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((child, index) => (
        <div key={index} className="ring-2 ring-white rounded-full">
          {React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<AvatarProps>, { size })
            : child}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            avatarVariants({ size }),
            'ring-2 ring-white bg-slate-200 text-slate-600'
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
