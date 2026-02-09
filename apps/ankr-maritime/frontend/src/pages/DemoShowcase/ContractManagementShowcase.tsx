import React, { useState } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface COA {
  id: string;
  reference: string;
  cargoType: string;
  totalQuantity: number;
  tolerancePercent: number;
  maxShipments: number;
  completedShipments: number;
  nominatedQuantity: number;
  shippedQuantity: number;
  loadPortRange: string;
  dischargePortRange: string;
  startDate: string;
  endDate: string;
  freightRate: number;
  currency: string;
  status: 'active' | 'completed' | 'expired';
}

interface TimeCharter {
  id: string;
  reference: string;
  vesselName: string;
  chartererName: string;
  hireRate: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
  totalDays: number;
  completedDays: number;
}

const ContractManagementShowcase: React.FC = () => {
  const [contractType, setContractType] = useState<'coa' | 'timecharter'>('coa');

  const coaContracts: COA[] = [
    {
      id: '1',
      reference: 'COA-2026-001',
      cargoType: 'Iron Ore',
      totalQuantity: 500000,
      tolerancePercent: 10,
      maxShipments: 8,
      completedShipments: 3,
      nominatedQuantity: 195000,
      shippedQuantity: 185000,
      loadPortRange: 'Port Hedland/Dampier',
      dischargePortRange: 'Qingdao/Rizhao',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      freightRate: 12.50,
      currency: 'USD',
      status: 'active',
    },
    {
      id: '2',
      reference: 'COA-2025-045',
      cargoType: 'Coal',
      totalQuantity: 300000,
      tolerancePercent: 5,
      maxShipments: 6,
      completedShipments: 6,
      nominatedQuantity: 310000,
      shippedQuantity: 305000,
      loadPortRange: 'Newcastle/Gladstone',
      dischargePortRange: 'Mumbai/Chennai',
      startDate: '2025-03-01',
      endDate: '2025-12-31',
      freightRate: 18.75,
      currency: 'USD',
      status: 'completed',
    },
  ];

  const timeCharters: TimeCharter[] = [
    {
      id: '1',
      reference: 'TC-2026-005',
      vesselName: 'MV FORTUNE STAR',
      chartererName: 'Pacific Trading Co.',
      hireRate: 18500,
      currency: 'USD',
      startDate: '2026-01-15',
      endDate: '2026-07-15',
      status: 'active',
      totalDays: 182,
      completedDays: 25,
    },
    {
      id: '2',
      reference: 'TC-2025-089',
      vesselName: 'MV OCEAN SPIRIT',
      chartererName: 'Global Shipping Ltd.',
      hireRate: 16800,
      currency: 'USD',
      startDate: '2025-06-01',
      endDate: '2025-12-31',
      status: 'completed',
      totalDays: 214,
      completedDays: 214,
    },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-green-900/30 text-green-400 border-green-500/50';
    if (status === 'completed') return 'bg-blue-900/30 text-blue-400 border-blue-500/50';
    return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50';
  };

  return (
    <ShowcaseLayout
      title="Contract Management"
      icon="📋"
      category="Commercial Operations"
      problem="COA nominations tracked in Excel, time charter hire calculations manual, contract performance monitoring reactive, and compliance verification taking days - resulting in missed nominations, hire disputes, and $100K+ annual losses."
      solution="Centralized contract management with automated COA nomination tracking, time charter hire calculations, performance monitoring dashboards, and compliance alerts - eliminating disputes and improving contract utilization by 23%."
      timeSaved="Manual tracking → Automated"
      roi="38x"
      accuracy="23% utilization improvement"
      nextSection={{
        title: 'Compliance Hub',
        path: '/demo-showcase/compliance-hub',
      }}
    >
      <div className="space-y-6">
        {/* Contract Type Selector */}
        <div className="flex gap-4">
          <button
            onClick={() => setContractType('coa')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              contractType === 'coa'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <div className="text-2xl mb-1">📦</div>
            Contract of Affreightment (COA)
          </button>
          <button
            onClick={() => setContractType('timecharter')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              contractType === 'timecharter'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <div className="text-2xl mb-1">🚢</div>
            Time Charter Contracts
          </button>
        </div>

        {/* COA Contracts */}
        {contractType === 'coa' && (
          <div className="space-y-4">
            {coaContracts.map((coa) => (
              <div key={coa.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{coa.reference}</h3>
                    <div className="text-gray-400 text-sm">
                      {coa.cargoType} • {coa.loadPortRange} → {coa.dischargePortRange}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold border-2 ${getStatusColor(coa.status)}`}>
                    {coa.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Total Quantity</div>
                    <div className="text-2xl font-bold text-white">{coa.totalQuantity.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">MT (±{coa.tolerancePercent}%)</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Shipped</div>
                    <div className="text-2xl font-bold text-green-400">{coa.shippedQuantity.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">MT ({((coa.shippedQuantity/coa.totalQuantity)*100).toFixed(1)}%)</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Shipments</div>
                    <div className="text-2xl font-bold text-blue-400">{coa.completedShipments}/{coa.maxShipments}</div>
                    <div className="text-xs text-gray-500">completed</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Freight Rate</div>
                    <div className="text-2xl font-bold text-white">${coa.freightRate}</div>
                    <div className="text-xs text-gray-500">per ton</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-semibold">{((coa.shippedQuantity/coa.totalQuantity)*100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${(coa.shippedQuantity/coa.totalQuantity)*100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Period:</span>
                    <span className="text-white ml-2">{coa.startDate} to {coa.endDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Nominated:</span>
                    <span className="text-white ml-2">{coa.nominatedQuantity.toLocaleString()} MT</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Time Charter Contracts */}
        {contractType === 'timecharter' && (
          <div className="space-y-4">
            {timeCharters.map((tc) => (
              <div key={tc.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{tc.reference}</h3>
                    <div className="text-gray-400 text-sm">
                      {tc.vesselName} • Charterer: {tc.chartererName}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold border-2 ${getStatusColor(tc.status)}`}>
                    {tc.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Daily Hire Rate</div>
                    <div className="text-2xl font-bold text-white">${tc.hireRate.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">per day</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Total Hire</div>
                    <div className="text-2xl font-bold text-green-400">${((tc.hireRate * tc.completedDays)/1000000).toFixed(2)}M</div>
                    <div className="text-xs text-gray-500">earned to date</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Days Completed</div>
                    <div className="text-2xl font-bold text-blue-400">{tc.completedDays}/{tc.totalDays}</div>
                    <div className="text-xs text-gray-500">days</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Remaining</div>
                    <div className="text-2xl font-bold text-white">{tc.totalDays - tc.completedDays}</div>
                    <div className="text-xs text-gray-500">days</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Charter Period Progress</span>
                    <span className="text-white font-semibold">{((tc.completedDays/tc.totalDays)*100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{ width: `${(tc.completedDays/tc.totalDays)*100}%` }}
                    />
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-gray-400">Period:</span>
                  <span className="text-white ml-2">{tc.startDate} to {tc.endDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📊</span> Contract Portfolio Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Active COAs</div>
              <div className="text-2xl font-bold text-green-400">1</div>
              <div className="text-xs text-gray-500">37% complete</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Active T/C</div>
              <div className="text-2xl font-bold text-blue-400">1</div>
              <div className="text-xs text-gray-500">14% complete</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-purple-400">$2.8M</div>
              <div className="text-xs text-gray-500">YTD</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Utilization</div>
              <div className="text-2xl font-bold text-yellow-400">96%</div>
              <div className="text-xs text-gray-500">+23% vs baseline</div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
};

export default ContractManagementShowcase;
