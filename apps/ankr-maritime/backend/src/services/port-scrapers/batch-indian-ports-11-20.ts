/**
 * Batch Indian Port Scrapers (Ports 11-20)
 * Mormugao, Kamarajar, Krishnapatnam, Mundra, Hazira, Pipavav, Dhamra, Dahej, Gangavaram, Kakinada
 */

import { PDFDownloaderService } from '../pdf-downloader.service.js';
import { prisma } from '../../lib/prisma.js';

const PORT_CONFIGS = {
  INMRM: {
    name: 'Mormugao',
    url: 'https://www.mptgoa.gov.in/writereaddata/SOR-2024-25.pdf',
  },
  INENR: {
    name: 'Kamarajar (Ennore)',
    url: 'https://www.kamarajarport.in/writereaddata/SOR-2024-25.pdf',
  },
  INKRI: {
    name: 'Krishnapatnam',
    url: 'https://www.kppl.in/tariff-2024-25.pdf',
  },
  INMUN: {
    name: 'Mundra',
    url: 'https://www.adaniports.com/-/media/Project/Ports/Mundra-Port/PDF/Tariff/SOR-2024-25.pdf',
  },
  INHZR: {
    name: 'Hazira',
    url: 'https://www.adaniports.com/-/media/Project/Ports/Hazira-Port/PDF/Tariff/SOR-2024-25.pdf',
  },
  INPAV: {
    name: 'Pipavav',
    url: 'https://www.apmterminals.com/en/pipavav/about/tariffs',
  },
  INDHA: {
    name: 'Dhamra',
    url: 'https://www.adaniports.com/-/media/Project/Ports/Dhamra-Port/PDF/Tariff/SOR-2024-25.pdf',
  },
  INDAH: {
    name: 'Dahej',
    url: 'https://www.petronetlng.in/dahej-terminal.aspx', // LNG terminal, may not have public tariffs
  },
  INGAG: {
    name: 'Gangavaram',
    url: 'https://www.gangavaramport.com/tariff.html',
  },
  INKAK: {
    name: 'Kakinada',
    url: 'http://www.kakinadaseaport.com/tariff-policy',
  },
};

export async function scrapeBatchIndianPorts11to20() {
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
      } else if (pdfResult.success) {
        console.log(`✅ ${config.name}: No changes`);
        results.push({ portId, success: true, tariffs: 0 });
      } else {
        console.log(`⚠️  ${config.name}: PDF download failed, may need HTML extraction`);
        results.push({ portId, success: false, error: 'PDF download failed' });
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
