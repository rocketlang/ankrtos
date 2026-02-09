/**
 * Email Folder Service
 * Manages email folders (system, custom, bucket-based)
 *
 * @package @ankr/email-organizer
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface FolderCreateInput {
  userId: string;
  organizationId: string;
  name: string;
  type: 'system' | 'custom' | 'bucket';
  icon?: string;
  color?: string;
  parentId?: string;
  rules?: any;
  position?: number;
}

export interface FolderUpdateInput {
  name?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  rules?: any;
  position?: number;
}

export class EmailFolderService {
  /**
   * Initialize system folders for a user
   */
  async initializeSystemFolders(userId: string, organizationId: string): Promise<void> {
    const systemFolders = [
      { name: 'Inbox', icon: 'Inbox', color: '#3B82F6', position: 1 },
      { name: 'Sent', icon: 'Send', color: '#10B981', position: 2 },
      { name: 'Starred', icon: 'Star', color: '#F59E0B', position: 3 },
      { name: 'Drafts', icon: 'FileEdit', color: '#6B7280', position: 4 },
      { name: 'Archived', icon: 'Archive', color: '#6B7280', position: 5 },
      { name: 'Trash', icon: 'Trash', color: '#EF4444', position: 6 },
    ];

    // Create system folders if they don't exist
    for (const folder of systemFolders) {
      await prisma.emailFolder.upsert({
        where: {
          userId_name: {
            userId,
            name: folder.name,
          },
        },
        update: {},
        create: {
          userId,
          organizationId,
          type: 'system',
          ...folder,
        },
      });
    }
  }

  /**
   * Create bucket-based folders from email intelligence buckets
   */
  async createBucketFolders(
    userId: string,
    organizationId: string,
    buckets: Array<{ id: string; name: string; displayName: string; icon?: string; color?: string }>
  ): Promise<void> {
    for (const bucket of buckets) {
      await prisma.emailFolder.upsert({
        where: {
          userId_name: {
            userId,
            name: bucket.displayName,
          },
        },
        update: {
          icon: bucket.icon || 'Folder',
          color: bucket.color || '#8B5CF6',
        },
        create: {
          userId,
          organizationId,
          name: bucket.displayName,
          type: 'bucket',
          icon: bucket.icon || 'Folder',
          color: bucket.color || '#8B5CF6',
          position: 100, // Bucket folders appear after system folders
        },
      });
    }
  }

  /**
   * Create a custom folder
   */
  async createFolder(input: FolderCreateInput) {
    // Validate parent exists if specified
    if (input.parentId) {
      const parent = await prisma.emailFolder.findUnique({
        where: { id: input.parentId },
      });
      if (!parent) {
        throw new Error('Parent folder not found');
      }
      if (parent.userId !== input.userId) {
        throw new Error("Cannot create folder under another user's folder");
      }
    }

    return await prisma.emailFolder.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId,
        name: input.name,
        type: input.type,
        icon: input.icon || 'Folder',
        color: input.color || '#6B7280',
        parentId: input.parentId,
        rules: input.rules,
        position: input.position || 0,
      },
    });
  }

  /**
   * Update a folder
   */
  async updateFolder(folderId: string, userId: string, updates: FolderUpdateInput) {
    // Verify ownership
    const folder = await prisma.emailFolder.findUnique({
      where: { id: folderId },
    });
    if (!folder) {
      throw new Error('Folder not found');
    }
    if (folder.userId !== userId) {
      throw new Error('Not authorized to update this folder');
    }
    if (folder.type === 'system') {
      throw new Error('Cannot modify system folders');
    }

    // Validate parent if changing
    if (updates.parentId && updates.parentId !== folder.parentId) {
      const parent = await prisma.emailFolder.findUnique({
        where: { id: updates.parentId },
      });
      if (!parent) {
        throw new Error('Parent folder not found');
      }
      if (parent.userId !== userId) {
        throw new Error("Cannot move folder under another user's folder");
      }

      // Prevent circular references
      if (await this.wouldCreateCircularReference(folderId, updates.parentId)) {
        throw new Error('Cannot create circular folder references');
      }
    }

    return await prisma.emailFolder.update({
      where: { id: folderId },
      data: updates,
    });
  }

  /**
   * Delete a folder
   */
  async deleteFolder(folderId: string, userId: string) {
    const folder = await prisma.emailFolder.findUnique({
      where: { id: folderId },
      include: { children: true },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }
    if (folder.userId !== userId) {
      throw new Error('Not authorized to delete this folder');
    }
    if (folder.type === 'system') {
      throw new Error('Cannot delete system folders');
    }
    if (folder.children.length > 0) {
      throw new Error('Cannot delete folder with subfolders. Delete subfolders first.');
    }

    // TODO: Move emails in this folder to Inbox or Archive
    // For now, just delete the folder
    return await prisma.emailFolder.delete({
      where: { id: folderId },
    });
  }

  /**
   * Get all folders for a user
   */
  async getUserFolders(userId: string) {
    return await prisma.emailFolder.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { position: 'asc' }, { name: 'asc' }],
      include: {
        children: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Get folder tree (hierarchical structure)
   */
  async getFolderTree(userId: string) {
    const folders = await this.getUserFolders(userId);

    // Build tree structure
    const folderMap = new Map(folders.map((f) => [f.id, { ...f, children: [] as any[] }]));
    const roots: any[] = [];

    for (const folder of folders) {
      const folderNode = folderMap.get(folder.id)!;
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folderNode);
        } else {
          roots.push(folderNode);
        }
      } else {
        roots.push(folderNode);
      }
    }

    return roots;
  }

  /**
   * Update folder counters
   */
  async updateFolderCounters(folderId: string) {
    // TODO: Implement actual email counting
    // For now, just placeholder
    const unreadCount = 0; // await prisma.emailMessage.count({ where: { folderId, isRead: false } });
    const totalCount = 0; // await prisma.emailMessage.count({ where: { folderId } });

    return await prisma.emailFolder.update({
      where: { id: folderId },
      data: { unreadCount, totalCount },
    });
  }

  /**
   * Move email to folder
   */
  async moveEmailToFolder(emailId: string, folderId: string, userId: string) {
    // Verify folder ownership
    const folder = await prisma.emailFolder.findUnique({
      where: { id: folderId },
    });
    if (!folder) {
      throw new Error('Folder not found');
    }
    if (folder.userId !== userId) {
      throw new Error('Not authorized to access this folder');
    }

    // TODO: Update EmailMessage when we add folder relation
    // await prisma.emailMessage.update({
    //   where: { id: emailId },
    //   data: { folderId }
    // });

    // Update counters
    await this.updateFolderCounters(folderId);

    return { success: true };
  }

  /**
   * Check if moving would create circular reference
   */
  private async wouldCreateCircularReference(
    folderId: string,
    newParentId: string
  ): Promise<boolean> {
    let currentId: string | null = newParentId;

    while (currentId) {
      if (currentId === folderId) {
        return true;
      }

      const folder = await prisma.emailFolder.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      currentId = folder?.parentId || null;
    }

    return false;
  }
}

export const emailFolderService = new EmailFolderService();
