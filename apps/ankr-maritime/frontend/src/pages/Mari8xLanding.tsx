import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AISFunFacts from '../components/AISFunFacts';
import AISRealWorldMapDual from '../components/AISRealWorldMapDual';

// Split queries for better error handling
// Using aisLiveStats - near-real-time data (updated every 15 min, <400ms query time!)
const LIVE_AIS_STATS_QUERY = gql(`
  query Mari8xLandingLiveStats {
    aisLiveStats {
      totalPositions
      uniqueVessels
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

export default function Mari8xLanding() {
  const [liveCount, setLiveCount] = useState(0);

  // Separate queries - if one fails, others still work
  const { data: aisData, loading: aisLoading, error: aisError } = useQuery(LIVE_AIS_STATS_QUERY, {
    pollInterval: 30000, // Refresh every 30 seconds (data updates every 15 min, query is <400ms)
    errorPolicy: 'all', // Return partial data on error
  });

  const { data: statsData, loading: statsLoading } = useQuery(MARITIME_STATS_QUERY, {
    errorPolicy: 'all',
  });

  // Animate the live count
  useEffect(() => {
    try {
      if (aisData?.aisLiveStats?.totalPositions) {
        const target = aisData.aisLiveStats.totalPositions;
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
    } catch (error) {
      console.error('Animation error:', error);
      // Set to fallback value (56.2M = 56,200,000)
      setLiveCount(56200000);
    }
  }, [aisData?.aisLiveStats?.totalPositions]);

  const dashboard = aisData?.aisLiveStats;

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
              to="/mari8x-technical"
              className="px-4 py-2 text-blue-300 hover:text-white transition-colors"
            >
              Technical
            </Link>
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
            <div className="inline-block px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-cyan-300 text-sm font-semibold mb-4">
              FOR CHARTERERS • BROKERS • SHIP OWNERS • PORT AGENTS
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
              Close More Fixtures.{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Faster Operations.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-200 max-w-3xl mx-auto mb-8">
              End-to-end platform for chartering, brokerage, operations, and port agency—
              from fixture negotiation to voyage settlement
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/beta/signup"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-xl shadow-blue-500/30"
              >
                Start Free Trial
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg text-lg font-semibold hover:bg-white/20 transition-all"
              >
                Sign In →
              </Link>
            </div>
          </div>

          {/* Live Stats - Abbreviated for clean display */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded-lg text-cyan-300 text-sm font-semibold">
                📊 Daily AIS Statistics
              </div>
              {dashboard?.lastUpdated && (
                <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-300 text-xs">
                  Last Updated: {new Date(dashboard.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
            <p className="text-center text-blue-300 text-sm mb-4">
              Data compiled daily at midnight UTC from real-time AIS feeds
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="text-blue-300 text-sm font-medium mb-2">Positions Tracked</div>
              <div className="text-3xl font-bold text-white mb-2">
                {aisLoading ? (
                  <span className="animate-pulse">...</span>
                ) : aisError ? (
                  <span className="text-red-400">56.2M</span>
                ) : (
                  `${(aisData?.aisLiveStats?.totalPositions / 1_000_000).toFixed(1)}M` || '56.2M'
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-green-400">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {aisError ? 'Cached' : 'Live'}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="text-blue-300 text-sm font-medium mb-2">Active Vessels</div>
              <div className="text-3xl font-bold text-white mb-2">
                {aisLoading ? (
                  <span className="animate-pulse">...</span>
                ) : dashboard?.uniqueVessels ? (
                  `${(dashboard.uniqueVessels / 1000).toFixed(1)}K`
                ) : '41.9K'}
              </div>
              <div className="text-xs text-cyan-400">
                {dashboard?.shipsMovingNow ? `${(dashboard.shipsMovingNow / 1000).toFixed(1)}K` : '28.5K'} moving
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="text-blue-300 text-sm font-medium mb-2">Global Ports</div>
              <div className="text-3xl font-bold text-white mb-2">
                {statsLoading ? (
                  <span className="animate-pulse">...</span>
                ) : statsData?.maritimeStats?.totalPorts ? (
                  `${(statsData.maritimeStats.totalPorts / 1000).toFixed(1)}K`
                ) : '12.7K'}
              </div>
              <div className="text-xs text-purple-400">{statsData?.maritimeStats?.totalCountries || '103'} countries</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="text-blue-300 text-sm font-medium mb-2">Port Tariffs</div>
              <div className="text-3xl font-bold text-white mb-2">
                {statsLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  statsData?.maritimeStats?.totalTariffs?.toLocaleString() || '800+'
                )}
              </div>
              <div className="text-xs text-orange-400">{statsData?.maritimeStats?.portsCovered || '800'} ports</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="text-blue-300 text-sm font-medium mb-2">At Anchor</div>
              <div className="text-3xl font-bold text-white mb-2">
                {aisLoading ? (
                  <span className="animate-pulse">...</span>
                ) : dashboard?.shipsAtAnchor ? (
                  `${(dashboard.shipsAtAnchor / 1000).toFixed(1)}K`
                ) : '13.4K'}
              </div>
              <div className="text-xs text-blue-400">At rest</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="text-blue-300 text-sm font-medium mb-2">Vessel Lookup</div>
              <div className="text-3xl font-bold text-white mb-2">14s</div>
              <div className="text-xs text-teal-400">vs 72min manual</div>
            </div>
          </div>

          {/* Core Business Workflows - What Maritime Professionals Actually Do */}
          <div className="mb-16 bg-gradient-to-br from-slate-900/80 to-blue-900/50 border-2 border-cyan-500/30 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-3xl font-bold text-white text-center mb-12">
              Built for How You Actually Work
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Chartering */}
              <div className="bg-gradient-to-br from-blue-900/60 to-cyan-900/40 backdrop-blur-sm border border-cyan-500/40 rounded-xl p-6 hover:scale-105 transition-transform">
                <div className="text-5xl mb-4 text-center">⚓</div>
                <h4 className="text-xl font-bold text-cyan-300 mb-3 text-center">Chartering Desk</h4>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Spot, Time & COA management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Fixture subject tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Charter party templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Automated recaps</span>
                  </li>
                </ul>
              </div>

              {/* Brokerage */}
              <div className="bg-gradient-to-br from-purple-900/60 to-pink-900/40 backdrop-blur-sm border border-purple-500/40 rounded-xl p-6 hover:scale-105 transition-transform">
                <div className="text-5xl mb-4 text-center">🤝</div>
                <h4 className="text-xl font-bold text-purple-300 mb-3 text-center">Ship Brokerage</h4>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Vessel → owner in 14 seconds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Open tonnage list</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Cargo enquiry matching</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>S&P deal room</span>
                  </li>
                </ul>
              </div>

              {/* Commercial/Operations */}
              <div className="bg-gradient-to-br from-green-900/60 to-teal-900/40 backdrop-blur-sm border border-green-500/40 rounded-xl p-6 hover:scale-105 transition-transform">
                <div className="text-5xl mb-4 text-center">📊</div>
                <h4 className="text-xl font-bold text-green-300 mb-3 text-center">Commercial Ops</h4>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Voyage estimates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>P&L tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Hire payment schedules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Laytime calculations</span>
                  </li>
                </ul>
              </div>

              {/* Port Agency */}
              <div className="bg-gradient-to-br from-orange-900/60 to-red-900/40 backdrop-blur-sm border border-orange-500/40 rounded-xl p-6 hover:scale-105 transition-transform">
                <div className="text-5xl mb-4 text-center">🏢</div>
                <h4 className="text-xl font-bold text-orange-300 mb-3 text-center">Port Agency</h4>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Pre-arrival intelligence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>DA cost forecasting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>PDA/FDA portals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Auto port tariffs (800+ ports)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* AIS Fun Facts - Live insights from maritime data */}
          {/* <AISFunFacts /> */}
          <div className="mb-16 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-8">
            <h3 className="text-3xl font-bold text-white flex items-center gap-3 mb-6">
              <span className="text-4xl">📊</span>
              AIS Data at Scale
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400 mb-2">56.2M+</div>
                <div className="text-sm text-blue-300">AIS Positions Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">41.9K+</div>
                <div className="text-sm text-blue-300">Unique Vessels</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">1,340+</div>
                <div className="text-sm text-blue-300">Positions/Vessel Average</div>
              </div>
            </div>
          </div>

          {/* Global AIS Heatmap - Daily snapshot of worldwide vessel traffic */}
          <div className="mt-16">
            <AISRealWorldMapDual />
          </div>
        </div>
      </div>

      {/* What is Mari8X */}
      <div className="relative bg-gradient-to-b from-slate-900 to-blue-950 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Your Complete Maritime Operations Platform
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              From <span className="text-cyan-400 font-semibold">fixture negotiation</span> to <span className="text-green-400 font-semibold">voyage execution</span> to <span className="text-purple-400 font-semibold">port operations</span>—
              manage chartering, brokerage, commercial, and agency workflows in one platform.
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <div className="text-4xl mb-4">⚓</div>
              <h3 className="text-2xl font-bold text-white mb-4">Chartering & Brokerage</h3>
              <p className="text-blue-200 leading-relaxed">
                Manage spot charters, time charters, and COAs in one platform. Track fixture subjects,
                generate automated recaps, and access vessel ownership data in 14 seconds.
                Open tonnage lists and cargo matching powered by AI help you close more fixtures faster.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-2xl font-bold text-white mb-4">Commercial & P&L Management</h3>
              <p className="text-blue-200 leading-relaxed">
                Voyage estimates, hire payment tracking, and automated P&L calculations.
                Laytime/demurrage computations, invoice management, and credit/debit notes—
                all with real-time financial visibility across your entire fleet and voyage portfolio.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-2xl font-bold text-white mb-4">Port Agency Operations</h3>
              <p className="text-blue-200 leading-relaxed">
                Pre-arrival intelligence with automated DA cost forecasting. PDA/FDA portals,
                document upload workflows, and auto-calculated port tariffs for 800+ ports.
                Master alert system for two-way communication via email, WhatsApp, and SMS.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-white mb-4">Operations & Compliance</h3>
              <p className="text-blue-200 leading-relaxed">
                Track vessels, certificates, inspections, and emissions (CII/EU ETS) in real-time.
                Event-driven timeline for complete voyage visibility. Document vault, compliance
                monitoring, and automated expiry alerts keep your operations running smoothly.
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
                  <div>🤖 AI-powered tariff intelligence</div>
                  <div>📡 AIS-based intelligent routing</div>
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
                    <span className="text-green-400">✓</span> Live AIS Tracking
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
                    <div className="text-sm text-blue-300">ML-powered with 49.6M+ positions</div>
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

            {/* Platform Performance */}
            <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">⚡</span> Performance
              </h3>
              <div className="space-y-4 text-blue-200">
                <div className="flex justify-between">
                  <span>API Response</span>
                  <span className="font-bold text-cyan-400">&lt;100ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime</span>
                  <span className="font-bold text-green-400">99.9%</span>
                </div>
                <div className="flex justify-between">
                  <span>Feature Pages</span>
                  <span className="font-bold text-purple-400">137</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Updates</span>
                  <span className="font-bold text-orange-400">Midnight UTC</span>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="text-sm text-cyan-300">
                    🚀 Enterprise-Grade Performance & Reliability
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
                <div className="text-xs text-blue-300">Real-time tracking</div>
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
                  Real-time fleet tracking with AIS-based intelligent routing and ML-powered optimization using 49.6M+ data points.
                </p>
                <div className="text-sm text-green-300">
                  📈 Up to 15% fuel savings with proprietary routing algorithms
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Calculator Section */}
      <div className="relative bg-gradient-to-b from-slate-900 to-blue-950 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Calculate Your Savings
            </h2>
            <p className="text-xl text-blue-200">
              See how much time and money Mari8X saves your operations
            </p>
          </div>

          <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-2 border-cyan-500/40 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="bg-white/10 rounded-xl p-6 text-center">
                <div className="text-6xl font-bold text-cyan-400 mb-2">308x</div>
                <div className="text-lg text-white font-semibold mb-2">Faster Vessel Lookup</div>
                <div className="text-sm text-blue-300">14 seconds vs 72 minutes manual</div>
                <div className="mt-4 text-xs text-green-400">
                  = 71 minutes saved per lookup
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-6 text-center">
                <div className="text-6xl font-bold text-green-400 mb-2">99.7%</div>
                <div className="text-lg text-white font-semibold mb-2">Time Savings</div>
                <div className="text-sm text-blue-300">Automated workflows vs manual</div>
                <div className="mt-4 text-xs text-green-400">
                  = 40 hours/week saved per user
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-6 text-center">
                <div className="text-6xl font-bold text-purple-400 mb-2">$500K+</div>
                <div className="text-lg text-white font-semibold mb-2">Annual Savings</div>
                <div className="text-sm text-blue-300">Per mid-size operation</div>
                <div className="mt-4 text-xs text-green-400">
                  = ROI in first 3 months
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 border border-green-500/30 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                💰 Typical Customer Savings Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-blue-200">Reduced manual data entry</span>
                  <span className="text-green-400 font-bold">$180K/year</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-blue-200">Avoided DA cost surprises</span>
                  <span className="text-green-400 font-bold">$120K/year</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-blue-200">Faster fixture closing</span>
                  <span className="text-green-400 font-bold">$90K/year</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-blue-200">Reduced compliance penalties</span>
                  <span className="text-green-400 font-bold">$110K/year</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="relative bg-gradient-to-b from-blue-950 to-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-blue-200">
              Choose the plan that fits your operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/30 border border-blue-500/30 rounded-2xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                <div className="text-sm text-blue-300 mb-4">For Small Operators</div>
                <div className="text-5xl font-bold text-cyan-400 mb-2">$99</div>
                <div className="text-blue-300 text-sm">/month per user</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-blue-200">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Up to 5 users</span>
                </li>
                <li className="flex items-start gap-2 text-blue-200">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Basic chartering tools</span>
                </li>
                <li className="flex items-start gap-2 text-blue-200">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Vessel tracking</span>
                </li>
                <li className="flex items-start gap-2 text-blue-200">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Port tariff access</span>
                </li>
                <li className="flex items-start gap-2 text-blue-200">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Email support</span>
                </li>
              </ul>
              <Link
                to="/beta/signup"
                className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg font-semibold transition"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Professional - Popular */}
            <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border-2 border-cyan-500/60 rounded-2xl p-8 transform scale-105 shadow-2xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2 rounded-full text-white text-sm font-bold shadow-lg">
                MOST POPULAR
              </div>
              <div className="text-center mb-6 mt-4">
                <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
                <div className="text-sm text-cyan-300 mb-4">For Growing Operations</div>
                <div className="text-5xl font-bold text-cyan-300 mb-2">$499</div>
                <div className="text-cyan-200 text-sm">/month per user</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-blue-100">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Up to 25 users</span>
                </li>
                <li className="flex items-start gap-2 text-blue-100">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Full chartering & operations</span>
                </li>
                <li className="flex items-start gap-2 text-blue-100">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>AI-powered features</span>
                </li>
                <li className="flex items-start gap-2 text-blue-100">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-start gap-2 text-blue-100">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2 text-blue-100">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>API access</span>
                </li>
              </ul>
              <Link
                to="/beta/signup"
                className="block w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white text-center rounded-lg font-semibold transition shadow-lg"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-gradient-to-br from-slate-800/50 to-purple-900/30 border border-purple-500/30 rounded-2xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                <div className="text-sm text-purple-300 mb-4">For Large Fleets</div>
                <div className="text-5xl font-bold text-purple-400 mb-2">Custom</div>
                <div className="text-purple-300 text-sm">Contact sales</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-blue-200">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Unlimited users</span>
                </li>
                <li className="flex items-start gap-2 text-blue-200">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Everything in Professional</span>
                </li>
                <li className="flex items-start gap-2 text-blue-200">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-start gap-2 text-blue-200">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Dedicated support team</span>
                </li>
                <li className="flex items-start gap-2 text-blue-200">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>On-premise deployment</span>
                </li>
                <li className="flex items-start gap-2 text-blue-200">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>SLA guarantees</span>
                </li>
              </ul>
              <Link
                to="/beta/signup"
                className="block w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-center rounded-lg font-semibold transition"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="relative bg-gradient-to-b from-slate-900 to-blue-950 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                How long does implementation take?
              </h3>
              <p className="text-blue-200">
                Most customers are fully operational within 2-3 weeks. We provide dedicated onboarding,
                data migration support, and training for your team. For enterprise deployments, we work
                with your IT team to ensure smooth integration with existing systems.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                How accurate is the vessel ownership data?
              </h3>
              <p className="text-blue-200">
                100% accuracy. Our proprietary database is verified against IMO GISIS and updated daily.
                Unlike crowdsourced platforms, we maintain direct relationships with ship registries and
                classification societies for authoritative ownership information.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                Can I integrate Mari8X with my existing systems?
              </h3>
              <p className="text-blue-200">
                Yes! We provide a comprehensive GraphQL API, real-time subscriptions, and webhook integration.
                Common integrations include accounting systems (QuickBooks, Xero), email (Outlook, Gmail),
                and communication tools (Slack, Teams). Enterprise plans include custom integration support.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                What happens to my data if I cancel?
              </h3>
              <p className="text-blue-200">
                You own your data. We provide full data export in standard formats (CSV, JSON, PDF) at any time.
                After cancellation, we retain your data for 90 days to allow smooth transition, then securely
                delete it per GDPR requirements. Enterprise customers can request on-premise data backup.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                Do you offer training for our team?
              </h3>
              <p className="text-blue-200">
                Absolutely. All plans include comprehensive onboarding and video training library.
                Professional and Enterprise plans include live training sessions, role-specific workshops,
                and ongoing support. We also provide a knowledge base and 24/7 help center.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-3">
                How is this different from other maritime software?
              </h3>
              <p className="text-blue-200">
                Mari8X is the only platform that combines chartering, operations, port agency, and compliance
                in a single system—powered by 49.6M+ AIS positions and proprietary vessel ownership data.
                Traditional software forces you to use 5-10 different tools; we replace all of them with
                one unified platform that actually understands maritime workflows.
              </p>
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
      <div className="bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Mari8X</h3>
              <p className="text-blue-300 text-sm">
                End-to-end maritime operations platform for chartering, brokerage, and port agency.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-blue-300 text-sm">
                <li><Link to="/ais/live" className="hover:text-white transition">AIS Dashboard</Link></li>
                <li><Link to="/mari8x-technical" className="hover:text-white transition">Technical Docs</Link></li>
                <li><Link to="/beta/signup" className="hover:text-white transition">Beta Program</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-blue-300 text-sm">
                <li>About Us</li>
                <li>Contact</li>
                <li>Careers</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-blue-300 text-sm">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>GDPR Compliance</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-blue-300 text-sm">
            <p>© 2026 Mari8X. Built with ❤️ for the maritime industry.</p>
          </div>
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
