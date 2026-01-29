'use client';

import { useQuery, useSubscription } from '@apollo/client';
import { useEffect } from 'react';
import { useFacility } from '@/hooks/use-facility';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GET_FACILITY } from '@/graphql/queries/yard';
import { ON_YARD_CAPACITY_ALERT, ON_CONTAINER_MOVED } from '@/graphql/subscriptions';
import { formatNumber, formatPercent, cn } from '@/lib/utils';
import { Grid3X3, Box, Snowflake, AlertTriangle } from 'lucide-react';

function getUtilizationColor(percent: number): string {
  if (percent >= 95) return 'bg-red-500';
  if (percent >= 85) return 'bg-orange-400';
  if (percent >= 70) return 'bg-yellow-400';
  return 'bg-green-400';
}

function getUtilizationBg(percent: number): string {
  if (percent >= 95) return 'bg-red-50 border-red-200';
  if (percent >= 85) return 'bg-orange-50 border-orange-200';
  if (percent >= 70) return 'bg-yellow-50 border-yellow-200';
  return 'bg-green-50 border-green-200';
}

export default function YardPage() {
  const { facilityId } = useFacility();

  const { data, refetch } = useQuery(GET_FACILITY, {
    variables: { id: facilityId },
    skip: !facilityId,
  });

  const { data: capacityAlert } = useSubscription(ON_YARD_CAPACITY_ALERT, {
    variables: { facilityId },
    skip: !facilityId,
  });

  const { data: containerMoved } = useSubscription(ON_CONTAINER_MOVED, {
    variables: { facilityId },
    skip: !facilityId,
  });

  useEffect(() => {
    if (capacityAlert || containerMoved) refetch();
  }, [capacityAlert, containerMoved, refetch]);

  const facility = data?.facility;
  const zones = facility?.zones ?? [];

  // Calculate totals
  let totalCapacity = 0;
  let totalOccupancy = 0;
  let reeferBlocks = 0;
  let hazmatBlocks = 0;

  for (const zone of zones) {
    for (const block of zone.blocks ?? []) {
      totalCapacity += block.capacity ?? 0;
      totalOccupancy += block.currentOccupancy ?? 0;
      if (block.isReefer) reeferBlocks++;
      if (block.isHazmat) hazmatBlocks++;
    }
  }

  const overallUtil = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

  if (!facilityId) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Select a facility</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Yard Visualizer</h1>
        <p className="text-sm text-gray-500">{facility?.name ?? 'Loading...'} — Block utilization overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Capacity" value={formatNumber(totalCapacity)} subtitle="ground slots" icon={Grid3X3} />
        <StatCard title="Occupied" value={formatNumber(totalOccupancy)} subtitle={formatPercent(overallUtil)} icon={Box}
          variant={overallUtil > 90 ? 'danger' : overallUtil > 75 ? 'warning' : 'success'} />
        <StatCard title="Reefer Blocks" value={reeferBlocks} icon={Snowflake} />
        <StatCard title="Hazmat Blocks" value={hazmatBlocks} icon={AlertTriangle} />
      </div>

      {/* Yard Grid */}
      {zones.map((zone: any) => (
        <Card key={zone.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              {zone.zoneName} <span className="text-gray-400">({zone.zoneCode})</span>
              {zone.zoneType && <span className="ml-2 text-xs text-gray-400">{zone.zoneType}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {(zone.blocks ?? []).map((block: any) => {
                const util = block.utilizationPercent ?? (block.capacity > 0 ? (block.currentOccupancy / block.capacity) * 100 : 0);
                return (
                  <div
                    key={block.id}
                    className={cn(
                      'rounded-lg border p-3 transition-colors',
                      getUtilizationBg(util),
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{block.blockCode}</span>
                      <div className="flex gap-1">
                        {block.isReefer && <Snowflake className="h-3 w-3 text-blue-500" />}
                        {block.isHazmat && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className={cn('h-2 rounded-full transition-all', getUtilizationColor(util))}
                          style={{ width: `${Math.min(util, 100)}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-gray-600">
                        <span>{block.currentOccupancy ?? 0}/{block.capacity ?? 0}</span>
                        <span>{Math.round(util)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {zones.length === 0 && (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-500">
          No yard data available for this facility
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-green-400" /> &lt; 70%</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-yellow-400" /> 70-85%</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-orange-400" /> 85-95%</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-red-500" /> &gt; 95%</div>
      </div>
    </div>
  );
}
