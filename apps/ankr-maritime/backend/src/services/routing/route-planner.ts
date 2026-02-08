/**
 * Mari8XOSRM - A* Route Planning
 *
 * Week 3: A* pathfinding algorithm that finds optimal maritime routes
 * using the learned distance factors from real AIS data
 */

import { PrismaClient } from '@prisma/client';
import { MaritimeGraph, GraphNode, GraphEdge, RoutePlan, RouteSegment } from './maritime-graph';
import { createChildLogger } from '../../utils/logger';

const logger = createChildLogger({ module: 'route-planner' });

interface AStarNode {
  node: GraphNode;
  gCost: number; // Actual cost from start
  hCost: number; // Estimated cost to goal (heuristic)
  fCost: number; // gCost + hCost
  parent: AStarNode | null;
  edge: GraphEdge | null; // Edge used to reach this node
}

export class RoutePlanner {
  constructor(
    private prisma: PrismaClient,
    private graph: MaritimeGraph
  ) {}

  /**
   * Find optimal route between two ports using A* algorithm
   */
  async findRoute(
    originPortId: string,
    destPortId: string,
    vesselType: string = 'general_cargo'
  ): Promise<RoutePlan | null> {
    logger.info(`🔍 Finding route: ${originPortId} → ${destPortId} (${vesselType})`);

    const startNode = this.graph.getNode(originPortId);
    const goalNode = this.graph.getNode(destPortId);

    if (!startNode || !goalNode) {
      logger.error('Start or goal node not found in graph');
      return null;
    }

    // A* algorithm
    const openSet = new Map<string, AStarNode>();
    const closedSet = new Set<string>();

    // Initialize start node
    const startAStarNode: AStarNode = {
      node: startNode,
      gCost: 0,
      hCost: this.heuristic(startNode, goalNode),
      fCost: 0,
      parent: null,
      edge: null,
    };
    startAStarNode.fCost = startAStarNode.gCost + startAStarNode.hCost;

    openSet.set(startNode.id, startAStarNode);

    let iterations = 0;
    const maxIterations = 1000; // Prevent infinite loops

    while (openSet.size > 0 && iterations < maxIterations) {
      iterations++;

      // Find node with lowest fCost
      let current: AStarNode | null = null;
      let lowestFCost = Infinity;

      for (const node of openSet.values()) {
        if (node.fCost < lowestFCost) {
          lowestFCost = node.fCost;
          current = node;
        }
      }

      if (!current) break;

      // Goal reached!
      if (current.node.id === goalNode.id) {
        logger.info(`✓ Route found in ${iterations} iterations`);
        return this.reconstructPath(current);
      }

      // Move current from open to closed
      openSet.delete(current.node.id);
      closedSet.add(current.node.id);

      // Explore neighbors
      for (const edge of current.node.edges) {
        const neighbor = this.graph.getNode(edge.toNodeId);
        if (!neighbor || closedSet.has(neighbor.id)) continue;

        // Calculate cost through this path
        const tentativeGCost = current.gCost + edge.cost;

        const existingNeighbor = openSet.get(neighbor.id);
        if (!existingNeighbor || tentativeGCost < existingNeighbor.gCost) {
          // This path is better
          const neighborAStarNode: AStarNode = {
            node: neighbor,
            gCost: tentativeGCost,
            hCost: this.heuristic(neighbor, goalNode),
            fCost: 0,
            parent: current,
            edge: edge,
          };
          neighborAStarNode.fCost = neighborAStarNode.gCost + neighborAStarNode.hCost;

          openSet.set(neighbor.id, neighborAStarNode);
        }
      }
    }

    logger.warn(`No route found after ${iterations} iterations`);
    return null;
  }

  /**
   * Heuristic function for A*: straight-line distance to goal
   */
  private heuristic(from: GraphNode, to: GraphNode): number {
    // Use great circle distance as heuristic
    // Apply average distance factor as multiplier for realism
    const gcDistance = this.haversineDistance(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude
    );

    // Use 1.5x as average factor (from our learned routes)
    return gcDistance * 1.5;
  }

  /**
   * Reconstruct the path from A* result
   */
  private reconstructPath(goalNode: AStarNode): RoutePlan {
    const segments: RouteSegment[] = [];
    let current: AStarNode | null = goalNode;

    // Walk backwards from goal to start
    while (current && current.parent) {
      if (current.edge) {
        segments.unshift({
          edge: current.edge,
          fromNode: current.parent.node,
          toNode: current.node,
        });
      }
      current = current.parent;
    }

    // Calculate totals
    const totalDistanceNm = segments.reduce((sum, s) => sum + s.edge.actualDistanceNm, 0);
    const totalGreatCircleNm = segments.reduce((sum, s) => sum + s.edge.greatCircleNm, 0);
    const avgDistanceFactor = totalDistanceNm / totalGreatCircleNm;
    const avgConfidence = segments.reduce((sum, s) => sum + s.edge.confidence, 0) / segments.length;
    const totalCost = segments.reduce((sum, s) => sum + s.edge.cost, 0);
    const waypoints = [
      segments[0].fromNode.name,
      ...segments.map(s => s.toNode.name),
    ];

    return {
      segments,
      totalDistanceNm,
      totalGreatCircleNm,
      avgDistanceFactor,
      avgConfidence,
      totalCost,
      waypoints,
    };
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
   * Find multiple route options (fast, balanced, accurate)
   */
  async findRouteOptions(
    originPortId: string,
    destPortId: string,
    vesselType: string = 'general_cargo'
  ): Promise<{
    fast: RoutePlan | null;
    balanced: RoutePlan | null;
    accurate: RoutePlan | null;
  }> {
    // For now, return the same route (single-path A*)
    // In future: implement multi-path or K-shortest paths
    const route = await this.findRoute(originPortId, destPortId, vesselType);

    return {
      fast: route,
      balanced: route,
      accurate: route,
    };
  }
}
