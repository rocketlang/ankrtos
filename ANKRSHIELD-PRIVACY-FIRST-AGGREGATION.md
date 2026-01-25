# ankrshield - Privacy-First Data Aggregation

**Principle**: Learning without compromising privacy
**Method**: User permission + Anonymization + Differential privacy

---

## Core Privacy Promise

> **"ankrshield gets smarter by learning from users, but NEVER compromises individual privacy."**

### Three Pillars

1. **Explicit Consent** - Users opt-in, not opt-out
2. **Zero Personal Data** - Only aggregate, anonymized threat intelligence
3. **Transparency** - Users see exactly what's shared

---

## Opt-In System

### First Run Experience

```
┌──────────────────────────────────────────────────────────────┐
│ Welcome to ankrshield!                                        │
│                                                              │
│ 🛡️ Basic Protection: ENABLED                                 │
│   • Block 2M+ known trackers                                │
│   • Local-only protection                                   │
│   • No data shared                                          │
│                                                              │
│ 🤝 Help Improve Protection for Everyone (Optional)           │
│                                                              │
│   [ ] YES, share anonymized threat data                     │
│                                                              │
│   What gets shared:                                         │
│   ✅ Suspicious domain names (e.g., "tracker2026.com")      │
│   ✅ Behavioral patterns (e.g., "sets 3rd-party cookies")   │
│   ✅ Timestamp (for trend analysis)                         │
│                                                              │
│   What NEVER gets shared:                                   │
│   ❌ Your browsing history                                  │
│   ❌ Website URLs you visit                                 │
│   ❌ Your IP address or location                            │
│   ❌ Personal information                                   │
│   ❌ Any identifiable data                                  │
│                                                              │
│   [Learn More] [No Thanks] [Yes, Help Everyone]             │
└──────────────────────────────────────────────────────────────┘
```

### Key Points:
- **Default**: Data sharing OFF (privacy first)
- **Explicit choice**: User must actively choose to participate
- **Clear explanation**: What's shared vs what's NOT
- **Revocable**: Can turn off anytime in settings

---

## What Gets Shared (With Permission)

### Example Report (Anonymized)

```json
{
  "reportId": "uuid-v4-random",
  "domain": "tracker-analytics.example.com",
  "behavior": {
    "thirdPartyCookies": true,
    "canvasFingerprinting": true,
    "trackingPixel": false,
    "crossSiteRequests": 3
  },
  "confidence": 0.92,
  "timestamp": "2026-01-23T12:00:00Z",
  "clientVersion": "0.1.0",
  "platform": "desktop"
}
```

### What's Missing from Report:
- ❌ No user ID (each report uses random UUID)
- ❌ No IP address
- ❌ No website where tracker was found
- ❌ No user's full browsing session
- ❌ No location data
- ❌ No device identifiers

### Why This is Safe:
- **Can't trace back to user**: Random IDs, no persistent identifiers
- **Can't reconstruct browsing**: Only domain reported, not full URL
- **Can't identify person**: No demographic or personal data

---

## Data Aggregation Process

### Step 1: Local Detection (On User's Device)

```typescript
// Runs on user's device only
class LocalDetector {
  async analyzeRequest(request) {
    // Detect suspicious behavior
    const features = {
      is3rdParty: this.isThirdParty(request),
      hasCookies: this.hasCookies(request),
      hasFingerprinting: this.detectFingerprinting(request),
    };

    // Check against local ML model
    const isSuspicious = await this.localModel.predict(features);

    if (isSuspicious && this.userOptedIn()) {
      // Prepare anonymized report
      const report = {
        domain: this.extractDomain(request),  // Just domain, not full URL
        behavior: features,                    // Behavioral signature only
        confidence: isSuspicious.confidence,
        // NO user data, NO browsing history
      };

      // Send to aggregation server
      await this.sendReport(report);
    }
  }
}
```

### Step 2: Server-Side Aggregation (Privacy Server)

```typescript
// Runs on ankrshield's servers
class AggregationServer {
  async receiveReport(encryptedReport) {
    // 1. Decrypt (TLS encrypted in transit)
    const report = this.decrypt(encryptedReport);

    // 2. Validate (no user data present)
    if (this.containsUserData(report)) {
      throw new Error('User data detected, rejected');
    }

    // 3. Aggregate with other reports
    const stats = await this.getAggregatedStats(report.domain);
    stats.totalReports++;
    stats.avgConfidence = this.updateAverage(stats, report.confidence);

    // 4. Apply differential privacy
    const noisyStats = this.addDifferentialPrivacy(stats);

    // 5. Check consensus threshold
    if (noisyStats.totalReports > 100 &&
        noisyStats.avgConfidence > 0.90) {
      // Classify as tracker
      await this.addToBlocklist(report.domain);
    }

    // 6. Delete individual report (no storage of raw reports)
    // Only aggregate stats are kept
  }
}
```

### Step 3: Differential Privacy

**Goal**: Even aggregate data can't reveal individual contributions

```typescript
class DifferentialPrivacy {
  addNoise(realValue: number) {
    // Add Laplace noise
    const noise = this.laplaceNoise(sensitivity=1, epsilon=0.1);
    return realValue + noise;
  }

  laplaceNoise(sensitivity: number, epsilon: number) {
    // Mathematical guarantee: individual contributions are hidden
    const scale = sensitivity / epsilon;
    return sampleFromLaplace(scale);
  }
}
```

**Example**:
- Real count: 157 users reported domain X
- After DP: 153 or 161 (noise added)
- **Guarantee**: Can't determine if any specific user reported it

---

## User Controls & Transparency

### Settings Panel

```
┌────────────────────────────────────────────────────────┐
│ Privacy & Data Sharing                                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Help Improve Protection:  [Toggle: ON]                │
│                                                        │
│ When enabled, ankrshield shares:                      │
│   • Suspicious domain names (e.g., tracker.com)       │
│   • Behavioral patterns (cookies, fingerprinting)     │
│   • Timestamp for trend analysis                      │
│                                                        │
│ Your Privacy Protections:                             │
│   ✅ All data is anonymized                           │
│   ✅ No browsing history shared                       │
│   ✅ Random IDs used (not traceable)                  │
│   ✅ Differential privacy applied                     │
│   ✅ You can turn off anytime                         │
│                                                        │
│ [View What Was Shared This Month]                     │
│ [Download My Data Report]                             │
│ [Delete All My Contributions]                         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Monthly Transparency Report (Sent to User)

```
Your ankrshield Contribution Report - January 2026

Thank you for helping protect everyone's privacy!

This Month You Helped Discover:
  • 23 new tracking domains
  • 7 fingerprinting attempts
  • 142 suspicious cookies

Community Impact:
  • Your contributions helped protect 2.3M users
  • New trackers blocked within 3 hours (avg)
  • 0 false positives from your reports

What Was Shared (Anonymized):
  • Domain names: 23
  • Behavioral signatures: 30
  • Full URLs: 0 (never shared)
  • Your browsing history: 0 (never shared)
  • Personal data: 0 (never shared)

Privacy Status:
  ✅ All reports anonymized
  ✅ Differential privacy applied
  ✅ No data sold to third parties
  ✅ No identifiable information stored

[Turn Off Data Sharing] [View Details] [Feedback]
```

---

## Technical Safeguards

### 1. No Persistent User IDs

```typescript
// Bad approach (traceable)
const report = {
  userId: "user-12345",  // ❌ Can track individual
  domain: "tracker.com"
};

// Good approach (anonymous)
const report = {
  reportId: crypto.randomUUID(),  // ✅ Random, not linked
  domain: "tracker.com"
};
```

### 2. Aggregate-Only Storage

```typescript
// We DON'T store individual reports
❌ reports_table:
  | id | user | domain | timestamp |

// We ONLY store aggregates
✅ domain_stats_table:
  | domain | total_reports | avg_confidence | first_seen |
  | tracker.com | 157 | 0.92 | 2026-01-23 |
```

### 3. Data Minimization

```typescript
// Extract only what's needed
function sanitizeReport(rawReport) {
  return {
    domain: extractDomain(rawReport.url),  // Just domain, not full URL
    behavior: rawReport.features,          // Behavioral signature only
    // Discard everything else
  };
}
```

### 4. Encryption in Transit

```typescript
// All reports sent over TLS 1.3
const response = await fetch('https://api.ankrshield.com/report', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // No authentication header (anonymous)
  },
  body: JSON.stringify(anonymizedReport)
});
```

### 5. Time-Based Aggregation

```typescript
// Don't act on real-time data (prevents correlation attacks)
// Wait for aggregate before updating blocklist

if (domainStats.windowDuration > 1_HOUR &&
    domainStats.reportCount > MIN_THRESHOLD) {
  // Safe to act on aggregate
}
```

---

## Privacy Audit Trail

### What Users Can Verify

1. **Network Traffic Inspection**
   - Users can use Wireshark/tcpdump to see what's sent
   - Should only see domain names, no URLs or user data

2. **Open Source Client**
   - All client code is public on GitHub
   - Community can audit what gets reported

3. **Third-Party Audits**
   - Annual privacy audits by independent firms
   - Results published publicly

4. **No Data Retention**
   - Individual reports deleted immediately after aggregation
   - Only statistical summaries kept
   - Users can verify with data deletion requests

---

## Comparison with Competitors

### Google Analytics (NOT Privacy-Preserving)
- ❌ Tracks individual users
- ❌ Stores full browsing history
- ❌ Sells data to advertisers
- ❌ No differential privacy
- ❌ Opt-out required, not opt-in

### ankrshield (Privacy-First)
- ✅ No individual tracking
- ✅ No browsing history stored
- ✅ Data NEVER sold
- ✅ Differential privacy applied
- ✅ Opt-in required, not opt-out

### Apple's Differential Privacy
- ✅ Similar approach (good!)
- ✅ Differential privacy
- ✅ Aggregate-only
- ❌ Closed source (can't verify)
- ❌ Apple only (not cross-platform)

### ankrshield Advantage
- ✅ Apple-level privacy
- ✅ BUT open source (verifiable)
- ✅ AND cross-platform
- ✅ AND user-controlled

---

## Legal Compliance

### GDPR (EU)
- ✅ Explicit consent required (Article 7)
- ✅ Minimal data collection (Article 5)
- ✅ Purpose limitation (only threat intelligence)
- ✅ Right to deletion (can opt-out anytime)
- ✅ Data portability (can download contributions)

### CCPA (California)
- ✅ Opt-in for data sharing
- ✅ Right to know (transparency reports)
- ✅ Right to delete
- ✅ No selling of data

### ePrivacy Directive
- ✅ Clear information about data processing
- ✅ Opt-in consent
- ✅ Right to withdraw consent

---

## Benefits to Users

### Individual Benefits
1. **Better Protection**: Collective intelligence improves accuracy
2. **Faster Updates**: New threats blocked within hours, not weeks
3. **Privacy Preserved**: Anonymization + differential privacy
4. **Full Control**: Can opt-out anytime, delete contributions
5. **Transparency**: Monthly reports show what was shared

### Collective Benefits
1. **Network Effects**: More users = smarter system
2. **Zero-Day Protection**: Community discovers new trackers fast
3. **False Positive Reduction**: Aggregate data improves accuracy
4. **Global Coverage**: Users worldwide contribute local threats

---

## Ethical Commitment

### ankrshield Privacy Pledge

> 1. **We will NEVER sell user data** (or aggregate data)
> 2. **We will NEVER track individual users**
> 3. **We will ALWAYS ask for permission** before sharing data
> 4. **We will ALWAYS anonymize** before aggregation
> 5. **We will ALWAYS allow opt-out** at any time
> 6. **We will ALWAYS publish** annual privacy audits
> 7. **We will ALWAYS be transparent** about what's shared

**Signed**: ankrshield Team
**Date**: January 23, 2026
**Enforced**: GPL-3.0 License + Public Code Audits

---

## Implementation Checklist

### Client-Side
- [ ] Opt-in dialog on first run
- [ ] Settings panel for data sharing
- [ ] Monthly transparency reports
- [ ] Local anonymization before sending
- [ ] User-controlled data deletion

### Server-Side
- [ ] Anonymous report ingestion
- [ ] Differential privacy layer
- [ ] Aggregate-only storage
- [ ] Auto-deletion of individual reports
- [ ] Consensus algorithm for blocklist updates

### Legal
- [ ] Privacy policy (GDPR compliant)
- [ ] Terms of service (clear data usage)
- [ ] Cookie policy (no tracking cookies)
- [ ] Third-party privacy audit
- [ ] Regular compliance reviews

---

## Summary

**Goal**: Learn from millions of users without compromising any individual's privacy

**How**:
1. ✅ Explicit user permission (opt-in)
2. ✅ Anonymized data only (no personal info)
3. ✅ Differential privacy (mathematical guarantee)
4. ✅ Aggregate-only storage (no individual tracking)
5. ✅ Full transparency (users see what's shared)
6. ✅ Revocable consent (opt-out anytime)

**Result**: World's smartest privacy tool that actually respects privacy

---

**Motto**: "Privacy-preserving collective intelligence"
**Promise**: "Your privacy protects everyone, while staying private"
**Proof**: Open source code + third-party audits
