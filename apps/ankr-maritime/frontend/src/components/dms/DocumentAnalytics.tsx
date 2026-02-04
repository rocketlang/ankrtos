/**
 * Document Analytics Component
 * Shows document usage statistics and activity
 */

import { useQuery, useMutation, gql } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const GET_DOCUMENT_ANALYTICS = gql`
  mutation GetDocumentAnalytics($documentId: String!, $days: Int) {
    getDocumentAnalytics(documentId: $documentId, days: $days) {
      totalViews
      totalDownloads
      lastViewedAt
      lastDownloadedAt
      recentActivity {
        days
        events
        byEventType
        uniqueUsers
        dailyActivity
      }
    }
  }
`;

const GENERATE_THUMBNAIL = gql`
  mutation GenerateThumbnail($documentId: String!) {
    generateThumbnail(documentId: $documentId)
  }
`;

const GENERATE_PREVIEW = gql`
  mutation GeneratePreview($documentId: String!) {
    generatePreview(documentId: $documentId)
  }
`;

const ADD_WATERMARK = gql`
  mutation AddWatermark($documentId: String!, $watermarkText: String!) {
    addWatermark(documentId: $documentId, watermarkText: $watermarkText)
  }
`;

interface DocumentAnalyticsProps {
  documentId: string;
}

export function DocumentAnalytics({ documentId }: DocumentAnalyticsProps) {
  const { t } = useTranslation();
  const [days, setDays] = useState(30);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [watermarkedUrl, setWatermarkedUrl] = useState<string | null>(null);

  const [getAnalytics, { data, loading }] = useMutation(GET_DOCUMENT_ANALYTICS);
  const [generateThumbnail, { loading: thumbnailLoading }] =
    useMutation(GENERATE_THUMBNAIL);
  const [generatePreview, { loading: previewLoading }] = useMutation(GENERATE_PREVIEW);
  const [addWatermark, { loading: watermarkLoading }] = useMutation(ADD_WATERMARK);

  const analytics = data?.getDocumentAnalytics;

  const handleLoadAnalytics = async () => {
    await getAnalytics({ variables: { documentId, days } });
  };

  const handleGenerateThumbnail = async () => {
    try {
      const { data } = await generateThumbnail({ variables: { documentId } });
      setThumbnailUrl(data.generateThumbnail);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleGeneratePreview = async () => {
    try {
      const { data } = await generatePreview({ variables: { documentId } });
      setPreviewUrl(data.generatePreview);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleAddWatermark = async () => {
    if (!watermarkText.trim()) {
      alert('Please enter watermark text');
      return;
    }
    try {
      const { data } = await addWatermark({
        variables: { documentId, watermarkText },
      });
      setWatermarkedUrl(data.addWatermark);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  return (
    <div className="bg-maritime-800 border border-maritime-700 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-maritime-700">
        <h3 className="text-white font-semibold flex items-center gap-2">
          📊 {t('dms.documentAnalytics', 'Document Analytics')}
        </h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Analytics Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={handleLoadAnalytics}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              {loading ? t('common.loading', 'Loading...') : t('dms.loadAnalytics', 'Load Analytics')}
            </button>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-maritime-700 border border-maritime-600 text-white text-sm px-3 py-2 rounded"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          {analytics && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-maritime-750 p-3 rounded border border-maritime-600">
                <p className="text-maritime-500 text-xs">{t('dms.totalViews', 'Total Views')}</p>
                <p className="text-2xl font-bold text-blue-400">{analytics.totalViews}</p>
                <p className="text-maritime-500 text-xs mt-1">
                  {t('dms.lastViewed', 'Last')}: {formatDate(analytics.lastViewedAt)}
                </p>
              </div>

              <div className="bg-maritime-750 p-3 rounded border border-maritime-600">
                <p className="text-maritime-500 text-xs">{t('dms.totalDownloads', 'Total Downloads')}</p>
                <p className="text-2xl font-bold text-green-400">{analytics.totalDownloads}</p>
                <p className="text-maritime-500 text-xs mt-1">
                  {t('dms.lastDownloaded', 'Last')}: {formatDate(analytics.lastDownloadedAt)}
                </p>
              </div>

              <div className="bg-maritime-750 p-3 rounded border border-maritime-600">
                <p className="text-maritime-500 text-xs">
                  {t('dms.recentEvents', 'Recent Events')} ({analytics.recentActivity.days}d)
                </p>
                <p className="text-2xl font-bold text-purple-400">
                  {analytics.recentActivity.events}
                </p>
              </div>

              <div className="bg-maritime-750 p-3 rounded border border-maritime-600">
                <p className="text-maritime-500 text-xs">{t('dms.uniqueUsers', 'Unique Users')}</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {analytics.recentActivity.uniqueUsers}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Features */}
        <div className="border-t border-maritime-700 pt-4">
          <h4 className="text-white font-medium text-sm mb-3">
            {t('dms.advancedFeatures', 'Advanced Features')}
          </h4>

          <div className="space-y-3">
            {/* Thumbnail */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerateThumbnail}
                disabled={thumbnailLoading}
                className="bg-maritime-700 hover:bg-maritime-600 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {thumbnailLoading ? '...' : '🖼️ ' + t('dms.generateThumbnail', 'Generate Thumbnail')}
              </button>
              {thumbnailUrl && (
                <a
                  href={thumbnailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm truncate"
                >
                  {t('dms.viewThumbnail', 'View Thumbnail')} →
                </a>
              )}
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleGeneratePreview}
                disabled={previewLoading}
                className="bg-maritime-700 hover:bg-maritime-600 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {previewLoading ? '...' : '🔍 ' + t('dms.generatePreview', 'Generate Preview')}
              </button>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm truncate"
                >
                  {t('dms.viewPreview', 'View Preview')} →
                </a>
              )}
            </div>

            {/* Watermark */}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="Watermark text"
                className="bg-maritime-700 border border-maritime-600 text-white text-sm px-3 py-2 rounded flex-1"
              />
              <button
                onClick={handleAddWatermark}
                disabled={watermarkLoading}
                className="bg-maritime-700 hover:bg-maritime-600 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {watermarkLoading ? '...' : '💧 ' + t('dms.addWatermark', 'Add Watermark')}
              </button>
            </div>
            {watermarkedUrl && (
              <a
                href={watermarkedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 text-sm block"
              >
                ⬇️ {t('dms.downloadWatermarked', 'Download Watermarked PDF')} →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
