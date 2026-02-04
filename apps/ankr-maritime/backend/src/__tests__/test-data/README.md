# Test Data for Tariff Ingestion Tests

## Sample Tariff Documents

### sample-tariff.txt
A sample port tariff document for Mumbai port with:
- 13 different tariff entries
- Multiple charge types (port_dues, pilotage, towage, etc.)
- Multiple units (per_grt, per_teu, per_mt, flat_fee)
- Size ranges (vessels by GRT)
- Notes and conditions

**Expected Extraction**:
- 13 tariffs should be extracted
- All should have confidence > 0.8 (high quality text)
- No tariffs should need review

## Expected Test Results

### PDF Extraction
- Method: `pdf-parse` (text-based)
- Confidence: > 0.9
- Page count: 1

### LLM Structuring
- Extracted tariffs: 13
- Overall confidence: > 0.85
- Auto-import: All 13 tariffs

### Validation
- Schema validation: 100% pass
- Business logic: 100% pass
- Duplicate detection: 0 duplicates
- Confidence routing: All → auto-import

### Database Import
- Imported count: 13
- Data source: `REAL_SCRAPED`
- Failures: 0
- Review tasks: 0

## Adding More Test Data

To add more test tariff documents:

1. Create a new `.txt` or `.pdf` file in this directory
2. Follow the format of existing samples
3. Include diverse charge types and units
4. Add edge cases (unusual amounts, rare units, etc.)
5. Update this README with expected results

## Test Data Categories

### High Quality (Auto-Import)
- `sample-tariff.txt` - Standard format, clear text
- Should extract with confidence > 0.8

### Medium Quality (Review Queue)
- Create samples with:
  - Ambiguous charge types
  - Unusual amounts
  - Missing information
- Should extract with confidence 0.6-0.79

### Low Quality (OCR Required)
- Scanned images
- Poor quality PDFs
- Should require Tesseract or @ankr/ocr

## Running Tests with Sample Data

```bash
# Unit tests
npm run test -- tariff-extraction

# E2E tests
npm run test:e2e -- tariff-ingestion

# Test with specific sample
# (Add test case that loads sample-tariff.txt)
```
