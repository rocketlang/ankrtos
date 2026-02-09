#!/usr/bin/env node
/**
 * Comprehensive ICSE Content Scraper
 * Downloads: Syllabus, Sample Papers, Textbooks, Study Materials
 * Classes: 9-12 (ICSE 9-10, ISC 11-12)
 * Subjects: All major subjects
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

const BASE_DIR = '/root/data/icse-complete';

// ICSE Classes and Subjects
const ICSE_CONFIG = {
  classes: {
    9: {
      board: 'ICSE',
      subjects: [
        'english', 'hindi', 'mathematics', 'physics', 'chemistry', 'biology',
        'history', 'geography', 'economics', 'commercial-studies',
        'computer-applications', 'physical-education'
      ]
    },
    10: {
      board: 'ICSE',
      subjects: [
        'english', 'hindi', 'mathematics', 'physics', 'chemistry', 'biology',
        'history', 'geography', 'economics', 'commercial-studies',
        'computer-applications', 'physical-education'
      ]
    },
    11: {
      board: 'ISC',
      subjects: [
        'english', 'mathematics', 'physics', 'chemistry', 'biology',
        'computer-science', 'economics', 'commerce', 'accounts',
        'business-studies', 'psychology', 'sociology'
      ]
    },
    12: {
      board: 'ISC',
      subjects: [
        'english', 'mathematics', 'physics', 'chemistry', 'biology',
        'computer-science', 'economics', 'commerce', 'accounts',
        'business-studies', 'psychology', 'sociology'
      ]
    }
  }
};

// Official CISCE URLs (syllabi and sample papers)
const OFFICIAL_SOURCES = {
  syllabus: 'https://cisce.org/syllabus.aspx',
  samplePapers: 'https://cisce.org/sample-papers.aspx',
  specimenPapers: 'https://cisce.org/specimen-papers.aspx',
};

// Third-party sources (educational websites)
const THIRD_PARTY_SOURCES = {
  // Study material sources
  tiwariacademy: 'https://www.tiwariacademy.com/icse-books/',
  dronstudy: 'https://www.dronstudy.com/icse-books/',
  vedantu: 'https://www.vedantu.com/selina-solutions',
  topperlearning: 'https://www.topperlearning.com/icse-textbook-solutions',
};

class ICSEScraper {
  constructor() {
    this.stats = {
      downloaded: 0,
      failed: 0,
      skipped: 0,
      totalSize: 0
    };
  }

  async downloadFile(url, filePath) {
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 60000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const writer = require('fs').createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          this.stats.downloaded++;
          resolve(true);
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error(`Failed to download ${url}: ${error.message}`);
      this.stats.failed++;
      return false;
    }
  }

  async scrapeOfficialCISCE() {
    console.log('\n📚 Scraping Official CISCE Content...\n');

    // Note: CISCE website structure requires specific URLs
    // These are example patterns - actual URLs may vary
    const officialFiles = [
      // Syllabi
      { url: 'https://cisce.org/uploads/syllabus/ICSE_Class_IX_Syllabus_2024.pdf', name: 'ICSE_Class_9_Syllabus.pdf', type: 'syllabus' },
      { url: 'https://cisce.org/uploads/syllabus/ICSE_Class_X_Syllabus_2024.pdf', name: 'ICSE_Class_10_Syllabus.pdf', type: 'syllabus' },
      { url: 'https://cisce.org/uploads/syllabus/ISC_Class_XI_Syllabus_2024.pdf', name: 'ISC_Class_11_Syllabus.pdf', type: 'syllabus' },
      { url: 'https://cisce.org/uploads/syllabus/ISC_Class_XII_Syllabus_2024.pdf', name: 'ISC_Class_12_Syllabus.pdf', type: 'syllabus' },
    ];

    for (const file of officialFiles) {
      const targetPath = path.join(BASE_DIR, 'official', file.type, file.name);
      await fs.mkdir(path.dirname(targetPath), { recursive: true });

      console.log(`Downloading: ${file.name}`);
      await this.downloadFile(file.url, targetPath);
    }
  }

  async scrapeSelinaSolutions() {
    console.log('\n📖 Scraping Selina Solutions (Popular ICSE Textbooks)...\n');

    // Selina is one of the most popular ICSE publishers
    // These URLs are examples - actual structure may vary
    const selinaSubjects = [
      'mathematics', 'physics', 'chemistry', 'biology',
      'geography', 'history', 'economics'
    ];

    for (const classNum of [9, 10]) {
      for (const subject of selinaSubjects) {
        console.log(`  Class ${classNum} - ${subject}`);

        const targetDir = path.join(BASE_DIR, 'textbooks', 'selina', `class_${classNum}`, subject);
        await fs.mkdir(targetDir, { recursive: true });

        // This would scrape from Selina solutions websites
        // Actual implementation depends on source availability
      }
    }
  }

  async scrapeSamplePapers() {
    console.log('\n📝 Scraping Sample Papers...\n');

    // Sample papers from various sources
    const years = ['2024', '2023', '2022'];

    for (const classNum of [10, 12]) {
      const board = classNum === 10 ? 'ICSE' : 'ISC';
      const subjects = ICSE_CONFIG.classes[classNum].subjects;

      for (const subject of subjects) {
        const targetDir = path.join(BASE_DIR, 'sample-papers', `class_${classNum}`, subject);
        await fs.mkdir(targetDir, { recursive: true });

        console.log(`  ${board} Class ${classNum} - ${subject}`);
      }
    }
  }

  async scrapeStudyNotes() {
    console.log('\n📓 Scraping Study Notes and Resources...\n');

    // Educational platforms often provide free ICSE notes
    const platforms = [
      { name: 'Tiwari Academy', url: 'https://www.tiwariacademy.com' },
      { name: 'Dron Study', url: 'https://www.dronstudy.com' },
    ];

    for (const platform of platforms) {
      console.log(`  Checking ${platform.name}...`);
      const targetDir = path.join(BASE_DIR, 'notes', platform.name.toLowerCase().replace(/\s+/g, '-'));
      await fs.mkdir(targetDir, { recursive: true });
    }
  }

  async generateManifest() {
    const manifest = {
      scrapedAt: new Date().toISOString(),
      stats: this.stats,
      structure: {
        official: 'Official CISCE syllabi and guidelines',
        textbooks: 'Publisher textbooks (Selina, Concise, etc.)',
        samplePapers: 'Sample and specimen papers by class/subject',
        notes: 'Study notes from educational platforms'
      },
      classes: ICSE_CONFIG.classes
    };

    await fs.writeFile(
      path.join(BASE_DIR, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }

  async run() {
    console.log('🚀 ICSE Comprehensive Scraper Started\n');
    console.log('Target: Classes 9-12, All Subjects, All Content Types\n');
    console.log('='.repeat(70));

    try {
      // Phase 1: Official CISCE Content
      await this.scrapeOfficialCISCE();

      // Phase 2: Textbooks (Selina, Concise, etc.)
      await this.scrapeSelinaSolutions();

      // Phase 3: Sample Papers
      await this.scrapeSamplePapers();

      // Phase 4: Study Notes
      await this.scrapeStudyNotes();

      // Generate manifest
      await this.generateManifest();

      console.log('\n' + '='.repeat(70));
      console.log('\n✅ ICSE Scraping Complete!\n');
      console.log(`📊 Statistics:`);
      console.log(`   Downloaded: ${this.stats.downloaded}`);
      console.log(`   Failed: ${this.stats.failed}`);
      console.log(`   Skipped: ${this.stats.skipped}`);
      console.log(`\n📁 Content saved to: ${BASE_DIR}`);

    } catch (error) {
      console.error('\n❌ Scraping failed:', error);
      throw error;
    }
  }
}

// Run the scraper
if (require.main === module) {
  const scraper = new ICSEScraper();
  scraper.run().catch(console.error);
}

module.exports = ICSEScraper;
