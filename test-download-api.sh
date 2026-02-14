#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Vyomo Download API - Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE_URL="http://localhost:5000"

# Test 1: Health Check
echo "Test 1: Health Check"
curl -s $BASE_URL/health | jq .
echo ""

# Test 2: Valid Authentication
echo "Test 2: Valid Authentication (vyomo-demo)"
curl -s -X POST $BASE_URL/api/auth \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"vyomo-demo"}' | jq .
echo ""

# Test 3: Invalid API Key
echo "Test 3: Invalid API Key"
curl -s -X POST $BASE_URL/api/auth \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"invalid"}' | jq .
echo ""

# Test 4: Download without token
echo "Test 4: Download without Token (should fail)"
curl -s $BASE_URL/api/download/vyomo-blackbox | jq .
echo ""

# Test 5: Versions
echo "Test 5: API Versions"
curl -s $BASE_URL/api/versions | jq .
echo ""

# Test 6: One-liner script preview
echo "Test 6: One-liner Install Script (first 10 lines)"
curl -s $BASE_URL/install/vyomo-demo | head -10
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All endpoint tests complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
