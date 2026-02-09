#!/bin/bash

echo "Testing FREE Embedding Providers"
echo "================================="
echo ""

# Test if providers respond
test_provider() {
  local name=$1
  local url=$2
  
  echo -n "Testing $name... "
  
  if curl -s -m 5 "$url" > /dev/null 2>&1; then
    echo "✅ Available"
  else
    echo "❌ Not responding"
  fi
}

test_provider "Nomic" "https://api-atlas.nomic.ai/v1/health"
test_provider "Jina" "https://api.jina.ai/v1/health"
test_provider "Cohere" "https://api.cohere.ai/v1/check-api-key"
test_provider "Together" "https://api.together.xyz/v1/models"

echo ""
echo "DeepSeek embeddings: ❌ NOT AVAILABLE (chat/code only)"
