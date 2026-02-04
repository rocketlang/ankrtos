/**
 * Port Documents Page
 * Vessel-Port Agent Document Workflow
 *
 * Purpose: Automate port call document preparation and submission
 * Time Savings: 4-6 hours → 15-20 minutes per port call
 */

import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { FileText, Send, CheckCircle, AlertCircle, Clock, Download } from 'lucide-react';

const PORT_DOCUMENTS_QUERY = gql`
  query PortDocuments($vesselId: String, $voyageId: String, $status: String) {
    vesselDocuments(vesselId: $vesselId, voyageId: $voyageId, status: $status) {
      id
      documentNumber
      status
      fillProgress
      submittedToAgent
      submittedToAgentAt
      template {
        code
        name
        category
        imoForm
        mandatory
      }
      vessel {
        id
        name
        imo
      }
      voyage {
        id
        voyageNumber
        arrivalPort {
          name
        }
        eta
      }
      createdAt
      updatedAt
    }

    documentTemplates(category: "pre_arrival", imoForm: true) {
      code
      name
      category
      mandatory
      description
    }

    voyages {
      id
      voyageNumber
      status
      vessel {
        id
        name
      }
      arrivalPort {
        name
      }
      eta
    }
  }
`;

const CREATE_DOCUMENT_MUTATION = gql`
  mutation CreateDocument($input: CreateDocumentInput!) {
    createVesselDocument(input: $input) {
      id
      documentNumber
      fillProgress
      status
    }
  }
`;

const SUBMIT_TO_AGENT_MUTATION = gql`
  mutation SubmitToAgent($input: SubmitToAgentInput!) {
    submitToAgent(input: $input) {
      id
      status
      submittedAt
    }
  }
`;

const VALIDATE_DOCUMENT_QUERY = gql`
  query ValidateDocument($documentId: String!) {
    validateDocument(documentId: $documentId)
  }
`;

interface PortDocumentsProps {}

export default function PortDocuments({}: PortDocumentsProps) {
  const [selectedVoyage, setSelectedVoyage] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [showTemplates, setShowTemplates] = useState(false);

  const { data, loading, refetch } = useQuery(PORT_DOCUMENTS_QUERY, {
    variables: {
      voyageId: selectedVoyage,
    },
    pollInterval: 30000, // Refresh every 30 seconds
  });

  const [createDocument, { loading: creating }] = useMutation(CREATE_DOCUMENT_MUTATION, {
    onCompleted: () => {
      refetch();
      setShowTemplates(false);
    },
  });

  const [submitToAgent, { loading: submitting }] = useMutation(SUBMIT_TO_AGENT_MUTATION, {
    onCompleted: () => {
      refetch();
      setSelectedDocuments(new Set());
    },
  });

  const handleCreateDocument = async (templateCode: string) => {
    if (!selectedVoyage) {
      alert('Please select a voyage first');
      return;
    }

    const voyage = data?.voyages?.find((v: any) => v.id === selectedVoyage);
    if (!voyage) return;

    await createDocument({
      variables: {
        input: {
          templateCode,
          vesselId: voyage.vessel.id,
          voyageId: selectedVoyage,
          autoFill: true,
        },
      },
    });
  };

  const handleSubmitToAgent = async () => {
    if (selectedDocuments.size === 0) {
      alert('Please select documents to submit');
      return;
    }

    const voyage = data?.voyages?.find((v: any) => v.id === selectedVoyage);
    if (!voyage) return;

    const confirmed = confirm(
      `Submit ${selectedDocuments.size} documents to port agent?`
    );
    if (!confirmed) return;

    await submitToAgent({
      variables: {
        input: {
          documentIds: Array.from(selectedDocuments),
          vesselId: voyage.vessel.id,
          voyageId: selectedVoyage,
          agentName: 'Port Agent Name', // TODO: Get from port agent directory
          agentEmail: 'agent@example.com',
        },
      },
    });
  };

  const toggleDocumentSelection = (docId: string) => {
    const newSet = new Set(selectedDocuments);
    if (newSet.has(docId)) {
      newSet.delete(docId);
    } else {
      newSet.add(docId);
    }
    setSelectedDocuments(newSet);
  };

  const documents = data?.vesselDocuments || [];
  const templates = data?.documentTemplates || [];
  const voyages = data?.voyages?.filter((v: any) => v.status !== 'completed') || [];

  // Group documents by category
  const preArrivalDocs = documents.filter(
    (d: any) => d.template.category === 'pre_arrival'
  );
  const arrivalDocs = documents.filter((d: any) => d.template.category === 'arrival');
  const departureDocs = documents.filter((d: any) => d.template.category === 'departure');

  // Calculate statistics
  const totalDocs = documents.length;
  const completedDocs = documents.filter(
    (d: any) => d.fillProgress >= 0.95 || d.status === 'submitted'
  ).length;
  const submittedDocs = documents.filter((d: any) => d.submittedToAgent).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Port Documents</h1>
        <p className="text-gray-400">
          Auto-fill and submit port call documents • Save 4-6 hours per port call
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Total Documents</h3>
          </div>
          <p className="text-3xl font-bold">{totalDocs}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold">Completed</h3>
          </div>
          <p className="text-3xl font-bold text-green-400">{completedDocs}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Send className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold">Submitted</h3>
          </div>
          <p className="text-3xl font-bold text-purple-400">{submittedDocs}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold">Time Saved</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-400">
            {Math.round((completedDocs * 4.5 * 60) / 60)}h
          </p>
          <p className="text-xs text-gray-400">vs manual filling</p>
        </div>
      </div>

      {/* Voyage Selection */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Select Active Voyage</h3>
        <select
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          value={selectedVoyage || ''}
          onChange={(e) => setSelectedVoyage(e.target.value || null)}
        >
          <option value="">-- Select Voyage --</option>
          {voyages.map((voyage: any) => (
            <option key={voyage.id} value={voyage.id}>
              {voyage.voyageNumber} - {voyage.vessel.name} → {voyage.arrivalPort.name} (
              ETA: {new Date(voyage.eta).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {selectedVoyage && (
        <>
          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Create Document
            </button>

            {selectedDocuments.size > 0 && (
              <button
                onClick={handleSubmitToAgent}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit to Agent ({selectedDocuments.size})
              </button>
            )}
          </div>

          {/* Document Templates (Create New) */}
          {showTemplates && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3">Pre-Arrival Documents (IMO FAL Forms)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((template: any) => (
                  <button
                    key={template.code}
                    onClick={() => handleCreateDocument(template.code)}
                    disabled={creating}
                    className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-sm">{template.code}</span>
                      {template.mandatory && (
                        <span className="text-xs bg-red-600 px-2 py-0.5 rounded">
                          Mandatory
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{template.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Document Lists */}
          {preArrivalDocs.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-lg">Pre-Arrival Documents</h3>
              <div className="space-y-2">
                {preArrivalDocs.map((doc: any) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    selected={selectedDocuments.has(doc.id)}
                    onToggle={() => toggleDocumentSelection(doc.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {arrivalDocs.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-lg">Arrival Documents</h3>
              <div className="space-y-2">
                {arrivalDocs.map((doc: any) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    selected={selectedDocuments.has(doc.id)}
                    onToggle={() => toggleDocumentSelection(doc.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {documents.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No documents created yet</p>
              <p className="text-sm">
                Click "Create Document" to start auto-filling port call documents
              </p>
            </div>
          )}
        </>
      )}

      {!selectedVoyage && (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">Select a voyage to view documents</p>
          <p className="text-sm">Choose an active voyage from the dropdown above</p>
        </div>
      )}
    </div>
  );
}

// Document Card Component
function DocumentCard({
  document,
  selected,
  onToggle,
}: {
  document: any;
  selected: boolean;
  onToggle: () => void;
}) {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-600',
    review: 'bg-blue-600',
    submitted: 'bg-green-600',
    approved: 'bg-green-700',
    rejected: 'bg-red-600',
  };

  const statusColor = statusColors[document.status] || 'bg-gray-600';

  return (
    <div
      className={`bg-gray-800 rounded-lg p-4 border-2 transition-colors ${
        selected ? 'border-blue-500' : 'border-gray-700'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          disabled={document.submittedToAgent}
          className="mt-1 w-5 h-5"
        />

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold">{document.template.name}</h4>
              <p className="text-sm text-gray-400">
                {document.documentNumber} • {document.template.code}
              </p>
            </div>
            <span className={`px-3 py-1 rounded text-xs font-semibold ${statusColor}`}>
              {document.status}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Auto-fill progress</span>
              <span className="font-semibold">
                {Math.round(document.fillProgress * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${document.fillProgress * 100}%` }}
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Created: {new Date(document.createdAt).toLocaleDateString()}</span>
            {document.submittedToAgent && (
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-3 h-3" />
                Submitted{' '}
                {new Date(document.submittedToAgentAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
            title="View/Edit Document"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
