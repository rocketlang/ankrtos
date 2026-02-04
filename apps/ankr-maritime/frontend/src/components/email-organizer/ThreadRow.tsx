/**
 * Thread Row Component
 * Individual email thread preview card
 */

import React from 'react';
import {
  Star,
  Archive,
  Circle,
  CheckCircle,
  AlertCircle,
  Clock,
  Tag as TagIcon,
} from 'lucide-react';

interface Thread {
  id: string;
  subject: string;
  participants: string[];
  messageCount: number;
  unreadCount: number;
  category?: string | null;
  urgency?: string | null;
  urgencyScore?: number | null;
  actionable?: string | null;
  labels: string[];
  isStarred: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ThreadRowProps {
  thread: Thread;
  isSelected: boolean;
  isActiveThread: boolean;
  onSelect: () => void;
  onClick: () => void;
  onStar: () => void;
  onArchive: () => void;
  onMarkRead: (read: boolean) => void;
}

export const ThreadRow: React.FC<ThreadRowProps> = ({
  thread,
  isSelected,
  isActiveThread,
  onSelect,
  onClick,
  onStar,
  onArchive,
  onMarkRead,
}) => {
  const isUnread = thread.unreadCount > 0;

  // Get first participant (sender)
  const sender = thread.participants[0] || 'Unknown';
  const senderName = sender.split('@')[0].replace(/[._]/g, ' ').trim();
  const senderInitials = senderName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Get relative time
  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get urgency badge
  const getUrgencyBadge = () => {
    if (!thread.urgency || thread.urgency === 'low') return null;

    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    };

    const color = colors[thread.urgency as keyof typeof colors];

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-full ${color}`}
      >
        <AlertCircle className="w-3 h-3" />
        {thread.urgency}
      </span>
    );
  };

  // Get category badge
  const getCategoryBadge = () => {
    if (!thread.category) return null;

    const colors: Record<string, string> = {
      fixture: 'bg-blue-100 text-blue-700',
      operations: 'bg-purple-100 text-purple-700',
      claims: 'bg-red-100 text-red-700',
      bunker: 'bg-green-100 text-green-700',
      compliance: 'bg-gray-100 text-gray-700',
    };

    const color = colors[thread.category] || 'bg-gray-100 text-gray-700';

    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${color}`}>
        {thread.category}
      </span>
    );
  };

  // Get actionable icon
  const getActionableIcon = () => {
    switch (thread.actionable) {
      case 'requires_response':
        return <CheckCircle className="w-4 h-4 text-blue-500" title="Requires response" />;
      case 'requires_approval':
        return <AlertCircle className="w-4 h-4 text-orange-500" title="Requires approval" />;
      case 'requires_action':
        return <Clock className="w-4 h-4 text-purple-500" title="Requires action" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
        hover:bg-gray-50
        ${isActiveThread ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}
        ${isUnread ? 'bg-white' : 'bg-gray-50'}
      `}
      onClick={onClick}
    >
      {/* Selection Checkbox */}
      <div onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-4 h-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Star Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStar();
        }}
        className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
      >
        <Star
          className={`w-4 h-4 ${
            thread.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
          }`}
        />
      </button>

      {/* Avatar */}
      <div
        className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
          ${isUnread ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}
        `}
      >
        {senderInitials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2 mb-1">
          {/* Sender */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
              {senderName}
            </span>
            {thread.messageCount > 1 && (
              <span className="flex-shrink-0 text-xs text-gray-500">
                ({thread.messageCount})
              </span>
            )}
          </div>

          {/* Time */}
          <span className="flex-shrink-0 text-xs text-gray-500">
            {getRelativeTime(thread.updatedAt)}
          </span>
        </div>

        {/* Subject Row */}
        <div className="flex items-center gap-2 mb-1">
          {/* Unread Indicator */}
          {isUnread && <Circle className="w-2 h-2 fill-blue-600 text-blue-600 flex-shrink-0" />}

          {/* Subject */}
          <h3
            className={`text-sm truncate flex-1 ${
              isUnread ? 'font-medium text-gray-900' : 'text-gray-600'
            }`}
          >
            {thread.subject}
          </h3>

          {/* Actionable Icon */}
          <div className="flex-shrink-0">{getActionableIcon()}</div>
        </div>

        {/* Badges & Labels Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category */}
          {getCategoryBadge()}

          {/* Urgency */}
          {getUrgencyBadge()}

          {/* Labels */}
          {thread.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-600 bg-gray-100 rounded"
            >
              <TagIcon className="w-3 h-3" />
              {label}
            </span>
          ))}

          {thread.labels.length > 3 && (
            <span className="text-xs text-gray-500">+{thread.labels.length - 3}</span>
          )}
        </div>
      </div>

      {/* Actions (show on hover) */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title="Archive"
        >
          <Archive className="w-4 h-4 text-gray-600" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(!isUnread);
          }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title={isUnread ? 'Mark as read' : 'Mark as unread'}
        >
          {isUnread ? (
            <CheckCircle className="w-4 h-4 text-gray-600" />
          ) : (
            <Circle className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>
    </div>
  );
};
