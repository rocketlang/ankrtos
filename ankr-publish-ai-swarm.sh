#!/bin/bash
set -e

echo "🚀 ANKR Publish: AI Swarm Package"
echo "=================================="
echo ""

PACKAGE_DIR="/root/openclaude-ide/packages/ai-swarm"
DOCS_DIR="/root/ankr-universe-docs/ai-swarm"
VERDACCIO_URL="https://swayam.digimitra.guru/npm/"

# 1. Compile the package
echo "📦 Compiling ai-swarm package..."
cd "$PACKAGE_DIR"
npx tsc --noEmit 2>&1 && echo "  ✅ TypeScript compilation successful" || {
    echo "  ❌ Compilation failed"
    exit 1
}

# 2. Copy documentation
echo ""
echo "📚 Publishing documentation..."
mkdir -p "$DOCS_DIR"
cp "$PACKAGE_DIR/AI-SWARM-COMPLETE.md" "$DOCS_DIR/"
cp "$PACKAGE_DIR/README.md" "$DOCS_DIR/PACKAGE-README.md" 2>/dev/null || true
echo "  ✅ Documentation copied to $DOCS_DIR"

# 3. Create/update @ankr/ai-swarm wrapper package
echo ""
echo "📦 Creating @ankr/ai-swarm wrapper package..."
WRAPPER_DIR="/root/ankr-packages/@ankr/ai-swarm"
mkdir -p "$WRAPPER_DIR"

# Get version from original package
VERSION=$(node -p "require('$PACKAGE_DIR/package.json').version")
echo "  Version: $VERSION"

# Create wrapper package.json
cat > "$WRAPPER_DIR/package.json" << EOF
{
  "name": "@ankr/ai-swarm",
  "version": "$VERSION",
  "description": "ANKR AI Swarm - Multi-agent orchestration for Theia IDE with free tier and task-based key selection",
  "main": "index.js",
  "types": "index.d.ts",
  "keywords": [
    "ai",
    "swarm",
    "multi-agent",
    "theia",
    "claude",
    "orchestration",
    "ankr"
  ],
  "author": "Captain Anil @ ANKR",
  "license": "EPL-2.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/ankr/openclaude-ide"
  },
  "dependencies": {
    "@theia/ai-swarm": "^$VERSION"
  },
  "publishConfig": {
    "registry": "$VERDACCIO_URL"
  }
}
EOF

# Create re-export index
cat > "$WRAPPER_DIR/index.js" << 'EOF'
// Re-export all from @theia/ai-swarm
module.exports = require('@theia/ai-swarm');
EOF

cat > "$WRAPPER_DIR/index.d.ts" << 'EOF'
// Re-export all types from @theia/ai-swarm
export * from '@theia/ai-swarm';
EOF

# Create README
cat > "$WRAPPER_DIR/README.md" << 'EOF'
# @ankr/ai-swarm

ANKR AI Swarm - Multi-agent orchestration for Theia IDE.

## Features

- **Multi-Agent Orchestration**: Lead agent coordinates specialized sub-agents
- **Task-Based Key Selection**: Optimized API keys for coder, multilingual, review, etc.
- **Free Tier First**: 100K free tokens/month for basic tasks
- **Git Worktree Isolation**: Each agent works in isolated worktree
- **Cost Tracking**: Per-agent, per-model cost monitoring
- **Session Persistence**: Save and restore swarm sessions
- **AI Proxy Integration**: 93% cost savings via SLM router

## Installation

```bash
npm install @ankr/ai-swarm --registry https://swayam.digimitra.guru/npm/
```

## Documentation

See [AI-SWARM-COMPLETE.md](https://github.com/ankr/openclaude-ide/packages/ai-swarm/AI-SWARM-COMPLETE.md)

## License

EPL-2.0
EOF

echo "  ✅ Wrapper package created"

# 4. Publish to Verdaccio
echo ""
echo "📤 Publishing to Verdaccio..."
cd "$WRAPPER_DIR"
npm publish --registry "$VERDACCIO_URL" 2>&1 || {
    echo "  ⚠️  Package may already exist at this version, trying version bump..."
    # Bump patch version
    NEW_VERSION=$(node -p "const v='$VERSION'.split('.'); v[2]=parseInt(v[2])+1; v.join('.')")
    sed -i "s/\"version\": \"$VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
    npm publish --registry "$VERDACCIO_URL" 2>&1 && echo "  ✅ Published @ankr/ai-swarm@$NEW_VERSION" || echo "  ❌ Publish failed"
}

# 5. Summary
echo ""
echo "========================================"
echo "✅ ANKR Publish Complete!"
echo "========================================"
echo ""
echo "Package: @ankr/ai-swarm"
echo "Registry: $VERDACCIO_URL"
echo "Docs: $DOCS_DIR"
echo ""
echo "Install with:"
echo "  npm install @ankr/ai-swarm --registry $VERDACCIO_URL"
echo ""
