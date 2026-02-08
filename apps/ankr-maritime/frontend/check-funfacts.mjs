import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));

  await page.goto('http://localhost:3008', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(15000);

  const check = await page.evaluate(() => {
    // Find Fun Facts section
    const allText = document.body.innerText;
    const hasFunFacts = allText.includes('Fun Facts') || allText.includes('Insights');

    // Get all h3 headings
    const allH3s = Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim());

    // Check for specific fun facts content
    const hasSuperlative = allText.includes('Busiest') || allText.includes('Fastest') || allText.includes('Longest');

    return {
      hasFunFacts,
      hasSuperlative,
      allH3s: allH3s.slice(0, 15),
      bodyLength: allText.length,
    };
  });

  console.log('━'.repeat(80));
  console.log('🎲 FUN FACTS CHECK\n');
  console.log(`Fun Facts text found:    ${check.hasFunFacts ? '✅' : '❌'}`);
  console.log(`Superlative facts found: ${check.hasSuperlative ? '✅' : '❌'}`);
  console.log(`Page body length:        ${check.bodyLength} chars`);
  console.log(`\nH3 Headings (first 15):`);
  check.allH3s.forEach((h, i) => console.log(`   ${i + 1}. ${h}`));

  const errors = logs.filter(l => l.type === 'error');
  if (errors.length > 0) {
    console.log(`\n❌ Errors:`);
    errors.forEach(e => console.log(`   ${e.text}`));
  }

  console.log('━'.repeat(80));

  await browser.close();
})();
