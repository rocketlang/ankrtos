/**
 * Breadcrumbs - Navigation trail
 * Shows: Dashboard > Fleet > Vehicle Details
 */
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAppStore } from '../stores/useAppStore';
import { useEffect } from 'react';

// Route config for auto-generating breadcrumbs
const ROUTE_CONFIG: Record<string, { label: string; icon: string; parent?: string }> = {
  '/': { label: 'Dashboard', icon: '🏠' },
  '/fleet': { label: 'Live Fleet', icon: '🚛', parent: '/' },
  '/vehicles': { label: 'Vehicles', icon: '🚛', parent: '/' },
  '/drivers': { label: 'Drivers', icon: '👤', parent: '/' },
  '/orders': { label: 'Orders', icon: '📦', parent: '/' },
  '/trips': { label: 'Trips', icon: '🛣️', parent: '/' },
  '/customers': { label: 'Customers', icon: '🏢', parent: '/' },
  '/invoices': { label: 'Invoices', icon: '💰', parent: '/' },
  '/route-calculator': { label: 'Route Calculator', icon: '🧮', parent: '/' },
  '/rfq': { label: 'RFQ Processor', icon: '📋', parent: '/' },
  '/rate-card': { label: 'Rate Card', icon: '₹', parent: '/' },
  '/widgets': { label: 'Widgets', icon: '🧩', parent: '/' },
  '/omega': { label: 'Ωmega Shell', icon: 'Ω', parent: '/' },
  '/pulse': { label: 'Pulse Monitor', icon: '🫀', parent: '/' },
};

function buildBreadcrumbs(pathname: string): { label: string; path: string; icon: string }[] {
  const crumbs: { label: string; path: string; icon: string }[] = [];
  
  // Always start with home
  crumbs.push({ label: 'Dashboard', path: '/', icon: '🏠' });
  
  if (pathname === '/') return crumbs;
  
  // Find current route
  const config = ROUTE_CONFIG[pathname];
  if (config) {
    crumbs.push({ label: config.label, path: pathname, icon: config.icon });
  } else {
    // Handle dynamic routes like /vehicles/123
    const parts = pathname.split('/').filter(Boolean);
    let currentPath = '';
    
    for (const part of parts) {
      currentPath += '/' + part;
      const cfg = ROUTE_CONFIG[currentPath];
      if (cfg) {
        crumbs.push({ label: cfg.label, path: currentPath, icon: cfg.icon });
      } else {
        // Dynamic segment (ID)
        crumbs.push({ label: `#${part.slice(0, 8)}...`, path: currentPath, icon: '📄' });
      }
    }
  }
  
  return crumbs;
}

export function Breadcrumbs() {
  const { theme } = useTheme();
  const location = useLocation();
  const { setBreadcrumbs, addRecentPage } = useAppStore();
  
  const crumbs = buildBreadcrumbs(location.pathname);
  
  // Update store and recent pages
  useEffect(() => {
    setBreadcrumbs(crumbs);
    const current = crumbs[crumbs.length - 1];
    if (current && current.path !== '/') {
      addRecentPage(current.path, current.label);
    }
  }, [location.pathname]);
  
  const textColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const activeColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const hoverColor = theme === 'dark' ? 'hover:text-orange-400' : 'hover:text-orange-600';

  return (
    <nav className="flex items-center space-x-2 text-sm mb-4">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        
        return (
          <div key={crumb.path} className="flex items-center">
            {index > 0 && (
              <span className={`mx-2 ${textColor}`}>›</span>
            )}
            
            {isLast ? (
              <span className={`${activeColor} font-medium flex items-center gap-1`}>
                <span>{crumb.icon}</span>
                {crumb.label}
              </span>
            ) : (
              <Link 
                to={crumb.path}
                className={`${textColor} ${hoverColor} transition flex items-center gap-1`}
              >
                <span>{crumb.icon}</span>
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Mini breadcrumb for mobile
export function BreadcrumbsMini() {
  const { theme } = useTheme();
  const location = useLocation();
  const crumbs = buildBreadcrumbs(location.pathname);
  const current = crumbs[crumbs.length - 1];
  
  const textColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const activeColor = theme === 'dark' ? 'text-white' : 'text-gray-900';

  if (crumbs.length <= 1) return null;

  return (
    <div className="flex items-center text-sm mb-2">
      <Link to="/" className={`${textColor} hover:text-orange-400`}>🏠</Link>
      <span className={`mx-1 ${textColor}`}>›</span>
      <span className={activeColor}>{current.icon} {current.label}</span>
    </div>
  );
}

// Recent pages dropdown
export function RecentPages() {
  const { theme } = useTheme();
  const { recentPages } = useAppStore();
  
  const bg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';
  
  if (recentPages.length === 0) return null;

  return (
    <div className={`${bg} rounded-lg p-3`}>
      <div className="text-xs text-gray-500 mb-2">Recent Pages</div>
      <div className="space-y-1">
        {recentPages.map((page) => (
          <Link
            key={page.path}
            to={page.path}
            className={`block ${textColor} hover:text-orange-400 text-sm transition`}
          >
            {page.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Breadcrumbs;
