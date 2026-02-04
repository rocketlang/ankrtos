/**
 * Batch Indian Port Scrapers (Ports 4-10)
 * Kolkata, Paradip, Kandla, Tuticorin, New Mangalore, Haldia, Ennore
 */

import { PDFDownloaderService } from '../pdf-downloader.service.js';
import { prisma } from '../../lib/prisma.js';

const PORT_CONFIGS = {
  INCCU: {
    name: 'Kolkata',
    url: 'https://www.kolkataporttrust.gov.in/pdf/SOR-2024-25.pdf',
  },
  INPRD: {
    name: 'Paradip',
    url: 'https://paradipport.gov.in/sites/default/files/SOR-2024-25.pdf',
  },
  INKAN: {
    name: 'Kandla',
    url: 'http://www.deendayalport.gov.in/writereaddata/uploadeddocs/sor-2024-25.pdf',
  },
  INTUT: {
    name: 'Tuticorin',
    url: 'https://www.tuticorinport.gov.in/writereaddata/SOR-2024-25.pdf',
  },
  INNMG: {
    name: 'New Mangalore',
    url: 'https://newmangaloreport.gov.in/sites/default/files/SOR-2024-25.pdf',
  },
  INHLD: {
    name: 'Haldia',
    url: 'http://www.haldiaport.gov.in/writereaddata/SOR-2024-25.pdf',
  },
  INENN: {
    name: 'Ennore',
    url: 'https://www.ennoreport.gov.in/writereaddata/SOR-2024-25.pdf',
  },
};

export async function scrapeBatchIndianPorts() {
  const downloader = new PDFDownloaderService();
  const results: any[] = [];

  for (const [portId, config] of Object.entries(PORT_CONFIGS)) {
    try {
      console.log(`🚢 Scraping ${config.name} (${portId})...`);

      const pdfResult = await downloader.downloadPDF({
        url: config.url,
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
            metadata: { url: config.url, hash: pdfResult.hash },
          },
        });
        console.log(`✅ ${config.name}: New PDF queued`);
        results.push({ portId, success: true, tariffs: 0 });
      } else {
        console.log(`✅ ${config.name}: No changes`);
        results.push({ portId, success: true, tariffs: 0 });
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error: any) {
      console.error(`❌ ${config.name}: ${error.message}`);
      results.push({ portId, success: false, error: error.message });
    }
  }

  return results;
}
