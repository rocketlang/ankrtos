#!/bin/bash
# Mari8X API Testing Script - Feb 1, 2026
# Tests Phase 3 (Chartering), Phase 8 (AI), Phase 9 (S&P) endpoints

set -e

API="http://localhost:4051/graphql"
PASSED=0
FAILED=0

echo "🧪 Mari8X API Testing Suite"
echo "============================"
echo ""

# Test function
test_query() {
    local name="$1"
    local query="$2"

    echo -n "Testing: $name... "

    response=$(curl -s -X POST "$API" \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"$query\"}")

    if echo "$response" | jq -e '.data' > /dev/null 2>&1; then
        echo "✅ PASS"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo "❌ FAIL"
        echo "  Response: $response" | head -3
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "📊 Phase 3: Chartering Desk Tests"
echo "-----------------------------------"

test_query "List Charters" \
    "query { charters { id type status } }"

test_query "Charter Party Clauses" \
    "query { charterPartyClauses { id title text } }"

echo ""
echo "📊 Phase 9: S&P Desk Tests"
echo "-----------------------------------"

test_query "SNP Market Statistics" \
    "query { snpMarketStatistics { vesselType avgPrice transactionCount } }"

test_query "SNP Offers" \
    "query { snpOffers { id status price } }"

test_query "SNP Commissions" \
    "query { snpCommissions { id rate amount } }"

echo ""
echo "📊 Phase 8: AI Engine Tests"
echo "-----------------------------------"

test_query "Classify Email (mutation)" \
    "mutation { classifyEmail(input: { subject: \\\"Test\\\", body: \\\"Test email\\\" }) { category confidence } }" || true

echo ""
echo "================================"
echo "Test Results:"
echo "  ✅ Passed: $PASSED"
echo "  ❌ Failed: $FAILED"
echo "================================"

if [ $FAILED -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed"
    exit 1
fi
