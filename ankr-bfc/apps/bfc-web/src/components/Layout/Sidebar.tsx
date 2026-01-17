/**
 * Sidebar Navigation
 */

import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  Building2,
} from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Credit', href: '/credit', icon: CreditCard },
  { name: 'Campaigns', href: '/campaigns', icon: Building2 },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Compliance', href: '/compliance', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();

  return (
    <div
      className={clsx(
        'flex flex-col bg-slate-900 text-white transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
        {sidebarOpen && (
          <span className="text-xl font-bold text-blue-400">ankrBFC</span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft
            className={clsx(
              'w-5 h-5 transition-transform',
              !sidebarOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-slate-700 p-4">
        {sidebarOpen ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-sm">
                <p className="font-medium">{user?.name || 'User'}</p>
                <p className="text-slate-400 text-xs">{user?.role || 'Staff'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 flex justify-center"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
