import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;

const COMPLIANCE_QUERY = gql`
  query Compliance($vesselId: String, $category: String, $status: String) {
    complianceItems(vesselId: $vesselId, category: $category, status: $status) {
      id vesselId category title description status dueDate completedDate inspector findings priority
      vessel { name }
    }
    complianceSummary { total compliant nonCompliant pendingReview expired dueSoon }
    vessels { id name }
  }
`;

const CREATE_ITEM = gql`
  mutation CreateCompliance($vesselId: String!, $category: String!, $title: String!, $description: String, $priority: String, $dueDate: DateTime) {
    createComplianceItem(vesselId: $vesselId, category: $category, title: $title, description: $description, priority: $priority, dueDate: $dueDate) { id }
  }
`;

const UPDATE_STATUS = gql`
  mutation UpdateCompliance($id: String!, $status: String!, $findings: String, $inspector: String) {
    updateComplianceStatus(id: $id, status: $status, findings: $findings, inspector: $inspector) { id }
  }
`;

const categoryLabels: Record<string, string> = {
  ism: 'ISM', isps: 'ISPS', marpol: 'MARPOL', solas: 'SOLAS', stcw: 'STCW',
  port_state: 'Port State', flag_state: 'Flag State', class: 'Classification',
};

const statusColors: Record<string, string> = {
  compliant: 'bg-green-900/50 text-green-400',
  non_compliant: 'bg-red-900/50 text-red-400',
  pending_review: 'bg-yellow-900/50 text-yellow-400',
  expired: 'bg-red-900/80 text-red-300',
  waiver: 'bg-purple-900/50 text-purple-400',
};

const priorityColors: Record<string, string> = {
  low: 'text-maritime-400', medium: 'text-yellow-400', high: 'text-orange-400', critical: 'text-red-400',
};

export function Compliance() {
  const [filterVessel, setFilterVessel] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { data, loading, refetch } = useQuery(COMPLIANCE_QUERY, {
    variables: { vesselId: filterVessel || undefined, category: filterCat || undefined, status: filterStatus || undefined },
  });
  const [createItem] = useMutation(CREATE_ITEM);
  const [updateStatus] = useMutation(UPDATE_STATUS);

  const [form, setForm] = useState({ vesselId: '', category: 'ism', title: '', description: '', priority: 'medium' });

  const handleCreate = async () => {
    if (!form.vesselId || !form.title) return;
    await createItem({ variables: form });
    setShowCreate(false);
    setForm({ vesselId: '', category: 'ism', title: '', description: '', priority: 'medium' });
    refetch();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatus({ variables: { id, status } });
    refetch();
  };

  const items = data?.complianceItems ?? [];
  const summary = data?.complianceSummary;
  const vessels = data?.vessels ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">ISM/ISPS Compliance</h1>
          <p className="text-maritime-400 text-sm mt-1">Safety management, security compliance, and audit tracking</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Add Item
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'Total Items', value: summary.total, color: 'text-white', border: 'border-maritime-500' },
            { label: 'Compliant', value: summary.compliant, color: 'text-green-400', border: 'border-green-500' },
            { label: 'Non-Compliant', value: summary.nonCompliant, color: 'text-red-400', border: 'border-red-500' },
            { label: 'Pending Review', value: summary.pendingReview, color: 'text-yellow-400', border: 'border-yellow-500' },
            { label: 'Expired', value: summary.expired, color: 'text-red-400', border: 'border-red-500' },
            { label: 'Due < 30d', value: summary.dueSoon, color: summary.dueSoon > 0 ? 'text-orange-400' : 'text-maritime-400', border: summary.dueSoon > 0 ? 'border-orange-500' : 'border-maritime-500' },
          ].map((s) => (
            <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-3`}>
              <p className="text-maritime-500 text-[10px]">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <select value={filterVessel} onChange={(e) => setFilterVessel(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Vessels</option>
          {vessels.map((v: Record<string, unknown>) => <option key={v.id as string} value={v.id as string}>{v.name as string}</option>)}
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Categories</option>
          {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Status</option>
          {Object.keys(statusColors).map((k) => <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-maritime-400 text-xs border-b border-maritime-700">
              <th className="text-left px-4 py-3">Item</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Vessel</th>
              <th className="text-left px-4 py-3">Priority</th>
              <th className="text-left px-4 py-3">Due Date</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-8 text-maritime-500">Loading...</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-maritime-500">No compliance items</td></tr>}
            {items.map((item: Record<string, unknown>) => {
              const vessel = item.vessel as Record<string, unknown>;
              const isOverdue = item.dueDate && new Date(item.dueDate as string) < new Date() && item.status !== 'compliant';
              return (
                <tr key={item.id as string} className={`border-b border-maritime-700/30 hover:bg-maritime-700/20 ${isOverdue ? 'bg-red-900/10' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="text-white text-xs font-medium">{item.title as string}</p>
                    {item.description && <p className="text-maritime-500 text-[10px] mt-0.5 truncate max-w-48">{item.description as string}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-maritime-700/50 text-maritime-300 text-[10px] px-2 py-0.5 rounded font-medium">
                      {categoryLabels[item.category as string] ?? item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-maritime-300 text-xs">{vessel?.name as string}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium capitalize ${priorityColors[item.priority as string] ?? ''}`}>{item.priority as string}</span>
                  </td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">
                    {item.dueDate ? new Date(item.dueDate as string).toLocaleDateString() : '-'}
                    {isOverdue && <span className="text-red-400 ml-1 text-[10px]">OVERDUE</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${statusColors[item.status as string] ?? ''}`}>
                      {(item.status as string).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {item.status !== 'compliant' && (
                        <button onClick={() => handleStatusChange(item.id as string, 'compliant')}
                          className="text-green-400 hover:text-green-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded">Comply</button>
                      )}
                      {item.status === 'compliant' && (
                        <button onClick={() => handleStatusChange(item.id as string, 'pending_review')}
                          className="text-yellow-400 hover:text-yellow-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded">Review</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-white font-bold text-lg mb-4">Add Compliance Item</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-maritime-400 text-xs">Vessel</label>
                  <select value={form.vesselId} onChange={(e) => setForm({ ...form, vesselId: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1">
                    <option value="">Select</option>
                    {vessels.map((v: Record<string, unknown>) => <option key={v.id as string} value={v.id as string}>{v.name as string}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1">
                    {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-maritime-400 text-xs">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-maritime-400 text-xs">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Description</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="text-maritime-400 text-sm hover:text-white px-4 py-2">Cancel</button>
              <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
