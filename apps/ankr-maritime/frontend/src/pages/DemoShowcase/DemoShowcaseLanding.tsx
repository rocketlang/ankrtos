import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

interface ShowcaseSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  path: string;
  category: string;
  timeSaved?: string;
  roi?: string;
}

const showcaseSections: ShowcaseSection[] = [
  // Pre-Fixture
  {
    id: 'market-intelligence',
    title: 'Market Intelligence Hub',
    icon: '🔍',
    description: 'Unified real-time market data, indices, and CRM pipeline visualization',
    path: '/demo-showcase/market-intelligence',
    category: 'Pre-Fixture',
    timeSaved: '4 hours/day',
    roi: '10x',
  },
  {
    id: 'chartering-workflow',
    title: 'Chartering Workflow',
    icon: '📊',
    description: 'Visual fixture negotiation flow from enquiry to acceptance',
    path: '/demo-showcase/chartering-workflow',
    category: 'Pre-Fixture',
    timeSaved: '2 hours/fixture',
    roi: '8x',
  },

  // Voyage Planning
  {
    id: 'voyage-estimation',
    title: 'Voyage Estimation Canvas',
    icon: '💰',
    description: 'Interactive route planner with real-time cost calculation and what-if scenarios',
    path: '/demo-showcase/voyage-estimation',
    category: 'Voyage Planning',
    timeSaved: '2 hours → 5 min',
    roi: '15x',
  },
  {
    id: 'route-optimization',
    title: 'Route Optimization',
    icon: '🗺️',
    description: 'Visual route comparison with weather, ECA zones, and cost analysis',
    path: '/demo-showcase/route-optimization',
    category: 'Voyage Planning',
    timeSaved: '3 hours/voyage',
    roi: '12x',
  },
  {
    id: 'port-intelligence',
    title: 'Port Intelligence',
    icon: '🏴',
    description: 'Interactive port map with congestion, restrictions, and agent directory',
    path: '/demo-showcase/port-intelligence',
    category: 'Voyage Planning',
    timeSaved: '1 hour/port',
    roi: '6x',
  },

  // Voyage Execution
  {
    id: 'fleet-dashboard',
    title: 'Live Fleet Dashboard',
    icon: '🌍',
    description: 'Real-time AIS tracking, journey playback, and geofencing alerts',
    path: '/demo-showcase/fleet-dashboard',
    category: 'Voyage Execution',
    timeSaved: '5 hours/week',
    roi: '20x',
  },
  {
    id: 'operations-center',
    title: 'Operations Center',
    icon: '⚙️',
    description: 'DA Desk workflow, noon reports, and critical path visualization',
    path: '/demo-showcase/operations-center',
    category: 'Voyage Execution',
    timeSaved: '3 hours/day',
    roi: '18x',
  },
  {
    id: 'port-operations',
    title: 'Port Operations',
    icon: '⚓',
    description: 'SOF builder, document checklist, and agent communication hub',
    path: '/demo-showcase/port-operations',
    category: 'Voyage Execution',
    timeSaved: '2 hours/port call',
    roi: '10x',
  },
  {
    id: 'performance-monitoring',
    title: 'Performance Monitoring',
    icon: '📈',
    description: 'Fuel consumption, speed optimization, and weather impact analysis',
    path: '/demo-showcase/performance-monitoring',
    category: 'Voyage Execution',
    timeSaved: '4 hours/week',
    roi: '14x',
  },

  // Commercial & Settlement
  {
    id: 'laytime-calculator',
    title: 'Laytime & Demurrage',
    icon: '⏱️',
    description: 'Visual timeline builder with clause library and automatic calculations',
    path: '/demo-showcase/laytime-calculator',
    category: 'Settlement',
    timeSaved: '3 hours/calculation',
    roi: '16x',
  },
  {
    id: 'document-chain',
    title: 'Document Chain',
    icon: '📄',
    description: 'B/L issuance flow, eBL blockchain, and approval workflow visualization',
    path: '/demo-showcase/document-chain',
    category: 'Settlement',
    timeSaved: '2 hours/shipment',
    roi: '9x',
  },
  {
    id: 'claims-settlement',
    title: 'Claims & Settlement',
    icon: '💼',
    description: 'Claim package assembly, evidence collection, and negotiation timeline',
    path: '/demo-showcase/claims-settlement',
    category: 'Settlement',
    timeSaved: '5 hours/claim',
    roi: '11x',
  },

  // Fleet Management
  {
    id: 'vessel-overview',
    title: 'Vessel Overview',
    icon: '🚢',
    description: 'Fleet composition, certificate expiry timeline, and inspection schedule',
    path: '/demo-showcase/vessel-overview',
    category: 'Fleet Management',
    timeSaved: '3 hours/week',
    roi: '13x',
  },
  {
    id: 'technical-operations',
    title: 'Technical Operations',
    icon: '🔧',
    description: 'Maintenance workflow, bunker management, and emissions tracking',
    path: '/demo-showcase/technical-operations',
    category: 'Fleet Management',
    timeSaved: '6 hours/week',
    roi: '17x',
  },

  // Financial Operations
  {
    id: 'financial-dashboard',
    title: 'Financial Dashboard',
    icon: '💵',
    description: 'Cash flow visualization, invoice tracking, and FX exposure management',
    path: '/demo-showcase/financial-dashboard',
    category: 'Finance',
    timeSaved: '4 hours/day',
    roi: '22x',
  },
  {
    id: 'contract-management',
    title: 'Contract Management',
    icon: '📋',
    description: 'COA tracking, time charter hire, and derivatives positions',
    path: '/demo-showcase/contract-management',
    category: 'Finance',
    timeSaved: '2 hours/contract',
    roi: '12x',
  },

  // Compliance
  {
    id: 'compliance-hub',
    title: 'Compliance Hub',
    icon: '⚖️',
    description: 'KYC status, sanctions screening, and insurance coverage visualization',
    path: '/demo-showcase/compliance-hub',
    category: 'Compliance',
    timeSaved: '3 hours/week',
    roi: '15x',
  },

  // Intelligence & AI
  {
    id: 'mari8x-llm',
    title: 'Mari8x LLM Showcase',
    icon: '🤖',
    description: 'Natural language queries, document Q&A, and contract analysis',
    path: '/demo-showcase/mari8x-llm',
    category: 'Intelligence',
    timeSaved: '6 hours/week',
    roi: '25x',
  },
  {
    id: 'knowledge-base',
    title: 'Knowledge Base & RAG',
    icon: '🧠',
    description: 'Document ingestion, semantic search, and knowledge graph exploration',
    path: '/demo-showcase/knowledge-base',
    category: 'Intelligence',
    timeSaved: '5 hours/week',
    roi: '20x',
  },
  {
    id: 'analytics-insights',
    title: 'Analytics & Insights',
    icon: '📊',
    description: 'Market trends, predictive analytics, and custom KPI dashboard builder',
    path: '/demo-showcase/analytics-insights',
    category: 'Intelligence',
    timeSaved: '4 hours/week',
    roi: '18x',
  },
];

const categories = [
  'Pre-Fixture',
  'Voyage Planning',
  'Voyage Execution',
  'Settlement',
  'Fleet Management',
  'Finance',
  'Compliance',
  'Intelligence',
];

export default function DemoShowcaseLanding() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tourActive, setTourActive] = useState(false);
  const [currentTourIndex, setCurrentTourIndex] = useState(0);
  const navigate = useNavigate();
  const tourCardRef = useRef<HTMLDivElement>(null);

  const filteredSections = selectedCategory
    ? showcaseSections.filter((s) => s.category === selectedCategory)
    : showcaseSections;

  // Handle arrow key navigation in tour mode
  useEffect(() => {
    if (!tourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentTourIndex < showcaseSections.length - 1) {
          setCurrentTourIndex(currentTourIndex + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentTourIndex > 0) {
          setCurrentTourIndex(currentTourIndex - 1);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        navigate(showcaseSections[currentTourIndex].path);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setTourActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tourActive, currentTourIndex, navigate]);

  // Smooth scroll to current tour card
  useEffect(() => {
    if (tourActive && tourCardRef.current) {
      tourCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentTourIndex, tourActive]);

  const startGuidedTour = () => {
    setTourActive(true);
    setCurrentTourIndex(0);
    setSelectedCategory(null); // Show all sections
  };

  const currentSection = showcaseSections[currentTourIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-maritime-950 via-maritime-900 to-maritime-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 animate-pulse" />
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="text-6xl mb-4">⚓</div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Mari8x Interactive Showcase
          </h1>
          <p className="text-xl text-maritime-300 max-w-3xl mx-auto mb-8">
            Explore 20 interactive demonstrations of Mari8x's complete maritime operations platform.
            See real workflows, calculate actual costs, and experience the future of maritime software.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={startGuidedTour}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              🎯 Start Guided Tour
            </button>
            <button
              onClick={() => setTourActive(false)}
              className="px-8 py-3 bg-maritime-800 hover:bg-maritime-700 text-white font-medium rounded-lg border border-maritime-600 transition-colors"
            >
              📚 Explore Freely
            </button>
          </div>
        </div>
      </div>

      {/* Guided Tour Overlay */}
      {tourActive && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            {/* Tour Progress */}
            <div className="text-center mb-6">
              <div className="text-white/60 text-sm mb-2">
                Guided Tour • Press ← → to navigate • Enter to open • Esc to exit
              </div>
              <div className="flex items-center justify-center gap-2">
                {showcaseSections.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all ${
                      i === currentTourIndex
                        ? 'w-8 bg-blue-500'
                        : i < currentTourIndex
                        ? 'w-2 bg-blue-600/50'
                        : 'w-2 bg-white/20'
                    }`}
                  />
                ))}
              </div>
              <div className="text-white/80 text-sm mt-2">
                {currentTourIndex + 1} of {showcaseSections.length}
              </div>
            </div>

            {/* Current Tour Card */}
            <div
              ref={tourCardRef}
              className="bg-maritime-800 border-2 border-blue-500 rounded-xl p-8 shadow-2xl shadow-blue-500/30 transform transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="text-6xl">{currentSection.icon}</div>
                <div className="text-xs px-3 py-1 bg-maritime-700 text-maritime-300 rounded-full">
                  {currentSection.category}
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">
                {currentSection.title}
              </h2>

              <p className="text-lg text-maritime-300 mb-6">
                {currentSection.description}
              </p>

              <div className="flex items-center gap-6 mb-6 text-sm">
                {currentSection.timeSaved && (
                  <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/30">
                    <span className="text-green-400 text-xl">⏱️</span>
                    <div>
                      <div className="text-white/60 text-xs">Time Saved</div>
                      <div className="text-green-400 font-medium">{currentSection.timeSaved}</div>
                    </div>
                  </div>
                )}
                {currentSection.roi && (
                  <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/30">
                    <span className="text-amber-400 text-xl">💰</span>
                    <div>
                      <div className="text-white/60 text-xs">ROI</div>
                      <div className="text-amber-400 font-medium">{currentSection.roi}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(currentSection.path)}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Try This Demo →
                </button>
                <button
                  onClick={() => currentTourIndex > 0 && setCurrentTourIndex(currentTourIndex - 1)}
                  disabled={currentTourIndex === 0}
                  className="px-4 py-3 bg-maritime-700 hover:bg-maritime-600 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={() => currentTourIndex < showcaseSections.length - 1 && setCurrentTourIndex(currentTourIndex + 1)}
                  disabled={currentTourIndex === showcaseSections.length - 1}
                  className="px-4 py-3 bg-maritime-700 hover:bg-maritime-600 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  →
                </button>
              </div>
            </div>

            {/* Close button */}
            <div className="text-center mt-6">
              <button
                onClick={() => setTourActive(false)}
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Exit Guided Tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">20</div>
            <div className="text-sm text-maritime-400">Interactive Demos</div>
          </div>
          <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">3-5x</div>
            <div className="text-sm text-maritime-400">Better Conversion</div>
          </div>
          <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">50+</div>
            <div className="text-sm text-maritime-400">Hours Saved/Week</div>
          </div>
          <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-amber-400">15x</div>
            <div className="text-sm text-maritime-400">Average ROI</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-maritime-800 text-maritime-300 hover:bg-maritime-700'
            }`}
          >
            All Sections ({showcaseSections.length})
          </button>
          {categories.map((category) => {
            const count = showcaseSections.filter((s) => s.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-maritime-800 text-maritime-300 hover:bg-maritime-700'
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Showcase Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSections.map((section) => (
            <Link
              key={section.id}
              to={section.path}
              className="group bg-maritime-800/50 border border-maritime-700 hover:border-blue-500 rounded-lg p-6 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{section.icon}</div>
                <div className="text-xs px-2 py-1 bg-maritime-700 text-maritime-300 rounded">
                  {section.category}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {section.title}
              </h3>
              <p className="text-sm text-maritime-400 mb-4">
                {section.description}
              </p>
              <div className="flex items-center gap-4 text-xs">
                {section.timeSaved && (
                  <div className="flex items-center gap-1">
                    <span className="text-green-400">⏱️</span>
                    <span className="text-maritime-300">{section.timeSaved}</span>
                  </div>
                )}
                {section.roi && (
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400">💰</span>
                    <span className="text-maritime-300">{section.roi} ROI</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300">
                Try Demo →
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Maritime Operations?
          </h2>
          <p className="text-maritime-300 mb-8 max-w-2xl mx-auto">
            Experience the complete Mari8x platform with your own data.
            Request full access and start your 14-day free trial.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Request Full Access →
            </button>
            <button className="px-8 py-3 bg-maritime-800 hover:bg-maritime-700 text-white font-medium rounded-lg border border-maritime-600 transition-colors">
              Schedule Demo Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
