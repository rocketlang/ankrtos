import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3008', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(10000);

  const divCheck = await page.evaluate(() => {
    const div700 = Array.from(document.querySelectorAll('[style*="700px"]'))[0];
    const byId = document.getElementById('ais-map-container');

    return {
      div700Exists: !!div700,
      div700Id: div700?.id || 'NO ID',
      div700Class: div700?.className || 'NO CLASS',
      div700HasChildren: div700?.children.length || 0,
      byIdExists: !!byId,
      byIdSameAsDiv700: byId === div700,
    };
  });

  console.log('━'.repeat(60));
  console.log('DIV ID CHECK:\n');
  console.log('  700px div exists:', divCheck.div700Exists);
  console.log('  700px div ID:', divCheck.div700Id);
  console.log('  700px div class:', divCheck.div700Class);
  console.log('  700px div children:', divCheck.div700HasChildren);
  console.log('\n  getElementById works:', divCheck.byIdExists);
  console.log('  Same element:', divCheck.byIdSameAsDiv700);
  console.log('━'.repeat(60));

  await browser.close();
})();
