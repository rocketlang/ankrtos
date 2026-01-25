# Task #6: Codebase Indexer Service Setup - COMPLETE ✅

**Task ID:** INF-1
**Completed:** 2026-01-24
**OpenClaude Week 1-2 Development - Infrastructure**

## Overview

Implemented a real-time codebase indexing service that automatically indexes all project files, extracts metadata (functions, classes, imports, exports), and maintains an up-to-date search index. The service uses file watchers for incremental updates and provides real-time progress tracking via GraphQL subscriptions.

## Implementation Summary

### Backend Components

#### 1. Codebase Indexer Service (`apps/gateway/src/services/codebase-indexer.service.ts`)
- **Purpose:** Real-time codebase indexing with file watching and metadata extraction
- **Key Features:**
  - Automatic full project indexing on startup
  - Real-time file watching with chokidar
  - Code metadata extraction (functions, classes, imports, exports)
  - Keyword extraction and complexity calculation
  - Event-based architecture for progress tracking
  - Search capabilities within the index
  - Support for 25+ file types

**Key Methods:**
- `start()` - Start indexer with full index + file watcher
- `stop()` - Stop indexer and close file watcher
- `fullIndex()` - Perform complete project indexing
- `indexFile(path)` - Index a single file with metadata extraction
- `searchIndex(query, options)` - Search the index with filtering
- `extractMetadata(content, path)` - Extract functions, classes, imports, exports
- `extractKeywords(content)` - Extract top 20 keywords from content
- `getStats()` - Get comprehensive index statistics
- `getAllFiles()` - Get all indexed files
- `clearIndex()` - Clear the entire index

**Metadata Extraction:**

For **TypeScript/JavaScript** files:
- Functions: `function name()`, `const name = ()`, `name() {}`
- Classes: `class ClassName`
- Imports: `import ... from '...'`
- Exports: `export function/class/const ...`
- Dependencies: Extracted from non-relative imports
- Cyclomatic Complexity: Count of if/else/for/while/switch/&&/||/?

For **Python** files:
- Functions: `def name():`
- Classes: `class Name:`
- Imports: `from ... import ...`, `import ...`

**File Watching:**
- Watches all project files for changes
- Handles add, change, delete events
- Automatically updates index on file changes
- Ignores excluded patterns (node_modules, dist, build, etc.)

**Events Emitted:**
- `started` - Indexer service started
- `stopped` - Indexer service stopped
- `indexing-started` - Full index started
- `indexing-progress` - Progress update during indexing
- `indexing-complete` - Full index complete
- `indexing-error` - Error during indexing
- `file-indexed` - Single file indexed
- `file-removed` - File removed from index
- `index-cleared` - Index cleared

#### 2. GraphQL Schema (`apps/gateway/src/schema/codebase-indexer.ts`)
```graphql
type FileIndex {
  id: ID!
  path: String!
  relativePath: String!
  name: String!
  extension: String!
  language: String!
  size: Int!
  lines: Int!
  characters: Int!
  functions: [String!]!
  classes: [String!]!
  imports: [String!]!
  exports: [String!]!
  dependencies: [String!]!
  lastModified: DateTime!
  lastIndexed: DateTime!
  hash: String!
  excerpt: String!
  keywords: [String!]!
  complexity: Int
}

type IndexStats {
  totalFiles: Int!
  totalLines: Int!
  totalSize: Int!
  languages: JSON!
  lastIndexed: DateTime!
  indexingInProgress: Boolean!
  filesIndexedPerSecond: Float!
}

type IndexingProgress {
  current: Int!
  total: Int!
  currentFile: String!
  stage: IndexingStage!
  startTime: DateTime!
  estimatedCompletion: DateTime
}

enum IndexingStage {
  SCANNING
  INDEXING
  ANALYZING
  COMPLETE
}

extend type Query {
  fileIndex(relativePath: String!): FileIndex
  searchCodebaseIndex(input: SearchIndexInput!): [FileIndex!]!
  allIndexedFiles(language: String, limit: Int): [FileIndex!]!
  indexStats: IndexStats!
  indexingProgress: IndexingProgress
}

extend type Mutation {
  startFullIndex: Boolean!
  reindexFile(relativePath: String!): FileIndex
  clearIndex: Boolean!
}

extend type Subscription {
  indexingProgressUpdates: IndexingProgress!
  fileIndexed: FileIndex!
}
```

#### 3. GraphQL Resolver (`apps/gateway/src/resolvers/codebase-indexer.resolver.ts`)
- **Singleton Pattern** - Single indexer instance auto-started on first access
- **Queries:**
  - `fileIndex` - Get index for a specific file
  - `searchCodebaseIndex` - Search the index
  - `allIndexedFiles` - Get all files (with language filter)
  - `indexStats` - Get comprehensive statistics
  - `indexingProgress` - Get current progress
- **Mutations:**
  - `startFullIndex` - Trigger full reindex
  - `reindexFile` - Reindex a single file
  - `clearIndex` - Clear all index data
- **Subscriptions:**
  - `indexingProgressUpdates` - Real-time progress updates
  - `fileIndexed` - Notification when file is indexed

#### 4. Schema Integration
- Updated `apps/gateway/src/schema/index.ts` - Added codebaseIndexerSchema
- Updated `apps/gateway/src/resolvers/index.ts` - Added codebaseIndexerResolvers to Query, Mutation, Subscription

### Frontend Components

#### 5. Codebase Index Dashboard (`apps/web/src/components/ide/CodebaseIndexDashboard.tsx`)
- **Purpose:** Real-time dashboard for monitoring codebase indexing
- **Key Features:**
  - Live index statistics (files, lines, size)
  - Real-time progress bar during indexing
  - Language breakdown with color-coded badges
  - Manual reindex and clear buttons
  - Auto-polling every 5 seconds for stats
  - GraphQL subscription for real-time progress
  - Expandable/collapsible view
  - Loading and error states

**UI Elements:**
- **Header** - Title, status badge, action buttons
- **Progress Bar** - Real-time progress during indexing with stage indicators
- **Quick Stats** - 3-column grid showing:
  - Total Files
  - Total Lines
  - Total Size
- **Language Breakdown** - Sorted list of languages with file counts
- **Last Indexed** - Timestamp of last complete index

**Stage Indicators:**
- 🔍 SCANNING - Finding files
- 📝 INDEXING - Indexing files
- 🧠 ANALYZING - Analyzing code
- ✅ COMPLETE - Indexing complete

**Action Buttons:**
- **Expand/Collapse** - Toggle detailed view
- **Reindex** - Trigger full reindex
- **Clear** - Clear all index data

## Technical Highlights

### 1. Event-Driven Architecture
```typescript
export class CodebaseIndexerService extends EventEmitter {
  async fullIndex() {
    this.emit('indexing-started');
    // ... indexing logic
    this.emit('indexing-progress', progress);
    // ... more indexing
    this.emit('indexing-complete', stats);
  }
}
```

### 2. File Watching with Chokidar
```typescript
this.watcher = chokidar.watch(this.projectPath, {
  ignored: this.EXCLUDE_PATTERNS,
  persistent: true,
  ignoreInitial: true,
});

this.watcher
  .on('add', (filePath) => this.handleFileChange('add', filePath))
  .on('change', (filePath) => this.handleFileChange('change', filePath))
  .on('unlink', (filePath) => this.handleFileChange('delete', filePath));
```

### 3. Smart Metadata Extraction
```typescript
private extractMetadata(content: string, filePath: string) {
  const metadata = {
    functions: [],
    classes: [],
    imports: [],
    exports: [],
    dependencies: [],
    complexity: 0,
  };

  // Functions: function name(), const name = ()
  const functionMatches = content.matchAll(/(?:function|const|let|var)\s+(\w+)\s*=?\s*(?:async\s*)?\(/g);
  for (const match of functionMatches) {
    metadata.functions.push(match[1]);
  }

  // Classes: class ClassName
  const classMatches = content.matchAll(/class\s+(\w+)/g);
  for (const match of classMatches) {
    metadata.classes.push(match[1]);
  }

  // Cyclomatic complexity
  const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', '&&', '||', '?'];
  for (const keyword of complexityKeywords) {
    const matches = content.match(new RegExp(`\\b${keyword}\\b`, 'g'));
    if (matches) metadata.complexity += matches.length;
  }

  return metadata;
}
```

### 4. Keyword Extraction
```typescript
private extractKeywords(content: string): string[] {
  // Extract all words (3+ characters)
  const words = content.toLowerCase().match(/\b\w{3,}\b/g) || [];

  // Count frequency
  const frequency: Record<string, number> = {};
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }

  // Return top 20 keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}
```

### 5. Real-Time GraphQL Subscriptions
```typescript
const INDEXING_PROGRESS_SUBSCRIPTION = gql`
  subscription IndexingProgressUpdates {
    indexingProgressUpdates {
      current
      total
      currentFile
      stage
    }
  }
`;

useSubscription(INDEXING_PROGRESS_SUBSCRIPTION, {
  onData: ({ data }) => {
    // Update UI with real-time progress
  },
});
```

### 6. Singleton Pattern for Service
```typescript
let indexerService: CodebaseIndexerService | null = null;

function getIndexerService(): CodebaseIndexerService {
  if (!indexerService) {
    indexerService = new CodebaseIndexerService();
    indexerService.start(); // Auto-start
  }
  return indexerService;
}
```

## Example Use Cases

### Use Case 1: Auto-Indexing on Startup
1. Gateway server starts
2. First GraphQL query triggers indexer creation
3. Indexer automatically scans entire project
4. Dashboard shows real-time progress
5. Index ready for searches

### Use Case 2: Real-Time File Updates
1. Developer edits `src/auth/login.ts`
2. File watcher detects change event
3. Indexer re-indexes the file
4. Updated metadata available immediately
5. Search results reflect latest changes

### Use Case 3: Finding Function Definitions
1. Query: `searchCodebaseIndex(query: "authenticate")`
2. Indexer searches through `functions` arrays
3. Returns files containing `authenticate` function
4. Results include exact function names and locations

### Use Case 4: Language-Specific Queries
1. Query: `allIndexedFiles(language: "typescript", limit: 50)`
2. Returns all TypeScript files
3. Includes metadata (functions, classes, imports)
4. Useful for language-specific analysis

### Use Case 5: Monitoring Index Health
1. Open CodebaseIndexDashboard
2. See real-time stats (files, lines, size)
3. Check language distribution
4. Monitor indexing progress
5. Trigger reindex if needed

## Files Modified/Created

### Created:
- `apps/gateway/src/services/codebase-indexer.service.ts` (550 lines)
- `apps/gateway/src/schema/codebase-indexer.ts` (75 lines)
- `apps/gateway/src/resolvers/codebase-indexer.resolver.ts` (110 lines)
- `apps/web/src/components/ide/CodebaseIndexDashboard.tsx` (350 lines)

### Modified:
- `apps/gateway/src/schema/index.ts` - Added codebaseIndexerSchema import and integration
- `apps/gateway/src/resolvers/index.ts` - Added codebaseIndexerResolvers to Query, Mutation, Subscription

**Total Lines Added:** ~1090 lines

## Performance Considerations

1. **Incremental Indexing** - Only reindex changed files, not entire project
2. **File Size Limit** - Skip files >1MB to avoid memory issues
3. **Smart Exclusions** - Automatically excludes node_modules, dist, build, etc.
4. **Lazy Service Start** - Only starts on first access, not on server startup
5. **Event-Based Updates** - Efficient file watching with chokidar
6. **In-Memory Index** - Fast lookups with Map data structure
7. **Progress Batching** - Only emits progress every 10 files to reduce overhead
8. **Content Hashing** - Detect true changes (not just timestamp)

## Testing Recommendations

1. Test full index on large project (1000+ files)
2. Test file watching (add, modify, delete files)
3. Test search with various queries
4. Test language filtering
5. Verify metadata extraction accuracy
6. Test subscription updates in dashboard
7. Verify exclusion patterns work correctly
8. Test with binary files and special characters
9. Monitor memory usage during large indexing
10. Test concurrent file changes

## Future Enhancements

- **Incremental Summarization** - AI summaries for indexed files
- **Call Graph Analysis** - Map function call relationships
- **Dependency Graph** - Visualize import/export relationships
- **Code Quality Metrics** - Track complexity, duplication, test coverage
- **Historical Index** - Track code changes over time
- **Multi-Project Support** - Index multiple projects simultaneously
- **Vector Embeddings** - Semantic code search (Task #8)
- **Database Persistence** - Store index in PostgreSQL for persistence
- **Distributed Indexing** - Scale across multiple workers (Task #7)
- **AST Parsing** - More accurate metadata extraction with TypeScript compiler API

## Integration with Previous Tasks

Task #6 enhances the OpenClaude IDE infrastructure:

1. **Task #1 (File Search)** - Uses index for faster keyword matching
2. **Task #2-5** - All AI features benefit from indexed metadata
3. **Task #6 (Indexer)** - Provides foundation for advanced features (THIS TASK)
4. **Task #7 (Message Queue)** - Will distribute indexing workload
5. **Task #8 (Vector DB)** - Will add semantic search to indexed data

The indexer is the foundation for all future code intelligence features.

## Completion Status

✅ Backend service implemented
✅ Event-driven architecture implemented
✅ File watching implemented
✅ Metadata extraction implemented (TS/JS/Python)
✅ Keyword extraction implemented
✅ Complexity calculation implemented
✅ GraphQL schema defined
✅ GraphQL resolver created
✅ GraphQL subscriptions implemented
✅ Schema/resolver integration complete
✅ Frontend dashboard created
✅ Real-time progress tracking implemented
✅ Auto-start on first access implemented
✅ Documentation complete

**Task #6: Codebase Indexer Service Setup - COMPLETE**

---

**Next Tasks:**
- Task #7: Message Queue Setup (INF-2) - Distribute indexing workload
- Task #8: Vector Database Setup (INF-3) - Add semantic search capabilities

These final infrastructure tasks will enable distributed processing and semantic code understanding.
