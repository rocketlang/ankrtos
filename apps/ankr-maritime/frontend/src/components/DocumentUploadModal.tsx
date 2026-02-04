/**
 * Document Upload Modal
 *
 * Allows agents to upload documents for vessel arrivals.
 * Supports drag-and-drop, file selection, and document type selection.
 */

import React, { useState, useRef } from 'react';
import { useMutation, gql } from '@apollo/client';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';

// GraphQL Mutation
const SUBMIT_DOCUMENT = gql`
  mutation SubmitDocument(
    $arrivalId: String!
    $documentType: String!
    $fileUrl: String!
    $submittedBy: String!
    $notes: String
  ) {
    submitDocument(
      arrivalId: $arrivalId
      documentType: $documentType
      fileUrl: $fileUrl
      submittedBy: $submittedBy
      notes: $notes
    )
  }
`;

interface DocumentUploadModalProps {
  arrivalId: string;
  documentType: string;
  documentName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DocumentUploadModal({
  arrivalId,
  documentType,
  documentName,
  isOpen,
  onClose,
  onSuccess
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitDocument] = useMutation(SUBMIT_DOCUMENT, {
    onCompleted: () => {
      setUploadStatus('success');
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    },
    onError: (error) => {
      setUploadStatus('error');
      setErrorMessage(error.message);
    }
  });

  const handleClose = () => {
    setFile(null);
    setNotes('');
    setUploadStatus('idle');
    setErrorMessage('');
    onClose();
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setErrorMessage('Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.');
      setUploadStatus('error');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setErrorMessage('File too large. Maximum size is 10MB.');
      setUploadStatus('error');
      return;
    }

    setFile(selectedFile);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setErrorMessage('Please select a file to upload.');
      setUploadStatus('error');
      return;
    }

    setUploadStatus('uploading');

    // Simulate file upload (in production, this would upload to S3/MinIO/etc.)
    // For now, we'll generate a mock file URL
    const mockFileUrl = `https://storage.mari8x.com/documents/${arrivalId}/${documentType}/${file.name}`;

    try {
      await submitDocument({
        variables: {
          arrivalId,
          documentType,
          fileUrl: mockFileUrl,
          submittedBy: 'current-user-id', // TODO: Get from auth context
          notes: notes || undefined
        }
      });
    } catch (error) {
      // Error handled by mutation onError
      console.error('Upload error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
              <p className="mt-1 text-sm text-gray-500">{documentName}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Upload Status */}
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Document uploaded successfully!</p>
                  <p className="text-xs text-green-700 mt-0.5">Waiting for approval...</p>
                </div>
              </div>
            )}

            {uploadStatus === 'error' && errorMessage && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Upload failed</p>
                  <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* File Upload Area */}
            {uploadStatus !== 'success' && (
              <>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : file
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileInputChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />

                  {file ? (
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-12 h-12 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Change file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-12 h-12 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Drop file here or click to browse
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, DOC, DOCX, JPG, PNG (max 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Add any additional notes or comments..."
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {uploadStatus !== 'success' && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                disabled={uploadStatus === 'uploading'}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!file || uploadStatus === 'uploading'}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
