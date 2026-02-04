import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const EMAIL_MESSAGES = gql`
  query EmailMessages($folder: String, $isRead: Boolean, $search: String) {
    emailMessages(folder: $folder, isRead: $isRead, search: $search) {
      id messageId from to cc bcc subject body snippet folder
      isRead isStarred sentAt receivedAt
      attachments { id fileName fileSize mimeType }
      linkedEntityType linkedEntityId
      aiSummary aiSentiment aiCategory aiPriority
      threadId threadPosition
    }
  }
`;

const INBOX_STATS = gql`
  query InboxStats {
    emailInboxStats {
      unreadCount totalCount starredCount
    }
  }
`;

const MARK_EMAIL_READ = gql`
  mutation MarkEmailRead($id: String!) {
    markEmailRead(id: $id) { id isRead }
  }
`;

const STAR_EMAIL = gql`
  mutation StarEmail($id: String!, $starred: Boolean!) {
    starEmail(id: $id, starred: $starred) { id isStarred }
  }
`;

const MOVE_EMAIL = gql`
  mutation MoveEmail($id: String!, $folder: String!) {
    moveEmail(id: $id, folder: $folder) { id folder }
  }
`;

const LINK_EMAIL_TO_ENTITY = gql`
  mutation LinkEmailToEntity($id: String!, $entityType: String!, $entityId: String!) {
    linkEmailToEntity(id: $id, entityType: $entityType, entityId: $entityId) { id linkedEntityType linkedEntityId }
  }
`;

const DELETE_EMAIL = gql`
  mutation DeleteEmail($id: String!) {
    deleteEmail(id: $id) { id }
  }
`;

const BULK_MARK_READ = gql`
  mutation BulkMarkRead($ids: [String!]!) {
    bulkMarkRead(ids: $ids)
  }
`;

const SEND_EMAIL = gql`
  mutation SendEmail($to: String!, $cc: String, $subject: String!, $body: String!) {
    sendEmail(to: $to, cc: $cc, subject: $subject, body: $body) { id }
  }
`;

const folders = [
  { key: 'inbox', label: 'Inbox', icon: '\u2709' },
  { key: 'sent', label: 'Sent', icon: '\u2191' },
  { key: 'drafts', label: 'Drafts', icon: '\u270E' },
  { key: 'archive', label: 'Archive', icon: '\u2610' },
  { key: 'trash', label: 'Trash', icon: '\u2716' },
];

const sentimentBadge: Record<string, { bg: string; label: string }> = {
  positive: { bg: 'bg-green-900/50 text-green-400', label: 'Positive' },
  neutral: { bg: 'bg-gray-800 text-gray-400', label: 'Neutral' },
  negative: { bg: 'bg-red-900/50 text-red-400', label: 'Negative' },
  urgent: { bg: 'bg-amber-900/50 text-amber-400', label: 'Urgent' },
};

const entityTypes = [
  { value: 'voyage', label: 'Voyage' },
  { value: 'charter', label: 'Charter' },
  { value: 'company', label: 'Company' },
  { value: 'lead', label: 'Lead' },
];

function formatDate(d: string | null) {
  if (!d) return '-';
  const dt = new Date(d);
  const now = new Date();
  const diff = now.getTime() - dt.getTime();
  if (diff < 86400000 && dt.getDate() === now.getDate()) {
    return dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Email = Record<string, any>;

export function EmailInbox() {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [showCompose, setShowCompose] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({ entityType: 'voyage', entityId: '' });
  const [composeForm, setComposeForm] = useState({ to: '', cc: '', subject: '', body: '' });

  const { data, loading, error, refetch } = useQuery(EMAIL_MESSAGES, {
    variables: {
      folder: activeFolder,
      search: search || undefined,
    },
  });
  const { data: statsData, refetch: refetchStats } = useQuery(INBOX_STATS);

  const [markEmailRead] = useMutation(MARK_EMAIL_READ);
  const [starEmail] = useMutation(STAR_EMAIL);
  const [moveEmail] = useMutation(MOVE_EMAIL);
  const [linkEmailToEntity] = useMutation(LINK_EMAIL_TO_ENTITY);
  const [deleteEmail] = useMutation(DELETE_EMAIL);
  const [bulkMarkRead] = useMutation(BULK_MARK_READ);
  const [sendEmail, { loading: sending }] = useMutation(SEND_EMAIL);

  const emails: Email[] = data?.emailMessages ?? [];
  const stats = statsData?.emailInboxStats;

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      await markEmailRead({ variables: { id: email.id } });
      refetch();
      refetchStats();
    }
  };

  const handleStar = async (e: React.MouseEvent, email: Email) => {
    e.stopPropagation();
    await starEmail({ variables: { id: email.id, starred: !email.isStarred } });
    refetch();
    refetchStats();
  };

  const handleCheckToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkMarkRead = async () => {
    if (checkedIds.size === 0) return;
    await bulkMarkRead({ variables: { ids: Array.from(checkedIds) } });
    setCheckedIds(new Set());
    refetch();
    refetchStats();
  };

  const handleMarkAllRead = async () => {
    const unreadIds = emails.filter((e: Email) => !e.isRead).map((e: Email) => e.id);
    if (unreadIds.length === 0) return;
    await bulkMarkRead({ variables: { ids: unreadIds } });
    refetch();
    refetchStats();
  };

  const handleMoveEmail = async (folder: string) => {
    if (!selectedEmail) return;
    await moveEmail({ variables: { id: selectedEmail.id, folder } });
    setSelectedEmail(null);
    refetch();
    refetchStats();
  };

  const handleDeleteEmail = async () => {
    if (!selectedEmail) return;
    await deleteEmail({ variables: { id: selectedEmail.id } });
    setSelectedEmail(null);
    refetch();
    refetchStats();
  };

  const handleLinkEntity = async () => {
    if (!selectedEmail || !linkForm.entityId) return;
    await linkEmailToEntity({
      variables: { id: selectedEmail.id, entityType: linkForm.entityType, entityId: linkForm.entityId },
    });
    setShowLinkModal(false);
    setLinkForm({ entityType: 'voyage', entityId: '' });
    refetch();
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeForm.to || !composeForm.subject) return;
    await sendEmail({
      variables: {
        to: composeForm.to,
        cc: composeForm.cc || undefined,
        subject: composeForm.subject,
        body: composeForm.body,
      },
    });
    setShowCompose(false);
    setComposeForm({ to: '', cc: '', subject: '', body: '' });
    refetch();
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Inbox</h1>
          <p className="text-maritime-400 text-sm mt-1">Maritime communication hub &mdash; AI-enhanced email management</p>
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64"
          />
          {checkedIds.size > 0 && (
            <button onClick={handleBulkMarkRead} className={btnSecondary}>
              Mark Selected Read ({checkedIds.size})
            </button>
          )}
          <button onClick={handleMarkAllRead} className={btnSecondary}>
            Mark All Read
          </button>
          <button onClick={() => setShowCompose(true)} className={btnPrimary}>
            + Compose
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 mb-4">Error: {error.message}</p>}

      {/* Main Layout: Sidebar + Email List + Detail */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Folder Sidebar */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-3 space-y-1">
            {folders.map((f) => {
              const isActive = activeFolder === f.key;
              const unread = f.key === 'inbox' ? stats?.unreadCount : null;
              return (
                <button
                  key={f.key}
                  onClick={() => { setActiveFolder(f.key); setSelectedEmail(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 font-medium'
                      : 'text-maritime-300 hover:bg-maritime-700/50 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                  </span>
                  {unread != null && unread > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Stats */}
            {stats && (
              <div className="border-t border-maritime-700 mt-3 pt-3 space-y-2">
                <div className="flex justify-between text-xs text-maritime-400">
                  <span>Total</span>
                  <span className="text-white font-medium">{stats.totalCount}</span>
                </div>
                <div className="flex justify-between text-xs text-maritime-400">
                  <span>Unread</span>
                  <span className="text-blue-400 font-medium">{stats.unreadCount}</span>
                </div>
                <div className="flex justify-between text-xs text-maritime-400">
                  <span>Starred</span>
                  <span className="text-amber-400 font-medium">{stats.starredCount}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email List */}
        <div className={`flex-1 flex ${selectedEmail ? 'max-w-[45%]' : ''}`}>
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden flex flex-col w-full">
            {loading && <p className="text-maritime-400 text-center py-8">Loading emails...</p>}
            {!loading && emails.length === 0 && (
              <p className="text-maritime-500 text-center py-8">No emails in {activeFolder}</p>
            )}
            <div className="overflow-y-auto flex-1">
              {emails.map((email: Email) => {
                const isSelected = selectedEmail?.id === email.id;
                const isChecked = checkedIds.has(email.id);
                return (
                  <div
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-maritime-700/50 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-900/20 border-l-2 border-l-blue-500'
                        : 'hover:bg-maritime-700/30'
                    } ${!email.isRead ? 'bg-maritime-700/20' : ''}`}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={(e) => handleCheckToggle(e, email.id)}
                      className={`w-4 h-4 mt-1 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer ${
                        isChecked
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-maritime-600 hover:border-maritime-400'
                      }`}
                    >
                      {isChecked && <span className="text-[10px]">{'\u2713'}</span>}
                    </div>

                    {/* Star */}
                    <button
                      onClick={(e) => handleStar(e, email)}
                      className={`flex-shrink-0 mt-0.5 text-sm ${
                        email.isStarred ? 'text-amber-400' : 'text-maritime-600 hover:text-maritime-400'
                      }`}
                    >
                      {email.isStarred ? '\u2605' : '\u2606'}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${!email.isRead ? 'text-white font-semibold' : 'text-maritime-300'}`}>
                          {email.from}
                        </span>
                        <span className="text-[10px] text-maritime-500 flex-shrink-0">
                          {formatDate(email.receivedAt || email.sentAt)}
                        </span>
                      </div>
                      <p className={`text-sm truncate mt-0.5 ${!email.isRead ? 'text-white font-medium' : 'text-maritime-300'}`}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-maritime-500 truncate mt-0.5">{email.snippet}</p>
                      {/* AI badges inline */}
                      <div className="flex gap-1.5 mt-1.5">
                        {email.aiSentiment && sentimentBadge[email.aiSentiment] && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${sentimentBadge[email.aiSentiment].bg}`}>
                            {sentimentBadge[email.aiSentiment].label}
                          </span>
                        )}
                        {email.aiCategory && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-indigo-900/50 text-indigo-400">
                            {email.aiCategory}
                          </span>
                        )}
                        {email.aiPriority && email.aiPriority !== 'normal' && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                            email.aiPriority === 'high' ? 'bg-red-900/50 text-red-400' : 'bg-amber-900/50 text-amber-400'
                          }`}>
                            {email.aiPriority}
                          </span>
                        )}
                        {email.attachments?.length > 0 && (
                          <span className="text-maritime-500 text-[9px]">
                            {'\u{1F4CE}'} {email.attachments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Email Detail Panel */}
        {selectedEmail && (
          <div className="flex-1 bg-maritime-800 border border-maritime-700 rounded-lg overflow-y-auto">
            <div className="p-5">
              {/* Detail Header */}
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-bold text-white leading-tight pr-4">{selectedEmail.subject}</h2>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-maritime-400 hover:text-white text-lg flex-shrink-0"
                >
                  {'\u2715'}
                </button>
              </div>

              {/* Metadata */}
              <div className="space-y-2 mb-5 text-sm">
                <div className="flex gap-2">
                  <span className="text-maritime-500 w-12">From</span>
                  <span className="text-white font-medium">{selectedEmail.from}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-maritime-500 w-12">To</span>
                  <span className="text-maritime-300">{selectedEmail.to}</span>
                </div>
                {selectedEmail.cc && (
                  <div className="flex gap-2">
                    <span className="text-maritime-500 w-12">CC</span>
                    <span className="text-maritime-400">{selectedEmail.cc}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-maritime-500 w-12">Date</span>
                  <span className="text-maritime-400">
                    {new Date(selectedEmail.receivedAt || selectedEmail.sentAt).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* AI Insights */}
              {(selectedEmail.aiSummary || selectedEmail.aiSentiment || selectedEmail.aiCategory) && (
                <div className="bg-maritime-900 border border-maritime-700 rounded-lg p-4 mb-5">
                  <p className="text-xs text-maritime-500 font-medium mb-2 uppercase tracking-wide">AI Insights</p>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {selectedEmail.aiSentiment && sentimentBadge[selectedEmail.aiSentiment] && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${sentimentBadge[selectedEmail.aiSentiment].bg}`}>
                        Sentiment: {sentimentBadge[selectedEmail.aiSentiment].label}
                      </span>
                    )}
                    {selectedEmail.aiCategory && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-900/50 text-indigo-400">
                        Category: {selectedEmail.aiCategory}
                      </span>
                    )}
                    {selectedEmail.aiPriority && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedEmail.aiPriority === 'high'
                          ? 'bg-red-900/50 text-red-400'
                          : selectedEmail.aiPriority === 'low'
                          ? 'bg-gray-800 text-gray-400'
                          : 'bg-blue-900/50 text-blue-400'
                      }`}>
                        Priority: {selectedEmail.aiPriority}
                      </span>
                    )}
                  </div>
                  {selectedEmail.aiSummary && (
                    <p className="text-maritime-300 text-sm leading-relaxed">{selectedEmail.aiSummary}</p>
                  )}
                </div>
              )}

              {/* Email Body */}
              <div className="bg-maritime-900/50 border border-maritime-700 rounded-lg p-5 mb-5">
                <div className="text-maritime-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedEmail.body || selectedEmail.snippet || 'No content'}
                </div>
              </div>

              {/* Attachments */}
              {selectedEmail.attachments?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs text-maritime-500 font-medium mb-2 uppercase tracking-wide">
                    Attachments ({selectedEmail.attachments.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att: Record<string, unknown>) => (
                      <div
                        key={att.id as string}
                        className="bg-maritime-900 border border-maritime-700 rounded px-3 py-2 flex items-center gap-2 text-sm"
                      >
                        <span className="text-maritime-400">{'\u{1F4C4}'}</span>
                        <span className="text-maritime-300">{att.fileName as string}</span>
                        <span className="text-maritime-500 text-xs">({formatFileSize(att.fileSize as number)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Entity */}
              {selectedEmail.linkedEntityType && (
                <div className="mb-5 bg-emerald-900/20 border border-emerald-800/50 rounded-lg px-4 py-3">
                  <p className="text-xs text-emerald-400 font-medium">
                    Linked to: <span className="capitalize">{selectedEmail.linkedEntityType}</span> #{selectedEmail.linkedEntityId}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap border-t border-maritime-700 pt-4">
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium px-3 py-2 rounded-md transition-colors"
                >
                  Link to Entity
                </button>
                <button
                  onClick={() => handleMoveEmail('archive')}
                  className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-xs font-medium px-3 py-2 rounded-md transition-colors"
                >
                  Archive
                </button>
                <button
                  onClick={() => handleMoveEmail('trash')}
                  className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-xs font-medium px-3 py-2 rounded-md transition-colors"
                >
                  Move to Trash
                </button>
                <button
                  onClick={handleDeleteEmail}
                  className="bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs font-medium px-3 py-2 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <Modal open={showCompose} onClose={() => setShowCompose(false)} title="Compose Email">
        <form onSubmit={handleSendEmail}>
          <FormField label="To *">
            <input
              value={composeForm.to}
              onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })}
              className={inputClass}
              required
              placeholder="recipient@example.com"
            />
          </FormField>
          <FormField label="CC">
            <input
              value={composeForm.cc}
              onChange={(e) => setComposeForm({ ...composeForm, cc: e.target.value })}
              className={inputClass}
              placeholder="cc@example.com"
            />
          </FormField>
          <FormField label="Subject *">
            <input
              value={composeForm.subject}
              onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
              className={inputClass}
              required
              placeholder="RE: Voyage V-2026-001 Charter Party"
            />
          </FormField>
          <FormField label="Body">
            <textarea
              value={composeForm.body}
              onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
              className={inputClass}
              rows={8}
              placeholder="Type your message..."
            />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCompose(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={sending} className={btnPrimary}>
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Link to Entity Modal */}
      <Modal open={showLinkModal} onClose={() => setShowLinkModal(false)} title="Link Email to Entity">
        <FormField label="Entity Type">
          <select
            value={linkForm.entityType}
            onChange={(e) => setLinkForm({ ...linkForm, entityType: e.target.value })}
            className={selectClass}
          >
            {entityTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Entity ID *">
          <input
            value={linkForm.entityId}
            onChange={(e) => setLinkForm({ ...linkForm, entityId: e.target.value })}
            className={inputClass}
            required
            placeholder="Enter voyage number, charter ID, etc."
          />
        </FormField>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowLinkModal(false)} className={btnSecondary}>
            Cancel
          </button>
          <button onClick={handleLinkEntity} className={btnPrimary}>
            Link Entity
          </button>
        </div>
      </Modal>
    </div>
  );
}
