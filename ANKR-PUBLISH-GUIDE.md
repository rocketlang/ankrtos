# ANKR Publish Guide - Complete Documentation

**Version:** 3.0
**Date:** 2026-02-13
**Purpose:** Comprehensive guide to publishing and indexing documents in ANKR ecosystem

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Publishing Documents](#publishing-documents)
4. [Viewer & Indexing](#viewer--indexing)
5. [Best Practices](#best-practices)
6. [Automation](#automation)
7. [Troubleshooting](#troubleshooting)

---

## Overview

ANKR has **two document publishing tools**:

| Tool | Purpose | Output |
|------|---------|--------|
| **ankr-publish-doc** | Publish Markdown/PDF to web viewer | HTML index + files |
| **ankr-publish** | Convert HTML to PDF | PDF file |

---

## Quick Start

### Publish a Single Document

```bash
# Publish markdown file
ankr-publish-doc /path/to/document.md

# Publish multiple files
ankr-publish-doc file1.md file2.md file3.pdf

# Publish and rebuild index
ankr-publish-doc *.md --rebuild-index
```

### Convert HTML to PDF

```bash
# Generate PDF from HTML
ankr-publish showcase.html

# Specify output name
ankr-publish input.html output.pdf
```

---

## Publishing Documents

### ankr-publish-doc

**Location:** `/usr/local/bin/ankr-publish-doc`
**Purpose:** Publish documentation to ANKR viewer
**Destination:** `/var/www/ankr-landing/project/documents/`
**URL:** https://ankr.in/project/documents/

#### Usage

```bash
ankr-publish-doc <file1> [file2] ... [--rebuild-index]
```

#### Options

| Option | Description |
|--------|-------------|
| `--rebuild-index` | Regenerate index.html after publishing |
| `--list` | List all published documents |
| `--url` | Show the public URL |

#### Examples

**Publish Single File:**
```bash
ankr-publish-doc SYSTEM-SUMMARY.md
# Output: ✓ Published: SYSTEM-SUMMARY.md
```

**Publish Multiple Files:**
```bash
ankr-publish-doc VYOMO-*.md BFC-*.md
```

**Publish All Markdown in Directory:**
```bash
ankr-publish-doc /root/*.md --rebuild-index
```

**List Published Documents:**
```bash
ankr-publish-doc --list
```

**Get Public URL:**
```bash
ankr-publish-doc --url
# Output: https://ankr.in/project/documents/
```

---

## Viewer & Indexing

### How the Viewer Works

1. **Files are copied** to `/var/www/ankr-landing/project/documents/`
2. **Index.html is generated** listing all files with:
   - File name
   - File size
   - Download link
   - Styled interface
3. **Static file server** (nginx) serves the files
4. **Public access** via https://ankr.in/project/documents/

### Index Generation

The index is **automatically rebuilt** when you use `--rebuild-index` flag.

**Manual Rebuild:**
```bash
ankr-publish-doc --rebuild-index
```

**What Gets Indexed:**
- All `.md` files (Markdown)
- All `.pdf` files (PDFs)
- All `.html` files (HTML)
- All `.txt` files (Text)
- All `.json` files (JSON)
- All `.csv` files (CSV)

### Index Features

- **Searchable:** Browser's Find (Ctrl+F) works
- **Sortable:** Files listed alphabetically
- **File sizes:** Human-readable (5.0K, 26K, etc.)
- **Styled:** Professional dark theme
- **Responsive:** Works on mobile/desktop

---

## Best Practices

### Naming Conventions

**Good:**
```bash
SYSTEM-SUMMARY.md
VYOMO-13-ALGORITHMS-IP-ANALYSIS.md
DISK-OPTIMIZATION-COMPLETE.md
```

**Bad:**
```bash
summary.md
vyomo.md
temp-file.md
```

**Rules:**
- Use UPPERCASE for important docs
- Use hyphens (-) not underscores (_)
- Be descriptive but concise
- Include date if relevant: `REPORT-2026-02-13.md`

### File Organization

**Directory Structure:**
```
/var/www/ankr-landing/project/documents/
├── ANKR-*.md              # Core ANKR docs
├── VYOMO-*.md             # Vyomo project
├── BFC-*.md               # BFC project
├── MARI8X-*.md            # Maritime project
├── SYSTEM-*.md            # System reports
└── index.html             # Auto-generated
```

### Publishing Workflow

**Daily Reports:**
```bash
# 1. Create report
cat > /root/DAILY-REPORT-$(date +%Y-%m-%d).md <<EOF
# Daily Report - $(date +%Y-%m-%d)
...
EOF

# 2. Publish
ankr-publish-doc /root/DAILY-REPORT-*.md --rebuild-index

# 3. Verify
ankr-publish-doc --url
```

**Project Documentation:**
```bash
# Publish all project docs at once
ankr-publish-doc /root/VYOMO-*.md --rebuild-index
ankr-publish-doc /root/BFC-*.md --rebuild-index
```

---

## Automation

### Cron Job - Auto-Publish Reports

**Create `/root/auto-publish.sh`:**
```bash
#!/bin/bash
# Auto-publish recent reports to ANKR viewer

# Find all .md files modified in last 24 hours
find /root -name "*.md" -mtime -1 -type f > /tmp/recent-reports.txt

# Publish if any found
if [ -s /tmp/recent-reports.txt ]; then
    cat /tmp/recent-reports.txt | xargs ankr-publish-doc --rebuild-index
    echo "✓ Published $(wc -l < /tmp/recent-reports.txt) reports"
else
    echo "No new reports to publish"
fi
```

**Make executable:**
```bash
chmod +x /root/auto-publish.sh
```

**Add to crontab:**
```bash
# Run daily at 6 AM
0 6 * * * /root/auto-publish.sh >> /var/log/auto-publish.log 2>&1
```

### Publish Script - Last N Hours

**Create `/root/publish-recent.sh`:**
```bash
#!/bin/bash
# Usage: ./publish-recent.sh 24  (publish last 24 hours)

HOURS=${1:-24}

echo "📄 Finding reports modified in last $HOURS hours..."

# Find recent reports
REPORTS=$(find /root -name "*.md" -mmin -$((HOURS * 60)) -type f 2>/dev/null)

if [ -z "$REPORTS" ]; then
    echo "❌ No reports found"
    exit 0
fi

echo "Found $(echo "$REPORTS" | wc -l) reports:"
echo "$REPORTS" | sed 's|/root/||'

# Publish
echo ""
echo "📤 Publishing..."
echo "$REPORTS" | xargs ankr-publish-doc --rebuild-index

echo ""
echo "✅ Done! View at: https://ankr.in/project/documents/"
```

**Usage:**
```bash
chmod +x /root/publish-recent.sh

# Publish last 24 hours
./publish-recent.sh 24

# Publish last 7 days
./publish-recent.sh 168
```

---

## Advanced Features

### Batch Publishing with Categories

```bash
# Publish by category
ankr-publish-doc /root/SYSTEM-*.md --rebuild-index
ankr-publish-doc /root/VYOMO-*.md --rebuild-index
ankr-publish-doc /root/OPTIMIZATION-*.md --rebuild-index
```

### Publishing from Specific Directories

```bash
# Publish all docs from project directory
ankr-publish-doc /root/ankr-labs-nx/docs/*.md --rebuild-index

# Publish from multiple directories
ankr-publish-doc \
  /root/*.md \
  /root/ankr-reports/*.md \
  /root/ankr-todos/*.md \
  --rebuild-index
```

### Excluding Files

```bash
# Publish all except private
for file in /root/*.md; do
    if [[ ! "$file" =~ PRIVATE ]]; then
        ankr-publish-doc "$file"
    fi
done
ankr-publish-doc --rebuild-index
```

---

## Viewer Customization

### Custom Index Template

The index.html is generated by ankr-publish-doc. To customize:

**Location:** `/usr/local/bin/ankr-publish-doc` (contains HTML template)

**Customization Options:**
- Title: "AnkrCode Project Documents"
- Subtitle: "Documentation for AnkrCode..."
- Color scheme: Dark theme (can be changed)
- Logo: Can add company logo

---

## Integration with ANKR Ecosystem

### Publishing to ANKR EON (AI Memory)

**Future Feature:** Automatic indexing into ANKR EON for AI-searchable docs

```bash
# When implemented:
ankr-publish-doc --eon-index VYOMO-13-ALGORITHMS.md
```

### Publishing to ANKR Interact Viewer

**Current:** ANKR Interact viewer proxies to static files
**URL:** https://ankr.in/project/documents/

Files are accessible via:
- Direct URL: `https://ankr.in/project/documents/FILENAME.md`
- Index page: `https://ankr.in/project/documents/`

---

## Troubleshooting

### Issue: Files not showing up

**Check:**
```bash
# 1. Verify file was copied
ls -lh /var/www/ankr-landing/project/documents/FILENAME.md

# 2. Check permissions
ls -l /var/www/ankr-landing/project/documents/

# 3. Rebuild index
ankr-publish-doc --rebuild-index

# 4. Check nginx is serving
curl https://ankr.in/project/documents/
```

### Issue: Index not updating

**Solution:**
```bash
# Force rebuild
ankr-publish-doc --rebuild-index

# Verify index exists
cat /var/www/ankr-landing/project/documents/index.html | head -20
```

### Issue: 404 Not Found

**Check nginx configuration:**
```bash
# Check if directory exists
ls -la /var/www/ankr-landing/project/documents/

# Check nginx config
grep "project/documents" /etc/nginx/sites-enabled/ankr.in

# Reload nginx
sudo systemctl reload nginx
```

### Issue: Large files won't upload

**Check nginx upload limit:**
```bash
# In /etc/nginx/sites-enabled/ankr.in
client_max_body_size 100M;

# Reload nginx
sudo systemctl reload nginx
```

---

## Command Reference

### ankr-publish-doc

```bash
# Publish file(s)
ankr-publish-doc FILE1 [FILE2 ...]

# Publish with index rebuild
ankr-publish-doc FILE1 --rebuild-index

# List published
ankr-publish-doc --list

# Show URL
ankr-publish-doc --url

# Help
ankr-publish-doc --help
```

### ankr-publish

```bash
# Convert HTML to PDF
ankr-publish INPUT.html [OUTPUT.pdf]

# Help
ankr-publish --help
```

---

## Quick Reference Scripts

### Publish Last 24 Hours

```bash
find /root -name "*.md" -mtime -1 -type f | xargs ankr-publish-doc --rebuild-index
```

### Publish All Reports

```bash
ankr-publish-doc /root/*REPORT*.md /root/*SUMMARY*.md --rebuild-index
```

### Publish and Open in Browser

```bash
ankr-publish-doc MYFILE.md --rebuild-index && \
xdg-open https://ankr.in/project/documents/
```

### List Recently Published (Last 7 Days)

```bash
find /var/www/ankr-landing/project/documents -name "*.md" -mtime -7 -exec ls -lh {} \;
```

---

## API Integration (Future)

### REST API for Publishing

**Planned:**
```bash
curl -X POST https://ankr.in/api/publish \
  -F "file=@document.md" \
  -F "category=vyomo" \
  -H "Authorization: Bearer TOKEN"
```

### GraphQL Mutation

**Planned:**
```graphql
mutation PublishDocument {
  publishDocument(
    content: "# My Doc\n..."
    filename: "MYDOC.md"
    category: "system"
  ) {
    success
    url
  }
}
```

---

## Performance

### File Limits

| Metric | Limit |
|--------|-------|
| **Max file size** | 100 MB (nginx) |
| **Max files** | No limit |
| **Total directory size** | Disk space |

### Optimization Tips

1. **Compress large PDFs:**
   ```bash
   gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
      -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH \
      -sOutputFile=output.pdf input.pdf
   ```

2. **Use markdown over PDF** when possible (smaller, searchable)

3. **Archive old reports:**
   ```bash
   # Move old reports to archive
   mkdir -p /var/www/ankr-landing/project/documents/archive/
   find /var/www/ankr-landing/project/documents -name "*.md" -mtime +90 \
     -exec mv {} /var/www/ankr-landing/project/documents/archive/ \;
   ```

---

## Security

### Access Control

**Current:** Public access (no authentication)

**Future:** Role-based access
- Public docs
- Internal docs (team only)
- Private docs (author only)

### Sensitive Information

**⚠️ Warning:** Do NOT publish files containing:
- API keys
- Passwords
- Database credentials
- Personal data (unless GDPR compliant)
- Trade secrets (use internal wiki)

**Best Practice:**
```bash
# Check for secrets before publishing
grep -E "API_KEY|PASSWORD|SECRET" document.md && \
  echo "❌ Contains secrets - do not publish" || \
  ankr-publish-doc document.md
```

---

## Examples

### Example 1: Daily System Report

```bash
#!/bin/bash
# Create and publish daily system report

DATE=$(date +%Y-%m-%d)
REPORT="/root/SYSTEM-REPORT-$DATE.md"

cat > "$REPORT" <<EOF
# System Report - $DATE

## Disk Usage
$(df -h / /mnt/storage /mnt/ais-storage)

## Services Status
$(ankr-ctl status | head -20)

## Database Sizes
$(sudo -u postgres psql -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database ORDER BY pg_database_size(datname) DESC LIMIT 10;")

---
Generated: $(date)
EOF

ankr-publish-doc "$REPORT" --rebuild-index
echo "✅ Published: https://ankr.in/project/documents/SYSTEM-REPORT-$DATE.md"
```

### Example 2: Project Documentation Update

```bash
#!/bin/bash
# Publish all Vyomo documentation

echo "📤 Publishing Vyomo documentation..."

ankr-publish-doc \
  /root/VYOMO-13-ALGORITHMS-SHORT.md \
  /root/VYOMO-13-ALGORITHMS-IP-ANALYSIS.md \
  /root/VYOMO-13-ALGORITHMS-SUMMARY.md \
  /root/BFC-VYOMO-SYNERGY-ANALYSIS.md \
  --rebuild-index

echo "✅ Done! View at: https://ankr.in/project/documents/"
```

---

## Support

**Documentation:** https://ankr.in/project/documents/ANKR-PUBLISH-GUIDE.md
**Issues:** https://github.com/anthropics/ankr-labs/issues
**Contact:** support@ankrlabs.in

---

**Last Updated:** 2026-02-13
**Maintainer:** ANKR Labs
**License:** Internal Use Only

