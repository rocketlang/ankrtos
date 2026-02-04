/**
 * Mobile Filters Component
 *
 * Mobile-optimized filter interface using bottom sheet.
 * Automatically switches between desktop and mobile layouts based on screen size.
 */

import React from 'react';
import { Filter } from 'lucide-react';
import BottomSheet, { useBottomSheet, BottomSheetActions } from './BottomSheet';
import ArrivalFilters, { ArrivalFilters as FilterType } from './ArrivalFilters';

interface MobileFiltersProps {
  filters: FilterType;
  onChange: (filters: FilterType) => void;
  ports?: Array<{ id: string; name: string; unlocode: string }>;
  resultCount?: number;
}

export default function MobileFilters({ filters, onChange, ports, resultCount }: MobileFiltersProps) {
  const { isOpen, open, close } = useBottomSheet();

  const handleApplyFilters = () => {
    close();
  };

  const handleClearFilters = () => {
    onChange({
      search: '',
      status: ['APPROACHING'],
      etaRange: 'next48h',
      complianceMin: undefined,
      portId: undefined
    });
  };

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.portId ? 1 : 0) +
    (filters.status.length > 0 ? 1 : 0) +
    (filters.complianceMin !== undefined && filters.complianceMin > 0 ? 1 : 0);

  return (
    <>
      {/* Mobile Filter Button - Only shows on small screens */}
      <div className="lg:hidden">
        <button
          onClick={open}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors ${
            activeFilterCount > 0
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          <Filter className="w-5 h-5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-white text-blue-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
        {resultCount !== undefined && (
          <p className="mt-2 text-sm text-gray-600">
            Showing {resultCount} {resultCount === 1 ? 'arrival' : 'arrivals'}
          </p>
        )}
      </div>

      {/* Desktop Filters - Hidden on mobile */}
      <div className="hidden lg:block">
        <ArrivalFilters filters={filters} onChange={onChange} ports={ports} showAdvanced={true} />
      </div>

      {/* Mobile Bottom Sheet */}
      <BottomSheet isOpen={isOpen} onClose={close} title="Filter Arrivals" snapPoints={[60, 90]} defaultSnap={1}>
        <div className="space-y-6">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              placeholder="Search by vessel name, IMO..."
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Port Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
            <select
              value={filters.portId || ''}
              onChange={(e) => onChange({ ...filters, portId: e.target.value || undefined })}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Ports</option>
              {ports?.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name} ({port.unlocode})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'APPROACHING', label: 'Approaching', color: 'blue' },
                { value: 'IN_ANCHORAGE', label: 'At Anchorage', color: 'yellow' },
                { value: 'BERTHING', label: 'Berthing', color: 'purple' },
                { value: 'IN_PORT', label: 'In Port', color: 'green' }
              ].map((option) => {
                const isSelected = filters.status.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      const newStatus = isSelected
                        ? filters.status.filter((s) => s !== option.value)
                        : [...filters.status, option.value];
                      onChange({ ...filters, status: newStatus });
                    }}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all touch-manipulation ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ETA Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">ETA Range</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'next24h', label: 'Next 24h' },
                { value: 'next48h', label: 'Next 48h' },
                { value: 'next7d', label: 'Next 7 days' },
                { value: 'all', label: 'All' }
              ].map((option) => {
                const isSelected = filters.etaRange === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => onChange({ ...filters, etaRange: option.value as any })}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all touch-manipulation ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compliance Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Compliance Score: {filters.complianceMin || 0}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={filters.complianceMin || 0}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                onChange({ ...filters, complianceMin: value });
              }}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                WebkitAppearance: 'none',
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${filters.complianceMin || 0}%, #e5e7eb ${filters.complianceMin || 0}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Result Count */}
          {resultCount !== undefined && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">
                {resultCount} {resultCount === 1 ? 'arrival' : 'arrivals'} found
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <BottomSheetActions>
          <button
            onClick={handleClearFilters}
            className="flex-1 px-4 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg touch-manipulation"
          >
            Clear All
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex-1 px-4 py-3 text-base font-medium text-white bg-blue-600 rounded-lg touch-manipulation"
          >
            Apply Filters
          </button>
        </BottomSheetActions>
      </BottomSheet>
    </>
  );
}
