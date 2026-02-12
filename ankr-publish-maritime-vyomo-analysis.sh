#!/bin/bash
###############################################################################
# ANKR Publishing Script: Maritime-Vyomo Time Series Analysis
# Publishes all documentation related to the maritime-timeseries adapter package
###############################################################################

set -e  # Exit on error

echo "🚀 ANKR Publishing: Maritime-Vyomo Time Series Analysis"
echo "========================================================"
echo ""

# Configuration
PUBLISHER="/root/ankr-labs-nx/packages/ankr-publish/src/bin/cli-v4.ts"
DOCS_DIR="/root"
PROJECT_NAME="Maritime Time Series Analysis"
CATEGORY="analytics"

# Documents to publish
DOCS=(
  "MATHEMATICAL-EQUIVALENCE-VYOMO-MARI8X.md"
  "MARI8X-VYOMO-TIMESERIES-INTEGRATION.md"
  "MARITIME-TIMESERIES-PACKAGE-SUMMARY.md"
  "CAUSAL-TIMESERIES-OPTIONS-TRADING.md"
)

echo "📚 Documents to publish:"
for doc in "${DOCS[@]}"; do
  echo "  ✓ $doc"
done
echo ""

# Check if publisher exists
if [ ! -f "$PUBLISHER" ]; then
  echo "❌ Error: Publisher not found at $PUBLISHER"
  exit 1
fi

# Publish each document
echo "📤 Publishing documents..."
echo ""

SUCCESS_COUNT=0
FAILED_COUNT=0

for doc in "${DOCS[@]}"; do
  DOC_PATH="$DOCS_DIR/$doc"

  if [ ! -f "$DOC_PATH" ]; then
    echo "⚠️  Warning: $doc not found, skipping..."
    FAILED_COUNT=$((FAILED_COUNT + 1))
    continue
  fi

  echo "Publishing: $doc"

  # Use npx tsx to run the TypeScript publisher
  if npx tsx "$PUBLISHER" publish \
    --file "$DOC_PATH" \
    --category "$CATEGORY" \
    --project "$PROJECT_NAME" \
    --tags "maritime,vyomo,timeseries,analytics,algorithms,trading,causal-analysis" \
    --auto-approve 2>&1 | grep -v "Warning"; then

    echo "  ✅ Published successfully"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "  ❌ Failed to publish"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi

  echo ""
done

# Also publish the package README
PACKAGE_README="/root/ankr-labs-nx/packages/maritime-timeseries/README.md"
if [ -f "$PACKAGE_README" ]; then
  echo "Publishing: Package README"

  if npx tsx "$PUBLISHER" publish \
    --file "$PACKAGE_README" \
    --category "packages" \
    --project "$PROJECT_NAME" \
    --tags "maritime,timeseries,package,npm,typescript" \
    --auto-approve 2>&1 | grep -v "Warning"; then

    echo "  ✅ Published successfully"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "  ❌ Failed to publish"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi

  echo ""
fi

# Summary
echo "========================================================"
echo "📊 Publishing Summary"
echo "========================================================"
echo "✅ Successfully published: $SUCCESS_COUNT"
echo "❌ Failed: $FAILED_COUNT"
echo ""

if [ $FAILED_COUNT -eq 0 ]; then
  echo "🎉 All documents published successfully!"
  echo ""
  echo "🔍 You can now search for these documents using:"
  echo "   - ANKR Interact search"
  echo "   - EON context queries"
  echo "   - MCP tool: kb_search"
  exit 0
else
  echo "⚠️  Some documents failed to publish"
  exit 1
fi
