#!/usr/bin/env tsx
/**
 * IMO GISIS Vessel Ownership Data Extractor - Selenium Version
 *
 * Uses Selenium WebDriver for better ASP.NET session handling
 * Credentials: Public User (powerpbox / indrA@0612)
 */

import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import * as dotenv from 'dotenv';
dotenv.config();

interface VesselOwnershipData {
  name: string | null;
  imoNumber: string | null;
  callSign: string | null;
  flag: string | null;
  mmsi: string | null;
  type: string | null;
  buildDate: string | null;
  grossTonnage: string | null;
  registeredOwner: string | null;
  operator: string | null;
  technicalManager: string | null;
  docCompany: string | null;
  ismManager: string | null;
}

class GISISExtractor {
  private driver!: WebDriver;

  async initialize() {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await this.driver.manage().setTimeouts({ implicit: 10000, pageLoad: 30000 });
  }

  async login(): Promise<boolean> {
    try {
      console.log('🔐 Step 1: Navigating to GISIS...');
      await this.driver.get('https://gisis.imo.org/');
      await this.sleep(2000);

      console.log('📝 Step 2: Filling login form (Step 1/2)...');

      // Select authority: Public User
      const authorityDropdown = await this.driver.findElement(By.css('select[id*="ddlAuth"]'));
      const options = await authorityDropdown.findElements(By.css('option'));
      for (const option of options) {
        const text = await option.getText();
        if (text.includes('Public User')) {
          await option.click();
          console.log('  ✅ Selected authority: Public User');
          break;
        }
      }

      await this.sleep(1000);

      // Enter username
      const usernameInput = await this.driver.findElement(By.css('input[type="text"]'));
      await usernameInput.clear();
      await usernameInput.sendKeys(process.env.GISIS_USERNAME || '');
      console.log('  ✅ Entered username');

      // Submit username to get password field
      const nextButton = await this.driver.findElement(By.css('input[name*="btnStep1"]'));
      await nextButton.click();
      console.log('  ✅ Submitted username');

      await this.sleep(3000);

      console.log('📝 Step 3: Filling password (Step 2/2)...');

      // Wait for password field to appear
      const passwordInput = await this.driver.wait(
        until.elementLocated(By.css('input[type="password"]')),
        10000
      );
      await passwordInput.clear();
      await passwordInput.sendKeys(process.env.GISIS_PASSWORD || '');
      console.log('  ✅ Entered password');

      // Submit password
      const loginButton = await this.driver.findElement(By.css('input[name*="btnStep2"]'));
      await loginButton.click();
      console.log('  ✅ Submitted login');

      await this.sleep(3000);

      // Verify login success
      const currentUrl = await this.driver.getCurrentUrl();
      const loginSuccess = currentUrl.includes('gisis.imo.org/Public');

      if (loginSuccess) {
        console.log('✅ Login successful!\n');
        return true;
      } else {
        console.log('❌ Login failed - still on:', currentUrl);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Login error:', error.message);
      return false;
    }
  }

  async extractVesselData(imoNumber: string): Promise<VesselOwnershipData | null> {
    try {
      // Navigate directly to vessel details page
      const url = `https://gisis.imo.org/Public/SHIPS/ShipDetails.aspx?IMONumber=${imoNumber}`;
      console.log(`🔍 Navigating to: ${url}`);

      await this.driver.get(url);
      await this.sleep(3000);

      // Check if redirected back to login
      const currentUrl = await this.driver.getCurrentUrl();
      if (currentUrl.includes('WebLogin')) {
        console.log('⚠️  Redirected to login - session may have expired');
        return null;
      }

      console.log(`📍 Current URL: ${currentUrl}`);

      // Get page text
      const bodyText = await this.driver.findElement(By.css('body')).getText();

      // Check if we have the vessel data
      if (!bodyText.includes('Ship Particulars') && !bodyText.includes('GOLDEN CURL')) {
        console.log('⚠️  Vessel details page not loaded correctly');
        console.log('Page text sample:', bodyText.substring(0, 500));
        return null;
      }

      console.log('✅ Vessel details page loaded\n');
      console.log('📊 Extracting data...\n');

      // Extract data by parsing the page text
      const data: VesselOwnershipData = {
        name: this.extractField(bodyText, 'Name:'),
        imoNumber: this.extractField(bodyText, 'IMO Number:'),
        callSign: this.extractField(bodyText, 'Call sign:'),
        flag: this.extractField(bodyText, 'Flag:'),
        mmsi: this.extractField(bodyText, 'MMSI:'),
        type: this.extractField(bodyText, 'Type:'),
        buildDate: this.extractField(bodyText, 'Date of build:'),
        grossTonnage: this.extractField(bodyText, 'Gross tonnage:'),
        registeredOwner: this.extractField(bodyText, 'Registered owner:'),
        operator: this.extractField(bodyText, 'Operator:'),
        technicalManager: this.extractField(bodyText, 'Technical manager:'),
        docCompany: this.extractField(bodyText, 'DOC company:') ||
                     this.extractField(bodyText, 'Company responsible for DOC:'),
        ismManager: this.extractField(bodyText, 'ISM manager:') ||
                    this.extractField(bodyText, 'Company:'),
      };

      return data;
    } catch (error: any) {
      console.error('❌ Extraction error:', error.message);
      return null;
    }
  }

  private extractField(text: string, fieldLabel: string): string | null {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(fieldLabel)) {
        // Check if value is on same line (after colon)
        const parts = lines[i].split(':');
        if (parts.length > 1 && parts[1].trim()) {
          return parts.slice(1).join(':').trim();
        }
        // Check next line
        if (i + 1 < lines.length && lines[i + 1]) {
          return lines[i + 1];
        }
      }
    }
    return null;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.driver) {
      await this.driver.quit();
    }
  }
}

// Main execution
async function main() {
  const testIMO = '9348522'; // GOLDEN CURL
  const extractor = new GISISExtractor();

  try {
    console.log('🌊 IMO GISIS VESSEL OWNERSHIP EXTRACTOR (Selenium)\n');
    console.log('═'.repeat(70));
    console.log(`Test Vessel: IMO ${testIMO} (GOLDEN CURL)`);
    console.log(`Credentials: ${process.env.GISIS_USERNAME}`);
    console.log('═'.repeat(70));
    console.log('');

    await extractor.initialize();

    // Login
    const loginSuccess = await extractor.login();
    if (!loginSuccess) {
      console.log('❌ Login failed - aborting');
      return;
    }

    // Extract vessel data
    const data = await extractor.extractVesselData(testIMO);

    if (!data) {
      console.log('❌ Failed to extract vessel data');
      return;
    }

    // Display results
    console.log('═'.repeat(70));
    console.log('📊 EXTRACTED VESSEL DATA:');
    console.log('═'.repeat(70));
    console.log(`  Name:              ${data.name || 'N/A'}`);
    console.log(`  IMO Number:        ${data.imoNumber || 'N/A'}`);
    console.log(`  Call Sign:         ${data.callSign || 'N/A'}`);
    console.log(`  MMSI:              ${data.mmsi || 'N/A'}`);
    console.log(`  Flag:              ${data.flag || 'N/A'}`);
    console.log(`  Type:              ${data.type || 'N/A'}`);
    console.log(`  Built:             ${data.buildDate || 'N/A'}`);
    console.log(`  Gross Tonnage:     ${data.grossTonnage || 'N/A'}`);
    console.log('');
    console.log('🏢 OWNERSHIP DATA (MOMENT OF TRUTH!):');
    console.log('═'.repeat(70));
    console.log(`  ⭐ Registered Owner:  ${data.registeredOwner || '❌ NOT FOUND'}`);
    console.log(`  ⭐ Operator:          ${data.operator || '❌ NOT FOUND'}`);
    console.log(`  ⭐ Technical Manager: ${data.technicalManager || '❌ NOT FOUND'}`);
    console.log(`  ⭐ DOC Company:       ${data.docCompany || '❌ NOT FOUND'}`);
    console.log(`  ⭐ ISM Manager:       ${data.ismManager || '❌ NOT FOUND'}`);
    console.log('═'.repeat(70));

    if (data.registeredOwner) {
      console.log('');
      console.log('🎉 SUCCESS! VESSEL OWNERSHIP DATA EXTRACTED FROM IMO GISIS!');
      console.log('✅ WORKFLOW UNLOCKED: AIS → IMO → Owner → Load Matching');
      console.log('');
    } else {
      console.log('');
      console.log('⚠️  Data extracted but ownership fields empty');
      console.log('   Check if this is a limitation of Public User access');
      console.log('');
    }

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
  } finally {
    await extractor.close();
  }
}

main().catch(console.error);
