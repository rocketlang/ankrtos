/**
 * Folder Tree View Component
 * Hierarchical folder browser with expand/collapse
 */

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useTranslation } from 'react-i18next';

const GET_FOLDER_TREE = gql`
  query GetFolderTree($parentId: String) {
    getFolderTree(parentId: $parentId) {
      id
      name
      parentId
      folderPath
      folderType
      documentCount
      createdAt
    }
  }
`;

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  folderPath: string;
  folderType: string;
  documentCount: number;
  createdAt: string;
}

interface FolderTreeViewProps {
  onFolderSelect?: (folder: Folder) => void;
  selectedFolderId?: string;
}

export function FolderTreeView({ onFolderSelect, selectedFolderId }: FolderTreeViewProps) {
  const { t } = useTranslation();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const { data, loading } = useQuery(GET_FOLDER_TREE, {
    variables: { parentId: null },
  });

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getFolderIcon = (folderType: string) => {
    switch (folderType) {
      case 'vessel':
        return '🚢';
      case 'voyage':
        return '⛵';
      case 'company':
        return '🏢';
      case 'type':
        return '📁';
      default:
        return '📂';
    }
  };

  const renderFolder = (folder: Folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id} style={{ marginLeft: `${level * 16}px` }}>
        <div
          onClick={() => {
            toggleFolder(folder.id);
            onFolderSelect?.(folder);
          }}
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded hover:bg-maritime-700 transition-colors ${
            isSelected ? 'bg-maritime-600 text-white' : 'text-maritime-300'
          }`}
        >
          <span className="text-base">
            {isExpanded ? '📂' : '📁'} {getFolderIcon(folder.folderType)}
          </span>
          <span className="flex-1 text-sm font-medium">{folder.name}</span>
          <span className="text-xs text-maritime-500">{folder.documentCount}</span>
        </div>

        {/* Child folders would be loaded here if expanded */}
        {isExpanded && (
          <div className="ml-4 border-l border-maritime-700">
            {/* TODO: Load child folders */}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-maritime-500">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-maritime-500 border-t-transparent rounded-full" />
        <p className="mt-2 text-sm">{t('dms.loadingFolders', 'Loading folders...')}</p>
      </div>
    );
  }

  const folders = data?.getFolderTree || [];

  if (folders.length === 0) {
    return (
      <div className="p-4 text-center text-maritime-500">
        <p className="text-3xl mb-2">📁</p>
        <p className="text-sm">{t('dms.noFolders', 'No folders yet')}</p>
      </div>
    );
  }

  return (
    <div className="bg-maritime-800 rounded-lg border border-maritime-700">
      <div className="p-3 border-b border-maritime-700">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          📂 {t('dms.folders', 'Folders')}
        </h3>
      </div>

      <div className="p-2 max-h-96 overflow-y-auto">
        {folders.map((folder: Folder) => renderFolder(folder))}
      </div>

      <div className="p-3 border-t border-maritime-700">
        <button className="w-full text-xs text-maritime-400 hover:text-white transition-colors">
          + {t('dms.createFolder', 'Create Folder')}
        </button>
      </div>
    </div>
  );
}
