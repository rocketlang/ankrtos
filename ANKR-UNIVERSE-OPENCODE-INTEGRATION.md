# ANKR Universe × OpenCode Integration Plan

## Overview

Integrate OpenCode (OSS AI coding assistant) into ANKR Universe as the developer-facing IDE, providing:
- Interactive tool exploration for 755+ ANKR tools
- Live code execution with ANKR orchestration layer
- Multi-language support (11 Indian languages)
- Voice-to-code via BANI integration
- Cost-optimized execution via SLM-first routing

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  ANKR Universe Frontend (React)                         │
│  ├── Showcase (existing)                                │
│  ├── Conversation (existing)                            │
│  └── IDE (NEW - OpenCode embedded)                      │
│      ├── Monaco Editor                                  │
│      ├── Tool Explorer (755 ANKR tools)                 │
│      ├── Execution Playground                           │
│      └── Plan Visualizer                                │
└─────────────────────────────────────────────────────────┘
                    ↓ GraphQL + WebSocket
┌─────────────────────────────────────────────────────────┐
│  ANKR Universe Gateway (Fastify + Mercurius)            │
│  ├── OpenCode Plugin Bridge (NEW)                       │
│  │   ├── Tool manifest → OpenCode tool converter        │
│  │   ├── Orchestration hook (planner + runner)          │
│  │   ├── Cost tracking hook                             │
│  │   └── Memory integration (EON)                       │
│  ├── GraphQL IDE Schema (NEW)                           │
│  └── Existing resolvers                                 │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  OpenCode Server (Headless Mode)                        │
│  ├── @opencode-ai/sdk                                   │
│  ├── ANKR Plugin (@ankr-universe/opencode-plugin)       │
│  └── Session Management                                 │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  ANKR Orchestration Layer (Existing)                    │
│  ├── Tool Registry (755 tools)                          │
│  ├── Planner                                            │
│  ├── Runner                                             │
│  └── Verifier                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: OpenCode Server Integration (Week 1)

### 1.1 Add OpenCode as Dependency

**Location:** `/root/ankr-universe/apps/gateway/`

```json
// apps/gateway/package.json
{
  "dependencies": {
    "@opencode-ai/sdk": "^1.1.34",
    "@opencode-ai/plugin": "^1.1.34"
  }
}
```

### 1.2 Create ANKR OpenCode Plugin

**New Package:** `/root/ankr-universe/packages/integrations/opencode-bridge/`

```typescript
// packages/integrations/opencode-bridge/src/index.ts
import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import { ToolRegistry } from '@ankr-universe/tool-registry';
import { Planner } from '@ankr-universe/planner';
import { Runner } from '@ankr-universe/runner';

export const ankrPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  const registry = new ToolRegistry();
  const planner = new Planner(registry);
  const runner = new Runner();

  // Convert ANKR tool manifests → OpenCode tool definitions
  const tools = await registry.getAllTools();
  const opencodeTools = convertToOpencodeFormat(tools);

  return {
    // Provide all 755 ANKR tools to OpenCode
    tool: opencodeTools,

    // Intercept tool execution → route through ANKR orchestration
    'tool.execute.before': async (input, output) => {
      const ankrTool = await registry.getTool(input.tool);

      // Validate inputs against Zod schema
      const validatedArgs = ankrTool.inputs.parse(output.args);

      // Cost estimation before execution
      const cost = estimateCost(ankrTool, validatedArgs);
      console.log(`💰 Estimated cost: ₹${cost}`);

      output.args = validatedArgs;
    },

    // After execution → log to ANKR memory (EON)
    'tool.execute.after': async (input, output) => {
      await logToEON({
        sessionID: input.sessionID,
        tool: input.tool,
        output: output.output,
        cost: calculateActualCost(input.tool)
      });
    },

    // Cost tracking hook
    'chat.params': async (input, output) => {
      // Use SLM-first routing
      const shouldUseSLM = await checkSLMEligibility(input.message);
      if (shouldUseSLM) {
        output.model = 'ollama/qwen2.5-coder:7b'; // Local SLM
        output.options.temperature = 0.3;
      }
    },

    // Permission hook - auto-approve safe tools
    'permission.ask': async (input, output) => {
      const tool = await registry.getTool(input.tool);

      // Auto-approve read-only operations
      if (tool.sideEffects?.includes('read') &&
          !tool.sideEffects?.includes('write') &&
          !tool.sideEffects?.includes('payment')) {
        output.status = 'allow';
      }
    },

    // Multi-language support hook
    'experimental.chat.messages.transform': async (input, output) => {
      // Translate messages to Hindi/regional languages if needed
      for (const msg of output.messages) {
        if (shouldTranslate(msg)) {
          msg.parts = await translateParts(msg.parts);
        }
      }
    }
  };
};

// Convert ANKR ToolManifest → OpenCode ToolDefinition
function convertToOpencodeFormat(tools: ToolManifest[]): Record<string, ToolDefinition> {
  return Object.fromEntries(
    tools.map(tool => [
      tool.name,
      {
        description: tool.displayName,
        parameters: zodToJsonSchema(tool.inputs),
        handler: async (args: any) => {
          // Route through ANKR runner
          const result = await runner.execute({
            toolId: tool.name,
            inputs: args
          });
          return result.output;
        }
      }
    ])
  );
}
```

### 1.3 Start OpenCode Headless Server

```typescript
// apps/gateway/src/services/opencode.service.ts
import { spawn } from 'child_process';
import { createOpencodeClient } from '@opencode-ai/sdk';

export class OpencodeService {
  private server: ChildProcess;
  private client: ReturnType<typeof createOpencodeClient>;

  async start() {
    // Start OpenCode in headless mode
    this.server = spawn('opencode', ['serve', '--port', '7777'], {
      cwd: '/root/ankr-universe',
      env: {
        ...process.env,
        OPENCODE_PLUGIN: '/root/ankr-universe/packages/integrations/opencode-bridge'
      }
    });

    // Connect SDK client
    this.client = createOpencodeClient({
      url: 'http://localhost:7777'
    });

    console.log('✅ OpenCode server started on port 7777');
  }

  async createSession(projectPath: string) {
    return this.client.session.create({ directory: projectPath });
  }

  async sendMessage(sessionID: string, message: string) {
    return this.client.message.send({ sessionID, message });
  }
}
```

---

## Phase 2: GraphQL API Integration (Week 1-2)

### 2.1 GraphQL Schema Extensions

```graphql
# apps/gateway/src/schema/ide.ts

type Query {
  # IDE session management
  ideSession(id: ID!): IDESession
  ideSessions: [IDESession!]!

  # Tool discovery for IDE
  ideToolCatalog(
    category: String
    search: String
    capabilities: [String!]
  ): [IDEToolInfo!]!

  # Get tool documentation with examples
  ideToolDocs(toolId: ID!): IDEToolDocumentation!
}

type Mutation {
  # Session lifecycle
  ideCreateSession(projectName: String!): IDESession!
  ideCloseSession(sessionID: ID!): Boolean!

  # Send message to OpenCode
  ideSendMessage(
    sessionID: ID!
    message: String!
  ): IDEMessageResult!

  # Execute tool directly (bypass OpenCode)
  ideExecuteTool(
    sessionID: ID!
    toolId: ID!
    inputs: JSON!
  ): IDEExecutionResult!

  # Save code snippet
  ideSaveSnippet(
    sessionID: ID!
    code: String!
    language: String!
  ): IDESnippet!
}

type Subscription {
  # Real-time execution updates
  ideExecutionStream(sessionID: ID!): IDEExecutionUpdate!

  # Tool output streaming
  ideToolOutput(sessionID: ID!, callID: ID!): IDEToolOutputChunk!
}

type IDESession {
  id: ID!
  projectName: String!
  createdAt: DateTime!
  messages: [IDEMessage!]!
  snippets: [IDESnippet!]!
  totalCost: Float!
  costBreakdown: IDECostBreakdown!
}

type IDEToolInfo {
  id: ID!
  name: String!
  displayName: String!
  category: String!
  description: String!
  capabilities: [String!]!
  estimatedCost: Float!
  estimatedLatency: Int!
  sideEffects: [String!]!
  tags: [String!]!
  stability: String!
}

type IDEToolDocumentation {
  tool: IDEToolInfo!
  inputs: JSON!
  outputs: JSON!
  examples: [IDEToolExample!]!
  relatedTools: [IDEToolInfo!]!
}

type IDEExecutionResult {
  success: Boolean!
  output: JSON
  cost: Float!
  latency: Int!
  error: String
}

type IDECostBreakdown {
  slmCalls: Int!
  slmCost: Float!
  llmCalls: Int!
  llmCost: Float!
  totalSavings: Float! # vs pure LLM
}
```

### 2.2 GraphQL Resolvers

```typescript
// apps/gateway/src/resolvers/ide.resolver.ts
import { OpencodeService } from '../services/opencode.service';
import { ToolRegistry } from '@ankr-universe/tool-registry';
import { PrismaClient } from '@ankr-universe/db';

export const ideResolvers = {
  Query: {
    ideToolCatalog: async (_, { category, search, capabilities }, ctx) => {
      const registry = new ToolRegistry();
      return registry.search({
        category,
        query: search,
        capabilities
      });
    },

    ideToolDocs: async (_, { toolId }, ctx) => {
      const registry = new ToolRegistry();
      const tool = await registry.getTool(toolId);
      const examples = await registry.getExamples(toolId);
      const related = await registry.findRelated(toolId);

      return {
        tool,
        inputs: tool.inputs,
        outputs: tool.outputs,
        examples,
        relatedTools: related
      };
    }
  },

  Mutation: {
    ideCreateSession: async (_, { projectName }, ctx) => {
      const opencode = ctx.opencodeService as OpencodeService;
      const session = await opencode.createSession(`/tmp/${projectName}`);

      // Save to database
      return ctx.prisma.ideSession.create({
        data: {
          id: session.id,
          projectName,
          userId: ctx.user.id
        }
      });
    },

    ideSendMessage: async (_, { sessionID, message }, ctx) => {
      const opencode = ctx.opencodeService as OpencodeService;
      const result = await opencode.sendMessage(sessionID, message);

      // Log to conversation history
      await ctx.prisma.ideMessage.create({
        data: {
          sessionID,
          content: message,
          role: 'user'
        }
      });

      return result;
    },

    ideExecuteTool: async (_, { sessionID, toolId, inputs }, ctx) => {
      const runner = ctx.runner;
      const startTime = Date.now();

      try {
        const result = await runner.execute({ toolId, inputs });
        const latency = Date.now() - startTime;
        const cost = calculateCost(toolId, result);

        // Update session cost
        await ctx.prisma.ideSession.update({
          where: { id: sessionID },
          data: {
            totalCost: { increment: cost }
          }
        });

        return {
          success: true,
          output: result.output,
          cost,
          latency
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          cost: 0,
          latency: Date.now() - startTime
        };
      }
    }
  },

  Subscription: {
    ideExecutionStream: {
      subscribe: async (_, { sessionID }, ctx) => {
        return ctx.pubsub.asyncIterator(`IDE_EXECUTION_${sessionID}`);
      }
    }
  }
};
```

---

## Phase 3: Frontend IDE Component (Week 2-3)

### 3.1 Create IDE Page

**New File:** `/root/ankr-universe/apps/web/src/pages/IDE.tsx`

```tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { MonacoEditor } from '../components/MonacoEditor';
import { ToolExplorer } from '../components/ToolExplorer';
import { ExecutionViewer } from '../components/ExecutionViewer';
import { CostTracker } from '../components/CostTracker';

export default function IDEPage() {
  const [sessionID, setSessionID] = useState<string | null>(null);

  const { data: session } = useQuery(GET_IDE_SESSION, {
    variables: { id: sessionID },
    skip: !sessionID
  });

  const [createSession] = useMutation(CREATE_IDE_SESSION, {
    onCompleted: (data) => setSessionID(data.ideCreateSession.id)
  });

  const [sendMessage] = useMutation(SEND_IDE_MESSAGE);

  const { data: executionUpdates } = useSubscription(IDE_EXECUTION_STREAM, {
    variables: { sessionID },
    skip: !sessionID
  });

  return (
    <div className="flex h-screen">
      {/* Left sidebar - Tool Explorer */}
      <div className="w-64 border-r">
        <ToolExplorer
          onToolSelect={(tool) => {
            // Insert tool example into editor
          }}
        />
      </div>

      {/* Main editor */}
      <div className="flex-1 flex flex-col">
        <MonacoEditor
          language="typescript"
          onExecute={async (code) => {
            await sendMessage({
              variables: { sessionID, message: code }
            });
          }}
        />

        {/* Bottom panel - Execution output */}
        <div className="h-64 border-t">
          <ExecutionViewer updates={executionUpdates} />
        </div>
      </div>

      {/* Right sidebar - Cost & Stats */}
      <div className="w-80 border-l">
        <CostTracker
          slmCost={session?.costBreakdown.slmCost}
          llmCost={session?.costBreakdown.llmCost}
          savings={session?.costBreakdown.totalSavings}
        />
      </div>
    </div>
  );
}
```

### 3.2 Tool Explorer Component

```tsx
// apps/web/src/components/ToolExplorer.tsx
import { useQuery } from '@apollo/client';
import { Input } from '@ankr-universe/ui';

export function ToolExplorer({ onToolSelect }) {
  const [search, setSearch] = useState('');

  const { data } = useQuery(GET_TOOL_CATALOG, {
    variables: { search }
  });

  return (
    <div className="p-4">
      <Input
        placeholder="Search 755 tools..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="mt-4 space-y-2">
        {data?.ideToolCatalog.map(tool => (
          <div
            key={tool.id}
            className="p-3 border rounded cursor-pointer hover:bg-gray-50"
            onClick={() => onToolSelect(tool)}
          >
            <div className="font-medium">{tool.displayName}</div>
            <div className="text-sm text-gray-500">{tool.category}</div>
            <div className="mt-1 flex gap-2">
              <span className="text-xs bg-blue-100 px-2 py-0.5 rounded">
                ₹{tool.estimatedCost}
              </span>
              <span className="text-xs bg-green-100 px-2 py-0.5 rounded">
                {tool.estimatedLatency}ms
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Phase 4: ANKR-Specific Enhancements (Week 3-4)

### 4.1 Voice-to-Code (BANI Integration)

```typescript
// packages/integrations/opencode-bridge/src/voice.ts
import { BANI } from '@ankr/bani';

export async function voiceToCode(audioBuffer: Buffer): Promise<string> {
  const bani = new BANI();

  // Transcribe Hindi/regional language
  const transcript = await bani.transcribe(audioBuffer, {
    language: 'hi-IN', // Hindi
    model: 'whisper-large-v3'
  });

  // Convert to code intent
  const codeIntent = await bani.generateCode({
    prompt: transcript,
    context: 'ANKR Universe IDE',
    includeTools: true // Suggest ANKR tools
  });

  return codeIntent;
}
```

### 4.2 EON Memory Integration

```typescript
// Hook into OpenCode to remember frequent patterns
export const memoryHook: Hooks['tool.execute.after'] = async (input, output) => {
  const eon = new EON();

  await eon.remember({
    type: 'tool_usage',
    tool: input.tool,
    sessionID: input.sessionID,
    success: !output.error,
    timestamp: new Date()
  });

  // After 5 uses, auto-suggest to user
  const usageCount = await eon.query({
    type: 'tool_usage',
    tool: input.tool,
    sessionID: input.sessionID
  });

  if (usageCount.length === 5) {
    console.log(`💡 Tip: Create a snippet for ${input.tool}`);
  }
};
```

### 4.3 RocketLang DSL Support

```typescript
// Add RocketLang syntax highlighting to Monaco
import { languages } from 'monaco-editor';

languages.register({ id: 'rocketlang' });
languages.setMonarchTokensProvider('rocketlang', {
  keywords: ['workflow', 'step', 'tool', 'when', 'then', 'approve'],
  operators: ['=', '->', '|>', '&&', '||'],
  // ... syntax rules
});

// Compile RocketLang → Execution Plan
async function compileRocketLang(code: string): Promise<ExecutionPlan> {
  const parser = new RocketLangParser();
  const ast = parser.parse(code);

  const planner = new Planner();
  return planner.fromAST(ast);
}
```

---

## Phase 5: Production Deployment (Week 4)

### 5.1 Update Service Manager

```bash
# ankr-universe.sh additions

start_ide() {
  echo "🚀 Starting ANKR Universe IDE..."

  # Start OpenCode server
  opencode serve --port 7777 --hostname 0.0.0.0 &
  echo $! > /tmp/opencode.pid

  echo "✅ IDE ready at http://localhost:3040/ide"
}

stop_ide() {
  if [ -f /tmp/opencode.pid ]; then
    kill $(cat /tmp/opencode.pid)
    rm /tmp/opencode.pid
  fi
}
```

### 5.2 Docker Compose Update

```yaml
# docker-compose.yml
services:
  opencode:
    image: node:20-alpine
    command: npx opencode serve --port 7777
    ports:
      - "7777:7777"
    volumes:
      - ./packages/integrations/opencode-bridge:/plugin
    environment:
      - OPENCODE_PLUGIN=/plugin
```

---

## Benefits Summary

### For Developers
✅ 755 ANKR tools discoverable in IDE
✅ Cost-transparent execution (see ₹ before running)
✅ Multi-language support (code in Hindi/Tamil)
✅ Voice-to-code (hands-free development)
✅ Smart memory (EON remembers patterns)

### For ANKR
✅ Developer onboarding funnel (try → integrate)
✅ Lock-in via tooling ecosystem
✅ Network effects (shared templates/plans)
✅ Premium tier opportunity (advanced features)
✅ Data goldmine (usage analytics)

### Technical
✅ Reuses 100% of existing orchestration layer
✅ Zero new infrastructure (piggybacks on Gateway)
✅ OSS foundation (MIT license, no lock-in)
✅ Modular (can replace OpenCode later)
✅ Production-ready (proven in field)

---

## Cost Estimate

**Development Time:** 4 weeks (1 developer)
**Infrastructure:** $0 (reuses existing)
**Dependencies:** Free (OSS)

**ROI:**
- Conversion funnel: 10% of IDE users → paid customers
- Developer retention: 3x higher vs docs-only
- Community templates: 100+ within 6 months

---

## Next Steps

1. **Week 1:** Spike - Get OpenCode running with 1 ANKR tool
2. **Week 2:** GraphQL integration + basic UI
3. **Week 3:** Voice + Memory + 755 tools
4. **Week 4:** Polish + launch

**First Milestone:** Demo IDE with GST tool execution (₹0.001 cost shown)
