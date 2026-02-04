import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const PREFERRED_VENDORS = gql`
  query PreferredVendors($serviceType: String) {
    preferredVendors(serviceType: $serviceType) {
      id companyId serviceType portId priority notes addedBy createdAt
      company { id name type }
    }
  }
`;

const BLACKLIST = gql`
  query VendorBlacklist {
    vendorBlacklist {
      id companyId reason description severity blacklistedBy reviewDate createdAt
      company { id name type }
    }
  }
`;

const ADD_PREFERRED = gql`
  mutation AddPreferred($companyId: String!, $serviceType: String!, $priority: Int, $notes: String) {
    addPreferredVendor(companyId: $companyId, serviceType: $serviceType, priority: $priority, notes: $notes) { id }
  }
`;

const REMOVE_PREFERRED = gql`
  mutation RemovePreferred($id: String!) { removePreferredVendor(id: $id) }
`;

const BLACKLIST_VENDOR = gql`
  mutation BlacklistVendor($companyId: String!, $reason: String!, $description: String, $severity: String) {
    blacklistVendor(companyId: $companyId, reason: $reason, description: $description, severity: $severity) { id }
  }
`;

const REMOVE_BLACKLIST = gql`
  mutation RemoveBlacklist($id: String!) { removeFromBlacklist(id: $id) }
`;

const serviceTypes = [
  { value: '', label: 'All Service Types' },
  { value: 'port_agent', label: 'Port Agent' },
  { value: 'stevedore', label: 'Stevedore' },
  { value: 'surveyor', label: 'Surveyor' },
  { value: 'bunker_supplier', label: 'Bunker Supplier' },
  { value: 'towage', label: 'Towage' },
  { value: 'pilotage', label: 'Pilotage' },
];

const blacklistReasons = [
  { value: 'poor_performance', label: 'Poor Performance' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'overcharging', label: 'Overcharging' },
  { value: 'non_compliance', label: 'Non-Compliance' },
  { value: 'sanctions', label: 'Sanctions' },
  { value: 'dispute', label: 'Dispute' },
  { value: 'other', label: 'Other' },
];

const severityOptions = [
  { value: 'warning', label: 'Warning' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'blocked', label: 'Blocked' },
];

const severityBadge: Record<string, string> = {
  blocked: 'bg-red-900/50 text-red-400',
  restricted: 'bg-amber-900/50 text-amber-400',
  warning: 'bg-yellow-900/50 text-yellow-400',
};

const emptyPrefForm = { companyId: '', serviceType: 'port_agent', priority: '1', notes: '' };
const emptyBlackForm = { companyId: '', reason: 'poor_performance', severity: 'restricted', description: '' };

export function VendorManagement() {
  const [tab, setTab] = useState<'preferred' | 'blacklist'>('preferred');
  const [filterService, setFilterService] = useState('');
  const [showAddPreferred, setShowAddPreferred] = useState(false);
  const [showAddBlacklist, setShowAddBlacklist] = useState(false);
  const [prefForm, setPrefForm] = useState(emptyPrefForm);
  const [blackForm, setBlackForm] = useState(emptyBlackForm);

  const { data: prefData, loading: prefLoading, refetch: refetchPref } = useQuery(PREFERRED_VENDORS, {
    variables: { serviceType: filterService || undefined },
  });

  const { data: blackData, loading: blackLoading, refetch: refetchBlack } = useQuery(BLACKLIST);

  const [addPreferred, { loading: addingPref }] = useMutation(ADD_PREFERRED);
  const [removePreferred] = useMutation(REMOVE_PREFERRED);
  const [blacklistVendor, { loading: addingBlack }] = useMutation(BLACKLIST_VENDOR);
  const [removeBlacklist] = useMutation(REMOVE_BLACKLIST);

  const vendors = prefData?.preferredVendors ?? [];
  const blacklist = blackData?.vendorBlacklist ?? [];

  const handleAddPreferred = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefForm.companyId || !prefForm.serviceType) return;
    await addPreferred({
      variables: {
        companyId: prefForm.companyId,
        serviceType: prefForm.serviceType,
        priority: parseInt(prefForm.priority) || 1,
        notes: prefForm.notes || undefined,
      },
    });
    setPrefForm(emptyPrefForm);
    setShowAddPreferred(false);
    refetchPref();
  };

  const handleRemovePreferred = async (id: string) => {
    if (!confirm('Remove this vendor from preferred list?')) return;
    await removePreferred({ variables: { id } });
    refetchPref();
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blackForm.companyId || !blackForm.reason) return;
    await blacklistVendor({
      variables: {
        companyId: blackForm.companyId,
        reason: blackForm.reason,
        description: blackForm.description || undefined,
        severity: blackForm.severity,
      },
    });
    setBlackForm(emptyBlackForm);
    setShowAddBlacklist(false);
    refetchBlack();
  };

  const handleRemoveBlacklist = async (id: string) => {
    if (!confirm('Remove this vendor from the blacklist?')) return;
    await removeBlacklist({ variables: { id } });
    refetchBlack();
  };

  const setPref = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setPrefForm((f) => ({ ...f, [field]: e.target.value }));

  const setBlack = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setBlackForm((f) => ({ ...f, [field]: e.target.value }));

  const tabClass = (t: string) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t ? 'bg-maritime-800 text-white border-t border-x border-maritime-700' : 'text-maritime-400 hover:text-maritime-300'}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Vendor Management</h1>
          <p className="text-maritime-400 text-sm mt-1">Preferred vendors, service providers, and blacklist management</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-maritime-800 border-l-4 border-blue-500 rounded-lg p-4">
          <p className="text-maritime-500 text-xs">Preferred Vendors</p>
          <p className="text-lg font-bold mt-1 text-white">{vendors.length}</p>
        </div>
        <div className="bg-maritime-800 border-l-4 border-red-500 rounded-lg p-4">
          <p className="text-maritime-500 text-xs">Blacklisted</p>
          <p className="text-lg font-bold mt-1 text-red-400">{blacklist.length}</p>
        </div>
        <div className="bg-maritime-800 border-l-4 border-amber-500 rounded-lg p-4">
          <p className="text-maritime-500 text-xs">Restricted</p>
          <p className="text-lg font-bold mt-1 text-amber-400">
            {blacklist.filter((b: Record<string, unknown>) => b.severity === 'restricted').length}
          </p>
        </div>
        <div className="bg-maritime-800 border-l-4 border-yellow-500 rounded-lg p-4">
          <p className="text-maritime-500 text-xs">Warnings</p>
          <p className="text-lg font-bold mt-1 text-yellow-400">
            {blacklist.filter((b: Record<string, unknown>) => b.severity === 'warning').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-maritime-700">
        <button onClick={() => setTab('preferred')} className={tabClass('preferred')}>Preferred Vendors</button>
        <button onClick={() => setTab('blacklist')} className={tabClass('blacklist')}>
          Blacklist
          {blacklist.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-red-900/50 text-red-400">{blacklist.length}</span>
          )}
        </button>
      </div>

      {/* Preferred Vendors Tab */}
      {tab === 'preferred' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <select value={filterService} onChange={(e) => setFilterService(e.target.value)}
              className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
              {serviceTypes.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={() => setShowAddPreferred(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
              + Add Preferred Vendor
            </button>
          </div>

          {prefLoading && <p className="text-maritime-400">Loading vendors...</p>}

          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                  <th className="text-left px-4 py-3">Company</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Service Type</th>
                  <th className="text-center px-4 py-3">Priority</th>
                  <th className="text-left px-4 py-3">Notes</th>
                  <th className="text-left px-4 py-3">Added</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!prefLoading && vendors.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-maritime-500">No preferred vendors found</td></tr>
                )}
                {vendors.map((v: Record<string, unknown>) => {
                  const company = v.company as Record<string, unknown> | null;
                  return (
                    <tr key={v.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                      <td className="px-4 py-3 text-white font-medium">{company?.name as string || v.companyId as string}</td>
                      <td className="px-4 py-3 text-maritime-300 text-xs capitalize">{(company?.type as string || '-').replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400 capitalize">
                          {(v.serviceType as string).replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-mono text-sm font-bold ${
                          (v.priority as number) === 1 ? 'text-green-400' :
                          (v.priority as number) === 2 ? 'text-blue-400' :
                          'text-maritime-300'
                        }`}>#{v.priority as number}</span>
                      </td>
                      <td className="px-4 py-3 text-maritime-400 text-xs max-w-[200px] truncate">{(v.notes as string) || '-'}</td>
                      <td className="px-4 py-3 text-maritime-400 text-xs">
                        {v.createdAt ? new Date(v.createdAt as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleRemovePreferred(v.id as string)}
                          className="text-red-400/60 hover:text-red-400 text-xs">Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blacklist Tab */}
      {tab === 'blacklist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <button onClick={() => setShowAddBlacklist(true)}
              className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
              + Add to Blacklist
            </button>
          </div>

          {blackLoading && <p className="text-maritime-400">Loading blacklist...</p>}

          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                  <th className="text-left px-4 py-3">Company</th>
                  <th className="text-left px-4 py-3">Reason</th>
                  <th className="text-center px-4 py-3">Severity</th>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-left px-4 py-3">Review Date</th>
                  <th className="text-left px-4 py-3">Blacklisted</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!blackLoading && blacklist.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-maritime-500">No blacklisted vendors</td></tr>
                )}
                {blacklist.map((b: Record<string, unknown>) => {
                  const company = b.company as Record<string, unknown> | null;
                  const sev = b.severity as string || 'restricted';
                  return (
                    <tr key={b.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                      <td className="px-4 py-3 text-white font-medium">{company?.name as string || b.companyId as string}</td>
                      <td className="px-4 py-3 text-maritime-300 text-xs capitalize">{(b.reason as string).replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${severityBadge[sev] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {sev}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-maritime-400 text-xs max-w-[250px] truncate">{(b.description as string) || '-'}</td>
                      <td className="px-4 py-3 text-maritime-400 text-xs">
                        {b.reviewDate ? new Date(b.reviewDate as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-maritime-400 text-xs">
                        {b.createdAt ? new Date(b.createdAt as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleRemoveBlacklist(b.id as string)}
                          className="text-green-400/60 hover:text-green-400 text-xs">Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Preferred Vendor Modal */}
      <Modal open={showAddPreferred} onClose={() => setShowAddPreferred(false)} title="Add Preferred Vendor">
        <form onSubmit={handleAddPreferred}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Company ID *">
              <input value={prefForm.companyId} onChange={setPref('companyId')} className={inputClass} required placeholder="Company UUID or ID" />
            </FormField>
            <FormField label="Service Type *">
              <select value={prefForm.serviceType} onChange={setPref('serviceType')} className={selectClass} required>
                {serviceTypes.filter((s) => s.value).map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Priority">
              <input type="number" min={1} max={10} value={prefForm.priority} onChange={setPref('priority')} className={inputClass} placeholder="1" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={prefForm.notes} onChange={setPref('notes')} rows={3} className={inputClass} placeholder="Why this vendor is preferred..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAddPreferred(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={addingPref} className={btnPrimary}>
              {addingPref ? 'Adding...' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add to Blacklist Modal */}
      <Modal open={showAddBlacklist} onClose={() => setShowAddBlacklist(false)} title="Add to Blacklist">
        <form onSubmit={handleAddBlacklist}>
          <FormField label="Company ID *">
            <input value={blackForm.companyId} onChange={setBlack('companyId')} className={inputClass} required placeholder="Company UUID or ID" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Reason *">
              <select value={blackForm.reason} onChange={setBlack('reason')} className={selectClass} required>
                {blacklistReasons.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Severity *">
              <select value={blackForm.severity} onChange={setBlack('severity')} className={selectClass} required>
                {severityOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Description">
            <textarea value={blackForm.description} onChange={setBlack('description')} rows={3} className={inputClass}
              placeholder="Detailed reason for blacklisting..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAddBlacklist(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={addingBlack}
              className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50">
              {addingBlack ? 'Adding...' : 'Blacklist Vendor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
