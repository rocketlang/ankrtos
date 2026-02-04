#!/bin/bash
# Import PDFs into ANKR LMS
# Usage: ./import-pdfs-to-lms.sh /path/to/pdfs/*.pdf

set -e

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="ankr_eon"
DB_USER="ankr"
DB_PASS="indrA@0612"
LMS_API="http://localhost:3199"
ADMIN_USER="admin@ankr.demo"

echo "🔍 ANKR LMS PDF Import Tool"
echo "============================"

# Get admin user ID
ADMIN_ID=$(PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -t -c \
  "SELECT id FROM users WHERE email = '$ADMIN_USER' LIMIT 1;" | xargs)

if [ -z "$ADMIN_ID" ]; then
  echo "❌ Admin user not found: $ADMIN_USER"
  exit 1
fi

echo "✅ Admin user: $ADMIN_USER (ID: $ADMIN_ID)"
echo ""

# Process each PDF
for pdf_file in "$@"; do
  if [ ! -f "$pdf_file" ]; then
    echo "⚠️  Skipping (not found): $pdf_file"
    continue
  fi

  echo "📄 Processing: $(basename "$pdf_file")"

  # Extract filename without extension
  filename=$(basename "$pdf_file" .pdf)
  slug=$(echo "$filename" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')

  # Check if document already exists
  existing=$(PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM documents WHERE slug = '$slug';" | xargs)

  if [ "$existing" -gt 0 ]; then
    echo "   ⚠️  Already exists (slug: $slug), skipping"
    continue
  fi

  # Extract PDF text (requires pdftotext from poppler-utils)
  if command -v pdftotext &> /dev/null; then
    content=$(pdftotext "$pdf_file" - 2>/dev/null | head -c 50000) # Limit to 50KB
  else
    content="[PDF content - install poppler-utils to extract text]"
  fi

  # Escape single quotes for SQL
  content_escaped=$(echo "$content" | sed "s/'/''/g")
  title="$filename"

  # Insert into database
  doc_id=$(PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -t -c \
    "INSERT INTO documents (
      id, title, slug, content, file_path,
      user_id, is_published, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      '$title',
      '$slug',
      '$content_escaped',
      '$pdf_file',
      '$ADMIN_ID',
      true,
      NOW(),
      NOW()
    ) RETURNING id;" | xargs)

  echo "   ✅ Imported (ID: $doc_id, slug: $slug)"

  # Optional: Trigger AI analysis
  # Uncomment if you want automatic analysis
  # curl -s -X POST "$LMS_API/api/ai/analyze" \
  #   -H "Content-Type: application/json" \
  #   -d "{\"documentId\": \"$doc_id\"}" > /dev/null

done

echo ""
echo "✅ Import complete!"
echo ""
echo "📊 Document count:"
PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -h "$DB_HOST" -d "$DB_NAME" -c \
  "SELECT COUNT(*) as total_documents FROM documents;"
