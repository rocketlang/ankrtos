import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const APPROVAL_ROUTES_QUERY = gql`
  query ApprovalRoutes {
    approvalRoutes {
      id name entityType active autoApprove autoApproveBelow
      steps { id stepOrder approverRole action }
    }
  }
`

const PENDING_APPROVALS_QUERY = gql`
  query PendingApprovals {
    pendingApprovals {
      id stepOrder approverRole entityType entityId deadline
      approvalRoute { name entityType }
    }
  }
`

const CREATE_APPROVAL_ROUTE = gql`
  mutation CreateApprovalRoute(
    $name: String!, $entityType: String!, $autoApprove: Boolean,
    $autoApproveBelow: Float, $steps: [ApprovalStepInput!]!
  ) {
    createApprovalRoute(
      name: $name, entityType: $entityType, autoApprove: $autoApprove,
      autoApproveBelow: $autoApproveBelow, steps: $steps
    ) { id }
  }
`

const PROCESS_APPROVAL_STEP = gql`
  mutation ProcessApprovalStep($stepId: String!, $action: String!, $comments: String) {
    processApprovalStep(stepId: $stepId, action: $action, comments: $comments) { id }
  }
`

const entityTypes = ['charter', 'voyage', 'da', 'claim', 'invoice', 'bunker_rfq']

const entityTypeBadge: Record<string, string> = {
  charter: 'bg-purple-900/50 text-purple-400',
  voyage: 'bg-blue-900/50 text-blue-400',
  da: 'bg-teal-900/50 text-teal-400',
  claim: 'bg-red-900/50 text-red-400',
  invoice: 'bg-green-900/50 text-green-400',
  bunker_rfq: 'bg-yellow-900/50 text-yellow-400',
}

const approverRoles = [
  'operations_manager', 'finance_manager', 'commercial_head',
  'cfo', 'ceo', 'legal_head', 'chartering_head',
]

const emptyForm = {
  name: '', entityType: 'charter', autoApprove: false, autoApproveBelow: '',
}

interface StepInput {
  stepOrder: number
  approverRole: string
}

export function ApprovalWorkflows() {
  const { data, loading, error, refetch } = useQuery(APPROVAL_ROUTES_QUERY)
  const { data: pendingData, loading: pendingLoading, refetch: refetchPending } = useQuery(PENDING_APPROVALS_QUERY)
  const [createApprovalRoute, { loading: creating }] = useMutation(CREATE_APPROVAL_ROUTE)
  const [processApprovalStep] = useMutation(PROCESS_APPROVAL_STEP)

  const [tab, setTab] = useState<'routes' | 'approvals'>('routes')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [steps, setSteps] = useState<StepInput[]>([{ stepOrder: 1, approverRole: 'operations_manager' }])
  const [comments, setComments] = useState<Record<string, string>>({})

  const routes = data?.approvalRoutes ?? []
  const pending = pendingData?.pendingApprovals ?? []

  const totalRoutes = routes.length
  const activeRoutes = routes.filter((r: Record<string, unknown>) => r.active).length
  const pendingCount = pending.length
  const approvedToday = 0 // server-side metric placeholder

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createApprovalRoute({
      variables: {
        name: form.name,
        entityType: form.entityType,
        autoApprove: form.autoApprove,
        autoApproveBelow: form.autoApproveBelow ? Number(form.autoApproveBelow) : null,
        steps: steps.map((s) => ({ stepOrder: s.stepOrder, approverRole: s.approverRole })),
      },
    })
    setForm(emptyForm)
    setSteps([{ stepOrder: 1, approverRole: 'operations_manager' }])
    setShowCreate(false)
    refetch()
  }

  const handleProcess = async (stepId: string, action: string) => {
    await processApprovalStep({
      variables: {
        stepId,
        action,
        comments: comments[stepId] || null,
      },
    })
    setComments((c) => {
      const next = { ...c }
      delete next[stepId]
      return next
    })
    refetchPending()
    refetch()
  }

  const addStep = () => {
    setSteps((prev) => [...prev, { stepOrder: prev.length + 1, approverRole: 'operations_manager' }])
  }

  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepOrder: i + 1 })))
  }

  const updateStep = (idx: number, field: keyof StepInput, value: string | number) => {
    setSteps((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const setCheck = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.checked }))

  const isDeadlinePassed = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Approval Workflows</h1>
          <p className="text-maritime-400 text-sm mt-1">Define and manage multi-step approval routes</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ Create Route</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Routes', value: totalRoutes, color: 'text-white' },
          { label: 'Active', value: activeRoutes, color: 'text-green-400' },
          { label: 'Pending Approvals', value: pendingCount, color: 'text-yellow-400' },
          { label: 'Approved Today', value: approvedToday, color: 'text-blue-400' },
        ].map((s) => (
          <div key={s.label} className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <p className="text-maritime-400 text-xs font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-maritime-700">
        {(['routes', 'approvals'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-maritime-400 hover:text-maritime-300'
            }`}>
            {t === 'routes' ? 'Routes' : 'My Approvals'}
            {t === 'approvals' && pendingCount > 0 && (
              <span className="ml-2 bg-yellow-600 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading && <p className="text-maritime-400">Loading routes...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Routes Tab */}
      {!loading && tab === 'routes' && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-center px-4 py-3 font-medium">Entity Type</th>
                <th className="text-center px-4 py-3 font-medium">Steps</th>
                <th className="text-left px-4 py-3 font-medium">Auto-Approve</th>
                <th className="text-center px-4 py-3 font-medium">Active</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(routes as Array<Record<string, unknown>>).map((r) => {
                const routeSteps = (r.steps as Array<Record<string, unknown>>) ?? []
                return (
                  <tr key={r.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="px-4 py-3 text-white font-medium">{r.name as string}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        entityTypeBadge[r.entityType as string] ?? 'bg-maritime-700 text-maritime-300'
                      }`}>
                        {(r.entityType as string).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-center">{routeSteps.length}</td>
                    <td className="px-4 py-3 text-maritime-300">
                      {r.autoApprove ? (
                        <span className="text-green-400 text-xs">
                          Yes{r.autoApproveBelow ? ` (below ${(r.autoApproveBelow as number).toLocaleString()})` : ''}
                        </span>
                      ) : (
                        <span className="text-maritime-500 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        r.active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {r.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-blue-400/60 hover:text-blue-400 text-xs">Edit</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {routes.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No approval routes defined yet</p>
          )}
        </div>
      )}

      {/* My Approvals Tab */}
      {tab === 'approvals' && (
        <div className="space-y-4">
          {pendingLoading && <p className="text-maritime-400">Loading approvals...</p>}
          {!pendingLoading && pending.length === 0 && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
              <p className="text-maritime-500">No pending approvals</p>
            </div>
          )}
          {!pendingLoading && (pending as Array<Record<string, unknown>>).map((p) => {
            const route = p.approvalRoute as Record<string, unknown> | null
            const deadline = p.deadline as string | null
            const passed = isDeadlinePassed(deadline)
            return (
              <div key={p.id as string} className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium">{route?.name as string ?? 'Approval'}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        entityTypeBadge[p.entityType as string] ?? 'bg-maritime-700 text-maritime-300'
                      }`}>
                        {(p.entityType as string).replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-maritime-400 text-sm">
                      Step {p.stepOrder as number} &middot; Role: <span className="text-maritime-300">{(p.approverRole as string).replace(/_/g, ' ')}</span>
                      &middot; Entity: <span className="text-maritime-300 font-mono">{p.entityId as string}</span>
                    </p>
                  </div>
                  {deadline && (
                    <div className={`text-xs font-medium ${passed ? 'text-red-400' : 'text-maritime-400'}`}>
                      {passed ? 'OVERDUE' : 'Deadline'}: {new Date(deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <textarea
                    value={comments[p.id as string] ?? ''}
                    onChange={(e) => setComments((c) => ({ ...c, [p.id as string]: e.target.value }))}
                    className="w-full bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 h-16 resize-none mb-3"
                    placeholder="Add comments (optional)..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleProcess(p.id as string, 'reject')}
                      className="px-4 py-2 bg-red-900/30 text-red-400 text-sm rounded-md hover:bg-red-900/50 font-medium transition-colors">
                      Reject
                    </button>
                    <button onClick={() => handleProcess(p.id as string, 'approve')}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 font-medium transition-colors">
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Route Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Approval Route">
        <form onSubmit={handleCreate}>
          <FormField label="Route Name *">
            <input value={form.name} onChange={set('name')} className={inputClass} required placeholder="Charter Approval Route" />
          </FormField>
          <FormField label="Entity Type *">
            <select value={form.entityType} onChange={set('entityType')} className={selectClass} required>
              {entityTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-maritime-300 cursor-pointer mt-6">
                <input type="checkbox" checked={form.autoApprove} onChange={setCheck('autoApprove')}
                  className="rounded border-maritime-600 bg-maritime-900 text-blue-600 focus:ring-blue-500" />
                Auto-Approve
              </label>
            </div>
            {form.autoApprove && (
              <FormField label="Auto-Approve Below (USD)">
                <input type="number" step="any" value={form.autoApproveBelow} onChange={set('autoApproveBelow')}
                  className={inputClass} placeholder="10000" />
              </FormField>
            )}
          </div>

          {/* Dynamic Steps */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-maritime-400 font-medium">Approval Steps</label>
              <button type="button" onClick={addStep}
                className="text-blue-400 hover:text-blue-300 text-xs font-medium">+ Add Step</button>
            </div>
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-maritime-900/50 rounded-lg p-3">
                  <span className="text-maritime-500 text-xs font-mono w-6 text-center">{step.stepOrder}</span>
                  <select value={step.approverRole}
                    onChange={(e) => updateStep(idx, 'approverRole', e.target.value)}
                    className={`${selectClass} flex-1`}>
                    {approverRoles.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                  {steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(idx)}
                      className="text-red-400/60 hover:text-red-400 text-xs">Remove</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Route'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
