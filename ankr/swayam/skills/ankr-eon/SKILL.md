---
name: ankr-eon
description: EON Memory knowledge graph operations. Use for storing, retrieving, and relating information across conversations. Triggers on "remember", "recall", "store", "knowledge graph", "memory".
metadata:
  author: ankr
  version: "1.0.0"
---

# EON Memory

Persistent knowledge graph for storing and retrieving information across conversations and sessions.

## Service Info

- **Port**: 4005
- **URL**: http://localhost:4005
- **Database**: ankr_eon (PostgreSQL)

## Core Operations

### Remember (Store)
```bash
bash /mnt/skills/user/ankr-eon/scripts/remember.sh "<content>" [--tags "tag1,tag2"] [--entity "EntityName"]
```

### Recall (Retrieve)
```bash
bash /mnt/skills/user/ankr-eon/scripts/recall.sh "<query>" [--limit 10] [--tags "tag1"]
```

### Relate (Link Entities)
```bash
bash /mnt/skills/user/ankr-eon/scripts/relate.sh "<entity1>" "<relationship>" "<entity2>"
```

### Search
```bash
bash /mnt/skills/user/ankr-eon/scripts/search.sh "<query>" [--semantic] [--exact]
```

### Forget
```bash
bash /mnt/skills/user/ankr-eon/scripts/forget.sh "<memory-id>"
```

## MCP Tools

Prefer MCP tools when available:

```typescript
// Store memory
await mcp__eon__remember({
  content: "User prefers dark mode",
  tags: ["preferences", "ui"],
  entity: "UserSettings"
});

// Recall memory
await mcp__eon__recall({
  query: "user preferences",
  limit: 5
});

// Create relationship
await mcp__eon__relate({
  from: "User",
  relationship: "PREFERS",
  to: "DarkMode"
});
```

## Data Model

```
Entity {
  id: string
  name: string
  type: string
  properties: Record<string, any>
}

Memory {
  id: string
  content: string
  embedding: vector
  tags: string[]
  entities: Entity[]
  created_at: timestamp
}

Relationship {
  from: Entity
  type: string
  to: Entity
  properties: Record<string, any>
}
```

## Use Cases

| Scenario | Operation |
|----------|-----------|
| Store user preference | `remember` with entity |
| Find past decisions | `recall` with semantic search |
| Link related concepts | `relate` entities |
| Remove outdated info | `forget` by ID |
| Build knowledge graph | Combine operations |

## Best Practices

1. **Tag consistently** - Use standard tag taxonomy
2. **Create entities** - Structure important concepts as entities
3. **Build relationships** - Connect related information
4. **Semantic search** - Use for fuzzy matching
5. **Prune regularly** - Remove outdated memories
