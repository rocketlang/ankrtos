#!/usr/bin/env tsx
/**
 * Convert Mari8X OSRM JSON to OpenStreetMap XML format
 *
 * OSRM requires .osm files with:
 * - <node> tags for ports (with id, lat, lon)
 * - <way> tags for routes (with refs to node IDs)
 * - Tags for maritime routing (e.g., route=ferry, duration, distance)
 */

import { readFileSync, writeFileSync } from 'fs';

interface OSRMGraph {
  nodes: Array<{
    id: string;
    lat: number;
    lon: number;
    name: string;
    unlocode: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    distance: number;
    duration: number;
    weight: number;
    geometry: Array<[number, number]>;
    metadata: {
      observations: number;
      confidence: number;
      distanceFactor: number;
      vesselTypes: string[];
      avgSpeed: number;
    };
  }>;
  metadata: {
    generatedAt: string;
    totalRoutes: number;
    vesselType: string;
    strategy: string;
  };
}

function generateOSM(graph: OSRMGraph): string {
  let osmXML = '<?xml version="1.0" encoding="UTF-8"?>\n';
  osmXML += '<osm version="0.6" generator="Mari8XOSRM">\n';

  // Create node ID mapping (CUID -> sequential OSM ID)
  const nodeIdMap = new Map<string, number>();
  let osmNodeId = 1;

  // PHASE 1: Generate ALL <node> elements first (ports + waypoints)
  // This is required by OSM spec - all nodes must come before ways

  // Add port nodes
  graph.nodes.forEach(node => {
    nodeIdMap.set(node.id, osmNodeId);

    osmXML += `  <node id="${osmNodeId}" lat="${node.lat}" lon="${node.lon}">\n`;
    osmXML += `    <tag k="name" v="${escapeXML(node.name)}" />\n`;
    osmXML += `    <tag k="seamark:type" v="harbour" />\n`;
    osmXML += `    <tag k="unlocode" v="${node.unlocode}" />\n`;
    osmXML += `  </node>\n`;

    osmNodeId++;
  });

  // Pre-create waypoint nodes for all geometries
  const waypointNodeMap = new Map<string, number[]>(); // edge -> [node IDs]

  graph.edges.forEach((edge, edgeIdx) => {
    const sourceOsmId = nodeIdMap.get(edge.source);
    const targetOsmId = nodeIdMap.get(edge.target);

    if (!sourceOsmId || !targetOsmId) return;

    const geometryNodeIds: number[] = [sourceOsmId];

    // Skip first and last points (already source/target)
    const intermediatePoints = edge.geometry.slice(1, -1);

    intermediatePoints.forEach(([lon, lat]) => {
      osmXML += `  <node id="${osmNodeId}" lat="${lat}" lon="${lon}">\n`;
      osmXML += `    <tag k="seamark:type" v="waypoint" />\n`;
      osmXML += `  </node>\n`;

      geometryNodeIds.push(osmNodeId);
      osmNodeId++;
    });

    geometryNodeIds.push(targetOsmId);
    waypointNodeMap.set(`edge-${edgeIdx}`, geometryNodeIds);
  });

  // PHASE 2: Generate <way> elements (referencing nodes created above)
  let osmWayId = 1;

  graph.edges.forEach((edge, edgeIdx) => {
    const geometryNodeIds = waypointNodeMap.get(`edge-${edgeIdx}`);
    if (!geometryNodeIds) return;

    osmXML += `  <way id="${osmWayId}">\n`;

    // Add node refs to way
    geometryNodeIds.forEach(nodeId => {
      osmXML += `    <nd ref="${nodeId}" />\n`;
    });

    // Add tags for maritime routing
    osmXML += `    <tag k="route" v="ferry" />\n`;
    osmXML += `    <tag k="highway" v="service" />\n`; // OSRM requires highway tag
    osmXML += `    <tag k="duration" v="${Math.round(edge.duration)}" />\n`;
    osmXML += `    <tag k="distance" v="${Math.round(edge.distance)}" />\n`;
    osmXML += `    <tag k="maxspeed" v="${Math.round(edge.metadata.avgSpeed * 1.852)}" />\n`; // Convert knots to km/h
    osmXML += `    <tag k="confidence" v="${edge.metadata.confidence.toFixed(2)}" />\n`;
    osmXML += `    <tag k="observations" v="${edge.metadata.observations}" />\n`;
    osmXML += `    <tag k="vessel_type" v="${edge.metadata.vesselTypes.join(',')}" />\n`;
    osmXML += `  </way>\n`;

    osmWayId++;
  });

  osmXML += '</osm>\n';

  return osmXML;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function main() {
  console.log('🗺️  Mari8XOSRM - JSON to OSM Converter\n');

  const inputPath = '/root/apps/ankr-maritime/backend/osrm-full-graph.json';
  const outputPath = '/root/apps/ankr-maritime/backend/osrm-full-graph.osm';

  console.log(`📖 Reading: ${inputPath}`);
  const jsonData = readFileSync(inputPath, 'utf-8');
  const graph: OSRMGraph = JSON.parse(jsonData);

  console.log(`\n📊 Input Graph:`);
  console.log(`   Nodes: ${graph.nodes.length}`);
  console.log(`   Edges: ${graph.edges.length}`);
  console.log(`   Strategy: ${graph.metadata.strategy}`);

  console.log(`\n🔄 Converting to OSM format...`);
  const osmXML = generateOSM(graph);

  writeFileSync(outputPath, osmXML);
  console.log(`\n💾 Saved: ${outputPath}`);

  console.log(`\n✅ Conversion complete!`);
  console.log(`\n🎯 Next Steps:`);
  console.log(`   1. Extract OSRM graph: docker run -t -v $(pwd):/data osrm/osrm-backend osrm-extract -p /opt/ferry.lua /data/osrm-ferry-graph.osm`);
  console.log(`   2. Partition: docker run -t -v $(pwd):/data osrm/osrm-backend osrm-partition /data/osrm-ferry-graph.osrm`);
  console.log(`   3. Customize: docker run -t -v $(pwd):/data osrm/osrm-backend osrm-customize /data/osrm-ferry-graph.osrm`);
  console.log(`   4. Start server: docker run -t -p 5000:5000 -v $(pwd):/data osrm/osrm-backend osrm-routed --algorithm mld /data/osrm-ferry-graph.osrm`);
  console.log(`   5. Test route: curl "http://localhost:5000/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson"`);
}

main().catch(console.error);
