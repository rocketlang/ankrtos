/**
 * Thread Detail - Full conversation view
 */

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import {
  Send,
  Paperclip,
  Star,
  MoreVertical,
  Sparkles,
  RefreshCw,
  CheckCheck,
} from 'lucide-react';
import { ChannelBadge } from './ChannelBadge';
import { MessageBubble } from './MessageBubble';

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

const GET_THREAD_MESSAGES = gql`
  query GetThreadMessages($threadId: String!, $limit: Int, $offset: Int) {
    threadMessages(threadId: $threadId, limit: $limit, offset: $offset) {
      id
      channel
      channelMessageId
      threadId
      from
      fromName
      to
      content
      contentType
      mediaUrl
      direction
      status
      aiGenerated
      receivedAt
      metadata
    }
  }
`;

const SEND_WHATSAPP_MESSAGE = gql`
  mutation SendWhatsAppMessage($input: SendWhatsAppMessageInput!) {
    sendWhatsAppMessage(input: $input)
  }
`;

const MARK_THREAD_AS_READ = gql`
  mutation MarkThreadAsRead($threadId: String!) {
    markThreadAsRead(threadId: $threadId)
  }
`;

const TOGGLE_THREAD_STAR = gql`
  mutation ToggleThreadStar($threadId: String!, $starred: Boolean!) {
    toggleThreadStar(threadId: $threadId, starred: $starred)
  }
`;

interface ThreadDetailProps {
  thread: Thread;
}

export function ThreadDetail({ thread }: ThreadDetailProps) {
  const [messageText, setMessageText] = useState('');
  const [showAIAssist, setShowAIAssist] = useState(false);

  const { data, loading, refetch } = useQuery(GET_THREAD_MESSAGES, {
    variables: {
      threadId: thread.id,
      limit: 100,
      offset: 0,
    },
    pollInterval: 5000, // Poll every 5 seconds for new messages
  });

  const [sendWhatsApp] = useMutation(SEND_WHATSAPP_MESSAGE);
  const [markAsRead] = useMutation(MARK_THREAD_AS_READ);
  const [toggleStar] = useMutation(TOGGLE_THREAD_STAR);

  const messages: Message[] = data?.threadMessages || [];

  // Mark thread as read when opened
  if (!thread.isRead) {
    markAsRead({ variables: { threadId: thread.id } });
  }

  const handleSend = async () => {
    if (!messageText.trim()) return;

    if (thread.channel === 'whatsapp') {
      await sendWhatsApp({
        variables: {
          input: {
            to: thread.participantId,
            text: messageText,
          },
        },
      });
    }

    setMessageText('');
    refetch();
  };

  const handleToggleStar = async () => {
    await toggleStar({
      variables: {
        threadId: thread.id,
        starred: !thread.isStarred,
      },
    });
  };

  const displayName = thread.participantName || thread.participantId;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChannelBadge channel={thread.channel} size="lg" showLabel />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{displayName}</h2>
              {thread.subject && (
                <p className="text-sm text-gray-600">{thread.subject}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={handleToggleStar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={thread.isStarred ? 'Unstar' : 'Star'}
            >
              <Star
                className={`w-5 h-5 ${
                  thread.isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'
                }`}
              />
            </button>

            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="More options"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {loading && (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex justify-center items-center h-full text-gray-500">
            <p>No messages yet</p>
          </div>
        )}

        {!loading && messages.length > 0 && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        {showAIAssist && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">AI Assistant</span>
            </div>
            <p className="text-sm text-purple-800 mb-3">
              I can help you draft a response based on your previous conversations and company knowledge.
            </p>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
              Generate AI Response
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowAIAssist(!showAIAssist)}
            className={`p-3 rounded-lg transition-colors ${
              showAIAssist
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="AI Assistant"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          <button
            className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            rows={3}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          <button
            onClick={handleSend}
            disabled={!messageText.trim()}
            className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Status Indicators */}
        {thread.channel === 'whatsapp' && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <CheckCheck className="w-4 h-4" />
            <span>Messages are end-to-end encrypted</span>
          </div>
        )}
      </div>
    </div>
  );
}
