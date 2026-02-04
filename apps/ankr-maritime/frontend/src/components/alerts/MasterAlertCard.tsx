/**
 * Master Alert Card Component
 *
 * Displays an individual master alert with:
 * - Color-coded priority badge
 * - Status indicator (sent, delivered, read, replied)
 * - Delivery channels
 * - Reply content if master responded
 * - Actions (resend, acknowledge)
 */

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  Clock,
  Mail,
  MessageSquare,
  Phone,
  CheckCircle,
  AlertCircle,
  Send,
  Eye,
  MessageCircle,
  XCircle
} from 'lucide-react';

const RESEND_ALERT = gql`
  mutation ResendAlert($alertId: String!) {
    resendAlert(alertId: $alertId) {
      id
      deliveryStatus
      sentAt
    }
  }
`;

const ACKNOWLEDGE_REPLY = gql`
  mutation AcknowledgeMasterReply($alertId: String!, $agentNote: String) {
    acknowledgeMasterReply(alertId: $alertId, agentNote: $agentNote) {
      id
      acknowledgedAt
      actionTaken
    }
  }
`;

interface MasterAlertCardProps {
  alert: {
    id: string;
    alertType: string;
    title: string;
    message: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    channels: string[];
    recipientEmail?: string;
    recipientPhone?: string;
    sentAt?: string;
    deliveredAt?: string;
    readAt?: string;
    acknowledgedAt?: string;
    repliedAt?: string;
    reply?: string;
    replyParsed?: {
      intent: string;
      confidence: number;
      entities: any;
    };
    actionTaken?: string;
    failedAt?: string;
    failureReason?: string;
    deliveryStatus: string;
    isDelivered: boolean;
    isRead: boolean;
    hasReply: boolean;
    requiresAction: boolean;
    createdAt: string;
  };
  onAcknowledged?: () => void;
}

export function MasterAlertCard({ alert, onAcknowledged }: MasterAlertCardProps) {
  const [resendAlert, { loading: resending }] = useMutation(RESEND_ALERT);
  const [acknowledgeReply, { loading: acknowledging }] = useMutation(ACKNOWLEDGE_REPLY);
  const [agentNote, setAgentNote] = useState('');
  const [showAcknowledgeForm, setShowAcknowledgeForm] = useState(false);

  const handleResend = async () => {
    try {
      await resendAlert({ variables: { alertId: alert.id } });
    } catch (error) {
      console.error('Failed to resend alert:', error);
    }
  };

  const handleAcknowledge = async () => {
    try {
      await acknowledgeReply({
        variables: {
          alertId: alert.id,
          agentNote: agentNote || undefined
        }
      });
      setShowAcknowledgeForm(false);
      setAgentNote('');
      onAcknowledged?.();
    } catch (error) {
      console.error('Failed to acknowledge reply:', error);
    }
  };

  const priorityColors = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-300',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    LOW: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const statusIcons = {
    PENDING: Clock,
    SENT: Send,
    DELIVERED: CheckCircle,
    READ: Eye,
    ACKNOWLEDGED: CheckCircle,
    FAILED: XCircle
  };

  const StatusIcon = statusIcons[alert.deliveryStatus as keyof typeof statusIcons] || Clock;

  const intentColors = {
    READY: 'text-green-600',
    DELAY: 'text-orange-600',
    QUESTION: 'text-blue-600',
    CONFIRM: 'text-green-600',
    UNKNOWN: 'text-gray-600'
  };

  return (
    <div className={`border rounded-lg p-4 ${alert.requiresAction ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium border ${priorityColors[alert.priority]}`}>
            {alert.priority}
          </span>
          <span className="text-sm text-gray-600">
            {alert.alertType.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <StatusIcon className="h-4 w-4" />
          <span>{alert.deliveryStatus}</span>
        </div>
      </div>

      {/* Title & Message */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 mb-1">{alert.title}</h4>
        <p className="text-sm text-gray-600">{alert.message}</p>
      </div>

      {/* Delivery Channels */}
      <div className="flex items-center gap-3 mb-3 text-sm text-gray-500">
        {alert.channels.includes('email') && (
          <div className="flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            <span>Email</span>
          </div>
        )}
        {alert.channels.includes('sms') && (
          <div className="flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            <span>SMS</span>
          </div>
        )}
        {alert.channels.includes('whatsapp') && (
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </div>
        )}
      </div>

      {/* Recipient Info */}
      <div className="text-xs text-gray-500 mb-3">
        {alert.recipientEmail && <div>To: {alert.recipientEmail}</div>}
        {alert.recipientPhone && <div>Phone: {alert.recipientPhone}</div>}
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
        {alert.sentAt && (
          <div>
            <span className="font-medium">Sent:</span>{' '}
            {new Date(alert.sentAt).toLocaleString()}
          </div>
        )}
        {alert.deliveredAt && (
          <div>
            <span className="font-medium">Delivered:</span>{' '}
            {new Date(alert.deliveredAt).toLocaleString()}
          </div>
        )}
        {alert.readAt && (
          <div>
            <span className="font-medium">Read:</span>{' '}
            {new Date(alert.readAt).toLocaleString()}
          </div>
        )}
        {alert.repliedAt && (
          <div>
            <span className="font-medium">Replied:</span>{' '}
            {new Date(alert.repliedAt).toLocaleString()}
          </div>
        )}
      </div>

      {/* Master Reply */}
      {alert.hasReply && (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-start gap-2 mb-2">
            <MessageCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">Master Reply:</span>
                {alert.replyParsed && (
                  <span className={`text-xs font-medium ${intentColors[alert.replyParsed.intent as keyof typeof intentColors]}`}>
                    {alert.replyParsed.intent} ({Math.round(alert.replyParsed.confidence * 100)}%)
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                "{alert.reply}"
              </p>

              {/* Extracted Entities */}
              {alert.replyParsed?.entities && Object.keys(alert.replyParsed.entities).length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <span className="font-medium">Detected:</span>
                  <ul className="ml-4 list-disc">
                    {alert.replyParsed.entities.delayHours && (
                      <li>Delay: {alert.replyParsed.entities.delayHours} hours</li>
                    )}
                    {alert.replyParsed.entities.delayReason && (
                      <li>Reason: {alert.replyParsed.entities.delayReason}</li>
                    )}
                    {alert.replyParsed.entities.documents?.length > 0 && (
                      <li>Documents: {alert.replyParsed.entities.documents.join(', ')}</li>
                    )}
                    {alert.replyParsed.entities.question && (
                      <li>Question: {alert.replyParsed.entities.question}</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Action Taken */}
              {alert.actionTaken && (
                <div className="mt-2 text-xs text-gray-600">
                  <span className="font-medium">Action:</span> {alert.actionTaken}
                </div>
              )}
            </div>
          </div>

          {/* Acknowledge Form */}
          {alert.requiresAction && !alert.acknowledgedAt && (
            <div className="mt-3">
              {!showAcknowledgeForm ? (
                <button
                  onClick={() => setShowAcknowledgeForm(true)}
                  className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                >
                  Acknowledge Reply
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={agentNote}
                    onChange={(e) => setAgentNote(e.target.value)}
                    placeholder="Add note (optional)..."
                    className="w-full px-3 py-2 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAcknowledge}
                      disabled={acknowledging}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {acknowledging ? 'Acknowledging...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowAcknowledgeForm(false)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {alert.acknowledgedAt && (
            <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Acknowledged at {new Date(alert.acknowledgedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Failed Status */}
      {alert.failedAt && (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-start gap-2 text-red-600">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">Delivery Failed</div>
              <div className="text-xs">{alert.failureReason}</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t">
        {(alert.deliveryStatus === 'FAILED' || alert.deliveryStatus === 'PENDING') && (
          <button
            onClick={handleResend}
            disabled={resending}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend Alert'}
          </button>
        )}
      </div>
    </div>
  );
}
