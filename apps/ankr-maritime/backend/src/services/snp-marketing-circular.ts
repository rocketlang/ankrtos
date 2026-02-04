/**
 * S&P Marketing Circular Generator
 * Phase 4: Ship Broking & S&P
 *
 * Features:
 * - Professional PDF marketing circular generation
 * - Vessel specifications formatting
 * - Photo/image inclusion
 * - Market positioning text
 * - Distribution list management
 */

import { prisma } from '../lib/prisma.js';

export interface MarketingCircular {
  id: string;
  listingId: string;
  title: string;
  subject: string;
  vesselName: string;
  vesselType: string;
  headline: string;
  content: string;
  specifications: VesselSpecs;
  financials: FinancialHighlights;
  contactInfo: ContactInfo;
  disclaimer: string;
  generatedAt: Date;
  distributedAt?: Date;
}

export interface VesselSpecs {
  vesselName: string;
  vesselType: string;
  flag: string;
  built: number;
  builder: string;
  dwt: number;
  loa: number;
  beam: number;
  draft: number;
  teu?: number;
  holds?: number;
  hatches?: number;
  grabs?: number;
  cranes?: number;
  me: string; // Main engine
  mcr: string; // Maximum continuous rating
  speed: number;
  consumption: { sea: number; port: number };
  tanks: number;
  class: string;
  pandi: string;
}

export interface FinancialHighlights {
  askingPrice: number;
  currency: string;
  priceCommentary?: string;
  lastSurvey?: Date;
  nextDD?: Date;
  nextSS?: Date;
}

export interface ContactInfo {
  brokerName: string;
  brokerEmail: string;
  brokerPhone: string;
  companyName: string;
}

class SNPMarketingCircularService {
  /**
   * Generate marketing circular for vessel listing
   */
  async generateCircular(listingId: string): Promise<MarketingCircular> {
    // Fetch listing details
    // In production: const listing = await prisma.saleListing.findUnique({ where: { id: listingId } });

    const circular: MarketingCircular = {
      id: `circ-${Date.now()}`,
      listingId,
      title: 'VESSEL FOR SALE',
      subject: 'FOR SALE - MV PACIFIC DREAM (82,000 DWT BULK CARRIER, 2010 BLT)',
      vesselName: 'MV PACIFIC DREAM',
      vesselType: 'Panamax Bulk Carrier',
      headline: 'WELL-MAINTAINED PANAMAX BULK CARRIER - PROMPT DELIVERY',
      content: this.generateContent(),
      specifications: this.generateSpecifications(),
      financials: this.generateFinancials(),
      contactInfo: this.generateContactInfo(),
      disclaimer: this.generateDisclaimer(),
      generatedAt: new Date(),
    };

    return circular;
  }

  /**
   * Generate marketing content
   */
  private generateContent(): string {
    return `
We are pleased to offer for sale the MV PACIFIC DREAM, a well-maintained Panamax bulk carrier built in 2010 by Hyundai Heavy Industries.

KEY HIGHLIGHTS:
• Premium Japanese-built vessel from reputable yard
• Single owner since delivery
• Well-maintained with full Class records
• Recent Special Survey completed (2024)
• Ready for prompt delivery
• Ice Class 1A notation
• Excellent cargo versatility (5 holds / 5 hatches)
• Fuel-efficient main engine with low consumption
• Clean hull with recent drydocking

COMMERCIAL PROFILE:
The vessel has been employed on quality time charter contracts with major charterers including Cargill, Bunge, and Louis Dreyfus. Excellent performance record with minimal off-hire. The vessel's modern design and fuel efficiency make it highly competitive in today's market.

TECHNICAL CONDITION:
The vessel is in excellent condition, having been maintained to the highest standards throughout its operational life. Recent steel renewals during last drydocking. All class surveys up to date with no overdue recommendations.

DELIVERY:
The vessel is currently trading on a time charter expiring in March 2026 and will be available for delivery promptly thereafter. Early delivery may be arranged subject to charterer's consent.

We invite serious buyers to submit their best offers. Inspection can be arranged at next convenient port.
    `.trim();
  }

  /**
   * Generate vessel specifications
   */
  private generateSpecifications(): VesselSpecs {
    return {
      vesselName: 'MV PACIFIC DREAM',
      vesselType: 'Panamax Bulk Carrier',
      flag: 'Panama',
      built: 2010,
      builder: 'Hyundai Heavy Industries, Korea',
      dwt: 82000,
      loa: 229.0,
      beam: 32.26,
      draft: 14.45,
      holds: 5,
      hatches: 5,
      grabs: 4,
      cranes: 0,
      me: 'MAN B&W 6S60MC-C',
      mcr: '13,560 BHP at 105 RPM',
      speed: 14.5,
      consumption: { sea: 32.5, port: 5.0 },
      tanks: 7,
      class: 'NK (Nippon Kaiji Kyokai) + Ice Class 1A',
      pandi: 'UK P&I Club',
    };
  }

  /**
   * Generate financial highlights
   */
  private generateFinancials(): FinancialHighlights {
    return {
      askingPrice: 18500000,
      currency: 'USD',
      priceCommentary: 'Competitive market price. Genuine sellers, open to reasonable offers.',
      lastSurvey: new Date('2024-03-15'),
      nextDD: new Date('2029-03-15'),
      nextSS: new Date('2029-03-15'),
    };
  }

  /**
   * Generate contact information
   */
  private generateContactInfo(): ContactInfo {
    return {
      brokerName: 'John Smith',
      brokerEmail: 'john.smith@mari8x.com',
      brokerPhone: '+65 9123 4567',
      companyName: 'Mari8X Ship Brokers Pte Ltd',
    };
  }

  /**
   * Generate disclaimer
   */
  private generateDisclaimer(): string {
    return `
DISCLAIMER:
All particulars believed to be correct but not guaranteed. Sellers and/or their Agents reserve the right to modify specifications, pricing and terms without notice. This circular does not constitute an offer and is subject to prior sale, price revision, or withdrawal without notice. Interested parties should verify all information independently. The vessel is offered subject to being unsold and/or still available at the time of negotiation and contract. E&OE.
    `.trim();
  }

  /**
   * Format circular as HTML (for PDF generation)
   */
  formatAsHTML(circular: MarketingCircular): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 10px;
    }
    .subject {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .headline {
      font-size: 16px;
      color: #666;
      font-style: italic;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #0066cc;
      border-bottom: 2px solid #ccc;
      padding-bottom: 5px;
      margin-bottom: 15px;
    }
    .content {
      line-height: 1.6;
      white-space: pre-line;
    }
    .specs-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .specs-table td {
      padding: 8px;
      border-bottom: 1px solid #eee;
    }
    .specs-table td:first-child {
      font-weight: bold;
      width: 40%;
    }
    .financials {
      background-color: #f0f8ff;
      padding: 20px;
      border-radius: 5px;
      margin-top: 10px;
    }
    .price {
      font-size: 24px;
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 10px;
    }
    .contact {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
      margin-top: 10px;
    }
    .disclaimer {
      font-size: 10px;
      color: #666;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${circular.title}</div>
    <div class="subject">${circular.subject}</div>
    <div class="headline">${circular.headline}</div>
  </div>

  <div class="section">
    <div class="section-title">MARKETING DESCRIPTION</div>
    <div class="content">${circular.content}</div>
  </div>

  <div class="section">
    <div class="section-title">VESSEL SPECIFICATIONS</div>
    <table class="specs-table">
      <tr>
        <td>Vessel Name:</td>
        <td>${circular.specifications.vesselName}</td>
      </tr>
      <tr>
        <td>Type:</td>
        <td>${circular.specifications.vesselType}</td>
      </tr>
      <tr>
        <td>Flag:</td>
        <td>${circular.specifications.flag}</td>
      </tr>
      <tr>
        <td>Built:</td>
        <td>${circular.specifications.built}</td>
      </tr>
      <tr>
        <td>Builder:</td>
        <td>${circular.specifications.builder}</td>
      </tr>
      <tr>
        <td>DWT:</td>
        <td>${circular.specifications.dwt.toLocaleString()} MT</td>
      </tr>
      <tr>
        <td>LOA / Beam / Draft:</td>
        <td>${circular.specifications.loa}m / ${circular.specifications.beam}m / ${circular.specifications.draft}m</td>
      </tr>
      <tr>
        <td>Holds / Hatches:</td>
        <td>${circular.specifications.holds} / ${circular.specifications.hatches}</td>
      </tr>
      <tr>
        <td>Main Engine:</td>
        <td>${circular.specifications.me}</td>
      </tr>
      <tr>
        <td>MCR:</td>
        <td>${circular.specifications.mcr}</td>
      </tr>
      <tr>
        <td>Speed:</td>
        <td>${circular.specifications.speed} knots (laden)</td>
      </tr>
      <tr>
        <td>Consumption:</td>
        <td>Sea: ${circular.specifications.consumption.sea} MT/day, Port: ${circular.specifications.consumption.port} MT/day</td>
      </tr>
      <tr>
        <td>Class:</td>
        <td>${circular.specifications.class}</td>
      </tr>
      <tr>
        <td>P&I:</td>
        <td>${circular.specifications.pandi}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">FINANCIAL INFORMATION</div>
    <div class="financials">
      <div class="price">${circular.financials.currency} ${circular.financials.askingPrice.toLocaleString()}</div>
      <div>${circular.financials.priceCommentary}</div>
      <div style="margin-top: 15px;">
        <strong>Last Special Survey:</strong> ${circular.financials.lastSurvey?.toLocaleDateString()}<br>
        <strong>Next DD/SS Due:</strong> ${circular.financials.nextDD?.toLocaleDateString()}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">CONTACT INFORMATION</div>
    <div class="contact">
      <strong>${circular.contactInfo.companyName}</strong><br>
      ${circular.contactInfo.brokerName}<br>
      Email: ${circular.contactInfo.brokerEmail}<br>
      Tel: ${circular.contactInfo.brokerPhone}
    </div>
  </div>

  <div class="disclaimer">
    ${circular.disclaimer}
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate PDF circular (placeholder - would use @ankr/pdf in production)
   */
  async generatePDF(circular: MarketingCircular): Promise<string> {
    const html = this.formatAsHTML(circular);

    // In production: Use @ankr/pdf
    // const pdf = await pdfService.generateFromHTML(html);
    // return pdf.path;

    return `/pdfs/marketing-circular-${circular.id}.pdf`;
  }

  /**
   * Distribute circular to mailing list
   */
  async distributeCircular(
    circularId: string,
    recipients: string[],
    customMessage?: string
  ): Promise<{ sent: number; failed: number }> {
    // In production: Send emails with circular attached
    // const circular = await prisma.marketingCircular.findUnique({ where: { id: circularId } });
    // const pdfPath = await this.generatePDF(circular);

    // for (const email of recipients) {
    //   await emailService.send({
    //     to: email,
    //     subject: circular.subject,
    //     body: customMessage || 'Please find attached marketing circular for vessel for sale.',
    //     attachments: [{ path: pdfPath }],
    //   });
    // }

    return {
      sent: recipients.length,
      failed: 0,
    };
  }

  /**
   * Get distribution list (typical S&P buyers)
   */
  async getDistributionList(vesselType: string): Promise<string[]> {
    // In production: Query contact database for S&P buyers
    // return await prisma.contact.findMany({
    //   where: {
    //     company: { type: 'owner' },
    //     preferredVesselTypes: { has: vesselType },
    //   },
    //   select: { email: true },
    // });

    return [
      'buyer1@pacificshipping.com',
      'buyer2@starmaritime.com',
      'buyer3@globalfleet.com',
      'buyer4@oceancarriers.com',
      'buyer5@maritimeinvestors.com',
    ];
  }
}

export const snpMarketingCircularService = new SNPMarketingCircularService();
