/**
 * GraphQL Resolver for Hybrid AIS Coverage
 * Integrates with your existing Mari8x GraphQL schema
 */

import { HybridAISCoverage } from '../services/hybrid-ais-coverage';
import { prisma } from '../lib/prisma';

// Your existing AIS source - customize based on your current setup
const primaryAIS = {
  async getVessels(bounds: any) {
    // Option 1: If you're using Prisma with AISPosition table
    const vessels = await prisma.aISPosition.findMany({
      where: {
        latitude: { gte: bounds.south, lte: bounds.north },
        longitude: { gte: bounds.west, lte: bounds.east },
        timestamp: { gte: new Date(Date.now() - 3600000) } // Last hour
      },
      orderBy: { timestamp: 'desc' },
      distinct: ['mmsi']
    });

    return vessels.map(v => ({
      mmsi: v.mmsi,
      lat: v.latitude,
      lon: v.longitude,
      speed: v.sog,
      course: v.cog,
      heading: v.heading,
      name: v.vesselName,
      timestamp: v.timestamp
    }));

    // Option 2: If you're using another API
    // const response = await fetch(`${process.env.PRIMARY_AIS_API}/vessels?bbox=...`);
    // return response.json();
  }
};

// Initialize hybrid coverage
const hybridCoverage = new HybridAISCoverage(
  process.env.AISSTREAM_API_KEY || '',
  primaryAIS
);

export const hybridAISResolvers = {
  Query: {
    /**
     * Get vessels with hybrid coverage (primary + AISStream fallback)
     */
    hybridVessels: async (_: any, args: {
      bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
      }
    }) => {
      const vessels = await hybridCoverage.getVesselsWithFallback(args.bounds);
      return vessels;
    },

    /**
     * Get coverage statistics
     */
    coverageStats: async (_: any, args: {
      bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
      }
    }) => {
      const stats = await hybridCoverage.getCoverageStats(args.bounds);
      return stats;
    }
  },

  Subscription: {
    /**
     * Real-time hybrid vessel stream
     */
    hybridVesselStream: {
      subscribe: async (_: any, args: {
        bounds: {
          north: number;
          south: number;
          east: number;
          west: number;
        }
      }) => {
        // Create hybrid stream
        const stream = hybridCoverage.createHybridStream(args.bounds);

        // Convert WebSocket to AsyncIterator for GraphQL subscriptions
        // This is a simplified example - you'll need proper pubsub integration

        return {
          async *[Symbol.asyncIterator]() {
            for await (const message of stream) {
              yield { hybridVesselStream: message };
            }
          }
        };
      }
    }
  }
};

/**
 * GraphQL Schema additions
 * Add these types to your existing schema
 */
export const hybridAISTypeDefs = `
  type AISVessel {
    mmsi: String!
    lat: Float!
    lon: Float!
    speed: Float
    course: Float
    heading: Float
    name: String
    timestamp: DateTime!
    source: String!  # 'primary' | 'aisstream' | 'merged'
    quality: Float   # 0-1 confidence score
  }

  type CoverageStats {
    total: Int!
    bySource: SourceBreakdown!
    coverageImprovement: Int!
  }

  type SourceBreakdown {
    primary: Int!
    aisstream: Int!
    merged: Int!
  }

  input BoundsInput {
    north: Float!
    south: Float!
    east: Float!
    west: Float!
  }

  extend type Query {
    hybridVessels(bounds: BoundsInput!): [AISVessel!]!
    coverageStats(bounds: BoundsInput!): CoverageStats!
  }

  extend type Subscription {
    hybridVesselStream(bounds: BoundsInput!): AISVessel!
  }
`;
