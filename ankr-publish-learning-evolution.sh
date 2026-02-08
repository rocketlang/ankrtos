#!/bin/bash

echo "🎓 === ANKR Learning Evolution Publishing === 🎓"
echo ""
echo "Publishing ANKR Learning K-12 LMS project to https://ankr.in/"
echo ""

SOURCE_DIR="/root/ankr-labs-nx/packages/ankr-learning"
TARGET_DIR="/root/ankr-universe-docs/project/documents/ankr-learning"

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

echo "📚 ANKR Learning Evolution Documentation to Publish:"
echo ""

# Files to publish
FILES_TO_PUBLISH=(
  "PROJECT_REPORT.md:report"
)

for entry in "${FILES_TO_PUBLISH[@]}"; do
  IFS=':' read -r FILE CATEGORY <<< "$entry"

  if [ -f "$SOURCE_DIR/$FILE" ]; then
    echo "  📤 Publishing: $FILE"

    # Copy to ankr-universe-docs
    cp "$SOURCE_DIR/$FILE" "$TARGET_DIR/$FILE"

    # Index with EON
    echo "📤 Publishing $FILE..."
    node /root/ankr-labs-nx/packages/ankr-eon/dist/cli/cli.js ingest \
      --file "$TARGET_DIR/$FILE" \
      --category "$CATEGORY" \
      --tags "k12,lms,education,cbse,icse,cambridge,adaptive-learning,ai-tutor" \
      --source "ankr-learning"

    echo "  ✅ Published: $FILE"
    echo "  🔗 https://ankr.in/project/documents/ankr-learning/$FILE"
    echo ""
  else
    echo "  ⚠️  File not found: $SOURCE_DIR/$FILE"
  fi
done

echo ""
echo "✅ === Publishing Complete === ✅"
echo ""
echo "📖 View at: https://ankr.in/project/documents/ankr-learning/"
echo ""
