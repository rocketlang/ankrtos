#!/bin/bash
# Re-publish packages with fixed versions

echo "📤 Re-publishing Fixed Packages"
echo "================================"
echo ""

PACKAGES_DIR="/root/ankr-labs-nx/packages"
REGISTRY="http://localhost:4873"

# Packages we just fixed
FIXED_PACKAGES=(
  "ankr-brain"
  "ankr-learning"
  "ankr-ocr"
  "document-ai"
)

SUCCESS=0
FAILED=0
declare -a PUBLISHED=()
declare -a FAILED_PUBLISH=()

for pkg_name in "${FIXED_PACKAGES[@]}"; do
  echo "Processing: $pkg_name"
  
  PKG_DIR="$PACKAGES_DIR/$pkg_name"
  
  if [ ! -d "$PKG_DIR" ]; then
    echo "  ⚠️  Directory not found"
    ((FAILED++))
    continue
  fi
  
  PKG_FULL=$(cat "$PKG_DIR/package.json" | jq -r '.name')
  PKG_VER=$(cat "$PKG_DIR/package.json" | jq -r '.version')
  
  echo "  → $PKG_FULL@$PKG_VER"
  
  # Unpublish old version first
  echo "  🗑️  Unpublishing old version..."
  npm unpublish "$PKG_FULL@$PKG_VER" --registry="$REGISTRY" --force 2>/dev/null || true
  
  # Publish new version
  echo "  📤 Publishing with fixed dependencies..."
  cd "$PKG_DIR"
  if npm publish --registry="$REGISTRY" --force 2>&1 | grep -q "published\|updated"; then
    echo "  ✅ Published successfully"
    ((SUCCESS++))
    PUBLISHED+=("$PKG_FULL@$PKG_VER")
  else
    echo "  ⚠️  Publish failed"
    ((FAILED++))
    FAILED_PUBLISH+=("$PKG_FULL")
  fi
  
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Re-publish Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Success: $SUCCESS"
echo "Failed: $FAILED"
echo ""

if [ ${#PUBLISHED[@]} -gt 0 ]; then
  echo "✅ Successfully published:"
  for pkg in "${PUBLISHED[@]}"; do
    echo "   $pkg"
  done
fi

if [ ${#FAILED_PUBLISH[@]} -gt 0 ]; then
  echo ""
  echo "❌ Failed:"
  for pkg in "${FAILED_PUBLISH[@]}"; do
    echo "   $pkg"
  done
fi

echo ""
echo "Next: Test installations"
