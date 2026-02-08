/**
 * Mari8XOSRM - Maritime Graph Structure
 *
 * Week 3: Build the routing graph where:
 * - Ports are nodes
 * - Extracted routes are edges (with learned distance factors)
 * - A* pathfinding uses this graph to find optimal routes
 */

import { PrismaClient } from '@prisma/client';
import { createChildLogger } from '../../utils/logger';

const logger = createChildLogger({ module: 'maritime-graph' });

export interface GraphNode {
  id: string; // Port ID
  unlocode: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;

  // Graph connectivity
  edges: GraphEdge[];
}

export interface GraphEdge {
  id: string; // ExtractedAISRoute ID
  fromNodeId: string;
  toNodeId: string;

  // Distance metrics
  greatCircleNm: number;
  actualDistanceNm: number;
  distanceFactor: number;

  // Quality metrics
  qualityScore: number;
  observations: number; // How many times this route has been traveled
  confidence: number; // 0-1 confidence in this edge

  // Route characteristics
  vesselTypes: string[]; // Which vessel types have used this route
  routeType: string; // DIRECT, COASTAL, VIA_CANAL
  viaPoints: string[]; // Chokepoints/waypoints

  // Traversal cost (for A* algorithm)
  cost: number; // Weighted cost considering distance + quality
}

export interface RouteSegment {
  edge: GraphEdge;
  fromNode: GraphNode;
  toNode: GraphNode;
}

export interface RoutePlan {
  segments: RouteSegment[];
  totalDistanceNm: number;
  totalGreatCircleNm: number;
  avgDistanceFactor: number;
  avgConfidence: number;
  totalCost: number;
  waypoints: string[]; // Port names
}

export class MaritimeGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private nodesByUnlocode: Map<string, GraphNode> = new Map();

  constructor(private prisma: PrismaClient) {}

  /**
   * Build the graph from database
   */
  async build(): Promise<void> {
    logger.info('🗺️  Building maritime graph...');

    // Load all ports that have routes
    const portsWithRoutes = await this.prisma.port.findMany({
      where: {
        OR: [
          { routesFrom: { some: {} } },
          { routesTo: { some: {} } },
        ],
      },
      select: {
        id: true,
        unlocode: true,
        name: true,
        country: true,
        latitude: true,
        longitude: true,
      },
    });

    logger.info(`Loading ${portsWithRoutes.length} ports with routes...`);

    // Create nodes
    for (const port of portsWithRoutes) {
      if (!port.latitude || !port.longitude) continue;

      const node: GraphNode = {
        id: port.id,
        unlocode: port.unlocode,
        name: port.name,
        country: port.country,
        latitude: port.latitude,
        longitude: port.longitude,
        edges: [],
      };

      this.nodes.set(port.id, node);
      this.nodesByUnlocode.set(port.unlocode, node);
    }

    logger.info(`✓ Created ${this.nodes.size} graph nodes`);

    // Load all routes and create edges
    const routes = await this.prisma.extractedAISRoute.findMany({
      where: {
        qualityScore: { gte: 0.6 },
        distanceFactor: { gte: 1.0, lte: 3.5 },
      },
      include: {
        originPort: { select: { id: true } },
        destPort: { select: { id: true } },
      },
    });

    logger.info(`Loading ${routes.length} routes...`);

    // Group routes by port pair to calculate observations
    const routeGroups = new Map<string, typeof routes>();
    for (const route of routes) {
      const key = `${route.originPortId}-${route.destPortId}`;
      if (!routeGroups.has(key)) {
        routeGroups.set(key, []);
      }
      routeGroups.get(key)!.push(route);
    }

    // Create edges from route groups
    let edgeCount = 0;
    for (const [portPairKey, groupRoutes] of routeGroups) {
      const firstRoute = groupRoutes[0];
      const fromNode = this.nodes.get(firstRoute.originPortId);
      const toNode = this.nodes.get(firstRoute.destPortId);

      if (!fromNode || !toNode) continue;

      // Calculate aggregate metrics for this port pair
      const observations = groupRoutes.length;
      const avgDistanceFactor = groupRoutes.reduce((sum, r) => sum + r.distanceFactor, 0) / observations;
      const avgQuality = groupRoutes.reduce((sum, r) => sum + r.qualityScore, 0) / observations;
      const vesselTypes = [...new Set(groupRoutes.map(r => r.vesselType))];

      // Confidence based on observations (same formula as incremental learner)
      const confidence = 1 - Math.exp(-observations / 10);

      // Cost calculation: distance * quality_penalty
      // Lower quality = higher cost (penalty)
      const qualityPenalty = 1 / avgQuality; // 1.0 for perfect quality, 1.67 for 0.6 quality
      const cost = firstRoute.greatCircleNm * avgDistanceFactor * qualityPenalty;

      const edge: GraphEdge = {
        id: firstRoute.id,
        fromNodeId: fromNode.id,
        toNodeId: toNode.id,
        greatCircleNm: firstRoute.greatCircleNm,
        actualDistanceNm: firstRoute.actualSailedNm,
        distanceFactor: avgDistanceFactor,
        qualityScore: avgQuality,
        observations,
        confidence,
        vesselTypes,
        routeType: firstRoute.routeType,
        viaPoints: firstRoute.viaPoints || [],
        cost,
      };

      fromNode.edges.push(edge);
      edgeCount++;
    }

    logger.info(`✓ Created ${edgeCount} graph edges`);
    logger.info(`✓ Maritime graph built successfully!`);
    logger.info(`   Nodes: ${this.nodes.size} ports`);
    logger.info(`   Edges: ${edgeCount} routes`);
    logger.info(`   Avg edges per node: ${(edgeCount / this.nodes.size).toFixed(1)}`);
  }

  /**
   * Get node by port ID
   */
  getNode(portId: string): GraphNode | undefined {
    return this.nodes.get(portId);
  }

  /**
   * Get node by UNLOCODE
   */
  getNodeByUnlocode(unlocode: string): GraphNode | undefined {
    return this.nodesByUnlocode.get(unlocode);
  }

  /**
   * Find all nodes within radius of a point
   */
  findNodesNearby(lat: number, lon: number, radiusNm: number): GraphNode[] {
    const nearby: GraphNode[] = [];

    for (const node of this.nodes.values()) {
      const distance = this.haversineDistance(lat, lon, node.latitude, node.longitude);
      if (distance <= radiusNm) {
        nearby.push(node);
      }
    }

    return nearby.sort((a, b) => {
      const distA = this.haversineDistance(lat, lon, a.latitude, a.longitude);
      const distB = this.haversineDistance(lat, lon, b.latitude, b.longitude);
      return distA - distB;
    });
  }

  /**
   * Get all nodes
   */
  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get graph statistics
   */
  getStats() {
    const nodes = Array.from(this.nodes.values());
    const totalEdges = nodes.reduce((sum, n) => sum + n.edges.length, 0);

    const edgeCounts = nodes.map(n => n.edges.length);
    const avgEdges = totalEdges / nodes.length;
    const maxEdges = Math.max(...edgeCounts);
    const minEdges = Math.min(...edgeCounts);

    const nodesWithoutEdges = nodes.filter(n => n.edges.length === 0).length;
    const nodesWithEdges = nodes.length - nodesWithoutEdges;

    // Calculate average confidence
    const allEdges = nodes.flatMap(n => n.edges);
    const avgConfidence = allEdges.reduce((sum, e) => sum + e.confidence, 0) / allEdges.length;
    const highConfidenceEdges = allEdges.filter(e => e.confidence > 0.8).length;

    return {
      nodeCount: nodes.length,
      edgeCount: totalEdges,
      avgEdgesPerNode: avgEdges,
      maxEdgesPerNode: maxEdges,
      minEdgesPerNode: minEdges,
      nodesWithoutEdges,
      nodesWithEdges,
      avgConfidence,
      highConfidenceEdges,
      coverage: (nodesWithEdges / nodes.length) * 100,
    };
  }

  /**
   * Find most connected ports (hubs)
   */
  findHubs(limit: number = 10): Array<{ node: GraphNode; connections: number }> {
    return Array.from(this.nodes.values())
      .map(node => ({ node, connections: node.edges.length }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, limit);
  }

  /**
   * Haversine distance calculation
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Nautical miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Export graph for visualization
   */
  exportForVisualization() {
    const nodes = Array.from(this.nodes.values()).map(n => ({
      id: n.id,
      unlocode: n.unlocode,
      name: n.name,
      country: n.country,
      lat: n.latitude,
      lon: n.longitude,
      connections: n.edges.length,
    }));

    const edges = Array.from(this.nodes.values()).flatMap(n =>
      n.edges.map(e => ({
        from: n.unlocode,
        to: this.nodes.get(e.toNodeId)?.unlocode || '',
        distance: e.actualDistanceNm,
        factor: e.distanceFactor,
        confidence: e.confidence,
        observations: e.observations,
      }))
    );

    return { nodes, edges };
  }
}
