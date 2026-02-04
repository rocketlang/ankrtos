# ankr5 Integration Gaps in Vibecoding Tools

## Executive Summary

**ankr5 is NOT configured or used anywhere in @ankr/vibecoding-tools**

| Check | Result |
|-------|--------|
| ankr5 CLI in PATH | No |
| @ankr/config imported | No |
| Dynamic port lookup | No |
| EON memory integration | No |
| RAG context building | No |
| MCP tool orchestration | No |

---

## Gap Analysis

### 1. Hardcoded Ports

**Location:** `src/tools/scaffold.ts:277-278`

```typescript
// CURRENT (hardcoded)
await fastify.listen({ port: 3000, host: '0.0.0.0' });
console.log('Server running on http://localhost:3000');
```

**Should be:**
```typescript
// Use ankr5 for dynamic port
const port = await getServicePort(projectName) || 3000;
await fastify.listen({ port, host: '0.0.0.0' });
console.log(`Server running on http://localhost:${port}`);
```

---

### 2. No @ankr/config Usage

**Current package.json dependencies:**
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  }
}
```

**Missing:**
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@ankr/config": "workspace:*"
  },
  "peerDependencies": {
    "@ankr/ai-router": ">=2.0.0",
    "@ankr/eon": ">=3.0.0"
  }
}
```

---

### 3. No ankr5 CLI Integration

**ankr5 location:** `/root/ankr-labs-nx/.ankr/cli/bin/ankr5`

**Not in PATH:** The CLI exists but is not globally accessible.

**Missing integration file:** `src/integrations/ankr5.ts`

```typescript
// This file doesn't exist
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const ANKR5_PATH = process.env.ANKR5_PATH || '/root/ankr-labs-nx/.ankr/cli/bin/ankr5';

export async function getServicePort(service: string): Promise<number> {
  try {
    const { stdout } = await execAsync(`${ANKR5_PATH} ports get ${service}`);
    return parseInt(stdout.trim());
  } catch {
    return 3000; // fallback
  }
}

export async function getServiceUrl(service: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`${ANKR5_PATH} ports url ${service}`);
    return stdout.trim();
  } catch {
    return `http://localhost:3000`;
  }
}
```

---

### 4. No RAG Context Building

**Available via ankr5:**
```bash
ankr5 context build "react component patterns"
ankr5 ai ask "what patterns exist in this codebase"
```

**Not used in:**
- `scaffold_project` - doesn't analyze existing patterns
- `generate_component` - doesn't learn from existing components
- `vibe_analyze` - doesn't compare to codebase standards

---

### 5. No EON Memory

**Available via ankr5:**
```bash
ankr5 eon remember '{"type": "generation", "input": {...}, "output": {...}}'
ankr5 eon search "previous react scaffolds"
```

**Benefits if integrated:**
- Learn from successful generations
- Improve future scaffolds based on past feedback
- Remember user preferences per project

---

### 6. No MCP Tool Orchestration

**255+ tools available via:**
```bash
ankr5 mcp list
ankr5 mcp call gst_validate '{"gstNumber": "..."}'
```

**Could be used for:**
- Domain-specific scaffolds (logistics, compliance, CRM)
- Validating generated code
- Enriching templates with real data

---

## Files Requiring Updates

| File | Change Required |
|------|----------------|
| `package.json` | Add @ankr/config, peer deps |
| `src/tools/scaffold.ts` | Dynamic ports, context awareness |
| `src/tools/code-generate.ts` | RAG-based pattern learning |
| `src/tools/vibe-analyze.ts` | Compare to codebase patterns |
| `src/integrations/ankr5.ts` | NEW - ankr5 CLI wrapper |
| `src/integrations/config.ts` | NEW - @ankr/config wrapper |
| `src/integrations/eon.ts` | NEW - Memory integration |
| `src/integrations/rag.ts` | NEW - Context building |

---

## Recommended Fix Order

### Quick Fix (5 minutes)
Add ankr5 to PATH:
```bash
# Add to ~/.bashrc or ~/.profile
export PATH="$PATH:/root/ankr-labs-nx/.ankr/cli/bin"

# Or create symlink
ln -s /root/ankr-labs-nx/.ankr/cli/bin/ankr5 /usr/local/bin/ankr5
```

### Phase 1 Fix (1 day)
Create `src/integrations/ankr5.ts` with:
- Port lookup
- URL generation
- Graceful fallback

### Phase 2 Fix (1 week)
Full integration as per ENTERPRISE-UPGRADE-PLAN.md

---

## Verification Commands

After fixes, verify with:

```bash
# Check ankr5 is accessible
which ankr5
ankr5 --version

# Check port resolution works
ankr5 ports get freightbox  # Should return: 4003

# Check vibecoding uses dynamic ports
# Generate a project and verify it doesn't hardcode 3000
```

---

## Code Diff Preview

### scaffold.ts (before)
```typescript
fastify.listen({ port: 3000, host: '0.0.0.0' })
```

### scaffold.ts (after)
```typescript
import { getServicePort } from '../integrations/ankr5.js';

// In scaffoldProject function:
const port = await getServicePort(name) || 3000;
// ...
`await fastify.listen({ port: ${port}, host: '0.0.0.0' })`
```

---

## Impact Assessment

| Area | Current | With Integration |
|------|---------|-----------------|
| Port conflicts | High risk | Eliminated |
| Pattern learning | None | RAG-based |
| Generation quality | Static | Improving over time |
| ANKR ecosystem fit | Isolated | Fully integrated |

---

*Document created: 2026-01-17*
*Related: ENTERPRISE-UPGRADE-PLAN.md*
