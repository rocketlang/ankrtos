/**
 * Bottom Sheet Component
 *
 * Mobile-friendly drawer that slides up from the bottom of the screen.
 * Perfect for filters, forms, and actions on mobile devices.
 *
 * Features:
 * - Slide up/down animation
 * - Backdrop with tap to close
 * - Drag handle for intuitive UX
 * - Swipe down to close
 * - Prevents body scroll when open
 */

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[]; // Percentage heights [50, 90]
  defaultSnap?: number; // Index of default snap point
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [50, 90],
  defaultSnap = 0
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [snapIndex, setSnapIndex] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  // Prevent body scroll when open
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

  // Reset snap index when closed
  useEffect(() => {
    if (!isOpen) {
      setSnapIndex(defaultSnap);
    }
  }, [isOpen, defaultSnap]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = currentY - startY;
    const threshold = 100; // Pixels to swipe to close

    if (deltaY > threshold) {
      // Swipe down - close or snap to lower position
      if (snapIndex > 0) {
        setSnapIndex(snapIndex - 1);
      } else {
        onClose();
      }
    } else if (deltaY < -threshold) {
      // Swipe up - snap to higher position
      if (snapIndex < snapPoints.length - 1) {
        setSnapIndex(snapIndex + 1);
      }
    }

    setStartY(0);
    setCurrentY(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setCurrentY(e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setCurrentY(e.clientY);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    handleTouchEnd();
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const currentSnapHeight = snapPoints[snapIndex];
  const dragOffset = isDragging ? Math.max(0, currentY - startY) : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        style={{ opacity: isOpen ? 1 : 0 }}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transition-transform"
        style={{
          height: `${currentSnapHeight}%`,
          transform: `translateY(${isDragging ? dragOffset : 0}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out, height 0.3s ease-out'
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex items-center justify-center py-4 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: `calc(${currentSnapHeight}% - 120px)` }}>
          {children}
        </div>
      </div>
    </>
  );
}

/**
 * Hook for managing bottom sheet state
 */
export function useBottomSheet(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  return { isOpen, open, close, toggle };
}

/**
 * Bottom Sheet Action Buttons
 * Helper component for consistent action buttons in bottom sheets
 */
export function BottomSheetActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center gap-3">
      {children}
    </div>
  );
}
