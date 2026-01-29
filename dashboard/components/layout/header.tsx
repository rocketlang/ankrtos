'use client';

import { useFacility } from '@/hooks/use-facility';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { LiveDot } from '@/components/shared/live-dot';

export function Header() {
  const { facilityId, facilities, setFacilityId } = useFacility();
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <select
          value={facilityId}
          onChange={(e) => setFacilityId(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {facilities.length === 0 && <option value="">No facilities</option>}
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <LiveDot />
          <span>Live</span>
        </div>
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
            <Badge variant="secondary">{user.roles[0]}</Badge>
          </div>
        ) : (
          <Badge variant="outline">No Auth</Badge>
        )}
      </div>
    </header>
  );
}
