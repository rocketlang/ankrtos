/**
 * Responsive Export Component
 *
 * Automatically switches between desktop and mobile export UIs.
 * Uses Tailwind responsive utilities to show/hide based on screen size.
 */

import React from 'react';
import ExportActions from './ExportActions';
import MobileExportMenu from './MobileExportMenu';

interface ResponsiveExportProps {
  arrivals?: any[];
  arrival?: any;
  variant?: 'dropdown' | 'buttons';
}

export default function ResponsiveExport({ arrivals, arrival, variant = 'dropdown' }: ResponsiveExportProps) {
  return (
    <>
      {/* Desktop View - Hidden on mobile */}
      <div className="hidden md:block">
        <ExportActions arrivals={arrivals || []} arrival={arrival} variant={variant} />
      </div>

      {/* Mobile View - Hidden on desktop */}
      <div className="md:hidden">
        <MobileExportMenu arrivals={arrivals} arrival={arrival} />
      </div>
    </>
  );
}
