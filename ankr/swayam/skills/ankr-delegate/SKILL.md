---
name: ankr-delegate
description: Delegate tasks to GPT experts via Codex MCP. Use for architecture decisions, code review, security analysis, plan validation. Triggers on "ask GPT", "review", "analyze", "architecture", "security".
metadata:
  author: ankr
  version: "1.0.0"
---

# GPT Expert Delegation

Delegate complex tasks to specialized GPT experts via Codex MCP.

## Available Experts

| Expert | Specialty | Trigger Signals |
|--------|-----------|-----------------|
| **Architect** | System design, tradeoffs | "how should I structure", "tradeoffs", 2+ failed fixes |
| **Plan Reviewer** | Plan validation | "review this plan", "validate approach" |
| **Scope Analyst** | Requirements analysis | "what am I missing", vague requirements |
| **Code Reviewer** | Code quality, bugs | "review this code", "find issues" |
| **Security Analyst** | Vulnerabilities | "is this secure", "security review" |
| **Judge** | Meta-review synthesis | After multiple expert reviews |

## Usage

### Automatic Delegation
The system proactively delegates when trigger signals match. No manual intervention needed.

### Explicit Delegation
```bash
# Delegate to specific expert
bash /mnt/skills/user/ankr-delegate/scripts/delegate.sh architect \
  "Analyze tradeoffs between Redis and in-memory caching for session storage"

# Delegate with code context
bash /mnt/skills/user/ankr-delegate/scripts/delegate.sh code-reviewer \
  --files "src/auth.ts,src/session.ts" \
  "Review authentication flow for security issues"
```

## Delegation Format (7 Sections)

Every delegation MUST include:

```markdown
1. TASK: [One sentence - atomic, specific goal]

2. EXPECTED OUTCOME: [What success looks like]

3. CONTEXT:
   - Current state: [what exists now]
   - Relevant code: [paths or snippets]
   - Background: [why this is needed]

4. CONSTRAINTS:
   - Technical: [versions, dependencies]
   - Patterns: [existing conventions]
   - Limitations: [what cannot change]

5. MUST DO:
   - [Requirement 1]
   - [Requirement 2]

6. MUST NOT DO:
   - [Forbidden action 1]
   - [Forbidden action 2]

7. OUTPUT FORMAT:
   - [How to structure response]
```

## Operating Modes

| Mode | Sandbox | Use When |
|------|---------|----------|
| **Advisory** | `read-only` | Analysis, recommendations |
| **Implementation** | `workspace-write` | Making changes, fixing |

## MCP Integration

```typescript
// Delegate to expert
await mcp__codex__codex({
  prompt: "[7-section delegation prompt]",
  "developer-instructions": "[expert system prompt]",
  sandbox: "read-only", // or "workspace-write"
  cwd: "/path/to/project"
});
```

## Expert Selection Guide

| Situation | Expert |
|-----------|--------|
| Database schema design | Architect |
| API architecture | Architect |
| After 2+ failed fixes | Architect |
| Before starting work | Plan Reviewer |
| Vague requirements | Scope Analyst |
| Pre-merge review | Code Reviewer |
| Auth/security changes | Security Analyst |
| Multiple expert reviews | Judge |

## Best Practices

1. **Include full context** - Each call is stateless
2. **Be specific** - Vague prompts get vague results
3. **Verify implementation** - Check expert's work
4. **Synthesize results** - Don't show raw output
5. **Reserve for high-value tasks** - Don't spam experts
