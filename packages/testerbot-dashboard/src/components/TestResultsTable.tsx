import { formatDistanceToNow } from 'date-fns';
import type { TestResult } from '../types';
import clsx from 'clsx';

interface TestResultsTableProps {
  results: TestResult[];
  onSelect: (result: TestResult) => void;
}

const statusColors = {
  passed: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  skipped: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  running: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const statusIcons = {
  passed: '✓',
  failed: '✗',
  skipped: '○',
  pending: '◌',
  running: '◐',
};

export function TestResultsTable({ results, onSelect }: TestResultsTableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900/50">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Test Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Suite</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Duration</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Time</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {results.map((result) => (
              <tr
                key={result.id}
                className={clsx(
                  'hover:bg-gray-700/30 transition-colors cursor-pointer',
                  result.status === 'failed' && 'bg-red-500/5'
                )}
                onClick={() => result.error && onSelect(result)}
              >
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      'inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs font-medium',
                      statusColors[result.status]
                    )}
                  >
                    {statusIcons[result.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{result.name}</div>
                  {result.error && (
                    <div className="text-xs text-red-400 truncate max-w-xs mt-1">
                      {result.error}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400">{result.suite}</td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      'text-sm',
                      result.duration > 3000
                        ? 'text-yellow-400'
                        : result.duration > 5000
                        ? 'text-red-400'
                        : 'text-gray-400'
                    )}
                  >
                    {(result.duration / 1000).toFixed(2)}s
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {formatDistanceToNow(result.timestamp, { addSuffix: true })}
                </td>
                <td className="px-4 py-3">
                  {result.error && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(result);
                      }}
                      className="text-ankr-400 hover:text-ankr-300 text-sm"
                    >
                      View Error
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {results.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-4 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>No test results found</p>
        </div>
      )}
    </div>
  );
}
