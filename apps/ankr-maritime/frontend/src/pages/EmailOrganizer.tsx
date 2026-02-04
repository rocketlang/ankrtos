/**
 * Email Organizer Page
 * Complete email management interface with folders, threads, and detail view
 */

import React, { useState, useEffect } from 'react';
import { Mail, Search, Settings, Menu, X } from 'lucide-react';
import { FolderTree } from '../components/email-organizer/FolderTree';
import { ThreadList } from '../components/email-organizer/ThreadList';
import { EmailDetail } from '../components/email-organizer/EmailDetail';

interface Folder {
  id: string;
  name: string;
  type: string;
  unreadCount: number;
}

interface Thread {
  id: string;
  subject: string;
  participants: string[];
  messageCount: number;
  unreadCount: number;
  category?: string | null;
  urgency?: string | null;
  urgencyScore?: number | null;
  actionable?: string | null;
  labels: string[];
  isStarred: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmailOrganizer() {
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showDetail, setShowDetail] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        // On mobile, only show one panel at a time
        if (selectedThread) {
          setShowSidebar(false);
          setShowDetail(true);
        } else {
          setShowSidebar(false);
          setShowDetail(false);
        }
      } else {
        // On desktop, show all panels
        setShowSidebar(true);
        setShowDetail(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedThread]);

  const handleThreadSelect = (thread: Thread) => {
    setSelectedThread(thread);
    if (isMobile) {
      setShowDetail(true);
      setShowSidebar(false);
    }
  };

  const handleBackToList = () => {
    if (isMobile) {
      setSelectedThread(null);
      setShowDetail(false);
      setShowSidebar(false);
    }
  };

  const handleBackToFolders = () => {
    if (isMobile) {
      setShowSidebar(true);
      setShowDetail(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          {isMobile && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100 rounded transition-colors lg:hidden"
            >
              {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {/* Logo/Title */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Email Organizer</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Settings */}
        <button className="p-2 hover:bg-gray-100 rounded transition-colors">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Folders */}
        {(showSidebar || !isMobile) && (
          <aside
            className={`
              ${isMobile ? 'absolute inset-0 z-20 bg-white' : 'relative'}
              w-full lg:w-64 border-r border-gray-200 bg-white overflow-y-auto
            `}
          >
            {/* Mobile Header */}
            {isMobile && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Folder Tree */}
            <div className="p-4">
              <FolderTree
                onFolderSelect={(folder) => {
                  setSelectedFolder(folder as Folder);
                  if (isMobile) {
                    setShowSidebar(false);
                  }
                }}
                selectedFolderId={selectedFolder?.id}
              />
            </div>
          </aside>
        )}

        {/* Thread List */}
        {(!showDetail || !isMobile) && (
          <main
            className={`
              flex-1 border-r border-gray-200 bg-white overflow-hidden
              ${isMobile ? 'w-full' : 'lg:flex-[0.4]'}
            `}
          >
            {/* Mobile Back Button */}
            {isMobile && (
              <div className="flex items-center gap-2 p-4 border-b border-gray-200">
                <button
                  onClick={handleBackToFolders}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedFolder?.name || 'All Emails'}
                </h2>
              </div>
            )}

            <ThreadList
              folderId={selectedFolder?.id}
              onThreadSelect={handleThreadSelect}
              selectedThreadId={selectedThread?.id}
            />
          </main>
        )}

        {/* Email Detail */}
        {(showDetail || !isMobile) && (
          <section
            className={`
              flex-1 bg-white overflow-hidden
              ${isMobile ? 'absolute inset-0 z-20' : 'lg:flex-[0.6]'}
            `}
          >
            {/* Mobile Back Button */}
            {isMobile && selectedThread && (
              <div className="flex items-center gap-2 p-4 border-b border-gray-200 bg-white">
                <button
                  onClick={handleBackToList}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {selectedThread.subject}
                </h2>
              </div>
            )}

            <EmailDetail
              thread={selectedThread}
              onReply={() => console.log('Reply')}
              onReplyAll={() => console.log('Reply All')}
              onForward={() => console.log('Forward')}
              onStar={() => console.log('Star')}
              onArchive={() => {
                console.log('Archive');
                if (isMobile) {
                  handleBackToList();
                }
              }}
              onDelete={() => {
                console.log('Delete');
                if (isMobile) {
                  handleBackToList();
                }
              }}
            />
          </section>
        )}
      </div>
    </div>
  );
}
