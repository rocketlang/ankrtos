#!/bin/bash

# Mari8X Hybrid DMS Setup Script
# Sets up MinIO, Ollama, and Redis for cost-effective document management

set -e

echo "=========================================="
echo "Mari8X Hybrid DMS Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${BLUE}Step 1: Starting Docker services...${NC}"
docker-compose -f docker-compose.dms.yml up -d

echo ""
echo -e "${BLUE}Step 2: Waiting for services to be ready...${NC}"
sleep 10

# Check MinIO
echo -n "Checking MinIO... "
if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ (not responding)${NC}"
fi

# Check Ollama
echo -n "Checking Ollama... "
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ (not responding)${NC}"
fi

# Check Redis
echo -n "Checking Redis... "
if docker exec mari8x-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ (not responding)${NC}"
fi

echo ""
echo -e "${BLUE}Step 3: Pulling Ollama models (this may take a while)...${NC}"

# Pull embedding model
echo "Pulling nomic-embed-text (335MB)..."
docker exec mari8x-ollama ollama pull nomic-embed-text

# Pull LLM model
echo "Pulling qwen2.5:14b (9GB)..."
docker exec mari8x-ollama ollama pull qwen2.5:14b

echo ""
echo -e "${BLUE}Step 4: Installing backend dependencies...${NC}"
cd backend
npm install minio tesseract.js redis ioredis

echo ""
echo -e "${BLUE}Step 5: Copying environment file...${NC}"
if [ ! -f .env ]; then
    cp .env.hybrid .env
    echo -e "${GREEN}Created .env file${NC}"
    echo "Please review and update the .env file with your settings"
else
    echo -e "${BLUE}.env already exists, not overwriting${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Hybrid DMS Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Services running:"
echo "  • MinIO Console:  http://localhost:9001"
echo "  • MinIO API:      http://localhost:9000"
echo "  • Ollama API:     http://localhost:11434"
echo "  • Redis:          localhost:6379"
echo ""
echo "MinIO Credentials:"
echo "  Username: mari8x"
echo "  Password: mari8x_secure_2026"
echo ""
echo "Ollama Models installed:"
echo "  • nomic-embed-text (embeddings)"
echo "  • qwen2.5:14b (LLM)"
echo ""
echo "Next steps:"
echo "  1. Review backend/.env configuration"
echo "  2. Run: npm run dev (in backend/)"
echo "  3. Upload a document to test OCR + RAG"
echo ""
echo "To stop services:"
echo "  docker-compose -f docker-compose.dms.yml down"
echo ""
echo "Total monthly cost: ~$21 (Voyage AI + Groq for production)"
echo "Dev mode cost: $0 (using Ollama)"
echo ""
