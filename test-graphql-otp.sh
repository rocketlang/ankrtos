#!/bin/bash
echo ""
echo "════════════════════════════════════════════════════════"
echo "  ComplyMitra - GraphQL OTP Test"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Testing OTP via GraphQL for: demo@complymitra.in"
echo ""

# Send OTP via GraphQL
echo "📧 Sending OTP via GraphQL..."
RESPONSE=$(curl -s -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { sendEmailOTP(email: \"demo@complymitra.in\") { success message } }"
  }')

echo "GraphQL Response:"
echo "$RESPONSE" | jq '.'

echo ""
echo "════════════════════════════════════════════════════════"
echo "  📖 How to Get Your OTP"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Method 1: Browser Console (EASIEST)"
echo "  1. Open: https://app.complymitra.in"
echo "  2. Press F12 → Console tab"
echo "  3. Enter email: demo@complymitra.in"
echo "  4. Click 'Send OTP'"
echo "  5. Look in Console - the OTP will be there!"
echo ""
echo "Method 2: Backend Logs"
echo "  Run: pm2 logs ankr-compliance-api --lines 50"
echo "  The OTP will be logged when you request it"
echo ""
echo "Method 3: Check Network Tab"
echo "  1. F12 → Network tab"
echo "  2. Send OTP request"
echo "  3. Find the GraphQL request"
echo "  4. Click Preview → Look for 'devOtp'"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
