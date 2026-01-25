# OpenClaude + Theia Integration - Week 1 Plan
**Date**: 2026-01-24
**Decision**: ✅ Option A Approved - Use Theia Frontend
**Timeline**: 6 weeks to launch
**Target Launch**: Mid-February 2026

---

## 🎯 Week 1 Objectives

**Goal**: Fork Theia, set up OpenClaude branding, and create first integration POC

**Deliverables**:
1. ✅ Forked Theia repository as `openclaude-ide`
2. ✅ OpenClaude branding applied
3. ✅ Development environment set up
4. ✅ First backend service connected (POC)
5. ✅ Documentation updated

---

## 📋 Day-by-Day Plan

### Day 1: Repository Setup (Today!)

**Tasks**:
- [x] Create GitHub organization/repo
- [ ] Fork Theia repository
- [ ] Rename to `openclaude-ide`
- [ ] Set up upstream tracking
- [ ] Update README with OpenClaude info
- [ ] Configure repository settings

**Commands**:
```bash
# Option 1: Fork on GitHub (recommended)
# Go to: https://github.com/eclipse-theia/theia
# Click "Fork" → Create fork

# Option 2: Clone and set up locally
git clone https://github.com/eclipse-theia/theia.git openclaude-ide
cd openclaude-ide
git remote rename origin upstream
git remote add origin https://github.com/ankr-in/openclaude-ide.git
```

**Deliverable**: OpenClaude IDE repository ready

---

### Day 2: Branding & Configuration

**Tasks**:
- [ ] Update application name
- [ ] Update logos and icons
- [ ] Configure default themes
- [ ] Update package.json metadata
- [ ] Configure preferences

**Changes**:

**1. Browser Example Name** (`examples/browser/package.json`):
```json
{
  "name": "@openclaude/ide",
  "theia": {
    "frontend": {
      "config": {
        "applicationName": "OpenClaude IDE",
        "preferences": {
          "workbench.colorTheme": "OpenClaude Dark",
          "ai.anthropic.model": "claude-opus-4"
        }
      }
    }
  }
}
```

**2. Root Package** (`package.json`):
```json
{
  "name": "@openclaude/monorepo",
  "description": "OpenClaude - AI-Powered IDE for Indian Developers",
  "repository": "https://github.com/ankr-in/openclaude-ide"
}
```

**3. Window Title** (`packages/core/src/browser/window/window-title-service.ts`):
```typescript
// Update default title
get title(): string {
  return this.doGetTitle() || 'OpenClaude IDE';
}
```

**Deliverable**: OpenClaude branding applied throughout

---

### Day 3: Backend Integration Package

**Tasks**:
- [ ] Create `packages/openclaude-integration` package
- [ ] Set up GraphQL client
- [ ] Create service interfaces
- [ ] Configure dependency injection
- [ ] Test connection to our backend

**Create Package**:
```bash
mkdir -p packages/openclaude-integration
cd packages/openclaude-integration
```

**Package Structure**:
```
packages/openclaude-integration/
├── package.json
├── tsconfig.json
├── src/
│   ├── browser/
│   │   ├── openclaude-frontend-module.ts
│   │   └── openclaude-preferences.ts
│   ├── common/
│   │   ├── openclaude-protocol.ts
│   │   └── openclaude-types.ts
│   └── node/
│       ├── openclaude-backend-module.ts
│       └── openclaude-backend-client.ts
```

**package.json**:
```json
{
  "name": "@openclaude/integration",
  "version": "1.0.0",
  "dependencies": {
    "@theia/core": "1.67.0",
    "graphql-request": "^7.0.0",
    "graphql": "^16.10.0"
  },
  "theiaExtensions": [
    {
      "frontend": "lib/browser/openclaude-frontend-module",
      "backend": "lib/node/openclaude-backend-module"
    }
  ]
}
```

**Frontend Module** (`src/browser/openclaude-frontend-module.ts`):
```typescript
import { ContainerModule } from '@theia/core/shared/inversify';
import { GraphQLClient } from 'graphql-request';

export default new ContainerModule(bind => {
    // Bind GraphQL client
    const client = new GraphQLClient('http://localhost:4000/graphql', {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    bind(GraphQLClient).toConstantValue(client);

    // Bind our services (will add in Day 4-5)
    // bind(OpenClaudeReviewService).toSelf().inSingletonScope();
    // bind(OpenClaudeTestGenService).toSelf().inSingletonScope();
});
```

**Preferences** (`src/browser/openclaude-preferences.ts`):
```typescript
import { PreferenceSchema } from '@theia/core/lib/browser/preferences';

export const OpenClaudePreferenceSchema: PreferenceSchema = {
    type: 'object',
    properties: {
        'openclaude.backend.url': {
            type: 'string',
            default: 'http://localhost:4000/graphql',
            description: 'OpenClaude backend GraphQL endpoint'
        },
        'openclaude.ai.enabled': {
            type: 'boolean',
            default: true,
            description: 'Enable OpenClaude AI features'
        }
    }
};
```

**Add to Browser Example** (`examples/browser/package.json`):
```json
{
  "dependencies": {
    "@openclaude/integration": "1.0.0",
    // ... other dependencies
  }
}
```

**Deliverable**: Integration package created and wired up

---

### Day 4: First Service Integration (POC)

**Tasks**:
- [ ] Connect AI Code Review service
- [ ] Create GraphQL queries
- [ ] Test end-to-end flow
- [ ] Verify backend communication

**Create Review Service** (`src/browser/openclaude-review-service.ts`):
```typescript
import { injectable, inject } from '@theia/core/shared/inversify';
import { GraphQLClient } from 'graphql-request';
import { gql } from 'graphql-request';

export interface CodeIssue {
    file: string;
    line: number;
    severity: 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR';
    message: string;
    suggestedFix?: string;
}

export interface CodeReview {
    id: string;
    status: string;
    issues: CodeIssue[];
}

@injectable()
export class OpenClaudeReviewService {

    @inject(GraphQLClient)
    protected readonly client!: GraphQLClient;

    async startReview(files: string[]): Promise<CodeReview> {
        const mutation = gql`
            mutation StartReview($files: [String!]!) {
                startReview(files: $files) {
                    id
                    status
                    issues {
                        file
                        line
                        severity
                        message
                        suggestedFix
                    }
                }
            }
        `;

        try {
            const result = await this.client.request<{ startReview: CodeReview }>(
                mutation,
                { files }
            );
            return result.startReview;
        } catch (error) {
            console.error('Failed to start code review:', error);
            throw error;
        }
    }

    async getReview(id: string): Promise<CodeReview> {
        const query = gql`
            query GetReview($id: ID!) {
                review(id: $id) {
                    id
                    status
                    issues {
                        file
                        line
                        severity
                        message
                        suggestedFix
                    }
                }
            }
        `;

        const result = await this.client.request<{ review: CodeReview }>(
            query,
            { id }
        );
        return result.review;
    }
}
```

**Register Service** (`src/browser/openclaude-frontend-module.ts`):
```typescript
import { OpenClaudeReviewService } from './openclaude-review-service';

export default new ContainerModule(bind => {
    bind(GraphQLClient).toConstantValue(client);
    bind(OpenClaudeReviewService).toSelf().inSingletonScope();
});
```

**Test Connection**:
```bash
# Start our backend
cd /root/ankr-universe
npm run dev

# Start Theia with OpenClaude integration
cd /root/openclaude-ide/examples/browser
npm run start

# Test GraphQL connection in browser console
```

**Deliverable**: First backend service connected and working

---

### Day 5: Build & Test

**Tasks**:
- [ ] Build entire project
- [ ] Test OpenClaude branding
- [ ] Test backend integration
- [ ] Fix any issues
- [ ] Create development workflow docs

**Build Commands**:
```bash
# Install dependencies
npm install

# Compile all packages
npm run compile

# Build browser example
npm run build:browser

# Start development server
cd examples/browser
npm run start
```

**Testing Checklist**:
- [ ] Application shows "OpenClaude IDE" title
- [ ] Custom logo appears
- [ ] Preferences include OpenClaude settings
- [ ] GraphQL client connects to backend
- [ ] Can call startReview mutation
- [ ] Backend responds correctly

**Development Workflow** (`DEVELOPMENT.md`):
```markdown
# OpenClaude IDE Development

## Quick Start

1. Start backend services:
   ```bash
   cd /root/ankr-universe
   npm run dev
   ```

2. Start OpenClaude IDE:
   ```bash
   cd /root/openclaude-ide
   npm run start:browser
   ```

3. Open browser: http://localhost:3000

## Development

Watch mode for fast iteration:
```bash
npm run watch
```

Rebuild specific package:
```bash
cd packages/openclaude-integration
npm run build
```

## Testing

Run tests:
```bash
npm test
```

Test specific service:
```bash
cd packages/openclaude-integration
npm test
```
```

**Deliverable**: Working OpenClaude IDE with backend integration

---

## 📊 Week 1 Success Criteria

**Must Have** ✅:
- [ ] Forked repository renamed to openclaude-ide
- [ ] OpenClaude branding visible (name, logo)
- [ ] Integration package created
- [ ] GraphQL client connecting to our backend
- [ ] At least 1 backend service working (Code Review)
- [ ] Can build and run locally
- [ ] Basic documentation

**Nice to Have** 🎯:
- [ ] Custom theme started
- [ ] Multiple services connected
- [ ] Tests passing
- [ ] CI/CD basic setup

---

## 🚀 Week 2-6 Preview

### Week 2: AI Features UI
- AI Code Review Panel
- Test Generation Panel
- Enhanced code completion UI

### Week 3: Collaboration UI
- Team Chat interface
- Comments panel
- Enhanced presence

### Week 4: Quality & Monitoring
- Monitoring dashboard
- Quality gates UI
- Testing integration

### Week 5: Polish & Extensions
- Custom themes finalized
- Extension marketplace
- Documentation

### Week 6: Deploy
- Production build
- Docker/K8s deployment
- **LAUNCH!** 🎉

---

## 📝 Documentation Updates

**Update README.md**:
```markdown
# OpenClaude IDE

AI-Powered IDE for Indian Developers, built on Eclipse Theia.

## Features

- 🤖 **AI Code Review** - Automated code quality analysis
- ✨ **Smart Completion** - Context-aware suggestions
- 🧪 **Test Generation** - AI-generated tests
- 👥 **Team Collaboration** - Real-time editing and chat
- 📊 **Quality Gates** - Code coverage enforcement
- 🔍 **Production Monitoring** - Real-time dashboards

## Built On

- [Eclipse Theia](https://theia-ide.org/) - IDE framework
- [Claude AI](https://anthropic.com/) - AI models
- TypeScript + React + GraphQL

## Quick Start

```bash
npm install
npm run build:browser
npm run start:browser
```

Open http://localhost:3000

## License

Built on Eclipse Theia (EPL-2.0)
OpenClaude additions: Proprietary

## Credits

Built on Eclipse Theia by the Eclipse Foundation.
Claude AI by Anthropic.
Developed by Ankr.in for Indian developers.
```

---

## 💡 Key Integration Points

**Our Backend Services → Theia Integration**:

1. **Terminal Service** → Extend `@theia/terminal`
2. **File System** → Extend `@theia/filesystem`
3. **Git Service** → Extend `@theia/scm`
4. **AI Review** → New `@openclaude/ai-review` package
5. **Test Gen** → New `@openclaude/test-gen` package
6. **Chat** → New `@openclaude/team-chat` package
7. **Monitoring** → New `@openclaude/monitoring` package
8. **Quality Gates** → New `@openclaude/quality` package

**Integration Strategy**:
- Use Theia's DI container
- Inject GraphQL client
- Call our backend APIs
- Render results in Theia UI

---

## 🎯 Immediate Next Steps

**Right Now**:
1. ✅ Week 1 plan created
2. [ ] Create/fork GitHub repository
3. [ ] Clone Theia and rename
4. [ ] Apply basic branding
5. [ ] Create integration package skeleton

**Tomorrow**:
1. [ ] Complete branding
2. [ ] Wire up GraphQL client
3. [ ] Connect first service
4. [ ] Test end-to-end

---

## ✅ Resources

**Theia Documentation**:
- Architecture: https://theia-ide.org/docs/architecture/
- Extensions: https://theia-ide.org/docs/extensions/
- DI Container: https://github.com/eclipse-theia/theia/blob/master/doc/Dependency-Injection.md

**Our Documentation**:
- Backend APIs: /root/OPENCODE-PROJECT-SUMMARY.md
- Theia Evaluation: /root/THEIA-DEEP-DIVE-EVALUATION.md
- Integration Plan: /root/TODO-INTEGRATE-WITH-THEIA.md

**Local Theia**:
- Repository: /tmp/theia
- Browser Example: /tmp/theia/examples/browser
- AI Packages: /tmp/theia/packages/ai-*

---

**Week 1 starts NOW! Let's build OpenClaude IDE! 🚀**
