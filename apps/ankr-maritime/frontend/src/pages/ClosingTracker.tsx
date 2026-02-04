import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const CLOSING_QUERY = gql`
  query ClosingChecklist($transactionId: String!) {
    closingChecklist(transactionId: $transactionId) {
      id category item responsible assignedTo dueDate completedDate
      status notes documentRef createdAt
    }
  }
`

const TRANSACTIONS_QUERY = gql`
  query ClosingTransactions {
    snpTransactions {
      id saleListing { vessel { name } } status
    }
  }
`

const ADD_ITEM = gql`
  mutation AddItem(
    $transactionId: String!, $category: String!, $item: String!,
    $responsible: String, $assignedTo: String, $dueDate: String
  ) {
    addChecklistItem(
      transactionId: $transactionId, category: $category, item: $item,
      responsible: $responsible, assignedTo: $assignedTo, dueDate: $dueDate
    ) { id }
  }
`

const UPDATE_ITEM = gql`
  mutation UpdateItem($id: String!, $status: String, $notes: String, $documentRef: String) {
    updateChecklistItem(id: $id, status: $status, notes: $notes, documentRef: $documentRef) { id status }
  }
`

const GENERATE_DEFAULTS = gql`
  mutation GenerateDefaults($transactionId: String!) {
    generateDefaultChecklist(transactionId: $transactionId) { id }
  }
`

const categories = ['documents', 'flag', 'class', 'insurance', 'financial', 'operational', 'regulatory'] as const

const categoryColors: Record<string, string> = {
  documents: 'border-blue-500 bg-blue-900/10',
  flag: 'border-purple-500 bg-purple-900/10',
  class: 'border-indigo-500 bg-indigo-900/10',
  insurance: 'border-green-500 bg-green-900/10',
  financial: 'border-amber-500 bg-amber-900/10',
  operational: 'border-cyan-500 bg-cyan-900/10',
  regulatory: 'border-red-500 bg-red-900/10',
}

const categoryBarColors: Record<string, string> = {
  documents: 'bg-blue-500',
  flag: 'bg-purple-500',
  class: 'bg-indigo-500',
  insurance: 'bg-green-500',
  financial: 'bg-amber-500',
  operational: 'bg-cyan-500',
  regulatory: 'bg-red-500',
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-800/60 text-gray-400',
  in_progress: 'bg-yellow-900/50 text-yellow-400',
  completed: 'bg-green-900/50 text-green-400',
  waived: 'bg-blue-900/50 text-blue-400',
  blocked: 'bg-red-900/50 text-red-400',
}

const statusOptions = ['pending', 'in_progress', 'completed', 'waived', 'blocked']

const emptyItemForm = {
  category: 'documents',
  item: '',
  responsible: '',
  assignedTo: '',
  dueDate: '',
}

export function ClosingTracker() {
  const [selectedTxId, setSelectedTxId] = useState('')
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(categories))
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editDocRef, setEditDocRef] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [showAddItem, setShowAddItem] = useState(false)
  const [itemForm, setItemForm] = useState(emptyItemForm)

  const { data: txData } = useQuery(TRANSACTIONS_QUERY)
  const { data: checklistData, loading, refetch } = useQuery(CLOSING_QUERY, {
    variables: { transactionId: selectedTxId },
    skip: !selectedTxId,
  })
  const [addItem, { loading: adding }] = useMutation(ADD_ITEM)
  const [updateItem] = useMutation(UPDATE_ITEM)
  const [generateDefaults, { loading: generating }] = useMutation(GENERATE_DEFAULTS)

  const transactions = txData?.snpTransactions ?? []
  const checklist = checklistData?.closingChecklist ?? []

  const allCompleted = checklist.filter((c: Record<string, unknown>) => c.status === 'completed').length
  const allTotal = checklist.length
  const overallPercent = allTotal > 0 ? Math.round((allCompleted / allTotal) * 100) : 0

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const handleExpandItem = (item: Record<string, unknown>) => {
    const id = item.id as string
    if (expandedItem === id) {
      setExpandedItem(null)
      return
    }
    setExpandedItem(id)
    setEditStatus(item.status as string)
    setEditNotes(item.notes as string ?? '')
    setEditDocRef(item.documentRef as string ?? '')
  }

  const handleUpdateItem = async (id: string) => {
    await updateItem({
      variables: { id, status: editStatus, notes: editNotes || null, documentRef: editDocRef || null },
    })
    setExpandedItem(null)
    refetch()
  }

  const handleToggleComplete = async (item: Record<string, unknown>) => {
    const currentStatus = item.status as string
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    await updateItem({ variables: { id: item.id as string, status: newStatus } })
    refetch()
  }

  const handleGenerateDefaults = async () => {
    await generateDefaults({ variables: { transactionId: selectedTxId } })
    refetch()
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    await addItem({
      variables: {
        transactionId: selectedTxId,
        category: itemForm.category,
        item: itemForm.item,
        responsible: itemForm.responsible || null,
        assignedTo: itemForm.assignedTo || null,
        dueDate: itemForm.dueDate || null,
      },
    })
    setItemForm(emptyItemForm)
    setShowAddItem(false)
    refetch()
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setItemForm((f) => ({ ...f, [field]: e.target.value }))

  const getCatItems = (cat: string) => checklist.filter((c: Record<string, unknown>) => c.category === cat)

  return (
    <div className="p-8 bg-maritime-900 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Closing Tracker</h1>
          <p className="text-maritime-400 text-sm mt-1">S&amp;P deal closing checklist management</p>
        </div>
        <div className="flex gap-3">
          {selectedTxId && checklist.length === 0 && (
            <button onClick={handleGenerateDefaults} disabled={generating} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
              {generating ? 'Generating...' : 'Generate Default Checklist'}
            </button>
          )}
          {selectedTxId && (
            <button onClick={() => setShowAddItem(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
              + Add Item
            </button>
          )}
        </div>
      </div>

      {/* Transaction Selector */}
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4 mb-6">
        <label className="block text-xs text-maritime-400 mb-2">Select Transaction</label>
        <select
          value={selectedTxId}
          onChange={(e) => { setSelectedTxId(e.target.value); setExpandedItem(null) }}
          className="w-full max-w-md bg-maritime-900 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">Choose a deal...</option>
          {transactions.map((tx: Record<string, unknown>) => {
            const listing = tx.saleListing as Record<string, unknown> | null
            const vessel = listing?.vessel as Record<string, unknown> | null
            return (
              <option key={tx.id as string} value={tx.id as string}>
                {vessel?.name as string ?? 'Unknown'} - {(tx.status as string)?.replace(/_/g, ' ')}
              </option>
            )
          })}
        </select>
      </div>

      {!selectedTxId && (
        <div className="text-center py-16">
          <p className="text-maritime-500 text-sm">Select a transaction to view closing checklist</p>
        </div>
      )}

      {selectedTxId && loading && <p className="text-maritime-400">Loading checklist...</p>}

      {selectedTxId && !loading && (
        <>
          {/* Overall Progress */}
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-sm font-medium">Overall Progress</h3>
              <span className="text-maritime-400 text-sm">{allCompleted}/{allTotal} items ({overallPercent}%)</span>
            </div>
            <div className="bg-maritime-700 rounded-full h-3 mb-4">
              <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${overallPercent}%` }} />
            </div>

            {/* Per-category mini bars */}
            <div className="grid grid-cols-7 gap-3">
              {categories.map((cat) => {
                const items = getCatItems(cat)
                const done = items.filter((c: Record<string, unknown>) => c.status === 'completed').length
                const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0
                return (
                  <div key={cat}>
                    <p className="text-maritime-400 text-xs capitalize mb-1">{cat}</p>
                    <div className="bg-maritime-700 rounded-full h-1.5">
                      <div className={`${categoryBarColors[cat]} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-maritime-500 text-xs mt-0.5">{done}/{items.length}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Category Sections (Accordion) */}
          <div className="space-y-3">
            {categories.map((cat) => {
              const items = getCatItems(cat)
              const isOpen = expandedCats.has(cat)
              const done = items.filter((c: Record<string, unknown>) => c.status === 'completed').length

              return (
                <div key={cat} className={`border-l-4 rounded-lg overflow-hidden ${categoryColors[cat]}`}>
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCat(cat)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-maritime-700/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white text-sm font-medium capitalize">{cat}</span>
                      <span className="text-maritime-500 text-xs">{done}/{items.length} completed</span>
                    </div>
                    <span className="text-maritime-400 text-xs">{isOpen ? '\u25B2' : '\u25BC'}</span>
                  </button>

                  {/* Category Items */}
                  {isOpen && (
                    <div className="bg-maritime-800/80">
                      {items.length === 0 && (
                        <p className="text-maritime-500 text-xs px-5 py-4">No items in this category</p>
                      )}
                      {items.map((item: Record<string, unknown>) => {
                        const id = item.id as string
                        const status = item.status as string
                        const isItemExpanded = expandedItem === id

                        return (
                          <div key={id} className="border-b border-maritime-700/50 last:border-b-0">
                            <div className="flex items-center gap-3 px-5 py-3">
                              {/* Checkbox */}
                              <button
                                onClick={() => handleToggleComplete(item)}
                                className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center text-xs ${
                                  status === 'completed'
                                    ? 'bg-green-600 border-green-500 text-white'
                                    : 'border-maritime-600 text-transparent hover:border-maritime-400'
                                }`}
                              >
                                {status === 'completed' && '\u2713'}
                              </button>

                              {/* Item Name */}
                              <span className={`flex-1 text-sm ${status === 'completed' ? 'text-maritime-500 line-through' : 'text-white'}`}>
                                {item.item as string}
                              </span>

                              {/* Responsible */}
                              {item.responsible && (
                                <span className="text-maritime-400 text-xs">{item.responsible as string}</span>
                              )}

                              {/* Due Date */}
                              {item.dueDate && (
                                <span className="text-maritime-400 text-xs">
                                  Due: {new Date(item.dueDate as string).toLocaleDateString()}
                                </span>
                              )}

                              {/* Status Badge */}
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[status] ?? ''}`}>
                                {status?.replace('_', ' ')}
                              </span>

                              {/* Notes icon */}
                              {item.notes && (
                                <span className="text-maritime-400 text-xs" title={item.notes as string}>&#x1F4DD;</span>
                              )}

                              {/* Expand */}
                              <button
                                onClick={() => handleExpandItem(item)}
                                className="text-maritime-400 hover:text-white text-xs ml-1"
                              >
                                {isItemExpanded ? 'Close' : 'Edit'}
                              </button>
                            </div>

                            {/* Expanded Edit */}
                            {isItemExpanded && (
                              <div className="px-5 pb-4 pt-1 bg-maritime-700/20">
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs text-maritime-400 mb-1">Status</label>
                                    <select
                                      value={editStatus}
                                      onChange={(e) => setEditStatus(e.target.value)}
                                      className="w-full bg-maritime-900 border border-maritime-600 rounded px-2 py-1.5 text-white text-xs"
                                    >
                                      {statusOptions.map((s) => (
                                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-maritime-400 mb-1">Notes</label>
                                    <input
                                      value={editNotes}
                                      onChange={(e) => setEditNotes(e.target.value)}
                                      className="w-full bg-maritime-900 border border-maritime-600 rounded px-2 py-1.5 text-white text-xs"
                                      placeholder="Add notes..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-maritime-400 mb-1">Document Ref</label>
                                    <input
                                      value={editDocRef}
                                      onChange={(e) => setEditDocRef(e.target.value)}
                                      className="w-full bg-maritime-900 border border-maritime-600 rounded px-2 py-1.5 text-white text-xs"
                                      placeholder="DOC-REF-001"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end mt-3">
                                  <button
                                    onClick={() => handleUpdateItem(id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-xs"
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Add Custom Item Modal */}
      <Modal open={showAddItem} onClose={() => setShowAddItem(false)} title="Add Checklist Item">
        <form onSubmit={handleAddItem}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category *">
              <select value={itemForm.category} onChange={set('category')} className={selectClass} required>
                {categories.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Responsible">
              <select value={itemForm.responsible} onChange={set('responsible')} className={selectClass}>
                <option value="">Select...</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="broker">Broker</option>
                <option value="lawyer">Lawyer</option>
                <option value="class_society">Class Society</option>
                <option value="flag_state">Flag State</option>
              </select>
            </FormField>
          </div>
          <FormField label="Item Description *">
            <input value={itemForm.item} onChange={set('item')} className={inputClass} required placeholder="e.g. Obtain Protocol of Delivery" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Assigned To">
              <input value={itemForm.assignedTo} onChange={set('assignedTo')} className={inputClass} placeholder="Person name" />
            </FormField>
            <FormField label="Due Date">
              <input type="date" value={itemForm.dueDate} onChange={set('dueDate')} className={inputClass} />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAddItem(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={adding} className={btnPrimary}>
              {adding ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
