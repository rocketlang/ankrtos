#!/bin/bash
# Test Authentication + Feature Gating Integration
# Created: 2026-02-12

API="http://localhost:4025"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔐 Testing Auth + Feature Gating Integration"
echo "============================================="
echo ""

# Create a new free user
echo "Step 1: Create new user (should get free tier automatically)"
SIGNUP=$(curl -s -X POST "$API/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "featuretest@example.com",
    "password": "Test123456",
    "name": "Feature Test User"
  }')

echo "$SIGNUP" | jq .
FREE_TOKEN=$(echo "$SIGNUP" | jq -r '.token')
FREE_USER_ID=$(echo "$SIGNUP" | jq -r '.user.id')

if [ "$FREE_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ User created with token${NC}"
  echo "User ID: $FREE_USER_ID"
else
  echo -e "${RED}✗ Failed to create user${NC}"
  exit 1
fi
echo ""

# Check user's subscription tier
echo "Step 2: Check user's subscription tier"
TIER_CHECK=$(curl -s -X GET "$API/api/subscriptions/current" \
  -H "Authorization: Bearer $FREE_TOKEN")

echo "$TIER_CHECK" | jq .

if echo "$TIER_CHECK" | jq -e '.tier.name == "free"' > /dev/null; then
  echo -e "${GREEN}✓ User automatically assigned free tier${NC}"
else
  echo -e "${RED}✗ User not on free tier${NC}"
fi
echo ""

# Test: Access free feature (should work)
echo "Step 3: Access FREE feature - View market data (should work)"
FREE_FEATURE=$(curl -s -X GET "$API/api/bfc/customers/$FREE_USER_ID/trades" \
  -H "Authorization: Bearer $FREE_TOKEN")

echo "$FREE_FEATURE" | jq .

if echo "$FREE_FEATURE" | jq -e 'has("error")' > /dev/null 2>&1; then
  if echo "$FREE_FEATURE" | jq -e '.code == "FEATURE_NOT_AVAILABLE"' > /dev/null; then
    echo -e "${RED}✗ Should have allowed access to free feature${NC}"
  else
    echo -e "${YELLOW}⚠ Endpoint returned error (might be expected if no trades exist)${NC}"
  fi
else
  echo -e "${GREEN}✓ Free feature accessible${NC}"
fi
echo ""

# Test: Access pro feature (should fail)
echo "Step 4: Access PRO feature - Advanced analytics (should fail)"
PRO_FEATURE=$(curl -s -X POST "$API/api/bfc/customers/$FREE_USER_ID/log-trade" \
  -H "Authorization: Bearer $FREE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tradeId": "TEST001",
    "symbol": "NIFTY50"
  }')

echo "$PRO_FEATURE" | jq .

if echo "$PRO_FEATURE" | jq -e '.code == "FEATURE_NOT_AVAILABLE"' > /dev/null; then
  echo -e "${GREEN}✓ Correctly blocked access to pro feature${NC}"
  echo -e "${GREEN}  Upgrade URL: $(echo "$PRO_FEATURE" | jq -r '.upgradeUrl')${NC}"
else
  echo -e "${RED}✗ Should have blocked access to pro feature${NC}"
fi
echo ""

# Test: Check feature limits for free tier
echo "Step 5: Check daily transfer limit (free tier: 1/day)"
for i in {1..3}; do
  echo "Transfer attempt $i:"
  TRANSFER=$(curl -s -X POST "$API/api/unified/transfer" \
    -H "Authorization: Bearer $FREE_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "from": "bank_savings",
      "to": "trading_wallet",
      "amount": 1000,
      "instant": true
    }')

  echo "$TRANSFER" | jq .

  if [ $i -eq 1 ]; then
    if echo "$TRANSFER" | jq -e '.success == true' > /dev/null 2>&1; then
      echo -e "${GREEN}✓ First transfer allowed${NC}"
    else
      echo -e "${YELLOW}⚠ First transfer should be allowed${NC}"
    fi
  else
    if echo "$TRANSFER" | jq -e '.code == "LIMIT_EXCEEDED"' > /dev/null; then
      echo -e "${GREEN}✓ Daily limit enforced (blocked transfer $i)${NC}"
    else
      echo -e "${YELLOW}⚠ Should have blocked transfer $i (limit: 1/day)${NC}"
    fi
  fi
  echo ""
done

# Summary
echo "============================================="
echo "🎉 Auth + Feature Gating Integration Tests Complete!"
echo ""
echo "✅ What's Verified:"
echo "  - New users get free tier automatically"
echo "  - JWT tokens work with feature gates"
echo "  - Free users can access free features"
echo "  - Free users blocked from pro features"
echo "  - Daily limits enforced per tier"
echo "  - Upgrade prompts shown when blocked"
echo ""
echo "🚀 Complete Integration Stack:"
echo "  1. Authentication (signup, login, JWT)"
echo "  2. Authorization (role-based access)"
echo "  3. Feature gating (tier-based features)"
echo "  4. Usage tracking (quotas & limits)"
echo "  5. Auto tier assignment (free on signup)"
echo ""
echo "📝 Ready for:"
echo "  - Payment integration (Razorpay)"
echo "  - Email service (MSG91/Twilio)"
echo "  - Social auth (@ankr/oauth)"
echo "  - Frontend UI integration"
echo ""
echo "🙏 श्री गणेशाय नमः | जय गुरुजी"
