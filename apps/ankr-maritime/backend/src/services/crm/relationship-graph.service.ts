/**
 * Relationship Graph Service
 * Map business relationships and broker networks
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

export interface RelationshipNode {
  id: string;
  type: 'COMPANY' | 'CONTACT' | 'USER';
  name: string;
  role?: string;
  company?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  score: number; // Influence/importance score 0-100
}

export interface RelationshipEdge {
  source: string; // Node ID
  target: string; // Node ID
  type:
    | 'WORKS_FOR'
    | 'BROKERS_FOR'
    | 'AGENT_OF'
    | 'OWNS'
    | 'CHARTERS_FROM'
    | 'TRADES_WITH'
    | 'KNOWS'
    | 'INTRODUCED_BY';
  strength: number; // 0-100
  frequency: number; // Interaction count
  lastInteraction?: Date;
  revenue?: number; // USD (if applicable)
  fixtures?: number; // Count
}

export interface RelationshipGraphData {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
  clusters: Array<{
    id: string;
    name: string;
    nodeIds: string[];
    type: 'BROKER_NETWORK' | 'CORPORATE_GROUP' | 'TRADING_PARTNER';
  }>;
  metrics: {
    totalNodes: number;
    totalEdges: number;
    avgDegree: number;
    keyConnectors: string[]; // High-degree nodes
    isolatedNodes: string[];
  };
}

export interface PathBetweenContacts {
  path: Array<{
    node: RelationshipNode;
    relationship: string;
  }>;
  distance: number; // Degrees of separation
  confidence: number; // 0-1
}

export interface NetworkInsight {
  type: 'KEY_CONNECTOR' | 'ISOLATED' | 'NEW_OPPORTUNITY' | 'AT_RISK';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  recommendation: string;
  nodeIds: string[];
}

export class RelationshipGraphService {
  /**
   * Generate full relationship graph for organization
   */
  async generateRelationshipGraph(
    organizationId: string,
    depth: number = 2
  ): Promise<RelationshipGraphData> {
    const nodes: RelationshipNode[] = [];
    const edges: RelationshipEdge[] = [];
    const nodeMap = new Map<string, RelationshipNode>();

    // Get all companies
    const companies = await prisma.company.findMany({
      where: { organizationId },
      include: {
        contacts: true,
        relationships: true,
      },
    });

    // Add company nodes
    for (const company of companies) {
      const node: RelationshipNode = {
        id: `company-${company.id}`,
        type: 'COMPANY',
        name: company.name,
        role: company.type,
        score: this.calculateCompanyScore(company),
      };
      nodes.push(node);
      nodeMap.set(node.id, node);

      // Add contact nodes
      for (const contact of company.contacts) {
        const contactNode: RelationshipNode = {
          id: `contact-${contact.id}`,
          type: 'CONTACT',
          name: contact.name,
          role: contact.role || undefined,
          company: company.name,
          email: contact.email || undefined,
          phone: contact.phone || undefined,
          score: this.calculateContactScore(contact),
        };
        nodes.push(contactNode);
        nodeMap.set(contactNode.id, contactNode);

        // Add WORKS_FOR edge
        edges.push({
          source: contactNode.id,
          target: node.id,
          type: 'WORKS_FOR',
          strength: 100,
          frequency: 0,
        });
      }

      // Add company relationship edges
      for (const rel of company.relationships) {
        const targetId = `company-${rel.relatedCompanyId}`;
        if (nodeMap.has(targetId)) {
          edges.push({
            source: node.id,
            target: targetId,
            type: this.mapRelationshipType(rel.type),
            strength: rel.strength || 50,
            frequency: rel.interactionCount || 0,
            lastInteraction: rel.lastInteraction || undefined,
          });
        }
      }
    }

    // Analyze trading relationships from fixtures
    const tradingEdges = await this.analyzeFixtureRelationships(organizationId);
    edges.push(...tradingEdges);

    // Detect clusters
    const clusters = this.detectClusters(nodes, edges);

    // Calculate metrics
    const metrics = this.calculateGraphMetrics(nodes, edges);

    return {
      nodes,
      edges,
      clusters,
      metrics,
    };
  }

  /**
   * Find path between two contacts
   */
  async findPathBetweenContacts(
    contactId1: string,
    contactId2: string,
    organizationId: string
  ): Promise<PathBetweenContacts | null> {
    const graph = await this.generateRelationshipGraph(organizationId, 3);

    const nodeId1 = `contact-${contactId1}`;
    const nodeId2 = `contact-${contactId2}`;

    // BFS to find shortest path
    const queue: Array<{ nodeId: string; path: string[] }> = [
      { nodeId: nodeId1, path: [nodeId1] },
    ];
    const visited = new Set<string>([nodeId1]);

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;

      if (nodeId === nodeId2) {
        // Found path!
        const pathNodes = path.map((id) => {
          const node = graph.nodes.find((n) => n.id === id)!;
          const edge = path.indexOf(id) > 0
            ? graph.edges.find(
                (e) =>
                  (e.source === path[path.indexOf(id) - 1] && e.target === id) ||
                  (e.target === path[path.indexOf(id) - 1] && e.source === id)
              )
            : null;

          return {
            node,
            relationship: edge?.type || 'START',
          };
        });

        return {
          path: pathNodes,
          distance: path.length - 1,
          confidence: this.calculatePathConfidence(pathNodes),
        };
      }

      // Find neighbors
      const neighbors = graph.edges
        .filter((e) => e.source === nodeId || e.target === nodeId)
        .map((e) => (e.source === nodeId ? e.target : e.source))
        .filter((n) => !visited.has(n));

      for (const neighbor of neighbors) {
        visited.add(neighbor);
        queue.push({
          nodeId: neighbor,
          path: [...path, neighbor],
        });
      }
    }

    return null; // No path found
  }

  /**
   * Get network insights and recommendations
   */
  async getNetworkInsights(organizationId: string): Promise<NetworkInsight[]> {
    const graph = await this.generateRelationshipGraph(organizationId);
    const insights: NetworkInsight[] = [];

    // Identify key connectors (high-degree nodes)
    const degreeMap = new Map<string, number>();
    graph.edges.forEach((e) => {
      degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
    });

    const keyConnectors = Array.from(degreeMap.entries())
      .filter(([_, degree]) => degree >= 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nodeId]) => nodeId);

    if (keyConnectors.length > 0) {
      insights.push({
        type: 'KEY_CONNECTOR',
        severity: 'HIGH',
        title: 'Key Network Connectors Identified',
        description: `${keyConnectors.length} contacts with 5+ connections serve as network hubs`,
        recommendation: 'Maintain strong relationships with these key connectors',
        nodeIds: keyConnectors,
      });
    }

    // Identify isolated nodes
    const isolatedNodes = graph.nodes
      .filter((n) => n.type === 'CONTACT')
      .filter((n) => {
        const degree = degreeMap.get(n.id) || 0;
        return degree <= 1;
      })
      .map((n) => n.id);

    if (isolatedNodes.length > 0) {
      insights.push({
        type: 'ISOLATED',
        severity: 'MEDIUM',
        title: `${isolatedNodes.length} Isolated Contacts`,
        description: 'Contacts with minimal network connections may need introduction',
        recommendation: 'Consider introducing isolated contacts to relevant connections',
        nodeIds: isolatedNodes,
      });
    }

    // Identify trading opportunities (companies with no direct relationship)
    const connectedCompanies = new Set(
      graph.edges
        .filter((e) => e.type === 'TRADES_WITH' || e.type === 'CHARTERS_FROM')
        .flatMap((e) => [e.source, e.target])
    );

    const unconnectedCompanies = graph.nodes
      .filter((n) => n.type === 'COMPANY' && !connectedCompanies.has(n.id))
      .map((n) => n.id);

    if (unconnectedCompanies.length > 0) {
      insights.push({
        type: 'NEW_OPPORTUNITY',
        severity: 'MEDIUM',
        title: `${unconnectedCompanies.length} Potential Trading Partners`,
        description: 'Companies in your network with no trading history',
        recommendation: 'Explore business opportunities with these companies',
        nodeIds: unconnectedCompanies.slice(0, 5),
      });
    }

    // Identify at-risk relationships (no recent interaction)
    const staleEdges = graph.edges.filter(
      (e) =>
        e.lastInteraction &&
        Date.now() - e.lastInteraction.getTime() > 180 * 24 * 60 * 60 * 1000 // 180 days
    );

    if (staleEdges.length > 0) {
      insights.push({
        type: 'AT_RISK',
        severity: 'HIGH',
        title: `${staleEdges.length} Stale Relationships`,
        description: 'Business relationships with no interaction in 6+ months',
        recommendation: 'Re-engage with these contacts to maintain relationships',
        nodeIds: staleEdges.map((e) => e.target),
      });
    }

    return insights;
  }

  /**
   * Suggest introductions (who should meet whom)
   */
  async suggestIntroductions(
    organizationId: string
  ): Promise<
    Array<{
      contact1: RelationshipNode;
      contact2: RelationshipNode;
      connector: RelationshipNode;
      reason: string;
      potentialValue: number; // 0-100
    }>
  > {
    const graph = await this.generateRelationshipGraph(organizationId);
    const suggestions = [];

    // Find pairs of contacts who should meet
    const contacts = graph.nodes.filter((n) => n.type === 'CONTACT');

    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const contact1 = contacts[i];
        const contact2 = contacts[j];

        // Check if they're connected
        const connected = graph.edges.some(
          (e) =>
            (e.source === contact1.id && e.target === contact2.id) ||
            (e.target === contact1.id && e.source === contact2.id)
        );

        if (!connected) {
          // Find common connector
          const path = await this.findPathBetweenContacts(
            contact1.id.replace('contact-', ''),
            contact2.id.replace('contact-', ''),
            organizationId
          );

          if (path && path.distance === 2) {
            // One degree apart - ideal for introduction
            const connectorNode = path.path[1].node;

            suggestions.push({
              contact1,
              contact2,
              connector: connectorNode,
              reason: `${contact1.name} and ${contact2.name} both work with ${connectorNode.name}`,
              potentialValue: (contact1.score + contact2.score) / 2,
            });
          }
        }
      }
    }

    // Sort by potential value
    suggestions.sort((a, b) => b.potentialValue - a.potentialValue);

    return suggestions.slice(0, 10); // Top 10 suggestions
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private calculateCompanyScore(company: any): number {
    let score = 50; // Base score

    // More contacts = higher score
    score += Math.min(company.contacts?.length * 5 || 0, 20);

    // Type-based bonus
    if (company.type === 'OWNER' || company.type === 'CHARTERER') score += 15;
    else if (company.type === 'BROKER') score += 10;

    // Relationship count
    score += Math.min((company.relationships?.length || 0) * 3, 15);

    return Math.min(100, score);
  }

  private calculateContactScore(contact: any): number {
    let score = 40; // Base score

    // Has email/phone
    if (contact.email) score += 10;
    if (contact.phone) score += 10;

    // Role importance
    if (contact.role?.includes('Director') || contact.role?.includes('Manager')) {
      score += 20;
    } else if (contact.role?.includes('Senior')) {
      score += 15;
    }

    // Recent activity
    if (contact.lastContactedAt) {
      const daysSince = (Date.now() - contact.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) score += 20;
      else if (daysSince < 90) score += 10;
    }

    return Math.min(100, score);
  }

  private mapRelationshipType(type: string): RelationshipEdge['type'] {
    const mapping: Record<string, RelationshipEdge['type']> = {
      BROKER_FOR: 'BROKERS_FOR',
      AGENT_OF: 'AGENT_OF',
      SUBSIDIARY: 'OWNS',
      TRADES_WITH: 'TRADES_WITH',
    };
    return mapping[type] || 'KNOWS';
  }

  private async analyzeFixtureRelationships(
    organizationId: string
  ): Promise<RelationshipEdge[]> {
    // Get fixture data to infer trading relationships
    const charters = await prisma.charter.findMany({
      where: { organizationId, status: 'FIXED' },
      include: {
        charterer: true,
        vessel: { include: { owner: true } },
      },
    });

    const edges: RelationshipEdge[] = [];
    const relationshipMap = new Map<string, { frequency: number; revenue: number }>();

    charters.forEach((charter) => {
      if (charter.charterer && charter.vessel?.owner) {
        const key = `${charter.chartererId}-${charter.vessel.ownerId}`;
        const existing = relationshipMap.get(key) || { frequency: 0, revenue: 0 };
        relationshipMap.set(key, {
          frequency: existing.frequency + 1,
          revenue: existing.revenue + (charter.freightRate || 0),
        });
      }
    });

    relationshipMap.forEach((data, key) => {
      const [chartererId, ownerId] = key.split('-');
      edges.push({
        source: `company-${chartererId}`,
        target: `company-${ownerId}`,
        type: 'CHARTERS_FROM',
        strength: Math.min(100, data.frequency * 10),
        frequency: data.frequency,
        revenue: data.revenue,
        fixtures: data.frequency,
      });
    });

    return edges;
  }

  private detectClusters(
    nodes: RelationshipNode[],
    edges: RelationshipEdge[]
  ): Array<{
    id: string;
    name: string;
    nodeIds: string[];
    type: 'BROKER_NETWORK' | 'CORPORATE_GROUP' | 'TRADING_PARTNER';
  }> {
    // Simple clustering: group nodes by broker relationships
    const clusters = [];
    const visited = new Set<string>();

    nodes
      .filter((n) => n.type === 'COMPANY' && n.role === 'BROKER')
      .forEach((brokerNode, index) => {
        if (visited.has(brokerNode.id)) return;

        const clusterNodes = [brokerNode.id];
        visited.add(brokerNode.id);

        // Find all companies this broker represents
        edges
          .filter((e) => e.source === brokerNode.id && e.type === 'BROKERS_FOR')
          .forEach((e) => {
            clusterNodes.push(e.target);
            visited.add(e.target);
          });

        if (clusterNodes.length > 1) {
          clusters.push({
            id: `cluster-${index}`,
            name: `${brokerNode.name} Network`,
            nodeIds: clusterNodes,
            type: 'BROKER_NETWORK' as const,
          });
        }
      });

    return clusters;
  }

  private calculateGraphMetrics(
    nodes: RelationshipNode[],
    edges: RelationshipEdge[]
  ): {
    totalNodes: number;
    totalEdges: number;
    avgDegree: number;
    keyConnectors: string[];
    isolatedNodes: string[];
  } {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;

    const degreeMap = new Map<string, number>();
    edges.forEach((e) => {
      degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
    });

    const degrees = Array.from(degreeMap.values());
    const avgDegree = degrees.length > 0 ? degrees.reduce((a, b) => a + b, 0) / degrees.length : 0;

    const keyConnectors = Array.from(degreeMap.entries())
      .filter(([_, degree]) => degree >= 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nodeId]) => nodeId);

    const isolatedNodes = nodes
      .filter((n) => (degreeMap.get(n.id) || 0) <= 1)
      .map((n) => n.id);

    return {
      totalNodes,
      totalEdges,
      avgDegree: Math.round(avgDegree * 10) / 10,
      keyConnectors,
      isolatedNodes,
    };
  }

  private calculatePathConfidence(
    path: Array<{ node: RelationshipNode; relationship: string }>
  ): number {
    // Shorter paths have higher confidence
    let confidence = 1.0 - (path.length - 1) * 0.2;

    // Strong relationships boost confidence
    const avgScore = path.reduce((sum, p) => sum + p.node.score, 0) / path.length;
    confidence *= avgScore / 100;

    return Math.max(0.1, Math.min(1.0, confidence));
  }
}

export const relationshipGraphService = new RelationshipGraphService();
