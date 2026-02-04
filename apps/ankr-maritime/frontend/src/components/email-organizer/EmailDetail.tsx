/**
 * Email Detail Component
 * Full email view with content, attachments, and actions
 * Integrated with AI Response Drafter
 */

import React, { useState } from 'react';
import {
  Reply,
  ReplyAll,
  Forward,
  Printer,
  Download,
  Star,
  Archive,
  Trash,
  MoreVertical,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  DollarSign,
  Ship,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AIResponseDrafter } from './AIResponseDrafter';

interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  attachments?: Array<{ name: string; size: number; type: string }>;
  receivedAt: string;
  isRead: boolean;
  category?: string;
  urgency?: string;
  entities?: Record<string, any[]>;
  summary?: string;
  keyPoints?: string[];
  action?: string;
}

interface Thread {
  id: string;
  subject: string;
  messages?: EmailMessage[];
  messageCount: number;
  isStarred: boolean;
}

interface EmailDetailProps {
  thread: Thread | null;
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
  onStar?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
  thread,
  onReply,
  onReplyAll,
  onForward,
  onStar,
  onArchive,
  onDelete,
}) => {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [showSummary, setShowSummary] = useState(true);
  const [showAIResponse, setShowAIResponse] = useState(false);

  if (!thread) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-1">No email selected</p>
          <p className="text-sm text-gray-500">Select an email to view details</p>
        </div>
      </div>
    );
  }

  // For now, create a mock message from thread data
  const latestMessage: EmailMessage = {
    id: thread.id,
    from: 'sender@example.com',
    to: ['recipient@example.com'],
    subject: thread.subject,
    body: 'Email body content will be loaded here...',
    receivedAt: new Date().toISOString(),
    isRead: true,
  };

  const messages = thread.messages || [latestMessage];
  const latestMsg = messages[messages.length - 1];

  const toggleMessageExpand = (messageId: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getInitials = (email: string) => {
    const name = email.split('@')[0].replace(/[._]/g, ' ');
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onStar}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Star"
          >
            <Star
              className={`w-5 h-5 ${
                thread.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
              }`}
            />
          </button>

          <button
            onClick={onArchive}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Archive"
          >
            <Archive className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={onDelete}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Delete"
          >
            <Trash className="w-5 h-5 text-gray-600" />
          </button>

          <div className="h-6 w-px bg-gray-300" />

          <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="More actions">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Subject */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">{thread.subject}</h1>

        {/* AI Summary Card */}
        {latestMsg.summary && showSummary && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-semibold text-purple-900">AI Summary</h3>
              </div>
              <button
                onClick={() => setShowSummary(false)}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Hide
              </button>
            </div>

            <p className="text-sm text-gray-700 mb-3">{latestMsg.summary}</p>

            {latestMsg.keyPoints && latestMsg.keyPoints.length > 0 && (
              <div className="space-y-1 mb-3">
                {latestMsg.keyPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-purple-600">•</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            )}

            {latestMsg.action && (
              <div className="flex items-center gap-2 pt-3 border-t border-purple-200">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700">{latestMsg.action}</span>
              </div>
            )}
          </div>
        )}

        {/* Extracted Entities */}
        {latestMsg.entities && Object.keys(latestMsg.entities).length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            {latestMsg.entities.vessel?.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Ship className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-xs text-blue-600 font-medium">Vessel</div>
                  <div className="text-sm text-blue-900">{latestMsg.entities.vessel[0].value}</div>
                </div>
              </div>
            )}

            {latestMsg.entities.port?.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <MapPin className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-xs text-green-600 font-medium">Port</div>
                  <div className="text-sm text-green-900">{latestMsg.entities.port[0].value}</div>
                </div>
              </div>
            )}

            {latestMsg.entities.date?.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <Calendar className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="text-xs text-purple-600 font-medium">Date</div>
                  <div className="text-sm text-purple-900">{latestMsg.entities.date[0].value}</div>
                </div>
              </div>
            )}

            {latestMsg.entities.amount?.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <DollarSign className="w-4 h-4 text-orange-600" />
                <div>
                  <div className="text-xs text-orange-600 font-medium">Amount</div>
                  <div className="text-sm text-orange-900">{latestMsg.entities.amount[0].value}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4">
          {messages.map((message, index) => {
            const isExpanded = expandedMessages.has(message.id) || index === messages.length - 1;
            const isLatest = index === messages.length - 1;

            return (
              <div
                key={message.id}
                className={`border border-gray-200 rounded-lg overflow-hidden ${
                  isLatest ? 'border-blue-300' : ''
                }`}
              >
                {/* Message Header */}
                <div
                  onClick={() => !isLatest && toggleMessageExpand(message.id)}
                  className={`flex items-center justify-between p-4 ${
                    !isLatest ? 'cursor-pointer hover:bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {getInitials(message.from)}
                    </div>

                    {/* Sender Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{message.from}</span>
                        {!isLatest && (
                          <span className="text-sm text-gray-500">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        to {message.to.join(', ')}
                        {message.cc && message.cc.length > 0 && (
                          <span className="text-gray-500"> (cc: {message.cc.join(', ')})</span>
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    <span className="text-sm text-gray-500">{formatDate(message.receivedAt)}</span>
                  </div>
                </div>

                {/* Message Body */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <div className="py-4 text-gray-700 whitespace-pre-wrap">{message.body}</div>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {message.attachments.map((attachment, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Paperclip className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {attachment.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {(attachment.size / 1024).toFixed(1)} KB
                                </div>
                              </div>
                            </div>
                            <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions (only on latest message) */}
                    {isLatest && (
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                        <button
                          onClick={() => setShowAIResponse(!showAIResponse)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            showAIResponse
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                          {showAIResponse ? 'Hide AI Response' : 'AI Reply'}
                        </button>
                        <button
                          onClick={onReply}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Reply className="w-4 h-4" />
                          Reply
                        </button>
                        <button
                          onClick={onReplyAll}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <ReplyAll className="w-4 h-4" />
                          Reply All
                        </button>
                        <button
                          onClick={onForward}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Forward className="w-4 h-4" />
                          Forward
                        </button>

                        <div className="ml-auto flex items-center gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                            <Printer className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI Response Drafter */}
        {showAIResponse && (
          <div className="mt-6">
            <AIResponseDrafter
              originalEmail={{
                subject: latestMsg.subject,
                body: latestMsg.body,
                from: latestMsg.from,
                to: latestMsg.to,
                category: latestMsg.category,
                urgency: latestMsg.urgency,
                entities: latestMsg.entities,
              }}
              onSend={(draft) => {
                console.log('Sending draft:', draft);
                // TODO: Integrate with email sending service
                alert(`Email sent!\nSubject: ${draft.subject}`);
                setShowAIResponse(false);
              }}
              onSave={(draft) => {
                console.log('Saving draft:', draft);
                alert('Draft saved successfully!');
              }}
              onCancel={() => setShowAIResponse(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
