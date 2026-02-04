/**
 * Cochin Port Trust Scraper (INCOK)
 * Gateway to Kerala, India
 * Website: https://www.cochinport.gov.in/tariff
 */

import { PDFDownloaderService } from '../pdf-downloader.service.js';
import { prisma } from '../../lib/prisma.js';

export async function scrapeKochiPort(portId: string = 'INCOK') {
  const downloader = new PDFDownloaderService();
  const errors: string[] = [];

  try {
    console.log(`🚢 Scraping Kochi Port (${portId})...`);
    
    const pdfResult = await downloader.downloadPDF({
      url: 'https://www.cochinport.gov.in/sites/default/files/SOR-2024-25.pdf',
      portId,
      outputDir: './downloads/tariffs',
    });

    if (pdfResult.success && pdfResult.changeDetected) {
      await prisma.tariffIngestionTask.create({
        data: {
          portId,
          sourceType: 'pdf',
          sourcePath: pdfResult.filePath,
          status: 'pending',
          priority: 1,
          metadata: { hash: pdfResult.hash },
        },
      });
      console.log(`✅ Kochi: New PDF queued`);
      return { success: true, tariffs: 0, errors, source: 'pdf' };
    }
    
    console.log(`✅ Kochi: No changes`);
    return { success: true, tariffs: 0, errors, source: 'pdf' };
  } catch (error: any) {
    return { success: false, tariffs: 0, errors: [error.message], source: 'none' };
  }
}
