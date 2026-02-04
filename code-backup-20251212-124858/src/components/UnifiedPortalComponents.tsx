/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UNIFIED PORTAL DESIGN SYSTEM
 * All portals use the SAME design language, just different accent colors
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PROBLEM: CustomerPortal, VendorPortal, DriverApp all look different
 * SOLUTION: Shared components + theme-aware styling
 * 
 * DESIGN PRINCIPLE:
 * - Same card styles
 * - Same spacing
 * - Same typography
 * - Same button styles
 * - Only ACCENT COLOR differs per portal
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// ═══════════════════════════════════════════════════════════════════════════
// PORTAL TYPES & ACCENT COLORS
// ═══════════════════════════════════════════════════════════════════════════

type PortalType = 'admin' | 'customer' | 'vendor' | 'driver';

// Each portal has ONE accent color that respects the base theme
const PORTAL_ACCENTS: Record<PortalType, { light: string; dark: string; name: string }> = {
  admin: {
    light: '#6366f1',  // Indigo
    dark: '#818cf8',
    name: 'Admin Dashboard',
  },
  customer: {
    light: '#f97316',  // Orange (WowTruck brand)
    dark: '#fb923c',
    name: 'Customer Portal',
  },
  vendor: {
    light: '#0891b2',  // Cyan
    dark: '#22d3ee',
    name: 'Vendor Portal',
  },
  driver: {
    light: '#16a34a',  // Green (Go!)
    dark: '#4ade80',
    name: 'Driver App',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PORTAL CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface PortalContextType {
  portal: PortalType;
  accent: string;
  accentBg: string;
  accentText: string;
  portalName: string;
}

const PortalContext = createContext<PortalContextType | null>(null);

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within PortalProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// PORTAL PROVIDER - Wraps each portal page
// ═══════════════════════════════════════════════════════════════════════════

interface PortalProviderProps {
  portal: PortalType;
  children: ReactNode;
}

export function PortalProvider({ portal, children }: PortalProviderProps) {
  const { theme } = useTheme();
  const isDark = !['light'].includes(theme);
  
  const accentConfig = PORTAL_ACCENTS[portal];
  const accent = isDark ? accentConfig.dark : accentConfig.light;
  
  const value: PortalContextType = {
    portal,
    accent,
    accentBg: `bg-[${accent}]`,
    accentText: `text-[${accent}]`,
    portalName: accentConfig.name,
  };
  
  return (
    <PortalContext.Provider value={value}>
      <div 
        className="portal-root"
        style={{ '--portal-accent': accent } as React.CSSProperties}
      >
        {children}
      </div>
    </PortalContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED COMPONENT: PortalCard
// Same look everywhere, just accent color changes
// ═══════════════════════════════════════════════════════════════════════════

interface PortalCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function PortalCard({ children, className = '', onClick, hover = false }: PortalCardProps) {
  const { theme } = useTheme();
  const isDark = !['light'].includes(theme);
  
  const baseStyle = isDark
    ? 'bg-gray-800/50 border-gray-700/50'
    : 'bg-white border-gray-200';
  
  const hoverStyle = hover
    ? isDark
      ? 'hover:bg-gray-800/70 hover:border-gray-600 cursor-pointer'
      : 'hover:bg-gray-50 hover:border-gray-300 cursor-pointer'
    : '';
  
  return (
    <div
      className={`
        rounded-xl border p-4 transition-all duration-200
        ${baseStyle}
        ${hoverStyle}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED COMPONENT: PortalStat
// ═══════════════════════════════════════════════════════════════════════════

interface PortalStatProps {
  icon: string;
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
}

export function PortalStat({ icon, label, value, change, positive }: PortalStatProps) {
  const { theme } = useTheme();
  const isDark = !['light'].includes(theme);
  
  return (
    <PortalCard>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {label}
          </p>
          <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
          {change && (
            <p className={`text-xs mt-1 ${positive ? 'text-green-500' : 'text-red-500'}`}>
              {positive ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </PortalCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED COMPONENT: PortalButton
// ═══════════════════════════════════════════════════════════════════════════

interface PortalButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  icon?: string;
}

export function PortalButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  onClick,
  disabled = false,
  icon,
}: PortalButtonProps) {
  const { theme } = useTheme();
  const isDark = !['light'].includes(theme);
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const variantClasses = {
    primary: 'bg-[var(--portal-accent)] text-white hover:opacity-90',
    secondary: isDark
      ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200',
    ghost: isDark
      ? 'text-gray-300 hover:bg-gray-800'
      : 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg font-medium transition-all duration-200
        flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
      `}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED COMPONENT: PortalBadge
// ═══════════════════════════════════════════════════════════════════════════

interface PortalBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  children: ReactNode;
}

export function PortalBadge({ status, children }: PortalBadgeProps) {
  const statusClasses = {
    success: 'bg-green-500/10 text-green-500 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    pending: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };
  
  return (
    <span className={`
      px-2 py-1 rounded-full text-xs font-medium border
      ${statusClasses[status]}
    `}>
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED COMPONENT: PortalHeader
// ═══════════════════════════════════════════════════════════════════════════

interface PortalHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actions?: ReactNode;
}

export function PortalHeader({ title, subtitle, icon, actions }: PortalHeaderProps) {
  const { theme } = useTheme();
  const isDark = !['light'].includes(theme);
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && <span className="text-3xl">{icon}</span>}
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h1>
          {subtitle && (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED COMPONENT: PortalList
// ═══════════════════════════════════════════════════════════════════════════

interface PortalListItemProps {
  icon?: string;
  title: string;
  subtitle?: string;
  value?: string | number;
  badge?: ReactNode;
  onClick?: () => void;
}

export function PortalListItem({ icon, title, subtitle, value, badge, onClick }: PortalListItemProps) {
  const { theme } = useTheme();
  const isDark = !['light'].includes(theme);
  
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center justify-between p-4 border-b last:border-b-0
        ${isDark ? 'border-gray-700/50' : 'border-gray-100'}
        ${onClick ? 'cursor-pointer hover:bg-gray-500/5' : ''}
        transition-colors
      `}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-xl">{icon}</span>}
        <div>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </p>
          {subtitle && (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {value && (
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </span>
        )}
        {badge}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED COMPONENT: PortalTabs
// ═══════════════════════════════════════════════════════════════════════════

interface PortalTab {
  id: string;
  label: string;
  icon?: string;
}

interface PortalTabsProps {
  tabs: PortalTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function PortalTabs({ tabs, activeTab, onTabChange }: PortalTabsProps) {
  const { theme } = useTheme();
  const isDark = !['light'].includes(theme);
  
  return (
    <div className={`
      flex border-b mb-4
      ${isDark ? 'border-gray-700' : 'border-gray-200'}
    `}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-3 text-sm font-medium
            border-b-2 -mb-[2px] transition-colors
            ${activeTab === tab.id
              ? 'border-[var(--portal-accent)] text-[var(--portal-accent)]'
              : isDark
                ? 'border-transparent text-gray-400 hover:text-gray-300'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }
          `}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED COMPONENT: PortalEmpty
// ═══════════════════════════════════════════════════════════════════════════

interface PortalEmptyProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PortalEmpty({ icon, title, description, action }: PortalEmptyProps) {
  const { theme } = useTheme();
  const isDark = !['light'].includes(theme);
  
  return (
    <div className="text-center py-12">
      <span className="text-5xl mb-4 block">{icon}</span>
      <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      {description && (
        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED COMPONENT: PortalBottomNav (Mobile)
// ═══════════════════════════════════════════════════════════════════════════

interface NavItem {
  id: string;
  icon: string;
  label: string;
}

interface PortalBottomNavProps {
  items: NavItem[];
  activeItem: string;
  onItemChange: (itemId: string) => void;
}

export function PortalBottomNav({ items, activeItem, onItemChange }: PortalBottomNavProps) {
  const { theme } = useTheme();
  const isDark = !['light'].includes(theme);
  
  return (
    <nav className={`
      fixed bottom-0 left-0 right-0 z-50
      border-t safe-area-bottom
      ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'}
      backdrop-blur-md
    `}>
      <div className="flex items-center justify-around h-16">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onItemChange(item.id)}
            className={`
              flex flex-col items-center justify-center flex-1 h-full
              transition-colors
              ${activeItem === item.id
                ? 'text-[var(--portal-accent)]'
                : isDark ? 'text-gray-500' : 'text-gray-400'
              }
            `}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export {
  PORTAL_ACCENTS,
  type PortalType,
};
