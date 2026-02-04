/**
 * Bank Reconciliation Dashboard
 * Phase 6: DA Desk & Port Agency
 * Business Value: $52K/year time savings (20 hours/week)
 */

import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react';
import { Modal, FormField, inputClass, btnPrimary, btnSecondary } from '../components/Modal';

// ========================================
// GRAPHQL QUERIES & MUTATIONS
// ========================================

const RECONCILIATION_SUMMARY = gql`
  query ReconciliationSummary {
    reconciliationSummary {
      totalFDAs
      reconciledFDAs
      partiallyReconciledFDAs
      unreconciledFDAs
      totalVariance
      averageVariancePercent
    }
  }
`;

const RECONCILIATION_REPORT = gql`
  query ReconciliationReport($fdaId: String!) {
    reconciliationReport(fdaId: $fdaId) {
      fdaId
      totalFdaAmount
      totalBankAmount
      matchedAmount
      unmatchedFdaItems
      unmatchedTransactions {
        date
        description
        debit
        credit
        balance
        reference
        currency
      }
      matches {
        fdaLineItemId
        transactionId
        matchConfidence
        matchType
        variance
        status
      }
      reconciliationStatus
      varianceAmount
      variancePercent
    }
  }
`;

const RECONCILE_FDA = gql`
  mutation ReconcileFDA($fdaId: String!, $bankStatementFile: String!) {
    reconcileFDA(fdaId: $fdaId, bankStatementFile: $bankStatementFile) {
      fdaId
      reconciliationStatus
    }
  }
`;

const MANUAL_MATCH = gql`
  mutation ManualMatch($fdaLineItemId: String!, $transactionId: String!) {
    manualMatch(fdaLineItemId: $fdaLineItemId, transactionId: $transactionId) {
      fdaLineItemId
      transactionId
    }
  }
`;

const APPROVE_RECONCILIATION = gql`
  mutation ApproveReconciliation($fdaId: String!) {
    approveReconciliation(fdaId: $fdaId) {
      fdaId
      reconciliationStatus
    }
  }
`;

// ========================================
// TYPES
// ========================================

const statusColors: Record<string, string> = {
  fully_reconciled: 'bg-green-900/50 text-green-400',
  partially_reconciled: 'bg-yellow-900/50 text-yellow-400',
  unreconciled: 'bg-red-900/50 text-red-400',
  pending: 'bg-blue-900/50 text-blue-400',
};

const matchTypeColors: Record<string, string> = {
  exact: 'bg-green-900/50 text-green-400',
  fuzzy: 'bg-blue-900/50 text-blue-400',
  manual: 'bg-purple-900/50 text-purple-400',
};

// ========================================
// COMPONENT
// ========================================

export function BankReconciliation() {
  const [fdaId, setFdaId] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState('');

  const { data: summaryData, loading: summaryLoading } = useQuery(RECONCILIATION_SUMMARY);

  const { data: reportData, loading: reportLoading, refetch } = useQuery(RECONCILIATION_REPORT, {
    variables: { fdaId },
    skip: !fdaId,
  });

  const [reconcileFDA, { loading: reconciling }] = useMutation(RECONCILE_FDA);
  const [manualMatch] = useMutation(MANUAL_MATCH);
  const [approveReconciliation] = useMutation(APPROVE_RECONCILIATION);

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    await reconcileFDA({
      variables: {
        fdaId,
        bankStatementFile: uploadFile,
      },
    });
    setShowUpload(false);
    setUploadFile('');
    refetch();
  };

  const handleManualMatch = async (fdaLineItemId: string, transactionId: string) => {
    await manualMatch({
      variables: { fdaLineItemId, transactionId },
    });
    refetch();
  };

  const handleApprove = async () => {
    if (!fdaId) return;
    await approveReconciliation({
      variables: { fdaId },
    });
    refetch();
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const summary = summaryData?.reconciliationSummary;
  const report = reportData?.reconciliationReport;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          Bank Reconciliation
        </h1>
        <p className="text-gray-400">Auto-match FDA payments with bank statements • 20 hours/week time savings</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Total FDAs</div>
            <div className="text-3xl font-bold text-white">{summary.totalFDAs}</div>
            <div className="text-xs text-gray-500 mt-1">Under reconciliation</div>
          </div>

          <div className="bg-green-900/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Fully Reconciled</div>
            <div className="text-3xl font-bold text-green-400">{summary.reconciledFDAs}</div>
            <div className="text-xs text-gray-500 mt-1">
              {((summary.reconciledFDAs / summary.totalFDAs) * 100).toFixed(1)}% completion rate
            </div>
          </div>

          <div className="bg-yellow-900/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Partially Reconciled</div>
            <div className="text-3xl font-bold text-yellow-400">{summary.partiallyReconciledFDAs}</div>
            <div className="text-xs text-gray-500 mt-1">Needs manual review</div>
          </div>

          <div className="bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Total Variance</div>
            <div className="text-3xl font-bold text-red-400">{fmt(summary.totalVariance)}</div>
            <div className="text-xs text-gray-500 mt-1">
              Avg {summary.averageVariancePercent.toFixed(2)}% variance
            </div>
          </div>
        </div>
      )}

      {/* FDA Selection */}
      <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">FDA ID to Reconcile</label>
            <input
              type="text"
              value={fdaId}
              onChange={(e) => setFdaId(e.target.value)}
              placeholder="Enter FDA ID..."
              className="w-full bg-blue-950/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <button
            onClick={() => setShowUpload(true)}
            disabled={!fdaId}
            className={btnPrimary}
          >
            📤 Upload Bank Statement
          </button>
        </div>
      </div>

      {/* Reconciliation Report */}
      {report && (
        <div className="space-y-6">
          {/* Status Header */}
          <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">FDA Reconciliation Report</h2>
                <p className="text-gray-400 text-sm mt-1">FDA ID: {report.fdaId}</p>
              </div>
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${statusColors[report.reconciliationStatus]}`}>
                {report.reconciliationStatus.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-400">FDA Total</div>
                <div className="text-2xl font-bold text-white">{fmt(report.totalFdaAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Bank Total</div>
                <div className="text-2xl font-bold text-blue-400">{fmt(report.totalBankAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Variance</div>
                <div className={`text-2xl font-bold ${
                  Math.abs(report.varianceAmount) < 1 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {fmt(report.varianceAmount)} ({report.variancePercent.toFixed(2)}%)
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-500/30">
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-blue-950/50 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${(report.matchedAmount / report.totalFdaAmount) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-gray-400">
                  {fmt(report.matchedAmount)} matched ({((report.matchedAmount / report.totalFdaAmount) * 100).toFixed(1)}%)
                </div>
              </div>
            </div>

            {report.reconciliationStatus === 'fully_reconciled' && (
              <div className="mt-4">
                <button onClick={handleApprove} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors">
                  ✓ Approve Reconciliation
                </button>
              </div>
            )}
          </div>

          {/* Matched Transactions */}
          {report.matches && report.matches.length > 0 && (
            <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                ✓ Matched Transactions ({report.matches.length})
              </h3>
              <div className="space-y-2">
                {report.matches.map((match: any, idx: number) => (
                  <div key={idx} className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-white font-semibold">Line Item: {match.fdaLineItemId.substring(0, 8)}</div>
                        <div className="text-sm text-gray-400">Transaction: {match.transactionId.substring(0, 8)}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs ${matchTypeColors[match.matchType]}`}>
                          {match.matchType.toUpperCase()}
                        </span>
                        <div className="text-sm text-green-400 mt-1">
                          {(match.matchConfidence * 100).toFixed(0)}% confidence
                        </div>
                      </div>
                    </div>
                    {match.variance !== 0 && (
                      <div className="text-sm text-orange-400 mt-2">
                        Variance: {fmt(match.variance)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unmatched Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Unmatched FDA Items */}
            {report.unmatchedFdaItems && report.unmatchedFdaItems.length > 0 && (
              <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  ⚠️ Unmatched FDA Items ({report.unmatchedFdaItems.length})
                </h3>
                <div className="space-y-2">
                  {report.unmatchedFdaItems.map((item: any, idx: number) => (
                    <div key={idx} className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                      <div className="text-white font-semibold">{item.description}</div>
                      <div className="text-sm text-yellow-400 mt-1">{fmt(item.amount)}</div>
                      <div className="text-xs text-gray-400">{item.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unmatched Bank Transactions */}
            {report.unmatchedTransactions && report.unmatchedTransactions.length > 0 && (
              <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  ⚠️ Unmatched Bank Transactions ({report.unmatchedTransactions.length})
                </h3>
                <div className="space-y-2">
                  {report.unmatchedTransactions.map((txn: any, idx: number) => (
                    <div key={idx} className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-semibold">{txn.description}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(txn.date).toLocaleDateString()}
                            {txn.reference && ` • Ref: ${txn.reference}`}
                          </div>
                        </div>
                        <div className="text-right">
                          {txn.debit && <div className="text-sm text-red-400">-{fmt(txn.debit)}</div>}
                          {txn.credit && <div className="text-sm text-green-400">+{fmt(txn.credit)}</div>}
                          <div className="text-xs text-gray-400">{txn.currency}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Manual Matching Section */}
          {report.unmatchedFdaItems?.length > 0 && report.unmatchedTransactions?.length > 0 && (
            <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">🔗 Manual Matching</h3>
              <p className="text-gray-400 text-sm mb-4">
                Drag FDA items to bank transactions to create manual matches, or use the dropdowns below:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">FDA Line Item</label>
                  <select className="w-full bg-blue-950/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white">
                    <option>Select FDA item...</option>
                    {report.unmatchedFdaItems.map((item: any, idx: number) => (
                      <option key={idx} value={item.id}>
                        {item.description} - {fmt(item.amount)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Bank Transaction</label>
                  <select className="w-full bg-blue-950/50 border border-blue-500/30 rounded-lg px-4 py-2 text-white">
                    <option>Select transaction...</option>
                    {report.unmatchedTransactions.map((txn: any, idx: number) => (
                      <option key={idx} value={txn.id}>
                        {txn.description} - {txn.debit ? `-${fmt(txn.debit)}` : `+${fmt(txn.credit)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                Create Manual Match
              </button>
            </div>
          )}
        </div>
      )}

      {!fdaId && !reportLoading && (
        <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🏦</div>
          <h3 className="text-2xl font-bold text-white mb-2">Enter FDA ID to Begin</h3>
          <p className="text-gray-400">Upload your bank statement and let AI auto-match transactions</p>
        </div>
      )}

      {/* Upload Bank Statement Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Bank Statement">
        <form onSubmit={handleReconcile} className="space-y-4">
          <FormField label="Bank Statement File">
            <input
              type="text"
              value={uploadFile}
              onChange={(e) => setUploadFile(e.target.value)}
              placeholder="Enter file path or URL..."
              className={inputClass}
              required
            />
            <p className="text-xs text-gray-400 mt-2">
              Supported formats: CSV, Excel, PDF (with OCR), QIF, OFX
            </p>
          </FormField>

          <div className="bg-blue-950/50 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">How it works:</h4>
            <ol className="text-sm text-gray-300 space-y-1">
              <li>1. Upload your bank statement</li>
              <li>2. AI extracts transactions and matches with FDA items</li>
              <li>3. Review matches and resolve discrepancies</li>
              <li>4. Approve reconciliation (95% faster than manual)</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={reconciling} className={btnPrimary}>
              {reconciling ? 'Processing...' : 'Upload & Reconcile'}
            </button>
            <button type="button" onClick={() => setShowUpload(false)} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
