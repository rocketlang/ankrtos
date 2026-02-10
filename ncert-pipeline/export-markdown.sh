#!/bin/bash

##
# Export NCERT content as Markdown files
# Creates organized directory structure with .md files
##

OUTPUT_DIR="/root/ncert-markdown"
DB_HOST="localhost"
DB_USER="ankr"
DB_PASS="indrA@0612"
DB_NAME="ankr_eon"

echo "========================================"
echo "  NCERT MARKDOWN EXPORTER"
echo "========================================"
echo ""
echo "Output directory: $OUTPUT_DIR"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Get all courses with content
COURSES=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
  SELECT DISTINCT m.course_id
  FROM ankr_learning.modules m
  INNER JOIN ankr_learning.chapter_content cc ON cc.module_id = m.id
  WHERE cc.content IS NOT NULL AND cc.content != ''
  ORDER BY m.course_id
")

for course_id in $COURSES; do
    # Clean up course_id
    course_id=$(echo "$course_id" | tr -d ' ')

    if [ -z "$course_id" ]; then
        continue
    fi

    echo "📚 Exporting: $course_id"

    # Create course directory
    course_dir="$OUTPUT_DIR/$course_id"
    mkdir -p "$course_dir"

    # Get chapters for this course
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
      SELECT
        m.id,
        m.\"order\",
        m.title,
        cc.content,
        cc.word_count
      FROM ankr_learning.modules m
      INNER JOIN ankr_learning.chapter_content cc ON cc.module_id = m.id
      WHERE m.course_id = '$course_id'
        AND cc.content IS NOT NULL
        AND cc.content != ''
      ORDER BY m.\"order\"
    " | while IFS='|' read -r module_id order title content word_count; do
        # Clean up fields
        module_id=$(echo "$module_id" | xargs)
        order=$(echo "$order" | xargs)
        title=$(echo "$title" | xargs)
        word_count=$(echo "$word_count" | xargs)

        if [ -z "$module_id" ]; then
            continue
        fi

        # Create filename
        filename=$(printf "%02d_%s.md" "$order" "$module_id")
        filepath="$course_dir/$filename"

        # Write markdown file
        {
            echo "# Chapter $order: $title"
            echo ""
            echo "**Course:** $course_id"
            echo "**Chapter ID:** $module_id"
            echo "**Word Count:** $word_count"
            echo ""
            echo "---"
            echo ""
            echo "$content"
        } > "$filepath"

        echo "  ✓ $filename ($word_count words)"
    done

    # Create index file
    index_file="$course_dir/README.md"
    {
        echo "# $course_id"
        echo ""
        echo "## Chapters"
        echo ""

        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
          SELECT
            m.\"order\",
            m.title,
            cc.word_count
          FROM ankr_learning.modules m
          INNER JOIN ankr_learning.chapter_content cc ON cc.module_id = m.id
          WHERE m.course_id = '$course_id'
            AND cc.content IS NOT NULL
          ORDER BY m.\"order\"
        " | while IFS='|' read -r order title word_count; do
            order=$(echo "$order" | xargs)
            title=$(echo "$title" | xargs)
            word_count=$(echo "$word_count" | xargs)

            if [ ! -z "$order" ]; then
                echo "$order. **$title** ($word_count words)"
            fi
        done

        echo ""
        echo "---"
        echo ""
        echo "*Exported from ANKR Learning Platform*"
    } > "$index_file"

    echo ""
done

# Create master index
echo "📖 Creating master index..."
{
    echo "# NCERT Textbooks - Markdown Export"
    echo ""
    echo "Complete NCERT textbook content in Markdown format."
    echo ""
    echo "## Available Courses"
    echo ""

    for course_id in $COURSES; do
        course_id=$(echo "$course_id" | tr -d ' ')
        if [ -z "$course_id" ]; then
            continue
        fi

        chapter_count=$(find "$OUTPUT_DIR/$course_id" -name "*.md" ! -name "README.md" | wc -l)
        total_words=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
          SELECT SUM(cc.word_count)
          FROM ankr_learning.modules m
          INNER JOIN ankr_learning.chapter_content cc ON cc.module_id = m.id
          WHERE m.course_id = '$course_id'
        " | xargs)

        echo "- [$course_id](./$course_id/README.md) - $chapter_count chapters, ${total_words:-0} words"
    done

    echo ""
    echo "## Export Details"
    echo ""
    echo "- Export Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "- Source: ANKR Learning Platform"
    echo "- Database: ankr_eon.ankr_learning"
    echo ""
} > "$OUTPUT_DIR/README.md"

echo ""
echo "========================================"
echo "  EXPORT COMPLETE"
echo "========================================"
echo ""
echo "Location: $OUTPUT_DIR"
echo ""

# Summary stats
total_files=$(find "$OUTPUT_DIR" -name "*.md" ! -name "README.md" | wc -l)
total_size=$(du -sh "$OUTPUT_DIR" | cut -f1)

echo "Total files: $total_files"
echo "Total size: $total_size"
echo ""
