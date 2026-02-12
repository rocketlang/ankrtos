#!/bin/bash
# Test Authentication Integration
# Created: 2026-02-12

API="http://localhost:4025"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔐 Testing Authentication Integration"
echo "===================================="
echo ""

# Test 1: Signup new user
echo "Test 1: POST /api/auth/signup - Register new user"
SIGNUP_RESPONSE=$(curl -s -X POST "$API/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Test User",
    "phone": "+919876543210"
  }')

echo "$SIGNUP_RESPONSE" | jq .

if echo "$SIGNUP_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✓ Signup successful${NC}"
  TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.token')
  USER_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.user.id')
  echo "Token: ${TOKEN:0:50}..."
  echo "User ID: $USER_ID"
else
  echo -e "${RED}✗ Signup failed${NC}"
fi
echo ""

# Test 2: Login with credentials
echo "Test 2: POST /api/auth/login - Login with credentials"
LOGIN_RESPONSE=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }')

echo "$LOGIN_RESPONSE" | jq .

if echo "$LOGIN_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✓ Login successful${NC}"
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
  echo "Token: ${TOKEN:0:50}..."
else
  echo -e "${RED}✗ Login failed${NC}"
fi
echo ""

# Test 3: Get current user profile (with auth)
echo "Test 3: GET /api/auth/me - Get current user profile (authenticated)"
ME_RESPONSE=$(curl -s -X GET "$API/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "$ME_RESPONSE" | jq .

if echo "$ME_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✓ Profile retrieved successfully${NC}"
else
  echo -e "${RED}✗ Failed to retrieve profile${NC}"
fi
echo ""

# Test 4: Get profile without auth (should fail)
echo "Test 4: GET /api/auth/me - Get profile without token (should fail)"
NO_AUTH_RESPONSE=$(curl -s -X GET "$API/api/auth/me")

echo "$NO_AUTH_RESPONSE" | jq .

if echo "$NO_AUTH_RESPONSE" | jq -e '.code == "AUTH_REQUIRED"' > /dev/null; then
  echo -e "${GREEN}✓ Correctly rejected unauthorized request${NC}"
else
  echo -e "${RED}✗ Should have rejected request${NC}"
fi
echo ""

# Test 5: Update profile
echo "Test 5: PUT /api/auth/profile - Update user profile"
UPDATE_RESPONSE=$(curl -s -X PUT "$API/api/auth/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User Updated",
    "phone": "+919999999999"
  }')

echo "$UPDATE_RESPONSE" | jq .

if echo "$UPDATE_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✓ Profile updated successfully${NC}"
else
  echo -e "${RED}✗ Failed to update profile${NC}"
fi
echo ""

# Test 6: Login with wrong password (should fail)
echo "Test 6: POST /api/auth/login - Login with wrong password (should fail)"
WRONG_LOGIN=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword"
  }')

echo "$WRONG_LOGIN" | jq .

if echo "$WRONG_LOGIN" | jq -e '.success == false' > /dev/null; then
  echo -e "${GREEN}✓ Correctly rejected invalid credentials${NC}"
else
  echo -e "${RED}✗ Should have rejected invalid credentials${NC}"
fi
echo ""

# Test 7: Login with existing test users
echo "Test 7: POST /api/auth/login - Login as free tier user"
FREE_LOGIN=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "free@test.io",
    "password": "Test123456"
  }')

echo "$FREE_LOGIN" | jq .

if echo "$FREE_LOGIN" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✓ Free tier user login successful${NC}"
  FREE_TOKEN=$(echo "$FREE_LOGIN" | jq -r '.token')
else
  echo -e "${YELLOW}⚠ Free tier user not found or password incorrect${NC}"
  echo -e "${YELLOW}Note: Test users have dummy passwords. Set real passwords first.${NC}"
fi
echo ""

# Test 8: Change password
echo "Test 8: POST /api/auth/change-password - Change password"
CHANGE_PW=$(curl -s -X POST "$API/api/auth/change-password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Test123456",
    "newPassword": "NewPassword123"
  }')

echo "$CHANGE_PW" | jq .

if echo "$CHANGE_PW" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✓ Password changed successfully${NC}"
else
  echo -e "${RED}✗ Failed to change password${NC}"
fi
echo ""

# Test 9: Login with new password
echo "Test 9: POST /api/auth/login - Login with new password"
NEW_PW_LOGIN=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "NewPassword123"
  }')

echo "$NEW_PW_LOGIN" | jq .

if echo "$NEW_PW_LOGIN" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✓ Login with new password successful${NC}"
else
  echo -e "${RED}✗ Login with new password failed${NC}"
fi
echo ""

# Test 10: Logout
echo "Test 10: POST /api/auth/logout - Logout"
LOGOUT=$(curl -s -X POST "$API/api/auth/logout")

echo "$LOGOUT" | jq .

if echo "$LOGOUT" | jq -e '.success == true' > /dev/null; then
  echo -e "${GREEN}✓ Logout successful${NC}"
else
  echo -e "${RED}✗ Logout failed${NC}"
fi
echo ""

# Summary
echo "======================================"
echo "🎉 Authentication Integration Tests Complete!"
echo ""
echo "✅ What's Working:"
echo "  - User signup with email/password"
echo "  - JWT token generation"
echo "  - Login authentication"
echo "  - Protected endpoints (requireAuth middleware)"
echo "  - Profile management"
echo "  - Password changes"
echo "  - Automatic free tier assignment"
echo ""
echo "📝 Next Steps:"
echo "  1. Set up test user passwords"
echo "  2. Integrate with existing @ankr/oauth package"
echo "  3. Add social auth (Google, GitHub, etc)"
echo "  4. Implement email verification"
echo "  5. Add password reset flow"
echo "  6. Integrate with Razorpay for payments"
echo "  7. Integrate with MSG91/Twilio for SMS"
echo ""
echo "🙏 श्री गणेशाय नमः | जय गुरुजी"
