import React, { useState } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface Document {
  id: string;
  name: string;
  type: string;
  stage: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'signed';
  version: number;
  owner: string;
  timestamp: string;
  signatories?: Signatory[];
  blockchain?: BlockchainRecord;
}

interface Signatory {
  party: string;
  name: string;
  status: 'pending' | 'signed' | 'rejected';
  timestamp?: string;
  ipAddress?: string;
}

interface BlockchainRecord {
  hash: string;
  blockNumber: number;
  network: string;
  timestamp: string;
  gasUsed: string;
}

interface DocumentVersion {
  version: number;
  timestamp: string;
  user: string;
  changes: string;
  hash: string;
}

interface Workflow {
  id: string;
  documentType: string;
  currentStep: number;
  totalSteps: number;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  step: number;
  action: string;
  assignedTo: string;
  status: 'completed' | 'in-progress' | 'pending';
  completedAt?: string;
  duration?: string;
}

const DocumentChainShowcase: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<string>('charter-party');
  const [showBlockchain, setShowBlockchain] = useState<boolean>(false);

  const documents: Document[] = [
    {
      id: 'charter-party',
      name: 'Charter Party - MV OCEAN SPIRIT',
      type: 'Charter Party',
      stage: 'Execution',
      status: 'signed',
      version: 3,
      owner: 'Sarah Kim',
      timestamp: '2026-02-09 14:30',
      signatories: [
        {
          party: 'Owner',
          name: 'Ocean Shipping Ltd.',
          status: 'signed',
          timestamp: '2026-02-09 12:15',
          ipAddress: '203.45.67.89',
        },
        {
          party: 'Charterer',
          name: 'Pacific Trading Co.',
          status: 'signed',
          timestamp: '2026-02-09 14:30',
          ipAddress: '185.22.198.104',
        },
      ],
      blockchain: {
        hash: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb9',
        blockNumber: 18547293,
        network: 'Ethereum Mainnet',
        timestamp: '2026-02-09 14:31:45',
        gasUsed: '0.0021 ETH',
      },
    },
    {
      id: 'bill-of-lading',
      name: 'Bill of Lading - SG to RTM',
      type: 'Bill of Lading',
      stage: 'In Transit',
      status: 'approved',
      version: 2,
      owner: 'Port Agent Singapore',
      timestamp: '2026-02-10 08:45',
      signatories: [
        {
          party: 'Carrier',
          name: 'MV OCEAN SPIRIT',
          status: 'signed',
          timestamp: '2026-02-10 08:00',
        },
        {
          party: 'Shipper',
          name: 'Iron Ore Exports Ltd.',
          status: 'signed',
          timestamp: '2026-02-10 08:45',
        },
        {
          party: 'Consignee',
          name: 'European Steel Works',
          status: 'pending',
        },
      ],
    },
    {
      id: 'sof',
      name: 'Statement of Facts - Singapore',
      type: 'Statement of Facts',
      stage: 'Port Call',
      status: 'pending',
      version: 1,
      owner: 'Port Agent',
      timestamp: '2026-02-12 09:30',
      signatories: [
        {
          party: 'Master',
          name: 'Captain Johnson',
          status: 'signed',
          timestamp: '2026-02-12 09:30',
        },
        {
          party: 'Agent',
          name: 'Singapore Maritime Services',
          status: 'pending',
        },
        {
          party: 'Charterer Rep',
          name: 'John Chen',
          status: 'pending',
        },
      ],
    },
    {
      id: 'commercial-invoice',
      name: 'Commercial Invoice #INV-2026-045',
      type: 'Invoice',
      stage: 'Payment',
      status: 'approved',
      version: 1,
      owner: 'Finance Team',
      timestamp: '2026-02-11 16:20',
    },
  ];

  const documentVersions: DocumentVersion[] = [
    {
      version: 1,
      timestamp: '2026-02-08 10:15',
      user: 'Sarah Kim',
      changes: 'Initial draft created from NYPE 2015 template',
      hash: 'a3f8c92b...',
    },
    {
      version: 2,
      timestamp: '2026-02-08 15:30',
      user: 'Legal Team',
      changes: 'Updated laytime terms, added weather warranty clause',
      hash: 'e7d4a18f...',
    },
    {
      version: 3,
      timestamp: '2026-02-09 09:00',
      user: 'Sarah Kim',
      changes: 'Final freight rate adjustment to $12.15/ton, removed demurrage cap',
      hash: 'b9e2c55d...',
    },
  ];

  const workflow: Workflow = {
    id: 'charter-party-workflow',
    documentType: 'Charter Party',
    currentStep: 6,
    totalSteps: 6,
    steps: [
      {
        step: 1,
        action: 'Draft Creation',
        assignedTo: 'Chartering Team',
        status: 'completed',
        completedAt: '2026-02-08 10:15',
        duration: '45 min',
      },
      {
        step: 2,
        action: 'Legal Review',
        assignedTo: 'Legal Department',
        status: 'completed',
        completedAt: '2026-02-08 15:30',
        duration: '4.5 hours',
      },
      {
        step: 3,
        action: 'Commercial Approval',
        assignedTo: 'VP Chartering',
        status: 'completed',
        completedAt: '2026-02-08 17:45',
        duration: '2 hours',
      },
      {
        step: 4,
        action: 'Counter-party Review',
        assignedTo: 'Charterer',
        status: 'completed',
        completedAt: '2026-02-09 11:00',
        duration: '16 hours',
      },
      {
        step: 5,
        action: 'Owner Signature',
        assignedTo: 'Owner Representative',
        status: 'completed',
        completedAt: '2026-02-09 12:15',
        duration: '1 hour',
      },
      {
        step: 6,
        action: 'Charterer Signature',
        assignedTo: 'Charterer Representative',
        status: 'completed',
        completedAt: '2026-02-09 14:30',
        duration: '2 hours',
      },
    ],
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocument) || documents[0];

  const getStatusColor = (status: string) => {
    if (status === 'signed' || status === 'approved' || status === 'completed')
      return 'bg-green-900/30 text-green-400 border-green-500/50';
    if (status === 'pending' || status === 'in-progress')
      return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50';
    if (status === 'rejected') return 'bg-red-900/30 text-red-400 border-red-500/50';
    return 'bg-gray-800 text-gray-400 border-gray-600';
  };

  const getStepIcon = (status: string) => {
    if (status === 'completed') return '✓';
    if (status === 'in-progress') return '⏳';
    return '○';
  };

  return (
    <ShowcaseLayout
      title="Document Chain"
      icon="📄"
      category="Document Management"
      problem="Maritime documents scattered across emails, DocuSign, and file servers with no audit trail, version control chaos, signature delays of 3-5 days, and disputes over document authenticity costing thousands in legal fees."
      solution="Blockchain-based document management with smart contracts, automated workflows, real-time collaboration, immutable audit trails, and instant multi-party signatures - reducing document cycle time from days to hours while ensuring legal compliance and authenticity."
      timeSaved="3-5 days → 2 hours"
      roi="40x"
      accuracy="100% audit trail"
      nextSection={{
        title: 'Claims Settlement',
        path: '/demo-showcase/claims-settlement',
      }}
    >
      <div className="space-y-6">
        {/* Document Selection */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Document Portfolio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedDocument === doc.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
                onClick={() => setSelectedDocument(doc.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">
                    {doc.type === 'Charter Party'
                      ? '📋'
                      : doc.type === 'Bill of Lading'
                      ? '📦'
                      : doc.type === 'Statement of Facts'
                      ? '📊'
                      : '💰'}
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(
                      doc.status
                    )}`}
                  >
                    {doc.status}
                  </span>
                </div>
                <div className="text-white font-semibold text-sm mb-1">{doc.name}</div>
                <div className="text-xs text-gray-500">
                  v{doc.version} • {doc.stage}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Details */}
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{selectedDoc.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>Type: {selectedDoc.type}</span>
                <span>•</span>
                <span>Version: {selectedDoc.version}</span>
                <span>•</span>
                <span>Owner: {selectedDoc.owner}</span>
                <span>•</span>
                <span>{selectedDoc.timestamp}</span>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-lg text-sm font-bold border-2 ${getStatusColor(
                selectedDoc.status
              )}`}
            >
              {selectedDoc.status.toUpperCase()}
            </span>
          </div>

          {selectedDoc.blockchain && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⛓️</span>
                  <h4 className="text-white font-semibold">
                    Blockchain Verification
                  </h4>
                </div>
                <button
                  onClick={() => setShowBlockchain(!showBlockchain)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
                >
                  {showBlockchain ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {showBlockchain && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">Transaction Hash</div>
                    <div className="text-blue-400 font-mono text-xs">
                      {selectedDoc.blockchain.hash}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Block Number</div>
                    <div className="text-white font-semibold">
                      #{selectedDoc.blockchain.blockNumber.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Network</div>
                    <div className="text-white">{selectedDoc.blockchain.network}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Gas Used</div>
                    <div className="text-white">{selectedDoc.blockchain.gasUsed}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-gray-400 mb-1">Timestamp</div>
                    <div className="text-white">{selectedDoc.blockchain.timestamp}</div>
                  </div>
                  <div className="col-span-2 mt-2 p-3 bg-green-900/20 border border-green-500/30 rounded">
                    <div className="flex items-center gap-2 text-green-400">
                      <span className="text-xl">✓</span>
                      <span className="font-semibold">
                        Document immutably recorded on blockchain
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      This document cannot be altered or disputed. All signatures and
                      modifications are cryptographically verified.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Signatories */}
        {selectedDoc.signatories && selectedDoc.signatories.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Signature Status & Workflow
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedDoc.signatories.map((sig, idx) => (
                <div
                  key={idx}
                  className={`border-2 rounded-lg p-4 ${getStatusColor(sig.status)}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-400">{sig.party}</div>
                    <span className="text-2xl">
                      {sig.status === 'signed' ? '✓' : sig.status === 'rejected' ? '✗' : '⏳'}
                    </span>
                  </div>
                  <div className="text-white font-semibold mb-2">{sig.name}</div>
                  {sig.timestamp && (
                    <div className="text-xs text-gray-400 mb-1">
                      Signed: {sig.timestamp}
                    </div>
                  )}
                  {sig.ipAddress && (
                    <div className="text-xs text-gray-500 font-mono">
                      IP: {sig.ipAddress}
                    </div>
                  )}
                  {sig.status === 'pending' && (
                    <div className="mt-3">
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded transition-colors">
                        Send Reminder
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Version History */}
        {selectedDocument === 'charter-party' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Version History & Audit Trail
            </h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Version
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Timestamp
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Changes
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                      Hash
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {documentVersions.map((version) => (
                    <tr
                      key={version.version}
                      className="hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-sm font-semibold">
                          v{version.version}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                        {version.timestamp}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{version.user}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{version.changes}</td>
                      <td className="px-4 py-3 text-sm text-blue-400 font-mono">
                        {version.hash}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Workflow Progress */}
        {selectedDocument === 'charter-party' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Document Workflow Progress
            </h3>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Workflow Progress</div>
                  <div className="text-2xl font-bold text-white">
                    {workflow.currentStep} of {workflow.totalSteps} Steps Complete
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-1">Total Time</div>
                  <div className="text-xl font-bold text-green-400">26 hours</div>
                </div>
              </div>

              <div className="relative">
                {/* Progress line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700" />

                {/* Steps */}
                <div className="space-y-4">
                  {workflow.steps.map((step) => (
                    <div key={step.step} className="relative flex gap-4">
                      <div
                        className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 font-bold ${
                          step.status === 'completed'
                            ? 'bg-green-900/30 border-green-500 text-green-400'
                            : step.status === 'in-progress'
                            ? 'bg-blue-900/30 border-blue-500 text-blue-400'
                            : 'bg-gray-800 border-gray-600 text-gray-400'
                        }`}
                      >
                        {getStepIcon(step.status)}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-semibold">{step.action}</h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                              step.status
                            )}`}
                          >
                            {step.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Assigned to: {step.assignedTo}
                        </div>
                        {step.completedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Completed: {step.completedAt} ({step.duration})
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Benefits */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🎯</span> Document Chain Benefits
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Signature Time</div>
              <div className="text-2xl font-bold text-green-400">2 hours</div>
              <div className="text-xs text-gray-500">vs 3-5 days traditional</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Dispute Resolution</div>
              <div className="text-2xl font-bold text-blue-400">0 days</div>
              <div className="text-xs text-gray-500">immutable blockchain proof</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Document Security</div>
              <div className="text-2xl font-bold text-purple-400">100%</div>
              <div className="text-xs text-gray-500">cryptographically verified</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm mb-1">Cost Savings</div>
              <div className="text-2xl font-bold text-yellow-400">$12K</div>
              <div className="text-xs text-gray-500">per charter party</div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
};

export default DocumentChainShowcase;
