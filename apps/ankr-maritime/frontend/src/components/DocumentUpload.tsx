/**
 * Document Upload Component
 * Drag-and-drop file upload with progress tracking and auto-indexing
 */

import React, { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useTranslation } from 'react-i18next';

const CREATE_DOCUMENT = gql`
  mutation CreateDocument(
    $title: String!
    $category: String!
    $subcategory: String
    $fileName: String!
    $fileSize: Int
    $mimeType: String
    $entityType: String
    $entityId: String
    $voyageId: String
    $vesselId: String
    $tags: [String!]
    $notes: String
  ) {
    createDocument(
      title: $title
      category: $category
      subcategory: $subcategory
      fileName: $fileName
      fileSize: $fileSize
      mimeType: $mimeType
      entityType: $entityType
      entityId: $entityId
      voyageId: $voyageId
      vesselId: $vesselId
      tags: $tags
      notes: $notes
    ) {
      id
      title
      fileName
      createdAt
    }
  }
`;

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  documentId?: string;
}

interface DocumentUploadProps {
  category?: string;
  subcategory?: string;
  entityType?: string;
  entityId?: string;
  voyageId?: string;
  vesselId?: string;
  onUploadComplete?: (documentId: string) => void;
  onError?: (error: Error) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  category = 'general',
  subcategory,
  entityType,
  entityId,
  voyageId,
  vesselId,
  onUploadComplete,
  onError,
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [createDocument] = useMutation(CREATE_DOCUMENT);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    },
    []
  );

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  }, []);

  const handleFiles = useCallback(
    (newFiles: File[]) => {
      // Validate file types
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/jpg',
      ];

      const validFiles = newFiles.filter((file) => {
        if (!validTypes.includes(file.type)) {
          console.warn(`File type not supported: ${file.type}`);
          return false;
        }
        if (file.size > 50 * 1024 * 1024) {
          // 50MB limit
          console.warn(`File too large: ${file.name}`);
          return false;
        }
        return true;
      });

      const uploadFiles: UploadFile[] = validFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substring(7),
        progress: 0,
        status: 'pending',
      }));

      setFiles((prev) => [...prev, ...uploadFiles]);

      // Start uploading
      uploadFiles.forEach((uploadFile) => uploadDocument(uploadFile));
    },
    [category, subcategory, entityType, entityId, voyageId, vesselId]
  );

  const uploadDocument = async (uploadFile: UploadFile) => {
    try {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 30 } : f))
      );

      // In production, you would upload to MinIO here
      // For now, just simulate upload and create document record

      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate upload

      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 60 } : f))
      );

      // Create document record
      const result = await createDocument({
        variables: {
          title: uploadFile.file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          category,
          subcategory,
          fileName: uploadFile.file.name,
          fileSize: uploadFile.file.size,
          mimeType: uploadFile.file.type,
          entityType,
          entityId,
          voyageId,
          vesselId,
          tags: [],
        },
      });

      const documentId = result.data?.createDocument?.id;

      // Update status to processing (embedding generation)
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: 'processing', progress: 80, documentId }
            : f
        )
      );

      // Auto-trigger embedding generation
      // In production, this would be handled by the backend automatically
      // For now, just mark as completed after a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mark as completed
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'completed', progress: 100 } : f
        )
      );

      if (onUploadComplete && documentId) {
        onUploadComplete(documentId);
      }
    } catch (error: any) {
      console.error('Upload error:', error);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: 'error', error: error.message }
            : f
        )
      );

      if (onError) {
        onError(error);
      }
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'uploading':
        return '📤';
      case 'processing':
        return '🔄';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
    }
  };

  const getStatusText = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing & Indexing...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
    }
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-3">
          <div className="text-5xl">📁</div>
          <div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Supported: PDF, DOCX, TXT, Images (max 50MB)
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {files.length} file{files.length > 1 ? 's' : ''}
          </h3>

          {files.map((uploadFile) => (
            <div
              key={uploadFile.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-2xl">{getStatusIcon(uploadFile.status)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(uploadFile.file.size / 1024).toFixed(1)} KB •{' '}
                      {getStatusText(uploadFile.status)}
                    </p>
                  </div>
                </div>

                {uploadFile.status === 'completed' && (
                  <button
                    onClick={() => removeFile(uploadFile.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {uploadFile.status !== 'completed' && uploadFile.status !== 'error' && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadFile.progress}%` }}
                  />
                </div>
              )}

              {/* Error Message */}
              {uploadFile.status === 'error' && uploadFile.error && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {uploadFile.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Stats */}
      {files.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
          <span>
            {files.filter((f) => f.status === 'completed').length} of {files.length} completed
          </span>
          {files.some((f) => f.status === 'processing') && (
            <span className="text-blue-600 dark:text-blue-400">
              Processing & indexing for search...
            </span>
          )}
        </div>
      )}
    </div>
  );
};
