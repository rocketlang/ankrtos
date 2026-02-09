import { useState } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface DemoQuery {
  question: string;
  category: string;
  icon: string;
  description: string;
  status: 'live' | 'development' | 'roadmap';
}

// These are the actual preset queries defined in the backend (mari8x-llm.ts)
const presetQueries: DemoQuery[] = [
  {
    question: "Show fleet financial summary",
    category: "Financial",
    icon: "💰",
    description: "Query existing financial data",
    status: "live",
  },
  {
    question: "List all open claims",
    category: "Claims",
    icon: "📋",
    description: "Query claims database",
    status: "live",
  },
  {
    question: "What is the current demurrage exposure?",
    category: "Operations",
    icon: "⏱️",
    description: "Calculate from laytime data",
    status: "live",
  },
  {
    question: "Which voyages are in progress?",
    category: "Voyages",
    icon: "🚢",
    description: "Query voyage status",
    status: "live",
  },
  {
    question: "DA cost breakdown by category",
    category: "Financial",
    icon: "📊",
    description: "Aggregate disbursement accounts",
    status: "live",
  },
  {
    question: "Show bills of lading for active voyages",
    category: "Documents",
    icon: "📄",
    description: "Query B/L records",
    status: "live",
  },
  {
    question: "Vessel utilization summary",
    category: "Analytics",
    icon: "⚡",
    description: "Calculate vessel metrics",
    status: "live",
  },
  {
    question: "Laytime status across all voyages",
    category: "Operations",
    icon: "⏰",
    description: "Aggregate laytime calculations",
    status: "live",
  },
];

// Future capabilities (roadmap)
const futureCapabilities: DemoQuery[] = [
  {
    question: "What are the current bunker prices in Singapore?",
    category: "Market Data",
    icon: "💰",
    description: "Real-time market intelligence",
    status: "development",
  },
  {
    question: "Calculate laytime with exceptions and provide recommendations",
    category: "Operations",
    icon: "⏱️",
    description: "AI-powered laytime analysis",
    status: "development",
  },
  {
    question: "Summarize contract terms from uploaded documents",
    category: "Contracts",
    icon: "📋",
    description: "AI document analysis using RAG",
    status: "development",
  },
  {
    question: "Draft professional emails based on context",
    category: "Communication",
    icon: "✉️",
    description: "AI-powered email generation",
    status: "roadmap",
  },
  {
    question: "Predict port delays and suggest alternatives",
    category: "Intelligence",
    icon: "🔮",
    description: "Predictive analytics",
    status: "roadmap",
  },
  {
    question: "Compare route profitability with weather and fuel data",
    category: "Analytics",
    icon: "📈",
    description: "Multi-source optimization",
    status: "roadmap",
  },
];

const statusColors = {
  live: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', label: 'Live' },
  development: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'In Development' },
  roadmap: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: 'Roadmap' },
};

// Note: Full AI responses not yet implemented - backend only has preset query support
const simulatedResponses: Record<string, string> = {
  "What are the current bunker prices in Singapore?": `📊 **Current Bunker Prices - Singapore (SGSIN)**
*As of Feb 9, 2026, 14:30 SGT*

**IFO 380 (HSFO):** $620/mt (↑ 2.3% from yesterday)
**VLSFO 0.5%:** $685/mt (↑ 1.8%)
**MGO:** $820/mt (↓ 0.5%)

**Market Insights:**
- Strong demand due to Chinese New Year stockpiling
- Supply tightening from refinery maintenance
- Brent crude at $84.50/bbl (↑0.8%)

**Recommendation:** Consider booking IFO 380 today if you have requirements for next week. Prices expected to rise 3-5% before Feb 15.

*Source: Live market data from Platts, Argus Media*`,

  "Calculate laytime for a vessel that arrived at 08:00, commenced loading at 14:00, and completed at 22:00 the next day": `⏱️ **Laytime Calculation**

**Timeline:**
- Arrival: Day 1, 08:00
- NOR Tendered: Day 1, 08:00
- NOR Accepted: Day 1, 08:00
- Commenced Loading: Day 1, 14:00
- Completed Loading: Day 2, 22:00

**Calculation:**
- **Time from NOR to Commencement:** 6 hours (waiting time)
- **Loading Time:** 32 hours (14:00 Day 1 → 22:00 Day 2)
- **Total Time Used:** 38 hours

**Assuming Standard Terms:**
- Laytime Allowed: 72 hours (3 days, SHEX)
- Time Used: 38 hours
- **Time Saved:** 34 hours

**Result:** ✅ **No demurrage** - Vessel completed within laytime

**Despatch Calculation:**
If despatch clause at 50% of demurrage rate ($10,000/day):
- Time saved: 34 hours = 1.42 days
- Despatch due: $7,083

*Note: This assumes SHEX (Sundays/Holidays Excluded) terms. Adjust for actual charter party clauses.*`,

  "Summarize the key terms of my COA with ABC Shipping": `📋 **Contract Summary: ABC Shipping COA**

**Contract Details:**
- **Contract No:** COA-2026-ABC-001
- **Parties:** Your Company (Charterer) ↔ ABC Shipping (Carrier)
- **Effective:** Jan 1, 2026 - Dec 31, 2026
- **Status:** Active

**Cargo & Quantity:**
- **Commodity:** Iron Ore
- **Total Quantity:** 500,000 MT (±10% charterer's option)
- **Shipments:** 10 shipments of 50,000 MT each
- **Completed:** 2 shipments (100,000 MT)
- **Remaining:** 8 shipments (400,000 MT)

**Route:**
- **Loading:** Port Hedland, Australia
- **Discharge:** Qingdao, China

**Freight Rate:**
- **Base Rate:** $18.50/MT
- **Bunker Adjustment:** BIMCO BAF clause
- **Current Rate (w/ BAF):** $19.20/MT

**Key Clauses:**
- ⏱️ Laytime: 3 days loading + 3 days discharge (SHEX)
- 💰 Demurrage: $15,000/day
- 🔄 Despatch: 50% of demurrage ($7,500/day)
- 📄 Payment: 95% within 30 days of B/L, 5% on final outturn

**Performance to Date:**
- ✅ On schedule (2/10 completed)
- ✅ No demurrage claims
- ✅ Average despatch earned: $8,200/shipment

*Full contract document available in DMS (Doc ID: COA-2026-001)*`,

  "Which vessels in my fleet are due for certificate renewal in the next 30 days?": `⚖️ **Certificate Expiry Alert - Next 30 Days**

**⚠️ 3 Vessels Require Attention:**

**1. MV OCEAN SPIRIT**
- **Class Certificate:** Expires Feb 15, 2026 (6 days)
- **IOPP Certificate:** Expires Feb 28, 2026 (19 days)
- **Status:** 🔴 Urgent - Class survey scheduled Feb 12-13 in Singapore
- **Action:** Confirm surveyor attendance, prepare documentation

**2. MV PACIFIC STAR**
- **Safety Equipment Certificate:** Expires Mar 5, 2026 (24 days)
- **Radio Certificate:** Expires Mar 8, 2026 (27 days)
- **Status:** 🟡 Attention - Plan renewal during next port call (Yokohama)
- **Action:** Contact surveyor, order any required equipment

**3. MV NORDIC EXPLORER**
- **ISM Certificate:** Expires Mar 10, 2026 (29 days)
- **Status:** 🟡 Scheduled - ISM audit planned for Feb 20-21 in Rotterdam
- **Action:** Ensure all documentation updated, conduct internal audit

**All Other Vessels:** ✅ Compliant (next expiry >30 days)

**Recommended Actions:**
1. Send renewal notices to classification societies (✓ Auto-sent)
2. Schedule surveys with port agents
3. Budget for survey fees: ~$15,000 total
4. Update planned maintenance system

*Auto-reminder emails sent to Technical Manager and Master*`,

  "Compare the profitability of Singapore-Rotterdam vs Singapore-Hamburg routes": `📊 **Route Profitability Analysis**

**Route Comparison: Singapore (SGSIN) → Europe**

**Route 1: Singapore → Rotterdam (NLRTM)**
- **Distance:** 8,287 nm
- **Transit Time:** 28.9 days @ 12 knots
- **Suez Canal:** Yes ($450,000)
- **Freight Rate:** $45/MT (current market)
- **Cargo:** 32,000 MT

**Revenue:** $1,440,000
**Costs:**
- Bunker (IFO 380): $398,000 (642 MT @ $620/MT)
- Suez Canal: $450,000
- Port Costs: $185,000
- Other: $127,000
**Total Costs:** $1,160,000
**Profit:** $280,000 (19.4% margin)

---

**Route 2: Singapore → Hamburg (DEHAM)**
- **Distance:** 8,431 nm
- **Transit Time:** 29.4 days @ 12 knots
- **Suez Canal:** Yes ($450,000)
- **Freight Rate:** $46.50/MT (premium for Hamburg)
- **Cargo:** 32,000 MT

**Revenue:** $1,488,000
**Costs:**
- Bunker (IFO 380): $405,000 (653 MT @ $620/MT)
- Suez Canal: $450,000
- Port Costs: $205,000 (higher than Rotterdam)
- Other: $128,000
**Total Costs:** $1,188,000
**Profit:** $300,000 (20.2% margin)

---

**📊 Recommendation: Hamburg (+7.1% profit)**

**Key Insights:**
- ✅ Hamburg offers $20,000 more profit despite 144 nm longer
- ✅ Higher freight rate compensates for additional costs
- ⚠️ Rotterdam has faster port turnaround (2 days vs 2.5 days)
- ⚠️ Hamburg congestion currently low (wait time: 0.5 days)

**Alternative:** Consider Rotterdam if freight differential drops below $1/MT

*Analysis based on current market rates as of Feb 9, 2026*`,

  "Draft an email to the agent about delayed berthing at Port of Santos": `✉️ **Draft Email Generated**

**To:** santos.agent@maritimeservices.com.br
**Cc:** ops@yourcompany.com
**Subject:** MV OCEAN SPIRIT - Delayed Berthing Notification & NOR

---

Dear Mr. Silva,

**Re: MV OCEAN SPIRIT - IMO 9876543 - Voyage 026/2024**

Further to our telephone conversation earlier today, I write to formally advise the following:

**Vessel Details:**
- Current Position: Anchorage A-3, Santos Roads
- Arrived: Feb 9, 2026, 06:00 LT
- Notice of Readiness: Tendered Feb 9, 2026, 06:30 LT
- Expected Berthing: **Delayed to Feb 10, 2026, 14:00 LT** (32 hours delay)

**Delay Reason:**
Terminal advised congestion at berth 14 due to previous vessel's extended discharge operations. Berth now expected available Feb 10 morning with pilot boarding at 14:00 LT.

**Commercial Impact:**
- Laytime commenced upon NOR acceptance (06:30 LT, Feb 9)
- Delay period to count as laytime used unless charterer claims exception
- Request written confirmation of delay cause for time bar purposes

**Actions Required:**
1. Confirm revised berthing time and pilot boarding
2. Provide written statement regarding berth availability delay
3. Update discharge plan and stevedore readiness
4. Coordinate fresh water, provisions as originally planned

**Vessel Status:**
- All cargo holds cleaned and inspected
- Draft surveys completed and ready
- All documentation submitted to customs
- Crew ready for immediate operations upon berthing

Please confirm receipt and provide updates on berth availability. We remain ready to proceed with discharge operations immediately upon berthing.

Best regards,

**Operations Department**
Your Company Maritime Ltd.
Tel: +65 6123 4567 | Email: ops@yourcompany.com

---

**AI Suggestions:**
- ✅ Professional tone maintained
- ✅ All key facts included (vessel details, delay info, NOR)
- ✅ Action items clearly stated
- ✅ Laytime implications noted
- 📎 Consider attaching: NOR copy, vessel particulars

*Edit as needed before sending*`,
};

export default function Mari8xLlmShowcase() {
  const [activeTab, setActiveTab] = useState<'current' | 'development' | 'roadmap'>('current');

  return (
    <ShowcaseLayout
      title="Mari8x AI Assistant"
      icon="🤖"
      category="Intelligence & AI (In Development)"
      problem="Information scattered across emails, spreadsheets, PDFs. Manual calculations take hours. No easy way to query complex maritime data. Team spends 6+ hours/week searching for information"
      solution="Natural language AI that will understand maritime operations. Planned features: instant answers from documents, automatic calculations, email drafting, contract analysis - all through conversational interface powered by Claude AI"
      timeSaved="Vision: 6 hours/week"
      roi="Target: 25x"
      accuracy="Target: 95%"
      nextSection={{
        title: 'Knowledge Base & RAG',
        path: '/demo-showcase/knowledge-base',
      }}
    >
      {/* Status Banner */}
      <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🚧</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-yellow-400 mb-2">Feature Under Active Development</h3>
            <p className="text-maritime-200 mb-3">
              The Mari8x AI Assistant is currently in development. We're building a sophisticated natural language interface powered by Claude AI that will integrate with all your maritime data.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400">Backend API: Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-400">AI Integration: In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-blue-400">ETA: Q2 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 border-b border-maritime-700">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'current'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-maritime-400 hover:text-maritime-300'
          }`}
        >
          ✅ Available Now
        </button>
        <button
          onClick={() => setActiveTab('development')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'development'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-maritime-400 hover:text-maritime-300'
          }`}
        >
          🚧 In Development
        </button>
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'roadmap'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-maritime-400 hover:text-maritime-300'
          }`}
        >
          🔮 Roadmap
        </button>
      </div>

      {/* Current Features Tab */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              Currently Available: Preset Database Queries
            </h3>
            <p className="text-maritime-300 mb-4">
              The backend currently supports predefined queries that retrieve structured data from your database. These queries are available through the GraphQL API.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {presetQueries.map((query, index) => (
              <div
                key={index}
                className="bg-maritime-800/50 border border-green-500/30 rounded-lg p-4 hover:border-green-500 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{query.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                        {statusColors[query.status].label}
                      </span>
                      <span className="text-xs text-maritime-500">{query.category}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-2">{query.question}</h4>
                    <p className="text-xs text-maritime-400">{query.description}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-maritime-700">
                  <div className="text-xs text-maritime-500">
                    <span className="text-green-400">✓</span> GraphQL query defined in backend
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
            <h4 className="text-sm font-semibold text-white mb-3">How It Works Today:</h4>
            <div className="space-y-2 text-sm text-maritime-300">
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">1.</span>
                <span>Backend defines preset queries in <code className="text-blue-400 text-xs">/backend/src/schema/types/mari8x-llm.ts</code></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">2.</span>
                <span>GraphQL API executes structured database queries</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">3.</span>
                <span>Results returned in JSON format</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">⚠</span>
                <span>No natural language processing - queries must match preset list exactly</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Development Tab */}
      {activeTab === 'development' && (
        <div className="space-y-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🚧</span>
              In Active Development
            </h3>
            <p className="text-maritime-300 mb-4">
              We're currently building AI-powered natural language understanding with Claude integration. These features will be available in the next release.
            </p>
            <div className="flex items-center gap-3 text-sm">
              <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded">
                Target: Q2 2026
              </div>
              <span className="text-maritime-400">Active development sprint</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {futureCapabilities.filter(c => c.status === 'development').map((query, index) => (
              <div
                key={index}
                className="bg-maritime-800/50 border border-yellow-500/30 rounded-lg p-4"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{query.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                        {statusColors[query.status].label}
                      </span>
                      <span className="text-xs text-maritime-500">{query.category}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-2">{query.question}</h4>
                    <p className="text-xs text-maritime-400">{query.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
            <h4 className="text-sm font-semibold text-white mb-3">Development Milestones:</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-green-500/20 border border-green-500 rounded-full flex items-center justify-center text-xs text-green-400 mt-0.5">✓</div>
                <div className="flex-1">
                  <div className="text-sm text-white mb-1">GraphQL Schema & API Structure</div>
                  <div className="text-xs text-maritime-500">Backend message types and query structure defined</div>
                </div>
                <div className="text-xs text-green-400">Complete</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-yellow-500/20 border border-yellow-500 rounded-full flex items-center justify-center text-xs text-yellow-400 mt-0.5 animate-pulse">◐</div>
                <div className="flex-1">
                  <div className="text-sm text-white mb-1">Claude API Integration</div>
                  <div className="text-xs text-maritime-500">Connecting to Anthropic Claude for natural language processing</div>
                </div>
                <div className="text-xs text-yellow-400">In Progress</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-maritime-700 border border-maritime-600 rounded-full flex items-center justify-center text-xs text-maritime-500 mt-0.5">○</div>
                <div className="flex-1">
                  <div className="text-sm text-maritime-300 mb-1">RAG Context Retrieval</div>
                  <div className="text-xs text-maritime-500">Connect AI to Knowledge Base for document-aware responses</div>
                </div>
                <div className="text-xs text-maritime-400">Next</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-maritime-700 border border-maritime-600 rounded-full flex items-center justify-center text-xs text-maritime-500 mt-0.5">○</div>
                <div className="flex-1">
                  <div className="text-sm text-maritime-300 mb-1">Real-Time Data Integration</div>
                  <div className="text-xs text-maritime-500">Connect to market data, AIS, and operational databases</div>
                </div>
                <div className="text-xs text-maritime-400">Planned</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roadmap Tab */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🔮</span>
              Future Roadmap
            </h3>
            <p className="text-maritime-300 mb-4">
              Advanced capabilities planned for future releases. These features will transform how you interact with maritime data.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {futureCapabilities.filter(c => c.status === 'roadmap').map((query, index) => (
              <div
                key={index}
                className="bg-maritime-800/50 border border-blue-500/30 rounded-lg p-4"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{query.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                        {statusColors[query.status].label}
                      </span>
                      <span className="text-xs text-maritime-500">{query.category}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-2">{query.question}</h4>
                    <p className="text-xs text-maritime-400">{query.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
            <h4 className="text-sm font-semibold text-white mb-3">Complete Vision:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-maritime-400 mb-2">Q2 2026 - Foundation</div>
                <ul className="space-y-1 text-xs text-maritime-500">
                  <li>✓ Natural language queries</li>
                  <li>✓ Document Q&A with RAG</li>
                  <li>✓ Basic calculations</li>
                  <li>✓ Data retrieval</li>
                </ul>
              </div>
              <div>
                <div className="text-maritime-400 mb-2">Q3 2026 - Advanced</div>
                <ul className="space-y-1 text-xs text-maritime-500">
                  <li>○ Email generation</li>
                  <li>○ Report creation</li>
                  <li>○ Multi-step workflows</li>
                  <li>○ Predictive analytics</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Technical Architecture */}
      <div className="mt-8 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🏗️ Planned Technical Architecture</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-maritime-400 mb-2">1. Natural Language</div>
            <div className="text-xs text-maritime-500 mb-2">Claude Sonnet 4.5</div>
            <p className="text-xs text-maritime-400">
              Anthropic's Claude AI processes natural language queries and generates human-like responses
            </p>
          </div>
          <div>
            <div className="text-sm text-maritime-400 mb-2">2. Context Retrieval</div>
            <div className="text-xs text-maritime-500 mb-2">RAG + Vector Search</div>
            <p className="text-xs text-maritime-400">
              Retrieval-Augmented Generation pulls relevant context from your knowledge base
            </p>
          </div>
          <div>
            <div className="text-sm text-maritime-400 mb-2">3. Data Integration</div>
            <div className="text-xs text-maritime-500 mb-2">GraphQL API</div>
            <p className="text-xs text-maritime-400">
              Connect to all operational systems: voyages, contracts, vessels, compliance
            </p>
          </div>
          <div>
            <div className="text-sm text-maritime-400 mb-2">4. Response Generation</div>
            <div className="text-xs text-maritime-500 mb-2">Structured Output</div>
            <p className="text-xs text-maritime-400">
              AI generates responses with citations, calculations, and actionable recommendations
            </p>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
}
