/**
 * Chennai Port Trust Scraper (INMAA)
 * India's 2nd largest port, major cargo hub
 * Website: https://www.chennaiport.gov.in/content/tariff
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

export async function scrapeChennaiPort(portId: string = 'INMAA'): Promise<ScrapeResult> {
  const errors: string[] = [];
  const downloader = new PDFDownloaderService();
  const extractor = new HTMLTableExtractorService();

  try {
    console.log(`🚢 Scraping Chennai Port (${portId})...`);

    // Strategy 1: Download tariff PDF from Chennai Port website
    const pdfUrl = 'https://www.chennaiport.gov.in/sites/default/files/2024-2025-scale-of-rates.pdf';

    try {
      const pdfResult = await downloader.downloadPDF({
        url: pdfUrl,
        portId,
        outputDir: './downloads/tariffs',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      });

      if (pdfResult.success && !pdfResult.changeDetected) {
        console.log(`✅ Chennai Port: PDF downloaded but no changes detected`);
        return { success: true, tariffs: 0, errors, source: 'pdf' };
      }

      if (pdfResult.success && pdfResult.changeDetected) {
        // PDF changed - needs to be processed by tariff extraction pipeline
        console.log(`✅ Chennai Port: New PDF downloaded, queued for processing`);
        console.log(`   File: ${pdfResult.filePath}`);

        // Create tariff ingestion task
        await prisma.tariffIngestionTask.create({
          data: {
            portId,
            sourceType: 'pdf',
            sourcePath: pdfResult.filePath,
            status: 'pending',
            priority: 1, // High priority
            metadata: {
              url: pdfUrl,
              hash: pdfResult.hash,
              scraperVersion: '1.0',
            },
          },
        });

        return {
          success: true,
          tariffs: 0, // Will be processed later
          errors,
          source: 'pdf',
        };
      }
    } catch (pdfError: any) {
      console.warn(`⚠️  Chennai Port: PDF download failed: ${pdfError.message}`);
      errors.push(`PDF download failed: ${pdfError.message}`);
    }

    // Strategy 2: Scrape HTML table (fallback)
    try {
      const htmlUrl = 'https://www.chennaiport.gov.in/content/tariff';
      const response = await axios.get(htmlUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 30000,
      });

      const extractResult = await extractor.extractFromHTML(response.data, {
        portId,
        tableSelector: 'table.tariff-table, table.rates-table, table',
        columnMapping: {
          chargeType: 0,
          description: 1,
          amount: 2,
          unit: 3,
          currency: 4,
        },
        currencyDefault: 'INR',
      });

      if (extractResult.success && extractResult.tariffs.length > 0) {
        console.log(`✅ Chennai Port: Extracted ${extractResult.tariffs.length} tariffs from HTML`);

        // Store extracted tariffs
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
              currency: tariff.currency || 'INR',
              unit: tariff.unit,
              sizeRangeMin: tariff.sizeRangeMin,
              sizeRangeMax: tariff.sizeRangeMax,
              description: tariff.description,
              dataSource: 'REAL_SCRAPED',
              scrapedAt: new Date(),
            },
            update: {
              amount: tariff.amount,
              currency: tariff.currency || 'INR',
              description: tariff.description,
              scrapedAt: new Date(),
            },
          });
        }

        return {
          success: true,
          tariffs: extractResult.tariffs.length,
          errors,
          source: 'html',
        };
      }
    } catch (htmlError: any) {
      console.warn(`⚠️  Chennai Port: HTML extraction failed: ${htmlError.message}`);
      errors.push(`HTML extraction failed: ${htmlError.message}`);
    }

    // No strategy succeeded
    console.error(`❌ Chennai Port: All scraping strategies failed`);
    return {
      success: false,
      tariffs: 0,
      errors: errors.length > 0 ? errors : ['All strategies failed'],
      source: 'none',
    };

  } catch (error: any) {
    console.error(`❌ Chennai Port scraper error: ${error.message}`);
    errors.push(error.message);
    return {
      success: false,
      tariffs: 0,
      errors,
      source: 'none',
    };
  }
}
