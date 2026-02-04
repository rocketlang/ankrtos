/**
 * Universal Inbox - Combined inbox for all messaging channels
 * Email, WhatsApp, Slack, Teams, WebChat, Tickets
 *
 * @package @ankr/universal-ai-assistant
 * @version 1.0.0
 */

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  Mail,
  MessageCircle,
  Hash,
  Users,
  Globe,
  Ticket,
  Star,
  Archive,
  Clock,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';
import { ChannelBadge } from '../components/messaging/ChannelBadge';
import { MessagePreview } from '../components/messaging/MessagePreview';
import { ThreadDetail } from '../components/messaging/ThreadDetail';

const GET_UNIVERSAL_THREADS = gql`
  query GetUniversalThreads($filters: ThreadFilterInput, $limit: Int, $offset: Int) {
    universalThreads(filters: $filters, limit: $limit, offset: $offset) {
      id
      channel
      participantId
      participantName
      subject
      messageCount
      isRead
      isStarred
      isPinned
      labels
      lastMessageAt
      createdAt
    }
    channelStats {
      email
      whatsapp
      slack
      teams
      webchat
      ticket
      sms
    }
  }
`;

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

interface ChannelStats {
  email: number;
  whatsapp: number;
  slack: number;
  teams: number;
  webchat: number;
  ticket: number;
  sms: number;
}

export function UniversalInbox() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | 'all'>('all');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filters: any = {};
  if (selectedChannel !== 'all') {
    filters.channel = selectedChannel;
  }
  if (showUnreadOnly) {
    filters.isRead = false;
  }
  if (showStarredOnly) {
    filters.isStarred = true;
  }

  const { data, loading, refetch } = useQuery(GET_UNIVERSAL_THREADS, {
    variables: {
      filters,
      limit: 50,
      offset: 0,
    },
    pollInterval: 10000, // Poll every 10 seconds
  });

  const threads: Thread[] = data?.universalThreads || [];
  const stats: ChannelStats = data?.channelStats || {
    email: 0,
    whatsapp: 0,
    slack: 0,
    teams: 0,
    webchat: 0,
    ticket: 0,
    sms: 0,
  };

  // Filter by search query
  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.participantName?.toLowerCase().includes(query) ||
      thread.subject?.toLowerCase().includes(query) ||
      thread.participantId.toLowerCase().includes(query)
    );
  });

  const channelIcons = {
    email: Mail,
    whatsapp: MessageCircle,
    slack: Hash,
    teams: Users,
    webchat: Globe,
    ticket: Ticket,
    sms: MessageCircle,
  };

  const channelColors = {
    email: 'blue',
    whatsapp: 'green',
    slack: 'purple',
    teams: 'indigo',
    webchat: 'pink',
    ticket: 'orange',
    sms: 'gray',
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Channel Filters */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-sm text-gray-600 mt-1">Universal AI Assistant</p>
        </div>

        {/* Channel Filters */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {/* All Channels */}
            <button
              onClick={() => setSelectedChannel('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                selectedChannel === 'all'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <span className="font-medium">All Messages</span>
              </span>
              <span className="text-sm font-semibold">
                {Object.values(stats).reduce((a, b) => a + b, 0)}
              </span>
            </button>

            {/* Email */}
            <button
              onClick={() => setSelectedChannel('email')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                selectedChannel === 'email'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <span>Email</span>
              </span>
              <span className="text-sm font-semibold">{stats.email}</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => setSelectedChannel('whatsapp')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                selectedChannel === 'whatsapp'
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp</span>
              </span>
              <span className="text-sm font-semibold">{stats.whatsapp}</span>
            </button>

            {/* Slack */}
            <button
              onClick={() => setSelectedChannel('slack')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                selectedChannel === 'slack'
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Hash className="w-5 h-5" />
                <span>Slack</span>
              </span>
              <span className="text-sm font-semibold">{stats.slack}</span>
            </button>

            {/* Teams */}
            <button
              onClick={() => setSelectedChannel('teams')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                selectedChannel === 'teams'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Teams</span>
              </span>
              <span className="text-sm font-semibold">{stats.teams}</span>
            </button>

            {/* WebChat */}
            <button
              onClick={() => setSelectedChannel('webchat')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                selectedChannel === 'webchat'
                  ? 'bg-pink-50 text-pink-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <span>Web Chat</span>
              </span>
              <span className="text-sm font-semibold">{stats.webchat}</span>
            </button>

            {/* Tickets */}
            <button
              onClick={() => setSelectedChannel('ticket')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                selectedChannel === 'ticket'
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                <span>Tickets</span>
              </span>
              <span className="text-sm font-semibold">{stats.ticket}</span>
            </button>
          </div>

          {/* Filters */}
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Filters
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showUnreadOnly
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                <span>Unread Only</span>
              </button>

              <button
                onClick={() => setShowStarredOnly(!showStarredOnly)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showStarredOnly
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Starred Only</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thread List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Search & Actions */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => refetch()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4">Loading conversations...</p>
            </div>
          )}

          {!loading && filteredThreads.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="font-medium">No conversations found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          )}

          {!loading && filteredThreads.length > 0 && (
            <div className="divide-y divide-gray-200">
              {filteredThreads.map((thread) => (
                <MessagePreview
                  key={thread.id}
                  thread={thread}
                  selected={selectedThread?.id === thread.id}
                  onClick={() => setSelectedThread(thread)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thread Detail */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <ThreadDetail thread={selectedThread} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-2">Choose from your inbox to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
