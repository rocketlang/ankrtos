#!/bin/bash

echo "════════════════════════════════════════════════════════"
echo "  Set Nomic API Key (FREE Embeddings)"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Get your FREE API key:"
echo "  1. Open: https://atlas.nomic.ai"
echo "  2. Click 'Sign Up' or 'Get API Key'"
echo "  3. Sign in with GitHub/Google (no credit card!)"
echo "  4. Copy your API key"
echo ""
echo "It looks like: nk-xxx...xxxxxx (starts with 'nk-')"
echo ""

read -p "Paste your Nomic API key: " nomic_key

if [ -z "$nomic_key" ]; then
  echo "❌ No key provided"
  exit 1
fi

if [ "${#nomic_key}" -lt 20 ]; then
  echo "❌ Key too short (should be ~50+ characters)"
  exit 1
fi

# Update .env file
echo ""
echo "📝 Updating .env file..."

# Remove old key
sed -i '/NOMIC_API_KEY=/d' /root/ankr-labs-nx/apps/ai-proxy/.env

# Add new key
echo "NOMIC_API_KEY=$nomic_key" >> /root/ankr-labs-nx/apps/ai-proxy/.env

echo "✅ Added NOMIC_API_KEY"

# Test the key
echo ""
echo "🧪 Testing API key..."

response=$(curl -s -X POST https://api-atlas.nomic.ai/v1/embedding/text \
  -H "Authorization: Bearer $nomic_key" \
  -H "Content-Type: application/json" \
  -d '{"model": "nomic-embed-text-v1.5", "texts": ["test"]}')

if echo "$response" | grep -q "embeddings"; then
  echo "✅ API key works!"
else
  echo "❌ API key test failed"
  echo "Response: $response"
  exit 1
fi

# Restart AI proxy
echo ""
echo "🔄 Restarting AI proxy..."
pkill -f "ai-proxy.*server.ts"
sleep 3

echo "✅ AI proxy restarted"
echo ""
echo "⏳ Testing embeddings..."
sleep 5

# Test via AI proxy
test_response=$(curl -s -X POST http://localhost:4444/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { embed(text: \"Mumbai to Delhi shipment\") { provider dimensions latencyMs } }"}')

provider=$(echo "$test_response" | jq -r '.data.embed.provider' 2>/dev/null)
dimensions=$(echo "$test_response" | jq -r '.data.embed.dimensions' 2>/dev/null)

echo ""
echo "════════════════════════════════════════════════════════"

if [ "$provider" = "nomic" ] && [ "$dimensions" = "768" ]; then
  echo "✅ SUCCESS! Nomic embeddings working!"
  echo ""
  echo "Provider: nomic (was: voyage)"
  echo "Dimensions: 768 (was: 1536)"
  echo "Cost: $0/month (was: $120/month)"
  echo ""
  echo "💰 You're now saving $1,440/year!"
else
  echo "⚠️  Partial success"
  echo "Provider: $provider"
  echo "Dimensions: $dimensions"
  echo ""
  echo "Check logs: pm2 logs ai-proxy"
fi

echo "════════════════════════════════════════════════════════"
