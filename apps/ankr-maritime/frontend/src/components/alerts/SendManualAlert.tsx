/**
 * Send Manual Alert Modal
 *
 * Allows port agents to send custom alerts to vessel masters with:
 * - Message composer with templates
 * - Channel selection (email, SMS, WhatsApp)
 * - Priority level
 * - Preview before sending
 */

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { X, Send, Mail, Phone, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

const SEND_MANUAL_ALERT = gql`
  mutation SendManualAlert(
    $arrivalId: String!
    $message: String!
    $channels: [AlertChannel!]!
    $priority: AlertPriority
  ) {
    sendManualAlert(
      arrivalId: $arrivalId
      message: $message
      channels: $channels
      priority: $priority
    ) {
      id
      sentAt
      deliveryStatus
    }
  }
`;

interface SendManualAlertProps {
  arrivalId: string;
  vesselName: string;
  portName: string;
  eta: string;
  onClose: () => void;
  onSent?: () => void;
}

type Channel = 'email' | 'sms' | 'whatsapp' | 'telegram';
type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

const MESSAGE_TEMPLATES = [
  {
    id: 'document_reminder',
    label: 'Document Reminder',
    message: 'Reminder: Please submit the following documents before arrival:\n\n- Crew List\n- Last Port Clearance\n- Cargo Declaration\n\nReply READY when documents are submitted.'
  },
  {
    id: 'eta_confirmation',
    label: 'ETA Confirmation',
    message: 'Please confirm your current ETA to {{PORT}}.\n\nCurrent ETA: {{ETA}}\n\nReply CONFIRM if correct or provide updated ETA.'
  },
  {
    id: 'port_readiness',
    label: 'Port Readiness Check',
    message: 'Port readiness update:\n\nBerth: Available\nPilotage: Confirmed\nDocuments: Pending review\n\nPlease complete outstanding items. Reply with any questions.'
  },
  {
    id: 'urgent_action',
    label: 'Urgent Action Required',
    message: 'URGENT: Immediate action required for {{VESSEL}}.\n\n{{ACTION}}\n\nPlease respond as soon as possible.'
  },
  {
    id: 'custom',
    label: 'Custom Message',
    message: ''
  }
];

export function SendManualAlert({
  arrivalId,
  vesselName,
  portName,
  eta,
  onClose,
  onSent
}: SendManualAlertProps) {
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [channels, setChannels] = useState<Channel[]>(['email']);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [showPreview, setShowPreview] = useState(false);

  const [sendAlert, { loading, error, data }] = useMutation(SEND_MANUAL_ALERT);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      let msg = template.message;
      // Replace placeholders
      msg = msg.replace(/\{\{PORT\}\}/g, portName);
      msg = msg.replace(/\{\{VESSEL\}\}/g, vesselName);
      msg = msg.replace(/\{\{ETA\}\}/g, new Date(eta).toLocaleString());
      setMessage(msg);
    }
  };

  const toggleChannel = (channel: Channel) => {
    if (channels.includes(channel)) {
      setChannels(channels.filter((c) => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    if (channels.length === 0) return;

    try {
      await sendAlert({
        variables: {
          arrivalId,
          message: message.trim(),
          channels,
          priority
        }
      });
      onSent?.();
      setTimeout(() => onClose(), 2000); // Close after success message
    } catch (err) {
      console.error('Failed to send alert:', err);
    }
  };

  const characterCount = message.length;
  const smsCharacterLimit = 160;
  const willBeTruncatedForSMS = channels.includes('sms') && characterCount > smsCharacterLimit;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Manual Alert
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {vesselName} → {portName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {data ? (
          // Success State
          <div className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Alert Sent!</h3>
            <p className="text-gray-600 mb-4">
              Your alert has been queued for delivery via {channels.join(', ')}.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        ) : (
          // Form
          <div className="p-6 space-y-6">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MESSAGE_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message to the master..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={8}
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${willBeTruncatedForSMS ? 'text-orange-600' : 'text-gray-500'}`}>
                  {characterCount} characters
                  {willBeTruncatedForSMS && ` (SMS will be truncated at ${smsCharacterLimit})`}
                </span>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>

              {showPreview && message && (
                <div className="mt-3 p-3 bg-gray-50 border rounded-lg">
                  <div className="text-xs text-gray-600 mb-2 font-medium">Preview:</div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{message}</div>
                </div>
              )}
            </div>

            {/* Delivery Channels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Channels *
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => toggleChannel('email')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                    channels.includes('email')
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span className="text-sm font-medium">Email</span>
                </button>

                <button
                  onClick={() => toggleChannel('sms')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                    channels.includes('sms')
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-medium">SMS</span>
                </button>

                <button
                  onClick={() => toggleChannel('whatsapp')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                    channels.includes('whatsapp')
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="flex gap-2">
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                      priority === p
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleSend}
                disabled={loading || !message.trim() || channels.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Alert
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
