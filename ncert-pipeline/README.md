# NCERT Content Extraction Pipeline

Automated pipeline to extract NCERT textbook content from PDFs and populate the database with chapters, examples, and exercises.

## Features

✅ **PDF Download** - Downloads NCERT PDFs from official sources
✅ **Structure Extraction** - Identifies chapters, examples, exercises
✅ **Content Processing** - Converts to markdown format
✅ **Database Import** - Populates PostgreSQL with full content
✅ **Verification** - Validates imported data

## Quick Start

```bash
# Process single book
node pipeline.js class-10-mathematics

# Process all books
node pipeline.js --all

# See available books
node pipeline.js
```

## Pipeline Steps

### 1. Download PDF
Downloads NCERT PDF from official website (ncert.nic.in)

### 2. Parse PDF
Extracts:
- Chapter titles and content
- Worked examples with solutions
- Exercise questions
- Metadata (word count, page numbers)

### 3. Save Extracted Data
Saves to JSON in `extracted/` directory for inspection

### 4. Import to Database
Populates three tables:
- `ankr_learning.modules` - Chapter metadata
- `ankr_learning.chapter_content` - Full chapter text
- `ankr_learning.chapter_examples` - Worked examples
- `ankr_learning.chapter_exercises` - Practice exercises

### 5. Verify
Validates import with database queries

## Available Books

| Book ID | Title | Status |
|---------|-------|--------|
| class-10-mathematics | Mathematics Class 10 | ✅ Ready |
| class-10-science | Science Class 10 | ✅ Ready |
| class-9-mathematics | Mathematics Class 9 | ✅ Ready |
| class-9-science | Science Class 9 | ✅ Ready |

## Directory Structure

```
ncert-pipeline/
├── pipeline.js          # Main orchestrator
├── pdf-downloader.js    # Downloads PDFs
├── pdf-parser.js        # Extracts content
├── db-importer.js       # Database import
├── pdfs/                # Downloaded PDFs
├── extracted/           # Extracted JSON data
└── processed/           # Processing logs
```

## Individual Components

### Download Only
```bash
node pdf-downloader.js class-10-mathematics
```

### Parse Only
```bash
node pdf-parser.js pdfs/class-10-math.pdf
```

### Import Only
```bash
node db-importer.js extracted/class-10-mathematics.json class-10-mathematics
```

## Output

The pipeline outputs:
- **PDFs**: `pdfs/*.pdf`
- **Extracted JSON**: `extracted/*.json`
- **Database**: `ankr_eon` database tables

## Requirements

- Node.js 14+
- PostgreSQL 12+
- npm packages: `pdf-parse`, `axios`, `pg`, `cheerio`, `marked`

## Troubleshooting

### PDF Download Fails
- Check internet connection
- Verify NCERT URLs are accessible
- Try downloading manually and place in `pdfs/` directory

### Parse Errors
- PDFs must be text-based (not scanned images)
- Try with different NCERT editions

### Database Errors
- Verify PostgreSQL is running
- Check credentials in `db-importer.js`
- Ensure tables exist (run schema creation first)

## Extending

### Add More Books
Edit `pdf-downloader.js` and add to `NCERT_BOOKS` object:

```javascript
'class-11-physics': {
  url: 'https://ncert.nic.in/textbook/pdf/...',
  title: 'Physics - Class 11',
  filename: 'class-11-physics.pdf'
}
```

### Improve Extraction
Patterns are in `pdf-parser.js`:
- `chapterPattern` - Detects chapter boundaries
- `examplePattern` - Finds worked examples
- `exercisePattern` - Identifies exercises

### Add Solutions
Solutions are often in a separate section or answer key. Add solution extraction logic in `pdf-parser.js`.

## Notes

- First run may take 5-10 minutes per book (download + processing)
- Subsequent runs are faster (PDFs cached)
- Math equations may need manual review
- Diagrams are not extracted (text only)

## License

MIT
