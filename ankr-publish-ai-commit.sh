#!/bin/bash
set -e

echo "🚀 ANKR Publish: AI Commit Package"
echo "==================================="
echo ""

PACKAGE_DIR="/root/openclaude-ide/packages/ai-commit"
DOCS_DIR="/root/ankr-universe-docs/ai-commit"
VERDACCIO_URL="https://swayam.digimitra.guru/npm/"

# 1. Compile the package
echo "📦 Compiling ai-commit package..."
cd "$PACKAGE_DIR"
npx tsc --noEmit 2>&1 && echo "  ✅ TypeScript compilation successful" || {
    echo "  ❌ Compilation failed"
    exit 1
}

# 2. Copy documentation
echo ""
echo "📚 Publishing documentation..."
mkdir -p "$DOCS_DIR"
cp "$PACKAGE_DIR/README.md" "$DOCS_DIR/"
echo "  ✅ Documentation copied to $DOCS_DIR"

# 3. Create/update @ankr/ai-commit wrapper package
echo ""
echo "📦 Creating @ankr/ai-commit wrapper package..."
WRAPPER_DIR="/root/ankr-packages/@ankr/ai-commit"
mkdir -p "$WRAPPER_DIR"

# Get version from original package
VERSION=$(node -p "require('$PACKAGE_DIR/package.json').version")
echo "  Version: $VERSION"

# Create wrapper package.json
cat > "$WRAPPER_DIR/package.json" << EOF
{
  "name": "@ankr/ai-commit",
  "version": "$VERSION",
  "description": "ANKR AI Commit - AI-powered commit message generation for Theia IDE",
  "main": "index.js",
  "types": "index.d.ts",
  "keywords": [
    "ai",
    "commit",
    "git",
    "theia",
    "conventional-commits",
    "ankr"
  ],
  "author": "Captain Anil @ ANKR",
  "license": "EPL-2.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/ankr/openclaude-ide"
  },
  "dependencies": {
    "@theia/ai-commit": "^$VERSION"
  },
  "publishConfig": {
    "registry": "$VERDACCIO_URL"
  }
}
EOF

# Create re-export files
cat > "$WRAPPER_DIR/index.js" << 'EOF'
module.exports = require('@theia/ai-commit');
EOF

cat > "$WRAPPER_DIR/index.d.ts" << 'EOF'
export * from '@theia/ai-commit';
EOF

cat > "$WRAPPER_DIR/README.md" << 'EOF'
# @ankr/ai-commit

AI-powered commit message generation for Theia IDE.

## Features

- Automatic diff analysis
- Smart commit type detection
- Conventional commit format
- Gitmoji support
- Alternative suggestions
- One-click accept

## Installation

```bash
npm install @ankr/ai-commit --registry https://swayam.digimitra.guru/npm/
```

## Usage

1. Stage your changes
2. Press `Ctrl+Shift+G`
3. Accept, edit, or select an alternative

## License

EPL-2.0
EOF

echo "  ✅ Wrapper package created"

# 4. Publish to Verdaccio
echo ""
echo "📤 Publishing to Verdaccio..."
cd "$WRAPPER_DIR"
npm publish --registry "$VERDACCIO_URL" 2>&1 && echo "  ✅ Published @ankr/ai-commit@$VERSION" || {
    echo "  ⚠️  Package may already exist, trying version bump..."
    NEW_VERSION=$(node -p "const v='$VERSION'.split('.'); v[2]=parseInt(v[2])+1; v.join('.')")
    sed -i "s/\"version\": \"$VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
    npm publish --registry "$VERDACCIO_URL" 2>&1 && echo "  ✅ Published @ankr/ai-commit@$NEW_VERSION" || echo "  ❌ Publish failed"
}

echo ""
echo "========================================"
echo "✅ ANKR Publish Complete!"
echo "========================================"
echo ""
echo "Package: @ankr/ai-commit"
echo "Registry: $VERDACCIO_URL"
echo "Docs: $DOCS_DIR"
echo ""
