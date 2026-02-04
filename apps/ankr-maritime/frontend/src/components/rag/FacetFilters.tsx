import React from 'react';
import { useSearchStore } from '../../lib/stores/searchStore';
import { useTranslation } from 'react-i18next';

const DOC_TYPES = [
  { value: 'charter_party', label: 'Charter Party', icon: '📄' },
  { value: 'bol', label: 'Bill of Lading', icon: '📋' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'market_report', label: 'Market Report', icon: '📊' },
  { value: 'compliance', label: 'Compliance', icon: '✅' },
  { value: 'sop', label: 'SOP', icon: '📖' },
  { value: 'invoice', label: 'Invoice', icon: '💰' },
];

export function FacetFilters() {
  const { t } = useTranslation();
  const { filters, setFilters } = useSearchStore();

  const handleDocTypeToggle = (docType: string) => {
    const current = filters.docTypes || [];
    const updated = current.includes(docType)
      ? current.filter((t) => t !== docType)
      : [...current, docType];
    setFilters({ docTypes: updated });
  };

  const handleClearAll = () => {
    setFilters({
      docTypes: [],
      vesselId: undefined,
      voyageId: undefined,
      minImportance: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      tags: undefined,
    });
  };

  const hasActiveFilters =
    (filters.docTypes && filters.docTypes.length > 0) ||
    filters.vesselId ||
    filters.voyageId ||
    filters.minImportance !== undefined ||
    filters.dateFrom ||
    filters.dateTo ||
    (filters.tags && filters.tags.length > 0);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('rag.search.filters', 'Filters')}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Document Type */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Document Type
        </h4>
        <div className="space-y-2">
          {DOC_TYPES.map((type) => (
            <label
              key={type.value}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
            >
              <input
                type="checkbox"
                checked={filters.docTypes?.includes(type.value) || false}
                onChange={() => handleDocTypeToggle(type.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-lg">{type.icon}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Date Range
        </h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              From
            </label>
            <input
              type="date"
              value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
              onChange={(e) =>
                setFilters({ dateFrom: e.target.value ? new Date(e.target.value) : undefined })
              }
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              To
            </label>
            <input
              type="date"
              value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
              onChange={(e) =>
                setFilters({ dateTo: e.target.value ? new Date(e.target.value) : undefined })
              }
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Importance */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Minimum Importance
        </h4>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={filters.minImportance || 0}
          onChange={(e) => setFilters({ minImportance: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Any</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {((filters.minImportance || 0) * 100).toFixed(0)}%
          </span>
          <span>Critical</span>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            ACTIVE FILTERS
          </h4>
          <div className="flex flex-wrap gap-2">
            {filters.docTypes?.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
              >
                {DOC_TYPES.find((t) => t.value === type)?.label}
                <button
                  onClick={() => handleDocTypeToggle(type)}
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.minImportance && filters.minImportance > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                Importance ≥ {(filters.minImportance * 100).toFixed(0)}%
                <button
                  onClick={() => setFilters({ minImportance: undefined })}
                  className="hover:text-purple-600 dark:hover:text-purple-400"
                >
                  ×
                </button>
              </span>
            )}
            {filters.dateFrom && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                From {filters.dateFrom.toLocaleDateString()}
                <button
                  onClick={() => setFilters({ dateFrom: undefined })}
                  className="hover:text-green-600 dark:hover:text-green-400"
                >
                  ×
                </button>
              </span>
            )}
            {filters.dateTo && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                To {filters.dateTo.toLocaleDateString()}
                <button
                  onClick={() => setFilters({ dateTo: undefined })}
                  className="hover:text-green-600 dark:hover:text-green-400"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
