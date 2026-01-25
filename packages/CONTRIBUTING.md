# Contributing to TesterBot

Thank you for your interest in contributing to TesterBot! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

**When reporting a bug, include:**
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- TesterBot version (`testerbot --version`)
- Environment (OS, Node version)
- Screenshots or logs if applicable

### Suggesting Enhancements

We welcome feature requests and enhancement suggestions!

**When suggesting an enhancement:**
- Use a clear and descriptive title
- Provide detailed description of the feature
- Explain why this enhancement would be useful
- Include examples of how it would work

### Pull Requests

1. **Fork the repository**

```bash
git clone https://github.com/YOUR-USERNAME/testerbot.git
cd testerbot
```

2. **Create a branch**

```bash
git checkout -b feature/my-new-feature
# or
git checkout -b fix/my-bug-fix
```

3. **Make your changes**

- Follow the coding style (see below)
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass

4. **Commit your changes**

```bash
git add .
git commit -m "feat: add new test type for API testing"
```

**Commit Message Convention:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

5. **Push and create PR**

```bash
git push origin feature/my-new-feature
```

Then create a pull request on GitHub.

## Development Setup

### Prerequisites

- Node.js 18+ and pnpm
- Git

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Run tests
pnpm test

# Link CLI for local testing
cd packages/testerbot-cli
npm link
```

### Project Structure

```
packages/
├── testerbot-core/       # Core orchestrator, types, reporter
├── testerbot-agents/     # Test agents (Desktop, Web, Mobile)
├── testerbot-tests/      # Test suites
├── testerbot-fixes/      # Auto-fix system
├── testerbot-cli/        # Command-line interface
└── testerbot-dashboard/  # Web dashboard (optional)
```

## Coding Style

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Add JSDoc comments for public APIs
- Use meaningful variable names

### Formatting

```bash
# Format code
pnpm format

# Lint code
pnpm lint
```

### Example

```typescript
/**
 * Execute a test and return the result
 * @param test - The test to execute
 * @param agent - The test agent to use
 * @returns Test result with status and metrics
 */
async function executeTest(
  test: Test,
  agent: TestAgent
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    await test.fn(agent);

    return {
      test,
      status: 'passed',
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      test,
      status: 'failed',
      duration: Date.now() - startTime,
      error: error as Error
    };
  }
}
```

## Writing Tests

### Test Structure

All tests should follow this structure:

```typescript
import { Test } from '@ankr/testerbot-core';
import { DesktopTestAgent } from '@ankr/testerbot-agents';

export const myTests: Test[] = [
  {
    id: 'app-test-001',
    name: 'Test name',
    description: 'What this test validates',
    type: 'smoke',
    app: 'my-app',
    tags: ['tag1', 'tag2'],
    timeout: 10000,
    fn: async (agent: DesktopTestAgent) => {
      // Test implementation
    }
  }
];
```

### Test Guidelines

1. **Use descriptive names**: `user-can-login` not `test1`
2. **Add tags**: Help categorize tests
3. **Set appropriate timeouts**: Based on test complexity
4. **Handle failures gracefully**: Clear error messages
5. **Clean up**: Reset state after test
6. **Avoid hardcoded waits**: Use `waitForElement` instead of `wait(5000)`

### Test Types

- **smoke**: Fast basic functionality checks (< 10s)
- **e2e**: Complete workflows (< 30s)
- **performance**: Benchmarking with thresholds (< 60s)
- **visual**: Screenshot comparison (< 15s)
- **stress**: Load testing (< 5min)
- **chaos**: Failure scenarios (< 30s)

## Writing Auto-Fixes

### Fix Structure

```typescript
import { Fix } from '@ankr/testerbot-fixes';

export const myFix: Fix = {
  id: 'my-fix-001',
  name: 'My Fix Name',
  description: 'What this fix does',
  category: 'environment',
  priority: 5,
  tags: ['config', 'setup'],

  canFix: (testResult) => {
    // Return true if this fix can handle the error
    return testResult.error?.message.includes('SPECIFIC_ERROR');
  },

  fix: async (testResult, agent) => {
    const actions: string[] = [];
    const state = {};

    // Perform fix
    // Record each action taken
    actions.push('Action description');

    return { actions, state };
  },

  verify: async (testResult, agent) => {
    // Verify fix worked
    // Return { success: true } or { success: false, reason: 'why' }
    return { success: true };
  },

  rollback: async (state) => {
    // Rollback changes if verification fails
    // Use saved state to restore
  }
};
```

### Fix Guidelines

1. **Specific error patterns**: Use `canFix` to match specific errors
2. **Record all actions**: Help users understand what was fixed
3. **Save state**: Enable rollback if fix fails
4. **Verify thoroughly**: Ensure fix actually worked
5. **Safe rollback**: Restore original state on failure

## Testing Your Changes

### Run Specific Tests

```bash
# Run smoke tests
testerbot run --app desktop --type smoke

# Run with your changes
cd packages/testerbot-cli
node dist/cli.js run --app desktop --type smoke
```

### Test Auto-Fixes

```bash
# Run with auto-fix enabled
testerbot run --app desktop --type smoke --auto-fix

# View fix statistics
testerbot fix-stats
```

### Run Full Test Suite

```bash
# Run all tests
pnpm test

# Run specific package tests
cd packages/testerbot-core
pnpm test
```

## Documentation

### Update Documentation

When adding features, update:

1. **README.md**: Add usage examples
2. **CHANGELOG.md**: Document changes
3. **JSDoc comments**: For public APIs
4. **Type definitions**: Keep types accurate

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep examples up-to-date

## Release Process

Maintainers follow this process for releases:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Publish to npm
5. Create GitHub release

## Getting Help

- **Questions**: Open a discussion on GitHub
- **Issues**: Report bugs via GitHub Issues
- **Chat**: Join our Discord server (link in README)

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- GitHub contributors page

Thank you for contributing to TesterBot! 🎉
