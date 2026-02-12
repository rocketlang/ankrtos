/**
 * NCERT Books Downloader - Using Playwright
 * Bypasses wget blocking by using real browser automation
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DOWNLOAD_DIR = '/root/data/ncert-playwright';

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// NCERT Book URLs from official website
const NCERT_BOOKS = [
  // Class 10 - Highest Priority
  {
    class: 10,
    subject: 'mathematics',
    url: 'https://ncert.nic.in/textbook.php?jemh1=0-15',
    filename: 'class_10_mathematics.pdf'
  },
  {
    class: 10,
    subject: 'science',
    url: 'https://ncert.nic.in/textbook.php?jesc1=0-16',
    filename: 'class_10_science.pdf'
  },
  {
    class: 10,
    subject: 'english_first_flight',
    url: 'https://ncert.nic.in/textbook.php?jefl1=0-11',
    filename: 'class_10_english_first_flight.pdf'
  },
  {
    class: 10,
    subject: 'english_footprints',
    url: 'https://ncert.nic.in/textbook.php?jefw1=0-10',
    filename: 'class_10_english_footprints.pdf'
  },
  {
    class: 10,
    subject: 'hindi_sparsh',
    url: 'https://ncert.nic.in/textbook.php?jhsp1=0-11',
    filename: 'class_10_hindi_sparsh.pdf'
  },
  {
    class: 10,
    subject: 'social_history',
    url: 'https://ncert.nic.in/textbook.php?jess3=0-8',
    filename: 'class_10_social_science_history.pdf'
  },
  {
    class: 10,
    subject: 'social_geography',
    url: 'https://ncert.nic.in/textbook.php?jess2=0-7',
    filename: 'class_10_social_science_geography.pdf'
  },
  {
    class: 10,
    subject: 'social_political_science',
    url: 'https://ncert.nic.in/textbook.php?jess4=0-8',
    filename: 'class_10_social_science_civics.pdf'
  },
  {
    class: 10,
    subject: 'social_economics',
    url: 'https://ncert.nic.in/textbook.php?jeec1=0-5',
    filename: 'class_10_social_science_economics.pdf'
  },

  // Class 11 - Science
  {
    class: 11,
    subject: 'physics_part1',
    url: 'https://ncert.nic.in/textbook.php?keph1=0-8',
    filename: 'class_11_physics_part1.pdf'
  },
  {
    class: 11,
    subject: 'physics_part2',
    url: 'https://ncert.nic.in/textbook.php?keph2=0-7',
    filename: 'class_11_physics_part2.pdf'
  },
  {
    class: 11,
    subject: 'chemistry_part1',
    url: 'https://ncert.nic.in/textbook.php?kech1=0-7',
    filename: 'class_11_chemistry_part1.pdf'
  },
  {
    class: 11,
    subject: 'chemistry_part2',
    url: 'https://ncert.nic.in/textbook.php?kech2=0-7',
    filename: 'class_11_chemistry_part2.pdf'
  },
  {
    class: 11,
    subject: 'biology',
    url: 'https://ncert.nic.in/textbook.php?kebi1=0-22',
    filename: 'class_11_biology.pdf'
  },

  // Class 12 - Science
  {
    class: 12,
    subject: 'physics_part1',
    url: 'https://ncert.nic.in/textbook.php?leph1=0-8',
    filename: 'class_12_physics_part1.pdf'
  },
  {
    class: 12,
    subject: 'physics_part2',
    url: 'https://ncert.nic.in/textbook.php?leph2=0-7',
    filename: 'class_12_physics_part2.pdf'
  },
  {
    class: 12,
    subject: 'chemistry_part1',
    url: 'https://ncert.nic.in/textbook.php?lech1=0-8',
    filename: 'class_12_chemistry_part1.pdf'
  },
  {
    class: 12,
    subject: 'chemistry_part2',
    url: 'https://ncert.nic.in/textbook.php?lech2=0-6',
    filename: 'class_12_chemistry_part2.pdf'
  },
  {
    class: 12,
    subject: 'biology',
    url: 'https://ncert.nic.in/textbook.php?lebi1=0-16',
    filename: 'class_12_biology.pdf'
  },
];

async function downloadBook(browser, book) {
  const outputPath = path.join(DOWNLOAD_DIR, book.filename);

  // Skip if already downloaded
  if (fs.existsSync(outputPath)) {
    console.log(`✓ Already exists: ${book.filename}`);
    return { success: true, skipped: true };
  }

  console.log(`⬇️  Downloading: Class ${book.class} - ${book.subject}`);

  try {
    const page = await browser.newPage();

    // Set up download handling
    page.on('download', async (download) => {
      const downloadPath = await download.path();
      fs.copyFileSync(downloadPath, outputPath);
      console.log(`✅ Downloaded: ${book.filename} (${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB)`);
    });

    // Navigate to page
    await page.goto(book.url, { waitUntil: 'networkidle', timeout: 60000 });

    // Look for PDF download link
    const pdfLink = await page.$('a[href$=".pdf"]');

    if (pdfLink) {
      // Click download link
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 60000 }),
        pdfLink.click()
      ]);

      await download.saveAs(outputPath);
      await page.close();

      return { success: true, file: outputPath };
    } else {
      console.log(`⚠️  No PDF link found: ${book.url}`);
      await page.close();
      return { success: false, error: 'No PDF link found' };
    }

  } catch (error) {
    console.log(`❌ Failed: ${book.filename} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  NCERT Books Downloader - Playwright');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  // Download Class 10 books first (priority)
  const class10Books = NCERT_BOOKS.filter(b => b.class === 10);
  console.log(`Priority: Class 10 (${class10Books.length} books)`);
  console.log('');

  for (const book of class10Books) {
    const result = await downloadBook(browser, book);
    if (result.success && !result.skipped) downloaded++;
    else if (result.skipped) skipped++;
    else failed++;

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('');
  console.log(`Class 10 Complete: ${downloaded} new, ${skipped} skipped, ${failed} failed`);
  console.log('');

  // Download other classes
  const otherBooks = NCERT_BOOKS.filter(b => b.class !== 10);
  console.log(`Other Classes (${otherBooks.length} books)`);
  console.log('');

  for (const book of otherBooks) {
    const result = await downloadBook(browser, book);
    if (result.success && !result.skipped) downloaded++;
    else if (result.skipped) skipped++;
    else failed++;

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  await browser.close();

  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('  Download Summary');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Total books: ${NCERT_BOOKS.length}`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log('');
  console.log(`Location: ${DOWNLOAD_DIR}`);
  console.log('════════════════════════════════════════════════════════════');
}

main().catch(console.error);
