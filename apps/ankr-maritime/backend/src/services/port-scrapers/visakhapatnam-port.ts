/**
 * Visakhapatnam Port Trust Scraper (INVIS)
 * Major cargo hub on India's East Coast
 * Website: http://vizagport.com/tariff.html
 */

import { PDFDownloaderService } from '../pdf-downloader.service.js';
import { HTMLTableExtractorService } from '../html-table-extractor.service.js';
import axios from 'axios';
import { prisma } from '../../lib/prisma.js';

export interface ScrapeResult {
  success: boolean;
  tariffs: number;
  errors: string[];
  source: 'pdf' | 'html' | 'none';
}

export async function scrapeVisakhapatnamPort(portId: string = 'INVIS'): Promise<ScrapeResult> {
  const errors: string[] = [];
  const downloader = new PDFDownloaderService();
  const extractor = new HTMLTableExtractorService();

  try {
    console.log(`🚢 Scraping Visakhapatnam Port (${portId})...`);

    // Strategy 1: Download tariff PDF
    const pdfUrl = 'http://vizagport.com/pdf/SoR-2024-2025.pdf';

    try {
      const pdfResult = await downloader.downloadPDF({
        url: pdfUrl,
        portId,
        outputDir: './downloads/tariffs',
      });

      if (pdfResult.success) {
        if (!pdfResult.changeDetected) {
          console.log(`✅ Visakhapatnam: No changes detected`);
          return { success: true, tariffs: 0, errors, source: 'pdf' };
        }

        await prisma.tariffIngestionTask.create({
          data: {
            portId,
            sourceType: 'pdf',
            sourcePath: pdfResult.filePath,
            status: 'pending',
            priority: 1,
            metadata: { url: pdfUrl, hash: pdfResult.hash },
          },
        });

        console.log(`✅ Visakhapatnam: New PDF queued for processing`);
        return { success: true, tariffs: 0, errors, source: 'pdf' };
      }
    } catch (error: any) {
      errors.push(`PDF: ${error.message}`);
    }

    // Strategy 2: HTML extraction
    try {
      const htmlUrl = 'http://vizagport.com/tariff.html';
      const response = await axios.get(htmlUrl, { timeout: 30000 });

      const extractResult = await extractor.extractFromHTML(response.data, {
        portId,
        tableSelector: 'table',
        columnMapping: { chargeType: 0, amount: 1, unit: 2 },
        currencyDefault: 'INR',
      });

      if (extractResult.success && extractResult.tariffs.length > 0) {
        for (const tariff of extractResult.tariffs) {
          await prisma.portTariff.upsert({
            where: {
              portId_chargeType_sizeRangeMin_sizeRangeMax_unit: {
                portId,
                chargeType: tariff.chargeType,
                sizeRangeMin: tariff.sizeRangeMin || 0,
                sizeRangeMax: tariff.sizeRangeMax || 999999,
                unit: tariff.unit,
              },
            },
            create: {
              portId,
              chargeType: tariff.chargeType,
              amount: tariff.amount,
              currency: 'INR',
              unit: tariff.unit,
              sizeRangeMin: tariff.sizeRangeMin,
              sizeRangeMax: tariff.sizeRangeMax,
              dataSource: 'REAL_SCRAPED',
              scrapedAt: new Date(),
            },
            update: {
              amount: tariff.amount,
              scrapedAt: new Date(),
            },
          });
        }

        console.log(`✅ Visakhapatnam: ${extractResult.tariffs.length} tariffs extracted`);
        return { success: true, tariffs: extractResult.tariffs.length, errors, source: 'html' };
      }
    } catch (error: any) {
      errors.push(`HTML: ${error.message}`);
    }

    return { success: false, tariffs: 0, errors, source: 'none' };
  } catch (error: any) {
    return { success: false, tariffs: 0, errors: [error.message], source: 'none' };
  }
}
