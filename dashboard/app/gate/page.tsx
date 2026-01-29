'use client';

import { useState, useEffect } from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { useFacility } from '@/hooks/use-facility';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { LiveDot } from '@/components/shared/live-dot';
import { Badge } from '@/components/ui/badge';
import { GET_GATES, GET_GATE_TRANSACTIONS } from '@/graphql/queries/gate';
import { ON_GATE_TRANSACTION_UPDATED } from '@/graphql/subscriptions';
import { DoorOpen, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { cn } from '@/lib/utils';

const txColumns: Column<any>[] = [
  { key: 'transactionNumber', header: 'Transaction #', sortable: true },
  { key: 'transactionType', header: 'Type', sortable: true, render: (item) => (
    <div className="flex items-center gap-1.5">
      {item.transactionType === 'gate_in' ? <ArrowDownToLine className="h-3.5 w-3.5 text-green-600" /> : <ArrowUpFromLine className="h-3.5 w-3.5 text-blue-600" />}
      <span>{item.transactionType === 'gate_in' ? 'Gate In' : 'Gate Out'}</span>
    </div>
  )},
  { key: 'truckNumber', header: 'Truck', sortable: true },
  { key: 'driverName', header: 'Driver', sortable: true },
  { key: 'containerNumber', header: 'Container', sortable: true },
  { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} />, sortable: true },
  { key: 'arrivalTime', header: 'Arrival', sortable: true, render: (item) => item.arrivalTime ? new Date(item.arrivalTime).toLocaleTimeString() : '-' },
  { key: 'totalProcessingMinutes', header: 'Process (min)', sortable: true, render: (item) => item.totalProcessingMinutes ?? '-' },
];

export default function GatePage() {
  const { facilityId } = useFacility();
  const [page, setPage] = useState(1);
  const [txStatus, setTxStatus] = useState<string>('');

  const { data: gatesData } = useQuery(GET_GATES, {
    variables: { facilityId },
    skip: !facilityId,
  });

  const { data: txData, loading, refetch } = useQuery(GET_GATE_TRANSACTIONS, {
    variables: { facilityId, status: txStatus || undefined, page, pageSize: 20 },
    skip: !facilityId,
  });

  const { data: liveData } = useSubscription(ON_GATE_TRANSACTION_UPDATED, {
    variables: { facilityId },
    skip: !facilityId,
  });

  useEffect(() => {
    if (liveData?.gateTransactionUpdated) refetch();
  }, [liveData, refetch]);

  const gates = gatesData?.gates ?? [];
  const transactions = txData?.gateTransactions?.data ?? [];
  const pageInfo = txData?.gateTransactions?.pageInfo;

  const activeCount = transactions.filter((t: any) => t.status === 'in_progress').length;

  if (!facilityId) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Select a facility</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gate Monitor</h1>
          <p className="text-sm text-gray-500">Real-time gate operations and transaction tracking</p>
        </div>
        {liveData && <div className="flex items-center gap-2 text-sm text-green-600"><LiveDot /> Live updates</div>}
      </div>

      {/* Gate Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Gates" value={gates.length} icon={DoorOpen} />
        <StatCard title="Active Transactions" value={activeCount} variant={activeCount > 10 ? 'warning' : 'default'} icon={ArrowDownToLine} />
        <StatCard title="Total Lanes" value={gates.reduce((sum: number, g: any) => sum + (g.lanes?.length ?? 0), 0)} icon={ArrowUpFromLine} />
      </div>

      {/* Gate Lane Status */}
      {gates.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gates.map((gate: any) => (
            <Card key={gate.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>{gate.gateName}</span>
                  <Badge variant={gate.status === 'active' ? 'success' : 'secondary'}>{gate.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(gate.lanes ?? []).map((lane: any) => (
                    <div
                      key={lane.id}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
                        lane.status === 'open' ? 'border-green-200 bg-green-50 text-green-700' :
                        lane.status === 'occupied' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                        'border-gray-200 bg-gray-50 text-gray-500',
                      )}
                    >
                      <span>Lane {lane.laneNumber}</span>
                      <span className="text-[10px]">({lane.direction})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Transaction Filter */}
      <div className="flex items-center gap-4">
        <select
          value={txStatus}
          onChange={(e) => { setTxStatus(e.target.value); setPage(1); }}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Transaction Table */}
      <DataTable
        columns={txColumns}
        data={transactions}
        loading={loading}
        pageInfo={pageInfo}
        onPageChange={setPage}
        emptyMessage="No gate transactions found"
      />
    </div>
  );
}
