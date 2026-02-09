#!/usr/bin/env tsx
/**
 * Mari8XOSRM - Route Planning Demo
 * Week 3: Demonstrate maritime graph and A* pathfinding
 */

import { PrismaClient } from '@prisma/client';
import { MaritimeGraph } from '../services/routing/maritime-graph';
import { RoutePlanner } from '../services/routing/route-planner';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

async function main() {
  console.log('🗺️  Mari8XOSRM - Route Planning Demo\n');
  console.log('═'.repeat(80));
  console.log('Building intelligent maritime routing using real AIS data');
  console.log('═'.repeat(80));
  console.log();

  // Step 1: Build the graph
  console.log('📊 Step 1: Building Maritime Graph...\n');
  const graph = new MaritimeGraph(prisma);
  await graph.build();

  const stats = graph.getStats();
  console.log('\n📈 Graph Statistics:');
  console.log('─'.repeat(80));
  console.log(`Ports in graph: ${stats.nodeCount}`);
  console.log(`Routes (edges): ${stats.edgeCount}`);
  console.log(`Avg routes per port: ${stats.avgEdgesPerNode.toFixed(1)}`);
  console.log(`Max routes from one port: ${stats.maxEdgesPerNode}`);
  console.log(`Graph coverage: ${stats.coverage.toFixed(1)}% of ports have routes`);
  console.log(`Average confidence: ${(stats.avgConfidence * 100).toFixed(0)}%`);
  console.log(`High confidence routes: ${stats.highConfidenceEdges} (${((stats.highConfidenceEdges / stats.edgeCount) * 100).toFixed(0)}%)`);

  // Step 2: Find hub ports
  console.log('\n\n🌟 Step 2: Maritime Hubs (Most Connected Ports)\n');
  console.log('─'.repeat(80));
  const hubs = graph.findHubs(10);
  hubs.forEach((hub, i) => {
    console.log(`${i + 1}. ${hub.node.name}, ${hub.node.country} (${hub.node.unlocode})`);
    console.log(`   ${hub.connections} routes → ${hub.connections} destinations`);
  });

  // Step 3: Plan a route
  console.log('\n\n🧭 Step 3: Route Planning with A* Algorithm\n');
  console.log('─'.repeat(80));

  const planner = new RoutePlanner(prisma, graph);

  // Try to find a multi-hop route
  if (hubs.length >= 2) {
    const origin = hubs[0].node;
    const destination = hubs[hubs.length - 1].node;

    console.log(`\nPlanning route:`);
    console.log(`  Origin: ${origin.name}, ${origin.country} (${origin.unlocode})`);
    console.log(`  Destination: ${destination.name}, ${destination.country} (${destination.unlocode})`);
    console.log();

    const route = await planner.findRoute(origin.id, destination.id);

    if (route) {
      console.log('✅ Route Found!\n');
      console.log('Route Details:');
      console.log('─'.repeat(80));
      console.log(`Total Distance: ${route.totalDistanceNm.toFixed(0)}nm`);
      console.log(`Great Circle: ${route.totalGreatCircleNm.toFixed(0)}nm`);
      console.log(`Distance Factor: ${route.avgDistanceFactor.toFixed(2)}x (${((route.avgDistanceFactor - 1) * 100).toFixed(0)}% longer)`);
      console.log(`Confidence: ${(route.avgConfidence * 100).toFixed(0)}%`);
      console.log(`Segments: ${route.segments.length}`);

      console.log('\nWaypoints:');
      route.waypoints.forEach((wp, i) => {
        console.log(`  ${i + 1}. ${wp}`);
      });

      console.log('\nDetailed Segments:');
      console.log('─'.repeat(80));
      route.segments.forEach((seg, i) => {
        console.log(`\n${i + 1}. ${seg.fromNode.name} → ${seg.toNode.name}`);
        console.log(`   Distance: ${seg.edge.actualDistanceNm.toFixed(0)}nm (${seg.edge.distanceFactor.toFixed(2)}x GC)`);
        console.log(`   Quality: ${(seg.edge.qualityScore * 100).toFixed(0)}%`);
        console.log(`   Confidence: ${(seg.edge.confidence * 100).toFixed(0)}%`);
        console.log(`   Observations: ${seg.edge.observations}`);
        console.log(`   Route Type: ${seg.edge.routeType}`);
      });
    } else {
      console.log('❌ No route found between these ports');
      console.log('   (Ports not connected in current graph)');
    }
  }

  // Step 4: Explain the system
  console.log('\n\n💡 How Mari8XOSRM Works:\n');
  console.log('═'.repeat(80));
  console.log(`
📚 SIMPLE EXPLANATION (Layman):

Think of it like Google Maps for ships:

1. **The Map (Graph)**
   - Every port is a dot on the map
   - Every ship route is a line connecting two dots
   - We learn from REAL ships that traveled these routes

2. **The Intelligence (Learning)**
   - Ship A goes from Oslo to Bergen: 150 miles
   - Ship B does same route: 148 miles
   - Ship C does it: 152 miles
   → Algorithm learns: "Oslo-Bergen is about 150 miles"

3. **The Planning (A*)**
   - You want to go from Port X to Port Z
   - System finds the best path: X → Y → Z
   - Uses real distance data, not just straight lines
   - Gets smarter with every ship that travels!

🔬 TECHNICAL EXPLANATION:

**Graph Structure:**
- Nodes: ${stats.nodeCount} ports with coordinates
- Edges: ${stats.edgeCount} routes with learned distance factors
- Weighted edges: cost = distance × factor × quality_penalty

**A* Pathfinding:**
- Heuristic: h(n) = great_circle_distance × 1.5
- Cost function: g(n) = actual_sailed_distance from learned data
- Finds optimal path minimizing total cost

**Incremental Learning:**
- Each new route observation updates edge weights
- Confidence scoring: 1 - exp(-observations / 10)
- Vessel-specific factors for different ship types

**Result:**
- Charterer-grade accuracy (target: ±1%)
- Real-time improvement with fleet intelligence
- No manual training needed - self-improving system
  `);

  console.log('\n✅ Mari8XOSRM Route Planning System Ready!\n');

  await prisma.$disconnect();
}

main().catch(console.error);
