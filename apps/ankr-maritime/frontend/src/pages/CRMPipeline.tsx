import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const LEADS_QUERY = gql`
  query LeadPipeline {
    leads {
      id title source stage companyName contactName vesselType cargoType route
      estimatedValue probability weightedValue expectedClose assignedTo notes createdAt
    }
  }
`;

const CRM_DASHBOARD = gql`
  query CRMDashboardData {
    crmDashboard {
      totalLeads totalPipelineValue avgDealSize conversionRate
    }
  }
`;

const CREATE_LEAD = gql`
  mutation CreateLead(
    $title: String!, $source: String!, $companyName: String!, $contactName: String,
    $vesselType: String, $cargoType: String, $route: String, $estimatedValue: Float,
    $probability: Int, $expectedClose: String, $assignedTo: String, $notes: String
  ) {
    createLead(
      title: $title, source: $source, companyName: $companyName, contactName: $contactName,
      vesselType: $vesselType, cargoType: $cargoType, route: $route, estimatedValue: $estimatedValue,
      probability: $probability, expectedClose: $expectedClose, assignedTo: $assignedTo, notes: $notes
    ) { id }
  }
`;

const UPDATE_STAGE = gql`
  mutation UpdateLeadStage($id: String!, $stage: String!) {
    updateLeadStage(id: $id, stage: $stage) { id stage }
  }
`;

const MARK_WON = gql`
  mutation MarkLeadWon($id: String!, $notes: String) {
    markLeadWon(id: $id, notes: $notes) { id stage }
  }
`;

const MARK_LOST = gql`
  mutation MarkLeadLost($id: String!, $reason: String!, $notes: String) {
    markLeadLost(id: $id, reason: $reason, notes: $notes) { id stage }
  }
`;

const ASSIGN_LEAD = gql`
  mutation AssignLead($id: String!, $assignedTo: String!) {
    assignLead(id: $id, assignedTo: $assignedTo) { id assignedTo }
  }
`;

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtCompact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
}

const stages = ['prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;

const stageLabels: Record<string, string> = {
  prospect: 'Prospect',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

const stageColors: Record<string, string> = {
  prospect: 'border-gray-500',
  qualified: 'border-blue-500',
  proposal: 'border-yellow-500',
  negotiation: 'border-orange-500',
  won: 'border-green-500',
  lost: 'border-red-500',
};

const stageHeaderBg: Record<string, string> = {
  prospect: 'bg-gray-500/10 text-gray-400',
  qualified: 'bg-blue-500/10 text-blue-400',
  proposal: 'bg-yellow-500/10 text-yellow-400',
  negotiation: 'bg-orange-500/10 text-orange-400',
  won: 'bg-green-500/10 text-green-400',
  lost: 'bg-red-500/10 text-red-400',
};

const nextStageMap: Record<string, string> = {
  prospect: 'qualified',
  qualified: 'proposal',
  proposal: 'negotiation',
  negotiation: 'won',
};

const sources = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'broker', label: 'Broker' },
  { value: 'website', label: 'Website' },
  { value: 'conference', label: 'Conference' },
  { value: 'referral', label: 'Referral' },
];

const lostReasons = [
  { value: 'price', label: 'Price' },
  { value: 'timing', label: 'Timing' },
  { value: 'vessel_quality', label: 'Vessel Quality' },
  { value: 'relationship', label: 'Relationship' },
  { value: 'competitor', label: 'Competitor' },
];

type Lead = {
  id: string;
  title: string;
  source: string;
  stage: string;
  companyName: string;
  contactName: string;
  vesselType: string;
  cargoType: string;
  route: string;
  estimatedValue: number;
  probability: number;
  weightedValue: number;
  expectedClose: string;
  assignedTo: string;
  notes: string;
  createdAt: string;
};

const emptyForm = {
  title: '', source: 'email', companyName: '', contactName: '',
  vesselType: '', cargoType: '', route: '', estimatedValue: '',
  probability: '50', expectedClose: '', assignedTo: '', notes: '',
};

export function CRMPipeline() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostLeadId, setLostLeadId] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState('price');
  const [lostNotes, setLostNotes] = useState('');
  const [sortByValue, setSortByValue] = useState<'asc' | 'desc'>('desc');
  const [form, setForm] = useState(emptyForm);

  const { data, loading, refetch } = useQuery(LEADS_QUERY);
  const { data: dashData } = useQuery(CRM_DASHBOARD);
  const [createLead, { loading: creating }] = useMutation(CREATE_LEAD);
  const [updateStage] = useMutation(UPDATE_STAGE);
  const [markWon] = useMutation(MARK_WON);
  const [markLost] = useMutation(MARK_LOST);
  const [assignLead] = useMutation(ASSIGN_LEAD);

  const leads: Lead[] = data?.leads ?? [];
  const dashboard = dashData?.crmDashboard;

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.companyName) return;
    await createLead({
      variables: {
        ...form,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : undefined,
        probability: form.probability ? parseInt(form.probability) : undefined,
        expectedClose: form.expectedClose || undefined,
        contactName: form.contactName || undefined,
        vesselType: form.vesselType || undefined,
        cargoType: form.cargoType || undefined,
        route: form.route || undefined,
        assignedTo: form.assignedTo || undefined,
        notes: form.notes || undefined,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const handleMoveNext = async (lead: Lead) => {
    const next = nextStageMap[lead.stage];
    if (!next) return;
    if (next === 'won') {
      await markWon({ variables: { id: lead.id } });
    } else {
      await updateStage({ variables: { id: lead.id, stage: next } });
    }
    setSelectedLead(null);
    refetch();
  };

  const handleMarkWon = async (lead: Lead) => {
    await markWon({ variables: { id: lead.id, notes: 'Marked won from pipeline' } });
    setSelectedLead(null);
    refetch();
  };

  const openLostModal = (leadId: string) => {
    setLostLeadId(leadId);
    setLostReason('price');
    setLostNotes('');
    setShowLostModal(true);
  };

  const handleMarkLost = async () => {
    if (!lostLeadId) return;
    await markLost({ variables: { id: lostLeadId, reason: lostReason, notes: lostNotes || undefined } });
    setShowLostModal(false);
    setLostLeadId(null);
    setSelectedLead(null);
    refetch();
  };

  const handleAssign = async (leadId: string, assignee: string) => {
    await assignLead({ variables: { id: leadId, assignedTo: assignee } });
    refetch();
  };

  const leadsByStage = (stage: string) => leads.filter((l) => l.stage === stage);

  const stageTotal = (stage: string) =>
    leadsByStage(stage).reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  const sortedLeads = [...leads].sort((a, b) =>
    sortByValue === 'desc'
      ? (b.estimatedValue || 0) - (a.estimatedValue || 0)
      : (a.estimatedValue || 0) - (b.estimatedValue || 0)
  );

  const kanbanStages = stages.slice(0, 5); // prospect, qualified, proposal, negotiation, won

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">CRM Pipeline</h1>
          <p className="text-maritime-400 text-sm mt-1">Lead management, deal tracking & conversion pipeline</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + New Lead
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-maritime-800 border-l-4 border-blue-500 rounded-lg p-4">
          <p className="text-maritime-500 text-xs">Total Leads</p>
          <p className="text-lg font-bold mt-1 text-white">{dashboard?.totalLeads ?? leads.length}</p>
        </div>
        <div className="bg-maritime-800 border-l-4 border-green-500 rounded-lg p-4">
          <p className="text-maritime-500 text-xs">Pipeline Value</p>
          <p className="text-lg font-bold mt-1 text-green-400">{fmt(dashboard?.totalPipelineValue ?? leads.reduce((s, l) => s + (l.estimatedValue || 0), 0))}</p>
        </div>
        <div className="bg-maritime-800 border-l-4 border-yellow-500 rounded-lg p-4">
          <p className="text-maritime-500 text-xs">Avg Deal Size</p>
          <p className="text-lg font-bold mt-1 text-yellow-400">{fmt(dashboard?.avgDealSize ?? 0)}</p>
        </div>
        <div className="bg-maritime-800 border-l-4 border-emerald-500 rounded-lg p-4">
          <p className="text-maritime-500 text-xs">Win Rate</p>
          <p className="text-lg font-bold mt-1 text-emerald-400">{(dashboard?.conversionRate ?? 0).toFixed(1)}%</p>
        </div>
      </div>

      {/* Kanban Pipeline View */}
      <div>
        <h2 className="text-white text-sm font-semibold mb-3">Pipeline Board</h2>
        <div className="grid grid-cols-5 gap-3 min-h-[400px]">
          {kanbanStages.map((stage) => {
            const stageLeads = leadsByStage(stage);
            const total = stageTotal(stage);
            return (
              <div key={stage} className="bg-maritime-800/50 border border-maritime-700 rounded-lg flex flex-col">
                {/* Column Header */}
                <div className={`px-3 py-2.5 rounded-t-lg border-b border-maritime-700 ${stageHeaderBg[stage]}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide">{stageLabels[stage]}</span>
                    <span className="text-[10px] font-mono bg-maritime-900/50 px-1.5 py-0.5 rounded">{stageLeads.length}</span>
                  </div>
                  <p className="text-[10px] mt-0.5 opacity-70">{fmtCompact(total)}</p>
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[500px]">
                  {stageLeads.length === 0 && (
                    <p className="text-maritime-600 text-[10px] text-center py-4">No leads</p>
                  )}
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`bg-maritime-800 border border-maritime-700 rounded-md p-2.5 cursor-pointer hover:bg-maritime-700/50 transition-colors border-l-4 ${stageColors[stage]}`}
                    >
                      <p className="text-white text-xs font-medium truncate">{lead.title}</p>
                      <p className="text-maritime-400 text-[10px] mt-0.5 truncate">{lead.companyName}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-green-400 text-[11px] font-mono font-medium">
                          {lead.estimatedValue ? fmtCompact(lead.estimatedValue) : '-'}
                        </span>
                        <span className="text-maritime-500 text-[10px]">{lead.probability}%</span>
                      </div>
                      {lead.expectedClose && (
                        <p className="text-maritime-500 text-[10px] mt-1">
                          Close: {new Date(lead.expectedClose).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </p>
                      )}
                      {lead.assignedTo && (
                        <p className="text-blue-400/70 text-[10px] mt-0.5 truncate">{lead.assignedTo}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lost column summary */}
      {leadsByStage('lost').length > 0 && (
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-red-400 text-sm font-semibold">Lost ({leadsByStage('lost').length})</h3>
            <span className="text-maritime-500 text-xs">{fmtCompact(stageTotal('lost'))}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {leadsByStage('lost').map((lead) => (
              <div key={lead.id} onClick={() => setSelectedLead(lead)}
                className="bg-maritime-800 border border-red-500/30 rounded px-3 py-1.5 cursor-pointer hover:bg-maritime-700/50">
                <p className="text-maritime-300 text-xs">{lead.title}</p>
                <p className="text-red-400/70 text-[10px]">{lead.companyName} &middot; {lead.estimatedValue ? fmtCompact(lead.estimatedValue) : '-'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Leads Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-sm font-semibold">Recent Leads</h2>
          <button
            onClick={() => setSortByValue(sortByValue === 'desc' ? 'asc' : 'desc')}
            className="text-maritime-400 hover:text-white text-xs"
          >
            Sort by Value {sortByValue === 'desc' ? '\u2193' : '\u2191'}
          </button>
        </div>
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Company</th>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3">Stage</th>
                <th className="text-right px-4 py-3">Value</th>
                <th className="text-right px-4 py-3">Prob</th>
                <th className="text-right px-4 py-3">Weighted</th>
                <th className="text-left px-4 py-3">Close</th>
                <th className="text-left px-4 py-3">Assigned</th>
                <th className="text-left px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} className="text-center py-8 text-maritime-500">Loading...</td></tr>
              )}
              {!loading && sortedLeads.length === 0 && (
                <tr><td colSpan={10} className="text-center py-8 text-maritime-500">No leads found</td></tr>
              )}
              {sortedLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="border-b border-maritime-700/30 hover:bg-maritime-700/20 cursor-pointer"
                >
                  <td className="px-4 py-3 text-white text-xs font-medium">{lead.title}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs">{lead.companyName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-maritime-700 text-maritime-300 capitalize">{lead.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${stageHeaderBg[lead.stage] ?? 'bg-maritime-700 text-maritime-300'}`}>
                      {stageLabels[lead.stage] || lead.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-green-400 font-mono text-xs">
                    {lead.estimatedValue ? fmt(lead.estimatedValue) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-maritime-300 text-xs">{lead.probability}%</td>
                  <td className="px-4 py-3 text-right text-yellow-400 font-mono text-xs">
                    {lead.weightedValue ? fmt(lead.weightedValue) : '-'}
                  </td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">
                    {lead.expectedClose ? new Date(lead.expectedClose).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                  </td>
                  <td className="px-4 py-3 text-blue-400 text-xs">{lead.assignedTo || '-'}</td>
                  <td className="px-4 py-3 text-maritime-500 text-xs">
                    {new Date(lead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Side Panel */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedLead(null)} />
          <div className="relative bg-maritime-800 border-l border-maritime-700 w-full max-w-md overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-maritime-700">
              <h2 className="text-lg font-semibold text-white">Lead Details</h2>
              <button onClick={() => setSelectedLead(null)} className="text-maritime-400 hover:text-white text-lg">&#x2715;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-white font-semibold text-base">{selectedLead.title}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium capitalize ${stageHeaderBg[selectedLead.stage] ?? 'bg-maritime-700 text-maritime-300'}`}>
                  {stageLabels[selectedLead.stage] || selectedLead.stage}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-maritime-900 rounded-lg p-3">
                  <p className="text-maritime-500 text-[10px]">Company</p>
                  <p className="text-white text-sm font-medium mt-0.5">{selectedLead.companyName}</p>
                </div>
                <div className="bg-maritime-900 rounded-lg p-3">
                  <p className="text-maritime-500 text-[10px]">Contact</p>
                  <p className="text-white text-sm font-medium mt-0.5">{selectedLead.contactName || '-'}</p>
                </div>
                <div className="bg-maritime-900 rounded-lg p-3">
                  <p className="text-maritime-500 text-[10px]">Estimated Value</p>
                  <p className="text-green-400 text-sm font-mono font-medium mt-0.5">
                    {selectedLead.estimatedValue ? fmt(selectedLead.estimatedValue) : '-'}
                  </p>
                </div>
                <div className="bg-maritime-900 rounded-lg p-3">
                  <p className="text-maritime-500 text-[10px]">Probability</p>
                  <p className="text-yellow-400 text-sm font-medium mt-0.5">{selectedLead.probability}%</p>
                </div>
                <div className="bg-maritime-900 rounded-lg p-3">
                  <p className="text-maritime-500 text-[10px]">Source</p>
                  <p className="text-maritime-300 text-sm capitalize mt-0.5">{selectedLead.source}</p>
                </div>
                <div className="bg-maritime-900 rounded-lg p-3">
                  <p className="text-maritime-500 text-[10px]">Expected Close</p>
                  <p className="text-maritime-300 text-sm mt-0.5">
                    {selectedLead.expectedClose
                      ? new Date(selectedLead.expectedClose).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '-'}
                  </p>
                </div>
              </div>

              {(selectedLead.vesselType || selectedLead.cargoType || selectedLead.route) && (
                <div className="space-y-2">
                  <p className="text-maritime-400 text-xs font-medium">Trade Details</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.vesselType && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400">Vessel: {selectedLead.vesselType}</span>
                    )}
                    {selectedLead.cargoType && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400">Cargo: {selectedLead.cargoType}</span>
                    )}
                    {selectedLead.route && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400">Route: {selectedLead.route}</span>
                    )}
                  </div>
                </div>
              )}

              {selectedLead.assignedTo && (
                <div>
                  <p className="text-maritime-400 text-xs font-medium">Assigned To</p>
                  <p className="text-blue-400 text-sm mt-0.5">{selectedLead.assignedTo}</p>
                </div>
              )}

              {selectedLead.notes && (
                <div>
                  <p className="text-maritime-400 text-xs font-medium">Notes</p>
                  <p className="text-maritime-300 text-sm mt-0.5 bg-maritime-900 rounded p-3">{selectedLead.notes}</p>
                </div>
              )}

              {/* Assign Lead */}
              {selectedLead.stage !== 'won' && selectedLead.stage !== 'lost' && (
                <div>
                  <p className="text-maritime-400 text-xs font-medium mb-1">Assign To</p>
                  <div className="flex gap-2">
                    <input
                      id="assign-input"
                      placeholder="Enter name..."
                      defaultValue={selectedLead.assignedTo || ''}
                      className="flex-1 bg-maritime-900 border border-maritime-700 text-white text-xs rounded px-3 py-1.5"
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById('assign-input') as HTMLInputElement;
                        if (el?.value) handleAssign(selectedLead.id, el.value);
                      }}
                      className="text-blue-400 hover:text-blue-300 text-xs bg-maritime-700/50 px-3 py-1.5 rounded"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedLead.stage !== 'won' && selectedLead.stage !== 'lost' && (
                <div className="space-y-2 pt-3 border-t border-maritime-700">
                  {nextStageMap[selectedLead.stage] && (
                    <button
                      onClick={() => handleMoveNext(selectedLead)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-md transition-colors"
                    >
                      Move to {stageLabels[nextStageMap[selectedLead.stage]]}
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleMarkWon(selectedLead)}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                    >
                      Mark Won
                    </button>
                    <button
                      onClick={() => openLostModal(selectedLead.id)}
                      className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                    >
                      Mark Lost
                    </button>
                  </div>
                </div>
              )}

              {(selectedLead.stage === 'won' || selectedLead.stage === 'lost') && (
                <div className="pt-3 border-t border-maritime-700">
                  <p className={`text-sm font-medium ${selectedLead.stage === 'won' ? 'text-green-400' : 'text-red-400'}`}>
                    This lead has been marked as {selectedLead.stage === 'won' ? 'Won' : 'Lost'}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Lead">
        <form onSubmit={handleCreate}>
          <FormField label="Title *">
            <input value={form.title} onChange={setField('title')} className={inputClass} required placeholder="e.g. VLCC AG-China Spot" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Source *">
              <select value={form.source} onChange={setField('source')} className={selectClass} required>
                {sources.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FormField>
            <FormField label="Company Name *">
              <input value={form.companyName} onChange={setField('companyName')} className={inputClass} required placeholder="Company name" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Contact Name">
              <input value={form.contactName} onChange={setField('contactName')} className={inputClass} placeholder="Contact person" />
            </FormField>
            <FormField label="Vessel Type">
              <input value={form.vesselType} onChange={setField('vesselType')} className={inputClass} placeholder="e.g. VLCC, Capesize" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Cargo Type">
              <input value={form.cargoType} onChange={setField('cargoType')} className={inputClass} placeholder="e.g. Crude Oil, Iron Ore" />
            </FormField>
            <FormField label="Route">
              <input value={form.route} onChange={setField('route')} className={inputClass} placeholder="e.g. AG-China, USG-ARA" />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Estimated Value ($)">
              <input value={form.estimatedValue} onChange={setField('estimatedValue')} type="number" step="any" className={inputClass} placeholder="500000" />
            </FormField>
            <FormField label="Probability (%)">
              <input value={form.probability} onChange={setField('probability')} type="number" min="0" max="100" className={inputClass} />
            </FormField>
            <FormField label="Expected Close">
              <input value={form.expectedClose} onChange={setField('expectedClose')} type="date" className={inputClass} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Assigned To">
              <input value={form.assignedTo} onChange={setField('assignedTo')} className={inputClass} placeholder="Team member" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={form.notes} onChange={setField('notes')} rows={3} className={inputClass} placeholder="Additional notes..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Lost Reason Modal */}
      <Modal open={showLostModal} onClose={() => setShowLostModal(false)} title="Mark Lead as Lost">
        <div className="space-y-4">
          <FormField label="Lost Reason *">
            <select value={lostReason} onChange={(e) => setLostReason(e.target.value)} className={selectClass}>
              {lostReasons.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </FormField>
          <FormField label="Notes">
            <textarea value={lostNotes} onChange={(e) => setLostNotes(e.target.value)} rows={3} className={inputClass} placeholder="Why was this lead lost?" />
          </FormField>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowLostModal(false)} className={btnSecondary}>Cancel</button>
            <button onClick={handleMarkLost} className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
              Confirm Lost
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
