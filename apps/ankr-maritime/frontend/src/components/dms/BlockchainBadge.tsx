/**
 * Blockchain Badge Component
 * Shows blockchain verification status with link to explorer
 */

import { useQuery, gql } from '@apollo/client';
import { useTranslation } from 'react-i18next';

const VERIFY_BLOCKCHAIN_PROOF = gql`
  query VerifyBlockchainProof($documentId: String!) {
    verifyBlockchainProof(documentId: $documentId) {
      verified
      proof {
        id
        blockchainTxId
        blockchainNetwork
        verificationUrl
        proofType
        eblNumber
        eblStandard
        createdAt
      }
      timestamp
      error
    }
  }
`;

interface BlockchainBadgeProps {
  documentId: string;
  compact?: boolean;
}

export function BlockchainBadge({ documentId, compact = false }: BlockchainBadgeProps) {
  const { t } = useTranslation();
  const { data, loading } = useQuery(VERIFY_BLOCKCHAIN_PROOF, {
    variables: { documentId },
    skip: !documentId,
  });

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-maritime-700 text-maritime-400 text-xs">
        <div className="animate-spin inline-block w-3 h-3 border border-maritime-500 border-t-transparent rounded-full" />
        {!compact && <span>{t('dms.verifying', 'Verifying...')}</span>}
      </div>
    );
  }

  const verification = data?.verifyBlockchainProof;

  if (!verification || !verification.verified) {
    return null; // No blockchain proof exists
  }

  const { proof } = verification;
  const networkIcon = proof.blockchainNetwork === 'polygon' ? '⬡' : '⟠';
  const networkColor = proof.blockchainNetwork === 'polygon' ? 'purple' : 'blue';

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  if (compact) {
    return (
      <a
        href={proof.verificationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 px-2 py-1 rounded bg-${networkColor}-900 text-${networkColor}-400 hover:bg-${networkColor}-800 transition-colors text-xs font-medium`}
        title={`${t('dms.blockchainVerified', 'Blockchain Verified')} on ${proof.blockchainNetwork}\nTx: ${proof.blockchainTxId.substring(0, 16)}...`}
      >
        {networkIcon} ✓
      </a>
    );
  }

  return (
    <div className={`bg-${networkColor}-900/30 border border-${networkColor}-700 rounded-lg p-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-${networkColor}-400 text-lg`}>{networkIcon}</span>
            <h4 className={`text-sm font-semibold text-${networkColor}-400`}>
              {t('dms.blockchainVerified', 'Blockchain Verified')}
            </h4>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-900 text-green-400 text-xs font-medium">
              ✓ {t('dms.verified', 'Verified')}
            </span>
          </div>

          <div className="space-y-1 text-xs text-maritime-300">
            <div className="flex items-center gap-2">
              <span className="text-maritime-500">{t('dms.network', 'Network')}:</span>
              <span className="font-mono">{proof.blockchainNetwork.toUpperCase()}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-maritime-500">{t('dms.txId', 'Transaction')}:</span>
              <span className="font-mono text-xs truncate max-w-xs">
                {proof.blockchainTxId.substring(0, 10)}...{proof.blockchainTxId.substring(proof.blockchainTxId.length - 8)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-maritime-500">{t('dms.type', 'Type')}:</span>
              <span>{proof.proofType.replace('_', ' ').toUpperCase()}</span>
            </div>

            {proof.eblNumber && (
              <div className="flex items-center gap-2">
                <span className="text-maritime-500">{t('dms.eblNumber', 'eBL Number')}:</span>
                <span>{proof.eblNumber}</span>
              </div>
            )}

            {proof.eblStandard && (
              <div className="flex items-center gap-2">
                <span className="text-maritime-500">{t('dms.standard', 'Standard')}:</span>
                <span>{proof.eblStandard}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-maritime-500">{t('dms.recorded', 'Recorded')}:</span>
              <span>{formatDate(proof.createdAt)}</span>
            </div>
          </div>
        </div>

        <a
          href={proof.verificationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-3 py-1.5 rounded bg-${networkColor}-800 text-${networkColor}-300 hover:text-white transition-colors text-xs font-medium`}
        >
          {t('dms.viewOnExplorer', 'View on Explorer')} →
        </a>
      </div>
    </div>
  );
}
