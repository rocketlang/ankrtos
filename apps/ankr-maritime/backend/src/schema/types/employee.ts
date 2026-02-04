import { builder } from '../builder.js';

// ─── Employee PrismaObject ──────────────────────────────────────────────────

builder.prismaObject('Employee', {
  fields: (t) => ({
    id: t.exposeID('id'),
    employeeCode: t.exposeString('employeeCode'),
    firstName: t.exposeString('firstName'),
    lastName: t.exposeString('lastName'),
    email: t.exposeString('email'),
    phone: t.exposeString('phone', { nullable: true }),
    department: t.exposeString('department'),
    designation: t.exposeString('designation'),
    role: t.exposeString('role'),
    reportingTo: t.exposeString('reportingTo', { nullable: true }),
    dateOfJoining: t.expose('dateOfJoining', { type: 'DateTime' }),
    dateOfExit: t.expose('dateOfExit', { type: 'DateTime', nullable: true }),
    employmentType: t.exposeString('employmentType'),
    status: t.exposeString('status'),
    officeLocation: t.exposeString('officeLocation', { nullable: true }),
    salary: t.exposeFloat('salary', { nullable: true }),
    currency: t.exposeString('currency'),
    bankAccount: t.exposeString('bankAccount', { nullable: true }),
    ifscCode: t.exposeString('ifscCode', { nullable: true }),
    panNumber: t.exposeString('panNumber', { nullable: true }),
    aadharNumber: t.exposeString('aadharNumber', { nullable: true }),
    emergencyContact: t.exposeString('emergencyContact', { nullable: true }),
    emergencyPhone: t.exposeString('emergencyPhone', { nullable: true }),
    profilePicture: t.exposeString('profilePicture', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    leaveBalances: t.relation('leaveBalances'),
    attendanceLogs: t.relation('attendanceLogs'),
    payslips: t.relation('payslips'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ─── Custom Type: DepartmentSummary ─────────────────────────────────────────

const DepartmentSummary = builder.objectRef<{
  department: string;
  count: number;
  avgSalary: number;
}>('DepartmentSummary');

DepartmentSummary.implement({
  fields: (t) => ({
    department: t.exposeString('department'),
    count: t.exposeInt('count'),
    avgSalary: t.exposeFloat('avgSalary'),
  }),
});

// ─── Queries ────────────────────────────────────────────────────────────────

builder.queryField('employees', (t) =>
  t.prismaField({
    type: ['Employee'],
    args: {
      department: t.arg.string(),
      status: t.arg.string(),
      role: t.arg.string(),
      officeLocation: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.employee.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.department ? { department: args.department } : {}),
          ...(args.status ? { status: args.status } : {}),
          ...(args.role ? { role: args.role } : {}),
          ...(args.officeLocation ? { officeLocation: args.officeLocation } : {}),
        },
        orderBy: { firstName: 'asc' },
      }),
  }),
);

builder.queryField('employeeByCode', (t) =>
  t.prismaField({
    type: 'Employee',
    nullable: true,
    args: { employeeCode: t.arg.string({ required: true }) },
    resolve: (query, _root, args, ctx) => {
      const orgId = ctx.user?.organizationId;
      if (!orgId) throw new Error('Authentication required');
      return ctx.prisma.employee.findUnique({
        ...query,
        where: {
          employeeCode_organizationId: {
            employeeCode: args.employeeCode,
            organizationId: orgId,
          },
        },
      });
    },
  }),
);

builder.queryField('employeesByDepartment', (t) =>
  t.field({
    type: [DepartmentSummary],
    resolve: async (_root, _args, ctx) => {
      const where = ctx.orgFilter();
      const employees = await ctx.prisma.employee.findMany({
        where: { ...where, status: 'active' },
        select: { department: true, salary: true },
      });

      const deptMap = new Map<string, { count: number; totalSalary: number }>();
      for (const emp of employees) {
        const entry = deptMap.get(emp.department) ?? { count: 0, totalSalary: 0 };
        entry.count += 1;
        entry.totalSalary += emp.salary ?? 0;
        deptMap.set(emp.department, entry);
      }

      return Array.from(deptMap.entries())
        .map(([department, { count, totalSalary }]) => ({
          department,
          count,
          avgSalary: count > 0 ? Math.round((totalSalary / count) * 100) / 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);
    },
  }),
);

// ─── Mutations ──────────────────────────────────────────────────────────────

builder.mutationField('createEmployee', (t) =>
  t.prismaField({
    type: 'Employee',
    args: {
      firstName: t.arg.string({ required: true }),
      lastName: t.arg.string({ required: true }),
      email: t.arg.string({ required: true }),
      phone: t.arg.string(),
      department: t.arg.string({ required: true }),
      designation: t.arg.string({ required: true }),
      role: t.arg.string({ required: true }),
      reportingTo: t.arg.string(),
      dateOfJoining: t.arg({ type: 'DateTime', required: true }),
      employmentType: t.arg.string(),
      officeLocation: t.arg.string(),
      salary: t.arg.float(),
      currency: t.arg.string(),
      bankAccount: t.arg.string(),
      ifscCode: t.arg.string(),
      panNumber: t.arg.string(),
      aadharNumber: t.arg.string(),
      emergencyContact: t.arg.string(),
      emergencyPhone: t.arg.string(),
      profilePicture: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.orgId();

      // Auto-generate employeeCode: EMP-001, EMP-002, ...
      const lastEmployee = await ctx.prisma.employee.findFirst({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        select: { employeeCode: true },
      });

      let nextNum = 1;
      if (lastEmployee?.employeeCode) {
        const match = lastEmployee.employeeCode.match(/EMP-(\d+)/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      const employeeCode = `EMP-${String(nextNum).padStart(3, '0')}`;

      return ctx.prisma.employee.create({
        ...query,
        data: {
          employeeCode,
          firstName: args.firstName,
          lastName: args.lastName,
          email: args.email,
          phone: args.phone ?? undefined,
          department: args.department,
          designation: args.designation,
          role: args.role,
          reportingTo: args.reportingTo ?? undefined,
          dateOfJoining: args.dateOfJoining,
          employmentType: args.employmentType ?? 'full_time',
          officeLocation: args.officeLocation ?? undefined,
          salary: args.salary ?? undefined,
          currency: args.currency ?? 'INR',
          bankAccount: args.bankAccount ?? undefined,
          ifscCode: args.ifscCode ?? undefined,
          panNumber: args.panNumber ?? undefined,
          aadharNumber: args.aadharNumber ?? undefined,
          emergencyContact: args.emergencyContact ?? undefined,
          emergencyPhone: args.emergencyPhone ?? undefined,
          profilePicture: args.profilePicture ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('updateEmployee', (t) =>
  t.prismaField({
    type: 'Employee',
    args: {
      id: t.arg.string({ required: true }),
      firstName: t.arg.string(),
      lastName: t.arg.string(),
      email: t.arg.string(),
      phone: t.arg.string(),
      department: t.arg.string(),
      designation: t.arg.string(),
      role: t.arg.string(),
      reportingTo: t.arg.string(),
      employmentType: t.arg.string(),
      status: t.arg.string(),
      officeLocation: t.arg.string(),
      salary: t.arg.float(),
      currency: t.arg.string(),
      bankAccount: t.arg.string(),
      ifscCode: t.arg.string(),
      panNumber: t.arg.string(),
      aadharNumber: t.arg.string(),
      emergencyContact: t.arg.string(),
      emergencyPhone: t.arg.string(),
      profilePicture: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.employee.update({
        ...query,
        where: { id: args.id },
        data: {
          ...(args.firstName && { firstName: args.firstName }),
          ...(args.lastName && { lastName: args.lastName }),
          ...(args.email && { email: args.email }),
          ...(args.phone !== undefined && { phone: args.phone }),
          ...(args.department && { department: args.department }),
          ...(args.designation && { designation: args.designation }),
          ...(args.role && { role: args.role }),
          ...(args.reportingTo !== undefined && { reportingTo: args.reportingTo }),
          ...(args.employmentType && { employmentType: args.employmentType }),
          ...(args.status && { status: args.status }),
          ...(args.officeLocation !== undefined && { officeLocation: args.officeLocation }),
          ...(args.salary != null && { salary: args.salary }),
          ...(args.currency && { currency: args.currency }),
          ...(args.bankAccount !== undefined && { bankAccount: args.bankAccount }),
          ...(args.ifscCode !== undefined && { ifscCode: args.ifscCode }),
          ...(args.panNumber !== undefined && { panNumber: args.panNumber }),
          ...(args.aadharNumber !== undefined && { aadharNumber: args.aadharNumber }),
          ...(args.emergencyContact !== undefined && { emergencyContact: args.emergencyContact }),
          ...(args.emergencyPhone !== undefined && { emergencyPhone: args.emergencyPhone }),
          ...(args.profilePicture !== undefined && { profilePicture: args.profilePicture }),
        },
      }),
  }),
);

builder.mutationField('terminateEmployee', (t) =>
  t.prismaField({
    type: 'Employee',
    args: {
      id: t.arg.string({ required: true }),
      dateOfExit: t.arg({ type: 'DateTime', required: true }),
      remarks: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const employee = await ctx.prisma.employee.findUniqueOrThrow({
        where: { id: args.id },
      });

      if (employee.status === 'terminated') {
        throw new Error('Employee is already terminated');
      }

      return ctx.prisma.employee.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'terminated',
          dateOfExit: args.dateOfExit,
        },
      });
    },
  }),
);
