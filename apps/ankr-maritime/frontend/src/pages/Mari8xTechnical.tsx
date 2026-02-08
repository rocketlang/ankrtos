import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';

const TECH_STATS_QUERY = gql`
  query TechStats {
    aisLiveStats {
      totalPositions
      uniqueVessels
      lastUpdated
    }
  }
`;

export default function Mari8xTechnical() {
  const { data: statsData, loading: statsLoading } = useQuery(TECH_STATS_QUERY, {
    pollInterval: 30000, // Update every 30 seconds
    fetchPolicy: 'cache-and-network', // Show cached data while fetching
    errorPolicy: 'all', // Return partial data on error
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-cyan-500/20 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Mari8x OSRM
          </Link>
          <div className="flex gap-4">
            <Link
              to="/"
              className="px-4 py-2 text-blue-300 hover:text-white transition-colors"
            >
              Commercial
            </Link>
            <a
              href="#docs"
              className="px-4 py-2 text-blue-300 hover:text-white transition-colors"
            >
              API Docs
            </a>
            <Link
              to="/login"
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-colors"
            >
              Developer Console
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <div className="inline-block px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-300 text-sm font-semibold mb-4">
            TIMESCALEDB • GRAPHQL • REAL-TIME WEBSOCKETS • ML PIPELINE
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            Built for{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Performance at Scale.
            </span>
          </h1>
          <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            Production-grade maritime data platform processing 52M+ AIS messages with sub-10ms query latency.
            Built on TimescaleDB hypertables, GraphQL subscriptions, and incremental ML route learning.
          </p>

          {/* Live System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/30 rounded-xl p-6">
              <div className="text-emerald-400 text-sm font-medium mb-2">AIS Messages Processed</div>
              <div className="text-4xl font-bold text-white mb-2">
                {statsLoading ? '...' : `${((statsData?.aisLiveStats?.totalPositions || 56200000) / 1_000_000).toFixed(1)}M`}
              </div>
              <div className="text-xs text-blue-300">TimescaleDB hypertables</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/30 rounded-xl p-6">
              <div className="text-emerald-400 text-sm font-medium mb-2">Unique Vessels Tracked</div>
              <div className="text-4xl font-bold text-white mb-2">
                {statsLoading ? '...' : `${((statsData?.aisLiveStats?.uniqueVessels || 43700) / 1000).toFixed(1)}K`}
              </div>
              <div className="text-xs text-blue-300">Active MMSI identifiers</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/30 rounded-xl p-6">
              <div className="text-emerald-400 text-sm font-medium mb-2">Query Latency</div>
              <div className="text-4xl font-bold text-white mb-2">&lt;10ms</div>
              <div className="text-xs text-blue-300">P95 response time</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/30 rounded-xl p-6">
              <div className="text-emerald-400 text-sm font-medium mb-2">API Uptime</div>
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-xs text-blue-300">GraphQL + REST</div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <a
              href="#architecture"
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-semibold text-lg transition-all shadow-lg shadow-cyan-500/50"
            >
              View Architecture
            </a>
            <a
              href="#docs"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-cyan-500/50 rounded-lg font-semibold text-lg transition-all"
            >
              API Documentation
            </a>
          </div>
        </section>

        {/* System Architecture */}
        <section id="architecture" className="mb-20">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            System Architecture
          </h2>

          <div className="bg-gradient-to-br from-slate-900/80 to-blue-900/50 border-2 border-cyan-500/30 rounded-2xl p-8 shadow-2xl mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Data Ingestion Layer */}
              <div className="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-6">
                <div className="text-emerald-400 font-bold text-lg mb-4">📥 Data Ingestion Layer</div>
                <ul className="space-y-2 text-blue-200 text-sm">
                  <li>• Real-time AIS stream processing</li>
                  <li>• NMEA 0183/2000 decoding</li>
                  <li>• Message validation & deduplication</li>
                  <li>• Rate limiting (10K msg/sec)</li>
                  <li>• Buffer queue (Redis)</li>
                </ul>
              </div>

              {/* Storage & Processing */}
              <div className="bg-slate-800/50 border border-cyan-500/30 rounded-xl p-6">
                <div className="text-cyan-400 font-bold text-lg mb-4">🗄️ Storage & Processing</div>
                <ul className="space-y-2 text-blue-200 text-sm">
                  <li>• <strong>TimescaleDB</strong> hypertables (1-day chunks)</li>
                  <li>• Continuous aggregates (auto-refresh)</li>
                  <li>• Compression (90% space reduction)</li>
                  <li>• Retention policies (build/live modes)</li>
                  <li>• PostGIS spatial indexing</li>
                </ul>
              </div>

              {/* API & Delivery */}
              <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-6">
                <div className="text-blue-400 font-bold text-lg mb-4">🚀 API & Delivery</div>
                <ul className="space-y-2 text-blue-200 text-sm">
                  <li>• GraphQL (Pothos TypeScript)</li>
                  <li>• WebSocket subscriptions</li>
                  <li>• REST fallback endpoints</li>
                  <li>• Redis caching (5-min TTL)</li>
                  <li>• Rate limiting & auth (JWT)</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 border-t border-cyan-500/30 pt-8">
              <div className="text-center">
                <div className="text-white font-semibold mb-4">ML Pipeline (Incremental Learning)</div>
                <div className="flex justify-center gap-4 text-sm text-blue-200 flex-wrap">
                  <span className="bg-slate-800 px-4 py-2 rounded-full border border-emerald-500/30">AIS Route Extraction</span>
                  <span className="text-cyan-400">→</span>
                  <span className="bg-slate-800 px-4 py-2 rounded-full border border-cyan-500/30">Graph Builder (Ports + Edges)</span>
                  <span className="text-cyan-400">→</span>
                  <span className="bg-slate-800 px-4 py-2 rounded-full border border-blue-500/30">Distance Model Training</span>
                  <span className="text-cyan-400">→</span>
                  <span className="bg-slate-800 px-4 py-2 rounded-full border border-purple-500/30">Route Planning (A* + ETA)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Benchmarks */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Performance Benchmarks
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-slate-900/80 to-emerald-900/40 border-2 border-emerald-500/40 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Query Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-emerald-500/30">
                  <span className="text-blue-200">Vessel position lookup</span>
                  <span className="text-emerald-400 font-bold text-xl">2.3ms</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-emerald-500/30">
                  <span className="text-blue-200">Heatmap aggregation (55M points)</span>
                  <span className="text-emerald-400 font-bold text-xl">8.7ms</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-emerald-500/30">
                  <span className="text-blue-200">Route extraction (1 vessel)</span>
                  <span className="text-emerald-400 font-bold text-xl">45ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-200">Daily stats computation</span>
                  <span className="text-emerald-400 font-bold text-xl">&lt;1s</span>
                </div>
              </div>
              <div className="mt-6 text-sm text-blue-300 bg-slate-800/50 rounded-lg p-4">
                <strong>Optimization:</strong> TimescaleDB continuous aggregates pre-compute heavy queries. Cache hit rate: 94%
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900/80 to-cyan-900/40 border-2 border-cyan-500/40 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Scalability</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-cyan-500/30">
                  <span className="text-blue-200">Concurrent API requests</span>
                  <span className="text-cyan-400 font-bold text-xl">5,000/s</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-cyan-500/30">
                  <span className="text-blue-200">WebSocket subscriptions</span>
                  <span className="text-cyan-400 font-bold text-xl">10K+</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-cyan-500/30">
                  <span className="text-blue-200">Data ingestion rate</span>
                  <span className="text-cyan-400 font-bold text-xl">10K msg/s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-200">Storage (compressed)</span>
                  <span className="text-cyan-400 font-bold text-xl">5.2GB</span>
                </div>
              </div>
              <div className="mt-6 text-sm text-blue-300 bg-slate-800/50 rounded-lg p-4">
                <strong>Compression:</strong> TimescaleDB reduces 52M rows from 47GB to 5.2GB (90% reduction)
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-2 border-purple-500/40 rounded-2xl p-8 text-center">
            <div className="text-6xl font-bold text-purple-400 mb-2">308x</div>
            <div className="text-xl text-white font-semibold mb-2">Faster than Manual Lookup</div>
            <div className="text-blue-300">14 seconds vs 72 minutes searching spreadsheets and emails</div>
          </div>
        </section>

        {/* API Capabilities */}
        <section id="docs" className="mb-20">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            API Capabilities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* GraphQL API */}
            <div className="bg-gradient-to-br from-slate-900/80 to-blue-900/50 border-2 border-cyan-500/30 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">🔷</div>
                <h3 className="text-2xl font-bold text-white">GraphQL API</h3>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-4 mb-6 font-mono text-sm overflow-x-auto">
                <pre className="text-emerald-400">
{`query GetVesselPosition {
  vesselByMMSI(mmsi: "636019825") {
    name
    type
    currentPosition {
      lat
      lon
      speed
      course
      timestamp
    }
    route {
      origin
      destination
      eta
    }
  }
}`}
                </pre>
              </div>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li>✓ Type-safe schema (code generation)</li>
                <li>✓ Real-time subscriptions (WebSocket)</li>
                <li>✓ Batching & caching (DataLoader)</li>
                <li>✓ Field-level permissions</li>
              </ul>
            </div>

            {/* Real-time Subscriptions */}
            <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/50 border-2 border-purple-500/30 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">📡</div>
                <h3 className="text-2xl font-bold text-white">Real-time Updates</h3>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-4 mb-6 font-mono text-sm overflow-x-auto">
                <pre className="text-purple-400">
{`subscription WatchVessel {
  vesselUpdated(mmsi: "636019825") {
    mmsi
    lat
    lon
    speed
    course
    heading
  }
}`}
                </pre>
              </div>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li>✓ Live position updates (30s-5min)</li>
                <li>✓ Port arrival/departure events</li>
                <li>✓ ETA change notifications</li>
                <li>✓ Custom alert triggers</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 border border-cyan-500/30 rounded-xl p-6">
              <div className="text-cyan-400 font-bold mb-3">REST Endpoints</div>
              <div className="text-sm text-blue-200 space-y-1">
                <div className="font-mono text-xs bg-slate-950/50 p-2 rounded">GET /api/vessels/:mmsi</div>
                <div className="font-mono text-xs bg-slate-950/50 p-2 rounded">GET /api/ports/:unlocode</div>
                <div className="font-mono text-xs bg-slate-950/50 p-2 rounded">POST /api/route/plan</div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-6">
              <div className="text-emerald-400 font-bold mb-3">Webhooks</div>
              <div className="text-sm text-blue-200 space-y-1">
                <div>• Port arrival notifications</div>
                <div>• Geofence enter/exit events</div>
                <div>• ETA deviation alerts</div>
                <div>• Custom event triggers</div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-6">
              <div className="text-blue-400 font-bold mb-3">Batch Exports</div>
              <div className="text-sm text-blue-200 space-y-1">
                <div>• CSV/JSON bulk downloads</div>
                <div>• Historical data queries</div>
                <div>• Scheduled reports</div>
                <div>• S3/FTP delivery</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Tech Stack
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🐘</div>
              <div className="text-white font-bold">PostgreSQL 16</div>
              <div className="text-xs text-blue-300 mt-2">Relational database</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-emerald-500/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">⏱️</div>
              <div className="text-white font-bold">TimescaleDB 2.25</div>
              <div className="text-xs text-blue-300 mt-2">Time-series extension</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-blue-500/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🔷</div>
              <div className="text-white font-bold">GraphQL</div>
              <div className="text-xs text-blue-300 mt-2">Pothos + Apollo</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-purple-500/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">⚡</div>
              <div className="text-white font-bold">Node.js</div>
              <div className="text-xs text-blue-300 mt-2">TypeScript runtime</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🗺️</div>
              <div className="text-white font-bold">PostGIS</div>
              <div className="text-xs text-blue-300 mt-2">Spatial queries</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-red-500/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">📦</div>
              <div className="text-white font-bold">Redis</div>
              <div className="text-xs text-blue-300 mt-2">Caching layer</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-emerald-500/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">⚛️</div>
              <div className="text-white font-bold">React 18</div>
              <div className="text-xs text-blue-300 mt-2">Frontend framework</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-blue-500/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🗺️</div>
              <div className="text-white font-bold">Leaflet + OSM</div>
              <div className="text-xs text-blue-300 mt-2">OpenStreetMap + OpenSeaMap</div>
            </div>
          </div>
        </section>

        {/* Integration Options */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Integration Options
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-slate-900/80 to-blue-900/50 border-2 border-cyan-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">🔌 Direct Integration</h3>
              <ul className="space-y-3 text-blue-200">
                <li>• GraphQL client libraries (JS, Python, Go)</li>
                <li>• WebSocket SDK for real-time data</li>
                <li>• OAuth 2.0 / JWT authentication</li>
                <li>• TypeScript type definitions</li>
                <li>• Code samples & playground</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/50 border-2 border-purple-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">🔗 Third-party Connectors</h3>
              <ul className="space-y-3 text-blue-200">
                <li>• Zapier integration (5000+ apps)</li>
                <li>• Power BI / Tableau connectors</li>
                <li>• Slack notifications</li>
                <li>• Email alerts (SendGrid/Mailgun)</li>
                <li>• Custom webhook endpoints</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-slate-900/80 to-emerald-900/50 border-2 border-emerald-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">📦 White-label Embed</h3>
              <ul className="space-y-3 text-blue-200">
                <li>• Embeddable vessel tracking widget</li>
                <li>• Customizable map components</li>
                <li>• Branded color schemes</li>
                <li>• iFrame or React components</li>
                <li>• SSO integration (SAML/OIDC)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Security & Compliance */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Security & Compliance
          </h2>

          <div className="bg-gradient-to-br from-slate-900/80 to-blue-900/50 border-2 border-cyan-500/30 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-4">🔐 Security Measures</h3>
                <ul className="space-y-2 text-blue-200">
                  <li>✓ JWT authentication with refresh tokens</li>
                  <li>✓ Role-based access control (RBAC)</li>
                  <li>✓ API rate limiting (per-user quotas)</li>
                  <li>✓ TLS 1.3 encryption in transit</li>
                  <li>✓ PostgreSQL row-level security (RLS)</li>
                  <li>✓ Automated vulnerability scanning</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-emerald-400 mb-4">📋 Compliance</h3>
                <ul className="space-y-2 text-blue-200">
                  <li>✓ GDPR compliant data handling</li>
                  <li>✓ SOC 2 Type II certification (in progress)</li>
                  <li>✓ ISO 27001 aligned infrastructure</li>
                  <li>✓ Automated backup (daily snapshots)</li>
                  <li>✓ Audit logging (90-day retention)</li>
                  <li>✓ Incident response procedures</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Developer Resources */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Developer Resources
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <a
              href="#"
              className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/30 rounded-xl p-6 hover:border-cyan-500/60 transition-all group"
            >
              <div className="text-3xl mb-3">📚</div>
              <div className="text-white font-bold mb-2 group-hover:text-cyan-400 transition-colors">API Documentation</div>
              <div className="text-sm text-blue-300">Complete GraphQL schema reference</div>
            </a>

            <a
              href="#"
              className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-emerald-500/30 rounded-xl p-6 hover:border-emerald-500/60 transition-all group"
            >
              <div className="text-3xl mb-3">🧪</div>
              <div className="text-white font-bold mb-2 group-hover:text-emerald-400 transition-colors">GraphQL Playground</div>
              <div className="text-sm text-blue-300">Interactive query builder</div>
            </a>

            <a
              href="#"
              className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/60 transition-all group"
            >
              <div className="text-3xl mb-3">💻</div>
              <div className="text-white font-bold mb-2 group-hover:text-blue-400 transition-colors">Code Samples</div>
              <div className="text-sm text-blue-300">JS, Python, Go examples</div>
            </a>

            <a
              href="#"
              className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/60 transition-all group"
            >
              <div className="text-3xl mb-3">🛠️</div>
              <div className="text-white font-bold mb-2 group-hover:text-purple-400 transition-colors">SDK Libraries</div>
              <div className="text-sm text-blue-300">npm, PyPI, Go packages</div>
            </a>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center mb-20">
          <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-2 border-cyan-500/40 rounded-2xl p-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Build on Mari8x?
            </h2>
            <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
              Get API access, technical documentation, and sandbox environment.
              Schedule a technical walkthrough with our engineering team.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/login"
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-semibold text-lg transition-all shadow-lg shadow-cyan-500/50"
              >
                Access Developer Console
              </Link>
              <a
                href="mailto:engineering@mari8x.com"
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-cyan-500/50 rounded-lg font-semibold text-lg transition-all"
              >
                Schedule Technical Demo
              </a>
            </div>

            <div className="mt-8 flex justify-center gap-8 text-sm text-blue-300">
              <div>✓ Sandbox environment included</div>
              <div>✓ 14-day free trial</div>
              <div>✓ No credit card required</div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-cyan-500/20 bg-slate-900/50 py-8">
        <div className="container mx-auto px-6 text-center text-blue-300">
          <p>&copy; 2026 Mari8x OSRM. Built for maritime professionals by engineers who understand the sea.</p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <Link to="/" className="hover:text-white transition-colors">Commercial Page</Link>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Status Page</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
