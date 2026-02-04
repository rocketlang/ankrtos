/**
 * Master Reply Notification Toast
 *
 * Real-time toast notification when a master replies to an alert.
 * Shows intent and extracted information.
 */

import { useEffect, useState } from 'react';
import { MessageCircle, X, CheckCircle, Clock, HelpCircle } from 'lucide-react';

interface MasterReplyNotificationProps {
  alert: {
    id: string;
    vesselName: string;
    reply: string;
    replyParsed?: {
      intent: string;
      confidence: number;
      entities?: any;
    };
  };
  onClose: () => void;
  onView?: () => void;
  autoCloseDelay?: number; // milliseconds
}

export function MasterReplyNotification({
  alert,
  onClose,
  onView,
  autoCloseDelay = 10000
}: MasterReplyNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto close
    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseDelay);

    return () => clearTimeout(timer);
  }, [autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for slide out animation
  };

  const intent = alert.replyParsed?.intent || 'UNKNOWN';
  const confidence = alert.replyParsed?.confidence || 0;

  const intentConfig = {
    READY: {
      icon: CheckCircle,
      color: 'green',
      label: 'Ready',
      description: 'Master confirmed documents are ready'
    },
    DELAY: {
      icon: Clock,
      color: 'orange',
      label: 'Delay',
      description: 'Master reported a delay'
    },
    QUESTION: {
      icon: HelpCircle,
      color: 'blue',
      label: 'Question',
      description: 'Master has a question'
    },
    CONFIRM: {
      icon: CheckCircle,
      color: 'green',
      label: 'Confirmed',
      description: 'Master confirmed'
    },
    UNKNOWN: {
      icon: MessageCircle,
      color: 'gray',
      label: 'Message',
      description: 'New message from master'
    }
  };

  const config = intentConfig[intent as keyof typeof intentConfig] || intentConfig.UNKNOWN;
  const Icon = config.icon;

  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800'
  };

  const iconColorClasses = {
    green: 'text-green-600',
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    gray: 'text-gray-600'
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`w-96 p-4 rounded-lg border-2 shadow-lg ${
          colorClasses[config.color as keyof typeof colorClasses]
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <Icon className={`h-5 w-5 mt-0.5 ${iconColorClasses[config.color as keyof typeof iconColorClasses]}`} />
            <div>
              <div className="font-semibold text-sm">Master Reply Received</div>
              <div className="text-xs opacity-75">{alert.vesselName}</div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-black hover:bg-opacity-10 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Intent Badge */}
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-white bg-opacity-50">
            {config.label}
            {confidence > 0 && (
              <span className="opacity-75">({Math.round(confidence * 100)}%)</span>
            )}
          </span>
        </div>

        {/* Reply Text */}
        <div className="mb-3">
          <div className="text-xs font-medium mb-1">{config.description}:</div>
          <div className="text-sm bg-white bg-opacity-50 p-2 rounded">
            "{alert.reply}"
          </div>
        </div>

        {/* Extracted Entities */}
        {alert.replyParsed?.entities && Object.keys(alert.replyParsed.entities).length > 0 && (
          <div className="mb-3 text-xs">
            <div className="font-medium mb-1">Detected:</div>
            <ul className="ml-3 space-y-0.5">
              {alert.replyParsed.entities.delayHours && (
                <li>• Delay: {alert.replyParsed.entities.delayHours} hours</li>
              )}
              {alert.replyParsed.entities.delayReason && (
                <li>• Reason: {alert.replyParsed.entities.delayReason}</li>
              )}
              {alert.replyParsed.entities.documents?.length > 0 && (
                <li>• Documents: {alert.replyParsed.entities.documents.join(', ')}</li>
              )}
              {alert.replyParsed.entities.question && (
                <li>• Question: {alert.replyParsed.entities.question}</li>
              )}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {onView && (
            <button
              onClick={onView}
              className="flex-1 px-3 py-1.5 bg-white bg-opacity-80 hover:bg-opacity-100 rounded text-sm font-medium"
            >
              View Details
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-3 py-1.5 bg-white bg-opacity-80 hover:bg-opacity-100 rounded text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
