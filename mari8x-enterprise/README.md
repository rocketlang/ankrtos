# Mari8XEE - Enterprise Edition

**Private Repository** - Proprietary License

Enterprise extensions for Mari8X Community Edition.

---

## 🏢 What is Mari8XEE?

Mari8X Enterprise Edition extends the open source [Mari8XCE](https://github.com/rocketlang/mari8x-community) with advanced AI/ML features, automation, and analytics.

**Base Requirement:** Mari8XCE (Community Edition)
**License:** Proprietary
**Pricing:** $99 - $1,999/month

---

## 📦 Enterprise Addons

### 1. **ai_routing** - AI-Powered Route Engine
- ML-based route optimization
- Historical AIS pattern analysis
- Weather-aware routing
- Traffic density avoidance
- Fuel optimization

**Resolves:** Task #1 - Activate Mari8X Route Engine with live AIS data

### 2. **port_congestion** - Predictive Port Congestion
- ML-based congestion prediction
- Real-time congestion scoring
- Historical pattern analysis
- Wait time estimation
- Alternative port recommendations

**Resolves:** Task #2 - Build automated port congestion monitoring from AIS patterns

### 3. **visualization** - Advanced Routing Visualization
- Live AIS vessel overlay
- Route replay and simulation
- Traffic density heatmaps
- Historical track visualization
- Multi-vessel comparison

**Resolves:** Task #3 - Create AIS-based routing visualization with live vessel overlay

### 4. **automation** - Deviation Alerts & Automation
- Intelligent deviation detection
- Automated alert routing
- Workflow automation
- Predictive delay warnings
- Auto-response system

**Resolves:** Task #4 - Implement and activate deviation alert system

---

## 🚀 Installation

### Prerequisites

1. **Mari8XCE installed:**
   ```bash
   git clone https://github.com/rocketlang/mari8x-community.git
   cd mari8x-community
   ```

2. **Valid Enterprise License:**
   - Sign up at https://mari8x.com/pricing
   - Receive license key: `MARI8X-ENT-xxx...`

### Install Enterprise Addons

```bash
# Clone enterprise repo (requires access)
cd mari8x-community
git clone git@github.com:rocketlang/mari8x-enterprise.git enterprise

# Add license to .env
echo "MARI8X_LICENSE_KEY=MARI8X-ENT-xxx..." >> .env

# Deploy with enterprise
docker-compose -f docker-compose.yml -f enterprise/docker-compose.enterprise.yml up -d
```

### Verify Installation

```bash
# Check logs
docker-compose logs backend | grep "Enterprise"

# Expected output:
# ✅ Mari8XEE - Enterprise features enabled
# ✅ Loaded: ai_routing
# ✅ Loaded: port_congestion
# ✅ Loaded: visualization
# ✅ Loaded: automation
```

---

## 🔧 Architecture

### Addon Structure

```
enterprise/
├── addons/
│   ├── ai_routing/
│   │   ├── src/
│   │   │   ├── index.ts           # Addon entry point
│   │   │   ├── ml-router.ts       # ML routing engine
│   │   │   ├── ais-analyzer.ts    # AIS pattern analysis
│   │   │   └── optimizer.ts       # Route optimization
│   │   ├── schema/
│   │   │   └── types/
│   │   │       └── ai-routing.ts  # GraphQL types
│   │   ├── models/
│   │   │   └── route-model.pkl    # Trained ML model
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── port_congestion/
│   │   ├── src/
│   │   ├── schema/
│   │   ├── models/
│   │   └── tests/
│   │
│   ├── visualization/
│   │   ├── src/
│   │   ├── components/
│   │   └── tests/
│   │
│   └── automation/
│       ├── src/
│       ├── workflows/
│       └── tests/
│
├── docker-compose.enterprise.yml
├── LICENSE (Proprietary)
└── README.md
```

### How Addons Work

Each addon:
1. **Extends community schema** (adds GraphQL types)
2. **Registers routes** (adds REST endpoints)
3. **Starts background jobs** (ML training, monitoring)
4. **Requires license verification** (feature gated)

```typescript
// addons/ai_routing/src/index.ts
export async function register(app: Express) {
  console.log('🤖 Registering AI Routing addon...');

  // Extend GraphQL schema
  await registerGraphQLTypes();

  // Add REST endpoints
  await registerRoutes(app);

  // Start background jobs
  await startMLTraining();

  console.log('✅ AI Routing addon registered');
}
```

---

## 📊 Features by Tier

### Professional ($99/mo)
- ✅ ai_routing (basic)
- ✅ port_congestion (basic)
- ✅ Basic visualization
- ❌ Advanced automation

### Enterprise ($499/mo)
- ✅ All Professional features
- ✅ Advanced ML models
- ✅ Full automation suite
- ✅ Priority support

### Platform ($1,999/mo)
- ✅ All Enterprise features
- ✅ Multi-tenant
- ✅ White-labeling
- ✅ 99.9% SLA

---

## 🔐 License Management

### License Verification

```typescript
// Automatic on startup
const license = await verifyLicense(process.env.MARI8X_LICENSE_KEY);

if (license.valid && license.tier === 'enterprise') {
  await loadEnterpriseAddons();
}
```

### Feature Gates

```typescript
// In GraphQL resolvers
if (!hasFeature(ctx.license, 'ai_routing')) {
  throw new Error('AI Routing requires Mari8XEE Professional or higher');
}
```

---

## 🧪 Development

### Setup Development Environment

```bash
# Clone repos
git clone https://github.com/rocketlang/mari8x-community.git
cd mari8x-community
git clone git@github.com:rocketlang/mari8x-enterprise.git enterprise

# Install dependencies
cd enterprise/addons/ai_routing
npm install

# Run tests
npm test

# Build
npm run build
```

### Creating New Addons

```bash
# Copy template
cp -r addons/ai_routing addons/my_new_addon

# Update package.json
# Implement src/index.ts register() function
# Add GraphQL types in schema/types/
# Write tests
```

---

## 📞 Support

**Enterprise Customers:**
- Email: captain@mari8X.com
- Priority support: 24/7
- Response time: < 4 hours

**Sales & Licensing:**
- Website: https://mari8x.com
- Email: captain@mari8X.com

---

## 🔒 Security

**Reporting Vulnerabilities:**
- Email: captain@mari8X.com
- PGP Key: Available on request
- Response time: 48 hours

---

**Mari8XEE** - Enterprise power for your maritime operations 🚢

Built by [RocketLang](https://github.com/rocketlang)
