import React, { useState } from 'react';

interface DocumentPreviewModalProps {
  documentId: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreviewModal({
  documentId,
  title,
  isOpen,
  onClose,
}: DocumentPreviewModalProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                {title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Document ID: {documentId}
              </p>
            </div>

            <button
              onClick={onClose}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
              {/* Placeholder for document content */}
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-400">
                  Document preview will be displayed here.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  This is a placeholder. In production, this would render:
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-500">
                  <li>PDF viewer using react-pdf</li>
                  <li>Image viewer for image files</li>
                  <li>Markdown renderer for .md files</li>
                  <li>Text viewer for plain text</li>
                </ul>

                {/* Example document structure */}
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {title}
                  </h3>
                  <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <p>
                      This document would be loaded from the backend and displayed
                      here with proper formatting and search term highlighting.
                    </p>
                    <p>
                      The preview supports navigation between chunks and can jump
                      to specific pages or sections.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Navigation */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of 1
              </span>

              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= 1}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                Download
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors">
                Open in New Tab
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
