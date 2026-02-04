/**
 * Bug Report Modal
 *
 * Structured bug reporting form with severity levels,
 * reproduction steps, and automatic context capture.
 */

import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import {
  AlertTriangle, X, Camera, CheckCircle, Loader, AlertCircle
} from 'lucide-react';

const REPORT_BUG = gql`
  mutation ReportBug($input: BugReportInput!) {
    reportBug(input: $input) {
      id
      title
      severity
      status
      createdAt
    }
  }
`;

const SEVERITY_LEVELS = [
  {
    value: 'CRITICAL',
    label: 'Critical',
    description: 'App is unusable or data loss',
    color: 'red',
    icon: '🔴',
  },
  {
    value: 'HIGH',
    label: 'High',
    description: 'Major feature broken',
    color: 'orange',
    icon: '🟠',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    description: 'Feature works but has issues',
    color: 'yellow',
    icon: '🟡',
  },
  {
    value: 'LOW',
    label: 'Low',
    description: 'Minor issue or cosmetic',
    color: 'blue',
    icon: '🔵',
  },
];

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const [step, setStep] = useState(1); // 1=Basic, 2=Details, 3=Success
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [screenshot, setScreenshot] = useState('');

  const [reportBug, { loading, error }] = useMutation(REPORT_BUG);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !severity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await reportBug({
        variables: {
          input: {
            title,
            description,
            severity,
            stepsToReproduce: stepsToReproduce || null,
            screenshot: screenshot || null,
            url: window.location.href,
            browser: navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown',
            userAgent: navigator.userAgent,
          },
        },
      });

      setStep(3); // Success step

      // Auto-close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      console.error('Failed to submit bug report:', err);
    }
  };

  const handleClose = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setSeverity('');
    setStepsToReproduce('');
    setScreenshot('');
    onClose();
  };

  const captureScreenshot = () => {
    // Placeholder for screenshot capture
    const url = prompt('Enter screenshot URL (optional):');
    if (url) {
      setScreenshot(url);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="text-xl font-bold">Report a Bug</h2>
          </div>
          <button
            onClick={handleClose}
            className="hover:bg-white/20 p-2 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bug Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of the issue"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: "Cannot submit voyage estimate form"
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Severity *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {SEVERITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setSeverity(level.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        severity === level.value
                          ? `border-${level.color}-500 bg-${level.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{level.icon}</span>
                        <span className="font-semibold text-gray-900">{level.label}</span>
                      </div>
                      <p className="text-xs text-gray-600">{level.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened and what you expected to happen..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleClose}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!title.trim() || !description.trim() || !severity}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Next: Add Details
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Detailed Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Steps to Reproduce (Optional but helpful)
                </label>
                <textarea
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  placeholder={'1. Go to...\n2. Click on...\n3. Enter...\n4. See error'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none font-mono text-sm"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Helps us reproduce and fix the bug faster
                </p>
              </div>

              <div>
                <button
                  onClick={captureScreenshot}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Camera className="h-4 w-4" />
                  {screenshot ? 'Screenshot added ✓' : 'Add screenshot (optional)'}
                </button>
              </div>

              {/* Auto-captured Context */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Automatically Captured:
                </h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Page URL:</span>
                    <span className="font-mono text-gray-900 truncate max-w-xs">
                      {window.location.href}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Browser:</span>
                    <span className="font-mono text-gray-900">
                      {navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Screen Size:</span>
                    <span className="font-mono text-gray-900">
                      {window.innerWidth}x{window.innerHeight}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">
                    Failed to submit bug report. Please try again.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Bug Report
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-8">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Bug Report Submitted!</h3>
              <p className="text-gray-600 mb-6">
                Thank you for helping us improve Mari8X.
                <br />
                We'll investigate and get back to you soon.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
                <p className="text-sm text-blue-800">
                  <strong>Ticket ID:</strong> We'll notify you of updates via email
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
