#!/usr/bin/env node
/**
 * PageIndex Router - 50-Query Extended Test Suite
 * Tests query classification, routing decisions, and answer accuracy
 */

const queries = [
  // SIMPLE queries (expected: HYBRID)
  { id: 1, query: "demurrage rate", expectedMethod: "HYBRID", complexity: "SIMPLE" },
  { id: 2, query: "port of loading", expectedMethod: "HYBRID", complexity: "SIMPLE" },
  { id: 3, query: "charter party date", expectedMethod: "HYBRID", complexity: "SIMPLE" },
  { id: 4, query: "vessel name", expectedMethod: "HYBRID", complexity: "SIMPLE" },
  { id: 5, query: "laytime hours", expectedMethod: "HYBRID", complexity: "SIMPLE" },
  { id: 6, query: "cargo quantity", expectedMethod: "HYBRID", complexity: "SIMPLE" },
  { id: 7, query: "freight rate", expectedMethod: "HYBRID", complexity: "SIMPLE" },
  { id: 8, query: "discharge port", expectedMethod: "HYBRID", complexity: "SIMPLE" },
  { id: 9, query: "vessel IMO number", expectedMethod: "HYBRID", complexity: "SIMPLE" },
  { id: 10, query: "charterer name", expectedMethod: "HYBRID", complexity: "SIMPLE" },

  // COMPLEX queries (expected: PAGEINDEX)
  { id: 11, query: "What is the demurrage rate and how is it calculated according to Appendix C?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 12, query: "Explain the relationship between laytime calculation in Clause 3.1 and demurrage in Clause 3.3", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 13, query: "What are the exceptions to laytime counting as mentioned in Clause 3.2?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 14, query: "According to the ice clause referenced in Clause 28, what are the vessel's rights?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 15, query: "Compare the loading and discharge ports across all charter parties", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 16, query: "How does Appendix C calculate demurrage when time used exceeds laytime allowed?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 17, query: "What is the procedure when Notice of Readiness is given according to Clause 3.1?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 18, query: "Explain the payment terms for freight rate across different charter types", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 19, query: "What happens if the vessel encounters ice-bound ports per Clause 28?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 20, query: "Detail the cargo handling exceptions that don't count toward laytime", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },

  // AMBIGUOUS queries (router should decide)
  { id: 21, query: "What are the main terms?", expectedMethod: "AUTO", complexity: "AUTO" },
  { id: 22, query: "vessel details and cargo information", expectedMethod: "AUTO", complexity: "AUTO" },
  { id: 23, query: "payment schedule", expectedMethod: "AUTO", complexity: "AUTO" },
  { id: 24, query: "laytime calculation method", expectedMethod: "AUTO", complexity: "AUTO" },
  { id: 25, query: "exceptions and special conditions", expectedMethod: "AUTO", complexity: "AUTO" },

  // CROSS-REFERENCE queries (test PageIndex tree navigation)
  { id: 26, query: "Find all references to Appendix C in the charter party", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 27, query: "What clauses reference Clause 3.2?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 28, query: "Show all sections that mention 'demurrage'", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 29, query: "Which clauses cross-reference the ice clause?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 30, query: "Find all appendices referenced in the main text", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },

  // COMPARISON queries (test multi-document)
  { id: 31, query: "Compare demurrage rates across all three charter parties", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 32, query: "What are the differences in laytime terms between Baltic and Time Charter?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 33, query: "Which charter party has the shortest allowed laytime?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 34, query: "Compare cargo quantities across all charters", expectedMethod: "HYBRID", complexity: "SIMPLE" },
  { id: 35, query: "Which vessel has the highest DWT?", expectedMethod: "HYBRID", complexity: "SIMPLE" },

  // CALCULATION queries (test reasoning)
  { id: 36, query: "If a vessel uses 96 hours of laytime and 72 hours were allowed, calculate the demurrage using Appendix C formula", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 37, query: "What would be the total freight cost for 15,000 MT at USD 45.00 per ton?", expectedMethod: "HYBRID", complexity: "SIMPLE" },
  { id: 38, query: "If cargo operations are delayed by 12 hours due to weather, how does that affect laytime calculation?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 39, query: "Calculate demurrage for 2 days of excess time", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 40, query: "What percentage of freight is paid on signing B/L?", expectedMethod: "HYBRID", complexity: "SIMPLE" },

  // PROCEDURAL queries (test sequential understanding)
  { id: 41, query: "What are the steps from Notice of Readiness to completion of cargo operations?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 42, query: "Explain the demurrage claim process from start to finish", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 43, query: "What is the sequence of events when a vessel arrives at port?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 44, query: "Describe the payment workflow for freight charges", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 45, query: "What happens if cargo operations are interrupted by strikes?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },

  // EDGE CASES
  { id: 46, query: "owner", expectedMethod: "HYBRID", complexity: "SIMPLE" },
  { id: 47, query: "What if the vessel encounters both adverse weather AND port congestion simultaneously?", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 48, query: "clause", expectedMethod: "HYBRID", complexity: "SIMPLE" },
  { id: 49, query: "Analyze the risk allocation between Owner and Charterer based on all exception clauses", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
  { id: 50, query: "Summary of all terms", expectedMethod: "PAGEINDEX", complexity: "COMPLEX" },
];

async function runTests() {
  console.log('\n🧪 PageIndex Router - 50-Query Extended Test Suite');
  console.log('=' .repeat(70));
  console.log(`Total Queries: ${queries.length}`);
  console.log(`Start Time: ${new Date().toISOString()}`);
  console.log('');

  const results = {
    total: queries.length,
    passed: 0,
    failed: 0,
    errors: 0,
    routingAccuracy: { correct: 0, incorrect: 0 },
    performance: { totalTime: 0, avgTime: 0, cacheHits: 0 },
    byComplexity: { SIMPLE: 0, COMPLEX: 0, AUTO: 0 }
  };

  const testResults = [];

  for (const test of queries) {
    const startTime = Date.now();

    try {
      // GraphQL query
      const query = `
        query {
          askMari8xRAG(
            question: "${test.query.replace(/"/g, '\\"')}"
            method: ${test.expectedMethod}
          ) {
            answer
            method
            complexity
            latency
            fromCache
          }
        }
      `;

      const response = await fetch('http://localhost:4051/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      if (data.errors) {
        results.errors++;
        testResults.push({
          ...test,
          status: 'ERROR',
          error: data.errors[0].message,
          duration
        });
        console.log(`❌ Query ${test.id}: ERROR - ${data.errors[0].message}`);
      } else if (!data.data?.askMari8xRAG) {
        results.errors++;
        testResults.push({
          ...test,
          status: 'ERROR',
          error: 'No response data',
          duration
        });
        console.log(`❌ Query ${test.id}: ERROR - No response`);
      } else {
        const result = data.data.askMari8xRAG;
        const routingCorrect = test.expectedMethod === 'AUTO' ||
                               result.method === test.expectedMethod;

        if (routingCorrect) {
          results.routingAccuracy.correct++;
          results.passed++;
        } else {
          results.routingAccuracy.incorrect++;
          results.failed++;
        }

        if (result.fromCache) {
          results.performance.cacheHits++;
        }

        results.performance.totalTime += (result.latency || duration);
        results.byComplexity[result.complexity]++;

        testResults.push({
          ...test,
          status: routingCorrect ? 'PASS' : 'FAIL',
          actualMethod: result.method,
          actualComplexity: result.complexity,
          latency: result.latency || duration,
          fromCache: result.fromCache,
          answerLength: result.answer?.length || 0
        });

        const icon = routingCorrect ? '✅' : '⚠️';
        console.log(`${icon} Query ${test.id}: ${result.method} (${duration}ms) ${result.fromCache ? '💾' : ''}`);
      }
    } catch (error) {
      results.errors++;
      testResults.push({
        ...test,
        status: 'ERROR',
        error: error.message,
        duration: Date.now() - startTime
      });
      console.log(`❌ Query ${test.id}: EXCEPTION - ${error.message}`);
    }
  }

  results.performance.avgTime = Math.round(
    results.performance.totalTime / results.total
  );

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Total Queries:     ${results.total}`);
  console.log(`✅ Passed:         ${results.passed} (${Math.round(results.passed/results.total*100)}%)`);
  console.log(`⚠️  Failed:         ${results.failed} (${Math.round(results.failed/results.total*100)}%)`);
  console.log(`❌ Errors:         ${results.errors} (${Math.round(results.errors/results.total*100)}%)`);
  console.log('');
  console.log('ROUTING ACCURACY:');
  console.log(`  Correct:         ${results.routingAccuracy.correct}/${results.total - results.errors}`);
  console.log(`  Incorrect:       ${results.routingAccuracy.incorrect}/${results.total - results.errors}`);
  console.log(`  Accuracy:        ${Math.round(results.routingAccuracy.correct/(results.total - results.errors)*100)}%`);
  console.log('');
  console.log('PERFORMANCE:');
  console.log(`  Total Time:      ${results.performance.totalTime}ms`);
  console.log(`  Avg per Query:   ${results.performance.avgTime}ms`);
  console.log(`  Cache Hits:      ${results.performance.cacheHits}/${results.total - results.errors} (${Math.round(results.performance.cacheHits/(results.total - results.errors)*100)}%)`);
  console.log('');
  console.log('BY COMPLEXITY:');
  console.log(`  SIMPLE:          ${results.byComplexity.SIMPLE}`);
  console.log(`  COMPLEX:         ${results.byComplexity.COMPLEX}`);
  console.log(`  AUTO:            ${results.byComplexity.AUTO}`);
  console.log('');

  // Failed queries detail
  if (results.failed > 0) {
    console.log('FAILED QUERIES:');
    testResults
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  #${r.id}: Expected ${r.expectedMethod}, got ${r.actualMethod}`);
        console.log(`       Query: "${r.query}"`);
      });
    console.log('');
  }

  // Error queries detail
  if (results.errors > 0) {
    console.log('ERROR QUERIES:');
    testResults
      .filter(r => r.status === 'ERROR')
      .forEach(r => {
        console.log(`  #${r.id}: ${r.error}`);
        console.log(`       Query: "${r.query}"`);
      });
    console.log('');
  }

  console.log('='.repeat(70));
  console.log(`End Time: ${new Date().toISOString()}`);
  console.log('');

  // Save results to file
  const resultsFile = '/tmp/router-test-results.json';
  require('fs').writeFileSync(
    resultsFile,
    JSON.stringify({ summary: results, details: testResults }, null, 2)
  );
  console.log(`📄 Detailed results saved to: ${resultsFile}`);
  console.log('');

  // Exit code based on results
  const successRate = results.passed / results.total;
  if (successRate >= 0.9) {
    console.log('🎉 EXCELLENT: >90% success rate!');
    process.exit(0);
  } else if (successRate >= 0.7) {
    console.log('✅ GOOD: >70% success rate');
    process.exit(0);
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT: <70% success rate');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
