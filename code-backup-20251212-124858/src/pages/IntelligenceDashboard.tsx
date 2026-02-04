import React, { useState, useEffect, useCallback } from 'react';

/**
 * 🧠 ANKR INTELLIGENCE DASHBOARD v2.0
 * 
 * Enhanced with TANGIBLE improvements showing:
 * - WHAT is being improved
 * - HOW it's improving
 * - Real before/after examples
 * - Impact metrics
 */

// Improvement categories with icons and colors
const IMPROVEMENT_CATEGORIES = {
  performance: { icon: '⚡', label: 'Performance', color: 'from-yellow-500 to-orange-500', desc: 'Speed & efficiency gains' },
  reliability: { icon: '🛡️', label: 'Reliability', color: 'from-green-500 to-emerald-500', desc: 'Uptime & stability' },
  accuracy: { icon: '🎯', label: 'Accuracy', color: 'from-blue-500 to-cyan-500', desc: 'Prediction & response quality' },
  cost: { icon: '💰', label: 'Cost Savings', color: 'from-purple-500 to-violet-500', desc: 'Resource optimization' },
  userExperience: { icon: '😊', label: 'User Experience', color: 'from-pink-500 to-rose-500', desc: 'Satisfaction & usability' },
  automation: { icon: '🤖', label: 'Automation', color: 'from-indigo-500 to-blue-500', desc: 'Tasks automated' }
};

// Simulated real improvements data (in production, from API)
const SAMPLE_IMPROVEMENTS = [
  {
    id: 1,
    category: 'performance',
    area: 'API Response Time',
    target: 'wowtruck-backend/graphql',
    before: { value: 450, unit: 'ms', label: 'Average response time' },
    after: { value: 120, unit: 'ms', label: 'After optimization' },
    how: 'Detected N+1 query pattern in getVehicles resolver. Added DataLoader batching.',
    impact: '73% faster',
    impactScore: 73,
    timestamp: '2025-12-10T13:45:00Z',
    status: 'applied',
    learnedFrom: 'Pattern: 15 similar slow queries detected over 2 hours'
  },
  {
    id: 2,
    category: 'reliability',
    area: 'Database Connections',
    target: 'PostgreSQL connection pool',
    before: { value: 3, unit: 'failures/hour', label: 'Connection timeouts' },
    after: { value: 0, unit: 'failures/hour', label: 'After auto-fix' },
    how: 'Guru detected connection exhaustion pattern. Auto-increased pool size from 10 to 25.',
    impact: '100% reduction in failures',
    impactScore: 100,
    timestamp: '2025-12-10T13:30:00Z',
    status: 'applied',
    learnedFrom: 'Pattern: Connection pool exhausted during peak hours (9-11 AM)'
  },
  {
    id: 3,
    category: 'accuracy',
    area: 'Route ETA Prediction',
    target: 'ankr-nav/eta-calculator',
    before: { value: 72, unit: '%', label: 'Prediction accuracy' },
    after: { value: 89, unit: '%', label: 'After learning' },
    how: 'SIM generated 500 synthetic routes. Model learned traffic patterns for Mumbai-Pune corridor.',
    impact: '17% more accurate',
    impactScore: 17,
    timestamp: '2025-12-10T12:00:00Z',
    status: 'applied',
    learnedFrom: 'Training data: 500 synthetic + 1,200 real trips'
  },
  {
    id: 4,
    category: 'cost',
    area: 'LLM API Costs',
    target: 'ankr-eon/ai-router',
    before: { value: 12.50, unit: '$/day', label: 'Daily LLM spend' },
    after: { value: 0.85, unit: '$/day', label: 'After routing optimization' },
    how: 'Learning daemon detected 80% of queries are simple. Routed to DeepSeek instead of GPT-4.',
    impact: '93% cost reduction',
    impactScore: 93,
    timestamp: '2025-12-10T11:00:00Z',
    status: 'applied',
    learnedFrom: 'Pattern: Query complexity classification from 10,000 samples'
  },
  {
    id: 5,
    category: 'userExperience',
    area: 'Driver App Load Time',
    target: 'driver-app/initial-load',
    before: { value: 4.2, unit: 'sec', label: 'Time to interactive' },
    after: { value: 1.8, unit: 'sec', label: 'After optimization' },
    how: 'Detected large bundle size. Auto-configured code splitting for route components.',
    impact: '57% faster load',
    impactScore: 57,
    timestamp: '2025-12-10T10:30:00Z',
    status: 'applied',
    learnedFrom: 'Pattern: Users abandoning app after 3+ seconds wait'
  },
  {
    id: 6,
    category: 'automation',
    area: 'Error Recovery',
    target: 'All services',
    before: { value: 45, unit: 'min', label: 'Average recovery time' },
    after: { value: 2, unit: 'min', label: 'Auto-recovery time' },
    how: 'DevBrain now auto-detects and restarts failed services. Guru learned restart patterns.',
    impact: '95% faster recovery',
    impactScore: 95,
    timestamp: '2025-12-10T09:00:00Z',
    status: 'applied',
    learnedFrom: 'Pattern: 12 manual restarts analyzed, common fixes identified'
  },
  {
    id: 7,
    category: 'accuracy',
    area: 'Document Classification',
    target: 'ankr-docchain/classifier',
    before: { value: 78, unit: '%', label: 'Classification accuracy' },
    after: { value: 94, unit: '%', label: 'After training' },
    how: 'OCR + AI model retrained with 2,000 labeled PODs, LRs, and invoices.',
    impact: '16% more accurate',
    impactScore: 16,
    timestamp: '2025-12-10T08:00:00Z',
    status: 'applied',
    learnedFrom: 'Training: 2,000 documents with human corrections'
  },
  {
    id: 8,
    category: 'performance',
    area: 'Fleet Dashboard Load',
    target: 'wowtruck-frontend/fleet-analytics',
    before: { value: 3.5, unit: 'sec', label: 'Dashboard load time' },
    after: { value: 0.8, unit: 'sec', label: 'After caching' },
    how: 'Detected repeated identical queries. Added Redis caching with 5-minute TTL.',
    impact: '77% faster',
    impactScore: 77,
    timestamp: '2025-12-10T07:00:00Z',
    status: 'applied',
    learnedFrom: 'Pattern: Same vehicle list queried 50 times per user session'
  }
];

// Before/After comparison component
const BeforeAfterCard = ({ improvement }) => {
  const category = IMPROVEMENT_CATEGORIES[improvement.category];
  const percentChange = improvement.before.value > improvement.after.value
    ? ((improvement.before.value - improvement.after.value) / improvement.before.value * 100).toFixed(0)
    : ((improvement.after.value - improvement.before.value) / improvement.before.value * 100).toFixed(0);
  
  return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all group">
      {/* Header */}
      <div className={`bg-gradient-to-r ${category.color} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{category.icon}</span>
            <div>
              <div className="text-white font-bold">{improvement.area}</div>
              <div className="text-white/70 text-sm">{category.label}</div>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1 text-white font-bold">
            {improvement.impact}
          </div>
        </div>
      </div>
      
      {/* Before/After Comparison */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Before */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <div className="text-red-400 text-xs uppercase tracking-wider mb-1">Before</div>
            <div className="text-3xl font-black text-red-400">
              {improvement.before.value}
              <span className="text-lg ml-1">{improvement.before.unit}</span>
            </div>
            <div className="text-gray-500 text-xs mt-1">{improvement.before.label}</div>
          </div>
          
          {/* After */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-green-400 text-xs uppercase tracking-wider mb-1">After</div>
            <div className="text-3xl font-black text-green-400">
              {improvement.after.value}
              <span className="text-lg ml-1">{improvement.after.unit}</span>
            </div>
            <div className="text-gray-500 text-xs mt-1">{improvement.after.label}</div>
          </div>
        </div>
        
        {/* Progress bar showing improvement */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Improvement</span>
            <span className="text-green-400 font-bold">{improvement.impactScore}%</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${category.color} transition-all duration-1000`}
              style={{ width: `${Math.min(improvement.impactScore, 100)}%` }}
            />
          </div>
        </div>
        
        {/* How it improved */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🔧</div>
            <div>
              <div className="text-cyan-400 font-semibold text-sm mb-1">HOW IT IMPROVED:</div>
              <div className="text-gray-300 text-sm">{improvement.how}</div>
            </div>
          </div>
        </div>
        
        {/* What it learned from */}
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🧠</div>
            <div>
              <div className="text-violet-400 font-semibold text-sm mb-1">LEARNED FROM:</div>
              <div className="text-gray-400 text-sm">{improvement.learnedFrom}</div>
            </div>
          </div>
        </div>
        
        {/* Target and timestamp */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
          <div className="text-gray-500 text-xs font-mono">{improvement.target}</div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${improvement.status === 'applied' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-gray-500 text-xs">
              {new Date(improvement.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Summary stat card
const SummaryCard = ({ icon, label, value, subtext, color }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-1`}>
    <div className="bg-gray-900/95 backdrop-blur rounded-xl p-5 h-full">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-gray-400 text-sm uppercase tracking-wider">{label}</div>
      <div className="text-4xl font-black text-white mt-1">{value}</div>
      <div className="text-gray-500 text-sm mt-1">{subtext}</div>
    </div>
  </div>
);

// Category filter pills
const CategoryFilter = ({ selected, onSelect }) => (
  <div className="flex flex-wrap gap-2">
    <button
      onClick={() => onSelect(null)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
        selected === null 
          ? 'bg-white text-gray-900' 
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      All Improvements
    </button>
    {Object.entries(IMPROVEMENT_CATEGORIES).map(([key, cat]) => (
      <button
        key={key}
        onClick={() => onSelect(key)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
          selected === key 
            ? `bg-gradient-to-r ${cat.color} text-white` 
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
        }`}
      >
        <span>{cat.icon}</span>
        <span>{cat.label}</span>
      </button>
    ))}
  </div>
);

// Impact summary by category
const ImpactSummary = ({ improvements }) => {
  const categoryStats = Object.entries(IMPROVEMENT_CATEGORIES).map(([key, cat]) => {
    const items = improvements.filter(i => i.category === key);
    const avgImpact = items.length > 0 
      ? items.reduce((sum, i) => sum + i.impactScore, 0) / items.length 
      : 0;
    return { key, ...cat, count: items.length, avgImpact };
  });

  return (
    <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>📊</span> Impact by Category
      </h3>
      <div className="space-y-4">
        {categoryStats.filter(c => c.count > 0).map((cat) => (
          <div key={cat.key} className="flex items-center gap-4">
            <div className="text-2xl w-10">{cat.icon}</div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-white font-medium">{cat.label}</span>
                <span className="text-gray-400 text-sm">{cat.count} improvements</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${cat.color}`}
                  style={{ width: `${cat.avgImpact}%` }}
                />
              </div>
            </div>
            <div className="text-right w-16">
              <div className="text-white font-bold">{cat.avgImpact.toFixed(0)}%</div>
              <div className="text-gray-500 text-xs">avg impact</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// The Learning Process visualization
const LearningProcess = () => (
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700">
    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
      <span>🔄</span> How ANKR Intelligence Learns & Improves
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {[
        { step: 1, icon: '👁️', title: 'OBSERVE', desc: 'Learning Daemon watches all interactions, API calls, errors, and user behavior', color: 'from-cyan-500 to-blue-500' },
        { step: 2, icon: '🔍', title: 'DETECT', desc: 'Patterns emerge: slow queries, repeated errors, user friction points', color: 'from-blue-500 to-violet-500' },
        { step: 3, icon: '🧠', title: 'ANALYZE', desc: 'EON Memory provides context. "This happened before, here\'s what worked."', color: 'from-violet-500 to-purple-500' },
        { step: 4, icon: '⚡', title: 'DECIDE', desc: 'Guru Daemon chooses action: alert, suggest fix, or auto-fix based on confidence', color: 'from-purple-500 to-pink-500' },
        { step: 5, icon: '✅', title: 'IMPROVE', desc: 'DevBrain applies fix. Result stored. Next time, even faster!', color: 'from-pink-500 to-rose-500' }
      ].map((step, i) => (
        <div key={i} className="relative">
          <div className={`bg-gradient-to-br ${step.color} rounded-xl p-4 h-full`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {step.step}
              </div>
              <div className="text-2xl">{step.icon}</div>
            </div>
            <div className="text-white font-bold mb-2">{step.title}</div>
            <div className="text-white/70 text-sm">{step.desc}</div>
          </div>
          {i < 4 && (
            <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-gray-600 text-2xl z-10">
              →
            </div>
          )}
        </div>
      ))}
    </div>
    
    <div className="mt-6 bg-gray-800/50 rounded-xl p-4 flex items-center gap-4">
      <div className="text-3xl">🔁</div>
      <div>
        <div className="text-white font-semibold">The Recursive Loop</div>
        <div className="text-gray-400 text-sm">
          Every improvement teaches the system. Next time, it's faster, smarter, more confident.
          This is <span className="text-cyan-400 font-semibold">compound intelligence</span> - the same flywheel powering Google & Amazon.
        </div>
      </div>
    </div>
  </div>
);

// Real-time activity feed
const ActivityFeed = ({ improvements }) => (
  <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
      <span className="animate-pulse">🔴</span> Live Learning Feed
    </h3>
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {improvements.slice(0, 5).map((imp, i) => (
        <div 
          key={i} 
          className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl border-l-4 border-green-500"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="text-2xl">{IMPROVEMENT_CATEGORIES[imp.category]?.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium truncate">{imp.area}</div>
            <div className="text-gray-500 text-sm truncate">{imp.how.substring(0, 50)}...</div>
          </div>
          <div className="text-right">
            <div className="text-green-400 font-bold">{imp.impact}</div>
            <div className="text-gray-600 text-xs">
              {new Date(imp.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Main Dashboard Component
export default function ANKRIntelligenceDashboardV2() {
  const [improvements, setImprovements] = useState(SAMPLE_IMPROVEMENTS);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real data from API
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:4020/api/dashboard');
        if (res.ok) {
          setDashboard(await res.json());
        }
      } catch (err) {
        console.log('Using demo data');
      }
      setLoading(false);
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredImprovements = selectedCategory 
    ? improvements.filter(i => i.category === selectedCategory)
    : improvements;

  const totalImpact = improvements.reduce((sum, i) => sum + i.impactScore, 0);
  const avgImpact = totalImpact / improvements.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-white text-xl">Loading Intelligence Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />
      
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-violet-500 to-pink-500 flex items-center justify-center text-3xl animate-pulse">
                🧠
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-950" />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                ANKR INTELLIGENCE
              </h1>
              <p className="text-gray-500">Tangible Improvements Dashboard • What, How, Impact</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-green-400">{avgImpact.toFixed(0)}%</div>
            <div className="text-gray-500">Average Improvement</div>
          </div>
        </header>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            icon="📚"
            label="Total Improvements"
            value={improvements.length}
            subtext="Auto-discovered & applied"
            color="from-cyan-500 to-blue-600"
          />
          <SummaryCard
            icon="⚡"
            label="Performance Gains"
            value={`${improvements.filter(i => i.category === 'performance').reduce((s,i) => s + i.impactScore, 0) / improvements.filter(i => i.category === 'performance').length || 0}%`}
            subtext="Average speed improvement"
            color="from-yellow-500 to-orange-600"
          />
          <SummaryCard
            icon="💰"
            label="Cost Saved"
            value="93%"
            subtext="LLM API cost reduction"
            color="from-purple-500 to-violet-600"
          />
          <SummaryCard
            icon="🤖"
            label="Auto-Fixed"
            value={improvements.filter(i => i.status === 'applied').length}
            subtext="Issues fixed automatically"
            color="from-green-500 to-emerald-600"
          />
        </div>

        {/* How it works */}
        <div className="mb-8">
          <LearningProcess />
        </div>

        {/* Category filters */}
        <div className="mb-6">
          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left: Activity Feed */}
          <div className="lg:col-span-1">
            <ActivityFeed improvements={improvements} />
            <div className="mt-6">
              <ImpactSummary improvements={improvements} />
            </div>
          </div>
          
          {/* Right: Improvement cards */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredImprovements.map((improvement) => (
                <BeforeAfterCard key={improvement.id} improvement={improvement} />
              ))}
            </div>
          </div>
        </div>

        {/* The Big Picture */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">💎 The Compound Effect</h2>
            <p className="text-gray-400">Every improvement makes the next one faster and better</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="bg-gray-800/50 rounded-xl p-6">
              <div className="text-4xl font-black text-cyan-400">Day 1</div>
              <div className="text-gray-400 mt-2">60% accuracy</div>
              <div className="text-gray-500 text-sm">Learning starts</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6">
              <div className="text-4xl font-black text-violet-400">Day 30</div>
              <div className="text-gray-400 mt-2">80% accuracy</div>
              <div className="text-gray-500 text-sm">Patterns emerge</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6">
              <div className="text-4xl font-black text-pink-400">Day 90</div>
              <div className="text-gray-400 mt-2">92% accuracy</div>
              <div className="text-gray-500 text-sm">Auto-fixing most issues</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6">
              <div className="text-4xl font-black text-green-400">Day 365</div>
              <div className="text-gray-400 mt-2">98% accuracy</div>
              <div className="text-gray-500 text-sm">Near-autonomous</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-gray-800">
          <div className="text-gray-500">
            🙏 Jai Guru Ji • ANKR Intelligence Stack v2.0 • © 2025 ANKR Labs
          </div>
          <div className="text-gray-600 text-xs mt-2">
            Real improvements. Real impact. Real compound intelligence.
          </div>
        </footer>
      </div>
    </div>
  );
}
