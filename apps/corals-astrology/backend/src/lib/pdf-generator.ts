// =====================================================
// PDF REPORT GENERATION ENGINE
// Professional PDF Reports for All Systems
// =====================================================

import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import { join } from 'path';

// =====================================================
// PDF CONFIGURATION
// =====================================================

export const PDF_CONFIG = {
  margins: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50
  },
  colors: {
    primary: '#6B46C1', // Purple
    secondary: '#38B2AC', // Teal
    accent: '#F6AD55', // Orange
    text: '#2D3748',
    lightText: '#718096',
    background: '#F7FAFC',
    border: '#E2E8F0'
  },
  fonts: {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique',
    title: 'Helvetica-Bold'
  }
};

// =====================================================
// BASE PDF REPORT CLASS
// =====================================================

export class BasePDFReport {
  protected doc: typeof PDFDocument;
  protected currentY: number = 50;
  protected pageNumber: number = 1;

  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: PDF_CONFIG.margins,
      info: {
        Title: 'CoralsAstrology Report',
        Author: 'Jyotish Acharya Rakesh Sharma',
        Creator: 'CoralsAstrology Platform'
      }
    });
  }

  // Header with logo and branding
  protected addHeader(title: string, subtitle?: string) {
    const { primary, text } = PDF_CONFIG.colors;

    // Logo area (placeholder - replace with actual logo)
    this.doc
      .fontSize(24)
      .fillColor(primary)
      .font(PDF_CONFIG.fonts.bold)
      .text('🔮 CoralsAstrology', 50, 30);

    // Title
    this.doc
      .fontSize(18)
      .fillColor(text)
      .font(PDF_CONFIG.fonts.title)
      .text(title, 50, 70, { width: 495 });

    if (subtitle) {
      this.doc
        .fontSize(12)
        .fillColor(PDF_CONFIG.colors.lightText)
        .font(PDF_CONFIG.fonts.italic)
        .text(subtitle, 50, 95);
    }

    // Horizontal line
    this.doc
      .strokeColor(PDF_CONFIG.colors.border)
      .lineWidth(1)
      .moveTo(50, 120)
      .lineTo(545, 120)
      .stroke();

    this.currentY = 140;
  }

  // Footer with page number and branding
  protected addFooter() {
    const pageHeight = 842; // A4 height in points

    this.doc
      .fontSize(10)
      .fillColor(PDF_CONFIG.colors.lightText)
      .font(PDF_CONFIG.fonts.regular)
      .text(
        `Page ${this.pageNumber}`,
        50,
        pageHeight - 30,
        { align: 'center', width: 495 }
      );

    this.doc
      .fontSize(8)
      .text(
        'Founded by Jyotish Acharya Rakesh Sharma | CoralsAstrology.com',
        50,
        pageHeight - 15,
        { align: 'center', width: 495 }
      );

    this.pageNumber++;
  }

  // Section heading
  protected addSectionHeading(text: string) {
    this.checkPageBreak(50);

    this.doc
      .fontSize(16)
      .fillColor(PDF_CONFIG.colors.primary)
      .font(PDF_CONFIG.fonts.bold)
      .text(text, 50, this.currentY);

    this.currentY += 25;

    // Underline
    this.doc
      .strokeColor(PDF_CONFIG.colors.primary)
      .lineWidth(2)
      .moveTo(50, this.currentY - 10)
      .lineTo(200, this.currentY - 10)
      .stroke();

    this.currentY += 10;
  }

  // Subsection heading
  protected addSubsectionHeading(text: string) {
    this.checkPageBreak(30);

    this.doc
      .fontSize(14)
      .fillColor(PDF_CONFIG.colors.secondary)
      .font(PDF_CONFIG.fonts.bold)
      .text(text, 50, this.currentY);

    this.currentY += 25;
  }

  // Paragraph text
  protected addParagraph(text: string, indent: number = 0) {
    this.checkPageBreak(40);

    this.doc
      .fontSize(11)
      .fillColor(PDF_CONFIG.colors.text)
      .font(PDF_CONFIG.fonts.regular)
      .text(text, 50 + indent, this.currentY, { width: 495 - indent, align: 'justify' });

    this.currentY = this.doc.y + 15;
  }

  // Bullet list
  protected addBulletList(items: string[], indent: number = 0) {
    items.forEach(item => {
      this.checkPageBreak(30);

      this.doc
        .fontSize(11)
        .fillColor(PDF_CONFIG.colors.text)
        .font(PDF_CONFIG.fonts.regular)
        .text('•', 50 + indent, this.currentY)
        .text(item, 65 + indent, this.currentY, { width: 480 - indent });

      this.currentY = this.doc.y + 8;
    });

    this.currentY += 10;
  }

  // Key-value pairs (for data display)
  protected addKeyValuePairs(pairs: { key: string; value: string }[]) {
    pairs.forEach(({ key, value }) => {
      this.checkPageBreak(25);

      this.doc
        .fontSize(11)
        .fillColor(PDF_CONFIG.colors.lightText)
        .font(PDF_CONFIG.fonts.bold)
        .text(`${key}:`, 50, this.currentY, { continued: true, width: 150 })
        .fillColor(PDF_CONFIG.colors.text)
        .font(PDF_CONFIG.fonts.regular)
        .text(` ${value}`, { width: 345 });

      this.currentY = this.doc.y + 5;
    });

    this.currentY += 10;
  }

  // Table
  protected addTable(headers: string[], rows: string[][]) {
    this.checkPageBreak(100);

    const colWidth = 495 / headers.length;
    const startY = this.currentY;

    // Headers
    headers.forEach((header, i) => {
      this.doc
        .rect(50 + i * colWidth, startY, colWidth, 30)
        .fillAndStroke(PDF_CONFIG.colors.primary, PDF_CONFIG.colors.border);

      this.doc
        .fontSize(10)
        .fillColor('white')
        .font(PDF_CONFIG.fonts.bold)
        .text(header, 55 + i * colWidth, startY + 10, {
          width: colWidth - 10,
          align: 'center'
        });
    });

    this.currentY = startY + 30;

    // Rows
    rows.forEach((row, rowIndex) => {
      this.checkPageBreak(30);

      const rowY = this.currentY;
      const rowHeight = 25;

      row.forEach((cell, colIndex) => {
        // Alternating row colors
        const fillColor = rowIndex % 2 === 0 ? 'white' : PDF_CONFIG.colors.background;

        this.doc
          .rect(50 + colIndex * colWidth, rowY, colWidth, rowHeight)
          .fillAndStroke(fillColor, PDF_CONFIG.colors.border);

        this.doc
          .fontSize(9)
          .fillColor(PDF_CONFIG.colors.text)
          .font(PDF_CONFIG.fonts.regular)
          .text(cell, 55 + colIndex * colWidth, rowY + 8, {
            width: colWidth - 10,
            align: 'center'
          });
      });

      this.currentY += rowHeight;
    });

    this.currentY += 15;
  }

  // Info box (highlight important information)
  protected addInfoBox(title: string, content: string, type: 'info' | 'success' | 'warning' = 'info') {
    this.checkPageBreak(80);

    const colors = {
      info: { bg: '#EBF8FF', border: '#3182CE', icon: 'ℹ️' },
      success: { bg: '#F0FFF4', border: '#38A169', icon: '✅' },
      warning: { bg: '#FFFAF0', border: '#DD6B20', icon: '⚠️' }
    };

    const { bg, border, icon } = colors[type];

    // Box background
    this.doc
      .rect(50, this.currentY, 495, 'auto')
      .fillAndStroke(bg, border);

    // Title with icon
    this.doc
      .fontSize(12)
      .fillColor(border)
      .font(PDF_CONFIG.fonts.bold)
      .text(`${icon} ${title}`, 60, this.currentY + 10);

    // Content
    this.doc
      .fontSize(10)
      .fillColor(PDF_CONFIG.colors.text)
      .font(PDF_CONFIG.fonts.regular)
      .text(content, 60, this.currentY + 30, { width: 475 });

    this.currentY = this.doc.y + 20;
  }

  // Chart placeholder (for future chart generation)
  protected addChartPlaceholder(title: string, height: number = 200) {
    this.checkPageBreak(height + 30);

    this.doc
      .fontSize(12)
      .fillColor(PDF_CONFIG.colors.text)
      .font(PDF_CONFIG.fonts.bold)
      .text(title, 50, this.currentY);

    this.currentY += 20;

    this.doc
      .rect(50, this.currentY, 495, height)
      .fillAndStroke(PDF_CONFIG.colors.background, PDF_CONFIG.colors.border);

    this.doc
      .fontSize(10)
      .fillColor(PDF_CONFIG.colors.lightText)
      .text('[Chart/Diagram]', 50, this.currentY + height / 2, {
        width: 495,
        align: 'center'
      });

    this.currentY += height + 20;
  }

  // Page break check
  protected checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > 750) {
      this.addFooter();
      this.doc.addPage();
      this.currentY = 50;
    }
  }

  // Generate PDF and save to file
  async generateToFile(filepath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = createWriteStream(filepath);
      this.doc.pipe(stream);
      this.addFooter();
      this.doc.end();

      stream.on('finish', () => resolve(filepath));
      stream.on('error', reject);
    });
  }

  // Generate PDF and return buffer
  async generateToBuffer(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];

      this.doc.on('data', buffers.push.bind(buffers));
      this.doc.on('end', () => resolve(Buffer.concat(buffers)));
      this.doc.on('error', reject);

      this.addFooter();
      this.doc.end();
    });
  }
}

// =====================================================
// VEDIC ASTROLOGY REPORT
// =====================================================

export class VedicAstrologyReport extends BasePDFReport {
  generateReport(data: {
    user: any;
    birthChart: any;
    predictions: any;
  }) {
    this.addHeader(
      'Complete Vedic Astrology Report',
      `For ${data.user.firstName} ${data.user.lastName || ''}`
    );

    // Birth Details
    this.addSectionHeading('Birth Information');
    this.addKeyValuePairs([
      { key: 'Date of Birth', value: new Date(data.user.birthDate).toLocaleDateString() },
      { key: 'Time of Birth', value: data.user.birthTime || 'Not provided' },
      { key: 'Place of Birth', value: data.user.birthPlace || 'Not provided' },
      { key: 'Sun Sign', value: data.user.sunSign || 'N/A' },
      { key: 'Moon Sign', value: data.user.moonSign || 'N/A' },
      { key: 'Ascendant', value: data.user.ascendant || 'N/A' }
    ]);

    // Birth Chart
    this.addSectionHeading('Birth Chart (Rashi Chart)');
    this.addChartPlaceholder('D1 - Rashi Chart', 250);

    // Planetary Positions
    this.addSectionHeading('Planetary Positions');
    this.addParagraph('Detailed analysis of planetary placements and their significance in your life.');

    // Predictions
    this.addSectionHeading('Life Predictions');
    this.addSubsectionHeading('Career & Profession');
    this.addParagraph('Career analysis based on 10th house and planetary positions...');

    this.addSubsectionHeading('Relationships & Marriage');
    this.addParagraph('Relationship predictions based on 7th house analysis...');

    this.addSubsectionHeading('Health & Wellness');
    this.addParagraph('Health indications from your birth chart...');

    // Remedies
    this.addSectionHeading('Vedic Remedies');
    this.addInfoBox(
      'Recommended Remedies',
      'Based on your planetary positions, the following remedies are recommended for balance and prosperity.',
      'info'
    );

    return this;
  }
}

// =====================================================
// NUMEROLOGY REPORT
// =====================================================

export class NumerologyReport extends BasePDFReport {
  generateReport(data: {
    user: any;
    lifePath: number;
    destiny: number;
    soulUrge: number;
    personality: number;
    readings: any;
  }) {
    this.addHeader(
      'Complete Numerology Report',
      `For ${data.user.firstName} ${data.user.lastName || ''}`
    );

    // Core Numbers
    this.addSectionHeading('Your Core Numbers');
    this.addKeyValuePairs([
      { key: 'Life Path Number', value: data.lifePath.toString() },
      { key: 'Destiny Number', value: data.destiny.toString() },
      { key: 'Soul Urge Number', value: data.soulUrge.toString() },
      { key: 'Personality Number', value: data.personality.toString() }
    ]);

    // Life Path Analysis
    this.addSectionHeading('Life Path Number Analysis');
    this.addParagraph(`Your Life Path Number is ${data.lifePath}. This number reveals your life's purpose and the path you're meant to follow.`);

    // Lo Shu Grid
    this.addSectionHeading('Lo Shu Grid Analysis');
    this.addChartPlaceholder('Your Lo Shu Grid (3x3 Magic Square)', 200);

    // Predictions
    this.addSectionHeading('Numerological Predictions');
    this.addSubsectionHeading('Personal Year Forecast');
    this.addParagraph('Based on your current personal year number...');

    return this;
  }
}

// =====================================================
// PALMISTRY REPORT
// =====================================================

export class PalmistryReport extends BasePDFReport {
  generateReport(data: {
    user: any;
    reading: any;
  }) {
    this.addHeader(
      'Complete Palmistry Reading',
      `For ${data.user.firstName} ${data.user.lastName || ''}`
    );

    // Hand Shape
    this.addSectionHeading('Hand Shape Analysis');
    this.addKeyValuePairs([
      { key: 'Hand Shape', value: data.reading.handShape },
      { key: 'Element', value: data.reading.handElement },
      { key: 'Dominant Planet', value: data.reading.dominantPlanet }
    ]);

    this.addParagraph(data.reading.handPersonality);

    // Major Lines
    this.addSectionHeading('Major Lines Analysis');

    this.addSubsectionHeading('Heart Line');
    this.addParagraph('Analysis of emotional nature and relationships...');

    this.addSubsectionHeading('Head Line');
    this.addParagraph('Analysis of intellectual capabilities...');

    this.addSubsectionHeading('Life Line');
    this.addParagraph('Analysis of vitality and life force...');

    // Mounts
    this.addSectionHeading('Planetary Mounts');
    this.addParagraph('The development of mounts on your palm reveals planetary influences...');

    // Strengths
    this.addSectionHeading('Your Strengths');
    this.addBulletList(data.reading.strengths);

    // Recommendations
    this.addSectionHeading('Career Recommendations');
    this.addBulletList(data.reading.careerSuggestions);

    return this;
  }
}

// =====================================================
// COMPATIBILITY REPORT
// =====================================================

export class CompatibilityReport extends BasePDFReport {
  generateReport(data: {
    user1: any;
    user2: any;
    compatibility: any;
  }) {
    this.addHeader(
      'Compatibility Analysis Report',
      `${data.user1.firstName} & ${data.user2.firstName}`
    );

    // Overall Score
    this.addSectionHeading('Compatibility Overview');
    this.addInfoBox(
      `Overall Compatibility: ${data.compatibility.score}%`,
      `Your overall compatibility score indicates a ${data.compatibility.score > 70 ? 'strong' : 'moderate'} connection.`,
      data.compatibility.score > 70 ? 'success' : 'info'
    );

    // Detailed Analysis
    this.addSectionHeading('Detailed Compatibility Analysis');

    const compatTable = [
      ['Aspect', 'Score', 'Analysis'],
      ['Emotional', `${data.compatibility.emotional}%`, 'Good'],
      ['Mental', `${data.compatibility.mental}%`, 'Excellent'],
      ['Physical', `${data.compatibility.physical}%`, 'Strong'],
      ['Spiritual', `${data.compatibility.spiritual}%`, 'Moderate']
    ];

    this.addTable(
      compatTable[0],
      compatTable.slice(1)
    );

    // Strengths
    this.addSectionHeading('Relationship Strengths');
    this.addBulletList(data.compatibility.strengths);

    // Challenges
    this.addSectionHeading('Areas to Work On');
    this.addBulletList(data.compatibility.challenges);

    // Recommendations
    this.addSectionHeading('Recommendations');
    this.addParagraph('Based on your compatibility analysis, here are personalized recommendations...');

    return this;
  }
}

// =====================================================
// COMPREHENSIVE REPORT (ALL SYSTEMS)
// =====================================================

export class ComprehensiveReport extends BasePDFReport {
  generateReport(data: {
    user: any;
    vedic: any;
    numerology: any;
    palmistry: any;
    bazi: any;
    medical: any;
  }) {
    this.addHeader(
      'Complete Astrology & Divination Report',
      `All 9 Systems Analysis for ${data.user.firstName} ${data.user.lastName || ''}`
    );

    // Introduction
    this.addSectionHeading('Introduction');
    this.addParagraph(
      'This comprehensive report combines insights from 9 different divination systems to provide you with the most complete understanding of your life path, personality, and destiny.'
    );

    // Table of Contents
    this.addSectionHeading('Systems Covered');
    this.addBulletList([
      '1. Vedic Astrology - Ancient Indian astrological wisdom',
      '2. Numerology (8 Systems) - Pythagorean, Chaldean, Vedic, Lo Shu, Tamil, Chinese, Kabbalah, Yantra',
      '3. Palmistry - Hand reading and analysis',
      '4. Chinese BaZi - Four Pillars of Destiny',
      '5. Medical Astrology - Health predictions',
      '6. Crystal Therapy - Gemstone recommendations',
      '7. Dasha Systems - Planetary period analysis',
      '8. Lal Kitab - Karmic debt remedies',
      '9. KP Astrology - Precise predictions'
    ]);

    // Each system gets its own section
    // (Implementation would add each system's analysis)

    return this;
  }
}

// =====================================================
// EXPORT FUNCTIONS
// =====================================================

export async function generateVedicReport(data: any): Promise<Buffer> {
  const report = new VedicAstrologyReport();
  report.generateReport(data);
  return report.generateToBuffer();
}

export async function generateNumerologyReport(data: any): Promise<Buffer> {
  const report = new NumerologyReport();
  report.generateReport(data);
  return report.generateToBuffer();
}

export async function generatePalmistryReport(data: any): Promise<Buffer> {
  const report = new PalmistryReport();
  report.generateReport(data);
  return report.generateToBuffer();
}

export async function generateCompatibilityReport(data: any): Promise<Buffer> {
  const report = new CompatibilityReport();
  report.generateReport(data);
  return report.generateToBuffer();
}

export async function generateComprehensiveReport(data: any): Promise<Buffer> {
  const report = new ComprehensiveReport();
  report.generateReport(data);
  return report.generateToBuffer();
}

export default {
  VedicAstrologyReport,
  NumerologyReport,
  PalmistryReport,
  CompatibilityReport,
  ComprehensiveReport,
  generateVedicReport,
  generateNumerologyReport,
  generatePalmistryReport,
  generateCompatibilityReport,
  generateComprehensiveReport
};
