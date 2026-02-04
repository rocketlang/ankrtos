import { useQuery, useMutation, gql } from '@apollo/client';
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next';;
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from '../components/Modal';

// ── GraphQL ──────────────────────────────────────────────────────────────────

const EMPLOYEES_QUERY = gql`
  query Employees {
    employees {
      id employeeCode firstName lastName email department designation role
      status dateOfJoining officeLocation salary currency
    }
  }
`;

const DEPARTMENT_SUMMARY = gql`
  query DepartmentSummary {
    employeesByDepartment { department count avgSalary }
  }
`;

const PAYROLL_SUMMARY = gql`
  query PayrollSummary($year: Int!, $month: Int!) {
    payrollSummary(year: $year, month: $month) {
      month year totalGross totalDeductions totalNet employeeCount
    }
  }
`;

const TRAINING_DASHBOARD = gql`
  query TrainingDashboard {
    trainingDashboard {
      totalTrainings completedCount upcomingCount expiringSoon complianceRate
    }
  }
`;

const PAYSLIPS_QUERY = gql`
  query Payslips($year: Int!, $month: Int!) {
    payslips(year: $year, month: $month) {
      id employeeId employee { firstName lastName employeeCode }
      month year basic hra da specialAllowance grossEarnings
      pf esi tds professionalTax totalDeductions netPay status
    }
  }
`;

const TRAININGS_QUERY = gql`
  query Trainings {
    trainings {
      id employeeId employee { firstName lastName }
      trainingTitle category provider startDate endDate
      status score certificateUrl
    }
  }
`;

const CREATE_EMPLOYEE = gql`
  mutation CreateEmployee(
    $firstName: String!, $lastName: String!, $email: String!, $phone: String,
    $department: String!, $designation: String!, $role: String!,
    $dateOfJoining: DateTime!, $officeLocation: String!,
    $salary: Float!, $currency: String!, $bankAccount: String
  ) {
    createEmployee(
      firstName: $firstName, lastName: $lastName, email: $email, phone: $phone,
      department: $department, designation: $designation, role: $role,
      dateOfJoining: $dateOfJoining, officeLocation: $officeLocation,
      salary: $salary, currency: $currency, bankAccount: $bankAccount
    ) { id }
  }
`;

const TERMINATE_EMPLOYEE = gql`
  mutation TerminateEmployee($id: String!, $dateOfExit: DateTime!) {
    terminateEmployee(id: $id, dateOfExit: $dateOfExit) { id }
  }
`;

const GENERATE_PAYROLL = gql`
  mutation GeneratePayroll($year: Int!, $month: Int!) {
    generatePayroll(year: $year, month: $month) { id }
  }
`;

const PROCESS_PAYROLL = gql`
  mutation ProcessPayroll($year: Int!, $month: Int!) {
    processAllPayslips(year: $year, month: $month)
  }
`;

const CREATE_TRAINING = gql`
  mutation CreateTraining(
    $employeeId: String!, $trainingTitle: String!, $category: String!,
    $provider: String, $startDate: DateTime!, $endDate: DateTime,
    $duration: Int, $cost: Float
  ) {
    createTraining(
      employeeId: $employeeId, trainingTitle: $trainingTitle, category: $category,
      provider: $provider, startDate: $startDate, endDate: $endDate,
      duration: $duration, cost: $cost
    ) { id }
  }
`;

// ── Constants ────────────────────────────────────────────────────────────────

const departments = ['chartering', 'operations', 'snp', 'finance', 'it', 'hr', 'legal', 'management'];
const deptLabels: Record<string, string> = {
  chartering: 'Chartering', operations: 'Operations', snp: 'S&P',
  finance: 'Finance', it: 'IT', hr: 'HR', legal: 'Legal', management: 'Management',
};

const roles = ['office_staff', 'crew', 'management'];
const roleLabels: Record<string, string> = {
  office_staff: 'Office Staff', crew: 'Crew', management: 'Management',
};

const offices = ['Mumbai', 'Singapore', 'London', 'Dubai'];

const trainingCategories = ['SOLAS', 'MARPOL', 'ISM', 'ISPS', 'STCW', 'safety', 'technical', 'soft_skills', 'compliance'];
const categoryLabels: Record<string, string> = {
  SOLAS: 'SOLAS', MARPOL: 'MARPOL', ISM: 'ISM', ISPS: 'ISPS', STCW: 'STCW',
  safety: 'Safety', technical: 'Technical', soft_skills: 'Soft Skills', compliance: 'Compliance',
};

const statusBadge: Record<string, string> = {
  active: 'bg-green-900/50 text-green-400',
  on_leave: 'bg-yellow-900/50 text-yellow-400',
  resigned: 'bg-red-900/50 text-red-400',
  terminated: 'bg-red-900/50 text-red-400',
  probation: 'bg-blue-900/50 text-blue-400',
};

const deptColors: Record<string, string> = {
  chartering: 'bg-blue-500', operations: 'bg-emerald-500', snp: 'bg-purple-500',
  finance: 'bg-amber-500', it: 'bg-cyan-500', hr: 'bg-pink-500',
  legal: 'bg-orange-500', management: 'bg-indigo-500',
};

const categoryBadge: Record<string, string> = {
  SOLAS: 'bg-blue-900/50 text-blue-400', MARPOL: 'bg-emerald-900/50 text-emerald-400',
  ISM: 'bg-purple-900/50 text-purple-400', ISPS: 'bg-amber-900/50 text-amber-400',
  STCW: 'bg-cyan-900/50 text-cyan-400', safety: 'bg-red-900/50 text-red-400',
  technical: 'bg-indigo-900/50 text-indigo-400', soft_skills: 'bg-pink-900/50 text-pink-400',
  compliance: 'bg-orange-900/50 text-orange-400',
};

const trainingStatusBadge: Record<string, string> = {
  completed: 'bg-green-900/50 text-green-400',
  in_progress: 'bg-blue-900/50 text-blue-400',
  scheduled: 'bg-yellow-900/50 text-yellow-400',
  expired: 'bg-red-900/50 text-red-400',
  cancelled: 'bg-maritime-700 text-maritime-400',
};

const payslipStatusBadge: Record<string, string> = {
  draft: 'bg-yellow-900/50 text-yellow-400',
  processed: 'bg-blue-900/50 text-blue-400',
  paid: 'bg-green-900/50 text-green-400',
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const emptyEmployeeForm = {
  firstName: '', lastName: '', email: '', phone: '',
  department: 'chartering', designation: '', role: 'office_staff',
  dateOfJoining: '', officeLocation: 'Mumbai',
  salary: '', currency: 'USD', bankAccount: '',
};

const emptyTrainingForm = {
  employeeId: '', trainingTitle: '', category: 'SOLAS',
  provider: '', startDate: '', endDate: '', duration: '', cost: '',
};

// ── Component ────────────────────────────────────────────────────────────────

export function HRDashboard() {
  const [activeTab, setActiveTab] = useState<'directory' | 'payroll' | 'training'>('directory');
  const [search, setSearch] = useState('');
  const [showCreateEmp, setShowCreateEmp] = useState(false);
  const [showTerminate, setShowTerminate] = useState<string | null>(null);
  const [terminateDate, setTerminateDate] = useState('');
  const [showCreateTraining, setShowCreateTraining] = useState(false);
  const [empForm, setEmpForm] = useState(emptyEmployeeForm);
  const [trainingForm, setTrainingForm] = useState(emptyTrainingForm);

  const now = new Date();
  const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(now.getFullYear());

  // Queries
  const { data: empData, loading: empLoading, refetch: refetchEmp } = useQuery(EMPLOYEES_QUERY);
  const { data: deptData } = useQuery(DEPARTMENT_SUMMARY);
  const { data: payrollData, loading: payrollLoading, refetch: refetchPayroll } = useQuery(PAYROLL_SUMMARY, {
    variables: { year: payrollYear, month: payrollMonth },
  });
  const { data: payslipData, refetch: refetchPayslips } = useQuery(PAYSLIPS_QUERY, {
    variables: { year: payrollYear, month: payrollMonth },
    skip: activeTab !== 'payroll',
  });
  const { data: trainingDashData } = useQuery(TRAINING_DASHBOARD, { skip: activeTab !== 'training' });
  const { data: trainingListData, loading: trainingLoading, refetch: refetchTrainings } = useQuery(TRAININGS_QUERY, {
    skip: activeTab !== 'training',
  });

  // Mutations
  const [createEmployee, { loading: creating }] = useMutation(CREATE_EMPLOYEE);
  const [terminateEmployee] = useMutation(TERMINATE_EMPLOYEE);
  const [generatePayroll, { loading: generating }] = useMutation(GENERATE_PAYROLL);
  const [processPayroll, { loading: processing }] = useMutation(PROCESS_PAYROLL);
  const [createTraining, { loading: creatingTraining }] = useMutation(CREATE_TRAINING);

  // Derived data
  const employees = empData?.employees ?? [];
  const deptSummary = deptData?.employeesByDepartment ?? [];
  const payroll = payrollData?.payrollSummary;
  const payslips = payslipData?.payslips ?? [];
  const trainingDash = trainingDashData?.trainingDashboard;
  const trainings = trainingListData?.trainings ?? [];

  const filteredEmployees = useMemo(() => {
    if (!search) return employees;
    const q = search.toLowerCase();
    return employees.filter((e: Record<string, unknown>) =>
      ((e.firstName as string) + ' ' + (e.lastName as string)).toLowerCase().includes(q) ||
      (e.email as string)?.toLowerCase().includes(q) ||
      (e.employeeCode as string)?.toLowerCase().includes(q) ||
      (e.department as string)?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const activeCount = employees.filter((e: Record<string, unknown>) => e.status === 'active').length;
  const uniqueDepts = new Set(employees.map((e: Record<string, unknown>) => e.department)).size;

  const avgTenure = useMemo(() => {
    const actives = employees.filter((e: Record<string, unknown>) => e.status === 'active' && e.dateOfJoining);
    if (actives.length === 0) return 0;
    const totalYears = actives.reduce((sum: number, e: Record<string, unknown>) => {
      const joined = new Date(e.dateOfJoining as string);
      return sum + (Date.now() - joined.getTime()) / (365.25 * 86400000);
    }, 0);
    return (totalYears / actives.length).toFixed(1);
  }, [employees]);

  const maxDeptCount = Math.max(...deptSummary.map((d: Record<string, unknown>) => d.count as number), 1);

  // Handlers
  const setEmp = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEmpForm((f) => ({ ...f, [field]: e.target.value }));

  const setTrn = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setTrainingForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEmployee({
      variables: {
        ...empForm,
        salary: Number(empForm.salary),
        dateOfJoining: new Date(empForm.dateOfJoining).toISOString(),
        phone: empForm.phone || null,
        bankAccount: empForm.bankAccount || null,
      },
    });
    setEmpForm(emptyEmployeeForm);
    setShowCreateEmp(false);
    refetchEmp();
  };

  const handleTerminate = async () => {
    if (!showTerminate || !terminateDate) return;
    await terminateEmployee({
      variables: { id: showTerminate, dateOfExit: new Date(terminateDate).toISOString() },
    });
    setShowTerminate(null);
    setTerminateDate('');
    refetchEmp();
  };

  const handleGeneratePayroll = async () => {
    await generatePayroll({ variables: { year: payrollYear, month: payrollMonth } });
    refetchPayroll();
    refetchPayslips();
  };

  const handleProcessAll = async () => {
    await processPayroll({ variables: { year: payrollYear, month: payrollMonth } });
    refetchPayroll();
    refetchPayslips();
  };

  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTraining({
      variables: {
        employeeId: trainingForm.employeeId,
        trainingTitle: trainingForm.trainingTitle,
        category: trainingForm.category,
        provider: trainingForm.provider || null,
        startDate: new Date(trainingForm.startDate).toISOString(),
        endDate: trainingForm.endDate ? new Date(trainingForm.endDate).toISOString() : null,
        duration: trainingForm.duration ? Number(trainingForm.duration) : null,
        cost: trainingForm.cost ? Number(trainingForm.cost) : null,
      },
    });
    setTrainingForm(emptyTrainingForm);
    setShowCreateTraining(false);
    refetchTrainings();
  };

  const fmt = (n: number | null | undefined) =>
    n != null ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const tabs = [
    { key: 'directory' as const, label: 'Directory' },
    { key: 'payroll' as const, label: 'Payroll' },
    { key: 'training' as const, label: 'Training' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">HR Dashboard</h1>
          <p className="text-maritime-400 text-sm mt-1">
            Employee directory, payroll management, and training compliance
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

      {/* ═══════════════ TAB 1: DIRECTORY ═══════════════ */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Employees', value: employees.length, color: 'text-white', border: 'border-maritime-500' },
              { label: 'Active', value: activeCount, color: 'text-green-400', border: 'border-green-500' },
              { label: 'Departments', value: uniqueDepts, color: 'text-blue-400', border: 'border-blue-500' },
              { label: 'Avg Tenure', value: `${avgTenure} yr`, color: 'text-amber-400', border: 'border-amber-500' },
            ].map((s) => (
              <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
                <p className="text-maritime-500 text-xs">{s.label}</p>
                <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Department Breakdown */}
          {deptSummary.length > 0 && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-5">
              <h3 className="text-white text-sm font-medium mb-4">Department Breakdown</h3>
              <div className="space-y-3">
                {deptSummary.map((d: Record<string, unknown>) => (
                  <div key={d.department as string} className="flex items-center gap-3">
                    <span className="text-maritime-300 text-xs w-24 truncate">
                      {deptLabels[d.department as string] ?? d.department}
                    </span>
                    <div className="flex-1 bg-maritime-900 rounded-full h-5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${deptColors[d.department as string] ?? 'bg-maritime-500'} flex items-center justify-end pr-2`}
                        style={{ width: `${((d.count as number) / maxDeptCount) * 100}%`, minWidth: '2rem' }}
                      >
                        <span className="text-[10px] text-white font-bold">{d.count as number}</span>
                      </div>
                    </div>
                    <span className="text-maritime-500 text-[10px] w-28 text-right">
                      Avg: {fmt(d.avgSalary as number)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search + Actions */}
          <div className="flex items-center justify-between">
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-maritime-800 border border-maritime-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-72"
            />
            <button onClick={() => setShowCreateEmp(true)} className={btnPrimary}>
              + Add Employee
            </button>
          </div>

          {/* Employee Table */}
          {empLoading && <p className="text-maritime-400">Loading employees...</p>}
          {!empLoading && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-maritime-700 text-maritime-400 text-xs">
                      <th className="text-left px-4 py-3 font-medium">Code</th>
                      <th className="text-left px-4 py-3 font-medium">Name</th>
                      <th className="text-left px-4 py-3 font-medium">Email</th>
                      <th className="text-left px-4 py-3 font-medium">Department</th>
                      <th className="text-left px-4 py-3 font-medium">Designation</th>
                      <th className="text-left px-4 py-3 font-medium">Office</th>
                      <th className="text-center px-4 py-3 font-medium">Status</th>
                      <th className="text-left px-4 py-3 font-medium">Joined</th>
                      <th className="text-center px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-maritime-500">
                          No employees found
                        </td>
                      </tr>
                    )}
                    {filteredEmployees.map((emp: Record<string, unknown>) => (
                      <tr
                        key={emp.id as string}
                        className="border-b border-maritime-700/30 hover:bg-maritime-700/20"
                      >
                        <td className="px-4 py-3 text-maritime-300 font-mono text-xs">
                          {emp.employeeCode as string}
                        </td>
                        <td className="px-4 py-3 text-white text-xs font-medium">
                          {emp.firstName as string} {emp.lastName as string}
                        </td>
                        <td className="px-4 py-3 text-maritime-300 text-xs">{emp.email as string}</td>
                        <td className="px-4 py-3 text-maritime-300 text-xs">
                          {deptLabels[emp.department as string] ?? emp.department}
                        </td>
                        <td className="px-4 py-3 text-maritime-300 text-xs">{emp.designation as string}</td>
                        <td className="px-4 py-3 text-maritime-300 text-xs">
                          {emp.officeLocation as string}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                              statusBadge[emp.status as string] ?? 'bg-maritime-700 text-maritime-400'
                            }`}
                          >
                            {(emp.status as string)?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-maritime-300 text-xs">
                          {fmtDate(emp.dateOfJoining as string)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {emp.status === 'active' && (
                            <button
                              onClick={() => {
                                setShowTerminate(emp.id as string);
                                setTerminateDate('');
                              }}
                              className="text-red-400/60 hover:text-red-400 text-[10px] bg-maritime-700/50 px-2 py-0.5 rounded"
                            >
                              Terminate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ TAB 2: PAYROLL ═══════════════ */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Month/Year Selector */}
          <div className="flex items-center gap-3">
            <select
              value={payrollMonth}
              onChange={(e) => setPayrollMonth(Number(e.target.value))}
              className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-2"
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={payrollYear}
              onChange={(e) => setPayrollYear(Number(e.target.value))}
              className="bg-maritime-800 border border-maritime-700 text-white text-sm rounded px-3 py-2"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button onClick={handleGeneratePayroll} disabled={generating} className={btnPrimary}>
              {generating ? 'Generating...' : 'Generate Payroll'}
            </button>
            <button onClick={handleProcessAll} disabled={processing} className={btnSecondary}>
              {processing ? 'Processing...' : 'Process All'}
            </button>
          </div>

          {/* Payroll Summary Cards */}
          {payrollLoading && <p className="text-maritime-400">Loading payroll...</p>}
          {payroll && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Gross Earnings', value: fmt(payroll.totalGross), color: 'text-white', border: 'border-blue-500' },
                { label: 'Total Deductions', value: fmt(payroll.totalDeductions), color: 'text-red-400', border: 'border-red-500' },
                { label: 'Net Pay', value: fmt(payroll.totalNet), color: 'text-green-400', border: 'border-green-500' },
                { label: 'Head Count', value: payroll.employeeCount, color: 'text-amber-400', border: 'border-amber-500' },
              ].map((s) => (
                <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
                  <p className="text-maritime-500 text-xs">{s.label}</p>
                  <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Payslip Table */}
          {payslips.length > 0 && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-maritime-700 text-maritime-400 text-[10px]">
                      <th className="text-left px-3 py-3 font-medium">Employee</th>
                      <th className="text-right px-3 py-3 font-medium">Basic</th>
                      <th className="text-right px-3 py-3 font-medium">HRA</th>
                      <th className="text-right px-3 py-3 font-medium">DA</th>
                      <th className="text-right px-3 py-3 font-medium">Special</th>
                      <th className="text-right px-3 py-3 font-medium">Gross</th>
                      <th className="text-right px-3 py-3 font-medium">PF</th>
                      <th className="text-right px-3 py-3 font-medium">ESI</th>
                      <th className="text-right px-3 py-3 font-medium">TDS</th>
                      <th className="text-right px-3 py-3 font-medium">PT</th>
                      <th className="text-right px-3 py-3 font-medium">Total Ded</th>
                      <th className="text-right px-3 py-3 font-medium">Net Pay</th>
                      <th className="text-center px-3 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map((p: Record<string, unknown>) => {
                      const emp = p.employee as Record<string, unknown> | null;
                      return (
                        <tr
                          key={p.id as string}
                          className="border-b border-maritime-700/30 hover:bg-maritime-700/20"
                        >
                          <td className="px-3 py-2 text-white text-xs font-medium whitespace-nowrap">
                            {emp ? `${emp.firstName} ${emp.lastName}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-maritime-300 text-xs text-right font-mono">
                            {fmt(p.basic as number)}
                          </td>
                          <td className="px-3 py-2 text-maritime-300 text-xs text-right font-mono">
                            {fmt(p.hra as number)}
                          </td>
                          <td className="px-3 py-2 text-maritime-300 text-xs text-right font-mono">
                            {fmt(p.da as number)}
                          </td>
                          <td className="px-3 py-2 text-maritime-300 text-xs text-right font-mono">
                            {fmt(p.specialAllowance as number)}
                          </td>
                          <td className="px-3 py-2 text-white text-xs text-right font-mono font-medium">
                            {fmt(p.grossEarnings as number)}
                          </td>
                          <td className="px-3 py-2 text-red-400/70 text-xs text-right font-mono">
                            {fmt(p.pf as number)}
                          </td>
                          <td className="px-3 py-2 text-red-400/70 text-xs text-right font-mono">
                            {fmt(p.esi as number)}
                          </td>
                          <td className="px-3 py-2 text-red-400/70 text-xs text-right font-mono">
                            {fmt(p.tds as number)}
                          </td>
                          <td className="px-3 py-2 text-red-400/70 text-xs text-right font-mono">
                            {fmt(p.professionalTax as number)}
                          </td>
                          <td className="px-3 py-2 text-red-400 text-xs text-right font-mono font-medium">
                            {fmt(p.totalDeductions as number)}
                          </td>
                          <td className="px-3 py-2 text-green-400 text-xs text-right font-mono font-medium">
                            {fmt(p.netPay as number)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                                payslipStatusBadge[p.status as string] ?? 'bg-maritime-700 text-maritime-400'
                              }`}
                            >
                              {p.status as string}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!payrollLoading && payslips.length === 0 && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-8 text-center">
              <p className="text-maritime-500 text-sm">
                No payslips for {months[payrollMonth - 1]} {payrollYear}. Click "Generate Payroll" to create.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ TAB 3: TRAINING ═══════════════ */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          {/* Training Dashboard Cards */}
          {trainingDash && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Total Trainings', value: trainingDash.totalTrainings, color: 'text-white', border: 'border-maritime-500' },
                { label: 'Completed', value: trainingDash.completedCount, color: 'text-green-400', border: 'border-green-500' },
                { label: 'Upcoming', value: trainingDash.upcomingCount, color: 'text-blue-400', border: 'border-blue-500' },
                {
                  label: 'Expiring Soon',
                  value: trainingDash.expiringSoon,
                  color: trainingDash.expiringSoon > 0 ? 'text-red-400' : 'text-maritime-400',
                  border: trainingDash.expiringSoon > 0 ? 'border-red-500' : 'border-maritime-500',
                },
                {
                  label: 'Compliance Rate',
                  value: `${trainingDash.complianceRate?.toFixed(1) ?? 0}%`,
                  color: (trainingDash.complianceRate ?? 0) >= 90 ? 'text-green-400' : 'text-amber-400',
                  border: (trainingDash.complianceRate ?? 0) >= 90 ? 'border-green-500' : 'border-amber-500',
                },
              ].map((s) => (
                <div key={s.label} className={`bg-maritime-800 border-l-4 ${s.border} rounded-lg p-4`}>
                  <p className="text-maritime-500 text-xs">{s.label}</p>
                  <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end">
            <button onClick={() => setShowCreateTraining(true)} className={btnPrimary}>
              + Add Training
            </button>
          </div>

          {/* Training Table */}
          {trainingLoading && <p className="text-maritime-400">Loading trainings...</p>}
          {!trainingLoading && (
            <div className="bg-maritime-800 border border-maritime-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-maritime-700 text-maritime-400 text-xs">
                      <th className="text-left px-4 py-3 font-medium">Employee</th>
                      <th className="text-left px-4 py-3 font-medium">Title</th>
                      <th className="text-center px-4 py-3 font-medium">Category</th>
                      <th className="text-left px-4 py-3 font-medium">Provider</th>
                      <th className="text-left px-4 py-3 font-medium">Start Date</th>
                      <th className="text-center px-4 py-3 font-medium">Status</th>
                      <th className="text-right px-4 py-3 font-medium">Score</th>
                      <th className="text-center px-4 py-3 font-medium">Certificate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainings.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-maritime-500">
                          No training records found
                        </td>
                      </tr>
                    )}
                    {trainings.map((t: Record<string, unknown>) => {
                      const emp = t.employee as Record<string, unknown> | null;
                      return (
                        <tr
                          key={t.id as string}
                          className="border-b border-maritime-700/30 hover:bg-maritime-700/20"
                        >
                          <td className="px-4 py-3 text-white text-xs font-medium">
                            {emp ? `${emp.firstName} ${emp.lastName}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-maritime-300 text-xs">
                            {t.trainingTitle as string}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                categoryBadge[t.category as string] ?? 'bg-maritime-700 text-maritime-400'
                              }`}
                            >
                              {categoryLabels[t.category as string] ?? t.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-maritime-300 text-xs">
                            {(t.provider as string) || '-'}
                          </td>
                          <td className="px-4 py-3 text-maritime-300 text-xs">
                            {fmtDate(t.startDate as string)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                                trainingStatusBadge[t.status as string] ?? 'bg-maritime-700 text-maritime-400'
                              }`}
                            >
                              {(t.status as string)?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-maritime-300 text-xs text-right font-mono">
                            {(t.score as number) != null ? `${t.score}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {(t.certificateUrl as string) ? (
                              <a
                                href={t.certificateUrl as string}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-[10px] underline"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-maritime-600 text-[10px]">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Create Employee Modal */}
      <Modal open={showCreateEmp} onClose={() => setShowCreateEmp(false)} title="Add Employee">
        <form onSubmit={handleCreateEmployee}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name *">
              <input value={empForm.firstName} onChange={setEmp('firstName')} className={inputClass} required />
            </FormField>
            <FormField label="Last Name *">
              <input value={empForm.lastName} onChange={setEmp('lastName')} className={inputClass} required />
            </FormField>
            <FormField label="Email *">
              <input type="email" value={empForm.email} onChange={setEmp('email')} className={inputClass} required />
            </FormField>
            <FormField label="Phone">
              <input value={empForm.phone} onChange={setEmp('phone')} className={inputClass} placeholder="+91..." />
            </FormField>
            <FormField label="Department *">
              <select value={empForm.department} onChange={setEmp('department')} className={selectClass} required>
                {departments.map((d) => (
                  <option key={d} value={d}>{deptLabels[d]}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Designation *">
              <input value={empForm.designation} onChange={setEmp('designation')} className={inputClass} required placeholder="Senior Analyst" />
            </FormField>
            <FormField label="Role *">
              <select value={empForm.role} onChange={setEmp('role')} className={selectClass} required>
                {roles.map((r) => (
                  <option key={r} value={r}>{roleLabels[r]}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Date of Joining *">
              <input type="date" value={empForm.dateOfJoining} onChange={setEmp('dateOfJoining')} className={inputClass} required />
            </FormField>
            <FormField label="Office Location *">
              <select value={empForm.officeLocation} onChange={setEmp('officeLocation')} className={selectClass} required>
                {offices.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Salary *">
              <input type="number" value={empForm.salary} onChange={setEmp('salary')} className={inputClass} required placeholder="85000" />
            </FormField>
            <FormField label="Currency">
              <select value={empForm.currency} onChange={setEmp('currency')} className={selectClass}>
                {['USD', 'INR', 'SGD', 'GBP', 'AED', 'EUR'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Bank Account">
              <input value={empForm.bankAccount} onChange={setEmp('bankAccount')} className={inputClass} placeholder="XXXX-XXXX-XXXX" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreateEmp(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={creating} className={btnPrimary}>
              {creating ? 'Creating...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Terminate Employee Modal */}
      <Modal open={!!showTerminate} onClose={() => setShowTerminate(null)} title="Terminate Employee">
        <p className="text-maritime-300 text-sm mb-4">
          Are you sure you want to terminate this employee? This action cannot be undone.
        </p>
        <FormField label="Date of Exit *">
          <input
            type="date"
            value={terminateDate}
            onChange={(e) => setTerminateDate(e.target.value)}
            className={inputClass}
            required
          />
        </FormField>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowTerminate(null)} className={btnSecondary}>
            Cancel
          </button>
          <button
            onClick={handleTerminate}
            disabled={!terminateDate}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            Confirm Termination
          </button>
        </div>
      </Modal>

      {/* Create Training Modal */}
      <Modal open={showCreateTraining} onClose={() => setShowCreateTraining(false)} title="Add Training">
        <form onSubmit={handleCreateTraining}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Employee *">
              <select value={trainingForm.employeeId} onChange={setTrn('employeeId')} className={selectClass} required>
                <option value="">Select employee</option>
                {employees.map((e: Record<string, unknown>) => (
                  <option key={e.id as string} value={e.id as string}>
                    {e.firstName as string} {e.lastName as string}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Category *">
              <select value={trainingForm.category} onChange={setTrn('category')} className={selectClass} required>
                {trainingCategories.map((c) => (
                  <option key={c} value={c}>{categoryLabels[c]}</option>
                ))}
              </select>
            </FormField>
            <div className="col-span-2">
              <FormField label="Training Title *">
                <input value={trainingForm.trainingTitle} onChange={setTrn('trainingTitle')} className={inputClass} required placeholder="Basic Safety Training" />
              </FormField>
            </div>
            <FormField label="Provider">
              <input value={trainingForm.provider} onChange={setTrn('provider')} className={inputClass} placeholder="IMO Academy" />
            </FormField>
            <FormField label="Start Date *">
              <input type="date" value={trainingForm.startDate} onChange={setTrn('startDate')} className={inputClass} required />
            </FormField>
            <FormField label="End Date">
              <input type="date" value={trainingForm.endDate} onChange={setTrn('endDate')} className={inputClass} />
            </FormField>
            <FormField label="Duration (hours)">
              <input type="number" value={trainingForm.duration} onChange={setTrn('duration')} className={inputClass} placeholder="40" />
            </FormField>
            <FormField label="Cost">
              <input type="number" value={trainingForm.cost} onChange={setTrn('cost')} className={inputClass} placeholder="500" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreateTraining(false)} className={btnSecondary}>
              Cancel
            </button>
            <button type="submit" disabled={creatingTraining} className={btnPrimary}>
              {creatingTraining ? 'Creating...' : 'Add Training'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
