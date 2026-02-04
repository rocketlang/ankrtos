import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const KYC_RECORDS_QUERY = gql`
  query KYCRecords($companyId: String, $status: String) {
    kycRecords(companyId: $companyId, status: $status) {
      id companyId status riskScore
      uboName uboNationality uboPepCheck
      sanctionsCheck sanctionsResult sanctionsDate
      taxId maritimeLicense
      reviewer reviewNotes lastChecked
      company { id name type }
    }
  }
`;

const COMPANIES_QUERY = gql`
  query Companies {
    companies { id name type }
  }
`;

const CREATE_KYC_RECORD = gql`
  mutation CreateKYCRecord(
    $companyId: String!, $uboName: String, $uboNationality: String,
    $taxId: String, $maritimeLicense: String, $reviewNotes: String
  ) {
    createKYCRecord(
      companyId: $companyId, uboName: $uboName, uboNationality: $uboNationality,
      taxId: $taxId, maritimeLicense: $maritimeLicense, reviewNotes: $reviewNotes
    ) { id }
  }
`;

const UPDATE_KYC_STATUS = gql`
  mutation UpdateKYCStatus(
    $id: String!, $status: String!, $riskScore: Int,
    $sanctionsResult: String, $reviewer: String, $reviewNotes: String
  ) {
    updateKYCStatus(
      id: $id, status: $status, riskScore: $riskScore,
      sanctionsResult: $sanctionsResult, reviewer: $reviewer, reviewNotes: $reviewNotes
    ) { id }
  }
`;

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-900/50 text-yellow-400',
  in_review: 'bg-blue-900/50 text-blue-400',
  approved: 'bg-green-900/50 text-green-400',
  rejected: 'bg-red-900/50 text-red-400',
  expired: 'bg-maritime-700 text-maritime-400',
};

const kycStatuses = ['pending', 'in_review', 'approved', 'rejected', 'expired'];

const emptyForm = {
  companyId: '', uboName: '', uboNationality: '', taxId: '', maritimeLicense: '', reviewNotes: '',
};

const emptyReviewForm = {
  id: '', status: 'in_review', riskScore: '', sanctionsResult: '', reviewer: '', reviewNotes: '',
};

function riskColor(score: number | null): string {
  if (score == null) return 'text-maritime-500';
  if (score <= 30) return 'text-green-400';
  if (score <= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function riskBg(score: number | null): string {
  if (score == null) return 'bg-maritime-700';
  if (score <= 30) return 'bg-green-900/50';
  if (score <= 60) return 'bg-yellow-900/50';
  return 'bg-red-900/50';
}

function sanctionsIcon(check: string | null, result: string | null): { icon: string; color: string } {
  if (!check || check === 'pending') return { icon: '\u23F3', color: 'text-maritime-500' };
  if (result === 'pass' || result === 'clear') return { icon: '\u2705', color: 'text-green-400' };
  if (result === 'fail' || result === 'match') return { icon: '\u274C', color: 'text-red-400' };
  return { icon: '\u2753', color: 'text-maritime-400' };
}

export function KYC() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);

  const queryVars: Record<string, string | undefined> = {};
  if (statusFilter !== 'all') queryVars.status = statusFilter;
  if (companyFilter) queryVars.companyId = companyFilter;

  const { data, loading, error, refetch } = useQuery(KYC_RECORDS_QUERY, { variables: queryVars });
  const { data: companyData } = useQuery(COMPANIES_QUERY);
  const [createKYCRecord, { loading: creating }] = useMutation(CREATE_KYC_RECORD);
  const [updateKYCStatus, { loading: updating }] = useMutation(UPDATE_KYC_STATUS);

  const records = data?.kycRecords ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createKYCRecord({
      variables: {
        companyId: form.companyId,
        uboName: form.uboName || null,
        uboNationality: form.uboNationality || null,
        taxId: form.taxId || null,
        maritimeLicense: form.maritimeLicense || null,
        reviewNotes: form.reviewNotes || null,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateKYCStatus({
      variables: {
        id: reviewForm.id,
        status: reviewForm.status,
        riskScore: reviewForm.riskScore ? Number(reviewForm.riskScore) : null,
        sanctionsResult: reviewForm.sanctionsResult || null,
        reviewer: reviewForm.reviewer || null,
        reviewNotes: reviewForm.reviewNotes || null,
      },
    });
    setReviewForm(emptyReviewForm);
    setShowReview(false);
    refetch();
  };

  const openReview = (record: Record<string, unknown>) => {
    setReviewForm({
      id: record.id as string,
      status: (record.status as string) || 'in_review',
      riskScore: record.riskScore != null ? String(record.riskScore) : '',
      sanctionsResult: (record.sanctionsResult as string) || '',
      reviewer: (record.reviewer as string) || '',
      reviewNotes: (record.reviewNotes as string) || '',
    });
    setShowReview(true);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const setR = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setReviewForm((f) => ({ ...f, [field]: e.target.value }));

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : '-';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">KYC / Compliance</h1>
          <p className="text-maritime-400 text-sm mt-1">Know Your Customer records, sanctions and risk screening</p>
        </div>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
            <option value="all">All Statuses</option>
            {kycStatuses.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
            <option value="">All Companies</option>
            {companyData?.companies?.map((c: { id: string; name: string }) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New KYC Record</button>
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading KYC records...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Risk Score</th>
                <th className="text-left px-4 py-3 font-medium">UBO Name</th>
                <th className="text-center px-4 py-3 font-medium">Sanctions</th>
                <th className="text-left px-4 py-3 font-medium">Last Checked</th>
                <th className="text-left px-4 py-3 font-medium">Reviewer</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: Record<string, unknown>) => {
                const score = r.riskScore as number | null;
                const sanctions = sanctionsIcon(r.sanctionsCheck as string | null, r.sanctionsResult as string | null);
                return (
                  <tr key={r.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                    <td className="px-4 py-3 text-white font-medium">
                      {(r.company as Record<string, string>)?.name ?? '-'}
                      <span className="text-maritime-500 text-xs ml-2">{(r.company as Record<string, string>)?.type ?? ''}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[(r.status as string)] ?? 'bg-maritime-700 text-maritime-300'}`}>
                        {(r.status as string).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {score != null ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${riskBg(score)} ${riskColor(score)}`}>
                          {score}
                        </span>
                      ) : (
                        <span className="text-maritime-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-maritime-300">{(r.uboName as string) || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={sanctions.color} title={`${r.sanctionsCheck ?? 'pending'}: ${r.sanctionsResult ?? 'n/a'}`}>
                        {sanctions.icon}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-xs">{fmtDate(r.lastChecked as string | null)}</td>
                    <td className="px-4 py-3 text-maritime-300">{(r.reviewer as string) || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openReview(r)}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {records.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No KYC records found</p>
          )}
        </div>
      )}

      {/* Create KYC Record Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New KYC Record">
        <form onSubmit={handleCreate}>
          <FormField label="Company *">
            <select value={form.companyId} onChange={set('companyId')} className={selectClass} required>
              <option value="">-- Select Company --</option>
              {companyData?.companies?.map((c: { id: string; name: string; type: string }) => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="UBO Name">
              <input value={form.uboName} onChange={set('uboName')} className={inputClass} placeholder="John Smith" />
            </FormField>
            <FormField label="UBO Nationality">
              <input value={form.uboNationality} onChange={set('uboNationality')} className={inputClass} placeholder="British" />
            </FormField>
            <FormField label="Tax ID">
              <input value={form.taxId} onChange={set('taxId')} className={inputClass} placeholder="GB123456789" />
            </FormField>
            <FormField label="Maritime License">
              <input value={form.maritimeLicense} onChange={set('maritimeLicense')} className={inputClass} placeholder="ML-2026-001" />
            </FormField>
          </div>
          <FormField label="Review Notes">
            <textarea value={form.reviewNotes} onChange={set('reviewNotes')}
              className={`${inputClass} h-20 resize-none`} placeholder="Initial observations, documents received, etc." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review KYC Modal */}
      <Modal open={showReview} onClose={() => setShowReview(false)} title="Review KYC Record">
        <form onSubmit={handleReview}>
          <FormField label="Status *">
            <select value={reviewForm.status} onChange={setR('status')} className={selectClass} required>
              {kycStatuses.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Risk Score (0-100)">
              <input type="number" min="0" max="100" value={reviewForm.riskScore} onChange={setR('riskScore')}
                className={inputClass} placeholder="25" />
            </FormField>
            <FormField label="Sanctions Result">
              <select value={reviewForm.sanctionsResult} onChange={setR('sanctionsResult')} className={selectClass}>
                <option value="">-- Select --</option>
                <option value="clear">Clear</option>
                <option value="pass">Pass</option>
                <option value="match">Match Found</option>
                <option value="fail">Fail</option>
              </select>
            </FormField>
          </div>
          <FormField label="Reviewer Name">
            <input value={reviewForm.reviewer} onChange={setR('reviewer')} className={inputClass} placeholder="Jane Doe" />
          </FormField>
          <FormField label="Review Notes">
            <textarea value={reviewForm.reviewNotes} onChange={setR('reviewNotes')}
              className={`${inputClass} h-20 resize-none`} placeholder="Review findings and decision rationale..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowReview(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={updating} className={btnPrimary}>
              {updating ? 'Updating...' : 'Update KYC Status'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
