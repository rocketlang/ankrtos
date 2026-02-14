#!/bin/bash
# Quick check of Vyomo backend endpoints

echo "🔍 Checking Vyomo Backend Endpoints..."
echo "========================================"
echo ""

API_URL="http://localhost:3000"

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local name=$2

    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint" 2>/dev/null)

    if [ "$response" = "200" ]; then
        echo "✅ $name - OK ($endpoint)"
    elif [ "$response" = "404" ]; then
        echo "❌ $name - NOT FOUND ($endpoint)"
    elif [ "$response" = "500" ]; then
        echo "⚠️  $name - SERVER ERROR ($endpoint)"
    elif [ -z "$response" ]; then
        echo "❌ $name - NO RESPONSE ($endpoint)"
    else
        echo "⚠️  $name - Status $response ($endpoint)"
    fi
}

echo "📊 Core API Endpoints:"
check_endpoint "/health" "Health Check"
check_endpoint "/api/market/nifty" "NIFTY Data"
check_endpoint "/api/market/banknifty" "BANKNIFTY Data"
check_endpoint "/api/options/chain?underlying=NIFTY" "Option Chain"

echo ""
echo "⚡ Anomaly Detection:"
check_endpoint "/api/anomalies/dashboard" "Anomaly Dashboard"
check_endpoint "/api/anomalies" "Anomaly List"
check_endpoint "/api/blockchain/health" "Blockchain Health"

echo ""
echo "🤖 AI & Trading:"
check_endpoint "/api/adaptive-ai/signals" "Adaptive AI Signals"
check_endpoint "/api/auto-trading/status" "Auto Trading Status"
check_endpoint "/api/backtesting/list" "Backtesting List"

echo ""
echo "📈 Analytics:"
check_endpoint "/api/analytics/dashboard" "Analytics Dashboard"
check_endpoint "/api/divergence/data" "Index Divergence"
check_endpoint "/api/tracker/recommendations" "Recommendation Tracker"

echo ""
echo "========================================"
echo "🔍 Checking GraphQL Endpoint..."

graphql_response=$(curl -s -X POST "$API_URL/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { name } } }"}' \
  2>/dev/null)

if echo "$graphql_response" | grep -q "queryType"; then
    echo "✅ GraphQL - OK"
else
    echo "❌ GraphQL - NOT WORKING"
    echo "Response: $graphql_response"
fi

echo ""
echo "========================================"
