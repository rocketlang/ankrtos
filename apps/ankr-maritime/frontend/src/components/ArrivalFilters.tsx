/**
 * Arrival Filters Component
 *
 * Provides filtering and search capabilities for the agent dashboard.
 * Supports port, status, ETA range, and text search filters.
 */

import React, { useState } from 'react';
import { Search, Filter, X, Calendar, Ship, MapPin, CheckCircle } from 'lucide-react';

export interface ArrivalFilters {
  search: string;
  portId?: string;
  status: string[];
  etaRange?: 'next24h' | 'next48h' | 'next7d' | 'all';
  complianceMin?: number;
}

interface ArrivalFiltersProps {
  filters: ArrivalFilters;
  onChange: (filters: ArrivalFilters) => void;
  ports?: Array<{ id: string; name: string; unlocode: string }>;
  showAdvanced?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'APPROACHING', label: 'Approaching', color: 'blue' },
  { value: 'IN_ANCHORAGE', label: 'At Anchorage', color: 'yellow' },
  { value: 'BERTHING', label: 'Berthing', color: 'purple' },
  { value: 'IN_PORT', label: 'In Port', color: 'green' }
];

const ETA_RANGE_OPTIONS = [
  { value: 'next24h', label: 'Next 24 hours', hours: 24 },
  { value: 'next48h', label: 'Next 48 hours', hours: 48 },
  { value: 'next7d', label: 'Next 7 days', hours: 168 },
  { value: 'all', label: 'All', hours: null }
];

export default function ArrivalFilters({ filters, onChange, ports = [], showAdvanced = false }: ArrivalFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handlePortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, portId: e.target.value || undefined });
  };

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onChange({ ...filters, status: newStatus });
  };

  const handleETARangeChange = (range: string) => {
    onChange({ ...filters, etaRange: range as any });
  };

  const handleComplianceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : undefined;
    onChange({ ...filters, complianceMin: value });
  };

  const clearFilters = () => {
    onChange({
      search: '',
      status: ['APPROACHING'],
      etaRange: 'next48h',
      complianceMin: undefined,
      portId: undefined
    });
  };

  const hasActiveFilters = filters.search || filters.portId || filters.status.length > 0 || filters.complianceMin !== undefined;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Compact Search Bar */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search by vessel name, IMO..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Quick Filters Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg font-medium transition-colors ${
              hasActiveFilters
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                {(filters.status.length > 0 ? 1 : 0) + (filters.portId ? 1 : 0) + (filters.complianceMin ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
          {/* Port Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Port
            </label>
            <select
              value={filters.portId || ''}
              onChange={handlePortChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Ports</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name} ({port.unlocode})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Ship className="inline w-4 h-4 mr-1" />
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => {
                const isSelected = filters.status.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusToggle(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? `bg-${option.color}-100 text-${option.color}-700 border-2 border-${option.color}-500`
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {isSelected && <CheckCircle className="inline w-3 h-3 mr-1" />}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ETA Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              ETA Range
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ETA_RANGE_OPTIONS.map((option) => {
                const isSelected = filters.etaRange === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleETARangeChange(option.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Compliance Score
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={filters.complianceMin || 0}
                  onChange={handleComplianceChange}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-900 w-12 text-right">
                  {filters.complianceMin || 0}%
                </span>
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Active filters:</span>
                {filters.search && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                    Search: "{filters.search}"
                    <button onClick={() => onChange({ ...filters, search: '' })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.portId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                    Port: {ports.find((p) => p.id === filters.portId)?.name}
                    <button onClick={() => onChange({ ...filters, portId: undefined })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.status.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                    Status: {filters.status.length} selected
                    <button onClick={() => onChange({ ...filters, status: [] })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.complianceMin !== undefined && filters.complianceMin > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                    Compliance: ≥{filters.complianceMin}%
                    <button onClick={() => onChange({ ...filters, complianceMin: undefined })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Filter utility functions
export function applyFilters(arrivals: any[], filters: ArrivalFilters) {
  let filtered = [...arrivals];

  // Text search (vessel name or IMO)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.vessel.name.toLowerCase().includes(searchLower) ||
        (a.vessel.imo && a.vessel.imo.toLowerCase().includes(searchLower))
    );
  }

  // Port filter
  if (filters.portId) {
    filtered = filtered.filter((a) => a.port.id === filters.portId);
  }

  // Status filter
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter((a) => filters.status.includes(a.status));
  }

  // ETA range filter
  if (filters.etaRange && filters.etaRange !== 'all') {
    const now = new Date();
    const etaOption = ETA_RANGE_OPTIONS.find((o) => o.value === filters.etaRange);
    if (etaOption && etaOption.hours) {
      const cutoff = new Date(now.getTime() + etaOption.hours * 60 * 60 * 1000);
      filtered = filtered.filter((a) => {
        const eta = new Date(a.eta);
        return eta <= cutoff;
      });
    }
  }

  // Compliance filter
  if (filters.complianceMin !== undefined && filters.complianceMin > 0) {
    filtered = filtered.filter(
      (a) => a.intelligence && a.intelligence.complianceScore >= filters.complianceMin!
    );
  }

  return filtered;
}

// Save/Load filter presets
export function saveFilterPreset(name: string, filters: ArrivalFilters) {
  const presets = JSON.parse(localStorage.getItem('arrivalFilterPresets') || '{}');
  presets[name] = filters;
  localStorage.setItem('arrivalFilterPresets', JSON.stringify(presets));
}

export function loadFilterPresets(): Record<string, ArrivalFilters> {
  return JSON.parse(localStorage.getItem('arrivalFilterPresets') || '{}');
}

export function deleteFilterPreset(name: string) {
  const presets = loadFilterPresets();
  delete presets[name];
  localStorage.setItem('arrivalFilterPresets', JSON.stringify(presets));
}
