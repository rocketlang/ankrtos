/**
 * Mari8XOSRM - Production GraphQL API
 *
 * Public API endpoints for maritime routing
 */

import { gql } from 'graphql-tag';
import { PrismaClient } from '@prisma/client';
import { MaritimeGraph } from '../../services/routing/maritime-graph';
import { RoutePlanner } from '../../services/routing/route-planner';
import { IncrementalLearner } from '../../services/routing/incremental-learner';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

// Singleton instances for performance
let graphInstance: MaritimeGraph | null = null;
let learningMap: any = null;

async function getGraph() {
  if (!graphInstance) {
    graphInstance = new MaritimeGraph(prisma);
    await graphInstance.build();
  }
  return graphInstance;
}

async function getLearningMap() {
  if (!learningMap) {
    const learner = new IncrementalLearner(prisma);
    learningMap = await learner.buildRouteLearningBase();
  }
  return learningMap;
}

export const typeDefs = gql`
  # Maritime routing types

  type RouteSegment {
    fromPort: PortBasic!
    toPort: PortBasic!
    distanceNm: Float!
    greatCircleNm: Float!
    distanceFactor: Float!
    confidence: Float!
    observations: Int!
    routeType: String!
  }

  type RoutePlan {
    segments: [RouteSegment!]!
    totalDistanceNm: Float!
    totalGreatCircleNm: Float!
    avgDistanceFactor: Float!
    avgConfidence: Float!
    waypoints: [String!]!
    durationEstimate: Float
    fuelEstimate: Float
  }

  type DistancePrediction {
    predictedNm: Float!
    greatCircleNm: Float!
    factor: Float!
    confidence: Float!
    observations: Int!
    source: String!
  }

  type PortBasic {
    id: ID!
    unlocode: String!
    name: String!
    country: String!
    latitude: Float
    longitude: Float
  }

  type GraphStats {
    nodeCount: Int!
    edgeCount: Int!
    avgEdgesPerNode: Float!
    coverage: Float!
    avgConfidence: Float!
    highConfidenceEdges: Int!
  }

  type PortHub {
    port: PortBasic!
    connections: Int!
    routes: [RouteSegment!]!
  }

  extend type Query {
    # Find optimal route between two ports
    findRoute(
      originUnlocode: String!
      destUnlocode: String!
      vesselType: String
    ): RoutePlan

    # Predict distance for a route
    predictDistance(
      originUnlocode: String!
      destUnlocode: String!
      vesselType: String
    ): DistancePrediction

    # Get maritime graph statistics
    graphStats: GraphStats!

    # Find hub ports (most connected)
    findHubs(limit: Int): [PortHub!]!

    # Find ports near a location
    findPortsNearby(
      latitude: Float!
      longitude: Float!
      radiusNm: Float!
    ): [PortBasic!]!
  }
`;

export const resolvers = {
  Query: {
    async findRoute(_: any, args: { originUnlocode: string; destUnlocode: string; vesselType?: string }) {
      const graph = await getGraph();
      const planner = new RoutePlanner(prisma, graph);

      const originPort = graph.getNodeByUnlocode(args.originUnlocode);
      const destPort = graph.getNodeByUnlocode(args.destUnlocode);

      if (!originPort || !destPort) {
        throw new Error('Origin or destination port not found in graph');
      }

      const route = await planner.findRoute(
        originPort.id,
        destPort.id,
        args.vesselType || 'general_cargo'
      );

      if (!route) {
        return null;
      }

      // Calculate duration estimate (hours) based on average speed
      const avgSpeedKnots = 12; // Assume 12 knots average
      const durationEstimate = route.totalDistanceNm / avgSpeedKnots;

      // Rough fuel estimate (tons) - 0.15 tons per nm for general cargo
      const fuelEstimate = route.totalDistanceNm * 0.15;

      return {
        segments: route.segments.map(seg => ({
          fromPort: {
            id: seg.fromNode.id,
            unlocode: seg.fromNode.unlocode,
            name: seg.fromNode.name,
            country: seg.fromNode.country,
            latitude: seg.fromNode.latitude,
            longitude: seg.fromNode.longitude,
          },
          toPort: {
            id: seg.toNode.id,
            unlocode: seg.toNode.unlocode,
            name: seg.toNode.name,
            country: seg.toNode.country,
            latitude: seg.toNode.latitude,
            longitude: seg.toNode.longitude,
          },
          distanceNm: seg.edge.actualDistanceNm,
          greatCircleNm: seg.edge.greatCircleNm,
          distanceFactor: seg.edge.distanceFactor,
          confidence: seg.edge.confidence,
          observations: seg.edge.observations,
          routeType: seg.edge.routeType,
        })),
        totalDistanceNm: route.totalDistanceNm,
        totalGreatCircleNm: route.totalGreatCircleNm,
        avgDistanceFactor: route.avgDistanceFactor,
        avgConfidence: route.avgConfidence,
        waypoints: route.waypoints,
        durationEstimate,
        fuelEstimate,
      };
    },

    async predictDistance(_: any, args: { originUnlocode: string; destUnlocode: string; vesselType?: string }) {
      const graph = await getGraph();
      const learner = new IncrementalLearner(prisma);
      const learning = await getLearningMap();

      const originPort = graph.getNodeByUnlocode(args.originUnlocode);
      const destPort = graph.getNodeByUnlocode(args.destUnlocode);

      if (!originPort || !destPort) {
        throw new Error('Origin or destination port not found');
      }

      const prediction = await learner.predictWithLearning(
        originPort.id,
        destPort.id,
        args.vesselType || 'general_cargo',
        learning
      );

      return prediction;
    },

    async graphStats() {
      const graph = await getGraph();
      return graph.getStats();
    },

    async findHubs(_: any, args: { limit?: number }) {
      const graph = await getGraph();
      const hubs = graph.findHubs(args.limit || 10);

      return hubs.map(hub => ({
        port: {
          id: hub.node.id,
          unlocode: hub.node.unlocode,
          name: hub.node.name,
          country: hub.node.country,
          latitude: hub.node.latitude,
          longitude: hub.node.longitude,
        },
        connections: hub.connections,
        routes: hub.node.edges.map(edge => {
          const toNode = graph.getNode(edge.toNodeId);
          return {
            fromPort: {
              id: hub.node.id,
              unlocode: hub.node.unlocode,
              name: hub.node.name,
              country: hub.node.country,
              latitude: hub.node.latitude,
              longitude: hub.node.longitude,
            },
            toPort: {
              id: toNode!.id,
              unlocode: toNode!.unlocode,
              name: toNode!.name,
              country: toNode!.country,
              latitude: toNode!.latitude,
              longitude: toNode!.longitude,
            },
            distanceNm: edge.actualDistanceNm,
            greatCircleNm: edge.greatCircleNm,
            distanceFactor: edge.distanceFactor,
            confidence: edge.confidence,
            observations: edge.observations,
            routeType: edge.routeType,
          };
        }),
      }));
    },

    async findPortsNearby(_: any, args: { latitude: number; longitude: number; radiusNm: number }) {
      const graph = await getGraph();
      const ports = graph.findNodesNearby(args.latitude, args.longitude, args.radiusNm);

      return ports.map(port => ({
        id: port.id,
        unlocode: port.unlocode,
        name: port.name,
        country: port.country,
        latitude: port.latitude,
        longitude: port.longitude,
      }));
    },
  },
};
