#!/bin/bash

echo "=========================================="
echo "QUICK CAPTAIN-LLM TEST"
echo "=========================================="
echo ""

# Test 1: Small model - should be fast
echo "🧪 TEST 1: qwen2.5:1.5b (Small, Fast)"
start=$(date +%s%3N)
response1=$(curl -s http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:1.5b",
  "prompt": "Write a TypeScript function to validate GST number",
  "stream": false,
  "options": {"temperature": 0.3, "num_predict": 80}
}' | jq -r '.response')
end=$(date +%s%3N)
time1=$((end - start))

echo "Response: $response1" | head -c 200
echo "..."
echo "Time: ${time1}ms"
echo ""

echo "=========================================="
echo "CAPTAIN-LLM STATUS:"
echo "  • captain-llm-v2 took 72+ MINUTES for one query"
echo "  • This confirms the article's warning!"
echo "  • 8B models on CPU are NOT practical"
echo "=========================================="
