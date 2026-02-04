/**
 * Arrival Intelligence Detail View
 *
 * Complete intelligence view for a single vessel arrival.
 * Shows all Phase 1 data in an actionable format for port agents.
 */

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Ship, Anchor, Clock, FileText, DollarSign, AlertCircle,
  CheckCircle, TrendingUp, MapPin, Users, Calendar, Download,
  Send, RefreshCw, Upload, Bell
} from 'lucide-react';
import DocumentUploadModal from '../components/DocumentUploadModal';
import ResponsiveExport from '../components/ResponsiveExport';
import { MasterAlertsList } from '../components/alerts/MasterAlertsList';
import { SendManualAlert } from '../components/alerts/SendManualAlert';
import { ArrivalTimeline } from '../components/timeline/ArrivalTimeline';

// GraphQL Queries
const ARRIVAL_INTELLIGENCE = gql`
  query ArrivalIntelligence($arrivalId: String!) {
    arrivalIntelligence(arrivalId: $arrivalId) {
      vessel {
        id
        name
        imo
        type
      }
      port {
        id
        name
        unlocode
      }
      distance
      eta {
        bestCase
        mostLikely
        worstCase
        confidence
        hoursRemaining
      }
      documents {
        required
        missing
        submitted
        approved
        complianceScore
        criticalMissing
        nextDeadline
        urgentDocuments {
          documentType
          documentName
          status
          deadline
          hoursRemaining
          priority
        }
      }
      daForecast {
        min
        max
        mostLikely
        confidence
        breakdown
      }
      congestion {
        status
        waitTimeMin
        waitTimeMax
        vesselsInPort
        vesselsAtAnchorage
      }
      portReadiness {
        score
        berthAvailability
        pilotAvailability
      }
      recommendations
      status
      lastUpdated
    }
  }
`;

const UPDATE_INTELLIGENCE = gql`
  mutation UpdateArrivalIntelligence($arrivalId: String!) {
    updateArrivalIntelligence(arrivalId: $arrivalId)
  }
`;

// Helper Components
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}> = ({ icon, label, value, subtext, color = 'blue' }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtext && <div className="text-xs text-gray-500 mt-0.5">{subtext}</div>}
      </div>
    </div>
  </div>
);

const getCongestionColor = (status: string): string => {
  switch (status) {
    case 'GREEN': return 'green';
    case 'YELLOW': return 'yellow';
    case 'RED': return 'red';
    default: return 'gray';
  }
};

const getDocumentStatusColor = (status: string): string => {
  switch (status) {
    case 'APPROVED': return 'text-green-600 bg-green-100';
    case 'SUBMITTED': return 'text-blue-600 bg-blue-100';
    case 'IN_PROGRESS': return 'text-yellow-600 bg-yellow-100';
    case 'OVERDUE': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getDocumentStatusIcon = (status: string) => {
  switch (status) {
    case 'APPROVED': return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'SUBMITTED': return <Clock className="w-5 h-5 text-blue-600" />;
    case 'OVERDUE': return <AlertCircle className="w-5 h-5 text-red-600" />;
    default: return <FileText className="w-5 h-5 text-gray-600" />;
  }
};

// Main Component
export default function ArrivalIntelligenceDetail() {
  const { arrivalId } = useParams<{ arrivalId: string }>();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showSendAlert, setShowSendAlert] = useState(false);
  const [uploadModal, setUploadModal] = useState<{
    isOpen: boolean;
    documentType: string;
    documentName: string;
  }>({
    isOpen: false,
    documentType: '',
    documentName: ''
  });

  const { data, loading, refetch } = useQuery(ARRIVAL_INTELLIGENCE, {
    variables: { arrivalId },
    pollInterval: 30000 // Auto-refresh every 30 seconds
  });

  const [updateIntelligence, { loading: updating }] = useMutation(UPDATE_INTELLIGENCE, {
    onCompleted: () => {
      refetch();
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading intelligence...</p>
        </div>
      </div>
    );
  }

  if (!data?.arrivalIntelligence) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Ship className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Arrival not found</h2>
          <p className="mt-2 text-gray-500">The requested arrival intelligence could not be loaded.</p>
        </div>
      </div>
    );
  }

  const intelligence = data.arrivalIntelligence;
  const { vessel, port, distance, eta, documents, daForecast, congestion, portReadiness, recommendations, status } = intelligence;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Ship className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{vessel.name}</h1>
                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                  {vessel.imo && <span>IMO: {vessel.imo}</span>}
                  {vessel.type && <span>• {vessel.type}</span>}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-gray-500" />
                  <span className="text-lg text-gray-700">{port.name} ({port.unlocode})</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateIntelligence({ variables: { arrivalId } })}
                disabled={updating}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
                {updating ? 'Updating...' : 'Refresh'}
              </button>
              <ResponsiveExport arrival={intelligence} variant="buttons" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            label="ETA (Most Likely)"
            value={new Date(eta.mostLikely).toLocaleDateString()}
            subtext={`${Math.round(eta.hoursRemaining)}h remaining • ${eta.confidence} confidence`}
            color="blue"
          />
          <StatCard
            icon={<MapPin className="w-6 h-6" />}
            label="Distance to Port"
            value={`${Math.round(distance)} NM`}
            subtext={`Status: ${status}`}
            color="purple"
          />
          <StatCard
            icon={<FileText className="w-6 h-6" />}
            label="Compliance Score"
            value={`${documents.complianceScore}%`}
            subtext={`${documents.missing} documents missing`}
            color={documents.complianceScore >= 80 ? 'green' : documents.complianceScore >= 50 ? 'yellow' : 'red'}
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label="DA Estimate"
            value={`$${(daForecast.mostLikely / 1000).toFixed(1)}K`}
            subtext={`${Math.round(daForecast.confidence * 100)}% confidence`}
            color="green"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Documents & DA */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Document Requirements</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  documents.complianceScore >= 80 ? 'bg-green-100 text-green-800' :
                  documents.complianceScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {documents.approved}/{documents.required} Approved
                </span>
              </div>

              {documents.urgentDocuments.length > 0 ? (
                <div className="space-y-3">
                  {documents.urgentDocuments.map((doc: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      {getDocumentStatusIcon(doc.status)}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{doc.documentName}</div>
                        <div className="text-sm text-gray-500">
                          Due: {new Date(doc.deadline).toLocaleString()} ({Math.round(doc.hoursRemaining)}h remaining)
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                        {doc.status !== 'APPROVED' && doc.status !== 'SUBMITTED' && (
                          <button
                            onClick={() => setUploadModal({
                              isOpen: true,
                              documentType: doc.documentType,
                              documentName: doc.documentName
                            })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Upload className="w-3 h-3" />
                            Upload
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                  <p className="text-lg font-medium text-gray-900">All documents complete!</p>
                  <p className="text-sm text-gray-500 mt-1">Ready for arrival</p>
                </div>
              )}
            </div>

            {/* DA Forecast Breakdown */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">DA Cost Forecast</h2>
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showBreakdown ? 'Hide' : 'Show'} Breakdown
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ${(daForecast.mostLikely / 1).toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    (${(daForecast.min / 1).toLocaleString()} - ${(daForecast.max / 1).toLocaleString()})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">
                    {Math.round(daForecast.confidence * 100)}% confidence
                  </span>
                </div>

                {showBreakdown && daForecast.breakdown && (
                  <div className="mt-4 space-y-2 pt-4 border-t border-gray-200">
                    {Object.entries(daForecast.breakdown).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-medium text-gray-900">
                          ${value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Congestion & Recommendations */}
          <div className="space-y-6">
            {/* Port Congestion */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Port Congestion</h2>

              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-${getCongestionColor(congestion.status)}-100`}>
                    <span className="text-4xl">
                      {congestion.status === 'GREEN' ? '🟢' : congestion.status === 'YELLOW' ? '🟡' : '🔴'}
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-gray-900">{congestion.status}</div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Vessels in Port</span>
                    <span className="font-semibold text-gray-900">{congestion.vesselsInPort}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">At Anchorage</span>
                    <span className="font-semibold text-gray-900">{congestion.vesselsAtAnchorage}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Expected Wait</span>
                    <span className="font-semibold text-gray-900">
                      {congestion.waitTimeMin}-{congestion.waitTimeMax}h
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">Port Readiness</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Berth Availability</span>
                      <span className={`font-medium ${
                        portReadiness.berthAvailability === 'AVAILABLE' ? 'text-green-600' :
                        portReadiness.berthAvailability === 'MODERATE' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {portReadiness.berthAvailability}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Pilot Availability</span>
                      <span className={`font-medium ${
                        portReadiness.pilotAvailability === 'AVAILABLE' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {portReadiness.pilotAvailability}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {recommendations && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Recommendations</h3>
                    {typeof recommendations === 'string' ? (
                      <p className="text-sm text-blue-800">{recommendations}</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(recommendations).map(([key, value]: [string, any]) => (
                          <p key={key} className="text-sm text-blue-800">{value}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Master Alerts Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Master Communications
              </h2>
              <button
                onClick={() => setShowSendAlert(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Alert to Master
              </button>
            </div>

            <MasterAlertsList arrivalId={arrivalId!} />
          </div>
        </div>

        {/* Timeline Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Event Timeline
            </h2>

            <ArrivalTimeline arrivalId={arrivalId!} />
          </div>
        </div>
      </div>

      {/* Send Manual Alert Modal */}
      {showSendAlert && (
        <SendManualAlert
          arrivalId={arrivalId!}
          vesselName={vessel.name}
          portName={port.name}
          eta={eta.mostLikely}
          onClose={() => setShowSendAlert(false)}
          onSent={() => {
            // Will trigger refresh via MasterAlertsList polling
          }}
        />
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        arrivalId={arrivalId!}
        documentType={uploadModal.documentType}
        documentName={uploadModal.documentName}
        isOpen={uploadModal.isOpen}
        onClose={() => setUploadModal({ isOpen: false, documentType: '', documentName: '' })}
        onSuccess={() => {
          refetch(); // Refresh intelligence data after upload
        }}
      />
    </div>
  );
}
