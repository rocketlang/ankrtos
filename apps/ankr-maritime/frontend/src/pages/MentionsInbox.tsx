import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';

const MY_MENTIONS_QUERY = gql`
  query MyMentions {
    myMentions {
      id mentionedBy entityType entityId context fieldName read readAt createdAt
    }
  }
`

const UNREAD_COUNT_QUERY = gql`
  query UnreadMentionCount {
    unreadMentionCount
  }
`

const MARK_MENTION_READ = gql`
  mutation MarkMentionRead($id: String!) {
    markMentionRead(id: $id) { id }
  }
`

const MARK_ALL_READ = gql`
  mutation MarkAllMentionsRead {
    markAllMentionsRead
  }
`

const entityTypeBadge: Record<string, { bg: string; label: string }> = {
  voyage: { bg: 'bg-blue-900/50 text-blue-400', label: 'Voyage' },
  charter: { bg: 'bg-purple-900/50 text-purple-400', label: 'Charter' },
  vessel: { bg: 'bg-teal-900/50 text-teal-400', label: 'Vessel' },
  company: { bg: 'bg-indigo-900/50 text-indigo-400', label: 'Company' },
  claim: { bg: 'bg-red-900/50 text-red-400', label: 'Claim' },
  invoice: { bg: 'bg-green-900/50 text-green-400', label: 'Invoice' },
  da: { bg: 'bg-yellow-900/50 text-yellow-400', label: 'DA' },
  bunker: { bg: 'bg-orange-900/50 text-orange-400', label: 'Bunker' },
  laytime: { bg: 'bg-cyan-900/50 text-cyan-400', label: 'Laytime' },
}

const entityRoutes: Record<string, string> = {
  voyage: '/voyages',
  charter: '/chartering',
  vessel: '/vessels',
  company: '/companies',
  claim: '/claims',
  invoice: '/invoices',
  da: '/da-desk',
  bunker: '/bunkers',
  laytime: '/laytime',
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export function MentionsInbox() {
  const { data, loading, error, refetch } = useQuery(MY_MENTIONS_QUERY)
  const { data: countData, refetch: refetchCount } = useQuery(UNREAD_COUNT_QUERY)
  const [markRead] = useMutation(MARK_MENTION_READ)
  const [markAllRead] = useMutation(MARK_ALL_READ)

  const [filter, setFilter] = useState<'all' | 'unread' | string>('all')

  const mentions = data?.myMentions ?? []
  const unreadCount = countData?.unreadMentionCount ?? 0

  const entityTypes = [...new Set((mentions as Array<Record<string, unknown>>).map((m) => m.entityType as string))]

  const filteredMentions = (mentions as Array<Record<string, unknown>>).filter((m) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !m.read
    return m.entityType === filter
  })

  const handleMarkRead = async (id: string) => {
    await markRead({ variables: { id } })
    refetch()
    refetchCount()
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
    refetch()
    refetchCount()
  }

  const navigateToEntity = (entityType: string, entityId: string) => {
    const route = entityRoutes[entityType]
    if (route) {
      window.location.href = route
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Mentions &amp; Tags</h1>
            <p className="text-maritime-400 text-sm mt-1">Notifications when you are mentioned across the platform</p>
          </div>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-sm font-bold px-2.5 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead}
            className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm font-medium px-4 py-2 rounded-md transition-colors">
            Mark All Read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-maritime-700 overflow-x-auto">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
          ...entityTypes.map((t) => ({
            key: t,
            label: entityTypeBadge[t]?.label ?? t.replace(/_/g, ' '),
          })),
        ].map((tab) => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              filter === tab.key
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-maritime-400 hover:text-maritime-300'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-maritime-400">Loading mentions...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Mention cards */}
      {!loading && (
        <div className="space-y-2">
          {filteredMentions.length === 0 && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
              <p className="text-maritime-500">
                {filter === 'unread' ? 'No unread mentions' : 'No mentions found'}
              </p>
            </div>
          )}

          {filteredMentions.map((m) => {
            const badge = entityTypeBadge[m.entityType as string]
            const isUnread = !m.read
            return (
              <div key={m.id as string}
                className={`bg-maritime-800 border rounded-lg p-4 transition-colors cursor-pointer hover:bg-maritime-700/30 ${
                  isUnread ? 'border-blue-600/40' : 'border-maritime-700'
                }`}
                onClick={() => navigateToEntity(m.entityType as string, m.entityId as string)}>
                <div className="flex items-start gap-4">
                  {/* Left: entity type badge */}
                  <div className="flex-shrink-0 mt-0.5">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      badge?.bg ?? 'bg-maritime-700 text-maritime-300'
                    }`}>
                      {badge?.label ?? (m.entityType as string).replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Center: mention details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">
                      <span className="text-blue-400 font-medium">@{m.mentionedBy as string}</span>
                      <span className="text-maritime-300"> mentioned you in </span>
                      <span className="text-white font-medium">{(m.entityType as string).replace(/_/g, ' ')}</span>
                      <span className="text-maritime-400 font-mono text-xs ml-1">{m.entityId as string}</span>
                    </p>
                    {m.context && (
                      <p className="text-maritime-400 text-sm mt-1 truncate max-w-xl">
                        &ldquo;{(m.context as string).length > 120
                          ? `${(m.context as string).substring(0, 120)}...`
                          : m.context as string}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {m.fieldName && (
                        <span className="text-maritime-500 text-xs">
                          Field: <span className="text-maritime-400">{(m.fieldName as string).replace(/_/g, ' ')}</span>
                        </span>
                      )}
                      <span className="text-maritime-500 text-xs">{timeAgo(m.createdAt as string)}</span>
                    </div>
                  </div>

                  {/* Right: unread indicator + mark read button */}
                  <div className="flex-shrink-0 flex items-center gap-3">
                    {isUnread && (
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                    {isUnread && (
                      <button onClick={(e) => { e.stopPropagation(); handleMarkRead(m.id as string) }}
                        className="text-maritime-500 hover:text-maritime-300 text-xs whitespace-nowrap">
                        Mark read
                      </button>
                    )}
                    {!isUnread && m.readAt && (
                      <span className="text-maritime-600 text-xs whitespace-nowrap">
                        Read {timeAgo(m.readAt as string)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
