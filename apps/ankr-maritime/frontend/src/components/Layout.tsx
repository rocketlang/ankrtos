import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useUIStore } from '../lib/stores/ui';
import { useAuthStore } from '../lib/stores/auth';

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Vessels', href: '/vessels' },
  { label: 'Ports', href: '/ports' },
  { label: 'Port Map', href: '/port-map' },
  { label: 'Companies', href: '/companies' },
  { label: 'Chartering', href: '/chartering' },
  { label: 'Voyages', href: '/voyages' },
  { label: 'Features', href: '/features' },
];

export function Layout() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-maritime-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-56' : 'w-14'
        } bg-maritime-800 border-r border-maritime-700 transition-all duration-200 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-3 border-b border-maritime-700">
          <span className="text-xl">&#x2693;</span>
          {sidebarOpen && (
            <span className="font-bold text-white text-base ml-2">Mrk8X</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'text-white bg-maritime-700 border-r-2 border-blue-500'
                    : 'text-maritime-400 hover:text-white hover:bg-maritime-700/50'
                }`
              }
            >
              {sidebarOpen ? item.label : item.label[0]}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="h-10 flex items-center justify-center border-t border-maritime-700 text-maritime-500 hover:text-white text-xs"
        >
          {sidebarOpen ? '\u00AB Collapse' : '\u00BB'}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-maritime-800 border-b border-maritime-700 flex items-center justify-between px-6">
          <h2 className="text-white text-sm font-medium">Maritime Operations</h2>
          <div className="flex items-center gap-4">
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

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
