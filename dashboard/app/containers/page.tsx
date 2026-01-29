'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { useFacility } from '@/hooks/use-facility';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable, type Column } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { SearchInput } from '@/components/shared/search-input';
import { LiveDot } from '@/components/shared/live-dot';
import { GET_CONTAINERS, GET_CONTAINER_STATS, SEARCH_CONTAINER } from '@/graphql/queries/containers';
import { ON_CONTAINER_STATUS_CHANGED } from '@/graphql/subscriptions';
import { formatNumber } from '@/lib/utils';
import { Container, Snowflake, AlertTriangle, Ban, Clock } from 'lucide-react';

const columns: Column<any>[] = [
  { key: 'containerNumber', header: 'Container #', sortable: true },
  { key: 'isoType', header: 'ISO Type', sortable: true },
  { key: 'size', header: 'Size', sortable: true },
  { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} />, sortable: true },
  { key: 'owner', header: 'Owner', sortable: true },
  { key: 'customsStatus', header: 'Customs', render: (item) => item.customsStatus ? <StatusBadge status={item.customsStatus} /> : '-' },
  { key: 'currentLocation', header: 'Location', render: (item) => {
    if (!item.currentLocation) return '-';
    const loc = typeof item.currentLocation === 'string' ? item.currentLocation : JSON.stringify(item.currentLocation);
    return <span className="font-mono text-xs">{loc}</span>;
  }},
  { key: 'holds', header: 'Holds', render: (item) => {
    const holdCount = item.holds?.length ?? 0;
    return holdCount > 0 ? <span className="text-red-600 font-medium">{holdCount}</span> : '-';
  }},
];

export default function ContainersPage() {
  const { facilityId } = useFacility();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const pageSize = 20;

  const { data: statsData } = useQuery(GET_CONTAINER_STATS, {
    variables: { facilityId },
    skip: !facilityId,
  });

  const { data, loading, refetch } = useQuery(GET_CONTAINERS, {
    variables: { facilityId, status: status || undefined, page, pageSize },
    skip: !facilityId,
  });

  const { data: liveData } = useSubscription(ON_CONTAINER_STATUS_CHANGED, {
    variables: { facilityId },
    skip: !facilityId,
  });

  useEffect(() => {
    if (liveData?.containerStatusChanged) {
      refetch();
    }
  }, [liveData, refetch]);

  const handleSearch = useCallback((query: string) => {
    // Search triggers a refetch with the query - for simplicity, filter client-side
    // In production, this would call SEARCH_CONTAINER
    console.log('Search:', query);
  }, []);

  const stats = statsData?.containerStats;
  const containers = data?.containers?.data ?? [];
  const pageInfo = data?.containers?.pageInfo;

  if (!facilityId) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Select a facility</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Container Tracker</h1>
          <p className="text-sm text-gray-500">Track and manage all containers in the facility</p>
        </div>
        {liveData && <div className="flex items-center gap-2 text-sm text-green-600"><LiveDot /> Live updates</div>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total" value={formatNumber(stats?.total ?? 0)} subtitle={`${formatNumber(stats?.totalTEU ?? 0)} TEU`} icon={Container} />
        <StatCard title="Reefer" value={stats?.reeferCount ?? 0} icon={Snowflake} variant="info" />
        <StatCard title="Hazmat" value={stats?.hazmatCount ?? 0} icon={AlertTriangle} variant="warning" />
        <StatCard title="On Hold" value={stats?.onHoldCount ?? 0} icon={Ban} variant="danger" />
        <StatCard title="Overdue" value={stats?.overdueCount ?? 0} icon={Clock} variant="warning" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <SearchInput placeholder="Search container number..." onSearch={handleSearch} />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="announced">Announced</option>
          <option value="gated_in">Gated In</option>
          <option value="grounded">Grounded</option>
          <option value="on_hold">On Hold</option>
          <option value="picked">Picked</option>
          <option value="departed">Departed</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={containers}
        loading={loading}
        pageInfo={pageInfo}
        onPageChange={setPage}
        emptyMessage="No containers found"
      />
    </div>
  );
}
