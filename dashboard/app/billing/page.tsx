'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useFacility } from '@/hooks/use-facility';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { GET_BILLING_STATS, GET_INVOICES, GET_CUSTOMERS } from '@/graphql/queries/billing';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Receipt, Users, CreditCard, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const invoiceColumns: Column<any>[] = [
  { key: 'invoiceNumber', header: 'Invoice #', sortable: true },
  { key: 'customerName', header: 'Customer', sortable: true },
  { key: 'invoiceType', header: 'Type', sortable: true },
  { key: 'invoiceDate', header: 'Date', sortable: true, render: (item) => item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString() : '-' },
  { key: 'dueDate', header: 'Due Date', sortable: true, render: (item) => item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-' },
  { key: 'totalAmount', header: 'Amount', sortable: true, render: (item) => formatCurrency(item.totalAmount ?? 0) },
  { key: 'paidAmount', header: 'Paid', sortable: true, render: (item) => formatCurrency(item.paidAmount ?? 0) },
  { key: 'balance', header: 'Balance', sortable: true, render: (item) => formatCurrency(item.balance ?? 0) },
  { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} />, sortable: true },
];

const customerColumns: Column<any>[] = [
  { key: 'customerCode', header: 'Code', sortable: true },
  { key: 'name', header: 'Name', sortable: true },
  { key: 'type', header: 'Type', sortable: true },
  { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} />, sortable: true },
  { key: 'creditLimit', header: 'Credit Limit', sortable: true, render: (item) => formatCurrency(item.creditLimit ?? 0) },
  { key: 'outstandingAmount', header: 'Outstanding', sortable: true, render: (item) => formatCurrency(item.outstandingAmount ?? 0) },
  { key: 'creditStatus', header: 'Credit Status', render: (item) => <StatusBadge status={item.creditStatus ?? 'normal'} />, sortable: true },
  { key: 'containersHandled', header: 'Containers', sortable: true },
];

type Tab = 'invoices' | 'customers';

export default function BillingPage() {
  const { facilityId } = useFacility();
  const [tab, setTab] = useState<Tab>('invoices');
  const [invoicePage, setInvoicePage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const [invoiceStatus, setInvoiceStatus] = useState('');

  const { data: statsData } = useQuery(GET_BILLING_STATS, {
    variables: { facilityId },
    skip: !facilityId,
  });

  const { data: invoiceData, loading: invoiceLoading } = useQuery(GET_INVOICES, {
    variables: { facilityId, status: invoiceStatus || undefined, page: invoicePage, pageSize: 20 },
    skip: !facilityId || tab !== 'invoices',
  });

  const { data: customerData, loading: customerLoading } = useQuery(GET_CUSTOMERS, {
    variables: { facilityId, page: customerPage, pageSize: 20 },
    skip: !facilityId || tab !== 'customers',
  });

  const stats = statsData?.billingStats;

  if (!facilityId) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Select a facility</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500">Invoice management and customer accounts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue ?? 0)} icon={TrendingUp} variant="success" />
        <StatCard title="Outstanding" value={formatCurrency(stats?.totalOutstanding ?? 0)} icon={CreditCard} variant="warning" />
        <StatCard title="Pending Invoices" value={stats?.pendingInvoices ?? 0} icon={Receipt} />
        <StatCard title="Overdue" value={stats?.overdueInvoices ?? 0} icon={AlertCircle} variant="danger" />
        <StatCard title="Collection Rate" value={`${stats?.collectionRate ?? 0}%`} icon={TrendingUp} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['invoices', 'customers'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {t === 'invoices' ? 'Invoices' : 'Customers'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'invoices' && (
        <>
          <div className="flex items-center gap-4">
            <select
              value={invoiceStatus}
              onChange={(e) => { setInvoiceStatus(e.target.value); setInvoicePage(1); }}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <DataTable
            columns={invoiceColumns}
            data={invoiceData?.invoices?.data ?? []}
            loading={invoiceLoading}
            pageInfo={invoiceData?.invoices?.pageInfo}
            onPageChange={setInvoicePage}
            emptyMessage="No invoices found"
          />
        </>
      )}

      {tab === 'customers' && (
        <DataTable
          columns={customerColumns}
          data={customerData?.customers?.data ?? []}
          loading={customerLoading}
          pageInfo={customerData?.customers?.pageInfo}
          onPageChange={setCustomerPage}
          emptyMessage="No customers found"
        />
      )}
    </div>
  );
}
