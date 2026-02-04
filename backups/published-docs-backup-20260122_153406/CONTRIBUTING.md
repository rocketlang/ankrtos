# Contributing to @ankr/vibecoding-tools

Thank you for your interest in contributing to vibecoding-tools! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Adding New Tools](#adding-new-tools)
- [Documentation](#documentation)
- [Release Process](#release-process)

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md) to maintain a welcoming and inclusive community.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ankr-labs-nx.git
   cd ankr-labs-nx/packages/vibecoding-tools
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Node.js 18.0.0 or later
- pnpm 8.0.0 or later
- TypeScript 5.3.0 or later

### Building

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run specific test file
pnpm test src/__tests__/security.test.ts

# Run with coverage
pnpm test -- --coverage
```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-new-tool` - New features
- `fix/rate-limit-bug` - Bug fixes
- `docs/update-readme` - Documentation changes
- `refactor/security-module` - Code refactoring
- `test/add-security-tests` - Test additions

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(security): add rate limiting module
fix(audit): correct timestamp formatting
docs(readme): add security section
test(sanitize): add XSS detection tests
```

## Testing

### Test Requirements

- All new code must have tests
- Maintain or improve test coverage
- Tests must pass before submitting PR

### Writing Tests

```typescript
// src/__tests__/my-feature.test.ts
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should do something', () => {
    // Arrange
    const input = { ... };

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| Unit | `src/__tests__/*.test.ts` | Individual functions |
| Integration | `src/__tests__/orchestration.test.ts` | Multi-component flows |
| Benchmark | `src/__tests__/benchmark.test.ts` | Performance |
| Security | `src/__tests__/security.test.ts` | Security features |

## Pull Request Process

1. **Update tests** - Add/update tests for your changes
2. **Update documentation** - Update README if needed
3. **Run tests** - Ensure all tests pass
4. **Create PR** - Use the PR template
5. **Request review** - Tag maintainers
6. **Address feedback** - Make requested changes
7. **Merge** - After approval and CI passes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added
- [ ] Coverage maintained

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Updated documentation
- [ ] No new warnings
```

## Coding Standards

### TypeScript

- Use strict TypeScript settings
- Explicit return types for public functions
- Use interfaces over types where appropriate
- Avoid `any` - use `unknown` if needed

```typescript
// Good
export function createTool(config: ToolConfig): MCPTool {
  return { ... };
}

// Avoid
export function createTool(config: any) {
  return { ... };
}
```

### File Organization

```
src/
  __tests__/          # Test files
  errors/             # Error handling
  integrations/       # External integrations
  orchestration/      # Pipeline/workflow
  security/           # Security features
  templates/          # Project templates
  tools/              # Tool implementations
  tutorials/          # Tutorial content
  validation/         # Code validation
  index.ts            # Main exports
  types.ts            # Type definitions
```

### Naming Conventions

- **Files**: kebab-case (`rate-limit.ts`)
- **Classes**: PascalCase (`AuditLogger`)
- **Functions**: camelCase (`createPipeline`)
- **Constants**: SCREAMING_SNAKE_CASE (`DEFAULT_CONFIG`)
- **Types/Interfaces**: PascalCase (`SecurityPolicy`)

## Adding New Tools

### Tool Structure

```typescript
// src/tools/my-tools.ts
import type { MCPTool, ToolResult } from '../types.js';

export const myNewTool: MCPTool = {
  name: 'my_new_tool',
  description: 'What this tool does',
  category: 'category-name',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Parameter description',
      },
    },
    required: ['param1'],
  },
  handler: async (input): Promise<ToolResult> => {
    // Implementation
    return {
      success: true,
      data: { ... },
    };
  },
};
```

### Registration

Add your tool to `src/tools/index.ts`:

```typescript
import { myNewTool } from './my-tools.js';

export const allTools: MCPTool[] = [
  ...existingTools,
  myNewTool,
];
```

### Tool Checklist

- [ ] Descriptive name following pattern
- [ ] Clear description
- [ ] Input schema with types
- [ ] Required fields specified
- [ ] Handler returns `ToolResult`
- [ ] Tests written
- [ ] Added to examples

## Documentation

### What to Document

- Public API functions
- Tool descriptions and examples
- Configuration options
- Breaking changes
- Migration guides

### Documentation Locations

| Type | Location |
|------|----------|
| API Reference | README.md |
| Tool Examples | examples/ |
| Changelog | CHANGELOG.md |
| Tutorials | src/tutorials/ |

### JSDoc Comments

```typescript
/**
 * Creates a new security policy manager
 *
 * @param policy - Partial policy configuration
 * @returns SecurityPolicyManager instance
 *
 * @example
 * ```typescript
 * const manager = createSecurityPolicy({ level: 'strict' });
 * ```
 */
export function createSecurityPolicy(
  policy?: Partial<SecurityPolicy>
): SecurityPolicyManager {
  return new SecurityPolicyManager(policy);
}
```

## Release Process

Releases are managed by maintainers following semantic versioning.

### Version Bumping

- **Patch** (1.0.x): Bug fixes
- **Minor** (1.x.0): New features, backward compatible
- **Major** (x.0.0): Breaking changes

### Release Checklist

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full test suite
4. Build package
5. Create release tag
6. Publish to npm

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Contact maintainers for security issues

---

Thank you for contributing!
