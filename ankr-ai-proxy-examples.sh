#!/bin/bash

# ANKR AI Proxy - GraphQL Examples
# Usage: ./ankr-ai-proxy-examples.sh [example_number]
# Examples showcase common ANKR development tasks

API_URL="http://localhost:4444/graphql"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

run_example() {
  local num=$1
  local title=$2
  local query=$3

  echo ""
  echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}Example $num: $title${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
  echo ""

  echo -e "${YELLOW}Query:${NC}"
  echo "$query" | jq -r '.query' 2>/dev/null || echo "$query"
  echo ""

  echo -e "${YELLOW}Response:${NC}"
  start=$(date +%s%3N)

  response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "$query")

  end=$(date +%s%3N)
  latency=$((end - start))

  echo "$response" | jq .

  echo ""
  echo -e "${GREEN}⏱️  Request took: ${latency}ms${NC}"
  echo ""

  # Extract and show just the generated code
  content=$(echo "$response" | jq -r '.data.complete.content' 2>/dev/null)
  if [ "$content" != "null" ] && [ -n "$content" ]; then
    echo -e "${YELLOW}Generated Code:${NC}"
    echo "$content"
  fi

  echo ""
  read -p "Press Enter to continue..."
}

# Example 1: Prisma Model
example_1() {
  run_example 1 "Prisma Model - Invoice with GST" '{
    "query": "mutation { complete(input: { prompt: \"Create a Prisma model for Invoice with these fields: invoiceNumber (unique), customerId, shipmentId, subtotal, gstAmount (18%), totalAmount, status (enum: DRAFT, SENT, PAID, OVERDUE), dueDate, paidAt. Include relations to Customer and Shipment models.\" }) { content provider model latencyMs cost } }"
  }'
}

# Example 2: Fastify Endpoint
example_2() {
  run_example 2 "Fastify + GraphQL Endpoint - Shipment Tracking" '{
    "query": "mutation { complete(input: { prompt: \"Create a Fastify GraphQL resolver for shipment tracking. Query: getShipment(id: ID!). Returns: Shipment with fields id, trackingNumber, status, origin, destination, currentLocation, estimatedDelivery, events (array of tracking events). Include Prisma client usage.\" }) { content provider model latencyMs cost } }"
  }'
}

# Example 3: React Component with Shadcn
example_3() {
  run_example 3 "React Component - Shipment Status Badge" '{
    "query": "mutation { complete(input: { prompt: \"Create a React component called ShipmentStatusBadge that takes a status prop (PENDING, IN_TRANSIT, DELIVERED, CANCELLED) and displays it using Shadcn UI Badge component with appropriate colors: yellow for PENDING, blue for IN_TRANSIT, green for DELIVERED, red for CANCELLED. Use TypeScript.\" }) { content provider model latencyMs cost } }"
  }'
}

# Example 4: TypeScript Type Definitions
example_4() {
  run_example 4 "TypeScript Types - Logistics Domain" '{
    "query": "mutation { complete(input: { prompt: \"Create TypeScript type definitions for a TMS system: Shipment, Customer, Vendor, Vehicle, Driver. Include proper relationships, enums for status, vehicle types, and Indian-specific fields like GST number, PAN, Aadhaar.\" }) { content provider model latencyMs cost } }"
  }'
}

# Example 5: GST Calculation Function
example_5() {
  run_example 5 "GST Calculation - Indian Tax Rates" '{
    "query": "mutation { complete(input: { prompt: \"Create a TypeScript function calculateGST that takes amount and gstRate (5, 12, 18, 28) and returns an object with: baseAmount, cgst, sgst, igst (for interstate), totalAmount. Include validation and examples for both intrastate and interstate transactions.\" }) { content provider model latencyMs cost } }"
  }'
}

# Example 6: Hindi/Hinglish Query
example_6() {
  run_example 6 "Hindi Query - Invoice Generation" '{
    "query": "mutation { complete(input: { prompt: \"Invoice generate karne ka TypeScript function banao jo customer details, items array, aur GST calculate kare. Return PDF buffer using pdfkit library.\" }) { content provider model latencyMs cost } }"
  }'
}

# Example 7: E-way Bill Validation
example_7() {
  run_example 7 "E-way Bill Validation - Indian Compliance" '{
    "query": "mutation { complete(input: { prompt: \"Create a function to validate e-way bill requirements: check if shipment value > 50000, distance > 10km for intrastate or any distance for interstate. Return boolean and reason. Include TypeScript types.\" }) { content provider model latencyMs cost } }"
  }'
}

# Example 8: GraphQL Schema
example_8() {
  run_example 8 "GraphQL Schema - Shipment Module" '{
    "query": "mutation { complete(input: { prompt: \"Create a GraphQL schema for shipment management with: Shipment type, CreateShipmentInput, UpdateShipmentInput, ShipmentFilters. Include queries (getShipment, listShipments, searchShipments) and mutations (createShipment, updateShipment, cancelShipment). Add proper relations to Customer and Vehicle.\" }) { content provider model latencyMs cost } }"
  }'
}

# Example 9: Zod Validation Schema
example_9() {
  run_example 9 "Zod Schema - Form Validation" '{
    "query": "mutation { complete(input: { prompt: \"Create a Zod validation schema for customer registration form with: name (min 2 chars), email, phone (Indian format), gstNumber (optional, 15 chars), panNumber (optional, 10 chars), address (street, city, state, pincode). Include proper regex patterns and error messages.\" }) { content provider model latencyMs cost } }"
  }'
}

# Example 10: React Hook - useShipmentTracking
example_10() {
  run_example 10 "React Hook - Shipment Tracking with Apollo" '{
    "query": "mutation { complete(input: { prompt: \"Create a custom React hook useShipmentTracking that takes a tracking number, uses Apollo Client to query shipment status, polls every 30 seconds when status is IN_TRANSIT, and returns { shipment, loading, error, refetch }. Include TypeScript types.\" }) { content provider model latencyMs cost } }"
  }'
}

# Example 11: Database Migration
example_11() {
  run_example 11 "Prisma Migration - Add GST Fields" '{
    "query": "mutation { complete(input: { prompt: \"Create a Prisma migration SQL to add GST-related fields to existing invoices table: gstNumber varchar(15), cgstAmount decimal, sgstAmount decimal, igstAmount decimal, placeOfSupply varchar(50), gstRate decimal. Make them nullable for backward compatibility.\" }) { content provider model latencyMs cost } }"
  }'
}

# Example 12: Error Handling Utility
example_12() {
  run_example 12 "Error Handler - Fastify Plugin" '{
    "query": "mutation { complete(input: { prompt: \"Create a Fastify error handler plugin that catches Prisma errors, validation errors, and API errors. Return proper HTTP status codes and formatted error responses with: statusCode, message, errorCode, details. Include logging with pino.\" }) { content provider model latencyMs cost } }"
  }'
}

# Example 13: Unit Test
example_13() {
  run_example 13 "Jest Test - GST Validation" '{
    "query": "mutation { complete(input: { prompt: \"Write Jest unit tests for validateGSTNumber function. Test cases: valid format, invalid length, invalid checksum, invalid state code, null/undefined input, lowercase input (should convert), whitespace handling. Use describe/it blocks.\" }) { content provider model latencyMs cost } }"
  }'
}

# Example 14: Complex Query with Context
example_14() {
  run_example 14 "Complex Query - Route Optimization" '{
    "query": "mutation { complete(input: { prompt: \"Create a function optimizeRoute that takes array of shipments (each with pickup and delivery locations) and returns optimized route using Google Maps Distance Matrix API. Consider: vehicle capacity, time windows, distance minimization. Return ordered array of stops with ETAs.\", temperature: 0.7, maxTokens: 1000 }) { content provider model latencyMs cost inputTokens outputTokens } }"
  }'
}

# Example 15: Webhook Handler
example_15() {
  run_example 15 "Webhook Handler - Shiprocket Integration" '{
    "query": "mutation { complete(input: { prompt: \"Create a Fastify POST endpoint /webhooks/shiprocket that receives tracking updates. Validate webhook signature, parse payload, update shipment status in database, emit event to event bus, send notification to customer. Include error handling and idempotency.\" }) { content provider model latencyMs cost } }"
  }'
}

# Menu
show_menu() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}        ANKR AI PROXY - GraphQL Examples Menu${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "  1. Prisma Model - Invoice with GST"
  echo "  2. Fastify + GraphQL Endpoint - Shipment Tracking"
  echo "  3. React Component - Shipment Status Badge (Shadcn)"
  echo "  4. TypeScript Types - Logistics Domain"
  echo "  5. GST Calculation - Indian Tax Rates"
  echo "  6. Hindi Query - Invoice Generation"
  echo "  7. E-way Bill Validation - Compliance"
  echo "  8. GraphQL Schema - Shipment Module"
  echo "  9. Zod Validation Schema - Form Validation"
  echo " 10. React Hook - useShipmentTracking (Apollo)"
  echo " 11. Prisma Migration - Add GST Fields"
  echo " 12. Error Handler - Fastify Plugin"
  echo " 13. Jest Test - GST Validation"
  echo " 14. Complex Query - Route Optimization"
  echo " 15. Webhook Handler - Shiprocket Integration"
  echo ""
  echo " 99. Run ALL examples"
  echo "  0. Exit"
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
}

# Main
if [ -n "$1" ]; then
  # Run specific example
  example_$1
else
  # Interactive menu
  while true; do
    show_menu
    read -p "Select example (0-15, 99 for all): " choice

    case $choice in
      0) echo "Goodbye!"; exit 0 ;;
      1) example_1 ;;
      2) example_2 ;;
      3) example_3 ;;
      4) example_4 ;;
      5) example_5 ;;
      6) example_6 ;;
      7) example_7 ;;
      8) example_8 ;;
      9) example_9 ;;
      10) example_10 ;;
      11) example_11 ;;
      12) example_12 ;;
      13) example_13 ;;
      14) example_14 ;;
      15) example_15 ;;
      99)
        for i in {1..15}; do
          example_$i
        done
        ;;
      *) echo "Invalid choice" ;;
    esac
  done
fi
