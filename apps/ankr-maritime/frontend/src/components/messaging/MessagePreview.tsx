/**
 * Message Preview - Thread preview in inbox list
 */

import { formatDistanceToNow } from 'date-fns';
import { Star, Paperclip } from 'lucide-react';
import { ChannelBadge } from './ChannelBadge';

type Channel = 'email' | 'whatsapp' | 'slack' | 'teams' | 'webchat' | 'ticket' | 'sms';

interface Thread {
  id: string;
  channel: Channel;
  participantId: string;
  participantName?: string;
  subject?: string;
  messageCount: number;
  isRead: boolean;
  isStarred: boolean;
  isPinned: boolean;
  labels: string[];
  lastMessageAt: string;
  createdAt: string;
}

interface MessagePreviewProps {
  thread: Thread;
  selected: boolean;
  onClick: () => void;
}

export function MessagePreview({ thread, selected, onClick }: MessagePreviewProps) {
  const displayName = thread.participantName || thread.participantId;
  const displaySubject = thread.subject || 'No subject';

  const timeAgo = formatDistanceToNow(new Date(thread.lastMessageAt), {
    addSuffix: true,
  });

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 transition-colors hover:bg-gray-50 ${
        selected ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'
      } ${!thread.isRead ? 'bg-blue-50/30' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Channel Badge */}
        <div className="mt-1">
          <ChannelBadge channel={thread.channel} size="md" />
        </div>

        {/* Thread Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Name + Time */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm truncate ${!thread.isRead ? 'font-semibold' : 'font-medium'}`}>
                {displayName}
              </h3>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {thread.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
              <span className="text-xs text-gray-500">{timeAgo}</span>
            </div>
          </div>

          {/* Subject */}
          <p className={`text-sm truncate ${!thread.isRead ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
            {displaySubject}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-2">
            {/* Message Count */}
            <span className="text-xs text-gray-500">
              {thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'}
            </span>

            {/* Labels */}
            {thread.labels.length > 0 && (
              <div className="flex items-center gap-1">
                {thread.labels.slice(0, 2).map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                  >
                    {label}
                  </span>
                ))}
                {thread.labels.length > 2 && (
                  <span className="text-xs text-gray-500">+{thread.labels.length - 2}</span>
                )}
              </div>
            )}

            {/* Unread Indicator */}
            {!thread.isRead && (
              <div className="w-2 h-2 rounded-full bg-blue-600" title="Unread"></div>
            )}

            {/* Pinned Indicator */}
            {thread.isPinned && (
              <span className="text-xs text-gray-500 font-medium">📌 Pinned</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
