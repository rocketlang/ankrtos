# AGFLOW + ankr-universe: User Interaction Guide

## 🎯 Entry Points & User Journey

### **1. Primary Entry Point: ankr5 CLI**

```bash
# User asks a natural language question
$ ankr5 ai ask "I need warehouse management with RFID"

# Behind the scenes:
# 1. Query → AGFLOW router
# 2. AGFLOW → Discovery index (860 packages)
# 3. Semantic search → Find best match
# 4. Return → Package info + installation + examples
```

**Response:**
```
✅ Found: @ankr-universe/dodd-wms
📦 DODD WMS - Warehouse Management with IoT, RFID, Drones

Installation:
  npm install @ankr-universe/dodd-wms

Usage:
  import { WarehouseManager } from '@ankr-universe/dodd-wms';

  const wms = new WarehouseManager({
    rfidEnabled: true,
    droneIntegration: true
  });

Capabilities:
  • RFID-based inventory tracking
  • Drone-assisted warehouse operations
  • Real-time IoT sensor integration
  • Mobile app for warehouse staff
```

---

### **2. Web UI Entry Points**

#### **A. ANKR Omega (AI Builder)**
- **URL:** `http://localhost:3000/omega`
- **Flow:**
  1. User describes what they need in natural language
  2. AI suggests relevant packages from ankr-universe
  3. Drag-drop widgets onto canvas
  4. Auto-generates integration code

#### **B. ANKR Tutor (Learning Mode)**
- **URL:** `http://localhost:3000/tutor`
- **Flow:**
  1. Interactive guide to @ankr/* packages
  2. Search by capability
  3. Step-by-step tutorials
  4. Playground with live examples

#### **C. Package Explorer**
- **URL:** `http://localhost:3000/packages`
- **Flow:**
  1. Browse 860 packages by category
  2. Filter by scope (@ankr, @ankr-universe, etc.)
  3. View dependencies, documentation
  4. One-click installation

---

### **3. Developer Entry Points**

#### **A. GraphQL API**

```graphql
query FindPackage {
  searchPackages(
    query: "warehouse RFID inventory"
    scope: "@ankr-universe"
    limit: 5
  ) {
    name
    description
    installCommand
    documentation
    examples {
      title
      code
    }
  }
}
```

#### **B. VS Code Extension**

```typescript
// IntelliSense suggests packages as you type
import { Warehouse } from '@ankr-universe/dodd-wms';
//                        ↑
//                   Auto-discovered via AGFLOW
```

#### **C. Programmatic API**

```typescript
import { AGFLOW } from '@ankr/discovery';

const results = await AGFLOW.search({
  query: 'warehouse management RFID',
  scope: '@ankr-universe',
  category: 'erp'
});

console.log(results[0].name); // @ankr-universe/dodd-wms
```

---

### **4. Complete Task Flow Example**

**User Goal:** "Set up warehouse management with RFID tracking"

#### **Step 1: Discovery**
```bash
$ ankr5 ai ask "warehouse management RFID"
```

**AGFLOW Response:**
- ✅ @ankr-universe/dodd-wms (Primary)
- 🔗 @ankr-universe/dodd-inventory (Related)
- 🔗 @ankr/iot-devices (Dependency)

#### **Step 2: Installation**
```bash
$ npm install @ankr-universe/dodd-wms
```

#### **Step 3: Configuration**
```typescript
import { WarehouseManager, RFIDReader } from '@ankr-universe/dodd-wms';
import { IoTHub } from '@ankr/iot-devices';

// AGFLOW suggests this configuration based on your query
const wms = new WarehouseManager({
  rfid: new RFIDReader({
    type: 'UHF',
    range: 10 // meters
  }),
  iot: new IoTHub({
    protocol: 'MQTT',
    broker: process.env.IOT_BROKER_URL
  })
});

await wms.initialize();
```

#### **Step 4: Task Completion**
```typescript
// Scan incoming inventory
const items = await wms.scanInbound({
  zone: 'RECEIVING-A',
  expectedPO: 'PO-12345'
});

console.log(`Scanned ${items.length} items via RFID`);
// AGFLOW tracks: Task completed ✅
```

---

### **5. AGFLOW Routing Logic**

```
User Query
    ↓
[AGFLOW Router]
    ├─→ Parse intent
    ├─→ Extract entities (warehouse, RFID, inventory)
    ├─→ Search discovery index (860 packages)
    ├─→ Rank by relevance:
    │   • Keyword match (warehouse, RFID)
    │   • Category match (ERP, WMS)
    │   • Domain match (logistics, inventory)
    │   • Usage patterns (most-used for this query)
    ↓
[Top 3 Matches]
    1. @ankr-universe/dodd-wms (95% match)
    2. @ankr-universe/dodd-inventory (80% match)
    3. @ankr/iot-devices (65% match - dependency)
    ↓
[Return to User]
    • Installation command
    • Usage examples
    • Related packages
    • Documentation links
```

---

### **6. Integration Points**

| System | Integration | Purpose |
|--------|-------------|---------|
| **ANKR EON** | Memory system | Learns user preferences over time |
| **ANKR Pulse** | Monitoring | Tracks package usage & health |
| **ANKR Wire** | Auto-wiring | Auto-connects dependencies |
| **Verdaccio** | Package registry | Serves @ankr/* packages |
| **PostgreSQL** | Vector search | Semantic search via pgvector |

---

### **7. Example User Scenarios**

#### **Scenario A: Accounting User**
```
User: "How do I generate GST-compliant invoices?"
AGFLOW: → @ankr-universe/dodd-account
Result: Invoice generation with GST validation
```

#### **Scenario B: Marketing User**
```
User: "Set up email campaign automation"
AGFLOW: → @ankr-universe/dodd-marketing
Result: Campaign builder with automation sequences
```

#### **Scenario C: Developer**
```
User: "Need MCP tool validation"
AGFLOW: → @ankr-universe/tool-registry
Result: 755 validated MCP tools with security checks
```

#### **Scenario D: QA Engineer**
```
User: "Quality control inspection workflow"
AGFLOW: → @ankr-universe/dodd-quality
Result: QC points, checklists, alerts
```

---

### **8. Testing AGFLOW**

```bash
# Run comprehensive tests
cd /root/ankr-labs-nx/packages/ankr-discovery
node test-agflow.js

# Expected output:
# ✅ 860 packages indexed
# ✅ 393 ankr-universe packages
# ✅ 16 categories
# ✅ Semantic search operational
```

---

### **9. Current Status**

| Component | Status | Notes |
|-----------|--------|-------|
| Discovery Index | ✅ Live | 860 packages, 1.8MB |
| AGFLOW Router | ✅ Active | Keyword + category search |
| ankr-universe | ✅ Indexed | 393 packages discovered |
| Semantic Search | 🚧 Pending | Needs embeddings integration |
| VS Code Extension | 📋 Planned | IntelliSense integration |
| GraphQL API | 📋 Planned | Query endpoint |

---

### **10. Next Steps**

1. **Enhance Search** - Add pgvector embeddings for semantic search
2. **Build UI** - Create package explorer interface
3. **Add Examples** - Include code samples in discovery index
4. **Track Usage** - Log which packages are requested most
5. **Auto-Wire** - Automatically resolve dependencies

---

## 🎯 Bottom Line

**AGFLOW** makes ankr-universe's 393 packages **discoverable and usable** through:
- Natural language queries
- Intelligent routing
- Auto-completion
- Usage examples
- Dependency resolution

Users can find and use any package without knowing it exists beforehand!
