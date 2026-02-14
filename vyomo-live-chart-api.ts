#!/usr/bin/env node
/**
 * Vyomo Live Chart GraphQL API
 * Standalone server for real-time chart data
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import mercurius from 'mercurius'
import { EventEmitter } from 'events'

const PORT = 4020
const HOST = '0.0.0.0'

// Schema
const schema = `
  type Candle {
    time: Int!
    open: Float!
    high: Float!
    low: Float!
    close: Float!
    volume: Int!
  }

  type Tick {
    symbol: String!
    price: Float!
    volume: Int!
    change: Float!
    changePercent: Float!
    timestamp: Float!
  }

  type AlgorithmSignal {
    id: ID!
    algorithm: String!
    signal: SignalType!
    confidence: Float!
    price: Float!
    timestamp: Float!
    reasoning: String
  }

  enum SignalType {
    BUY
    SELL
    NEUTRAL
  }

  type Query {
    latestCandles(symbol: String!, interval: String!, limit: Int = 100): [Candle!]!
    currentTick(symbol: String!): Tick
  }

  type Subscription {
    newTick(symbol: String!): Tick!
    algorithmSignal: AlgorithmSignal!
    candleUpdate(symbol: String!, interval: String!): Candle!
  }
`

// Mock data generators
function generateMockCandles(limit: number): any[] {
  const now = Math.floor(Date.now() / 1000)
  const interval = 300
  const candles: any[] = []
  let basePrice = 25800

  for (let i = limit - 1; i >= 0; i--) {
    const time = now - (i * interval)
    const change = (Math.random() - 0.5) * 50
    const open = basePrice
    const close = open + change
    const high = Math.max(open, close) + Math.random() * 20
    const low = Math.min(open, close) - Math.random() * 20
    const volume = Math.floor(Math.random() * 100000) + 50000

    candles.push({ time, open, high, low, close, volume })
    basePrice = close
  }

  return candles
}

function generateMockTick(symbol: string): any {
  const basePrice = 25800
  const change = (Math.random() - 0.5) * 100
  const price = basePrice + change
  const changePercent = (change / basePrice) * 100

  return {
    symbol,
    price,
    volume: Math.floor(Math.random() * 10000),
    change,
    changePercent,
    timestamp: Date.now()
  }
}

function generateMockSignal(): any {
  const algorithms = [
    'IV Percentile', 'PCR Momentum', 'GEX Analysis', 'Volume Profile',
    'Options OI', 'Volatility Spike', 'Price Action', 'Moving Average'
  ]
  const signals = ['BUY', 'SELL', 'NEUTRAL']
  const signal = signals[Math.floor(Math.random() * signals.length)]

  return {
    id: `signal-${Date.now()}-${Math.random()}`,
    algorithm: algorithms[Math.floor(Math.random() * algorithms.length)],
    signal,
    confidence: Math.floor(Math.random() * 30) + 70,
    price: 25800 + (Math.random() - 0.5) * 100,
    timestamp: Date.now(),
    reasoning: signal === 'BUY'
      ? 'Strong bullish momentum detected'
      : signal === 'SELL'
      ? 'Overbought conditions identified'
      : 'Neutral market conditions'
  }
}

// Resolvers
const resolvers = {
  Query: {
    latestCandles: (_: any, args: any) => {
      console.log(`[Query] latestCandles: ${args.symbol}, ${args.limit} candles`)
      return generateMockCandles(args.limit || 100)
    },
    currentTick: (_: any, args: any) => {
      console.log(`[Query] currentTick: ${args.symbol}`)
      return generateMockTick(args.symbol)
    }
  },

  Subscription: {
    newTick: {
      subscribe: async (_: any, args: any, { pubsub }: any) => {
        const topic = `tick:${args.symbol}`
        console.log(`[Subscription] newTick started for ${topic}`)

        const interval = setInterval(() => {
          const tick = generateMockTick(args.symbol)
          pubsub.publish({
            topic,
            payload: { newTick: tick }
          })
        }, 1000)

        const iterator = await pubsub.subscribe(topic)
        const originalReturn = iterator.return?.bind(iterator)
        iterator.return = async () => {
          clearInterval(interval)
          console.log(`[Subscription] newTick ended for ${topic}`)
          return originalReturn ? originalReturn() : { value: undefined, done: true }
        }

        return iterator
      }
    },

    algorithmSignal: {
      subscribe: async (_: any, __: any, { pubsub }: any) => {
        const topic = 'algorithm:signal'
        console.log(`[Subscription] algorithmSignal started`)

        const publishSignal = () => {
          const signal = generateMockSignal()
          pubsub.publish({
            topic,
            payload: { algorithmSignal: signal }
          })
          setTimeout(publishSignal, Math.floor(Math.random() * 20000) + 10000)
        }

        setTimeout(publishSignal, 5000)
        return await pubsub.subscribe(topic)
      }
    },

    candleUpdate: {
      subscribe: async (_: any, args: any, { pubsub }: any) => {
        const topic = `candle:${args.symbol}:${args.interval}`
        console.log(`[Subscription] candleUpdate started for ${topic}`)

        const intervalMs = args.interval === '1min' ? 60000 : 300000
        let basePrice = 25800

        const publishCandle = () => {
          const time = Math.floor(Date.now() / 1000)
          const change = (Math.random() - 0.5) * 50
          const open = basePrice
          const close = open + change
          const high = Math.max(open, close) + Math.random() * 20
          const low = Math.min(open, close) - Math.random() * 20
          const volume = Math.floor(Math.random() * 100000) + 50000

          const candle = { time, open, high, low, close, volume }
          basePrice = close

          pubsub.publish({
            topic,
            payload: { candleUpdate: candle }
          })
        }

        publishCandle()
        const timer = setInterval(publishCandle, intervalMs)

        const iterator = await pubsub.subscribe(topic)
        const originalReturn = iterator.return?.bind(iterator)
        iterator.return = async () => {
          clearInterval(timer)
          console.log(`[Subscription] candleUpdate ended for ${topic}`)
          return originalReturn ? originalReturn() : { value: undefined, done: true }
        }

        return iterator
      }
    }
  }
}

// Start server
async function start() {
  const app = Fastify({
    logger: true
  })

  await app.register(cors, {
    origin: ['http://localhost:3010', 'https://vyomo.in'],
    credentials: true
  })

  await app.register(websocket)

  await app.register(mercurius, {
    schema,
    resolvers,
    subscription: {
      emitter: new EventEmitter(),
      verifyClient: () => true
    },
    graphiql: true,
    ide: true,
    path: '/graphql'
  })

  app.get('/health', async () => ({
    status: 'ok',
    service: 'vyomo-live-chart-api',
    timestamp: new Date().toISOString()
  }))

  await app.listen({ port: PORT, host: HOST })

  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   Vyomo Live Chart API                                   ║
║   व्योमो - Momentum in Trade                              ║
║                                                          ║
║   GraphQL:     http://${HOST}:${PORT}/graphql              ║
║   GraphiQL:    http://${HOST}:${PORT}/graphiql            ║
║   Health:      http://${HOST}:${PORT}/health              ║
║                                                          ║
║   📈 Real-time candlestick data                          ║
║   🎯 Live ticks & algorithm signals                      ║
║                                                          ║
║   🙏 Jai Guru Ji                                         ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `)
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
