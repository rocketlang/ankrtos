/**
 * Export Actions Component
 *
 * Provides export and reporting actions for arrival data.
 * Supports CSV, JSON, PDF, print, and email.
 */

import React, { useState } from 'react';
import { Download, FileText, Printer, Mail, Copy, FileSpreadsheet, CheckCircle } from 'lucide-react';
import {
  exportToCSV,
  exportToJSON,
  exportPDAAsHTML,
  printPDA,
  copyToClipboard,
  generateMasterEmail
} from '../lib/utils/export';
import { useToast } from './Toast';

interface ExportActionsProps {
  arrivals: any[];
  arrival?: any; // Single arrival for PDA
  variant?: 'dropdown' | 'buttons';
}

export default function ExportActions({ arrivals, arrival, variant = 'dropdown' }: ExportActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();

  const handleExportCSV = () => {
    const filename = `arrivals_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(arrivals, filename);
    toast.success('Exported to CSV', `${arrivals.length} arrivals exported`);
    setIsOpen(false);
  };

  const handleExportJSON = () => {
    const filename = `arrivals_${new Date().toISOString().split('T')[0]}.json`;
    exportToJSON(arrivals, filename);
    toast.success('Exported to JSON', `${arrivals.length} arrivals exported`);
    setIsOpen(false);
  };

  const handleExportPDA = () => {
    if (!arrival) return;
    exportPDAAsHTML(arrival);
    toast.success('PDA Generated', 'Pre-Departure Advisory exported');
    setIsOpen(false);
  };

  const handlePrintPDA = () => {
    if (!arrival) return;
    printPDA(arrival);
    toast.info('Opening Print Dialog', 'Print preview opened');
    setIsOpen(false);
  };

  const handleCopy = async () => {
    if (!arrival) return;
    const success = await copyToClipboard(arrival);
    if (success) {
      toast.success('Copied to Clipboard', 'Arrival summary copied');
    } else {
      toast.error('Copy Failed', 'Could not copy to clipboard');
    }
    setIsOpen(false);
  };

  const handleEmailMaster = () => {
    if (!arrival) return;
    const { subject, body } = generateMasterEmail(arrival);

    // Create mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    toast.info('Opening Email Client', 'Email template ready');
    setIsOpen(false);
  };

  if (variant === 'buttons') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {arrivals.length > 0 && (
          <>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FileText className="w-4 h-4" />
              JSON
            </button>
          </>
        )}
        {arrival && (
          <>
            <button
              onClick={handleExportPDA}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              PDA
            </button>
            <button
              onClick={handlePrintPDA}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleEmailMaster}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </>
        )}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Download className="w-4 h-4" />
        Export
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 z-20 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="py-1">
              {arrivals.length > 0 && (
                <>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    <div className="text-left">
                      <div className="font-medium">Export to CSV</div>
                      <div className="text-xs text-gray-500">{arrivals.length} arrivals</div>
                    </div>
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium">Export to JSON</div>
                      <div className="text-xs text-gray-500">Data format</div>
                    </div>
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                </>
              )}

              {arrival && (
                <>
                  <button
                    onClick={handleExportPDA}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium">Generate PDA</div>
                      <div className="text-xs text-gray-500">Pre-Departure Advisory</div>
                    </div>
                  </button>
                  <button
                    onClick={handlePrintPDA}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Printer className="w-4 h-4 text-gray-600" />
                    <div className="text-left">
                      <div className="font-medium">Print PDA</div>
                      <div className="text-xs text-gray-500">Print preview</div>
                    </div>
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    onClick={handleEmailMaster}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Mail className="w-4 h-4 text-purple-600" />
                    <div className="text-left">
                      <div className="font-medium">Email to Master</div>
                      <div className="text-xs text-gray-500">Alert template</div>
                    </div>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                    <div className="text-left">
                      <div className="font-medium">Copy Summary</div>
                      <div className="text-xs text-gray-500">To clipboard</div>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Batch Export Component
 * For exporting multiple arrivals with selection
 */
export function BatchExportActions({ arrivals }: { arrivals: any[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toast = useToast();

  const handleSelectAll = () => {
    if (selectedIds.size === arrivals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(arrivals.map((a) => a.arrivalId)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchExport = () => {
    const selected = arrivals.filter((a) => selectedIds.has(a.arrivalId));
    if (selected.length === 0) {
      toast.warning('No Selection', 'Please select arrivals to export');
      return;
    }

    exportToCSV(selected, `selected_arrivals_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Exported Selected', `${selected.length} arrivals exported`);
    setSelectedIds(new Set());
  };

  if (arrivals.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedIds.size === arrivals.length}
            onChange={handleSelectAll}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
          </span>
        </div>

        {selectedIds.size > 0 && (
          <button
            onClick={handleBatchExport}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export Selected
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {arrivals.map((arrival) => (
          <label
            key={arrival.arrivalId}
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(arrival.arrivalId)}
              onChange={() => handleToggleSelect(arrival.arrivalId)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1 text-sm">
              <div className="font-medium text-gray-900">{arrival.vessel.name}</div>
              <div className="text-gray-500">{arrival.port.name}</div>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(arrival.eta).toLocaleDateString()}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
