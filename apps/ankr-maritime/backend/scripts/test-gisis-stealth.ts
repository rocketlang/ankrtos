#!/usr/bin/env tsx
/**
 * Test GISIS Login with Stealth Mode
 * Tests anti-detection measures to bypass bot detection
 */

import 'dotenv/config';
import { GISISOwnerService } from '../src/services/gisis-owner-service.js';

async function testStealthLogin() {
  console.log('🕵️  Testing GISIS Login with Stealth Mode');
  console.log('==========================================\n');

  const service = new GISISOwnerService();

  try {
    // Initialize with stealth
    console.log('1️⃣  Initializing browser with stealth flags...');
    await service.initialize();
    console.log('   ✅ Browser initialized with anti-detection measures\n');

    // Attempt login
    console.log('2️⃣  Attempting login with human-like behavior...');
    console.log(`   Username: ${process.env.GISIS_EMAIL || process.env.GISIS_USERNAME}`);
    console.log('   Features:');
    console.log('   - Random typing delays (50-200ms)');
    console.log('   - Mouse movement simulation');
    console.log('   - Hidden navigator.webdriver');
    console.log('   - Realistic user agent');
    console.log('   - Disabled automation flags\n');

    const success = await service.login();

    if (success) {
      console.log('   ✅ LOGIN SUCCESSFUL!\n');

      // Test vessel lookup
      console.log('3️⃣  Testing vessel ownership lookup...');
      const vesselData = await service.getVesselOwnership('9811000'); // MSC ANNA

      if (vesselData) {
        console.log('   ✅ Vessel data retrieved successfully!\n');
        console.log('   📊 Sample Data:');
        console.log(`      Vessel Name: ${vesselData.name}`);
        console.log(`      IMO: ${vesselData.imoNumber}`);
        console.log(`      Flag: ${vesselData.flag}`);
        console.log(`      Registered Owner: ${vesselData.registeredOwner}`);
        console.log(`      Operator: ${vesselData.operator}`);
        console.log(`      Technical Manager: ${vesselData.technicalManager}`);
      } else {
        console.log('   ⚠️  No data returned (vessel may not exist)');
      }

      console.log('\n🎉 STEALTH MODE SUCCESS!');
      console.log('   Anti-bot detection bypassed successfully');
      console.log('   Ready for bulk enrichment\n');
    } else {
      console.log('   ❌ LOGIN FAILED\n');
      console.log('   Server still rejecting login attempts');
      console.log('   Possible reasons:');
      console.log('   1. Account temporarily locked (too many attempts)');
      console.log('   2. Server-side CAPTCHA challenge');
      console.log('   3. Stronger anti-bot measures deployed');
      console.log('   4. Credentials invalid\n');

      console.log('   💡 Recommendations:');
      console.log('   - Wait 1 hour before retrying (account cooldown)');
      console.log('   - Verify credentials manually at https://gisis.imo.org/');
      console.log('   - Consider switching to Equasis as backup');
      console.log('   - Try cookie injection method\n');
    }

  } catch (error: any) {
    console.error('   ❌ ERROR:', error.message);
    console.error('\n   Stack trace:', error.stack);
  } finally {
    console.log('4️⃣  Cleaning up...');
    await service.close();
    console.log('   ✅ Browser closed\n');
  }

  console.log('==========================================');
  console.log('Test complete!');
}

// Run test
testStealthLogin().catch(console.error);
