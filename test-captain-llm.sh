#!/bin/bash

# Captain LLM Comprehensive Test Suite
# Tests captain-llm-v2, captain-llm, and llama3.1:8b for comparison

echo "=========================================="
echo "CAPTAIN-LLM TEST SUITE"
echo "=========================================="
echo ""

# Test function
test_model() {
  local model=$1
  local prompt=$2
  local test_name=$3

  echo "📋 Test: $test_name"
  echo "🤖 Model: $model"
  echo "❓ Prompt: $prompt"
  echo ""

  start_time=$(date +%s%3N)

  response=$(curl -s http://localhost:11434/api/generate -d "{
    \"model\": \"$model\",
    \"prompt\": \"$prompt\",
    \"stream\": false,
    \"options\": {
      \"temperature\": 0.3,
      \"num_predict\": 300
    }
  }" | jq -r '.response')

  end_time=$(date +%s%3N)
  latency=$((end_time - start_time))

  echo "💬 Response:"
  echo "$response" | head -20
  echo ""
  echo "⏱️  Latency: ${latency}ms"
  echo "----------------------------------------"
  echo ""
}

# TEST 1: ANKR-Specific Pattern - Fastify Endpoint
echo "🧪 TEST 1: ANKR Fastify Pattern Recognition"
test_model "captain-llm-v2" \
  "Create a Fastify endpoint for shipment tracking with GraphQL" \
  "Fastify + GraphQL (ANKR Pattern)"

# TEST 2: Prisma Model Generation
echo "🧪 TEST 2: Prisma Model Generation"
test_model "captain-llm-v2" \
  "Create a Prisma model for Invoice with fields: invoiceNumber, amount, gstAmount, customerId, shipmentId" \
  "Prisma Schema (ANKR Domain)"

# TEST 3: React Component with Shadcn
echo "🧪 TEST 3: React Component (ANKR Stack)"
test_model "captain-llm-v2" \
  "Create a React component for displaying shipment status with Shadcn UI Badge component" \
  "React + Shadcn (ANKR UI Pattern)"

# TEST 4: Hindi/Hinglish Support
echo "🧪 TEST 4: Hindi/Hinglish Support"
test_model "captain-llm-v2" \
  "GST number validate karne ka TypeScript function banao jo 15 digit check kare" \
  "Hindi Code Generation"

# TEST 5: Tool Routing (ANKR Logistics)
echo "🧪 TEST 5: Logistics Tool Routing"
test_model "captain-llm-v2" \
  "User asks: Mumbai se Delhi truck chahiye 20 ton capacity. Which tool should be called and what parameters?" \
  "Logistics Query Routing"

# TEST 6: Compare with Base Model
echo "🧪 TEST 6: Base Model Comparison"
test_model "llama3.1:8b" \
  "Create a Fastify endpoint for shipment tracking with GraphQL" \
  "Same prompt on llama3.1:8b (baseline)"

# TEST 7: Captain-LLM v1 vs v2
echo "🧪 TEST 7: Captain-LLM v1"
test_model "captain-llm" \
  "Create a Prisma model for Invoice with fields: invoiceNumber, amount, gstAmount" \
  "Captain v1 (older version)"

# TEST 8: Complex Multi-step Reasoning
echo "🧪 TEST 8: Multi-step Reasoning"
test_model "captain-llm-v2" \
  "A shipment needs GST invoice, e-way bill, and pod upload. Write the workflow with proper error handling" \
  "Logistics Workflow Design"

echo "=========================================="
echo "✅ TEST SUITE COMPLETE"
echo "=========================================="
