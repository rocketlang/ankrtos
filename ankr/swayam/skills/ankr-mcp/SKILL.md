---
name: ankr-mcp
description: Access 260+ MCP tools for ANKR operations. Use when needing to perform operations that might have an MCP tool available - memory operations, validation, tracking, database queries, AI proxy calls.
metadata:
  author: ankr
  version: "1.0.0"
---

# ANKR MCP Tools

Access the ANKR MCP ecosystem with 260+ specialized tools. Before implementing functionality manually, check if an MCP tool exists.

## Tool Categories

### Memory Operations (EON)
| Tool | Purpose |
|------|---------|
| `eon_remember` | Store information in knowledge graph |
| `eon_recall` | Retrieve stored information |
| `eon_forget` | Remove information |
| `eon_search` | Search across memories |
| `eon_relate` | Create relationships between entities |

### Validation
| Tool | Purpose |
|------|---------|
| `gst_validate` | Validate GST numbers |
| `pan_validate` | Validate PAN numbers |
| `ifsc_validate` | Validate IFSC codes |
| `iec_validate` | Validate IEC codes |

### Shipment Operations
| Tool | Purpose |
|------|---------|
| `shipment_track` | Track shipment status |
| `shipment_create` | Create new shipment |
| `shipment_update` | Update shipment details |
| `container_track` | Track container |

### Port Operations
| Tool | Purpose |
|------|---------|
| `ankr_get_port` | Get service port |
| `ankr_get_url` | Get service URL |
| `ankr_health_check` | Check service health |

### Database
| Tool | Purpose |
|------|---------|
| `db_query` | Execute read query |
| `db_execute` | Execute write query |
| `db_transaction` | Execute in transaction |

### AI Proxy
| Tool | Purpose |
|------|---------|
| `ai_complete` | Get LLM completion |
| `ai_embed` | Generate embeddings |
| `ai_analyze` | Analyze content |

## Usage Pattern

```typescript
// Always check for MCP tool first
const result = await mcp__ankr__tool_name({
  param1: "value1",
  param2: "value2"
});
```

## Discovery

```bash
# List available tools
bash /mnt/skills/user/ankr-mcp/scripts/list-tools.sh

# Search for tools
bash /mnt/skills/user/ankr-mcp/scripts/search-tools.sh "shipment"

# Get tool schema
bash /mnt/skills/user/ankr-mcp/scripts/tool-schema.sh eon_remember
```

## Best Practices

1. **Check before implementing** - Search for existing MCP tools before writing code
2. **Use appropriate tool** - Match operation to specialized tool
3. **Handle errors** - MCP tools return structured errors
4. **Batch when possible** - Some tools support batch operations
