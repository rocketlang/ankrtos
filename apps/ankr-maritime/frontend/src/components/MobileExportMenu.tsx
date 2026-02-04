/**
 * Mobile Export Menu Component
 *
 * Mobile-optimized export menu using bottom sheet.
 * Larger touch targets and better organization for mobile devices.
 */

import React from 'react';
import { Download, FileSpreadsheet, FileText, Printer, Mail, Copy, Share2 } from 'lucide-react';
import BottomSheet, { useBottomSheet } from './BottomSheet';
import { useToast } from './Toast';
import {
  exportToCSV,
  exportToJSON,
  exportPDAAsHTML,
  printPDA,
  copyToClipboard,
  generateMasterEmail
} from '../lib/utils/export';

interface MobileExportMenuProps {
  arrivals?: any[];
  arrival?: any;
}

export default function MobileExportMenu({ arrivals, arrival }: MobileExportMenuProps) {
  const { isOpen, open, close } = useBottomSheet();
  const toast = useToast();

  const handleExportCSV = () => {
    if (!arrivals || arrivals.length === 0) return;
    const filename = `arrivals_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(arrivals, filename);
    toast.success('Exported to CSV', `${arrivals.length} arrivals exported`);
    close();
  };

  const handleExportJSON = () => {
    if (!arrivals || arrivals.length === 0) return;
    const filename = `arrivals_${new Date().toISOString().split('T')[0]}.json`;
    exportToJSON(arrivals, filename);
    toast.success('Exported to JSON', `${arrivals.length} arrivals exported`);
    close();
  };

  const handleExportPDA = () => {
    if (!arrival) return;
    exportPDAAsHTML(arrival);
    toast.success('PDA Generated', 'Pre-Departure Advisory exported');
    close();
  };

  const handlePrintPDA = () => {
    if (!arrival) return;
    printPDA(arrival);
    toast.info('Opening Print Dialog', 'Print preview opened');
    close();
  };

  const handleCopy = async () => {
    if (!arrival) return;
    const success = await copyToClipboard(arrival);
    if (success) {
      toast.success('Copied to Clipboard', 'Arrival summary copied');
    } else {
      toast.error('Copy Failed', 'Could not copy to clipboard');
    }
    close();
  };

  const handleEmailMaster = () => {
    if (!arrival) return;
    const { subject, body } = generateMasterEmail(arrival);
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    toast.info('Opening Email Client', 'Email template ready');
    close();
  };

  const handleShare = async () => {
    if (!arrival) return;

    const shareData = {
      title: `Arrival: ${arrival.vessel.name}`,
      text: `${arrival.vessel.name} arriving at ${arrival.port.name} on ${new Date(arrival.eta).toLocaleDateString()}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared', 'Arrival information shared');
        close();
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
          // Fallback to copy
          handleCopy();
        }
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  return (
    <>
      {/* Mobile Export Button */}
      <button
        onClick={open}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-white bg-blue-600 rounded-lg font-medium shadow-sm touch-manipulation"
      >
        <Download className="w-5 h-5" />
        <span>Export</span>
      </button>

      {/* Export Menu Bottom Sheet */}
      <BottomSheet isOpen={isOpen} onClose={close} title="Export & Share" snapPoints={[50, 70]}>
        <div className="space-y-2">
          {/* Bulk Export Options */}
          {arrivals && arrivals.length > 0 && (
            <>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Export All ({arrivals.length})
              </h3>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-4 w-full px-4 py-4 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Export to CSV</div>
                  <div className="text-sm text-gray-500">Open in Excel or Google Sheets</div>
                </div>
              </button>

              <button
                onClick={handleExportJSON}
                className="flex items-center gap-4 w-full px-4 py-4 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Export to JSON</div>
                  <div className="text-sm text-gray-500">Raw data format</div>
                </div>
              </button>

              <div className="border-t border-gray-200 my-4" />
            </>
          )}

          {/* Single Arrival Export Options */}
          {arrival && (
            <>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Current Arrival
              </h3>

              <button
                onClick={handleExportPDA}
                className="flex items-center gap-4 w-full px-4 py-4 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Generate PDA</div>
                  <div className="text-sm text-gray-500">Pre-Departure Advisory document</div>
                </div>
              </button>

              <button
                onClick={handlePrintPDA}
                className="flex items-center gap-4 w-full px-4 py-4 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Printer className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Print PDA</div>
                  <div className="text-sm text-gray-500">Open print dialog</div>
                </div>
              </button>

              <button
                onClick={handleEmailMaster}
                className="flex items-center gap-4 w-full px-4 py-4 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Email to Master</div>
                  <div className="text-sm text-gray-500">Pre-filled alert template</div>
                </div>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-4 w-full px-4 py-4 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Share</div>
                  <div className="text-sm text-gray-500">Share via WhatsApp, Telegram, etc.</div>
                </div>
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-4 w-full px-4 py-4 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Copy className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Copy Summary</div>
                  <div className="text-sm text-gray-500">Copy to clipboard</div>
                </div>
              </button>
            </>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
