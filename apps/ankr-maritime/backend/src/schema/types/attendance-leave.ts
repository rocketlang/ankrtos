import { builder } from '../builder.js';

// ─── AttendanceLog PrismaObject ─────────────────────────────────────────────

builder.prismaObject('AttendanceLog', {
  fields: (t) => ({
    id: t.exposeID('id'),
    employeeId: t.exposeString('employeeId'),
    employee: t.relation('employee'),
    date: t.expose('date', { type: 'DateTime' }),
    checkIn: t.expose('checkIn', { type: 'DateTime', nullable: true }),
    checkOut: t.expose('checkOut', { type: 'DateTime', nullable: true }),
    hoursWorked: t.exposeFloat('hoursWorked', { nullable: true }),
    status: t.exposeString('status'),
    leaveType: t.exposeString('leaveType', { nullable: true }),
    remarks: t.exposeString('remarks', { nullable: true }),
    approvedBy: t.exposeString('approvedBy', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ─── LeaveBalance PrismaObject ──────────────────────────────────────────────

builder.prismaObject('LeaveBalance', {
  fields: (t) => ({
    id: t.exposeID('id'),
    employeeId: t.exposeString('employeeId'),
    employee: t.relation('employee'),
    year: t.exposeInt('year'),
    leaveType: t.exposeString('leaveType'),
    entitled: t.exposeFloat('entitled'),
    taken: t.exposeFloat('taken'),
    pending: t.exposeFloat('pending'),
    balance: t.exposeFloat('balance'),
    carriedForward: t.exposeFloat('carriedForward'),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ─── Custom Type: AttendanceSummary ─────────────────────────────────────────

const AttendanceSummary = builder.objectRef<{
  month: string;
  presentDays: number;
  absentDays: number;
  wfhDays: number;
  leaveDays: number;
  avgHoursWorked: number;
}>('AttendanceSummary');

AttendanceSummary.implement({
  fields: (t) => ({
    month: t.exposeString('month'),
    presentDays: t.exposeInt('presentDays'),
    absentDays: t.exposeInt('absentDays'),
    wfhDays: t.exposeInt('wfhDays'),
    leaveDays: t.exposeInt('leaveDays'),
    avgHoursWorked: t.exposeFloat('avgHoursWorked'),
  }),
});

// ─── Queries ────────────────────────────────────────────────────────────────

builder.queryField('attendanceLogs', (t) =>
  t.prismaField({
    type: ['AttendanceLog'],
    args: {
      employeeId: t.arg.string(),
      status: t.arg.string(),
      dateFrom: t.arg({ type: 'DateTime' }),
      dateTo: t.arg({ type: 'DateTime' }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.attendanceLog.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.employeeId ? { employeeId: args.employeeId } : {}),
          ...(args.status ? { status: args.status } : {}),
          ...(args.dateFrom || args.dateTo
            ? {
                date: {
                  ...(args.dateFrom ? { gte: args.dateFrom } : {}),
                  ...(args.dateTo ? { lte: args.dateTo } : {}),
                },
              }
            : {}),
        },
        orderBy: { date: 'desc' },
      }),
  }),
);

builder.queryField('leaveBalances', (t) =>
  t.prismaField({
    type: ['LeaveBalance'],
    args: {
      employeeId: t.arg.string(),
      year: t.arg.int(),
      leaveType: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.leaveBalance.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.employeeId ? { employeeId: args.employeeId } : {}),
          ...(args.year ? { year: args.year } : {}),
          ...(args.leaveType ? { leaveType: args.leaveType } : {}),
        },
        orderBy: [{ year: 'desc' }, { leaveType: 'asc' }],
      }),
  }),
);

builder.queryField('attendanceSummary', (t) =>
  t.field({
    type: [AttendanceSummary],
    args: {
      employeeId: t.arg.string({ required: true }),
      year: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const logs = await ctx.prisma.attendanceLog.findMany({
        where: {
          ...ctx.orgFilter(),
          employeeId: args.employeeId,
          date: {
            gte: new Date(args.year, 0, 1),
            lt: new Date(args.year + 1, 0, 1),
          },
        },
        orderBy: { date: 'asc' },
      });

      const monthMap = new Map<
        string,
        { present: number; absent: number; wfh: number; leave: number; totalHours: number; dayCount: number }
      >();

      for (const log of logs) {
        const monthKey = `${args.year}-${String(log.date.getMonth() + 1).padStart(2, '0')}`;
        const entry = monthMap.get(monthKey) ?? {
          present: 0,
          absent: 0,
          wfh: 0,
          leave: 0,
          totalHours: 0,
          dayCount: 0,
        };

        switch (log.status) {
          case 'present':
            entry.present++;
            break;
          case 'absent':
            entry.absent++;
            break;
          case 'work_from_home':
            entry.wfh++;
            break;
          case 'on_leave':
            entry.leave++;
            break;
          case 'half_day':
            entry.present += 0.5;
            entry.leave += 0.5;
            break;
        }

        if (log.hoursWorked != null && log.hoursWorked > 0) {
          entry.totalHours += log.hoursWorked;
          entry.dayCount++;
        }

        monthMap.set(monthKey, entry);
      }

      return Array.from(monthMap.entries())
        .map(([month, data]) => ({
          month,
          presentDays: Math.round(data.present),
          absentDays: Math.round(data.absent),
          wfhDays: Math.round(data.wfh),
          leaveDays: Math.round(data.leave),
          avgHoursWorked:
            data.dayCount > 0
              ? Math.round((data.totalHours / data.dayCount) * 100) / 100
              : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },
  }),
);

// ─── Mutations ──────────────────────────────────────────────────────────────

builder.mutationField('markAttendance', (t) =>
  t.prismaField({
    type: 'AttendanceLog',
    args: {
      employeeId: t.arg.string({ required: true }),
      date: t.arg({ type: 'DateTime', required: true }),
      checkIn: t.arg({ type: 'DateTime' }),
      checkOut: t.arg({ type: 'DateTime' }),
      status: t.arg.string(),
      remarks: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.orgId();

      // Auto-calculate hoursWorked from checkIn/checkOut
      let hoursWorked: number | undefined;
      if (args.checkIn && args.checkOut) {
        const diffMs = args.checkOut.getTime() - args.checkIn.getTime();
        hoursWorked = Math.round((diffMs / 3600000) * 100) / 100;
      }

      // Upsert: update if attendance already exists for the day, else create
      return ctx.prisma.attendanceLog.upsert({
        ...query,
        where: {
          employeeId_date_organizationId: {
            employeeId: args.employeeId,
            date: args.date,
            organizationId: orgId,
          },
        },
        create: {
          employeeId: args.employeeId,
          date: args.date,
          checkIn: args.checkIn ?? undefined,
          checkOut: args.checkOut ?? undefined,
          hoursWorked,
          status: args.status ?? 'present',
          remarks: args.remarks ?? undefined,
          organizationId: orgId,
        },
        update: {
          ...(args.checkIn ? { checkIn: args.checkIn } : {}),
          ...(args.checkOut ? { checkOut: args.checkOut } : {}),
          ...(hoursWorked != null ? { hoursWorked } : {}),
          ...(args.status ? { status: args.status } : {}),
          ...(args.remarks !== undefined ? { remarks: args.remarks } : {}),
        },
      });
    },
  }),
);

builder.mutationField('applyLeave', (t) =>
  t.prismaField({
    type: 'AttendanceLog',
    args: {
      employeeId: t.arg.string({ required: true }),
      date: t.arg({ type: 'DateTime', required: true }),
      leaveType: t.arg.string({ required: true }),
      remarks: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.orgId();
      const year = args.date.getFullYear();

      // Check leave balance exists and has availability
      const leaveBalance = await ctx.prisma.leaveBalance.findUnique({
        where: {
          employeeId_year_leaveType_organizationId: {
            employeeId: args.employeeId,
            year,
            leaveType: args.leaveType,
            organizationId: orgId,
          },
        },
      });

      if (!leaveBalance) {
        throw new Error(`No leave balance found for type "${args.leaveType}" in year ${year}`);
      }

      if (leaveBalance.balance <= 0) {
        throw new Error(`Insufficient leave balance for type "${args.leaveType}". Balance: ${leaveBalance.balance}`);
      }

      // Update pending count in leave balance
      await ctx.prisma.leaveBalance.update({
        where: { id: leaveBalance.id },
        data: {
          pending: { increment: 1 },
          balance: { decrement: 1 },
        },
      });

      // Create attendance log with on_leave status
      return ctx.prisma.attendanceLog.create({
        ...query,
        data: {
          employeeId: args.employeeId,
          date: args.date,
          status: 'on_leave',
          leaveType: args.leaveType,
          remarks: args.remarks ?? undefined,
          organizationId: orgId,
        },
      });
    },
  }),
);

builder.mutationField('approveLeave', (t) =>
  t.prismaField({
    type: 'AttendanceLog',
    args: {
      attendanceLogId: t.arg.string({ required: true }),
      approvedBy: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const log = await ctx.prisma.attendanceLog.findUniqueOrThrow({
        where: { id: args.attendanceLogId },
      });

      if (log.status !== 'on_leave' || !log.leaveType) {
        throw new Error('This attendance log is not a leave request');
      }

      const year = log.date.getFullYear();
      const orgId = log.organizationId;

      // Move from pending to taken
      await ctx.prisma.leaveBalance.update({
        where: {
          employeeId_year_leaveType_organizationId: {
            employeeId: log.employeeId,
            year,
            leaveType: log.leaveType,
            organizationId: orgId,
          },
        },
        data: {
          pending: { decrement: 1 },
          taken: { increment: 1 },
        },
      });

      return ctx.prisma.attendanceLog.update({
        ...query,
        where: { id: args.attendanceLogId },
        data: { approvedBy: args.approvedBy },
      });
    },
  }),
);

builder.mutationField('initializeLeaveBalances', (t) =>
  t.field({
    type: 'Boolean',
    args: {
      employeeId: t.arg.string({ required: true }),
      year: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const orgId = ctx.orgId();

      // Default entitlements per leave type
      const defaults: { leaveType: string; entitled: number }[] = [
        { leaveType: 'casual', entitled: 12 },
        { leaveType: 'sick', entitled: 6 },
        { leaveType: 'earned', entitled: 15 },
      ];

      for (const def of defaults) {
        await ctx.prisma.leaveBalance.upsert({
          where: {
            employeeId_year_leaveType_organizationId: {
              employeeId: args.employeeId,
              year: args.year,
              leaveType: def.leaveType,
              organizationId: orgId,
            },
          },
          create: {
            employeeId: args.employeeId,
            year: args.year,
            leaveType: def.leaveType,
            entitled: def.entitled,
            taken: 0,
            pending: 0,
            balance: def.entitled,
            carriedForward: 0,
            organizationId: orgId,
          },
          update: {}, // no-op if already exists
        });
      }

      return true;
    },
  }),
);
