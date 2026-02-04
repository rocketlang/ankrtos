import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

const INVOICES_QUERY = gql`
  query Invoices($status: String, $type: String) {
    invoices(status: $status, type: $type) {
      id invoiceNumber type amount currency taxAmount totalAmount
      paidAmount status issueDate dueDate paidDate description notes
      payments { id amount method reference settledDate status }
    }
  }
`;

const INVOICE_SUMMARY = gql`
  query InvoiceSummary {
    invoiceSummary { totalIssued totalPaid totalOverdue count }
  }
`;

const COMMISSIONS_QUERY = gql`
  query Commissions { commissions { id type percentage baseAmount amount currency status charterId notes createdAt } }
`;

const CREATE_INVOICE = gql`
  mutation CreateInvoice(
    $type: String!, $amount: Float!, $currency: String,
    $taxAmount: Float, $dueDate: String, $description: String, $notes: String,
    $companyId: String, $voyageId: String, $charterId: String
  ) {
    createInvoice(
      type: $type, amount: $amount, currency: $currency,
      taxAmount: $taxAmount, dueDate: $dueDate, description: $description,
      notes: $notes, companyId: $companyId, voyageId: $voyageId, charterId: $charterId
    ) { id invoiceNumber }
  }
`;

const RECORD_PAYMENT = gql`
  mutation RecordPayment(
    $invoiceId: String!, $amount: Float!, $method: String!,
    $reference: String, $bankName: String, $notes: String
  ) {
    recordPayment(
      invoiceId: $invoiceId, amount: $amount, method: $method,
      reference: $reference, bankName: $bankName, notes: $notes
    ) { id }
  }
`;

const statusColors: Record<string, string> = {
  draft: 'bg-maritime-700 text-maritime-300',
  issued: 'bg-blue-900/50 text-blue-400',
  partially_paid: 'bg-yellow-900/50 text-yellow-400',
  paid: 'bg-green-900/50 text-green-400',
  overdue: 'bg-red-900/50 text-red-400',
  cancelled: 'bg-maritime-700 text-maritime-500',
};

const typeLabels: Record<string, string> = {
  freight: 'Freight', demurrage: 'Demurrage', hire: 'Hire', agency: 'Agency DA', bunker: 'Bunker', other: 'Other',
};

const invoiceTypes = ['freight', 'demurrage', 'hire', 'agency', 'bunker', 'other'];
const paymentMethods = ['wire_transfer', 'check', 'cash', 'letter_of_credit', 'offset'];

const emptyInvForm = { type: 'freight', amount: '', currency: 'USD', taxAmount: '', dueDate: '', description: '', notes: '' };
const emptyPayForm = { invoiceId: '', amount: '', method: 'wire_transfer', reference: '', bankName: '', notes: '' };

export function Invoices() {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [tab, setTab] = useState<'invoices' | 'commissions'>('invoices');
  const { data, loading, error, refetch } = useQuery(INVOICES_QUERY, {
    variables: { status: statusFilter || undefined, type: typeFilter || undefined },
  });
  const { data: summaryData } = useQuery(INVOICE_SUMMARY);
  const { data: commissionsData } = useQuery(COMMISSIONS_QUERY);
  const [createInvoice, { loading: creating }] = useMutation(CREATE_INVOICE);
  const [recordPayment, { loading: recording }] = useMutation(RECORD_PAYMENT);
  const [showCreate, setShowCreate] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [invForm, setInvForm] = useState(emptyInvForm);
  const [payForm, setPayForm] = useState(emptyPayForm);

  const invoices = data?.invoices ?? [];
  const summary = summaryData?.invoiceSummary;
  const commissions = commissionsData?.commissions ?? [];

  const fmtMoney = (amt: number, ccy = 'USD') => `${ccy} ${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    await createInvoice({
      variables: {
        type: invForm.type, amount: parseFloat(invForm.amount), currency: invForm.currency,
        taxAmount: invForm.taxAmount ? parseFloat(invForm.taxAmount) : null,
        dueDate: invForm.dueDate || null, description: invForm.description || null, notes: invForm.notes || null,
      },
    });
    setInvForm(emptyInvForm);
    setShowCreate(false);
    refetch();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    await recordPayment({
      variables: {
        invoiceId: payForm.invoiceId, amount: parseFloat(payForm.amount), method: payForm.method,
        reference: payForm.reference || null, bankName: payForm.bankName || null, notes: payForm.notes || null,
      },
    });
    setPayForm(emptyPayForm);
    setShowPayment(false);
    refetch();
  };

  const openPayment = (invoiceId: string, balance: number) => {
    setPayForm({ ...emptyPayForm, invoiceId, amount: String(balance) });
    setShowPayment(true);
  };

  const setI = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setInvForm((f) => ({ ...f, [field]: e.target.value }));

  const setP = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setPayForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices &amp; Payments</h1>
          <p className="text-maritime-400 text-sm mt-1">Freight, demurrage, hire invoices &amp; commissions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>+ New Invoice</button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <p className="text-maritime-400 text-xs mb-1">Total Invoices</p>
            <p className="text-white text-xl font-bold">{summary.count}</p>
          </div>
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <p className="text-maritime-400 text-xs mb-1">Total Issued</p>
            <p className="text-white text-xl font-bold">{fmtMoney(summary.totalIssued)}</p>
          </div>
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <p className="text-maritime-400 text-xs mb-1">Total Paid</p>
            <p className="text-green-400 text-xl font-bold">{fmtMoney(summary.totalPaid)}</p>
          </div>
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
            <p className="text-maritime-400 text-xs mb-1">Total Overdue</p>
            <p className="text-red-400 text-xl font-bold">{fmtMoney(summary.totalOverdue)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button onClick={() => setTab('invoices')}
          className={`px-4 py-2 rounded-t text-sm font-medium ${tab === 'invoices' ? 'bg-maritime-800 text-white' : 'text-maritime-500 hover:text-maritime-300'}`}>
          Invoices ({invoices.length})
        </button>
        <button onClick={() => setTab('commissions')}
          className={`px-4 py-2 rounded-t text-sm font-medium ${tab === 'commissions' ? 'bg-maritime-800 text-white' : 'text-maritime-500 hover:text-maritime-300'}`}>
          Commissions ({commissions.length})
        </button>
      </div>

      {loading && <p className="text-maritime-400">Loading...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {tab === 'invoices' && !loading && (
        <>
          <div className="flex gap-3 mb-4">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
              <option value="">All Statuses</option>
              {Object.keys(statusColors).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
              <option value="">All Types</option>
              {invoiceTypes.map((t) => <option key={t} value={t}>{typeLabels[t] || t}</option>)}
            </select>
          </div>
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-maritime-400 text-left border-b border-maritime-700">
                  <th className="px-4 py-3 font-medium">Invoice #</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Issue Date</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: Record<string, unknown>) => {
                  const balance = (inv.totalAmount as number) - (inv.paidAmount as number);
                  return (
                    <tr key={inv.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                      <td className="px-4 py-3 text-white font-mono text-xs">{inv.invoiceNumber as string}</td>
                      <td className="px-4 py-3 text-maritime-300">{typeLabels[inv.type as string] || inv.type as string}</td>
                      <td className="px-4 py-3 text-white font-medium">{fmtMoney(inv.totalAmount as number, inv.currency as string)}</td>
                      <td className="px-4 py-3 text-green-400">{fmtMoney(inv.paidAmount as number, inv.currency as string)}</td>
                      <td className="px-4 py-3 text-maritime-300">
                        {balance > 0 ? fmtMoney(balance, inv.currency as string) : '-'}
                      </td>
                      <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(inv.issueDate as string)}</td>
                      <td className="px-4 py-3 text-maritime-400 text-xs">{fmtDate(inv.dueDate as string | null)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[inv.status as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                          {(inv.status as string).replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {balance > 0 && (inv.status as string) !== 'cancelled' && (
                          <button onClick={() => openPayment(inv.id as string, balance)}
                            className="text-blue-400 hover:text-blue-300 text-xs font-medium">Record Payment</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {invoices.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-maritime-500">No invoices found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'commissions' && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-left border-b border-maritime-700">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Percentage</th>
                <th className="px-4 py-3 font-medium">Base Amount</th>
                <th className="px-4 py-3 font-medium">Commission</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c: Record<string, unknown>) => (
                <tr key={c.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                  <td className="px-4 py-3 text-white capitalize">{(c.type as string).replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-maritime-300">{(c.percentage as number).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-maritime-300">{fmtMoney(c.baseAmount as number, c.currency as string)}</td>
                  <td className="px-4 py-3 text-white font-medium">{fmtMoney(c.amount as number, c.currency as string)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      c.status === 'paid' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'
                    }`}>
                      {c.status as string}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-maritime-500 text-xs">{(c.notes as string) || '-'}</td>
                </tr>
              ))}
              {commissions.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-maritime-500">No commissions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Invoice Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Invoice">
        <form onSubmit={handleCreateInvoice}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type *">
              <select value={invForm.type} onChange={setI('type')} className={selectClass} required>
                {invoiceTypes.map((t) => <option key={t} value={t}>{typeLabels[t] || t}</option>)}
              </select>
            </FormField>
            <FormField label="Currency">
              <select value={invForm.currency} onChange={setI('currency')} className={selectClass}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="SGD">SGD</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount *">
              <input type="number" step="0.01" value={invForm.amount} onChange={setI('amount')} className={inputClass} required />
            </FormField>
            <FormField label="Tax Amount">
              <input type="number" step="0.01" value={invForm.taxAmount} onChange={setI('taxAmount')} className={inputClass} placeholder="0" />
            </FormField>
          </div>
          <FormField label="Due Date">
            <input type="date" value={invForm.dueDate} onChange={setI('dueDate')} className={inputClass} />
          </FormField>
          <FormField label="Description">
            <textarea value={invForm.description} onChange={setI('description')} className={`${inputClass} h-16 resize-none`} placeholder="Freight V-2026-XXX: 75,000 MT x $14.50" />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Record Payment">
        <form onSubmit={handleRecordPayment}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount *">
              <input type="number" step="0.01" value={payForm.amount} onChange={setP('amount')} className={inputClass} required />
            </FormField>
            <FormField label="Method *">
              <select value={payForm.method} onChange={setP('method')} className={selectClass} required>
                {paymentMethods.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Reference">
              <input value={payForm.reference} onChange={setP('reference')} className={inputClass} placeholder="TT-20260130-001" />
            </FormField>
            <FormField label="Bank">
              <input value={payForm.bankName} onChange={setP('bankName')} className={inputClass} placeholder="Citibank" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={payForm.notes} onChange={setP('notes')} className={`${inputClass} h-16 resize-none`} />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowPayment(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={recording} className={btnPrimary}>
              {recording ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
