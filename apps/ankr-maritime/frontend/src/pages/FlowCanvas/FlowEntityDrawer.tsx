/**
 * Flow Canvas - Entity Drawer
 *
 * Side panel that shows entity details when clicked
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlowCanvasStore } from '../../lib/stores/flowCanvasStore';

/**
 * Flow Entity Drawer Component
 */
export default function FlowEntityDrawer() {
  const { isDrawerOpen, selectedEntity, closeDrawer, updateEntity, deleteEntity } =
    useFlowCanvasStore();

  if (!selectedEntity) return null;

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Entity Details</h2>
                <button
                  onClick={closeDrawer}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Title Section */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedEntity.title}</h3>
                {selectedEntity.subtitle && (
                  <p className="text-gray-600 mt-2">{selectedEntity.subtitle}</p>
                )}
              </div>

              {/* Alert Banner */}
              {selectedEntity.alerts && selectedEntity.alerts > 0 && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-semibold text-red-900">
                        {selectedEntity.alerts} Active{' '}
                        {selectedEntity.alerts === 1 ? 'Alert' : 'Alerts'}
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        This entity requires immediate attention
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Type</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {selectedEntity.type}
                  </p>
                </div>

                {/* Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {selectedEntity.status.replace(/_/g, ' ')}
                  </p>
                </div>

                {/* Amount */}
                {selectedEntity.amount !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Amount</p>
                    <p className="font-semibold text-gray-900">
                      ${selectedEntity.amount.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Date */}
                {selectedEntity.date && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedEntity.date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Section */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="space-y-3">
                  <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Open Full Details
                  </button>
                  <button className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    Add Comment
                  </button>
                  <button className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    Attach Document
                  </button>
                  <button className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    Update Status
                  </button>
                </div>
              </div>

              {/* Metadata Section */}
              {selectedEntity.metadata &&
                Object.keys(selectedEntity.metadata).length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Additional Info</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedEntity.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

              {/* Danger Zone */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-red-600 mb-4">Danger Zone</h4>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to delete ${selectedEntity.title}?`
                      )
                    ) {
                      deleteEntity(selectedEntity.id);
                    }
                  }}
                  className="w-full px-4 py-3 bg-red-50 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  Delete Entity
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Entity ID: {selectedEntity.id}</span>
                <button
                  onClick={closeDrawer}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
