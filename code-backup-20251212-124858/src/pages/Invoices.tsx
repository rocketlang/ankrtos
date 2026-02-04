/**
 * Invoices Page - Odoo-Style Workflow
 * DRAFT → SENT → ACCEPTED → PAID
 * Customer can review, accept/dispute via portal
 * 🙏 Jai Guru Ji | © 2025 ANKR Labs
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import { StatsFilter, FilterIndicator } from '../components/StatsFilter';
import { 
  FileText, Send, CheckCircle, X, Loader2, AlertCircle, 
  ChevronDown, Building2, Package, Calendar, CreditCard,
  DollarSign, Clock, AlertTriangle, Eye, Printer, MessageSquare,
  QrCode, Download, Link2
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// QR Code Component (inline SVG generation)
// ═══════════════════════════════════════════════════════════════════════════

const QRCodeSVG = ({ value, size = 80 }: { value: string; size?: number }) => {
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  
  return (
    <img 
      src={qrApiUrl} 
      alt="QR Code" 
      width={size} 
      height={size}
      className="rounded bg-white p-1 mx-auto"
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// GraphQL Queries & Mutations
// ═══════════════════════════════════════════════════════════════════════════

const GET_INVOICES = gql`
  query GetInvoices {
    invoices {
      id
      invoiceNumber
      status
      invoiceDate
      dueDate
      subtotal
      cgst
      sgst
      igst
      totalTax
      totalAmount
      paidAmount
      balanceAmount
      customer { 
        id
        companyName 
        contactEmail
        contactPhone
      }
      order { 
        id
        orderNumber 
        originCity
        destCity
      }
      createdAt
    }
  }
`;

const UPDATE_INVOICE_STATUS = gql`
  mutation UpdateInvoiceStatus($id: ID!, $status: String!) {
    updateInvoiceStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

const RECORD_PAYMENT = gql`
  mutation RecordPayment($invoiceId: ID!, $amount: Float!, $paymentMode: String!, $referenceNo: String, $remarks: String) {
    recordPayment(invoiceId: $invoiceId, amount: $amount, paymentMode: $paymentMode, referenceNo: $referenceNo, remarks: $remarks) {
      id
      paidAmount
      balanceAmount
      status
    }
  }
`;

const SEND_INVOICE_WHATSAPP = gql`
  mutation SendInvoiceWhatsApp($invoiceId: ID!) {
    sendInvoiceWhatsApp(invoiceId: $invoiceId) {
      success
      message
    }
  }
`;

const REGISTER_ON_DOCCHAIN = gql`
  mutation RegisterOnDocChain($documentId: ID!) {
    registerOnDocChain(documentId: $documentId) {
      id
      blockchainHash
      blockchainTimestamp
      status
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// Status Configuration - Odoo Style
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<string, { 
  color: string; 
  bg: string; 
  icon: string;
  actions: string[];
  description: string;
}> = {
  draft: { 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-500/20', 
    icon: '📝',
    actions: ['send', 'showQR', 'cancel'],
    description: 'Ready to send'
  },
  sent: { 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/20', 
    icon: '📤',
    actions: ['recordPayment', 'whatsapp', 'showQR', 'cancel'],
    description: 'Awaiting payment'
  },
  partial: { 
    color: 'text-purple-400', 
    bg: 'bg-purple-500/20', 
    icon: '💳',
    actions: ['recordPayment', 'whatsapp', 'showQR'],
    description: 'Partial payment'
  },
  paid: { 
    color: 'text-green-400', 
    bg: 'bg-green-500/20', 
    icon: '💰',
    actions: ['docchain', 'showQR', 'whatsapp'],
    description: 'Fully paid'
  },
  overdue: { 
    color: 'text-red-400', 
    bg: 'bg-red-500/20', 
    icon: '⚠️',
    actions: ['recordPayment', 'whatsapp', 'showQR'],
    description: 'Payment overdue'
  },
  cancelled: { 
    color: 'text-gray-400', 
    bg: 'bg-gray-500/20', 
    icon: '❌',
    actions: [],
    description: 'Cancelled'
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  customer?: { id: string; companyName: string; email: string; phone: string };
  order?: { id: string; orderNumber: string; originCity: string; destCity: string };
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export default function Invoices() {
  const { theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [paymentModal, setPaymentModal] = useState<Invoice | null>(null);
  const [qrModal, setQrModal] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');

  // Theme colors
  const titleColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const subtitleColor = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const cardBg = theme === 'light' ? 'bg-gray-100' : 'bg-gray-800';
  const dropdownBg = theme === 'light' ? 'bg-white' : 'bg-gray-700';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-gray-600';
  const inputBg = theme === 'light' ? 'bg-white' : 'bg-gray-700';

  // Queries & Mutations
  const { data, loading, error, refetch } = useQuery(GET_INVOICES);

  const [updateStatus, { loading: updating }] = useMutation(UPDATE_INVOICE_STATUS, {
    onCompleted: (data) => { 
      showNotification('success', `Invoice status updated to ${data.updateInvoiceStatus.status.toUpperCase()}`); 
      refetch(); 
    },
    onError: (err) => showNotification('error', err.message),
  });

  const [recordPayment, { loading: recording }] = useMutation(RECORD_PAYMENT, {
    onCompleted: (data) => { 
      showNotification('success', `Payment of ₹${paymentAmount} recorded! Balance: ₹${data.recordPayment.balanceAmount}`); 
      setPaymentModal(null);
      setPaymentAmount('');
      setPaymentRef('');
      refetch(); 
    },
    onError: (err) => showNotification('error', err.message),
  });

  const [sendWhatsApp, { loading: sendingWA }] = useMutation(SEND_INVOICE_WHATSAPP, {
    onCompleted: () => { 
      showNotification('success', 'Invoice sent via WhatsApp!'); 
    },
    onError: (err) => showNotification('error', err.message),
  });

  const [registerDocChain, { loading: registering }] = useMutation(REGISTER_ON_DOCCHAIN, {
    onCompleted: (data) => { 
      const hash = data.registerOnDocChain?.blockchainHash || 'pending';
      showNotification('success', `⛓️ Registered on DocChain! Hash: ${hash.slice(0, 16)}...`); 
      refetch();
    },
    onError: (err) => showNotification('error', `DocChain error: ${err.message}`),
  });

  const isLoading = updating || recording || sendingWA || registering;

  // Notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Sync URL with filter
  useEffect(() => {
    if (filter === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', filter);
    }
    setSearchParams(searchParams);
  }, [filter]);

  const invoices = data?.invoices || [];

  // Calculate stats
  const draft = invoices.filter((i: Invoice) => i.status === 'draft').length;
  const sent = invoices.filter((i: Invoice) => i.status === 'sent').length;
  const partial = invoices.filter((i: Invoice) => i.status === 'partial').length;
  const paid = invoices.filter((i: Invoice) => i.status === 'paid').length;
  const overdue = invoices.filter((i: Invoice) => i.status === 'overdue').length;

  // Calculate totals
  const totalAmount = invoices.reduce((sum: number, i: Invoice) => sum + (i.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum: number, i: Invoice) => sum + (i.paidAmount || 0), 0);
  const totalPending = invoices.reduce((sum: number, i: Invoice) => sum + (i.balanceAmount || 0), 0);

  const stats = [
    { id: 'all', label: 'All Invoices', value: invoices.length, color: 'gray' as const, icon: '💰' },
    { id: 'draft', label: 'Draft', value: draft, color: 'yellow' as const, icon: '📝' },
    { id: 'sent', label: 'Sent', value: sent, color: 'blue' as const, icon: '📤' },
    { id: 'partial', label: 'Partial', value: partial, color: 'purple' as const, icon: '💳' },
    { id: 'paid', label: 'Paid', value: paid, color: 'green' as const, icon: '✅' },
    { id: 'overdue', label: 'Overdue', value: overdue, color: 'red' as const, icon: '⚠️' },
  ];

  // Filter invoices
  const filteredInvoices = filter === 'all'
    ? invoices
    : invoices.filter((i: Invoice) => i.status === filter);

  // ─────────────────────────────────────────────────────────────────────────
  // Action Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleAction = (action: string, invoice: Invoice) => {
    setActiveDropdown(null);
    
    switch (action) {
      case 'send':
        updateStatus({ variables: { id: invoice.id, status: 'sent' } });
        break;
      case 'resend':
        // Re-send notification
        sendWhatsApp({ variables: { invoiceId: invoice.id } });
        break;
      case 'markPaid':
        updateStatus({ variables: { id: invoice.id, status: 'paid' } });
        break;
      case 'recordPayment':
        setPaymentModal(invoice);
        setPaymentAmount(invoice.balanceAmount.toString());
        break;
      case 'whatsapp':
        sendWhatsApp({ variables: { invoiceId: invoice.id } });
        break;
      case 'cancel':
        if (confirm(`Cancel invoice ${invoice.invoiceNumber}?`)) {
          updateStatus({ variables: { id: invoice.id, status: 'cancelled' } });
        }
        break;
      case 'preview':
        // Open in new tab (future: PDF preview)
        showNotification('success', `Preview ${invoice.invoiceNumber} - Feature coming soon!`);
        break;
      case 'print':
        showNotification('success', `Print ${invoice.invoiceNumber} - Feature coming soon!`);
        break;
      case 'docchain':
        if (confirm(`Register ${invoice.invoiceNumber} on DocChain for immutability?\n\nThis creates a permanent blockchain record with QR verification.`)) {
          registerDocChain({ variables: { documentId: invoice.id } });
        }
        break;
      case 'showQR':
        setQrModal(invoice);
        break;
    }
  };

  const handleRecordPayment = () => {
    if (!paymentModal || !paymentAmount) return;
    
    recordPayment({
      variables: {
        invoiceId: paymentModal.id,
        amount: parseFloat(paymentAmount),
        paymentMode: paymentMode,
        referenceNo: paymentRef || null,
        remarks: null
      }
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render Actions
  // ─────────────────────────────────────────────────────────────────────────

  const renderActions = (invoice: Invoice) => {
    const config = STATUS_CONFIG[invoice.status] || { actions: [] };
    
    if (config.actions.length === 0) {
      return <span className="text-gray-500 text-xs">—</span>;
    }

    const actionLabels: Record<string, { label: string; icon: any; color: string }> = {
      send: { label: '📤 Send to Customer', icon: Send, color: 'text-blue-400 hover:bg-blue-500/20' },
      resend: { label: '🔄 Resend', icon: Send, color: 'text-blue-400 hover:bg-blue-500/20' },
      preview: { label: '👁️ Preview', icon: Eye, color: 'text-gray-400 hover:bg-gray-500/20' },
      print: { label: '🖨️ Print', icon: Printer, color: 'text-gray-400 hover:bg-gray-500/20' },
      showQR: { label: '📱 Show QR Code', icon: QrCode, color: 'text-cyan-400 hover:bg-cyan-500/20' },
      markPaid: { label: '✅ Mark as Paid', icon: CheckCircle, color: 'text-green-400 hover:bg-green-500/20' },
      recordPayment: { label: '💳 Record Payment', icon: CreditCard, color: 'text-purple-400 hover:bg-purple-500/20' },
      whatsapp: { label: '📱 Send WhatsApp', icon: MessageSquare, color: 'text-green-400 hover:bg-green-500/20' },
      docchain: { label: '⛓️ Register DocChain', icon: Link2, color: 'text-cyan-400 hover:bg-cyan-500/20' },
      cancel: { label: '❌ Cancel', icon: X, color: 'text-red-400 hover:bg-red-500/20' },
    };

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(activeDropdown === invoice.id ? null : invoice.id);
          }}
          disabled={isLoading}
          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition
            ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-gray-600 hover:bg-gray-500 text-white'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Actions'}
          <ChevronDown className="w-3 h-3" />
        </button>

        {activeDropdown === invoice.id && (
          <div className={`absolute right-0 mt-1 w-48 rounded-lg shadow-lg z-50 py-1 ${dropdownBg} border ${borderColor}`}>
            {config.actions.map((action) => {
              const actionConfig = actionLabels[action];
              if (!actionConfig) return null;
              const Icon = actionConfig.icon;
              
              return (
                <button
                  key={action}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(action, invoice);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${actionConfig.color} transition`}
                >
                  <Icon className="w-4 h-4" />
                  {actionConfig.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Format helpers
  // ─────────────────────────────────────────────────────────────────────────

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'paid' || status === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className={`ml-2 ${subtitleColor}`}>Loading invoices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-400">
        <AlertCircle className="w-6 h-6 mr-2" />
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white max-w-md`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {notification.message}
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPaymentModal(null)}>
          <div className={`${cardBg} rounded-xl p-6 w-full max-w-md mx-4`} onClick={e => e.stopPropagation()}>
            <h2 className={`text-xl font-bold mb-4 ${titleColor}`}>💳 Record Payment</h2>
            
            <div className={`${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} rounded-lg p-4 mb-4`}>
              <div className="flex justify-between mb-2">
                <span className={subtitleColor}>Invoice:</span>
                <span className={`${titleColor} font-mono`}>{paymentModal.invoiceNumber}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className={subtitleColor}>Customer:</span>
                <span className={titleColor}>{paymentModal.customer?.companyName}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className={subtitleColor}>Total Amount:</span>
                <span className={titleColor}>{formatCurrency(paymentModal.totalAmount)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className={subtitleColor}>Already Paid:</span>
                <span className="text-green-400">{formatCurrency(paymentModal.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className={subtitleColor}>Balance Due:</span>
                <span className="text-orange-400">{formatCurrency(paymentModal.balanceAmount)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-1 ${subtitleColor}`}>Payment Amount (₹)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${inputBg} ${titleColor}`}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className={`block text-sm mb-1 ${subtitleColor}`}>Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${inputBg} ${titleColor}`}
                >
                  <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm mb-1 ${subtitleColor}`}>Reference No. (Optional)</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${inputBg} ${titleColor}`}
                  placeholder="UTR / Cheque No / Transaction ID"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setPaymentModal(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || recording}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {recording ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal - Floating Compact */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setQrModal(null)}>
          <div className={`${cardBg} rounded-lg p-3 shadow-2xl border ${borderColor}`} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2 gap-4">
              <span className={`text-sm font-bold ${titleColor}`}>{qrModal.invoiceNumber}</span>
              <span className="text-sm font-bold text-orange-400">{formatCurrency(qrModal.totalAmount)}</span>
              <button onClick={() => setQrModal(null)} className="text-gray-400 hover:text-white ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* QR Codes - 2x2 Grid Ultra Compact */}
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <QRCodeSVG value={`https://docchain.ankr.ai/verify/${qrModal.id}`} size={64} />
                <p className="text-[10px] text-gray-400 mt-1">Verify</p>
              </div>
              <div className="text-center">
                <QRCodeSVG value={`upi://pay?pa=wowtruck@icici&am=${qrModal.balanceAmount}&tn=${qrModal.invoiceNumber}`} size={64} />
                <p className="text-[10px] text-gray-400 mt-1">Pay UPI</p>
              </div>
              <div className="text-center">
                <QRCodeSVG value={JSON.stringify({inv:qrModal.invoiceNumber,amt:qrModal.totalAmount})} size={64} />
                <p className="text-[10px] text-gray-400 mt-1">Data</p>
              </div>
              <div className="text-center">
                <QRCodeSVG value={`https://portal.wowtruck.in/invoice/${qrModal.id}`} size={64} />
                <p className="text-[10px] text-gray-400 mt-1">Portal</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`${cardBg} rounded-xl p-6`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${titleColor}`}>💰 Invoices</h1>
            <p className={subtitleColor}>
              {filteredInvoices.length} invoices shown
              <FilterIndicator filter={filter} label={filter} onClear={() => setFilter('all')} theme={theme} />
            </p>
            {/* Workflow inline */}
            <div className="flex items-center gap-1 mt-2 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">DRAFT</span>
              <span className={subtitleColor}>→</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">SENT</span>
              <span className={subtitleColor}>→</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">PARTIAL</span>
              <span className={subtitleColor}>→</span>
              <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">PAID</span>
              <span className={subtitleColor}>→</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">DOCCHAIN</span>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="flex gap-4">
            <div className={`${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} rounded-lg px-4 py-2 text-center`}>
              <div className={`text-xs ${subtitleColor}`}>Total</div>
              <div className={`font-bold ${titleColor}`}>{formatCurrency(totalAmount)}</div>
            </div>
            <div className={`${theme === 'light' ? 'bg-green-100' : 'bg-green-900/30'} rounded-lg px-4 py-2 text-center`}>
              <div className="text-xs text-green-600">Received</div>
              <div className="font-bold text-green-500">{formatCurrency(totalPaid)}</div>
            </div>
            <div className={`${theme === 'light' ? 'bg-orange-100' : 'bg-orange-900/30'} rounded-lg px-4 py-2 text-center`}>
              <div className="text-xs text-orange-600">Pending</div>
              <div className="font-bold text-orange-500">{formatCurrency(totalPending)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Filter */}
      <StatsFilter stats={stats} activeFilter={filter} onFilterChange={setFilter} theme={theme} columns={6} />

      {/* Invoices Table */}
      <div className={`${cardBg} rounded-xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium ${subtitleColor} uppercase tracking-wider`}>Invoice #</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${subtitleColor} uppercase tracking-wider`}>Customer</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${subtitleColor} uppercase tracking-wider`}>Order</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${subtitleColor} uppercase tracking-wider`}>Date</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${subtitleColor} uppercase tracking-wider`}>Due Date</th>
                <th className={`px-4 py-3 text-right text-xs font-medium ${subtitleColor} uppercase tracking-wider`}>Amount</th>
                <th className={`px-4 py-3 text-right text-xs font-medium ${subtitleColor} uppercase tracking-wider`}>Paid</th>
                <th className={`px-4 py-3 text-right text-xs font-medium ${subtitleColor} uppercase tracking-wider`}>Balance</th>
                <th className={`px-4 py-3 text-center text-xs font-medium ${subtitleColor} uppercase tracking-wider`}>Status</th>
                <th className={`px-4 py-3 text-center text-xs font-medium ${subtitleColor} uppercase tracking-wider`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredInvoices.map((invoice: Invoice) => {
                const statusConfig = STATUS_CONFIG[invoice.status] || { color: 'text-gray-400', bg: 'bg-gray-500/20', icon: '?' };
                const overdue = isOverdue(invoice.dueDate, invoice.status);
                
                return (
                  <tr 
                    key={invoice.id} 
                    className={`hover:${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700/50'} transition`}
                  >
                    {/* Invoice # */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-400" />
                        <span className={`font-mono text-sm ${titleColor}`}>{invoice.invoiceNumber}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span className={`text-sm ${titleColor}`}>{invoice.customer?.companyName || '-'}</span>
                      </div>
                    </td>

                    {/* Order */}
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs ${subtitleColor}`}>{invoice.order?.orderNumber || '-'}</span>
                    </td>

                    {/* Invoice Date */}
                    <td className="px-4 py-3">
                      <span className={`text-sm ${subtitleColor}`}>{formatDate(invoice.invoiceDate)}</span>
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {overdue && <AlertTriangle className="w-3 h-3 text-red-400" />}
                        <span className={`text-sm ${overdue ? 'text-red-400 font-medium' : subtitleColor}`}>
                          {formatDate(invoice.dueDate)}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${titleColor}`}>{formatCurrency(invoice.totalAmount)}</span>
                    </td>

                    {/* Paid */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-green-400">{formatCurrency(invoice.paidAmount)}</span>
                    </td>

                    {/* Balance */}
                    <td className="px-4 py-3 text-right">
                      <span className={invoice.balanceAmount > 0 ? 'text-orange-400 font-medium' : 'text-gray-500'}>
                        {formatCurrency(invoice.balanceAmount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.icon} {invoice.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      {renderActions(invoice)}
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={10} className={`px-4 py-12 text-center ${subtitleColor}`}>
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No invoices found {filter !== 'all' && `with status "${filter}"`}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

          </div>
  );
}
