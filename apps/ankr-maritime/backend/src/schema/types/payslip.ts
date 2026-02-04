import { builder } from '../builder.js';

// ─── Payslip PrismaObject ───────────────────────────────────────────────────

builder.prismaObject('Payslip', {
  fields: (t) => ({
    id: t.exposeID('id'),
    employeeId: t.exposeString('employeeId'),
    employee: t.relation('employee'),
    month: t.exposeInt('month'),
    year: t.exposeInt('year'),
    basic: t.exposeFloat('basic'),
    hra: t.exposeFloat('hra'),
    da: t.exposeFloat('da'),
    specialAllow: t.exposeFloat('specialAllow'),
    otherAllow: t.exposeFloat('otherAllow'),
    grossEarnings: t.exposeFloat('grossEarnings'),
    pf: t.exposeFloat('pf'),
    esi: t.exposeFloat('esi'),
    tds: t.exposeFloat('tds'),
    professionalTax: t.exposeFloat('professionalTax'),
    otherDeductions: t.exposeFloat('otherDeductions'),
    totalDeductions: t.exposeFloat('totalDeductions'),
    netPay: t.exposeFloat('netPay'),
    currency: t.exposeString('currency'),
    status: t.exposeString('status'),
    paidDate: t.expose('paidDate', { type: 'DateTime', nullable: true }),
    paymentRef: t.exposeString('paymentRef', { nullable: true }),
    remarks: t.exposeString('remarks', { nullable: true }),
    organizationId: t.exposeString('organizationId'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

// ─── Custom Type: PayrollSummary ────────────────────────────────────────────

const PayrollSummary = builder.objectRef<{
  month: number;
  year: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  status: string;
}>('PayrollSummary');

PayrollSummary.implement({
  fields: (t) => ({
    month: t.exposeInt('month'),
    year: t.exposeInt('year'),
    totalGross: t.exposeFloat('totalGross'),
    totalDeductions: t.exposeFloat('totalDeductions'),
    totalNet: t.exposeFloat('totalNet'),
    employeeCount: t.exposeInt('employeeCount'),
    status: t.exposeString('status'),
  }),
});

// ─── Salary Calculation Helpers ─────────────────────────────────────────────

function calculateSalaryComponents(monthlyCTC: number) {
  const basic = monthlyCTC * 0.4;
  const hra = basic * 0.5;
  const da = basic * 0.1;
  const specialAllow = monthlyCTC - basic - hra - da;

  const grossEarnings = basic + hra + da + specialAllow;

  // PF: 12% of basic, capped at basic of 15000
  const pfBasic = Math.min(basic, 15000);
  const pf = Math.round(pfBasic * 0.12 * 100) / 100;

  // ESI: 0.75% of gross if gross < 21000, else 0
  const esi = grossEarnings < 21000 ? Math.round(grossEarnings * 0.0075 * 100) / 100 : 0;

  // Professional Tax: standard 200
  const professionalTax = 200;

  // TDS: estimated from annual income brackets
  const annualIncome = monthlyCTC * 12;
  let tdsAnnual = 0;
  if (annualIncome > 1500000) {
    // 30% on income above 15L + lower brackets
    tdsAnnual = (annualIncome - 1500000) * 0.30 + 250000 * 0.05 + 500000 * 0.20;
  } else if (annualIncome > 1000000) {
    // 20% on 10L-15L + 5% on 5L-10L
    tdsAnnual = (annualIncome - 1000000) * 0.20 + 250000 * 0.05;
  } else if (annualIncome > 750000) {
    // 5% on income 7.5L-10L (simplified old regime slab)
    tdsAnnual = (annualIncome - 750000) * 0.05;
  }
  const tds = Math.round((tdsAnnual / 12) * 100) / 100;

  const totalDeductions = Math.round((pf + esi + professionalTax + tds) * 100) / 100;
  const netPay = Math.round((grossEarnings - totalDeductions) * 100) / 100;

  return {
    basic: Math.round(basic * 100) / 100,
    hra: Math.round(hra * 100) / 100,
    da: Math.round(da * 100) / 100,
    specialAllow: Math.round(specialAllow * 100) / 100,
    grossEarnings: Math.round(grossEarnings * 100) / 100,
    pf,
    esi,
    professionalTax,
    tds,
    totalDeductions,
    netPay,
  };
}

// ─── Queries ────────────────────────────────────────────────────────────────

builder.queryField('payslips', (t) =>
  t.prismaField({
    type: ['Payslip'],
    args: {
      employeeId: t.arg.string(),
      year: t.arg.int(),
      month: t.arg.int(),
      status: t.arg.string(),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.payslip.findMany({
        ...query,
        where: {
          ...ctx.orgFilter(),
          ...(args.employeeId ? { employeeId: args.employeeId } : {}),
          ...(args.year ? { year: args.year } : {}),
          ...(args.month ? { month: args.month } : {}),
          ...(args.status ? { status: args.status } : {}),
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
  }),
);

builder.queryField('payrollSummary', (t) =>
  t.field({
    type: [PayrollSummary],
    args: {
      year: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const payslips = await ctx.prisma.payslip.findMany({
        where: {
          ...ctx.orgFilter(),
          year: args.year,
        },
        select: {
          month: true,
          year: true,
          grossEarnings: true,
          totalDeductions: true,
          netPay: true,
          status: true,
        },
      });

      const monthMap = new Map<
        number,
        { totalGross: number; totalDeductions: number; totalNet: number; count: number; statuses: Set<string> }
      >();

      for (const slip of payslips) {
        const entry = monthMap.get(slip.month) ?? {
          totalGross: 0,
          totalDeductions: 0,
          totalNet: 0,
          count: 0,
          statuses: new Set<string>(),
        };
        entry.totalGross += slip.grossEarnings;
        entry.totalDeductions += slip.totalDeductions;
        entry.totalNet += slip.netPay;
        entry.count++;
        entry.statuses.add(slip.status);
        monthMap.set(slip.month, entry);
      }

      return Array.from(monthMap.entries())
        .map(([month, data]) => {
          // Determine aggregate status
          let status = 'draft';
          if (data.statuses.size === 1) {
            status = Array.from(data.statuses)[0];
          } else if (data.statuses.has('paid') && data.statuses.size > 1) {
            status = 'partial';
          } else if (data.statuses.has('processed')) {
            status = 'processed';
          }

          return {
            month,
            year: args.year,
            totalGross: Math.round(data.totalGross * 100) / 100,
            totalDeductions: Math.round(data.totalDeductions * 100) / 100,
            totalNet: Math.round(data.totalNet * 100) / 100,
            employeeCount: data.count,
            status,
          };
        })
        .sort((a, b) => a.month - b.month);
    },
  }),
);

// ─── Custom Type: ProcessPayrollResult ──────────────────────────────────────

const ProcessPayrollResult = builder.objectRef<{
  processedCount: number;
  month: number;
  year: number;
}>('ProcessPayrollResult');

ProcessPayrollResult.implement({
  fields: (t) => ({
    processedCount: t.exposeInt('processedCount'),
    month: t.exposeInt('month'),
    year: t.exposeInt('year'),
  }),
});

// ─── Mutations ──────────────────────────────────────────────────────────────

builder.mutationField('generatePayslip', (t) =>
  t.prismaField({
    type: 'Payslip',
    args: {
      employeeId: t.arg.string({ required: true }),
      month: t.arg.int({ required: true }),
      year: t.arg.int({ required: true }),
      otherAllow: t.arg.float(),
      otherDeductions: t.arg.float(),
      remarks: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      const orgId = ctx.orgId();

      const employee = await ctx.prisma.employee.findUniqueOrThrow({
        where: { id: args.employeeId },
        select: { salary: true, currency: true, status: true },
      });

      if (employee.status !== 'active') {
        throw new Error('Cannot generate payslip for non-active employee');
      }

      if (!employee.salary || employee.salary <= 0) {
        throw new Error('Employee salary is not set');
      }

      const components = calculateSalaryComponents(employee.salary);

      // Add extra allowances/deductions
      const otherAllow = args.otherAllow ?? 0;
      const otherDeduct = args.otherDeductions ?? 0;
      const finalGross = Math.round((components.grossEarnings + otherAllow) * 100) / 100;
      const finalDeductions = Math.round((components.totalDeductions + otherDeduct) * 100) / 100;
      const finalNet = Math.round((finalGross - finalDeductions) * 100) / 100;

      return ctx.prisma.payslip.upsert({
        ...query,
        where: {
          employeeId_month_year_organizationId: {
            employeeId: args.employeeId,
            month: args.month,
            year: args.year,
            organizationId: orgId,
          },
        },
        create: {
          employeeId: args.employeeId,
          month: args.month,
          year: args.year,
          basic: components.basic,
          hra: components.hra,
          da: components.da,
          specialAllow: components.specialAllow,
          otherAllow,
          grossEarnings: finalGross,
          pf: components.pf,
          esi: components.esi,
          tds: components.tds,
          professionalTax: components.professionalTax,
          otherDeductions: otherDeduct,
          totalDeductions: finalDeductions,
          netPay: finalNet,
          currency: employee.currency,
          status: 'draft',
          remarks: args.remarks ?? undefined,
          organizationId: orgId,
        },
        update: {
          basic: components.basic,
          hra: components.hra,
          da: components.da,
          specialAllow: components.specialAllow,
          otherAllow,
          grossEarnings: finalGross,
          pf: components.pf,
          esi: components.esi,
          tds: components.tds,
          professionalTax: components.professionalTax,
          otherDeductions: otherDeduct,
          totalDeductions: finalDeductions,
          netPay: finalNet,
          status: 'draft',
          remarks: args.remarks ?? undefined,
        },
      });
    },
  }),
);

builder.mutationField('processPayroll', (t) =>
  t.field({
    type: ProcessPayrollResult,
    args: {
      month: t.arg.int({ required: true }),
      year: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const orgId = ctx.orgId();

      // Fetch all active employees with salary
      const employees = await ctx.prisma.employee.findMany({
        where: {
          organizationId: orgId,
          status: 'active',
          salary: { gt: 0 },
        },
        select: { id: true, salary: true, currency: true },
      });

      if (employees.length === 0) {
        throw new Error('No active employees with salary found');
      }

      let processedCount = 0;

      for (const emp of employees) {
        const components = calculateSalaryComponents(emp.salary!);
        const finalGross = components.grossEarnings;
        const finalDeductions = components.totalDeductions;
        const finalNet = components.netPay;

        await ctx.prisma.payslip.upsert({
          where: {
            employeeId_month_year_organizationId: {
              employeeId: emp.id,
              month: args.month,
              year: args.year,
              organizationId: orgId,
            },
          },
          create: {
            employeeId: emp.id,
            month: args.month,
            year: args.year,
            basic: components.basic,
            hra: components.hra,
            da: components.da,
            specialAllow: components.specialAllow,
            otherAllow: 0,
            grossEarnings: finalGross,
            pf: components.pf,
            esi: components.esi,
            tds: components.tds,
            professionalTax: components.professionalTax,
            otherDeductions: 0,
            totalDeductions: finalDeductions,
            netPay: finalNet,
            currency: emp.currency,
            status: 'processed',
            organizationId: orgId,
          },
          update: {
            basic: components.basic,
            hra: components.hra,
            da: components.da,
            specialAllow: components.specialAllow,
            grossEarnings: finalGross,
            pf: components.pf,
            esi: components.esi,
            tds: components.tds,
            professionalTax: components.professionalTax,
            totalDeductions: finalDeductions,
            netPay: finalNet,
            status: 'processed',
          },
        });

        processedCount++;
      }

      return { processedCount, month: args.month, year: args.year };
    },
  }),
);

builder.mutationField('markPayslipPaid', (t) =>
  t.prismaField({
    type: 'Payslip',
    args: {
      id: t.arg.string({ required: true }),
      paymentRef: t.arg.string({ required: true }),
      paidDate: t.arg({ type: 'DateTime' }),
    },
    resolve: async (query, _root, args, ctx) => {
      const payslip = await ctx.prisma.payslip.findUniqueOrThrow({
        where: { id: args.id },
      });

      if (payslip.status === 'paid') {
        throw new Error('Payslip is already marked as paid');
      }

      if (payslip.status === 'draft') {
        throw new Error('Cannot mark a draft payslip as paid. Process it first.');
      }

      return ctx.prisma.payslip.update({
        ...query,
        where: { id: args.id },
        data: {
          status: 'paid',
          paidDate: args.paidDate ?? new Date(),
          paymentRef: args.paymentRef,
        },
      });
    },
  }),
);
