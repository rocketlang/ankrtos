'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useFacility } from '@/hooks/use-facility';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { GET_CUSTOMS_STATS, GET_BILLS_OF_ENTRY, GET_SHIPPING_BILLS } from '@/graphql/queries/customs';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { FileCheck, FileInput, FileOutput, Search, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';

const boeColumns: Column<any>[] = [
  { key: 'boeNumber', header: 'BOE #', sortable: true },
  { key: 'boeType', header: 'Type', sortable: true },
  { key: 'importerName', header: 'Importer', sortable: true },
  { key: 'blNumber', header: 'B/L Number', sortable: true },
  { key: 'containerCount', header: 'Containers', sortable: true },
  { key: 'assessableValue', header: 'Value', sortable: true, render: (item) => formatCurrency(item.assessableValue ?? 0) },
  { key: 'totalDuty', header: 'Duty', sortable: true, render: (item) => formatCurrency(item.totalDuty ?? 0) },
  { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} />, sortable: true },
  { key: 'submittedAt', header: 'Submitted', sortable: true, render: (item) => item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '-' },
];

const sbColumns: Column<any>[] = [
  { key: 'sbNumber', header: 'SB #', sortable: true },
  { key: 'sbType', header: 'Type', sortable: true },
  { key: 'exporterName', header: 'Exporter', sortable: true },
  { key: 'invoiceNumber', header: 'Invoice #', sortable: true },
  { key: 'fobValue', header: 'FOB Value', sortable: true, render: (item) => formatCurrency(item.fobValue ?? 0) },
  { key: 'containerCount', header: 'Containers', sortable: true },
  { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} />, sortable: true },
  { key: 'letExportDate', header: 'Let Export', sortable: true, render: (item) => item.letExportDate ? new Date(item.letExportDate).toLocaleDateString() : '-' },
];

type Tab = 'boe' | 'shipping_bills';

export default function CustomsPage() {
  const { facilityId } = useFacility();
  const [tab, setTab] = useState<Tab>('boe');
  const [boePage, setBoePage] = useState(1);
  const [sbPage, setSbPage] = useState(1);
  const [boeStatus, setBoeStatus] = useState('');
  const [sbStatus, setSbStatus] = useState('');

  const { data: statsData } = useQuery(GET_CUSTOMS_STATS, {
    variables: { facilityId },
    skip: !facilityId,
  });

  const { data: boeData, loading: boeLoading } = useQuery(GET_BILLS_OF_ENTRY, {
    variables: { facilityId, status: boeStatus || undefined, page: boePage, pageSize: 20 },
    skip: !facilityId || tab !== 'boe',
  });

  const { data: sbData, loading: sbLoading } = useQuery(GET_SHIPPING_BILLS, {
    variables: { facilityId, status: sbStatus || undefined, page: sbPage, pageSize: 20 },
    skip: !facilityId || tab !== 'shipping_bills',
  });

  const stats = statsData?.customsStats;

  if (!facilityId) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Select a facility</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customs</h1>
        <p className="text-sm text-gray-500">Import/Export clearance and examination tracking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total BOE" value={stats?.totalBOE ?? 0} icon={FileInput} />
        <StatCard title="Pending BOE" value={stats?.pendingBOE ?? 0} icon={FileCheck} variant="warning" />
        <StatCard title="Cleared BOE" value={stats?.clearedBOE ?? 0} icon={FileCheck} variant="success" />
        <StatCard title="Shipping Bills" value={stats?.totalShippingBills ?? 0} icon={FileOutput} />
        <StatCard title="Duty Collected" value={formatCurrency(stats?.dutyCollected ?? 0)} icon={Banknote} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('boe')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            tab === 'boe' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700',
          )}
        >
          Bills of Entry
        </button>
        <button
          onClick={() => setTab('shipping_bills')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            tab === 'shipping_bills' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700',
          )}
        >
          Shipping Bills
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'boe' && (
        <>
          <div className="flex items-center gap-4">
            <select
              value={boeStatus}
              onChange={(e) => { setBoeStatus(e.target.value); setBoePage(1); }}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assessed">Assessed</option>
              <option value="duty_paid">Duty Paid</option>
              <option value="out_of_charge">Out of Charge</option>
            </select>
          </div>
          <DataTable
            columns={boeColumns}
            data={boeData?.billsOfEntry?.data ?? []}
            loading={boeLoading}
            pageInfo={boeData?.billsOfEntry?.pageInfo}
            onPageChange={setBoePage}
            emptyMessage="No bills of entry found"
          />
        </>
      )}

      {tab === 'shipping_bills' && (
        <>
          <div className="flex items-center gap-4">
            <select
              value={sbStatus}
              onChange={(e) => { setSbStatus(e.target.value); setSbPage(1); }}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="let_export">Let Export</option>
            </select>
          </div>
          <DataTable
            columns={sbColumns}
            data={sbData?.shippingBills?.data ?? []}
            loading={sbLoading}
            pageInfo={sbData?.shippingBills?.pageInfo}
            onPageChange={setSbPage}
            emptyMessage="No shipping bills found"
          />
        </>
      )}
    </div>
  );
}
