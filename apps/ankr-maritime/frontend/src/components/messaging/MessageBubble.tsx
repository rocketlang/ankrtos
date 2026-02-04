/**
 * Message Bubble - Individual message display
 */

import { format } from 'date-fns';
import { Check, CheckCheck, Sparkles, Image as ImageIcon, FileText, Video, Mic } from 'lucide-react';

type Channel = 'email' | 'whatsapp' | 'slack' | 'teams' | 'webchat' | 'ticket' | 'sms';

interface Message {
  id: string;
  channel: Channel;
  channelMessageId: string;
  threadId: string;
  from: string;
  fromName?: string;
  to: string[];
  content: string;
  contentType: string;
  mediaUrl?: string;
  direction: 'inbound' | 'outbound';
  status: 'received' | 'sent' | 'delivered' | 'read' | 'failed';
  aiGenerated: boolean;
  receivedAt: string;
  metadata?: any;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound';
  const time = format(new Date(message.receivedAt), 'HH:mm');
  const displayName = message.fromName || message.from;

  const renderMediaPreview = () => {
    if (!message.mediaUrl) return null;

    switch (message.contentType) {
      case 'image':
        return (
          <div className="mb-2">
            <img
              src={message.mediaUrl}
              alt="Attached image"
              className="max-w-sm rounded-lg border border-gray-200"
            />
          </div>
        );
      case 'document':
        return (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FileText className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              {message.metadata?.filename || 'Document'}
            </span>
          </a>
        );
      case 'video':
        return (
          <div className="mb-2">
            <video
              src={message.mediaUrl}
              controls
              className="max-w-sm rounded-lg border border-gray-200"
            />
          </div>
        );
      case 'voice':
      case 'audio':
        return (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <Mic className="w-5 h-5 text-gray-600" />
            <audio src={message.mediaUrl} controls className="flex-1" />
          </div>
        );
      default:
        return null;
    }
  };

  const renderStatusIcon = () => {
    if (!isOutbound) return null;

    switch (message.status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <span className="text-xs text-red-500">Failed</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOutbound ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Sender Name (for inbound messages) */}
        {!isOutbound && (
          <div className="mb-1 px-1">
            <span className="text-xs font-medium text-gray-600">{displayName}</span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl ${
            isOutbound
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
          }`}
        >
          {/* AI Badge */}
          {message.aiGenerated && (
            <div
              className={`mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isOutbound
                  ? 'bg-blue-500 text-blue-100'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>AI Generated</span>
            </div>
          )}

          {/* Media Preview */}
          {renderMediaPreview()}

          {/* Message Content */}
          {message.content && (
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.content}
            </div>
          )}

          {/* Time & Status */}
          <div
            className={`mt-1 flex items-center justify-end gap-1 text-xs ${
              isOutbound ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            <span>{time}</span>
            {renderStatusIcon()}
          </div>
        </div>

        {/* Metadata (if needed) */}
        {message.metadata?.edited && (
          <div className="mt-1 px-1">
            <span className="text-xs text-gray-500 italic">Edited</span>
          </div>
        )}
      </div>
    </div>
  );
}
