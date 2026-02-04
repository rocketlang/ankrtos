/**
 * Run Day 1 Port Scrapers (10 Indian Ports)
 * Chennai, Visakhapatnam, Kochi, Kolkata, Paradip, Kandla, Tuticorin, New Mangalore, Haldia, Ennore
 */

import { scrapeChennaiPort } from '../src/services/port-scrapers/chennai-port.js';
import { scrapeVisakhapatnamPort } from '../src/services/port-scrapers/visakhapatnam-port.js';
import { scrapeKochiPort } from '../src/services/port-scrapers/kochi-port.js';
import { scrapeBatchIndianPorts } from '../src/services/port-scrapers/batch-indian-ports.js';

async function main() {
  console.log('🚢 Starting Day 1 Port Scraper Run');
  console.log('Target: 10 Indian Ports');
  console.log('Expected: 100-120 tariffs\n');

  const results: any[] = [];

  // 1. Chennai
  console.log('\n=== Port 1/10: Chennai (INMAA) ===');
  try {
    const chennai = await scrapeChennaiPort();
    results.push({ port: 'Chennai', ...chennai });
    console.log(`✅ Chennai: ${chennai.success ? 'Success' : 'Failed'}`);
  } catch (error: any) {
    console.error(`❌ Chennai: ${error.message}`);
    results.push({ port: 'Chennai', success: false, error: error.message });
  }

  // Rate limiting
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 2. Visakhapatnam
  console.log('\n=== Port 2/10: Visakhapatnam (INVIS) ===');
  try {
    const vizag = await scrapeVisakhapatnamPort();
    results.push({ port: 'Visakhapatnam', ...vizag });
    console.log(`✅ Visakhapatnam: ${vizag.success ? 'Success' : 'Failed'}`);
  } catch (error: any) {
    console.error(`❌ Visakhapatnam: ${error.message}`);
    results.push({ port: 'Visakhapatnam', success: false, error: error.message });
  }

  // Rate limiting
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. Kochi
  console.log('\n=== Port 3/10: Kochi (INCOK) ===');
  try {
    const kochi = await scrapeKochiPort();
    results.push({ port: 'Kochi', ...kochi });
    console.log(`✅ Kochi: ${kochi.success ? 'Success' : 'Failed'}`);
  } catch (error: any) {
    console.error(`❌ Kochi: ${error.message}`);
    results.push({ port: 'Kochi', success: false, error: error.message });
  }

  // Rate limiting
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 4-10. Batch Indian Ports
  console.log('\n=== Ports 4-10: Batch Indian Ports ===');
  try {
    const batchResults = await scrapeBatchIndianPorts();
    results.push(...batchResults.map(r => ({ ...r, port: r.portId })));
    console.log(`✅ Batch complete: ${batchResults.length} ports processed`);
  } catch (error: any) {
    console.error(`❌ Batch: ${error.message}`);
    results.push({ port: 'Batch', success: false, error: error.message });
  }

  // Summary
  console.log('\n\n=== DAY 1 SUMMARY ===');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalTariffs = results.reduce((sum, r) => sum + (r.tariffs || 0), 0);

  console.log(`Ports Scraped: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Tariffs Extracted: ${totalTariffs}`);
  console.log(`PDFs Queued: ${results.filter(r => r.source === 'pdf').length}`);

  console.log('\n\n=== DETAILED RESULTS ===');
  results.forEach(r => {
    console.log(`\n${r.port}:`);
    console.log(`  Success: ${r.success}`);
    console.log(`  Tariffs: ${r.tariffs || 0}`);
    console.log(`  Source: ${r.source || 'none'}`);
    if (r.errors && r.errors.length > 0) {
      console.log(`  Errors: ${r.errors.join(', ')}`);
    }
  });

  return results;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
