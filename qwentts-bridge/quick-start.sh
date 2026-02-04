#!/bin/bash
# QwenTTS Bridge - Quick Start Deployment Script
# Author: ANKR Labs

set -e

echo "🚀 QwenTTS Bridge - Quick Start"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker found${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose found${NC}"

# Check for NVIDIA GPU (optional)
if command -v nvidia-smi &> /dev/null; then
    echo -e "${GREEN}✅ NVIDIA GPU detected${NC}"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
    GPU_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  No NVIDIA GPU detected. Running in CPU mode (slower).${NC}"
    GPU_AVAILABLE=false
fi

echo ""

# Create directories
echo "📁 Creating directories..."
mkdir -p data/voices data/models logs
echo -e "${GREEN}✅ Directories created${NC}"

echo ""

# Download models (optional)
read -p "📥 Pre-download models now? (recommended, ~6GB) [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Downloading models via Hugging Face CLI..."

    if ! command -v huggingface-cli &> /dev/null; then
        echo "Installing huggingface-hub..."
        pip install -U "huggingface_hub[cli]"
    fi

    echo "Downloading Qwen3-TTS models to ./models/"
    huggingface-cli download Qwen/Qwen3-TTS-Tokenizer-12Hz --local-dir ./data/models/Qwen3-TTS-Tokenizer-12Hz
    huggingface-cli download Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice --local-dir ./data/models/Qwen3-TTS-12Hz-1.7B-CustomVoice

    echo -e "${GREEN}✅ Models downloaded${NC}"
else
    echo -e "${YELLOW}⚠️  Models will be downloaded on first use (may take time)${NC}"
fi

echo ""

# Configure docker-compose for CPU/GPU
if [ "$GPU_AVAILABLE" = false ]; then
    echo "🔧 Configuring for CPU mode..."
    # Create CPU-only docker-compose override
    cat > docker-compose.override.yml <<EOF
version: '3.8'

services:
  comfyui-qwentts:
    deploy:
      resources:
        reservations: {}

  qwentts-bridge:
    deploy:
      resources:
        reservations: {}
    environment:
      - CUDA_VISIBLE_DEVICES=-1
EOF
    echo -e "${GREEN}✅ CPU mode configured${NC}"
fi

echo ""

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
echo "🏥 Checking service health..."
for i in {1..30}; do
    if curl -sf http://localhost:8000/health > /dev/null; then
        echo -e "${GREEN}✅ QwenTTS Bridge is healthy!${NC}"
        break
    fi

    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Service health check failed after 30 attempts${NC}"
        echo "Check logs with: docker-compose logs qwentts-bridge"
        exit 1
    fi

    echo "Attempt $i/30... retrying in 2s"
    sleep 2
done

echo ""

# Test API
echo "🧪 Testing API..."
RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello from QwenTTS",
    "language": "en",
    "voice": "custom_1",
    "max_tokens": 512
  }')

if echo "$RESPONSE" | grep -q "audio"; then
    echo -e "${GREEN}✅ API test successful!${NC}"

    # Save test audio
    echo "$RESPONSE" | jq -r '.audio' | base64 -d > test.wav
    echo "📄 Test audio saved to: test.wav"
else
    echo -e "${RED}❌ API test failed${NC}"
    echo "Response: $RESPONSE"
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ QwenTTS Bridge is ready!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Service URLs:"
echo "   Bridge API:    http://localhost:8000"
echo "   API Docs:      http://localhost:8000/docs"
echo "   ComfyUI:       http://localhost:8188"
echo "   Health Check:  http://localhost:8000/health"
echo ""
echo "📚 Quick Commands:"
echo "   View logs:     docker-compose logs -f qwentts-bridge"
echo "   Stop services: docker-compose down"
echo "   Restart:       docker-compose restart"
echo ""
echo "📖 Documentation:"
echo "   README:        cat README.md"
echo "   Integration:   See integrations/ directory"
echo ""
echo "🧪 Test synthesis:"
echo "   curl -X POST http://localhost:8000/api/v1/synthesize \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"text\":\"Hello\",\"language\":\"en\",\"voice\":\"custom_1\"}' \\"
echo "     | jq -r '.audio' | base64 -d > output.wav"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
