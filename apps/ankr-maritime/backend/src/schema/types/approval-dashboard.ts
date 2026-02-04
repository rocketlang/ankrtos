import { builder } from '../builder.js'

// ── Custom Types ─────────────────────────────────────────────

const ApprovalRouteStats = builder.objectRef<{
  routeName: string
  entityType: string
  pendingCount: number
  avgTimeHrs: number
}>('ApprovalRouteStats')

ApprovalRouteStats.implement({
  fields: (t) => ({
    routeName: t.exposeString('routeName'),
    entityType: t.exposeString('entityType'),
    pendingCount: t.exposeInt('pendingCount'),
    avgTimeHrs: t.exposeFloat('avgTimeHrs'),
  }),
})

const ApprovalDashboard = builder.objectRef<{
  pendingCount: number
  approvedToday: number
  rejectedToday: number
  avgApprovalTimeHrs: number
  routeBreakdown: { routeName: string; entityType: string; pendingCount: number; avgTimeHrs: number }[]
}>('ApprovalDashboard')

ApprovalDashboard.implement({
  fields: (t) => ({
    pendingCount: t.exposeInt('pendingCount'),
    approvedToday: t.exposeInt('approvedToday'),
    rejectedToday: t.exposeInt('rejectedToday'),
    avgApprovalTimeHrs: t.exposeFloat('avgApprovalTimeHrs'),
    routeBreakdown: t.field({
      type: [ApprovalRouteStats],
      resolve: (parent) => parent.routeBreakdown,
    }),
  }),
})

// ── Query ────────────────────────────────────────────────────

builder.queryField('approvalDashboard', (t) =>
  t.field({
    type: ApprovalDashboard,
    resolve: async (_root, _args, ctx) => {
      const orgId = ctx.user?.organizationId
      const orgWhere = orgId ? { approvalRoute: { organizationId: orgId } } : {}

      // Today's date boundaries
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const [pendingCount, approvedToday, rejectedToday, completedSteps, routes] =
        await Promise.all([
          // Total pending steps
          ctx.prisma.approvalStep.count({
            where: { action: 'pending', ...orgWhere },
          }),
          // Approved today
          ctx.prisma.approvalStep.count({
            where: {
              action: 'approved',
              actionAt: { gte: todayStart, lte: todayEnd },
              ...orgWhere,
            },
          }),
          // Rejected today
          ctx.prisma.approvalStep.count({
            where: {
              action: 'rejected',
              actionAt: { gte: todayStart, lte: todayEnd },
              ...orgWhere,
            },
          }),
          // All completed steps (for avg time calculation)
          ctx.prisma.approvalStep.findMany({
            where: {
              action: { in: ['approved', 'rejected'] },
              actionAt: { not: null },
              ...orgWhere,
            },
            select: { createdAt: true, actionAt: true },
          }),
          // All routes with their steps for breakdown
          ctx.prisma.approvalRoute.findMany({
            where: orgId ? { organizationId: orgId } : {},
            include: {
              steps: {
                select: {
                  action: true,
                  createdAt: true,
                  actionAt: true,
                },
              },
            },
          }),
        ])

      // Calculate overall average approval time in hours
      let totalHrs = 0
      let completedCount = 0
      for (const step of completedSteps) {
        if (step.actionAt) {
          const diffMs = step.actionAt.getTime() - step.createdAt.getTime()
          totalHrs += diffMs / (1000 * 60 * 60)
          completedCount++
        }
      }
      const avgApprovalTimeHrs = completedCount > 0
        ? Math.round((totalHrs / completedCount) * 100) / 100
        : 0

      // Route breakdown
      const routeBreakdown = routes.map((route) => {
        const routePending = route.steps.filter((s) => s.action === 'pending').length
        const routeCompleted = route.steps.filter(
          (s) => (s.action === 'approved' || s.action === 'rejected') && s.actionAt,
        )
        let routeAvgHrs = 0
        if (routeCompleted.length > 0) {
          let rHrs = 0
          for (const s of routeCompleted) {
            if (s.actionAt) {
              rHrs += (s.actionAt.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60)
            }
          }
          routeAvgHrs = Math.round((rHrs / routeCompleted.length) * 100) / 100
        }
        return {
          routeName: route.name,
          entityType: route.entityType,
          pendingCount: routePending,
          avgTimeHrs: routeAvgHrs,
        }
      })

      return {
        pendingCount,
        approvedToday,
        rejectedToday,
        avgApprovalTimeHrs,
        routeBreakdown,
      }
    },
  }),
)
