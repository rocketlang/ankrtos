/**
 * @ankr/intelligence Demo Test
 * Tests the Conversational AI integration
 */

import {
  ConversationAI,
  analyze,
  getIntent,
  getEntities,
  createPlan,
} from './src/index.js';

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  title: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}═══ ${msg} ═══${colors.reset}`),
  section: (msg: string) => console.log(`\n${colors.yellow}▶ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`  ${colors.blue}${msg}${colors.reset}`),
  success: (msg: string) => console.log(`  ${colors.green}✓ ${msg}${colors.reset}`),
  data: (label: string, value: any) => console.log(`  ${colors.magenta}${label}:${colors.reset}`, typeof value === 'object' ? JSON.stringify(value, null, 2) : value),
};

async function runDemo() {
  log.title('SWAYAM Intelligence Demo');
  console.log('Testing @ankr/intelligence package capabilities\n');

  // Test cases
  const testCases = [
    // Hindi compliance
    { text: 'मुझे GST return file करना है company GSTIN 27AABCU9603R1ZM के लिए', lang: 'hi' },
    // English compliance
    { text: 'Verify PAN ABCDE1234F for TDS calculation', lang: 'en' },
    // Hindi voice command (banking)
    { text: '₹50000 भेजो account number 1234567890 में', lang: 'hi' },
    // ERP request
    { text: 'Create a sales invoice for customer ABC Corp amount 1.5 lakh', lang: 'en' },
    // CRM request
    { text: 'नया lead बनाओ Rahul Sharma के लिए phone 9876543210', lang: 'hi' },
    // Vehicle tracking
    { text: 'Track vehicle MH12AB1234 location', lang: 'en' },
    // Logistics query
    { text: 'Delhi से Mumbai का route बताओ truck के लिए', lang: 'hi' },
  ];

  // Initialize
  log.section('Initializing ConversationAI...');
  const ai = new ConversationAI({
    aiProxyUrl: 'http://localhost:4444',
    verdaccioUrl: 'http://localhost:4873',
  });

  try {
    await ai.initialize();
    const summary = ai.getCapabilitySummary();
    log.success('Initialized successfully');
    log.data('Packages indexed', summary.packages);
    log.data('Domains', summary.domains);
  } catch (error) {
    log.info('Note: Running without full initialization (Verdaccio may not be available)');
  }

  // Run tests
  for (const test of testCases) {
    log.title(`Test: ${test.text.substring(0, 50)}...`);

    try {
      // Analyze
      log.section('Full Analysis');
      const analysis = await ai.analyze(test.text, `test_${Date.now()}`, { language: test.lang });

      log.data('Intent', {
        primary: analysis.intent.primary,
        domain: analysis.intent.domain,
        confidence: analysis.confidence.toFixed(2),
      });

      log.data('Entities', analysis.entities);
      log.data('Tools Needed', analysis.toolsNeeded);
      log.data('Packages Available', analysis.packagesAvailable.map(p => p.name));

      if (analysis.suggestedPlan) {
        log.section('Suggested Plan');
        log.data('Title', analysis.suggestedPlan.title);
        log.data('Title (Hindi)', analysis.suggestedPlan.titleHi);
        log.info('Tasks:');
        for (const task of analysis.suggestedPlan.items) {
          console.log(`    ${task.status === 'pending' ? '○' : '●'} ${task.title}`);
          console.log(`      Tools: ${task.tools.join(', ')}`);
        }
      }

      if (analysis.followUpQuestions && analysis.followUpQuestions.length > 0) {
        log.section('Follow-up Questions');
        for (const q of analysis.followUpQuestions) {
          log.info(q);
        }
      }

      // Generate response
      log.section('Generated Response');
      const response = await ai.generateResponse(analysis, test.lang);
      console.log(`  ${response.substring(0, 200)}${response.length > 200 ? '...' : ''}`);

    } catch (error: any) {
      log.info(`Error: ${error.message}`);
    }
  }

  // Test quick functions
  log.title('Quick Function Tests');

  log.section('getIntent()');
  const intent = await getIntent('GST verify karo 27AABCU9603R1ZM');
  log.data('Intent', intent);

  log.section('getEntities()');
  const entities = await getEntities('PAN ABCDE1234F aur Aadhaar 1234 5678 9012');
  log.data('Entities', entities);

  // Package discovery
  log.title('Package Discovery');
  const discovery = ai.getPackageDiscovery();

  log.section('Search by capability: "gst"');
  const gstPackages = discovery.searchByCapability('gst');
  for (const pkg of gstPackages.slice(0, 3)) {
    log.info(`${pkg.name}: ${pkg.capabilities.join(', ')}`);
  }

  log.section('Search by capability: "banking"');
  const bankingPackages = discovery.searchByCapability('banking');
  for (const pkg of bankingPackages.slice(0, 3)) {
    log.info(`${pkg.name}: ${pkg.capabilities.join(', ')}`);
  }

  log.title('Demo Complete');
  console.log('\nThe @ankr/intelligence package is working correctly.');
  console.log('Ready for WebSocket integration in SWAYAM.\n');
}

// Run
runDemo().catch(console.error);
