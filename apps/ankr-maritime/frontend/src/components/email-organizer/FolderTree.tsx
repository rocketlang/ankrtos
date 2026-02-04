/**
 * Folder Tree Component
 * Hierarchical email folder navigation (Gmail/Outlook style)
 */

import React, { useState } from 'react';
import {
  Inbox,
  Send,
  Star,
  FileEdit,
  Archive,
  Trash,
  Folder,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import { gql, useQuery, useMutation } from '@apollo/client';

const GET_FOLDERS = gql`
  query GetEmailFolders {
    emailFolderTree {
      id
      name
      type
      icon
      color
      unreadCount
      totalCount
      position
      parentId
      children {
        id
        name
        type
        icon
        color
        unreadCount
        totalCount
        position
        parentId
      }
    }
  }
`;

const INITIALIZE_FOLDERS = gql`
  mutation InitializeEmailFolders {
    initializeEmailFolders
  }
`;

const CREATE_FOLDER = gql`
  mutation CreateEmailFolder($input: CreateFolderInput!) {
    createEmailFolder(input: $input) {
      id
      name
      type
      icon
      color
    }
  }
`;

const UPDATE_FOLDER = gql`
  mutation UpdateEmailFolder($id: String!, $input: UpdateFolderInput!) {
    updateEmailFolder(id: $id, input: $input) {
      id
      name
      icon
      color
    }
  }
`;

const DELETE_FOLDER = gql`
  mutation DeleteEmailFolder($id: String!) {
    deleteEmailFolder(id: $id)
  }
`;

interface Folder {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
  color?: string | null;
  unreadCount: number;
  totalCount: number;
  position: number;
  parentId?: string | null;
  children?: Folder[];
}

interface FolderTreeProps {
  onFolderSelect?: (folder: Folder) => void;
  selectedFolderId?: string;
}

const ICON_MAP: Record<string, any> = {
  Inbox,
  Send,
  Star,
  FileEdit,
  Archive,
  Trash,
  Folder,
};

export const FolderTree: React.FC<FolderTreeProps> = ({ onFolderSelect, selectedFolderId }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ folderId: string; x: number; y: number } | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_FOLDERS);
  const [initializeFolders] = useMutation(INITIALIZE_FOLDERS, {
    onCompleted: () => refetch(),
  });
  const [createFolder] = useMutation(CREATE_FOLDER, {
    onCompleted: () => {
      refetch();
      setShowNewFolderInput(null);
      setNewFolderName('');
    },
  });
  const [updateFolder] = useMutation(UPDATE_FOLDER, {
    onCompleted: () => {
      refetch();
      setEditingFolder(null);
    },
  });
  const [deleteFolder] = useMutation(DELETE_FOLDER, {
    onCompleted: () => refetch(),
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

  const handleCreateFolder = async (parentId?: string) => {
    if (!newFolderName.trim()) return;

    await createFolder({
      variables: {
        input: {
          name: newFolderName,
          type: 'custom',
          icon: 'Folder',
          color: '#6B7280',
          parentId,
        },
      },
    });
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder?')) return;
    await deleteFolder({ variables: { id: folderId } });
    setContextMenu(null);
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    if (!newName.trim()) return;
    await updateFolder({
      variables: {
        id: folderId,
        input: { name: newName },
      },
    });
  };

  const renderFolder = (folder: Folder, depth: number = 0) => {
    const Icon = folder.icon ? ICON_MAP[folder.icon] || Folder : Folder;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;
    const isEditing = editingFolder === folder.id;
    const showingNewFolder = showNewFolderInput === folder.id;

    return (
      <div key={folder.id}>
        {/* Folder Row */}
        <div
          className={`
            flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
            hover:bg-gray-100 group
            ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}
          `}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => {
            onFolderSelect?.(folder);
            if (hasChildren) toggleFolder(folder.id);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (folder.type !== 'system') {
              setContextMenu({ folderId: folder.id, x: e.clientX, y: e.clientY });
            }
          }}
        >
          {/* Expand/Collapse */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Icon */}
          <Icon
            className="w-4 h-4 flex-shrink-0"
            style={{ color: folder.color || undefined }}
          />

          {/* Name */}
          {isEditing ? (
            <input
              type="text"
              defaultValue={folder.name}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
              autoFocus
              onBlur={(e) => handleRenameFolder(folder.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameFolder(folder.id, e.currentTarget.value);
                } else if (e.key === 'Escape') {
                  setEditingFolder(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 text-sm truncate">{folder.name}</span>
          )}

          {/* Unread Badge */}
          {folder.unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {folder.unreadCount}
            </span>
          )}

          {/* Context Menu Button */}
          {folder.type !== 'system' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setContextMenu({
                  folderId: folder.id,
                  x: e.currentTarget.getBoundingClientRect().left,
                  y: e.currentTarget.getBoundingClientRect().bottom,
                });
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}

          {/* Add Subfolder Button */}
          {folder.type === 'custom' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNewFolderInput(folder.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
              title="Add subfolder"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* New Subfolder Input */}
        {showingNewFolder && (
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}
          >
            <Folder className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
              autoFocus
              onBlur={() => setShowNewFolderInput(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder(folder.id);
                } else if (e.key === 'Escape') {
                  setShowNewFolderInput(null);
                  setNewFolderName('');
                }
              }}
            />
          </div>
        )}

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {folder.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">Loading folders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-sm text-red-600 mb-2">Failed to load folders</div>
        <button
          onClick={() => initializeFolders()}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Initialize Folders
        </button>
      </div>
    );
  }

  const folders = data?.emailFolderTree || [];

  return (
    <div className="relative">
      {/* Folders */}
      <div className="space-y-1">
        {folders.map((folder: Folder) => renderFolder(folder))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                setEditingFolder(contextMenu.folderId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit className="w-4 h-4" />
              Rename
            </button>
            <button
              onClick={() => handleDeleteFolder(contextMenu.folderId)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}

      {/* New Folder Button */}
      <div className="mt-4 px-3">
        <button
          onClick={() => setShowNewFolderInput('root')}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Folder
        </button>

        {showNewFolderInput === 'root' && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
              autoFocus
              onBlur={() => setShowNewFolderInput(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                } else if (e.key === 'Escape') {
                  setShowNewFolderInput(null);
                  setNewFolderName('');
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
