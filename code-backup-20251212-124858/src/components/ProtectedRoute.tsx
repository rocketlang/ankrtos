/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ProtectedRoute - Role & Permission based route protection
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermission?: string;
  requiredAnyPermission?: string[];
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles,
  requiredPermission,
  requiredAnyPermission 
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user, hasRole, hasPermission, hasAnyPermission } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirement
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasRole(...requiredRoles)) {
      return <AccessDenied reason="role" required={requiredRoles.join(', ')} />;
    }
  }

  // Check specific permission requirement
  if (requiredPermission) {
    if (!hasPermission(requiredPermission)) {
      return <AccessDenied reason="permission" required={requiredPermission} />;
    }
  }

  // Check any permission requirement
  if (requiredAnyPermission && requiredAnyPermission.length > 0) {
    if (!hasAnyPermission(...requiredAnyPermission)) {
      return <AccessDenied reason="permission" required={requiredAnyPermission.join(' or ')} />;
    }
  }

  return <>{children}</>;
}

// Access Denied Component
function AccessDenied({ reason, required }: { reason: 'role' | 'permission'; required: string }) {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md text-center border border-red-500/30">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🚫</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 mb-4">
          You don't have {reason === 'role' ? 'the required role' : 'permission'} to access this page.
        </p>
        <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-400">Required: <span className="text-red-400">{required}</span></p>
          <p className="text-sm text-gray-400">Your role: <span className="text-blue-400">{user?.role}</span></p>
        </div>
        <a 
          href="/dashboard" 
          className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
