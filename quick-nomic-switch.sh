#!/bin/bash

echo "════════════════════════════════════════════════════════"
echo "  Quick Nomic Switch (Config Only)"
echo "════════════════════════════════════════════════════════"
echo ""
echo "This will:"
echo "  1. Set up Nomic API key"
echo "  2. Update AI proxy config"
echo "  3. Restart service"
echo "  4. Test embeddings"
echo ""
echo "Database migration (1536→768) will be done separately"
echo "when PostgreSQL has available connections."
echo ""

# Check for Nomic key
if [ -z "$NOMIC_API_KEY" ]; then
  echo "Need Nomic API key (FREE from https://atlas.nomic.ai)"
  echo ""
  read -p "Enter Nomic API key (or press Enter to use existing): " nomic_key

  if [ -n "$nomic_key" ]; then
    export NOMIC_API_KEY="$nomic_key"
    echo "NOMIC_API_KEY=$nomic_key" >> /root/ankr-labs-nx/apps/ai-proxy/.env
    echo "✅ Added NOMIC_API_KEY"
  else
    echo "⚠️  Will try to use existing key from environment"
  fi
fi

echo ""
echo "📝 Updating AI proxy configuration..."

# Backup
cp /root/ankr-labs-nx/apps/ai-proxy/src/server.ts \
   /root/ankr-labs-nx/apps/ai-proxy/src/server.ts.backup.nomic

# Update preferred provider
sed -i "s/preferred_provider: 'voyage'/preferred_provider: 'nomic'/g" \
  /root/ankr-labs-nx/apps/ai-proxy/src/server.ts

echo "✅ Changed preferred_provider to 'nomic'"

echo ""
echo "🔄 Restarting AI proxy..."
pkill -f "ai-proxy.*server.ts"
sleep 3

echo "✅ AI proxy restarted"
echo ""
echo "⏳ Waiting for service to be ready..."
sleep 5

echo ""
echo "🧪 Testing Nomic embeddings..."

response=$(curl -s -X POST http://localhost:4444/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { embed(text: \"test Mumbai shipment with reefer container\") { provider dimensions latencyMs } }"}')

provider=$(echo "$response" | jq -r '.data.embed.provider' 2>/dev/null)
dimensions=$(echo "$response" | jq -r '.data.embed.dimensions' 2>/dev/null)
latency=$(echo "$response" | jq -r '.data.embed.latencyMs' 2>/dev/null)

echo ""
echo "════════════════════════════════════════════════════════"

if [ "$provider" = "nomic" ]; then
  echo "✅ SUCCESS! Nomic embeddings working!"
  echo ""
  echo "Provider: $provider (was: voyage)"
  echo "Dimensions: $dimensions"
  echo "Latency: ${latency}ms"
  echo ""
  echo "💰 Cost: $0/month (was: $120/month)"
  echo ""
  echo "⚠️  NOTE: You're using Nomic, but your database still has"
  echo "   Voyage-sized vectors (1536 dims vs Nomic's 768 dims)."
  echo ""
  echo "   Options:"
  echo "   1. Keep using Nomic (works fine, just uses more space)"
  echo "   2. Migrate database later when connections available:"
  echo "      /root/migrate-database-only.sh"
else
  echo "❌ Failed - Provider: $provider (expected: nomic)"
  echo ""
  echo "Response: $response"
  echo ""
  echo "Possible issues:"
  echo "  - NOMIC_API_KEY not set correctly"
  echo "  - AI proxy not restarted properly"
  echo ""
  echo "Check logs: pm2 logs ai-proxy"
fi

echo "════════════════════════════════════════════════════════"
