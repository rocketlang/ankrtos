#!/usr/bin/env tsx
/**
 * Mari8XOSRM - Graph Visualization
 * Creates visual representations of the maritime graph
 */

import { PrismaClient } from '@prisma/client';
import { MaritimeGraph } from '../services/routing/maritime-graph';
import * as fs from 'fs';
import { getPrisma } from '../lib/db.js';


// Migrated to shared DB manager - use getPrisma()
const prisma = await getPrisma();

async function main() {
  console.log('🎨 Mari8XOSRM - Maritime Graph Visualization\n');

  const graph = new MaritimeGraph(prisma);
  await graph.build();

  const stats = graph.getStats();

  // ASCII Art Visualization
  console.log('═'.repeat(80));
  console.log('                    MARITIME GRAPH STRUCTURE');
  console.log('═'.repeat(80));
  console.log();

  const nodes = graph.getAllNodes();
  const hubs = graph.findHubs(5);

  // Show graph structure
  console.log('🗺️  GRAPH OVERVIEW:\n');
  console.log(`   Ports (Nodes): ${stats.nodeCount}`);
  console.log(`   Routes (Edges): ${stats.edgeCount}`);
  console.log(`   Avg Connections: ${stats.avgEdgesPerNode.toFixed(1)} per port`);
  console.log(`   Graph Coverage: ${stats.coverage.toFixed(0)}%`);
  console.log();

  // Visualize hubs and their connections
  console.log('🌟 MARITIME HUBS & CONNECTIONS:\n');
  console.log('─'.repeat(80));

  for (const hub of hubs.slice(0, 5)) {
    const node = hub.node;

    console.log(`\n📍 ${node.name} (${node.unlocode})`);
    console.log(`   Country: ${node.country}`);
    console.log(`   Coordinates: ${node.latitude.toFixed(4)}°N, ${node.longitude.toFixed(4)}°E`);
    console.log(`   Connections: ${node.edges.length}`);

    if (node.edges.length > 0) {
      console.log(`   Routes:`);

      node.edges.forEach((edge, i) => {
        const toNode = graph.getNode(edge.toNodeId);
        if (!toNode) return;

        const confidenceEmoji = edge.confidence > 0.8 ? '🟢' :
                               edge.confidence > 0.5 ? '🟡' : '🔴';

        console.log(`     ${i + 1}. → ${toNode.name}`);
        console.log(`        Distance: ${edge.actualDistanceNm.toFixed(0)}nm (${edge.distanceFactor.toFixed(2)}x GC)`);
        console.log(`        ${confidenceEmoji} Confidence: ${(edge.confidence * 100).toFixed(0)}% (${edge.observations} obs)`);
        console.log(`        Type: ${edge.routeType}`);
      });
    }
  }

  // ASCII Network Diagram
  console.log('\n\n📊 NETWORK DIAGRAM:\n');
  console.log('─'.repeat(80));
  console.log();

  // Create a simple ASCII network visualization
  const topHubs = hubs.slice(0, 4);

  for (let i = 0; i < topHubs.length; i++) {
    const hub = topHubs[i].node;
    const shortName = hub.name.substring(0, 20);

    // Show the hub
    console.log(`[${shortName}]`);

    // Show its connections
    hub.edges.forEach((edge, edgeIdx) => {
      const toNode = graph.getNode(edge.toNodeId);
      if (!toNode) return;

      const isLast = edgeIdx === hub.edges.length - 1;
      const connector = isLast ? '└──' : '├──';
      const distance = edge.actualDistanceNm.toFixed(0);
      const factor = edge.distanceFactor.toFixed(2);

      console.log(`  ${connector}> ${toNode.name.substring(0, 20)} (${distance}nm, ${factor}x)`);
    });

    console.log();
  }

  // Generate Mermaid Diagram
  console.log('\n\n🎨 MERMAID DIAGRAM (for visualization tools):\n');
  console.log('─'.repeat(80));
  console.log('```mermaid');
  console.log('graph LR');

  for (const node of topHubs.map(h => h.node)) {
    const nodeId = node.unlocode.replace(/[^a-zA-Z0-9]/g, '');
    const nodeName = node.name.substring(0, 15);

    console.log(`  ${nodeId}["${nodeName}"]`);

    node.edges.forEach(edge => {
      const toNode = graph.getNode(edge.toNodeId);
      if (!toNode) return;

      const toNodeId = toNode.unlocode.replace(/[^a-zA-Z0-9]/g, '');
      const distance = edge.actualDistanceNm.toFixed(0);
      const confidence = (edge.confidence * 100).toFixed(0);

      console.log(`  ${nodeId} -->|${distance}nm, ${confidence}%| ${toNodeId}`);
    });
  }

  console.log('```');

  // Export JSON for external visualization
  console.log('\n\n📁 Exporting graph data for external visualization...\n');

  const exportData = graph.exportForVisualization();
  const outputPath = '/tmp/mari8xosrm-graph.json';

  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  console.log(`✓ Exported to: ${outputPath}`);
  console.log(`  Nodes: ${exportData.nodes.length}`);
  console.log(`  Edges: ${exportData.edges.length}`);

  // Generate D3.js compatible format
  const d3Format = {
    nodes: exportData.nodes.map(n => ({
      id: n.unlocode,
      name: n.name,
      country: n.country,
      lat: n.lat,
      lon: n.lon,
      connections: n.connections,
    })),
    links: exportData.edges.map(e => ({
      source: e.from,
      target: e.to,
      distance: e.distance,
      factor: e.factor,
      confidence: e.confidence,
      observations: e.observations,
    })),
  };

  const d3Path = '/tmp/mari8xosrm-graph-d3.json';
  fs.writeFileSync(d3Path, JSON.stringify(d3Format, null, 2));
  console.log(`✓ D3.js format: ${d3Path}`);

  // Create a simple HTML visualization
  const htmlViz = `
<!DOCTYPE html>
<html>
<head>
  <title>Mari8XOSRM - Maritime Graph</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #0a1929; color: #fff; }
    h1 { color: #00d4ff; }
    .stats { background: #132f4c; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .node { background: #1e4976; padding: 10px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #00d4ff; }
    .edge { margin-left: 20px; padding: 5px; color: #b2bac2; }
    .confidence-high { color: #4caf50; }
    .confidence-medium { color: #ff9800; }
    .confidence-low { color: #f44336; }
  </style>
</head>
<body>
  <h1>🗺️ Mari8XOSRM - Maritime Graph Visualization</h1>

  <div class="stats">
    <h2>Graph Statistics</h2>
    <p>Ports (Nodes): <strong>${stats.nodeCount}</strong></p>
    <p>Routes (Edges): <strong>${stats.edgeCount}</strong></p>
    <p>Average Connections: <strong>${stats.avgEdgesPerNode.toFixed(1)}</strong> per port</p>
    <p>Coverage: <strong>${stats.coverage.toFixed(0)}%</strong></p>
    <p>Average Confidence: <strong>${(stats.avgConfidence * 100).toFixed(0)}%</strong></p>
  </div>

  <h2>Maritime Hubs</h2>
  ${hubs.map(hub => {
    const node = hub.node;
    return `
    <div class="node">
      <h3>📍 ${node.name} (${node.unlocode})</h3>
      <p>Country: ${node.country} | Coordinates: ${node.latitude.toFixed(4)}°N, ${node.longitude.toFixed(4)}°E</p>
      <p>Connections: ${node.edges.length}</p>
      ${node.edges.length > 0 ? `
        <div style="margin-top: 10px;">
          <strong>Routes:</strong>
          ${node.edges.map(edge => {
            const toNode = graph.getNode(edge.toNodeId);
            if (!toNode) return '';
            const confClass = edge.confidence > 0.8 ? 'confidence-high' :
                             edge.confidence > 0.5 ? 'confidence-medium' : 'confidence-low';
            return `
            <div class="edge">
              → ${toNode.name}: ${edge.actualDistanceNm.toFixed(0)}nm
              (${edge.distanceFactor.toFixed(2)}x GC)
              <span class="${confClass}">${(edge.confidence * 100).toFixed(0)}% confidence</span>
              (${edge.observations} observations)
            </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    </div>
    `;
  }).join('')}

  <div style="margin-top: 40px; padding: 20px; background: #132f4c; border-radius: 8px;">
    <h3>💡 How to Use This Data</h3>
    <ul>
      <li>View graph data: <code>/tmp/mari8xosrm-graph.json</code></li>
      <li>D3.js format: <code>/tmp/mari8xosrm-graph-d3.json</code></li>
      <li>Use tools like Gephi, Cytoscape, or D3.js for advanced visualization</li>
      <li>Import into graph databases (Neo4j, ArangoDB) for analysis</li>
    </ul>
  </div>
</body>
</html>
  `;

  const htmlPath = '/tmp/mari8xosrm-graph.html';
  fs.writeFileSync(htmlPath, htmlViz);
  console.log(`✓ HTML visualization: ${htmlPath}`);

  console.log('\n\n✅ Visualization Complete!\n');
  console.log('📊 You can:');
  console.log(`   1. Open ${htmlPath} in a browser`);
  console.log(`   2. Use the JSON files with graph visualization tools`);
  console.log(`   3. Import into Neo4j or other graph databases\n`);

  await prisma.$disconnect();
}

main().catch(console.error);
