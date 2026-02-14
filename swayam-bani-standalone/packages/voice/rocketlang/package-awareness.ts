/**
 * RocketLang Package Awareness
 *
 * Makes RocketLang aware of ALL ANKR packages and their capabilities.
 * Uses EON memory to store and retrieve package knowledge.
 *
 * Vision: "Bolo, code ban jaayega" - Speak, code will be created
 *
 * @author ANKR Labs
 */

import { remember, recall } from '@ankr/ankrcode-core';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface PackageCapability {
  name: string;
  description: string;
  category: 'api' | 'database' | 'auth' | 'file' | 'network' | 'ai' | 'voice' | 'logistics' | 'compliance' | 'utility';
  exports: string[];
  patterns: CodePattern[];
  examples: Example[];
  dependencies?: string[];
}

export interface CodePattern {
  name: string;
  description: string;
  trigger: string[];  // Hindi/English phrases that trigger this pattern
  template: string;   // Code template with {placeholders}
  requiredParams: string[];
}

export interface Example {
  input: string;      // Natural language input (Hindi/English)
  output: string;     // Generated code
  explanation: string;
}

export interface PackageRegistry {
  packages: Map<string, PackageCapability>;
  patterns: Map<string, CodePattern>;
  lastUpdated: number;
}

// ============================================================================
// ANKR PACKAGE KNOWLEDGE BASE
// ============================================================================

const ANKR_PACKAGES: PackageCapability[] = [
  // =========================================================================
  // @ankr/ankrcode-core - The CLI core
  // =========================================================================
  {
    name: '@ankr/ankrcode-core',
    description: 'AI Coding Assistant core - tools, permissions, conversation',
    category: 'utility',
    exports: ['registerTool', 'executeTool', 'ConversationManager', 'registry'],
    patterns: [
      {
        name: 'create-tool',
        description: 'Create a new tool for the CLI',
        trigger: ['नया tool बनाओ', 'tool create करो', 'new tool', 'add tool'],
        template: `import { registerTool, type Tool } from '@ankr/ankrcode-core';

const {toolName}Tool: Tool = {
  name: '{toolName}',
  description: '{description}',
  parameters: {
    type: 'object',
    properties: {
      {params}
    },
  },
  handler: async (params) => {
    {implementation}
    return { success: true, output: 'Done' };
  },
};

registerTool({toolName}Tool);`,
        requiredParams: ['toolName', 'description'],
      },
    ],
    examples: [
      {
        input: 'एक tool बनाओ जो file count करे',
        output: `const countFilesTool: Tool = {
  name: 'count_files',
  description: 'Count files in directory',
  // ...
};`,
        explanation: 'Creates a tool that counts files in a directory',
      },
    ],
  },

  // =========================================================================
  // @ankr/rocketlang - The DSL
  // =========================================================================
  {
    name: '@ankr/rocketlang',
    description: 'Hindi-first programming language',
    category: 'utility',
    exports: ['parse', 'compile', 'execute', 'RocketRuntime'],
    patterns: [
      {
        name: 'rocketlang-script',
        description: 'Create a RocketLang script',
        trigger: ['script बनाओ', 'RocketLang code', 'Hindi में code'],
        template: `// {scriptName}.rl
// RocketLang Script

{imports}

fn main():
    {body}

main()`,
        requiredParams: ['scriptName', 'body'],
      },
    ],
    examples: [],
  },

  // =========================================================================
  // @ankr/eon - Memory/Knowledge Graph
  // =========================================================================
  {
    name: '@ankr/eon',
    description: 'EON Memory - Knowledge graph for persistent memory',
    category: 'ai',
    exports: ['remember', 'recall', 'forget', 'relate', 'query'],
    patterns: [
      {
        name: 'remember-fact',
        description: 'Store information in memory',
        trigger: ['याद रखो', 'remember', 'store this', 'save this'],
        template: `import { remember } from '@ankr/eon';

await remember({
  type: '{entityType}',
  data: {
    {data}
  },
  metadata: {
    source: 'voice-command',
    timestamp: Date.now(),
  },
});`,
        requiredParams: ['entityType', 'data'],
      },
      {
        name: 'recall-fact',
        description: 'Retrieve information from memory',
        trigger: ['याद करो', 'recall', 'find', 'search memory'],
        template: `import { recall } from '@ankr/eon';

const results = await recall({
  type: '{entityType}',
  query: '{query}',
});`,
        requiredParams: ['entityType', 'query'],
      },
    ],
    examples: [
      {
        input: 'याद रखो कि project का port 4003 है',
        output: `await remember({ type: 'project_config', data: { port: 4003 } });`,
        explanation: 'Stores project configuration in EON memory',
      },
    ],
  },

  // =========================================================================
  // @powerpbox/mcp - MCP Tools (260+)
  // =========================================================================
  {
    name: '@powerpbox/mcp',
    description: '260+ MCP tools for logistics, compliance, memory, AI',
    category: 'utility',
    exports: ['getToolRegistry', 'setupAllTools', 'executeMCPTool'],
    patterns: [
      {
        name: 'use-mcp-tool',
        description: 'Use an MCP tool',
        trigger: ['MCP tool use करो', 'call MCP', 'execute tool'],
        template: `import { getToolRegistry } from '@powerpbox/mcp';

const registry = getToolRegistry();
const result = await registry.execute('{toolName}', {
  {params}
});`,
        requiredParams: ['toolName', 'params'],
      },
    ],
    examples: [],
  },

  // =========================================================================
  // FreightBox Tools
  // =========================================================================
  {
    name: 'freightbox',
    description: 'NVOCC shipping platform - bookings, tracking, BL management',
    category: 'logistics',
    exports: [],
    patterns: [
      {
        name: 'track-shipment',
        description: 'Track a shipment',
        trigger: ['shipment track करो', 'container track', 'tracking number', 'कहाँ है shipment'],
        template: `// Track shipment via FreightBox API
const tracking = await fetch('http://localhost:4003/api/tracking/{trackingNumber}');
const status = await tracking.json();
console.log('Status:', status.currentLocation, status.eta);`,
        requiredParams: ['trackingNumber'],
      },
      {
        name: 'create-booking',
        description: 'Create a shipping booking',
        trigger: ['booking बनाओ', 'shipment book करो', 'container book'],
        template: `// Create FreightBox booking
const booking = await fetch('http://localhost:4003/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origin: '{origin}',
    destination: '{destination}',
    containerType: '{containerType}',
    cargo: '{cargo}',
  }),
});`,
        requiredParams: ['origin', 'destination'],
      },
    ],
    examples: [
      {
        input: 'MAEU1234567 कहाँ है?',
        output: `const status = await trackContainer('MAEU1234567');`,
        explanation: 'Tracks container by number',
      },
    ],
  },

  // =========================================================================
  // WowTruck Tools
  // =========================================================================
  {
    name: 'wowtruck',
    description: 'TMS - Fleet management, trip planning, driver assignment',
    category: 'logistics',
    exports: [],
    patterns: [
      {
        name: 'create-trip',
        description: 'Create a truck trip',
        trigger: ['trip बनाओ', 'truck assign करो', 'गाड़ी भेजो'],
        template: `// Create WowTruck trip
const trip = await fetch('http://localhost:4000/api/trips', {
  method: 'POST',
  body: JSON.stringify({
    vehicleId: '{vehicleId}',
    driverId: '{driverId}',
    origin: '{origin}',
    destination: '{destination}',
    cargo: '{cargo}',
  }),
});`,
        requiredParams: ['origin', 'destination'],
      },
      {
        name: 'track-vehicle',
        description: 'Track vehicle location',
        trigger: ['गाड़ी कहाँ है', 'vehicle track', 'truck location'],
        template: `const location = await fetch('http://localhost:4000/api/vehicles/{vehicleId}/location');`,
        requiredParams: ['vehicleId'],
      },
    ],
    examples: [],
  },

  // =========================================================================
  // Database Patterns
  // =========================================================================
  {
    name: 'database',
    description: 'PostgreSQL database operations',
    category: 'database',
    exports: [],
    patterns: [
      {
        name: 'create-table',
        description: 'Create a database table',
        trigger: ['table बनाओ', 'database में table', 'schema create'],
        template: `-- Create {tableName} table
CREATE TABLE {tableName} (
  id SERIAL PRIMARY KEY,
  {columns}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`,
        requiredParams: ['tableName', 'columns'],
      },
      {
        name: 'query-data',
        description: 'Query database',
        trigger: ['data लाओ', 'database से', 'select करो', 'query करो'],
        template: `SELECT {columns} FROM {tableName} WHERE {conditions};`,
        requiredParams: ['tableName'],
      },
    ],
    examples: [
      {
        input: 'users table बनाओ जिसमें name और email हो',
        output: `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);`,
        explanation: 'Creates users table with name and email columns',
      },
    ],
  },

  // =========================================================================
  // API Patterns
  // =========================================================================
  {
    name: 'api',
    description: 'REST API creation patterns',
    category: 'api',
    exports: [],
    patterns: [
      {
        name: 'create-endpoint',
        description: 'Create an API endpoint',
        trigger: ['API बनाओ', 'endpoint create', 'route add करो'],
        template: `import { Hono } from 'hono';

const app = new Hono();

app.{method}('/{path}', async (c) => {
  {implementation}
  return c.json({ success: true, data: result });
});

export default app;`,
        requiredParams: ['method', 'path'],
      },
      {
        name: 'crud-api',
        description: 'Create full CRUD API',
        trigger: ['CRUD बनाओ', 'full API', 'REST API बनाओ'],
        template: `import { Hono } from 'hono';
import { db } from './db';

const {resource}Router = new Hono();

// List
{resource}Router.get('/', async (c) => {
  const items = await db.{resource}.findMany();
  return c.json(items);
});

// Get
{resource}Router.get('/:id', async (c) => {
  const item = await db.{resource}.findUnique({ where: { id: c.req.param('id') } });
  return c.json(item);
});

// Create
{resource}Router.post('/', async (c) => {
  const data = await c.req.json();
  const item = await db.{resource}.create({ data });
  return c.json(item, 201);
});

// Update
{resource}Router.put('/:id', async (c) => {
  const data = await c.req.json();
  const item = await db.{resource}.update({ where: { id: c.req.param('id') }, data });
  return c.json(item);
});

// Delete
{resource}Router.delete('/:id', async (c) => {
  await db.{resource}.delete({ where: { id: c.req.param('id') } });
  return c.json({ success: true });
});

export default {resource}Router;`,
        requiredParams: ['resource'],
      },
    ],
    examples: [
      {
        input: 'users का CRUD API बनाओ',
        output: `const usersRouter = new Hono();
usersRouter.get('/', ...);
usersRouter.post('/', ...);
// ... full CRUD`,
        explanation: 'Creates complete CRUD API for users resource',
      },
    ],
  },
];

// ============================================================================
// PACKAGE REGISTRY
// ============================================================================

class PackageAwareness {
  private registry: PackageRegistry;
  private initialized: boolean = false;

  constructor() {
    this.registry = {
      packages: new Map(),
      patterns: new Map(),
      lastUpdated: 0,
    };
  }

  /**
   * Initialize package awareness from knowledge base
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load built-in knowledge
    for (const pkg of ANKR_PACKAGES) {
      this.registry.packages.set(pkg.name, pkg);

      // Index patterns by triggers
      for (const pattern of pkg.patterns) {
        for (const trigger of pattern.trigger) {
          this.registry.patterns.set(trigger.toLowerCase(), pattern);
        }
      }
    }

    // Try to load additional knowledge from EON
    try {
      const eonResults = await recall('ankr_package', 50);

      if (eonResults?.length) {
        for (const result of eonResults) {
          // Parse stored package data
          try {
            const pkg = JSON.parse(result.memory.content) as PackageCapability;
            if (pkg.name) {
              this.registry.packages.set(pkg.name, pkg);
            }
          } catch {
            // Skip invalid entries
          }
        }
      }
    } catch {
      // EON not available, use built-in knowledge only
    }

    this.registry.lastUpdated = Date.now();
    this.initialized = true;

    console.log(`📦 Package awareness initialized: ${this.registry.packages.size} packages, ${this.registry.patterns.size} patterns`);
  }

  /**
   * Find matching pattern for natural language input
   */
  findPattern(input: string): { pattern: CodePattern; package: PackageCapability } | null {
    const normalized = input.toLowerCase().trim();

    // Direct trigger match
    const patternEntries = Array.from(this.registry.patterns.entries());
    for (const [trigger, pattern] of patternEntries) {
      if (normalized.includes(trigger)) {
        // Find the package that owns this pattern
        const packages = Array.from(this.registry.packages.values());
        for (const pkg of packages) {
          if (pkg.patterns.includes(pattern)) {
            return { pattern, package: pkg };
          }
        }
      }
    }

    // Fuzzy match using keywords
    const keywords = this.extractKeywords(normalized);
    let bestMatch: { pattern: CodePattern; package: PackageCapability; score: number } | null = null;

    const allPackages = Array.from(this.registry.packages.values());
    for (const pkg of allPackages) {
      for (const pattern of pkg.patterns) {
        const score = this.matchScore(keywords, pattern);
        if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { pattern, package: pkg, score };
        }
      }
    }

    return bestMatch ? { pattern: bestMatch.pattern, package: bestMatch.package } : null;
  }

  /**
   * Generate code from pattern and parameters
   */
  generateCode(pattern: CodePattern, params: Record<string, string>): string {
    let code = pattern.template;

    for (const [key, value] of Object.entries(params)) {
      code = code.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    // Remove unfilled placeholders
    code = code.replace(/\{[^}]+\}/g, '// TODO: fill in');

    return code;
  }

  /**
   * Extract parameters from natural language input
   */
  extractParams(input: string, pattern: CodePattern): Record<string, string> {
    const params: Record<string, string> = {};

    // Simple extraction rules
    // "users table बनाओ" → tableName: 'users'
    // "MAEU1234567 track करो" → trackingNumber: 'MAEU1234567'

    const words = input.split(/\s+/);

    for (const required of pattern.requiredParams) {
      switch (required) {
        case 'tableName':
        case 'resource':
          // First word before action word
          const tableMatch = input.match(/^(\w+)\s+(?:table|CRUD|API)/i);
          if (tableMatch) params[required] = tableMatch[1];
          break;

        case 'trackingNumber':
          // Container/tracking number pattern
          const trackMatch = input.match(/([A-Z]{4}\d{7})/);
          if (trackMatch) params[required] = trackMatch[1];
          break;

        case 'origin':
        case 'destination':
          // Location extraction (simplified)
          const locMatch = input.match(/(?:से|from)\s+(\w+)/i);
          if (locMatch && required === 'origin') params[required] = locMatch[1];
          const destMatch = input.match(/(?:को|to)\s+(\w+)/i);
          if (destMatch && required === 'destination') params[required] = destMatch[1];
          break;

        case 'toolName':
        case 'scriptName':
          // Extract name from "X बनाओ" pattern
          const nameMatch = input.match(/(\w+)\s+(?:tool|script|बनाओ)/i);
          if (nameMatch) params[required] = nameMatch[1];
          break;
      }
    }

    return params;
  }

  /**
   * Get package by name
   */
  getPackage(name: string): PackageCapability | undefined {
    return this.registry.packages.get(name);
  }

  /**
   * Get all packages in a category
   */
  getPackagesByCategory(category: PackageCapability['category']): PackageCapability[] {
    return Array.from(this.registry.packages.values()).filter(p => p.category === category);
  }

  /**
   * Store new pattern learned from user interaction
   */
  async learnPattern(input: string, generatedCode: string, feedback: 'good' | 'bad'): Promise<void> {
    if (feedback === 'good') {
      try {
        // Store learned pattern in EON memory
        const content = JSON.stringify({
          input,
          output: generatedCode,
          timestamp: Date.now(),
        });
        await remember(content, { type: 'knowledge', metadata: { source: 'rocketlang' } });
      } catch {
        // EON not available
      }
    }
  }

  // Private helpers
  private extractKeywords(text: string): string[] {
    const stopwords = ['करो', 'बनाओ', 'the', 'a', 'an', 'को', 'से', 'में', 'का', 'की', 'के'];
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.includes(w));
  }

  private matchScore(keywords: string[], pattern: CodePattern): number {
    const patternText = (pattern.name + ' ' + pattern.description + ' ' + pattern.trigger.join(' ')).toLowerCase();
    let matches = 0;

    for (const keyword of keywords) {
      if (patternText.includes(keyword)) matches++;
    }

    return keywords.length > 0 ? matches / keywords.length : 0;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let packageAwareness: PackageAwareness | null = null;

export async function getPackageAwareness(): Promise<PackageAwareness> {
  if (!packageAwareness) {
    packageAwareness = new PackageAwareness();
    await packageAwareness.initialize();
  }
  return packageAwareness;
}

export {
  PackageAwareness,
  ANKR_PACKAGES,
};
