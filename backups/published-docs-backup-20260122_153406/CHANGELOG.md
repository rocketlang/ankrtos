# Changelog

All notable changes to `@ankr/vibecoding-tools` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2026-01-18

### Added

#### Phase 9: Public Release Prep (Complete)

- **Documentation**
  - Comprehensive README with full API reference
  - Migration guide for v2.0
  - Security, rate limiting, and audit logging documentation

- **Community Files**
  - `CONTRIBUTING.md` - Contribution guidelines
  - `CODE_OF_CONDUCT.md` - Community code of conduct
  - `LICENSE` - MIT license

- **GitHub Templates**
  - `.github/ISSUE_TEMPLATE/bug_report.md`
  - `.github/ISSUE_TEMPLATE/feature_request.md`
  - `.github/ISSUE_TEMPLATE/config.yml`
  - `.github/PULL_REQUEST_TEMPLATE.md`

### Changed

- Updated `files` in package.json to include all documentation

---

## [2.0.0] - 2026-01-18

### Added

#### Phase 8: Security & Compliance (Complete)

- **Input Sanitization Module** (`src/security/sanitize.ts`)
  - `sanitizeString()` - HTML entity escaping, control char removal
  - `sanitizeCode()` - Code-aware sanitization preserving structure
  - `sanitizeObject()` - Recursive object sanitization
  - `detectDangerousPatterns()` - Detect SQL injection, XSS, path traversal
  - `sanitizeToolInput()` - Full tool input sanitization with warnings
  - `sanitizePath()` - Path traversal prevention
  - `isValidFileName()` - Filename validation

- **Rate Limiting Module** (`src/security/rate-limit.ts`)
  - `createRateLimiter()` - Create rate limiter instance
  - `getRateLimiter()` - Global rate limiter singleton
  - `checkRateLimit()` - Check rate limit for tool
  - `withRateLimit()` - Middleware wrapper for rate limiting
  - `RateLimitError` - Custom error class
  - Pre-configured profiles: `strict`, `standard`, `relaxed`, `unlimited`, `perTool`

- **Audit Logging Module** (`src/security/audit.ts`)
  - `createAuditLogger()` - Create audit logger instance
  - `getAuditLogger()` - Global audit logger singleton
  - Event types: `tool_executed`, `tool_failed`, `rate_limited`, `security_warning`, `secret_detected`, `policy_violation`
  - `logToolExecution()` - Log tool execution with duration
  - `logRateLimit()`, `logSecurityWarning()`, `logSecretDetected()`, `logPolicyViolation()`
  - Sensitive field masking (password, apiKey, token, etc.)
  - Export to JSON/CSV formats
  - Event statistics and filtering

- **Security Policy Module** (`src/security/policy.ts`)
  - `createSecurityPolicy()` - Create policy manager
  - `getSecurityPolicy()` - Global policy singleton
  - Security levels: `strict`, `standard`, `relaxed`, `custom`
  - Tool permissions with wildcard patterns
  - Input validation (size, file extensions, blocked paths)
  - Feature flags: `allowNetworkRequests`, `allowFileSystem`, `allowShellExecution`
  - `blockTool()`, `allowTool()`, `setSecurityLevel()` helpers

- **Security Middleware** (`src/security/index.ts`)
  - `SecurityMiddleware` class - Unified security layer
  - `withSecurity()` - Wrap tool handler with security
  - `security` helper object with quick configuration methods
  - Integration with `executeTool()` - security enabled by default

### Changed

- **BREAKING:** `executeTool()` now has optional third parameter `options: ExecuteToolOptions`
  - `security?: boolean` - Enable/disable security (default: true)
  - `userId?: string` - User ID for audit logging
  - `sessionId?: string` - Session ID for audit logging
- **BREAKING:** `ExecuteToolResult` now includes `securityCheck` and `warnings` fields
- Added `SECURITY_BLOCKED` and `RATE_LIMITED` error codes
- Package version: 2.0.0

### Tests

- Added `src/__tests__/security.test.ts` with 69 tests
- Total tests: 356 (11 test files)

### Security Features Summary

| Feature | Description |
|---------|-------------|
| Input Sanitization | XSS, SQL injection, command injection prevention |
| Rate Limiting | Configurable limits per tool with profiles |
| Audit Logging | Full execution logging with sensitive data masking |
| Security Policies | Tool permissions, input validation, feature flags |
| Middleware | Unified security layer with automatic integration |

---

## [1.9.0] - 2026-01-18

### Added

#### Phase 7: Developer Experience (Complete)

- **Interactive CLI Tutorials** (8 lessons, 42 tests)
  - `src/tutorials/lessons.ts` - 8 comprehensive lessons
  - `src/tutorials/runner.ts` - Interactive terminal UI
  - `src/tutorials/index.ts` - Tutorial API exports
  - `src/tutorial-cli.ts` - CLI entry point
  - New bin: `vibecoding-tutorial`
  - Lessons: getting-started, vibe-analysis, code-generation, enterprise-setup, validation, pipelines, logistics, smart-generation
  - Color-coded terminal output with syntax highlighting
  - Progress tracking and lesson export to markdown

### Changed

- Added `vibecoding-tutorial` CLI command
- Total tests: 287 (10 test files)

---

## [1.8.0] - 2026-01-18

### Added

#### Phase 7: Developer Experience (Part 1)

- **Examples Gallery** (6 files, 34+ examples)
  - `examples/README.md` - Comprehensive gallery with all 34 tools
  - `examples/quick-start.ts` - Quick start examples (8 examples)
  - `examples/enterprise-setup.ts` - Enterprise API setup examples
  - `examples/pipelines.ts` - Pipeline orchestration examples (8 pipelines)
  - `examples/domain-logistics.ts` - Logistics domain examples
  - `examples/domain-compliance.ts` - Indian compliance examples

- **Error Handling Module** (27 new tests)
  - `src/errors/index.ts` - Comprehensive error handling
  - 16 error codes with helpful suggestions
  - Similar tool name suggestions for TOOL_NOT_FOUND
  - Input validation with detailed error messages
  - Documentation links for common errors
  - `createError()`, `formatError()`, `validateToolInput()`

### Changed

- Updated `executeTool()` with improved error handling
- Errors now include suggestions and documentation links
- Input validation happens before tool execution

### Tests

- Added `errors.test.ts` with 27 tests
- Total tests: 245 (9 test files)

---

## [1.7.0] - 2026-01-18

### Added

#### Phase 6: Quality Assurance (Complete)

- **Performance Benchmarks** (23 tests)
  - Comprehensive benchmark suite for all 34 tools
  - Measures execution time, memory delta, and throughput (ops/sec)
  - New `pnpm test:bench` script for running benchmarks
  - Average tool execution: 0.46ms
  - Fastest: `generate_shipment_ui` (0ms, 273K ops/sec)
  - Slowest: `smart_util` (2.63ms, 380 ops/sec)

- **Test Suite Expansion** (218 total tests)
  - `benchmark.test.ts` - 23 performance benchmark tests
  - `orchestration.test.ts` - 32 pipeline and workflow tests
  - `validation-tools.test.ts` - 29 validation tool tests
  - `domain-tools.test.ts` - 44 domain tool tests
  - `enterprise-generate.test.ts` - 26 enterprise tool tests
  - `smart-generate.test.ts` - 23 smart generation tests
  - `scaffold.test.ts` - 25 scaffolding tests
  - `vibe-analyze.test.ts` - 16 analysis tests

- **GitHub Actions CI/CD**
  - Automated test runs on push/PR
  - Build verification
  - Type checking
  - ESLint validation
  - Coverage reporting (Codecov integration)

### Changed

- Updated `package.json` with `test:bench` script
- Added `@vitest/coverage-v8` to devDependencies

### Performance

| Category | Tools | Avg Time | Throughput |
|----------|-------|----------|------------|
| Enterprise | 4 | 0.01ms | 200K+ ops/sec |
| Domain | 4 | 0.01ms | 100K+ ops/sec |
| Vibe Analysis | 3 | 0.01ms | 100K+ ops/sec |
| Scaffold | 2 | 0.01ms | 70K+ ops/sec |
| Validation | 3 | 0.03ms | 50K+ ops/sec |
| Smart Generation | 4 | 2.3ms | 400+ ops/sec |

---

## [1.6.0] - 2026-01-18

### Added

#### Phase 5: MCP Orchestration

- **Orchestration Layer**
  - `executePipeline()` - Sequential/parallel tool execution
  - `createPipeline()` - Pipeline configuration builder
  - `createParallelPipeline()` - Parallel execution builder
  - Variable references (`$stepName.field`, `$global.field`)
  - Step conditions and error handling

- **Pre-defined Workflows** (9 workflows)
  - `fullstack-feature` - UI + API + tests
  - `enterprise-api-setup` - Auth + docs + Docker
  - `microservice-deploy` - Docker + K8s + CI
  - `validated-component` - Component + validation
  - `quality-refactor` - Before/after quality check
  - `logistics-feature` - Shipment UI + tracking API
  - `compliance-feature` - GST form + invoice
  - `crm-feature` - Lead form + contact UI
  - `erp-feature` - Inventory UI + order flow

- **Domain-Specific Tools** (8 tools)
  - Logistics: `generate_shipment_ui`, `generate_tracking_api`
  - Compliance: `generate_gst_form`, `generate_invoice_template`
  - CRM: `generate_lead_form`, `generate_contact_ui`
  - ERP: `generate_inventory_ui`, `generate_order_flow`

---

## [1.5.0] - 2026-01-17

### Added

#### Phase 3: Enterprise Templates

- **Enterprise Project Templates** (4 templates)
  - `enterprise-api` - Auth, RBAC, logging, metrics, OpenAPI
  - `enterprise-frontend` - Auth flow, error boundaries, i18n
  - `enterprise-fullstack` - Monorepo with shared types, CI/CD
  - `microservice` - Docker, K8s, gRPC, message queue

- **Enterprise Generation Tools** (8 tools)
  - `generate_auth_flow` - JWT/OAuth authentication
  - `generate_api_docs` - OpenAPI/Swagger documentation
  - `generate_docker` - Multi-stage Dockerfile + compose
  - `generate_ci_pipeline` - GitHub Actions / GitLab CI
  - `generate_k8s_manifests` - Deployment, Service, HPA
  - `generate_error_handling` - Custom error classes
  - `generate_logging` - Structured logging (JSON/text)
  - `generate_tests` - Vitest setup with mocking

#### Phase 4: Validation & Quality

- **Validation Module**
  - `validateTypeScript()` - TypeScript validation with tsc
  - `lintCode()` - ESLint code linting
  - `scanCode()` - Security vulnerability scanning
  - `validateImports()` - Import resolution validation
  - `calculateQualityMetrics()` - Quality metrics calculation

- **Validation Tools** (3 tools)
  - `validate_code` - Comprehensive code validation
  - `security_scan` - Security vulnerability scanning
  - `quality_check` - Quality metrics calculation

---

## [1.4.0] - 2026-01-17

### Added

#### Phase 2: AI-Powered Generation

- **Smart Generation Tools** (4 tools)
  - `smart_component` - AI-powered component generation with RAG
  - `smart_api` - Context-aware API route generation
  - `smart_refactor` - Codebase-aware code refactoring
  - `smart_util` - AI-powered utility function generation

- **Integration Modules**
  - `src/integrations/rag.ts` - RAG context building
  - `src/integrations/eon.ts` - EON memory system integration

---

## [1.3.0] - 2026-01-17

### Added

#### Phase 1: ANKR Integration

- **ANKR5 CLI Integration**
  - Dynamic port lookup via `ankr5 ports get`
  - Service URL construction
  - Gateway status checks
  - RAG context building
  - EON memory storage/recall

- **Configuration Module**
  - `@ankr/config` integration for port management
  - Dynamic URL generation
  - Service discovery

---

## [1.2.0] - 2026-01-16

### Added

- Initial MCP tools package
- Core analysis tools: `vibe_analyze`, `vibe_score`, `vibe_compare`
- Scaffolding tools: `scaffold_project`, `scaffold_project_smart`, `scaffold_module`
- Code generation tools: `generate_component`, `generate_route`
- API generation tools: `generate_api_route`, `generate_graphql_resolver`

---

## Tool Reference

### All 34 Tools by Category

| Category | Tools |
|----------|-------|
| Vibe Analysis (3) | `vibe_analyze`, `vibe_score`, `vibe_compare` |
| Scaffold (3) | `scaffold_project`, `scaffold_project_smart`, `scaffold_module` |
| Smart Generation (4) | `smart_component`, `smart_api`, `smart_refactor`, `smart_util` |
| Enterprise (8) | `generate_auth_flow`, `generate_api_docs`, `generate_docker`, `generate_ci_pipeline`, `generate_k8s_manifests`, `generate_error_handling`, `generate_logging`, `generate_tests` |
| Logistics (2) | `generate_shipment_ui`, `generate_tracking_api` |
| Compliance (2) | `generate_gst_form`, `generate_invoice_template` |
| CRM (2) | `generate_lead_form`, `generate_contact_ui` |
| ERP (2) | `generate_inventory_ui`, `generate_order_flow` |
| Validation (3) | `validate_code`, `security_scan`, `quality_check` |
| Code Generation (3) | `generate_component`, `generate_route`, `generate_api_route` |
| API Generation (2) | `generate_graphql_resolver`, `generate_rest_endpoint` |

---

*Maintained by ANKR Labs*
