import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Split queries for better error handling
const AIS_DASHBOARD_QUERY = gql(`
  query Mari8xLandingAISDashboard {
    aisLiveDashboard {
      totalPositions
      uniqueVessels
      averageSpeed
      recentActivity {
        last24Hours
      }
      lastUpdated
    }
  }
`);

const MARITIME_STATS_QUERY = gql(`
  query Mari8xLandingMaritimeStats {
    maritimeStats {
      totalPorts
      totalCountries
      totalTariffs
      portsCovered
      portsWithOpenSeaMap
      openSeaMapCoverage
      lastUpdated
    }
  }
`);

const RECENT_POSITIONS_QUERY = gql(`
  query Mari8xLandingRecentPositions {
    aisRecentPositions(limit: 10) {
      id
      latitude
      longitude
      speed
      heading
      navigationStatus
      timestamp
    }
  }
`);

export default function Mari8xLanding() {
  const [liveCount, setLiveCount] = useState(0);

  // Separate queries - if one fails, others still work
  const { data: aisData, error: aisError } = useQuery(AIS_DASHBOARD_QUERY, {
    pollInterval: 5000, // Refresh every 5 seconds
    errorPolicy: 'all', // Return partial data on error
  });

  const { data: statsData } = useQuery(MARITIME_STATS_QUERY, {
    errorPolicy: 'all',
  });

  const { data: positionsData, error: positionsError } = useQuery(RECENT_POSITIONS_QUERY, {
    pollInterval: 3000, // Refresh every 3 seconds
    errorPolicy: 'ignore', // Don't crash on error
  });

  // Animate the live count
  useEffect(() => {
    if (aisData?.aisLiveDashboard.totalPositions) {
      const target = aisData.aisLiveDashboard.totalPositions;
      const current = liveCount;
      const diff = target - current;
      const steps = 50;
      const increment = diff / steps;

      let step = 0;
      const timer = setInterval(() => {
        step++;
        setLiveCount((prev) => Math.round(prev + increment));
        if (step >= steps) {
          setLiveCount(target);
          clearInterval(timer);
        }
      }, 20);

      return () => clearInterval(timer);
    }
  }, [aisData?.aisLiveDashboard.totalPositions]);

  const dashboard = aisData?.aisLiveDashboard;
  const recentPositions = positionsData?.aisRecentPositions || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Mari8X
            </div>
            <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-400 text-xs font-semibold animate-pulse">
              ● LIVE
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-blue-200 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/beta/signup"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/25"
            >
              Join Beta
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
              The Future of{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Maritime Intelligence
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-200 max-w-3xl mx-auto mb-8">
              Real-time vessel tracking, pre-arrival intelligence, and automated port operations
              for the modern maritime industry
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/beta/signup"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-xl shadow-blue-500/30"
              >
                Start Free Trial
              </Link>
              <Link
                to="/ais/live"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg text-lg font-semibold hover:bg-white/20 transition-all"
              >
                View Live Data →
              </Link>
            </div>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-16">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="text-blue-300 text-sm font-medium mb-2">Vessel Positions</div>
              <div className="text-4xl font-bold text-white mb-2">
                {liveCount.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Live tracking
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="text-blue-300 text-sm font-medium mb-2">Active Vessels</div>
              <div className="text-4xl font-bold text-white mb-2">
                {dashboard?.uniqueVessels.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-cyan-400">
                {dashboard?.recentActivity.last24Hours.toLocaleString() || '0'} updates/24h
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="text-blue-300 text-sm font-medium mb-2">Global Ports</div>
              <div className="text-4xl font-bold text-white mb-2">
                {statsData?.maritimeStats?.totalPorts.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-purple-400">{statsData?.maritimeStats?.totalCountries || 0} countries</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="text-blue-300 text-sm font-medium mb-2">Port Tariffs</div>
              <div className="text-4xl font-bold text-white mb-2">
                {statsData?.maritimeStats?.totalTariffs.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-orange-400">{statsData?.maritimeStats?.portsCovered || 0} ports covered</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="text-blue-300 text-sm font-medium mb-2">Avg Speed</div>
              <div className="text-4xl font-bold text-white mb-2">
                {dashboard?.averageSpeed.toFixed(1) || '0.0'}
              </div>
              <div className="text-sm text-blue-400">Knots</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="text-blue-300 text-sm font-medium mb-2">OpenSeaMap</div>
              <div className="text-4xl font-bold text-white mb-2">
                {statsData?.maritimeStats?.openSeaMapCoverage.toFixed(1) || '0.0'}%
              </div>
              <div className="text-sm text-teal-400">{statsData?.maritimeStats?.portsWithOpenSeaMap || 0} ports mapped</div>
            </div>
          </div>

          {/* Live Feed */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-white">🌊 Live Vessel Feed</h3>
                <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-400 text-xs font-semibold">
                  ● UPDATING EVERY 3s
                </div>
              </div>
              <Link
                to="/ais/live"
                className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
              >
                View Full Dashboard →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-blue-300 font-semibold">Time</th>
                    <th className="text-left py-3 px-4 text-blue-300 font-semibold">Position</th>
                    <th className="text-right py-3 px-4 text-blue-300 font-semibold">Speed</th>
                    <th className="text-right py-3 px-4 text-blue-300 font-semibold">Heading</th>
                    <th className="text-center py-3 px-4 text-blue-300 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPositions.map((pos, idx) => (
                    <tr
                      key={pos.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors animate-fadeIn"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <td className="py-3 px-4 text-blue-200 font-mono text-xs">
                        {new Date(pos.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-white font-mono text-xs">
                        {pos.latitude.toFixed(4)}°, {pos.longitude.toFixed(4)}°
                      </td>
                      <td className="py-3 px-4 text-right text-cyan-300 font-semibold">
                        {pos.speed?.toFixed(1) || '-'} kn
                      </td>
                      <td className="py-3 px-4 text-right text-purple-300 font-semibold">
                        {pos.heading !== null ? `${pos.heading}°` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {pos.navigationStatus !== null ? (
                          <span className="inline-block px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-300 text-xs">
                            {pos.navigationStatus}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* What is Mari8X */}
      <div className="relative bg-gradient-to-b from-slate-900 to-blue-950 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What is Mari8X?
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              The <span className="text-cyan-400 font-semibold">ONLY</span> maritime platform that combines real-time AIS tracking,
              authoritative vessel ownership data, and automated port tariffs in one unified system.
            </p>
          </div>

          {/* Platform Statistics */}
          <div className="mb-16 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-2xl p-8">
            <h3 className="text-3xl font-bold text-white text-center mb-8">Platform at a Glance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400 mb-2">41M+</div>
                <div className="text-sm text-blue-200">AIS Positions Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">12,714</div>
                <div className="text-sm text-blue-200">Verified Ports</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">103</div>
                <div className="text-sm text-blue-200">Countries Covered</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">14s</div>
                <div className="text-sm text-blue-200">Vessel → Owner Lookup</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-2">137</div>
                <div className="text-sm text-blue-200">Feature Pages</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-400 mb-2">800+</div>
                <div className="text-sm text-blue-200">Ports with Live Tariffs</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-teal-400 mb-2">99.7%</div>
                <div className="text-sm text-blue-200">Time Savings vs Manual</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-400 mb-2">100%</div>
                <div className="text-sm text-blue-200">Owner Data Accuracy</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <div className="text-4xl mb-4">🛰️</div>
              <h3 className="text-2xl font-bold text-white mb-4">Real-Time AIS Tracking</h3>
              <p className="text-blue-200 leading-relaxed">
                Track over 18,000 vessels worldwide with live position updates. Monitor vessel
                movements, speed, heading, and navigation status in real-time. Our platform
                processes millions of AIS data points to give you unparalleled visibility into
                global maritime traffic.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-white mb-4">Pre-Arrival Intelligence</h3>
              <p className="text-blue-200 leading-relaxed">
                Get ahead of vessel arrivals with automated ETA calculations, proximity detection,
                and intelligent document status tracking. Our AI-powered system identifies missing
                documents and predicts DA costs before vessels arrive, saving you time and money.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-white mb-4">Master Alert System</h3>
              <p className="text-blue-200 leading-relaxed">
                Two-way communication with ship masters via email, WhatsApp, and SMS. Automated
                alerts for critical events, document requirements, and port restrictions. Parse
                responses automatically and update your workflow without manual intervention.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-white mb-4">Event-Driven Timeline</h3>
              <p className="text-blue-200 leading-relaxed">
                Complete visibility into every vessel's journey with a unified event timeline.
                Track documents, alerts, communications, and operational milestones in one
                chronological view. Never miss a critical event or deadline again.
              </p>
            </div>
          </div>

          {/* Why Choose Mari8X - USP Section */}
          <div className="my-24">
            <h3 className="text-4xl font-bold text-white text-center mb-12">
              Why Choose Mari8X?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* Traditional Way */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8">
                <h4 className="text-2xl font-bold text-red-300 mb-6">❌ Traditional Way</h4>
                <div className="space-y-4 text-blue-200">
                  <div>⏱️ <span className="font-semibold">72 minutes</span> per vessel lookup</div>
                  <div>💰 <span className="font-semibold">$200-500/month</span> for basic data</div>
                  <div>📊 <span className="font-semibold">~70% accuracy</span> (crowdsourced)</div>
                  <div>📄 Manual PDF tariff downloads</div>
                  <div>🔍 Spreadsheet-based tracking</div>
                  <div>📧 Manual email processing</div>
                </div>
              </div>

              {/* The Mari8X Way */}
              <div className="bg-gradient-to-br from-green-900/30 to-cyan-900/30 border-2 border-green-500/50 rounded-2xl p-8 transform scale-105 shadow-2xl shadow-green-500/20">
                <h4 className="text-2xl font-bold text-green-300 mb-6">✅ The Mari8X Way</h4>
                <div className="space-y-4 text-blue-200">
                  <div>⚡ <span className="font-semibold text-green-400">14 seconds</span> per vessel lookup</div>
                  <div>💎 <span className="font-semibold text-green-400">$99-1,999/month</span> (full platform)</div>
                  <div>🎯 <span className="font-semibold text-green-400">100% accuracy</span> (proprietary data)</div>
                  <div>🤖 AI-powered tariff intelligence (800+ ports)</div>
                  <div>📡 AIS-based intelligent routing (41M+ positions)</div>
                  <div>🧠 RAG-enhanced search & auto-matching</div>
                </div>
              </div>

              {/* The Result */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-8">
                <h4 className="text-2xl font-bold text-blue-300 mb-6">🚀 The Result</h4>
                <div className="space-y-4 text-blue-200">
                  <div>📈 <span className="font-semibold text-cyan-400">99.7% time savings</span></div>
                  <div>💪 <span className="font-semibold text-cyan-400">10x faster</span> operations</div>
                  <div>✨ <span className="font-semibold text-cyan-400">Zero manual</span> data entry</div>
                  <div>🎯 100% data accuracy guarantee</div>
                  <div>🌍 Global coverage (103 countries)</div>
                  <div>📱 Mobile-responsive (137 pages)</div>
                </div>
              </div>
            </div>

            {/* Real-World Impact */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-2xl p-8">
              <h4 className="text-2xl font-bold text-white mb-6 text-center">📊 Real-World Impact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="text-4xl font-bold text-cyan-400 mb-2">308x</div>
                  <div className="text-sm text-blue-200">Faster than manual lookup</div>
                  <div className="text-xs text-blue-300 mt-1">(14s vs 72min)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🤖</div>
                  <div className="text-4xl font-bold text-green-400 mb-2">137</div>
                  <div className="text-sm text-blue-200">Feature-rich pages</div>
                  <div className="text-xs text-blue-300 mt-1">(1000s of unique features)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="text-4xl font-bold text-purple-400 mb-2">100%</div>
                  <div className="text-sm text-blue-200">Proprietary data accuracy</div>
                  <div className="text-xs text-blue-300 mt-1">(verified & validated)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🚢</div>
                  <div className="text-4xl font-bold text-orange-400 mb-2">500</div>
                  <div className="text-sm text-blue-200">Vessels processed/day</div>
                  <div className="text-xs text-blue-300 mt-1">(AI-powered automation)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comprehensive Feature List */}
          <div className="space-y-8">
            <h3 className="text-3xl font-bold text-white text-center mb-12">
              Complete Platform Capabilities
            </h3>

            {/* Operations Management */}
            <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">⚓</span> Operations Management
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Pre-Arrival Intelligence Engine
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Proximity Detection & Auto-ETA
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Document Status Checker
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Missing Document Detector
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> DA Cost Forecasting (ML-powered)
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Port Congestion Analyzer
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Readiness Score Calculation
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Critical Path Tracking
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Agent Dashboard MVP
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Real-time Subscriptions
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Advanced Filters & Search
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Export & Reporting
                  </div>
                </div>
              </div>
            </div>

            {/* Vessel & Fleet Tracking */}
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">🚢</span> Vessel & Fleet Intelligence
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Live AIS Tracking (18K+ vessels)
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Vessel Position History
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Vessel Ownership Intelligence
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> IMO GISIS Integration
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Intelligent Route Engine
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Weather Routing Optimization
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Fleet Collaborative Routing
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Auto-Learning Route Suggestions
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Vessel Certificates Manager
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Expiry Alert System
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Vessel Inspection Tracking
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Emission Monitoring (CII/EU ETS)
                  </div>
                </div>
              </div>
            </div>

            {/* Communication & Alerts */}
            <div className="bg-gradient-to-r from-green-900/50 to-teal-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">📡</span> Master Communication & Alerts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Master Alert System
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Multi-Channel Notifications
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Email/WhatsApp/SMS Integration
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Two-Way Communication Parser
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Automated Response Processing
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Email Intelligence Parsing
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Mention Notifications
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Notification Digest System
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Event-Driven Timeline
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Real-Time Event Streaming
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Communication Log & Audit Trail
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Activity Feed Dashboard
                  </div>
                </div>
              </div>
            </div>

            {/* Port Agency & Documentation */}
            <div className="bg-gradient-to-r from-orange-900/50 to-red-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">📋</span> Port Agency & Documentation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Port Agency Portal (PDA/FDA)
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Document Upload & Workflow
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Hybrid Document Management (MinIO)
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Auto-Enrichment Engine
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> AI Document Classification
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> PDF Extraction & Processing
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Document Template Manager
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Compliance Document Vault
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Port Tariff Ingestion
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Port Restriction Database
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Agent Appointment Tracker
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Protecting Agent Management
                  </div>
                </div>
              </div>
            </div>

            {/* Commercial & Trading */}
            <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">💼</span> Commercial & Trading
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Chartering Desk (Spot/Time/COA)
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Cargo Enquiry Management
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Fixture Subject Tracking
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Charter Party Manager
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> S&P (Sale & Purchase) Desk
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Vessel Valuation Engine
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Deal Room & Negotiations
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Closing Checklist Tracker
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Freight Derivatives (FFA)
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Market Indices & Rates
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Tonnage Heatmap
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Market Analytics Dashboard
                  </div>
                </div>
              </div>
            </div>

            {/* Finance & Risk */}
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">💰</span> Finance & Risk Management
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Invoice Management & Billing
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Credit/Debit Note Tracking
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Hire Payment Schedules
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Cash Flow Analytics
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> FX Exposure Management
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> VaR (Value at Risk) Snapshots
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> P&L Entry & Reporting
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Revenue Forecasting
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Sanctions Screening
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Counterparty Risk Analysis
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Letter of Credit Manager
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Trade Finance Dashboard
                  </div>
                </div>
              </div>
            </div>

            {/* AI & Analytics */}
            <div className="bg-gradient-to-r from-pink-900/50 to-purple-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">🤖</span> AI & Advanced Analytics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Mari8X AI Engine (RAG)
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Knowledge Base & Semantic Search
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Swayam Bot (AI Assistant)
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Auto-Learning Systems
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Engagement Analytics
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Cohort Retention Analysis
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Feature Adoption Tracking
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Churn Risk Prediction
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Performance Monitoring
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Cost Optimization Engine
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Operations KPI Dashboard
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Business Intelligence Suite
                  </div>
                </div>
              </div>
            </div>

            {/* Developer & Integration */}
            <div className="bg-gradient-to-r from-slate-900/50 to-blue-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">⚙️</span> Developer & Integration
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> GraphQL API (Type-Safe)
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Real-Time Subscriptions
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Webhook Integration
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> API Documentation
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Multi-Tenancy Architecture
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Role-Based Access Control
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Approval Workflow Engine
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Feature Flag System
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Mobile-Responsive Design
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> i18n Support (Multi-Language)
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Razorpay Payment Integration
                  </div>
                  <div className="flex items-center gap-3 text-blue-200">
                    <span className="text-green-400">✓</span> Subscription Management
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI & Technology Stack */}
      <div className="relative bg-gradient-to-b from-blue-950 to-slate-900 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            🤖 Proprietary AI & Intelligence Stack
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* AI-Powered Intelligence */}
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md border border-purple-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">🧠</span> AI Intelligence
              </h3>
              <div className="space-y-3 text-blue-200">
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 text-xl">✓</span>
                  <div>
                    <div className="font-semibold">AIS-Based Routing</div>
                    <div className="text-sm text-blue-300">ML-powered with 41M+ positions</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 text-xl">✓</span>
                  <div>
                    <div className="font-semibold">Port Intelligence</div>
                    <div className="text-sm text-blue-300">Predictive congestion & ETA</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 text-xl">✓</span>
                  <div>
                    <div className="font-semibold">RAG Engine</div>
                    <div className="text-sm text-blue-300">PageIndex enhanced search</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 text-xl">✓</span>
                  <div>
                    <div className="font-semibold">Auto-Matching</div>
                    <div className="text-sm text-blue-300">Vessel-cargo AI matching</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 text-xl">✓</span>
                  <div>
                    <div className="font-semibold">DA Forecasting</div>
                    <div className="text-sm text-blue-300">ML cost predictions</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Blockchain & DMS */}
            <div className="bg-gradient-to-br from-green-900/40 to-teal-900/40 backdrop-blur-md border border-green-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">⛓️</span> DocChain DMS
              </h3>
              <div className="space-y-3 text-blue-200">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <div className="font-semibold">Blockchain Verified</div>
                    <div className="text-sm text-blue-300">Immutable document chain</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <div className="font-semibold">AI Classification</div>
                    <div className="text-sm text-blue-300">Auto-categorize & extract</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <div className="font-semibold">OCR Processing</div>
                    <div className="text-sm text-blue-300">Extract from scanned docs</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <div className="font-semibold">Version Control</div>
                    <div className="text-sm text-blue-300">Complete audit trail</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <div className="font-semibold">Hybrid Storage</div>
                    <div className="text-sm text-blue-300">Optimized performance</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Coverage */}
            <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">🌍</span> Global Scale
              </h3>
              <div className="space-y-4 text-blue-200">
                <div className="flex justify-between">
                  <span>AIS Positions</span>
                  <span className="font-bold text-cyan-400">41M+</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Vessels</span>
                  <span className="font-bold text-purple-400">34,788</span>
                </div>
                <div className="flex justify-between">
                  <span>Verified Ports</span>
                  <span className="font-bold text-green-400">12,714</span>
                </div>
                <div className="flex justify-between">
                  <span>Countries</span>
                  <span className="font-bold text-orange-400">103</span>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="text-sm text-cyan-300">
                    🚀 137 Feature Pages • &lt;100ms API • 99.9% Uptime
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Unique Features Showcase */}
          <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-2xl p-8 mb-16">
            <h3 className="text-3xl font-bold text-white mb-4 text-center">
              Thousands of Unique Features Across 137 Pages
            </h3>
            <p className="text-center text-blue-200 mb-8 max-w-3xl mx-auto">
              From AIS-based intelligent routing to blockchain-verified document management,
              Mari8X combines cutting-edge AI, machine learning, and automation across every aspect of maritime operations.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🧠</div>
                <div className="text-sm font-semibold text-cyan-400 mb-1">AI Routing</div>
                <div className="text-xs text-blue-300">ML-powered optimization</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">⛓️</div>
                <div className="text-sm font-semibold text-green-400 mb-1">DocChain</div>
                <div className="text-xs text-blue-300">Blockchain verified</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-sm font-semibold text-purple-400 mb-1">Auto-Match</div>
                <div className="text-xs text-blue-300">Vessel-cargo AI</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🔍</div>
                <div className="text-sm font-semibold text-orange-400 mb-1">RAG Search</div>
                <div className="text-xs text-blue-300">PageIndex enhanced</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">⚓</div>
                <div className="text-sm font-semibold text-pink-400 mb-1">Port Intel</div>
                <div className="text-xs text-blue-300">Predictive analytics</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-sm font-semibold text-yellow-400 mb-1">DA Forecast</div>
                <div className="text-xs text-blue-300">ML cost prediction</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🗺️</div>
                <div className="text-sm font-semibold text-teal-400 mb-1">Live AIS</div>
                <div className="text-xs text-blue-300">41M+ positions</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">📧</div>
                <div className="text-sm font-semibold text-indigo-400 mb-1">Email AI</div>
                <div className="text-xs text-blue-300">Auto-processing</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🤖</div>
                <div className="text-sm font-semibold text-cyan-400 mb-1">AI Assistant</div>
                <div className="text-xs text-blue-300">Multi-channel</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">📱</div>
                <div className="text-sm font-semibold text-green-400 mb-1">Mobile Ready</div>
                <div className="text-xs text-blue-300">Fully responsive</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🔐</div>
                <div className="text-sm font-semibold text-purple-400 mb-1">Multi-Tenant</div>
                <div className="text-xs text-blue-300">Enterprise security</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-sm font-semibold text-orange-400 mb-1">Real-Time</div>
                <div className="text-xs text-blue-300">&lt;100ms response</div>
              </div>
            </div>
          </div>

          {/* Use Cases with Numbers */}
          <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Real Use Cases, Real Results
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-6">
                <h4 className="text-xl font-bold text-cyan-400 mb-3">🚢 For Ship Brokers</h4>
                <p className="text-blue-200 mb-4">
                  From seeing a vessel on the map to contacting its owner with a cargo offer in just 14 seconds.
                </p>
                <div className="text-sm text-green-300">
                  ⚡ 308x faster than manual process (14s vs 72min)
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <h4 className="text-xl font-bold text-purple-400 mb-3">⚓ For Port Agencies</h4>
                <p className="text-blue-200 mb-4">
                  Automated pre-arrival intelligence with AI-powered DA cost forecasting and intelligent document status tracking.
                </p>
                <div className="text-sm text-green-300">
                  🎯 100% accurate predictions using proprietary ML models
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <h4 className="text-xl font-bold text-orange-400 mb-3">📊 For Charterers</h4>
                <p className="text-blue-200 mb-4">
                  AI-powered auto-matching engine with instant port cost calculations and RAG-enhanced search across 800+ ports.
                </p>
                <div className="text-sm text-green-300">
                  💰 Proprietary vessel ownership database (100% accuracy)
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <h4 className="text-xl font-bold text-pink-400 mb-3">🌐 For Fleet Operators</h4>
                <p className="text-blue-200 mb-4">
                  Real-time fleet tracking with AIS-based intelligent routing and ML-powered optimization using 41M+ data points.
                </p>
                <div className="text-sm text-green-300">
                  📈 Up to 15% fuel savings with proprietary routing algorithms
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our beta program and get early access to the future of maritime intelligence.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/beta/signup"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-all shadow-xl"
            >
              Join Beta Program
            </Link>
            <Link
              to="/ais/live"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white text-white rounded-lg text-lg font-semibold hover:bg-white/20 transition-all"
            >
              Explore Live Data
            </Link>
          </div>
          <p className="mt-6 text-blue-100 text-sm">
            No credit card required • 30-day free trial • Cancel anytime
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-blue-300 text-sm">
          <p>© 2026 Mari8X. Built with ❤️ for the maritime industry.</p>
          <p className="mt-2 text-blue-400">
            Tracking {dashboard?.uniqueVessels.toLocaleString() || '0'} vessels worldwide in
            real-time
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
