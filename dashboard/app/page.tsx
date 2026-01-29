'use client';

import { useQuery } from '@apollo/client';
import { useFacility } from '@/hooks/use-facility';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GET_OPERATIONS_DASHBOARD, GET_TERMINAL_KPIS, GET_PERFORMANCE_SCORECARD } from '@/graphql/queries/dashboard';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import {
  Container, Train, Ship, Wrench, Receipt, FileCheck, Gauge, BarChart3,
} from 'lucide-react';

export default function DashboardPage() {
  const { facilityId } = useFacility();

  const { data: kpiData } = useQuery(GET_TERMINAL_KPIS, {
    variables: { facilityId },
    skip: !facilityId,
    pollInterval: 30000,
  });

  const { data: dashData } = useQuery(GET_OPERATIONS_DASHBOARD, {
    variables: { facilityId },
    skip: !facilityId,
  });

  const { data: scoreData } = useQuery(GET_PERFORMANCE_SCORECARD, {
    variables: { facilityId },
    skip: !facilityId,
  });

  const kpis = kpiData?.terminalKPIs;
  const dash = dashData?.operationsDashboard;
  const score = scoreData?.performanceScorecard;

  if (!facilityId) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Select a facility to view the dashboard
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
        <p className="text-sm text-gray-500">Real-time overview of terminal operations</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Containers"
          value={formatNumber(kpis?.totalContainers ?? 0)}
          subtitle={`${formatNumber(kpis?.totalTEU ?? 0)} TEU`}
          icon={Container}
        />
        <StatCard
          title="Yard Utilization"
          value={formatPercent(kpis?.yardUtilization ?? 0)}
          icon={Gauge}
          variant={
            (kpis?.yardUtilization ?? 0) > 90 ? 'danger' :
            (kpis?.yardUtilization ?? 0) > 75 ? 'warning' : 'success'
          }
        />
        <StatCard
          title="Gate Transactions Today"
          value={formatNumber(kpis?.gateTransactionsToday ?? 0)}
          subtitle={`Avg ${kpis?.averageGateTurnaround ?? '-'} min turnaround`}
          icon={BarChart3}
        />
        <StatCard
          title="Revenue Today"
          value={formatCurrency(kpis?.revenueToday ?? 0)}
          icon={Receipt}
        />
        <StatCard
          title="Active Rakes"
          value={kpis?.activeRakes ?? 0}
          icon={Train}
        />
        <StatCard
          title="Active Vessels"
          value={kpis?.activeVessels ?? 0}
          icon={Ship}
        />
        <StatCard
          title="Equipment Utilization"
          value={formatPercent(kpis?.equipmentUtilization ?? 0)}
          icon={Wrench}
        />
        <StatCard
          title="Pending Customs"
          value={kpis?.pendingCustomsClearance ?? 0}
          icon={FileCheck}
          variant={(kpis?.pendingCustomsClearance ?? 0) > 20 ? 'warning' : 'default'}
        />
      </div>

      {/* Module Summary Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Container Summary */}
        {dash?.containers && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Container className="h-4 w-4" />
                Container Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Total:</span> <span className="font-medium">{dash.containers.total}</span></div>
                <div><span className="text-gray-500">TEU:</span> <span className="font-medium">{dash.containers.totalTEU}</span></div>
                <div><span className="text-gray-500">Reefer:</span> <span className="font-medium">{dash.containers.reeferCount}</span></div>
                <div><span className="text-gray-500">Hazmat:</span> <span className="font-medium">{dash.containers.hazmatCount}</span></div>
                <div><span className="text-gray-500">On Hold:</span> <span className="font-medium text-red-600">{dash.containers.onHoldCount}</span></div>
                <div><span className="text-gray-500">Overdue:</span> <span className="font-medium text-amber-600">{dash.containers.overdueCount}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rail Summary */}
        {dash?.rail && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Train className="h-4 w-4" />
                Rail Terminal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Total Tracks:</span> <span className="font-medium">{dash.rail.totalTracks}</span></div>
                <div><span className="text-gray-500">Available:</span> <span className="font-medium">{dash.rail.availableTracks}</span></div>
                <div><span className="text-gray-500">Active Rakes:</span> <span className="font-medium">{dash.rail.activeRakes}</span></div>
                <div><span className="text-gray-500">Expected Today:</span> <span className="font-medium">{dash.rail.todayExpectedArrivals}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waterfront Summary */}
        {dash?.waterfront && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ship className="h-4 w-4" />
                Waterfront
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Berths:</span> <span className="font-medium">{dash.waterfront.totalBerths}</span></div>
                <div><span className="text-gray-500">Occupied:</span> <span className="font-medium">{dash.waterfront.occupiedBerths}</span></div>
                <div><span className="text-gray-500">Vessels:</span> <span className="font-medium">{dash.waterfront.activeVessels}</span></div>
                <div><span className="text-gray-500">Cranes Working:</span> <span className="font-medium">{dash.waterfront.workingCranes}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Summary */}
        {dash?.billing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4" />
                Billing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Revenue:</span> <span className="font-medium">{formatCurrency(dash.billing.totalRevenue)}</span></div>
                <div><span className="text-gray-500">Outstanding:</span> <span className="font-medium text-amber-600">{formatCurrency(dash.billing.totalOutstanding)}</span></div>
                <div><span className="text-gray-500">Pending Invoices:</span> <span className="font-medium">{dash.billing.pendingInvoices}</span></div>
                <div><span className="text-gray-500">Overdue:</span> <span className="font-medium text-red-600">{dash.billing.overdueInvoices}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Equipment Summary */}
        {dash?.equipment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="h-4 w-4" />
                Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Total:</span> <span className="font-medium">{dash.equipment.totalEquipment}</span></div>
                <div><span className="text-gray-500">Available:</span> <span className="font-medium text-green-600">{dash.equipment.available}</span></div>
                <div><span className="text-gray-500">In Use:</span> <span className="font-medium">{dash.equipment.inUse}</span></div>
                <div><span className="text-gray-500">Maintenance:</span> <span className="font-medium text-amber-600">{dash.equipment.maintenance}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customs Summary */}
        {dash?.customs && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileCheck className="h-4 w-4" />
                Customs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Total BOE:</span> <span className="font-medium">{dash.customs.totalBOE}</span></div>
                <div><span className="text-gray-500">Pending:</span> <span className="font-medium text-amber-600">{dash.customs.pendingBOE}</span></div>
                <div><span className="text-gray-500">Cleared:</span> <span className="font-medium text-green-600">{dash.customs.clearedBOE}</span></div>
                <div><span className="text-gray-500">Examinations:</span> <span className="font-medium">{dash.customs.pendingExaminations}</span></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Scorecard */}
      {score && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Scorecard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge
                variant={
                  score.overallGrade === 'A' ? 'success' :
                  score.overallGrade === 'B' ? 'info' :
                  score.overallGrade === 'C' ? 'warning' : 'destructive'
                }
                className="text-lg px-4 py-1"
              >
                {score.overallGrade}
              </Badge>
              <div>
                <p className="text-2xl font-bold">{score.overallScore}/100</p>
                <p className="text-sm text-gray-500">Overall terminal performance score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
