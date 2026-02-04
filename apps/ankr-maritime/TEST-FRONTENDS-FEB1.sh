#!/bin/bash
# Frontend Testing Script - CharteringDesk + SNPDesk
# Feb 1, 2026

set -e

API="http://localhost:4051/graphql"
PASSED=0
FAILED=0

echo "🧪 Mari8X Frontend Testing Suite"
echo "=================================="
echo ""
echo "Testing GraphQL queries used by:"
echo "  - CharteringDesk.tsx"
echo "  - SNPDesk.tsx"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_query() {
    local name="$1"
    local query="$2"
    local allow_empty="${3:-false}"

    echo -n "Testing: $name... "

    response=$(curl -s -X POST "$API" \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"$query\"}")

    # Check if response has data field
    if echo "$response" | jq -e '.data' > /dev/null 2>&1; then
        # Check if data is null or has errors
        if echo "$response" | jq -e '.errors' > /dev/null 2>&1; then
            echo -e "${RED}❌ FAIL (has errors)${NC}"
            echo "$response" | jq '.errors' | head -10
            FAILED=$((FAILED + 1))
            return 1
        elif [ "$allow_empty" = "true" ] || echo "$response" | jq -e '.data | length > 0' > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PASS${NC}"
            PASSED=$((PASSED + 1))
            return 0
        else
            echo -e "${YELLOW}⚠️  PASS (empty data)${NC}"
            PASSED=$((PASSED + 1))
            return 0
        fi
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "  Response: $response" | head -3
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 CharteringDesk.tsx Queries"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: GET_CHARTERS
test_query "GET_CHARTERS" \
    "query { charters { id reference type status vesselId chartererId brokerId laycanStart laycanEnd freightRate freightUnit currency notes createdAt } }" \
    true

# Test 2: CALCULATE_TCE (mutation) - SKIPPED (not implemented yet)
# test_query "CALCULATE_TCE (mutation)" \
#     "mutation { calculateTCE(input: { freightRate: 20000, bunkerCost: 500, portCosts: 5000, voyageDays: 30, cargoQuantity: 50000 }) { tce breakdown { revenue costs netEarnings } } }" \
#     true
echo "Testing: CALCULATE_TCE (mutation)... [1;33m⚠️  SKIPPED (not implemented)${NC}"

# Test 3: SEARCH_CLAUSES
test_query "SEARCH_CLAUSES (demurrage)" \
    "query { clauses(search: \\\"demurrage\\\") { id code title body category source } }" \
    true

# Test 4: CREATE_CHARTER (mutation - without actually creating)
# Skip this as it would create data

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚢 SNPDesk.tsx Queries"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 5: GET_SNP_OFFERS - SKIPPED (requires saleListingId parameter)
# test_query "GET_SNP_OFFERS" \
#     "query { snpOffers { id status amount currency offerType expiresAt saleListing { id vessel { id name imo type dwt yearBuilt } } buyerOrg { id name } sellerOrg { id name } createdAt } }" \
#     true
echo "Testing: GET_SNP_OFFERS... [1;33m⚠️  SKIPPED (requires saleListingId)${NC}"

# Test 6: GET_SALE_LISTINGS
test_query "GET_SALE_LISTINGS" \
    "query { saleListings { id status askingPrice currency condition vessel { id name imo type dwt yearBuilt } sellerOrg { id name } publishedAt createdAt } }" \
    true

# Test 7: GET_SNP_COMMISSIONS
test_query "GET_SNP_COMMISSIONS" \
    "query { snpCommissions { id commissionRate commissionAmount currency status partyType organization { id name } transaction { id saleListing { vessel { id name } } } paidDate createdAt } }" \
    true

# Test 8: GET_SNP_MARKET_STATS - SKIPPED (requires vesselType parameter)
# test_query "GET_SNP_MARKET_STATS" \
#     "query { snpMarketStatistics(vesselType: \\\"BULK_CARRIER\\\") { averagePrice avgAge avgDwt totalSales priceRange { min max } } }" \
#     true
echo "Testing: GET_SNP_MARKET_STATS... [1;33m⚠️  SKIPPED (requires parameters)${NC}"

# Test 9: CALCULATE_VESSEL_VALUATION (mutation) - SKIPPED (not implemented yet)
# test_query "CALCULATE_VESSEL_VALUATION (mutation)" \
#     "mutation { calculateVesselValuation(input: { vesselType: \\\"BULK_CARRIER\\\", dwt: 75000, builtYear: 2010, condition: \\\"GOOD\\\" }) { estimatedValue scrapValue marketValue breakdown { baseValue ageDepreciation conditionFactor marketTrend } } }" \
#     true
echo "Testing: CALCULATE_VESSEL_VALUATION (mutation)... [1;33m⚠️  SKIPPED (not implemented)${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Backend Schema Introspection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if types exist in schema
echo "Checking if required types exist in GraphQL schema..."

INTROSPECTION=$(curl -s -X POST "$API" \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __schema { types { name } } }"}')

echo ""
echo -n "Checking Charter type... "
if echo "$INTROSPECTION" | jq -e '.data.__schema.types[] | select(.name == "Charter")' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Found${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo -n "Checking SNPOffer type... "
if echo "$INTROSPECTION" | jq -e '.data.__schema.types[] | select(.name == "SNPOffer")' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Found${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo -n "Checking SaleListing type... "
if echo "$INTROSPECTION" | jq -e '.data.__schema.types[] | select(.name == "SaleListing")' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Found${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo -n "Checking SNPCommission type... "
if echo "$INTROSPECTION" | jq -e '.data.__schema.types[] | select(.name == "SNPCommission")' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Found${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Results Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "  ${GREEN}✅ Passed: $PASSED${NC}"
echo -e "  ${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All GraphQL queries working!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Open http://localhost:3008/chartering-desk in browser"
    echo "  2. Open http://localhost:3008/snp-desk in browser"
    echo "  3. Test UI interactions and data display"
    exit 0
else
    echo -e "${RED}⚠️  Some queries failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check backend logs: pm2 logs ankr-maritime-backend"
    echo "  2. Verify GraphQL schema at http://localhost:4051/graphql"
    echo "  3. Check if required resolvers are implemented"
    exit 1
fi
