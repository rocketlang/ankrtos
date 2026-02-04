/**
 * Version History Component
 * Document version timeline with compare functionality
 */

import { useQuery, gql } from '@apollo/client';
import { useTranslation } from 'react-i18next';

const GET_DOCUMENT_VERSIONS = gql`
  query GetDocumentVersions($documentId: String!) {
    getDocumentVersions(documentId: $documentId) {
      id
      versionNumber
      fileHash
      fileSize
      mimeType
      changelog
      uploadedBy
      uploadedByName
      createdAt
    }
  }
`;

interface Version {
  id: string;
  versionNumber: number;
  fileHash: string;
  fileSize: number;
  mimeType: string;
  changelog?: string;
  uploadedBy: string;
  uploadedByName?: string;
  createdAt: string;
}

interface VersionHistoryProps {
  documentId: string;
  onVersionSelect?: (version: Version) => void;
}

export function VersionHistory({ documentId, onVersionSelect }: VersionHistoryProps) {
  const { t } = useTranslation();
  const { data, loading } = useQuery(GET_DOCUMENT_VERSIONS, {
    variables: { documentId },
    skip: !documentId,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-maritime-500">
        <div className="animate-spin inline-block w-5 h-5 border-2 border-maritime-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const versions: Version[] = data?.getDocumentVersions || [];

  if (versions.length === 0) {
    return (
      <div className="p-4 text-center text-maritime-500">
        <p className="text-2xl mb-2">📄</p>
        <p className="text-xs">{t('dms.noVersions', 'No versions yet')}</p>
      </div>
    );
  }

  return (
    <div className="bg-maritime-800 rounded-lg border border-maritime-700">
      <div className="p-3 border-b border-maritime-700">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          🕒 {t('dms.versionHistory', 'Version History')}
        </h3>
        <p className="text-xs text-maritime-500 mt-1">
          {versions.length} {t('dms.versions', 'versions')}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {versions.map((version, index) => (
          <div
            key={version.id}
            onClick={() => onVersionSelect?.(version)}
            className="px-4 py-3 border-b border-maritime-700 last:border-b-0 hover:bg-maritime-700 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-900 text-blue-400 text-xs font-bold">
                    v{version.versionNumber}
                  </span>
                  {index === 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-900 text-green-400 rounded">
                      {t('dms.current', 'Current')}
                    </span>
                  )}
                </div>

                {version.changelog && (
                  <p className="text-xs text-maritime-300 mb-2">{version.changelog}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-maritime-500">
                  <span title="File size">📦 {formatFileSize(version.fileSize)}</span>
                  <span title="Uploaded by">👤 {version.uploadedByName || version.uploadedBy}</span>
                  <span title="Upload date">📅 {formatDate(version.createdAt)}</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Download this version
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                ↓ {t('dms.download', 'Download')}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-maritime-700">
        <button className="w-full text-xs text-maritime-400 hover:text-white transition-colors">
          + {t('dms.uploadNewVersion', 'Upload New Version')}
        </button>
      </div>
    </div>
  );
}
