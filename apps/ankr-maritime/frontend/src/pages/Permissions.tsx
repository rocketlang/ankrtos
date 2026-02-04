import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;

const ROLE_PERMS = gql`
  query RolePermissions($role: String) {
    rolePermissions(role: $role) {
      id role module canCreate canRead canUpdate canDelete canApprove canExport
    }
  }
`;

const SET_PERM = gql`
  mutation SetPerm($role: String!, $module: String!, $canCreate: Boolean, $canRead: Boolean, $canUpdate: Boolean, $canDelete: Boolean, $canApprove: Boolean, $canExport: Boolean) {
    setRolePermission(role: $role, module: $module, canCreate: $canCreate, canRead: $canRead, canUpdate: $canUpdate, canDelete: $canDelete, canApprove: $canApprove, canExport: $canExport) { id }
  }
`;

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'operator', label: 'Operator' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'chartering_manager', label: 'Chartering Manager' },
  { value: 'broker', label: 'Broker' },
  { value: 'port_agent', label: 'Port Agent' },
  { value: 'da_clerk', label: 'DA Clerk' },
  { value: 'finance_manager', label: 'Finance Manager' },
  { value: 'compliance_officer', label: 'Compliance Officer' },
  { value: 'vessel_master', label: 'Vessel Master' },
  { value: 'surveyor', label: 'Surveyor' },
];

const modules = [
  'vessels', 'voyages', 'chartering', 'da_desk', 'laytime', 'claims',
  'bunkers', 'crew', 'compliance', 'contacts', 'invoices', 'reports',
  'analytics', 'settings',
];

const permKeys = ['canCreate', 'canRead', 'canUpdate', 'canDelete', 'canApprove', 'canExport'] as const;
const permLabels: Record<string, string> = {
  canCreate: 'Create',
  canRead: 'Read',
  canUpdate: 'Update',
  canDelete: 'Delete',
  canApprove: 'Approve',
  canExport: 'Export',
};

type PermRow = {
  id: string;
  role: string;
  module: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
};

export function Permissions() {
  const [selectedRole, setSelectedRole] = useState('admin');

  const { data, loading, error, refetch } = useQuery(ROLE_PERMS, {
    variables: { role: selectedRole },
  });

  const [setPerm] = useMutation(SET_PERM);

  const perms: PermRow[] = data?.rolePermissions ?? [];

  const getPermForModule = (mod: string): PermRow | undefined =>
    perms.find((p) => p.module === mod);

  const handleToggle = async (mod: string, permKey: typeof permKeys[number], currentValue: boolean) => {
    await setPerm({
      variables: {
        role: selectedRole,
        module: mod,
        [permKey]: !currentValue,
      },
    });
    refetch();
  };

  const handleQuickSet = async (mode: 'all' | 'readonly') => {
    const promises = modules.map((mod) =>
      setPerm({
        variables: {
          role: selectedRole,
          module: mod,
          canCreate: mode === 'all',
          canRead: true,
          canUpdate: mode === 'all',
          canDelete: mode === 'all',
          canApprove: mode === 'all',
          canExport: mode === 'all',
        },
      }),
    );
    await Promise.all(promises);
    refetch();
  };

  const currentRoleLabel = roles.find((r) => r.value === selectedRole)?.label ?? selectedRole;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Permissions</h1>
          <p className="text-maritime-400 text-sm mt-1">Role-based access control matrix</p>
        </div>
      </div>

      {/* Role Selector + Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-maritime-400 text-sm font-medium">Role:</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-56"
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleQuickSet('all')}
            className="bg-green-600/20 hover:bg-green-600/30 text-green-400 text-sm font-medium px-4 py-2 rounded-md transition-colors border border-green-600/30">
            All Access
          </button>
          <button onClick={() => handleQuickSet('readonly')}
            className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm font-medium px-4 py-2 rounded-md transition-colors">
            Read Only
          </button>
        </div>
      </div>

      {loading && <p className="text-maritime-400">Loading permissions...</p>}
      {error && <p className="text-red-400">Error: {error.message}</p>}

      {/* Permission Matrix */}
      {!loading && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-maritime-700">
            <h3 className="text-white font-medium text-sm">
              Permission matrix for <span className="text-blue-400">{currentRoleLabel}</span>
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-maritime-400 text-xs border-b border-maritime-700 bg-maritime-900/50">
                <th className="text-left px-4 py-3 font-medium w-48">Module</th>
                {permKeys.map((pk) => (
                  <th key={pk} className="text-center px-3 py-3 font-medium">{permLabels[pk]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => {
                const row = getPermForModule(mod);
                return (
                  <tr key={mod} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                    <td className="px-4 py-3 text-white font-medium capitalize">{mod.replace(/_/g, ' ')}</td>
                    {permKeys.map((pk) => {
                      const granted = row ? row[pk] : false;
                      return (
                        <td key={pk} className="text-center px-3 py-3">
                          <button
                            onClick={() => handleToggle(mod, pk, granted)}
                            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                              granted
                                ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30'
                                : 'bg-maritime-900/50 text-maritime-600 hover:bg-maritime-700 border border-maritime-700'
                            }`}
                            title={`${granted ? 'Revoke' : 'Grant'} ${permLabels[pk]} on ${mod}`}
                          >
                            {granted ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {perms.length === 0 && (
            <p className="text-maritime-500 text-center py-8">
              No permissions configured for this role. Use quick-set buttons above or toggle individually.
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-maritime-400">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-green-600/20 border border-green-600/30 flex items-center justify-center">
            <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          Granted
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-maritime-900/50 border border-maritime-700 flex items-center justify-center">
            <svg className="w-3 h-3 text-maritime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
          Denied
        </div>
        <span className="text-maritime-500">Click any cell to toggle the permission. Changes are saved immediately.</span>
      </div>
    </div>
  );
}
