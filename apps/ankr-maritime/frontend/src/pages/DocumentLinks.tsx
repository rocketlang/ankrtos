import { useQuery, useMutation, gql } from '@apollo/client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal'

const RELATED_DOCS_QUERY = gql`
  query RelatedDocuments($docType: String!, $docId: String!) {
    relatedDocuments(docType: $docType, docId: $docId) {
      id sourceDocType sourceDocId targetDocType targetDocId linkType description createdAt
    }
  }
`

const DOC_LINK_GRAPH_QUERY = gql`
  query DocumentLinkGraph($docType: String!, $docId: String!, $depth: Int) {
    documentLinkGraph(docType: $docType, docId: $docId, depth: $depth) {
      id sourceDocType sourceDocId targetDocType targetDocId linkType
    }
  }
`

const CREATE_DOC_LINK = gql`
  mutation CreateDocumentLink(
    $sourceDocType: String!, $sourceDocId: String!, $targetDocType: String!,
    $targetDocId: String!, $linkType: String!, $description: String
  ) {
    createDocumentLink(
      sourceDocType: $sourceDocType, sourceDocId: $sourceDocId,
      targetDocType: $targetDocType, targetDocId: $targetDocId,
      linkType: $linkType, description: $description
    ) { id }
  }
`

const DELETE_DOC_LINK = gql`
  mutation DeleteDocumentLink($id: String!) {
    deleteDocumentLink(id: $id) { id }
  }
`

const docTypes = [
  'charter_party', 'bill_of_lading', 'invoice', 'voyage_order', 'noon_report',
  'sof', 'nor', 'da_estimate', 'da_final', 'insurance_policy', 'crew_certificate',
  'vessel_certificate', 'compliance_report', 'inspection_report', 'contract',
]

const docTypeLabels: Record<string, string> = {
  charter_party: 'Charter Party',
  bill_of_lading: 'Bill of Lading',
  invoice: 'Invoice',
  voyage_order: 'Voyage Order',
  noon_report: 'Noon Report',
  sof: 'SOF',
  nor: 'NOR',
  da_estimate: 'DA Estimate',
  da_final: 'DA Final',
  insurance_policy: 'Insurance Policy',
  crew_certificate: 'Crew Certificate',
  vessel_certificate: 'Vessel Certificate',
  compliance_report: 'Compliance Report',
  inspection_report: 'Inspection Report',
  contract: 'Contract',
}

const linkTypes = [
  { value: 'references', label: 'References', color: 'bg-blue-500', textColor: 'text-blue-400', border: 'border-blue-500' },
  { value: 'supersedes', label: 'Supersedes', color: 'bg-purple-500', textColor: 'text-purple-400', border: 'border-purple-500' },
  { value: 'amends', label: 'Amends', color: 'bg-orange-500', textColor: 'text-orange-400', border: 'border-orange-500' },
  { value: 'supports', label: 'Supports', color: 'bg-green-500', textColor: 'text-green-400', border: 'border-green-500' },
  { value: 'contradicts', label: 'Contradicts', color: 'bg-red-500', textColor: 'text-red-400', border: 'border-red-500' },
  { value: 'attachment_of', label: 'Attachment Of', color: 'bg-maritime-500', textColor: 'text-maritime-300', border: 'border-maritime-500' },
]

const linkTypeMap = Object.fromEntries(linkTypes.map((lt) => [lt.value, lt]))

function fmtDate(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString() : '-'
}

interface GraphLink {
  id: string
  sourceDocType: string
  sourceDocId: string
  targetDocType: string
  targetDocId: string
  linkType: string
}

function GraphView({
  links,
  centerType,
  centerId,
}: {
  links: GraphLink[]
  centerType: string
  centerId: string
}) {
  if (!links.length) {
    return <p className="text-maritime-500 text-center py-8">No document relationships found</p>
  }

  // Collect unique connected nodes
  const nodeSet = new Map<string, { docType: string; docId: string }>()
  const centerKey = `${centerType}:${centerId}`
  nodeSet.set(centerKey, { docType: centerType, docId: centerId })

  for (const link of links) {
    const srcKey = `${link.sourceDocType}:${link.sourceDocId}`
    const tgtKey = `${link.targetDocType}:${link.targetDocId}`
    if (!nodeSet.has(srcKey)) nodeSet.set(srcKey, { docType: link.sourceDocType, docId: link.sourceDocId })
    if (!nodeSet.has(tgtKey)) nodeSet.set(tgtKey, { docType: link.targetDocType, docId: link.targetDocId })
  }

  const connectedNodes = Array.from(nodeSet.entries()).filter(([key]) => key !== centerKey)
  const total = connectedNodes.length
  const radius = 160

  return (
    <div className="relative w-full" style={{ height: Math.max(400, total * 30 + 200) }}>
      {/* Center node */}
      <div
        className="absolute bg-blue-600 border-2 border-blue-400 rounded-lg px-4 py-3 text-center z-10 shadow-lg shadow-blue-500/20"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          minWidth: 140,
        }}
      >
        <p className="text-white font-bold text-sm">{docTypeLabels[centerType] ?? centerType}</p>
        <p className="text-blue-200 text-xs font-mono mt-1">{centerId}</p>
      </div>

      {/* Connected nodes radiating out */}
      {connectedNodes.map(([key, node], i) => {
        const angle = (2 * Math.PI * i) / total - Math.PI / 2
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius

        // Find the link connecting this node to center
        const link = links.find(
          (l) =>
            (`${l.sourceDocType}:${l.sourceDocId}` === key && `${l.targetDocType}:${l.targetDocId}` === centerKey) ||
            (`${l.targetDocType}:${l.targetDocId}` === key && `${l.sourceDocType}:${l.sourceDocId}` === centerKey),
        )
        const lt = link ? linkTypeMap[link.linkType] : null
        const borderClass = lt?.border ?? 'border-maritime-600'

        return (
          <div key={key}>
            {/* Connection line */}
            <svg
              className="absolute z-0 pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                width: 1,
                height: 1,
                overflow: 'visible',
              }}
            >
              <line
                x1={0}
                y1={0}
                x2={x}
                y2={y}
                stroke={lt?.color?.replace('bg-', '').includes('blue') ? '#3b82f6'
                  : lt?.color?.includes('purple') ? '#a855f7'
                  : lt?.color?.includes('orange') ? '#f97316'
                  : lt?.color?.includes('green') ? '#22c55e'
                  : lt?.color?.includes('red') ? '#ef4444'
                  : '#6b7280'}
                strokeWidth={2}
                strokeDasharray="4 4"
                opacity={0.5}
              />
            </svg>

            {/* Node card */}
            <div
              className={`absolute bg-maritime-800 border-2 ${borderClass} rounded-lg px-3 py-2 text-center z-10`}
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
                minWidth: 120,
              }}
            >
              <p className="text-white text-xs font-medium">{docTypeLabels[node.docType] ?? node.docType}</p>
              <p className="text-maritime-400 text-xs font-mono mt-0.5">{node.docId}</p>
              {lt && (
                <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${lt.textColor} bg-maritime-900/50`}>
                  {lt.label}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const emptyLinkForm = {
  targetDocType: '',
  targetDocId: '',
  linkType: 'references',
  description: '',
}

export function DocumentLinks() {
  const [searchDocType, setSearchDocType] = useState('')
  const [searchDocId, setSearchDocId] = useState('')
  const [activeDocType, setActiveDocType] = useState('')
  const [activeDocId, setActiveDocId] = useState('')
  const [view, setView] = useState<'graph' | 'list'>('graph')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkForm, setLinkForm] = useState(emptyLinkForm)

  const hasSearch = !!activeDocType && !!activeDocId

  const { data: relatedData, loading: relatedLoading, refetch: refetchRelated } = useQuery(RELATED_DOCS_QUERY, {
    variables: { docType: activeDocType, docId: activeDocId },
    skip: !hasSearch,
  })

  const { data: graphData, loading: graphLoading } = useQuery(DOC_LINK_GRAPH_QUERY, {
    variables: { docType: activeDocType, docId: activeDocId, depth: 2 },
    skip: !hasSearch,
  })

  const [createLink, { loading: creating }] = useMutation(CREATE_DOC_LINK)
  const [deleteLink] = useMutation(DELETE_DOC_LINK)

  const relatedDocs = relatedData?.relatedDocuments ?? []
  const graphLinks: GraphLink[] = graphData?.documentLinkGraph ?? []

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchDocType || !searchDocId) return
    setActiveDocType(searchDocType)
    setActiveDocId(searchDocId)
  }

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault()
    await createLink({
      variables: {
        sourceDocType: activeDocType,
        sourceDocId: activeDocId,
        targetDocType: linkForm.targetDocType,
        targetDocId: linkForm.targetDocId,
        linkType: linkForm.linkType,
        description: linkForm.description || null,
      },
    })
    setLinkForm(emptyLinkForm)
    setShowLinkModal(false)
    refetchRelated()
  }

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Delete this document link?')) return
    await deleteLink({ variables: { id } })
    refetchRelated()
  }

  const setLink = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setLinkForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Document Relationships</h1>
          <p className="text-maritime-400 text-sm mt-1">Explore and manage links between maritime documents</p>
        </div>
        {hasSearch && (
          <button onClick={() => setShowLinkModal(true)} className={btnPrimary}>+ Link Document</button>
        )}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <select
          value={searchDocType}
          onChange={(e) => setSearchDocType(e.target.value)}
          className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm w-52"
        >
          <option value="">Select Document Type</option>
          {docTypes.map((t) => (
            <option key={t} value={t}>{docTypeLabels[t] ?? t}</option>
          ))}
        </select>
        <input
          value={searchDocId}
          onChange={(e) => setSearchDocId(e.target.value)}
          placeholder="Enter Document ID..."
          className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm flex-1"
        />
        <button
          type="submit"
          className={btnPrimary}
          disabled={!searchDocType || !searchDocId}
        >
          Explore
        </button>
      </form>

      {/* Link Type Legend */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {linkTypes.map((lt) => (
          <div key={lt.value} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${lt.color}`} />
            <span className="text-maritime-400 text-xs">{lt.label}</span>
          </div>
        ))}
      </div>

      {!hasSearch && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <p className="text-maritime-400">Select a document type and enter a document ID to explore relationships.</p>
        </div>
      )}

      {hasSearch && (
        <>
          {/* View Toggle */}
          <div className="flex gap-1 mb-6 border-b border-maritime-700">
            <button
              onClick={() => setView('graph')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                view === 'graph'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-maritime-400 hover:text-maritime-300'
              }`}
            >
              Graph View
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                view === 'list'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-maritime-400 hover:text-maritime-300'
              }`}
            >
              List View
            </button>
          </div>

          {(relatedLoading || graphLoading) && <p className="text-maritime-400">Loading document relationships...</p>}

          {/* Graph View */}
          {view === 'graph' && !graphLoading && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6 overflow-hidden">
              <GraphView links={graphLinks} centerType={activeDocType} centerId={activeDocId} />
            </div>
          )}

          {/* List View */}
          {view === 'list' && !relatedLoading && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-maritime-700 text-maritime-400">
                    <th className="text-left px-4 py-3 font-medium">Source</th>
                    <th className="text-center px-4 py-3 font-medium">Link Type</th>
                    <th className="text-left px-4 py-3 font-medium">Target</th>
                    <th className="text-left px-4 py-3 font-medium">Description</th>
                    <th className="text-left px-4 py-3 font-medium">Created</th>
                    <th className="text-center px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedDocs.map((link: Record<string, unknown>) => {
                    const lt = linkTypeMap[(link.linkType as string)]
                    return (
                      <tr key={link.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                        <td className="px-4 py-3">
                          <div className="text-white text-xs font-medium">{docTypeLabels[(link.sourceDocType as string)] ?? link.sourceDocType}</div>
                          <div className="text-maritime-400 font-mono text-xs">{link.sourceDocId as string}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-8 h-px bg-maritime-600" />
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${lt?.textColor ?? 'text-maritime-300'} bg-maritime-900/50`}>
                              {lt?.label ?? link.linkType}
                            </span>
                            <div className="flex items-center">
                              <div className="w-6 h-px bg-maritime-600" />
                              <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-maritime-600" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white text-xs font-medium">{docTypeLabels[(link.targetDocType as string)] ?? link.targetDocType}</div>
                          <div className="text-maritime-400 font-mono text-xs">{link.targetDocId as string}</div>
                        </td>
                        <td className="px-4 py-3 text-maritime-300 text-xs max-w-48 truncate">
                          {(link.description as string) || '-'}
                        </td>
                        <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(link.createdAt as string)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteLink(link.id as string)}
                            className="text-red-400/60 hover:text-red-400 text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {relatedDocs.length === 0 && (
                <p className="text-maritime-500 text-center py-8">No document links found</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Link Document Modal */}
      <Modal open={showLinkModal} onClose={() => setShowLinkModal(false)} title="Link Document">
        <form onSubmit={handleCreateLink}>
          <div className="bg-maritime-900/50 rounded-lg p-3 mb-4">
            <p className="text-maritime-400 text-xs mb-1">Source Document</p>
            <p className="text-white text-sm font-medium">{docTypeLabels[activeDocType] ?? activeDocType}</p>
            <p className="text-maritime-300 font-mono text-xs">{activeDocId}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Target Document Type *">
              <select value={linkForm.targetDocType} onChange={setLink('targetDocType')} className={selectClass} required>
                <option value="">-- Select Type --</option>
                {docTypes.map((t) => (
                  <option key={t} value={t}>{docTypeLabels[t] ?? t}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Target Document ID *">
              <input value={linkForm.targetDocId} onChange={setLink('targetDocId')} className={inputClass} required placeholder="DOC-2026-001" />
            </FormField>
          </div>

          <FormField label="Link Type *">
            <select value={linkForm.linkType} onChange={setLink('linkType')} className={selectClass} required>
              {linkTypes.map((lt) => (
                <option key={lt.value} value={lt.value}>{lt.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Description">
            <textarea
              value={linkForm.description}
              onChange={setLink('description')}
              className={`${inputClass} h-16 resize-none`}
              placeholder="Optional description of the relationship..."
            />
          </FormField>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowLinkModal(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Linking...' : 'Create Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
