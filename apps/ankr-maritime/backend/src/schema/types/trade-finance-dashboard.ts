import { builder } from '../builder.js';

// === Custom Objects ===

const CurrencyExposure = builder.objectRef<{
  currency: string;
  amount: number;
  hedged: number;
}>('CurrencyExposure');

CurrencyExposure.implement({
  fields: (t) => ({
    currency: t.exposeString('currency'),
    amount: t.exposeFloat('amount'),
    hedged: t.exposeFloat('hedged'),
  }),
});

const LCStats = builder.objectRef<{
  totalActive: number;
  totalAmount: number;
  expiringIn30Days: number;
  discrepantCount: number;
}>('LCStats');

LCStats.implement({
  fields: (t) => ({
    totalActive: t.exposeInt('totalActive'),
    totalAmount: t.exposeFloat('totalAmount'),
    expiringIn30Days: t.exposeInt('expiringIn30Days'),
    discrepantCount: t.exposeInt('discrepantCount'),
  }),
});

const PaymentStats = builder.objectRef<{
  pendingAmount: number;
  overdueAmount: number;
  paidThisMonth: number;
  avgPaymentDays: number;
}>('PaymentStats');

PaymentStats.implement({
  fields: (t) => ({
    pendingAmount: t.exposeFloat('pendingAmount'),
    overdueAmount: t.exposeFloat('overdueAmount'),
    paidThisMonth: t.exposeFloat('paidThisMonth'),
    avgPaymentDays: t.exposeFloat('avgPaymentDays'),
  }),
});

const FXStats = builder.objectRef<{
  totalExposure: number;
  hedgedPercent: number;
  topCurrencies: { currency: string; amount: number; hedged: number }[];
}>('FXStats');

FXStats.implement({
  fields: (t) => ({
    totalExposure: t.exposeFloat('totalExposure'),
    hedgedPercent: t.exposeFloat('hedgedPercent'),
    topCurrencies: t.field({
      type: [CurrencyExposure],
      resolve: (parent) => parent.topCurrencies,
    }),
  }),
});

const TradeFinanceDashboard = builder.objectRef<{
  lcStats: {
    totalActive: number;
    totalAmount: number;
    expiringIn30Days: number;
    discrepantCount: number;
  };
  paymentStats: {
    pendingAmount: number;
    overdueAmount: number;
    paidThisMonth: number;
    avgPaymentDays: number;
  };
  fxStats: {
    totalExposure: number;
    hedgedPercent: number;
    topCurrencies: { currency: string; amount: number; hedged: number }[];
  };
}>('TradeFinanceDashboard');

TradeFinanceDashboard.implement({
  fields: (t) => ({
    lcStats: t.field({
      type: LCStats,
      resolve: (parent) => parent.lcStats,
    }),
    paymentStats: t.field({
      type: PaymentStats,
      resolve: (parent) => parent.paymentStats,
    }),
    fxStats: t.field({
      type: FXStats,
      resolve: (parent) => parent.fxStats,
    }),
  }),
});

// === Query ===

builder.queryField('tradeFinanceDashboard', (t) =>
  t.field({
    type: TradeFinanceDashboard,
    resolve: async (_root, _args, ctx) => {
      const orgFilter = ctx.orgFilter();

      // Fetch all data in parallel
      const [lcs, lcDocuments, payments, fxExposures] = await Promise.all([
        ctx.prisma.letterOfCredit.findMany({ where: orgFilter }),
        ctx.prisma.lCDocument.findMany({
          where: { letterOfCredit: orgFilter },
        }),
        ctx.prisma.tradePayment.findMany({ where: orgFilter }),
        ctx.prisma.fXExposure.findMany({ where: orgFilter }),
      ]);

      // --- LC Stats ---
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const activeStatuses = ['draft', 'issued', 'confirmed', 'advised'];

      const activeLCs = lcs.filter((lc) => activeStatuses.includes(lc.status));
      const totalActive = activeLCs.length;
      let totalAmount = 0;
      let expiringIn30Days = 0;
      for (const lc of activeLCs) {
        totalAmount += lc.amount;
        if (lc.expiryDate <= in30Days) expiringIn30Days++;
      }
      const discrepantCount = lcDocuments.filter((d) => d.status === 'discrepant').length;

      const lcStats = { totalActive, totalAmount, expiringIn30Days, discrepantCount };

      // --- Payment Stats ---
      let pendingAmount = 0;
      let overdueAmount = 0;
      let paidThisMonth = 0;

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      let totalPaymentDays = 0;
      let paidCount = 0;

      for (const p of payments) {
        if (p.status === 'pending' || p.status === 'approved') pendingAmount += p.amount;
        if (p.status === 'overdue') overdueAmount += p.amount;
        if (p.status === 'paid') {
          if (p.paidDate && p.paidDate >= monthStart) {
            paidThisMonth += p.amount;
          }
          if (p.paidDate) {
            const days = Math.ceil(
              (p.paidDate.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24),
            );
            totalPaymentDays += days;
            paidCount++;
          }
        }
      }
      const avgPaymentDays = paidCount > 0 ? totalPaymentDays / paidCount : 0;

      const paymentStats = { pendingAmount, overdueAmount, paidThisMonth, avgPaymentDays };

      // --- FX Stats ---
      const openExposures = fxExposures.filter((e) => e.status !== 'settled');
      let totalExposure = 0;
      let totalHedged = 0;

      const currencyMap = new Map<string, { amount: number; hedged: number }>();

      for (const e of openExposures) {
        totalExposure += e.amount;
        totalHedged += e.hedgedAmount ?? 0;

        const entry = currencyMap.get(e.currency) ?? { amount: 0, hedged: 0 };
        entry.amount += e.amount;
        entry.hedged += e.hedgedAmount ?? 0;
        currencyMap.set(e.currency, entry);
      }

      const hedgedPercent = totalExposure > 0 ? (totalHedged / totalExposure) * 100 : 0;

      const topCurrencies = Array.from(currencyMap.entries())
        .map(([currency, data]) => ({ currency, amount: data.amount, hedged: data.hedged }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      const fxStats = { totalExposure, hedgedPercent, topCurrencies };

      return { lcStats, paymentStats, fxStats };
    },
  }),
);
