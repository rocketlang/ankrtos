import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '../lib/stores/ui';
import { useAuthStore } from '../lib/stores/auth';
import { navSections, findSectionForPath, loadSidebarState, saveSidebarState } from '../lib/sidebar-nav';
import { WorkflowBreadcrumb } from './WorkflowBreadcrumb';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SwayamBot } from './SwayamBot';
import { GlobalSearchBar } from './rag/GlobalSearchBar';
import { FeedbackWidget } from './beta/FeedbackWidget';

const NOTIF_QUERY = gql`
  query UnreadCount { unreadNotificationCount }
`;

const NOTIF_LIST = gql`
  query Notifications { notifications { id type title message entityType entityId read createdAt } }
`;

const MARK_READ = gql`
  mutation MarkAllRead { markAllNotificationsRead }
`;

// Color map: section color → tailwind classes
const sectionColors: Record<string, { text: string; bg: string; activeBg: string }> = {
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    activeBg: 'bg-blue-600/20' },
  cyan:    { text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    activeBg: 'bg-cyan-600/20' },
  green:   { text: 'text-green-400',   bg: 'bg-green-500/10',   activeBg: 'bg-green-600/20' },
  orange:  { text: 'text-orange-400',  bg: 'bg-orange-500/10',  activeBg: 'bg-orange-600/20' },
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   activeBg: 'bg-amber-600/20' },
  purple:  { text: 'text-purple-400',  bg: 'bg-purple-500/10',  activeBg: 'bg-purple-600/20' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', activeBg: 'bg-emerald-600/20' },
  rose:    { text: 'text-rose-400',    bg: 'bg-rose-500/10',    activeBg: 'bg-rose-600/20' },
  pink:    { text: 'text-pink-400',    bg: 'bg-pink-500/10',    activeBg: 'bg-pink-600/20' },
  indigo:  { text: 'text-indigo-400',  bg: 'bg-indigo-500/10',  activeBg: 'bg-indigo-600/20' },
  violet:  { text: 'text-violet-400',  bg: 'bg-violet-500/10',  activeBg: 'bg-violet-600/20' },
  slate:   { text: 'text-slate-400',   bg: 'bg-slate-500/10',   activeBg: 'bg-slate-600/20' },
};

export function Layout() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);

  // Sidebar section open/closed state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const stored = loadSidebarState();
    // Auto-open the section containing the current path
    const activeSection = findSectionForPath(pathname);
    if (activeSection && !stored[activeSection]) {
      stored[activeSection] = true;
    }
    return stored;
  });

  // Auto-open active section when navigating
  useEffect(() => {
    const activeSection = findSectionForPath(pathname);
    if (activeSection && !openSections[activeSection]) {
      setOpenSections((prev) => {
        const next = { ...prev, [activeSection]: true };
        saveSidebarState(next);
        return next;
      });
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      saveSidebarState(next);
      return next;
    });
  }, []);

  const { data: countData } = useQuery(NOTIF_QUERY, { pollInterval: 30000 });
  const { data: notifData, refetch } = useQuery(NOTIF_LIST, { skip: !showNotifs });
  const [markAllRead] = useMutation(MARK_READ);

  const unread = countData?.unreadNotificationCount ?? 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    refetch();
  };

  const notifTypeIcons: Record<string, string> = {
    charter_status: '\u{1F4CB}',
    voyage_departure: '\u{1F6F3}',
    voyage_arrival: '\u2693',
    da_submitted: '\u{1F4B0}',
    laytime_alert: '\u23F1',
    system: '\u{1F514}',
  };

  return (
    <div className="flex h-screen bg-maritime-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-52' : 'w-14'
        } bg-maritime-800 border-r border-maritime-700 transition-all duration-200 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-3 border-b border-maritime-700">
          <span className="text-xl">{'\u2693'}</span>
          {sidebarOpen && (
            <span className="font-bold text-white text-base ml-2">Mari8x</span>
          )}
        </div>

        {/* Navigation — Collapsible Sections */}
        <nav className="flex-1 py-1 overflow-y-auto">
          {navSections.map((section) => {
            const isOpen = openSections[section.id] ?? false;
            const colors = sectionColors[section.color] ?? sectionColors.blue;
            const sectionHasActive = section.items.some(
              (item) => item.href === pathname || (item.href !== '/' && pathname.startsWith(item.href))
            );

            return (
              <div key={section.id}>
                {/* Section header */}
                <button
                  onClick={() => sidebarOpen ? toggleSection(section.id) : undefined}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                    sectionHasActive
                      ? `${colors.activeBg} ${colors.text}`
                      : 'text-maritime-500 hover:text-maritime-300 hover:bg-maritime-700/30'
                  }`}
                  title={!sidebarOpen ? section.label : undefined}
                >
                  <span className="text-sm flex-shrink-0 w-5 text-center">{section.icon}</span>
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left font-medium truncate">{section.label}</span>
                      <span className="text-maritime-600 text-[10px] mr-1">{section.items.length}</span>
                      <span className={`text-[10px] transition-transform ${isOpen ? 'rotate-90' : ''}`}>
                        {'\u25B6'}
                      </span>
                    </>
                  )}
                </button>

                {/* Section items — collapsed/expanded */}
                {sidebarOpen && isOpen && (
                  <div className="pb-1">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        end={item.href === '/'}
                        className={({ isActive }) =>
                          `flex items-center pl-10 pr-3 py-1.5 text-xs transition-colors ${
                            isActive
                              ? 'text-white bg-maritime-700 border-r-2 border-blue-500'
                              : 'text-maritime-400 hover:text-white hover:bg-maritime-700/50'
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}

                {/* Collapsed sidebar: show icon only, click navigates to first item */}
                {!sidebarOpen && (
                  <div className="hidden" />
                )}
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="h-10 flex items-center justify-center border-t border-maritime-700 text-maritime-500 hover:text-white text-xs"
        >
          {sidebarOpen ? '\u00AB' : '\u00BB'}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-maritime-800 border-b border-maritime-700 flex items-center justify-between px-6">
          <h2 className="text-white text-sm font-medium">Maritime Operations</h2>
          <div className="flex items-center gap-4">
            {/* Global Search Bar */}
            <GlobalSearchBar />
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) refetch(); }}
                className="text-maritime-400 hover:text-white relative"
              >
                <span className="text-lg">{'\u{1F514}'}</span>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifs && (
                <div className="absolute right-0 top-8 w-80 bg-maritime-800 border border-maritime-700 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-maritime-700">
                    <h3 className="text-white text-sm font-medium">Notifications</h3>
                    {unread > 0 && (
                      <button onClick={handleMarkAllRead} className="text-blue-400 text-xs hover:text-blue-300">
                        Mark all read
                      </button>
                    )}
                  </div>
                  {(!notifData?.notifications || notifData.notifications.length === 0) && (
                    <p className="text-maritime-500 text-xs text-center py-6">No notifications</p>
                  )}
                  {notifData?.notifications?.map((n: Record<string, unknown>) => (
                    <div key={n.id as string}
                      className={`px-4 py-3 border-b border-maritime-700/50 hover:bg-maritime-700/30 ${!(n.read as boolean) ? 'bg-maritime-700/20' : ''}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-sm mt-0.5">{notifTypeIcons[(n.type as string)] ?? '\u{1F514}'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium">{n.title as string}</p>
                          <p className="text-maritime-400 text-xs mt-0.5 truncate">{n.message as string}</p>
                          <p className="text-maritime-600 text-[10px] mt-1">
                            {new Date(n.createdAt as string).toLocaleString()}
                          </p>
                        </div>
                        {!(n.read as boolean) && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher />

            <span className="text-xs text-maritime-400">
              {user?.name} ({user?.role})
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-maritime-500 hover:text-white"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Workflow Breadcrumb — shown only on flow pages */}
        <WorkflowBreadcrumb />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Swayam AI Assistant */}
      <SwayamBot />

      {/* Beta Feedback Widget */}
      <FeedbackWidget />

      {/* Click-away for notification dropdown */}
      {showNotifs && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
      )}
    </div>
  );
}
