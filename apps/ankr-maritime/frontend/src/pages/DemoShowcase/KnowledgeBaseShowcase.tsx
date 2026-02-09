import { useState } from 'react';
import { ShowcaseLayout } from '../../components/DemoShowcase/ShowcaseLayout';

interface Document {
  id: string;
  title: string;
  type: string;
  uploadDate: string;
  size: string;
  status: 'processing' | 'indexed' | 'ready';
  chunks: number;
  category: string;
  icon: string;
}

interface SearchResult {
  id: string;
  documentTitle: string;
  chunk: string;
  relevance: number;
  page?: number;
  highlights: string[];
}

const demoDocuments: Document[] = [
  {
    id: '1',
    title: 'NYPE 2015 Time Charter Party',
    type: 'Charter Party',
    uploadDate: '2026-01-15',
    size: '2.4 MB',
    status: 'ready',
    chunks: 156,
    category: 'Contracts',
    icon: '📋',
  },
  {
    id: '2',
    title: 'COA - ABC Shipping (2026)',
    type: 'Contract of Affreightment',
    uploadDate: '2026-01-20',
    size: '1.8 MB',
    status: 'ready',
    chunks: 98,
    category: 'Contracts',
    icon: '📄',
  },
  {
    id: '3',
    title: 'Laytime Definitions 2013',
    type: 'Industry Standard',
    uploadDate: '2026-01-10',
    size: '856 KB',
    status: 'ready',
    chunks: 42,
    category: 'Reference',
    icon: '📚',
  },
  {
    id: '4',
    title: 'BIMCO Bunker Adjustment Clause',
    type: 'Standard Clause',
    uploadDate: '2026-01-25',
    size: '124 KB',
    status: 'ready',
    chunks: 18,
    category: 'Reference',
    icon: '⚡',
  },
  {
    id: '5',
    title: 'Port of Singapore Regulations',
    type: 'Port Authority Document',
    uploadDate: '2026-02-01',
    size: '3.2 MB',
    status: 'ready',
    chunks: 214,
    category: 'Regulations',
    icon: '🏴',
  },
  {
    id: '6',
    title: 'ISM Code - Complete Guide',
    type: 'Compliance Manual',
    uploadDate: '2026-01-18',
    size: '1.4 MB',
    status: 'ready',
    chunks: 128,
    category: 'Compliance',
    icon: '⚖️',
  },
  {
    id: '7',
    title: 'Voyage Instructions - Template',
    type: 'Operational Template',
    uploadDate: '2026-02-05',
    size: '256 KB',
    status: 'indexed',
    chunks: 24,
    category: 'Templates',
    icon: '🗺️',
  },
  {
    id: '8',
    title: 'Q4 2025 Market Report',
    type: 'Market Analysis',
    uploadDate: '2026-02-08',
    size: '4.1 MB',
    status: 'processing',
    chunks: 0,
    category: 'Reports',
    icon: '📊',
  },
];

const demoSearchQueries = [
  {
    query: "What are the laytime exceptions in NYPE charter?",
    category: "Charter Party Terms",
    expectedResults: 3,
  },
  {
    query: "Bunker adjustment formula and calculation method",
    category: "Commercial Terms",
    expectedResults: 2,
  },
  {
    query: "Singapore port entry requirements and documentation",
    category: "Port Regulations",
    expectedResults: 4,
  },
  {
    query: "ISM Code requirements for document control",
    category: "Compliance",
    expectedResults: 3,
  },
];

const searchResults: Record<string, SearchResult[]> = {
  "What are the laytime exceptions in NYPE charter?": [
    {
      id: '1',
      documentTitle: 'NYPE 2015 Time Charter Party',
      chunk: 'Clause 18: Laytime Exceptions - Time spent in effecting repairs under Clause 3, time spent in drydock, cleaning or painting bottom, or delays caused by circumstances beyond the control of the Owners, including but not limited to strikes, lockouts, civil commotions, arrests, and restraints of princes, rulers and people...',
      relevance: 0.95,
      page: 12,
      highlights: ['laytime exceptions', 'beyond control', 'strikes', 'arrests'],
    },
    {
      id: '2',
      documentTitle: 'NYPE 2015 Time Charter Party',
      chunk: 'Off-hire provisions: The vessel shall be off-hire during any period when by reason of deficiency of men or stores, breakdown of machinery, damage to hull or other accident, either hindering or preventing the working of the vessel...',
      relevance: 0.88,
      page: 8,
      highlights: ['off-hire', 'breakdown', 'preventing working'],
    },
    {
      id: '3',
      documentTitle: 'Laytime Definitions 2013',
      chunk: 'Force Majeure Exceptions: Acts of God, war, strikes, lockouts, riots, civil commotions, epidemics, quarantine restrictions, and any other cause beyond the control of the party invoking the exception shall constitute valid exceptions to laytime counting...',
      relevance: 0.82,
      page: 24,
      highlights: ['force majeure', 'exceptions', 'laytime counting'],
    },
  ],
  "Bunker adjustment formula and calculation method": [
    {
      id: '1',
      documentTitle: 'BIMCO Bunker Adjustment Clause',
      chunk: 'Bunker Adjustment Formula: Freight shall be adjusted based on the formula: Adjusted Freight = Base Freight × (Current Bunker Price / Base Bunker Price) × Bunker Consumption Factor. The Base Bunker Price is USD 450/MT as specified in Box 35...',
      relevance: 0.96,
      page: 2,
      highlights: ['adjustment formula', 'base freight', 'bunker price', 'consumption factor'],
    },
    {
      id: '2',
      documentTitle: 'BIMCO Bunker Adjustment Clause',
      chunk: 'Calculation Example: If base bunker is USD 450/MT and current price is USD 620/MT, with consumption of 35 MT/day over 20 days voyage: Adjustment = (620-450) × 35 × 20 = USD 119,000 additional freight...',
      relevance: 0.91,
      page: 4,
      highlights: ['calculation example', 'consumption', 'additional freight'],
    },
  ],
  "Singapore port entry requirements and documentation": [
    {
      id: '1',
      documentTitle: 'Port of Singapore Regulations',
      chunk: 'Pre-Arrival Requirements: All vessels must submit the following documents at least 12 hours before arrival: (a) Maritime Declaration of Health, (b) Crew List, (c) Passenger List (if applicable), (d) Cargo Declaration, (e) Ship\'s Stores Declaration, (f) Last 10 Ports of Call...',
      relevance: 0.94,
      page: 18,
      highlights: ['pre-arrival', '12 hours', 'crew list', 'cargo declaration'],
    },
    {
      id: '2',
      documentTitle: 'Port of Singapore Regulations',
      chunk: 'Security Requirements: Under ISPS Code, vessels must maintain valid International Ship Security Certificate (ISSC). Security level notifications must be acknowledged. Ship Security Officer must complete security declaration with Port Facility Security Officer...',
      relevance: 0.89,
      page: 34,
      highlights: ['ISPS code', 'security certificate', 'security declaration'],
    },
    {
      id: '3',
      documentTitle: 'Port of Singapore Regulations',
      chunk: 'Clearance Process: Upon arrival at anchorage, vessel must obtain Port Health Clearance (Free Pratique) before any person may disembark. Immigration clearance required for crew changes. Customs clearance mandatory for cargo operations...',
      relevance: 0.86,
      page: 22,
      highlights: ['free pratique', 'immigration clearance', 'customs clearance'],
    },
    {
      id: '4',
      documentTitle: 'Voyage Instructions - Template',
      chunk: 'Singapore Port Call Checklist: □ Submit pre-arrival documents (12h before ETA), □ Prepare ship certificates for inspection, □ Brief crew on port procedures, □ Ensure all waste management records current, □ Verify cargo documents match port clearance...',
      relevance: 0.78,
      page: 8,
      highlights: ['port call checklist', 'pre-arrival documents', 'certificates'],
    },
  ],
  "ISM Code requirements for document control": [
    {
      id: '1',
      documentTitle: 'ISM Code - Complete Guide',
      chunk: 'Section 5.1 - Document Control: The Company should establish procedures to control all documents and data relevant to the SMS. These documents should be available at all relevant locations, reviewed and approved by authorized personnel, and identified by revision status...',
      relevance: 0.93,
      page: 42,
      highlights: ['document control', 'SMS', 'revision status', 'authorized personnel'],
    },
    {
      id: '2',
      documentTitle: 'ISM Code - Complete Guide',
      chunk: 'Document Retention: Records shall be retained for a minimum period as follows: (a) SMS documentation - lifetime of vessel, (b) Training records - 5 years after crew member leaves, (c) Internal audit records - 3 years, (d) Management review records - 3 years...',
      relevance: 0.87,
      page: 48,
      highlights: ['document retention', 'training records', 'audit records'],
    },
    {
      id: '3',
      documentTitle: 'ISM Code - Complete Guide',
      chunk: 'Master File System: All controlled documents should be maintained in a master file with document number, revision number, date of issue, and distribution list. Obsolete documents must be promptly removed from all points of issue and use...',
      relevance: 0.84,
      page: 44,
      highlights: ['master file', 'document number', 'obsolete documents'],
    },
  ],
};

export default function KnowledgeBaseShowcase() {
  const [activeTab, setActiveTab] = useState<'search' | 'documents' | 'upload'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentResults, setCurrentResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setSearchQuery(query);
    setIsSearching(true);
    setCurrentResults([]);

    // Simulate search delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Get results
    const results = searchResults[query] || [
      {
        id: 'fallback',
        documentTitle: 'Search Results',
        chunk: `This is a demo showcase. In the production system, your search for "${query}" would be processed using semantic search across all indexed documents, finding the most relevant passages with context-aware ranking.`,
        relevance: 0.75,
        highlights: ['semantic search', 'relevant passages'],
      },
    ];

    setCurrentResults(results);
    setIsSearching(false);
  };

  const filteredDocuments =
    selectedCategory === 'all'
      ? demoDocuments
      : demoDocuments.filter((d) => d.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(demoDocuments.map((d) => d.category)))];

  const stats = {
    totalDocuments: demoDocuments.length,
    totalChunks: demoDocuments.reduce((sum, d) => sum + d.chunks, 0),
    ready: demoDocuments.filter((d) => d.status === 'ready').length,
    processing: demoDocuments.filter((d) => d.status === 'processing').length,
  };

  return (
    <ShowcaseLayout
      title="Knowledge Base & RAG"
      icon="🧠"
      category="Intelligence & AI"
      problem="Information trapped in PDFs, Word docs, emails. Takes 30+ minutes to find specific clause in charter party. No way to search across all contracts. Knowledge lost when employees leave"
      solution="Upload any document (PDF, Word, Excel). AI automatically chunks, indexes, and creates semantic embeddings. Search in natural language. Get exact answers with source citations. Share knowledge across entire organization"
      timeSaved="5 hours/week"
      roi="20x"
      accuracy="98%"
      nextSection={{
        title: 'Analytics & Insights',
        path: '/demo-showcase/analytics-insights',
      }}
    >
      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4">
          <div className="text-sm text-maritime-400 mb-1">Total Documents</div>
          <div className="text-3xl font-bold text-white">{stats.totalDocuments}</div>
          <div className="text-xs text-maritime-500 mt-1">indexed & searchable</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="text-sm text-green-400 mb-1">Ready to Search</div>
          <div className="text-3xl font-bold text-green-400">{stats.ready}</div>
          <div className="text-xs text-green-500/70 mt-1">fully processed</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="text-sm text-blue-400 mb-1">Total Chunks</div>
          <div className="text-3xl font-bold text-blue-400">{stats.totalChunks}</div>
          <div className="text-xs text-blue-500/70 mt-1">semantic segments</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="text-sm text-purple-400 mb-1">Processing</div>
          <div className="text-3xl font-bold text-purple-400">{stats.processing}</div>
          <div className="text-xs text-purple-500/70 mt-1">being indexed</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 border-b border-maritime-700">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'search'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-maritime-400 hover:text-maritime-300'
          }`}
        >
          🔍 Semantic Search
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'documents'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-maritime-400 hover:text-maritime-300'
          }`}
        >
          📚 Document Library
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'upload'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-maritime-400 hover:text-maritime-300'
          }`}
        >
          ⬆️ Upload & Index
        </button>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              🔍 Ask Questions About Your Documents
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(searchQuery);
              }}
              className="flex gap-3 mb-4"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., What are the laytime exceptions in NYPE charter?"
                className="flex-1 bg-maritime-900 border border-maritime-600 rounded-lg px-4 py-3 text-white placeholder-maritime-500 focus:outline-none focus:border-blue-500"
                disabled={isSearching}
              />
              <button
                type="submit"
                disabled={!searchQuery.trim() || isSearching}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-maritime-700 disabled:text-maritime-500 text-white font-medium rounded-lg transition-colors"
              >
                {isSearching ? 'Searching...' : 'Search →'}
              </button>
            </form>

            {/* Sample Queries */}
            <div className="flex flex-wrap gap-2">
              {demoSearchQueries.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(sample.query)}
                  disabled={isSearching}
                  className="px-4 py-2 bg-maritime-900 hover:bg-maritime-800 border border-maritime-600 hover:border-blue-500 text-sm text-maritime-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  {sample.query}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-lg text-maritime-300">
                  Searching across {stats.totalChunks} document chunks...
                </span>
              </div>
              <div className="text-sm text-maritime-500">
                Using semantic similarity and vector embeddings
              </div>
            </div>
          )}

          {currentResults.length > 0 && !isSearching && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Found {currentResults.length} relevant passages
                </h3>
                <div className="text-sm text-maritime-400">
                  Sorted by relevance score
                </div>
              </div>

              {currentResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-maritime-800/50 border border-maritime-700 hover:border-blue-500 rounded-lg p-6 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1">
                        {result.documentTitle}
                      </h4>
                      {result.page && (
                        <div className="text-sm text-maritime-400">Page {result.page}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-lg">
                        <span className="text-sm text-green-400">
                          {(result.relevance * 100).toFixed(0)}% match
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-maritime-900/50 border border-maritime-700 rounded-lg p-4 mb-3">
                    <p className="text-maritime-200 leading-relaxed">{result.chunk}</p>
                  </div>

                  {result.highlights && result.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-maritime-500">Highlights:</span>
                      {result.highlights.map((highlight, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-xs text-blue-400 rounded"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-maritime-800 text-maritime-300 hover:bg-maritime-700'
                }`}
              >
                {category === 'all' ? 'All Documents' : category}
              </button>
            ))}
          </div>

          {/* Document Grid */}
          <div className="grid grid-cols-2 gap-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-maritime-800/50 border border-maritime-700 hover:border-blue-500 rounded-lg p-5 transition-all hover:scale-102"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{doc.icon}</div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{doc.title}</h4>
                      <div className="text-xs text-maritime-400">{doc.type}</div>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs ${
                      doc.status === 'ready'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : doc.status === 'indexed'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                    }`}
                  >
                    {doc.status}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-maritime-400">
                    <span>Uploaded:</span>
                    <span>{doc.uploadDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-maritime-400">
                    <span>Size:</span>
                    <span>{doc.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-maritime-400">
                    <span>Chunks:</span>
                    <span className="text-blue-400">{doc.chunks} segments</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-maritime-700 flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                    View Document
                  </button>
                  <button className="px-3 py-2 bg-maritime-700 hover:bg-maritime-600 text-white text-sm rounded transition-colors">
                    ⚙️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📤</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Upload Documents for AI Indexing
              </h3>
              <p className="text-maritime-400">
                Drag & drop or click to upload PDFs, Word docs, Excel sheets, or text files
              </p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-maritime-600 hover:border-blue-500 rounded-lg p-12 text-center transition-colors cursor-pointer bg-maritime-900/30 hover:bg-maritime-900/50">
              <div className="text-4xl mb-4">⬆️</div>
              <div className="text-lg text-white mb-2">Drop files here or click to browse</div>
              <div className="text-sm text-maritime-500">
                Supported: PDF, DOCX, XLSX, TXT (Max 50 MB)
              </div>
            </div>

            {/* Processing Pipeline Info */}
            <div className="mt-8 grid grid-cols-4 gap-4">
              <div className="bg-maritime-900/50 border border-maritime-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">1️⃣</div>
                <div className="text-sm font-semibold text-white mb-1">Extract Text</div>
                <div className="text-xs text-maritime-500">OCR if needed</div>
              </div>
              <div className="bg-maritime-900/50 border border-maritime-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">2️⃣</div>
                <div className="text-sm font-semibold text-white mb-1">Chunk Document</div>
                <div className="text-xs text-maritime-500">Smart segmentation</div>
              </div>
              <div className="bg-maritime-900/50 border border-maritime-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">3️⃣</div>
                <div className="text-sm font-semibold text-white mb-1">Create Embeddings</div>
                <div className="text-xs text-maritime-500">Vector representation</div>
              </div>
              <div className="bg-maritime-900/50 border border-maritime-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">4️⃣</div>
                <div className="text-sm font-semibold text-white mb-1">Index & Search</div>
                <div className="text-xs text-maritime-500">Ready in seconds</div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4">
              <div className="text-2xl mb-2">🔒</div>
              <h4 className="text-sm font-semibold text-white mb-1">Private & Secure</h4>
              <p className="text-xs text-maritime-400">
                Documents encrypted at rest and in transit. Role-based access control.
              </p>
            </div>
            <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="text-sm font-semibold text-white mb-1">Lightning Fast</h4>
              <p className="text-xs text-maritime-400">
                Search across millions of pages in milliseconds using vector similarity.
              </p>
            </div>
            <div className="bg-maritime-800/50 border border-maritime-700 rounded-lg p-4">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="text-sm font-semibold text-white mb-1">Context Aware</h4>
              <p className="text-xs text-maritime-400">
                Understands maritime terminology, abbreviations, and industry context.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="mt-8 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🧠 How RAG Works</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-blue-400 mb-2">
              1. Document Processing
            </h4>
            <p className="text-sm text-maritime-400">
              Documents are split into semantic chunks (paragraphs, sections). Each chunk gets
              a vector embedding representing its meaning.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-purple-400 mb-2">2. Semantic Search</h4>
            <p className="text-sm text-maritime-400">
              Your question is converted to a vector. We find chunks with similar vectors using
              cosine similarity, not just keyword matching.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-2">
              3. Context + Answer
            </h4>
            <p className="text-sm text-maritime-400">
              Top relevant chunks are used as context for AI to generate accurate answers with
              source citations.
            </p>
          </div>
        </div>
      </div>
    </ShowcaseLayout>
  );
}
