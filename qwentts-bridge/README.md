# QwenTTS Bridge Service

FastAPI service that wraps ComfyUI-QwenTTS for easy integration with Bani.ai and SunoSunao.

## Features

- 🎙️ **Text-to-Speech** with 9 premium custom voices
- 🧬 **Voice Cloning** from 5-30 second audio samples
- 🎨 **Voice Design** from natural language descriptions
- 🌍 **10 Languages** (EN, ZH, JA, KO, DE, FR, RU, PT, ES, IT)
- 🎭 **Instruction-Based Control** (emotion, style, tone)
- 📚 **Voice Library Management** (save/load/delete voices)
- ⚡ **GPU Acceleration** (CUDA, Apple Silicon MPS, CPU fallback)

---

## Quick Start

### 1. Prerequisites

- Docker & Docker Compose
- NVIDIA GPU (recommended) or CPU
- 20GB disk space (for models)

### 2. Clone & Setup

```bash
# Clone this repository
git clone <repo-url> qwentts-bridge
cd qwentts-bridge

# Create data directories
mkdir -p data/voices data/models logs
```

### 3. Start Services

```bash
# Start ComfyUI + Bridge Service
docker-compose up -d

# Check logs
docker-compose logs -f qwentts-bridge

# Check health
curl http://localhost:8000/health
```

### 4. Test API

```bash
# Synthesize speech
curl -X POST http://localhost:8000/api/v1/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test message",
    "language": "en",
    "voice": "custom_1"
  }' | jq -r '.audio' | base64 -d > test.wav

# Play audio
ffplay test.wav
```

---

## API Documentation

### Base URL

```
http://localhost:8000
```

### Interactive Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Endpoints

### 1. Synthesize Speech

**POST** `/api/v1/synthesize`

```json
{
  "text": "Hello, how are you today?",
  "language": "en",
  "voice": "custom_1",
  "instruction": "speak in a warm, friendly tone",
  "model": "Qwen3-TTS-12Hz-1.7B-CustomVoice",
  "max_tokens": 1024,
  "temperature": 0.7,
  "do_sample": false
}
```

**Response:**

```json
{
  "audio": "<base64_encoded_wav>",
  "format": "wav",
  "sample_rate": 24000,
  "duration_ms": 3500,
  "voice_id": "custom_1",
  "model": "Qwen3-TTS-12Hz-1.7B-CustomVoice"
}
```

### 2. Clone Voice

**POST** `/api/v1/clone-voice`

```bash
curl -X POST http://localhost:8000/api/v1/clone-voice \
  -F "audio=@reference.wav" \
  -F "transcript=This is my voice speaking naturally" \
  -F "name=My Voice" \
  -F "language=en" \
  -F "save_to_library=true"
```

**Response:**

```json
{
  "voice_id": "voice_abc123",
  "name": "My Voice",
  "language": "en",
  "description": "Cloned from audio: reference.wav",
  "created_at": "2026-01-31T10:00:00Z",
  "embedding_path": "/data/voices/voice_abc123/embedding.npy"
}
```

### 3. Design Voice

**POST** `/api/v1/design-voice`

```json
{
  "description": "A warm, elderly male voice with a slight Hindi accent",
  "language": "en",
  "name": "Grandfather Voice",
  "save_to_library": true
}
```

### 4. List Voices

**GET** `/api/v1/voices`

**Response:**

```json
[
  {
    "voice_id": "voice_abc123",
    "name": "My Voice",
    "language": "en",
    "created_at": "2026-01-31T10:00:00Z"
  },
  ...
]
```

### 5. Delete Voice

**DELETE** `/api/v1/voices/{voice_id}`

**Response:**

```json
{
  "status": "deleted",
  "voice_id": "voice_abc123"
}
```

---

## Integration

### Bani.ai (TypeScript)

```typescript
import { QwenTTS } from './integrations/bani-qwen-tts.js';

// Initialize
const qwen = new QwenTTS({
  bridgeUrl: 'http://localhost:8000',
  defaultVoice: 'custom_1',
});

// Synthesize
const result = await qwen.synthesize(
  'Hello, how are you?',
  'en',
  'custom_1',
  { instruction: 'speak warmly' }
);

// Clone voice
const voiceInfo = await qwen.cloneVoice(
  audioBuffer,
  'This is my voice',
  'en',
  'Customer Voice'
);
```

### SunoSunao (Python)

```python
from integrations.sunosunao_qwen_tts import QwenTTS

# Initialize
qwen = QwenTTS(bridge_url="http://localhost:8000")

# Synthesize
audio = await qwen.synthesize(
    text="Happy birthday!",
    lang="en",
    voice="custom_1",
    instruction="speak with joy"
)

# Clone voice (memorial message use case)
voice_info = await qwen.clone_voice(
    audio_path="grandpa_recording.wav",
    transcript="This is grandpa speaking",
    name="Grandpa's Voice",
    language="en"
)

# Use cloned voice
audio = await qwen.synthesize(
    text="Happy birthday, my dear grandchild",
    lang="en",
    voice=voice_info.voice_id
)
```

---

## Configuration

### Environment Variables

```bash
# Bridge Service
VOICE_LIBRARY_PATH=/data/voices
MODEL_CACHE_PATH=/data/models
COMFYUI_URL=http://comfyui-qwentts:8188
PORT=8000
LOG_LEVEL=INFO

# GPU
CUDA_VISIBLE_DEVICES=0
```

### Models

Models are auto-downloaded to `MODEL_CACHE_PATH`:

- `Qwen3-TTS-12Hz-1.7B-CustomVoice` (1.7B params, 9 voices)
- `Qwen3-TTS-12Hz-0.6B-CustomVoice` (0.6B params, faster)
- `Qwen3-TTS-12Hz-1.7B-VoiceDesign` (voice design)
- `Qwen3-TTS-12Hz-1.7B-Base` (base model)
- `Qwen3-TTS-Tokenizer-12Hz` (tokenizer)

---

## Performance

### Latency (1.7B model, T4 GPU)

| Text Length | Latency |
|-------------|---------|
| 10 chars | ~500ms |
| 50 chars | ~1.2s |
| 100 chars | ~2.0s |
| 200 chars | ~3.5s |

### Throughput (Horizontal Scaling)

- Single instance: ~30 req/min
- 3 instances: ~90 req/min
- 10 instances: ~300 req/min

---

## Deployment

### Production Setup

1. **GPU Server**

```bash
# GCP
gcloud compute instances create qwentts-gpu \
  --zone=us-central1-a \
  --machine-type=n1-standard-4 \
  --accelerator=type=nvidia-tesla-t4,count=1 \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=100GB

# AWS
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type g4dn.xlarge \
  --block-device-mappings DeviceName=/dev/sda1,Ebs={VolumeSize=100}
```

2. **Install NVIDIA Drivers**

```bash
# Install Docker GPU support
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

3. **Deploy**

```bash
# Clone repo
git clone <repo-url> qwentts-bridge
cd qwentts-bridge

# Configure
cp .env.example .env
nano .env  # Edit configuration

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

4. **SSL/HTTPS (Optional)**

```bash
# Install Certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d qwentts.yourdomain.com

# Update nginx.conf with SSL paths
# Restart nginx
docker-compose restart nginx
```

---

## Monitoring

### Prometheus Metrics

- `http://localhost:9090` - Prometheus UI
- `http://localhost:3000` - Grafana dashboards

### Key Metrics

- `qwentts_requests_total` - Total requests
- `qwentts_request_duration_seconds` - Request latency
- `qwentts_active_voices` - Voices in library
- `qwentts_model_loading_duration` - Model load time

---

## Troubleshooting

### 1. ComfyUI not loading

```bash
# Check logs
docker-compose logs comfyui-qwentts

# Restart
docker-compose restart comfyui-qwentts
```

### 2. GPU not detected

```bash
# Check NVIDIA runtime
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi

# If fails, reinstall nvidia-docker2
```

### 3. Model download slow

```bash
# Pre-download models
huggingface-cli download Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice --local-dir ./models/
huggingface-cli download Qwen/Qwen3-TTS-Tokenizer-12Hz --local-dir ./models/
```

### 4. High memory usage

```bash
# Use smaller model
export MODEL=Qwen3-TTS-12Hz-0.6B-CustomVoice

# Reduce max_tokens
# Edit main.py: default max_tokens = 512
```

---

## Cost Analysis

### Self-Hosted (T4 GPU)

| Resource | Cost/Month | Notes |
|----------|-----------|-------|
| GCP n1-standard-4 + T4 | $235 | Preemptible: $85 |
| AWS g4dn.xlarge | $275 | Spot: $110 |
| Storage (500GB) | $40 | Models + voices |
| **Total** | **$275-315** | **Spot: $125-150** |

### vs. Cloud TTS APIs

| Service | Cost/1M chars |
|---------|---------------|
| Sarvam API | ₹500 (~$6) |
| Azure TTS | $15 |
| **QwenTTS (self-hosted)** | **~$0.30** |

**Break-even:** 50K requests/month

---

## Roadmap

- [ ] Streaming audio output (true chunked streaming)
- [ ] Voice emotion intensity control (0-100)
- [ ] Multi-speaker synthesis (conversations)
- [ ] Real-time voice conversion
- [ ] Fine-tuning API for custom voices
- [ ] WebRTC integration for live calls
- [ ] Voice analytics (emotion detection, quality scores)

---

## Support

- **Documentation:** [ComfyUI-QwenTTS](https://github.com/1038lab/ComfyUI-QwenTTS)
- **Issues:** GitHub Issues
- **Email:** capt.anil.sharma@powerpbox.org

---

## License

GPL-3.0 (following ComfyUI-QwenTTS license)

---

## Credits

- [Qwen3-TTS](https://huggingface.co/Qwen) by Alibaba Qwen Team
- [ComfyUI-QwenTTS](https://github.com/1038lab/ComfyUI-QwenTTS) by 1038lab
- [ANKR Labs](https://ankr.in) - Integration & deployment

---

**Built with ❤️ by ANKR Labs for Bani.ai & SunoSunao**
