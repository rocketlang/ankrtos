/**
 * Expiry Alerts Component
 * Certificate expiry dashboard with 30/60/90 day filters
 */

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useTranslation } from 'react-i18next';

const GET_EXPIRING_CERTIFICATES = gql`
  query GetExpiringCertificates($daysAhead: Int!) {
    getExpiringCertificates(daysAhead: $daysAhead) {
      id
      documentId
      certificateType
      issuedBy
      expiryDate
      vesselId
      renewalStatus
      daysUntilExpiry
    }
  }
`;

interface Certificate {
  id: string;
  documentId: string;
  certificateType: string;
  issuedBy?: string;
  expiryDate: string;
  vesselId?: string;
  renewalStatus: string;
  daysUntilExpiry: number;
}

export function ExpiryAlerts() {
  const { t } = useTranslation();
  const [daysAhead, setDaysAhead] = useState(90);

  const { data, loading } = useQuery(GET_EXPIRING_CERTIFICATES, {
    variables: { daysAhead },
  });

  const certificates: Certificate[] = data?.getExpiringCertificates || [];

  const critical = certificates.filter((c) => c.daysUntilExpiry <= 30);
  const warning = certificates.filter((c) => c.daysUntilExpiry > 30 && c.daysUntilExpiry <= 60);
  const info = certificates.filter((c) => c.daysUntilExpiry > 60);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 0) {
      return { icon: '🔴', label: t('dms.expired', 'EXPIRED'), color: 'red' };
    }
    if (days <= 30) {
      return { icon: '⚠️', label: t('dms.critical', 'CRITICAL'), color: 'red' };
    }
    if (days <= 60) {
      return { icon: '⚡', label: t('dms.urgent', 'URGENT'), color: 'yellow' };
    }
    return { icon: 'ℹ️', label: t('dms.upcoming', 'UPCOMING'), color: 'blue' };
  };

  const renderCertificate = (cert: Certificate) => {
    const urgency = getUrgencyBadge(cert.daysUntilExpiry);

    return (
      <div
        key={cert.id}
        className="px-4 py-3 border-b border-maritime-700 last:border-b-0 hover:bg-maritime-700 cursor-pointer transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold bg-${urgency.color}-900 text-${urgency.color}-400`}>
                {urgency.icon} {urgency.label}
              </span>
              <span className="text-xs text-maritime-400">
                {cert.daysUntilExpiry > 0
                  ? `${cert.daysUntilExpiry} ${t('dms.daysLeft', 'days left')}`
                  : `${Math.abs(cert.daysUntilExpiry)} ${t('dms.daysOverdue', 'days overdue')}`}
              </span>
            </div>

            <h4 className="text-sm font-medium text-white mb-1">
              {cert.certificateType.replace(/_/g, ' ').toUpperCase()}
            </h4>

            <div className="flex items-center gap-3 text-xs text-maritime-500">
              {cert.issuedBy && <span>📋 {cert.issuedBy}</span>}
              <span>📅 {t('dms.expires', 'Expires')}: {formatDate(cert.expiryDate)}</span>
              {cert.vesselId && <span>🚢 {cert.vesselId}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span
              className={`px-2 py-1 rounded text-xs ${
                cert.renewalStatus === 'pending'
                  ? 'bg-yellow-900 text-yellow-400'
                  : cert.renewalStatus === 'in_progress'
                  ? 'bg-blue-900 text-blue-400'
                  : 'bg-green-900 text-green-400'
              }`}
            >
              {cert.renewalStatus.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-maritime-500">
        <div className="animate-spin inline-block w-8 h-8 border-2 border-maritime-500 border-t-transparent rounded-full" />
        <p className="mt-3 text-sm">{t('dms.loadingCertificates', 'Loading certificates...')}</p>
      </div>
    );
  }

  return (
    <div className="bg-maritime-800 rounded-lg border border-maritime-700">
      <div className="p-4 border-b border-maritime-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            ⏰ {t('dms.expiringCertificates', 'Expiring Certificates')}
          </h3>
          <span className="text-sm text-maritime-400">
            {certificates.length} {t('dms.total', 'total')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {[30, 60, 90].map((days) => (
            <button
              key={days}
              onClick={() => setDaysAhead(days)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                daysAhead === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-maritime-700 text-maritime-300 hover:text-white'
              }`}
            >
              {days} {t('dms.days', 'days')}
            </button>
          ))}
        </div>

        {certificates.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-maritime-400">{critical.length} {t('dms.critical', 'Critical')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-maritime-400">{warning.length} {t('dms.warning', 'Warning')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-maritime-400">{info.length} {t('dms.info', 'Info')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {certificates.length === 0 ? (
          <div className="p-8 text-center text-maritime-500">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-sm">{t('dms.allCertificatesValid', 'All certificates are valid!')}</p>
            <p className="text-xs mt-1">{t('dms.noCertificatesExpiring', `No certificates expiring in the next ${daysAhead} days`)}</p>
          </div>
        ) : (
          <>
            {critical.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-red-900/20 text-red-400 text-xs font-semibold">
                  🔴 {t('dms.criticalAlerts', 'CRITICAL ALERTS')} ({critical.length})
                </div>
                {critical.map(renderCertificate)}
              </div>
            )}

            {warning.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-yellow-900/20 text-yellow-400 text-xs font-semibold">
                  ⚠️ {t('dms.warnings', 'WARNINGS')} ({warning.length})
                </div>
                {warning.map(renderCertificate)}
              </div>
            )}

            {info.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-blue-900/20 text-blue-400 text-xs font-semibold">
                  ℹ️ {t('dms.upcoming', 'UPCOMING')} ({info.length})
                </div>
                {info.map(renderCertificate)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
