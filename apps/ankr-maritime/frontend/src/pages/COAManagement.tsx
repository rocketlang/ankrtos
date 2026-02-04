import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const COA_QUERY = gql`
  query ContractsOfAffreightment($status: String) {
    contractsOfAffreightment(status: $status) {
      id reference charterId cargoType totalQuantity tolerancePercent
      maxShipments completedShipments nominatedQuantity shippedQuantity
      loadPortRange dischargePortRange startDate endDate
      freightRate currency status notes
      charter { id reference }
    }
  }
`;

const COA_NOMINATIONS_QUERY = gql`
  query COANominations($coaId: String!) {
    coaNominations(coaId: $coaId) {
      id coaId quantity toleranceOverride loadPort dischargePort
      laycanStart laycanEnd vesselName status notes createdAt
    }
  }
`;

const CHARTERS_QUERY = gql`
  query Charters {
    charters { id reference type status }
  }
`;

const CREATE_COA = gql`
  mutation CreateContractOfAffreightment(
    $charterId: String!, $cargoType: String!, $totalQuantity: Float!,
    $tolerancePercent: Float, $maxShipments: Int, $loadPortRange: String,
    $dischargePortRange: String, $startDate: String!, $endDate: String!,
    $freightRate: Float, $currency: String, $notes: String
  ) {
    createContractOfAffreightment(
      charterId: $charterId, cargoType: $cargoType, totalQuantity: $totalQuantity,
      tolerancePercent: $tolerancePercent, maxShipments: $maxShipments,
      loadPortRange: $loadPortRange, dischargePortRange: $dischargePortRange,
      startDate: $startDate, endDate: $endDate, freightRate: $freightRate,
      currency: $currency, notes: $notes
    ) { id }
  }
`;

const CREATE_NOMINATION = gql`
  mutation CreateCOANomination(
    $coaId: String!, $quantity: Float!, $toleranceOverride: Float,
    $loadPort: String, $dischargePort: String, $laycanStart: String,
    $laycanEnd: String, $vesselName: String, $notes: String
  ) {
    createCOANomination(
      coaId: $coaId, quantity: $quantity, toleranceOverride: $toleranceOverride,
      loadPort: $loadPort, dischargePort: $dischargePort,
      laycanStart: $laycanStart, laycanEnd: $laycanEnd,
      vesselName: $vesselName, notes: $notes
    ) { id }
  }
`;

const statusBadge: Record<string, string> = {
  active: 'bg-green-900/50 text-green-400',
  completed: 'bg-blue-900/50 text-blue-400',
  expired: 'bg-yellow-900/50 text-yellow-400',
  cancelled: 'bg-red-900/50 text-red-400',
};

const nomStatusBadge: Record<string, string> = {
  pending: 'bg-yellow-900/50 text-yellow-400',
  accepted: 'bg-green-900/50 text-green-400',
  rejected: 'bg-red-900/50 text-red-400',
  shipped: 'bg-blue-900/50 text-blue-400',
  completed: 'bg-maritime-700 text-maritime-300',
};

const emptyCoaForm = {
  charterId: '', cargoType: '', totalQuantity: '', tolerancePercent: '',
  maxShipments: '', loadPortRange: '', dischargePortRange: '',
  startDate: '', endDate: '', freightRate: '', currency: 'USD', notes: '',
};

const emptyNomForm = {
  quantity: '', toleranceOverride: '', loadPort: '', dischargePort: '',
  laycanStart: '', laycanEnd: '', vesselName: '', notes: '',
};

function fmtQty(n: number | null | undefined) {
  if (n == null) return '-';
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function COAManagement() {
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showNominate, setShowNominate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [coaForm, setCoaForm] = useState(emptyCoaForm);
  const [nomForm, setNomForm] = useState(emptyNomForm);

  const { data, loading, error, refetch } = useQuery(COA_QUERY, {
    variables: { status: filterStatus || undefined },
  });
  const { data: charterData } = useQuery(CHARTERS_QUERY);
  const { data: nomData, refetch: refetchNoms } = useQuery(COA_NOMINATIONS_QUERY, {
    variables: { coaId: expandedId! },
    skip: !expandedId,
  });
  const [createCOA, { loading: creatingCOA }] = useMutation(CREATE_COA);
  const [createNomination, { loading: creatingNom }] = useMutation(CREATE_NOMINATION);

  const contracts = data?.contractsOfAffreightment ?? [];
  const coaCharters = (charterData?.charters ?? []).filter(
    (c: Record<string, unknown>) => (c.type as string) === 'coa'
  );
  const nominations = nomData?.coaNominations ?? [];

  const setC = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCoaForm((f) => ({ ...f, [field]: e.target.value }));

  const setN = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setNomForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreateCOA = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCOA({
      variables: {
        charterId: coaForm.charterId,
        cargoType: coaForm.cargoType,
        totalQuantity: parseFloat(coaForm.totalQuantity),
        tolerancePercent: coaForm.tolerancePercent ? parseFloat(coaForm.tolerancePercent) : null,
        maxShipments: coaForm.maxShipments ? parseInt(coaForm.maxShipments) : null,
        loadPortRange: coaForm.loadPortRange || null,
        dischargePortRange: coaForm.dischargePortRange || null,
        startDate: new Date(coaForm.startDate).toISOString(),
        endDate: new Date(coaForm.endDate).toISOString(),
        freightRate: coaForm.freightRate ? parseFloat(coaForm.freightRate) : null,
        currency: coaForm.currency || null,
        notes: coaForm.notes || null,
      },
    });
    setCoaForm(emptyCoaForm);
    setShowCreate(false);
    refetch();
  };

  const handleCreateNomination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedId) return;
    await createNomination({
      variables: {
        coaId: expandedId,
        quantity: parseFloat(nomForm.quantity),
        toleranceOverride: nomForm.toleranceOverride ? parseFloat(nomForm.toleranceOverride) : null,
        loadPort: nomForm.loadPort || null,
        dischargePort: nomForm.dischargePort || null,
        laycanStart: nomForm.laycanStart ? new Date(nomForm.laycanStart).toISOString() : null,
        laycanEnd: nomForm.laycanEnd ? new Date(nomForm.laycanEnd).toISOString() : null,
        vesselName: nomForm.vesselName || null,
        notes: nomForm.notes || null,
      },
    });
    setNomForm(emptyNomForm);
    setShowNominate(false);
    refetchNoms();
    refetch();
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">COA Management</h1>
          <p className="text-maritime-400 text-sm mt-1">Contracts of Affreightment &mdash; multi-shipment cargo contracts</p>
        </div>
        <div className="flex gap-3">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New COA</button>
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading contracts of affreightment...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Reference</th>
                <th className="text-left px-4 py-3 font-medium">Cargo Type</th>
                <th className="text-right px-4 py-3 font-medium">Total Qty (MT)</th>
                <th className="text-right px-4 py-3 font-medium">Nominated / Shipped</th>
                <th className="text-center px-4 py-3 font-medium">Shipments</th>
                <th className="text-left px-4 py-3 font-medium">Load Range</th>
                <th className="text-left px-4 py-3 font-medium">Date Range</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c: Record<string, unknown>) => {
                const isExpanded = expandedId === (c.id as string);
                return (
                  <tr key={c.id as string}
                    onClick={() => toggleExpand(c.id as string)}
                    className={`border-b border-maritime-700/50 hover:bg-maritime-700/30 cursor-pointer ${isExpanded ? 'bg-maritime-700/20' : ''}`}>
                    <td className="px-4 py-3 text-white font-mono text-xs">{(c.reference as string) || (c.id as string).slice(0, 8)}</td>
                    <td className="px-4 py-3 text-maritime-300">{c.cargoType as string}</td>
                    <td className="px-4 py-3 text-white text-right font-mono">{fmtQty(c.totalQuantity as number)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-yellow-400 font-mono">{fmtQty(c.nominatedQuantity as number)}</span>
                      <span className="text-maritime-500 mx-1">/</span>
                      <span className="text-green-400 font-mono">{fmtQty(c.shippedQuantity as number)}</span>
                      <span className="text-maritime-500 text-xs ml-1">MT</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-blue-400 font-mono">{(c.completedShipments as number) ?? 0}</span>
                      <span className="text-maritime-500 mx-1">/</span>
                      <span className="text-white font-mono">{(c.maxShipments as number) ?? '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-maritime-300 text-xs">{(c.loadPortRange as string) || '-'}</td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">
                      {fmtDate(c.startDate as string)} &mdash; {fmtDate(c.endDate as string)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${statusBadge[c.status as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                        {c.status as string}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {contracts.length === 0 && (
            <p className="text-maritime-500 text-center py-8">No contracts of affreightment found</p>
          )}
        </div>
      )}

      {/* Expanded Nominations Panel */}
      {expandedId && (
        <div className="mt-4 bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-maritime-700">
            <h3 className="text-white font-medium text-sm">Nominations for COA {expandedId.slice(0, 8)}</h3>
            <button onClick={() => setShowNominate(true)} className={btnPrimary}>+ Add Nomination</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-maritime-700 text-maritime-400">
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-right px-4 py-3 font-medium">Quantity (MT)</th>
                <th className="text-left px-4 py-3 font-medium">Load Port</th>
                <th className="text-left px-4 py-3 font-medium">Discharge Port</th>
                <th className="text-left px-4 py-3 font-medium">Laycan</th>
                <th className="text-left px-4 py-3 font-medium">Vessel</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {nominations.map((n: Record<string, unknown>) => (
                <tr key={n.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white text-xs font-mono">{fmtDate(n.createdAt as string)}</td>
                  <td className="px-4 py-3 text-white text-right font-mono">{fmtQty(n.quantity as number)}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs">{(n.loadPort as string) || '-'}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs">{(n.dischargePort as string) || '-'}</td>
                  <td className="px-4 py-3 text-maritime-400 text-xs">
                    {fmtDate(n.laycanStart as string)} &mdash; {fmtDate(n.laycanEnd as string)}
                  </td>
                  <td className="px-4 py-3 text-maritime-300">{(n.vesselName as string) || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${nomStatusBadge[n.status as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                      {(n.status as string) || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-maritime-400 text-xs max-w-xs truncate">{(n.notes as string) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {nominations.length === 0 && (
            <p className="text-maritime-500 text-center py-6">No nominations yet for this COA</p>
          )}
        </div>
      )}

      {/* Create COA Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Contract of Affreightment">
        <form onSubmit={handleCreateCOA}>
          <FormField label="Charter (COA type) *">
            <select value={coaForm.charterId} onChange={setC('charterId')} className={selectClass} required>
              <option value="">-- Select Charter --</option>
              {coaCharters.map((ch: Record<string, unknown>) => (
                <option key={ch.id as string} value={ch.id as string}>
                  {(ch.reference as string) || (ch.id as string).slice(0, 8)} ({ch.status as string})
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Cargo Type *">
              <input value={coaForm.cargoType} onChange={setC('cargoType')} className={inputClass} required placeholder="Crude Oil, Iron Ore, Coal..." />
            </FormField>
            <FormField label="Total Quantity (MT) *">
              <input type="number" step="0.01" value={coaForm.totalQuantity} onChange={setC('totalQuantity')} className={inputClass} required placeholder="120000" />
            </FormField>
            <FormField label="Tolerance (%)">
              <input type="number" step="0.1" value={coaForm.tolerancePercent} onChange={setC('tolerancePercent')} className={inputClass} placeholder="5" />
            </FormField>
            <FormField label="Max Shipments">
              <input type="number" value={coaForm.maxShipments} onChange={setC('maxShipments')} className={inputClass} placeholder="10" />
            </FormField>
            <FormField label="Load Port Range">
              <input value={coaForm.loadPortRange} onChange={setC('loadPortRange')} className={inputClass} placeholder="Ras Tanura - Jubail" />
            </FormField>
            <FormField label="Discharge Port Range">
              <input value={coaForm.dischargePortRange} onChange={setC('dischargePortRange')} className={inputClass} placeholder="Rotterdam - Antwerp" />
            </FormField>
            <FormField label="Start Date *">
              <input type="date" value={coaForm.startDate} onChange={setC('startDate')} className={inputClass} required />
            </FormField>
            <FormField label="End Date *">
              <input type="date" value={coaForm.endDate} onChange={setC('endDate')} className={inputClass} required />
            </FormField>
            <FormField label="Freight Rate">
              <input type="number" step="0.01" value={coaForm.freightRate} onChange={setC('freightRate')} className={inputClass} placeholder="15.50" />
            </FormField>
            <FormField label="Currency">
              <select value={coaForm.currency} onChange={setC('currency')} className={selectClass}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={coaForm.notes} onChange={setC('notes')}
              className={`${inputClass} h-20 resize-none`} placeholder="Contract terms, special conditions..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creatingCOA} className={btnPrimary}>
              {creatingCOA ? 'Creating...' : 'Create COA'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Nomination Modal */}
      <Modal open={showNominate} onClose={() => setShowNominate(false)} title="Add COA Nomination">
        <form onSubmit={handleCreateNomination}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quantity (MT) *">
              <input type="number" step="0.01" value={nomForm.quantity} onChange={setN('quantity')} className={inputClass} required placeholder="15000" />
            </FormField>
            <FormField label="Tolerance Override (%)">
              <input type="number" step="0.1" value={nomForm.toleranceOverride} onChange={setN('toleranceOverride')} className={inputClass} placeholder="5" />
            </FormField>
            <FormField label="Load Port">
              <input value={nomForm.loadPort} onChange={setN('loadPort')} className={inputClass} placeholder="Ras Tanura" />
            </FormField>
            <FormField label="Discharge Port">
              <input value={nomForm.dischargePort} onChange={setN('dischargePort')} className={inputClass} placeholder="Rotterdam" />
            </FormField>
            <FormField label="Laycan Start">
              <input type="date" value={nomForm.laycanStart} onChange={setN('laycanStart')} className={inputClass} />
            </FormField>
            <FormField label="Laycan End">
              <input type="date" value={nomForm.laycanEnd} onChange={setN('laycanEnd')} className={inputClass} />
            </FormField>
          </div>
          <FormField label="Vessel Name">
            <input value={nomForm.vesselName} onChange={setN('vesselName')} className={inputClass} placeholder="MT Pacific Voyager" />
          </FormField>
          <FormField label="Notes">
            <textarea value={nomForm.notes} onChange={setN('notes')}
              className={`${inputClass} h-20 resize-none`} placeholder="Nomination details, special instructions..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowNominate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creatingNom} className={btnPrimary}>
              {creatingNom ? 'Adding...' : 'Add Nomination'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
