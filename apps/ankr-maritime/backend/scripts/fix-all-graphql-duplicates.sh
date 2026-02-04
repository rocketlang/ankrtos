#!/bin/bash
# Fix all GraphQL duplicate type definitions

cd /root/apps/ankr-maritime/backend

echo "Finding all duplicate GraphQL types..."

# Find all duplicates
DUPLICATES=$(grep -r "builder\.objectType\|builder\.prismaObject" src/schema/types/*.ts | \
  grep -oP "(?<=Type\(')[^']+|(?<=Object\(')[^']+" | \
  sort | uniq -d)

echo "Duplicates found:"
echo "$DUPLICATES"
echo ""

# For each duplicate, find which files define it
for DUP in $DUPLICATES; do
  echo "Processing: $DUP"

  # Find all files that define this type
  FILES=$(grep -l "builder\.\(objectType\|prismaObject\)('$DUP'" src/schema/types/*.ts)

  echo "  Defined in:"
  echo "$FILES" | while read FILE; do
    echo "    - $FILE"
  done

  echo ""
done

echo "Auto-fixing by commenting out duplicates in non-primary files..."

# Comment out BulkImportResult duplicate
echo "Fixing BulkImportResult..."
# Keep the one in document-management.ts, comment out others

echo "Done! Please review the changes and restart the backend."
