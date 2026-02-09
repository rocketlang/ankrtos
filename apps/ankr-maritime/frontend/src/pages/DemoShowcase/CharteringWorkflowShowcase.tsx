import React, { useState } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface WorkflowStep {
  id: string;
  title: string;
  status: 'completed' | 'active' | 'pending';
  timestamp?: string;
  user?: string;
  details?: string[];
}

interface Vessel {
  name: string;
  imo: string;
  type: string;
  dwt: number;
  built: number;
  flag: string;
  openPort: string;
  openDate: string;
  tce: number;
  matchScore: number;
}

interface Offer {
  id: string;
  vessel: string;
  rate: number;
  unit: string;
  validUntil: string;
  status: 'pending' | 'countered' | 'accepted' | 'rejected';
  terms?: string[];
  counterRate?: number;
}

interface Document {
  name: string;
  type: string;
  status: 'draft' | 'pending' | 'signed';
  timestamp: string;
}

const CharteringWorkflowShowcase: React.FC = () => {
  const [currentStage, setCurrentStage] = useState<number>(3);
  const [selectedVessel, setSelectedVessel] = useState<string>('MV OCEAN SPIRIT');

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'enquiry',
      title: 'Cargo Enquiry Received',
      status: currentStage >= 1 ? 'completed' : 'pending',
      timestamp: '2026-02-08 09:15',
      user: 'John Chen (Charterer)',
      details: [
        'Cargo: 65,000 MT Iron Ore',
        'Load: Port Hedland, Australia',
        'Discharge: Qingdao, China',
        'Laycan: Mar 10-15, 2026',
      ],
    },
    {
      id: 'search',
      title: 'Vessel Search & Screening',
      status: currentStage >= 2 ? 'completed' : currentStage === 1 ? 'active' : 'pending',
      timestamp: currentStage >= 2 ? '2026-02-08 09:45' : undefined,
      user: 'AI-Powered Matching',
      details: [
        '127 vessels screened',
        '8 suitable candidates identified',
        '3 top matches presented',
      ],
    },
    {
      id: 'offer',
      title: 'Offers & Negotiation',
      status: currentStage >= 3 ? 'completed' : currentStage === 2 ? 'active' : 'pending',
      timestamp: currentStage >= 3 ? '2026-02-08 11:30' : undefined,
      user: 'Sarah Kim (Broker)',
      details: [
        'Initial offer: $12.50/ton',
        'Counter-offer: $11.80/ton',
        'Final agreed: $12.15/ton',
      ],
    },
    {
      id: 'approval',
      title: 'Internal Approval',
      status: currentStage >= 4 ? 'completed' : currentStage === 3 ? 'active' : 'pending',
      timestamp: currentStage >= 4 ? '2026-02-08 14:20' : undefined,
      user: 'Michael Ross (VP Chartering)',
      details: [
        'Commercial approved',
        'TCE analysis: $18,500/day',
        'Risk assessment: Low',
      ],
    },
    {
      id: 'fixture',
      title: 'Fixture Note Issued',
      status: currentStage >= 5 ? 'completed' : currentStage === 4 ? 'active' : 'pending',
      timestamp: currentStage >= 5 ? '2026-02-08 15:45' : undefined,
      user: 'System Generated',
      details: [
        'Recap sent to both parties',
        'Charter Party template selected',
        'Awaiting final signatures',
      ],
    },
    {
      id: 'documentation',
      title: 'Charter Party Signed',
      status: currentStage >= 6 ? 'completed' : currentStage === 5 ? 'active' : 'pending',
      timestamp: currentStage >= 6 ? '2026-02-09 10:00' : undefined,
      user: 'DocuSign Integration',
      details: [
        'Owner signed: 2026-02-08 18:30',
        'Charterer signed: 2026-02-09 10:00',
        'Deal closed',
      ],
    },
  ];

  const vesselCandidates: Vessel[] = [
    {
      name: 'MV OCEAN SPIRIT',
      imo: 'IMO 9876543',
      type: 'Bulk Carrier',
      dwt: 82000,
      built: 2018,
      flag: '🇵🇦 Panama',
      openPort: 'Singapore',
      openDate: '2026-03-08',
      tce: 18500,
      matchScore: 98,
    },
    {
      name: 'MV FORTUNE STAR',
      imo: 'IMO 9854321',
      type: 'Bulk Carrier',
      dwt: 76000,
      built: 2020,
      flag: '🇲🇭 Marshall Islands',
      openPort: 'Kaohsiung',
      openDate: '2026-03-10',
      tce: 17800,
      matchScore: 95,
    },
    {
      name: 'MV PACIFIC CROWN',
      imo: 'IMO 9765432',
      type: 'Bulk Carrier',
      dwt: 81500,
      built: 2017,
      flag: '🇱🇷 Liberia',
      openPort: 'Manila',
      openDate: '2026-03-12',
      tce: 17200,
      matchScore: 92,
    },
  ];

  const offers: Offer[] = [
    {
      id: '1',
      vessel: 'MV OCEAN SPIRIT',
      rate: 12.50,
      unit: '$/ton',
      validUntil: '2026-02-08 18:00',
      status: 'countered',
      terms: ['FIOST', 'Weather Working Days', 'SHINC'],
      counterRate: 11.80,
    },
    {
      id: '2',
      vessel: 'MV FORTUNE STAR',
      rate: 12.20,
      unit: '$/ton',
      validUntil: '2026-02-08 18:00',
      status: 'pending',
      terms: ['FIOST', 'Running Days', 'SHEX'],
    },
    {
      id: '3',
      vessel: 'MV PACIFIC CROWN',
      rate: 11.95,
      unit: '$/ton',
      validUntil: '2026-02-08 18:00',
      status: 'rejected',
      terms: ['FIOS', 'Weather Working Days', 'SHINC'],
    },
  ];

  const documents: Document[] = [
    {
      name: 'Fixture Recap',
      type: 'PDF',
      status: 'signed',
      timestamp: '2026-02-08 15:45',
    },
    {
      name: 'Charter Party (NYPE 2015)',
      type: 'PDF',
      status: 'signed',
      timestamp: '2026-02-09 10:00',
    },
    {
      name: 'Rate Confirmation',
      type: 'PDF',
      status: 'signed',
      timestamp: '2026-02-08 14:30',
    },
    {
      name: 'TCE Analysis Report',
      type: 'XLSX',
      status: 'pending',
      timestamp: '2026-02-08 14:00',
    },
  ];

  const getStepIcon = (status: string) => {
    if (status === 'completed') return '✓';
    if (status === 'active') return '⏳';
    return '○';
  };

  const getStepColor = (status: string) => {
    if (status === 'completed') return 'text-green-400 border-green-400 bg-green-900/30';
    if (status === 'active') return 'text-blue-400 border-blue-400 bg-blue-900/30';
    return 'text-gray-500 border-gray-600 bg-gray-800/30';
  };

  const getOfferStatusColor = (status: string) => {
    if (status === 'accepted') return 'bg-green-900/30 text-green-400';
    if (status === 'countered') return 'bg-yellow-900/30 text-yellow-400';
    if (status === 'rejected') return 'bg-red-900/30 text-red-400';
    return 'bg-blue-900/30 text-blue-400';
  };

  const getDocStatusColor = (status: string) => {
    if (status === 'signed') return 'text-green-400';
    if (status === 'pending') return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <ShowcaseLayout
      title="Chartering Workflow"
      icon="🚢"
      category="Commercial Operations"
      problem="Traditional chartering involves endless email chains, manual vessel screening through Excel sheets, back-and-forth negotiations across time zones, and weeks to close a single fixture - resulting in missed opportunities and revenue leakage."
      solution="Automated end-to-end chartering workflow with AI-powered vessel matching, real-time negotiation tracking, integrated approvals, and instant document generation - reducing fixture time from 2 weeks to 2 days while improving TCE by 12%."
      timeSaved="2 weeks → 2 days"
      roi="35x"
      accuracy="12% TCE improvement"
      nextSection={{
        title: 'Route Optimization',
        path: '/demo-showcase/route-optimization',
      }}
    >
      <div className="space-y-6">
        {/* Workflow Timeline */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Fixture Progress Timeline</h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((stage) => (
                <button
                  key={stage}
                  onClick={() => setCurrentStage(stage)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    currentStage === stage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Stage {stage}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-700" />

            {/* Steps */}
            <div className="space-y-6">
              {workflowSteps.map((step, idx) => (
                <div key={step.id} className="relative flex gap-4">
                  {/* Step indicator */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-2 font-bold text-xl ${getStepColor(
                      step.status
                    )}`}
                  >
                    {getStepIcon(step.status)}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{step.title}</h4>
                        {step.timestamp && (
                          <div className="text-xs text-gray-500 mt-1">
                            {step.timestamp} • {step.user}
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          step.status === 'completed'
                            ? 'bg-green-900/30 text-green-400'
                            : step.status === 'active'
                            ? 'bg-blue-900/30 text-blue-400'
                            : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>

                    {step.details && (
                      <ul className="space-y-1 mt-3">
                        {step.details.map((detail, i) => (
                          <li key={i} className="text-sm text-gray-400 flex items-center gap-2">
                            <span className="text-gray-600">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vessel Candidates */}
        {currentStage >= 2 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              AI-Matched Vessel Candidates
            </h3>
            <div className="space-y-3">
              {vesselCandidates.map((vessel) => (
                <div
                  key={vessel.imo}
                  className={`bg-gray-800/50 border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedVessel === vessel.name
                      ? 'border-blue-500 bg-blue-900/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedVessel(vessel.name)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-semibold">{vessel.name}</h4>
                        <span className="text-sm text-gray-400">{vessel.imo}</span>
                        <span className="text-sm">{vessel.flag}</span>
                        <span
                          className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
                            vessel.matchScore >= 95
                              ? 'bg-green-900/30 text-green-400'
                              : vessel.matchScore >= 90
                              ? 'bg-blue-900/30 text-blue-400'
                              : 'bg-yellow-900/30 text-yellow-400'
                          }`}
                        >
                          {vessel.matchScore}% Match
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500 text-xs">DWT</div>
                          <div className="text-white font-medium">
                            {vessel.dwt.toLocaleString()} MT
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Built</div>
                          <div className="text-white font-medium">{vessel.built}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Open Port/Date</div>
                          <div className="text-white font-medium">
                            {vessel.openPort}, {vessel.openDate}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Est. TCE</div>
                          <div className="text-green-400 font-bold">
                            ${vessel.tce.toLocaleString()}/day
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offers & Negotiation */}
        {currentStage >= 3 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Offers & Negotiation Status
            </h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Vessel
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">
                      Initial Offer
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">
                      Counter Offer
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Terms
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {offers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-white font-medium">
                        {offer.vessel}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-white font-semibold">
                        ${offer.rate.toFixed(2)} {offer.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {offer.counterRate ? (
                          <span className="text-yellow-400 font-semibold">
                            ${offer.counterRate.toFixed(2)} {offer.unit}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {offer.terms?.join(', ')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getOfferStatusColor(
                            offer.status
                          )}`}
                        >
                          {offer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Final Agreement */}
            {currentStage >= 4 && (
              <div className="mt-4 bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">✓</span>
                  <h4 className="text-lg font-semibold text-white">
                    Final Agreement Reached
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Vessel</div>
                    <div className="text-white font-semibold">MV OCEAN SPIRIT</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Agreed Rate</div>
                    <div className="text-green-400 font-bold text-lg">$12.15/ton</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Total Freight</div>
                    <div className="text-white font-semibold">$789,750</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Documentation */}
        {currentStage >= 5 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Documents & Signatures
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center gap-4"
                >
                  <div className="text-3xl">
                    {doc.type === 'PDF' ? '📄' : '📊'}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{doc.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{doc.timestamp}</div>
                  </div>
                  <div className={`text-xl ${getDocStatusColor(doc.status)}`}>
                    {doc.status === 'signed' ? '✓' : '⏳'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📊</span> Workflow Performance Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Time to Fixture</div>
              <div className="text-2xl font-bold text-green-400">1.5 days</div>
              <div className="text-xs text-gray-500">vs 14 days avg</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Vessels Screened</div>
              <div className="text-2xl font-bold text-blue-400">127</div>
              <div className="text-xs text-gray-500">in 30 seconds</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">TCE Improvement</div>
              <div className="text-2xl font-bold text-purple-400">+12%</div>
              <div className="text-xs text-gray-500">$2,200/day</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Auto-generated Docs</div>
              <div className="text-2xl font-bold text-yellow-400">8</div>
              <div className="text-xs text-gray-500">instant creation</div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
};

export default CharteringWorkflowShowcase;
