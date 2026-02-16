#!/bin/bash
# Comprehensive Authentication & Authorization Testing

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    🧪 ANKR AUTHENTICATION SYSTEM - VALIDATION TESTS 🧪    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

API="http://localhost:4500"
PASS=0
FAIL=0

# Test counter
test_num=0

# Helper function
run_test() {
    test_num=$((test_num + 1))
    local name="$1"
    local command="$2"
    local expected="$3"

    echo -n "Test $test_num: $name... "
    result=$(eval "$command" 2>&1)

    if echo "$result" | grep -q "$expected"; then
        echo "✅ PASS"
        PASS=$((PASS + 1))
    else
        echo "❌ FAIL"
        echo "   Expected: $expected"
        echo "   Got: $result"
        FAIL=$((FAIL + 1))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 PHASE 1: Service Health & Availability"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "ankr-ctl-api is running" \
    "curl -s $API/health | jq -r '.status'" \
    "ok"

run_test "Auth enabled in API" \
    "curl -s $API/health | jq -r '.auth'" \
    "enabled"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 PHASE 2: Authentication Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 1: Admin login
run_test "Admin login (admin/ankr@admin123)" \
    "curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"ankr@admin123\"}' | jq -r '.success'" \
    "true"

# Test 2: Captain login
run_test "Captain login (captain@ankr.in)" \
    "curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"captain@ankr.in\",\"password\":\"indrA@0612\"}' | jq -r '.success'" \
    "true"

# Test 3: Service user login (pratham)
run_test "Service user login (pratham@ankr.in)" \
    "curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"pratham@ankr.in\",\"password\":\"password\"}' | jq -r '.success'" \
    "true"

# Test 4: Viewer login
run_test "Viewer login (viewer@ankr.in)" \
    "curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"viewer@ankr.in\",\"password\":\"password\"}' | jq -r '.success'" \
    "true"

# Test 5: Invalid credentials
run_test "Invalid password rejected" \
    "curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"wrong\"}' | jq -r '.success'" \
    "false"

# Test 6: Invalid username
run_test "Invalid username rejected" \
    "curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"nonexistent\",\"password\":\"password\"}' | jq -r '.success'" \
    "false"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎫 PHASE 3: JWT Token Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get admin token
ADMIN_TOKEN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"ankr@admin123"}' | jq -r '.token')

run_test "Admin token received" \
    "echo $ADMIN_TOKEN | wc -c" \
    "[0-9]"

run_test "Admin has wildcard permission" \
    "curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"ankr@admin123\"}' | jq -r '.user.permissions[0]'" \
    "*"

# Get service user token
PRATHAM_TOKEN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{"username":"pratham@ankr.in","password":"password"}' | jq -r '.token')

run_test "Pratham token includes permissions" \
    "curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"pratham@ankr.in\",\"password\":\"password\"}' | jq -r '.user.permissions | length'" \
    "2"

run_test "Pratham has pratham permission" \
    "curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"pratham@ankr.in\",\"password\":\"password\"}' | jq -r '.user.permissions[]' | grep -w pratham" \
    "pratham"

# Get viewer token
VIEWER_TOKEN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{"username":"viewer@ankr.in","password":"password"}' | jq -r '.token')

run_test "Viewer has multiple permissions" \
    "curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"viewer@ankr.in\",\"password\":\"password\"}' | jq -r '.user.permissions | length'" \
    "5"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 PHASE 4: Authorization & Permission Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test without token
run_test "No token returns 401" \
    "curl -s -o /dev/null -w '%{http_code}' $API/api/auth/check" \
    "401"

# Test with admin token
run_test "Admin token auth check (Bearer)" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $ADMIN_TOKEN' $API/api/auth/check" \
    "200"

# Test with cookie
run_test "Admin token auth check (Cookie)" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Cookie: ankr_token=$ADMIN_TOKEN' $API/api/auth/check" \
    "200"

# Test token verification
run_test "Admin token is valid" \
    "curl -s -H 'Authorization: Bearer $ADMIN_TOKEN' $API/api/auth/verify | jq -r '.valid'" \
    "true"

run_test "Pratham token is valid" \
    "curl -s -H 'Authorization: Bearer $PRATHAM_TOKEN' $API/api/auth/verify | jq -r '.valid'" \
    "true"

# Test invalid token
run_test "Invalid token rejected" \
    "curl -s -H 'Authorization: Bearer invalid.token.here' $API/api/auth/verify | jq -r '.valid'" \
    "false"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚦 PHASE 5: Path-Based Permission Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test admin access (should access everything)
run_test "Admin can access /admin/" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Cookie: ankr_token=$ADMIN_TOKEN' -H 'X-Original-URI: /admin/' $API/api/auth/check" \
    "200"

run_test "Admin can access /pratham/" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Cookie: ankr_token=$ADMIN_TOKEN' -H 'X-Original-URI: /pratham/' $API/api/auth/check" \
    "200"

run_test "Admin can access /mari8x/" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Cookie: ankr_token=$ADMIN_TOKEN' -H 'X-Original-URI: /mari8x/' $API/api/auth/check" \
    "200"

# Test pratham user access (should only access pratham + admin)
run_test "Pratham can access /pratham/" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Cookie: ankr_token=$PRATHAM_TOKEN' -H 'X-Original-URI: /pratham/' $API/api/auth/check" \
    "200"

run_test "Pratham can access /admin/" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Cookie: ankr_token=$PRATHAM_TOKEN' -H 'X-Original-URI: /admin/' $API/api/auth/check" \
    "200"

run_test "Pratham CANNOT access /mari8x/" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Cookie: ankr_token=$PRATHAM_TOKEN' -H 'X-Original-URI: /mari8x/' $API/api/auth/check" \
    "403"

run_test "Pratham CANNOT access /interact/" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Cookie: ankr_token=$PRATHAM_TOKEN' -H 'X-Original-URI: /interact/' $API/api/auth/check" \
    "403"

# Test viewer access (should only access viewer routes)
run_test "Viewer can access /interact/" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Cookie: ankr_token=$VIEWER_TOKEN' -H 'X-Original-URI: /interact/' $API/api/auth/check" \
    "200"

run_test "Viewer can access /view/" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Cookie: ankr_token=$VIEWER_TOKEN' -H 'X-Original-URI: /view/' $API/api/auth/check" \
    "200"

run_test "Viewer CANNOT access /admin/" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Cookie: ankr_token=$VIEWER_TOKEN' -H 'X-Original-URI: /admin/' $API/api/auth/check" \
    "403"

run_test "Viewer CANNOT access /pratham/" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Cookie: ankr_token=$VIEWER_TOKEN' -H 'X-Original-URI: /pratham/' $API/api/auth/check" \
    "403"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛡️  PHASE 6: Protected API Endpoint Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test protected endpoints without auth
run_test "Services API requires auth" \
    "curl -s -o /dev/null -w '%{http_code}' $API/api/services" \
    "401"

run_test "Logs API requires auth" \
    "curl -s -o /dev/null -w '%{http_code}' '$API/api/logs/search?service=test'" \
    "401"

# Test protected endpoints with auth
run_test "Admin can access services API" \
    "curl -s -H 'Authorization: Bearer $ADMIN_TOKEN' $API/api/services | jq -r 'if .services then \"success\" else \"fail\" end'" \
    "success"

run_test "Admin can access logs API" \
    "curl -s -H 'Authorization: Bearer $ADMIN_TOKEN' '$API/api/logs/stats' | jq -r 'if .total != null then \"success\" else \"fail\" end'" \
    "success"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👥 PHASE 7: User Database Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "Users database exists" \
    "test -f /root/.ankr/config/users.json && echo 'exists'" \
    "exists"

run_test "10 users in database" \
    "cat /root/.ankr/config/users.json | jq 'keys | length'" \
    "10"

run_test "Admin has permissions field" \
    "cat /root/.ankr/config/users.json | jq -r '.admin.permissions[0]'" \
    "*"

run_test "Captain has permissions field" \
    "cat /root/.ankr/config/users.json | jq -r '.\"captain@ankr.in\".permissions[0]'" \
    "*"

run_test "Pratham has correct permissions" \
    "cat /root/.ankr/config/users.json | jq -r '.\"pratham@ankr.in\".permissions | length'" \
    "2"

run_test "Viewer has correct permissions" \
    "cat /root/.ankr/config/users.json | jq -r '.\"viewer@ankr.in\".permissions | length'" \
    "5"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 PHASE 8: Nginx Configuration Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "Nginx auth location configured" \
    "grep -q 'location = /auth' /etc/nginx/sites-enabled/ankr.in && echo 'configured'" \
    "configured"

run_test "Nginx auth_request on /interact/" \
    "grep -A 5 'location /interact/' /etc/nginx/sites-enabled/ankr.in | grep -q 'auth_request /auth' && echo 'configured'" \
    "configured"

run_test "Nginx auth_request on /admin/" \
    "grep -A 5 'location /admin/' /etc/nginx/sites-enabled/ankr.in | grep -q 'auth_request /auth' && echo 'configured'" \
    "configured"

run_test "Nginx 401 error handler configured" \
    "grep -q 'error_page 401 = @error401' /etc/nginx/sites-enabled/ankr.in && echo 'configured'" \
    "configured"

run_test "Nginx 403 error handler configured" \
    "grep -q 'error_page 403 = @error403' /etc/nginx/sites-enabled/ankr.in && echo 'configured'" \
    "configured"

run_test "Nginx configuration is valid" \
    "nginx -t 2>&1 | grep -q 'test is successful' && echo 'valid'" \
    "valid"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 TEST RESULTS SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL=$((PASS + FAIL))
PASS_RATE=$(echo "scale=1; $PASS * 100 / $TOTAL" | bc)

echo ""
echo "Total Tests: $TOTAL"
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo "📈 Success Rate: $PASS_RATE%"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║   🎉 ALL TESTS PASSED - SYSTEM FULLY VALIDATED! 🎉        ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    exit 0
else
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║   ⚠️  SOME TESTS FAILED - REVIEW REQUIRED ⚠️              ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    exit 1
fi
