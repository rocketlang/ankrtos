/**
 * Port Agent Portal
 * Complete workspace for port agents to manage vessel services
 *
 * Purpose: Streamline vessel-agent coordination and document processing
 */

import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  FileText,
  Ship,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  TrendingUp,
  Download,
  Send,
} from 'lucide-react';

const AGENT_PORTAL_QUERY = gql`
  query AgentPortal {
    vessels {
      id
      name
      imo
      type
    }

    voyages(status: "in_progress") {
      id
      voyageNumber
      vessel {
        id
        name
        imo
      }
      arrivalPort {
        name
      }
      eta
    }
  }
`;

export default function AgentPortal() {
  const [activeTab, setActiveTab] = useState<'documents' | 'da' | 'invoices' | 'performance'>('documents');

  const { data, loading } = useQuery(AGENT_PORTAL_QUERY, {
    pollInterval: 30000,
  });

  // Mock agent data (would come from backend)
  const agentStats = {
    pendingDocuments: 12,
    pendingDARequests: 5,
    outstandingInvoices: 8,
    activeVessels: 6,
    avgRating: 4.8,
    totalRevenue: 125000,
  };

  // Mock pending documents
  const pendingDocuments = [
    {
      id: '1',
      vessel: 'MV Star Navigator',
      imo: '9551492',
      documentType: 'Pre-Arrival Package',
      documentsCount: 10,
      submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      eta: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'pending_review',
    },
    {
      id: '2',
      vessel: 'MV Gujarat Pride',
      imo: '9612345',
      documentType: 'FAL Forms',
      documentsCount: 7,
      submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      eta: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: 'pending_review',
    },
    {
      id: '3',
      vessel: 'MV Cape Fortune',
      imo: '9687654',
      documentType: 'Port Clearance',
      documentsCount: 5,
      submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      eta: new Date(Date.now() + 6 * 60 * 60 * 1000),
      status: 'urgent',
    },
  ];

  // Mock DA requests
  const daRequests = [
    {
      id: 'da-1',
      vessel: 'MV Star Navigator',
      voyageNumber: 'V-2026-005',
      totalAmount: 15000,
      currency: 'USD',
      items: 12,
      status: 'pending_approval',
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'da-2',
      vessel: 'MV Gujarat Pride',
      voyageNumber: 'V-2026-008',
      totalAmount: 22500,
      currency: 'USD',
      items: 18,
      status: 'pending_approval',
      submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
  ];

  // Mock invoices
  const invoices = [
    {
      id: 'inv-1',
      vessel: 'MV Star Navigator',
      invoiceNumber: 'INV-2026-001',
      amount: 15000,
      currency: 'USD',
      issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
      status: 'outstanding',
    },
    {
      id: 'inv-2',
      vessel: 'MV Gujarat Pride',
      invoiceNumber: 'INV-2026-002',
      amount: 22500,
      currency: 'USD',
      issueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
      status: 'outstanding',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Ship className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold">Port Agent Portal</h1>
          <span className="px-3 py-1 bg-blue-600 rounded text-sm font-semibold">
            Agent Dashboard
          </span>
        </div>
        <p className="text-gray-400">
          Manage vessel services • Process documents • Track DA accounts
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <StatCard
          label="Pending Documents"
          value={agentStats.pendingDocuments}
          icon={<FileText className="w-5 h-5 text-yellow-400" />}
          urgent
        />
        <StatCard
          label="DA Requests"
          value={agentStats.pendingDARequests}
          icon={<DollarSign className="w-5 h-5 text-green-400" />}
        />
        <StatCard
          label="Outstanding Invoices"
          value={agentStats.outstandingInvoices}
          icon={<Clock className="w-5 h-5 text-orange-400" />}
        />
        <StatCard
          label="Active Vessels"
          value={agentStats.activeVessels}
          icon={<Ship className="w-5 h-5 text-blue-400" />}
        />
        <StatCard
          label="Avg Rating"
          value={agentStats.avgRating.toFixed(1)}
          icon={<Star className="w-5 h-5 text-yellow-400" />}
        />
        <StatCard
          label="Monthly Revenue"
          value={`$${Math.round(agentStats.totalRevenue / 1000)}K`}
          icon={<TrendingUp className="w-5 h-5 text-green-400" />}
        />
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 rounded-lg mb-6">
        <div className="flex border-b border-gray-700">
          <TabButton
            active={activeTab === 'documents'}
            onClick={() => setActiveTab('documents')}
            icon={<FileText className="w-4 h-4" />}
            label="Documents"
            count={agentStats.pendingDocuments}
          />
          <TabButton
            active={activeTab === 'da'}
            onClick={() => setActiveTab('da')}
            icon={<DollarSign className="w-4 h-4" />}
            label="DA Requests"
            count={agentStats.pendingDARequests}
          />
          <TabButton
            active={activeTab === 'invoices'}
            onClick={() => setActiveTab('invoices')}
            icon={<Clock className="w-4 h-4" />}
            label="Invoices"
            count={agentStats.outstandingInvoices}
          />
          <TabButton
            active={activeTab === 'performance'}
            onClick={() => setActiveTab('performance')}
            icon={<TrendingUp className="w-4 h-4" />}
            label="Performance"
          />
        </div>

        <div className="p-6">
          {activeTab === 'documents' && (
            <DocumentsTab documents={pendingDocuments} />
          )}
          {activeTab === 'da' && (
            <DARequestsTab requests={daRequests} />
          )}
          {activeTab === 'invoices' && (
            <InvoicesTab invoices={invoices} />
          )}
          {activeTab === 'performance' && (
            <PerformanceTab stats={agentStats} />
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  urgent,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  urgent?: boolean;
}) {
  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${urgent ? 'border-2 border-yellow-600' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// Tab Button Component
function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
        active
          ? 'border-blue-500 text-white'
          : 'border-transparent text-gray-400 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-semibold">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="px-2 py-0.5 bg-red-600 rounded-full text-xs font-bold">
          {count}
        </span>
      )}
    </button>
  );
}

// Documents Tab
function DocumentsTab({ documents }: { documents: any[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Pending Document Submissions</h3>
        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Approve All
        </button>
      </div>

      {documents.map((doc) => (
        <div
          key={doc.id}
          className={`bg-gray-700 rounded-lg p-4 ${
            doc.status === 'urgent' ? 'border-2 border-red-600' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Ship className="w-5 h-5 text-blue-400" />
                <div>
                  <h4 className="font-semibold">{doc.vessel}</h4>
                  <p className="text-sm text-gray-400">IMO: {doc.imo}</p>
                </div>
                {doc.status === 'urgent' && (
                  <span className="px-2 py-1 bg-red-600 rounded text-xs font-semibold">
                    URGENT
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Document Type</p>
                  <p className="font-semibold">{doc.documentType}</p>
                </div>
                <div>
                  <p className="text-gray-400">Documents Count</p>
                  <p className="font-semibold">{doc.documentsCount} files</p>
                </div>
                <div>
                  <p className="text-gray-400">ETA</p>
                  <p className="font-semibold">{doc.eta.toLocaleDateString()}</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Submitted {Math.round((Date.now() - doc.submittedAt.getTime()) / (1000 * 60 * 60))} hours ago
              </p>
            </div>

            <div className="flex gap-2">
              <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded" title="View Documents">
                <FileText className="w-4 h-4" />
              </button>
              <button className="p-2 bg-green-600 hover:bg-green-700 rounded" title="Approve">
                <CheckCircle className="w-4 h-4" />
              </button>
              <button className="p-2 bg-purple-600 hover:bg-purple-700 rounded" title="Download All">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// DA Requests Tab
function DARequestsTab({ requests }: { requests: any[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Pending DA Requests</h3>
      </div>

      {requests.map((req) => (
        <div key={req.id} className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                  <h4 className="font-semibold">{req.vessel}</h4>
                  <p className="text-sm text-gray-400">Voyage: {req.voyageNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Total Amount</p>
                  <p className="text-xl font-bold text-green-400">
                    ${req.totalAmount.toLocaleString()} {req.currency}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Line Items</p>
                  <p className="font-semibold">{req.items} items</p>
                </div>
                <div>
                  <p className="text-gray-400">Status</p>
                  <span className="px-2 py-1 bg-yellow-600 rounded text-xs font-semibold">
                    Pending
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Review
              </button>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Invoices Tab
function InvoicesTab({ invoices }: { invoices: any[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Outstanding Invoices</h3>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2">
          <Send className="w-4 h-4" />
          Send Reminders
        </button>
      </div>

      {invoices.map((inv) => (
        <div key={inv.id} className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-5 h-5 text-orange-400" />
                <div>
                  <h4 className="font-semibold">{inv.invoiceNumber}</h4>
                  <p className="text-sm text-gray-400">{inv.vessel}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Amount</p>
                  <p className="text-xl font-bold text-green-400">
                    ${inv.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Issue Date</p>
                  <p className="font-semibold">{inv.issueDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Due Date</p>
                  <p className="font-semibold">{inv.dueDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Status</p>
                  <span className="px-2 py-1 bg-orange-600 rounded text-xs font-semibold">
                    Outstanding
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="p-2 bg-purple-600 hover:bg-purple-700 rounded" title="Download PDF">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded" title="Send Reminder">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Performance Tab
function PerformanceTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold mb-4">Agent Performance Analytics</h3>

      {/* Rating */}
      <div className="bg-gray-700 rounded-lg p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Average Rating
        </h4>

        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-yellow-400">{stats.avgRating}</div>
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.floor(stats.avgRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-400">Based on 127 vessel reviews</p>
          </div>
        </div>
      </div>

      {/* Revenue */}
      <div className="bg-gray-700 rounded-lg p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Monthly Revenue
        </h4>

        <p className="text-4xl font-bold text-green-400 mb-2">
          ${stats.totalRevenue.toLocaleString()}
        </p>
        <p className="text-sm text-gray-400">+12% vs last month</p>
      </div>

      {/* Service Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Avg Response Time</p>
          <p className="text-2xl font-bold">1.2 hours</p>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Documents Processed</p>
          <p className="text-2xl font-bold">342</p>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">On-Time Completion</p>
          <p className="text-2xl font-bold">98.5%</p>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Active Vessels</p>
          <p className="text-2xl font-bold">{stats.activeVessels}</p>
        </div>
      </div>
    </div>
  );
}
