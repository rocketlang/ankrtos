/**
 * Thread List Component
 * Gmail-style email thread list with summaries and actions
 */

import React, { useState } from 'react';
import {
  Star,
  Archive,
  Trash,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckSquare,
  Square,
  MoreVertical,
  Tag,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { ThreadRow } from './ThreadRow';

const GET_THREADS = gql`
  query GetEmailThreads($filter: ThreadFilterInput) {
    emailThreads(filter: $filter) {
      id
      subject
      participants
      messageCount
      unreadCount
      category
      urgency
      urgencyScore
      actionable
      labels
      isStarred
      isArchived
      createdAt
      updatedAt
    }
  }
`;

const MARK_THREAD_READ = gql`
  mutation MarkThreadAsRead($threadId: String!, $read: Boolean!) {
    markThreadAsRead(threadId: $threadId, read: $read)
  }
`;

const TOGGLE_THREAD_STAR = gql`
  mutation ToggleThreadStar($threadId: String!, $starred: Boolean) {
    toggleThreadStar(threadId: $threadId, starred: $starred) {
      id
      isStarred
    }
  }
`;

const ARCHIVE_THREAD = gql`
  mutation ArchiveThread($threadId: String!, $archived: Boolean!) {
    archiveThread(threadId: $threadId, archived: $archived) {
      id
      isArchived
    }
  }
`;

const ADD_THREAD_LABELS = gql`
  mutation AddThreadLabels($threadId: String!, $labels: [String!]!) {
    addThreadLabels(threadId: $threadId, labels: $labels) {
      id
      labels
    }
  }
`;

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

interface ThreadListProps {
  folderId?: string;
  onThreadSelect?: (thread: Thread) => void;
  selectedThreadId?: string;
}

export const ThreadList: React.FC<ThreadListProps> = ({
  folderId,
  onThreadSelect,
  selectedThreadId,
}) => {
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterUrgency, setFilterUrgency] = useState<string | undefined>();
  const [showLabelMenu, setShowLabelMenu] = useState<string | null>(null);

  const pageSize = 50;

  const { data, loading, error, refetch } = useQuery(GET_THREADS, {
    variables: {
      filter: {
        category: filterCategory,
        urgency: filterUrgency,
        isArchived: false,
        limit: pageSize,
        offset: currentPage * pageSize,
      },
    },
    pollInterval: 30000, // Refresh every 30s
  });

  const [markThreadRead] = useMutation(MARK_THREAD_READ, {
    onCompleted: () => refetch(),
  });

  const [toggleThreadStar] = useMutation(TOGGLE_THREAD_STAR, {
    onCompleted: () => refetch(),
  });

  const [archiveThread] = useMutation(ARCHIVE_THREAD, {
    onCompleted: () => {
      refetch();
      setSelectedThreads(new Set());
    },
  });

  const [addThreadLabels] = useMutation(ADD_THREAD_LABELS, {
    onCompleted: () => {
      refetch();
      setShowLabelMenu(null);
    },
  });

  const threads: Thread[] = data?.emailThreads || [];
  const allSelected = selectedThreads.size > 0 && selectedThreads.size === threads.length;
  const someSelected = selectedThreads.size > 0 && selectedThreads.size < threads.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedThreads(new Set());
    } else {
      setSelectedThreads(new Set(threads.map((t) => t.id)));
    }
  };

  const toggleSelectThread = (threadId: string) => {
    const newSelected = new Set(selectedThreads);
    if (newSelected.has(threadId)) {
      newSelected.delete(threadId);
    } else {
      newSelected.add(threadId);
    }
    setSelectedThreads(newSelected);
  };

  const handleBulkAction = async (action: 'read' | 'unread' | 'star' | 'unstar' | 'archive' | 'label') => {
    const threadIds = Array.from(selectedThreads);

    switch (action) {
      case 'read':
      case 'unread':
        for (const id of threadIds) {
          await markThreadRead({ variables: { threadId: id, read: action === 'read' } });
        }
        break;

      case 'star':
      case 'unstar':
        for (const id of threadIds) {
          await toggleThreadStar({ variables: { threadId: id, starred: action === 'star' } });
        }
        break;

      case 'archive':
        for (const id of threadIds) {
          await archiveThread({ variables: { threadId: id, archived: true } });
        }
        break;

      case 'label':
        // Show label menu for first selected thread
        setShowLabelMenu(threadIds[0]);
        break;
    }

    if (action !== 'label') {
      setSelectedThreads(new Set());
    }
  };

  const handleAddLabel = async (threadId: string, label: string) => {
    await addThreadLabels({
      variables: {
        threadId,
        labels: [label],
      },
    });
  };

  const getUrgencyColor = (urgency?: string | null) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading && threads.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading emails...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600 mb-2">Failed to load emails</p>
          <button
            onClick={() => refetch()}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        {/* Left: Selection & Actions */}
        <div className="flex items-center gap-3">
          {/* Select All Checkbox */}
          <button
            onClick={toggleSelectAll}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-5 h-5 text-blue-600" />
            ) : someSelected ? (
              <Square className="w-5 h-5 text-blue-600 fill-blue-600 opacity-50" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Bulk Actions */}
          {selectedThreads.size > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-gray-600">{selectedThreads.size} selected</span>
              <div className="h-6 w-px bg-gray-300" />

              <button
                onClick={() => handleBulkAction('archive')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Archive"
              >
                <Archive className="w-4 h-4 text-gray-600" />
              </button>

              <button
                onClick={() => handleBulkAction('star')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Star"
              >
                <Star className="w-4 h-4 text-gray-600" />
              </button>

              <button
                onClick={() => handleBulkAction('read')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Mark as read"
              >
                <CheckSquare className="w-4 h-4 text-gray-600" />
              </button>

              <button
                onClick={() => handleBulkAction('label')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Add label"
              >
                <Tag className="w-4 h-4 text-gray-600" />
              </button>

              <button
                onClick={() => handleBulkAction('archive')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Delete"
              >
                <Trash className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors ml-2"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Right: Filters & Pagination */}
        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <select
            value={filterCategory || ''}
            onChange={(e) => setFilterCategory(e.target.value || undefined)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All Categories</option>
            <option value="fixture">Fixture</option>
            <option value="operations">Operations</option>
            <option value="claims">Claims</option>
            <option value="bunker">Bunker</option>
            <option value="compliance">Compliance</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={filterUrgency || ''}
            onChange={(e) => setFilterUrgency(e.target.value || undefined)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All Urgency</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, threads.length + currentPage * pageSize)}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={threads.length < pageSize}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-1">No emails found</p>
              <p className="text-sm text-gray-500">
                {filterCategory || filterUrgency
                  ? 'Try adjusting your filters'
                  : 'Your inbox is empty'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {threads.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                isSelected={selectedThreads.has(thread.id)}
                isActiveThread={selectedThreadId === thread.id}
                onSelect={() => toggleSelectThread(thread.id)}
                onClick={() => onThreadSelect?.(thread)}
                onStar={async () => {
                  await toggleThreadStar({
                    variables: {
                      threadId: thread.id,
                      starred: !thread.isStarred,
                    },
                  });
                }}
                onArchive={async () => {
                  await archiveThread({
                    variables: {
                      threadId: thread.id,
                      archived: true,
                    },
                  });
                }}
                onMarkRead={async (read: boolean) => {
                  await markThreadRead({
                    variables: {
                      threadId: thread.id,
                      read,
                    },
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Label Menu */}
      {showLabelMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowLabelMenu(null)}
          />
          <div className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-200 mb-2">
              Add Label
            </div>
            {['Important', 'Follow Up', 'Review', 'Urgent', 'Later'].map((label) => (
              <button
                key={label}
                onClick={() => handleAddLabel(showLabelMenu, label)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
