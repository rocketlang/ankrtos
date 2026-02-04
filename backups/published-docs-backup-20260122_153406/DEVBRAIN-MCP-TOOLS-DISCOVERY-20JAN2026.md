# DevBrain MCP Tools Discovery & Indexing

> **Date:** 20 January 2026
> **Status:** ✅ Complete
> **Author:** Claude Opus 4.5

---

## Executive Summary

DevBrain code intelligence catalog expanded from **403** to **755** components by indexing **341 MCP tools** and **11 skill files** from the ANKR ecosystem.

---

## Before & After

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total Components | 403 | 755 | +352 |
| Packages | 301 | 301 | - |
| Libraries | 40 | 40 | - |
| Apps | 62 | 62 | - |
| MCP Tools | 0 | 341 | +341 |
| Skills | 0 | 11 | +11 |
| With Embeddings | 128 | 128 | - |

---

## MCP Tools Indexed

### Source Packages Scanned

| Package | Location | Tools Found |
|---------|----------|-------------|
| @ankr/mcp-tools | `/packages/mcp-tools/src/tools` | 23 |
| @ankr/eon | `/packages/ankr-eon/src/mcp` | 18 |
| @ankr/mcp | `/packages/ankr-mcp/src` | 372 |
| @ankr/knowledge-base | `/packages/ankr-knowledge-base/src/mcp` | 6 |
| @ankr/indexer | `/packages/ankr-indexer/src/mcp` | 5 |
| @ankr/slm-router | `/packages/ankr-slm-router/src/mcp` | 3 |
| **Total** | | **427** (341 unique) |

### Tool Categories

#### GST & Compliance (India)
| Tool Name | Description |
|-----------|-------------|
| `ankr_validate_gstin` | Validate Indian GST Identification Number |
| `ankr_calculate_gst` | Calculate GST breakdown (CGST, SGST, IGST) |
| `ankr_gst_return_due_date` | Get GST return due dates |
| `ankr_search_hsn` | Search HSN codes for products |
| `ankr_search_sac` | Search SAC codes for services |
| `ankr_get_gst_rate` | Get GST rate for HSN/SAC code |

#### Transport Management (TMS)
| Tool Name | Description |
|-----------|-------------|
| `ankr_calculate_freight` | Calculate freight charges |
| `ankr_validate_vehicle` | Validate vehicle registration |
| `ankr_generate_order_number` | Generate order numbers |
| `ankr_check_order_transition` | Validate order state transitions |
| `ankr_estimate_transit_time` | Estimate delivery time |

#### Infrastructure & Ports
| Tool Name | Description |
|-----------|-------------|
| `ankr_get_port` | Get service port by name |
| `ankr_get_url` | Get service URL |
| `ankr_list_services` | List all available services |
| `ankr_graphql_endpoint` | Get GraphQL endpoint URL |

#### EON Memory & Context
| Tool Name | Description |
|-----------|-------------|
| `eon_context_query` | Query unified context system |
| `eon_search_knowledge` | Search knowledge base |
| `eon_add_knowledge` | Add knowledge to system |
| `eon_add_fact` | Add fact to session memory |
| `eon_get_session` | Get current session context |
| `eon_create_snapshot` | Create context snapshot |
| `eon_remember` | Store episode in long-term memory |
| `eon_recall` | Search memories semantically |
| `eon_embed` | Generate embedding vector |
| `eon_log_event` | Append event to store |
| `eon_get_timeline` | Get entity event timeline |

#### Logistics RAG
| Tool Name | Description |
|-----------|-------------|
| `logistics_search` | Hybrid search (vector + full-text) |
| `logistics_retrieve` | Get LLM-ready context |
| `logistics_ingest` | Ingest new document |
| `logistics_stats` | Get knowledge base stats |
| `logistics_delete` | Delete document |
| `logistics_compliance` | Search compliance info |
| `logistics_route` | Search route information |

#### Package Discovery
| Tool Name | Description |
|-----------|-------------|
| `ankr_package_search` | Search @ankr packages |
| `ankr_package_info` | Get package details |
| `ankr_package_list` | List all packages |
| `ankr_package_recommend` | Recommend packages for use case |

#### Extended Tool Sets (ankr-mcp)

| Category | Tools | Examples |
|----------|-------|----------|
| BANI Bridge | 62 | Voice commands, Hindi NLP |
| Banking & Government | 50 | UPI, NEFT, Aadhaar, DigiLocker |
| ERP & CRM | 74 | Invoices, Inventory, Leads |
| General Expanded | 54 | Various utilities |
| Knowledge Base | 64 | Indexing, search, analytics |
| SLM Router | 13 | Model routing, health checks |
| RALPH Tools | 25 | Package management |
| Package Doctor | 8 | Dependency analysis |

---

## Skills Indexed

Skills are markdown files that provide rich documentation for AI agents to learn API usage patterns.

### India Category
| Skill | File | Purpose |
|-------|------|---------|
| GST | `india/gst.md` | GSTIN verification, GST calculation, E-way bills, E-invoices |
| UPI | `india/upi.md` | UPI payments via Razorpay/PayU |
| ULIP | `india/ulip.md` | Vehicle tracking, E-way bills, Fastag |
| Aadhaar | `india/aadhaar.md` | Aadhaar verification |
| DigiLocker | `india/digilocker.md` | Document verification |

### Logistics Category
| Skill | File | Purpose |
|-------|------|---------|
| Tracking | `logistics/tracking.md` | Multi-carrier shipment tracking |
| Compliance | `logistics/compliance.md` | HOS, DOT, FMCSA, Hazmat rules |
| RAG | `logistics/rag.md` | LogisticsRAG knowledge base |

### Messaging Category
| Skill | File | Purpose |
|-------|------|---------|
| Telegram | `messaging/telegram.md` | Telegram Bot API |
| WhatsApp | `messaging/whatsapp.md` | WhatsApp Business API |

### Global Category
| Skill | File | Purpose |
|-------|------|---------|
| HTTP | `global/http.md` | Generic HTTP requests |

---

## Layer Distribution

```
╔══════════════════════════════════════════════════╗
║  DevBrain Components by Layer                     ║
╠══════════════════════════════════════════════════╣
║  general    ████████████████████████████  391    ║
║  domain     ██████████████               121    ║
║  ai         ██████                        54    ║
║  infra      ██████                        53    ║
║  ui         ████                          33    ║
║  memory     ███                           24    ║
║  devbrain   ██                            14    ║
║  voice      ██                            13    ║
║  gps        █                             10    ║
║  messaging  █                             10    ║
║  education  █                             10    ║
║  docs       █                              7    ║
║  security   █                              6    ║
║  healthcare █                              5    ║
║  business   █                              4    ║
╚══════════════════════════════════════════════════╝
```

---

## Scripts Created

### index-mcp-tools.js

**Location:** `/root/ankr-labs-nx/packages/ankr-devbrain/index-mcp-tools.js`

**Purpose:** Scans TypeScript files for MCP tool definitions and markdown skill files, indexes them into DevBrain catalog.

**Features:**
- Extracts tool name, description from TypeScript AST patterns
- Parses skill markdown files for titles and descriptions
- Classifies tools into layers based on name prefixes
- Upserts to PostgreSQL `devbrain.catalog` table

**Usage:**
```bash
cd /root/ankr-labs-nx/packages/ankr-devbrain
node index-mcp-tools.js
```

### Previously Created
| Script | Purpose |
|--------|---------|
| `expand-catalog.js` | Index packages from source directories |
| `index-verdaccio.js` | Index packages from Verdaccio registry |

---

## API Endpoints

DevBrain API runs on **port 4030**.

### Search Tools
```bash
# Keyword search
curl "http://localhost:4030/api/search?q=gst"

# Filter by component type
curl "http://localhost:4030/api/search?q=logistics&type=mcp_tool"

# Semantic search (requires embeddings)
curl "http://localhost:4030/api/semantic?q=calculate%20tax"
```

### Stats & Layers
```bash
# Get catalog stats
curl http://localhost:4030/api/stats

# Get layer breakdown
curl http://localhost:4030/api/layers
```

### Example Response
```json
{
  "query": "gst",
  "type": "keyword",
  "count": 10,
  "results": [
    {
      "name": "ankr_calculate_gst",
      "display_name": "calculate gst",
      "version": "1.0.0",
      "layer": "infra",
      "component_type": "mcp_tool",
      "keywords": ["ankr", "calculate", "gst"],
      "capabilities": ["mcp", "tool"]
    }
  ]
}
```

---

## Database Schema

Tools are stored in `devbrain.catalog` table:

```sql
CREATE TABLE devbrain.catalog (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(500),
    version VARCHAR(50),
    description TEXT,
    layer VARCHAR(50),
    component_type VARCHAR(50),  -- 'mcp_tool', 'eon_tool', 'skill', 'package', 'app'
    location TEXT,
    keywords TEXT[],
    capabilities TEXT[],
    embedding VECTOR(1536),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Next Steps

| Priority | Task | Status |
|----------|------|--------|
| P1 | Generate Nomic embeddings for 627 new components | Pending |
| P1 | Create DevBrain search UI component | Pending |
| P1 | Integrate DevBrain with VibeCoder | Pending |
| P2 | Add code generation via DevBrain.execute() | Pending |
| P2 | Implement multi-LLM competition | Pending |

---

## Related Documents

- [ANKR-INFRASTRUCTURE.md](https://ankr.in/project/documents/?file=ANKR-INFRASTRUCTURE.md) - Service ports & aliases
- [ANKR-UNIVERSE-TODO.md](https://ankr.in/project/documents/?file=ANKR-UNIVERSE-TODO.md) - Master task list
- [DevBrain README](/root/ankr-labs-nx/docs/devbrain/README.md) - Full documentation

---

## Verification Commands

```bash
# Check DevBrain status
curl http://localhost:4030/api/stats

# Search for MCP tools
curl "http://localhost:4030/api/search?q=ankr_&type=mcp_tool"

# List all EON tools
curl "http://localhost:4030/api/search?q=eon_&type=eon_tool"

# View layers
curl http://localhost:4030/api/layers
```

---

*Generated by Claude Opus 4.5 on 20 January 2026*
