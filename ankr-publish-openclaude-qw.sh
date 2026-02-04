#!/bin/bash
# Ankr Publish - OpenClaude Quick Wins Completion Documentation
# Generated: $(date)

set -e

echo "=== OpenClaude Quick Wins - Publishing Documentation ==="
echo ""

DOCS_DIR="/root/ankr-universe-docs/openclaude"
REGISTRY="https://swayam.digimitra.guru/npm/"

# Create index if not exists
if [ ! -f "$DOCS_DIR/index.md" ]; then
    cat > "$DOCS_DIR/index.md" << 'INDEXEOF'
# OpenClaude IDE Documentation

AI-powered IDE extension packages for Theia.

## Quick Wins Packages

| Package | Version | Status |
|---------|---------|--------|
| @ankr/ai-search | 1.67.0 | ✅ Published |
| @ankr/ai-commit | 1.67.0 | ✅ Published |
| @ankr/ai-explain | 1.67.0 | ✅ Published |

## Documentation

- [Quick Wins Completion Report](./OPENCLAUDE-QW-COMPLETION.md)
- [AI Search README](../ai-search/README.md)
- [AI Commit README](../ai-commit/README.md)
- [AI Explain README](../ai-explain/README.md)

## Installation

```bash
npm config set registry https://swayam.digimitra.guru/npm/
npm install @ankr/ai-search @ankr/ai-commit @ankr/ai-explain
```

## Repository

All packages are built for OpenClaude IDE (Theia-based).
INDEXEOF
    echo "Created index.md"
fi

# Summary
echo ""
echo "=== Published Documentation ==="
echo "Location: $DOCS_DIR"
echo ""
echo "Files:"
ls -la "$DOCS_DIR"/*.md
echo ""
echo "=== Quick Wins Summary ==="
echo "✅ QW-1: AI Search (@ankr/ai-search@1.67.0)"
echo "✅ QW-2: AI Commit (@ankr/ai-commit@1.67.0)"
echo "✅ QW-3: AI Explain (@ankr/ai-explain@1.67.0)"
echo ""
echo "Registry: $REGISTRY"
echo "=== Documentation Published Successfully ==="
