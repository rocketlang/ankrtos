#!/bin/bash

# Cloudflare Cache Purge Script
# Usage: ./purge-cloudflare-cache.sh [domain]

# TODO: Add your Cloudflare credentials here
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-YOUR_API_TOKEN_HERE}"
CLOUDFLARE_ZONE_ID="${CLOUDFLARE_ZONE_ID:-YOUR_ZONE_ID_HERE}"

# If no domain specified, purge ankr.in
DOMAIN="${1:-ankr.in}"

echo "🧹 Purging Cloudflare cache for: $DOMAIN"
echo ""

if [[ "$CLOUDFLARE_API_TOKEN" == "YOUR_API_TOKEN_HERE" ]]; then
    echo "❌ ERROR: Cloudflare API token not set!"
    echo ""
    echo "Please set your credentials:"
    echo "  export CLOUDFLARE_API_TOKEN='your-token-here'"
    echo "  export CLOUDFLARE_ZONE_ID='your-zone-id-here'"
    echo ""
    echo "Or edit this script and add them directly."
    echo ""
    echo "📖 Get your API token from:"
    echo "   https://dash.cloudflare.com/profile/api-tokens"
    echo ""
    echo "📖 Get your Zone ID from:"
    echo "   https://dash.cloudflare.com/ → Select domain → Overview (right sidebar)"
    exit 1
fi

# Purge all cache for the zone
echo "Sending purge request to Cloudflare API..."
RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}')

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Cache purged successfully for $DOMAIN!"
    echo ""
    echo "🔄 Changes should be visible within 30 seconds."
    echo "💡 Try accessing with Ctrl+Shift+R to bypass browser cache."
else
    echo "❌ Failed to purge cache"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
fi
