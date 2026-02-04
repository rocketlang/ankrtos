import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const CUSTOMS_DECLARATIONS = gql`
  query CustomsDeclarations($declarationType: String, $status: String) {
    customsDeclarations(declarationType: $declarationType, status: $status) {
      id referenceNumber declarationType vesselName voyageNumber cargoDescription
      hsCode quantity unit invoiceValue currency importerExporter ieCode chaName
      blNumber portOfOrigin portOfDestination basicDuty socialWelfare igst cess
      totalDuty status filedDate assessedDate clearedDate notes createdAt updatedAt
    }
  }
`;

const CUSTOMS_SUMMARY = gql`
  query CustomsSummary {
    customsSummary {
      totalDeclarations pending cleared held totalDutyCollected
    }
  }
`;

const CREATE_CUSTOMS_DECLARATION = gql`
  mutation CreateCustomsDeclaration(
    $declarationType: String!, $referenceNumber: String!, $vesselName: String!,
    $voyageNumber: String, $cargoDescription: String!, $hsCode: String!,
    $quantity: Float!, $unit: String!, $invoiceValue: Float!, $currency: String,
    $importerExporter: String!, $ieCode: String, $chaName: String, $blNumber: String
  ) {
    createCustomsDeclaration(
      declarationType: $declarationType, referenceNumber: $referenceNumber,
      vesselName: $vesselName, voyageNumber: $voyageNumber, cargoDescription: $cargoDescription,
      hsCode: $hsCode, quantity: $quantity, unit: $unit, invoiceValue: $invoiceValue,
      currency: $currency, importerExporter: $importerExporter, ieCode: $ieCode,
      chaName: $chaName, blNumber: $blNumber
    ) { id referenceNumber }
  }
`;

const UPDATE_CUSTOMS_STATUS = gql`
  mutation UpdateCustomsStatus($id: String!, $status: String!, $notes: String) {
    updateCustomsStatus(id: $id, status: $status, notes: $notes) { id status }
  }
`;

const ASSESS_DUTY = gql`
  mutation AssessDuty(
    $id: String!, $basicDuty: Float!, $socialWelfare: Float!, $igst: Float!, $cess: Float!
  ) {
    assessDuty(id: $id, basicDuty: $basicDuty, socialWelfare: $socialWelfare, igst: $igst, cess: $cess) {
      id totalDuty status
    }
  }
`;

const FILE_DECLARATION = gql`
  mutation FileDeclaration($id: String!) {
    fileDeclaration(id: $id) { id status filedDate }
  }
`;

const CLEAR_DECLARATION = gql`
  mutation ClearDeclaration($id: String!) {
    clearDeclaration(id: $id) { id status clearedDate }
  }
`;

const statusBadge: Record<string, string> = {
  draft: 'bg-gray-800 text-gray-400',
  filed: 'bg-blue-900/50 text-blue-400',
  under_assessment: 'bg-amber-900/50 text-amber-400',
  assessed: 'bg-indigo-900/50 text-indigo-400',
  cleared: 'bg-emerald-900/50 text-emerald-400',
  held: 'bg-red-900/50 text-red-400',
  cancelled: 'bg-gray-800 text-gray-500',
};

const typeBadge: Record<string, string> = {
  igm: 'bg-blue-900/50 text-blue-400',
  egm: 'bg-cyan-900/50 text-cyan-400',
  boe: 'bg-purple-900/50 text-purple-400',
  shipping_bill: 'bg-indigo-900/50 text-indigo-400',
  transit: 'bg-teal-900/50 text-teal-400',
};

const typeLabels: Record<string, string> = {
  igm: 'IGM',
  egm: 'EGM',
  boe: 'Bill of Entry',
  shipping_bill: 'Shipping Bill',
  transit: 'Transit',
};

const declarationTypes = ['igm', 'egm', 'boe', 'shipping_bill', 'transit'];
const allStatuses = ['draft', 'filed', 'under_assessment', 'assessed', 'cleared', 'held', 'cancelled'];

function fmtMoney(n: number, ccy = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: ccy, maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
}

const emptyForm = {
  declarationType: 'igm', referenceNumber: '', vesselName: '', voyageNumber: '',
  cargoDescription: '', hsCode: '', quantity: '', unit: 'MT', invoiceValue: '',
  importerExporter: '', ieCode: '', chaName: '', blNumber: '',
};

const emptyDutyForm = { basicDuty: '', socialWelfare: '', igst: '', cess: '' };

type Tab = 'all' | 'igm_egm' | 'boe_sb';

export function CustomsManagement() {
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showDuty, setShowDuty] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dutyForm, setDutyForm] = useState(emptyDutyForm);

  const { data, loading, error, refetch } = useQuery(CUSTOMS_DECLARATIONS, {
    variables: {
      declarationType: filterType || undefined,
      status: filterStatus || undefined,
    },
  });
  const { data: summaryData } = useQuery(CUSTOMS_SUMMARY);

  const [createDeclaration, { loading: creating }] = useMutation(CREATE_CUSTOMS_DECLARATION);
  const [updateStatus] = useMutation(UPDATE_CUSTOMS_STATUS);
  const [assessDuty] = useMutation(ASSESS_DUTY);
  const [fileDeclaration] = useMutation(FILE_DECLARATION);
  const [clearDeclaration] = useMutation(CLEAR_DECLARATION);

  const declarations = data?.customsDeclarations ?? [];
  const summary = summaryData?.customsSummary;

  const filteredDeclarations = declarations.filter((d: Record<string, unknown>) => {
    if (tab === 'igm_egm') return ['igm', 'egm'].includes(d.declarationType as string);
    if (tab === 'boe_sb') return ['boe', 'shipping_bill'].includes(d.declarationType as string);
    return true;
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const setD = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDutyForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDeclaration({
      variables: {
        ...form,
        quantity: parseFloat(form.quantity),
        invoiceValue: parseFloat(form.invoiceValue),
        voyageNumber: form.voyageNumber || null,
        ieCode: form.ieCode || null,
        chaName: form.chaName || null,
        blNumber: form.blNumber || null,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const handleFile = async (id: string) => {
    await fileDeclaration({ variables: { id } });
    refetch();
  };

  const handleAssessDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDuty) return;
    await assessDuty({
      variables: {
        id: showDuty,
        basicDuty: parseFloat(dutyForm.basicDuty),
        socialWelfare: parseFloat(dutyForm.socialWelfare),
        igst: parseFloat(dutyForm.igst),
        cess: parseFloat(dutyForm.cess),
      },
    });
    setShowDuty(null);
    setDutyForm(emptyDutyForm);
    refetch();
  };

  const handleClear = async (id: string) => {
    await clearDeclaration({ variables: { id } });
    refetch();
  };

  const handleHold = async (id: string) => {
    await updateStatus({ variables: { id, status: 'held', notes: 'Held for inspection' } });
    refetch();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All Declarations' },
    { key: 'igm_egm', label: 'IGM / EGM' },
    { key: 'boe_sb', label: 'BOE / Shipping Bill' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Customs Management</h1>
          <p className="text-maritime-400 text-sm mt-1">Customs declarations, duty assessment &amp; clearance</p>
        </div>
        <div className="flex gap-3">
          <a href="/api/csv/customs" className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm px-3 py-2 rounded-md">CSV</a>
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New Declaration</button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Declarations', value: summary.totalDeclarations, color: 'text-blue-400', border: 'border-blue-500' },
            { label: 'Pending', value: summary.pending, color: 'text-amber-400', border: 'border-amber-500' },
            { label: 'Cleared', value: summary.cleared, color: 'text-emerald-400', border: 'border-emerald-500' },
            { label: 'Held', value: summary.held, color: 'text-red-400', border: 'border-red-500' },
            { label: 'Total Duty Collected', value: fmtMoney(summary.totalDutyCollected), color: 'text-purple-400', border: 'border-purple-500' },
          ].map((s) => (
            <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
              <p className="text-maritime-500 text-xs">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-maritime-700">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-500 text-white'
                : 'border-transparent text-maritime-500 hover:text-maritime-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5"
        >
          <option value="">All Types</option>
          {declarationTypes.map((t) => (
            <option key={t} value={t}>{typeLabels[t]}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5"
        >
          <option value="">All Statuses</option>
          {allStatuses.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {/* Loading / Error */}
      {loading && <p className="text-maritime-400">Loading declarations...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Declarations Table */}
      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                <th className="text-left px-4 py-3">Ref Number</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Vessel</th>
                <th className="text-left px-4 py-3">HS Code</th>
                <th className="text-left px-4 py-3">Cargo</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Total Duty</th>
                <th className="text-left px-4 py-3">Filed</th>
                <th className="text-left px-4 py-3">Cleared</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeclarations.length === 0 && (
                <tr><td colSpan={10} className="text-center py-8 text-maritime-500">No declarations found</td></tr>
              )}
              {filteredDeclarations.map((d: Record<string, unknown>) => {
                const status = d.status as string;
                return (
                  <tr key={d.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                    <td className="px-4 py-3 text-white font-mono text-xs">{d.referenceNumber as string}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${typeBadge[d.declarationType as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                        {typeLabels[d.declarationType as string] ?? d.declarationType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-xs">{d.vesselName as string}</td>
                    <td className="px-4 py-3 text-maritime-300 font-mono text-xs">{d.hsCode as string}</td>
                    <td className="px-4 py-3 text-maritime-300 text-xs max-w-[160px] truncate">{d.cargoDescription as string}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusBadge[status] ?? ''}`}>
                        {status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-purple-400 font-mono text-xs">
                      {(d.totalDuty as number) ? fmtMoney(d.totalDuty as number) : '-'}
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(d.filedDate as string | null)}</td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(d.clearedDate as string | null)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {status === 'draft' && (
                          <button
                            onClick={() => handleFile(d.id as string)}
                            className="text-blue-400 hover:text-blue-300 text-[10px] bg-blue-900/30 px-1.5 py-0.5 rounded"
                          >
                            File
                          </button>
                        )}
                        {status === 'filed' && (
                          <button
                            onClick={() => setShowDuty(d.id as string)}
                            className="text-amber-400 hover:text-amber-300 text-[10px] bg-amber-900/30 px-1.5 py-0.5 rounded"
                          >
                            Assess Duty
                          </button>
                        )}
                        {status === 'assessed' && (
                          <button
                            onClick={() => handleClear(d.id as string)}
                            className="text-emerald-400 hover:text-emerald-300 text-[10px] bg-emerald-900/30 px-1.5 py-0.5 rounded"
                          >
                            Clear
                          </button>
                        )}
                        {['filed', 'under_assessment', 'assessed'].includes(status) && (
                          <button
                            onClick={() => handleHold(d.id as string)}
                            className="text-red-400 hover:text-red-300 text-[10px] bg-red-900/30 px-1.5 py-0.5 rounded"
                          >
                            Hold
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Workflow hint for IGM/EGM tab */}
      {tab === 'igm_egm' && !loading && (
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4">
          <p className="text-maritime-400 text-xs font-medium mb-2">Status Workflow</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400">Draft</span>
            <span className="text-maritime-600">&rarr;</span>
            <span className="px-2 py-0.5 rounded bg-blue-900/50 text-blue-400">Filed</span>
            <span className="text-maritime-600">&rarr;</span>
            <span className="px-2 py-0.5 rounded bg-amber-900/50 text-amber-400">Under Assessment</span>
            <span className="text-maritime-600">&rarr;</span>
            <span className="px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-400">Assessed</span>
            <span className="text-maritime-600">&rarr;</span>
            <span className="px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-400">Cleared</span>
          </div>
        </div>
      )}

      {/* Create Declaration Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Customs Declaration">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Declaration Type *">
              <select value={form.declarationType} onChange={set('declarationType')} className={selectClass} required>
                {declarationTypes.map((t) => (
                  <option key={t} value={t}>{typeLabels[t]}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Reference Number *">
              <input value={form.referenceNumber} onChange={set('referenceNumber')} className={inputClass} required placeholder="IGM-2026-001" />
            </FormField>
            <FormField label="Vessel Name *">
              <input value={form.vesselName} onChange={set('vesselName')} className={inputClass} required placeholder="MV Ankr Star" />
            </FormField>
            <FormField label="Voyage Number">
              <input value={form.voyageNumber} onChange={set('voyageNumber')} className={inputClass} placeholder="V-2026-012" />
            </FormField>
            <div className="col-span-2">
              <FormField label="Cargo Description *">
                <input value={form.cargoDescription} onChange={set('cargoDescription')} className={inputClass} required placeholder="Iron Ore Fines" />
              </FormField>
            </div>
            <FormField label="HS Code *">
              <input value={form.hsCode} onChange={set('hsCode')} className={inputClass} required placeholder="2601.11.00" />
            </FormField>
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Quantity *">
                <input type="number" step="0.01" value={form.quantity} onChange={set('quantity')} className={inputClass} required placeholder="50000" />
              </FormField>
              <FormField label="Unit *">
                <select value={form.unit} onChange={set('unit')} className={selectClass} required>
                  <option value="MT">MT</option>
                  <option value="KG">KG</option>
                  <option value="CBM">CBM</option>
                  <option value="TEU">TEU</option>
                  <option value="PCS">PCS</option>
                </select>
              </FormField>
            </div>
            <FormField label="Invoice Value *">
              <input type="number" step="0.01" value={form.invoiceValue} onChange={set('invoiceValue')} className={inputClass} required placeholder="2500000" />
            </FormField>
            <FormField label="Importer / Exporter *">
              <input value={form.importerExporter} onChange={set('importerExporter')} className={inputClass} required placeholder="Steel Corp Ltd" />
            </FormField>
            <FormField label="IE Code">
              <input value={form.ieCode} onChange={set('ieCode')} className={inputClass} placeholder="0300012345" />
            </FormField>
            <FormField label="CHA Name">
              <input value={form.chaName} onChange={set('chaName')} className={inputClass} placeholder="Globe CHA Services" />
            </FormField>
            <FormField label="B/L Number">
              <input value={form.blNumber} onChange={set('blNumber')} className={inputClass} placeholder="MSKU1234567" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Declaration'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assess Duty Modal */}
      <Modal open={!!showDuty} onClose={() => { setShowDuty(null); setDutyForm(emptyDutyForm); }} title="Assess Customs Duty">
        <form onSubmit={handleAssessDuty}>
          <p className="text-maritime-400 text-xs mb-4">Enter duty component amounts (in INR). Total duty will be calculated automatically.</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Basic Customs Duty *">
              <input type="number" step="0.01" value={dutyForm.basicDuty} onChange={setD('basicDuty')} className={inputClass} required placeholder="125000" />
            </FormField>
            <FormField label="Social Welfare Surcharge *">
              <input type="number" step="0.01" value={dutyForm.socialWelfare} onChange={setD('socialWelfare')} className={inputClass} required placeholder="12500" />
            </FormField>
            <FormField label="IGST *">
              <input type="number" step="0.01" value={dutyForm.igst} onChange={setD('igst')} className={inputClass} required placeholder="45000" />
            </FormField>
            <FormField label="Cess *">
              <input type="number" step="0.01" value={dutyForm.cess} onChange={setD('cess')} className={inputClass} required placeholder="0" />
            </FormField>
          </div>
          {dutyForm.basicDuty && dutyForm.socialWelfare && dutyForm.igst && dutyForm.cess && (
            <div className="mt-4 bg-maritime-900 border border-maritime-700 rounded-lg p-3">
              <div className="flex justify-between text-xs text-maritime-400">
                <span>Total Duty</span>
                <span className="text-purple-400 font-bold text-sm">
                  {fmtMoney(
                    parseFloat(dutyForm.basicDuty || '0') +
                    parseFloat(dutyForm.socialWelfare || '0') +
                    parseFloat(dutyForm.igst || '0') +
                    parseFloat(dutyForm.cess || '0')
                  )}
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => { setShowDuty(null); setDutyForm(emptyDutyForm); }} className={btnSecondary}>Cancel</button>
            <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
              Assess Duty
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
