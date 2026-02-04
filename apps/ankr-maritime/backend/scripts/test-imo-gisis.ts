#!/usr/bin/env tsx
/**
 * MOMENT OF TRUTH: Test IMO GISIS scraper
 */

import { imoGisisScraper } from '../src/services/imo-gisis-scraper.js';

async function testIMOGISIS() {
  console.log('🌊 MOMENT OF TRUTH: Testing IMO GISIS Scraper\n');
  console.log('═'.repeat(60));

  const testIMO = '9348522'; // GOLDEN CURL from user's Equasis test

  console.log(`\n📋 Testing vessel: IMO ${testIMO} (GOLDEN CURL)`);
  console.log('⏳ Scraping IMO GISIS (this may take 5-10 seconds)...\n');

  try {
    const startTime = Date.now();
    const data = await imoGisisScraper.scrapeVesselData(testIMO);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (data) {
      console.log('✅ SUCCESS! Data retrieved from IMO GISIS\n');
      console.log('═'.repeat(60));
      console.log('📊 VESSEL INFORMATION:');
      console.log('═'.repeat(60));
      console.log(`  Name:              ${data.name || 'N/A'}`);
      console.log(`  IMO:               ${data.imo}`);
      console.log(`  MMSI:              ${data.mmsi || 'N/A'}`);
      console.log(`  Call Sign:         ${data.callSign || 'N/A'}`);
      console.log(`  Flag:              ${data.flag || 'N/A'}`);
      console.log(`  Ship Type:         ${data.shipType || 'N/A'}`);
      console.log(`  Port of Registry:  ${data.portOfRegistry || 'N/A'}`);
      console.log(`  Status:            ${data.status || 'N/A'}`);

      console.log('\n' + '═'.repeat(60));
      console.log('📏 TECHNICAL SPECIFICATIONS:');
      console.log('═'.repeat(60));
      console.log(`  Gross Tonnage:     ${data.grossTonnage || 'N/A'}`);
      console.log(`  Deadweight:        ${data.deadweight || 'N/A'}`);
      console.log(`  Length Overall:    ${data.lengthOverall || 'N/A'}m`);
      console.log(`  Breadth:           ${data.breadth || 'N/A'}m`);
      console.log(`  Year Built:        ${data.yearBuilt || 'N/A'}`);

      console.log('\n' + '═'.repeat(60));
      console.log('🏢 OWNERSHIP DATA (THE MOMENT OF TRUTH!):');
      console.log('═'.repeat(60));
      console.log(`  ⭐ Registered Owner:  ${data.registeredOwner || '❌ NOT FOUND'}`);
      console.log(`  ⭐ Operator:          ${data.operator || '❌ NOT FOUND'}`);
      console.log(`  ⭐ Technical Manager: ${data.technicalManager || '❌ NOT FOUND'}`);
      console.log(`  Classification:       ${data.classificationSociety || 'N/A'}`);

      console.log('\n' + '═'.repeat(60));
      console.log('📊 METADATA:');
      console.log('═'.repeat(60));
      console.log(`  Data Source:       ${data.dataSource}`);
      console.log(`  Scraped At:        ${data.scrapedAt.toISOString()}`);
      console.log(`  Scraping Duration: ${duration}s`);

      console.log('\n' + '═'.repeat(60));

      // Check if we got ownership data
      const hasOwnership = !!(data.registeredOwner || data.operator || data.technicalManager);

      if (hasOwnership) {
        console.log('🎉 SUCCESS! We got OWNERSHIP DATA from IMO GISIS!');
        console.log('═'.repeat(60));
        console.log('\n✅ WORKFLOW UNLOCKED:');
        console.log('   AIS Tracking → Owner/Operator Data → Load Matching');
      } else {
        console.log('⚠️  Vessel found but NO ownership data available in IMO GISIS');
        console.log('═'.repeat(60));
      }

    } else {
      console.log('❌ FAILED: Vessel not found in IMO GISIS');
      console.log('\nPossible reasons:');
      console.log('  1. Vessel not registered in IMO GISIS');
      console.log('  2. Scraping selector mismatch');
      console.log('  3. IMO GISIS website structure changed');
    }

  } catch (error: any) {
    console.log('❌ ERROR:', error.message);
    console.log('\nStack trace:', error.stack);
  } finally {
    // Clean up browser
    await imoGisisScraper.close();
    console.log('\n🧹 Cleanup complete');
  }
}

testIMOGISIS().catch(console.error);
