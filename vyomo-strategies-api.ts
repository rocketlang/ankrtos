/**
 * Vyomo Strategies API - Standalone Minimal Server
 * Just the 3 new features: Iron Condor, Intraday, Screener
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import mercurius from 'mercurius'
import { strategiesResolvers } from '/root/ankr-options-standalone/apps/vyomo-api/src/resolvers/strategies.resolver'
import { GraphQLScalarType, Kind } from 'graphql'

const PORT = 4025

// Custom scalars
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  serialize: (value: any) => value instanceof Date ? value.toISOString() : value,
  parseValue: (value: any) => typeof value === 'string' || typeof value === 'number' ? new Date(value) : null,
  parseLiteral: (ast) => ast.kind === Kind.STRING ? new Date(ast.value) : null
})

const schema = /* GraphQL */ `
  scalar DateTime

  enum OptionType {
    CE
    PE
    CALL
    PUT
  }

  enum IronCondorRecommendation {
    STRONG_BUY
    BUY
    NEUTRAL
    AVOID
  }

  enum IntradaySignalType {
    BUY_CALL
    BUY_PUT
    SELL_CALL
    SELL_PUT
    HOLD
  }

  enum IntradayTimeHorizon {
    MIN_15
    MIN_30
    HOUR_1
    HOUR_2
    HOUR_3
  }

  enum TradingAction {
    HOLD
    TAKE_PROFIT
    CUT_LOSS
    TIME_STOP
    ADJUST
  }

  enum StockRating {
    STRONG_BUY
    BUY
    HOLD
    SELL
    STRONG_SELL
  }

  enum ScreenerPreset {
    VALUE_INVESTING
    GROWTH_INVESTING
    MOMENTUM
    BREAKOUT
    DEFENSIVE
  }

  enum TrendDirection {
    STRONG_UPTREND
    UPTREND
    SIDEWAYS
    DOWNTREND
    STRONG_DOWNTREND
  }

  enum SpeedRegime {
    STOPPED
    SLOW
    CRUISING
    FAST
    EMERGENCY
  }

  type OptionLeg {
    strike: Float!
    optionType: OptionType!
    action: String!
    quantity: Int!
    premium: Float!
    expiry: DateTime!
  }

  type IronCondorSetup {
    underlying: String!
    spotPrice: Float!
    buyPut: OptionLeg!
    sellPut: OptionLeg!
    sellCall: OptionLeg!
    buyCall: OptionLeg!
    profitRange: [Float!]!
    maxProfit: Float!
    maxLoss: Float!
    ivRank: Float!
    daysToExpiry: Int!
    winProbability: Float!
    capitalRequired: Float!
    marginRequired: Float!
  }

  type IronCondorReasons {
    ivCondition: String!
    rangeConfidence: String!
    riskReward: String!
    timeDecay: String!
  }

  type PayoffChart {
    spotPrices: [Float!]!
    pnl: [Float!]!
    breakevens: [Float!]!
  }

  type IronCondorAnalysis {
    setup: IronCondorSetup!
    recommendation: IronCondorRecommendation!
    score: Float!
    reasons: IronCondorReasons!
    payoffChart: PayoffChart!
  }

  type IronCondorMonitor {
    currentPnL: Float!
    pnlPercent: Float!
    action: TradingAction!
    reason: String!
  }

  type IntradayTriggers {
    spotMove: Float!
    ivSpike: Boolean!
    volumeSpike: Boolean!
    oiChange: Float!
    levelBreak: String
    momentum: String!
  }

  type IntradayEntry {
    strike: Float!
    optionType: OptionType!
    premium: Float!
    quantity: Int!
  }

  type IntradaySignal {
    timestamp: DateTime!
    signal: IntradaySignalType!
    confidence: Float!
    triggers: IntradayTriggers!
    entry: IntradayEntry!
    stopLoss: Float!
    target: Float!
    timeHorizon: IntradayTimeHorizon!
    reason: String!
    setup: String!
  }

  type IntradayMonitor {
    currentPnL: Float!
    pnlPercent: Float!
    action: TradingAction!
    reason: String!
  }

  type MACDData {
    value: Float!
    signal: Float!
    histogram: Float!
  }

  type FundamentalData {
    pe: Float!
    pb: Float!
    ps: Float!
    marketCap: Float!
    dividendYield: Float!
    roe: Float!
    roa: Float!
    netMargin: Float!
    operatingMargin: Float!
    debtToEquity: Float!
    currentRatio: Float!
    interestCoverage: Float!
    revenueGrowthYoY: Float!
    profitGrowthYoY: Float!
    revenueGrowthQoQ: Float!
    profitGrowthQoQ: Float!
    promoterHolding: Float!
    pledgePercent: Float!
    fiiHolding: Float!
    diiHolding: Float!
    industry: String!
    sector: String!
    sectorPE: Float!
  }

  type TechnicalData {
    currentPrice: Float!
    dayHigh: Float!
    dayLow: Float!
    fiftyTwoWeekHigh: Float!
    fiftyTwoWeekLow: Float!
    sma20: Float!
    sma50: Float!
    sma200: Float!
    ema9: Float!
    ema21: Float!
    trend: TrendDirection!
    trendStrength: Float!
    supportLevels: [Float!]!
    resistanceLevels: [Float!]!
    pivotPoint: Float!
    rsi14: Float!
    macd: MACDData!
    averageVolume: Float!
    todayVolume: Float!
    volumeRatio: Float!
    atr14: Float!
    bollingerBandWidth: Float!
    regime: SpeedRegime!
    regimeConfidence: Float!
    compressionScore: Float!
  }

  type StockScreenerResult {
    symbol: String!
    name: String!
    sector: String!
    fundamentalScore: Float!
    technicalScore: Float!
    compositeScore: Float!
    rating: StockRating!
    targetPrice: Float!
    stopLoss: Float!
    expectedReturn: Float!
    timeHorizon: String!
    fundamentals: FundamentalData!
    technicals: TechnicalData!
    buyReasons: [String!]!
    concerns: [String!]!
    timestamp: DateTime!
  }

  input IronCondorParams {
    underlying: String!
    spotPrice: Float!
    daysToExpiry: Int!
    wingWidth: Int
    riskFreeRate: Float
  }

  input EquityScreenerCriteria {
    minMarketCap: Float
    maxMarketCap: Float
    minPE: Float
    maxPE: Float
    minROE: Float
    maxDebtToEquity: Float
    minPromoterHolding: Float
    maxPledgePercent: Float
    minRevenueGrowth: Float
    minProfitGrowth: Float
    sectors: [String!]
    excludeSectors: [String!]
    minPrice: Float
    maxPrice: Float
    trend: [TrendDirection!]
    minRSI: Float
    maxRSI: Float
    regimes: [SpeedRegime!]
    minCompressionScore: Float
    minVolumeRatio: Float
    sortBy: String
    sortOrder: String
    limit: Int
  }

  type Query {
    analyzeIronCondor(params: IronCondorParams!): IronCondorAnalysis
    generateIntradaySignal(underlying: String!): IntradaySignal
    screenStocks(criteria: EquityScreenerCriteria, preset: ScreenerPreset): [StockScreenerResult!]!
  }

  type Mutation {
    monitorIronCondor(setupId: ID!, currentSpot: Float!, daysLeft: Int!): IronCondorMonitor!
    monitorIntradayTrade(tradeId: ID!, currentPremium: Float!): IntradayMonitor!
  }
`

async function main() {
  const app = Fastify({ logger: true })

  await app.register(cors, { origin: true })

  await app.register(mercurius, {
    schema,
    resolvers: {
      DateTime: DateTimeScalar,
      Query: strategiesResolvers.Query,
      Mutation: strategiesResolvers.Mutation
    },
    context: (request: any) => ({
      logger: app.log,
      request
    }),
    graphiql: true,
    path: '/graphql'
  })

  app.get('/health', async () => ({ status: 'ok', service: 'vyomo-strategies-api' }))

  await app.listen({ port: PORT, host: 'localhost' })
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Vyomo Strategies API - Running on port ${PORT}         ║
║  GraphQL: http://localhost:${PORT}/graphql               ║
║  Health:  http://localhost:${PORT}/health                ║
╚════════════════════════════════════════════════════════╝
  `)
}

main().catch(console.error)
