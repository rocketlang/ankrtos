import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const PARSE_DOCUMENT = gql`
  mutation ParseDocument($documentUrl: String!, $documentType: String) {
    parseDocument(documentUrl: $documentUrl, documentType: $documentType)
  }
`;

const CLASSIFY_DOCUMENT = gql`
  mutation ClassifyDocumentType($documentId: String!) {
    classifyDocumentType(documentId: $documentId)
  }
`;

interface ParseResult {
  extractedData: any;
  entities: any;
  documentType: string;
  confidence: number;
}

export const DocumentParser: React.FC = () => {
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [parseDoc, { loading }] = useMutation(PARSE_DOCUMENT, {
    onCompleted: (data) => {
      setResult(data.parseDocument);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // In a real implementation, you would upload to S3/MinIO first
      // For now, we'll use a placeholder URL
      setDocumentUrl(`/uploads/${selectedFile.name}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    parseDoc({
      variables: {
        documentUrl,
        documentType: documentType || undefined,
      },
    });
  };

  const documentTypes = [
    'charter_party',
    'bill_of_lading',
    'invoice',
    'statement_of_facts',
    'bunker_delivery_note',
    'certificate',
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">AI Document Parser</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-sm text-gray-600">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX, JPG, PNG up to 10MB
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type (Optional)
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Auto-detect</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Parsing Document...' : 'Parse Document'}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-semibold mb-4">Document Analysis</h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Detected Type
                </label>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {result.documentType.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Confidence
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round(result.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h5 className="text-sm font-semibold mb-3">Extracted Data</h5>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-gray-700">
                  {JSON.stringify(result.extractedData, null, 2)}
                </pre>
              </div>
            </div>

            {result.entities && Object.keys(result.entities).length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h5 className="text-sm font-semibold mb-3">Recognized Entities</h5>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(result.entities).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded p-3">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                        {key}
                      </div>
                      <div className="text-sm text-gray-900">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Supported Documents</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Charter Parties (GENCON, NYPE, SHELLVOY, etc.)</li>
          <li>• Bills of Lading (Original, Sea Waybill)</li>
          <li>• Invoices (DA, Bunker, Freight)</li>
          <li>• Statements of Facts</li>
          <li>• Bunker Delivery Notes</li>
          <li>• Certificates (Class, Survey, etc.)</li>
        </ul>
      </div>
    </div>
  );
};
