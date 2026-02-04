import type { TestResult } from '../types';

interface ErrorDetailsProps {
  result: TestResult;
  onClose: () => void;
}

export function ErrorDetails({ result, onClose }: ErrorDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-700 shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-white">{result.name}</h3>
            <p className="text-sm text-gray-400 mt-1">{result.suite}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Error Message */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Error Message</h4>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 font-mono text-sm">{result.error}</p>
            </div>
          </div>

          {/* Stack Trace */}
          {result.stackTrace && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Stack Trace</h4>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-gray-300 font-mono text-xs whitespace-pre-wrap">
                  {result.stackTrace}
                </pre>
              </div>
            </div>
          )}

          {/* Test Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Test Info</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Duration</dt>
                  <dd className="text-white">{(result.duration / 1000).toFixed(2)}s</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Retries</dt>
                  <dd className="text-white">{result.retries}</dd>
                </div>
                {result.browser && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Browser</dt>
                    <dd className="text-white">{result.browser}</dd>
                  </div>
                )}
                {result.viewport && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Viewport</dt>
                    <dd className="text-white">{result.viewport}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={() => navigator.clipboard.writeText(result.error || '')}
            className="btn btn-secondary"
          >
            Copy Error
          </button>
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
