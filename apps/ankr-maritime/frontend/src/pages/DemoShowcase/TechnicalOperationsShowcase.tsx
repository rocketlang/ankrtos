import React, { useState } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface MaintenanceJob {
  id: string;
  vesselName: string;
  system: string;
  jobType: 'preventive' | 'corrective' | 'overhaul';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  dueDate: string;
  completedDate?: string;
  runningHours?: number;
  lastDone?: string;
}

const TechnicalOperationsShowcase: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const maintenanceJobs: MaintenanceJob[] = [
    {
      id: '1',
      vesselName: 'MV OCEAN SPIRIT',
      system: 'Main Engine',
      jobType: 'preventive',
      description: 'Main engine 4000 hours service - filter change, oil analysis',
      priority: 'high',
      status: 'in_progress',
      dueDate: '2026-02-15',
      runningHours: 3950,
      lastDone: '2025-10-20',
    },
    {
      id: '2',
      vesselName: 'MV FORTUNE STAR',
      system: 'Auxiliary Engine #1',
      jobType: 'corrective',
      description: 'High temperature alarm - investigate and repair',
      priority: 'critical',
      status: 'in_progress',
      dueDate: '2026-02-10',
    },
    {
      id: '3',
      vesselName: 'MV PACIFIC CROWN',
      system: 'Ballast Pump',
      jobType: 'overhaul',
      description: 'Complete pump overhaul - bearings, seals, impeller',
      priority: 'medium',
      status: 'scheduled',
      dueDate: '2026-03-05',
      runningHours: 15200,
    },
    {
      id: '4',
      vesselName: 'MV OCEAN SPIRIT',
      system: 'Steering Gear',
      jobType: 'preventive',
      description: 'Monthly steering gear inspection and oil top-up',
      priority: 'medium',
      status: 'completed',
      dueDate: '2026-01-31',
      completedDate: '2026-01-30',
    },
  ];

  const jobTypeColors = {
    preventive: 'bg-blue-900/30 text-blue-400',
    corrective: 'bg-red-900/30 text-red-400',
    overhaul: 'bg-purple-900/30 text-purple-400',
  };

  const statusColors = {
    scheduled: 'bg-gray-800 text-gray-400',
    in_progress: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50',
    completed: 'bg-green-900/30 text-green-400 border-green-500/50',
    overdue: 'bg-red-900/30 text-red-400 border-red-500/50',
  };

  const priorityColors = {
    low: 'text-gray-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400 font-bold',
  };

  const filteredJobs = filterStatus === 'all'
    ? maintenanceJobs
    : maintenanceJobs.filter((j) => j.status === filterStatus);

  const summary = {
    total: maintenanceJobs.length,
    scheduled: maintenanceJobs.filter((j) => j.status === 'scheduled').length,
    inProgress: maintenanceJobs.filter((j) => j.status === 'in_progress').length,
    completed: maintenanceJobs.filter((j) => j.status === 'completed').length,
  };

  return (
    <ShowcaseLayout
      title="Technical Operations"
      icon="🔧"
      category="Technical Management"
      problem="Maintenance tracked in Excel and paper logs, PMS schedules missed due to running hours not synced, spare parts inventory unknown, and critical breakdowns costing $50K+ per incident due to reactive maintenance approach."
      solution="Integrated technical management platform with automated PMS scheduling based on running hours, predictive maintenance alerts, digital spare parts inventory, and mobile work order management - reducing unplanned downtime by 78% and maintenance costs by 32%."
      timeSaved="Reactive → Predictive"
      roi="52x"
      accuracy="78% downtime reduction"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-maritime-800 border-l-4 border-maritime-500 rounded-lg p-4">
            <div className="text-maritime-500 text-xs">Total Jobs</div>
            <div className="text-3xl font-bold text-white mt-1">{summary.total}</div>
          </div>
          <div className="bg-gray-900/50 border-l-4 border-gray-500 rounded-lg p-4">
            <div className="text-gray-400 text-xs">Scheduled</div>
            <div className="text-3xl font-bold text-gray-300 mt-1">{summary.scheduled}</div>
          </div>
          <div className="bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-4">
            <div className="text-yellow-400 text-xs">In Progress</div>
            <div className="text-3xl font-bold text-yellow-400 mt-1">{summary.inProgress}</div>
          </div>
          <div className="bg-green-900/20 border-l-4 border-green-500 rounded-lg p-4">
            <div className="text-green-400 text-xs">Completed (MTD)</div>
            <div className="text-3xl font-bold text-green-400 mt-1">{summary.completed}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded text-sm ${
              filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            All
          </button>
          {['scheduled', 'in_progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded text-sm ${
                filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Maintenance Jobs */}
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{job.system}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${jobTypeColors[job.jobType]}`}>
                      {job.jobType}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">{job.description}</div>
                  <div className="text-sm text-gray-500">Vessel: {job.vesselName}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold border-2 ${statusColors[job.status]}`}>
                    {job.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`text-sm font-semibold uppercase ${priorityColors[job.priority]}`}>
                    {job.priority}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Due Date:</span>
                  <span className="text-white ml-2">{job.dueDate}</span>
                </div>
                {job.runningHours && (
                  <div>
                    <span className="text-gray-400">Running Hours:</span>
                    <span className="text-white ml-2">{job.runningHours.toLocaleString()}</span>
                  </div>
                )}
                {job.lastDone && (
                  <div>
                    <span className="text-gray-400">Last Done:</span>
                    <span className="text-white ml-2">{job.lastDone}</span>
                  </div>
                )}
                {job.completedDate && (
                  <div>
                    <span className="text-gray-400">Completed:</span>
                    <span className="text-green-400 ml-2">{job.completedDate}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📊</span> Technical Performance Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">PMS Compliance</div>
              <div className="text-2xl font-bold text-green-400">98%</div>
              <div className="text-xs text-gray-500">on-time completion</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Unplanned Downtime</div>
              <div className="text-2xl font-bold text-blue-400">-78%</div>
              <div className="text-xs text-gray-500">reduction achieved</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Maintenance Cost</div>
              <div className="text-2xl font-bold text-purple-400">-32%</div>
              <div className="text-xs text-gray-500">vs reactive approach</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">MTBF</div>
              <div className="text-2xl font-bold text-yellow-400">2,850h</div>
              <div className="text-xs text-gray-500">mean time between failures</div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
};

export default TechnicalOperationsShowcase;
