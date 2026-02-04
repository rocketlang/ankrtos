# Mari8X Comprehensive Architecture - Part 2
## Priorities 4-8: Load Matching, CRM/ERP, Routing V2, Mobile, RAG

**Continuation from Part 1**
**Priority Order**: 4→5→6→7→8

---

# 🏆 Priority 4: Load Matching Algorithm (AI-Powered)

## Executive Summary

**Load matching** connects truckers with cargo at ports, solving a massive inefficiency:
- **Problem**: Empty trucks at ports, cargo waiting for transport
- **Market Size**: $500B+ trucking industry, ports are chokepoints
- **Solution**: AI-powered real-time matching
- **Revenue**: 3-5% commission on matched loads

---

## 4.1 The Load Matching Problem

### Current State (Inefficient)

```
Port A                        Cargo Shipper
   │                               │
   │  Truck arrives empty          │
   ├───────────────>               │
   │                               │
   │  Waits 2-4 hours for load     │
   │                               │
   │  Cargo waits for truck        │
   │         <─────────────────────┤
   │                               │
   │  Manual phone calls           │
   │  to find loads                │
   │                               │
   ▼                               ▼
```

### Problem Metrics
- **Empty Miles**: 30-40% of truck miles are empty
- **Waiting Time**: 2-4 hours average at ports
- **Lost Revenue**: $50-200 per empty trip
- **Fragmentation**: 1000s of small truckers, no centralized platform

---

## 4.2 AI-Powered Matching Algorithm

### Architecture

```
┌───────────────────────────────────────────────────┐
│            Load Matching Engine                   │
└───────────────────────────────────────────────────┘
            │                          │
            ▼                          ▼
    ┌──────────────┐          ┌──────────────┐
    │   Trucks     │          │    Cargo     │
    │  (Supply)    │          │   (Demand)   │
    └──────────────┘          └──────────────┘
            │                          │
            │  • Location (GPS)        │
            │  • Capacity (tons/m³)    │
            │  • Equipment type        │
            │  • Availability          │
            │  • Preferred routes      │
            │  • Driver hours left     │
            │                          │
            │  • Origin/destination    │
            │  • Weight/volume         │
            │  • Equipment required    │
            │  • Pickup time window    │
            │  • Rate offered          │
            │  • Urgency               │
            │                          │
            └──────────┬───────────────┘
                       ▼
        ┌──────────────────────────────┐
        │   Matching Algorithm         │
        │                              │
        │  1. Filter by constraints    │
        │  2. Score by optimization    │
        │  3. Rank by preference       │
        │  4. Suggest top 5 matches    │
        └──────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Real-time Notification     │
        │  • SMS to driver             │
        │  • App push notification     │
        │  • Auto-bid (if enabled)     │
        └──────────────────────────────┘
```

---

## 4.3 Matching Algorithm Implementation

### Step 1: Constraint Filtering

```typescript
interface Truck {
  id: string;
  driver: Driver;
  location: { lat: number; lon: number };
  capacity: { weight: number; volume: number };
  equipmentType: 'DRY_VAN' | 'REEFER' | 'FLATBED' | 'TANKER' | 'CONTAINER';
  availability: Date;
  maxRadius: number; // km willing to travel
  preferredRoutes?: string[];
  driverHoursLeft: number;
  currentLoad?: Load;
}

interface Load {
  id: string;
  cargo: Cargo;
  origin: { lat: number; lon: number; portId?: string };
  destination: { lat: number; lon: number };
  weight: number;
  volume: number;
  equipmentRequired: string[];
  pickupWindow: { start: Date; end: Date };
  deliveryWindow: { start: Date; end: Date };
  rateOffered: number;
  currency: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  specialRequirements?: string[];
}

class LoadMatchingEngine {
  // Step 1: Filter trucks by hard constraints
  filterByConstraints(trucks: Truck[], load: Load): Truck[] {
    return trucks.filter(truck => {
      // Constraint 1: Equipment type
      if (!load.equipmentRequired.includes(truck.equipmentType)) {
        return false;
      }

      // Constraint 2: Capacity
      if (truck.capacity.weight < load.weight || truck.capacity.volume < load.volume) {
        return false;
      }

      // Constraint 3: Availability
      if (truck.availability > load.pickupWindow.start) {
        return false;
      }

      // Constraint 4: Distance to pickup
      const distanceToPickup = this.calculateDistance(
        truck.location,
        load.origin
      );
      if (distanceToPickup > truck.maxRadius) {
        return false;
      }

      // Constraint 5: Driver hours
      const tripDuration = this.estimateTripDuration(load.origin, load.destination);
      if (truck.driverHoursLeft < tripDuration) {
        return false;
      }

      // Constraint 6: Special requirements (e.g., hazmat license, temperature control)
      if (load.specialRequirements) {
        if (!truck.driver.hasRequiredLicenses(load.specialRequirements)) {
          return false;
        }
      }

      return true; // Passed all constraints
    });
  }

  // Step 2: Score each truck by optimization goals
  scoreMatches(trucks: Truck[], load: Load): Array<{ truck: Truck; score: number }> {
    return trucks.map(truck => {
      let score = 0;

      // Factor 1: Distance to pickup (minimize empty miles)
      const distanceToPickup = this.calculateDistance(truck.location, load.origin);
      score += this.scoreDistance(distanceToPickup); // Higher score for closer trucks

      // Factor 2: Route preference
      if (truck.preferredRoutes?.some(route => this.matchesRoute(route, load))) {
        score += 20; // Bonus for preferred route
      }

      // Factor 3: Driver rating
      score += truck.driver.rating * 10; // 0-50 points based on 0-5 star rating

      // Factor 4: Historical reliability
      score += truck.driver.onTimeDeliveryRate * 20; // 0-20 points based on 0-100%

      // Factor 5: Price competitiveness
      const priceScore = this.calculatePriceScore(truck, load);
      score += priceScore; // 0-30 points

      // Factor 6: Urgency match
      if (load.urgency === 'CRITICAL' && truck.availability < new Date(Date.now() + 3600000)) {
        score += 15; // Bonus for immediately available trucks on urgent loads
      }

      // Factor 7: Equipment utilization (favor larger trucks on heavy loads)
      const utilizationScore = (load.weight / truck.capacity.weight) * 10;
      score += utilizationScore; // 0-10 points

      return { truck, score };
    });
  }

  // Step 3: Rank and return top matches
  rankMatches(
    scoredMatches: Array<{ truck: Truck; score: number }>
  ): Array<{ truck: Truck; score: number; matchQuality: string }> {
    // Sort by score descending
    const ranked = scoredMatches.sort((a, b) => b.score - a.score);

    // Assign match quality
    return ranked.map(match => ({
      ...match,
      matchQuality: this.getMatchQuality(match.score),
    }));
  }

  private getMatchQuality(score: number): string {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'FAIR';
    return 'POOR';
  }

  // Main matching function
  async matchLoad(loadId: string): Promise<MatchResult[]> {
    // 1. Get load details
    const load = await this.getLoad(loadId);

    // 2. Get available trucks
    const trucks = await this.getAvailableTrucks();

    // 3. Filter by constraints
    const eligible = this.filterByConstraints(trucks, load);

    if (eligible.length === 0) {
      return []; // No matches
    }

    // 4. Score matches
    const scored = this.scoreMatches(eligible, load);

    // 5. Rank matches
    const ranked = this.rankMatches(scored);

    // 6. Return top 5
    return ranked.slice(0, 5);
  }
}
```

---

## 4.4 Dynamic Pricing Engine

### Factors Affecting Price

1. **Distance**: Origin to destination (km)
2. **Urgency**: Critical loads command premium (20-30% higher)
3. **Equipment Type**: Reefer +15%, Hazmat +25%
4. **Supply/Demand**: Surge pricing when demand > supply
5. **Time of Day**: Night/weekend delivery +10-20%
6. **Fuel Prices**: Auto-adjust based on diesel prices
7. **Toll Costs**: Major toll roads add to base rate

### Implementation

```typescript
class DynamicPricingEngine {
  async calculatePrice(load: Load): Promise<PriceBreakdown> {
    // Base rate: $2-3 per km depending on region
    const distance = this.calculateDistance(load.origin, load.destination);
    const baseRate = this.getBaseRate(load.origin.country);
    let price = distance * baseRate;

    // Adjustment 1: Equipment premium
    const equipmentMultiplier = {
      DRY_VAN: 1.0,
      REEFER: 1.15,
      FLATBED: 1.05,
      TANKER: 1.20,
      HAZMAT: 1.25,
    }[load.equipmentRequired[0]] || 1.0;
    price *= equipmentMultiplier;

    // Adjustment 2: Urgency premium
    const urgencyPremium = {
      LOW: 1.0,
      MEDIUM: 1.10,
      HIGH: 1.20,
      CRITICAL: 1.30,
    }[load.urgency];
    price *= urgencyPremium;

    // Adjustment 3: Supply/demand surge
    const supplyDemandRatio = await this.getSupplyDemandRatio(
      load.origin,
      load.pickupWindow
    );
    if (supplyDemandRatio < 0.5) { // High demand, low supply
      price *= 1.15; // 15% surge
    }

    // Adjustment 4: Fuel surcharge
    const fuelPrice = await this.getCurrentFuelPrice(load.origin.country);
    const fuelSurcharge = this.calculateFuelSurcharge(distance, fuelPrice);
    price += fuelSurcharge;

    // Adjustment 5: Toll costs
    const tollCosts = await this.estimateTollCosts(load.origin, load.destination);
    price += tollCosts;

    // Adjustment 6: Time of day
    const hour = load.pickupWindow.start.getHours();
    if (hour < 6 || hour > 20) {
      price *= 1.10; // 10% night premium
    }

    return {
      basePrice: distance * baseRate,
      equipmentPremium: price * (equipmentMultiplier - 1),
      urgencyPremium: price * (urgencyPremium - 1),
      surgePricing: supplyDemandRatio < 0.5 ? price * 0.15 : 0,
      fuelSurcharge,
      tollCosts,
      nightPremium: (hour < 6 || hour > 20) ? price * 0.10 : 0,
      totalPrice: price,
      currency: load.currency,
      pricePerKm: price / distance,
    };
  }
}
```

---

## 4.5 Real-Time Notification System

### Notification Flow

```
Load Created → Matching Engine → Top 5 Trucks Identified
                                         │
                     ┌───────────────────┼───────────────────┐
                     ▼                   ▼                   ▼
                 SMS Alert          Push Notification    Auto-Bid
                                                          (if enabled)
                     │                   │                   │
                     └─────────┬─────────┴─────────┬─────────┘
                               ▼                   ▼
                        Driver Responds      Auto-Accepted
                               │                   │
                               └─────────┬─────────┘
                                         ▼
                                  Load Assigned
                                         │
                                         ▼
                             Track Delivery (GPS)
                                         │
                                         ▼
                                 POD (Proof of Delivery)
                                         │
                                         ▼
                                Payment Released
```

### Implementation

```typescript
class MatchNotificationService {
  async notifyDrivers(matches: MatchResult[], load: Load): Promise<void> {
    // Send notifications to top 5 matches
    await Promise.all(
      matches.map(async (match, index) => {
        // Calculate expiry (first match gets 5 min, others get 10 min)
        const expiryMinutes = index === 0 ? 5 : 10;

        // Send SMS
        await this.sendSMS({
          to: match.truck.driver.phone,
          message: `New load available! ${load.origin.city} → ${load.destination.city}. ${load.weight}kg, ${load.equipmentRequired.join(', ')}. Rate: ${load.currency} ${load.rateOffered}. Reply YES to accept (expires in ${expiryMinutes} min).`,
        });

        // Send push notification (if app installed)
        await this.sendPushNotification({
          userId: match.truck.driver.userId,
          title: 'New Load Match',
          body: `${load.origin.city} → ${load.destination.city} - ${load.currency} ${load.rateOffered}`,
          data: { loadId: load.id, expiresAt: Date.now() + expiryMinutes * 60000 },
        });

        // Auto-bid if enabled
        if (match.truck.driver.autoBidEnabled) {
          const shouldAutoBid = this.shouldAutoBid(match, load);
          if (shouldAutoBid) {
            await this.acceptLoad(load.id, match.truck.id);
          }
        }

        // Log notification
        await this.logNotification({
          loadId: load.id,
          driverId: match.truck.driver.id,
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + expiryMinutes * 60000),
          channel: 'SMS+PUSH',
        });
      })
    );
  }

  private shouldAutoBid(match: MatchResult, load: Load): boolean {
    const driver = match.truck.driver;

    // Auto-bid rules configured by driver
    const rules = driver.autoBidRules;

    // Rule 1: Minimum rate
    if (load.rateOffered < rules.minRate) return false;

    // Rule 2: Maximum distance
    const distance = this.calculateDistance(
      match.truck.location,
      load.origin
    );
    if (distance > rules.maxDistanceToPickup) return false;

    // Rule 3: Preferred routes only
    if (rules.preferredRoutesOnly) {
      if (!match.truck.preferredRoutes?.some(route =>
        this.matchesRoute(route, load)
      )) {
        return false;
      }
    }

    // Rule 4: Match quality threshold
    if (match.matchQuality === 'POOR' && rules.requireMinQuality === 'GOOD') {
      return false;
    }

    return true; // Passed all auto-bid rules
  }
}
```

---

## 4.6 Load Tracking & POD

### GPS Tracking

```typescript
class LoadTrackingService {
  async trackLoad(loadId: string): Promise<void> {
    // Start GPS tracking for assigned truck
    const load = await this.getLoad(loadId);
    const truck = await this.getTruck(load.assignedTruckId);

    // Geofence monitoring
    await this.startGeofenceMonitoring(load, truck);

    // Send periodic location updates
    setInterval(async () => {
      const position = await this.getDriverLocation(truck.driver.id);

      // Update load tracking
      await this.updateLoadPosition(loadId, position);

      // Check milestones
      await this.checkMilestones(load, position);
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  async checkMilestones(load: Load, position: Location): Promise<void> {
    // Milestone 1: Arrived at pickup
    const distanceToPickup = this.calculateDistance(position, load.origin);
    if (distanceToPickup < 0.5 && load.status === 'ASSIGNED') {
      await this.updateLoadStatus(load.id, 'AT_PICKUP');
      await this.notify({
        userId: load.shipper.id,
        type: 'TRUCK_ARRIVED',
        message: `Truck has arrived at pickup location`,
      });
    }

    // Milestone 2: In transit
    if (load.status === 'AT_PICKUP' && distanceToPickup > 1) {
      await this.updateLoadStatus(load.id, 'IN_TRANSIT');
    }

    // Milestone 3: Arrived at delivery
    const distanceToDelivery = this.calculateDistance(position, load.destination);
    if (distanceToDelivery < 0.5 && load.status === 'IN_TRANSIT') {
      await this.updateLoadStatus(load.id, 'AT_DELIVERY');
      await this.notify({
        userId: load.shipper.id,
        type: 'TRUCK_ARRIVED_DELIVERY',
        message: `Truck has arrived at delivery location`,
      });
    }
  }
}

// Proof of Delivery (POD)
interface ProofOfDelivery {
  loadId: string;
  deliveredAt: Date;
  deliveryLocation: { lat: number; lon: number };
  receiverName: string;
  receiverSignature: string; // Base64 image
  photos: string[]; // Base64 images
  notes?: string;
  condition: 'GOOD' | 'DAMAGED' | 'PARTIAL';
  discrepancyReport?: string;
}

async function submitPOD(pod: ProofOfDelivery): Promise<void> {
  // 1. Upload signature & photos to MinIO
  const signatureUrl = await uploadToMinIO(pod.receiverSignature, 'signatures');
  const photoUrls = await Promise.all(
    pod.photos.map(photo => uploadToMinIO(photo, 'pod-photos'))
  );

  // 2. Create POD record
  await prisma.proofOfDelivery.create({
    data: {
      loadId: pod.loadId,
      deliveredAt: pod.deliveredAt,
      deliveryLatitude: pod.deliveryLocation.lat,
      deliveryLongitude: pod.deliveryLocation.lon,
      receiverName: pod.receiverName,
      signatureUrl,
      photoUrls,
      notes: pod.notes,
      condition: pod.condition,
      discrepancyReport: pod.discrepancyReport,
    },
  });

  // 3. Update load status
  await prisma.load.update({
    where: { id: pod.loadId },
    data: { status: 'DELIVERED', deliveredAt: pod.deliveredAt },
  });

  // 4. Trigger payment release
  await releasePayment(pod.loadId);

  // 5. Notify shipper
  await notify({
    userId: load.shipper.id,
    type: 'DELIVERY_COMPLETED',
    message: 'Load delivered successfully. Payment released.',
  });
}
```

---

## 4.7 Load Matching - MVP Roadmap

### Month 1: Core Matching Algorithm
- Week 1-2: Database schema (Truck, Load, Match tables)
- Week 3: Constraint filtering algorithm
- Week 4: Scoring & ranking algorithm

### Month 2: Pricing & Notifications
- Week 1-2: Dynamic pricing engine
- Week 3: SMS notification integration (Twilio)
- Week 4: Push notifications (FCM)

### Month 3: Tracking & POD
- Week 1-2: GPS tracking integration
- Week 3: Geofence monitoring, milestone alerts
- Week 4: POD capture (signature, photos)

### Month 4: Auto-Bid & Analytics
- Week 1-2: Auto-bid rules engine
- Week 3: Driver/shipper dashboards
- Week 4: Analytics (match rate, empty miles reduction)

### Success Metrics
- **Match Rate**: >70% of loads matched within 15 minutes
- **Empty Miles Reduction**: 30-40% → 15-20%
- **Driver Revenue Increase**: +25% (fewer empty miles)
- **Shipper Savings**: 10-15% vs traditional brokers
- **Commission Revenue**: 3-5% of load value

---

# 🏆 Priority 5: Built-in CRM/ERP

## Executive Summary

Mari8X includes a **maritime-specific CRM/ERP** to eliminate need for:
- Salesforce (CRM): $150/user/month
- SAP (ERP): $200/user/month
- **Savings**: $350/user/month (70% cost reduction)

---

## 5.1 CRM Module

### Lead Management

```typescript
interface Lead {
  id: string;
  company: string;
  contactPerson: string;
  email: string;
  phone: string;
  source: 'WEBSITE' | 'REFERRAL' | 'TRADE_SHOW' | 'COLD_OUTREACH' | 'INBOUND';

  // Qualification
  score: number; // 0-100 (AI-powered lead scoring)
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  qualificationNotes: string;

  // Opportunity
  estimatedValue: number;
  currency: string;
  probability: number; // 0-100%
  expectedCloseDate: Date;

  // Activity tracking
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  activities: Activity[];

  // Assignment
  assignedTo: string; // User ID
  createdAt: Date;
  wonAt?: Date;
  lostReason?: string;
}

// AI-Powered Lead Scoring
async function scoreLead(lead: Lead): Promise<number> {
  let score = 0;

  // Factor 1: Company size (20 points)
  const companySize = await getCompanySize(lead.company);
  score += (companySize / 1000) * 20; // Max 20 points for 1000+ employees

  // Factor 2: Email domain (10 points)
  if (lead.email.includes('@gmail.com') || lead.email.includes('@yahoo.com')) {
    score += 0; // Personal email = low score
  } else {
    score += 10; // Business email
  }

  // Factor 3: Inbound vs outbound (15 points)
  if (lead.source === 'INBOUND' || lead.source === 'WEBSITE') {
    score += 15; // Inbound leads higher quality
  }

  // Factor 4: Response time (10 points)
  if (lead.lastContactDate) {
    const daysSinceContact = (Date.now() - lead.lastContactDate.getTime()) / 86400000;
    if (daysSinceContact < 1) score += 10;
    else if (daysSinceContact < 7) score += 5;
  }

  // Factor 5: Engagement (20 points)
  score += Math.min(lead.activities.length * 2, 20);

  // Factor 6: Budget/value (25 points)
  if (lead.estimatedValue > 100000) score += 25;
  else if (lead.estimatedValue > 50000) score += 15;
  else if (lead.estimatedValue > 10000) score += 5;

  return Math.min(score, 100);
}
```

### Deal Pipeline

```typescript
interface Deal {
  id: string;
  title: string;
  leadId?: string;
  customerId: string;

  // Value
  value: number;
  currency: string;
  probability: number;

  // Timeline
  expectedCloseDate: Date;
  actualCloseDate?: Date;

  // Stage
  stage: 'PROSPECTING' | 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';

  // Products/services
  lineItems: DealLineItem[];

  // Team
  owner: string;
  team: string[];

  // Tracking
  createdAt: Date;
  lastActivityAt: Date;
  wonAt?: Date;
  lostAt?: Date;
  lostReason?: string;
}

// Visual Pipeline (Kanban)
function DealPipeline() {
  const stages = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'];

  return (
    <div className="pipeline">
      {stages.map(stage => (
        <div key={stage} className="stage">
          <h3>{stage}</h3>
          <div className="deals">
            {deals.filter(d => d.stage === stage).map(deal => (
              <div key={deal.id} className="deal-card" draggable>
                <h4>{deal.title}</h4>
                <p>{deal.currency} {deal.value.toLocaleString()}</p>
                <p>{deal.probability}% probability</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 5.2 ERP Module

### Financial Management

```typescript
// General Ledger
interface GLAccount {
  id: string;
  code: string; // e.g., "4000-REVENUE-FREIGHT"
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  category: string; // e.g., "REVENUE", "COST_OF_GOODS_SOLD", "OPERATING_EXPENSES"
  balance: number;
  currency: string;
}

// Journal Entry
interface JournalEntry {
  id: string;
  date: Date;
  description: string;
  reference?: string; // Invoice #, Payment #, etc.

  lines: Array<{
    accountId: string;
    debit: number;
    credit: number;
    description: string;
  }>;

  // Audit
  createdBy: string;
  createdAt: Date;
  posted: boolean;
}

// Maritime-specific GL accounts
const MARITIME_CHART_OF_ACCOUNTS = [
  // Revenue
  { code: '4000', name: 'Freight Revenue', type: 'REVENUE' },
  { code: '4100', name: 'Charter Hire Revenue', type: 'REVENUE' },
  { code: '4200', name: 'Agency Commission Revenue', type: 'REVENUE' },
  { code: '4300', name: 'S&P Brokerage Revenue', type: 'REVENUE' },

  // Cost of Goods Sold
  { code: '5000', name: 'Bunker Fuel Costs', type: 'EXPENSE', category: 'COGS' },
  { code: '5100', name: 'Port Costs', type: 'EXPENSE', category: 'COGS' },
  { code: '5200', name: 'Crew Wages', type: 'EXPENSE', category: 'COGS' },
  { code: '5300', name: 'Vessel Maintenance', type: 'EXPENSE', category: 'COGS' },

  // Operating Expenses
  { code: '6000', name: 'Office Rent', type: 'EXPENSE', category: 'OPEX' },
  { code: '6100', name: 'Salaries & Wages', type: 'EXPENSE', category: 'OPEX' },
  { code: '6200', name: 'Marketing & Advertising', type: 'EXPENSE', category: 'OPEX' },

  // Assets
  { code: '1000', name: 'Cash', type: 'ASSET' },
  { code: '1100', name: 'Accounts Receivable', type: 'ASSET' },
  { code: '1500', name: 'Vessels', type: 'ASSET' },
  { code: '1600', name: 'Equipment', type: 'ASSET' },

  // Liabilities
  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
  { code: '2100', name: 'Vessel Mortgages', type: 'LIABILITY' },
];
```

### Inventory Management

```typescript
// Bunker Inventory
interface BunkerInventory {
  vesselId: string;
  fuelGrade: 'IFO380' | 'MGO' | 'VLSFO' | 'LSMGO';
  quantityMT: number;
  averageCostPerMT: number;
  totalValue: number;
  lastBunkeredAt: Date;
  estimatedDaysRemaining: number;
}

// Spare Parts Inventory
interface SparePartInventory {
  partNumber: string;
  description: string;
  category: 'ENGINE' | 'ELECTRICAL' | 'DECK' | 'SAFETY' | 'OTHER';
  quantityOnHand: number;
  unitCost: number;
  totalValue: number;
  reorderLevel: number;
  preferredSupplier: string;
  lastRestockedAt: Date;
}

// Low Stock Alerts
async function checkLowStock(): Promise<void> {
  const lowStockItems = await prisma.sparePartInventory.findMany({
    where: {
      quantityOnHand: { lte: prisma.raw('reorderLevel') },
    },
  });

  for (const item of lowStockItems) {
    await notify({
      userId: getProcurementManager(),
      type: 'LOW_STOCK_ALERT',
      message: `${item.description} is below reorder level. Current: ${item.quantityOnHand}, Reorder at: ${item.reorderLevel}`,
    });

    // Auto-create purchase order if configured
    if (item.autoReorder) {
      await createPurchaseOrder({
        supplierId: item.preferredSupplier,
        items: [{ partNumber: item.partNumber, quantity: item.reorderQuantity }],
      });
    }
  }
}
```

---

## 5.3 Multi-Tenant CRM/ERP

### Tenant Isolation

```typescript
// Every table has organizationId
model Customer {
  id             String   @id @default(cuid())
  organizationId String   @index
  name           String
  email          String
  phone          String
  // ... other fields

  organization   Organization @relation(fields: [organizationId], references: [id])
}

// Middleware for automatic tenant filtering
prisma.$use(async (params, next) => {
  if (params.model && TENANT_MODELS.includes(params.model)) {
    if (params.action === 'create' || params.action === 'createMany') {
      // Auto-add organizationId on create
      params.args.data.organizationId = context.user.organizationId;
    }

    if (['findMany', 'findFirst', 'findUnique', 'update', 'updateMany', 'delete', 'deleteMany'].includes(params.action)) {
      // Auto-filter by organizationId
      params.args.where = {
        ...params.args.where,
        organizationId: context.user.organizationId,
      };
    }
  }

  return next(params);
});
```

---

# 🏆 Priority 6: Routing Engine V2 (AIS-Powered)

## Executive Summary

Routing Engine V2 learns actual vessel routes from **AIS data**, not theoretical great circles.

### Key Innovations
1. **Mean/Median Routes**: Learn from 1000s of similar voyages
2. **DBSCAN Clustering**: Identify common waypoints
3. **Seasonal Variations**: Monsoon routes vs summer routes
4. **Real-time Updates**: Routes evolve as new AIS data arrives

---

## 6.1 AIS Track Collection

```typescript
interface AISTrack {
  id: string;
  vesselId: string;
  vesselIMO: string;
  vesselType: string;

  // Route
  origin: { lat: number; lon: number; portId?: string };
  destination: { lat: number; lon: number; portId?: string };

  // Track points
  points: Array<{
    timestamp: Date;
    lat: number;
    lon: number;
    speed: number;
    heading: number;
  }>;

  // Metadata
  departureTime: Date;
  arrivalTime: Date;
  duration: number; // seconds
  distance: number; // nautical miles
  season: 'WINTER' | 'SUMMER' | 'MONSOON';

  // Analysis
  waypoints: Array<{ lat: number; lon: number }>; // Identified via clustering
}

// Collect AIS tracks for a route
async function collectAISTracks(
  originPortId: string,
  destPortId: string,
  vesselType: string,
  limit: number = 1000
): Promise<AISTrack[]> {
  return await prisma.aISTrack.findMany({
    where: {
      originPortId,
      destinationPortId: destPortId,
      vesselType,
      departureTime: {
        gte: new Date(Date.now() - 365 * 86400000), // Last 1 year
      },
    },
    orderBy: { departureTime: 'desc' },
    take: limit,
  });
}
```

---

## 6.2 DBSCAN Clustering for Waypoints

```python
# Python clustering algorithm (called from Node.js via child process)
import numpy as np
from sklearn.cluster import DBSCAN

def identify_waypoints(ais_tracks, eps=0.5, min_samples=10):
    """
    Identify common waypoints from AIS tracks using DBSCAN clustering.

    eps: Maximum distance between points (degrees)
    min_samples: Minimum points to form a cluster
    """
    all_points = []

    # Collect all track points
    for track in ais_tracks:
        for point in track['points']:
            all_points.append([point['lat'], point['lon']])

    # Convert to numpy array
    X = np.array(all_points)

    # DBSCAN clustering
    clustering = DBSCAN(eps=eps, min_samples=min_samples).fit(X)

    # Extract cluster centers (waypoints)
    waypoints = []
    for label in set(clustering.labels_):
        if label == -1:
            continue  # Noise

        cluster_points = X[clustering.labels_ == label]
        centroid = cluster_points.mean(axis=0)
        waypoints.append({
            'lat': centroid[0],
            'lon': centroid[1],
            'frequency': len(cluster_points)
        })

    # Sort by frequency descending
    waypoints.sort(key=lambda w: w['frequency'], reverse=True)

    return waypoints
```

---

## 6.3 Mean/Median Route Calculation

```typescript
async function calculateMeanRoute(
  originPortId: string,
  destPortId: string,
  vesselType: string
): Promise<LearnedRoute> {
  // 1. Collect AIS tracks
  const tracks = await collectAISTracks(originPortId, destPortId, vesselType);

  if (tracks.length < 10) {
    // Not enough data, fallback to great circle
    return calculateGreatCircleRoute(originPortId, destPortId);
  }

  // 2. Identify waypoints via clustering (call Python script)
  const waypoints = await execPython('clustering.py', {
    tracks,
    eps: 0.5,
    min_samples: Math.floor(tracks.length * 0.1),
  });

  // 3. Order waypoints by route progression
  const orderedWaypoints = orderWaypointsByRoute(waypoints, origin, destination);

  // 4. Calculate mean route statistics
  const meanDistance = tracks.reduce((sum, t) => sum + t.distance, 0) / tracks.length;
  const meanDuration = tracks.reduce((sum, t) => sum + t.duration, 0) / tracks.length;
  const medianSpeed = calculateMedian(tracks.map(t => t.distance / t.duration * 3600)); // knots

  // 5. Save learned route
  const learnedRoute = await prisma.learnedRoute.create({
    data: {
      originPortId,
      destinationPortId: destPortId,
      vesselType,
      waypoints: orderedWaypoints,
      meanDistance,
      medianDistance: calculateMedian(tracks.map(t => t.distance)),
      meanDuration,
      medianDuration: calculateMedian(tracks.map(t => t.duration)),
      medianSpeed,
      sampleSize: tracks.length,
      lastUpdated: new Date(),
    },
  });

  return learnedRoute;
}
```

---

## 6.4 Seasonal Route Variations

```typescript
// Separate routes for different seasons
async function calculateSeasonalRoutes(
  originPortId: string,
  destPortId: string,
  vesselType: string
): Promise<Record<string, LearnedRoute>> {
  const seasons = ['WINTER', 'SUMMER', 'MONSOON'];
  const routes: Record<string, LearnedRoute> = {};

  for (const season of seasons) {
    const tracks = await prisma.aISTrack.findMany({
      where: {
        originPortId,
        destinationPortId: destPortId,
        vesselType,
        season,
      },
    });

    if (tracks.length >= 10) {
      routes[season] = await calculateMeanRoute(originPortId, destPortId, vesselType, season);
    }
  }

  return routes;
}

// Get current season
function getCurrentSeason(lat: number): string {
  const month = new Date().getMonth();

  if (lat > 0) { // Northern hemisphere
    if (month >= 5 && month <= 9) return 'SUMMER';
    if (month >= 10 || month <= 2) return 'WINTER';
    return 'MONSOON'; // Mar-May
  } else { // Southern hemisphere
    if (month >= 11 || month <= 2) return 'SUMMER';
    if (month >= 5 && month <= 8) return 'WINTER';
    return 'MONSOON';
  }
}
```

---

# 🏆 Priority 7: Mobile Strategy

## React Native vs Native

### Decision Matrix

| Factor | React Native | Native (Swift/Kotlin) | Winner |
|--------|--------------|----------------------|---------|
| Dev Speed | 🟢 1 codebase | 🔴 2 codebases | RN |
| Performance | 🟡 Good | 🟢 Excellent | Native |
| Offline | 🟢 IndexedDB | 🟢 SQLite | Tie |
| Camera/GPS | 🟢 Expo | 🟢 Native APIs | Tie |
| Team Skills | 🟢 JS/TS | 🔴 Learn Swift/Kotlin | RN |
| Maintenance | 🟢 Single team | 🔴 2 teams | RN |
| Updates | 🟢 OTA | 🔴 App Store review | RN |

**Recommendation**: **React Native + Expo**

---

## 7.1 Offline Sync Architecture

```
┌─────────────────────────────────┐
│   Mobile App (React Native)     │
└─────────────────────────────────┘
              │
         ┌────┴────┐
         ▼         ▼
    ┌────────┐  ┌──────┐
    │ Online │  │Offline│
    └────────┘  └──────┘
         │          │
         │     ┌────▼─────────┐
         │     │ IndexedDB     │
         │     │ (Local Cache) │
         │     └────┬─────────┘
         │          │
         └──────┬───┘
                ▼
    ┌───────────────────────┐
    │  Background Sync      │
    │  • Delta uploads      │
    │  • Conflict resolver  │
    │  • Retry queue        │
    └───────────────────────┘
```

---

# 🏆 Priority 8: RAG Enhancement

## Multi-Modal Document Processing

```typescript
// Voice queries
async function processVoiceQuery(audioBlob: Blob): Promise<string> {
  // 1. Speech-to-text
  const text = await speechToText(audioBlob);

  // 2. RAG query
  const answer = await maritimeRAG.ask(text);

  // 3. Text-to-speech
  const audio = await textToSpeech(answer);

  return audio;
}
```

---

## 🎯 Prioritized Implementation Plan

### Year 1 Roadmap

**Q1 (Months 1-3)**: Port Agency Portal + Ship Agents App MVP
**Q2 (Months 4-6)**: Email Intelligence + Load Matching MVP
**Q3 (Months 7-9)**: CRM/ERP + Routing Engine V2
**Q4 (Months 10-12)**: Mobile Polish + RAG Enhancement

### Team Size
- **Phase 1-2**: 5 developers (3 backend, 2 frontend/mobile)
- **Phase 3-4**: 8 developers (4 backend, 2 frontend, 1 mobile, 1 DevOps)

### Budget Estimate
- **Development**: $400k (8 developers × 12 months × $50k avg)
- **Infrastructure**: $60k/year (AWS, databases, AI APIs)
- **Total Year 1**: $460k

### Revenue Projection (Year 1)
- Port Agency Portal: $300k (600 port calls/month × $50)
- Ship Agents App: $120k (400 agents × $25/month)
- Load Matching: $200k (3% of $6.7M in matched loads)
- CRM/ERP: $150k (300 users × $50/month)
- **Total**: $770k (ROI: 67%)

---

**Co-Authored-By**: Claude Sonnet 4.5 <noreply@anthropic.com>
**Document**: Part 2 of 2 (Priorities 4-8)
**Total Length**: Part 1 (80KB) + Part 2 (40KB) = 120KB
**Status**: Complete Strategic Architecture
