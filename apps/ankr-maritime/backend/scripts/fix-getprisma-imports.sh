#!/bin/bash
# Fix files where getPrisma import is inside comment blocks

echo "🔍 Finding files with misplaced getPrisma imports..."

# Find all TypeScript files that use getPrisma but have the import in the wrong place
find src -name "*.ts" -type f | while read file; do
  # Check if file uses getPrisma but import is inside a comment block
  if grep -q "await getPrisma()" "$file"; then
    # Check if the import line comes before the first /** comment
    first_import_line=$(grep -n "^import.*getPrisma" "$file" | head -1 | cut -d: -f1)
    first_comment_line=$(grep -n "^/\*\*" "$file" | head -1 | cut -d: -f1)

    if [ -n "$first_import_line" ] && [ -n "$first_comment_line" ] && [ "$first_import_line" -lt "$first_comment_line" ]; then
      echo "  ✅ $file (import already correct)"
    else
      echo "  🔧 Fixing $file"

      # Create a temp file
      temp_file=$(mktemp)

      # Remove the misplaced import line
      sed '/^import { getPrisma } from/d' "$file" > "$temp_file"

      # Add the import after the comment block
      awk '
        BEGIN { added = 0 }
        /^\*\// {
          print
          if (!added) {
            print ""
            print "import { getPrisma } from '"'"'../lib/db.js'"'"';"
            added = 1
          }
          next
        }
        { print }
      ' "$temp_file" > "$file"

      rm "$temp_file"
    fi
  fi
done

echo "✅ All files fixed!"
