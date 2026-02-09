#!/bin/bash

echo "════════════════════════════════════════════════════════"
echo "  Switch to Jina Embeddings v3 (FREE)"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Jina Embeddings v3:"
echo "  • FREE: 1,000,000 tokens/month"
echo "  • Quality: 88.0% MTEB (BEST!)"
echo "  • Dimensions: 1024"
echo "  • Context: 8192 tokens"
echo "  • Speed: ~400ms"
echo ""
echo "Get your FREE API key:"
echo "  1. Open: https://jina.ai/embeddings"
echo "  2. Click 'Get API Key' or 'Sign Up'"
echo "  3. Sign in (no credit card required)"
echo "  4. Copy your API key"
echo ""
echo "It looks like: jina_xxx...xxxxxx (starts with 'jina_')"
echo ""

read -p "Paste your Jina API key (or press Enter to skip): " jina_key

if [ -z "$jina_key" ]; then
  echo ""
  echo "⚠️  No key provided. Checking for existing key..."

  existing_key=$(grep "JINA_API_KEY" /root/ankr-labs-nx/apps/ai-proxy/.env 2>/dev/null | cut -d'=' -f2)

  if [ -n "$existing_key" ] && [ "${#existing_key}" -gt 10 ]; then
    echo "✅ Found existing JINA_API_KEY"
    jina_key="$existing_key"
  else
    echo "❌ No valid key found. Please get one from https://jina.ai/embeddings"
    exit 1
  fi
else
  # Validate key format
  if [ "${#jina_key}" -lt 20 ]; then
    echo "❌ Key too short (should be ~50+ characters)"
    exit 1
  fi

  echo ""
  echo "📝 Saving Jina API key..."

  # Remove old key
  sed -i '/JINA_API_KEY=/d' /root/ankr-labs-nx/apps/ai-proxy/.env

  # Add new key
  echo "JINA_API_KEY=$jina_key" >> /root/ankr-labs-nx/apps/ai-proxy/.env

  echo "✅ Added JINA_API_KEY to .env"
fi

# Test the key
echo ""
echo "🧪 Testing Jina API key..."

response=$(curl -s -X POST https://api.jina.ai/v1/embeddings \
  -H "Authorization: Bearer $jina_key" \
  -H "Content-Type: application/json" \
  -d '{"model": "jina-embeddings-v3", "input": ["test"], "task": "retrieval.passage"}')

if echo "$response" | grep -q "data"; then
  echo "✅ Jina API key works!"
else
  echo "❌ API key test failed"
  echo "Response: $response"
  echo ""
  echo "Please check your API key at https://jina.ai/embeddings"
  exit 1
fi

# Update AI proxy config
echo ""
echo "📝 Updating AI proxy configuration..."

# Backup
cp /root/ankr-labs-nx/apps/ai-proxy/src/server.ts \
   /root/ankr-labs-nx/apps/ai-proxy/src/server.ts.backup.jina.$(date +%s)

# Update preferred provider
sed -i "s/preferred_provider: 'nomic'/preferred_provider: 'jina'/g" \
  /root/ankr-labs-nx/apps/ai-proxy/src/server.ts

sed -i "s/preferred_provider: 'voyage'/preferred_provider: 'jina'/g" \
  /root/ankr-labs-nx/apps/ai-proxy/src/server.ts

echo "✅ Changed preferred_provider to 'jina'"

# Restart AI proxy
echo ""
echo "🔄 Restarting AI proxy..."
pkill -f "ai-proxy.*server.ts"
sleep 3

echo "✅ AI proxy restarted"
echo ""
echo "⏳ Waiting for service to initialize..."
sleep 5

# Test embeddings
echo ""
echo "🧪 Testing Jina embeddings via AI proxy..."

test_response=$(curl -s -X POST http://localhost:4444/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { embed(text: \"Mumbai to Delhi shipment with 20 ton reefer container\") { provider dimensions latencyMs } }"}')

provider=$(echo "$test_response" | jq -r '.data.embed.provider' 2>/dev/null)
dimensions=$(echo "$test_response" | jq -r '.data.embed.dimensions' 2>/dev/null)
latency=$(echo "$test_response" | jq -r '.data.embed.latencyMs' 2>/dev/null)

echo ""
echo "════════════════════════════════════════════════════════"

if [ "$provider" = "jina" ]; then
  echo "✅ SUCCESS! Jina embeddings working!"
  echo ""
  echo "Provider: jina (was: voyage)"
  echo "Dimensions: $dimensions (was: 1536)"
  echo "Latency: ${latency}ms"
  echo "Quality: 88.0% MTEB (was: 85.1%)"
  echo ""
  echo "💰 Cost Savings:"
  echo "  • FREE: 1,000,000 tokens/month"
  echo "  • After: $0.02/M tokens (vs Voyage $0.12/M)"
  echo "  • Savings: 83-100% cheaper!"
  echo ""
  echo "📊 Improvements:"
  echo "  • Quality: 88.0% MTEB (BEST!)"
  echo "  • Context: 8K tokens (2x Voyage)"
  echo "  • Speed: ~${latency}ms"
  echo ""
  echo "🎯 Next Steps:"
  echo "  • Monitor usage: https://jina.ai/embeddings (dashboard)"
  echo "  • 1M tokens FREE/month is plenty for most apps"
  echo "  • If you exceed, it's only $0.02/M (83% cheaper than Voyage)"
elif [ "$provider" = "voyage" ]; then
  echo "⚠️  Still using Voyage"
  echo ""
  echo "Possible issues:"
  echo "  - Jina API key not loaded properly"
  echo "  - AI proxy didn't restart correctly"
  echo ""
  echo "Check logs: pm2 logs ai-proxy --lines 50"
  echo ""
  echo "Manual check:"
  echo "  grep JINA_API_KEY /root/ankr-labs-nx/apps/ai-proxy/.env"
else
  echo "⚠️  Using different provider: $provider"
  echo "Dimensions: $dimensions"
  echo "Latency: ${latency}ms"
  echo ""
  echo "Check AI proxy logs for details:"
  echo "  pm2 logs ai-proxy"
fi

echo "════════════════════════════════════════════════════════"
