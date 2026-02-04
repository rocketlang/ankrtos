# Vessel-Port Agent Document Workflow System

**Date**: February 3, 2026
**Purpose**: Automate document filling, filing, and agent coordination for port calls
**Integration**: Vessel Portal, Port Agency Portal, DA Desk

---

## 🎯 The Problem

### Current Manual Process (Time-Consuming!)

```
Master receives voyage orders (24-48 hours before port)
        ↓
Manually fills out 15-20 documents:
├─ Port entry notification
├─ Crew list (FAL 5)
├─ Passenger list (FAL 6)
├─ Cargo declaration (FAL 2)
├─ Ship's stores declaration (FAL 3)
├─ Crew effects declaration (FAL 4)
├─ Dangerous goods manifest
├─ ISPS pre-arrival security
├─ Ballast water reporting
├─ Waste disposal notification
├─ Port health declaration
├─ Immigration documents
├─ Customs declaration
└─ ... many more!

        ↓
Sends via email to port agent (manually)
        ↓
Agent reviews, requests corrections
        ↓
Master corrects, re-sends
        ↓
Agent files with authorities
        ↓
TOTAL TIME: 4-6 hours per port call! 😫
```

---

## ✨ Mari8X Automated Solution

### Smart Document Pre-Fill System

```
48 hours before port arrival:
        ↓
Mari8X automatically:
├─ Detects upcoming port call (from voyage data)
├─ Identifies required documents (per port/country)
├─ Pre-fills ALL documents with:
│   ├─ Vessel details (from vessel master data)
│   ├─ Crew list (from crew management system)
│   ├─ Cargo details (from charter party/B/L)
│   ├─ Last port, next port (from voyage)
│   ├─ ETA/ETD (from routing engine)
│   └─ All standard information
├─ Sends to Master for REVIEW (not fill!)
└─ One-click submit to port agent

Master just VERIFIES and SUBMITS
        ↓
Time reduced: 4-6 hours → 15-20 minutes! ⚡
```

---

## 📋 Document Categories

### 1. **Pre-Arrival Documents** (Must send 24-48h before arrival)

#### IMO FAL Convention Forms (Mandatory)
- **FAL 1** - General Declaration
- **FAL 2** - Cargo Declaration
- **FAL 3** - Ship's Stores Declaration
- **FAL 4** - Crew Effects Declaration
- **FAL 5** - Crew List
- **FAL 6** - Passenger List
- **FAL 7** - Dangerous Goods Manifest

#### Security & Compliance
- ISPS Pre-Arrival Security Declaration
- Port Health Declaration (Maritime Declaration of Health)
- Ballast Water Reporting Form
- Waste Disposal Notification

#### Customs & Immigration
- Customs Entry Declaration
- Immigration Crew List (supplemental)
- Import/Export Manifest
- Bonded Stores List

#### Environmental
- MARPOL Compliance Certificate
- Garbage Management Plan
- Oily Water Separator Log
- Sewage Discharge Records

---

### 2. **Arrival Documents** (On arrival at berth)

- Notice of Readiness (NOR)
- Statement of Facts (SOF) - Start
- Time Sheet
- Berthing Instructions Acknowledgment
- Cargo Loading/Discharge Plan Approval

---

### 3. **Departure Documents** (Before sailing)

- Port Clearance Request
- Statement of Facts (SOF) - Complete
- Final Cargo Manifest
- Crew Changes Documentation
- Bunker Delivery Notes
- Port Disbursement Account Summary

---

## 🤖 Auto-Fill Intelligence

### Data Sources for Pre-Fill

```typescript
interface DocumentAutoFill {
  // From Vessel Master Data
  vesselInfo: {
    name: string;
    imo: string;
    callSign: string;
    flag: string;
    grt: number;
    nrt: number;
    dwt: number;
    loa: number;
    beam: number;
    draft: number;
    owner: string;
    operator: string;
  };

  // From Crew Management
  crewList: {
    master: CrewMember;
    officers: CrewMember[];
    ratings: CrewMember[];
    totalCrew: number;
  };

  // From Voyage Data
  voyageInfo: {
    voyageNumber: string;
    lastPort: Port;
    currentPort: Port;
    nextPort: Port;
    etd: Date;
    eta: Date;
    purpose: string; // loading, discharge, bunkering, etc.
  };

  // From Cargo Data
  cargoInfo: {
    description: string;
    quantity: number;
    packingType: string;
    hsCode: string;
    shipper: string;
    consignee: string;
    dangerousGoods: boolean;
    imdgClass?: string;
  };

  // From Certificates
  certificates: {
    classification: Certificate;
    safety: Certificate;
    registry: Certificate;
    insurance: Certificate;
    p&i: Certificate;
    // ... all statutory certificates
  };

  // From Port Intelligence
  portRequirements: {
    requiredDocuments: string[];
    localRegulations: string[];
    agentContact: AgentInfo;
    customsProcedures: string[];
  };
}
```

---

## 🔄 Complete Workflow

### Phase 1: Document Generation (Auto)

**Trigger**: 48 hours before ETA

```
Mari8X System:
1. Detects upcoming port call (Singapore)
2. Queries port requirements database
   ➜ Singapore requires: FAL 1-7, ISPS, Health Declaration, Customs Entry
3. Retrieves vessel/crew/cargo data from database
4. Generates pre-filled PDFs for all required documents
5. Creates document package
6. Notifies Master: "Port docs ready for review"
```

**Master receives notification:**
```
📬 Port Documents Ready - Singapore Arrival
ETA: Feb 10, 2026 14:30 UTC

Documents generated (12):
✅ FAL 1 - General Declaration (pre-filled)
✅ FAL 2 - Cargo Declaration (pre-filled)
✅ FAL 5 - Crew List (pre-filled)
✅ ISPS Security Declaration (pre-filled)
... 8 more documents

Action Required:
[Review & Submit to Agent] [Request Changes]

Estimated review time: 15 minutes
```

---

### Phase 2: Master Review (15-20 minutes)

**Master opens document package:**

```
┌─────────────────────────────────────────────────────────────┐
│ FAL 1 - General Declaration                                 │
├─────────────────────────────────────────────────────────────┤
│ Vessel Name: MV Ocean Star        ✅ Correct                │
│ IMO Number: 9876543              ✅ Correct                │
│ Port of Registry: Liberia        ✅ Correct                │
│ Last Port: Mumbai                ✅ Correct                │
│ Next Port: Singapore             ✅ Correct                │
│ ETA: 2026-02-10 14:30           ⚠️  Update: 15:00          │
│ Cargo: Container cargo           ✅ Correct                │
│ ...                                                          │
│                                                              │
│ [✓ Approve] [✎ Edit ETA] [✎ Add Remarks]                  │
└─────────────────────────────────────────────────────────────┘
```

**Master actions:**
1. Reviews pre-filled data (most is correct!)
2. Makes minor adjustments (ETA changed from 14:30 to 15:00)
3. Adds any special remarks
4. Approves document
5. Repeats for remaining 11 documents (quick review)

**Total time: 15-20 minutes** (vs 4-6 hours manually!)

---

### Phase 3: Agent Submission (Auto)

**Master clicks "Submit to Port Agent":**

```
Mari8X System:
1. Packages all approved documents
2. Compresses files (for satellite bandwidth)
3. Identifies port agent from database:
   ➜ ABC Shipping Agencies, Singapore
   ➜ Email: ops@abcagencies.com.sg
   ➜ Contact: Mr. Lee (+65-1234-5678)
4. Sends email with documents:
   Subject: "MV Ocean Star - Pre-Arrival Documents - ETA Feb 10"
   Body: Professional template with all details
   Attachments: 12 documents (compressed)
5. Creates task in DA Desk:
   ➜ "Port Agency Fee - Singapore - ABC Agencies"
   ➜ Estimated cost from port intelligence
6. Logs submission in activity feed
7. Notifies Master: "Documents sent to agent"
```

**Agent receives:**
```
From: noreply@mari8x.com
To: ops@abcagencies.com.sg
Subject: MV Ocean Star - Pre-Arrival Documents - ETA Feb 10, 15:00 UTC

Dear ABC Shipping Agencies,

Please find attached pre-arrival documentation for:

Vessel: MV Ocean Star (IMO: 9876543)
ETA Singapore: February 10, 2026, 15:00 UTC
Purpose: Container discharge
Master: Captain John Smith (+1-555-0123)

Documents attached (12):
- FAL 1-7 (IMO FAL Convention)
- ISPS Pre-Arrival Security Declaration
- Port Health Declaration
- Customs Entry Declaration
- Dangerous Goods Manifest
- Ballast Water Report

Please confirm receipt and advise if any additional information required.

Regards,
MV Ocean Star via Mari8X Platform
```

---

### Phase 4: Agent Processing

**Agent Portal View:**

```
┌─────────────────────────────────────────────────────────────┐
│ New Submission - MV Ocean Star                               │
├─────────────────────────────────────────────────────────────┤
│ Received: Feb 8, 2026 10:30                                 │
│ ETA: Feb 10, 2026 15:00                                     │
│ Status: ⏳ Under Review                                     │
│                                                              │
│ Documents (12):                                              │
│ ✅ FAL 1 - Verified                                         │
│ ✅ FAL 2 - Verified                                         │
│ ⚠️  FAL 5 - Issue: Crew member passport expires before arrival│
│ ✅ ISPS - Verified                                          │
│ ...                                                          │
│                                                              │
│ [Request Clarification] [Approve All] [File with Authorities]│
└─────────────────────────────────────────────────────────────┘
```

**If issues found:**
Agent clicks "Request Clarification" → Master gets notification:
```
⚠️ Document Revision Needed - Singapore

Agent feedback:
"FAL 5 Crew List: AB John Doe passport expires Feb 9,
before vessel arrival Feb 10. Please confirm extension
or provide replacement crew details."

[View Document] [Update & Resubmit]
```

**Master updates, resubmits** → Agent approves → Files with authorities

---

### Phase 5: Authority Filing (Agent)

```
Agent files with:
├─ Port Authority
├─ Immigration
├─ Customs
├─ Health Authorities
└─ Coast Guard

All approvals received → Agent confirms to vessel
```

**Master receives:**
```
✅ Port Clearance Approved - Singapore

All pre-arrival documents approved by authorities.
Berth allocation: Berth 12, Pasir Panjang Terminal
Pilot boarding: 14:30 UTC (30 min before ETA)
Immigration clearance: On arrival
Customs inspection: None required

Agent: ABC Agencies
Contact: Mr. Lee (+65-1234-5678)
Estimated DA: $12,500 (itemized breakdown attached)

[View Full Details] [Acknowledge]
```

---

## 📱 Document Templates

### Built-in Templates for All Ports

```typescript
interface DocumentTemplate {
  id: string;
  name: string; // "FAL 1 - General Declaration"
  type: 'fal' | 'isps' | 'customs' | 'health' | 'environmental';
  applicableCountries: string[]; // ['SG', 'MY', 'TH'] or ['*'] for global
  format: 'pdf' | 'excel' | 'word';

  fields: DocumentField[];

  autoFillRules: {
    vesselInfo: string[];    // Which vessel fields to include
    crewInfo: boolean;       // Include crew list?
    cargoInfo: boolean;      // Include cargo details?
    portInfo: boolean;       // Include port-specific data?
    certificateInfo: string[]; // Which certificates to reference
  };

  validationRules: {
    required: string[];      // Required fields
    dateFormats: string[];   // Expected date formats
    customRules: ValidationRule[];
  };
}

interface DocumentField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'table';
  dataSource?: string;       // Where to get data: 'vessel.name', 'crew.master.name', etc.
  editable: boolean;         // Can Master edit?
  required: boolean;
  defaultValue?: any;
}
```

---

## 🗂️ Document Storage & Management

### Organized by Voyage & Port

```
Mari8X Document Vault:

/vessels/mv-ocean-star/
  /voyages/
    /voyage-202601-mumbai-singapore/
      /ports/
        /singapore/
          /pre-arrival/
            - FAL-1-general-declaration.pdf
            - FAL-2-cargo-declaration.pdf
            - FAL-5-crew-list.pdf
            - ISPS-security-declaration.pdf
            - customs-entry.pdf
            ... (all 12 documents)

          /arrival/
            - notice-of-readiness.pdf
            - statement-of-facts-start.pdf
            - berthing-confirmation.pdf

          /departure/
            - statement-of-facts-complete.pdf
            - port-clearance.pdf
            - final-cargo-manifest.pdf

          /agent-correspondence/
            - initial-submission-email.pdf
            - agent-feedback-feb8.pdf
            - approval-confirmation-feb9.pdf

          /disbursement-account/
            - da-estimate.pdf
            - da-final-invoice.pdf
            - da-payment-proof.pdf

        /mumbai/
          ... (same structure)
```

**Benefits:**
- ✅ All documents organized by voyage and port
- ✅ Easy audit trail
- ✅ Historical reference for future port calls
- ✅ Compliance documentation ready for inspections
- ✅ Automatic retention policies (keep 7 years)

---

## 🔗 Integration Points

### With Existing Mari8X Features

```
Document Workflow integrates with:

1. Vessel Portal
   ├─ "Upcoming Port Docs" widget
   ├─ Document review interface
   └─ One-click submission

2. Port Intelligence
   ├─ Required documents per port
   ├─ Local regulations
   ├─ Agent contact info
   └─ Estimated costs

3. DA Desk
   ├─ Auto-create DA for port agency
   ├─ Track agency fees
   ├─ Link invoices to documents
   └─ Approval workflow

4. Agent Directory
   ├─ Find agents per port
   ├─ Performance ratings
   ├─ Contact details
   └─ Service history

5. Document Vault
   ├─ Centralized storage
   ├─ Version control
   ├─ Audit trail
   └─ Compliance archive

6. Crew Management
   ├─ Auto-generate crew lists
   ├─ Passport validity checks
   ├─ Certificate tracking
   └─ Crew changes

7. Cargo Management
   ├─ Cargo manifests
   ├─ Dangerous goods
   ├─ HS codes
   └─ B/L integration
```

---

## 🤖 Intelligent Features

### 1. **Smart Validation**

```typescript
// Example: Passport expiry check
if (crewMember.passportExpiry < voyage.eta) {
  warnings.push({
    severity: 'high',
    message: `${crewMember.name} passport expires before arrival`,
    suggestion: 'Arrange crew change or passport extension',
    affectedDocument: 'FAL 5 - Crew List'
  });
}

// Example: Certificate validity
if (vessel.safetyConventionCert.expiry < voyage.eta) {
  errors.push({
    severity: 'critical',
    message: 'Safety Convention Certificate expired',
    action: 'Vessel cannot enter port until renewed',
    blocksSubmission: true
  });
}

// Example: Port-specific requirements
if (port.country === 'US' && !vessel.hasISPSCertificate) {
  errors.push({
    severity: 'critical',
    message: 'ISPS certificate required for US ports',
    blocksSubmission: true
  });
}
```

---

### 2. **Learning from History**

```typescript
// Learn from previous port calls
const previousCalls = await getPreviousPortCalls(vessel.id, port.id);

if (previousCalls.length > 0) {
  const lastCall = previousCalls[0];

  suggestions.push({
    type: 'info',
    message: `Last Singapore call (${lastCall.date}): Used agent ABC Agencies`,
    action: 'Use same agent for consistency?',
    data: lastCall.agentInfo
  });

  // Pre-fill with historical data
  if (lastCall.documents.includes('SPECIAL_PERMIT')) {
    suggestions.push({
      type: 'warning',
      message: 'Previous call required Special Cargo Permit',
      action: 'Check if still required for current cargo',
    });
  }
}
```

---

### 3. **Proactive Alerts**

```
Timeline alerts:

ETA - 72 hours: ⚠️ "Documents needed in 24 hours"
ETA - 48 hours: 📋 "Auto-generating port documents..."
ETA - 47 hours: ✅ "Documents ready for review"
ETA - 36 hours: ⏰ "Reminder: Review port documents"
ETA - 24 hours: ⚠️ "URGENT: Submit documents now"
ETA - 12 hours: 🚨 "CRITICAL: Documents not submitted!"
ETA - 6 hours:  ❌ "Too late - contact agent directly"

Certificate expiry alerts:
30 days before: 📅 "Certificate expiring soon"
14 days before: ⚠️ "Certificate expires in 2 weeks"
7 days before:  🚨 "URGENT: Certificate expires in 7 days"
At expiry:      ❌ "Certificate EXPIRED - renew immediately"
```

---

## 📊 Reporting & Analytics

### For Masters/Officers

```
Document Efficiency Report:

Last 10 Port Calls:
├─ Average document prep time: 18 minutes (vs industry avg 4.5 hours)
├─ Time saved: 42 hours total
├─ Documents auto-filled: 95% accuracy
├─ Agent revisions needed: 2% (vs industry avg 35%)
└─ On-time submission rate: 98%

Compliance Score: 98/100
- All documents submitted on time: ✅
- Zero port delays due to documentation: ✅
- Certificate compliance: 100%
```

### For Fleet Managers

```
Fleet Documentation Dashboard:

12 Vessels, 45 Port Calls This Month:
├─ Total documents generated: 540 documents
├─ Auto-fill success rate: 94%
├─ Total time saved: 190 hours
├─ Cost savings: $28,500 (reduced admin time)
├─ Compliance rate: 99.2%
└─ Average agent satisfaction: 4.8/5

Top performing vessels:
1. MV Ocean Star - 100% compliance, 12 minutes avg prep time
2. MV Pacific Queen - 100% compliance, 15 minutes avg prep time
3. MV Baltic Pride - 98% compliance, 16 minutes avg prep time

Issues flagged:
⚠️ MV Atlantic Trader - 2 late submissions (crew list delays)
```

---

## 🚀 Implementation Plan

### Phase 1: Core Document Engine (Week 1-2)
- [ ] Build document template system
- [ ] Create auto-fill engine
- [ ] Integrate with vessel/crew/cargo data
- [ ] Build PDF generation
- [ ] Create review interface

### Phase 2: Port Intelligence Integration (Week 3)
- [ ] Port requirements database
- [ ] Country-specific regulations
- [ ] Agent directory integration
- [ ] Local rule engine

### Phase 3: Workflow Automation (Week 4)
- [ ] Timeline-based triggers
- [ ] Email notifications
- [ ] Agent portal access
- [ ] DA Desk integration

### Phase 4: Advanced Features (Week 5-6)
- [ ] Smart validation
- [ ] Historical learning
- [ ] Analytics dashboard
- [ ] Mobile optimization

---

## 💰 Value Proposition

### For Vessels/Masters:
- **Time Saved**: 4-6 hours → 15-20 minutes per port call
- **Accuracy**: 95%+ auto-fill accuracy
- **Compliance**: Never miss required documents
- **Stress Reduction**: No more last-minute document rushes

### For Port Agents:
- **Standardized Submissions**: Consistent document format
- **Earlier Submissions**: Vessels submit on time
- **Fewer Revisions**: Pre-validated documents
- **Better Planning**: Know vessel requirements in advance

### For Fleet Owners:
- **Cost Savings**: $500-$1,000 per port call (reduced admin)
- **Compliance**: 99%+ compliance rate
- **Audit Ready**: Complete documentation trail
- **Efficiency**: 190+ hours saved per month per 12 vessels

---

## 🎯 Success Metrics

### Target KPIs:
- Document prep time: **< 20 minutes** (from 4-6 hours)
- Auto-fill accuracy: **95%+**
- On-time submission: **98%+**
- Agent revision requests: **< 5%** (from 35%)
- Compliance rate: **99%+**
- Master satisfaction: **9/10+**
- Agent satisfaction: **4.5/5+**

---

**This transforms Mari8X into a complete vessel operations platform with seamless port agent integration!** 🚢✨

The "filling and filing to agent sections" becomes automatic, intelligent, and saves massive amounts of time for everyone involved!
