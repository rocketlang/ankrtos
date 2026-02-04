import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { DocumentUpload } from '../components/DocumentUpload';
import {
  FolderTreeView,
  VersionHistory,
  LockIndicator,
  BlockchainBadge,
  ExpiryAlerts,
  AuditTimeline,
  BulkOperations,
} from '../components/dms';

const DOC_QUERY = gql`
  query Documents($category: String, $search: String, $folderId: String) {
    documents(category: $category, search: $search, folderId: $folderId) {
      id title category subcategory fileName fileSize mimeType entityType entityId tags notes createdAt
      folderId fileHash
    }
    documentSummary { totalDocuments totalSize categories { category count } }
  }
`;

const ARCHIVE_DOC = gql`
  mutation ArchiveDoc($id: String!) { archiveDocument(id: $id) { id } }
`;

const categoryLabels: Record<string, string> = {
  charter_party: 'Charter Party', bol: 'Bill of Lading', correspondence: 'Correspondence',
  survey: 'Survey Report', insurance: 'Insurance', certificate: 'Certificate',
  invoice: 'Invoice', report: 'Report',
};

const categoryColors: Record<string, string> = {
  charter_party: 'bg-purple-900/50 text-purple-400', bol: 'bg-blue-900/50 text-blue-400',
  correspondence: 'bg-maritime-700 text-maritime-300', survey: 'bg-yellow-900/50 text-yellow-400',
  insurance: 'bg-green-900/50 text-green-400', certificate: 'bg-orange-900/50 text-orange-400',
  invoice: 'bg-red-900/50 text-red-400', report: 'bg-cyan-900/50 text-cyan-400',
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function DocumentVault() {
  const { t } = useTranslation();
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('charter_party');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAuditTimeline, setShowAuditTimeline] = useState(false);
  const [showExpiryAlerts, setShowExpiryAlerts] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState<number | null>(null);
  const [showFolderNav, setShowFolderNav] = useState(true);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [showBulkOps, setShowBulkOps] = useState(false);

  const { data, loading, refetch } = useQuery(DOC_QUERY, {
    variables: {
      category: filterCat || undefined,
      search: search || undefined,
      folderId: selectedFolderId || undefined,
    },
  });
  const [archiveDoc] = useMutation(ARCHIVE_DOC);

  const handleArchive = async (id: string) => {
    await archiveDoc({ variables: { id } });
    refetch();
  };

  const handleUploadComplete = (documentId: string) => {
    console.log('Document uploaded:', documentId);
    refetch();
  };

  const docs = data?.documents ?? [];
  const summary = data?.documentSummary;

  const handleDocumentSelect = (docId: string) => {
    setSelectedDocumentId(docId);
    setShowVersionHistory(true);
    setShowAuditTimeline(false);
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setSelectedDocumentId(null);
    setShowVersionHistory(false);
    setShowAuditTimeline(false);
    setSelectedDocumentIds([]);
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const selectAllDocuments = () => {
    setSelectedDocumentIds(docs.map((d: any) => d.id as string));
  };

  const deselectAllDocuments = () => {
    setSelectedDocumentIds([]);
  };

  const handleBulkOperationsComplete = () => {
    setSelectedDocumentIds([]);
    setShowBulkOps(false);
    refetch();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-maritime-700 bg-maritime-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              📁 {t('dms.documentVault', 'Document Vault')}
            </h1>
            <p className="text-maritime-400 text-sm mt-1">
              {t('dms.vaultDescription', 'Central repository for maritime documents and records')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedDocumentIds.length > 0 && (
              <button
                onClick={() => setShowBulkOps(!showBulkOps)}
                className="bg-purple-900 hover:bg-purple-800 text-purple-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                ⚡ {t('dms.bulkOps', 'Bulk Ops')} ({selectedDocumentIds.length})
              </button>
            )}
            <button
              onClick={() => setShowExpiryAlerts(!showExpiryAlerts)}
              className="bg-orange-900 hover:bg-orange-800 text-orange-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              ⏰ {t('dms.expiryAlerts', 'Expiry Alerts')}
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + {t('dms.uploadDocument', 'Upload Document')}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="flex-none px-6 py-4 bg-maritime-850">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-maritime-800 border-l-4 border-maritime-500 rounded-lg p-3">
              <p className="text-maritime-500 text-xs">{t('dms.totalDocuments', 'Total Documents')}</p>
              <p className="text-lg font-bold mt-1 text-white">{summary.totalDocuments}</p>
            </div>
            <div className="bg-maritime-800 border-l-4 border-blue-500 rounded-lg p-3">
              <p className="text-maritime-500 text-xs">{t('dms.totalSize', 'Total Size')}</p>
              <p className="text-lg font-bold mt-1 text-blue-400">{formatSize(summary.totalSize)}</p>
            </div>
            {summary.categories.slice(0, 2).map((c: Record<string, unknown>) => (
              <div key={c.category as string} className="bg-maritime-800 border-l-4 border-purple-500 rounded-lg p-3">
                <p className="text-maritime-500 text-xs">{categoryLabels[c.category as string] ?? c.category}</p>
                <p className="text-lg font-bold mt-1 text-purple-400">{c.count as number}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex-none px-6 py-3 border-b border-maritime-700 bg-maritime-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFolderNav(!showFolderNav)}
              className="text-maritime-400 hover:text-white text-sm px-2 py-1 rounded transition-colors"
              title={t('dms.toggleFolderNav', 'Toggle Folder Navigation')}
            >
              {showFolderNav ? '◀' : '▶'} {t('dms.folders', 'Folders')}
            </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dms.searchPlaceholder', 'Search documents...')}
            className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 w-64"
          />
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5"
          >
            <option value="">{t('dms.allCategories', 'All Categories')}</option>
            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select
            value={expiryFilter ?? ''}
            onChange={(e) => setExpiryFilter(e.target.value ? Number(e.target.value) : null)}
            className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5"
          >
            <option value="">{t('dms.allDocuments', 'All Documents')}</option>
            <option value="30">{t('dms.expiring30days', 'Expiring in 30 days')}</option>
            <option value="60">{t('dms.expiring60days', 'Expiring in 60 days')}</option>
            <option value="90">{t('dms.expiring90days', 'Expiring in 90 days')}</option>
          </select>
          </div>

          {/* Selection Controls */}
          {docs.length > 0 && (
            <div className="flex items-center gap-2">
              {selectedDocumentIds.length === docs.length ? (
                <button
                  onClick={deselectAllDocuments}
                  className="text-xs text-maritime-400 hover:text-white transition-colors"
                >
                  {t('dms.deselectAll', 'Deselect All')}
                </button>
              ) : (
                <button
                  onClick={selectAllDocuments}
                  className="text-xs text-maritime-400 hover:text-white transition-colors"
                >
                  {t('dms.selectAll', 'Select All')} ({docs.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Folder Navigation */}
        {showFolderNav && (
          <div className="w-64 border-r border-maritime-700 bg-maritime-850 overflow-y-auto">
            <div className="p-3 border-b border-maritime-700">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                📂 {t('dms.folderStructure', 'Folder Structure')}
              </h3>
            </div>
            <FolderTreeView
              onFolderSelect={handleFolderSelect}
              selectedFolderId={selectedFolderId}
            />
          </div>
        )}

        {/* Main Content: Document Table */}
        <div className="flex-1 overflow-y-auto bg-maritime-900">
          <div className="p-6">
            {/* Bulk Operations Panel */}
            {showBulkOps && selectedDocumentIds.length > 0 && (
              <div className="mb-4">
                <BulkOperations
                  selectedDocumentIds={selectedDocumentIds}
                  onComplete={handleBulkOperationsComplete}
                  onCancel={() => setShowBulkOps(false)}
                />
              </div>
            )}
            {selectedFolderId && (
              <div className="mb-4 flex items-center gap-2 text-sm">
                <button
                  onClick={() => handleFolderSelect(null)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  ← {t('dms.allFolders', 'All Folders')}
                </button>
                <span className="text-maritime-500">/</span>
                <span className="text-maritime-300">{selectedFolderId}</span>
              </div>
            )}

            <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                    <th className="text-center px-2 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={docs.length > 0 && selectedDocumentIds.length === docs.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllDocuments();
                          } else {
                            deselectAllDocuments();
                          }
                        }}
                        className="w-4 h-4 rounded border-maritime-600 bg-maritime-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-maritime-900"
                      />
                    </th>
                    <th className="text-left px-4 py-3">{t('dms.document', 'Document')}</th>
                    <th className="text-left px-4 py-3">{t('dms.category', 'Category')}</th>
                    <th className="text-left px-4 py-3">{t('dms.file', 'File')}</th>
                    <th className="text-right px-4 py-3">{t('dms.size', 'Size')}</th>
                    <th className="text-left px-4 py-3">{t('dms.status', 'Status')}</th>
                    <th className="text-left px-4 py-3">{t('dms.date', 'Date')}</th>
                    <th className="text-left px-4 py-3">{t('dms.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-maritime-500">
                        <div className="animate-spin inline-block w-6 h-6 border-2 border-maritime-500 border-t-transparent rounded-full" />
                        <p className="mt-2">{t('dms.loading', 'Loading...')}</p>
                      </td>
                    </tr>
                  )}
                  {!loading && docs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-maritime-500">
                        <p className="text-3xl mb-2">📄</p>
                        <p>{t('dms.noDocuments', 'No documents found')}</p>
                      </td>
                    </tr>
                  )}
                  {docs.map((d: Record<string, unknown>) => (
                    <tr
                      key={d.id as string}
                      className={`border-b border-maritime-700/30 hover:bg-maritime-700/20 transition-colors ${
                        selectedDocumentId === d.id ? 'bg-maritime-700/30' : ''
                      } ${selectedDocumentIds.includes(d.id as string) ? 'bg-blue-900/20' : ''}`}
                    >
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedDocumentIds.includes(d.id as string)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleDocumentSelection(d.id as string);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-maritime-600 bg-maritime-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-maritime-900"
                        />
                      </td>
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => handleDocumentSelect(d.id as string)}
                      >
                        <p className="text-white text-xs font-medium">{d.title as string}</p>
                        {d.notes && (
                          <p className="text-maritime-500 text-[10px] mt-0.5 truncate max-w-48">
                            {d.notes as string}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            categoryColors[d.category as string] ?? ''
                          }`}
                        >
                          {categoryLabels[d.category as string] ?? d.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-maritime-300 text-xs font-mono">
                        {d.fileName as string}
                      </td>
                      <td className="px-4 py-3 text-right text-maritime-400 text-xs">
                        {formatSize(d.fileSize as number)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <LockIndicator documentId={d.id as string} currentUserId="current-user-id" />
                          <BlockchainBadge documentId={d.id as string} compact />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-maritime-400 text-xs">
                        {new Date(d.createdAt as string).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDocumentId(d.id as string);
                              setShowAuditTimeline(true);
                              setShowVersionHistory(false);
                            }}
                            className="text-blue-400 hover:text-blue-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded"
                            title={t('dms.viewAudit', 'View Audit Trail')}
                          >
                            📜
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(d.id as string);
                            }}
                            className="text-red-400 hover:text-red-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded"
                          >
                            {t('dms.archive', 'Archive')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Version History / Audit Timeline */}
        {(showVersionHistory || showAuditTimeline) && selectedDocumentId && (
          <div className="w-96 border-l border-maritime-700 bg-maritime-850 overflow-y-auto">
            <div className="p-3 border-b border-maritime-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowVersionHistory(true)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    showVersionHistory
                      ? 'bg-blue-900 text-blue-400'
                      : 'text-maritime-400 hover:text-white'
                  }`}
                >
                  📝 {t('dms.versions', 'Versions')}
                </button>
                <button
                  onClick={() => setShowAuditTimeline(true)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    showAuditTimeline
                      ? 'bg-blue-900 text-blue-400'
                      : 'text-maritime-400 hover:text-white'
                  }`}
                >
                  📜 {t('dms.audit', 'Audit')}
                </button>
              </div>
              <button
                onClick={() => {
                  setShowVersionHistory(false);
                  setShowAuditTimeline(false);
                  setSelectedDocumentId(null);
                }}
                className="text-maritime-400 hover:text-white text-lg"
              >
                ×
              </button>
            </div>
            <div className="p-3">
              {showVersionHistory && <VersionHistory documentId={selectedDocumentId} />}
              {showAuditTimeline && <AuditTimeline documentId={selectedDocumentId} />}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">
                {t('dms.uploadDocuments', 'Upload Documents')}
              </h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-maritime-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <label className="text-maritime-400 text-xs mb-2 block">
                {t('dms.documentCategory', 'Document Category')}
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-2"
              >
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {selectedFolderId && (
              <div className="mb-4 p-3 bg-maritime-900 rounded border border-maritime-700">
                <p className="text-maritime-400 text-xs mb-1">
                  {t('dms.uploadToFolder', 'Upload to folder')}:
                </p>
                <p className="text-white text-sm font-mono">{selectedFolderId}</p>
              </div>
            )}

            <DocumentUpload
              category={uploadCategory}
              onUploadComplete={handleUploadComplete}
              onError={(error) => console.error('Upload error:', error)}
            />

            <div className="mt-6 pt-4 border-t border-maritime-700">
              <button
                onClick={() => setShowUpload(false)}
                className="w-full bg-maritime-700 hover:bg-maritime-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expiry Alerts Modal */}
      {showExpiryAlerts && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-maritime-900 border border-maritime-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-none p-4 border-b border-maritime-700 flex items-center justify-between">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                ⏰ {t('dms.certificateExpiry', 'Certificate Expiry Dashboard')}
              </h2>
              <button
                onClick={() => setShowExpiryAlerts(false)}
                className="text-maritime-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ExpiryAlerts />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
