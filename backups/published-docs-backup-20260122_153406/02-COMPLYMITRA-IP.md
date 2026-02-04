# ComplyMitra - Intellectual Property Portfolio

> **AI-Powered Compliance Automation for Indian Businesses**

**Platform:** ComplyMitra
**Category:** RegTech / Compliance
**Patent Count:** 3 High-Priority Innovations
**Estimated IP Value:** $4-6M

---

## Executive Summary

ComplyMitra is an intelligent compliance automation platform that automatically determines applicable regulations, calculates due dates, and ensures businesses never miss a filing deadline. Built specifically for India's complex regulatory landscape with 38+ compliance rules across GST, TDS, MCA, EPF, ESI, and state-specific regulations.

---

## Innovation 1: Recursive Rule Engine with Context-Based Applicability

### Patent Potential: ⭐⭐⭐⭐⭐ VERY HIGH

### Technical Description
YAML-based compliance rule engine that automatically determines which regulations apply to any business entity based on dynamic context evaluation.

### Unique Innovation Claims

**1. Nested Condition Evaluation:**
- Arbitrary depth AND/OR/NOT combinations
- Recursive evaluation algorithm
- Short-circuit optimization for performance

**2. 38 Pre-Built Indian Compliance Rules:**

| Category | Rules | Examples |
|----------|-------|----------|
| GST | 7 | GSTR-1, GSTR-3B, GSTR-9, E-way bills, ITC reconciliation |
| TDS | 6 | 24Q, 26Q, 27Q, Form 16, Form 16A |
| Income Tax | 7 | ITR-1 to ITR-7, Advance Tax |
| MCA | 10 | AOC-4, MGT-7, DIR-3 KYC, ADT-1 |
| EPF | 3 | Monthly ECR, Annual Return |
| ESI | 4 | Monthly contribution, Half-yearly return |
| State PT | Variable | Professional Tax by state |

**3. Multi-Threshold Applicability Logic:**
```yaml
rule: gstr-1
applicability:
  conditions:
    - type: AND
      rules:
        - field: turnover
          operator: gte
          value: 4000000  # ₹40 Lakh threshold
        - field: gst_registered
          operator: eq
          value: true
        - type: OR
          rules:
            - field: entity_type
              operator: in
              values: [pvt_ltd, llp, partnership]
            - field: voluntary_registration
              operator: eq
              value: true
```

**4. 13 Comparison Operators:**
| Operator | Description | Example |
|----------|-------------|---------|
| eq | Equal | entity_type eq "pvt_ltd" |
| ne | Not equal | status ne "dormant" |
| gt | Greater than | turnover gt 10000000 |
| gte | Greater or equal | employees gte 20 |
| lt | Less than | revenue lt 500000 |
| lte | Less or equal | age lte 5 |
| in | In array | state in ["MH", "KA", "TN"] |
| notIn | Not in array | industry notIn ["exempt"] |
| contains | String contains | name contains "tech" |
| exists | Field exists | gstin exists |
| startsWith | Starts with | pan startsWith "A" |
| endsWith | Ends with | cin endsWith "PTC" |
| regex | Regex match | gstin regex "^[0-9]{2}" |

**5. Dynamic Context Building:**
- Transforms company data into evaluable context
- Computed fields support (e.g., age from incorporation date)
- Real-time threshold evaluation

### Evaluation Flow
```
LoadRulesYAML → BuildContext → EvaluateApplicability →
GenerateCalendar → CalculateDueDates → ScheduleReminders
```

### Prior Art Differentiation
- Unlike Zoho Books (manual rule setup), auto-detects applicable rules
- Unlike ClearTax (form-specific), provides unified rule engine
- First YAML-based declarative compliance system for India

### Source Code Location
- `/root/ankr-compliance/libs/rule-engine/src/evaluator.ts` (291 lines)
- `/root/ankr-compliance/libs/rules/` (38 YAML files)

---

## Innovation 2: Intelligent Due Date Calculator with Holiday Adjustment

### Patent Potential: ⭐⭐⭐⭐ HIGH

### Technical Description
Automatic compliance deadline calculation with state-aware holiday adjustments and financial year awareness.

### Unique Innovation Claims

**1. 6 Due Date Base Types:**
| Type | Description | Example |
|------|-------------|---------|
| MONTH_END | X days after month end | GSTR-1: 11 days after month |
| QUARTER_END | X days after quarter | GST quarterly |
| FY_END | Relative to March 31 | Annual returns |
| FIXED_DATE | Specific date | GSTR-9: Dec 31 |
| HALF_YEAR_END | Semi-annual | ESI returns |
| PERIOD_END | Custom period | Weekly TDS |

**2. Holiday Adjustment Logic:**
| Mode | Behavior | Use Case |
|------|----------|----------|
| NONE | No adjustment | Internal deadlines |
| NEXT_WORKING | Move to next working day | Most filings |
| PREVIOUS_WORKING | Move to previous | Payment deadlines |

**3. 28 State Holiday Calendars:**
- All Indian states + Union Territories
- National holidays (Republic Day, Independence Day, Gandhi Jayanti)
- State-specific holidays (Onam in Kerala, Pongal in TN)
- Second/Fourth Saturday banking holidays
- Optional holidays consideration

**4. Financial Year Awareness:**
- FY 2024-25 format handling
- Cross-year calculations (Jan-Mar → previous FY)
- Assessment year computation
- Extended due date tracking

**5. Month-Specific Overrides:**
- Q4 TDS extended timelines
- Year-end special rules
- COVID-era extension support

### Due Date Calculation Flow
```
BaseDate → ApplyOffset → CheckHoliday → AdjustIfNeeded →
ValidateBusinessDay → ReturnFinalDate
```

### Source Code Location
- `/root/ankr-compliance/libs/calendar/src/due-date-calculator.ts` (396 lines)
- `/root/ankr-compliance/libs/calendar/src/holiday-service.ts`

---

## Innovation 3: Government Portal Web Scraper

### Patent Potential: ⭐⭐⭐ MEDIUM

### Technical Description
Automated extraction of compliance data and updates from government portals.

### Unique Innovation Claims

**1. Portal Integration:**
- GST Portal (gst.gov.in)
- Income Tax (incometax.gov.in)
- MCA (mca.gov.in)
- EPFO (epfindia.gov.in)
- ESIC (esic.nic.in)

**2. Real-Time Updates:**
- Holiday calendar synchronization
- Rule change detection
- Due date extension alerts
- New compliance requirement notifications

**3. Compliance Status Verification:**
- GSTIN validation
- Filing status check
- Return status tracking
- Demand/refund status

### Source Code Location
- `/root/ankr-compliance/libs/scrapers/`

---

## Competitive Advantages

| Feature | ComplyMitra | ClearTax | Zoho | Tally |
|---------|-------------|----------|------|-------|
| Auto-Detection | ✅ 38 rules | ❌ Manual | ❌ Manual | ❌ |
| Holiday Adjustment | ✅ 28 states | ❌ | ❌ | ❌ |
| YAML Rules | ✅ Declarative | ❌ | ❌ | ❌ |
| Rule Engine | ✅ Recursive | ❌ | ❌ | ❌ |
| Multi-Entity | ✅ Unlimited | Limited | Limited | ❌ |

---

## Market Opportunity

- **TAM:** $2B Indian compliance software market
- **SAM:** $800M SME compliance segment
- **SOM:** $100M automated compliance
- **Growth:** 25% CAGR (RegTech)

---

## Use Cases

### Case 1: New Startup
- Input: Incorporation date, expected turnover, employees
- Output: Applicable compliances, calendar, reminders

### Case 2: Growing Business
- Input: Turnover crosses ₹40L threshold
- Output: Auto-adds GST obligations

### Case 3: Multi-State Business
- Input: Operations in MH, KA, TN
- Output: State-specific PT rules for each

---

## Filing Recommendation

| Innovation | Priority | Est. Cost | Timeline |
|------------|----------|-----------|----------|
| Recursive Rule Engine | Immediate | $15,000 | 3 months |
| Due Date Calculator | Secondary | $12,000 | 6 months |
| Portal Scraper | Tertiary | $10,000 | 12 months |

**Total Investment:** $37,000
**Expected Protection:** 20 years

---

*Document Classification: Investor Confidential*
*Last Updated: 19 Jan 2026*
