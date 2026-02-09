#!/bin/bash

echo "=========================================="
echo "ANKR LLM STACK OPTIMIZATION"
echo "=========================================="
echo ""

echo "📊 BEFORE:"
docker exec mari8x-ollama ollama list
echo ""

echo "🗑️  Step 1: Remove redundant models..."
docker exec mari8x-ollama ollama rm captain-llm 2>/dev/null && echo "  ✅ Removed captain-llm" || echo "  ⚠️  Already removed"
docker exec mari8x-ollama ollama rm llama3.1:8b 2>/dev/null && echo "  ✅ Removed llama3.1:8b" || echo "  ⚠️  Already removed"
docker exec mari8x-ollama ollama rm captain-llm-v2 2>/dev/null && echo "  ✅ Removed captain-llm-v2" || echo "  ⚠️  Already removed"
echo ""

echo "⬆️  Step 2: Upgrade embeddings to v2..."
docker exec mari8x-ollama ollama pull nomic-embed-text-v2
echo "  ✅ Pulled nomic-embed-text-v2"
docker exec mari8x-ollama ollama rm nomic-embed-text 2>/dev/null && echo "  ✅ Removed old nomic-embed-text v1" || true
echo ""

echo "🚀 Step 3: Add fast code model (optional)..."
docker exec mari8x-ollama ollama pull qwen2.5-coder:1.5b
echo "  ✅ Added qwen2.5-coder:1.5b (specialized for code)"
echo ""

echo "📊 AFTER:"
docker exec mari8x-ollama ollama list
echo ""

echo "=========================================="
echo "✅ OPTIMIZATION COMPLETE!"
echo ""
echo "Final Setup:"
echo "  • nomic-embed-text-v2 (embeddings, 0.3GB)"
echo "  • qwen2.5:1.5b (general, 1GB)"
echo "  • qwen2.5-coder:1.5b (code, 1GB)"
echo ""
echo "Total: ~2.3GB (saved 11.2GB!)"
echo ""
echo "Next Steps:"
echo "  1. Get free API keys:"
echo "     - https://platform.deepseek.com"
echo "     - https://console.groq.com/keys"
echo ""
echo "  2. Configure SLM Router:"
echo "     cd /root/ankr-labs-nx/packages/ankr-slm-router"
echo "     cp .env.example .env"
echo "     # Add your API keys to .env"
echo ""
echo "  3. Test:"
echo "     npx tsx src/clients/test-connectivity.ts"
echo "=========================================="
