/**
 * Lock Indicator Component
 * Shows document lock status with locked-by info
 */

import { useQuery, useMutation, gql } from '@apollo/client';
import { useTranslation } from 'react-i18next';

const GET_LOCK_STATUS = gql`
  query GetDocumentLockStatus($documentId: String!) {
    getDocumentLockStatus(documentId: $documentId) {
      isLocked
      lock {
        id
        lockedBy
        lockedByName
        lockReason
        expectedRelease
        lockedAt
      }
    }
  }
`;

const CHECK_OUT_DOCUMENT = gql`
  mutation CheckOutDocument($input: CheckOutInput!) {
    checkOutDocument(input: $input) {
      id
      documentId
      lockedBy
      lockedByName
      lockReason
      lockedAt
    }
  }
`;

const CHECK_IN_DOCUMENT = gql`
  mutation CheckInDocument($documentId: String!) {
    checkInDocument(documentId: $documentId)
  }
`;

interface LockIndicatorProps {
  documentId: string;
  currentUserId?: string;
}

export function LockIndicator({ documentId, currentUserId }: LockIndicatorProps) {
  const { t } = useTranslation();
  const { data, loading, refetch } = useQuery(GET_LOCK_STATUS, {
    variables: { documentId },
    skip: !documentId,
  });

  const [checkOut, { loading: checkingOut }] = useMutation(CHECK_OUT_DOCUMENT, {
    onCompleted: () => refetch(),
  });

  const [checkIn, { loading: checkingIn }] = useMutation(CHECK_IN_DOCUMENT, {
    onCompleted: () => refetch(),
  });

  const handleCheckOut = async () => {
    try {
      await checkOut({
        variables: {
          input: {
            documentId,
            lockReason: 'Editing',
          },
        },
      });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCheckIn = async () => {
    try {
      await checkIn({ variables: { documentId } });
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-maritime-700 text-maritime-400 text-xs">
        <div className="animate-spin inline-block w-3 h-3 border border-maritime-500 border-t-transparent rounded-full" />
        <span>{t('dms.checking', 'Checking...')}</span>
      </div>
    );
  }

  const lockStatus = data?.getDocumentLockStatus;
  const isLocked = lockStatus?.isLocked;
  const lock = lockStatus?.lock;
  const isLockedByCurrentUser = lock?.lockedBy === currentUserId;

  if (!isLocked) {
    return (
      <button
        onClick={handleCheckOut}
        disabled={checkingOut}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-blue-900 text-blue-400 hover:bg-blue-800 transition-colors text-xs font-medium disabled:opacity-50"
      >
        🔓 {t('dms.checkOut', 'Check Out')}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium ${
          isLockedByCurrentUser
            ? 'bg-green-900 text-green-400'
            : 'bg-red-900 text-red-400'
        }`}
        title={`${t('dms.lockedBy', 'Locked by')}: ${lock?.lockedByName || lock?.lockedBy}\n${t('dms.reason', 'Reason')}: ${lock?.lockReason || 'Editing'}`}
      >
        🔒 {t('dms.locked', 'Locked')}
        <span className="text-xs opacity-75">
          by {isLockedByCurrentUser ? t('dms.you', 'you') : lock?.lockedByName || lock?.lockedBy}
        </span>
      </div>

      {isLockedByCurrentUser && (
        <button
          onClick={handleCheckIn}
          disabled={checkingIn}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-maritime-700 text-maritime-300 hover:text-white transition-colors text-xs disabled:opacity-50"
        >
          ✓ {t('dms.checkIn', 'Check In')}
        </button>
      )}
    </div>
  );
}
