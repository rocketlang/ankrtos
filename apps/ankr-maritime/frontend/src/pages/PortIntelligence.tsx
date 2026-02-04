import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

/* ── Queries ── */
const PORTS_QUERY = gql`
  query Ports {
    ports { id name country unlocode }
  }
`;

const ANCHORAGES_QUERY = gql`
  query Anchorages($portId: String!) {
    anchorages(portId: $portId) {
      id portId name depth holdingGround shelter stsOps maxLoa notes
    }
  }
`;

const PORT_WORKING_HOURS_QUERY = gql`
  query PortWorkingHours($portId: String!) {
    portWorkingHours(portId: $portId) {
      id portId dayOfWeek shiftName startTime endTime cargoTypes notes
    }
  }
`;

const PORT_DOC_REQUIREMENTS_QUERY = gql`
  query PortDocumentRequirements($portId: String!, $category: String) {
    portDocumentRequirements(portId: $portId, category: $category) {
      id portId documentName category required leadTimeDays notes
    }
  }
`;

const PORT_CONGESTION_QUERY = gql`
  query PortCongestion($portId: String!, $days: Int) {
    portCongestion(portId: $portId, days: $days) {
      id portId reportDate vesselsWaiting avgWaitDays berthUtilization notes source
    }
  }
`;

const PORT_CONGESTION_SUMMARY_QUERY = gql`
  query PortCongestionSummary($portId: String!) {
    portCongestionSummary(portId: $portId) {
      portId avgWaitDays vesselsWaiting berthUtilization trend reportCount
    }
  }
`;

/* ── Mutations ── */
const CREATE_ANCHORAGE = gql`
  mutation CreateAnchorage(
    $portId: String!, $name: String!, $depth: Float, $holdingGround: String,
    $shelter: String, $stsOps: Boolean, $maxLoa: Float, $notes: String
  ) {
    createAnchorage(
      portId: $portId, name: $name, depth: $depth, holdingGround: $holdingGround,
      shelter: $shelter, stsOps: $stsOps, maxLoa: $maxLoa, notes: $notes
    ) { id }
  }
`;

const SET_PORT_WORKING_HOURS = gql`
  mutation SetPortWorkingHours(
    $portId: String!, $dayOfWeek: String!, $shiftName: String,
    $startTime: String!, $endTime: String!, $cargoTypes: String, $notes: String
  ) {
    setPortWorkingHours(
      portId: $portId, dayOfWeek: $dayOfWeek, shiftName: $shiftName,
      startTime: $startTime, endTime: $endTime, cargoTypes: $cargoTypes, notes: $notes
    ) { id }
  }
`;

const ADD_PORT_DOC_REQUIREMENT = gql`
  mutation AddPortDocumentRequirement(
    $portId: String!, $documentName: String!, $category: String,
    $required: Boolean!, $leadTimeDays: Int, $notes: String
  ) {
    addPortDocumentRequirement(
      portId: $portId, documentName: $documentName, category: $category,
      required: $required, leadTimeDays: $leadTimeDays, notes: $notes
    ) { id }
  }
`;

const REPORT_PORT_CONGESTION = gql`
  mutation ReportPortCongestion(
    $portId: String!, $vesselsWaiting: Int, $avgWaitDays: Float,
    $berthUtilization: Float, $notes: String, $source: String
  ) {
    reportPortCongestion(
      portId: $portId, vesselsWaiting: $vesselsWaiting, avgWaitDays: $avgWaitDays,
      berthUtilization: $berthUtilization, notes: $notes, source: $source
    ) { id }
  }
`;

/* ── Constants ── */
type TabKey = 'congestion' | 'anchorages' | 'working_hours' | 'documents';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'congestion', label: 'Congestion' },
  { key: 'anchorages', label: 'Anchorages' },
  { key: 'working_hours', label: 'Working Hours' },
  { key: 'documents', label: 'Documents' },
];

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const docCategories = ['customs', 'immigration', 'health', 'port_authority', 'environmental', 'security', 'cargo', 'other'];

const categoryBadge: Record<string, string> = {
  customs: 'bg-blue-900/50 text-blue-400',
  immigration: 'bg-purple-900/50 text-purple-400',
  health: 'bg-green-900/50 text-green-400',
  port_authority: 'bg-yellow-900/50 text-yellow-400',
  environmental: 'bg-emerald-900/50 text-emerald-400',
  security: 'bg-red-900/50 text-red-400',
  cargo: 'bg-orange-900/50 text-orange-400',
  other: 'bg-maritime-700 text-maritime-300',
};

const trendIndicator: Record<string, string> = {
  improving: 'text-green-400',
  worsening: 'text-red-400',
  stable: 'text-yellow-400',
};

const emptyAnchorageForm = {
  name: '', depth: '', holdingGround: '', shelter: '', stsOps: false, maxLoa: '', notes: '',
};

const emptyHoursForm = {
  dayOfWeek: 'Monday', shiftName: '', startTime: '', endTime: '', cargoTypes: '', notes: '',
};

const emptyDocForm = {
  documentName: '', category: 'customs', required: true, leadTimeDays: '', notes: '',
};

const emptyCongestionForm = {
  vesselsWaiting: '', avgWaitDays: '', berthUtilization: '', notes: '', source: '',
};

function fmtDate(d: string | null | undefined) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PortIntelligence() {
  const [portFilter, setPortFilter] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('congestion');
  const [docCategoryFilter, setDocCategoryFilter] = useState('');

  // Modal states
  const [showAnchorage, setShowAnchorage] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const [showCongestion, setShowCongestion] = useState(false);

  // Forms
  const [anchorageForm, setAnchorageForm] = useState(emptyAnchorageForm);
  const [hoursForm, setHoursForm] = useState(emptyHoursForm);
  const [docForm, setDocForm] = useState(emptyDocForm);
  const [congestionForm, setCongestionForm] = useState(emptyCongestionForm);

  // Queries
  const { data: portData } = useQuery(PORTS_QUERY);
  const { data: anchorageData, loading: loadingAnch, refetch: refetchAnch } = useQuery(ANCHORAGES_QUERY, {
    variables: { portId: portFilter },
    skip: !portFilter,
  });
  const { data: hoursData, loading: loadingHours, refetch: refetchHours } = useQuery(PORT_WORKING_HOURS_QUERY, {
    variables: { portId: portFilter },
    skip: !portFilter,
  });
  const { data: docData, loading: loadingDocs, refetch: refetchDocs } = useQuery(PORT_DOC_REQUIREMENTS_QUERY, {
    variables: { portId: portFilter, category: docCategoryFilter || undefined },
    skip: !portFilter,
  });
  const { data: congestionData, loading: loadingCong, refetch: refetchCong } = useQuery(PORT_CONGESTION_QUERY, {
    variables: { portId: portFilter, days: 30 },
    skip: !portFilter,
  });
  const { data: summaryData } = useQuery(PORT_CONGESTION_SUMMARY_QUERY, {
    variables: { portId: portFilter },
    skip: !portFilter,
  });

  // Mutations
  const [createAnchorage, { loading: savingAnch }] = useMutation(CREATE_ANCHORAGE);
  const [setPortWorkingHours, { loading: savingHours }] = useMutation(SET_PORT_WORKING_HOURS);
  const [addPortDocRequirement, { loading: savingDoc }] = useMutation(ADD_PORT_DOC_REQUIREMENT);
  const [reportPortCongestion, { loading: savingCong }] = useMutation(REPORT_PORT_CONGESTION);

  const ports = portData?.ports ?? [];
  const anchorages = anchorageData?.anchorages ?? [];
  const workingHours = hoursData?.portWorkingHours ?? [];
  const documents = docData?.portDocumentRequirements ?? [];
  const congestionHistory = congestionData?.portCongestion ?? [];
  const summary = summaryData?.portCongestionSummary;

  // Setters
  const setA = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setAnchorageForm((f) => ({ ...f, [field]: e.target.value }));
  const setH = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setHoursForm((f) => ({ ...f, [field]: e.target.value }));
  const setD = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDocForm((f) => ({ ...f, [field]: e.target.value }));
  const setG = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCongestionForm((f) => ({ ...f, [field]: e.target.value }));

  // Handlers
  const handleCreateAnchorage = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAnchorage({
      variables: {
        portId: portFilter,
        name: anchorageForm.name,
        depth: anchorageForm.depth ? parseFloat(anchorageForm.depth) : null,
        holdingGround: anchorageForm.holdingGround || null,
        shelter: anchorageForm.shelter || null,
        stsOps: anchorageForm.stsOps,
        maxLoa: anchorageForm.maxLoa ? parseFloat(anchorageForm.maxLoa) : null,
        notes: anchorageForm.notes || null,
      },
    });
    setAnchorageForm(emptyAnchorageForm);
    setShowAnchorage(false);
    refetchAnch();
  };

  const handleSetWorkingHours = async (e: React.FormEvent) => {
    e.preventDefault();
    await setPortWorkingHours({
      variables: {
        portId: portFilter,
        dayOfWeek: hoursForm.dayOfWeek,
        shiftName: hoursForm.shiftName || null,
        startTime: hoursForm.startTime,
        endTime: hoursForm.endTime,
        cargoTypes: hoursForm.cargoTypes || null,
        notes: hoursForm.notes || null,
      },
    });
    setHoursForm(emptyHoursForm);
    setShowHours(false);
    refetchHours();
  };

  const handleAddDocRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPortDocRequirement({
      variables: {
        portId: portFilter,
        documentName: docForm.documentName,
        category: docForm.category || null,
        required: docForm.required,
        leadTimeDays: docForm.leadTimeDays ? parseInt(docForm.leadTimeDays) : null,
        notes: docForm.notes || null,
      },
    });
    setDocForm(emptyDocForm);
    setShowDoc(false);
    refetchDocs();
  };

  const handleReportCongestion = async (e: React.FormEvent) => {
    e.preventDefault();
    await reportPortCongestion({
      variables: {
        portId: portFilter,
        vesselsWaiting: congestionForm.vesselsWaiting ? parseInt(congestionForm.vesselsWaiting) : null,
        avgWaitDays: congestionForm.avgWaitDays ? parseFloat(congestionForm.avgWaitDays) : null,
        berthUtilization: congestionForm.berthUtilization ? parseFloat(congestionForm.berthUtilization) : null,
        notes: congestionForm.notes || null,
        source: congestionForm.source || null,
      },
    });
    setCongestionForm(emptyCongestionForm);
    setShowCongestion(false);
    refetchCong();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Port Intelligence</h1>
          <p className="text-maritime-400 text-sm mt-1">Congestion, anchorages, working hours &amp; documentation requirements</p>
        </div>
        <div className="flex gap-3">
          <select value={portFilter} onChange={(e) => setPortFilter(e.target.value)}
            className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm">
            <option value="">-- Select Port --</option>
            {ports.map((p: Record<string, unknown>) => (
              <option key={p.id as string} value={p.id as string}>
                {p.name as string}{p.unlocode ? ` (${p.unlocode as string})` : ''} &mdash; {p.country as string}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!portFilter && (
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-12 text-center">
          <span className="text-4xl">{'\u2693'}</span>
          <h3 className="text-white font-medium mt-4">Select a Port</h3>
          <p className="text-maritime-400 text-sm mt-2">Choose a port from the dropdown to view intelligence data.</p>
        </div>
      )}

      {portFilter && (
        <>
          {/* Tab Switcher */}
          <div className="flex gap-1 mb-6 bg-maritime-800 border border-maritime-700 rounded-lg p-1 w-fit">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === t.key
                    ? 'bg-blue-600 text-white'
                    : 'text-maritime-400 hover:text-white hover:bg-maritime-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Congestion Tab ── */}
          {activeTab === 'congestion' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
                    <p className="text-maritime-400 text-xs font-medium mb-1">Avg Wait Time</p>
                    <p className="text-white text-xl font-bold">{(summary.avgWaitDays as number)?.toFixed(1) ?? '-'} <span className="text-maritime-400 text-sm font-normal">days</span></p>
                  </div>
                  <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
                    <p className="text-maritime-400 text-xs font-medium mb-1">Vessels Waiting</p>
                    <p className="text-white text-xl font-bold">{(summary.vesselsWaiting as number) ?? '-'}</p>
                  </div>
                  <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
                    <p className="text-maritime-400 text-xs font-medium mb-1">Berth Utilization</p>
                    <p className="text-white text-xl font-bold">{(summary.berthUtilization as number)?.toFixed(0) ?? '-'}<span className="text-maritime-400 text-sm font-normal">%</span></p>
                  </div>
                  <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-4">
                    <p className="text-maritime-400 text-xs font-medium mb-1">Trend</p>
                    <p className={`text-xl font-bold capitalize ${trendIndicator[summary.trend as string] ?? 'text-maritime-300'}`}>
                      {(summary.trend as string) || '-'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium text-sm">Congestion History (Last 30 Days)</h3>
                <button onClick={() => setShowCongestion(true)} className={btnPrimary}>+ Report Congestion</button>
              </div>

              {loadingCong && <p className="text-maritime-400">Loading congestion data...</p>}
              {!loadingCong && (
                <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-maritime-700 text-maritime-400">
                        <th className="text-left px-4 py-3 font-medium">Report Date</th>
                        <th className="text-right px-4 py-3 font-medium">Vessels Waiting</th>
                        <th className="text-right px-4 py-3 font-medium">Avg Wait (days)</th>
                        <th className="text-right px-4 py-3 font-medium">Berth Util. (%)</th>
                        <th className="text-left px-4 py-3 font-medium">Source</th>
                        <th className="text-left px-4 py-3 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {congestionHistory.map((r: Record<string, unknown>) => (
                        <tr key={r.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                          <td className="px-4 py-3 text-white text-xs font-mono">{fmtDate(r.reportDate as string)}</td>
                          <td className="px-4 py-3 text-yellow-400 text-right font-mono">{(r.vesselsWaiting as number) ?? '-'}</td>
                          <td className="px-4 py-3 text-orange-400 text-right font-mono">{(r.avgWaitDays as number)?.toFixed(1) ?? '-'}</td>
                          <td className="px-4 py-3 text-blue-400 text-right font-mono">{(r.berthUtilization as number)?.toFixed(0) ?? '-'}%</td>
                          <td className="px-4 py-3 text-maritime-400 text-xs">{(r.source as string) || '-'}</td>
                          <td className="px-4 py-3 text-maritime-400 text-xs max-w-xs truncate">{(r.notes as string) || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {congestionHistory.length === 0 && (
                    <p className="text-maritime-500 text-center py-8">No congestion reports found</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Anchorages Tab ── */}
          {activeTab === 'anchorages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium text-sm">Anchorage Areas</h3>
                <button onClick={() => setShowAnchorage(true)} className={btnPrimary}>+ Add Anchorage</button>
              </div>

              {loadingAnch && <p className="text-maritime-400">Loading anchorages...</p>}
              {!loadingAnch && (
                <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-maritime-700 text-maritime-400">
                        <th className="text-left px-4 py-3 font-medium">Name</th>
                        <th className="text-right px-4 py-3 font-medium">Depth (m)</th>
                        <th className="text-left px-4 py-3 font-medium">Holding Ground</th>
                        <th className="text-left px-4 py-3 font-medium">Shelter</th>
                        <th className="text-center px-4 py-3 font-medium">STS Ops</th>
                        <th className="text-right px-4 py-3 font-medium">Max LOA (m)</th>
                        <th className="text-left px-4 py-3 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anchorages.map((a: Record<string, unknown>) => (
                        <tr key={a.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                          <td className="px-4 py-3 text-white font-medium">{a.name as string}</td>
                          <td className="px-4 py-3 text-maritime-300 text-right font-mono">{(a.depth as number)?.toFixed(1) ?? '-'}</td>
                          <td className="px-4 py-3 text-maritime-300 text-xs capitalize">{(a.holdingGround as string) || '-'}</td>
                          <td className="px-4 py-3 text-maritime-300 text-xs capitalize">{(a.shelter as string) || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            {(a.stsOps as boolean) ? (
                              <span className="text-green-400 text-xs">Yes</span>
                            ) : (
                              <span className="text-maritime-500 text-xs">No</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-maritime-300 text-right font-mono">{(a.maxLoa as number)?.toFixed(0) ?? '-'}</td>
                          <td className="px-4 py-3 text-maritime-400 text-xs max-w-xs truncate">{(a.notes as string) || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {anchorages.length === 0 && (
                    <p className="text-maritime-500 text-center py-8">No anchorage areas defined for this port</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Working Hours Tab ── */}
          {activeTab === 'working_hours' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium text-sm">Port Working Hours</h3>
                <button onClick={() => setShowHours(true)} className={btnPrimary}>+ Add Working Hours</button>
              </div>

              {loadingHours && <p className="text-maritime-400">Loading working hours...</p>}
              {!loadingHours && (
                <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-maritime-700 text-maritime-400">
                        <th className="text-left px-4 py-3 font-medium">Day</th>
                        <th className="text-left px-4 py-3 font-medium">Shift</th>
                        <th className="text-left px-4 py-3 font-medium">Start</th>
                        <th className="text-left px-4 py-3 font-medium">End</th>
                        <th className="text-left px-4 py-3 font-medium">Cargo Types</th>
                        <th className="text-left px-4 py-3 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workingHours.map((h: Record<string, unknown>) => (
                        <tr key={h.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                          <td className="px-4 py-3 text-white font-medium">{h.dayOfWeek as string}</td>
                          <td className="px-4 py-3 text-maritime-300">{(h.shiftName as string) || '-'}</td>
                          <td className="px-4 py-3 text-maritime-300 font-mono">{h.startTime as string}</td>
                          <td className="px-4 py-3 text-maritime-300 font-mono">{h.endTime as string}</td>
                          <td className="px-4 py-3 text-maritime-400 text-xs">{(h.cargoTypes as string) || 'All'}</td>
                          <td className="px-4 py-3 text-maritime-400 text-xs max-w-xs truncate">{(h.notes as string) || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {workingHours.length === 0 && (
                    <p className="text-maritime-500 text-center py-8">No working hours defined for this port</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Documents Tab ── */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <h3 className="text-white font-medium text-sm">Document Requirements</h3>
                  <select value={docCategoryFilter} onChange={(e) => setDocCategoryFilter(e.target.value)}
                    className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-1.5 text-white text-xs">
                    <option value="">All Categories</option>
                    {docCategories.map((c) => (
                      <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => setShowDoc(true)} className={btnPrimary}>+ Add Requirement</button>
              </div>

              {loadingDocs && <p className="text-maritime-400">Loading document requirements...</p>}
              {!loadingDocs && (
                <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-maritime-700 text-maritime-400">
                        <th className="text-left px-4 py-3 font-medium">Document Name</th>
                        <th className="text-left px-4 py-3 font-medium">Category</th>
                        <th className="text-center px-4 py-3 font-medium">Required</th>
                        <th className="text-right px-4 py-3 font-medium">Lead Time (days)</th>
                        <th className="text-left px-4 py-3 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((d: Record<string, unknown>) => (
                        <tr key={d.id as string} className="border-b border-maritime-700/50 hover:bg-maritime-700/30">
                          <td className="px-4 py-3 text-white font-medium">{d.documentName as string}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${categoryBadge[d.category as string] ?? 'bg-maritime-700 text-maritime-300'}`}>
                              {(d.category as string)?.replace(/_/g, ' ') || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {(d.required as boolean) ? (
                              <span className="text-red-400 text-xs font-medium">Required</span>
                            ) : (
                              <span className="text-maritime-400 text-xs">Optional</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-maritime-300 text-right font-mono">{(d.leadTimeDays as number) ?? '-'}</td>
                          <td className="px-4 py-3 text-maritime-400 text-xs max-w-xs truncate">{(d.notes as string) || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {documents.length === 0 && (
                    <p className="text-maritime-500 text-center py-8">No document requirements defined for this port</p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Add Anchorage Modal ── */}
      <Modal open={showAnchorage} onClose={() => setShowAnchorage(false)} title="Add Anchorage Area">
        <form onSubmit={handleCreateAnchorage}>
          <FormField label="Name *">
            <input value={anchorageForm.name} onChange={setA('name')} className={inputClass} required placeholder="Anchorage Alpha" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Depth (m)">
              <input type="number" step="0.1" value={anchorageForm.depth} onChange={setA('depth')} className={inputClass} placeholder="18.5" />
            </FormField>
            <FormField label="Max LOA (m)">
              <input type="number" step="0.1" value={anchorageForm.maxLoa} onChange={setA('maxLoa')} className={inputClass} placeholder="350" />
            </FormField>
            <FormField label="Holding Ground">
              <select value={anchorageForm.holdingGround} onChange={setA('holdingGround')} className={selectClass}>
                <option value="">-- Select --</option>
                <option value="good">Good</option>
                <option value="moderate">Moderate</option>
                <option value="poor">Poor</option>
              </select>
            </FormField>
            <FormField label="Shelter">
              <select value={anchorageForm.shelter} onChange={setA('shelter')} className={selectClass}>
                <option value="">-- Select --</option>
                <option value="good">Good</option>
                <option value="moderate">Moderate</option>
                <option value="exposed">Exposed</option>
              </select>
            </FormField>
          </div>
          <FormField label="STS Operations Allowed">
            <button type="button"
              onClick={() => setAnchorageForm((f) => ({ ...f, stsOps: !f.stsOps }))}
              className={`flex items-center gap-3 px-4 py-2 rounded-md border transition-colors w-full ${
                anchorageForm.stsOps
                  ? 'bg-green-900/30 border-green-700 text-green-400'
                  : 'bg-maritime-900 border-maritime-600 text-maritime-400'
              }`}>
              <span className="text-sm font-medium">{anchorageForm.stsOps ? 'Yes - STS Allowed' : 'No - STS Not Allowed'}</span>
            </button>
          </FormField>
          <FormField label="Notes">
            <textarea value={anchorageForm.notes} onChange={setA('notes')}
              className={`${inputClass} h-20 resize-none`} placeholder="Restrictions, seasonal changes, etc." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAnchorage(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={savingAnch} className={btnPrimary}>
              {savingAnch ? 'Adding...' : 'Add Anchorage'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Add Working Hours Modal ── */}
      <Modal open={showHours} onClose={() => setShowHours(false)} title="Set Port Working Hours">
        <form onSubmit={handleSetWorkingHours}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Day of Week *">
              <select value={hoursForm.dayOfWeek} onChange={setH('dayOfWeek')} className={selectClass} required>
                {dayNames.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Shift Name">
              <input value={hoursForm.shiftName} onChange={setH('shiftName')} className={inputClass} placeholder="Day Shift, Night Shift" />
            </FormField>
            <FormField label="Start Time *">
              <input type="time" value={hoursForm.startTime} onChange={setH('startTime')} className={inputClass} required />
            </FormField>
            <FormField label="End Time *">
              <input type="time" value={hoursForm.endTime} onChange={setH('endTime')} className={inputClass} required />
            </FormField>
          </div>
          <FormField label="Cargo Types">
            <input value={hoursForm.cargoTypes} onChange={setH('cargoTypes')} className={inputClass} placeholder="Dry Bulk, Containers, Tanker (leave empty for all)" />
          </FormField>
          <FormField label="Notes">
            <textarea value={hoursForm.notes} onChange={setH('notes')}
              className={`${inputClass} h-20 resize-none`} placeholder="Holiday schedules, exceptions, etc." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowHours(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={savingHours} className={btnPrimary}>
              {savingHours ? 'Saving...' : 'Set Working Hours'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Add Document Requirement Modal ── */}
      <Modal open={showDoc} onClose={() => setShowDoc(false)} title="Add Document Requirement">
        <form onSubmit={handleAddDocRequirement}>
          <FormField label="Document Name *">
            <input value={docForm.documentName} onChange={setD('documentName')} className={inputClass} required placeholder="Crew List, ISPS Certificate, Health Declaration" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <select value={docForm.category} onChange={setD('category')} className={selectClass}>
                {docCategories.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Lead Time (days)">
              <input type="number" value={docForm.leadTimeDays} onChange={setD('leadTimeDays')} className={inputClass} placeholder="3" />
            </FormField>
          </div>
          <FormField label="Required">
            <button type="button"
              onClick={() => setDocForm((f) => ({ ...f, required: !f.required }))}
              className={`flex items-center gap-3 px-4 py-2 rounded-md border transition-colors w-full ${
                docForm.required
                  ? 'bg-red-900/30 border-red-700 text-red-400'
                  : 'bg-maritime-900 border-maritime-600 text-maritime-400'
              }`}>
              <span className="text-sm font-medium">{docForm.required ? 'Required - Mandatory' : 'Optional'}</span>
            </button>
          </FormField>
          <FormField label="Notes">
            <textarea value={docForm.notes} onChange={setD('notes')}
              className={`${inputClass} h-20 resize-none`} placeholder="Submission process, format requirements, etc." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowDoc(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={savingDoc} className={btnPrimary}>
              {savingDoc ? 'Adding...' : 'Add Requirement'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Report Congestion Modal ── */}
      <Modal open={showCongestion} onClose={() => setShowCongestion(false)} title="Report Port Congestion">
        <form onSubmit={handleReportCongestion}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Vessels Waiting">
              <input type="number" value={congestionForm.vesselsWaiting} onChange={setG('vesselsWaiting')} className={inputClass} placeholder="12" />
            </FormField>
            <FormField label="Avg Wait Time (days)">
              <input type="number" step="0.1" value={congestionForm.avgWaitDays} onChange={setG('avgWaitDays')} className={inputClass} placeholder="4.5" />
            </FormField>
            <FormField label="Berth Utilization (%)">
              <input type="number" step="0.1" min="0" max="100" value={congestionForm.berthUtilization} onChange={setG('berthUtilization')} className={inputClass} placeholder="85" />
            </FormField>
            <FormField label="Source">
              <input value={congestionForm.source} onChange={setG('source')} className={inputClass} placeholder="Port Authority, Agent Report" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={congestionForm.notes} onChange={setG('notes')}
              className={`${inputClass} h-20 resize-none`} placeholder="Weather delays, industrial action, seasonal peak, etc." />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCongestion(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={savingCong} className={btnPrimary}>
              {savingCong ? 'Reporting...' : 'Report Congestion'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
