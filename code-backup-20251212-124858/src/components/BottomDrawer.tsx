/**
 * 📱 ANKR BottomDrawer - Mobile-First Slide-Up Panel
 * 
 * Features:
 * - Slides up from bottom (80% screen height)
 * - Drag handle to resize or swipe down to close
 * - Backdrop click to close
 * - Theme-aware styling
 * - Smooth animations
 * 
 * Usage:
 *   <BottomDrawer 
 *     isOpen={showOrders} 
 *     onClose={() => setShowOrders(false)}
 *     title="Orders"
 *   >
 *     <OrdersList />
 *   </BottomDrawer>
 * 
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface BottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  height?: 'full' | 'large' | 'medium' | 'small';
}

const heightMap = {
  full: 'h-[95vh]',
  large: 'h-[85vh]',
  medium: 'h-[70vh]',
  small: 'h-[50vh]',
};

export function BottomDrawer({ 
  isOpen, 
  onClose, 
  title, 
  icon,
  children,
  height = 'large'
}: BottomDrawerProps) {
  const { theme } = useTheme();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [startY, setStartY] = useState(0);

  // Theme-based colors
  const isDark = theme !== 'light';
  const bgColor = isDark ? 'bg-gray-900' : 'bg-white';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const handleColor = isDark ? 'bg-gray-600' : 'bg-gray-300';
  const headerBg = isDark ? 'bg-gray-800' : 'bg-gray-50';

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle drag to close
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
    setDragY(0);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = clientY - startY;
    if (delta > 0) { // Only allow dragging down
      setDragY(delta);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (dragY > 150) { // Close threshold
      onClose();
    }
    setDragY(0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
        style={{ opacity: isOpen ? 1 : 0 }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed bottom-0 left-0 right-0 z-50
          ${bgColor} ${borderColor}
          rounded-t-3xl border-t shadow-2xl
          transition-transform duration-300 ease-out
          ${heightMap[height]}
        `}
        style={{
          transform: isOpen 
            ? `translateY(${dragY}px)` 
            : 'translateY(100%)',
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className={`w-12 h-1.5 rounded-full ${handleColor}`} />
        </div>

        {/* Header */}
        <div className={`
          flex items-center justify-between px-4 py-3 
          ${headerBg} border-b ${borderColor}
        `}>
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <h2 className={`text-xl font-bold ${textColor}`}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className={`
              p-2 rounded-full transition-colors
              ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}
            `}
          >
            <X className={`w-6 h-6 ${textColor}`} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-80px)] px-4 py-4">
          {children}
        </div>
      </div>
    </>
  );
}

/**
 * 🎯 DrawerTrigger - Button that opens a drawer
 */
interface DrawerTriggerProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  color?: string;
}

export function DrawerTrigger({ onClick, icon, label, badge, color = 'blue' }: DrawerTriggerProps) {
  const { theme } = useTheme();
  const isDark = theme !== 'light';

  const colorMap: Record<string, string> = {
    blue: isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600',
    green: isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600',
    orange: isDark ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600',
    purple: isDark ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600',
    red: isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600',
    gray: isDark ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600',
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        w-20 h-20 rounded-2xl
        ${colorMap[color] || colorMap.blue}
        text-white font-medium
        transition-all duration-200
        active:scale-95 shadow-lg
      `}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

export default BottomDrawer;
