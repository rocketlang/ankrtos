import { useQuery, useMutation, gql } from '@apollo/client';
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

// ── GraphQL ──────────────────────────────────────────────────────────────────

const ATTENDANCE_LOGS = gql`
  query AttendanceLogs($month: Int!, $year: Int!) {
    attendanceLogs(month: $month, year: $year) {
      id employeeId
      employee { firstName lastName }
      date checkIn checkOut hoursWorked status leaveType
    }
  }
`;

const LEAVE_BALANCES = gql`
  query LeaveBalances($year: Int!) {
    leaveBalances(year: $year) {
      id employeeId
      employee { firstName lastName }
      leaveType entitled taken pending balance
    }
  }
`;

const EMPLOYEES_QUERY = gql`
  query EmployeesForAttendance {
    employees { id firstName lastName employeeCode status }
  }
`;

const PENDING_LEAVES = gql`
  query PendingLeaves {
    pendingLeaveRequests {
      id employeeId employee { firstName lastName }
      leaveType startDate endDate days remarks status
    }
  }
`;

const MARK_ATTENDANCE = gql`
  mutation MarkAttendance(
    $employeeId: String!, $date: DateTime!, $checkIn: String!,
    $checkOut: String, $status: String!
  ) {
    markAttendance(
      employeeId: $employeeId, date: $date, checkIn: $checkIn,
      checkOut: $checkOut, status: $status
    ) { id }
  }
`;

const APPLY_LEAVE = gql`
  mutation ApplyLeave(
    $employeeId: String!, $leaveType: String!, $startDate: DateTime!,
    $endDate: DateTime!, $remarks: String
  ) {
    applyLeave(
      employeeId: $employeeId, leaveType: $leaveType, startDate: $startDate,
      endDate: $endDate, remarks: $remarks
    ) { id }
  }
`;

const APPROVE_LEAVE = gql`
  mutation ApproveLeave($id: String!, $action: String!) {
    approveLeave(id: $id, action: $action) { id }
  }
`;

const INITIALIZE_BALANCES = gql`
  mutation InitializeLeaveBalances($year: Int!) {
    initializeLeaveBalances(year: $year)
  }
`;

// ── Constants ────────────────────────────────────────────────────────────────

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const attendanceStatuses = ['present', 'absent', 'wfh', 'half_day', 'leave'];
const attendanceStatusLabels: Record<string, string> = {
  present: 'Present', absent: 'Absent', wfh: 'WFH', half_day: 'Half Day', leave: 'Leave',
};

const leaveTypes = ['casual', 'sick', 'earned', 'maternity', 'paternity', 'compensatory'];
const leaveTypeLabels: Record<string, string> = {
  casual: 'Casual', sick: 'Sick', earned: 'Earned',
  maternity: 'Maternity', paternity: 'Paternity', compensatory: 'Compensatory',
};

const statusDot: Record<string, string> = {
  present: 'bg-green-500',
  absent: 'bg-red-500',
  wfh: 'bg-blue-500',
  half_day: 'bg-orange-500',
  leave: 'bg-yellow-500',
};

const leaveStatusBadge: Record<string, string> = {
  pending: 'bg-yellow-900/50 text-yellow-400',
  approved: 'bg-green-900/50 text-green-400',
  rejected: 'bg-red-900/50 text-red-400',
};

const emptyAttendanceForm = {
  employeeId: '', date: '', checkIn: '09:00', checkOut: '18:00', status: 'present',
};

const emptyLeaveForm = {
  employeeId: '', leaveType: 'casual', startDate: '', endDate: '', remarks: '',
};

// ── Component ────────────────────────────────────────────────────────────────

export function AttendanceLeave() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'leave'>('attendance');
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [attForm, setAttForm] = useState(emptyAttendanceForm);
  const [leaveForm, setLeaveForm] = useState(emptyLeaveForm);

  const now = new Date();
  const [attMonth, setAttMonth] = useState(now.getMonth() + 1);
  const [attYear, setAttYear] = useState(now.getFullYear());
  const [leaveYear, setLeaveYear] = useState(now.getFullYear());

  // Queries
  const { data: attData, loading: attLoading, refetch: refetchAtt } = useQuery(ATTENDANCE_LOGS, {
    variables: { month: attMonth, year: attYear },
  });
  const { data: leaveData, loading: leaveLoading, refetch: refetchLeave } = useQuery(LEAVE_BALANCES, {
    variables: { year: leaveYear },
    skip: activeTab !== 'leave',
  });
  const { data: empData } = useQuery(EMPLOYEES_QUERY);
  const { data: pendingData, refetch: refetchPending } = useQuery(PENDING_LEAVES, {
    skip: activeTab !== 'leave',
  });

  // Mutations
  const [markAttendance, { loading: marking }] = useMutation(MARK_ATTENDANCE);
  const [applyLeave, { loading: applying }] = useMutation(APPLY_LEAVE);
  const [approveLeave] = useMutation(APPROVE_LEAVE);
  const [initializeBalances, { loading: initializing }] = useMutation(INITIALIZE_BALANCES);

  // Derived data
  const logs = attData?.attendanceLogs ?? [];
  const balances = leaveData?.leaveBalances ?? [];
  const employees = empData?.employees ?? [];
  const pendingLeaves = pendingData?.pendingLeaveRequests ?? [];

  // ── Attendance Summary ──

  const attSummary = useMemo(() => {
    const present = logs.filter((l: Record<string, unknown>) => l.status === 'present').length;
    const absent = logs.filter((l: Record<string, unknown>) => l.status === 'absent').length;
    const wfh = logs.filter((l: Record<string, unknown>) => l.status === 'wfh').length;
    const onLeave = logs.filter((l: Record<string, unknown>) => l.status === 'leave').length;
    const totalHours = logs.reduce((s: number, l: Record<string, unknown>) => s + ((l.hoursWorked as number) ?? 0), 0);
    const avgHours = logs.length > 0 ? (totalHours / logs.length).toFixed(1) : '0';
    return { present, absent, wfh, onLeave, avgHours };
  }, [logs]);

  // ── Calendar Grid Data ──

  const daysInMonth = new Date(attYear, attMonth, 0).getDate();
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const employeeMap = useMemo(() => {
    const map: Record<string, { name: string; days: Record<number, string> }> = {};
    logs.forEach((l: Record<string, unknown>) => {
      const empId = l.employeeId as string;
      const emp = l.employee as Record<string, unknown> | null;
      if (!map[empId]) {
        map[empId] = {
          name: emp ? `${emp.firstName} ${emp.lastName}` : empId,
          days: {},
        };
      }
      const d = new Date(l.date as string).getDate();
      map[empId].days[d] = l.status as string;
    });
    return map;
  }, [logs]);

  // ── Leave Balance Grouped by Employee ──

  const groupedBalances = useMemo(() => {
    const map: Record<string, {
      name: string;
      types: Record<string, { entitled: number; taken: number; balance: number }>;
      totalBalance: number;
    }> = {};
    balances.forEach((b: Record<string, unknown>) => {
      const empId = b.employeeId as string;
      const emp = b.employee as Record<string, unknown> | null;
      if (!map[empId]) {
        map[empId] = {
          name: emp ? `${emp.firstName} ${emp.lastName}` : empId,
          types: {},
          totalBalance: 0,
        };
      }
      const lt = b.leaveType as string;
      map[empId].types[lt] = {
        entitled: b.entitled as number,
        taken: b.taken as number,
        balance: b.balance as number,
      };
      map[empId].totalBalance += (b.balance as number) ?? 0;
    });
    return Object.values(map);
  }, [balances]);

  // ── Handlers ──

  const setAtt = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAttForm((f) => ({ ...f, [field]: e.target.value }));

  const setLv = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setLeaveForm((f) => ({ ...f, [field]: e.target.value }));

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    await markAttendance({
      variables: {
        employeeId: attForm.employeeId,
        date: new Date(attForm.date).toISOString(),
        checkIn: attForm.checkIn,
        checkOut: attForm.checkOut || null,
        status: attForm.status,
      },
    });
    setAttForm(emptyAttendanceForm);
    setShowMarkAttendance(false);
    refetchAtt();
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    await applyLeave({
      variables: {
        employeeId: leaveForm.employeeId,
        leaveType: leaveForm.leaveType,
        startDate: new Date(leaveForm.startDate).toISOString(),
        endDate: new Date(leaveForm.endDate).toISOString(),
        remarks: leaveForm.remarks || null,
      },
    });
    setLeaveForm(emptyLeaveForm);
    setShowApplyLeave(false);
    refetchLeave();
    refetchPending();
  };

  const handleApproveReject = async (id: string, action: 'approved' | 'rejected') => {
    await approveLeave({ variables: { id, action } });
    refetchPending();
    refetchLeave();
  };

  const handleInitialize = async () => {
    if (!confirm(`Initialize leave balances for ${leaveYear}? This will create default entitlements for all active employees.`)) return;
    await initializeBalances({ variables: { year: leaveYear } });
    refetchLeave();
  };

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const tabs = [
    { key: 'attendance' as const, label: 'Attendance' },
    { key: 'leave' as const, label: 'Leave Management' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Attendance & Leave</h1>
          <p className="text-maritime-400 text-sm mt-1">
            Track attendance, manage leave balances, and process leave requests
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-maritime-800 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === t.key
                ? 'bg-blue-600 text-white'
                : 'text-maritime-400 hover:text-white hover:bg-maritime-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ TAB 1: ATTENDANCE ═══════════════ */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Month/Year Selector */}
          <div className="flex items-center gap-3">
            <select
              value={attMonth}
              onChange={(e) => setAttMonth(Number(e.target.value))}
              className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-2"
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={attYear}
              onChange={(e) => setAttYear(Number(e.target.value))}
              className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-2"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button onClick={() => setShowMarkAttendance(true)} className={btnPrimary}>
              + Mark Attendance
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Present', value: attSummary.present, color: 'text-green-400', border: 'border-green-500' },
              { label: 'Absent', value: attSummary.absent, color: 'text-red-400', border: 'border-red-500' },
              { label: 'WFH', value: attSummary.wfh, color: 'text-blue-400', border: 'border-blue-500' },
              { label: 'On Leave', value: attSummary.onLeave, color: 'text-yellow-400', border: 'border-yellow-500' },
              { label: 'Avg Hours', value: attSummary.avgHours, color: 'text-white', border: 'border-maritime-500' },
            ].map((s) => (
              <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
                <p className="text-maritime-500 text-xs">{s.label}</p>
                <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs text-maritime-400">
            {Object.entries(statusDot).map(([k, color]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="capitalize">{k.replace('_', ' ')}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {attLoading && <p className="text-maritime-400">Loading attendance...</p>}
          {!attLoading && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-maritime-700 text-maritime-400">
                      <th className="text-left px-3 py-2 font-medium sticky left-0 bg-maritime-800 z-10 min-w-[120px]">
                        Employee
                      </th>
                      {dayNumbers.map((d) => (
                        <th key={d} className="text-center px-1 py-2 font-medium min-w-[24px]">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(employeeMap).length === 0 && (
                      <tr>
                        <td colSpan={daysInMonth + 1} className="text-center py-8 text-maritime-500 text-sm">
                          No attendance records for {months[attMonth - 1]} {attYear}
                        </td>
                      </tr>
                    )}
                    {Object.entries(employeeMap).map(([empId, entry]) => (
                      <tr key={empId} className="border-b border-maritime-700/30 hover:bg-maritime-700/20">
                        <td className="px-3 py-2 text-white font-medium sticky left-0 bg-maritime-800 z-10 whitespace-nowrap">
                          {entry.name}
                        </td>
                        {dayNumbers.map((d) => {
                          const st = entry.days[d];
                          return (
                            <td key={d} className="text-center px-1 py-2">
                              {st ? (
                                <span
                                  className={`inline-block w-3 h-3 rounded-full ${statusDot[st] ?? 'bg-maritime-600'}`}
                                  title={`${d} ${months[attMonth - 1]}: ${attendanceStatusLabels[st] ?? st}`}
                                />
                              ) : (
                                <span className="inline-block w-3 h-3 rounded-full bg-maritime-800 border border-maritime-700" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ TAB 2: LEAVE MANAGEMENT ═══════════════ */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          {/* Year Selector + Actions */}
          <div className="flex items-center gap-3">
            <select
              value={leaveYear}
              onChange={(e) => setLeaveYear(Number(e.target.value))}
              className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-2"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button onClick={handleInitialize} disabled={initializing} className={btnSecondary}>
              {initializing ? 'Initializing...' : 'Initialize Balances'}
            </button>
            <button onClick={() => setShowApplyLeave(true)} className={btnPrimary}>
              + Apply Leave
            </button>
          </div>

          {/* Leave Balance Table */}
          {leaveLoading && <p className="text-maritime-400">Loading leave balances...</p>}
          {!leaveLoading && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-maritime-700">
                <h3 className="text-white text-sm font-medium">Leave Balances - {leaveYear}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-maritime-700 text-maritime-400 text-[10px]">
                      <th className="text-left px-4 py-3 font-medium" rowSpan={2}>Employee</th>
                      <th className="text-center px-2 py-1 font-medium border-b border-maritime-700" colSpan={3}>Casual</th>
                      <th className="text-center px-2 py-1 font-medium border-b border-maritime-700" colSpan={3}>Sick</th>
                      <th className="text-center px-2 py-1 font-medium border-b border-maritime-700" colSpan={3}>Earned</th>
                      <th className="text-right px-4 py-3 font-medium" rowSpan={2}>Total Bal</th>
                    </tr>
                    <tr className="border-b border-maritime-700 text-maritime-500 text-[9px]">
                      <th className="text-center px-2 py-1">Ent</th>
                      <th className="text-center px-2 py-1">Tkn</th>
                      <th className="text-center px-2 py-1">Bal</th>
                      <th className="text-center px-2 py-1">Ent</th>
                      <th className="text-center px-2 py-1">Tkn</th>
                      <th className="text-center px-2 py-1">Bal</th>
                      <th className="text-center px-2 py-1">Ent</th>
                      <th className="text-center px-2 py-1">Tkn</th>
                      <th className="text-center px-2 py-1">Bal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedBalances.length === 0 && (
                      <tr>
                        <td colSpan={11} className="text-center py-8 text-maritime-500">
                          No leave balances found. Click "Initialize Balances" to create.
                        </td>
                      </tr>
                    )}
                    {groupedBalances.map((emp, i) => {
                      const casual = emp.types['casual'] ?? { entitled: 0, taken: 0, balance: 0 };
                      const sick = emp.types['sick'] ?? { entitled: 0, taken: 0, balance: 0 };
                      const earned = emp.types['earned'] ?? { entitled: 0, taken: 0, balance: 0 };
                      return (
                        <tr
                          key={i}
                          className="border-b border-maritime-700/30 hover:bg-maritime-700/20"
                        >
                          <td className="px-4 py-2 text-white text-xs font-medium whitespace-nowrap">
                            {emp.name}
                          </td>
                          <td className="text-center px-2 py-2 text-maritime-400 text-xs">{casual.entitled}</td>
                          <td className="text-center px-2 py-2 text-maritime-400 text-xs">{casual.taken}</td>
                          <td className="text-center px-2 py-2 text-white text-xs font-medium">{casual.balance}</td>
                          <td className="text-center px-2 py-2 text-maritime-400 text-xs">{sick.entitled}</td>
                          <td className="text-center px-2 py-2 text-maritime-400 text-xs">{sick.taken}</td>
                          <td className="text-center px-2 py-2 text-white text-xs font-medium">{sick.balance}</td>
                          <td className="text-center px-2 py-2 text-maritime-400 text-xs">{earned.entitled}</td>
                          <td className="text-center px-2 py-2 text-maritime-400 text-xs">{earned.taken}</td>
                          <td className="text-center px-2 py-2 text-white text-xs font-medium">{earned.balance}</td>
                          <td className="text-right px-4 py-2 text-green-400 text-xs font-bold">
                            {emp.totalBalance}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Leave Requests */}
          <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-maritime-700 flex items-center justify-between">
              <h3 className="text-white text-sm font-medium">Pending Leave Requests</h3>
              {pendingLeaves.length > 0 && (
                <span className="bg-yellow-900/50 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pendingLeaves.length}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-maritime-700 text-maritime-400 text-xs">
                    <th className="text-left px-4 py-3 font-medium">Employee</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">From</th>
                    <th className="text-left px-4 py-3 font-medium">To</th>
                    <th className="text-right px-4 py-3 font-medium">Days</th>
                    <th className="text-left px-4 py-3 font-medium">Remarks</th>
                    <th className="text-center px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaves.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-maritime-500 text-xs">
                        No pending requests
                      </td>
                    </tr>
                  )}
                  {pendingLeaves.map((lv: Record<string, unknown>) => {
                    const emp = lv.employee as Record<string, unknown> | null;
                    return (
                      <tr
                        key={lv.id as string}
                        className="border-b border-maritime-700/30 hover:bg-maritime-700/20"
                      >
                        <td className="px-4 py-3 text-white text-xs font-medium">
                          {emp ? `${emp.firstName} ${emp.lastName}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-maritime-300 text-xs capitalize">
                          {leaveTypeLabels[lv.leaveType as string] ?? lv.leaveType}
                        </td>
                        <td className="px-4 py-3 text-maritime-300 text-xs">
                          {fmtDate(lv.startDate as string)}
                        </td>
                        <td className="px-4 py-3 text-maritime-300 text-xs">
                          {fmtDate(lv.endDate as string)}
                        </td>
                        <td className="px-4 py-3 text-white text-xs text-right font-mono">
                          {lv.days as number}
                        </td>
                        <td className="px-4 py-3 text-maritime-400 text-xs truncate max-w-[200px]">
                          {(lv.remarks as string) || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleApproveReject(lv.id as string, 'approved')}
                              className="text-green-400 hover:text-green-300 text-[10px] bg-green-900/30 px-2 py-0.5 rounded"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveReject(lv.id as string, 'rejected')}
                              className="text-red-400 hover:text-red-300 text-[10px] bg-red-900/30 px-2 py-0.5 rounded"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Mark Attendance Modal */}
      <Modal open={showMarkAttendance} onClose={() => setShowMarkAttendance(false)} title="Mark Attendance">
        <form onSubmit={handleMarkAttendance}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Employee *">
                <select value={attForm.employeeId} onChange={setAtt('employeeId')} className={selectClass} required>
                  <option value="">Select employee</option>
                  {employees
                    .filter((e: Record<string, unknown>) => e.status === 'active')
                    .map((e: Record<string, unknown>) => (
                      <option key={e.id as string} value={e.id as string}>
                        {e.firstName as string} {e.lastName as string} ({e.employeeCode as string})
                      </option>
                    ))}
                </select>
              </FormField>
            </div>
            <FormField label="Date *">
              <input type="date" value={attForm.date} onChange={setAtt('date')} className={inputClass} required />
            </FormField>
            <FormField label="Status *">
              <select value={attForm.status} onChange={setAtt('status')} className={selectClass} required>
                {attendanceStatuses.map((s) => (
                  <option key={s} value={s}>{attendanceStatusLabels[s]}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Check In">
              <input type="time" value={attForm.checkIn} onChange={setAtt('checkIn')} className={inputClass} />
            </FormField>
            <FormField label="Check Out">
              <input type="time" value={attForm.checkOut} onChange={setAtt('checkOut')} className={inputClass} />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowMarkAttendance(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={marking} className={btnPrimary}>
              {marking ? 'Saving...' : 'Mark Attendance'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Apply Leave Modal */}
      <Modal open={showApplyLeave} onClose={() => setShowApplyLeave(false)} title="Apply Leave">
        <form onSubmit={handleApplyLeave}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Employee *">
                <select value={leaveForm.employeeId} onChange={setLv('employeeId')} className={selectClass} required>
                  <option value="">Select employee</option>
                  {employees
                    .filter((e: Record<string, unknown>) => e.status === 'active')
                    .map((e: Record<string, unknown>) => (
                      <option key={e.id as string} value={e.id as string}>
                        {e.firstName as string} {e.lastName as string}
                      </option>
                    ))}
                </select>
              </FormField>
            </div>
            <FormField label="Leave Type *">
              <select value={leaveForm.leaveType} onChange={setLv('leaveType')} className={selectClass} required>
                {leaveTypes.map((t) => (
                  <option key={t} value={t}>{leaveTypeLabels[t]}</option>
                ))}
              </select>
            </FormField>
            <div />
            <FormField label="Start Date *">
              <input type="date" value={leaveForm.startDate} onChange={setLv('startDate')} className={inputClass} required />
            </FormField>
            <FormField label="End Date *">
              <input type="date" value={leaveForm.endDate} onChange={setLv('endDate')} className={inputClass} required />
            </FormField>
            <div className="col-span-2">
              <FormField label="Remarks">
                <textarea
                  value={leaveForm.remarks}
                  onChange={setLv('remarks')}
                  className={inputClass + ' h-20 resize-none'}
                  placeholder="Reason for leave..."
                />
              </FormField>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowApplyLeave(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={applying} className={btnPrimary}>
              {applying ? 'Submitting...' : 'Apply Leave'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
