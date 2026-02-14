#!/bin/bash
echo ""
echo "════════════════════════════════════════════════════════"
echo "  ComplyMitra - Quick Login Test"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Testing OTP generation for: demo@complymitra.in"
echo ""

# Send OTP
echo "📧 Sending OTP..."
RESPONSE=$(curl -s -X POST http://localhost:4001/email/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@complymitra.in"}')

echo "Response:"
echo "$RESPONSE" | jq '.'

# Extract OTP if in dev mode
OTP=$(echo "$RESPONSE" | jq -r '.devOtp // empty')

if [ ! -z "$OTP" ]; then
  echo ""
  echo "════════════════════════════════════════════════════════"
  echo "  ✅ OTP Generated Successfully!"
  echo "════════════════════════════════════════════════════════"
  echo ""
  echo "  Email: demo@complymitra.in"
  echo "  OTP:   $OTP"
  echo ""
  echo "Next Steps:"
  echo "1. Visit: https://app.complymitra.in"
  echo "2. Enter email: demo@complymitra.in"
  echo "3. Click 'Send OTP'"
  echo "4. Enter OTP: $OTP"
  echo "5. Click 'Verify & Sign In'"
  echo ""
  echo "════════════════════════════════════════════════════════"
else
  echo ""
  echo "⚠️  Note: OTP not in response (production mode?)"
  echo "Check backend logs: pm2 logs ankr-compliance-api"
fi

echo ""
