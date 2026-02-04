import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';

const INVITATIONS_QUERY = gql`
  query TeamInvitations($status: String) {
    teamInvitations(status: $status) {
      id email role invitedBy message status
      expiresAt createdAt acceptedAt
    }
  }
`

const PENDING_INVITATIONS = gql`
  query PendingInvitations {
    pendingInvitations {
      id email role invitedBy expiresAt createdAt
    }
  }
`

const INVITATION_STATS = gql`
  query InvitationStats {
    invitationStats {
      totalInvited accepted pending expired
    }
  }
`

const SEND_INVITATION = gql`
  mutation SendTeamInvitation($email: String!, $role: String!, $message: String) {
    sendTeamInvitation(email: $email, role: $role, message: $message) { id }
  }
`

const CANCEL_INVITATION = gql`
  mutation CancelInvitation($id: String!) {
    cancelInvitation(id: $id) { id }
  }
`

const RESEND_INVITATION = gql`
  mutation ResendInvitation($id: String!) {
    resendInvitation(id: $id) { id }
  }
`

const roles = [
  { value: 'admin', label: 'Admin', description: 'Full system access' },
  { value: 'operations_manager', label: 'Operations Manager', description: 'Manage voyages, vessels, chartering' },
  { value: 'commercial_manager', label: 'Commercial Manager', description: 'Chartering, estimates, contracts' },
  { value: 'finance', label: 'Finance', description: 'Invoices, claims, payments' },
  { value: 'operations', label: 'Operations', description: 'Voyage ops, noon reports, DA' },
  { value: 'chartering', label: 'Chartering', description: 'Charter fixtures, enquiries' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
]

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-900/50 text-yellow-400',
  accepted: 'bg-green-900/50 text-green-400',
  expired: 'bg-maritime-700 text-maritime-400',
  cancelled: 'bg-red-900/50 text-red-400',
}

export function TeamManagement() {
  const [filterStatus, setFilterStatus] = useState('')
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'operations', message: '' })
  const [sending, setSending] = useState(false)

  const { data: invData, loading, refetch: refetchInv } = useQuery(INVITATIONS_QUERY, {
    variables: { status: filterStatus || undefined },
  })
  const { data: pendingData, refetch: refetchPending } = useQuery(PENDING_INVITATIONS)
  const { data: statsData, refetch: refetchStats } = useQuery(INVITATION_STATS)
  const [sendInvitation] = useMutation(SEND_INVITATION)
  const [cancelInvitation] = useMutation(CANCEL_INVITATION)
  const [resendInvitation] = useMutation(RESEND_INVITATION)

  const refetchAll = () => { refetchInv(); refetchPending(); refetchStats() }

  const invitations = invData?.teamInvitations ?? []
  const pendingInvitations = pendingData?.pendingInvitations ?? []
  const stats = statsData?.invitationStats

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteForm.email || !inviteForm.role) return
    setSending(true)
    try {
      await sendInvitation({
        variables: {
          email: inviteForm.email,
          role: inviteForm.role,
          message: inviteForm.message || undefined,
        },
      })
      setInviteForm({ email: '', role: 'operations', message: '' })
      refetchAll()
    } finally {
      setSending(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this invitation?')) return
    await cancelInvitation({ variables: { id } })
    refetchAll()
  }

  const handleResend = async (id: string) => {
    await resendInvitation({ variables: { id } })
    refetchAll()
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Management</h1>
          <p className="text-maritime-400 text-sm mt-1">Invite members, manage roles & access</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Invited', value: stats.totalInvited, color: 'text-white', border: 'border-maritime-500' },
            { label: 'Accepted', value: stats.accepted, color: 'text-green-400', border: 'border-green-500' },
            { label: 'Pending', value: stats.pending, color: 'text-yellow-400', border: 'border-yellow-500' },
            { label: 'Expired', value: stats.expired, color: 'text-maritime-400', border: 'border-maritime-600' },
          ].map((s) => (
            <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
              <p className="text-maritime-500 text-xs uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Invite Form */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
        <h2 className="text-white font-semibold text-sm mb-4">Invite Team Member</h2>
        <form onSubmit={handleSendInvite}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-maritime-400 mb-1 font-medium">Email Address *</label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                required
                placeholder="colleague@company.com"
              />
            </div>
            <div>
              <label className="block text-xs text-maritime-400 mb-1 font-medium">Role *</label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                required
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label} - {r.description}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={sending}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-md transition-colors disabled:opacity-50 w-full">
                {sending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-maritime-400 mb-1 font-medium">Personal Message (optional)</label>
            <textarea
              value={inviteForm.message}
              onChange={(e) => setInviteForm((f) => ({ ...f, message: e.target.value }))}
              rows={2}
              className="w-full bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="Hey, join our maritime operations platform..."
            />
          </div>
        </form>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-maritime-800 border border-yellow-900/50 rounded-lg p-5">
          <h2 className="text-yellow-400 font-semibold text-sm mb-3">
            Pending Invitations ({pendingInvitations.length})
          </h2>
          <div className="space-y-2">
            {pendingInvitations.map((inv: Record<string, unknown>) => (
              <div key={inv.id as string}
                className="flex items-center justify-between bg-maritime-900/50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-yellow-900/50 flex items-center justify-center text-yellow-400 text-sm font-bold">
                    {(inv.email as string)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm">{inv.email as string}</p>
                    <p className="text-maritime-500 text-[10px]">
                      Invited {new Date(inv.createdAt as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      {' '}| Expires {new Date(inv.expiresAt as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-maritime-300 text-xs capitalize bg-maritime-700 px-2 py-0.5 rounded">
                    {(inv.role as string).replace(/_/g, ' ')}
                  </span>
                  <button onClick={() => handleResend(inv.id as string)}
                    className="text-blue-400 hover:text-blue-300 text-xs">
                    Resend
                  </button>
                  <button onClick={() => handleCancel(inv.id as string)}
                    className="text-red-400 hover:text-red-300 text-xs">
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Invitations Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-sm">All Invitations</h2>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Invited By</th>
                <th className="text-left px-4 py-3">Sent</th>
                <th className="text-left px-4 py-3">Expires</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="text-center py-8 text-maritime-500">Loading invitations...</td></tr>
              )}
              {!loading && invitations.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-maritime-500">No invitations found</td></tr>
              )}
              {invitations.map((inv: Record<string, unknown>) => {
                const status = inv.status as string
                const expired = inv.expiresAt ? isExpired(inv.expiresAt as string) : false
                const displayStatus = status === 'pending' && expired ? 'expired' : status
                return (
                  <tr key={inv.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                    <td className="px-4 py-3 text-white text-xs">{inv.email as string}</td>
                    <td className="px-4 py-3 text-maritime-300 text-xs capitalize">{(inv.role as string).replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">{(inv.invitedBy as string) ?? '-'}</td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">
                      {new Date(inv.createdAt as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">
                      {inv.expiresAt
                        ? new Date(inv.expiresAt as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${statusBadge[displayStatus] ?? 'bg-maritime-700 text-maritime-300'}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {status === 'pending' && !expired && (
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => handleResend(inv.id as string)}
                            className="text-blue-400 hover:text-blue-300 text-[10px] bg-blue-900/30 px-2 py-0.5 rounded">
                            Resend
                          </button>
                          <button onClick={() => handleCancel(inv.id as string)}
                            className="text-red-400 hover:text-red-300 text-[10px] bg-red-900/30 px-2 py-0.5 rounded">
                            Cancel
                          </button>
                        </div>
                      )}
                      {status === 'accepted' && inv.acceptedAt && (
                        <span className="text-green-400 text-[10px]">
                          {new Date(inv.acceptedAt as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
