import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const DELIVERY_ORDERS = gql`
  query DeliveryOrders($status: String, $vesselId: String) {
    deliveryOrders(status: $status, vesselId: $vesselId) {
      id doNumber blNumber vesselName voyageNumber cargoDescription consigneeName
      consigneeAddress chaName shippingLine freightStatus containerNumbers
      numberOfPackages grossWeight detentionCharges demurrageCharges otherCharges
      totalCharges paymentStatus status issuedDate releasedDate collectedDate
      expiryDate notes createdAt updatedAt
    }
  }
`;

const DO_SUMMARY = gql`
  query DeliveryOrderSummary {
    deliveryOrderSummary {
      total pending issued released collected expired
    }
  }
`;

const CREATE_DELIVERY_ORDER = gql`
  mutation CreateDeliveryOrder(
    $doNumber: String!, $blNumber: String!, $vesselName: String!,
    $cargoDescription: String, $consigneeName: String!, $consigneeAddress: String,
    $chaName: String, $shippingLine: String, $freightStatus: String,
    $containerNumbers: [String!], $numberOfPackages: Int, $grossWeight: Float
  ) {
    createDeliveryOrder(
      doNumber: $doNumber, blNumber: $blNumber, vesselName: $vesselName,
      cargoDescription: $cargoDescription, consigneeName: $consigneeName,
      consigneeAddress: $consigneeAddress, chaName: $chaName,
      shippingLine: $shippingLine, freightStatus: $freightStatus,
      containerNumbers: $containerNumbers, numberOfPackages: $numberOfPackages,
      grossWeight: $grossWeight
    ) { id doNumber }
  }
`;

const ISSUE_DELIVERY_ORDER = gql`
  mutation IssueDeliveryOrder($id: String!) {
    issueDeliveryOrder(id: $id) { id status issuedDate }
  }
`;

const RELEASE_DELIVERY_ORDER = gql`
  mutation ReleaseDeliveryOrder($id: String!) {
    releaseDeliveryOrder(id: $id) { id status releasedDate }
  }
`;

const COLLECT_DELIVERY_ORDER = gql`
  mutation CollectDeliveryOrder($id: String!) {
    collectDeliveryOrder(id: $id) { id status collectedDate }
  }
`;

const CANCEL_DELIVERY_ORDER = gql`
  mutation CancelDeliveryOrder($id: String!) {
    cancelDeliveryOrder(id: $id) { id status }
  }
`;

const RECORD_DO_PAYMENT = gql`
  mutation RecordDOPayment(
    $id: String!, $detentionCharges: Float!, $demurrageCharges: Float!, $otherCharges: Float!
  ) {
    recordDOPayment(
      id: $id, detentionCharges: $detentionCharges,
      demurrageCharges: $demurrageCharges, otherCharges: $otherCharges
    ) { id totalCharges paymentStatus }
  }
`;

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-400',
  issued: 'bg-indigo-900/50 text-indigo-400',
  released: 'bg-cyan-900/50 text-cyan-400',
  collected: 'bg-emerald-900/50 text-emerald-400',
  expired: 'bg-red-900/50 text-red-400',
  cancelled: 'bg-gray-800 text-gray-500',
};

const paymentBadge: Record<string, string> = {
  paid: 'bg-emerald-900/50 text-emerald-400',
  unpaid: 'bg-red-900/50 text-red-400',
  partial: 'bg-amber-900/50 text-amber-400',
};

const allStatuses = ['pending', 'issued', 'released', 'collected', 'expired', 'cancelled'];

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
}

const emptyForm = {
  doNumber: '', blNumber: '', vesselName: '', cargoDescription: '',
  consigneeName: '', consigneeAddress: '', chaName: '', shippingLine: '',
  freightStatus: 'prepaid', containerNumbers: '', numberOfPackages: '', grossWeight: '',
};

const emptyPaymentForm = { detentionCharges: '', demurrageCharges: '', otherCharges: '' };

export function DeliveryOrders() {
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);

  const { data, loading, error, refetch } = useQuery(DELIVERY_ORDERS, {
    variables: { status: filterStatus || undefined },
  });
  const { data: summaryData } = useQuery(DO_SUMMARY);

  const [createDO, { loading: creating }] = useMutation(CREATE_DELIVERY_ORDER);
  const [issueDO] = useMutation(ISSUE_DELIVERY_ORDER);
  const [releaseDO] = useMutation(RELEASE_DELIVERY_ORDER);
  const [collectDO] = useMutation(COLLECT_DELIVERY_ORDER);
  const [cancelDO] = useMutation(CANCEL_DELIVERY_ORDER);
  const [recordPayment] = useMutation(RECORD_DO_PAYMENT);

  const orders = data?.deliveryOrders ?? [];
  const summary = summaryData?.deliveryOrderSummary;

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const setPay = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPaymentForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const containers = form.containerNumbers
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    await createDO({
      variables: {
        doNumber: form.doNumber,
        blNumber: form.blNumber,
        vesselName: form.vesselName,
        cargoDescription: form.cargoDescription || null,
        consigneeName: form.consigneeName,
        consigneeAddress: form.consigneeAddress || null,
        chaName: form.chaName || null,
        shippingLine: form.shippingLine || null,
        freightStatus: form.freightStatus,
        containerNumbers: containers.length > 0 ? containers : null,
        numberOfPackages: form.numberOfPackages ? parseInt(form.numberOfPackages) : null,
        grossWeight: form.grossWeight ? parseFloat(form.grossWeight) : null,
      },
    });
    setForm(emptyForm);
    setShowCreate(false);
    refetch();
  };

  const handleIssue = async (id: string) => {
    await issueDO({ variables: { id } });
    refetch();
  };

  const handleRelease = async (id: string) => {
    await releaseDO({ variables: { id } });
    refetch();
  };

  const handleCollect = async (id: string) => {
    await collectDO({ variables: { id } });
    refetch();
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this delivery order?')) return;
    await cancelDO({ variables: { id } });
    refetch();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayment) return;
    await recordPayment({
      variables: {
        id: showPayment,
        detentionCharges: parseFloat(paymentForm.detentionCharges || '0'),
        demurrageCharges: parseFloat(paymentForm.demurrageCharges || '0'),
        otherCharges: parseFloat(paymentForm.otherCharges || '0'),
      },
    });
    setShowPayment(null);
    setPaymentForm(emptyPaymentForm);
    refetch();
  };

  const truncateContainers = (containers: string[] | null) => {
    if (!containers || containers.length === 0) return '-';
    if (containers.length <= 2) return containers.join(', ');
    return `${containers.slice(0, 2).join(', ')} +${containers.length - 2} more`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Delivery Orders</h1>
          <p className="text-maritime-400 text-sm mt-1">DO issuance, release, collection &amp; charges</p>
        </div>
        <div className="flex gap-3">
          <a href="/api/csv/delivery-orders" className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm px-3 py-2 rounded-md">CSV</a>
          <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New DO</button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: summary.total, color: 'text-blue-400', border: 'border-blue-500' },
            { label: 'Pending', value: summary.pending, color: 'text-amber-400', border: 'border-amber-500' },
            { label: 'Issued', value: summary.issued, color: 'text-indigo-400', border: 'border-indigo-500' },
            { label: 'Released', value: summary.released, color: 'text-cyan-400', border: 'border-cyan-500' },
            { label: 'Collected', value: summary.collected, color: 'text-emerald-400', border: 'border-emerald-500' },
            { label: 'Expired', value: summary.expired, color: 'text-red-400', border: 'border-red-500' },
          ].map((s) => (
            <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
              <p className="text-maritime-500 text-xs">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-3">
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
      {loading && <p className="text-maritime-400">Loading delivery orders...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Orders Table */}
      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-xs border-b border-maritime-700">
                <th className="text-left px-4 py-3">DO Number</th>
                <th className="text-left px-4 py-3">B/L Number</th>
                <th className="text-left px-4 py-3">Vessel</th>
                <th className="text-left px-4 py-3">Consignee</th>
                <th className="text-left px-4 py-3">Containers</th>
                <th className="text-right px-4 py-3">Total Charges</th>
                <th className="text-left px-4 py-3">Payment</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Issued</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={10} className="text-center py-8 text-maritime-500">No delivery orders found</td></tr>
              )}
              {orders.map((o: Record<string, unknown>) => {
                const status = o.status as string;
                const payment = o.paymentStatus as string;
                return (
                  <tr key={o.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                    <td className="px-4 py-3 text-white font-mono text-xs">{o.doNumber as string}</td>
                    <td className="px-4 py-3 text-maritime-300 font-mono text-xs">{o.blNumber as string}</td>
                    <td className="px-4 py-3 text-maritime-300 text-xs">{o.vesselName as string}</td>
                    <td className="px-4 py-3 text-maritime-300 text-xs max-w-[140px] truncate">{o.consigneeName as string}</td>
                    <td className="px-4 py-3 text-maritime-400 text-xs max-w-[160px] truncate">
                      {truncateContainers(o.containerNumbers as string[] | null)}
                    </td>
                    <td className="px-4 py-3 text-right text-purple-400 font-mono text-xs">
                      {(o.totalCharges as number) ? fmtMoney(o.totalCharges as number) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {payment && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${paymentBadge[payment] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {payment}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusBadge[status] ?? ''}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(o.issuedDate as string | null)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleIssue(o.id as string)}
                              className="text-indigo-400 hover:text-indigo-300 text-[10px] bg-indigo-900/30 px-1.5 py-0.5 rounded"
                            >
                              Issue
                            </button>
                            <button
                              onClick={() => setShowPayment(o.id as string)}
                              className="text-purple-400 hover:text-purple-300 text-[10px] bg-purple-900/30 px-1.5 py-0.5 rounded"
                            >
                              Charges
                            </button>
                          </>
                        )}
                        {status === 'issued' && (
                          <>
                            <button
                              onClick={() => handleRelease(o.id as string)}
                              className="text-cyan-400 hover:text-cyan-300 text-[10px] bg-cyan-900/30 px-1.5 py-0.5 rounded"
                            >
                              Release
                            </button>
                            <button
                              onClick={() => setShowPayment(o.id as string)}
                              className="text-purple-400 hover:text-purple-300 text-[10px] bg-purple-900/30 px-1.5 py-0.5 rounded"
                            >
                              Charges
                            </button>
                          </>
                        )}
                        {status === 'released' && (
                          <button
                            onClick={() => handleCollect(o.id as string)}
                            className="text-emerald-400 hover:text-emerald-300 text-[10px] bg-emerald-900/30 px-1.5 py-0.5 rounded"
                          >
                            Collect
                          </button>
                        )}
                        {['pending', 'issued'].includes(status) && (
                          <button
                            onClick={() => handleCancel(o.id as string)}
                            className="text-red-400 hover:text-red-300 text-[10px] bg-red-900/30 px-1.5 py-0.5 rounded"
                          >
                            Cancel
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

      {/* Create DO Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Delivery Order">
        <form onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="DO Number *">
              <input value={form.doNumber} onChange={set('doNumber')} className={inputClass} required placeholder="DO-2026-001" />
            </FormField>
            <FormField label="B/L Number *">
              <input value={form.blNumber} onChange={set('blNumber')} className={inputClass} required placeholder="MSKU1234567" />
            </FormField>
            <FormField label="Vessel Name *">
              <input value={form.vesselName} onChange={set('vesselName')} className={inputClass} required placeholder="MV Ankr Star" />
            </FormField>
            <FormField label="Shipping Line">
              <input value={form.shippingLine} onChange={set('shippingLine')} className={inputClass} placeholder="Maersk Line" />
            </FormField>
            <div className="col-span-2">
              <FormField label="Cargo Description">
                <input value={form.cargoDescription} onChange={set('cargoDescription')} className={inputClass} placeholder="Steel Coils, Hot Rolled" />
              </FormField>
            </div>
            <FormField label="Consignee Name *">
              <input value={form.consigneeName} onChange={set('consigneeName')} className={inputClass} required placeholder="Steel Corp Ltd" />
            </FormField>
            <FormField label="CHA Name">
              <input value={form.chaName} onChange={set('chaName')} className={inputClass} placeholder="Globe CHA Services" />
            </FormField>
            <div className="col-span-2">
              <FormField label="Consignee Address">
                <input value={form.consigneeAddress} onChange={set('consigneeAddress')} className={inputClass} placeholder="123 Industrial Area, Mumbai" />
              </FormField>
            </div>
            <FormField label="Freight Status">
              <select value={form.freightStatus} onChange={set('freightStatus')} className={selectClass}>
                <option value="prepaid">Prepaid</option>
                <option value="collect">Collect</option>
              </select>
            </FormField>
            <FormField label="Number of Packages">
              <input type="number" value={form.numberOfPackages} onChange={set('numberOfPackages')} className={inputClass} placeholder="500" />
            </FormField>
            <FormField label="Gross Weight (MT)">
              <input type="number" step="0.01" value={form.grossWeight} onChange={set('grossWeight')} className={inputClass} placeholder="25000" />
            </FormField>
            <div className="col-span-2">
              <FormField label="Container Numbers (comma-separated)">
                <input value={form.containerNumbers} onChange={set('containerNumbers')} className={inputClass} placeholder="MSKU1234567, MSKU1234568, MSKU1234569" />
              </FormField>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create DO'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal open={!!showPayment} onClose={() => { setShowPayment(null); setPaymentForm(emptyPaymentForm); }} title="Record DO Charges">
        <form onSubmit={handleRecordPayment}>
          <p className="text-maritime-400 text-xs mb-4">Enter applicable charges for this delivery order.</p>
          <div className="space-y-0">
            <FormField label="Detention Charges (INR)">
              <input type="number" step="0.01" value={paymentForm.detentionCharges} onChange={setPay('detentionCharges')} className={inputClass} placeholder="25000" />
            </FormField>
            <FormField label="Demurrage Charges (INR)">
              <input type="number" step="0.01" value={paymentForm.demurrageCharges} onChange={setPay('demurrageCharges')} className={inputClass} placeholder="50000" />
            </FormField>
            <FormField label="Other Charges (INR)">
              <input type="number" step="0.01" value={paymentForm.otherCharges} onChange={setPay('otherCharges')} className={inputClass} placeholder="5000" />
            </FormField>
          </div>
          {(paymentForm.detentionCharges || paymentForm.demurrageCharges || paymentForm.otherCharges) && (
            <div className="mt-2 bg-maritime-900 border border-maritime-700 rounded-lg p-3">
              <div className="flex justify-between text-xs text-maritime-400">
                <span>Total Charges</span>
                <span className="text-purple-400 font-bold text-sm">
                  {fmtMoney(
                    parseFloat(paymentForm.detentionCharges || '0') +
                    parseFloat(paymentForm.demurrageCharges || '0') +
                    parseFloat(paymentForm.otherCharges || '0')
                  )}
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => { setShowPayment(null); setPaymentForm(emptyPaymentForm); }} className={btnSecondary}>Cancel</button>
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
              Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
