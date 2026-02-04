/**
 * Bulk Operations Component
 * Handles batch upload, delete, and download operations
 */

import { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { useTranslation } from 'react-i18next';

const BULK_DELETE = gql`
  mutation BulkDeleteDocuments($documentIds: [String!]!) {
    bulkDeleteDocuments(documentIds: $documentIds) {
      jobId
      totalDocuments
      status
    }
  }
`;

const BULK_DOWNLOAD = gql`
  mutation BulkDownloadDocuments($documentIds: [String!]!, $zipFileName: String) {
    bulkDownloadDocuments(documentIds: $documentIds, zipFileName: $zipFileName) {
      jobId
      totalDocuments
      status
    }
  }
`;

const GET_JOB_PROGRESS = gql`
  mutation GetBulkJobProgress($jobId: String!, $queueName: String!) {
    getBulkJobProgress(jobId: $jobId, queueName: $queueName) {
      jobId
      status
      progress
      total
      processed
      successful
      failed
      errors
      result
    }
  }
`;

interface BulkOperationsProps {
  selectedDocumentIds: string[];
  onComplete?: () => void;
  onCancel?: () => void;
}

export function BulkOperations({
  selectedDocumentIds,
  onComplete,
  onCancel,
}: BulkOperationsProps) {
  const { t } = useTranslation();
  const [activeJob, setActiveJob] = useState<{
    jobId: string;
    queueName: string;
    operation: string;
  } | null>(null);
  const [progress, setProgress] = useState<any>(null);

  const [bulkDelete, { loading: deletingLoading }] = useMutation(BULK_DELETE);
  const [bulkDownload, { loading: downloadLoading }] = useMutation(BULK_DOWNLOAD);
  const [getProgress, { loading: progressLoading }] = useMutation(GET_JOB_PROGRESS);

  // Poll for job progress
  const pollProgress = async (jobId: string, queueName: string) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await getProgress({
          variables: { jobId, queueName },
        });

        const progressData = data?.getBulkJobProgress;
        setProgress(progressData);

        if (progressData?.status === 'completed') {
          clearInterval(interval);
          setTimeout(() => {
            setActiveJob(null);
            setProgress(null);
            onComplete?.();
          }, 2000);
        } else if (progressData?.status === 'failed') {
          clearInterval(interval);
          setTimeout(() => {
            setActiveJob(null);
            setProgress(null);
          }, 3000);
        }
      } catch (error) {
        console.error('Failed to get job progress:', error);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`${t('dms.confirmBulkDelete', 'Delete')} ${selectedDocumentIds.length} ${t('dms.documents', 'documents')}?`)) {
      return;
    }

    try {
      const { data } = await bulkDelete({
        variables: { documentIds: selectedDocumentIds },
      });

      const jobInfo = data?.bulkDeleteDocuments;
      if (jobInfo?.jobId) {
        setActiveJob({
          jobId: jobInfo.jobId,
          queueName: 'bulk-delete',
          operation: 'delete',
        });
        pollProgress(jobInfo.jobId, 'bulk-delete');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleBulkDownload = async () => {
    try {
      const { data } = await bulkDownload({
        variables: {
          documentIds: selectedDocumentIds,
          zipFileName: `documents_${Date.now()}.zip`,
        },
      });

      const jobInfo = data?.bulkDownloadDocuments;
      if (jobInfo?.jobId) {
        setActiveJob({
          jobId: jobInfo.jobId,
          queueName: 'bulk-download',
          operation: 'download',
        });
        pollProgress(jobInfo.jobId, 'bulk-download');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (selectedDocumentIds.length === 0) {
    return (
      <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4 text-center">
        <p className="text-maritime-500 text-sm">
          {t('dms.selectDocuments', 'Select documents to perform bulk operations')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          ⚡ {t('dms.bulkOperations', 'Bulk Operations')}
        </h3>
        <span className="text-maritime-400 text-sm">
          {selectedDocumentIds.length} {t('dms.selected', 'selected')}
        </span>
      </div>

      {/* Progress Display */}
      {activeJob && progress && (
        <div className="mb-4 p-3 bg-maritime-750 rounded-lg border border-maritime-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-medium capitalize">
              {activeJob.operation === 'delete' ? '🗑️' : '📦'}{' '}
              {t(`dms.${activeJob.operation}ing`, `${activeJob.operation}ing`)}...
            </span>
            <span className="text-maritime-300 text-xs">
              {progress.processed}/{progress.total}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-maritime-700 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all ${
                progress.status === 'completed'
                  ? 'bg-green-500'
                  : progress.status === 'failed'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-maritime-400">
              {t('dms.successful', 'Successful')}: {progress.successful} |{' '}
              {t('dms.failed', 'Failed')}: {progress.failed}
            </span>
            <span
              className={`px-2 py-0.5 rounded ${
                progress.status === 'completed'
                  ? 'bg-green-900 text-green-400'
                  : progress.status === 'failed'
                  ? 'bg-red-900 text-red-400'
                  : 'bg-blue-900 text-blue-400'
              }`}
            >
              {progress.status}
            </span>
          </div>

          {/* Download URL for completed downloads */}
          {progress.status === 'completed' &&
            activeJob.operation === 'download' &&
            progress.result?.downloadUrl && (
              <div className="mt-3 pt-3 border-t border-maritime-600">
                <a
                  href={progress.result.downloadUrl}
                  download
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
                >
                  ⬇️ {t('dms.downloadZip', 'Download ZIP')}
                </a>
                <p className="text-maritime-500 text-xs text-center mt-2">
                  {t('dms.expiresIn', 'Expires in')}: 24 hours
                </p>
              </div>
            )}

          {/* Errors */}
          {progress.errors && progress.errors.length > 0 && (
            <div className="mt-2 p-2 bg-red-900/20 rounded text-xs text-red-400">
              <p className="font-semibold mb-1">{t('dms.errors', 'Errors')}:</p>
              <ul className="list-disc list-inside">
                {progress.errors.slice(0, 5).map((error: string, i: number) => (
                  <li key={i}>{error}</li>
                ))}
                {progress.errors.length > 5 && (
                  <li>...and {progress.errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {!activeJob && (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleBulkDownload}
            disabled={downloadLoading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadLoading ? (
              <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                📦 {t('dms.downloadAsZip', 'Download as ZIP')}
              </>
            )}
          </button>

          <button
            onClick={handleBulkDelete}
            disabled={deletingLoading}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deletingLoading ? (
              <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                🗑️ {t('dms.deleteSelected', 'Delete Selected')}
              </>
            )}
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              className="flex items-center justify-center gap-2 bg-maritime-700 hover:bg-maritime-600 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
