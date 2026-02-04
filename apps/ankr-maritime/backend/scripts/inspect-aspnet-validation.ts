/**
 * Inspect ASP.NET validation and postback mechanisms
 */

import 'dotenv/config';
import { Builder, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

async function main() {
  const options = new chrome.Options();
  options.addArguments('--headless');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    console.log('\n🔍 Inspecting ASP.NET WebForms validation...\n');

    await driver.get('https://gisis.imo.org/');
    await driver.sleep(3000);

    // Select authority
    await driver.executeScript(`
      const dropdown = document.getElementById('ctl00_cpMain_ddlAuthorityType');
      const options = dropdown.options;
      for (let i = 0; i < options.length; i++) {
        if (options[i].text.includes('Public User')) {
          dropdown.selectedIndex = i;
          break;
        }
      }
    `);

    console.log('✅ Authority selected\n');
    await driver.sleep(1000);

    // Check for __doPostBack function
    const hasDoPostBack = await driver.executeScript(`
      return typeof __doPostBack !== 'undefined';
    `);
    console.log(`__doPostBack function exists: ${hasDoPostBack}`);

    if (hasDoPostBack) {
      const doPostBackCode = await driver.executeScript(`
        return __doPostBack.toString();
      `);
      console.log('\n__doPostBack function code:');
      console.log(doPostBackCode);
    }

    // Check for validators
    const validators = await driver.executeScript(`
      if (typeof Page_Validators !== 'undefined') {
        return Page_Validators.map(v => ({
          id: v.id,
          errormessage: v.errormessage,
          validationGroup: v.validationGroup,
          controltovalidate: v.controltovalidate
        }));
      }
      return null;
    `);

    if (validators) {
      console.log('\n📋 Page Validators found:');
      console.log(JSON.stringify(validators, null, 2));
    } else {
      console.log('\n❌ No Page_Validators found');
    }

    // Check ViewState and EventValidation
    const viewState = await driver.executeScript(`
      const vs = document.getElementById('__VIEWSTATE');
      return vs ? vs.value.substring(0, 100) + '...' : null;
    `);
    console.log(`\n__VIEWSTATE: ${viewState || 'Not found'}`);

    const eventValidation = await driver.executeScript(`
      const ev = document.getElementById('__EVENTVALIDATION');
      return ev ? ev.value.substring(0, 100) + '...' : null;
    `);
    console.log(`__EVENTVALIDATION: ${eventValidation || 'Not found'}`);

    // Get the Next button details
    const buttonInfo = await driver.executeScript(`
      const btn = document.getElementById('ctl00_cpMain_btnStep1');
      if (btn) {
        return {
          type: btn.type,
          name: btn.name,
          value: btn.value,
          onclick: btn.onclick ? btn.onclick.toString() : null,
          hasFormNoValidate: btn.hasAttribute('formnovalidate')
        };
      }
      return null;
    `);

    console.log('\n🔘 Next Button Details:');
    console.log(JSON.stringify(buttonInfo, null, 2));

    // Check form submission
    const formInfo = await driver.executeScript(`
      const form = document.querySelector('form');
      if (form) {
        return {
          action: form.action,
          method: form.method,
          onsubmit: form.onsubmit ? form.onsubmit.toString() : null,
          id: form.id
        };
      }
      return null;
    `);

    console.log('\n📝 Form Details:');
    console.log(JSON.stringify(formInfo, null, 2));

    // Try to find what happens when Next is clicked
    console.log('\n🎯 Simulating button click to see what fires...');

    // Enter username first
    await driver.executeScript(`
      const input = document.getElementById('ctl00_cpMain_txtUsername');
      input.removeAttribute('maxlength');
      input.value = '${process.env.GISIS_USERNAME}';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.blur();
    `);

    await driver.sleep(1000);

    // Check if validation passed
    const isValid = await driver.executeScript(`
      if (typeof Page_ClientValidate === 'function') {
        return Page_ClientValidate('');
      }
      return null;
    `);

    console.log(`\nPage_ClientValidate result: ${isValid}`);

    // Get any validation errors
    const validationErrors = await driver.executeScript(`
      const errors = [];
      if (typeof Page_Validators !== 'undefined') {
        for (const validator of Page_Validators) {
          if (validator.isvalid === false) {
            errors.push({
              id: validator.id,
              message: validator.errormessage,
              control: validator.controltovalidate
            });
          }
        }
      }
      return errors.length > 0 ? errors : null;
    `);

    if (validationErrors) {
      console.log('\n❌ Validation Errors:');
      console.log(JSON.stringify(validationErrors, null, 2));
    } else {
      console.log('\n✅ No validation errors detected');
    }

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await driver.quit();
  }
}

main();
