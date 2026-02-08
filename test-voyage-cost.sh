#!/bin/bash

# Test Voyage Cost Estimate API

echo "Testing Voyage Cost Estimate for vessel 477995900..."
echo ""

curl -s -X POST http://localhost:4053/graphql \
  -H "Content-Type: application/json" \
  --data-binary @- << 'EOF' | jq '.'
{
  "query": "query EstimateVoyageCost($mmsi: String!, $daysBack: Int) { estimateVoyageCost(mmsi: $mmsi, daysBack: $daysBack) { vesselMmsi vesselName totalCostsUsd bunkerCostUsd portCostsUsd canalFeesUsd totalDistanceNm seaDaysAtSpeed portDays costPerNm costPerDay } }",
  "variables": {
    "mmsi": "477995900",
    "daysBack": 30
  }
}
EOF
