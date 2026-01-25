# 🚀 RocketLang Enhancement Plan

**Date:** January 24, 2026
**Current Status:** 75% Complete (~41,000 LOC)
**Goal:** Production-ready natural language → software system

---

## 📊 Executive Summary

RocketLang successfully demonstrates the vision: **Natural language (Hindi/English) → Working application in ~260ms**.

However, analysis reveals **5 critical gaps** blocking production use:

1. **Control Flow Broken** - If/then/else and loops don't execute
2. **No Deployment** - Can't actually run generated apps
3. **No Validation** - Version conflicts, compatibility issues
4. **Incomplete Templates** - Only 7/20 business types
5. **No Testing** - Generated apps have no tests

**Recommendation:** 3-phase enhancement over 6-8 weeks.

---

## 🎯 Current State Analysis

### ✅ What Works Excellently (Production Ready)

| Component | Status | Quality |
|-----------|--------|---------|
| Intent Classification | ✅ 90% | Hindi/English detection excellent |
| Business Ontology | ✅ 100% | All 20 types defined |
| Package Index | ✅ 90% | 36+ packages indexed |
| Composer Engine | ✅ 85% | Package selection works |
| Code Generator | ✅ 80% | Generates Prisma + services + UI |
| Type System | ✅ 100% | Full Indic support |
| Compiler | ✅ 95% | JS/Go/Shell targets |
| Dialog Templates | ✅ 85% | Hindi/English dialogs |

### 🟡 What Needs Polish

| Component | Status | Issues |
|-----------|--------|--------|
| Parser | 85% | Control flow incomplete (critical) |
| Templates | 35% | Only 7/20 implemented |
| Memory System | 75% | EON fallback only, no learning |
| AI Integration | 80% | Rule-based fallback only |
| Swayam Adapter | 65% | Validation stubbed |

### ❌ What's Missing Entirely

1. **Deployment Module** - No Docker/Vercel/Railway support
2. **Test Generator** - Generated apps have no tests
3. **Validation Pipeline** - No version conflict detection
4. **Sandbox Environment** - No code isolation
5. **Learning Loop** - No pattern extraction from successes

---

## 🚨 Critical Issues (MUST FIX)

### Issue #1: Parser Control Flow Broken

**File:** `src/parser/peg-parser.ts` (lines 130-154)

**Problem:**
```typescript
// TODO: Implement conditional evaluation
// If/then/else blocks execute 'then' branch only

// TODO: Implement loop evaluation
// For/while loops extract but don't iterate

// TODO: Implement variable storage
// Variables assigned but not persisted
```

**Impact:**
- Can't write conditional DSL scripts
- Loops don't work
- Variables unusable
- **Breaks core DSL functionality**

**Fix Complexity:** 2-3 days
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL

---

### Issue #2: No Deployment Pipeline

**Missing:** `src/deployer/` module entirely

**Problem:** Generated applications can't be deployed. No support for:
- Docker containerization
- Vercel deployment
- Railway deployment
- Kubernetes manifests
- Environment configuration

**Impact:**
- Users get code but can't run it
- **Blocks production use**

**Fix Complexity:** 1 week
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL

---

### Issue #3: No Validation

**File:** `src/composer/composer.ts` (line 137)

**Problem:**
```typescript
versionConflicts: [], // TODO: Implement version conflict detection
```

**Impact:**
- Package version conflicts not detected
- Incompatible dependencies selected
- **Generated apps may not run**

**Fix Complexity:** 3-4 days
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL

---

### Issue #4: No Test Generation

**Missing:** `src/validator/` module

**Problem:** Generated applications have zero tests.

**Impact:**
- No quality assurance
- Can't verify functionality
- **Unprofessional output**

**Fix Complexity:** 1 week
**Priority:** ⭐⭐⭐⭐ HIGH

---

### Issue #5: Only 7/20 Templates

**Status:** retail, ecommerce, restaurant, logistics, service, healthcare, education

**Missing:**
- Wholesale, Manufacturing, Professional, Agriculture
- Real Estate, Hospitality, Finance, Media
- NGO, Government, Freelancer, Event, Fitness

**Impact:**
- Limited business type coverage
- **Can only serve 35% of market**

**Fix Complexity:** 2 weeks (13 templates × 1-1.5 days each)
**Priority:** ⭐⭐⭐ MEDIUM

---

## 🎯 Enhancement Plan

### Phase 1: Critical Fixes (Week 1-2)

**Goal:** Fix breaking issues, enable production use

#### Task 1.1: Fix Parser Control Flow (3 days)

**Files to modify:**
- `src/parser/peg-parser.ts`
- `src/runtime/index.ts`

**Implementation:**

```typescript
// 1. Add variable storage
const variables = new Map<string, any>();

// 2. Implement conditional evaluation
function evaluateConditional(node: ConditionalNode): any {
  const condition = evaluateExpression(node.condition, variables);
  if (condition) {
    return execute(node.thenBlock);
  } else if (node.elseBlock) {
    return execute(node.elseBlock);
  }
}

// 3. Implement loop evaluation
function evaluateLoop(node: LoopNode): any {
  const items = evaluateExpression(node.collection, variables);
  const results = [];
  for (const item of items) {
    variables.set(node.variable, item);
    results.push(execute(node.body));
  }
  return results;
}
```

**Tests to add:**
- `parser.test.ts` - conditional tests
- `parser.test.ts` - loop tests
- `runtime.test.ts` - variable storage tests

**Acceptance Criteria:**
- ✅ If/then/else blocks execute correctly
- ✅ For loops iterate over collections
- ✅ Variables persist within scope
- ✅ All parser tests pass

---

#### Task 1.2: Add Validation Module (4 days)

**New file:** `src/validator/index.ts`

**Implementation:**

```typescript
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'version_conflict' | 'missing_dependency' | 'incompatible_platform';
  package: string;
  message: string;
  fix?: string;
}

export async function validateComposition(
  composition: ComposedApp
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  // 1. Check version conflicts
  const conflicts = detectVersionConflicts(composition.resolvedPackages);
  errors.push(...conflicts);

  // 2. Check dependency resolution
  const missingDeps = checkDependencies(composition.resolvedPackages);
  errors.push(...missingDeps);

  // 3. Check platform compatibility
  const platformIssues = checkPlatformCompatibility(composition);
  errors.push(...platformIssues);

  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
}

function detectVersionConflicts(
  packages: ResolvedPackage[]
): ValidationError[] {
  const versionMap = new Map<string, string[]>();

  // Group versions by package
  for (const pkg of packages) {
    const versions = versionMap.get(pkg.name) || [];
    versions.push(pkg.version);
    versionMap.set(pkg.name, versions);
  }

  // Find conflicts
  const errors: ValidationError[] = [];
  for (const [name, versions] of versionMap) {
    const uniqueVersions = [...new Set(versions)];
    if (uniqueVersions.length > 1) {
      errors.push({
        type: 'version_conflict',
        package: name,
        message: `Multiple versions required: ${uniqueVersions.join(', ')}`,
        fix: `Use version ${uniqueVersions[0]}`
      });
    }
  }

  return errors;
}
```

**Tests to add:**
- `validator.test.ts` - version conflict detection
- `validator.test.ts` - dependency resolution
- `validator.test.ts` - platform compatibility

**Acceptance Criteria:**
- ✅ Detects version conflicts
- ✅ Identifies missing dependencies
- ✅ Validates platform compatibility
- ✅ Provides fix suggestions

---

#### Task 1.3: Implement Deployment Module (5 days)

**New directory:** `src/deployer/`
**Files:**
- `src/deployer/index.ts`
- `src/deployer/docker.ts`
- `src/deployer/vercel.ts`
- `src/deployer/railway.ts`

**Implementation:**

```typescript
// src/deployer/index.ts
export interface DeploymentTarget {
  platform: 'docker' | 'vercel' | 'railway' | 'kubernetes';
  config: DeploymentConfig;
}

export interface DeploymentConfig {
  appName: string;
  port?: number;
  env?: Record<string, string>;
  secrets?: string[];
}

export async function deploy(
  files: GeneratedFile[],
  target: DeploymentTarget
): Promise<DeploymentResult> {
  switch (target.platform) {
    case 'docker':
      return deployToDocker(files, target.config);
    case 'vercel':
      return deployToVercel(files, target.config);
    case 'railway':
      return deployToRailway(files, target.config);
    default:
      throw new Error(`Unsupported platform: ${target.platform}`);
  }
}

// src/deployer/docker.ts
export async function deployToDocker(
  files: GeneratedFile[],
  config: DeploymentConfig
): Promise<DeploymentResult> {
  // 1. Generate Dockerfile
  const dockerfile = generateDockerfile(config);
  files.push({ path: 'Dockerfile', content: dockerfile });

  // 2. Generate docker-compose.yml
  const compose = generateDockerCompose(config);
  files.push({ path: 'docker-compose.yml', content: compose });

  // 3. Generate .dockerignore
  const dockerignore = 'node_modules\n.git\n.env\n';
  files.push({ path: '.dockerignore', content: dockerignore });

  return {
    success: true,
    platform: 'docker',
    instructions: [
      'docker build -t ' + config.appName + ' .',
      'docker run -p ' + (config.port || 3000) + ':3000 ' + config.appName
    ]
  };
}

function generateDockerfile(config: DeploymentConfig): string {
  return `# RocketLang Generated Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build
RUN pnpm build

# Expose port
EXPOSE ${config.port || 3000}

# Start
CMD ["pnpm", "start"]
`;
}
```

**Tests to add:**
- `deployer.test.ts` - Docker generation
- `deployer.test.ts` - Vercel config
- `deployer.test.ts` - Railway config

**Acceptance Criteria:**
- ✅ Generates Dockerfile
- ✅ Generates docker-compose.yml
- ✅ Generates Vercel config
- ✅ Generates Railway config
- ✅ Provides deployment instructions

---

### Phase 2: Quality & Coverage (Week 3-4)

**Goal:** Add test generation, complete templates

#### Task 2.1: Test Generation Module (5 days)

**New directory:** `src/testgen/`

**Implementation:**

```typescript
// src/testgen/index.ts
export function generateTests(
  composition: ComposedApp
): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  // 1. Generate Vitest setup
  files.push({
    path: 'vitest.config.ts',
    content: generateVitestConfig()
  });

  // 2. Generate service tests
  for (const entity of composition.entities) {
    files.push({
      path: `src/server/services/__tests__/${entity.name.toLowerCase()}.test.ts`,
      content: generateServiceTests(entity)
    });
  }

  // 3. Generate API tests
  for (const entity of composition.entities) {
    files.push({
      path: `src/server/routes/__tests__/${entity.name.toLowerCase()}.test.ts`,
      content: generateAPITests(entity)
    });
  }

  // 4. Generate component tests
  for (const component of composition.ui.components) {
    files.push({
      path: `src/components/__tests__/${component.name}.test.tsx`,
      content: generateComponentTests(component)
    });
  }

  // 5. Generate E2E tests
  files.push({
    path: 'e2e/app.spec.ts',
    content: generateE2ETests(composition)
  });

  return files;
}

function generateServiceTests(entity: TemplateEntity): string {
  return `import { describe, it, expect, beforeEach } from 'vitest';
import * as ${entity.name.toLowerCase()}Service from '../${entity.name.toLowerCase()}.service';

describe('${entity.name} Service', () => {
  beforeEach(async () => {
    // Clean database
  });

  it('should list ${entity.name.toLowerCase()}s', async () => {
    const result = await ${entity.name.toLowerCase()}Service.list${entity.name}s();
    expect(result).toBeInstanceOf(Array);
  });

  it('should create ${entity.name.toLowerCase()}', async () => {
    const input = ${generateMockData(entity)};
    const result = await ${entity.name.toLowerCase()}Service.create${entity.name}(input);
    expect(result).toHaveProperty('id');
  });

  it('should get ${entity.name.toLowerCase()} by id', async () => {
    const created = await ${entity.name.toLowerCase()}Service.create${entity.name}(${generateMockData(entity)});
    const result = await ${entity.name.toLowerCase()}Service.get${entity.name}(created.id);
    expect(result).toBeTruthy();
  });

  it('should update ${entity.name.toLowerCase()}', async () => {
    const created = await ${entity.name.toLowerCase()}Service.create${entity.name}(${generateMockData(entity)});
    const updated = await ${entity.name.toLowerCase()}Service.update${entity.name}(created.id, { name: 'Updated' });
    expect(updated.name).toBe('Updated');
  });

  it('should delete ${entity.name.toLowerCase()}', async () => {
    const created = await ${entity.name.toLowerCase()}Service.create${entity.name}(${generateMockData(entity)});
    await ${entity.name.toLowerCase()}Service.delete${entity.name}(created.id);
    const result = await ${entity.name.toLowerCase()}Service.get${entity.name}(created.id);
    expect(result).toBeNull();
  });
});
`;
}
```

**Acceptance Criteria:**
- ✅ Generates vitest.config.ts
- ✅ Generates service tests (5 per entity)
- ✅ Generates API tests (5 per endpoint)
- ✅ Generates component tests
- ✅ Generates E2E tests
- ✅ All generated tests pass

---

#### Task 2.2: Complete Remaining Templates (10 days)

**To implement:** 13 templates (wholesale, manufacturing, professional, agriculture, real estate, hospitality, finance, media, ngo, government, freelancer, event, fitness)

**Approach:** 1 template per day (copying from retail-pos.ts pattern)

**Files to create:**
- `src/templates/wholesale-distribution.ts`
- `src/templates/manufacturing-production.ts`
- `src/templates/professional-services.ts`
- ...and 10 more

**Template Structure:**
```typescript
export const wholesaleTemplate: CompositionTemplate = {
  id: 'wholesale-distribution',
  name: 'Wholesale Distribution',
  nameHi: 'थोक वितरण',
  description: 'Distributor, stockist, B2B seller, or wholesale business',
  descriptionHi: 'वितरक, स्टॉकिस्ट, B2B विक्रेता, या थोक व्यापार',
  businessType: 'wholesale',
  version: '1.0.0',

  packages: [
    { role: 'auth', package: '@ankr/oauth' },
    { role: 'erp', package: '@ankr/erp' },
    { role: 'inventory', package: '@ankr/inventory' },
    { role: 'tax', package: '@ankr/gst-utils' },
    { role: 'credit', package: '@ankr/bfc' },
  ],

  entities: [
    // Define entities: Distributor, Retailer, Order, Product, ...
  ],

  ui: {
    pages: [
      // Define pages: Dashboard, Orders, Inventory, Retailers, ...
    ],
    components: [
      // Define components
    ],
  },

  api: {
    endpoints: [
      // Define endpoints
    ],
  },

  // ... wiring, config, etc.
};
```

**Acceptance Criteria:**
- ✅ All 20 business types have templates
- ✅ Each template has 5-8 entities
- ✅ Each template has 8-12 pages
- ✅ Each template has complete wiring

---

### Phase 3: Intelligence & Polish (Week 5-6)

**Goal:** Add learning, optimize performance, improve UX

#### Task 3.1: Learning Loop Implementation (5 days)

**Files to modify:**
- `src/memory/index.ts`
- `src/learner/index.ts` (new)

**Implementation:**

```typescript
// src/learner/index.ts
export interface LearningInsights {
  successfulPatterns: Pattern[];
  commonIssues: Issue[];
  recommendations: Recommendation[];
}

export interface Pattern {
  businessType: BusinessTypeId;
  features: FeatureId[];
  packages: string[];
  successRate: number;
  usageCount: number;
}

export async function extractPatterns(
  memories: CompositionMemory[]
): Promise<Pattern[]> {
  const patterns: Map<string, Pattern> = new Map();

  for (const memory of memories) {
    const key = `${memory.businessType}:${memory.features.sort().join(',')}`;

    if (!patterns.has(key)) {
      patterns.set(key, {
        businessType: memory.businessType,
        features: memory.features,
        packages: memory.packages,
        successRate: memory.successful ? 1 : 0,
        usageCount: 1
      });
    } else {
      const pattern = patterns.get(key)!;
      pattern.usageCount++;
      if (memory.successful) {
        pattern.successRate =
          (pattern.successRate * (pattern.usageCount - 1) + 1) / pattern.usageCount;
      }
    }
  }

  // Return patterns sorted by success rate
  return Array.from(patterns.values())
    .filter(p => p.usageCount >= 3) // Min 3 uses
    .sort((a, b) => b.successRate - a.successRate);
}

export async function learnFromFeedback(
  compositionId: string,
  successful: boolean,
  issues?: string[]
): Promise<void> {
  // Update memory
  await updateMemory(compositionId, { successful, issues });

  // Re-extract patterns
  const memories = await getAllMemories();
  const patterns = await extractPatterns(memories);

  // Update recommendations
  await updateRecommendations(patterns);
}
```

**Acceptance Criteria:**
- ✅ Extracts successful patterns from history
- ✅ Identifies common issues
- ✅ Generates recommendations
- ✅ Improves composition quality over time

---

#### Task 3.2: Performance Optimization (3 days)

**Implementation:**

```typescript
// src/cache/index.ts
export class CompositionCache {
  private cache = new Map<string, CachedComposition>();

  getCacheKey(intent: Intent): string {
    return `${intent.businessType}:${intent.requestedFeatures.sort().join(',')}`;
  }

  get(intent: Intent): ComposedApp | undefined {
    const key = this.getCacheKey(intent);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < 3600000) {
      return cached.composition;
    }

    return undefined;
  }

  set(intent: Intent, composition: ComposedApp): void {
    const key = this.getCacheKey(intent);
    this.cache.set(key, {
      composition,
      timestamp: Date.now()
    });
  }
}

// Parallel generation
export async function generateFromCompositionParallel(
  composition: ComposedApp
): Promise<GenerationResult> {
  const tasks = [
    // Generate schema
    Promise.resolve(generatePrismaSchema(composition.entities)),

    // Generate services in parallel
    Promise.all(composition.entities.map(e =>
      Promise.resolve(generateEntityService(e))
    )),

    // Generate routes in parallel
    Promise.all(composition.entities.map(e =>
      Promise.resolve(generateAPIRoutes(e))
    )),

    // Generate components in parallel
    Promise.all(composition.ui.components.map(c =>
      Promise.resolve(generateReactComponent(c.name, c.type))
    ))
  ];

  const [schema, services, routes, components] = await Promise.all(tasks);

  // Combine results...
}
```

**Acceptance Criteria:**
- ✅ Composition caching reduces latency 80%
- ✅ Parallel generation reduces time 50%
- ✅ Memory usage optimized

---

#### Task 3.3: Enhanced Dialog System (4 days)

**Implementation:**

```typescript
// src/dialog/context.ts
export interface DialogContext {
  conversationId: string;
  businessType?: BusinessTypeId;
  answeredQuestions: Map<string, any>;
  clarificationHistory: ClarificationQuestion[];
  userFrustrationLevel: number; // 0-10
}

export class ContextualDialogManager {
  private contexts = new Map<string, DialogContext>();

  async askQuestion(
    conversationId: string,
    question: ClarificationQuestion
  ): Promise<void> {
    const context = this.getContext(conversationId);

    // Check frustration level
    if (context.userFrustrationLevel > 7) {
      // Skip optional questions
      if (!question.required) return;

      // Use defaults for others
      this.applyDefaults(context, question);
      return;
    }

    // Ask question...
    context.clarificationHistory.push(question);
  }

  async processAnswer(
    conversationId: string,
    questionId: string,
    answer: any
  ): Promise<void> {
    const context = this.getContext(conversationId);

    // Store answer
    context.answeredQuestions.set(questionId, answer);

    // Check if answer makes sense given context
    const isConsistent = this.checkConsistency(context, questionId, answer);

    if (!isConsistent) {
      // Gentle clarification
      context.userFrustrationLevel += 0.5;
    } else {
      // Good answer, reduce frustration
      context.userFrustrationLevel = Math.max(0, context.userFrustrationLevel - 1);
    }
  }
}
```

**Acceptance Criteria:**
- ✅ Remembers previous answers
- ✅ Detects user frustration
- ✅ Skips optional questions when frustrated
- ✅ Validates answer consistency

---

## 📊 Enhancement Roadmap

### Week 1-2: Critical Fixes
- [ ] Fix parser control flow (if/then/else, loops, variables)
- [ ] Add validation module (version conflicts, dependencies)
- [ ] Implement deployment module (Docker, Vercel, Railway)

**Deliverable:** Production-ready core system

### Week 3-4: Quality & Coverage
- [ ] Add test generation module (Vitest, Playwright)
- [ ] Complete remaining 13 templates
- [ ] End-to-end integration testing

**Deliverable:** Professional-quality generated apps

### Week 5-6: Intelligence & Polish
- [ ] Implement learning loop
- [ ] Performance optimization (caching, parallelization)
- [ ] Enhanced dialog system (context, frustration detection)

**Deliverable:** Intelligent, optimized system

---

## 🎯 Success Metrics

| Metric | Current | Target (6 weeks) |
|--------|---------|------------------|
| Implementation % | 75% | 95% |
| Business Types Covered | 7/20 (35%) | 20/20 (100%) |
| Generation Time | 260ms | <100ms |
| Test Coverage | 70% | 90% |
| Generated App Quality | 6/10 | 9/10 |
| Deployment Support | 0% | 100% |

---

## 💰 Effort Estimation

| Phase | Tasks | Days | Engineer-Days |
|-------|-------|------|---------------|
| Phase 1 | Critical Fixes | 12 | 12 |
| Phase 2 | Quality & Coverage | 15 | 15 |
| Phase 3 | Intelligence | 12 | 12 |
| **Total** | | **39** | **39** |

**Timeline:** 6-8 weeks (single engineer)
**Timeline:** 3-4 weeks (two engineers, parallel work)

---

## 🚀 Quick Wins (Next 48 Hours)

If you need immediate improvements:

1. **Fix parser control flow** (8 hours)
   - Enable if/then/else
   - Enable basic loops
   - Variable storage

2. **Add Docker deployment** (4 hours)
   - Generate Dockerfile
   - Generate docker-compose.yml
   - Add deploy instructions

3. **Add version validation** (4 hours)
   - Detect conflicts
   - Suggest fixes
   - Block incompatible combinations

**Total:** 16 hours → Core functionality production-ready

---

## 📞 Implementation Guide

### For Each Enhancement:

1. **Read existing code**
   - Understand current implementation
   - Identify integration points

2. **Write tests first** (TDD)
   - Define expected behavior
   - Create test cases

3. **Implement feature**
   - Follow existing patterns
   - Add error handling
   - Document code

4. **Integration test**
   - Test with existing components
   - Verify end-to-end flow

5. **Update documentation**
   - README.md
   - Code comments
   - API docs

---

## 🎓 Resources

**Key Files to Study:**
- `/root/ankr-labs-nx/packages/rocketlang/src/parser/peg-parser.ts` - Parser (control flow)
- `/root/ankr-labs-nx/packages/rocketlang/src/composer/composer.ts` - Composition
- `/root/ankr-labs-nx/packages/rocketlang/src/generator/generator.ts` - Code gen
- `/root/ankr-labs-nx/packages/rocketlang/TODO.md` - Full roadmap

**Testing:**
- Run demos: `pnpm demo:shop` and `pnpm demo:interactive`
- Run tests: `pnpm test`
- Build: `pnpm build`

---

**Status:** Ready to implement
**Next Step:** Choose phase and start implementation

Would you like me to start with Phase 1 (Critical Fixes) or another area?
