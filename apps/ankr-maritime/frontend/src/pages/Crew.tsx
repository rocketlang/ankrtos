import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;

const CREW_QUERY = gql`
  query Crew($status: String, $vesselId: String) {
    crewMembers(status: $status, vesselId: $vesselId) {
      id firstName lastName rank nationality status phone email
      assignments { id vesselId rank signOnDate status vessel { name } }
      certificates { id name expiryDate status }
    }
    crewSummary { totalCrew onBoard available onLeave expiringCerts }
    vessels { id name }
  }
`;

const CREATE_CREW = gql`
  mutation CreateCrew($firstName: String!, $lastName: String!, $rank: String!, $nationality: String!, $phone: String, $email: String) {
    createCrewMember(firstName: $firstName, lastName: $lastName, rank: $rank, nationality: $nationality, phone: $phone, email: $email) { id }
  }
`;

const ASSIGN_CREW = gql`
  mutation AssignCrew($crewMemberId: String!, $vesselId: String!, $rank: String!, $signOnDate: DateTime!) {
    assignCrewToVessel(crewMemberId: $crewMemberId, vesselId: $vesselId, rank: $rank, signOnDate: $signOnDate) { id }
  }
`;

const SIGN_OFF = gql`
  mutation SignOff($assignmentId: String!, $signOffDate: DateTime!) {
    signOffCrew(assignmentId: $assignmentId, signOffDate: $signOffDate) { id }
  }
`;

const rankLabels: Record<string, string> = {
  master: 'Master', chief_officer: 'Chief Officer', second_officer: '2nd Officer', third_officer: '3rd Officer',
  chief_engineer: 'Chief Engineer', second_engineer: '2nd Engineer', third_engineer: '3rd Engineer',
  bosun: 'Bosun', ab_seaman: 'AB Seaman', os_seaman: 'OS Seaman', oiler: 'Oiler', cook: 'Cook',
};

const statusBadge: Record<string, string> = {
  available: 'bg-green-900/50 text-green-400',
  on_board: 'bg-blue-900/50 text-blue-400',
  on_leave: 'bg-yellow-900/50 text-yellow-400',
  medical: 'bg-red-900/50 text-red-400',
  terminated: 'bg-maritime-700 text-maritime-400',
};

export function Crew() {
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVessel, setFilterVessel] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const { data, loading, refetch } = useQuery(CREW_QUERY, {
    variables: { status: filterStatus || undefined, vesselId: filterVessel || undefined },
  });
  const [createCrew] = useMutation(CREATE_CREW);
  const [assignCrew] = useMutation(ASSIGN_CREW);
  const [signOff] = useMutation(SIGN_OFF);

  const [form, setForm] = useState({ firstName: '', lastName: '', rank: 'ab_seaman', nationality: 'IN', phone: '', email: '' });
  const [assignForm, setAssignForm] = useState({ vesselId: '', rank: 'ab_seaman' });

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName) return;
    await createCrew({ variables: form });
    setShowCreate(false);
    setForm({ firstName: '', lastName: '', rank: 'ab_seaman', nationality: 'IN', phone: '', email: '' });
    refetch();
  };

  const handleAssign = async () => {
    if (!showAssign || !assignForm.vesselId) return;
    await assignCrew({ variables: { crewMemberId: showAssign, vesselId: assignForm.vesselId, rank: assignForm.rank, signOnDate: new Date().toISOString() } });
    setShowAssign(null);
    refetch();
  };

  const handleSignOff = async (assignmentId: string) => {
    await signOff({ variables: { assignmentId, signOffDate: new Date().toISOString() } });
    refetch();
  };

  const crew = data?.crewMembers ?? [];
  const summary = data?.crewSummary;
  const vessels = data?.vessels ?? [];

  const certExpiring = (certs: Array<Record<string, unknown>>) => {
    const thirtyDays = Date.now() + 30 * 86400000;
    return certs.filter((c) => c.expiryDate && new Date(c.expiryDate as string).getTime() < thirtyDays).length;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Crew Management</h1>
          <p className="text-maritime-400 text-sm mt-1">Seafarer records, assignments, and certificate tracking</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/csv/crew" className="bg-maritime-700 hover:bg-maritime-600 text-maritime-300 text-sm px-3 py-2 rounded-lg">CSV</a>
          <button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + Add Crew
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Crew', value: summary.totalCrew, color: 'text-white', border: 'border-maritime-500' },
            { label: 'On Board', value: summary.onBoard, color: 'text-blue-400', border: 'border-blue-500' },
            { label: 'Available', value: summary.available, color: 'text-green-400', border: 'border-green-500' },
            { label: 'On Leave', value: summary.onLeave, color: 'text-yellow-400', border: 'border-yellow-500' },
            { label: 'Certs Expiring', value: summary.expiringCerts, color: summary.expiringCerts > 0 ? 'text-red-400' : 'text-maritime-400', border: summary.expiringCerts > 0 ? 'border-red-500' : 'border-maritime-500' },
          ].map((s) => (
            <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
              <p className="text-maritime-500 text-xs">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Status</option>
          {Object.entries(statusBadge).map(([k]) => <option key={k} value={k}>{k.replace('_', ' ')}</option>)}
        </select>
        <select value={filterVessel} onChange={(e) => setFilterVessel(e.target.value)}
          className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-1.5">
          <option value="">All Vessels</option>
          {vessels.map((v: Record<string, unknown>) => (
            <option key={v.id as string} value={v.id as string}>{v.name as string}</option>
          ))}
        </select>
      </div>

      <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-maritime-400 text-xs border-b border-maritime-700">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Rank</th>
              <th className="text-left px-4 py-3">Nationality</th>
              <th className="text-left px-4 py-3">Current Vessel</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-center px-4 py-3">Certs</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-8 text-maritime-500">Loading...</td></tr>}
            {!loading && crew.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-maritime-500">No crew members</td></tr>}
            {crew.map((m: Record<string, unknown>) => {
              const assignments = (m.assignments ?? []) as Array<Record<string, unknown>>;
              const certs = (m.certificates ?? []) as Array<Record<string, unknown>>;
              const active = assignments.find((a) => a.status === 'active');
              const vessel = active?.vessel as Record<string, unknown> | undefined;
              const expCount = certExpiring(certs);
              return (
                <tr key={m.id as string} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                  <td className="px-4 py-3 text-white text-xs font-medium">{m.firstName as string} {m.lastName as string}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs">{rankLabels[m.rank as string] ?? m.rank}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs">{m.nationality as string}</td>
                  <td className="px-4 py-3 text-maritime-300 text-xs">{vessel ? vessel.name as string : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${statusBadge[m.status as string] ?? ''}`}>
                      {(m.status as string).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-mono ${expCount > 0 ? 'text-red-400' : 'text-maritime-400'}`}>
                      {certs.length}{expCount > 0 ? ` (${expCount} exp)` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {m.status === 'available' && (
                        <button onClick={() => { setShowAssign(m.id as string); setAssignForm({ vesselId: '', rank: m.rank as string }); }}
                          className="text-blue-400 hover:text-blue-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded">
                          Assign
                        </button>
                      )}
                      {active && (
                        <button onClick={() => handleSignOff(active.id as string)}
                          className="text-orange-400 hover:text-orange-300 text-[10px] bg-maritime-700/50 px-1.5 py-0.5 rounded">
                          Sign Off
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-white font-bold text-lg mb-4">Add Crew Member</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-maritime-400 text-xs">First Name</label>
                  <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1" />
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Last Name</label>
                  <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-maritime-400 text-xs">Rank</label>
                  <select value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1">
                    {Object.entries(rankLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Nationality</label>
                  <input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-maritime-400 text-xs">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1" />
                </div>
                <div>
                  <label className="text-maritime-400 text-xs">Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="text-maritime-400 text-sm hover:text-white px-4 py-2">Cancel</button>
              <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg">Add Crew</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-white font-bold text-lg mb-4">Assign to Vessel</h2>
            <div className="space-y-3">
              <div>
                <label className="text-maritime-400 text-xs">Vessel</label>
                <select value={assignForm.vesselId} onChange={(e) => setAssignForm({ ...assignForm, vesselId: e.target.value })}
                  className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1">
                  <option value="">Select vessel</option>
                  {vessels.map((v: Record<string, unknown>) => (
                    <option key={v.id as string} value={v.id as string}>{v.name as string}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-maritime-400 text-xs">Rank (on this assignment)</label>
                <select value={assignForm.rank} onChange={(e) => setAssignForm({ ...assignForm, rank: e.target.value })}
                  className="w-full bg-maritime-900 border border-maritime-700 text-white text-sm rounded px-3 py-1.5 mt-1">
                  {Object.entries(rankLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowAssign(null)} className="text-maritime-400 text-sm hover:text-white px-4 py-2">Cancel</button>
              <button onClick={handleAssign} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg">Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
